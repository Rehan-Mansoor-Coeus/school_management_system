import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import Modal from '../../../components/ui/Modal'
import { confirmPosPayment } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

function StripeForm({
  orderId,
  paymentIntentId,
  onSuccess,
  onError,
}: {
  orderId: number
  paymentIntentId?: string
  onSuccess: (order: unknown) => void
  onError: (msg: string) => void
}) {
  const { t } = useCanteenI18n()
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    try {
      const result = await stripe.confirmPayment({ elements, redirect: 'if_required' })
      if (result.error) {
        onError(result.error.message || t('stripeFailed'))
        return
      }

      const intentId = result.paymentIntent?.id || paymentIntentId
      const res = await confirmPosPayment(orderId, { payment_intent_id: intentId })
      onSuccess(res.data?.data?.order)
    } catch {
      onError(t('stripeFailed'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {processing ? t('loading') : t('payWithCard')}
      </button>
    </form>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  orderId: number
  orderNumber?: string
  amount?: number
  stripeData?: {
    public_key?: string | null
    client_secret?: string | null
    payment_intent_id?: string | null
  }
  onSuccess: (order: unknown) => void
}

export default function PosStripeModal({ open, onClose, orderId, orderNumber, amount, stripeData, onSuccess }: Props) {
  const { t } = useCanteenI18n()
  const [error, setError] = useState('')

  const stripePromise = stripeData?.public_key ? loadStripe(stripeData.public_key) : null

  return (
    <Modal title={t('payStripe')} open={open} onClose={onClose} footer={null}>
      <div className="space-y-3">
        {orderNumber && (
          <p className="text-sm text-slate-600">
            {t('orderNumber')} {orderNumber}
            {amount != null ? ` · ${Number(amount).toFixed(2)}` : ''}
          </p>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {stripePromise && stripeData?.client_secret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: stripeData.client_secret }}>
            <StripeForm
              orderId={orderId}
              paymentIntentId={stripeData.payment_intent_id || undefined}
              onSuccess={(order) => {
                setError('')
                onSuccess(order)
                onClose()
              }}
              onError={setError}
            />
          </Elements>
        ) : (
          <p className="text-sm text-slate-500">{t('stripeNotConfigured')}</p>
        )}
      </div>
    </Modal>
  )
}
