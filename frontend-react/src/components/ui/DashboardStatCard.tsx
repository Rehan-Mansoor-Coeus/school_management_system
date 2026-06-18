import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export default function DashboardStatCard({
  label,
  value,
  to,
  onClick,
  icon: Icon,
  hint,
  className = '',
}: Props) {
  const baseClass =
    'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20';

  const content = (
    <>
      {Icon && (
        <div className="mb-2 flex items-center gap-2 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {(to || onClick) && (
        <p className="mt-2 text-xs font-medium text-[#1e3a5f]">{hint || 'View details →'}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClass} block ${className}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} w-full text-left ${className}`}>
        {content}
      </button>
    );
  }

  return <div className={`${baseClass} ${className}`}>{content}</div>;
}
