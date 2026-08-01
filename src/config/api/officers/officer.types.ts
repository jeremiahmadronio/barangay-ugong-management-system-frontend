export interface OfficerStatsResponse {
  totalOfficers: number
  totalOfficersTrend?: string
  activeOfficers: number
  inactiveStaff: number
  departmentsCount: number
}

export interface OfficerTableResponse {
  id: number
  personId?: number
  name: string
  email: string
  departmentId?: number
  departmentName: string
  position: string
  activeCases: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  isGlobal?: boolean
  photoBase64?: string
}

export interface OfficerFilterRequest {
  search?: string
  department?: string
  status?: string
}

export interface OfficerCreateRequest {
  personId: number
  departmentId?: number | null
  isGlobal?: boolean
  position: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface OfficerUpdateRequest {
  departmentId?: number | null
  isGlobal?: boolean
  position?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface OfficerStatusUpdateRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
}
