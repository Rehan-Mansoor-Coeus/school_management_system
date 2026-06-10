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

export function fetchDepartments(searchOrParams?: string | Record<string, unknown>) {
  const params = typeof searchOrParams === 'string' ? { search: searchOrParams } : searchOrParams || {}
  return api.get('/departments', { params })
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

export function fetchPrograms(params?: Record<string, any>) {
  return api.get('/academics/programs', { params })
}

export function fetchProgram(id: number) {
  return api.get(`/academics/programs/${id}`)
}

export function createProgram(payload: any) {
  return api.post('/academics/programs', payload)
}

export function updateProgram(id: number, payload: any) {
  return api.put(`/academics/programs/${id}`, payload)
}

export function deleteProgram(id: number) {
  return api.delete(`/academics/programs/${id}`)
}

export function fetchSubjects(params?: Record<string, any>) {
  return api.get('/academics/subjects', { params })
}

export function createSubject(payload: any) {
  return api.post('/academics/subjects', payload)
}

export function updateSubject(id: number, payload: any) {
  return api.put(`/academics/subjects/${id}`, payload)
}

export function deleteSubject(id: number) {
  return api.delete(`/academics/subjects/${id}`)
}

export function updateSemester(id: number, payload: any) {
  return api.put(`/academics/semesters/${id}`, payload)
}

export function assignSemesterSubject(programId: number, payload: any) {
  return api.post(`/academics/programs/${programId}/semester-subjects`, payload)
}

export function updateSemesterSubject(id: number, payload: any) {
  return api.put(`/academics/semester-subjects/${id}`, payload)
}

export function deleteSemesterSubject(id: number) {
  return api.delete(`/academics/semester-subjects/${id}`)
}

export function fetchAcademicUnits(params?: Record<string, unknown>) {
  return api.get('/academics/units', { params })
}

export function createAcademicUnit(payload: Record<string, unknown>) {
  return api.post('/academics/units', payload)
}

export function updateAcademicUnit(id: number, payload: Record<string, unknown>) {
  return api.put(`/academics/units/${id}`, payload)
}

export function deleteAcademicUnit(id: number) {
  return api.delete(`/academics/units/${id}`)
}

export function fetchSemesters(params?: Record<string, unknown>) {
  return api.get('/academics/semesters', { params })
}

export function createSemester(payload: Record<string, unknown>) {
  return api.post('/academics/semesters', payload)
}

export function fetchOrganizationTree(params?: Record<string, unknown>) {
  return api.get('/academics/organization', { params })
}

export function fetchProgramSubjects(params?: Record<string, unknown>) {
  return api.get('/academics/program-subjects', { params })
}

export function createProgramSubject(payload: Record<string, unknown>) {
  return api.post('/academics/program-subjects', payload)
}

export function deleteProgramSubject(id: number) {
  return api.delete(`/academics/program-subjects/${id}`)
}

export function fetchInstitutionModules(institutionId: number) {
  return api.get(`/institutions/${institutionId}/modules`)
}

export function updateInstitutionModules(institutionId: number, modules: { key: string; enabled: boolean }[]) {
  return api.put(`/institutions/${institutionId}/modules`, { modules })
}
