import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../../components/ui/ToastProvider'
import HasPermission from '../../../components/HasPermission'
import type { Institution, InstitutionType, PaginatedResponse } from '../types'
import { institutionFileUrl } from '../utils'
import { useInstitutions } from '../hooks/useInstitutions'
import InstitutionForm from './InstitutionForm'
import InstitutionDetail from './InstitutionDetail'

const institutionTypeKeys: InstitutionType[] = ['university', 'college', 'school', 'vocational', 'technical', 'training']

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    </div>
  )
}

export default function InstitutionList() {
  const { pushToast } = useToast()
  const { t } = useTranslation()
  const { loading, fetchInstitutions, deleteInstitution } = useInstitutions()

  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [data, setData] = useState<PaginatedResponse<Institution> | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [mode, setMode] = useState<'create' | 'edit'>('create')

  const load = async () => {
    try {
      const res = await fetchInstitutions(page, {
        search: search || undefined,
        type: type || undefined,
        country: country || undefined,
        per_page: perPage,
      })
      setData(res)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || t('institutions.loadError'), 'error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1)
      load()
    }, 350)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, country])

  const openCreate = () => {
    setMode('create')
    setActiveId(null)
    setFormOpen(true)
  }

  const openEdit = (id: number) => {
    setMode('edit')
    setActiveId(id)
    setFormOpen(true)
  }

  const openDetail = (id: number) => {
    setActiveId(id)
    setDetailOpen(true)
  }

  const onDelete = async (id: number) => {
    if (!window.confirm(t('institutions.deleteConfirm'))) return
    try {
      await deleteInstitution(id)
      pushToast(t('institutions.deleted'), 'success')
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || t('institutions.deleteError'), 'error')
    }
  }

  const countries = useMemo(() => {
    const list = (data?.data || []).map((i) => i.country).filter(Boolean) as string[]
    return Array.from(new Set(list)).sort()
  }, [data])

  return (
    <HasPermission permission="institutions.view" fallback={<div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">{t('institutions.noAccess')}</div>}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t('institutions.title')}</h2>
            <p className="text-sm text-slate-500">{t('institutions.subtitle')}</p>
          </div>
          {/* <HasPermission permission="institutions.create"> */}
            <button onClick={openCreate} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
              {t('institutions.add')}
            </button>
          {/* </HasPermission> */}
        </div>

        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('institutions.searchPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
          >
            <option value="">{t('institutions.filters.type')}</option>
            {institutionTypeKeys.map((value) => (
              <option key={value} value={value}>
                {t(`institutions.types.${value}`)}
              </option>
            ))}
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
          >
            <option value="">{t('institutions.filters.country')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.logo')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.name')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.code')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.type')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.country')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.status.label')}</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">{t('institutions.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : (data?.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      {t('institutions.empty')}
                    </td>
                  </tr>
                ) : (
                  (data?.data || []).map((row) => {
                    const logoUrl = institutionFileUrl(row, 'logo')
                    return (
                      <tr key={row.id}>
                        <td className="px-6 py-4">
                          {logoUrl ? (
                            <img src={logoUrl} alt={row.name} className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                              {(row.name || 'I').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.code}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{t(`institutions.types.${row.type}` as any, { defaultValue: row.type })}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{row.country || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {row.is_active ? t('institutions.status.active') : t('institutions.status.inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex flex-wrap gap-2">
                            <HasPermission permission="institutions.view">
                              <button onClick={() => openDetail(row.id)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                                {t('institutions.view')}
                              </button>
                            </HasPermission>
                            <HasPermission permission="institutions.edit">
                              <button onClick={() => openEdit(row.id)} className="rounded-xl bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200">
                                {t('institutions.edit')}
                              </button>
                            </HasPermission>
                            <HasPermission permission="institutions.delete">
                              <button onClick={() => onDelete(row.id)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                                {t('institutions.delete')}
                              </button>
                            </HasPermission>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data && data.last_page > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {t('institutions.pagination', { page: data.current_page, last: data.last_page, total: data.total })}
            </div>
            <div className="flex gap-2">
              <button
                disabled={data.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`rounded-xl px-4 py-2 text-sm ${data.current_page <= 1 ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
              >
                {t('institutions.prev')}
              </button>
              <button
                disabled={data.current_page >= data.last_page}
                onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                className={`rounded-xl px-4 py-2 text-sm ${data.current_page >= data.last_page ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
              >
                {t('institutions.next')}
              </button>
            </div>
          </div>
        )}

        {formOpen && (
          <InstitutionForm
            mode={mode}
            institutionId={activeId}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false)
              load()
            }}
          />
        )}

        {detailOpen && activeId && (
          <InstitutionDetail
            institutionId={activeId}
            onClose={() => setDetailOpen(false)}
            onEdit={() => {
              setDetailOpen(false)
              openEdit(activeId)
            }}
          />
        )}
      </div>
    </HasPermission>
  )
}
