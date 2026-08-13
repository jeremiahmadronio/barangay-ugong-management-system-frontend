export interface FtjsIssuanceHistoryResponse {
  ftjsNumber: string
  issuedAt: string | null
  status: string | null
}

export interface FtjsBarangayCaseHistoryResponse {
  caseNumber: string
  natureOfComplaint: string
  role: string
  dateFiled: string | null
  status: string
}

export interface FtjsResidentSearchResponse {
  residentId: number
  fullName: string
  age: number | null
  gender: string | null
  civilStatus: string | null
  contactNumber: string | null
  completeAddress: string | null
  residencyDate: string | null
  hasAvailedFtjs: boolean
  priorTrackingNumber: string | null
  priorDateSubmitted: string | null
  issuanceHistories: FtjsIssuanceHistoryResponse[]
  caseHistoryList: FtjsBarangayCaseHistoryResponse[]
}

export interface FtjsRequestEntryPayload {
  residentId: number
  ftjsNumber?: string
  dateFiled?: string
  releasedBy?: string
  purpose: string
  educationalAttainment: string
  gradeLevel: string
  institution: string
  validId?: string | number[] | Uint8Array | null
  oathTaking?: string | number[] | Uint8Array | null
}

export interface FtjsStatsResponse {
  totalCertificatesIssued: number
  totalCertificatedThisMonth: number
  issuedThisMonthTrendPercentage: number
  issuedThisMonthTrendHint: string
  originalIssuances: number
  reIssuances: number
}

export interface FtjsTableDTO {
  id: number
  trackingNumber: string
  fullName: string
  issuanceCount: number
  status: string
  purpose: string
  dateSubmitted: string
  isResident: boolean
}

export interface FtjsTableQueryParams {
  page?: number
  size?: number
  search?: string
  status?: string
  purpose?: string
  issuanceCount?: string | number
}

export interface SpringPageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface RequestNewFtjsPayload {
  ftjsId: number
  reason: string
  dateOfLoss: string
  orNumber: string
  amountPaid: number
  affidavitFiles?: string
}

