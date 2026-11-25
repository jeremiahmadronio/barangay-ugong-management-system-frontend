export type UserRole =
  | 'rootadmin'
  | 'admin'
  | 'official'
  | 'blotter'
  | 'lupon'
  | 'vawc'
  | 'bcpc'
  | 'clearance'
  | 'ftjs'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
  contactNumber?: string
  totpEnabled?: boolean
  permissions?: string[]
}
