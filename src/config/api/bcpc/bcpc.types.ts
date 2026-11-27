export interface BcpcDashboardKpiResponse {
  weekStartDate: string
  weekEndDate: string
  totalNewCasesThisWeek: number
  newCasesTrend: string
  totalNeedsAssessment: number
  totalActiveInterventions: number
  totalPendingAgencyFeedback: number
}

export interface BcpcDashboardMonitoringItem {
  id: number
  caseId: number
  caseNumber: string
  childName: string
  category: string
  itemType: 'REFERRAL' | 'INTERVENTION' | string
  title: string
  agencyOrFacilitator: string
  status: string
  itemDate: string
  daysPending: number
}

export interface BcpcReportKpiResponse {
  startDate: string
  endDate: string
  totalCases: number
  settledCases: number
  settlementRate: number
  activeInterventions: number
  agencyReferrals: number
}

export interface BcpcCategoryComparisonResponse {
  startDate: string
  endDate: string
  totalCases: number
  carCases: number
  carPercentage: number
  ciclCases: number
  ciclPercentage: number
}

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
    discernmentNotes?: string
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
export interface BcpcLifecycleKpiResponse {
  totalArchived: number
  totalArchivedThisMonth: number
  totalRecentlyDeleted: number
  totalRecentlyDeletedThisMonth: number
}

export interface BcpcArchiveItemResponse {
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

export interface BcpcRecentDeleteItemResponse {
  id: number
  caseNumber: string
  complainantName: string
  respondentName: string
  status: string
  deletedAt: string
  filingType: string
  classification?: string
}

export interface BcpcArchiveFilterParams {
  search?: string
  filingType?: string
  page?: number
  size?: number
}

export interface BcpcPageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  empty: boolean
}

export interface BcpcMonthlyCaseTrendResponse {
  monthLabel: string
  year: number
  month: number
  totalCases: number
}

export interface BcpcDailyCaseTrendResponse {
  date: string
  label?: string
  dayLabel?: string
  dayOfMonth: number
  totalCases: number
}

export interface BcpcStatusBreakdownResponse {
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

export interface BcpcSettlementEfficiencyResponse {
  startDate: string
  endDate: string
  departmentId?: number
  totalCases: number
  totalFormalComplaints: number
  totalSettledCases: number
  settlementRate: number
}
