import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole,
} from '../api/admin'
import { useAuth } from '../context/AuthContext'
import { filterAssignableRoles, PLATFORM_SUPER_ADMIN_ROLES } from '../utils/accessControl'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
}

export default function RolesPage() {
  const { userRoles } = useAuth()
  const isPlatformSuperAdmin = userRoles.some((role) => PLATFORM_SUPER_ADMIN_ROLES.includes(role as typeof PLATFORM_SUPER_ADMIN_ROLES[number]))
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [permModalOpen, setPermModalOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ name: '' })
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const { pushToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([fetchRoles(), fetchPermissions()])
      setRoles(rolesRes.data)
      setPermissions(permissionsRes.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load roles', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveRole(null)
    setForm({ name: '' })
    setModalOpen(true)
  }

  const openEditModal = (role: Role) => {
    setActiveRole(role)
    setForm({ name: role.name })
    setModalOpen(true)
  }

  const openPermissionModal = (role: Role) => {
    setActiveRole(role)
    setSelectedPermissions(role.permissions.map((permission) => permission.id))
    setPermModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (activeRole) {
        await updateRole(activeRole.id, form)
        pushToast('Role updated successfully.')
      } else {
        await createRole(form)
        pushToast('Role created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save role', 'error')
    }
  }

  const handleAssignPermissions = async () => {
    if (!activeRole) return
    try {
      await assignRolePermissions(activeRole.id, selectedPermissions)
      pushToast('Permissions saved.')
      setPermModalOpen(false)
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save permissions', 'error')
    }
  }

  const handleDelete = async (role: Role) => {
    if (!window.confirm('Delete this role?')) return
    try {
      await deleteRole(role.id)
      pushToast('Role deleted successfully.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete role', 'error')
    }
  }

  const visibleRoles = useMemo(
    () => filterAssignableRoles(roles, userRoles),
    [roles, userRoles],
  )

  const permissionOptions = useMemo(
    () => permissions.map((permission) => ({ id: permission.id, label: permission.name })),
    [permissions]
  )

  const isProtectedRole = (role: Role) => PLATFORM_SUPER_ADMIN_ROLES.includes(role.name as typeof PLATFORM_SUPER_ADMIN_ROLES[number])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Roles</h2>
          <p className="text-sm text-slate-500">Define access roles and manage permissions.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          New role
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Role</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Permissions</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                  Loading roles...
                </td>
              </tr>
            ) : visibleRoles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              visibleRoles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{role.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{role.permissions.map((permission) => permission.name).join(', ') || 'None'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      {!isProtectedRole(role) && (
                        <button onClick={() => openEditModal(role)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                          Edit
                        </button>
                      )}
                      <button onClick={() => openPermissionModal(role)} className="rounded-xl bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200">
                        Permissions
                      </button>
                      {!isProtectedRole(role) && (
                        <button onClick={() => handleDelete(role)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={activeRole ? 'Edit Role' : 'Create Role'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" form="role-form" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        }
      >
        <form id="role-form" onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </form>
      </Modal>

      <Modal
        title="Assign Permissions"
        open={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setPermModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="button" onClick={handleAssignPermissions} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save Permissions
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-600">
              Selected {selectedPermissions.length} of {permissionOptions.length}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPermissions(permissionOptions.map((permission) => permission.id))}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedPermissions([])}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {permissionOptions.map((permission) => (
              <label key={permission.id} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={(event) => {
                    const value = permission.id
                    setSelectedPermissions((current) =>
                      event.target.checked ? [...current, value] : current.filter((item) => item !== value)
                    )
                  }}
                />
                {permission.label}
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
