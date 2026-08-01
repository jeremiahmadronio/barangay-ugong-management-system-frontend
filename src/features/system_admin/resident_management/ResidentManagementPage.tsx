import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserCheck,
  FileText,
  UserPlus,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  StatsCards,
  Avatar,
  Badge,
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  type StatCard,
} from '@/components/ui'
import {
  DataTable,
  TableFilters,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'
import { residentService } from '@/config/api/residents/residents.service'
import type {
  ResidentTableResponse,
  ResidentDetailResponse,
  ResidentStatsResponse,
  ResidentFilterRequest,
  ResidentStatus,
} from '@/config/api/residents/residents.types'

import { ResidentDetailPageView } from './components/ResidentDetailPageView'
import { CreateResidentModal } from './components/CreateResidentModal'
import { EditResidentModal } from './components/EditResidentModal'

export function ResidentManagementPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [residents, setResidents] = useState<ResidentTableResponse[]>([])
  const [stats, setStats] = useState<ResidentStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    gender: 'all',
    ageGroup: 'all',
  })

  // Modal & Dedicated Detail Page States
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewingResidentId, setViewingResidentId] = useState<number | null>(null)
  const [editingResidentDetail, setEditingResidentDetail] = useState<ResidentDetailResponse | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // ── Fetch Data directly from Backend API ──────────────────────────────────
  const fetchData = useCallback(async (filters?: ResidentFilterRequest) => {
    try {
      setLoading(true)
      const [tableData, statsData] = await Promise.all([
        residentService.getResidentsTable(filters),
        residentService.getResidentStats(),
      ])
      setResidents(tableData || [])
      setStats(statsData || null)
    } catch (err) {
      // Silently fail — backend may be offline; just show empty state
      console.warn('Resident data could not be loaded:', err)
      setResidents([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setDetailRefreshKey((prev) => prev + 1)
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Apply Filters ─────────────────────────────────────────────────────────
  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    const apiFilter: ResidentFilterRequest = {
      search: applied.search || undefined,
      status: applied.status !== 'all' ? (applied.status as ResidentStatus) : undefined,
      gender: applied.gender !== 'all' ? String(applied.gender) : undefined,
      ageGroup: applied.ageGroup !== 'all' ? String(applied.ageGroup) : undefined,
    }
    fetchData(apiFilter)
  }

  const handleClearFilter = () => {
    setFilterValues({ search: '', status: 'all', gender: 'all', ageGroup: 'all' })
    fetchData()
  }

  // Filter Configuration
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search Resident',
        type: 'search',
        placeholder: 'Search by First or Last Name...',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'DECEASED', label: 'Deceased' },
          { value: 'MOVED_OUT', label: 'Moved Out' },
          { value: 'ARCHIVED', label: 'Archived' },
        ],
      },
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'all', label: 'All Genders' },
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
        ],
      },
      {
        key: 'ageGroup',
        label: 'Age Group',
        type: 'select',
        options: [
          { value: 'all', label: 'All Ages' },
          { value: 'YOUTH', label: 'Youth (0-17)' },
          { value: 'ADULT', label: 'Adult (18-59)' },
          { value: 'SENIOR', label: 'Senior Citizen (60+)' },
        ],
      },
    ],
    []
  )

  // Filtering Logic
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchSearch =
        !filterValues.search ||
        r.fullName.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        r.barangayIdNumber.toLowerCase().includes(filterValues.search.toLowerCase())

      const matchStatus =
        !filterValues.status || filterValues.status === 'all'
          ? r.status === 'ACTIVE'
          : r.status === filterValues.status

      const matchGender =
        !filterValues.gender ||
        filterValues.gender === 'all' ||
        r.gender?.toLowerCase() === String(filterValues.gender).toLowerCase()

      let matchAge = true
      if (filterValues.ageGroup && filterValues.ageGroup !== 'all') {
        const age = r.age || 0
        if (filterValues.ageGroup === 'YOUTH') matchAge = age >= 0 && age <= 17
        else if (filterValues.ageGroup === 'ADULT') matchAge = age >= 18 && age <= 59
        else if (filterValues.ageGroup === 'SENIOR') matchAge = age >= 60
      }

      return matchSearch && matchStatus && matchGender && matchAge
    })
  }, [residents, filterValues])

  // 4 Stats Cards with Month-over-Month trend
  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) return []
    return [
      {
        id: 'total',
        label: 'Total Residents',
        value: stats.totalResidents.count,
        hint: stats.totalResidents.trendText || '+1.8% vs last month',
        icon: Users,
        tone: 'indigo',
      },
      {
        id: 'heads',
        label: 'Heads of Family',
        value: stats.headsOfFamily.count,
        hint: 'Household heads',
        icon: UserCheck,
        tone: 'emerald',
      },
      {
        id: 'seniors',
        label: 'Senior Citizens',
        value: stats.seniorCitizens.count,
        hint: 'Aged 60 and above',
        icon: FileText,
        tone: 'amber',
      },
      {
        id: 'thisMonth',
        label: 'Residents This Month',
        value: stats.residentsThisMonth.count,
        hint: 'Newly registered this month',
        icon: UserPlus,
        tone: 'cyan',
      },
    ]
  }, [stats])

  // Table Columns — Clean & Simple (Same design as User Management)
  const columns: Column<ResidentTableResponse>[] = useMemo(
    () => [
      {
        key: 'barangayIdNumber',
        header: 'BARANGAY ID',
        render: (r) => (
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {r.barangayIdNumber}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'RESIDENT PROFILE',
        render: (r) => (
          <div className="flex items-center gap-3">
            <Avatar name={r.fullName} src={r.photoBase64} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 leading-tight truncate">
                {r.fullName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight truncate max-w-[240px]">
                {r.completeAddress || 'No address provided'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'contactNumber',
        header: 'CONTACT NUMBER',
        render: (r) => (
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {r.contactNumber || '—'}
          </span>
        ),
      },
      {
        key: 'householdNumber',
        header: 'HOUSEHOLD NUMBER',
        render: (r) => (
          <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
            {r.householdNumber || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (r) => {
          const toneMap: Record<ResidentStatus, 'emerald' | 'amber' | 'rose' | 'slate'> = {
            ACTIVE: 'emerald',
            INACTIVE: 'amber',
            DECEASED: 'rose',
            MOVED_OUT: 'slate',
            ARCHIVED: 'slate',
          }
          return <Badge tone={toneMap[r.status] || 'emerald'}>{r.status}</Badge>
        },
      },
    ],
    []
  )

  // ── Archive Handler ────────────────────────────────────────────────────────
  const handleArchiveResident = useCallback(
    (residentId: number, name?: string) => {
      const displayName = name || 'Resident'
      confirm({
        title: `Archive Resident – ${displayName}?`,
        description: 'Are you sure you want to archive this resident record? The record will be moved to archived records.',
        tone: 'warning',
        confirmLabel: 'Archive Resident',
        onConfirm: async () => {
          await residentService.archiveResident(residentId)
          await refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Resident Archived',
            description: `${displayName}'s record has been archived.`,
          })
        },
      })
    },
    [confirm, showFeedback, refreshAll]
  )

  // ── Restore Handler ────────────────────────────────────────────────────────
  const handleRestoreResident = useCallback(
    (residentId: number, name?: string) => {
      const displayName = name || 'Resident'
      confirm({
        title: `Restore Resident – ${displayName}?`,
        description: 'Are you sure you want to restore this resident record back to active status?',
        tone: 'default',
        confirmLabel: 'Restore Resident',
        onConfirm: async () => {
          await residentService.restoreResident(residentId)
          await refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Resident Restored',
            description: `${displayName}'s record has been restored to active status.`,
          })
        },
      })
    },
    [confirm, showFeedback, refreshAll]
  )

  // ── Remove Handler ────────────────────────────────────────────────────────
  const handleRemoveResident = useCallback(
    (residentId: number, name?: string) => {
      const displayName = name || 'Resident'
      confirm({
        title: `Delete Resident – ${displayName}?`,
        description: 'Are you sure you want to remove this resident record?',
        tone: 'danger',
        confirmLabel: 'Delete Resident',
        onConfirm: async () => {
          await residentService.deleteResident(residentId)
          await refreshAll()
          if (viewingResidentId === residentId) {
            setViewingResidentId(null)
          }
          showFeedback({
            variant: 'success',
            title: 'Resident Removed',
            description: `${displayName}'s record has been removed.`,
          })
        },
      })
    },
    [confirm, showFeedback, refreshAll, viewingResidentId]
  )

  // Table Actions — Archive, Restore, and Delete use reusable confirmation dialogs
  const renderActions = useCallback(
    (r: ResidentTableResponse): RowAction<ResidentTableResponse>[] => [
      {
        id: 'view',
        label: 'View Profile Details',
        icon: Eye,
        tone: 'default',
        onClick: (item) => {
          setViewingResidentId(item.id)
        },
      },
      r.status === 'ARCHIVED'
        ? {
            id: 'restore',
            label: 'Restore Resident',
            icon: RotateCcw,
            tone: 'primary',
            onClick: (item) => {
              handleRestoreResident(item.id, item.fullName)
            },
          }
        : {
            id: 'archive',
            label: 'Archive Resident',
            icon: Archive,
            tone: 'warning',
            onClick: (item) => {
              handleArchiveResident(item.id, item.fullName)
            },
          },
      {
        id: 'delete',
        label: 'Remove Resident',
        icon: Trash2,
        tone: 'danger',
        onClick: (item) => {
          handleRemoveResident(item.id, item.fullName)
        },
      },
    ],
    [handleArchiveResident, handleRestoreResident, handleRemoveResident]
  )

  // Dedicated Detail View
  if (viewingResidentId) {
    return (
      <div className="space-y-6">
        <ResidentDetailPageView
          key={`${viewingResidentId}-${detailRefreshKey}`}
          residentId={viewingResidentId}
          onBack={() => setViewingResidentId(null)}
          onEdit={(detail) => {
            setEditingResidentDetail(detail)
            setEditModalOpen(true)
          }}
          onStatusToggle={() => {
            refreshAll()
          }}
        />

        {/* Edit Resident Modal */}
        <EditResidentModal
          open={editModalOpen}
          resident={editingResidentDetail}
          onClose={() => setEditModalOpen(false)}
          onSaved={(name) => {
            refreshAll()
            showFeedback({
              variant: 'success',
              title: 'Resident Updated',
              description: `Resident record for "${name}" has been updated successfully.`,
            })
          }}
        />

        <ConfirmationDialog {...confirmDialogProps} />
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resident Management"
        description="Manage barangay resident profiles, household records, and status information."
        actions={[
          {
            label: 'Add Resident',
            icon: UserPlus,
            onClick: () => {
              setCreateModalOpen(true)
            },
          },
        ]}
      />

      {/* 4 Stats Cards */}
      <StatsCards
        cards={statCards}
        emptyMessage={loading ? 'Loading statistics…' : 'No statistics available.'}
      />

      {/* Filters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Data Table */}
      <DataTable
        data={filteredResidents}
        columns={columns}
        rowKey={(row) => row.id}
        actions={renderActions}
        pageSize={5}
        emptyTitle="No residents found"
        emptyDescription="No resident records match your current filters. Try adjusting your search."
      />

      {/* Create Modal */}
      <CreateResidentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={(name) => {
          refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Resident Added',
            description: `New resident record for "${name}" has been created successfully.`,
          })
        }}
      />

      {/* Edit Modal */}
      <EditResidentModal
        open={editModalOpen}
        resident={editingResidentDetail}
        onClose={() => setEditModalOpen(false)}
        onSaved={(name) => {
          refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Resident Updated',
            description: `Resident record for "${name}" has been updated successfully.`,
          })
        }}
      />

      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
