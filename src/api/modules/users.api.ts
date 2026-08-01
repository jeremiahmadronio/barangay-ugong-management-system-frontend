import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { User } from '@/data/users'

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    return http.get<User[]>(ENDPOINTS.USERS.BASE)
  },

  getById: async (id: string | number): Promise<User> => {
    return http.get<User>(ENDPOINTS.USERS.DETAIL(id))
  },

  create: async (data: Partial<User>): Promise<User> => {
    return http.post<User>(ENDPOINTS.USERS.BASE, data)
  },

  update: async (id: string | number, data: Partial<User>): Promise<User> => {
    return http.put<User>(ENDPOINTS.USERS.DETAIL(id), data)
  },

  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(ENDPOINTS.USERS.DETAIL(id))
  },

  lockUnlock: async (id: string | number, locked: boolean): Promise<void> => {
    return http.patch<void>(ENDPOINTS.ROOTADMIN.USERS.LOCK_UNLOCK(id), { locked })
  },
}
