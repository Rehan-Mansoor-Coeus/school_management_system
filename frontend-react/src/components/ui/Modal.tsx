import React from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export default function Modal({ title, open, onClose, children, wide }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className={`flex max-h-[92vh] w-full flex-col ${wide ? 'max-w-5xl' : 'max-w-2xl'} overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">×</button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
