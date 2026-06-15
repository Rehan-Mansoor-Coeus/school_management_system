import { Link } from 'react-router-dom'
import HrCrudResourcePage from '../components/HrCrudResourcePage'
import { createHrJob, fetchHrJobs, updateHrJob } from '../../../api/hr'

export default function HrJobsPage() {
  return (
    <div className="space-y-4">
      <HrCrudResourcePage
        title="Jobs"
        subtitle="Create payroll jobs and manage assignment windows."
        load={fetchHrJobs}
        create={createHrJob}
        update={updateHrJob}
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'client_name', label: 'Client' },
          { key: 'location', label: 'Location' },
          { key: 'start_date', label: 'Start Date', type: 'date' },
          { key: 'end_date', label: 'End Date', type: 'date' },
          { key: 'status', label: 'Status' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'client_name', label: 'Client' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status' },
        ]}
      />
      <p className="text-sm text-slate-500">
        Open a job detail with URL pattern <Link to="/hr/jobs/1" className="font-medium text-[#1e3a5f] underline">/hr/jobs/:id</Link>.
      </p>
    </div>
  )
}
