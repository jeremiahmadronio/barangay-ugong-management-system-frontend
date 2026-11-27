import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react'
import {
  clearanceApi,
  type ClearanceLifecycleKpiResponse,
  type ClearanceArchiveItemResponse,
  type ClearanceRecentDeleteItemResponse,
} from '@/config/api/modules/clearance.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { DataTable } from '@/components/ui/table/DataTable'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { Badge } from '@/components/ui/table/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'

type VaultTab = 'archived' | 'recently_deleted'

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search Vault',
    placeholder: 'Search by Control No., Applicant name, or Document type…',
  },
]

function getStatusBadge(status?: string | null) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'RELEASED' || normalized === 'ISSUED') {
    return <Badge tone="emerald">ACTIVE</Badge>
  }
  if (normalized === 'EXPIRED') {
    return <Badge tone="amber">EXPIRED</Badge>
  }
  if (normalized === 'VOID' || normalized === 'CANCELLED') {
    return <Badge tone="rose">CANCELLED</Badge>
  }
  return <Badge tone="slate">{normalized || 'ACTIVE'}</Badge>
}

// Format name helper (e.g. "Madronio, Jeremiah D.")
const formatRequestorName = (rawName?: string) => {
  if (!rawName || !rawName.trim()) return 'Unknown Requestor'
  const name = rawName.trim()
  if (name.includes(',')) return name
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`
  if (parts.length >= 3) {
    const last = parts[parts.length - 1]
    const first = parts[0]
    const middle = parts[1]
    return `${last}, ${first} ${middle.charAt(0).toUpperCase()}.`
  }
  return name
}

// Format date helper
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function ClearanceArchive() {
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()
  const { hasPermission } = useUserPermissions()
  const [activeTab, setActiveTab] = useState<VaultTab>('archived')

  // KPI Data States
  const [kpiData, setKpiData] = useState<ClearanceLifecycleKpiResponse | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(true)

  // Table Data & Filters
  const [archivedItems, setArchivedItems] = useState<ClearanceArchiveItemResponse[]>([])
  const [deletedItems, setDeletedItems] = useState<ClearanceRecentDeleteItemResponse[]>([])
  const [totalElements, setTotalElements] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
  })
  const [page, setPage] = useState<number>(1)
  const pageSize = 5

  // 1. Fetch KPI Metrics
  const fetchKpis = useCallback(async () => {
    try {
      const data = await clearanceApi.getArchiveKpi()
      setKpiData(data)
    } catch (err) {
      console.error('Failed to fetch clearance archive KPIs:', err)
    } finally {
      setIsLoadingKpis(false)
    }
  }, [])

  // 2. Fetch Vault Table Data (Archived or Trash)
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true)
    try {
      const params = {
        search: filterValues.search?.trim() || undefined,
        page: page - 1, // 0-indexed for backend Spring Data Pageable
        size: pageSize,
      }

      if (activeTab === 'archived') {
        const res = await clearanceApi.getArchivedCertificates(params)
        setArchivedItems(res.content || [])
        setTotalElements(res.totalElements || 0)
        setTotalPages(res.totalPages || 1)
      } else {
        const res = await clearanceApi.getRecentDeletedCertificates(params)
        setDeletedItems(res.content || [])
        setTotalElements(res.totalElements || 0)
        setTotalPages(res.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch vault records:', err)
      setArchivedItems([])
      setDeletedItems([])
      setTotalElements(0)
      setTotalPages(1)
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
    setFilterValues({ search: '' })
    setPage(1)
  }

  // Action: Restore Archived Certificate back to Active
  const handleRestoreArchivedCertificate = useCallback(
    (row: ClearanceArchiveItemResponse) => {
      confirm({
        title: `Restore Certificate – ${row.certNumber}?`,
        description: `Are you sure you want to restore certificate "${row.certNumber}" for ${row.requestorName} back to active clearance records?`,
        confirmLabel: 'Restore Certificate',
        tone: 'emerald',
        onConfirm: async () => {
          try {
            await clearanceApi.restoreArchivedCertificate(row.id)
            showFeedback({
              variant: 'success',
              title: 'Certificate Restored',
              description: `Certificate "${row.certNumber}" has been restored to active records.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to restore certificate:', err)
            showFeedback({
              variant: 'error',
              title: 'Restore Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to restore certificate.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Action: Soft Delete (Move Archived Record to Trash)
  const handleSoftDeleteArchivedCertificate = useCallback(
    (row: ClearanceArchiveItemResponse) => {
      confirm({
        title: `Move Certificate to Trash?`,
        description: `Are you sure you want to move certificate "${row.certNumber}" to the Recycle Bin (Trash)? You can restore it anytime.`,
        confirmLabel: 'Move to Trash',
        tone: 'rose',
        onConfirm: async () => {
          try {
            await clearanceApi.softDeleteCertificate(row.id)
            showFeedback({
              variant: 'success',
              title: 'Moved to Recycle Bin',
              description: `Certificate "${row.certNumber}" was moved to the Recycle Bin.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to delete certificate:', err)
            showFeedback({
              variant: 'error',
              title: 'Delete Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to move certificate to trash.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Action: Restore Deleted Certificate from Trash back to Active
  const handleRestoreDeletedCertificate = useCallback(
    (row: ClearanceRecentDeleteItemResponse) => {
      confirm({
        title: `Restore Certificate – ${row.certNumber}?`,
        description: `Are you sure you want to restore certificate "${row.certNumber}" from trash back to active clearance records?`,
        confirmLabel: 'Restore Certificate',
        tone: 'emerald',
        onConfirm: async () => {
          try {
            await clearanceApi.restoreDeletedCertificate(row.id)
            showFeedback({
              variant: 'success',
              title: 'Certificate Restored',
              description: `Certificate "${row.certNumber}" has been restored to active records.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to restore deleted certificate:', err)
            showFeedback({
              variant: 'error',
              title: 'Restore Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to restore certificate from trash.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // Action: Permanent Delete from Trash
  const handlePermanentDeleteCertificate = useCallback(
    (row: ClearanceRecentDeleteItemResponse) => {
      confirm({
        title: `Delete Permanently?`,
        description: `Are you sure you want to permanently delete certificate "${row.certNumber}" for ${row.requestorName}? This action cannot be undone.`,
        confirmLabel: 'Delete Permanently',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await clearanceApi.permanentDeleteCertificate(row.id)
            showFeedback({
              variant: 'success',
              title: 'Deleted Permanently',
              description: `Certificate "${row.certNumber}" was permanently deleted.`,
            })
            fetchTableData()
            fetchKpis()
          } catch (err: any) {
            console.error('Failed to permanently delete certificate:', err)
            showFeedback({
              variant: 'error',
              title: 'Delete Failed',
              description: err?.response?.data?.message || err?.message || 'Unable to permanently delete certificate.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchKpis]
  )

  // 4 Lifecycle KPI Cards matching Blotter standard
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-archived',
        label: 'Total Archived Certificates',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchived ?? 0).toLocaleString(),
        hint: 'All-time archived clearance records',
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

  // Columns for Archived Certificates Table
  const archivedColumns: Column<ClearanceArchiveItemResponse>[] = useMemo(
    () => [
      {
        key: 'certNumber',
        header: 'CONTROL NO.',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {row.certNumber}
          </span>
        ),
      },
      {
        key: 'requestorName',
        header: 'APPLICANT NAME',
        render: (row) => (
          <span className="text-sm font-semibold text-slate-800 block whitespace-nowrap">
            {formatRequestorName(row.requestorName)}
          </span>
        ),
      },
      {
        key: 'certTitle',
        header: 'CERTIFICATE TYPE',
        render: (row) => (
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {row.certTitle}
          </span>
        ),
      },
      {
        key: 'archiveRemarks',
        header: 'ARCHIVE REMARKS',
        className: 'max-w-[220px]',
        render: (row) => {
          const text = row.archiveRemarks || 'Archived Record'
          return (
            <span
              className="text-sm font-normal text-slate-600 block max-w-[220px] truncate"
              title={text}
            >
              {text}
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
        key: 'archivedAt',
        header: 'ARCHIVED AT',
        render: (row) => (
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {formatDate(row.archivedAt)}
          </span>
        ),
      },
    ],
    []
  )

  // Columns for Soft-Deleted Certificates (Trash) Table
  const deletedColumns: Column<ClearanceRecentDeleteItemResponse>[] = useMemo(
    () => [
      {
        key: 'certNumber',
        header: 'CONTROL NO.',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {row.certNumber}
          </span>
        ),
      },
      {
        key: 'requestorName',
        header: 'APPLICANT NAME',
        render: (row) => (
          <span className="text-sm font-semibold text-slate-800 block whitespace-nowrap">
            {formatRequestorName(row.requestorName)}
          </span>
        ),
      },
      {
        key: 'certTitle',
        header: 'CERTIFICATE TYPE',
        render: (row) => (
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {row.certTitle}
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
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {formatDate(row.deletedAt)}
          </span>
        ),
      },
    ],
    []
  )

  // Row Actions for Archived Records Tab (3-Dots Menu)
  const archivedActions: RowAction<ClearanceArchiveItemResponse>[] = useMemo(() => {
    const list: RowAction<ClearanceArchiveItemResponse>[] = []

    if (hasPermission('Restore Clearance')) {
      list.push({
        id: 'restore',
        label: 'Restore to Active',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: handleRestoreArchivedCertificate,
      })
    }

    if (hasPermission('Delete Clearance')) {
      list.push({
        id: 'trash',
        label: 'Move to Trash',
        icon: Trash2,
        tone: 'danger',
        onClick: handleSoftDeleteArchivedCertificate,
      })
    }

    return list
  }, [hasPermission, handleRestoreArchivedCertificate, handleSoftDeleteArchivedCertificate])

  // Row Actions for Recycle Bin (Trash) Tab (3-Dots Menu)
  const trashActions: RowAction<ClearanceRecentDeleteItemResponse>[] = useMemo(() => {
    const list: RowAction<ClearanceRecentDeleteItemResponse>[] = []

    if (hasPermission('Restore Clearance')) {
      list.push({
        id: 'restore-trash',
        label: 'Restore Record',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: handleRestoreDeletedCertificate,
      })
    }

    if (hasPermission('Permanent Delete Clearance')) {
      list.push({
        id: 'purge-permanent',
        label: 'Delete Permanently',
        icon: Trash2,
        tone: 'danger',
        onClick: handlePermanentDeleteCertificate,
      })
    }

    return list
  }, [hasPermission, handleRestoreDeletedCertificate, handlePermanentDeleteCertificate])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <PageHeader
        title="Clearance Archive & Trash Vault"
        description="Centralized repository for archived clearance records and soft-deleted certificates."
      />

      {/* 2. 4 Lifecycle KPI Cards */}
      <StatsCards cards={statCards} />

      {/* --- PILL TABS SELECTOR (Matching Blotter Design) --- */}
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
            {kpiData?.totalArchived ?? (activeTab === 'archived' ? totalElements : 0)}
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
            These are soft-deleted clearance records in the Recycle Bin awaiting restoration or permanent purge.
          </span>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 text-xs sm:text-sm font-medium">
          <span>
            Showing archived clearance and certificate records preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* 4. Filter Bar */}
      <TableFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* 5. Data Table */}
      {activeTab === 'archived' ? (
        <DataTable
          data={archivedItems}
          columns={archivedColumns}
          actions={archivedActions.length > 0 ? archivedActions : undefined}
          actionsVariant="menu"
          rowKey={(r) => r.id}
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          totalItems={totalElements}
          onPageChange={setPage}
          isLoading={isLoadingTable}
          emptyTitle="No archived certificates"
          emptyDescription="There are currently no clearance records preserved in the archive vault."
        />
      ) : (
        <DataTable
          data={deletedItems}
          columns={deletedColumns}
          actions={trashActions.length > 0 ? trashActions : undefined}
          actionsVariant="menu"
          rowKey={(r) => r.id}
          page={page}
          pageSize={pageSize}
          pageCount={totalPages}
          totalItems={totalElements}
          onPageChange={setPage}
          isLoading={isLoadingTable}
          emptyTitle="Recycle bin is empty"
          emptyDescription="There are no soft-deleted clearance records in the trash vault."
        />
      )}

      {/* Confirmation & Feedback Modals */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
