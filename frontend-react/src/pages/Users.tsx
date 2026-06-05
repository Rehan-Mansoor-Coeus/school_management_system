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
  phone_number?: string | null
  additional_phone_number?: string | null
  address?: string | null
  status?: string
  roles: Role[]
}

export default function UsersPage() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    additional_phone_number: '',
    address: '',
    status: 'active',
    primary_role: '' as number | '',
    roles: [] as number[],
  })
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
    setForm({
      name: '', email: '', password: '', phone_number: '', additional_phone_number: '', address: '', status: 'active', primary_role: '', roles: [],
    })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setActiveUser(user)
    const roleIds = user.roles.map((role) => role.id)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone_number: user.phone_number || '',
      additional_phone_number: user.additional_phone_number || '',
      address: user.address || '',
      status: user.status || 'active',
      primary_role: roleIds[0] || '',
      roles: roleIds,
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
    const roleIds = form.primary_role
      ? Array.from(new Set([Number(form.primary_role), ...form.roles.filter(id => id !== Number(form.primary_role))]))
      : form.roles
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone_number: form.phone_number,
      additional_phone_number: form.additional_phone_number,
      address: form.address,
      status: form.status,
      roles: roleIds,
    }
    try {
      if (activeUser) {
        await updateUser(activeUser.id, payload)
        pushToast('User updated successfully.')
      } else {
        await createUser(payload)
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
      <div className="flex justify-end">
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
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Phone</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Roles</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.phone_number || '—'}</td>
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

      <Modal
        title={activeUser ? 'Edit user' : 'Create user'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" form="user-form" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleFormSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <input
              value={form.phone_number}
              onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Additional Phone Number</label>
            <input
              value={form.additional_phone_number}
              onChange={(event) => setForm((prev) => ({ ...prev, additional_phone_number: event.target.value }))}
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Address</label>
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Primary Role</label>
            <select
              value={form.primary_role}
              onChange={(event) => setForm((prev) => ({ ...prev, primary_role: event.target.value ? Number(event.target.value) : '' }))}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Select role</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Additional Roles</label>
            <select
              value={form.roles.map(String)}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions, (option) => Number(option.value))
                setForm((prev) => ({ ...prev, roles: selected }))
              }}
              multiple
              className="mt-2 w-full min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        title="Assign Roles"
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRoleModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="button" onClick={handleAssignRoles} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save Roles
            </button>
          </div>
        }
      >
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
      </Modal>
    </div>
  )
}
