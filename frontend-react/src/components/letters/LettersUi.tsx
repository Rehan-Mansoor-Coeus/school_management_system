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

export function A4Preview({ preview, printMode = false }: { preview: any; printMode?: boolean }) {
  if (!preview) return null

  return (
    <div className={`letter-a4 mx-auto bg-white text-slate-900 shadow-lg ${printMode ? 'print-shadow-none' : ''}`}>
      <div className="relative border-b border-slate-200">
        {preview.letterhead_url ? (
          <img src={preview.letterhead_url} alt="Letterhead" className="h-36 w-full object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center bg-gradient-to-r from-[#1e3a5f] to-[#2a4a73] text-white">
            <div>
              {preview.logo_url && <img src={preview.logo_url} alt="Logo" className="mb-2 h-12 object-contain" />}
              <div className="text-2xl font-bold">{preview.company_name || 'Institution Letterhead'}</div>
            </div>
          </div>
        )}
        <div className="absolute right-4 top-4 space-y-2 text-right text-xs">
          {preview.editor_indicator && (
            <div className="rounded bg-white/90 p-2 shadow">
              {preview.editor_indicator.signature_url && (
                <img src={preview.editor_indicator.signature_url} alt="Editor" className="ml-auto h-8 object-contain" />
              )}
              <div className="font-semibold">Editor: {preview.editor_indicator.name}</div>
            </div>
          )}
          {preview.approver_indicator && (
            <div className="rounded bg-white/90 p-2 shadow">
              {preview.approver_indicator.signature_url && (
                <img src={preview.approver_indicator.signature_url} alt="Approver" className="ml-auto h-8 object-contain" />
              )}
              <div className="font-semibold">Approver: {preview.approver_indicator.name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-10 py-8">
        <div className="mb-6 text-sm">
          <div><strong>Ref:</strong> {preview.reference}</div>
          <div>{preview.date}</div>
        </div>

        <div className="mb-6 text-sm">
          <div>{preview.recipient_name}</div>
          {preview.recipient_address && <div>{preview.recipient_address}</div>}
          <div className="mt-3">Dear {preview.recipient_name},</div>
        </div>

        <div className="mb-6 text-sm font-bold underline uppercase">{preview.subject}</div>

        {preview.header_html && (
          <div className="letter-content mb-4 text-sm" dangerouslySetInnerHTML={{ __html: preview.header_html }} />
        )}
        <div className="letter-content mb-8 min-h-[120px] text-sm leading-7" dangerouslySetInnerHTML={{ __html: preview.body_html }} />
        {preview.footer_html && (
          <div className="letter-content mb-8 text-sm" dangerouslySetInnerHTML={{ __html: preview.footer_html }} />
        )}

        <div className="mt-10 text-sm">Sincerely,</div>
        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6">
          <div>
            {preview.signer_signature_url ? (
              <img src={preview.signer_signature_url} alt="Signature" className="mb-2 h-16 object-contain" />
            ) : (
              <div className="mb-2 h-16 border-b border-dashed border-slate-400" />
            )}
            <div className="font-semibold">{preview.signer_name || preview.author_name}</div>
            {preview.signer_title && <div className="text-slate-600">{preview.signer_title}</div>}
            {preview.company_name && <div className="text-slate-600">{preview.company_name}</div>}
          </div>
          <div className="text-right">
            <Barcode value={preview.barcode_value} />
            {preview.qr_code_url && (
              <img src={preview.qr_code_url} alt="QR Code" className="ml-auto mt-3 h-24 w-24 border border-slate-200" />
            )}
          </div>
        </div>

        {preview.cc?.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-4 text-xs">
            <strong>CC:</strong> {preview.cc.join(', ')}
          </div>
        )}

        {preview.attachments?.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-4 text-xs">
            <strong>Attachments:</strong>
            <ul className="mt-2 list-disc pl-5">
              {preview.attachments.map((file: { id: number; original_name: string; url: string }) => (
                <li key={file.id}>
                  <a href={file.url} target="_blank" rel="noreferrer" className="text-[#1e3a5f] underline">
                    {file.original_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200">
        {preview.footer_url ? (
          <img src={preview.footer_url} alt="Footer" className="h-24 w-full object-cover" />
        ) : (
          <div className="bg-slate-800 px-10 py-4 text-xs text-white">
            {preview.company_name || 'Institution footer'}
          </div>
        )}
      </div>

      <style>{`
        .letter-a4 { width: 210mm; min-height: 297mm; }
        .letter-content p { margin: 0 0 0.75rem; }
        .letter-content ul, .letter-content ol { margin: 0 0 0.75rem 1.25rem; }
        @media print {
          body * { visibility: hidden; }
          .letter-a4, .letter-a4 * { visibility: visible; }
          .letter-a4 { position: absolute; left: 0; top: 0; width: 210mm; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}
