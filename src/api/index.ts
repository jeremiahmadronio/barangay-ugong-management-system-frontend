export * from './client'
export * from './endpoints'
export * from './types'
export * from './modules/auth.api'
export * from './modules/users.api'
export * from './modules/residents.api'
export * from './modules/blotter.api'

// Unified Shared API object for clean & convenient access
import { authApi } from './modules/auth.api'
import { usersApi } from './modules/users.api'
import { residentsApi } from './modules/residents.api'
import { blotterApi } from './modules/blotter.api'

export const api = {
  auth: authApi,
  users: usersApi,
  residents: residentsApi,
  blotter: blotterApi,
} as const
