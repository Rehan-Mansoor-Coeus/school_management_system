import { useState } from 'react'
import AuditLogsPanel from '../../../components/AuditLogsPanel'
import {
  createTaskCategory,
  createTaskTemplate,
  deleteTaskCategory,
  deleteTaskTemplate,
  fetchTaskCategories,
  fetchTaskTemplates,
  formatTaskError,
} from '../../../api/tasks'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'
import { ColoredTabsBar } from '../../../components/ui/ColoredModuleTabsNav'
import { useEffect } from 'react'

export default function TaskSettingsPage() {
  const { pushToast } = useToast()
  const [tab, setTab] = useState<'general' | 'audit'>('general')
  const [categories, setCategories] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')

  const load = async () => {
    try {
      const [categoryRows, templateRows] = await Promise.all([fetchTaskCategories(), fetchTaskTemplates()])
      setCategories(categoryRows)
      setTemplates(templateRows)
    } catch (error) {
      pushToast(formatTaskError(error, 'Failed to load task settings'), 'error')
    }
  }

  useEffect(() => { if (tab === 'general') load() }, [tab])

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await createTaskCategory({ name: categoryName })
      setCategoryName('')
      pushToast('Category created.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to create category'), 'error')
    }
  }

  const addTemplate = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await createTaskTemplate({ name: templateName, subject: templateSubject, body: templateBody })
      setTemplateName('')
      setTemplateSubject('')
      setTemplateBody('')
      pushToast('Template created.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to create template'), 'error')
    }
  }

  const removeCategory = async (id: number) => {
    try {
      await deleteTaskCategory(id)
      pushToast('Category deleted.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to delete category'), 'error')
    }
  }

  const removeTemplate = async (id: number) => {
    try {
      await deleteTaskTemplate(id)
      pushToast('Template deleted.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to delete template'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <ColoredTabsBar
        items={[
          { id: 'general', label: 'Categories & Templates', color: 'navy' },
          { id: 'audit', label: 'Audit Logs', color: 'amber' },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as 'general' | 'audit')}
      />

      {tab === 'audit' ? (
        <AuditLogsPanel compact />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Task Categories</h2>
            <form onSubmit={addCategory} className="flex gap-2">
              <input className={formInputClass} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" required />
              <button className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Add</button>
            </form>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>{category.name}</span>
                  <button type="button" onClick={() => removeCategory(Number(category.id))} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Delete</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notification Templates</h2>
            <form onSubmit={addTemplate} className="space-y-3">
              <FormField label="Template name" required>
                <input className={formInputClass} value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
              </FormField>
              <FormField label="Subject"><input className={formInputClass} value={templateSubject} onChange={(event) => setTemplateSubject(event.target.value)} /></FormField>
              <FormField label="Body"><textarea rows={4} className={formInputClass} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} /></FormField>
              <button className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Add template</button>
            </form>
            <ul className="space-y-2">
              {templates.map((template) => (
                <li key={template.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>{template.name}</span>
                  <button type="button" onClick={() => removeTemplate(Number(template.id))} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
