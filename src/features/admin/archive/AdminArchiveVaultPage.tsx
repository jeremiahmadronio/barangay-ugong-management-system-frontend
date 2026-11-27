import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart2,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Eye,
  RotateCcw,
  Trash2,
  Archive,
} from 'lucide-react'
import {
  StatsCards,
  Badge,
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  type StatCard,
} from '@/components/ui'
import { DataTable, type Column, type RowAction } from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'
import { residentService } from '@/config/api/residents/residents.service'
import type { ArchivedResident } from '@/config/api/residents/residents.types'
import { userService } from '@/config/api/users/users.service'
import type { ArchiveStatsResponse, ArchivedUser } from '@/config/api/users/users.types'
import { officerService } from '@/config/api/officers/officer.service'
import type { ArchivedOfficer, OfficerTableResponse } from '@/config/api/officers/officer.types'
import { ResidentDetailPageView } from '@/features/system_admin/resident_management/components/ResidentDetailPageView'
import { UserDetailPageView } from '@/features/system_admin/user_management/components/UserDetailPageView'
import { OfficerDetailPageView } from '@/features/system_admin/officer_management/components/OfficerDetailPageView'
import { maskEmail } from '@/utils/formatters'

type ActiveTab = 'residents' | 'users' | 'officers'
type ViewMode = 'ARCHIVED' | 'TRASH'

