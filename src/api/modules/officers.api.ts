import { http } from '../client'

export interface OfficerOption {
  id: number
  personId: number
  name: string
  position: string
  departmentName: string
}

export interface LuponOfficerOption {
  officerId: number
  firstName: string
  lastName: string
  middleName?: string
  position?: string
}

export const officersApi = {
  getActiveOfficers: async (): Promise<OfficerOption[]> => {
    try {
      return await http.get<OfficerOption[]>('/api/v1/officers/table', {
        params: { status: 'ACTIVE' },
      })
    } catch {
      return []
    }
  },
  getLuponOfficers: async (): Promise<LuponOfficerOption[]> => {
    try {
      return await http.get<LuponOfficerOption[]>('/api/v1/officers/lupon')
    } catch {
      return []
    }
  },
}
