import { Plus, Trash2 } from 'lucide-react';

export type ProgrammeRequiredDocumentInput = {
  id?: number;
  name: string;
  description?: string;
  is_required: boolean;
  sort_order: number;
};

type Props = {
  documents: ProgrammeRequiredDocumentInput[];
  onChange: (documents: ProgrammeRequiredDocumentInput[]) => void;
};

export default function ProgrammeRequiredDocumentsEditor({ documents, onChange }: Props) {
  const addRow = () => {
    const newRow = {
      name: '',
      description: '',
      is_required: true,
      sort_order: 0,
    };
    onChange([
      newRow,
      ...documents.map((row, rowIndex) => ({ ...row, sort_order: rowIndex + 1 })),
    ]);
  };

  const updateRow = (index: number, patch: Partial<ProgrammeRequiredDocumentInput>) => {
    onChange(documents.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(documents.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({
      ...row,
      sort_order: rowIndex,
    })));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Required application documents</h4>
          <p className="mt-1 text-xs text-slate-500">
            Applicants must upload these when applying for this programme. Mark each as mandatory or optional.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <Plus size={16} /> Add document
        </button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents configured yet.</p>
      ) : (
        documents.map((row, index) => (
          <div key={row.id ?? `doc-${row.sort_order}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600">Document name</label>
                <input
                  type="text"
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                  placeholder="e.g. Passport, Birth certificate"
                  required={documents.length > 0}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="mt-5 rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                aria-label="Remove document requirement"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600">Description (optional)</label>
              <input
                type="text"
                value={row.description || ''}
                onChange={(event) => updateRow(index, { description: event.target.value })}
                placeholder="Instructions for the applicant"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={row.is_required}
                onChange={(event) => updateRow(index, { is_required: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Mandatory document
            </label>
          </div>
        ))
      )}
    </div>
  );
}
