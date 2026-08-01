import { http } from '../client'

export interface OfficerOption {
  id: number
  personId: number
  name: string
  position: string
  departmentName: string
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
}
