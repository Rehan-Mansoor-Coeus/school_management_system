import React, { useEffect, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import PermissionMatrix, { unmappedPermissions } from '../components/access/PermissionMatrix'
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole,
} from '../api/admin'
import { ColoredTabsBar } from '../components/ui/ColoredModuleTabsNav'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
}

type Tab = 'roles' | 'permissions'

export default function RolesAndPermissionsPage() {
  const [tab, setTab] = useState<Tab>('permissions')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [dirty, setDirty] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({ name: '' })
  const { pushToast } = useToast()

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedRole) {
      setSelectedPermissionIds([])
      setDirty(false)
      return
    }
    setSelectedPermissionIds(selectedRole.permissions.map((p) => p.id))
    setDirty(false)
  }, [selectedRoleId, roles])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([fetchRoles(), fetchPermissions()])
      setRoles(rolesRes.data)
      setPermissions(permissionsRes.data)
      if (!selectedRoleId && rolesRes.data.length > 0) {
        setSelectedRoleId(rolesRes.data[0].id)
      }
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load roles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateRole = () => {
    setActiveRole(null)
    setRoleForm({ name: '' })
    setRoleModalOpen(true)
  }

  const openEditRole = (role: Role) => {
    setActiveRole(role)
    setRoleForm({ name: role.name })
    setRoleModalOpen(true)
  }

  const handleRoleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (activeRole) {
        await updateRole(activeRole.id, roleForm)
        pushToast('Role updated.')
      } else {
        await createRole(roleForm)
        pushToast('Role created.')
      }
      setRoleModalOpen(false)
      await loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save role', 'error')
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return
    try {
      await deleteRole(role.id)
      pushToast('Role deleted.')
      if (selectedRoleId === role.id) setSelectedRoleId(null)
      await loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete role', 'error')
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      await assignRolePermissions(selectedRole.id, selectedPermissionIds)
      pushToast('Permissions saved.')
      setDirty(false)
      await loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save permissions', 'error')
    } finally {
      setSaving(false)
    }
  }

  const extras = unmappedPermissions(permissions)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Roles & Permissions</h2>
        <p className="text-sm text-slate-500">Manage user access levels and system permissions.</p>
      </div>

      <ColoredTabsBar
        items={[
          { id: 'roles', label: 'User Roles', color: 'navy' },
          { id: 'permissions', label: 'Role Permissions', color: 'amber' },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === 'roles' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateRole} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
              New role
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">Permissions count</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Loading…</td></tr>
                ) : roles.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No roles found.</td></tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id}>
                      <td className="px-6 py-4 text-sm font-medium">{role.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{role.permissions.length}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEditRole(role)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200">Edit</button>
                          <button onClick={() => { setSelectedRoleId(role.id); setTab('permissions') }} className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200">Permissions</button>
                          <button onClick={() => handleDeleteRole(role)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Role Permission Matrix</h3>
              <p className="text-sm text-slate-500">Tick View, Edit, or Delete per menu — or use the section header to select all.</p>
            </div>
            <button
              type="button"
              disabled={!dirty || !selectedRole || saving}
              onClick={handleSavePermissions}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save permissions'}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Select role</div>
              <div className="max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {roles.map((role) => (
                  <div key={role.id} className={`flex items-center gap-1 rounded-lg ${selectedRoleId === role.id ? 'bg-[#1e3a5f] text-white' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${
                        selectedRoleId === role.id ? 'text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {role.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role)}
                      className="shrink-0 px-2 py-2 text-rose-500 hover:text-rose-700"
                      title="Delete role"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={openCreateRole} className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  + New role
                </button>
              </div>
            </div>

            <div>
              {selectedRole ? (
                <>
                  <div className="mb-3 text-sm font-medium text-slate-700">
                    Permissions for <span className="font-semibold">{selectedRole.name}</span>
                  </div>
                  <PermissionMatrix
                    permissions={permissions}
                    selectedIds={selectedPermissionIds}
                    onChange={(ids) => {
                      setSelectedPermissionIds(ids)
                      setDirty(true)
                    }}
                  />
                  {extras.length > 0 && (
                    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        Other permissions ({extras.length}) — not mapped to a menu row
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {extras.map((p) => (
                          <label key={p.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(p.id)}
                              onChange={(e) => {
                                setSelectedPermissionIds((current) =>
                                  e.target.checked ? [...current, p.id] : current.filter((id) => id !== p.id)
                                )
                                setDirty(true)
                              }}
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                  Select or create a role to assign permissions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        title={activeRole ? 'Edit Role' : 'Create Role'}
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRoleModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" form="role-form" className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">Save</button>
          </div>
        }
      >
        <form id="role-form" onSubmit={handleRoleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={roleForm.name}
              onChange={(e) => setRoleForm({ name: e.target.value })}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
