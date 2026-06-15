import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrStaff, fetchHrStaff, updateHrStaff } from '../../../api/hr'

export default function HrStaffPage() {
  return (
    <HrCrudResourcePage
      title="Staff"
      subtitle="Create and maintain staff payroll profiles."
      load={() => fetchHrStaff()}
      create={createHrStaff}
      update={updateHrStaff}
      fields={[
        { key: 'staff_code', label: 'Staff Code' },
        { key: 'first_name', label: 'First Name', required: true },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'category_id', label: 'Category ID', type: 'number', required: true },
        { key: 'position', label: 'Position' },
        { key: 'department', label: 'Department' },
        { key: 'payment_type', label: 'Payment Type' },
        { key: 'daily_rate', label: 'Daily Rate', type: 'number' },
      ]}
      columns={[
        { key: 'staff_code', label: 'Code' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'position', label: 'Position' },
        { key: 'payment_type', label: 'Payment' },
        { key: 'status', label: 'Status' },
      ]}
    />
  )
}
