import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  FileText,
  Calendar,
  Trash2,
  Archive,
  RotateCcw,
  Eye,
  Info,
  Settings,
  Loader2,
} from 'lucide-react'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { PageHeader } from '@/components/ui/PageHeader'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { DataTable } from '@/components/ui/table/DataTable'
import { Badge } from '@/components/ui/table/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { DetailsModal } from '@/components/ui/DetailsModal'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type {
  FtjsArchiveStatsResponse,
  FtjsArchiveTableItem,
  FtjsTableQueryParams,
  SpringPageResponse,
} from '@/config/api/ftjs/ftjs.types'
import { FtjsDetailView } from './FtjsDetailView'

type ArchiveTab = 'archived' | 'recently_deleted'

const PURPOSE_OPTIONS = [
  { label: 'All Purposes', value: 'all' },
  { label: 'Local Employment Application', value: 'Local Employment Application' },
  { label: 'Overseas Employment Application (OFW)', value: 'Overseas Employment Application (OFW)' },
  { label: 'NBI Clearance Application', value: 'NBI Clearance Application' },
  { label: 'Police Clearance Application', value: 'Police Clearance Application' },
  { label: 'Other (Specify in Other Purpose Field)', value: 'Other (Specify in Other Purpose Field)' },
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Certificate Issued', value: 'ISSUED' },
  { label: 'Re-issuance Request', value: 'RE_ISSUANCE' },
]

const ISSUANCE_COUNT_OPTIONS = [
  { label: 'All Issuances', value: 'all' },
  { label: '1st Issuance (Original)', value: '1' },
  { label: '2nd Issuance (Re-issuance)', value: '2' },
  { label: '3+ Issuances', value: '3' },
]

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by App No. or Applicant Name…',
  },
  {
    key: 'status',
    label: 'Status',
    options: STATUS_OPTIONS,
  },
  {
    key: 'purpose',
    label: 'Purpose',
    options: PURPOSE_OPTIONS,
  },
  {
    key: 'issuanceCount',
    label: 'Issuance Count',
    options: ISSUANCE_COUNT_OPTIONS,
  },
]

const TIMER_OPTIONS = [
  { label: 'Manual', value: 'MANUAL' },
  { label: '1 Day', value: '1' },
  { label: '3 Days', value: '3' },
  { label: '7 Days', value: '7' },
  { label: '15 Days', value: '15' },
  { label: '30 Days', value: '30' },
]

