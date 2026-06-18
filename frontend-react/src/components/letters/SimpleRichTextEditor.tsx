import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type SimpleRichTextEditorRef = {
  insertText: (text: string) => void
}

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const tools = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'underline', label: 'U', title: 'Underline' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullets' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbering' },
  { cmd: 'justifyLeft', label: 'Left', title: 'Align left' },
  { cmd: 'justifyCenter', label: 'Center', title: 'Align center' },
  { cmd: 'justifyRight', label: 'Right', title: 'Align right' },
]

const SimpleRichTextEditor = forwardRef<SimpleRichTextEditorRef, Props>(function SimpleRichTextEditor(
  { value, onChange, placeholder, minHeight = 180 },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      const el = editorRef.current
      if (!el) return
      el.focus()
      document.execCommand('insertText', false, text)
      onChange(el.innerHTML)
    },
  }))

  function exec(command: string) {
    document.execCommand(command, false)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function handleInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {tools.map(tool => (
          <button
            key={tool.cmd}
            type="button"
            title={tool.title}
            onMouseDown={e => e.preventDefault()}
            onClick={() => exec(tool.cmd)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {tool.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-w-0 px-3 py-3 text-sm leading-6 outline-none [&:empty:before]:text-slate-400 [&:empty:before]:content-[attr(data-placeholder)]"
        style={{ minHeight }}
      />
    </div>
  )
})

export default SimpleRichTextEditor
