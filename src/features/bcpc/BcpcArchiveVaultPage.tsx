import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
  FolderArchive,
} from 'lucide-react'
import {
  bcpcApi,
} from '@/api/modules/bcpc.api'
import type {
  BlotterLifecycleKpiResponse,
  BlotterArchiveItemResponse,
  BlotterRecentDeleteItemResponse,
  PageResponse,
} from '@/api/modules/blotter.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { DataTable } from '@/components/ui/table/DataTable'
import { Badge } from '@/components/ui/table/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { maskConfidentialName } from '@/utils/formatters'

type VaultTab = 'archived' | 'recently_deleted'

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Child, or Complainant…',
  },
]

function getStatusBadge(status: string) {
  const normalized = (status || '').toUpperCase()
  switch (normalized) {
    case 'SETTLED':
    case 'RESOLVED':
      return <Badge tone="emerald">Settled</Badge>
    case 'DISMISSED':
      return <Badge tone="rose">Dismissed</Badge>
    case 'CLOSED':
      return <Badge tone="rose">Closed</Badge>
    case 'WITHDRAWN':
      return <Badge tone="rose">Withdrawn</Badge>
    case 'ISSUED_REFERRAL':
    case 'REFERRED':
      return <Badge tone="sky">Referred</Badge>
    case 'ONGOING':
      return <Badge tone="sky">Ongoing</Badge>
    case 'PENDING':
      return <Badge tone="amber">Pending</Badge>
    case 'EXPIRED_UNACTIONED':
      return <Badge tone="rose">Expired / Un-actioned</Badge>
    default:
      return <Badge tone="slate">{status ? status.replace(/_/g, ' ') : '—'}</Badge>
  }
}

