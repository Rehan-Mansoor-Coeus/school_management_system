import React, { useEffect, useMemo, useState } from 'react'
import { UserPlus, Users as UsersIcon } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { FormField, formInputClass } from '../components/ui/FormField'
import FormSelect from '../components/ui/FormSelect'
import { useAuth } from '../context/AuthContext'

import {
  assignUserRoles,
  createUser,
  deleteUser,
  fetchInstitutions,
  fetchRoles,
  fetchUsers,
  updateUser,
} from '../api/admin'
import { filterAssignableRoles } from '../utils/accessControl'

interface Role {
  id: number
  name: string
}

interface Institution {
  id: number
  name: string
  code?: string
}

interface User {
  id: number
  name: string
  username?: string | null
  email: string
  institution_id?: number
  institution?: Institution | null
  phone_number?: string | null
  additional_phone_number?: string | null
  address?: string | null
  status?: string
  roles: Role[]
}

export default function UsersPage() {
  const { userRoles } = useAuth()
  const isPlatformSuperAdmin = userRoles.includes('system-super-admin')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [institutionFilter, setInstitutionFilter] = useState<number | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [form, setForm] = useState({
    institution_id: '' as number | '',
    name: '',
    username: '',
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
  }, [institutionFilter, isPlatformSuperAdmin])

  useEffect(() => {
    if (!isPlatformSuperAdmin) return
    fetchInstitutions({ per_page: 100 })
      .then((res) => setInstitutions(res.data?.data || res.data || []))
      .catch(() => setInstitutions([]))
  }, [isPlatformSuperAdmin])

  const roleOptions = useMemo(
    () => filterAssignableRoles(roles, userRoles).map((role) => ({ id: role.id, label: role.name })),
    [roles, userRoles],
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const params = isPlatformSuperAdmin && institutionFilter ? { institution_id: Number(institutionFilter) } : undefined
      const [usersRes, rolesRes] = await Promise.all([fetchUsers(params), fetchRoles()])
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : [])
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveUser(null)
    setForm({
      institution_id: institutionFilter || '',
      name: '', email: '', password: '', phone_number: '', additional_phone_number: '', address: '', status: 'active', primary_role: '', roles: [],

    })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setActiveUser(user)
    const roleIds = user.roles.map((role) => role.id)
    setForm({
      institution_id: user.institution_id || user.institution?.id || '',
      name: user.name,
      username: user.username || '',
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
    const payload: Record<string, unknown> = {
      name: form.name,
      username: form.username || undefined,
      email: form.email,
      phone_number: form.phone_number,
      additional_phone_number: form.additional_phone_number,
      address: form.address,
      status: form.status,
      roles: roleIds,
      ...(isPlatformSuperAdmin && form.institution_id ? { institution_id: Number(form.institution_id) } : {}),
    }
    if (form.password) payload.password = form.password

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isPlatformSuperAdmin && (
          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-slate-700">Institution</label>
            <select
              value={institutionFilter}
              onChange={(event) => setInstitutionFilter(event.target.value ? Number(event.target.value) : '')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">All institutions</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}{institution.code ? ` (${institution.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#162d4a]"
        >
          <UserPlus className="h-4 w-4" />
          New user
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Username</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Email</th>
              {isPlatformSuperAdmin && (
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Institution</th>
              )}
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Phone</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Roles</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>

                <td colSpan={isPlatformSuperAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>

                <td colSpan={isPlatformSuperAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-500">

                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.username || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  {isPlatformSuperAdmin && (
                    <td className="px-6 py-4 text-sm text-slate-600">{user.institution?.name || '—'}</td>
                  )}
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
            <button type="submit" form="user-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]">
              Save
            </button>
          </div>
        }
      >
<form id="user-form" onSubmit={handleFormSubmit} className="space-y-6">

  {/* Institution (only for super admin) */}
  {isPlatformSuperAdmin && (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <label className="block text-sm font-medium text-slate-700">
        Institution
      </label>

      <select
        value={form.institution_id}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            institution_id: event.target.value
              ? Number(event.target.value)
              : "",
          }))
        }
        required
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#1e3a5f]"
      >
        <option value="">Select institution</option>
        {institutions.map((institution) => (
          <option key={institution.id} value={institution.id}>
            {institution.name}
            {institution.code ? ` (${institution.code})` : ""}
          </option>
        ))}
      </select>
    </div>
  )}

  {/* Account Details */}
  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
        <UsersIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Account details
        </p>
        <p className="text-xs text-slate-500">
          Username and password can differ from email.
        </p>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Name">
        <input
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          type="text"
          className={formInputClass}
        />
      </FormField>

      <FormField label="Username" hint="Used for login">
        <input
          value={form.username}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, username: e.target.value }))
          }
          type="text"
          className={formInputClass}
        />
      </FormField>

      <FormField label="Email" required>
        <input
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
          type="email"
          required
          className={formInputClass}
        />
      </FormField>

      <FormField
        label="Password"
        required={!activeUser}
        hint={
          activeUser
            ? "Leave blank to keep current password"
            : undefined
        }
      >
        <input
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
          type="password"
          className={formInputClass}
          {...(!activeUser ? { required: true } : {})}
        />
      </FormField>

      <FormField label="Phone number">
        <input
          value={form.phone_number}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              phone_number: e.target.value,
            }))
          }
          type="text"
          className={formInputClass}
        />
      </FormField>
    </div>
  </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Additional phone">
              <input value={form.additional_phone_number} onChange={(e) => setForm((prev) => ({ ...prev, additional_phone_number: e.target.value }))} type="text" className={formInputClass} />
            </FormField>
            <FormField label="Address" className="md:col-span-2">
              <input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} type="text" className={formInputClass} />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Status">
              <FormSelect
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                placeholder="Select status"
              />
            </FormField>
            <FormField label="Primary role" required>
              <FormSelect
                value={form.primary_role ? String(form.primary_role) : ''}
                onChange={(value) => setForm((prev) => ({ ...prev, primary_role: value ? Number(value) : '' }))}
                options={roleOptions.map((role) => ({ value: String(role.id), label: role.label }))}
                placeholder="Select role"
                required
              />
            </FormField>
          </div>

          <FormField label="Additional roles">
            <div className="grid gap-2 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <label key={role.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role.id)}
                    onChange={(event) => {
                      const value = Number(role.id)
                      setForm((prev) => ({
                        ...prev,
                        roles: event.target.checked ? [...prev.roles, value] : prev.roles.filter((item) => item !== value),
                      }))
                    }}
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </FormField>
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
            <button type="button" onClick={handleAssignRoles} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]">
              Save Roles
            </button>
          </div>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {roleOptions.map((role) => (
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
              {role.label}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  )
}
