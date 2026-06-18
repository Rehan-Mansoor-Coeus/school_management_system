import { useEffect, useState } from 'react';
import { fetchInstitutionAgreement, updateInstitutionAgreement } from '../../api/admissions';
import type { AdmissionAgreement } from '../../modules/admissions/types';

const emptyAgreement = {
  title: 'Application Agreement',
  content: '',
  is_required: true,
};

export default function InstitutionAgreementSection() {
  const [agreement, setAgreement] = useState(emptyAgreement);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInstitutionAgreement()
      .then((data: AdmissionAgreement | null) => {
        if (data?.content) {
          setAgreement({
            title: data.title || 'Application Agreement',
            content: data.content,
            is_required: data.is_required ?? true,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateInstitutionAgreement(agreement);
      setMessage('Institution-wide agreement saved.');
    } catch {
      setMessage('Unable to save institution agreement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Institution-wide application agreement</h3>
      <p className="mt-1 text-sm text-slate-500">
        Applies to all programmes unless a programme defines its own agreement.
      </p>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={agreement.title}
          onChange={(event) => setAgreement((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Agreement title"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
        <textarea
          value={agreement.content}
          onChange={(event) => setAgreement((prev) => ({ ...prev, content: event.target.value }))}
          rows={5}
          placeholder="Agreement text for all programmes..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={agreement.is_required}
            onChange={(event) => setAgreement((prev) => ({ ...prev, is_required: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Required for all applications
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save institution agreement'}
        </button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </div>
  );
}
