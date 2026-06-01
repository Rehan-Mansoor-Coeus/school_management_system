import React from 'react'
import { statusColors } from '../../i18n/letters'

export function LettersPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function LettersCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

export function PrimaryButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#162d4a] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function DangerButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function SuccessButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-semibold text-slate-800">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm ${props.className || ''}`} />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm ${props.className || ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm ${props.className || ''}`} />
}

export function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] || 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>{status.replace(/_/g, ' ')}</span>
}

export function CountBadge({ count, tone = 'default' }: { count: number; tone?: 'default' | 'teal' | 'pink' | 'purple' }) {
  const tones = {
    default: 'bg-slate-200 text-slate-700',
    teal: 'bg-teal-100 text-teal-800',
    pink: 'bg-rose-100 text-rose-700',
    purple: 'bg-purple-100 text-purple-800',
  }
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${tones[tone]}`}>{count}</span>
}

function Barcode({ value }: { value?: string }) {
  if (!value) return null
  const bars = value.split('').map((char, index) => (
    <span
      key={`${char}-${index}`}
      className="inline-block bg-slate-800"
      style={{ width: `${(char.charCodeAt(0) % 3) + 1}px`, height: '36px', marginRight: '1px' }}
    />
  ))
  return <div className="mt-1">{bars}<div className="mt-1 font-mono text-[10px]">{value}</div></div>
}

function resolveStorageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'
  const apiOrigin = apiBase.replace(/\/api\/?$/, '')
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/storage/')) {
      return `${apiOrigin}${parsed.pathname}`
    }
  } catch {
    if (url.startsWith('/storage/')) return `${apiOrigin}${url}`
  }
  return url
}

export function A4Preview({ preview, printMode = false }: { preview: any; printMode?: boolean }) {
  if (!preview) return null

  const letterheadUrl = resolveStorageUrl(preview.letterhead_url)
  const footerUrl = resolveStorageUrl(preview.footer_url)
  const logoUrl = resolveStorageUrl(preview.logo_url)
  const editorSig = preview.editor_indicator?.signature_url ? resolveStorageUrl(preview.editor_indicator.signature_url) : undefined
  const approverSig = preview.approver_indicator?.signature_url ? resolveStorageUrl(preview.approver_indicator.signature_url) : undefined
  const signerSig = preview.signer_signature_url ? resolveStorageUrl(preview.signer_signature_url) : undefined
  const hasApprovalSigs = Boolean(editorSig || approverSig)

  return (
    <div className={`letter-a4 relative mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white text-slate-900 shadow-lg ${printMode ? 'print:shadow-none' : ''}`}>
      {logoUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
          <img src={logoUrl} alt="" className="max-h-72 max-w-[280px] object-contain" />
        </div>
      )}

      <div className="relative z-10">
        {letterheadUrl ? (
          <img src={letterheadUrl} alt="Letterhead" className="block h-auto max-h-[100px] w-full object-contain" />
        ) : (
          <div className="flex min-h-[80px] items-center justify-center bg-gradient-to-r from-[#1e3a5f] to-[#2a4a73] text-white">
            <div className="text-center">
              {logoUrl && <img src={logoUrl} alt="Logo" className="mx-auto mb-2 h-10 object-contain" />}
              <div className="text-lg font-bold">{preview.company_name || 'Institution Letterhead'}</div>
            </div>
          </div>
        )}

        {hasApprovalSigs && (
          <div className="flex justify-end gap-2 px-10 py-1">
            {editorSig && <img src={editorSig} alt="Editor signature" className="h-7 max-w-[72px] object-contain" />}
            {approverSig && <img src={approverSig} alt="Approver signature" className="h-7 max-w-[72px] object-contain" />}
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 px-10 py-6">
        <div className="mb-4 text-sm leading-relaxed">
          {preview.reference && <div><strong>Ref:</strong> {preview.reference}</div>}
          <div>{preview.date}</div>
        </div>

        <div className="mb-4 text-sm leading-relaxed">
          <div>{preview.recipient_name}</div>
          {preview.recipient_address && <div>{preview.recipient_address}</div>}
          <div className="mt-2">Dear: {preview.recipient_name},</div>
        </div>

        <div className="mb-4 text-sm font-bold uppercase underline">Subject: {preview.subject}</div>

        {preview.header_html && (
          <div className="letter-content mb-3 text-sm" dangerouslySetInnerHTML={{ __html: preview.header_html }} />
        )}
        <div className="letter-content mb-4 text-sm leading-7" dangerouslySetInnerHTML={{ __html: preview.body_html }} />
        {preview.footer_html && (
          <div className="letter-content mb-4 text-sm" dangerouslySetInnerHTML={{ __html: preview.footer_html }} />
        )}

        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="min-w-0 flex-1 text-sm">
            <div>Sincerely,</div>
            {signerSig ? (
              <img src={signerSig} alt="Signature" className="my-2 h-11 object-contain object-left" />
            ) : (
              <div className="my-2 h-10 w-40 border-b border-dashed border-slate-400" />
            )}
            <div className="font-semibold">{preview.signer_name || preview.author_name}</div>
            {preview.signer_title && <div className="text-slate-600">{preview.signer_title}</div>}
            {preview.company_name && <div className="text-slate-600">{preview.company_name}</div>}
          </div>

          <div className="flex shrink-0 flex-col items-end">
            {preview.barcode_url && (
              <img src={preview.barcode_url} alt="Barcode" className="h-9 object-contain" />
            )}
            {preview.qr_code_url && (
              <img src={preview.qr_code_url} alt="QR Code" className="mt-1 h-[72px] w-[72px] object-contain" />
            )}
          </div>
        </div>

        {preview.cc?.length > 0 && (
          <div className="mt-4 text-xs">
            <strong>CC:</strong> {preview.cc.join(', ')}
          </div>
        )}
      </div>

      <div className="letter-footer relative z-10 mt-auto">
        {footerUrl ? (
          <img src={footerUrl} alt="Footer" className="block h-auto max-h-[70px] w-full object-contain" />
        ) : (
          <div className="bg-slate-900 px-10 py-3 text-center text-xs text-white">
            {preview.company_name || 'Institution footer'}
          </div>
        )}
      </div>

      <style>{`
        .letter-content p { margin: 0 0 0.75rem; }
        .letter-content ul, .letter-content ol { margin: 0 0 0.75rem 1.25rem; }
        ${printMode ? `
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0; padding: 0; background: white; }
            .letter-a4 { box-shadow: none; width: 210mm; min-height: 297mm; }
            .letter-footer { break-inside: avoid; page-break-inside: avoid; }
          }
        ` : `
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body * { visibility: hidden; }
            .letter-a4, .letter-a4 * { visibility: visible; }
            .letter-a4 {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              box-shadow: none;
              display: flex;
              flex-direction: column;
            }
            .letter-footer { break-inside: avoid; page-break-inside: avoid; margin-top: auto; }
          }
        `}
      `}</style>
    </div>
  )
}
