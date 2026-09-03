import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Eye,
  Archive,
  Trash2,
  Plus,
  Gift,
  Home,
  CheckSquare,
} from 'lucide-react'
import {
  StatsCards,
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  RegisterOfficerModal,
  type StatCard,
} from '@/components/ui'
import {
  DataTable,
  TableFilters,
  Avatar,
  Badge,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'
import { officerService } from '@/config/api/officers/officer.service'
import type { OfficerTableResponse, OfficerStatsResponse } from '@/config/api/officers/officer.types'
import { sharedService, type Department } from '@/config/api/shared_api/shared.service'
import { OfficerDetailPageView } from './components/OfficerDetailPageView'

export function OfficerManagementPage() {
  // Data State directly from Backend API
  const [officers, setOfficers] = useState<OfficerTableResponse[]>([])
  const [stats, setStats] = useState<OfficerStatsResponse>({
    totalOfficers: 0,
    totalOfficersTrend: 'vs last month',
    activeOfficers: 0,
    inactiveStaff: 0,
    departmentsCount: 0,
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Table Filter values
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    department: 'all',
    status: 'all',
  })

  // Modals & Page Detail States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<OfficerTableResponse | null>(null)
  const [viewingOfficer, setViewingOfficer] = useState<OfficerTableResponse | null>(null)

  // Dialogs hook
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Fetch initial data directly from Backend APIs
  const fetchData = useCallback(async (currentFilters = filterValues) => {
    setLoading(true)
    try {
      // 1. Fetch departments for dropdown
      const depts = await sharedService.getDepartments()
      setDepartments(depts)

      // 2. Fetch summary stats from backend
      const statsData = await officerService.getOfficerStats()
      setStats(statsData)

      // 3. Fetch officers table list from backend
      const searchParam = currentFilters.search?.trim() || undefined
      const deptParam = currentFilters.department !== 'all' ? currentFilters.department : undefined
      const statusParam = currentFilters.status !== 'all' ? currentFilters.status : undefined

      const data = await officerService.getOfficersTable({
        search: searchParam,
        department: deptParam,
        status: statusParam,
      })

      setOfficers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load officer data from backend:', error)
      setOfficers([])
    } finally {
      setLoading(false)
    }
  }, [filterValues])

  useEffect(() => {
    fetchData(filterValues)
  }, [])

  // Filter Bar Callbacks for reusable TableFilters component
  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    fetchData(applied)
  }

  const handleClearFilter = () => {
    const cleared: FilterValues = { search: '', department: 'all', status: 'all' }
    setFilterValues(cleared)
    fetchData(cleared)
  }

  // Filter configurations for TableFilters component
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search',
        placeholder: 'Search by first name or lastname...',
      },
      {
        key: 'department',
        label: 'Department',
        options: [
          { label: 'All Departments', value: 'all' },
          ...departments
            .filter((d) => d.name !== 'OVERALL' && d.name !== 'ADMIN')
            .map((d) => ({
              label: d.name === 'LUPON' ? 'Lupong Tagapamayapa' : d.name,
              value: d.name,
            })),
        ],
      },
      {
        key: 'status',
        label: 'Status',
        options: [
          { label: 'All Status', value: 'all' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Archived', value: 'ARCHIVED' },
        ],
      },
    ],
    [departments]
  )

  // Handle Delete Officer
  const handleDeleteOfficer = (officer: OfficerTableResponse) => {
    confirm({
      title: 'Remove Officer Record',
      description: `Are you sure you want to remove ${officer.name} (${officer.position})?`,
      confirmLabel: 'Remove',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await officerService.deleteOfficer(officer.id)
          showFeedback({
            variant: 'success',
            title: 'Officer Removed',
            description: `${officer.name} has been successfully removed from the officer directory.`,
          })
          if (viewingOfficer?.id === officer.id) {
            setViewingOfficer(null)
          }
          fetchData(filterValues)
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Action Failed',
            description: err.response?.data?.message || 'Failed to remove officer.',
          })
        }
      },
    })
  }

  // Handle Dedicated Archive Action from Table Menu
  const handleArchiveOfficer = (officer: OfficerTableResponse) => {
    confirm({
      title: `Archive Officer – ${officer.name}?`,
      description: `This will move ${officer.name}'s officer record to the archive vault. The officer record can be restored at any time.`,
      confirmLabel: 'Archive Officer',
      tone: 'emerald',
      onConfirm: async () => {
        try {
          await officerService.updateOfficerStatus(officer.id, { status: 'ARCHIVED' })
          showFeedback({
            variant: 'success',
            title: 'Officer Archived',
            description: `${officer.name}'s officer record has been moved to the archive vault.`,
          })
          if (viewingOfficer?.id === officer.id) {
            setViewingOfficer(null)
          }
          fetchData(filterValues)
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Action Failed',
            description: err.response?.data?.message || 'Failed to archive officer.',
          })
        }
      },
    })
  }

  // Handle Toggle Officer Status (Active <-> Inactive)
  const handleToggleOfficerStatus = (officer: OfficerTableResponse) => {
    const nextStatus = officer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const isInactivating = nextStatus === 'INACTIVE'
    confirm({
      title: `${isInactivating ? 'Inactivate' : 'Restore'} Officer Account – ${officer.name}?`,
      description: isInactivating
        ? `This will set ${officer.name}'s status to inactive. The officer record can be restored at any time.`
        : `This will reactivate ${officer.name}'s officer record and set their status to Active.`,
      confirmLabel: `${isInactivating ? 'Inactivate' : 'Restore'} Officer`,
      tone: isInactivating ? 'default' : 'emerald',
      onConfirm: async () => {
        try {
          await officerService.updateOfficerStatus(officer.id, { status: nextStatus })
          showFeedback({
            variant: 'success',
            title: `Officer ${isInactivating ? 'Inactivated' : 'Restored'}`,
            description: `${officer.name}'s status has been updated to ${nextStatus}.`,
          })
          if (viewingOfficer?.id === officer.id) {
            setViewingOfficer((prev) => (prev ? { ...prev, status: nextStatus } : null))
          }
          fetchData(filterValues)
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Action Failed',
            description: err.response?.data?.message || 'Failed to update status.',
          })
        }
      },
    })
  }

  // Handle Officer Registration Submission
  const handleRegisterSubmit = async (data: {
    personId: number
    departmentId?: number | null
    isGlobal: boolean
    position: string
    status: 'ACTIVE' | 'INACTIVE'
  }) => {
    try {
      await officerService.createOfficer(data)
      showFeedback({
        variant: 'success',
        title: 'Officer Registered',
        description: 'The officer has been registered and assigned successfully.',
      })
      fetchData(filterValues)
    } catch (err: any) {
      throw err
    }
  }

  // Handle Officer Update Submission
  const handleUpdateSubmit = async (
    id: number,
    data: {
      departmentId?: number | null
      isGlobal: boolean
      position: string
      status: 'ACTIVE' | 'INACTIVE'
    }
  ) => {
    try {
      await officerService.updateOfficer(id, data)
      showFeedback({
        variant: 'success',
        title: 'Officer Updated',
        description: 'The officer details have been updated successfully.',
      })
      fetchData(filterValues)
    } catch (err: any) {
      throw err
    }
  }

  // Helper to determine trend direction
  const getTrendType = (trendStr?: string): 'up' | 'down' | 'neutral' => {
    if (!trendStr) return 'neutral'
    const trimmed = trendStr.trim()
    if (trimmed.startsWith('+') && !trimmed.includes('+0.0%') && !trimmed.includes('+0%')) return 'up'
    if (trimmed.startsWith('-') && !trimmed.includes('-0.0%') && !trimmed.includes('-0%')) return 'down'
    return 'neutral'
  }

  // Define Stat Cards (Only Total Officers card gets the trend hint vs last month!)
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-officers',
        label: 'Total Officers',
        value: stats.totalOfficers,
        hint: stats.totalOfficersTrend || '0.0% vs last month',
        trend: getTrendType(stats.totalOfficersTrend),
        showTrend: true,
        tone: 'indigo',
        icon: Users,
      },
      {
        id: 'active-officers',
        label: 'Active Officers',
        value: stats.activeOfficers,
        hint: 'Currently active',
        tone: 'emerald',
        icon: CheckSquare,
      },
      {
        id: 'inactive-staff',
        label: 'Inactive Staff',
        value: stats.inactiveStaff,
        hint: 'Archived / inactive personnel',
        tone: 'amber',
        icon: Gift,
      },
      {
        id: 'departments-count',
        label: 'Departments',
        value: stats.departmentsCount,
        hint: 'Configured departments',
        tone: 'indigo',
        icon: Home,
      },
    ],
    [stats]
  )

  // Define DataTable Columns
  const columns: Column<OfficerTableResponse>[] = useMemo(
    () => [
      {
        key: 'employee',
        header: 'EMPLOYEE',
        render: (row: OfficerTableResponse) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} photoBase64={row.photoBase64} />
            <div>
              <p className="font-bold text-slate-900 leading-snug">{row.name}</p>
              <p className="text-xs text-slate-500">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'DEPARTMENT',
        render: (row: OfficerTableResponse) => (
          <span className="font-medium text-slate-700">
            {row.departmentName === 'LUPON'
              ? 'Lupong Tagapamayapa'
              : row.departmentName === 'BLOTTER'
              ? 'Blotter Management'
              : row.departmentName === 'BCPC'
              ? 'BCPC'
              : row.departmentName === 'VAWC'
              ? 'VAWC'
              : row.departmentName}
          </span>
        ),
      },
      {
        key: 'position',
        header: 'POSITION',
        render: (row: OfficerTableResponse) => (
          <span className="text-slate-700">{row.position}</span>
        ),
      },
      {
        key: 'activeCases',
        header: 'ACTIVE CASES',
        render: (row: OfficerTableResponse) => (
          <span className="text-slate-700">{row.activeCases} cases</span>
        ),
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row: OfficerTableResponse) => (
          <Badge tone={row.status === 'ACTIVE' ? 'emerald' : row.status === 'ARCHIVED' ? 'amber' : 'slate'}>
            {row.status}
          </Badge>
        ),
      },
    ],
    []
  )

  // Define Row Actions for Three-Dot Dropdown Menu (View, Archive, Delete)
  const actions: RowAction<OfficerTableResponse>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        onClick: (row: OfficerTableResponse) => setViewingOfficer(row),
        tone: 'primary',
      },
      {
        id: 'archive',
        label: 'Archive Officer',
        icon: Archive,
        onClick: (row: OfficerTableResponse) => handleArchiveOfficer(row),
        tone: 'emerald',
      },
      {
        id: 'delete',
        label: 'Delete Officer',
        icon: Trash2,
        onClick: (row: OfficerTableResponse) => handleDeleteOfficer(row),
        tone: 'danger',
      },
    ],
    []
  )

  // Dedicated Full Page Officer Details View (Matching User Management)
  if (viewingOfficer) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <OfficerDetailPageView
          officer={viewingOfficer}
          onBack={() => setViewingOfficer(null)}
          onEdit={(off) => {
            setEditingOfficer(off)
            setIsRegisterModalOpen(true)
          }}
          onStatusToggle={(off) => handleToggleOfficerStatus(off)}
        />

        {/* Edit Officer Modal */}
        <RegisterOfficerModal
          open={isRegisterModalOpen}
          officer={editingOfficer}
          onClose={() => {
            setIsRegisterModalOpen(false)
            setEditingOfficer(null)
          }}
          onSubmitSuccess={() => fetchData(filterValues)}
          onRegister={handleRegisterSubmit}
          onUpdate={handleUpdateSubmit}
        />

        {/* Global Dialogs */}
        <ConfirmationDialog {...confirmDialogProps} />
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Officer Directory"
        description="Manage barangay officers, personnel roles, and department assignments."
        actions={[
          {
            label: 'Add Officer',
            icon: Plus,
            onClick: () => {
              setEditingOfficer(null)
              setIsRegisterModalOpen(true)
            },
          },
        ]}
      />

      {/* Summary Stats Cards */}
      <StatsCards
        cards={statCards}
        emptyMessage={loading ? 'Loading statistics…' : 'No summary statistics available.'}
      />

      {/* Reusable Table Filters Bar */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Officers Data Table with Three-Dot Actions Menu */}
      <DataTable<OfficerTableResponse>
        columns={columns}
        data={officers}
        actions={actions}
        actionsVariant="menu"
        rowKey={(row) => row.id}
        pageSize={5}
        emptyTitle="No officers found"
        emptyDescription="No officers match your current filters. Try adjusting your search."
      />

      {/* Register / Edit Officer Modal */}
      <RegisterOfficerModal
        open={isRegisterModalOpen}
        officer={editingOfficer}
        onClose={() => {
          setIsRegisterModalOpen(false)
          setEditingOfficer(null)
        }}
        onSubmitSuccess={() => fetchData(filterValues)}
        onRegister={handleRegisterSubmit}
        onUpdate={handleUpdateSubmit}
      />

      {/* Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
