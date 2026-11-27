import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'


export interface CaseHistoryItemBackend {
  id: number
  caseNumber: string
  dateFiledFormatted: string
  status: string
  isCurrent?: boolean
  isPast?: boolean
  isLatestActive?: boolean
}

export interface BlotterTableRowResponse {
  rootCaseId: number
  rootCaseNumber: string
  latestActiveCaseId: number
  latestCaseNumber: string
  filingType: string
  cycleCount: number
  isReopened: boolean
  effectiveStatus: 'PENDING' | 'UNDER_MEDIATION' | 'UNDER_CONCILIATION' | 'SETTLED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED' | 'REOPENED'
  complainantFullName: string
  respondentFullName: string
  dateFiled: string
}

export interface BlotterBackendResponse {
  id: number
  caseNumber: string
  filingType: 'FORMAL_COMPLAINT' | 'FOR_RECORD_ONLY'
  caseStatus: 'PENDING' | 'UNDER_MEDIATION' | 'UNDER_CONCILIATION' | 'SETTLED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  complainantName?: string
  complainantContact?: string
  complainantAddress?: string
  respondentName?: string
  respondentContact?: string
  respondentAddress?: string
  relationshipToComplainant?: string
  natureOfComplaint?: string
  dateOfIncident?: string
  timeOfIncident?: string
  incidentLocation?: string
  injuriesDamagesDescription?: string
  statementText?: string
  statementSummary?: string
  witnessCount?: number
  createdAt: string
  updatedAt: string
  dateFiledFormatted?: string
  rootCreatedAt?: string
  rootDateFiledFormatted?: string
  receivingOfficer?: string
  assignedOfficer?: string
  previousCaseNumber?: string
  reOpenedCaseNumber?: string
  rootCaseNumber?: string
  rootCaseId?: number
  caseHistory?: CaseHistoryItemBackend[]
  caseStatusRemarks?: string
  reopenRemarks?: string
  isExtended?: boolean
  extensionCount?: number
  extendedAt?: string
  extensionReason?: string
  extendedBy?: string

  // Nested DTO models returned by Spring Boot backend
  complainant?: {
    id?: number
    firstName?: string
    lastName?: string
    middleName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    age?: number | string
    gender?: string
    civilStatus?: string
    email?: string
  }
  respondent?: {
    id?: number
    firstName?: string
    lastName?: string
    middleName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    relationshipToComplainant?: string
    currentlyLivingWithComplainant?: boolean
    age?: number | string
    gender?: string
    occupation?: string
  }
  incident?: {
    id?: number
    natureOfComplaint?: string
    dateOfIncident?: string
    timeOfIncident?: string
    placeOfIncident?: string
    frequencyOfIncident?: string
    descriptionOfInjuries?: string
    relatedBarangayService?: string
  }
  relatedBarangayService?: string
  ftjsApplicationId?: number
  ftjsCertificateNumber?: string
  documentReissuanceStatus?: 'WAITING_FOR_BLOTTER' | 'PENDING_VERIFICATION' | 'APPROVED_FOR_REISSUANCE' | 'REJECTED' | 'COMPLETED'
  documentReissuanceRemarks?: string
  documentReissuanceReviewedBy?: string
  documentReissuanceReviewedAt?: string
  narrative?: {
    id?: number
    fileName?: string
    statementSummary?: string
    statementText?: string
    fileData?: string
  }
  evidence?: {
    id?: number
    evidenceTypeName?: string
    evidenceType?: string
    fileName?: string
    description?: string
    mediaPath?: string
    remarks?: string
    files?: string
  }
  evidences?: Array<{
    id?: number
    evidenceTypeName?: string
    evidenceType?: string
    fileName?: string
    description?: string
    mediaPath?: string
    remarks?: string
    files?: string
  }>

  witnesses?: Array<{
    id?: number
    firstName?: string
    lastName?: string
    fullName?: string
    contactNumber?: string
    completeAddress?: string
    address?: string
    testimonyText?: string
    hasTestimonyFile?: boolean
  }>
}





export interface BlotterBackendStats {
  totalCases: number
  totalCasesTrend: string
  totalForTheRecord: number
  totalForTheRecordTrend: string
  inProgressCases: number
  resolvedCases: number
  resolvedCasesTrend: string
}

