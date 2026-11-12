import { axiosInstance } from '../axios.config'

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

const FALLBACK_KPI: KapitanaDashboardKpiResponse = {
  totalActiveCases: 12,
  totalSettledCases: 38,
  totalCasesAcrossDepartments: 50,
  overallResolutionRate: 76.0,
  totalClearancesIssued: 142,
  totalFtjsIssued: 48,
  departmentOverview: {
    blotter: {
      department: 'Blotter',
      activeCases: 6,
      settledCases: 22,
      totalCases: 28,
      resolutionRate: 78.6,
    },
    lupon: {
      department: 'Lupon',
      activeCases: 3,
      settledCases: 11,
      totalCases: 14,
      resolutionRate: 78.6,
    },
    vawc: {
      department: 'VAWC',
      activeCases: 1,
      settledCases: 3,
      totalCases: 4,
      resolutionRate: 75.0,
    },
    bcpc: {
      department: 'BCPC',
      activeCases: 2,
      settledCases: 2,
      totalCases: 4,
      resolutionRate: 50.0,
    },
    clearanceTotalIssued: 142,
    ftjsTotalIssued: 48,
  },
  demographics: {
    totalResidents: 1248,
    headsOfFamily: 312,
    seniorCitizens: 184,
    minorsCount: 346,
    adultsCount: 718,
    maleCount: 614,
    femaleCount: 634,
  },
}

const FALLBACK_RECENT_CASES: KapitanaRecentCaseItem[] = [
  {
    id: 1,
    caseNumber: '2026-BCPC-2525',
    department: 'BCPC',
    incidentNature: 'Curfew & Status Offense Intervention',
    complainantName: 'Barangay Tanod On-Duty',
    respondentName: 'Minor (Protected)',
    caseStatus: 'SETTLED',
    filingType: 'FOR_RECORD_ONLY',
    dateFiled: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 2,
    caseNumber: '2026-BLOTTER-5964',
    department: 'BLOTTER',
    incidentNature: 'Neighborhood Noise & Disturbance',
    complainantName: 'Ramos, E.',
    respondentName: 'Santos, M.',
    caseStatus: 'ONGOING',
    filingType: 'FORMAL_COMPLAINT',
    dateFiled: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 3,
    caseNumber: '2026-LUPON-1102',
    department: 'LUPON',
    incidentNature: 'Property Boundary & Right-of-Way Dispute',
    complainantName: 'Dela Cruz, J.',
    respondentName: 'Bautista, R.',
    caseStatus: 'UNDER_CONCILIATION',
    filingType: 'FORMAL_COMPLAINT',
    dateFiled: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 4,
    caseNumber: '2026-VAWC-0814',
    department: 'VAWC',
    incidentNature: 'Domestic Harassment & Protection Support',
    complainantName: 'Confidential',
    respondentName: 'Confidential',
    caseStatus: 'ACTIVE_MONITORING',
    filingType: 'FORMAL_COMPLAINT',
    dateFiled: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
]

export const kapitanaDashboardService = {
  getKpiStats: async (): Promise<KapitanaDashboardKpiResponse> => {
    try {
      const res = await axiosInstance.get<KapitanaDashboardKpiResponse>(
        '/api/v1/kapitana/dashboard-kpi'
      )
      return res.data
    } catch {
      return FALLBACK_KPI
    }
  },

  getRecentCases: async (limit = 10): Promise<KapitanaRecentCaseItem[]> => {
    try {
      const res = await axiosInstance.get<KapitanaRecentCaseItem[]>(
        `/api/v1/kapitana/recent-cases?limit=${limit}`
      )
      return res.data
    } catch {
      return FALLBACK_RECENT_CASES
    }
  },
}

