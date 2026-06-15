import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrAllowanceType, deleteHrAllowanceType, fetchHrAllowanceTypes, updateHrAllowanceType } from '../../../api/hr'

export default function HrAllowancesPage() {
  return (
    <HrCrudResourcePage
      title="Allowance Types"
      subtitle="Configure allowance labels and defaults for payroll items."
      load={fetchHrAllowanceTypes}
      create={createHrAllowanceType}
      update={updateHrAllowanceType}
      remove={deleteHrAllowanceType}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code' },
        { key: 'default_amount', label: 'Default Amount', type: 'number' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'default_amount', label: 'Default Amount' },
      ]}
    />
  )
}