export interface BlotterPaginatedResponse {
  content: (BlotterTableRowResponse | BlotterBackendResponse)[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

export const blotterApi = {
  // Fetch all blotter cases with optional search, status, nature, filingType, startDate, and endDate params
  getAll: async (params?: {
    search?: string
    status?: string
    natureOfComplaint?: string
    filingType?: string
    startDate?: string
    endDate?: string
    page?: number
    size?: number
  }): Promise<BlotterPaginatedResponse | BlotterBackendResponse[]> => {
    return http.get<BlotterPaginatedResponse | BlotterBackendResponse[]>(ENDPOINTS.BLOTTER.BASE, {
      params,
    })
  },


  // Fetch summary statistics
  getStats: async (): Promise<BlotterBackendStats> => {
    return http.get<BlotterBackendStats>(`${ENDPOINTS.BLOTTER.BASE}/stats`)
  },

  // Fetch single case detail by ID
  getById: async (id: string | number): Promise<BlotterBackendResponse> => {
    return http.get<BlotterBackendResponse>(ENDPOINTS.BLOTTER.DETAIL(String(id)))
  },

  // Create new Blotter Case (Formal Complaint or For the Record)
  create: async (formData: ComplaintFormData): Promise<BlotterBackendResponse> => {
    let narrativeFileData: string | null = null
    if (formData.narrative?.file) {
      try {
        narrativeFileData = await fileToBase64(formData.narrative.file)
      } catch {
        narrativeFileData = null
      }
    }

    const mappedEvidences = await Promise.all(
      (formData.selectedEvidenceIds || []).map(async (id) => {
        const matchedItem = DEFAULT_EVIDENCE_ITEMS.find((item) => item.id === id)
        const attachedFile = formData.evidenceFiles?.[id]
        let base64Files: string | null = null
        if (attachedFile) {
          try {
            base64Files = await fileToBase64(attachedFile)
          } catch {
            base64Files = null
          }
        }
        return {
          evidenceTypeName: matchedItem ? matchedItem.label : id,
          fileName: attachedFile ? attachedFile.name : (matchedItem ? `${matchedItem.label}.png` : 'evidence.png'),
          description: matchedItem ? matchedItem.label : undefined,
          files: base64Files,
        }
      }),
    )


    if (formData.otherEvidence?.trim()) {
      mappedEvidences.push({
        evidenceTypeName: formData.otherEvidence.trim(),
        files: null,
      })
    }

    const mappedWitnesses = await Promise.all(
      (formData.witnesses || []).map(async (w) => {
        let testimonyBase64: string | null = null
        if (w.testimonyFile) {
          try {
            testimonyBase64 = await fileToBase64(w.testimonyFile)
          } catch {
            testimonyBase64 = null
          }
        }
        return {
          firstName: w.firstName,
          lastName: w.lastName,
          contactNumber: w.contactNumber,
          completeAddress: `${w.houseStreet || ''}, ${w.barangay || ''}, ${w.city || ''}, ${w.province || ''}`.replace(/^,\s*/, ''),
          testimonyText: null,
          testimonyFileName: w.testimonyFile ? w.testimonyFile.name : (w.testimonyFileName || null),
          testimonyFile: testimonyBase64,
        }
      }),
    )



    const isNoRespondent =
      formData.respondentType === 'NO_RESPONDENT' ||
      formData.respondent?.respondentType === 'NO_RESPONDENT' ||
      formData.respondent?.relationshipToComplainant === 'None (No Respondent)' ||
      (!formData.respondent?.lastName?.trim() && !formData.respondent?.firstName?.trim())

    const respondentPayload = isNoRespondent
      ? null
      : {
          lastName: formData.respondent.lastName?.trim() || 'N/A',
          firstName: formData.respondent.firstName?.trim() || 'Respondent',
          middleName: formData.respondent.middleName || '',
          contactNumber: formData.respondent.contactNumber || '',
          age: formData.respondent.age ? parseInt(String(formData.respondent.age), 10) : null,
          gender: formData.respondent.gender || '',
          civilStatus: formData.respondent.civilStatus || '',
          occupation: formData.respondent.occupation || '',
          completeAddress: `${formData.respondent.houseStreet || ''}, ${formData.respondent.barangay || ''}, ${formData.respondent.city || ''}, ${formData.respondent.province || ''}`.replace(/^,\s*/, ''),
          relationshipToComplainant: formData.respondent.relationshipToComplainant || '',
          currentlyLivingWithComplainant: formData.respondent.currentlyLivingWithComplainant === 'Yes',
        }

    const payload = {
      filingType: formData.mode === 'FORMAL_COMPLAINT' ? 'FORMAL_COMPLAINT' : 'FOR_RECORD_ONLY',
      caseNumber: formData.caseInfo.caseNumber?.trim() || undefined,
      dateFiled: formData.caseInfo.dateFiled,
      timeFiled: formData.caseInfo.timeFiled,
      receivingOfficer: formData.caseInfo.receivingOfficer,
      assignedOfficerId: formData.caseInfo.assignedOfficerId,
      assignedOfficer: formData.caseInfo.assignedOfficer,

      complainant: {
        lastName: formData.complainant.lastName?.trim() || 'N/A',
        firstName: formData.complainant.firstName?.trim() || 'Complainant',
        middleName: formData.complainant.middleName || '',
        contactNumber: formData.complainant.contactNumber || '',
        age: formData.complainant.age ? parseInt(String(formData.complainant.age), 10) : null,
        gender: formData.complainant.gender || '',
        civilStatus: formData.complainant.civilStatus || '',
        email: formData.complainant.email || '',
        completeAddress: `${formData.complainant.houseStreet || ''}, ${formData.complainant.barangay || ''}, ${formData.complainant.city || ''}, ${formData.complainant.province || ''}`.replace(/^,\s*/, ''),
      },
      respondent: respondentPayload,
      incident: {
        natureOfComplaint: formData.incident.natureOfComplaint?.trim() || 'General Complaint',
        dateOfIncident: formData.incident.dateOfIncident || '',
        timeOfIncident: formData.incident.timeOfIncident || '',
        placeOfIncident: formData.incident.placeOfIncident?.trim() || 'Barangay Area',
        frequencyOfIncident: formData.incident.frequencyOfIncident || '',
        descriptionOfInjuries: formData.incident.descriptionOfInjuries || '',
        relatedBarangayService: formData.incident.relatedBarangayService || formData.relatedBarangayService || undefined,
      },
      narrative: {
        fileName: formData.narrative?.fileName || 'statement.txt',
        statementSummary: formData.narrative?.statementText || 'No statement summary provided',
        fileData: narrativeFileData,
      },
      evidences: mappedEvidences,
      witnesses: mappedWitnesses,
      isCertified: formData.isCertified,
      relatedBarangayService: formData.relatedBarangayService || formData.incident.relatedBarangayService || undefined,
      ftjsApplicationId: formData.ftjsApplicationId || undefined,
    }

    return http.post<BlotterBackendResponse>(ENDPOINTS.BLOTTER.BASE, payload)
  },

  // Search eligible FTJS applications for Affidavit of Loss linkage
  searchFtjs: async (query?: string): Promise<any[]> => {
    return http.get<any[]>(`${ENDPOINTS.BLOTTER.BASE}/search-ftjs`, {
      params: query ? { query } : undefined,
    })
  },

  // Verify or reject document reissuance clearance
  verifyDocumentReissuance: async (
    caseId: string | number,
    data: { action: 'APPROVE' | 'REJECT'; remarks?: string }
  ): Promise<string> => {
    return http.post<string>(`${ENDPOINTS.BLOTTER.BASE}/${caseId}/verify-document-reissuance`, data)
  },

  // Update Case details via Serbisyoko-Web PUT /api/v1/blotter/{id}
  updateCase: async (id: string | number, payload: any): Promise<BlotterBackendResponse> => {
    return http.put<BlotterBackendResponse>(`${ENDPOINTS.BLOTTER.BASE}/${id}`, payload)
  },


  // Update status (e.g. PENDING -> RESOLVED / SETTLED)
  updateStatus: async (id: string | number, status: string, remarks?: string): Promise<BlotterBackendResponse> => {
    return http.patch<BlotterBackendResponse>(`/api/v1/blotter/${id}/status`, { status, remarks })
  },

  reopenCase: async (id: string | number, remarks: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(`/api/v1/blotter/${id}/reopen`, { remarks })
  },

  // Extend mediation period by 15 days (one-time allowable extension)
  extendCase: async (id: string | number, reason: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(ENDPOINTS.BLOTTER.EXTEND(id), { reason })
  },

  // Refer / Escalate case to Lupon Tagapamayapa
  referToLupon: async (caseNumber: string, memberList: { officerId: number; position: string }[]): Promise<any> => {
    return http.post<any>(`/api/v1/blotter/refer/${encodeURIComponent(caseNumber)}`, { memberList })
  },

  // Archive / Delete case
  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(ENDPOINTS.BLOTTER.DETAIL(String(id)))
  },

  // Case Notes
  getCaseNotes: async (caseId: string | number): Promise<CaseNoteResponse[]> => {
    return http.get<CaseNoteResponse[]>(`/api/v1/blotter/${caseId}/notes`)
  },

  addCaseNote: async (caseId: string | number, note: string): Promise<CaseNoteResponse> => {
    return http.post<CaseNoteResponse>(`/api/v1/blotter/${caseId}/notes`, { note })
  },

  // Timeline
  getTimeline: async (caseId: string | number): Promise<TimelineEventResponse[]> => {
    return http.get<TimelineEventResponse[]>(`/api/v1/blotter/${caseId}/timeline`)
  },

  // --- Blotter Reports API Endpoints ---
  getReportKpi: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<BlotterReportKpiResponse> => {
    return http.get<BlotterReportKpiResponse>('/api/v1/blotter/report-kpi', { params })
  },

  getMonthlyTrend: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<MonthlyCaseTrendResponse[]> => {
    return http.get<MonthlyCaseTrendResponse[]>('/api/v1/blotter/monthly-trend', { params })
  },

  getDailyTrend: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<DailyCaseTrendResponse[]> => {
    return http.get<DailyCaseTrendResponse[]>('/api/v1/blotter/daily-trend', { params })
  },

  getSettlementEfficiency: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<SettlementEfficiencyResponse> => {
    return http.get<SettlementEfficiencyResponse>('/api/v1/blotter/settlement-efficiency', { params })
  },

  getStatusBreakdown: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<CaseStatusBreakdownResponse> => {
    return http.get<CaseStatusBreakdownResponse>('/api/v1/blotter/status-breakdown', { params })
  },

  getFormalResolutionReport: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<FormalComplaintReportResponse> => {
    return http.get<FormalComplaintReportResponse>('/api/v1/blotter/formal-complaints/resolution-efficiency', { params })
  },

  // Archive & Trash Vault API Endpoints
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>('/api/v1/blotter/archive-kpi')
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>('/api/v1/blotter/archive-table', { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>('/api/v1/blotter/recent-delete', { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(`/api/v1/blotter/archive-case/${id}`, { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/blotter/${id}/restore-archive`)
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/blotter/${id}/soft-delete`)
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(`/api/v1/blotter/${id}/permanent-delete`)
  },

  getDashboardKpi: async (): Promise<BlotterDashboardKpiResponse> => {
    return http.get<BlotterDashboardKpiResponse>('/api/v1/blotter/dashboard-kpi')
  },

  getRecentCasesToday: async (): Promise<RecentBlotterCaseResponse[]> => {
    return http.get<RecentBlotterCaseResponse[]>('/api/v1/blotter/recent-today')
  },

  getQuickTodayMediations: async (): Promise<QuickMediationSummaryDto[]> => {
    return http.get<QuickMediationSummaryDto[]>('/api/v1/blotter/mediations-today-summary')
  },
}

export interface RecentBlotterCaseResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  filingType: 'FORMAL_COMPLAINT' | 'FOR_RECORD_ONLY'
  status: string
  createdAt: string
}

export interface QuickMediationSummaryDto {
  sessionId: number
  caseNumber: string
  partiesSummary: string
  summonNumber: number
  scheduledStart: string
  venue?: string
}

export interface BlotterDashboardKpiResponse {
  weekStartDate: string
  weekEndDate: string
  totalNewCasesThisWeek: number
  totalPendingCases: number
  upcomingMediationsThisWeek: number
  totalUnresolvedCases: number
}

export interface BlotterReportKpiResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  settledCases: number
  settlementRate: number
  activeMediations: number
  luponReferrals: number
}

export interface MonthlyCaseTrendResponse {
  monthLabel: string
  year: number
  month: number
  totalCases: number
}

export interface DailyCaseTrendResponse {
  date: string
  label?: string
  dayLabel?: string
  dayOfMonth: number
  totalCases: number
}

export interface SettlementEfficiencyResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  totalFormalComplaints: number
  totalSettledCases: number
  settlementRate: number
}

export interface CaseStatusBreakdownResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  breakdown: Array<{
    status: string
    label: string
    count: number
    percentage: number
  }>
}

export interface FormalComplaintReportResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalFormalComplaints: number
  resolutionBreakdown?: {
    settledAtBlotter: number
    settledRate: number
    referredToLupon: number
    referredRate: number
    pendingAtBlotter: number
    pendingRate: number
  }
  breakdown?: {
    settledAtBlotter: number
    settledRate: number
    referredToLupon: number
    referredRate: number
    pendingAtBlotter: number
    pendingRate: number
  }
  overallSettlementRate: number
}

export interface CaseNoteResponse {
  id: number
  caseId: number
  note: string
  createdBy?: string
  createdAt: string
}

export interface TimelineEventResponse {
  id: number
  caseId: number
  eventType: string
  title: string
  description?: string
  performedBy?: string
  eventDate: string
}

export interface BlotterLifecycleKpiResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalRecentlyDeleted: number
  totalRecentlyDeletedThisMonth: number
}

export interface BlotterArchiveItemResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  archiveRemarks: string
  status: string
  archivedAt: string
  filingType: string
  classification?: string
}

export interface BlotterRecentDeleteItemResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  status: string
  deletedAt: string
  filingType: string
  classification?: string
}

export interface BlotterArchiveFilterParams {
  search?: string
  filingType?: string
  page?: number
  size?: number
}

export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  empty: boolean
}


