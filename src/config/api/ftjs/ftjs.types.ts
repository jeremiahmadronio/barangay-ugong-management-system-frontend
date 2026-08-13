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

export interface ReIssuanceRequestDto {
  ftjsId?: number
  reason: string
  dateOfLoss: string
  orNumber: string
  affidavit?: string | number[] | null
}

// ── FTJS Detail View Types ─────────────────────────────────────────────────

export interface ResidentDetailDto {
  id: number
  lastName: string | null
  firstName: string | null
  middleName: string | null
  fullName: string | null
  contactNumber: string | null
  age: number | null
  gender: string | null
  civilStatus: string | null
  email: string | null
  completeAddress: string | null
  residencyDate: string | null
  residentNumber: string | null
}

export interface FtjsDetailResponse {
  ftjsApplicationNumber: string
  applicantFullName: string
  purpose: string
  detail: ResidentDetailDto | null
  status: string
  issuanceCount: number
  educationalAttainment: string | null
  course: string | null
  institution: string | null
  verifiedBy: string | null
  dateReleased: string | null
  validId: string | number[] | null
  oath: string | number[] | null
}

export interface FtjsTimelineDto {
  id: number
  title: string
  description: string | null
  timelineType: string
  eventDate: string
  actorName: string | null
}

export interface FtjsNoteResponse {
  id: number
  ftjsId: number
  note: string
  createdBy: string | null
  createdAt: string
}

export interface ReIssuanceHistoryDto {
  id: number
  issuanceNumber: number
  dateOfLoss: string | null
  reason: string | null
  orNumber: string | null
  affidavitFiles: string | number[] | null
  requestedAt: string
  requestedBy: string | null
  providedBy?: string | null
}
