import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale,
  Plus,
  Eye,
  CheckCircle2,
  Hourglass,
  FileSpreadsheet,
  Archive,
  Trash2,
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
  FormModal,
  type StatCard,
} from '@/components/ui'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'
import { LuponCaseDetailsView } from './components/LuponCaseDetailsView'
import { CaseReasonModal } from '@/components/ui/details/CaseReasonModal'
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
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'


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
  const [settlingRecord, setSettlingRecord] = useState<LuponRecord | null>(null)
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false)

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

  const casesTrendText =
    statsData?.totalReferredTrend ||
    (totalReferredCount > 0 ? '+100.0% vs last month' : '0.0% vs last month')

  const calculatedSettlementRate =
    statsData?.settlementRate ??
    (totalReferredCount > 0 ? (settledCount / totalReferredCount) * 100 : 0)
  const settledRateText = `${calculatedSettlementRate.toFixed(1)}% settlement rate`

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
      badgeType: 'ratio',
      ratioRate: calculatedSettlementRate,
      ratioLabel: 'settlement rate',
      hint: settledRateText,
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

  // State for Archive Remarks Modal
  const [archivingRecord, setArchivingRecord] = useState<LuponRecord | null>(null)
  const [archiveRemarksInput, setArchiveRemarksInput] = useState<string>('Archived Record')
  const [isArchivingSubmitting, setIsArchivingSubmitting] = useState<boolean>(false)

  // Archive record — Enforces Business Rule: Cannot archive if Pending, On Going, Under Mediation, or Under Conciliation!
  const handleArchive = (row: LuponRecord) => {
    const activeStatuses: LuponRecord['status'][] = ['Pending', 'On Going', 'Under Mediation', 'Under Conciliation']
    if (activeStatuses.includes(row.status)) {
      showFeedback({
        variant: 'error',
        title: 'Archiving Blocked by Business Rule',
        description: `Cannot archive Case #${row.caseNo} because its status is currently ${row.status.toUpperCase()}. Only Settled, Dismissed, or Withdrawn cases can be archived.`,
      })
      return
    }

    setArchiveRemarksInput('Archived Record')
    setArchivingRecord(row)
  }

  const submitArchive = async () => {
    if (!archivingRecord) return
    setIsArchivingSubmitting(true)
    try {
      await luponApi.archiveCase(archivingRecord.id, archiveRemarksInput.trim() || 'Archived Record')
      setArchivingRecord(null)
      await fetchBackendRecords()
      showFeedback({
        variant: 'success',
        title: 'Case Archived',
        description: `Case #${archivingRecord.caseNo} has been moved to the Archive Vault successfully.`,
      })
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to archive case.'
      showFeedback({
        variant: 'error',
        title: 'Archive Failed',
        description: errMsg,
      })
    } finally {
      setIsArchivingSubmitting(false)
    }
  }

  // Soft Delete Action Handler
  const handleSoftDelete = (row: LuponRecord) => {
    const activeStatuses: LuponRecord['status'][] = ['Pending', 'On Going', 'Under Mediation', 'Under Conciliation']
    if (activeStatuses.includes(row.status)) {
      showFeedback({
        variant: 'error',
        title: 'Delete Blocked by Business Rule',
        description: `Cannot move active case #${row.caseNo} to trash while it is ${row.status.toUpperCase()}. Please settle, dismiss, or withdraw the case first.`,
      })
      return
    }

    confirm({
      title: `Move Case #${row.caseNo} to Trash?`,
      description: `Are you sure you want to move Case #${row.caseNo} (${row.complainant} vs ${row.respondent}) to the Recycle Bin? You can restore it at any time from the Archive & Trash Vault.`,
      confirmLabel: 'Move to Trash',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await luponApi.softDeleteCase(row.id)
          await fetchBackendRecords()
          showFeedback({
            variant: 'success',
            title: 'Case Moved to Trash',
            description: `Case #${row.caseNo} has been moved to the Recycle Bin successfully.`,
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

  // Table Actions — 3 dots dropdown menu using Reusable RowAction[]
  const actions: RowAction<LuponRecord>[] = isSystemAdmin
    ? [
        {
          id: 'view',
          label: 'View Details',
          icon: Eye,
          tone: 'primary',
          onClick: handleView,
        },
      ]
    : [
        {
          id: 'view',
          label: 'View Details',
          icon: Eye,
          tone: 'primary',
          onClick: handleView,
        },
        {
          id: 'archive',
          label: 'Archive Case',
          icon: Archive,
          tone: 'emerald',
          onClick: handleArchive,
        },
        {
          id: 'delete',
          label: 'Delete Case',
          icon: Trash2,
          tone: 'danger',
          onClick: handleSoftDelete,
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
          onSettle={() => {
            fetchBackendRecords()
            setDetailRefreshKey((prev) => prev + 1)
          }}
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

      {/* Settle Reason Modal for Table Actions */}
      <CaseReasonModal
        open={Boolean(settlingRecord)}
        title="Mark Case as Settled"
        caseNumber={settlingRecord?.caseNo}
        caseLabel={settlingRecord?.filingTypeLabel?.toLowerCase()}
        placeholder="Enter settlement terms or agreement summary..."
        confirmLabel="Mark as Settled"
        confirmTone="emerald"
        isLoading={isSubmittingSettle}
        onCancel={() => setSettlingRecord(null)}
        onConfirm={async (remarks) => {
          if (!settlingRecord) return
          setIsSubmittingSettle(true)
          try {
            await luponApi.updateStatus(settlingRecord.id, 'SETTLED', remarks)
            setSettlingRecord(null)
            await fetchBackendRecords()
            setDetailRefreshKey((prev) => prev + 1)
            showFeedback({
              variant: 'success',
              title: 'Case Settled',
              description: `Case #${settlingRecord.caseNo} status has been updated to Settled.`,
            })
          } catch {
            showFeedback({
              variant: 'error',
              title: 'Action Failed',
              description: `Failed to update status for Case #${settlingRecord.caseNo}. Please try again.`,
            })
          } finally {
            setIsSubmittingSettle(false)
          }
        }}
      />

      {/* Reusable FormModal for Archive Remarks */}
      <FormModal
        open={Boolean(archivingRecord)}
        title={archivingRecord ? `Archive Case #${archivingRecord.caseNo}` : 'Archive Lupon Case'}
        submitLabel="Archive Case"
        submitTone="emerald"
        isSubmitting={isArchivingSubmitting}
        maxWidthClass="max-w-md"
        onClose={() => setArchivingRecord(null)}
        onSubmit={submitArchive}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <Archive size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-900 mb-0.5">Lupon Archive Policy</span>
              Archiving will move <strong>Case #{archivingRecord?.caseNo}</strong> from active conciliation records into the official Barangay Archive Vault. You can restore it at any time.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Archive Remarks / Closing Reason
            </label>
            <textarea
              rows={3}
              value={archiveRemarksInput}
              onChange={(e) => setArchiveRemarksInput(e.target.value)}
              placeholder="e.g. Conciliation completed, amicable settlement executed."
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>
      </FormModal>

      {/* Confirmation and Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}

