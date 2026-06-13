import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Clock,
  Coffee,
  Cookie,
  CreditCard,
  Minus,
  Moon,
  Plus,
  Smartphone,
  Trash2,
  Utensils,
  Wallet,
} from 'lucide-react'
import {
  confirmPosPayment,
  printCanteenReceipt,
  fetchPosMenu,
  formatCanteenError,
  lookupStudentMeal,
  posCheckout,
} from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import { useToast } from '../../../components/ui/ToastProvider'
import PosStripeModal from '../components/PosStripeModal'

type Meal = {
  id: number
  name: string
  name_fr?: string
  meal_type: string
  price: number | string
  description?: string
}

type CartLine = {
  meal: Meal
  quantity: number
}

type PaymentMethod = 'cash' | 'stripe' | 'campay' | 'pay_later' | 'credit' | 'deposit'

const mealIcons: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snack: Cookie,
}

const mealColors: Record<string, string> = {
  breakfast: 'from-amber-500 to-orange-600',
  lunch: 'from-emerald-500 to-teal-600',
  dinner: 'from-indigo-500 to-violet-600',
  snack: 'from-rose-400 to-pink-600',
}

const paymentOptions: { id: PaymentMethod; labelKey: string; icon: typeof Banknote; needsStudent?: boolean }[] = [
  { id: 'cash', labelKey: 'payCash', icon: Banknote },
  { id: 'stripe', labelKey: 'payStripe', icon: CreditCard },
  { id: 'campay', labelKey: 'payCampay', icon: Smartphone },
  { id: 'deposit', labelKey: 'payDeposit', icon: Wallet, needsStudent: true },
  { id: 'credit', labelKey: 'payCredit', icon: CreditCard, needsStudent: true },
  { id: 'pay_later', labelKey: 'payLater', icon: Clock, needsStudent: true },
]

