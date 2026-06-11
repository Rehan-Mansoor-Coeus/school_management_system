export type ProgrammeAgreementInput = {
  title: string;
  content: string;
  is_required: boolean;
};

type Props = {
  agreement: ProgrammeAgreementInput;
  onChange: (agreement: ProgrammeAgreementInput) => void;
};

export default function ProgrammeAgreementEditor({ agreement, onChange }: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">Programme application agreement</h4>
        <p className="mt-1 text-xs text-slate-500">
          End-user agreement shown to applicants for this programme. Leave content empty to skip.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Agreement title</label>
        <input
          type="text"
          value={agreement.title}
          onChange={(event) => onChange({ ...agreement, title: event.target.value })}
          placeholder="Application terms and conditions"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Agreement content</label>
        <textarea
          value={agreement.content}
          onChange={(event) => onChange({ ...agreement, content: event.target.value })}
          rows={6}
          placeholder="Enter the agreement text applicants must accept..."
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={agreement.is_required}
          onChange={(event) => onChange({ ...agreement, is_required: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        Applicants must accept this agreement
      </label>
    </div>
  );
}
