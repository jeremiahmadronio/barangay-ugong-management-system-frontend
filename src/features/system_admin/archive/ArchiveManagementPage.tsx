import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart2,
  Users,
  Hourglass,
  CheckCircle2,
  Settings,
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
import { archiveService } from '@/config/api/archive/archive.service'
import type {
  ArchiveSettingsResponse,
  ArchiveStatsResponse,
  ArchivedResident,
  ArchivedUser,
  ArchivedOfficer,
} from '@/config/api/archive/archive.types'
import { ResidentDetailPageView } from '../resident_management/components/ResidentDetailPageView'
import { UserDetailPageView } from '../user_management/components/UserDetailPageView'
import { OfficerDetailPageView } from '../officer_management/components/OfficerDetailPageView'
import type { OfficerTableResponse } from '@/config/api/officers/officer.types'

type ActiveTab = 'residents' | 'users' | 'officers'
type ViewMode = 'ARCHIVED' | 'TRASH'

export function ArchiveManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('ARCHIVED')
  const [activeTab, setActiveTab] = useState<ActiveTab>('residents')
  const [search, setSearch] = useState('')

  // Settings State
  const [settings, setSettings] = useState<ArchiveSettingsResponse>({
    autoDeleteEnabled: true,
    deleteAfterDays: 30,
  })
  const [savingSettings, setSavingSettings] = useState(false)

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
  const [viewingOfficer, setViewingOfficer] = useState<ArchivedOfficer | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [settingsRes, statsRes, resData, userData, offData] = await Promise.all([
        archiveService.getSettings(),
        archiveService.getStats(),
        viewMode === 'ARCHIVED'
          ? archiveService.getArchivedResidents(search)
          : archiveService.getTrashResidents(search),
        viewMode === 'ARCHIVED'
          ? archiveService.getArchivedUsers(search)
          : archiveService.getTrashUsers(search),
        viewMode === 'ARCHIVED'
          ? archiveService.getArchivedOfficers(search)
          : archiveService.getTrashOfficers(search),
      ])
      if (settingsRes) setSettings(settingsRes)
      if (statsRes) setStats(statsRes)
      setResidents(resData || [])
      setUsers(userData || [])
      setOfficers(offData || [])
    } catch (err) {
      console.error('Failed to load archive data:', err)
    }
  }, [search, viewMode])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save Settings Handler
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const updated = await archiveService.updateSettings(settings)
      setSettings(updated)
      showFeedback({
        variant: 'success',
        title: 'Settings Saved',
        description: 'Auto-delete settings updated successfully.',
      })
    } catch (err) {
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Failed to update auto-delete settings.',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  // Restore Handlers
  const handleRestore = useCallback(
    (type: ActiveTab, id: number | string, name: string) => {
      const typeLabel = type === 'users' ? 'User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Restore ${typeLabel} – ${name}?`,
        description: `Are you sure you want to restore "${name}" back to the active directory?`,
        confirmLabel: `Restore ${typeLabel}`,
        tone: 'emerald',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await archiveService.restoreResident(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await archiveService.restoreUser(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await archiveService.restoreOfficer(Number(id))
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
      const typeLabel = type === 'users' ? 'User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Delete ${typeLabel} – ${name}?`,
        description: `Are you sure you want to delete "${name}"? This record will be moved to Recently Deleted (Trash).`,
        confirmLabel: `Delete ${typeLabel}`,
        tone: 'danger',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await archiveService.softDeleteResident(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await archiveService.softDeleteUser(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await archiveService.softDeleteOfficer(Number(id))
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
      const typeLabel = type === 'users' ? 'User' : type === 'residents' ? 'Resident' : 'Officer'
      confirm({
        title: `Delete Permanently – ${name}?`,
        description: `Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`,
        confirmLabel: 'Delete Permanently',
        tone: 'danger',
        onConfirm: async () => {
          try {
            if (type === 'residents') {
              await archiveService.deleteResidentPermanent(Number(id))
              setResidents((prev) => prev.filter((r) => r.id !== id))
            } else if (type === 'users') {
              await archiveService.deleteUserPermanent(String(id))
              setUsers((prev) => prev.filter((u) => u.id !== id))
            } else if (type === 'officers') {
              await archiveService.deleteOfficerPermanent(Number(id))
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
          tone: 'indigo',
        },
        {
          id: 'archived-residents',
          label: 'Archived Residents',
          value: stats.totalArchivedResidents,
          hint: 'Residents in archive',
          icon: Users,
          tone: 'emerald',
        },
        {
          id: 'archived-officers',
          label: 'Archived Officers',
          value: stats.totalArchivedOfficers,
          hint: 'Officers/staff archived',
          icon: Hourglass,
          tone: 'amber',
        },
        {
          id: 'archived-users',
          label: 'Archived Users',
          value: stats.totalArchivedUsers,
          hint: 'User accounts archived',
          icon: CheckCircle2,
          tone: 'sky',
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
        tone: 'rose',
      },
      {
        id: 'trash-residents',
        label: 'Deleted Residents',
        value: stats.totalDeletedResidents,
        hint: 'Residents in recycle bin',
        icon: Users,
        tone: 'rose',
      },
      {
        id: 'trash-officers',
        label: 'Deleted Officers',
        value: stats.totalDeletedOfficers,
        hint: 'Officers in recycle bin',
        icon: Hourglass,
        tone: 'amber',
      },
      {
        id: 'trash-users',
        label: 'Deleted Users',
        value: stats.totalDeletedUsers,
        hint: 'User accounts in recycle bin',
        icon: CheckCircle2,
        tone: 'indigo',
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
        render: (row) => <span className="text-slate-600">{row.email}</span>,
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
        onClick: (row) => setViewingUserId(Number(String(row.id).replace(/\D/g, '')) || 1),
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
        onEdit={() => {}}
      />
    )
  }

  if (viewingUserId) {
    return (
      <UserDetailPageView
        userId={viewingUserId}
        onBack={() => setViewingUserId(null)}
        onEdit={() => {}}
        onLockToggle={() => {}}
      />
    )
  }

  if (viewingOfficer) {
    return (
      <OfficerDetailPageView
        officer={viewingOfficer as unknown as OfficerTableResponse}
        onBack={() => setViewingOfficer(null)}
        onEdit={() => {}}
        onStatusToggle={() => {}}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Settings Pill */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          title="Archive & Trash Vault"
          description="Manage preserved records, soft-deleted recycle bin items, and auto-deletion retention policies."
        />

        {/* Auto-Delete Settings Panel */}
        <div className="flex flex-wrap items-center gap-3.5 bg-white border border-slate-200/80 rounded-full px-5 py-2.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Settings size={15} className="text-slate-500" />
            <span>Auto-Delete Settings</span>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
            <span>Auto-delete</span>
            <input
              type="checkbox"
              checked={settings.autoDeleteEnabled}
              onChange={(e) => setSettings({ ...settings, autoDeleteEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative" />
          </label>

          {/* Retention Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Delete after:</span>
            <select
              value={settings.deleteAfterDays}
              onChange={(e) => setSettings({ ...settings, deleteAfterDays: Number(e.target.value) })}
              className="bg-white border border-slate-300/80 rounded-xl px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={15}>15 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs px-4 py-1.5 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

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
            Showing soft-deleted records in the Recycle Bin. Items will be automatically purged after the retention window ({settings.deleteAfterDays} days).
          </span>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 text-xs sm:text-sm font-medium">
          <span>
            Showing closed and completed records preserved in the official Barangay Archive Vault.
          </span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <StatsCards cards={statCards} />

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
