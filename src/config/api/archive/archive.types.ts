export interface ArchiveSettingsResponse {
  autoDeleteEnabled: boolean
  deleteAfterDays: number
}

export interface ArchiveStatsResponse {
  totalArchived: number
  totalArchivedResidents: number
  totalArchivedOfficers: number
  totalArchivedUsers: number
}

export interface ArchivedResident {
  id: number
  fullName: string
  barangayId: string
  contact: string
  status: string
}

export interface ArchivedUser {
  id: string
  fullName: string
  email: string
  role: string
  departments: string
  status: string
  lastLogin: string
}

export interface ArchivedOfficer {
  id: number
  employee: string
  department: string
  position: string
  status: string
  statusRemarks: string
}
