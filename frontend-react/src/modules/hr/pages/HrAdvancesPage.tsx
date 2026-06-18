import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrAdvance, fetchHrAdvances } from '../../../api/hr'

export default function HrAdvancesPage() {
  return (
    <HrCrudResourcePage
      title="Advance Payments"
      subtitle="Track advances by staff and recover through payroll deductions."
      load={fetchHrAdvances}
      create={createHrAdvance}
      fields={[
        { key: 'staff_profile_id', label: 'Staff Profile ID', required: true, type: 'number' },
        { key: 'job_id', label: 'Job ID', type: 'number' },
        { key: 'amount', label: 'Amount', required: true, type: 'number' },
        { key: 'paid_date', label: 'Paid Date', required: true, type: 'date' },
        { key: 'reason', label: 'Reason', type: 'textarea' },
      ]}
      columns={[
        { key: 'staff_profile_id', label: 'Staff ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'balance_remaining', label: 'Balance' },
        { key: 'paid_date', label: 'Paid Date' },
        { key: 'status', label: 'Status' },
      ]}
    />
  )
}
