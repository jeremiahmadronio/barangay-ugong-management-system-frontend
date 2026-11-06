import { http } from '../client'
import { ENDPOINTS } from '../endpoints'

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

export const bcpcApi = {
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
}

