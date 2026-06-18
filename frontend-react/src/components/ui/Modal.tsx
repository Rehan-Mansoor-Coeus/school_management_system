import React, { useEffect } from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
  /** When false, only the X/Cancel buttons close the modal (prevents accidental dismiss while editing). */
  closeOnBackdrop?: boolean
}

export default function Modal({ title, open, onClose, children, footer, wide, closeOnBackdrop = false }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-2 sm:p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label="Close">
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t bg-white px-4 py-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
