import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartHandshake,
  Plus,
  Eye,
  ShieldAlert,
  Share2,
  FileX2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  DataTable,
  TableFilters,
  Badge,
  StatsCards,
  type StatCard,
} from '@/components/ui'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import {
  vawcApi,
  type VawcTableRowResponse,
  type VawcBackendStats,
} from '@/api/modules/vawc.api'
import { formatDate, maskConfidentialName } from '@/utils/formatters'
import { VawcCaseDetailsView } from './components/VawcCaseDetailsView'

const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Complainant Last Name, or Respondent Last Name...',
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'BPO Issued', value: 'BPO_ISSUED' },
      { label: 'BPO Served', value: 'BPO_SERVED' },
      { label: 'Referred', value: 'ISSUED_REFERRAL' },
      { label: 'Settled', value: 'SETTLED' },
      { label: 'Dismissed', value: 'DISMISSED' },
      { label: 'Withdrawn', value: 'WITHDRAWN' },
    ],
  },
  {
    key: 'riskLevel',
    label: 'Risk Level',
    options: [
      { label: 'All Risk Levels', value: 'all' },
      { label: 'High-Imminent Risk', value: 'HIGH-IMMINENT' },
      { label: 'Moderate Risk', value: 'MODERATE' },
      { label: 'Low Risk', value: 'LOW' },
    ],
  },
]

