import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type {
  BlotterLifecycleKpiResponse,
  BlotterArchiveItemResponse,
  BlotterRecentDeleteItemResponse,
  BlotterArchiveFilterParams,
  PageResponse,
} from './blotter.api'

export type BcpcCategory = 'CAR' | 'CICL'

export type CarActCategory =
  | 'JUVENILE_STATUS_OFFENSE'
  | 'LIGHT_OFFENSE_MISDEMEANOR'
  | 'OFFENSE_NOT_APPLICABLE_TO_CHILDREN'
  | 'CHILD_PROTECTION_VULNERABILITY'

export type SpecificCarAct =
  | 'CURFEW_VIOLATION'
  | 'TRUANCY'
  | 'PARENTAL_DISOBEDIENCE'
  | 'ANTI_SMOKING_VIOLATION'
  | 'ANTI_DRINKING_VIOLATION'
  | 'DISORDERLY_CONDUCT'
  | 'PUBLIC_SCANDAL'
  | 'HARASSMENT'
  | 'DRUNKENNESS'
  | 'PUBLIC_INTOXICATION'
  | 'CRIMINAL_NUISANCE'
  | 'VANDALISM'
  | 'GAMBLING'
  | 'LITTERING'
  | 'PUBLIC_URINATION'
  | 'TRESPASSING'
  | 'PETTY_THEFT'
  | 'PUBLIC_DISTURBANCE'
  | 'PHYSICAL_INJURIES_SLIGHT'
  | 'PROSTITUTION_EXEMPT_ACT'
  | 'MENDICANCY_EXEMPT'
  | 'SNIFFING_RUGBY_EXEMPT'
  | 'VAGRANCY'
  | 'CHILD_ABUSE_VICTIM'
  | 'CHILD_EXPLOITATION_VICTIM'
  | 'ABANDONED_OR_NEGLECTED'
  | 'STREET_CHILD'
  | 'RUNAWAY'
  | 'OTHER_JUVENILE_STATUS_OFFENSE'
  | 'OTHER_LIGHT_OFFENSE'
  | 'OTHER_NOT_APPLICABLE'
  | 'OTHER_CHILD_PROTECTION'
  // Legacy aliases for backward compatibility
  | 'SMOKING_OR_VAPING'
  | 'ALCOHOL_CONSUMPTION'
  | 'SUBSTANCE_GLUE_SNIFFING'
  | 'VAGRANCY_MENDICANCY'
  | 'DISORDERLY_CONDUCT_SCANDAL'
  | 'ALARM_AND_SCANDAL'
  | 'MINOR_MUTILATION_OR_GRAFFITI'
  | 'LOCAL_ORDINANCE_VIOLATION'
  | 'UNJUST_VEXATION_LIGHT'
  | 'OTHER_STATUS_OFFENSE'

export type CarOccurrenceCategory =
  | 'FIRST_OCCURRENCE'
  | 'SECOND_OCCURRENCE'
  | 'THIRD_OR_SUBSEQUENT'
  | 'UNKNOWN'

export type CiclPathway = 'PENDING' | 'INTERVENTION' | 'DIVERSION'

export type DiscernmentStatus =
  | 'WITH_DISCERNMENT'
  | 'WITHOUT_DISCERNMENT'
  | 'PENDING_LSWDO_EVALUATION'

export type PenaltyRoutingCategory =
  | 'SIX_YEARS_OR_LESS'
  | 'ABOVE_SIX_YEARS'
  | 'UNDETERMINED'

export type DiversionAuthority =
  | 'BARANGAY'
  | 'LSWDO'
  | 'WCPD'
  | 'COURT'
  | 'UNDETERMINED'

export interface BcpcReferralFeedbackDTO {
  id: number
  caseId: number
  referralId: number
  details?: string
  resolvesCase?: boolean
  resolutionType?: string
  proofFileData?: string
  proofFileName?: string
  declinedByAgency?: boolean
  acceptedByAgency?: boolean
  reasonForDecline?: string
  feedbackTypeCode?: string
  feedbackTypeOther?: string
  assessmentFindings?: string
  assessmentType?: string
  discernmentResult?: string
  assessmentDate?: string
  socialWorkerName?: string
  recommendationType?: string
  recommendationTypeOther?: string
  recommendedSocialWorker?: string
  externalRepresentativeName?: string
  externalRepresentativeOffice?: string
  externalRepresentativePosition?: string
  externalRepresentativeContact?: string
  recommendationDate?: string
  recommendedFamilySupport?: string
  recommendedPsychosocialAction?: string
  dateReceived?: string
  createdAt?: string
}

