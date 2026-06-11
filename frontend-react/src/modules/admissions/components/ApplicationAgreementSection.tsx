import type { AdmissionAgreement } from '../types';

type Props = {
  agreements: AdmissionAgreement[];
  acceptedIds: number[];
  onToggle: (agreementId: number, accepted: boolean) => void;
};

export default function ApplicationAgreementSection({ agreements, acceptedIds, onToggle }: Props) {
  if (!agreements.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {agreements.map((agreement) => {
        const checked = acceptedIds.includes(agreement.id);

        return (
          <div key={agreement.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="font-medium text-slate-800">{agreement.title}</h4>
              {agreement.programme_id ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Programme</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">All programmes</span>
              )}
              {agreement.is_required && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Required</span>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
              {agreement.content}
            </div>
            <label className="mt-3 inline-flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onToggle(agreement.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>I have read and accept this agreement</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