export const FtjsArchive = () => {
  const location = useLocation()
  const { hasPermission } = useUserPermissions()
  const [activeTab, setActiveTab] = useState<ArchiveTab>('archived')

  // Table Filters & Pagination state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    purpose: 'all',
    issuanceCount: 'all',
  })
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Retention Settings Modal State
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false)
  const [retentionPeriod, setRetentionPeriod] = useState<string>('MANUAL')
  const [savingTimer, setSavingTimer] = useState(false)

  // Stats State
  const [stats, setStats] = useState<FtjsArchiveStatsResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Table Data State
  const [archivedData, setArchivedData] = useState<SpringPageResponse<FtjsArchiveTableItem> | null>(null)
  const [deletedData, setDeletedData] = useState<SpringPageResponse<FtjsArchiveTableItem> | null>(null)
  const [loadingTable, setLoadingTable] = useState(false)

  // Selected Record View Mode
  const [viewingRow, setViewingRow] = useState<FtjsArchiveTableItem | null>(null)

  // Reusable Dialogs Hook
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Fetch Stats & Retention Setting
  const fetchStatsAndSetting = useCallback(async () => {
    setLoadingStats(true)
    try {
      const [statsRes, retentionRes] = await Promise.all([
        ftjsService.getArchiveStats().catch(() => null),
        ftjsService.getRetentionSetting().catch(() => ({ retentionPeriod: 'MANUAL' })),
      ])
      if (statsRes) setStats(statsRes)
      if (retentionRes?.retentionPeriod) setRetentionPeriod(retentionRes.retentionPeriod)
    } catch (err) {
      console.error('Failed to fetch FTJS Archive stats/retention:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Fetch Table Data (Archived or Trash summary from Serbisyoko-Web API)
  const fetchTableData = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params: FtjsTableQueryParams = {
        page: page - 1,
        size: pageSize,
        search: filterValues.search || undefined,
        status: filterValues.status || undefined,
        purpose: filterValues.purpose || undefined,
        issuanceCount: filterValues.issuanceCount || undefined,
      }

      if (activeTab === 'archived') {
        const res = await ftjsService.getArchiveTable(params)
        setArchivedData(res)
      } else {
        const res = await ftjsService.getRecentlyDeletedTable(params)
        setDeletedData(res)
      }
    } catch (err) {
      console.error('Failed to fetch table summary from Serbisyoko-Web:', err)
    } finally {
      setLoadingTable(false)
    }
  }, [activeTab, page, pageSize, filterValues])

  useEffect(() => {
    fetchStatsAndSetting()
  }, [fetchStatsAndSetting, location.pathname, location.key])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, location.pathname, location.key])

  // Filter Handlers
  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    setPage(1)
  }

  const handleClearFilter = () => {
    setFilterValues({
      search: '',
      status: 'all',
      purpose: 'all',
      issuanceCount: 'all',
    })
    setPage(1)
  }

  const currentDisplayList = activeTab === 'archived' ? (archivedData?.content ?? []) : (deletedData?.content ?? [])
  const currentTotalElements = activeTab === 'archived' ? (archivedData?.totalElements ?? 0) : (deletedData?.totalElements ?? 0)
  const currentTotalPages = activeTab === 'archived' ? (archivedData?.totalPages ?? 1) : (deletedData?.totalPages ?? 1)

  // ── Retention Setting Handler ──────────────────────────────────────────────
  const handleSaveRetentionSetting = async () => {
    setSavingTimer(true)
    try {
      await ftjsService.updateRetentionSetting(retentionPeriod)
      setIsTimerModalOpen(false)
      showFeedback({
        variant: 'success',
        title: 'Timer Settings Saved',
        description: 'Auto-deletion retention period updated successfully.',
      })
    } catch (err) {
      console.error('Failed to update retention setting:', err)
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Unable to update retention setting.',
      })
    } finally {
      setSavingTimer(false)
    }
  }

  // ── Single Action Handlers ─────────────────────────────────────────────────
  const handleRestoreRecord = useCallback(
    (row: FtjsArchiveTableItem) => {
      const recordId = row.ftjsId ?? row.id
      if (!recordId) return
      confirm({
        title: `Restore Application – ${row.fullName}?`,
        description: `Are you sure you want to restore "${row.fullName}" back to the active Certificate Management list?`,
        confirmLabel: 'Restore Application',
        tone: 'primary',
        onConfirm: async () => {
          await ftjsService.restoreRecord(recordId)
          showFeedback({
            variant: 'success',
            title: 'Application Restored',
            description: `"${row.fullName}" (${row.trackingNumber}) has been restored to active management.`,
          })
          fetchTableData()
          fetchStatsAndSetting()
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchStatsAndSetting]
  )

  const handleMoveToArchiveFromTrash = useCallback(
    (row: FtjsArchiveTableItem) => {
      const recordId = row.ftjsId ?? row.id
      if (!recordId) return
      confirm({
        title: `Move to Archive – ${row.fullName}?`,
        description: `Are you sure you want to move "${row.fullName}" (${row.trackingNumber}) from Recently Deleted to the Archive vault?`,
        confirmLabel: 'Move to Archive',
        tone: 'emerald',
        onConfirm: async () => {
          await ftjsService.archiveRecord(recordId)
          showFeedback({
            variant: 'success',
            title: 'Application Moved to Archive',
            description: `"${row.fullName}" (${row.trackingNumber}) has been moved to the Archive vault.`,
          })
          fetchTableData()
          fetchStatsAndSetting()
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchStatsAndSetting]
  )

  const handleSoftDeleteFromArchive = useCallback(
    (row: FtjsArchiveTableItem) => {
      const recordId = row.ftjsId ?? row.id
      if (!recordId) return
      confirm({
        title: `Move to Recently Deleted – ${row.fullName}?`,
        description: `Are you sure you want to move "${row.fullName}" to Recently Deleted trash?`,
        confirmLabel: 'Move to Recently Deleted',
        tone: 'danger',
        onConfirm: async () => {
          await ftjsService.softDeleteRecord(recordId)
          showFeedback({
            variant: 'success',
            title: 'Moved to Recently Deleted',
            description: `"${row.fullName}" was moved to Recently Deleted.`,
          })
          fetchTableData()
          fetchStatsAndSetting()
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchStatsAndSetting]
  )

  const handlePermanentDelete = useCallback(
    (row: FtjsArchiveTableItem) => {
      const recordId = row.ftjsId ?? row.id
      if (!recordId) return
      confirm({
        title: `Transition to Permanent Delete – ${row.fullName}?`,
        description: `Are you sure you want to transition "${row.fullName}" (${row.trackingNumber}) to Permanently Deleted status? The record will remain preserved in audit history and will not be physically purged from the database.`,
        confirmLabel: 'Transition to Permanent Delete',
        tone: 'danger',
        onConfirm: async () => {
          await ftjsService.permanentDeleteRecord(recordId)
          showFeedback({
            variant: 'success',
            title: 'Status Updated to Permanently Deleted',
            description: `"${row.fullName}" was transitioned to PERMANENTLY_DELETED status while keeping full audit history.`,
          })
          fetchTableData()
          fetchStatsAndSetting()
        },
      })
    },
    [confirm, showFeedback, fetchTableData, fetchStatsAndSetting]
  )

  // ── Stat Cards Config ──────────────────────────────────────────────────────
  const cards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-archived',
        label: 'Total Archived',
        value: stats?.totalArchived ?? currentTotalElements,
        hint: 'All archived certificate records',
        icon: FileText,
        tone: 'indigo',
      },
      {
        id: 'archived-month',
        label: 'Archived This Month',
        value: stats?.totalArchivedThisMonth ?? 0,
        hint: stats?.totalArchiveThisMonthTrend || 'Archive movement for the current month',
        icon: Calendar,
        tone: 'emerald',
      },
      {
        id: 'original-archived',
        label: 'Original Applications Archived',
        value: stats?.totalArchiveOriginalIssuance ?? 0,
        hint: 'First-time applicant records',
        icon: FileText,
        tone: 'amber',
      },
      {
        id: 'recently-deleted',
        label: 'Recently Deleted',
        value: stats?.totalRecentlyDeleted ?? 0,
        hint: 'Soft-deleted records in trash',
        icon: Trash2,
        tone: 'sky',
      },
    ],
    [stats, currentTotalElements]
  )

  // ── Table Columns Config ───────────────────────────────────────────────────
  const baseColumns: Column<FtjsArchiveTableItem>[] = useMemo(
    () => [
      {
        key: 'trackingNumber',
        header: 'APPLICATION NO.',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {row.trackingNumber || '—'}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'APPLICANT',
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 leading-tight">{row.fullName}</p>
          </div>
        ),
      },
      {
        key: 'issuanceCount',
        header: 'ISSUANCE COUNT',
        align: 'center',
        render: (row) => (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {row.issuanceCount ?? 1}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => {
          const isReissuance = row.status === 'RE_ISSUANCE' || row.issuanceCount > 1
          return isReissuance ? (
            <Badge tone="sky">Re-issuance Request</Badge>
          ) : (
            <Badge tone="emerald">Certificate Issued</Badge>
          )
        },
      },
      {
        key: 'purpose',
        header: 'PURPOSE',
        render: (row) => (
          <span
            className="text-sm font-normal text-slate-600 max-w-[220px] truncate inline-block whitespace-nowrap"
            title={row.purpose}
          >
            {row.purpose || '—'}
          </span>
        ),
      },
      {
        key: activeTab === 'recently_deleted' ? 'expiresIn' : 'archivedAt',
        header: activeTab === 'recently_deleted' ? 'EXPIRES IN' : 'ARCHIVED AT',
        render: (row) => {
          if (activeTab === 'recently_deleted') {
            if (retentionPeriod === 'MANUAL') {
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Manual
                </span>
              )
            }
            const daysMax = parseInt(retentionPeriod, 10) || 30
            let daysLeft = daysMax
            if (row.dateSubmitted) {
              const deletedTime = new Date(row.dateSubmitted).getTime()
              const expiryTime = deletedTime + daysMax * 24 * 60 * 60 * 1000
              const now = new Date().getTime()
              const diff = Math.max(0, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)))
              daysLeft = isNaN(diff) ? daysMax : diff
            }
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </span>
            )
          }
          return (
            <span className="text-sm text-slate-600 whitespace-nowrap">
              {row.dateSubmitted
                ? new Date(row.dateSubmitted).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          )
        },
      },
    ],
    [activeTab, retentionPeriod]
  )

  // ── Row Actions Config ─────────────────────────────────────────────────────
  const actions: RowAction<FtjsArchiveTableItem>[] = useMemo(() => {
    const list: RowAction<FtjsArchiveTableItem>[] = []

    if (hasPermission('Restore FTJS')) {
      list.push({
        id: 'restore',
        label: 'Restore Application',
        icon: RotateCcw,
        tone: 'primary',
        onClick: (row) => handleRestoreRecord(row),
      })
    }

    if (activeTab === 'recently_deleted') {
      if (hasPermission('Archive FTJS')) {
        list.push({
          id: 'archive',
          label: 'Move to Archive',
          icon: Archive,
          tone: 'emerald',
          onClick: (row) => handleMoveToArchiveFromTrash(row),
        })
      }
      if (hasPermission('Permanent Delete FTJS')) {
        list.push({
          id: 'delete',
          label: 'Delete Permanently',
          icon: Trash2,
          tone: 'danger',
          onClick: (row) => handlePermanentDelete(row),
        })
      }
    } else {
      if (hasPermission('Delete FTJS')) {
        list.push({
          id: 'delete',
          label: 'Delete Record',
          icon: Trash2,
          tone: 'danger',
          onClick: (row) => handleSoftDeleteFromArchive(row),
        })
      }
    }

    return list
  }, [hasPermission, activeTab, handleRestoreRecord, handleMoveToArchiveFromTrash, handleSoftDeleteFromArchive, handlePermanentDelete])

  // Sub-view: Render FtjsDetailView if viewing a specific record
  if (viewingRow !== null) {
    return (
      <FtjsDetailView
        ftjsId={viewingRow.ftjsId ?? viewingRow.id}
        initialData={viewingRow}
        onBack={() => setViewingRow(null)}
        readOnly={true}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Simple Page Header */}
      <PageHeader
        title="FTJS Archive & Trash Vault"
        description="Manage archived certificate records and soft-deleted applications under RA 11261."
      />

      {/* KPI Stats Cards */}
      <StatsCards cards={cards} />

      {/* Tabs & Header Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Pill Tabs (Matching Blotter Design) */}
        <div className="flex items-center gap-2 bg-slate-100/70 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('archived')
              setPage(1)
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Archive size={16} className={activeTab === 'archived' ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Archived</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
              {stats?.totalArchived ?? archivedData?.totalElements ?? 0}
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
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Trash2 size={16} className={activeTab === 'recently_deleted' ? 'text-rose-600' : 'text-slate-400'} />
            <span>Recently Deleted</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
              {stats?.totalRecentlyDeleted ?? deletedData?.totalElements ?? 0}
            </span>
          </button>
        </div>

        {/* Right Header Action Controls: Retention Timer Settings Gear */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTimerModalOpen(true)}
            title="Retention Scheduler Settings"
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Contextual Alert Banner (Matching Blotter Emerald / Rose Style) */}
      {activeTab === 'recently_deleted' ? (
        <div className="flex items-center rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-rose-800 text-xs sm:text-sm font-medium">
          <span>
            These are soft-deleted records. Permanently deleted records are strictly excluded and preserved in audit history.
          </span>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 text-xs sm:text-sm font-medium">
          <span>
            Showing archived FTJS certificate applications preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* Reusable Table Filters Bar */}
      <TableFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Main Data Table */}
      <DataTable
        data={currentDisplayList}
        columns={baseColumns}
        rowKey={(row) => row.id ?? row.ftjsId ?? Math.random()}
        actions={actions.length > 0 ? actions : undefined}
        actionsVariant="menu"
        pageSize={pageSize}
        emptyTitle={
          activeTab === 'archived' ? 'No archived records found' : 'No recently deleted records'
        }
        emptyDescription={
          activeTab === 'archived'
            ? 'There are currently no FTJS certificate applications stored in the archive vault.'
            : 'There are no soft-deleted FTJS applications in the trash.'
        }
        serverPagination={{
          page: page,
          pageCount: currentTotalPages,
          totalItems: currentTotalElements,
          pageSize: pageSize,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Timer Settings Modal (Using DetailsModal) */}
      <DetailsModal
        open={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        title="Retention Scheduler Settings"
        description="Select auto-transition retention period for Recently Deleted applications. Expired soft-deleted records transition to PERMANENTLY_DELETED status in audit history without physical database deletion."
        maxWidthClass="max-w-md"
        hideFooter={true}
      >
        <div className="space-y-6">
          {/* Radio Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {TIMER_OPTIONS.map((opt) => {
              const isSelected = retentionPeriod === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRetentionPeriod(opt.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'border-blue-600 bg-white' : 'border-slate-400 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>

          {/* Clean Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(false)}
              disabled={savingTimer}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRetentionSetting}
              disabled={savingTimer}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingTimer && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {savingTimer ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </DetailsModal>

      {/* Reusable Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
