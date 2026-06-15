import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrDeductionType, deleteHrDeductionType, fetchHrDeductionTypes, updateHrDeductionType } from '../../../api/hr'

export default function HrDeductionsPage() {
  return (
    <HrCrudResourcePage
      title="Deduction Types"
      subtitle="Configure deduction labels and defaults for payroll items."
      load={fetchHrDeductionTypes}
      create={createHrDeductionType}
      update={updateHrDeductionType}
      remove={deleteHrDeductionType}
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