export function AdminArchiveVaultPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('ARCHIVED')
  const [activeTab, setActiveTab] = useState<ActiveTab>('residents')
  const [search, setSearch] = useState('')

  // Stats State
  const [stats, setStats] = useState<ArchiveStatsResponse>({
    totalArchived: 0,
    totalArchivedResidents: 0,
    totalArchivedOfficers: 0,
    totalArchivedUsers: 0,
    totalDeleted: 0,
    totalDeletedResidents: 0,
    totalDeletedOfficers: 0,
    totalDeletedUsers: 0,
  })

  // Table Data State
  const [residents, setResidents] = useState<ArchivedResident[]>([])
  const [users, setUsers] = useState<ArchivedUser[]>([])
  const [officers, setOfficers] = useState<ArchivedOfficer[]>([])

  // View Detail Page States
  const [viewingResidentId, setViewingResidentId] = useState<number | null>(null)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)
  const [viewingUserPhoto, setViewingUserPhoto] = useState<string | undefined>(undefined)
  const [viewingOfficer, setViewingOfficer] = useState<ArchivedOfficer | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [statsRes, resData, userData, offData] = await Promise.all([
        userService.getSystemUserArchiveStats(),
        viewMode === 'ARCHIVED'
          ? residentService.getArchivedResidents(search)
          : residentService.getTrashResidents(search),
        viewMode === 'ARCHIVED'
          ? userService.getArchivedSystemUsers(search)
          : userService.getTrashSystemUsers(search),
        viewMode === 'ARCHIVED'
          ? officerService.getArchivedOfficers(search)
          : officerService.getTrashOfficers(search),
      ])
      if (statsRes) setStats(statsRes)
      setResidents(resData || [])
      setUsers(userData || [])
      setOfficers(offData || [])
    } catch (err) {
      console.error('Failed to load admin archive data:', err)
    }
  }, [search, viewMode])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Restore Handlers
  const handleRestore = useCallback(
    (type: ActiveTab, id: number | string, name: string) => {
      const typeLabel = type === 'users' ? 'System User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Restore ${typeLabel} – ${name}?`,
        description: `Are you sure you want to restore "${name}" back to the active directory?`,
        confirmLabel: `Restore ${typeLabel}`,
        tone: 'emerald',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await residentService.restoreSystemArchivedResident(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await userService.restoreSystemUser(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await officerService.restoreArchivedOfficer(Number(id))
              setOfficers((prev) => prev.filter((o) => o.id !== id))
            }
            showFeedback({
              variant: 'success',
              title: `${typeLabel} Restored`,
              description: `"${name}" has been restored successfully to active list.`,
            })
            loadData()
          } catch (err) {
            showFeedback({
              variant: 'error',
              title: 'Action Failed',
              description: 'Failed to restore record.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, loadData]
  )

  // Soft Delete Handlers (Moves from Archived to Recently Deleted)
  const handleSoftDelete = useCallback(
    (type: ActiveTab, id: number | string, name: string) => {
      const typeLabel = type === 'users' ? 'System User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Delete ${typeLabel} – ${name}?`,
        description: `Are you sure you want to delete "${name}"? This record will be moved to Recently Deleted (Trash).`,
        confirmLabel: `Delete ${typeLabel}`,
        tone: 'danger',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await residentService.softDeleteSystemArchivedResident(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await userService.deleteSystemUser(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await officerService.softDeleteArchivedOfficer(Number(id))
              setOfficers((prev) => prev.filter((o) => o.id !== id))
            }
            showFeedback({
              variant: 'success',
              title: `${typeLabel} Moved to Trash`,
              description: `"${name}" has been moved to Recently Deleted.`,
            })
            loadData()
          } catch (err) {
            showFeedback({
              variant: 'error',
              title: 'Action Failed',
              description: `Failed to delete ${typeLabel.toLowerCase()}.`,
            })
          }
        },
      })
    },
    [confirm, showFeedback, loadData]
  )

  // Delete Permanently Handlers
  const handleDeletePermanent = useCallback(
    (type: ActiveTab, id: number | string, name: string) => {
      const typeLabel = type === 'users' ? 'System User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Delete Permanently – ${name}?`,
        description: `Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`,
        confirmLabel: 'Delete Permanently',
        tone: 'danger',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await residentService.deleteSystemArchivedResidentPermanently(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await userService.permanentlyDeleteSystemUser(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await officerService.deleteArchivedOfficerPermanently(Number(id))
              setOfficers((prev) => prev.filter((o) => o.id !== id))
            }
            showFeedback({
              variant: 'success',
              title: `${typeLabel} Deleted`,
              description: `"${name}" was permanently removed from the system.`,
            })
            loadData()
          } catch (err) {
            showFeedback({
              variant: 'error',
              title: 'Deletion Failed',
              description: 'Failed to permanently delete record.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, loadData]
  )

  // Dynamic Stat Cards Config based on viewMode (ARCHIVED vs TRASH)
  const statCards: StatCard[] = useMemo(() => {
    if (viewMode === 'ARCHIVED') {
      return [
        {
          id: 'total-archived',
          label: 'Total Archived',
          value: stats.totalArchived,
          hint: 'All archived records',
          icon: BarChart2,
          tone: 'slate',
        },
        {
          id: 'archived-residents',
          label: 'Archived Residents',
          value: stats.totalArchivedResidents,
          hint: 'Residents in archive',
          icon: Users,
          tone: 'slate',
        },
        {
          id: 'archived-officers',
          label: 'Archived Officers',
          value: stats.totalArchivedOfficers,
          hint: 'Officers/staff archived',
          icon: ShieldCheck,
          tone: 'slate',
        },
        {
          id: 'archived-users',
          label: 'Archived Users',
          value: stats.totalArchivedUsers,
          hint: 'System user accounts archived',
          icon: UserCheck,
          tone: 'slate',
        },
      ]
    }

    return [
      {
        id: 'total-trash',
        label: 'Total in Trash',
        value: stats.totalDeleted,
        hint: 'All soft-deleted records',
        icon: Trash2,
        tone: 'slate',
      },
      {
        id: 'trash-residents',
        label: 'Deleted Residents',
        value: stats.totalDeletedResidents,
        hint: 'Residents in recycle bin',
        icon: Users,
        tone: 'slate',
      },
      {
        id: 'trash-officers',
        label: 'Deleted Officers',
        value: stats.totalDeletedOfficers,
        hint: 'Officers in recycle bin',
        icon: ShieldCheck,
        tone: 'slate',
      },
      {
        id: 'trash-users',
        label: 'Deleted Users',
        value: stats.totalDeletedUsers,
        hint: 'System user accounts in recycle bin',
        icon: UserX,
        tone: 'slate',
      },
    ]
  }, [viewMode, stats])

  // Columns for Residents
  const residentColumns: Column<ArchivedResident>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'FULL NAME',
        render: (row) => <span className="font-semibold text-slate-800">{row.fullName}</span>,
      },
      {
        key: 'barangayId',
        header: 'BARANGAY ID',
        render: (row) => <span className="text-slate-600">{row.barangayId}</span>,
      },
      {
        key: 'contact',
        header: 'CONTACT',
        render: (row) => <span className="text-slate-600">{row.contact}</span>,
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => (
          <Badge tone={viewMode === 'TRASH' ? 'rose' : 'amber'}>
            {viewMode === 'TRASH' ? 'DELETED' : (row.status || 'ARCHIVED')}
          </Badge>
        ),
      },
    ],
    [viewMode]
  )

  // Row Actions for Residents
  const residentActions: RowAction<ArchivedResident>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => setViewingResidentId(row.id),
      },
      {
        id: 'restore',
        label: 'Restore Resident',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestore('residents', row.id, row.fullName),
      },
      viewMode === 'ARCHIVED'
        ? {
            id: 'delete',
            label: 'Delete Resident',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleSoftDelete('residents', row.id, row.fullName),
          }
        : {
            id: 'delete-perm',
            label: 'Delete Permanently',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleDeletePermanent('residents', row.id, row.fullName),
          },
    ],
    [viewMode, handleRestore, handleSoftDelete, handleDeletePermanent]
  )

  // Columns for Users
  const userColumns: Column<ArchivedUser>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'FULL NAME',
        render: (row) => <span className="font-semibold text-slate-800">{row.fullName}</span>,
      },
      {
        key: 'email',
        header: 'EMAIL',
        render: (row) => <span className="text-slate-600">{maskEmail(row.email)}</span>,
      },
      {
        key: 'role',
        header: 'ROLE',
        render: (row) => <span className="text-slate-600 font-medium">{row.role}</span>,
      },
      {
        key: 'departments',
        header: 'DEPARTMENT ACCESS',
        render: (row) => {
          if (!row.departments || row.departments === 'N/A') {
            return <span className="text-slate-400 text-xs">N/A</span>
          }
          const depts = row.departments.split(', ').filter(Boolean)
          if (
            row.role === 'ADMIN' ||
            row.role === 'ROOT_ADMIN' ||
            depts.includes('ADMIN') ||
            depts.includes('ADMINISTRATION') ||
            depts.length >= 7
          ) {
            return (
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                OVERALL
              </span>
            )
          }
          if (depts.length === 0) return <span className="text-slate-400 text-xs">N/A</span>

          const visible = depts.slice(0, 2)
          const remaining = depts.length - 2

          return (
            <div className="flex items-center gap-1.5 flex-wrap" title={row.departments}>
              {visible.map((dept, i) => (
                <span
                  key={i}
                  className="px-3 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                >
                  {dept}
                </span>
              ))}
              {remaining > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-normal bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  +{remaining}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => (
          <Badge tone={viewMode === 'TRASH' ? 'rose' : 'amber'}>
            {viewMode === 'TRASH' ? 'DELETED' : (row.status || 'ARCHIVED')}
          </Badge>
        ),
      },
    ],
    [viewMode]
  )

  // Row Actions for Users
  const userActions: RowAction<ArchivedUser>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => {
          setViewingUserId(Number(String(row.id).replace(/\D/g, '')) || 1)
          setViewingUserPhoto((row as unknown as { photoBase64?: string }).photoBase64)
        },
      },
      {
        id: 'restore',
        label: 'Restore User',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestore('users', row.id, row.fullName),
      },
      viewMode === 'ARCHIVED'
        ? {
            id: 'delete',
            label: 'Delete User',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleSoftDelete('users', row.id, row.fullName),
          }
        : {
            id: 'delete-perm',
            label: 'Delete Permanently',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleDeletePermanent('users', row.id, row.fullName),
          },
    ],
    [viewMode, handleRestore, handleSoftDelete, handleDeletePermanent]
  )

  // Columns for Officers
  const officerColumns: Column<ArchivedOfficer>[] = useMemo(
    () => [
      {
        key: 'employee',
        header: 'EMPLOYEE',
        render: (row) => <span className="font-semibold text-slate-800">{row.employee}</span>,
      },
      {
        key: 'department',
        header: 'DEPARTMENT',
        render: (row) => {
          const dept = row.department
          const displayDept =
            !dept || dept === 'ADMIN' || dept === 'ADMINISTRATION' ? 'OVERALL' : dept
          return <span className="text-slate-600 font-medium">{displayDept}</span>
        },
      },
      {
        key: 'position',
        header: 'POSITION',
        render: (row) => <span className="text-slate-600">{row.position}</span>,
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (row) => (
          <Badge tone={viewMode === 'TRASH' ? 'rose' : 'amber'}>
            {viewMode === 'TRASH' ? 'DELETED' : (row.status || 'ARCHIVED')}
          </Badge>
        ),
      },
    ],
    [viewMode]
  )

  // Row Actions for Officers
  const officerActions: RowAction<ArchivedOfficer>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => setViewingOfficer(row),
      },
      {
        id: 'restore',
        label: 'Restore Officer',
        icon: RotateCcw,
        tone: 'emerald',
        onClick: (row) => handleRestore('officers', row.id, row.employee),
      },
      viewMode === 'ARCHIVED'
        ? {
            id: 'delete',
            label: 'Delete Officer',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleSoftDelete('officers', row.id, row.employee),
          }
        : {
            id: 'delete-perm',
            label: 'Delete Permanently',
            icon: Trash2,
            tone: 'danger',
            onClick: (row) => handleDeletePermanent('officers', row.id, row.employee),
          },
    ],
    [viewMode, handleRestore, handleSoftDelete, handleDeletePermanent]
  )

  // Sub-View Detail Views (User, Resident, Officer)
  if (viewingResidentId) {
    return (
      <ResidentDetailPageView
        residentId={viewingResidentId}
        onBack={() => setViewingResidentId(null)}
        backLabel="Back to Archive Vault"
        readOnly
      />
    )
  }

  if (viewingUserId) {
    return (
      <UserDetailPageView
        userId={viewingUserId}
        initialPhotoBase64={viewingUserPhoto}
        onBack={() => {
          setViewingUserId(null)
          setViewingUserPhoto(undefined)
        }}
        backLabel="Back to Archive Vault"
        readOnly
      />
    )
  }

  if (viewingOfficer) {
    return (
      <OfficerDetailPageView
        officer={viewingOfficer as unknown as OfficerTableResponse}
        onBack={() => setViewingOfficer(null)}
        backLabel="Back to Archive Vault"
        readOnly
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header (Settings Omitted for Barangay Admin) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          title="Archive & Trash Vault"
          description="Manage preserved records and soft-deleted recycle bin items."
        />
      </div>

      {/* KPI Stats Cards */}
      <StatsCards cards={statCards} />

      {/* --- PILL TABS SELECTOR (Matching Blotter Design) --- */}
      <div className="flex items-center gap-2 bg-slate-100/70 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setViewMode('ARCHIVED')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            viewMode === 'ARCHIVED'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Archive size={16} className={viewMode === 'ARCHIVED' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Archived</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            {stats.totalArchived}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('TRASH')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            viewMode === 'TRASH'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Trash2 size={16} className={viewMode === 'TRASH' ? 'text-rose-600' : 'text-slate-400'} />
          <span>Recently Deleted</span>
          {stats.totalDeleted > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
              {stats.totalDeleted}
            </span>
          )}
        </button>
      </div>

      {/* --- CONTEXTUAL ALERT BANNER --- */}
      {viewMode === 'TRASH' ? (
        <div className="flex items-center rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-rose-800 text-xs sm:text-sm font-medium">
          <span>
            Showing soft-deleted records in the Recycle Bin. Items can be restored or permanently removed.
          </span>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 text-xs sm:text-sm font-medium">
          <span>
            Showing closed and completed records preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        {/* Navigation Tabs + Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 cursor-pointer ${
                activeTab === 'residents'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Residents
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 cursor-pointer ${
                activeTab === 'officers'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Officers
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search size={17} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs text-slate-700"
            />
          </div>
        </div>

        {/* DataTables */}
        {activeTab === 'residents' && (
          <DataTable<ArchivedResident>
            data={residents}
            columns={residentColumns}
            rowKey={(row) => row.id}
            actions={residentActions}
            pageSize={7}
            emptyTitle={viewMode === 'TRASH' ? 'No deleted residents found' : 'No archived residents found'}
            emptyDescription={
              viewMode === 'TRASH'
                ? 'There are currently no resident records in the recycle bin.'
                : 'There are currently no resident records in the archive vault.'
            }
          />
        )}

        {activeTab === 'users' && (
          <DataTable<ArchivedUser>
            data={users}
            columns={userColumns}
            rowKey={(row) => row.id}
            actions={userActions}
            pageSize={7}
            emptyTitle={viewMode === 'TRASH' ? 'No deleted users found' : 'No archived users found'}
            emptyDescription={
              viewMode === 'TRASH'
                ? 'There are currently no user accounts in the recycle bin.'
                : 'There are currently no user accounts in the archive vault.'
            }
          />
        )}

        {activeTab === 'officers' && (
          <DataTable<ArchivedOfficer>
            data={officers}
            columns={officerColumns}
            rowKey={(row) => row.id}
            actions={officerActions}
            pageSize={7}
            emptyTitle={viewMode === 'TRASH' ? 'No deleted officers found' : 'No archived officers found'}
            emptyDescription={
              viewMode === 'TRASH'
                ? 'There are currently no officer records in the recycle bin.'
                : 'There are currently no officer records in the archive vault.'
            }
          />
        )}
      </div>

      {/* Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
