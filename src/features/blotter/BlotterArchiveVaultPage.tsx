import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Trash2,
  Calendar,
  Clock,
  RefreshCw,
  Info,
  RotateCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import {
  blotterApi,
  type BlotterLifecycleKpiResponse,
  type BlotterArchiveItemResponse,
  type BlotterRecentDeleteItemResponse,
  type PageResponse,
} from '@/config/api/modules/blotter.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { DataTable } from '@/components/ui/table/DataTable'
import { Badge } from '@/components/ui/table/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'

type VaultTab = 'archived' | 'recently_deleted'

const FILING_TYPE_OPTIONS = [
  { label: 'All Filing Types', value: 'all' },
  { label: 'Formal Complaint', value: 'FORMAL_COMPLAINT' },
  { label: 'For the Record', value: 'FOR_RECORD_ONLY' },
]

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Complainant, or Respondent…',
  },
  {
    key: 'filingType',
    label: 'Filing Type',
    options: FILING_TYPE_OPTIONS,
  },
]

function getStatusBadge(status: string) {
  const normalized = (status || '').toUpperCase()
  switch (normalized) {
    case 'SETTLED':
    case 'RESOLVED':
      return <Badge tone="emerald">Settled</Badge>
    case 'DISMISSED':
      return <Badge tone="slate">Dismissed</Badge>
    case 'REFERRED_TO_LUPON':
    case 'REFERRED':
      return <Badge tone="indigo">Referred to Lupon</Badge>
    case 'CERTIFIED_TO_FILE_ACTION':
    case 'CFA_ISSUED':
      return <Badge tone="violet">CFA Issued</Badge>
    case 'PENDING':
      return <Badge tone="amber">Pending</Badge>
    case 'UNDER_MEDIATION':
    case 'UNDER_CONCILIATION':
      return <Badge tone="sky">Under Mediation</Badge>
    default:
      return <Badge tone="slate">{status || '—'}</Badge>
  }
}

