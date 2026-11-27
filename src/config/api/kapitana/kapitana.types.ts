export interface KapitanaDepartmentMetrics {
  department: string
  activeCases: number
  settledCases: number
  totalCases: number
  resolutionRate: number
}

export interface KapitanaDepartmentOverviewResponse {
  blotter: KapitanaDepartmentMetrics
  lupon: KapitanaDepartmentMetrics
  vawc: KapitanaDepartmentMetrics
  bcpc: KapitanaDepartmentMetrics
  clearanceTotalIssued: number
  ftjsTotalIssued: number
}

export interface KapitanaDemographicsResponse {
  totalResidents: number
  headsOfFamily: number
  seniorCitizens: number
  minorsCount: number
  adultsCount: number
  maleCount: number
  femaleCount: number
}

export interface KapitanaDashboardKpiResponse {
  totalActiveCases: number
  totalSettledCases: number
  totalCasesAcrossDepartments: number
  overallResolutionRate: number
  totalClearancesIssued: number
  totalFtjsIssued: number
  departmentOverview: KapitanaDepartmentOverviewResponse
  demographics?: KapitanaDemographicsResponse
}

export interface KapitanaRecentCaseItem {
  id: number
  caseNumber: string
  department: 'BLOTTER' | 'LUPON' | 'VAWC' | 'BCPC' | string
  incidentNature: string
  complainantName: string
  respondentName: string
  caseStatus: string
  filingType: string
  dateFiled: string
}