export default function PosPage() {
  const { t } = useCanteenI18n()
  const { pushToast } = useToast()

  const [meals, setMeals] = useState<Meal[]>([])
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [studentCode, setStudentCode] = useState('')
  const [student, setStudent] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [campayPhone, setCampayPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [stripeOpen, setStripeOpen] = useState(false)
  const [campayPolling, setCampayPolling] = useState(false)

  useEffect(() => {
    fetchPosMenu()
      .then((res) => setMeals(res.data?.data?.meals || []))
      .catch(() => pushToast('Unable to load menu', 'error'))
  }, [pushToast])

  const categories = useMemo(() => {
    const types = Array.from(new Set(meals.map((m) => m.meal_type || 'lunch')))
    return ['all', ...types]
  }, [meals])

  const filteredMeals = useMemo(() => {
    if (category === 'all') return meals
    return meals.filter((m) => m.meal_type === category)
  }, [meals, category])

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.meal.price) * line.quantity, 0),
    [cart],
  )

  const addToCart = (meal: Meal) => {
    setCart((current) => {
      const existing = current.find((line) => line.meal.id === meal.id)
      if (existing) {
        return current.map((line) =>
          line.meal.id === meal.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [...current, { meal, quantity: 1 }]
    })
  }

  const updateQty = (mealId: number, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.meal.id === mealId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  const lookupStudent = async () => {
    if (!studentCode.trim()) {
      setStudent(null)
      return
    }
    setBusy(true)
    try {
      const res = await lookupStudentMeal(studentCode.trim())
      setStudent(res.data?.data)
    } catch (err) {
      setStudent(null)
      pushToast(formatCanteenError(err, 'Student not found'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const resetOrder = () => {
    setCart([])
    setStudent(null)
    setStudentCode('')
    setPendingOrder(null)
    setStripeOpen(false)
    setCampayPolling(false)
    setPaymentMethod('cash')
    setCampayPhone('')
  }

  const completeSale = async (order: any) => {
    pushToast(t('orderComplete'), 'success')
    if (order?.id && order?.status === 'completed') {
      try {
        await printCanteenReceipt(order.id)
      } catch (err) {
        pushToast(formatCanteenError(err, 'Unable to open print receipt'), 'error')
      }
    }
    resetOrder()
  }

  useEffect(() => {
    if (!campayPolling || !pendingOrder?.campay?.reference || !pendingOrder?.order?.id) return

    const interval = window.setInterval(async () => {
      try {
        const res = await confirmPosPayment(pendingOrder.order.id, {
          reference: pendingOrder.campay.reference,
        })
        window.clearInterval(interval)
        setCampayPolling(false)
        await completeSale(res.data?.data?.order)
      } catch {
        // keep polling until user cancels or payment completes
      }
    }, 4000)

    return () => window.clearInterval(interval)
  }, [campayPolling, pendingOrder])

  const checkout = async () => {
    if (cart.length === 0) {
      pushToast(t('cartEmpty'), 'error')
      return
    }

    const option = paymentOptions.find((o) => o.id === paymentMethod)
    if (option?.needsStudent && !student?.student?.id) {
      pushToast(t('student_required_for_payment') || 'Select a student for this payment method', 'error')
      return
    }

    setBusy(true)
    try {
      const res = await posCheckout({
        student_id: student?.student?.id ?? null,
        items: cart.map((line) => ({ meal_id: line.meal.id, quantity: line.quantity })),
        payment_method: paymentMethod,
        campay_phone: paymentMethod === 'campay' ? campayPhone : undefined,
      })

      const data = res.data?.data
      if (data?.completed) {
        await completeSale(data.order)
      } else if (paymentMethod === 'stripe' && data?.stripe?.client_secret) {
        setPendingOrder(data)
        setStripeOpen(true)
      } else if (paymentMethod === 'campay') {
        setPendingOrder(data)
        setCampayPolling(true)
        pushToast(t('orderPending'), 'info')
      } else {
        setPendingOrder(data)
        pushToast(t('orderPending'), 'info')
      }
    } catch (err) {
      pushToast(formatCanteenError(err, 'Checkout failed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmPending = async () => {
    if (!pendingOrder?.order?.id) return
    setBusy(true)
    try {
      const res = await confirmPosPayment(pendingOrder.order.id, {
        payment_intent_id: pendingOrder.stripe?.payment_intent_id,
        reference: pendingOrder.campay?.reference,
      })
      await completeSale(res.data?.data?.order)
    } catch (err) {
      pushToast(formatCanteenError(err, 'Payment not confirmed yet'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('pos')}</h2>
          <p className="text-sm text-slate-500">{t('posSubtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                category === cat
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? t('allCategories') : (t(cat) || cat)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredMeals.map((meal) => {
            const Icon = mealIcons[meal.meal_type] || Utensils
            const gradient = mealColors[meal.meal_type] || mealColors.lunch
            const inCart = cart.find((line) => line.meal.id === meal.id)?.quantity || 0

            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => addToCart(meal)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${gradient}`}>
                  <Icon className="h-10 w-10 text-white/90" />
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{meal.name}</h3>
                    {inCart > 0 && (
                      <span className="shrink-0 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-xs font-bold text-white">
                        {inCart}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {Number(meal.price).toFixed(2)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">{t('student')}</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder={t('scanOrEnter')}
              className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={lookupStudent}
              disabled={busy}
              className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
            >
              {t('lookup')}
            </button>
          </div>
          {student ? (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm">
              <p className="font-semibold text-emerald-900">{student.student.name}</p>
              <p className="text-emerald-800">{student.student.registration_number}</p>
              <p className="mt-1">
                {t('balance')}: <strong>{Number(student.wallet.balance).toFixed(2)}</strong>
                {' · '}
                {t('depositAvailable')}:{' '}
                <strong>{Number(student.wallet.deposit_balance ?? 0).toFixed(2)}</strong>
              </p>
              <p>
                {t('creditAvailable')}:{' '}
                <strong>{Number(student.wallet.credit_available ?? 0).toFixed(2)}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">{t('guestSale')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{t('cart')}</h3>
            {cart.length > 0 && (
              <button type="button" onClick={() => setCart([])} className="text-xs text-rose-600 hover:underline">
                {t('clearCart')}
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">{t('cartEmpty')}</p>
          ) : (
            <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {cart.map((line) => (
                <li key={line.meal.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.meal.name}</p>
                    <p className="text-xs text-slate-500">{Number(line.meal.price).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => updateQty(line.meal.id, -1)} className="rounded-lg p-1 hover:bg-slate-200">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                    <button type="button" onClick={() => updateQty(line.meal.id, 1)} className="rounded-lg p-1 hover:bg-slate-200">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => updateQty(line.meal.id, -999)} className="rounded-lg p-1 text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{t('subtotal')}</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>{t('total')}</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">{t('paymentMethod')}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {paymentOptions.map((option) => {
              const Icon = option.icon
              const disabled = option.needsStudent && !student?.student?.id
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPaymentMethod(option.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition ${
                    paymentMethod === option.id
                      ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  {t(option.labelKey)}
                </button>
              )
            })}
          </div>

          {paymentMethod === 'campay' && (
            <input
              value={campayPhone}
              onChange={(e) => setCampayPhone(e.target.value)}
              placeholder={t('campayPhone')}
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
            />
          )}

          <button
            type="button"
            disabled={busy || cart.length === 0}
            onClick={checkout}
            className="mt-4 w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? t('loading') : t('checkout')}
          </button>
        </div>

        {pendingOrder && paymentMethod === 'campay' && campayPolling && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">{t('orderPending')}</p>
            <p className="mt-1 text-sm text-amber-800">
              {t('orderNumber')} {pendingOrder.order?.order_number}
            </p>
            {pendingOrder.campay?.reference && (
              <p className="mt-2 text-xs text-amber-700">Campay: {pendingOrder.campay.reference}</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={confirmPending}
              className="mt-3 w-full rounded-xl bg-amber-700 py-2 text-sm font-semibold text-white"
            >
              {t('confirmPayment')}
            </button>
          </div>
        )}
      </div>
    </div>

    <PosStripeModal
      open={stripeOpen}
      onClose={() => setStripeOpen(false)}
      orderId={pendingOrder?.order?.id}
      orderNumber={pendingOrder?.order?.order_number}
      amount={pendingOrder?.order?.total}
      stripeData={pendingOrder?.stripe}
      onSuccess={completeSale}
    />
    </>
  )
}
