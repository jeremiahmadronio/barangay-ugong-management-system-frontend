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

export function ArchiveManagementPage() {
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
    totalArchived: 3,
    totalArchivedResidents: 1,
    totalArchivedOfficers: 1,
    totalArchivedUsers: 1,
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
        archiveService.getArchivedResidents(search),
        archiveService.getArchivedUsers(search),
        archiveService.getArchivedOfficers(search),
      ])
      if (settingsRes) setSettings(settingsRes)
      if (statsRes) setStats(statsRes)
      setResidents(resData || [])
      setUsers(userData || [])
      setOfficers(offData || [])
    } catch (err) {
      console.error('Failed to load archive data:', err)
    }
  }, [search])

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
      confirm({
        title: `Restore Record – ${name}?`,
        description: `Are you sure you want to restore "${name}" from archive back to active list?`,
        confirmLabel: 'Restore Record',
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
              title: 'Record Restored',
              description: `"${name}" has been restored successfully.`,
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

  // Delete Handlers
  const handleDeletePermanent = useCallback(
    (type: ActiveTab, id: number | string, name: string) => {
      confirm({
        title: `Permanently Delete – ${name}?`,
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
              title: 'Record Deleted',
              description: `"${name}" was permanently removed from database.`,
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

  // Stat Cards Config
  const statCards: StatCard[] = useMemo(
    () => [
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
        tone: 'sky',
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
        tone: 'violet',
      },
    ],
    [stats]
  )

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
        render: (row) => <Badge tone="amber">{row.status}</Badge>,
      },
    ],
    []
  )

  // Row Actions for Residents
  const residentActions: RowAction<ArchivedResident>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Profile Details',
        icon: Eye,
        tone: 'default',
        onClick: (row) => setViewingResidentId(row.id),
      },
      {
        id: 'restore',
        label: 'Restore Account',
        icon: RotateCcw,
        tone: 'warning',
        onClick: (row) => handleRestore('residents', row.id, row.fullName),
      },
      {
        id: 'delete',
        label: 'Remove Resident',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDeletePermanent('residents', row.id, row.fullName),
      },
    ],
    [handleRestore, handleDeletePermanent]
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
        render: (row) => <Badge tone="amber">{row.status}</Badge>,
      },
    ],
    []
  )

  // Row Actions for Users
  const userActions: RowAction<ArchivedUser>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Profile Details',
        icon: Eye,
        tone: 'default',
        onClick: (row) => setViewingUserId(Number(row.id.replace(/\D/g, '')) || 1),
      },
      {
        id: 'restore',
        label: 'Restore Account',
        icon: RotateCcw,
        tone: 'warning',
        onClick: (row) => handleRestore('users', row.id, row.fullName),
      },
      {
        id: 'delete',
        label: 'Remove User',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDeletePermanent('users', row.id, row.fullName),
      },
    ],
    [handleRestore, handleDeletePermanent]
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
        render: (row) => <Badge tone="amber">{row.status}</Badge>,
      },
    ],
    []
  )

  // Row Actions for Officers
  const officerActions: RowAction<ArchivedOfficer>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Profile Details',
        icon: Eye,
        tone: 'default',
        onClick: (row) => setViewingOfficer(row),
      },
      {
        id: 'restore',
        label: 'Restore Account',
        icon: RotateCcw,
        tone: 'warning',
        onClick: (row) => handleRestore('officers', row.id, row.employee),
      },
      {
        id: 'delete',
        label: 'Remove Officer',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDeletePermanent('officers', row.id, row.employee),
      },
    ],
    [handleRestore, handleDeletePermanent]
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
          title="Archive"
          description="Manage archived residents, officers, user accounts, and auto-deletion policies."
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

      {/* KPI Stats Cards */}
      <StatsCards cards={statCards} />

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        {/* Navigation Tabs + Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('residents')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 ${
                activeTab === 'residents'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Residents
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition border focus:outline-none focus:ring-0 ${
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
            emptyTitle="No archived residents found"
            emptyDescription="There are currently no resident records in the archive vault."
          />
        )}

        {activeTab === 'users' && (
          <DataTable<ArchivedUser>
            data={users}
            columns={userColumns}
            rowKey={(row) => row.id}
            actions={userActions}
            pageSize={7}
            emptyTitle="No archived users found"
            emptyDescription="There are currently no user accounts in the archive vault."
          />
        )}

        {activeTab === 'officers' && (
          <DataTable<ArchivedOfficer>
            data={officers}
            columns={officerColumns}
            rowKey={(row) => row.id}
            actions={officerActions}
            pageSize={7}
            emptyTitle="No archived officers found"
            emptyDescription="There are currently no officer records in the archive vault."
          />
        )}
      </div>

      {/* Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
