import DocumentsTable from '../components/DocumentsTable'

export function AllDocumentsPage() {
  return <DocumentsTable />
}

export function PendingSignaturesPage() {
  return <DocumentsTable baseFilters={{ pending_signatures: 1 }} showStatusFilter={false} emptyLabel="No documents awaiting signature." />
}

export function PendingApprovalsPage() {
  return <DocumentsTable baseFilters={{ pending_approval: 1 }} showStatusFilter={false} emptyLabel="No documents awaiting approval." />
}

export function CompletedDocumentsPage() {
  return <DocumentsTable baseFilters={{ completed: 1 }} showStatusFilter={false} emptyLabel="No completed documents yet." />
}

export function ExpiredDocumentsPage() {
  return <DocumentsTable baseFilters={{ expired: 1 }} showStatusFilter={false} emptyLabel="No expired documents." />
}