export const VawcPage: React.FC = () => {
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST')
  const [records, setRecords] = useState<VawcTableRowResponse[]>([])
  const [statsData, setStatsData] = useState<VawcBackendStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Server-side pagination & filter state (5 items per page)
  const [page, setPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 5

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    riskLevel: 'all',
  })

  const [selectedCaseId, setSelectedCaseId] = useState<number | string | null>(null)

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const stats = await vawcApi.getStats()
      setStatsData(stats)
    } catch {
      setStatsData(null)
    }
  }, [])

  // Fetch paginated & filtered table records from backend
  const fetchTableData = useCallback(async (currentPage: number, filters: FilterValues) => {
    setIsLoading(true)
    try {
      const response = await vawcApi.getTable({
        search: filters.search ? String(filters.search).trim() : undefined,
        status: filters.status && filters.status !== 'all' ? String(filters.status) : undefined,
        riskLevel: filters.riskLevel && filters.riskLevel !== 'all' ? String(filters.riskLevel) : undefined,
        page: currentPage - 1, // backend is 0-indexed
        size: pageSize,
      })

      if (response && response.content) {
        const mapped: VawcTableRowResponse[] = response.content.map((c) => ({
          ...c,
          complainant: maskConfidentialName(c.complainant),
          respondent: maskConfidentialName(c.respondent),
          dateFiled: formatDate(c.dateFiled || c.createdAt),
          natureOfComplaint: c.natureOfComplaint || 'VAWC Violation',
        }))
        setRecords(mapped)
        setTotalElements(response.totalElements ?? response.content.length)
        setTotalPages(Math.max(1, response.totalPages ?? Math.ceil((response.totalElements ?? response.content.length) / pageSize)))
      } else {
        setRecords([])
        setTotalElements(0)
        setTotalPages(1)
      }
    } catch {
      setRecords([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  // Initial load
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchTableData(page, filterValues)
    }
  }, [page, filterValues, fetchTableData, viewMode])

  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    setPage(1)
  }

  const handleClearFilter = () => {
    const cleared: FilterValues = { search: '', status: 'all', riskLevel: 'all' }
    setFilterValues(cleared)
    setPage(1)
  }

  // KPI Stat Cards
  const getTrendType = (trendStr?: string): 'up' | 'down' | 'neutral' => {
    if (!trendStr) return 'neutral'
    const trimmed = trendStr.trim()
    if (trimmed.startsWith('+') && !trimmed.includes('+0.0%') && !trimmed.includes('+0%')) return 'up'
    if (trimmed.startsWith('-') && !trimmed.includes('-0.0%') && !trimmed.includes('-0%')) return 'down'
    return 'neutral'
  }

  const casesTrendText = statsData?.totalCasesTrend || (totalElements > 0 ? '+100.0% vs last month' : '0.0% vs last month')

  const statCards: StatCard[] = [
    {
      id: 'total_vawc_cases',
      label: 'Total VAWC Cases',
      value: statsData?.totalCases ?? totalElements,
      hint: casesTrendText,
      trend: getTrendType(casesTrendText),
      showTrend: true,
      icon: HeartHandshake,
      tone: 'indigo',
    },
    {
      id: 'total_referred',
      label: 'Referred Cases',
      value: statsData?.totalReferredCases ?? 0,
      hint: 'Referred to DSWD / PNP / Court',
      icon: Share2,
      tone: 'sky',
    },
    {
      id: 'active_bpo',
      label: 'Active Protection Orders',
      value: statsData?.totalActiveBpo ?? 0,
      hint: 'Barangay Protection Orders in effect',
      icon: ShieldAlert,
      tone: 'emerald',
    },
    {
      id: 'withdrawn_cases',
      label: 'Withdrawn Cases',
      value: statsData?.totalWithdrawnCases ?? 0,
      hint: 'Formally withdrawn complaints',
      icon: FileX2,
      tone: 'rose',
    },
  ]

  // Table Columns Definition exactly matching Blotter format and text styles
  const columns: Column<VawcTableRowResponse>[] = [
    {
      key: 'caseNumber',
      header: 'CASE / VAWC NO.',
      render: (r) => <span className="font-bold text-slate-900">{r.caseNumber}</span>,
    },
    {
      key: 'complainant',
      header: 'COMPLAINANT',
    },
    {
      key: 'respondent',
      header: 'RESPONDENT',
    },
    {
      key: 'natureOfComplaint',
      header: 'NATURE OF COMPLAINT',
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        let tone: BadgeTone = 'amber'
        const st = (r.status || 'PENDING').toUpperCase()
        if (st === 'SETTLED' || st === 'RESOLVED') tone = 'emerald'
        else if (st === 'WITHDRAWN' || st === 'DISMISSED') tone = 'rose'
        else if (st.includes('REFERRAL') || st.includes('MEDIATION') || st.includes('CONCILIATION')) tone = 'sky'
        else if (st.includes('BPO') || st.includes('SERVED') || st.includes('ISSUED')) tone = 'indigo'
        return <Badge tone={tone}>{st.replace(/_/g, ' ')}</Badge>
      },
    },
    {
      key: 'riskLevel',
      header: 'RISK LEVEL',
      render: (r) => {
        let tone: BadgeTone = 'emerald'
        const risk = (r.riskLevel || 'LOW').toUpperCase()
        if (risk.includes('HIGH')) tone = 'rose'
        else if (risk.includes('MODERATE')) tone = 'amber'
        return <Badge tone={tone}>{risk}</Badge>
      },
    },
    {
      key: 'dateFiled',
      header: 'DATE FILED',
    },
  ]

  // Table Row Actions (3-dots menu like Blotter)
  const actions: RowAction<VawcTableRowResponse>[] = [
    {
      id: 'view',
      label: 'View Case Details',
      icon: Eye,
      tone: 'primary',
      onClick: (row) => {
        setSelectedCaseId(row.id)
        setViewMode('DETAILS')
      },
    },
  ]

  if (viewMode === 'DETAILS' && selectedCaseId) {
    return (
      <VawcCaseDetailsView
        caseId={selectedCaseId}
        onBack={() => {
          setSelectedCaseId(null)
          setViewMode('LIST')
          fetchTableData(page, filterValues)
          fetchStats()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="VAWC Case Records"
        description="Confidential intake records, risk assessments, and protection orders for Violence Against Women and Children desk."
        actions={[
          {
            label: '+ New VAWC Entry',
            icon: Plus,
            onClick: () => navigate('/vawc/entry'),
            className:
              'inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer',
          },
        ]}
      />

      {/* Reusable Stats KPI Cards Component */}
      <StatsCards cards={statCards} />

      {/* VAWC Cases DataTable */}
      <DataTable
        data={records}
        columns={columns}
        rowKey={(r) => r.id}
        actions={actions}
        pageSize={pageSize}
        serverPagination={{
          page,
          pageCount: totalPages,
          totalItems: totalElements,
          pageSize,
          onPageChange: (newPage) => setPage(newPage),
        }}
        emptyTitle={isLoading ? 'Loading VAWC records...' : 'No VAWC case files found'}
        emptyDescription={
          isLoading
            ? 'Fetching confidential VAWC cases from backend...'
            : 'There are no active VAWC case records matching your filter criteria.'
        }
        header={
          <TableFilters
            filters={filterConfigs}
            values={filterValues}
            onApply={handleApplyFilter}
            onClear={handleClearFilter}
          />
        }
      />
    </div>
  )
}
export default VawcPage