export interface BcpcReferral {
  id: number
  caseId: number
  caseNumber?: string
  referralControlNumber: string
  referredTo: string
  referredToOther?: string
  purpose: string
  purposeOther?: string
  grounds?: string
  status: 'Active' | 'Accepted' | 'Declined' | 'Cancelled' | string
  referredBy?: string
  referralDate: string
  feedbackResponse?: string
  feedbackNotes?: string
  feedbackOfficer?: string
  feedbackDate?: string
  feedbacks?: BcpcReferralFeedbackDTO[]
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt?: string
}

export type BcpcInterventionType =
  | 'COMMUNITY_BASED_SERVICE'
  | 'INDIVIDUAL_COUNSELING'
  | 'FAMILY_LIFE_EDUCATION'
  | 'SKILLS_TRAINING_AND_EDUCATION'
  | 'REPARATION_OR_RESTITUTION'
  | 'PARENTAL_GUIDANCE_AND_MONITORING'
  | 'DIVERSION_CONTRACT_PROGRAM'
  | 'REFERRAL_TO_YOUTH_REHABILITATION_CENTER'

export interface BcpcIntervention {
  id: number
  caseId: number
  bcpcCaseDetailsId?: number
  interventionType: BcpcInterventionType
  interventionTypeDisplay?: string
  programTitle: string
  description?: string
  startDate?: string
  endDate?: string
  status: 'ONGOING' | 'COMPLETED' | 'TERMINATED' | 'REVISED' | string
  facilitatorOrAgency?: string
  progressNotes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface BcpcInterventionCreatePayload {
  interventionType: BcpcInterventionType
  programTitle: string
  description?: string
  startDate?: string
  endDate?: string
  facilitatorOrAgency?: string
  initialNotes?: string
}

export interface BcpcInterventionUpdatePayload {
  interventionType: BcpcInterventionType
  programTitle: string
  description?: string
  startDate?: string
  endDate?: string
  facilitatorOrAgency?: string
  status?: string
}

export interface BcpcInterventionProgressPayload {
  sessionDate?: string
  status?: string
  progressNotes: string
  conductedBy?: string
}

export interface BcpcReferralCreatePayload {
  referredTo: string
  referredToOther?: string
  purpose: string
  purposeOther?: string
  grounds?: string
  referredBy?: string
  referralDate?: string
}

export interface BcpcReferralFeedbackPayload {
  feedbackResponse?: string
  feedbackNotes?: string
  feedbackOfficer?: string
  feedbackDate?: string
  dateReceived?: string
  details?: string
  isResolved?: boolean
  resolutionType?: string
  proofFileData?: string
  proofFileName?: string
  declinedByAgency?: boolean
  acceptedByAgency?: boolean
  reasonForDecline?: string
  feedbackTypeCode?: string
  feedbackTypeOther?: string
  assessmentFindings?: string
  assessmentType?: string
  discernmentResult?: string
  assessmentDate?: string
  socialWorkerName?: string
  recommendationType?: string
  recommendationTypeOther?: string
  recommendedSocialWorker?: string
  externalRepresentativeName?: string
  externalRepresentativeOffice?: string
  externalRepresentativePosition?: string
  externalRepresentativeContact?: string
  recommendationDate?: string
  recommendedFamilySupport?: string
  recommendedPsychosocialAction?: string
}

export interface BcpcReferralCancelPayload {
  cancellationReason: string
  cancelledBy?: string
}

export interface BcpcCustodyLog {
  turnoverAction?: string
  editReason?: string
  custodyStatus?: string
  needsMedicalAttention?: boolean | null
  safeInCurrentLocation?: boolean | null
  temporarySafetyPlacementRequired?: boolean | null
  temporaryPlacement?: string
  initialResponsibility?: string
  finalPlacement?: string
  contactNumber?: string
  transferNotes?: string
  transferDate?: string
  transferTime?: string
  temporaryPlacementReason?: string
  dateOfDecision?: string
  justification?: string
  healthCoordinationConfirmed?: boolean
  childGuidanceProvided?: boolean
  parentAdviceProvided?: boolean
  guidanceNotes?: string
  correctionAreas?: string[]

  receivingPersonName?: string
  receivingRelationship?: string
  receivingOffice?: string
  immediateActionNotes?: string
  carGuidanceApplicable?: boolean

