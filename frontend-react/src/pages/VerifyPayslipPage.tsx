import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatHrError, verifyHrPayslip } from '../api/hr'
import { useToast } from '../components/ui/ToastProvider'

export default function VerifyPayslipPage() {
  const { code } = useParams<{ code: string }>()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!code) return
      setLoading(true)
      try {
        setResult(await verifyHrPayslip(code))
      } catch (error) {
        pushToast(formatHrError(error, 'Unable to verify payslip code'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [code])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Payslip Verification</h1>
        <p className="mt-1 text-sm text-slate-500">Verification code: {code || '-'}</p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Verifying...</p>
        ) : result ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Status:</span> {result.valid ? 'Valid' : 'Invalid'}</p>
            <p><span className="font-semibold">Employee:</span> {String(result.employee_name || '-')}</p>
            <p><span className="font-semibold">Staff code:</span> {String(result.staff_code || '-')}</p>
            <p><span className="font-semibold">Position:</span> {String(result.position || '-')}</p>
            <p><span className="font-semibold">Payroll title:</span> {String(result.payroll_title || '-')}</p>
            <p><span className="font-semibold">Net amount:</span> {String(result.net_amount || '-')}</p>
            <p><span className="font-semibold">Generated at:</span> {String(result.generated_at || '-')}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No verification data found.</p>
        )}
      </div>
    </div>
  )
}
