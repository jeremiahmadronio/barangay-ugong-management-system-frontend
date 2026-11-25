export interface User {
  id: string
  name: string
  email: string
  role: string
  accountType: string
  departments: string[]
  status: 'Active' | 'Inactive' | 'Locked'
  lastLogin: string
}