  wasApprehended?: boolean
  apprehendingOfficerName?: string
  apprehensionPlace?: string
  apprehensionDate?: string
  apprehensionTime?: string
  custodyResolution?: string
  turnoverDate?: string
  turnoverTime?: string
  delayReason?: string
  custodyRemarks?: string
}

export interface UpdateCiclCustodyPayload {
  wasApprehended?: boolean
  apprehendingOfficerName?: string
  apprehensionPlace?: string
  apprehensionDate?: string
  apprehensionTime?: string
  apprehensionReason?: string
  custodyResolution?: string
  turnoverDate?: string
  turnoverTime?: string
  turnedOverTo?: string
  turnedOverToSpecify?: string
  delayReason?: string
  releaseDate?: string
  releaseTime?: string
  releasedTo?: string
  recipientRelationship?: string
  contactNumber?: string
  temporaryPlacementReason?: string
  custodyRemarks?: string
}

export interface BcpcPersonInput {
  residentId?: number | null
  personId?: number | null
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  contactNumber?: string
  completeAddress: string
  age?: number | string | null
  gender?: string
  birthDate?: string | null
  civilStatus?: string
  email?: string
}

export interface BcpcIncidentInput {
  natureOfComplaint?: string
  dateOfIncident: string
  timeOfIncident?: string
  placeOfIncident: string
  frequencyOfIncident?: string
  descriptionOfInjuries?: string
  relatedBarangayService?: string
}

export interface BcpcNarrativeInput {
  fileName?: string
  statementSummary?: string
  fileData?: string
  documentFormat?: string
  statementFileBase64?: string
  textStatement?: string
}

export interface BcpcEvidenceInput {
  id?: number
  evidenceTypeName?: string
  fileName?: string
  description?: string
  files?: string
  evidenceType?: string
  fileBase64?: string
  fileSize?: string
}

export interface BcpcWitnessInput {
  id?: number
  personId?: number | null
  firstName: string
  middleName?: string
  lastName: string
  contactNumber?: string
  completeAddress?: string
  testimonyText?: string
  testimonyFileName?: string
  testimonyFile?: string
  testimonyFileBase64?: string
}

export interface BcpcPersonDetail {
  id?: number
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  suffix?: string
  contactNumber?: string
  completeAddress?: string
  age?: number
  gender?: string
  birthDate?: string
  civilStatus?: string
  email?: string
  isResident?: boolean
}

export interface BcpcCarCaseCreateRequest {
  caseNumber?: string
  assignedOfficerId?: number | null
  assignedOfficer?: string
  reporter: BcpcPersonInput
  reporterRole?: string
  reporterRelationshipToChild?: string
  child: BcpcPersonInput
  gradeLevel?: string
  schoolName?: string
  isGuardianAvailable?: boolean
  guardian?: BcpcPersonInput | null
  guardianRelationship?: string
  guardianUnavailableReason?: string
  incident: BcpcIncidentInput
  carActCategory?: CarActCategory
  specificCarAct?: SpecificCarAct
  specificCarActOther?: string
  carOccurrenceCategory?: CarOccurrenceCategory
  hasSafetyWelfareConcerns?: boolean
  safetyWelfareNotes?: string
  riskLevel?: string
  narrative?: BcpcNarrativeInput
  evidences?: BcpcEvidenceInput[]
  witnesses?: BcpcWitnessInput[]
  certifiedTrue?: boolean
}

export interface BcpcCarCaseUpdateRequest {
  reporterRole?: string
  reporterRelationshipToChild?: string
  isGuardianAvailable?: boolean
  guardianRelationship?: string
  guardianUnavailableReason?: string
  guardian?: BcpcPersonInput | null
  gradeLevel?: string
  schoolName?: string
  incident?: BcpcIncidentInput
  carCaseBasis?: string
  carActCategory?: CarActCategory
  specificCarAct?: SpecificCarAct
  specificCarActOther?: string
  carOccurrenceCategory?: CarOccurrenceCategory
  hasAdditionalProtectionConcern?: boolean
  safetyNotes?: string
  additionalNotes?: string
  narrative?: BcpcNarrativeInput
  evidences?: BcpcEvidenceInput[]
  witnesses?: BcpcWitnessInput[]
}

export interface BcpcCarCaseDetailResponse {
  caseId: number
  caseNumber: string
  filingType: string
  caseStatus: string
  caseStatusRemarks?: string
  riskLevel: string
  createdAt: string
  reportingOfficer?: string
  assignedOfficer?: string
  reporter?: any
  reporterRole?: string
  reporterRelationshipToChild?: string
  child?: BcpcPersonDetail
  gradeLevel?: string
  schoolName?: string
  guardian?: BcpcPersonDetail
  guardianRelationship?: string
  isGuardianPresentAtIntake?: boolean
  guardianUnavailableReason?: string
  incident?: any
  carActCategory?: CarActCategory
  specificCarAct?: SpecificCarAct
  specificCarActOther?: string
  carOccurrenceCategory?: CarOccurrenceCategory
  needsProtectiveCustody?: boolean
  temporaryShelterPlacement?: string
  safetyWelfareNotes?: string
  narrative?: any
  evidences?: any[]
  witnesses?: any[]
  isAttested?: boolean
  attestedAt?: string
}

export interface BcpcCiclCaseCreateRequest {
  caseNumber?: string
  assignedOfficerId?: number | null
  assignedOfficer?: string
  isVictimlessOffense?: boolean
  victim?: BcpcPersonInput | null
  victimRole?: string
  victimRelationshipToChild?: string
  child: BcpcPersonInput
  gradeLevel?: string
  schoolName?: string
  isGuardianAvailable?: boolean
  guardian?: BcpcPersonInput | null
  guardianRelationship?: string
  guardianUnavailableReason?: string
  incident: BcpcIncidentInput
  allegedViolation: string
  ageAtIncident?: number | null
  ciclPathway?: CiclPathway
  discernmentStatus?: DiscernmentStatus
  penaltyRoutingCategory?: PenaltyRoutingCategory
  diversionAuthority?: DiversionAuthority
  isDiversionEligible?: boolean
  admittedOffense?: boolean
  isRepeatOffender?: boolean
  apprehendingOfficerName?: string
  apprehendingOfficerOffice?: string
  apprehendingOfficerContact?: string
  apprehensionDateTime?: string | null
  apprehensionPlace?: string
  narrative?: BcpcNarrativeInput
  evidences?: BcpcEvidenceInput[]
  witnesses?: BcpcWitnessInput[]
  certifiedTrue?: boolean
}

export interface BcpcCiclCaseUpdateRequest {
  victimRole?: string
  victimRelationshipToChild?: string
  isGuardianAvailable?: boolean
  guardianRelationship?: string
  guardianUnavailableReason?: string
  guardian?: BcpcPersonInput | null
  gradeLevel?: string
  schoolName?: string
  incident?: BcpcIncidentInput
  allegedViolation?: string
  discernmentStatus?: DiscernmentStatus
  penaltyRoutingCategory?: PenaltyRoutingCategory
  diversionAuthority?: DiversionAuthority
  admittedOffense?: boolean
  isRepeatOffender?: boolean
  apprehendingOfficerName?: string
  apprehendingOfficerOffice?: string
  apprehendingOfficerContact?: string
  apprehensionDateTime?: string | null
  apprehensionPlace?: string
  narrative?: BcpcNarrativeInput
  evidences?: BcpcEvidenceInput[]
  witnesses?: BcpcWitnessInput[]
}

export interface BcpcCiclCaseDetailResponse {
  caseId: number
  caseNumber: string
  filingType: string
  caseStatus: string
  caseStatusRemarks?: string
  riskLevel: string
  createdAt: string
  reportingOfficer?: string
  assignedOfficer?: string
  victim?: any
  isVictimlessOffense?: boolean
  victimRole?: string
  victimRelationshipToChild?: string
  child?: BcpcPersonDetail
  gradeLevel?: string
  schoolName?: string
  guardian?: BcpcPersonDetail
  guardianRelationship?: string
  isGuardianPresentAtIntake?: boolean
  guardianUnavailableReason?: string
  ciclAssessment?: {
    ageAtIncident?: number
    ciclPathway?: CiclPathway
    discernmentStatus?: DiscernmentStatus
    penaltyRoutingCategory?: PenaltyRoutingCategory
    diversionAuthority?: DiversionAuthority
    isDiversionEligible?: boolean
    admittedOffense?: boolean
    isRepeatOffender?: boolean
    allegedViolation?: string
    apprehendingOfficerName?: string
    apprehendingOfficerOffice?: string
    apprehendingOfficerContact?: string
    apprehensionDateTime?: string
    apprehensionPlace?: string
  }
  incident?: any
  narrative?: any
  evidences?: any[]
  witnesses?: any[]
  isAttested?: boolean
  attestedAt?: string
}

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

export interface BcpcBackendStats {
  totalCases: number
  totalCasesTrend: string
  totalActiveCases: number
  totalReferredCases: number
  totalSettledCases: number
  totalOngoing?: number
}

export interface BcpcTableRowResponse {
  id: number
  caseNumber: string
  childName: string
  caseNature: string
  category: string
  status: string
  dateFiled: string
  createdAt?: string
}

export interface BcpcFilterParams {
  search?: string
  status?: string
  category?: string
  page?: number
  size?: number
}

export interface BcpcPaginatedResponse {
  content: BcpcTableRowResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface BcpcCaseUniversalDetailResponse {
  id: number
  caseNumber: string
  category: 'CAR' | 'CICL'
  filingType: string
  caseStatus: string
  carDetails?: BcpcCarCaseDetailResponse | null
  ciclDetails?: BcpcCiclCaseDetailResponse | null
}

export const bcpcApi = {
  getCaseDetailsById: async (
    id: string | number
  ): Promise<BcpcCaseUniversalDetailResponse> => {
    try {
      return await http.get<BcpcCaseUniversalDetailResponse>(ENDPOINTS.BCPC.DETAIL(id))
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
    return http.get<BcpcBackendStats>(ENDPOINTS.BCPC.STATS)
  },

  getTable: async (params?: BcpcFilterParams): Promise<BcpcPaginatedResponse> => {
    return http.get<BcpcPaginatedResponse>(ENDPOINTS.BCPC.TABLE, { params })
  },

  createCarCase: async (
    request: BcpcCarCaseCreateRequest
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.post<BcpcCarCaseDetailResponse>(ENDPOINTS.BCPC.CAR, request)
  },

  getCarCaseById: async (
    id: string | number
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.get<BcpcCarCaseDetailResponse>(ENDPOINTS.BCPC.CAR_DETAIL(id))
  },

  updateCarCase: async (
    id: string | number,
    request: BcpcCarCaseUpdateRequest
  ): Promise<BcpcCarCaseDetailResponse> => {
    return http.put<BcpcCarCaseDetailResponse>(ENDPOINTS.BCPC.CAR_DETAIL(id), request)
  },

  createCiclCase: async (
    request: BcpcCiclCaseCreateRequest
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.post<BcpcCiclCaseDetailResponse>(ENDPOINTS.BCPC.CICL, request)
  },

  getCiclCaseById: async (
    id: string | number
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.get<BcpcCiclCaseDetailResponse>(ENDPOINTS.BCPC.CICL_DETAIL(id))
  },

  updateCiclCase: async (
    id: string | number,
    request: BcpcCiclCaseUpdateRequest
  ): Promise<BcpcCiclCaseDetailResponse> => {
    return http.put<BcpcCiclCaseDetailResponse>(ENDPOINTS.BCPC.CICL_DETAIL(id), request)
  },

  getTimeline: async (caseId: string | number): Promise<any[]> => {
    try {
      return await http.get<any[]>(`/api/v1/bcpc/${caseId}/timeline`)
    } catch {
      try {
        return await http.get<any[]>(`/api/v1/blotter/${caseId}/timeline`)
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
        return await http.get<any[]>(`/api/v1/blotter/${caseId}/notes`)
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
        return await http.post<any>(`/api/v1/blotter/${caseId}/notes`, { note })
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
  getArchiveKpi: async (): Promise<BlotterLifecycleKpiResponse> => {
    return http.get<BlotterLifecycleKpiResponse>(ENDPOINTS.BCPC.ARCHIVE_KPI)
  },

  getArchivedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterArchiveItemResponse>> => {
    return http.get<PageResponse<BlotterArchiveItemResponse>>(ENDPOINTS.BCPC.ARCHIVE_TABLE, { params })
  },

  getRecentDeletedCases: async (params?: BlotterArchiveFilterParams): Promise<PageResponse<BlotterRecentDeleteItemResponse>> => {
    return http.get<PageResponse<BlotterRecentDeleteItemResponse>>(ENDPOINTS.BCPC.RECENT_DELETE, { params })
  },

  archiveCase: async (id: string | number, remarks?: string): Promise<void> => {
    return http.patch<void>(ENDPOINTS.BCPC.ARCHIVE_CASE(id), { remarks: remarks || 'Archived Record' })
  },

  restoreArchivedCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(ENDPOINTS.BCPC.RESTORE_ARCHIVE(id))
  },

  softDeleteCase: async (id: string | number): Promise<void> => {
    return http.patch<void>(ENDPOINTS.BCPC.SOFT_DELETE(id))
  },

  permanentDeleteCase: async (id: string | number): Promise<void> => {
    return http.delete<void>(ENDPOINTS.BCPC.PERMANENT_DELETE(id))
  },

  updateCaseStatus: async (
    id: string | number,
    status: string,
    remarks?: string
  ): Promise<BcpcCaseUniversalDetailResponse> => {
    return http.patch<BcpcCaseUniversalDetailResponse>(
      ENDPOINTS.BCPC.UPDATE_STATUS(id),
      { status, remarks }
    )
  },
}