export function BcpcArchiveVaultPage() {
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()
  const [activeTab, setActiveTab] = useState<VaultTab>('archived')

  // KPI Data
  const [kpiData, setKpiData] = useState<BlotterLifecycleKpiResponse | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(true)

  // Table Data & Filters
  const [archivedData, setArchivedData] = useState<PageResponse<BlotterArchiveItemResponse> | null>(null)
  const [deletedData, setDeletedData] = useState<PageResponse<BlotterRecentDeleteItemResponse> | null>(null)
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(true)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
  })
  const [page, setPage] = useState<number>(1)
  const pageSize = 5

  // Fetch KPI Data
  const fetchKpis = useCallback(async () => {
    try {
      const data = await bcpcApi.getArchiveKpi()
      setKpiData(data)
    } catch (err: any) {
      console.error('Failed to fetch BCPC archive KPIs:', err)
    } finally {
      setIsLoadingKpis(false)
    }
  }, [])

  // Fetch Table Data
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true)
    try {
      const params = {
        search: filterValues.search?.trim() || undefined,
        page: page - 1,
        size: pageSize,
      }

      if (activeTab === 'archived') {
        const res = await bcpcApi.getArchivedCases(params)
        setArchivedData(res)
      } else {
        const res = await bcpcApi.getRecentDeletedCases(params)
        setDeletedData(res)
      }
    } catch (err) {
      console.error('Failed to fetch BCPC archive/delete table:', err)
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

  // Filter Handlers
  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    setPage(1)
  }

  const handleClearFilter = () => {
    setFilterValues({
      search: '',
    })
    setPage(1)
  }

  // Restore Action Handler
  const handleRestoreCase = useCallback(
    (id: number, caseNumber: string) => {
      confirm({
        title: `Restore Case – ${caseNumber}?`,
        description: `Are you sure you want to restore "${caseNumber}" back to active BCPC Case records? All associated records will also be restored.`,
        confirmLabel: 'Restore Case',
        tone: 'emerald',
        onConfirm: async () => {
          try {
            await bcpcApi.restoreArchivedCase(id)
            showFeedback({
              variant: 'success',
              title: 'Case Restored',
              description: `Case "${caseNumber}" has been restored to active BCPC records.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to restore case:', err)
            showFeedback({
              variant: 'error',
              title: 'Unable to Restore Case',
              description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to restore this case back to active records. Please try again.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Soft Delete Action Handler (for Archived Cases Table)
  const handleSoftDeleteCase = useCallback(
    (id: number, caseNumber: string) => {
      confirm({
        title: `Move Case – ${caseNumber} to Trash?`,
        description: `Are you sure you want to move Case "${caseNumber}" to the Recycle Bin? You can restore it at any time from the Recently Deleted tab.`,
        confirmLabel: 'Move to Trash',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await bcpcApi.softDeleteCase(id)
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
              title: 'Unable to Move Case to Trash',
              description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to move this archived case to the recycle bin. Please try again.',
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
            await bcpcApi.permanentDeleteCase(id)
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
              title: 'Unable to Delete Case Permanently',
              description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to permanently remove this case from the recycle bin. Please try again.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Memoized Stat Cards matching Blotter format
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-archived',
        label: 'Total Archived Cases',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchived ?? 0).toLocaleString(),
        hint: 'All-time archived BCPC records',
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
        header: 'CASE / BCPC NO.',
        render: (row) => (
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
            {row.caseNumber}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'CHILD',
        render: (row) => (
          <span className="text-slate-600 text-sm font-semibold">
            {maskConfidentialName(row.respondentName)}
          </span>
        ),
      },
      {
        key: 'classification',
        header: 'CLASSIFICATION',
        render: (row) => {
          const cat = (row.classification || 'CAR').toUpperCase()
          return (
            <span className="text-slate-700 font-medium text-sm">
              {cat === 'CICL' ? 'CICL' : 'CAR'}
            </span>
          )
        },
      },
      {
        key: 'archiveRemarks',
        header: 'ARCHIVE REMARKS',
        className: 'max-w-[200px]',
        render: (row) => (
          <span
            className="text-slate-600 text-sm max-w-[200px] truncate block"
            title={row.archiveRemarks || 'Archived Record'}
          >
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
            {row.archivedAt
              ? new Date(row.archivedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'}
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
        header: 'CASE / BCPC NO.',
        render: (row) => (
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
            {row.caseNumber}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'CHILD',
        render: (row) => (
          <span className="text-slate-600 text-sm font-semibold">
            {maskConfidentialName(row.respondentName)}
          </span>
        ),
      },
      {
        key: 'classification',
        header: 'CLASSIFICATION',
        render: (row) => {
          const cat = (row.classification || 'CAR').toUpperCase()
          return (
            <span className="text-slate-700 font-medium text-sm">
              {cat === 'CICL' ? 'CICL' : 'CAR'}
            </span>
          )
        },
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
            {row.deletedAt
              ? new Date(row.deletedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
    ],
    []
  )

  // Row Actions for Archived Cases (3-Dots Menu)
  const archivedActions: RowAction<BlotterArchiveItemResponse>[] = useMemo(
    () => [
      {
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestoreCase(row.id, row.caseNumber),
      },
      {
        id: 'delete',
        label: 'Move to Trash',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleSoftDeleteCase(row.id, row.caseNumber),
      },
    ],
    [handleRestoreCase, handleSoftDeleteCase]
  )

  // Row Actions for Soft-Deleted Cases (3-Dots Menu)
  const deletedActions: RowAction<BlotterRecentDeleteItemResponse>[] = useMemo(
    () => [
      {
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestoreCase(row.id, row.caseNumber),
      },
      {
        id: 'delete',
        label: 'Delete Permanently',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handlePermanentDeleteCase(row.id, row.caseNumber),
      },
    ],
    [handleRestoreCase, handlePermanentDeleteCase]
  )

  const currentTotalElements =
    activeTab === 'archived'
      ? archivedData?.totalElements ?? 0
      : deletedData?.totalElements ?? 0
  const currentTotalPages =
    activeTab === 'archived'
      ? archivedData?.totalPages ?? 1
      : deletedData?.totalPages ?? 1

  return (
    <div className="space-y-6">
      {/* --- REUSABLE PAGE HEADER --- */}
      <PageHeader
        title="BCPC Archive & Trash Vault"
        description="Centralized repository for archived BCPC cases and soft-deleted records."
      />

      {/* --- REUSABLE STATS CARDS --- */}
      <StatsCards cards={statCards} />

      {/* --- PILL TABS SELECTOR --- */}
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
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-emerald-600" />
          <span>Archived Cases</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'archived'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            {kpiData?.totalArchived ?? 0}
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
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Recycle Bin (Trash)</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'recently_deleted'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            {kpiData?.totalRecentlyDeleted ?? 0}
          </span>
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
            Showing closed and completed BCPC cases preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* --- TABLE CONTROLS & FILTER BAR --- */}
      <TableFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* --- DATA TABLE --- */}
      {activeTab === 'archived' ? (
        <DataTable<BlotterArchiveItemResponse>
          data={archivedData?.content || []}
          columns={archivedColumns}
          actions={archivedActions}
          rowKey={(row) => row.id}
          pageSize={pageSize}
          emptyTitle="No Archived Cases Found"
          emptyDescription="Archived BCPC case records will appear here."
          serverPagination={{
            page,
            pageCount: currentTotalPages,
            totalItems: currentTotalElements,
            pageSize,
            onPageChange: setPage,
          }}
        />
      ) : (
        <DataTable<BlotterRecentDeleteItemResponse>
          data={deletedData?.content || []}
          columns={deletedColumns}
          actions={deletedActions}
          rowKey={(row) => row.id}
          pageSize={pageSize}
          emptyTitle="Recycle Bin is Empty"
          emptyDescription="Soft-deleted BCPC records in the staging area will appear here."
          serverPagination={{
            page,
            pageCount: currentTotalPages,
            totalItems: currentTotalElements,
            pageSize,
            onPageChange: setPage,
          }}
        />
      )}

      {/* --- REUSABLE DIALOGS --- */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}

export const BcpcArchive = BcpcArchiveVaultPage
export default BcpcArchiveVaultPage
