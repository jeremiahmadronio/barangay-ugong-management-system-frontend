import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale,
  Plus,
  Eye,
  CheckCircle2,
  Hourglass,
  FileSpreadsheet,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  DataTable,
  TableFilters,
  Badge,
  ConfirmationDialog,
  FeedbackDialog,
  StatsCards,
  LoadingState,
  type StatCard,
} from '@/components/ui'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { LuponCaseDetailsView } from './components/LuponCaseDetailsView'
import {
  luponApi,
  type LuponRecord,
  type LuponStatsResponse,
  type LuponTableRowResponse,
} from '@/api/modules/lupon.api'
import { formatDate, formatTableName } from '@/utils/formatters'

const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Complainant, or Respondent...',
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Under Conciliation', value: 'UNDER_CONCILIATION' },
      { label: 'Settled', value: 'SETTLED' },
      { label: 'Certified to File Action', value: 'CERTIFIED_TO_FILE_ACTION' },
      { label: 'Expired Unactioned', value: 'EXPIRED_UNACTIONED' },
      { label: 'Dismissed', value: 'DISMISSED' },
    ],
  },
]

export const LuponPage = () => {
  const navigate = useNavigate()

  // Real backend records & stats
  const [records, setRecords] = useState<LuponRecord[]>([])
  const [statsData, setStatsData] = useState<LuponStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
  })

  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST')
  const [selectedRecord, setSelectedRecord] = useState<LuponRecord | null>(null)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  // Custom hook for confirmation & feedback dialogs
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Fetch real Lupon cases & stats from Spring Boot backend API
  const fetchBackendRecords = async (currentFilters = filterValues) => {
    setIsLoading(true)
    try {
      const statusVal = currentFilters.status
      let statusParam: string | undefined = undefined
      if (statusVal && statusVal !== 'all') {
        statusParam = statusVal
      }

      const [res, stats] = await Promise.all([
        luponApi.getTable({
          search: currentFilters.search?.trim() || undefined,
          status: statusParam,
          natureOfComplaint: currentFilters.nature !== 'all' ? currentFilters.nature : undefined,
          page: 0,
          size: 50,
        }),
        luponApi.getStats().catch(() => null),
      ])

      if (stats) {
        setStatsData(stats)
      }

      const data = Array.isArray(res) ? res : res && 'content' in res ? res.content : []

      if (data && Array.isArray(data)) {
        const mapped: LuponRecord[] = data.map((b: LuponTableRowResponse) => {
          const rawSt = String(b.effectiveStatus || 'UNDER_CONCILIATION').toUpperCase()
          let displayStatus: LuponRecord['status'] = 'Under Conciliation'

          if (rawSt === 'SETTLED' || rawSt === 'RESOLVED') {
            displayStatus = 'Settled'
          } else if (rawSt === 'UNDER_CONCILIATION') {
            displayStatus = 'Under Conciliation'
          } else if (rawSt === 'UNDER_MEDIATION') {
            displayStatus = 'Under Mediation'
          } else if (rawSt === 'CERTIFIED_TO_FILE_ACTION' || rawSt === 'CFA_ISSUED') {
            displayStatus = 'Certified to File Action'
          } else if (rawSt === 'EXPIRED_UNACTIONED' || rawSt === 'EXPIRED') {
            displayStatus = 'Expired Unactioned'
          } else if (rawSt === 'DISMISSED') {
            displayStatus = 'Dismissed'
          } else if (rawSt === 'WITHDRAWN') {
            displayStatus = 'Withdrawn'
          } else if (rawSt === 'IN_PROGRESS' || rawSt === 'ON_GOING') {
            displayStatus = 'On Going'
          } else {
            displayStatus = 'Pending'
          }

          const caseNo = String(b.rootCaseNumber || b.latestCaseNumber || 'N/A')
          const filingTypeLabel = b.filingType || 'Formal Complaint'
          const cycleCount = b.cycleCount || 1
          const isReopened = Boolean(b.isReopened || cycleCount > 1)
          const activeId = String(b.latestActiveCaseId || b.rootCaseId)

          const compName = b.complainantFullName || formatTableName({ fallback: 'Complainant' })
          const respName = b.respondentFullName || formatTableName({ fallback: 'Respondent' })

          return {
            id: activeId,
            caseNo,
            complainant: compName,
            respondent: respName,
            dateFiled: formatDate(b.dateFiled),
            dateReferred: formatDate(b.dateReferred || b.dateFiled),
            filingTypeLabel,
            cycleCount,
            isReopened,
            latestActiveCaseId: Number(activeId),
            status: displayStatus,
            rawStatus: rawSt,
          }
        })
        setRecords(mapped)
      } else {
        setRecords([])
      }
    } catch {
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchBackendRecords(filterValues)
    }

    const handleFocus = () => {
      if (viewMode === 'LIST') {
        fetchBackendRecords(filterValues)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [viewMode, filterValues])

  // Calculate Stat Cards Metrics using real backend stats data or fallback
  const totalReferredCount = statsData?.totalReferred ?? records.length
  const activeConciliationCount = statsData?.activeConciliation ?? records.filter(
    (r) => r.status === 'Under Conciliation' || r.status === 'Under Mediation' || r.rawStatus === 'UNDER_CONCILIATION'
  ).length
  const settledCount = statsData?.successfullySettled ?? records.filter((r) => r.status === 'Settled').length
  const cfaCount = statsData?.cfaIssued ?? records.filter((r) => r.status === 'Certified to File Action' || r.rawStatus === 'CERTIFIED_TO_FILE_ACTION' || r.rawStatus === 'CFA_ISSUED').length

  const getTrendType = (trendStr?: string): 'up' | 'down' | 'neutral' => {
    if (!trendStr) return 'neutral'
    const trimmed = trendStr.trim()
    if (trimmed.startsWith('+') && !trimmed.includes('+0.0%') && !trimmed.includes('+0%')) return 'up'
    if (trimmed.startsWith('-') && !trimmed.includes('-0.0%') && !trimmed.includes('-0%')) return 'down'
    return 'neutral'
  }

  const casesTrendText = statsData?.totalReferredTrend || (totalReferredCount > 0 ? '+100.0% vs last month' : '0.0% vs last month')

  const statCards: StatCard[] = [
    {
      id: 'total_referred',
      label: 'Total Cases Referred',
      value: totalReferredCount,
      hint: casesTrendText,
      trend: getTrendType(casesTrendText),
      showTrend: true,
      icon: Scale,
      tone: 'indigo',
    },
    {
      id: 'active_conciliation',
      label: 'Active Conciliations',
      value: activeConciliationCount,
      hint: 'Ongoing Pangkat hearings',
      icon: Hourglass,
      tone: 'amber',
    },
    {
      id: 'successfully_settled',
      label: 'Successfully Settled',
      value: settledCount,
      hint: 'Amicable settlements reached',
      icon: CheckCircle2,
      tone: 'emerald',
    },
    {
      id: 'cfa_issued',
      label: 'CFA Issued / Endorsed',
      value: cfaCount,
      hint: 'Certificates to File Action',
      icon: FileSpreadsheet,
      tone: 'violet',
    },
  ]

  // Client-side filtering for search & status
  const filteredRecords = records.filter((r) => {
    const search = (filterValues.search ?? '').trim().toLowerCase()
    const selectedStatus = (filterValues.status ?? 'all').toLowerCase()

    const matchesSearch =
      search === '' ||
      r.caseNo.toLowerCase().includes(search) ||
      r.complainant.toLowerCase().includes(search) ||
      r.respondent.toLowerCase().includes(search)

    const matchesStatus =
      selectedStatus === 'all' ||
      r.rawStatus.toLowerCase() === selectedStatus ||
      r.status.toLowerCase() === selectedStatus.replace('_', ' ')

    return matchesSearch && matchesStatus
  })

  // Table Columns using Reusable UI DataTable Format
  const columns: Column<LuponRecord>[] = [
    {
      key: 'caseNo',
      header: 'CASE / DOCKET NO.',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.caseNo}</span>
          <span className="block text-[10px] font-medium text-slate-400">
            {r.filingTypeLabel}
          </span>
        </div>
      ),
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
        const toneMap: Record<LuponRecord['status'], BadgeTone> = {
          Pending: 'amber',
          'On Going': 'sky',
          'Under Mediation': 'sky',
          'Under Conciliation': 'indigo',
          Settled: 'emerald',
          'Certified to File Action': 'violet',
          'Expired Unactioned': 'rose',
          Dismissed: 'rose',
          Withdrawn: 'rose',
        }
        return <Badge tone={toneMap[r.status] || 'slate'}>{r.status.toUpperCase()}</Badge>
      },
    },
    {
      key: 'dateFiled',
      header: 'DATE FILED',
    },
    {
      key: 'dateReferred',
      header: 'DATE REFERRED',
    },
  ]

  // View Details
  const handleView = (row: LuponRecord) => {
    setSelectedRecord(row)
    setViewMode('DETAILS')
  }

  // Mark as Settled
  const handleSettle = (row: LuponRecord) => {
    confirm({
      title: 'Mark Case as Settled?',
      description: `Are you sure case #${row.caseNo} has reached an amicable settlement through Lupon conciliation?`,
      tone: 'default',
      confirmLabel: 'Mark as Settled',
      onConfirm: async () => {
        try {
          await luponApi.updateStatus(row.id, 'SETTLED')
          await fetchBackendRecords()
          setDetailRefreshKey((prev) => prev + 1)
          showFeedback({
            variant: 'success',
            title: 'Case Settled',
            description: `Case #${row.caseNo} status has been updated to Settled.`,
          })
        } catch {
          showFeedback({
            variant: 'error',
            title: 'Action Failed',
            description: `Failed to update status for Case #${row.caseNo}. Please try again.`,
          })
        }
      },
    })
  }

  // Table Actions — 3 dots dropdown menu using Reusable RowAction[]
  const actions: RowAction<LuponRecord>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      tone: 'primary',
      onClick: handleView,
    },
    {
      id: 'settle',
      label: 'Mark as Settled',
      icon: CheckCircle2,
      tone: 'emerald',
      onClick: handleSettle,
    },
  ]

  return (
    <div className="space-y-6">
      {viewMode === 'DETAILS' && selectedRecord ? (
        <LuponCaseDetailsView
          caseId={selectedRecord.id}
          caseNumber={selectedRecord.caseNo}
          refreshKey={detailRefreshKey}
          onBack={() => {
            setSelectedRecord(null)
            setViewMode('LIST')
            fetchBackendRecords()
          }}
          onSettle={() => handleSettle(selectedRecord)}
        />
      ) : (
        <>
          {/* Unified System PageHeader */}
          <PageHeader
            title="Lupong Tagapamayapa Cases"
            description="Conciliation, mediation, and dispute settlement records under Katarungang Pambarangay."
          />

          {/* Reusable Stats Cards Component */}
          <StatsCards cards={statCards} />

          {/* Lupon Data Table or Loading State */}
          {isLoading && records.length === 0 ? (
            <LoadingState
              message="Loading Lupon Cases…"
              description="Fetching conciliation records and stats from backend..."
              variant="card"
            />
          ) : (
            <DataTable
              data={filteredRecords}
              columns={columns}
              rowKey={(r) => r.id}
              actions={actions}
              pageSize={5}
              emptyTitle="No Lupon cases found"
              emptyDescription="There are no Lupon conciliation cases matching your search criteria or filters."
              header={
                <TableFilters
                  filters={filterConfigs}
                  values={filterValues}
                  onApply={(applied) => setFilterValues(applied)}
                  onClear={() => setFilterValues({ search: '', status: 'all' })}
                />
              }
            />
          )}
        </>
      )}

      {/* Confirmation and Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}

