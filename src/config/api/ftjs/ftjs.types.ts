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
  sort?: string
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
  reason?: string
  dateOfLoss?: string
  orNumber: string
  affidavit?: string | number[] | null
  blotterCaseId?: number | null
}

export interface LinkedBlotterResponseDTO {
  blotterId: number
  blotterNumber: string
  caseType: string
  mainCaseStatus: string
  documentReissuanceStatus: string
  documentReissuanceRemarks?: string | null
  natureOfComplaint: string
  dateOfIncident: string
  timeOfIncident?: string | null
  placeOfIncident: string
  reason: string
  hasAffidavit: boolean
  affidavitEvidenceId?: number | null
  affidavitFileName?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  isAlreadyReissued: boolean
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
  birthDate?: string | null
  dateOfBirth?: string | null
  birthday?: string | null
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

// ── FTJS Archive Types ───────────────────────────────────────────────────

export interface FtjsArchiveStatsResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalArchiveThisMonthTrend?: string
  totalArchiveOriginalIssuance: number
  totalRecentlyDeleted: number
}

export interface FtjsArchiveTableItem {
  id: number
  ftjsId?: number
  trackingNumber: string
  fullName: string
  issuanceCount: number
  status: string
  purpose: string
  dateSubmitted: string
  archivedAt?: string
  deletedAt?: string
}


// ── FTJS Reports & Analytics Types ─────────────────────────────────────────

export interface FtjsReportFilterParams {
  dateFrom?: string
  dateTo?: string
  purpose?: string
  sex?: string
  status?: string
  educationalAttainment?: string
}

export interface FtjsReportKpiResponse {
  totalRecords: number
  totalRecordsSubtitle: string
  firstTimeIssuances: number
  firstTimeIssuanceShare: number
  firstTimeIssuanceSubtitle: string
  mostCommonPurpose: string
  mostCommonPurposeShare: number
  mostCommonPurposeSubtitle: string
  mostCommonAgeRange: string
  mostCommonAgeRangeShare: number
  mostCommonAgeRangeSubtitle: string
}

export interface TrendPointDto {
  label: string
  issued: number
  pointDate?: string
}

export interface TrendReportResponse {
  granularityLabel: string
  rangeLabel: string
  points: TrendPointDto[]
  busiestPoint: TrendPointDto | null
  slowestPoint: TrendPointDto | null
}

export interface EducationDistributionPointDto {
  educationalAttainment: string
  applicantCount: number
}

export interface EducationDistributionResponse {
  points: EducationDistributionPointDto[]
  highestLabel: string | null
  highestCount: number
  totalVolume: number
}

export interface PurposeDistributionPointDto {
  purpose: string
  count: number
  share: number
}

export interface PurposeDistributionResponse {
  points: PurposeDistributionPointDto[]
  totalVolume: number
}

export interface IssuanceTypePointDto {
  typeLabel: string
  count: number
  share: number
}

export interface IssuanceTypeDistributionResponse {
  points: IssuanceTypePointDto[]
  totalVolume: number
}

export interface FtjsReportTableItemDto {
  id: number
  applicationNo: string
  applicantName: string
  issuanceCount: number
  purpose: string
  status: string
  dateSubmitted: string
  gender?: string | null
  age?: number | null
  educationalAttainment?: string | null
  institution?: string | null
  releasedBy?: string | null
}

export interface FtjsDashboardSummaryDto {
  issuedToday: number
  issuedThisWeek: number
  femaleBeneficiaries: number
  femalePercentage: number
  youthEntrants: number
  youthPercentage: number
  totalActiveVolume: number
}
