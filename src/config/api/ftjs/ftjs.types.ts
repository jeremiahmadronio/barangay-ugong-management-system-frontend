export interface FtjsIssuanceHistoryResponse {
  ftjsNumber: string
  issuedAt: string | null
  status: string | null
}

export interface FtjsBarangayCaseHistoryResponse {
  caseNumber: string
  natureOfComplaint: string
  role: string
  dateFiled: string | null
  status: string
}

export interface FtjsResidentSearchResponse {
  residentId: number
  fullName: string
  age: number | null
  gender: string | null
  civilStatus: string | null
  contactNumber: string | null
  completeAddress: string | null
  residencyDate: string | null
  hasAvailedFtjs: boolean
  priorTrackingNumber: string | null
  priorDateSubmitted: string | null
  issuanceHistories: FtjsIssuanceHistoryResponse[]
  caseHistoryList: FtjsBarangayCaseHistoryResponse[]
}
