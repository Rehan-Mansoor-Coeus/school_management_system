import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrCategory, deleteHrCategory, fetchHrCategories, updateHrCategory } from '../../../api/hr'

export default function HrCategoriesPage() {
  return (
    <HrCrudResourcePage
      title="Staff Categories"
      subtitle="Maintain groups used in staff records and payroll processing."
      load={fetchHrCategories}
      create={createHrCategory}
      update={updateHrCategory}
      remove={deleteHrCategory}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
    />
  )
}
