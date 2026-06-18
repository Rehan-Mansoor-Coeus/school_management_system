import React from 'react'

export default function PlaceholderModulePage({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-500">This module UI is not implemented yet.</p>
    </div>
  )
}

