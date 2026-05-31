import api from './client'

export function fetchUsers() {
  return api.get('/users')
}

export function createUser(payload: any) {
  return api.post('/users', payload)
}

export function updateUser(id: number, payload: any) {
  return api.put(`/users/${id}`, payload)
}

export function deleteUser(id: number) {
  return api.delete(`/users/${id}`)
}

export function assignUserRoles(id: number, roles: number[]) {
  return api.post(`/users/${id}/roles`, { roles })
}

export function fetchRoles() {
  return api.get('/roles')
}

export function createRole(payload: any) {
  return api.post('/roles', payload)
}

export function updateRole(id: number, payload: any) {
  return api.put(`/roles/${id}`, payload)
}

export function deleteRole(id: number) {
  return api.delete(`/roles/${id}`)
}

export function assignRolePermissions(id: number, permissions: number[]) {
  return api.post(`/roles/${id}/permissions`, { permissions })
}

export function fetchPermissions() {
  return api.get('/permissions')
}

export function createPermission(payload: any) {
  return api.post('/permissions', payload)
}

export function updatePermission(id: number, payload: any) {
  return api.put(`/permissions/${id}`, payload)
}

export function deletePermission(id: number) {
  return api.delete(`/permissions/${id}`)
}

export function fetchInstitutions(params?: Record<string, any>) {
  return api.get('/institutions', { params })
}

export function fetchDepartments(search?: string) {
  return api.get('/departments', { params: { search } })
}

export function createDepartment(payload: any) {
  return api.post('/departments', payload)
}

export function updateDepartment(id: number, payload: any) {
  return api.put(`/departments/${id}`, payload)
}

export function deleteDepartment(id: number) {
  return api.delete(`/departments/${id}`)
}

export function fetchInstitutionModules(institutionId: number) {
  return api.get(`/institutions/${institutionId}/modules`)
}

export function updateInstitutionModules(institutionId: number, modules: { key: string; enabled: boolean }[]) {
  return api.put(`/institutions/${institutionId}/modules`, { modules })
}
