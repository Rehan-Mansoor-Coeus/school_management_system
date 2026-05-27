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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} rounded-2xl bg-white shadow-xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
