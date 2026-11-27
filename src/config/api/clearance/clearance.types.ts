export interface TemplateOptionResponse {
  id: number
  certTitle: string
}

export interface BodySectionItem {
  id: string
  text: string
  isEditable?: boolean
}

export interface TemplateDetailResponse {
  id: number
  certTitle: string
  bodySections: BodySectionItem[] | string
  issueFields: string[] | string
  requiresPhoto: boolean
  requiresThumbmark: boolean
  validityMonths: number
  footerText: string
  isArchived: boolean
}

export interface ClearanceIssuanceHistoryItem {
  certNumber: string
  certTitle: string
  issuedAt: string
  status: string
}

export interface ClearanceCaseHistoryItem {
  caseNumber: string
  incidentNature: string
  role: string
  createdAt: string
  status: string
}

export interface ClearanceResidentSearchResponse {
  residentId: number
  personId?: number
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  fullName: string
  age?: number
  gender?: string
  civilStatus?: string
  contactNumber?: string
  completeAddress?: string
  birthDate?: string
  placeOfBirth?: string
  residencyDate?: string
  issuanceHistory: ClearanceIssuanceHistoryItem[]
  caseHistory: ClearanceCaseHistoryItem[]
}

export interface IssueClearancePayload {
  templateId: number
  personId?: number
  requestorName?: string
  fieldValues?: Record<string, unknown>
  orNumber?: string
  ctnNumber?: string
  remarks?: string
}

export interface IssueClearanceResult {
  success: boolean
  message: string
  certificateNumber: string
  issuedId: number
}

export interface ClearanceStatsResponse {
  totalIssued: number
  issuedThisMonth: number
  mostIssuedCert: string
  mostCommonPurpose: string
}

export interface IssuedCertificateHistoryItem {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  createdAt: string
  issuingOfficerName?: string
  fieldValues?: Record<string, unknown>
}

export interface IssuedCertificateTableResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  createdAt: string
  fieldValues?: Record<string, unknown>
  totalIssuances?: number
  history?: IssuedCertificateHistoryItem[]
}

export interface ClearanceOfficerSummary {
  id: number
  fullName: string
  username: string
  roleName?: string
  employeeId?: string
}

export interface ClearanceApplicantSummary {
  personId?: number
  residentId?: number
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  fullName: string
  age?: number
  gender?: string
  civilStatus?: string
  contactNumber?: string
  email?: string
  completeAddress?: string
  birthDate?: string
  placeOfBirth?: string
  citizenship?: string
  occupation?: string
  barangayIdNumber?: string
  isResident: boolean
}

export interface IssuedCertificateDetailResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  templateCode?: string
  purpose: string
  orNumber?: string
  ctnNumber?: string
  amountPaid: number
  isFree: boolean
  signatoryName?: string
  signatoryPosition?: string
  status: string
  expiryDate?: string
  createdAt: string
  updatedAt?: string
  fieldValues?: Record<string, unknown>
  isArchived?: boolean
  archivedAt?: string
  archiveRemarks?: string
  issuingOfficer?: ClearanceOfficerSummary
  applicant?: ClearanceApplicantSummary
  totalIssuances: number
  history: IssuedCertificateHistoryItem[]
}

export interface ClearanceArchiveItemResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  archiveRemarks: string
  status: string
  expiryDate?: string
  archivedAt: string
  createdAt: string
}

export interface ClearanceRecentDeleteItemResponse {
  id: number
  certNumber: string
  templateId?: number
  certTitle: string
  personId?: number
  requestorName: string
  orNumber?: string
  ctnNumber?: string
  purpose: string
  status: string
  expiryDate?: string
  deletedAt: string
  createdAt: string
}

export interface ClearanceArchivePageResponse {
  content: ClearanceArchiveItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface ClearanceRecentDeletePageResponse {
  content: ClearanceRecentDeleteItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface ClearanceLifecycleKpiResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalRecentlyDeleted: number
  totalRecentlyDeletedThisMonth: number
}

export interface ClearanceReportKpiResponse {
  startDate: string
  endDate: string
  templateId?: number
  totalIssued: number
  mostIssuedCertName: string
  mostIssuedCertCount: number
  totalExpired: number
  maleCount: number
  femaleCount: number
  malePercentage: number
  femalePercentage: number
}

export interface ClearanceDailyTrendResponse {
  date: string
  label: string
  dayOfMonth: number
  totalIssued: number
}

export interface ClearanceMonthlyTrendResponse {
  monthLabel: string
  year: number
  month: number
  totalIssued: number
}

export interface ClearanceTypeBreakdownItem {
  certTitle: string
  count: number
  percentage: number
}

export interface ClearanceTypeBreakdownResponse {
  startDate: string
  endDate: string
  totalVolume: number
  breakdown: ClearanceTypeBreakdownItem[]
}

export interface ClearancePurposeBreakdownItem {
  purpose: string
  count: number
  percentage: number
}

export interface ClearancePurposeBreakdownResponse {
  startDate: string
  endDate: string
  totalVolume: number
  highestPurpose: string
  highestCount: number
  breakdown: ClearancePurposeBreakdownItem[]
}

export interface ClearanceDashboardKpiResponse {
  today: string
  weekStartDate: string
  weekEndDate: string
  totalIssuedToday: number
  totalIssuedThisWeek: number
  totalActiveClearances: number
  mostIssuedCertThisWeek: string
  mostIssuedCertCountThisWeek: number
}