export function BlotterArchiveVaultPage() {
  const { hasPermission } = useUserPermissions()
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()
  const [activeTab, setActiveTab] = useState<VaultTab>('archived')

  // KPI Data
  const [kpiData, setKpiData] = useState<BlotterLifecycleKpiResponse | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Table Data & Filters
  const [archivedData, setArchivedData] = useState<PageResponse<BlotterArchiveItemResponse> | null>(null)
  const [deletedData, setDeletedData] = useState<PageResponse<BlotterRecentDeleteItemResponse> | null>(null)
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(true)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    filingType: 'all',
  })
  const [page, setPage] = useState<number>(1)
  const pageSize = 5

  // Fetch KPI Data
  const fetchKpis = useCallback(async () => {
    try {
      const data = await blotterApi.getArchiveKpi()
      setKpiData(data)
    } catch (err: any) {
      console.error('Failed to fetch blotter archive KPIs:', err)
    } finally {
      setIsLoadingKpis(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch Table Data
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true)
    try {
      const params = {
        search: filterValues.search?.trim() || undefined,
        filingType: filterValues.filingType !== 'all' ? filterValues.filingType : undefined,
        page: page - 1, // 0-indexed for Spring backend
        size: pageSize,
      }

      if (activeTab === 'archived') {
        const res = await blotterApi.getArchivedCases(params)
        setArchivedData(res)
      } else {
        const res = await blotterApi.getRecentDeletedCases(params)
        setDeletedData(res)
      }
    } catch (err) {
      console.error('Failed to fetch blotter archive/delete table:', err)
    } finally {
      setIsLoadingTable(false)
    }
  }, [activeTab, page, pageSize, filterValues])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchKpis()
    fetchTableData()
  }

  // Filter Handlers
  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    setPage(1)
  }

  const handleClearFilter = () => {
    setFilterValues({
      search: '',
      filingType: 'all',
    })
    setPage(1)
  }

  // Restore Action Handler
  const handleRestoreCase = useCallback(
    (id: number, caseNumber: string) => {
      confirm({
        title: `Restore Case – ${caseNumber}?`,
        description: `Are you sure you want to restore "${caseNumber}" back to active Blotter Desk records? All associated child cases in its cycle chain will also be restored.`,
        confirmLabel: 'Restore Case',
        tone: 'emerald',
        onConfirm: async () => {
          try {
            await blotterApi.restoreArchivedCase(id)
            showFeedback({
              variant: 'success',
              title: 'Case Restored',
              description: `Case "${caseNumber}" and its cycle chain have been restored to active management.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to restore case:', err)
            showFeedback({
              variant: 'error',
              title: 'Restore Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to restore case.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Soft Delete Action Handler (for Archived Cases)
  const handleSoftDeleteCase = useCallback(
    (id: number, caseNumber: string) => {
      confirm({
        title: `Move Case – ${caseNumber} to Trash?`,
        description: `Are you sure you want to move Case "${caseNumber}" to the Recycle Bin? You can restore it at any time from the Recently Deleted tab.`,
        confirmLabel: 'Move to Trash',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await blotterApi.softDeleteCase(id)
            showFeedback({
              variant: 'success',
              title: 'Case Moved to Trash',
              description: `Case "${caseNumber}" has been moved to the Recycle Bin.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to soft delete case:', err)
            showFeedback({
              variant: 'error',
              title: 'Delete Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to delete case.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Permanent Delete Action Handler (for Soft-Deleted Trash Cases)
  const handlePermanentDeleteCase = useCallback(
    (id: number, caseNumber: string) => {
      confirm({
        title: `Permanently Delete Case – ${caseNumber}?`,
        description: `Are you sure you want to permanently delete "${caseNumber}" from the Recycle Bin? This action is audit-safe and cannot be undone.`,
        confirmLabel: 'Permanently Delete',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await blotterApi.permanentDeleteCase(id)
            showFeedback({
              variant: 'success',
              title: 'Case Permanently Deleted',
              description: `Case "${caseNumber}" has been permanently purged from the Recycle Bin.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to permanently delete case:', err)
            showFeedback({
              variant: 'error',
              title: 'Permanent Delete Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to permanently delete case.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // KPI Stat Cards Config
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-archived',
        label: 'Total Archived Cases',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchived ?? 0).toLocaleString(),
        hint: 'All-time archived blotter records',
        icon: Archive,
        tone: 'emerald',
      },
      {
        id: 'archived-this-month',
        label: 'Archived This Month',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchivedThisMonth ?? 0).toLocaleString(),
        hint: 'Archived in current month',
        icon: Calendar,
        tone: 'sky',
      },
      {
        id: 'recycle-bin',
        label: 'Recycle Bin (Trash)',
        value: isLoadingKpis ? '...' : (kpiData?.totalRecentlyDeleted ?? 0).toLocaleString(),
        hint: 'Soft-deleted records (restoreable)',
        icon: Trash2,
        tone: 'rose',
      },
      {
        id: 'deleted-this-month',
        label: 'Deleted This Month',
        value: isLoadingKpis ? '...' : (kpiData?.totalRecentlyDeletedThisMonth ?? 0).toLocaleString(),
        hint: 'Deleted & purged in current month',
        icon: Clock,
        tone: 'amber',
      },
    ],
    [isLoadingKpis, kpiData]
  )

  // Columns for Archived Cases Table
  const archivedColumns: Column<BlotterArchiveItemResponse>[] = useMemo(
    () => [
      {
        key: 'caseNumber',
        header: 'CASE / BLOTTER NO.',
        render: (row) => (
          <div>
            <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
              {row.caseNumber}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              {row.filingType === 'FORMAL_COMPLAINT' ? 'Formal Complaint' : 'For the Record'}
            </span>
          </div>
        ),
      },
      {
        key: 'complainantName',
        header: 'COMPLAINANT',
        render: (row) => (
          <span className="font-semibold text-slate-700 text-sm">
            {row.complainantName}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'RESPONDENT',
        render: (row) => (
          <span className="text-slate-600 text-sm">
            {row.respondentName}
          </span>
        ),
      },
      {
        key: 'archiveRemarks',
        header: 'ARCHIVE REMARKS',
        className: 'max-w-[200px]',
        render: (row) => (
          <span className="text-slate-600 text-sm max-w-[200px] truncate block" title={row.archiveRemarks || 'Archived Record'}>
            {row.archiveRemarks || 'Archived Record'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => getStatusBadge(row.status),
      },
      {
        key: 'archivedAt',
        header: 'ARCHIVED AT',
        render: (row) => (
          <span className="text-slate-600 text-sm whitespace-nowrap">
            {row.archivedAt ? new Date(row.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  // Columns for Soft-Deleted Cases Table
  const deletedColumns: Column<BlotterRecentDeleteItemResponse>[] = useMemo(
    () => [
      {
        key: 'caseNumber',
        header: 'CASE / BLOTTER NO.',
        render: (row) => (
          <div>
            <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
              {row.caseNumber}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              {row.filingType === 'FORMAL_COMPLAINT' ? 'Formal Complaint' : 'For the Record'}
            </span>
          </div>
        ),
      },
      {
        key: 'complainantName',
        header: 'COMPLAINANT',
        render: (row) => (
          <span className="font-semibold text-slate-700 text-sm">
            {row.complainantName}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'RESPONDENT',
        render: (row) => (
          <span className="text-slate-600 text-sm">
            {row.respondentName}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => getStatusBadge(row.status),
      },
      {
        key: 'deletedAt',
        header: 'DELETED AT',
        render: (row) => (
          <span className="text-slate-600 text-sm whitespace-nowrap">
            {row.deletedAt ? new Date(row.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  // Row Actions for Archived Cases (3-Dots Menu) filtered by permissions
  const archivedActions: RowAction<BlotterArchiveItemResponse>[] = useMemo(() => {
    const list: RowAction<BlotterArchiveItemResponse>[] = []
    if (hasPermission('Restore Case')) {
      list.push({
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestoreCase(row.id, row.caseNumber),
      })
    }
    if (hasPermission('Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Record',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleSoftDeleteCase(row.id, row.caseNumber),
      })
    }
    return list
  }, [hasPermission, handleRestoreCase, handleSoftDeleteCase])

  // Row Actions for Soft-Deleted Cases (3-Dots Menu) filtered by permissions
  const deletedActions: RowAction<BlotterRecentDeleteItemResponse>[] = useMemo(() => {
    const list: RowAction<BlotterRecentDeleteItemResponse>[] = []
    if (hasPermission('Restore Case')) {
      list.push({
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestoreCase(row.id, row.caseNumber),
      })
    }
    if (hasPermission('Permanent Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Permanently',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handlePermanentDeleteCase(row.id, row.caseNumber),
      })
    }
    return list
  }, [hasPermission, handleRestoreCase, handlePermanentDeleteCase])

  const currentTotalElements = activeTab === 'archived' ? (archivedData?.totalElements ?? 0) : (deletedData?.totalElements ?? 0)
  const currentTotalPages = activeTab === 'archived' ? (archivedData?.totalPages ?? 1) : (deletedData?.totalPages ?? 1)

  return (
    <div className="space-y-6">
      {/* --- REUSABLE PAGE HEADER --- */}
      <PageHeader
        title="Blotter Archive & Trash Vault"
        description="Centralized repository for archived blotter cases and soft-deleted records."
      />

      {/* --- REUSABLE STATS CARDS --- */}
      <StatsCards cards={statCards} />

      {/* --- PILL TABS SELECTOR (Matching User Design) --- */}
      <div className="flex items-center gap-2 bg-slate-100/70 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('archived')
            setPage(1)
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Archive size={16} className={activeTab === 'archived' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Archived</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            {kpiData?.totalArchived ?? archivedData?.totalElements ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('recently_deleted')
            setPage(1)
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'recently_deleted'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Trash2 size={16} className={activeTab === 'recently_deleted' ? 'text-rose-600' : 'text-slate-400'} />
          <span>Recently Deleted</span>
        </button>
      </div>

      {/* --- CONTEXTUAL ALERT BANNER --- */}
      {activeTab === 'recently_deleted' ? (
        <div className="flex items-center rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-rose-800 text-xs sm:text-sm font-medium">
          <span>
            These are soft-deleted records. Permanently deleted records are strictly excluded and never shown in this vault.
          </span>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 text-xs sm:text-sm font-medium">
          <span>
            Showing closed and completed Blotter cases preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* --- REUSABLE TABLE FILTERS --- */}
      <TableFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* --- REUSABLE DATA TABLE --- */}
      {activeTab === 'archived' ? (
        <DataTable
          data={archivedData?.content ?? []}
          columns={archivedColumns}
          rowKey={(row) => row.id}
          actions={archivedActions.length > 0 ? archivedActions : undefined}
          actionsVariant="menu"
          pageSize={pageSize}
          emptyTitle="No Archived Cases Found"
          emptyDescription="There are currently no blotter cases matching your archive filter criteria."
          serverPagination={{
            page,
            pageCount: currentTotalPages,
            totalItems: currentTotalElements,
            pageSize,
            onPageChange: setPage,
          }}
        />
      ) : (
        <DataTable
          data={deletedData?.content ?? []}
          columns={deletedColumns}
          rowKey={(row) => row.id}
          actions={deletedActions.length > 0 ? deletedActions : undefined}
          actionsVariant="menu"
          pageSize={pageSize}
          emptyTitle="No Soft-Deleted Cases Found"
          emptyDescription="There are currently no soft-deleted records in the recycle bin."
          serverPagination={{
            page,
            pageCount: currentTotalPages,
            totalItems: currentTotalElements,
            pageSize,
            onPageChange: setPage,
          }}
        />
      )}

      {/* --- CONFIRMATION & FEEDBACK DIALOGS --- */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
