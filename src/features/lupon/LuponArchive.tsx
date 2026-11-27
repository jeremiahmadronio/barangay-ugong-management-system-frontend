import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
  FileText,
} from 'lucide-react'
import {
  luponService,
} from '@/config/api/lupon/lupon.service'
import type {
  BlotterLifecycleKpiResponse,
  BlotterArchiveItemResponse,
  BlotterRecentDeleteItemResponse,
  PageResponse,
} from '@/config/api/blotter/blotter.types'
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
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'
import { LuponCaseDetailsView } from './components/LuponCaseDetailsView'
import { formatDate, formatTableName } from '@/utils/formatters'

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
      return <Badge tone="rose">Dismissed</Badge>
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
      return <Badge tone="sky">Under Conciliation</Badge>
    case 'FOR_RECORD_ONLY':
    case 'RECORDED':
      return <Badge tone="slate">Recorded</Badge>
    case 'EXPIRED_UNACTIONED':
    case 'EXPIRED':
      return <Badge tone="rose">Expired</Badge>
    default:
      return <Badge tone="slate">{status || '—'}</Badge>
  }
}

export function LuponArchive() {
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()
  const { hasPermission } = useUserPermissions()
  const [activeTab, setActiveTab] = useState<VaultTab>('archived')

  // KPI Data
  const [kpiData, setKpiData] = useState<BlotterLifecycleKpiResponse | null>(null)

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

  // View Details Modal State
  const [selectedCase, setSelectedCase] = useState<{ id: number; caseNumber: string } | null>(null)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  // Fetch KPI Data
  const fetchKpis = useCallback(async () => {
    try {
      const data = await luponService.getArchiveKpi()
      setKpiData(data)
    } catch (err: any) {
      console.error('Failed to fetch Lupon archive KPIs:', err)
    }
  }, [])

  // Fetch Table Data
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true)
    try {
      const params = {
        search: filterValues.search?.trim() || undefined,
        filingType: filterValues.filingType !== 'all' ? filterValues.filingType : undefined,
        page: page - 1,
        size: pageSize,
      }

      if (activeTab === 'archived') {
        const res = await luponService.getArchivedCases(params)
        setArchivedData(res)
      } else {
        const res = await luponService.getRecentDeletedCases(params)
        setDeletedData(res)
      }
    } catch (err) {
      console.error('Failed to fetch Lupon archive/delete table:', err)
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
      filingType: 'all',
    })
    setPage(1)
  }

  // --- ARCHIVE TAB ACTIONS ---
  const handleRestoreArchived = (item: BlotterArchiveItemResponse) => {
    confirm({
      title: `Restore Case – ${item.caseNumber}?`,
      description: `Are you sure you want to restore "${item.caseNumber}" back to active Lupon Case records? All associated child cases in its cycle chain will also be restored.`,
      confirmLabel: 'Restore Case',
      tone: 'emerald',
      onConfirm: async () => {
        try {
          await luponService.restoreArchivedCase(item.id)
          showFeedback({
            title: 'Case Restored',
            description: `Case "${item.caseNumber}" and its cycle chain have been restored to active management.`,
            variant: 'success',
          })
          fetchKpis()
          fetchTableData()
        } catch (err: any) {
          showFeedback({
            title: 'Restore Failed',
            description: err?.response?.data?.message || err?.message || 'Unable to restore case.',
            variant: 'error',
          })
        }
      },
    })
  }

  const handleSoftDeleteArchived = (item: BlotterArchiveItemResponse) => {
    confirm({
      title: `Move Case – ${item.caseNumber} to Trash?`,
      description: `Are you sure you want to move Case "${item.caseNumber}" to the Recycle Bin? You can restore it at any time from the Recently Deleted tab.`,
      confirmLabel: 'Move to Trash',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await luponService.softDeleteCase(item.id)
          showFeedback({
            variant: 'success',
            title: 'Case Moved to Trash',
            description: `Case "${item.caseNumber}" has been moved to the Recycle Bin.`,
          })
          fetchKpis()
          fetchTableData()
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: err?.response?.data?.message || err?.message || 'Unable to delete case.',
          })
        }
      },
    })
  }

  // --- TRASH TAB ACTIONS ---
  const handleRestoreFromTrash = (item: BlotterRecentDeleteItemResponse) => {
    confirm({
      title: `Restore Case – ${item.caseNumber}?`,
      description: `Are you sure you want to restore "${item.caseNumber}" back to active Lupon Case records?`,
      confirmLabel: 'Restore Case',
      tone: 'emerald',
      onConfirm: async () => {
        try {
          await luponService.restoreDeletedCase(item.id)
          showFeedback({
            title: 'Case Recovered',
            description: `Case "${item.caseNumber}" has been restored successfully.`,
            variant: 'success',
          })
          fetchKpis()
          fetchTableData()
        } catch (err: any) {
          showFeedback({
            title: 'Recovery Failed',
            description: err?.response?.data?.message || err?.message || 'Failed to recover case from trash.',
            variant: 'error',
          })
        }
      },
    })
  }

  const handlePermanentDelete = (item: BlotterRecentDeleteItemResponse) => {
    confirm({
      title: `Permanently Delete Case – ${item.caseNumber}?`,
      description: `Are you sure you want to permanently delete "${item.caseNumber}" from the Recycle Bin? This action is audit-safe and cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await luponService.permanentDeleteCase(item.id)
          showFeedback({
            title: 'Case Permanently Deleted',
            description: `Case "${item.caseNumber}" has been permanently purged from the Recycle Bin.`,
            variant: 'success',
          })
          fetchKpis()
          fetchTableData()
        } catch (err: any) {
          showFeedback({
            title: 'Permanent Delete Failed',
            description: err?.response?.data?.message || err?.message || 'Unable to permanently delete case.',
            variant: 'error',
          })
        }
      },
    })
  }

  // 4 Top Stats Cards
  const statCards: StatCard[] = [
    {
      id: 'total-archived',
      label: 'Total Archived Cases',
      value: kpiData?.totalArchived ?? 0,
      hint: 'All-time archived Lupon records',
      icon: Archive,
      tone: 'emerald',
    },
    {
      id: 'archived-month',
      label: 'Archived This Month',
      value: kpiData?.totalArchivedThisMonth ?? 0,
      hint: 'Archived in current month',
      icon: Calendar,
      tone: 'sky',
    },
    {
      id: 'recycle-bin',
      label: 'Recycle Bin (Trash)',
      value: kpiData?.totalRecentlyDeleted ?? 0,
      hint: 'Soft-deleted records (restoreable)',
      icon: Trash2,
      tone: 'rose',
    },
    {
      id: 'deleted-month',
      label: 'Deleted This Month',
      value: kpiData?.totalRecentlyDeletedThisMonth ?? 0,
      hint: 'Deleted & purged in current month',
      icon: Clock,
      tone: 'amber',
    },
  ]

  // Columns for Archived Table
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
            {row.complainantName || '—'}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'RESPONDENT',
        render: (row) => (
          <span className="text-slate-600 text-sm">
            {row.respondentName || '—'}
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
            {row.archivedAt ? formatDate(row.archivedAt) : '—'}
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
            {row.complainantName || '—'}
          </span>
        ),
      },
      {
        key: 'respondentName',
        header: 'RESPONDENT',
        render: (row) => (
          <span className="text-slate-600 text-sm">
            {row.respondentName || '—'}
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
            {row.deletedAt ? formatDate(row.deletedAt) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  // Actions for Archived Table (3-Dots Menu)
  const archivedActions: RowAction<BlotterArchiveItemResponse>[] | undefined = useMemo(() => {
    const list: RowAction<BlotterArchiveItemResponse>[] = []
    if (hasPermission('Restore Case')) {
      list.push({
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: handleRestoreArchived,
      })
    }
    if (hasPermission('Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Record',
        icon: Trash2,
        tone: 'danger',
        onClick: handleSoftDeleteArchived,
      })
    }
    return list.length > 0 ? list : undefined
  }, [hasPermission])

  // Actions for Trash Table (3-Dots Menu)
  const deletedActions: RowAction<BlotterRecentDeleteItemResponse>[] | undefined = useMemo(() => {
    const list: RowAction<BlotterRecentDeleteItemResponse>[] = []
    if (hasPermission('Restore Case')) {
      list.push({
        id: 'restore',
        label: 'Restore Case',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: handleRestoreFromTrash,
      })
    }
    if (hasPermission('Permanent Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Permanently',
        icon: Trash2,
        tone: 'danger',
        onClick: handlePermanentDelete,
      })
    }
    return list.length > 0 ? list : undefined
  }, [hasPermission])

  // Detail View Mode
  if (selectedCase) {
    if (!hasPermission('View Cases')) {
      return (
        <div className="py-12 flex justify-center">
          <PermissionDeniedPage
            title="Access Denied"
            message="The owner of the workspace has not given you permission to view Lupon cases. Please contact the administrator."
            onBack={() => {
              setSelectedCase(null)
            }}
          />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <LuponCaseDetailsView
          caseId={selectedCase.id}
          caseNumber={selectedCase.caseNumber}
          refreshKey={detailRefreshKey}
          onBack={() => {
            setSelectedCase(null)
            fetchKpis()
            fetchTableData()
          }}
          onSettle={() => {
            fetchKpis()
            fetchTableData()
            setDetailRefreshKey((p) => p + 1)
          }}
        />
      </div>
    )
  }

  const currentTotalElements =
    activeTab === 'archived'
      ? (archivedData?.totalElements ?? 0)
      : (deletedData?.totalElements ?? 0)

  const currentTotalPages =
    activeTab === 'archived'
      ? (archivedData?.totalPages ?? 1)
      : (deletedData?.totalPages ?? 1)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Lupon Archive & Trash Vault"
        description="Centralized repository for archived Lupong Tagapamayapa cases and soft-deleted conciliation records."
      />

      {/* 4 Stat Cards */}
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
            Showing closed and completed Lupon cases preserved in the official Barangay Archive Vault.
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
          loading={isLoadingTable}
          pageSize={pageSize}
          emptyTitle="No Archived Cases Found"
          emptyDescription="There are currently no Lupon cases matching your archive filter criteria."
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
          loading={isLoadingTable}
          pageSize={pageSize}
          emptyTitle="No Soft-Deleted Cases Found"
          emptyDescription="There are currently no soft-deleted Lupon records in the recycle bin."
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
