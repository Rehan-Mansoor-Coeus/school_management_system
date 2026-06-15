import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrLetterTemplate, deleteHrLetterTemplate, fetchHrLetterTemplates, updateHrLetterTemplate } from '../../../api/hr'

export default function HrLettersPage() {
  return (
    <HrCrudResourcePage
      title="HR Letter Templates"
      subtitle="Manage leave, permission, employment, and attestation letter templates."
      load={fetchHrLetterTemplates}
      create={createHrLetterTemplate}
      update={updateHrLetterTemplate}
      remove={deleteHrLetterTemplate}
      fields={[
        { key: 'letter_type', label: 'Letter Type', required: true },
        { key: 'name', label: 'Template Name', required: true },
        { key: 'subject', label: 'Subject', required: true },
        { key: 'body', label: 'Body', type: 'textarea', required: true },
      ]}
      columns={[
        { key: 'letter_type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'subject', label: 'Subject' },
      ]}
    />
  )
}
