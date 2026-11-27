import { http } from '../client'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'
import type {
  BlotterArchiveFilterParams,
  BlotterArchiveItemResponse,
  BlotterBackendResponse,
  BlotterBackendStats,
  BlotterDashboardKpiResponse,
  BlotterLifecycleKpiResponse,
  BlotterPaginatedResponse,
  BlotterRecentDeleteItemResponse,
  BlotterReportKpiResponse,
  CaseNoteResponse,
  CaseStatusBreakdownResponse,
  DailyCaseTrendResponse,
  FormalComplaintReportResponse,
  MediationSession,
  MonthlyCaseTrendResponse,
  PageResponse,
  QuickMediationSummaryDto,
  RecentBlotterCaseResponse,
  RecordMediationMinutesPayload,
  ScheduleMediationPayload,
  SessionFollowUp,
  SessionMinutes,
  SettlementEfficiencyResponse,
  TimelineEventResponse,
} from './blotter.types'

const BLOTTER_API = '/api/v1/blotter'

const formatAddress = (
  address: string | undefined,
  ...parts: Array<string | undefined>
): string =>
  address?.trim() ||
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')

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

export const blotterService = {
  files: {
    narrative: (caseId: string | number | undefined) => `${BLOTTER_API}/files/narrative/${caseId}`,
    evidence: (evidenceId: string | number | undefined) => `${BLOTTER_API}/files/evidence/${evidenceId}`,
    witness: (witnessId: string | number | undefined) => `${BLOTTER_API}/files/witness/${witnessId}`,
  },
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
    return http.get<BlotterPaginatedResponse | BlotterBackendResponse[]>(BLOTTER_API, {
      params,
    })
  },


  // Fetch summary statistics
  getStats: async (): Promise<BlotterBackendStats> => {
    return http.get<BlotterBackendStats>(`${BLOTTER_API}/stats`)
  },

  // Fetch single case detail by ID
  getById: async (id: string | number): Promise<BlotterBackendResponse> => {
    return http.get<BlotterBackendResponse>(`${BLOTTER_API}/${id}`)
  },

  // Create new Blotter Case (Formal Complaint or For the Record)
  create: async (formData: ComplaintFormData): Promise<BlotterBackendResponse> => {
    let narrativeFileData: string | null = null
    if (formData.narrative?.file) {
      narrativeFileData = await fileToBase64(formData.narrative.file)
    }

    const mappedEvidences: {
      evidenceTypeName: string
      fileName?: string
      description?: string
      files: string | null
    }[] = await Promise.all(
      (formData.selectedEvidenceIds || []).map(async (id) => {
        const matchedItem = DEFAULT_EVIDENCE_ITEMS.find((item) => item.id === id)
        const attachedFile = formData.evidenceFiles?.[id]
        let base64Files: string | null = null
        if (attachedFile) {
          base64Files = await fileToBase64(attachedFile)
        }
        return {
          evidenceTypeName: matchedItem ? matchedItem.label : id,
          fileName: attachedFile?.name,
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
      (formData.witnesses || [])
        .filter((w) => w.firstName.trim() || w.lastName.trim())
        .map(async (w) => {
          let testimonyBase64: string | null = null
          if (w.testimonyFile) {
            testimonyBase64 = await fileToBase64(w.testimonyFile)
          }
          return {
            firstName: w.firstName,
            lastName: w.lastName,
            contactNumber: w.contactNumber,
            completeAddress: formatAddress(
              w.address,
              w.houseStreet,
              w.barangay ? `Brgy. ${w.barangay}` : undefined,
              w.city,
              w.province,
            ),
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
          lastName: formData.respondent.lastName?.trim() || '',
          firstName: formData.respondent.firstName?.trim() || '',
          middleName: formData.respondent.middleName || '',
          contactNumber: formData.respondent.contactNumber || '',
          age: formData.respondent.age ? parseInt(String(formData.respondent.age), 10) : null,
          gender: formData.respondent.gender || '',
          civilStatus: formData.respondent.civilStatus || '',
          occupation: formData.respondent.occupation || '',
          completeAddress: formatAddress(
            formData.respondent.address,
            formData.respondent.houseStreet,
            formData.respondent.barangay
              ? `Brgy. ${formData.respondent.barangay}`
              : undefined,
            formData.respondent.city,
            formData.respondent.province,
          ),
          relationshipToComplainant: formData.respondent.relationshipToComplainant || '',
          currentlyLivingWithComplainant:
            formData.respondent.currentlyLivingWithComplainant === 'Yes'
              ? true
              : formData.respondent.currentlyLivingWithComplainant === 'No'
                ? false
                : undefined,
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
        lastName: formData.complainant.lastName?.trim() || '',
        firstName: formData.complainant.firstName?.trim() || '',
        middleName: formData.complainant.middleName || '',
        contactNumber: formData.complainant.contactNumber || '',
        age: formData.complainant.age ? parseInt(String(formData.complainant.age), 10) : null,
        gender: formData.complainant.gender || '',
        civilStatus: formData.complainant.civilStatus || '',
        email: formData.complainant.email || '',
        completeAddress: formatAddress(
          formData.complainant.address,
          formData.complainant.houseStreet,
          formData.complainant.barangay
            ? `Brgy. ${formData.complainant.barangay}`
            : undefined,
          formData.complainant.city,
          formData.complainant.province,
        ),
      },
      respondent: respondentPayload,
      incident: {
        natureOfComplaint: formData.incident.natureOfComplaint?.trim() || '',
        dateOfIncident: formData.incident.dateOfIncident || '',
        timeOfIncident: formData.incident.timeOfIncident || '',
        placeOfIncident: formData.incident.placeOfIncident?.trim() || '',
        frequencyOfIncident: formData.incident.frequencyOfIncident || '',
        descriptionOfInjuries: formData.incident.descriptionOfInjuries || '',
        relatedBarangayService: formData.incident.relatedBarangayService || formData.relatedBarangayService || undefined,
      },
      narrative:
        formData.narrative?.file ||
        formData.narrative?.fileName?.trim() ||
        formData.narrative?.statementText?.trim()
          ? {
              fileName:
                formData.narrative?.file?.name ||
                formData.narrative?.fileName?.trim() ||
                undefined,
              statementSummary:
                formData.narrative?.statementText?.trim() || undefined,
              fileData: narrativeFileData,
            }
          : undefined,
      evidences: mappedEvidences,
      witnesses: mappedWitnesses,
      isCertified: formData.isCertified,
      relatedBarangayService: formData.relatedBarangayService || formData.incident.relatedBarangayService || undefined,
      ftjsApplicationId: formData.ftjsApplicationId || undefined,
    }

    return http.post<BlotterBackendResponse>(BLOTTER_API, payload)
  },

  // Search eligible FTJS applications for Affidavit of Loss linkage
  searchFtjs: async (query?: string): Promise<any[]> => {
    return http.get<any[]>(`${BLOTTER_API}/search-ftjs`, {
      params: query ? { query } : undefined,
    })
  },

  // Verify or reject document reissuance clearance
  verifyDocumentReissuance: async (
    caseId: string | number,
    data: { action: 'APPROVE' | 'REJECT'; remarks?: string }
  ): Promise<string> => {
    return http.post<string>(`${BLOTTER_API}/${caseId}/verify-document-reissuance`, data)
  },

  // Update Case details via Serbisyoko-Web PUT /api/v1/blotter/{id}
  updateCase: async (id: string | number, payload: any): Promise<BlotterBackendResponse> => {
    return http.put<BlotterBackendResponse>(`${BLOTTER_API}/${id}`, payload)
  },


  // Update status (e.g. PENDING -> RESOLVED / SETTLED)
  updateStatus: async (id: string | number, status: string, remarks?: string): Promise<BlotterBackendResponse> => {
    return http.patch<BlotterBackendResponse>(`${BLOTTER_API}/${id}/status`, { status, remarks })
  },

  reopenCase: async (id: string | number, remarks: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(`${BLOTTER_API}/${id}/reopen`, { remarks })
  },

  // Extend mediation period by 15 days (one-time allowable extension)
  extendCase: async (id: string | number, reason: string): Promise<BlotterBackendResponse> => {
    return http.post<BlotterBackendResponse>(`${BLOTTER_API}/${id}/extend`, { reason })
  },

  // Refer / Escalate case to Lupon Tagapamayapa
  referToLupon: async (caseNumber: string, memberList: { officerId: number; position: string }[]): Promise<any> => {
    return http.post<any>(`${BLOTTER_API}/refer/${encodeURIComponent(caseNumber)}`, { memberList })
  },

  // Archive / Delete case
  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(`${BLOTTER_API}/${id}`)
  },

  // Case Notes
  getCaseNotes: async (caseId: string | number): Promise<CaseNoteResponse[]> => {
    return http.get<CaseNoteResponse[]>(`${BLOTTER_API}/${caseId}/notes`)
  },

  addCaseNote: async (caseId: string | number, note: string): Promise<CaseNoteResponse> => {
    return http.post<CaseNoteResponse>(`${BLOTTER_API}/${caseId}/notes`, { note })
  },

  // Timeline
  getTimeline: async (caseId: string | number): Promise<TimelineEventResponse[]> => {
    return http.get<TimelineEventResponse[]>(`${BLOTTER_API}/${caseId}/timeline`)
  },

  // --- Blotter Reports API Endpoints ---
  getReportKpi: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<BlotterReportKpiResponse> => {
    return http.get<BlotterReportKpiResponse>(`${BLOTTER_API}/report-kpi`, { params })
  },

  getMonthlyTrend: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<MonthlyCaseTrendResponse[]> => {
    return http.get<MonthlyCaseTrendResponse[]>(`${BLOTTER_API}/monthly-trend`, { params })
  },

  getDailyTrend: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<DailyCaseTrendResponse[]> => {
    return http.get<DailyCaseTrendResponse[]>(`${BLOTTER_API}/daily-trend`, { params })
  },

  getSettlementEfficiency: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<SettlementEfficiencyResponse> => {
    return http.get<SettlementEfficiencyResponse>(`${BLOTTER_API}/settlement-efficiency`, { params })
  },

  getStatusBreakdown: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<CaseStatusBreakdownResponse> => {
    return http.get<CaseStatusBreakdownResponse>(`${BLOTTER_API}/status-breakdown`, { params })
  },

  getFormalResolutionReport: async (params?: { startDate?: string; endDate?: string; departmentId?: number }): Promise<FormalComplaintReportResponse> => {
    return http.get<FormalComplaintReportResponse>(`${BLOTTER_API}/formal-complaints/resolution-efficiency`, { params })
  },

  // Archive & Trash Vault API Endpoints
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>(`${BLOTTER_API}/archive-kpi`)
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>(`${BLOTTER_API}/archive-table`, { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>(`${BLOTTER_API}/recent-delete`, { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(`${BLOTTER_API}/archive-case/${id}`, { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`${BLOTTER_API}/${id}/restore-archive`)
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`${BLOTTER_API}/${id}/soft-delete`)
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(`${BLOTTER_API}/${id}/permanent-delete`)
  },

  getDashboardKpi: async (): Promise<BlotterDashboardKpiResponse> => {
    return http.get<BlotterDashboardKpiResponse>(`${BLOTTER_API}/dashboard-kpi`)
  },

  getRecentCasesToday: async (): Promise<RecentBlotterCaseResponse[]> => {
    return http.get<RecentBlotterCaseResponse[]>(`${BLOTTER_API}/recent-today`)
  },

  getQuickTodayMediations: async (): Promise<QuickMediationSummaryDto[]> => {
    return http.get<QuickMediationSummaryDto[]>(`${BLOTTER_API}/mediations-today-summary`)
  },

  getMediationSessions: (caseId: string | number): Promise<MediationSession[]> =>
    http.get<MediationSession[]>(`${BLOTTER_API}/${caseId}/mediation`),

  scheduleMediationSession: (
    caseId: string | number,
    payload: ScheduleMediationPayload,
  ): Promise<MediationSession> =>
    http.post<MediationSession>(`${BLOTTER_API}/${caseId}/mediation`, payload),

  cancelMediationSession: (sessionId: string | number): Promise<MediationSession> =>
    http.patch<MediationSession>(`${BLOTTER_API}/mediation/${sessionId}/cancel`, null),

  recordMediationMinutes: (
    sessionId: string | number,
    payload: RecordMediationMinutesPayload,
  ): Promise<MediationSession> =>
    http.post<MediationSession>(`${BLOTTER_API}/mediation/${sessionId}/minutes`, payload),

  getMediationMinutes: (sessionId: string | number): Promise<SessionMinutes> =>
    http.get<SessionMinutes>(`${BLOTTER_API}/mediation/${sessionId}/minutes`),

  addMediationFollowUp: (
    sessionId: string | number,
    payload: { remarks: string },
  ): Promise<SessionFollowUp> =>
    http.post<SessionFollowUp>(`${BLOTTER_API}/mediation/${sessionId}/followup`, payload),

  getMediationFollowUps: (sessionId: string | number): Promise<SessionFollowUp[]> =>
    http.get<SessionFollowUp[]>(`${BLOTTER_API}/mediation/${sessionId}/followup`),
}
