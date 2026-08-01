import { http } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'

export interface BlotterBackendResponse {
  id: number
  caseNumber: string
  filingType: 'FORMAL_COMPLAINT' | 'FOR_RECORD_ONLY'
  caseStatus: 'PENDING' | 'UNDER_MEDIATION' | 'UNDER_CONCILIATION' | 'SETTLED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  complainantName: string
  complainantContact: string
  complainantAddress: string
  respondentName: string
  respondentContact: string
  respondentAddress: string
  relationshipToComplainant: string
  natureOfComplaint: string
  dateOfIncident: string
  timeOfIncident: string
  incidentLocation: string
  injuriesDamagesDescription: string
  statementText: string
  statementSummary: string
  witnessCount: number
  createdAt: string
  updatedAt: string
  dateFiledFormatted?: string
  receivingOfficer?: string
  assignedOfficer?: string
}

export interface BlotterBackendStats {
  totalCases: number
  pendingCases: number
  inProgressCases: number
  resolvedCases: number

  // Formal Complaint Stats
  totalFormalComplaints?: number
  pendingFormalComplaints?: number
  mediationFormalComplaints?: number
  settledFormalComplaints?: number

  // For the Record Stats
  totalForTheRecord?: number
  incidentOnlyForTheRecord?: number
  consultationForTheRecord?: number
  recentForTheRecord?: number

  // Dynamic Backend Trend Strings
  totalCasesTrend?: string
  totalForTheRecordTrend?: string
  underMediationTrend?: string
  settledCasesTrend?: string
}

export const blotterApi = {
  // Fetch all blotter cases with optional search, status, nature, and filingType params
  getAll: async (params?: {
    search?: string
    status?: string
    natureOfComplaint?: string
    filingType?: string
  }): Promise<BlotterBackendResponse[]> => {
    return http.get<BlotterBackendResponse[]>(ENDPOINTS.BLOTTER.BASE, {
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
    const payload = {
      filingType: formData.mode === 'FORMAL_COMPLAINT' ? 'FORMAL_COMPLAINT' : 'FOR_RECORD_ONLY',
      caseNumber: formData.caseInfo.caseNumber,
      dateFiled: formData.caseInfo.dateFiled,
      timeFiled: formData.caseInfo.timeFiled,
      receivingOfficer: formData.caseInfo.receivingOfficer,
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
        houseStreet: formData.complainant.houseStreet || '',
        barangay: formData.complainant.barangay || '',
        city: formData.complainant.city || '',
        province: formData.complainant.province || '',
        completeAddress: `${formData.complainant.houseStreet || ''}, ${formData.complainant.barangay || ''}, ${formData.complainant.city || ''}, ${formData.complainant.province || ''}`.replace(/^,\s*/, ''),
      },
      respondent: {
        lastName: formData.respondent.lastName?.trim() || 'N/A',
        firstName: formData.respondent.firstName?.trim() || 'Respondent',
        middleName: formData.respondent.middleName || '',
        contactNumber: formData.respondent.contactNumber || '',
        age: formData.respondent.age ? parseInt(String(formData.respondent.age), 10) : null,
        gender: formData.respondent.gender || '',
        houseStreet: formData.respondent.houseStreet || '',
        barangay: formData.respondent.barangay || '',
        city: formData.respondent.city || '',
        province: formData.respondent.province || '',
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
      statementText: formData.narrative?.statementText || '',
      statementSummary: formData.narrative?.statementText || '',
      witnesses: (formData.witnesses || []).map((w) => ({
        firstName: w.firstName,
        lastName: w.lastName,
        contactNumber: w.contactNumber,
        houseStreet: w.houseStreet,
        barangay: w.barangay,
        city: w.city,
        province: w.province,
        completeAddress: `${w.houseStreet || ''}, ${w.barangay || ''}, ${w.city || ''}, ${w.province || ''}`.replace(/^,\s*/, ''),
        testimonyText: w.testimonyFileName || '',
      })),
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
}
