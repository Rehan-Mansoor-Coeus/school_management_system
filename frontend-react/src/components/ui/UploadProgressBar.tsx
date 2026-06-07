import React from 'react';

type UploadProgressBarProps = {
  progress: number;
  label?: string;
  className?: string;
};

export default function UploadProgressBar({ progress, label, className = '' }: UploadProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#1e3a5f] transition-all duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
