export interface ReportFilters {
  dateFrom: string
  dateTo: string
  purok: string
  purpose: string
  sex: string
  civilStatus: string
  education: string
  outcome: string
}

export interface Applicant {
  id: string | number
  controlNo: string
  name: string
  sex: 'Male' | 'Female'
  age: number
  civilStatus: 'Single' | 'Married' | 'Live-in' | 'Widowed' | 'Separated'
  education: string
  purok: string
  purpose: string
  dateIssued: string
  validUntil: string
  firstAvailment: boolean
  desiredField: string
  outcome: 'Placed' | 'In Training' | 'Searching' | 'No Update'
  employer?: string
  completeDocs: boolean
}
