import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import UploadProgressBar from '../../../components/ui/UploadProgressBar';

type ApplicationProgress = {
  percent: number;
  current_step: string;
  status: string;
  steps: Array<{ key: string; label_key: string; state: 'pending' | 'current' | 'completed' | 'rejected' }>;
};

type Props = {
  progress?: ApplicationProgress | null;
  compact?: boolean;
};

export type { ApplicationProgress };
export default function ApplicationProgressBar({ progress, compact = false }: Props) {
  const { t } = useAdmissionsI18n();

  if (!progress) {
    return null;
  }

  if (compact) {
    return (
      <div className="mt-3">
        <UploadProgressBar progress={progress.percent} label={t('applicationProgress')} />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{t('applicationStatus')}</h3>
        <span className="text-sm font-medium text-[#1e3a5f]">{progress.percent}%</span>
      </div>
      <UploadProgressBar progress={progress.percent} className="mb-5" />
      <ol className="space-y-2">
        {progress.steps.map((step) => {
          const stateClass =
            step.state === 'completed'
              ? 'border-green-200 bg-green-50 text-green-800'
              : step.state === 'current'
                ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]'
                : step.state === 'rejected'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-slate-50 text-slate-500';

          return (
            <li key={step.key} className={`rounded-lg border px-3 py-2 text-sm ${stateClass}`}>
              {t(step.label_key)}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
