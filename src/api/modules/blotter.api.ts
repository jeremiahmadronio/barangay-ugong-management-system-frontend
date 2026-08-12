import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'


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
  receivingOfficer?: string
  assignedOfficer?: string

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
  }
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
  content: BlotterBackendResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}


const fileToBase64 = (file: File): Promise<string> => {
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
  // Fetch all blotter cases with optional search, status, nature, and filingType params
  getAll: async (params?: {
    search?: string
    status?: string
    natureOfComplaint?: string
    filingType?: string
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
      respondent: {
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
      },
      incident: {
        natureOfComplaint: formData.incident.natureOfComplaint?.trim() || 'General Complaint',
        dateOfIncident: formData.incident.dateOfIncident || '',
        timeOfIncident: formData.incident.timeOfIncident || '',
        placeOfIncident: formData.incident.placeOfIncident?.trim() || 'Barangay Area',
        frequencyOfIncident: formData.incident.frequencyOfIncident || '',
        descriptionOfInjuries: formData.incident.descriptionOfInjuries || '',
      },
      narrative: {
        fileName: formData.narrative?.fileName || 'statement.txt',
        statementSummary: formData.narrative?.statementText || 'No statement summary provided',
        fileData: narrativeFileData,
      },
      evidences: mappedEvidences,
      witnesses: mappedWitnesses,
      isCertified: formData.isCertified,
    }




    return http.post<BlotterBackendResponse>(ENDPOINTS.BLOTTER.BASE, payload)
  },


  // Update status (e.g. PENDING -> RESOLVED / SETTLED)
  updateStatus: async (id: string | number, status: string, remarks?: string): Promise<BlotterBackendResponse> => {
    return http.patch<BlotterBackendResponse>(`${ENDPOINTS.BLOTTER.DETAIL(String(id))}/status`, null, {
      params: { status, remarks },
    })
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


