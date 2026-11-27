import { http } from '../client'
import { blotterService } from '../blotter/blotter.service'

import type {
  BcpcDashboardKpiResponse,
  BcpcDashboardMonitoringItem,
  BcpcReportKpiResponse,
  BcpcCategoryComparisonResponse,
  BcpcReferral,
  BcpcIntervention,
  BcpcInterventionCreatePayload,
  BcpcInterventionUpdatePayload,
  BcpcInterventionProgressPayload,
  BcpcReferralCreatePayload,
  BcpcReferralFeedbackPayload,
  BcpcReferralCancelPayload,
  BcpcCustodyLog,
  UpdateCiclCustodyPayload,
  BcpcCarCaseCreateRequest,
  BcpcCarCaseUpdateRequest,
  BcpcCarCaseDetailResponse,
  BcpcCiclCaseCreateRequest,
  BcpcCiclCaseUpdateRequest,
  BcpcCiclCaseDetailResponse,
  BcpcBackendStats,
  BcpcTableRowResponse,
  BcpcFilterParams,
  BcpcPaginatedResponse,
  BcpcCaseUniversalDetailResponse,
  BcpcLifecycleKpiResponse,
  BcpcArchiveItemResponse,
  BcpcRecentDeleteItemResponse,
  BcpcArchiveFilterParams,
  BcpcPageResponse,
  BcpcMonthlyCaseTrendResponse,
  BcpcDailyCaseTrendResponse,
  BcpcStatusBreakdownResponse,
  BcpcSettlementEfficiencyResponse,
} from './bcpc.types'

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64String = result.includes(',') ? result.split(',')[1] : result
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })

