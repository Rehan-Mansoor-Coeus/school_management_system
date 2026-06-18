import api from './client'

export type PeopleEntity = 'customers' | 'billers' | 'suppliers' | 'students' | 'teachers' | 'staff'

export type PeopleRecord = {
  id: number
  name: string
  email?: string | null
  phone_number: string
  additional_phone_number?: string | null
  address?: string | null
  status: 'active' | 'inactive'
  role_ids?: number[]
  roles?: number[]
}

export const fetchPeople = (entity: PeopleEntity, params?: { search?: string; status?: string; page?: number }) =>
  api.get(`/people/${entity}`, { params })

export const createPerson = (entity: PeopleEntity, payload: Partial<PeopleRecord>) =>
  api.post(`/people/${entity}`, payload)

export const updatePerson = (entity: PeopleEntity, id: number, payload: Partial<PeopleRecord>) =>
  api.put(`/people/${entity}/${id}`, payload)

export const deletePerson = (entity: PeopleEntity, id: number) =>
  api.delete(`/people/${entity}/${id}`)

export const bulkDeletePeople = (entity: PeopleEntity, ids: number[]) =>
  api.post(`/people/${entity}/bulk-delete`, { ids })

export const searchPeopleRecipients = (query: string, source: string) =>
  api.get('/people/recipients/search', { params: { query, source } })
