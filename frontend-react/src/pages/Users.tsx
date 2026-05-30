import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import {
  assignUserRoles,
  createUser,
  deleteUser,
  fetchRoles,
  fetchUsers,
  updateUser,
} from '../api/admin'

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  roles: Role[]
}

export default function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: [] as number[] })
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const { pushToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const roleOptions = useMemo(() => roles.map((role) => ({ id: role.id, label: role.name })), [roles])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([fetchUsers(), fetchRoles()])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveUser(null)
    setForm({ name: '', email: '', password: '', roles: [] })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setActiveUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles.map((role) => role.id),
    })
    setModalOpen(true)
  }

  const openRoleModal = (user: User) => {
    setActiveUser(user)
    setSelectedRoles(user.roles.map((role) => role.id))
    setRoleModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (activeUser) {
        await updateUser(activeUser.id, { ...form, roles: form.roles })
        pushToast('User updated successfully.')
      } else {
        await createUser({ ...form, roles: form.roles })
        pushToast('User created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      const validation = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save user', 'error')
    }
  }

  const handleAssignRoles = async () => {
    if (!activeUser) return
    try {
      await assignUserRoles(activeUser.id, selectedRoles)
      pushToast('Roles assigned successfully.')
      setRoleModalOpen(false)
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to assign roles', 'error')
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await deleteUser(user.id)
      pushToast('User deleted successfully.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete user', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Users</h2>
          <p className="text-sm text-slate-500">Manage accounts and assign roles.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          New user
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Roles</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.roles.map((role) => role.name).join(', ') || 'None'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditModal(user)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button onClick={() => openRoleModal(user)} className="rounded-xl bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200">
                        Roles
                      </button>
                      <button onClick={() => handleDelete(user)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title={activeUser ? 'Edit user' : 'Create user'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              type="password"
              placeholder={activeUser ? 'Leave blank to keep current password' : ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              {...(!activeUser ? { required: true } : {})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Roles</label>
            <select
              value={form.roles.map(String)}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions, (option) => Number(option.value))
                setForm((prev) => ({ ...prev, roles: selected }))
              }}
              multiple
              className="mt-2 w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal title="Assign Roles" open={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <label key={role.id} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={(event) => {
                    const value = Number(role.id)
                    setSelectedRoles((current) =>
                      event.target.checked ? [...current, value] : current.filter((item) => item !== value)
                    )
                  }}
                />
                {role.name}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setRoleModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={handleAssignRoles} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save Roles
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