export const bcpcService = {
  files: {
    narrative: (caseId: string | number | undefined) => `/api/v1/bcpc/files/narrative/${caseId}`,
    evidence: (evidenceId: string | number) => `/api/v1/bcpc/files/evidence/${evidenceId}`,
    witness: (witnessId: string | number) => `/api/v1/bcpc/files/witness/${witnessId}`,
  },

  getCaseDetailsById: async (
    id: string | number
  ): Promise<BcpcCaseUniversalDetailResponse> => {
    try {
      return await http.get<BcpcCaseUniversalDetailResponse>(`/api/v1/bcpc/${id}`)
    } catch (primaryErr) {
      // Fallback to /api/v1/bcpc-case/:id for legacy backend compatibility
      try {
        const raw = await http.get<any>(`/api/v1/bcpc-case/${id}`)
        if (raw) {
          const isCicl = raw.caseCategory === 'CICL'
          if (isCicl) {
            return {
              id: raw.id,
              caseNumber: raw.caseNumber,
              category: 'CICL',
              filingType: 'FORMAL_COMPLAINT',
              caseStatus: raw.caseStatus || 'PENDING',
              ciclDetails: {
                caseId: raw.id,
                caseNumber: raw.caseNumber,
                filingType: 'FORMAL_COMPLAINT',
                caseStatus: raw.caseStatus || 'PENDING',
                caseStatusRemarks: raw.caseStatusRemarks,
                riskLevel: raw.riskLevel,
                createdAt: raw.dateFiled,
                reportingOfficer: raw.reportingOfficer,
                assignedOfficer: raw.assignedOfficer,
                victim: {
                  firstName: raw.victimFirstName || '—',
                  lastName: raw.victimLastName || '',
                  contactNumber: raw.victimContact,
                  completeAddress: raw.victimAddress,
                  age: raw.victimAge,
                  gender: raw.victimGender,
                },
                isVictimlessOffense: Boolean(raw.isVictimlessOffense),
                victimRole: raw.victimRole,
                victimRelationshipToChild: raw.victimRelationshipToReporter,
                child: {
                  firstName: raw.childFirstName || '—',
                  middleName: raw.childMiddleName,
                  lastName: raw.childLastName || '',
                  fullName:
                    [raw.childFirstName, raw.childMiddleName, raw.childLastName]
                      .filter(Boolean)
                      .join(' ') || '—',
                  gender: raw.childGender,
                  age: raw.childAge,
                  contactNumber: raw.childContact,
                  completeAddress: raw.childAddress,
                  birthDate: raw.childBirthday,
                },
                schoolName: raw.childGradeSchool,
                gradeLevel: undefined,
                guardian: {
                  firstName: raw.childGuardianName || '—',
                  lastName: '',
                  fullName: raw.childGuardianName || '—',
                  completeAddress: raw.childAddress,
                },
                guardianRelationship: raw.childRelationship,
                isGuardianPresentAtIntake: !raw.currentGuardianUnavailable,
                guardianUnavailableReason: raw.currentGuardianUnavailableReason,
                ciclAssessment: {
                  ageAtIncident: raw.childAge,
                  discernmentStatus: raw.discernmentStatus,
                  penaltyRoutingCategory: raw.penaltyRoutingCategory,
                  isDiversionEligible: raw.isDiversionEligible,
                  diversionAuthority: raw.diversionAuthority,
                  ciclPathway: raw.ciclPathway || (raw.isDiversionEligible ? 'DIVERSION' : 'INTERVENTION'),
                  discernmentNotes: raw.guidanceNotes,
                },
                incident: {
                  natureOfComplaint: raw.natureOfComplaint || raw.ciclNatureOfAllegedViolation,
                  dateOfIncident: raw.incidentDate,
                  timeOfIncident: raw.incidentTime,
                  placeOfIncident: raw.incidentLocation,
                },
                narrative: {
                  statementSummary: raw.narrative,
                  hasFile: false,
                },
                evidences: raw.evidences || [],
                witnesses: raw.witnesses || [],
                isAttested: true,
              },
            }
          } else {
            return {
              id: raw.id,
              caseNumber: raw.caseNumber,
              category: 'CAR',
              filingType: 'FORMAL_COMPLAINT',
              caseStatus: raw.caseStatus || 'PENDING',
              carDetails: {
                caseId: raw.id,
                caseNumber: raw.caseNumber,
                filingType: 'FORMAL_COMPLAINT',
                caseStatus: raw.caseStatus || 'PENDING',
                caseStatusRemarks: raw.caseStatusRemarks,
                riskLevel: raw.riskLevel,
                createdAt: raw.dateFiled,
                reportingOfficer: raw.reportingOfficer,
                assignedOfficer: raw.assignedOfficer,
                reporter: {
                  firstName: raw.reporterFirstName || '—',
                  middleName: raw.reporterMiddleName,
                  lastName: raw.reporterLastName || '',
                  contactNumber: raw.reporterContact,
                  completeAddress: raw.reporterAddress,
                  age: raw.reporterAge,
                },
                reporterRole: raw.reporterRole,
                reporterRelationshipToChild: raw.reporterRelationshipToChild,
                child: {
                  firstName: raw.childFirstName || '—',
                  middleName: raw.childMiddleName,
                  lastName: raw.childLastName || '',
                  fullName:
                    [raw.childFirstName, raw.childMiddleName, raw.childLastName]
                      .filter(Boolean)
                      .join(' ') || '—',
                  gender: raw.childGender,
                  age: raw.childAge,
                  contactNumber: raw.childContact,
                  completeAddress: raw.childAddress,
                  birthDate: raw.childBirthday,
                },
                schoolName: raw.childGradeSchool,
                gradeLevel: undefined,
                guardian: {
                  firstName: raw.childGuardianName || '—',
                  lastName: '',
                  fullName: raw.childGuardianName || '—',
                  completeAddress: raw.childAddress,
                },
                guardianRelationship: raw.childRelationship,
                isGuardianPresentAtIntake: !raw.currentGuardianUnavailable,
                guardianUnavailableReason: raw.currentGuardianUnavailableReason,
                carActCategory: raw.carActCategory,
                specificCarAct: raw.specificCarAct,
                specificCarActOther: raw.specificCarActOther,
                carOccurrenceCategory: raw.carOccurrenceCategory,
                needsProtectiveCustody: Boolean(raw.temporaryPlacementRequired || raw.temporarySafetyPlacementRequired),
                temporaryShelterPlacement: raw.temporaryPlacement || raw.finalPlacement,
                safetyWelfareNotes: raw.guidanceNotes || raw.transferNotes,
                incident: {
                  natureOfComplaint: raw.natureOfComplaint || raw.carNatureOfComplaint,
                  dateOfIncident: raw.incidentDate,
                  timeOfIncident: raw.incidentTime,
                  placeOfIncident: raw.incidentLocation,
                },
                narrative: {
                  statementSummary: raw.narrative,
                  hasFile: false,
                },
                evidences: raw.evidences || [],
                witnesses: raw.witnesses || [],
                isAttested: true,
              },
            }
          }
        }
      } catch (fallbackErr) {
        console.warn('Fallback /api/v1/bcpc-case/:id also failed:', fallbackErr)
      }
      throw primaryErr
    }
  },

  getStats: async (): Promise<BcpcBackendStats> => {
    return http.get<BcpcBackendStats>('/api/v1/bcpc/stats')
  },

  getTable: async (params?: BcpcFilterParams): Promise<BcpcPaginatedResponse> => {
    return http.get<BcpcPaginatedResponse>('/api/v1/bcpc/table', { params })
  },

  createCarCase: async (
    request: BcpcCarCaseCreateRequest
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.post<BcpcCarCaseDetailResponse>('/api/v1/bcpc/car', request)
  },

  getCarCaseById: async (
    id: string | number
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.get<BcpcCarCaseDetailResponse>(`/api/v1/bcpc/car/${id}`)
  },

  updateCarCase: async (
    id: string | number,
    request: BcpcCarCaseUpdateRequest
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.put<BcpcCarCaseDetailResponse>(`/api/v1/bcpc/car/${id}`, request)
  },

  createCiclCase: async (
    request: BcpcCiclCaseCreateRequest
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.post<BcpcCiclCaseDetailResponse>('/api/v1/bcpc/cicl', request)
  },

  getCiclCaseById: async (
    id: string | number
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.get<BcpcCiclCaseDetailResponse>(`/api/v1/bcpc/cicl/${id}`)
  },

  updateCiclCase: async (
    id: string | number,
    request: BcpcCiclCaseUpdateRequest
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.put<BcpcCiclCaseDetailResponse>(`/api/v1/bcpc/cicl/${id}`, request)
  },

  getTimeline: async (caseId: string | number): Promise<any[]> => {
    try {
      return await http.get<any[]>(`/api/v1/bcpc/${caseId}/timeline`)
    } catch {
      try {
        return await blotterService.getTimeline(caseId)
      } catch {
        return []
      }
    }
  },

  getCaseNotes: async (caseId: string | number): Promise<any[]> => {
    try {
      return await http.get<any[]>(`/api/v1/bcpc/${caseId}/notes`)
    } catch {
      try {
        return await blotterService.getCaseNotes(caseId)
      } catch {
        return []
      }
    }
  },

  addCaseNote: async (caseId: string | number, note: string): Promise<any> => {
    try {
      return await http.post<any>(`/api/v1/bcpc/${caseId}/notes`, { note })
    } catch (primaryErr: any) {
      try {
        return await blotterService.addCaseNote(caseId, note)
      } catch (fallbackErr: any) {
        const errorMsg =
          fallbackErr?.response?.data?.message ||
          fallbackErr?.response?.data?.error ||
          primaryErr?.response?.data?.message ||
          primaryErr?.response?.data?.error ||
          'Unable to save note. Please check server connection.'
        throw new Error(String(errorMsg))
      }
    }
  },

  getCustodyLog: async (caseId: string | number): Promise<BcpcCustodyLog> => {
    return http.get<BcpcCustodyLog>(`/api/v1/bcpc/${caseId}/custody-log`)
  },

  updateCustodyLog: async (
    caseId: string | number,
    payload: Partial<BcpcCustodyLog>
  ): Promise<BcpcCustodyLog> => {
    return http.put<BcpcCustodyLog>(`/api/v1/bcpc/${caseId}/custody-log`, payload)
  },

  updateCiclCustodyLog: async (
    caseId: string | number,
    payload: UpdateCiclCustodyPayload
  ): Promise<BcpcCustodyLog> => {
    return http.put<BcpcCustodyLog>(`/api/v1/bcpc/${caseId}/cicl-custody-log`, payload)
  },

  getReferrals: async (caseId: string | number): Promise<BcpcReferral[]> => {
    return http.get<BcpcReferral[]>(`/api/v1/bcpc/${caseId}/referrals`)
  },

  issueReferral: async (
    caseId: string | number,
    payload: BcpcReferralCreatePayload
  ): Promise<BcpcReferral> => {
    return http.post<BcpcReferral>(`/api/v1/bcpc/${caseId}/referrals`, payload)
  },

  recordReferralFeedback: async (
    caseId: string | number,
    referralId: number,
    payload: BcpcReferralFeedbackPayload
  ): Promise<BcpcReferral> => {
    return http.post<BcpcReferral>(
      `/api/v1/bcpc/${caseId}/referrals/${referralId}/feedback`,
      payload
    )
  },

  cancelReferral: async (
    caseId: string | number,
    referralId: number,
    payload: BcpcReferralCancelPayload
  ): Promise<BcpcReferral> => {
    return http.post<BcpcReferral>(
      `/api/v1/bcpc/${caseId}/referrals/${referralId}/cancel`,
      payload
    )
  },

  getInterventions: async (caseId: string | number): Promise<BcpcIntervention[]> => {
    return http.get<BcpcIntervention[]>(`/api/v1/bcpc/${caseId}/interventions`)
  },

  createIntervention: async (
    caseId: string | number,
    payload: BcpcInterventionCreatePayload
  ): Promise<BcpcIntervention> => {
    return http.post<BcpcIntervention>(`/api/v1/bcpc/${caseId}/interventions`, payload)
  },

  updateIntervention: async (
    caseId: string | number,
    interventionId: number,
    payload: BcpcInterventionUpdatePayload
  ): Promise<BcpcIntervention> => {
    return http.put<BcpcIntervention>(
      `/api/v1/bcpc/${caseId}/interventions/${interventionId}`,
      payload
    )
  },

  recordInterventionProgress: async (
    caseId: string | number,
    interventionId: number,
    payload: BcpcInterventionProgressPayload
  ): Promise<BcpcIntervention> => {
    return http.post<BcpcIntervention>(
      `/api/v1/bcpc/${caseId}/interventions/${interventionId}/progress`,
      payload
    )
  },

  // Archive & Trash Vault API Endpoints
  getArchiveKpi: async (): Promise<BcpcLifecycleKpiResponse> => {
    return http.get<BcpcLifecycleKpiResponse>('/api/v1/bcpc/archive-kpi')
  },

  getArchivedCases: async (params?: BcpcArchiveFilterParams): Promise<BcpcPageResponse<BcpcArchiveItemResponse>> => {
    return http.get<BcpcPageResponse<BcpcArchiveItemResponse>>('/api/v1/bcpc/archive-table', { params })
  },

  getRecentDeletedCases: async (params?: BcpcArchiveFilterParams): Promise<BcpcPageResponse<BcpcRecentDeleteItemResponse>> => {
    return http.get<BcpcPageResponse<BcpcRecentDeleteItemResponse>>('/api/v1/bcpc/recent-delete', { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(`/api/v1/bcpc/archive-case/${id}`, { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/bcpc/${id}/restore-archive`)
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(`/api/v1/bcpc/${id}/soft-delete`)
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(`/api/v1/bcpc/${id}/permanent-delete`)
  },

  updateCaseStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<BcpcCaseUniversalDetailResponse> => {
    return http.patch<BcpcCaseUniversalDetailResponse>(
      `/api/v1/bcpc/${id}/status`,
      { status, remarks }
    )
  },

  getReportKpi: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcReportKpiResponse> => {
    return http.get<BcpcReportKpiResponse>('/api/v1/bcpc/reports/kpi', { params })
  },

  getMonthlyTrend: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcMonthlyCaseTrendResponse[]> => {
    return http.get<BcpcMonthlyCaseTrendResponse[]>('/api/v1/bcpc/reports/monthly-trend', { params })
  },

  getDailyTrend: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcDailyCaseTrendResponse[]> => {
    return http.get<BcpcDailyCaseTrendResponse[]>('/api/v1/bcpc/reports/daily-trend', { params })
  },

  getStatusBreakdown: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcStatusBreakdownResponse> => {
    return http.get<BcpcStatusBreakdownResponse>('/api/v1/bcpc/reports/status-breakdown', { params })
  },

  getCategoryComparison: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcCategoryComparisonResponse> => {
    return http.get<BcpcCategoryComparisonResponse>('/api/v1/bcpc/reports/category-comparison', { params })
  },

  getSettlementEfficiency: async (params?: { startDate?: string; endDate?: string }): Promise<BcpcSettlementEfficiencyResponse> => {
    return http.get<BcpcSettlementEfficiencyResponse>('/api/v1/bcpc/reports/settlement-efficiency', { params })
  },

  // Operational Dashboard
  getDashboardKpi: async (): Promise<BcpcDashboardKpiResponse> => {
    return http.get<BcpcDashboardKpiResponse>('/api/v1/bcpc/dashboard-kpi')
  },

  getRecentCases: async (limit = 5): Promise<BcpcTableRowResponse[]> => {
    return http.get<BcpcTableRowResponse[]>('/api/v1/bcpc/recent-cases', { params: { limit } })
  },

  getMonitoringFeed: async (limit = 6): Promise<BcpcDashboardMonitoringItem[]> => {
    return http.get<BcpcDashboardMonitoringItem[]>('/api/v1/bcpc/monitoring-feed', { params: { limit } })
  },
}
