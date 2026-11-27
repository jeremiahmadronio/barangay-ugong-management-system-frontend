export interface Department {
  id: string | number
  name: string
  code?: string
}

export interface Permission {
  id: string | number
  name: string
  code?: string
  permissionName?: string
  category?: string
}

export interface PersonOption {
  id: number
  fullName: string
  contactNumber?: string
  completeAddress?: string
  personId?: number
}

export interface Role {
  id: string | number
  name: string
  code: string
  permissions?: Permission[]
}

export interface Purok {
  id: string | number
  name: string
}

export interface BarangayInfo {
  id: string | number
  name: string
  municipality?: string
  province?: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  lockedUsers: number
  totalBlotter: number
  totalLupon: number
  totalVawc: number
  totalBcpc: number
  totalClearanceIssued: number
}

export interface UserDepartmentsResponse {
  userId: number
  departmentIds: number[]
  departments: Department[]
}