import { Plus, Trash2, Upload } from 'lucide-react';
import UploadProgressBar from '../../../components/ui/UploadProgressBar';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

export type DocumentRow = {
  id: string;
  name: string;
  file?: File;
  progress?: number;
};

type Props = {
  rows: DocumentRow[];
  onChange: (rows: DocumentRow[]) => void;
  submitProgress?: number;
  submitting?: boolean;
};

export default function DocumentUploadList({ rows, onChange, submitProgress = 0, submitting = false }: Props) {
  const { t } = useAdmissionsI18n();

  const addRow = () => {
    onChange([...rows, { id: crypto.randomUUID(), name: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      onChange([{ id: crypto.randomUUID(), name: '' }]);
      return;
    }
    onChange(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, patch: Partial<DocumentRow>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{t('supportingDocuments')}</label>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus size={16} /> {t('addDocument')}
        </button>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
              placeholder={t('documentNamePlaceholder')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                aria-label={t('removeDocument')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id={`doc-${row.id}`}
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateRow(row.id, { file, progress: 0 });
              }}
            />
            <label htmlFor={`doc-${row.id}`} className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={22} className="text-gray-400" />
              <span className="text-sm text-gray-600">{row.file ? row.file.name : t('uploadHint')}</span>
            </label>
          </div>

          {submitting && row.file && (
            <div className="mt-3">
              <UploadProgressBar progress={submitProgress} label={row.file.name} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
