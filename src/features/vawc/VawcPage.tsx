import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartHandshake,
  Plus,
  Eye,
  ShieldAlert,
  Share2,
  FileX2,
  BarChart3,
  Archive,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  DataTable,
  TableFilters,
  Badge,
  StatsCards,
  ConfirmationDialog,
  FeedbackDialog,
  type StatCard,
} from '@/components/ui'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { vawcService } from '@/config/api/vawc/vawc.service'
import type {
  VawcTableRowResponse,
  VawcBackendStats
} from '@/config/api/vawc/vawc.types'
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
      { label: 'Declined Referral', value: 'DECLINED_REFERRAL' },
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
  const { currentRole } = useAuth()
  const { hasPermission } = useUserPermissions()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()


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
      const stats = await vawcService.getStats()
      setStatsData(stats)
    } catch {
      setStatsData(null)
    }
  }, [])

  // Fetch paginated & filtered table records from backend
  const fetchTableData = useCallback(async (currentPage: number, filters: FilterValues) => {
    setIsLoading(true)
    try {
      const response = await vawcService.getTable({
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

  // Handle Archive with Business Rules Check & Clean Confirmation
  const handleArchive = (row: VawcTableRowResponse) => {
    const activeStatuses = ['PENDING', 'BPO_ISSUED', 'BPO_SERVED', 'UNDER_MEDIATION', 'UNDER_CONCILIATION']
    if (activeStatuses.includes((row.status || '').toUpperCase())) {
      showFeedback({
        variant: 'error',
        title: 'Archiving Blocked by Business Rule',
        description: `Cannot archive Case #${row.caseNumber} because its status is currently ${row.status}. Only Settled, Dismissed, Withdrawn, or Referred cases can be archived.`,
      })
      return
    }

    confirm({
      title: `Archive Case – ${row.caseNumber}?`,
      description: `Are you sure you want to archive "${row.caseNumber}" (${row.complainant} vs ${row.respondent})? This case will be safely moved from active desk records to the Archive Vault.`,
      confirmLabel: 'Archive Case',
      tone: 'emerald',
      onConfirm: async () => {
        try {
          await vawcService.archiveCase(row.id, 'Archived Record')
          await fetchTableData(page, filterValues)
          await fetchStats()
          showFeedback({
            variant: 'success',
            title: 'Case Archived',
            description: `Case #${row.caseNumber} has been moved to the Archive Vault successfully.`,
          })
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || err?.message || 'Failed to archive case.'
          showFeedback({
            variant: 'error',
            title: 'Archive Failed',
            description: errMsg,
          })
        }
      },
    })
  }

  // Handle Soft Delete with Business Rules Check
  const handleSoftDelete = (row: VawcTableRowResponse) => {
    const activeStatuses = ['PENDING', 'BPO_ISSUED', 'BPO_SERVED', 'UNDER_MEDIATION', 'UNDER_CONCILIATION']
    if (activeStatuses.includes((row.status || '').toUpperCase())) {
      showFeedback({
        variant: 'error',
        title: 'Action Blocked',
        description: `Cannot move active case #${row.caseNumber} to trash while it is ${row.status}. Please settle, dismiss, or withdraw the case first.`,
      })
      return
    }

    confirm({
      title: `Move Case #${row.caseNumber} to Trash?`,
      description: `Are you sure you want to move Case #${row.caseNumber} (${row.complainant} vs ${row.respondent}) to the Recycle Bin? You can restore it at any time from the Archive & Trash Vault.`,
      confirmLabel: 'Move to Trash',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await vawcService.softDeleteCase(row.id)
          await fetchTableData(page, filterValues)
          await fetchStats()
          showFeedback({
            variant: 'success',
            title: 'Case Moved to Trash',
            description: `Case #${row.caseNumber} has been moved to the Recycle Bin successfully.`,
          })
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || err?.message || 'Failed to move case to trash.'
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: errMsg,
          })
        }
      },
    })
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
      tone: 'slate',
    },
    {
      id: 'total_referred',
      label: 'Referred Cases',
      value: statsData?.totalReferredCases ?? 0,
      hint: 'Referred to DSWD / PNP / Court',
      icon: Share2,
      tone: 'slate',
    },
    {
      id: 'active_bpo',
      label: 'Active Protection Orders',
      value: statsData?.totalActiveBpo ?? 0,
      hint: 'Barangay Protection Orders in effect',
      icon: ShieldAlert,
      tone: 'slate',
    },
    {
      id: 'withdrawn_cases',
      label: 'Withdrawn Cases',
      value: statsData?.totalWithdrawnCases ?? 0,
      hint: 'Formally withdrawn complaints',
      icon: FileX2,
      tone: 'slate',
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

  // Table  // Row actions for 3-dots menu
  const actions: RowAction<VawcTableRowResponse>[] | undefined = useMemo(() => {
    const list: RowAction<VawcTableRowResponse>[] = []

    if (hasPermission('View Cases')) {
      list.push({
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => {
          setSelectedCaseId(row.id)
          setViewMode('DETAILS')
        },
      })
    }

    if (!isSystemAdmin) {
      if (hasPermission('Archive Case')) {
        list.push({
          id: 'archive',
          label: 'Archive Case',
          icon: Archive,
          tone: 'emerald',
          onClick: handleArchive,
        })
      }

      if (hasPermission('Delete Case')) {
        list.push({
          id: 'delete',
          label: 'Delete Case',
          icon: Trash2,
          tone: 'danger',
          onClick: handleSoftDelete,
        })
      }
    }

    return list.length > 0 ? list : undefined
  }, [hasPermission, isSystemAdmin, handleArchive, handleSoftDelete])

  if (viewMode === 'DETAILS' && selectedCaseId) {
    if (!hasPermission('View Cases')) {
      return (
        <div className="py-12 flex justify-center">
          <PermissionDeniedPage
            title="Access Denied"
            message="The owner of the workspace has not given you permission to view VAWC cases. Please contact the administrator."
            onBack={() => {
              setSelectedCaseId(null)
              setViewMode('LIST')
            }}
          />
        </div>
      )
    }

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
        title="VAWC Case Files"
        description="Confidential intake records, risk assessments, and protection orders for Violence Against Women and Children desk."
        actions={(() => {
          const acts = [
            {
              label: 'Reports & Analytics',
              icon: BarChart3,
              onClick: () => navigate('/vawc/reports'),
              className:
                'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer',
            },
          ]
          if (!isSystemAdmin && hasPermission('File Complaint')) {
            acts.push({
              label: '+ New VAWC Entry',
              icon: Plus,
              onClick: () => navigate('/vawc/entry'),
              className:
                'inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer',
            })
          }
          return acts
        })()}
      />

      {/* Reusable Stats KPI Cards Component */}
      <StatsCards cards={statCards} />

      {/* VAWC Cases DataTable */}
      <DataTable
        data={records}
        columns={columns}
        rowKey={(r) => r.id}
        actions={actions.length > 0 ? actions : undefined}
        actionsVariant="menu"
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


      {/* Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
export default VawcPage


