import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

type Props = {
  letter: any
  onPreview: () => void
  onEdit: () => void
  onForward: () => void
  onPrint?: () => void
  onDelete: () => void
  onApprove?: () => void
  onReject?: () => void
  onSign?: () => void
  onSend?: () => void
}

export default function LetterActionDropdown({
  letter, onPreview, onEdit, onForward, onPrint, onDelete, onApprove, onReject, onSign, onSend,
}: Props) {
  const { permissions } = useAuth()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const can = (perm: string) => permissions.includes(perm)
  const editableStatuses = ['draft', 'awaiting_editing', 'awaiting_approval', 'awaiting_signature', 'rejected']
  const canEdit = editableStatuses.includes(letter.status) && (
    can('edit_letters') || can('edit_awaiting_letters') || can('approve_letters') || can('sign_letters')
  )
  const canForward = letter.status === 'awaiting_editing' && can('forward_letter_to_approver')
  const canDelete = can('delete_letters')

  const items: { key: string; label: string; action: () => void; danger?: boolean }[] = [
    { key: 'preview', label: 'Preview', action: onPreview },
  ]
  if (canEdit) items.push({ key: 'edit', label: 'Edit', action: onEdit })
  if (canForward) items.push({ key: 'forward', label: 'Forward to Approver', action: onForward })
  if (onPrint && ['ready_to_send', 'sent', 'awaiting_editing', 'awaiting_approval', 'awaiting_signature'].includes(letter.status)) {
    items.push({ key: 'print', label: 'Print', action: onPrint })
  }
  if (letter.status === 'awaiting_approval' && can('approve_letters') && onApprove) {
    items.push({ key: 'approve', label: 'Approve', action: onApprove })
  }
  if (letter.status === 'awaiting_approval' && can('reject_letters') && onReject) {
    items.push({ key: 'reject', label: 'Reject', action: onReject, danger: true })
  }
  if (letter.status === 'awaiting_signature' && can('sign_letters') && onSign) {
    items.push({ key: 'sign', label: 'Sign', action: onSign })
  }
  if (letter.status === 'ready_to_send' && can('send_letters') && onSend) {
    items.push({ key: 'send', label: 'Send via WhatsApp', action: onSend })
  }
  if (canDelete) items.push({ key: 'delete', label: 'Delete', action: onDelete, danger: true })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    function positionMenu() {
      const rect = buttonRef.current!.getBoundingClientRect()
      const menuHeight = menuRef.current?.offsetHeight || items.length * 36 + 8
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12

      setMenuStyle({
        position: 'fixed',
        left: Math.max(8, rect.right - 200),
        top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        zIndex: 9999,
        minWidth: 200,
      })
    }

    positionMenu()
    window.addEventListener('scroll', positionMenu, true)
    window.addEventListener('resize', positionMenu)
    return () => {
      window.removeEventListener('scroll', positionMenu, true)
      window.removeEventListener('resize', positionMenu)
    }
  }, [open, items.length])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function run(action: () => void) {
    setOpen(false)
    action()
  }

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
    >
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 ${
            item.danger ? 'text-rose-700' : 'text-slate-700'
          }`}
          onClick={() => run(item.action)}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
      >
        Action
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  )
}
