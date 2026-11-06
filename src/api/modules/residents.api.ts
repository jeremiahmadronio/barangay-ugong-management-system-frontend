import { http } from '../client'
import { ENDPOINTS } from '../endpoints'

export interface ResidentRecord {
  id: string
  name: string
  address: string
  civilStatus: string
  voterStatus: string
  contactNo: string
}

export interface ResidentSearchOption {
  id: number
  personId: number
  fullName: string
  firstName?: string
  lastName?: string
  middleName?: string
  barangayIdNumber?: string
  email?: string
  contactNumber?: string
  completeAddress?: string
  age?: number
  gender?: string
  civilStatus?: string
  status?: string
  photoBase64?: string
  birthDate?: string | null
  birthday?: string | null
}

export interface ResidentTableItem {
  id: number
  personId: number
  fullName: string
  firstName: string
  lastName: string
  middleName: string
  completeAddress: string
  contactNumber: string
  gender: string
  age: number
  civilStatus: string
  barangayIdNumber: string
}

export const residentsApi = {
  getAll: async (): Promise<ResidentRecord[]> => {
    return http.get<ResidentRecord[]>(ENDPOINTS.RESIDENTS.BASE)
  },

  searchActive: async (search?: string): Promise<ResidentSearchOption[]> => {
    try {
      return await http.get<ResidentSearchOption[]>('/api/v1/residents/search-active', {
        params: search ? { search } : {},
      })
    } catch {
      return []
    }
  },

  getTable: async (search?: string): Promise<ResidentTableItem[]> => {
    try {
      return await http.get<ResidentTableItem[]>('/api/v1/residents/table', {
        params: search ? { search } : {},
      })
    } catch {
      return []
    }
  },

  getById: async (id: string | number): Promise<ResidentRecord> => {
    return http.get<ResidentRecord>(ENDPOINTS.RESIDENTS.DETAIL(id))
  },

  getDetails: async (id: string | number): Promise<any> => {
    try {
      return await http.get(`/api/v1/residents/${id}/details`)
    } catch {
      return null
    }
  },

  create: async (data: Partial<ResidentRecord>): Promise<ResidentRecord> => {
    return http.post<ResidentRecord>(ENDPOINTS.RESIDENTS.BASE, data)
  },

  update: async (id: string | number, data: Partial<ResidentRecord>): Promise<ResidentRecord> => {
    return http.put<ResidentRecord>(ENDPOINTS.RESIDENTS.DETAIL(id), data)
  },

  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(ENDPOINTS.RESIDENTS.DETAIL(id))
  },
}
