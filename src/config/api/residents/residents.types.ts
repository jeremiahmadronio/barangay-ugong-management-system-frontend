// src/config/api/residents/residents.types.ts

export type ResidentStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED' | 'MOVED_OUT' | 'ARCHIVED'

export interface StatMetric {
  count: number
  percentageChange: number
  trendDirection: 'UP' | 'DOWN' | 'NEUTRAL'
  trendText: string
}

export interface ResidentStatsResponse {
  totalResidents: StatMetric
  headsOfFamily: StatMetric
  seniorCitizens: StatMetric
  residentsThisMonth: StatMetric
}

export interface ResidentTableResponse {
  id: number
  barangayIdNumber: string
  photoBase64?: string
  fullName: string
  firstName?: string
  lastName?: string
  middleName?: string
  contactNumber?: string
  email?: string
  completeAddress?: string
  householdNumber?: string
  isHeadOfFamily: boolean
  status: ResidentStatus
  age: number
  gender: string
  civilStatus?: string
  dateOfResidency?: string
  createdAt?: string
}

export interface PersonSummaryInfo {
  personId?: number
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  gender?: string
  birthDate?: string
  age?: number
  civilStatus?: string
  contactNumber?: string
  email?: string
  emailAddress?: string
  completeAddress?: string
  occupation?: string
}

export interface ResidentFileRequest {
  fileName: string
  fileType: string
  fileBase64: string
}

export interface ResidentFileResponse {
  id: number
  fileName: string
  fileType: string
  fileBase64?: string
}

export interface ResidentDetailResponse {
  id: number
  barangayIdNumber: string
  householdNumber?: string
  isHeadOfFamily: boolean
  status: ResidentStatus
  statusRemarks?: string
  citizenship?: string
  educationalAttainment?: string
  dateOfResidency?: string
  personInfo: PersonSummaryInfo
  photoBase64?: string
  familyAssociations?: ResidentRelativeResponse[]
  attachedFiles?: ResidentFileResponse[]
  createdAt?: string
  updatedAt?: string
}

export interface ResidentFilterRequest {
  search?: string
  status?: ResidentStatus | 'all'
  gender?: string
  ageGroup?: string
}

export interface ResidentCreateRequest {
  firstName: string
  lastName: string
  middleName?: string
  suffix?: string
  contactNumber?: string
  email?: string
  completeAddress?: string
  gender?: string
  civilStatus?: string
  occupation?: string
  birthDate?: string
  age?: number

  barangayIdNumber?: string
  householdNumber?: string
  isHeadOfFamily?: boolean
  educationalAttainment?: string
  citizenship?: string
  dateOfResidency?: string
  status?: ResidentStatus
  photoBase64?: string
  familyAssociations?: FamilyAssociationEntry[]
  attachedFiles?: ResidentFileRequest[]
}

export interface ResidentUpdateRequest {
  firstName: string
  lastName: string
  middleName?: string
  suffix?: string
  contactNumber?: string
  email?: string
  completeAddress?: string
  gender?: string
  civilStatus?: string
  occupation?: string
  birthDate?: string
  age?: number

  barangayIdNumber?: string
  householdNumber?: string
  isHeadOfFamily?: boolean
  educationalAttainment?: string
  citizenship?: string
  dateOfResidency?: string
  status?: ResidentStatus
  statusRemarks?: string
  photoBase64?: string
  familyAssociations?: FamilyAssociationEntry[]
  attachedFiles?: ResidentFileRequest[]
}

export interface ResidentStatusUpdateRequest {
  status: ResidentStatus
  remarks?: string
}

export interface ResidentSuggestionsResponse {
  suggestedBarangayId: string
  suggestedHouseholdNumber: string
}

export interface ResidentRelativeResponse {
  id: number
  fullName: string
  address?: string
  age?: number
  gender?: string
  civilStatus?: string
  contactNumber?: string
  householdNumber?: string
  barangayIdNumber?: string
  status?: string
  relationshipType?: string
  photoBase64?: string
}

/** A single family association entry: which resident, and what relationship from the new resident's POV. */
export interface FamilyAssociationEntry {
  /** ID of the already-registered resident being associated */
  relatedResidentId: number
  /** Relationship label from the new resident's perspective (e.g. "Father") */
  relationship: string
  /** Auto-computed reverse label stored on the other resident (e.g. "Son") */
  reverseRelationship: string
}

