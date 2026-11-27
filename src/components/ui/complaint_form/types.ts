export type ComplaintFormMode = 'FOR_THE_RECORD' | 'FORMAL_COMPLAINT'

export interface CaseInformationData {
  caseNumber: string
  dateFiled: string
  timeFiled: string
  receivingOfficer: string
  assignedOfficer: string
  assignedOfficerId?: number
}


export interface ComplainantData {
  searchQuery?: string
  lastName: string
  firstName: string
  middleName?: string
  suffix?: string
  contactNumber?: string
  age?: number | string
  gender?: string
  civilStatus?: string
  email?: string
  houseStreet?: string
  barangay?: string
  city?: string
  province?: string
  address?: string
}

export type RespondentType = 'KNOWN' | 'NO_RESPONDENT'

export interface RespondentData {
  respondentType?: RespondentType
  searchQuery?: string
  lastName: string
  firstName: string
  middleName?: string
  age?: number | string
  gender?: string
  civilStatus?: string
  occupation?: string
  contactNumber?: string
  houseStreet?: string
  barangay?: string
  city?: string
  province?: string
  address?: string
  relationshipToComplainant: string
  currentlyLivingWithComplainant?: 'Yes' | 'No' | ''
}

export interface IncidentDetailsData {
  natureOfComplaint: string
  dateOfIncident: string
  timeOfIncident?: string
  placeOfIncident: string
  frequencyOfIncident?: string
  descriptionOfInjuries?: string
  relatedBarangayService?: string
}

export interface NarrativeData {
  file?: File | null
  fileName?: string
  fileSize?: string
  statementText?: string
}

export interface WitnessData {
  id: string
  searchQuery?: string
  selectedResidentName?: string
  firstName: string
  lastName: string
  contactNumber: string
  houseStreet?: string
  barangay?: string
  city?: string
  province?: string
  address: string
  testimonyFile?: File | null
  testimonyFileName?: string
}

export interface FtjsSearchItem {
  id: number
  ftjsNumber: string
  applicantName: string
  firstName?: string
  middleName?: string
  lastName?: string
  suffix?: string
  contactNumber?: string
  completeAddress?: string
  email?: string
  civilStatus?: string
  age?: number
  gender?: string
  residentId?: number
  personId?: number
  dateSubmitted?: string
  issuanceCount?: number
  hasActiveBlotter: boolean
  activeBlotterNumber?: string
  activeBlotterStatus?: string
}

export interface ComplaintFormData {
  caseInfo: CaseInformationData
  mode: ComplaintFormMode
  complainant: ComplainantData
  respondent: RespondentData
  incident: IncidentDetailsData
  narrative: NarrativeData
  selectedEvidenceIds: string[]
  evidenceFiles: Record<string, File | null>
  otherEvidence?: string
  witnesses: WitnessData[]
  isCertified: boolean
  respondentType?: RespondentType
  relatedBarangayService?: string
  ftjsApplicationId?: number
}
