import React from 'react'

export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
