export interface ArchiveSettingsResponse {
  autoDeleteEnabled: boolean
  deleteAfterDays: number
}

export interface ArchiveStatsResponse {
  totalArchived: number
  totalArchivedResidents: number
  totalArchivedOfficers: number
  totalArchivedUsers: number
  totalDeleted: number
  totalDeletedResidents: number
  totalDeletedOfficers: number
  totalDeletedUsers: number
}

export interface ArchivedResident {
  id: number
  fullName: string
  barangayId: string
  contact: string
  status: string
  deletedAt?: string
}

export interface ArchivedUser {
  id: string
  fullName: string
  email: string
  role: string
  departments: string
  status: string
  lastLogin: string
  deletedAt?: string
}

export interface ArchivedOfficer {
  id: number
  employee: string
  department: string
  position: string
  status: string
  statusRemarks: string
  deletedAt?: string
}
