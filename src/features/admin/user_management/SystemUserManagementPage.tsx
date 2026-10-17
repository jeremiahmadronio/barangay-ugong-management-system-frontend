import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserCheck,
  Lock,
  UserX,
  Eye,
  Archive,
  UserPlus,
} from 'lucide-react'
import {
  StatsCards,
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
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
import { systemUsersService } from '@/config/api/system_users/systemUsers.service'
import type {
  UserTableResponse,
  UserManagementStatsResponse,
  UserFilterRequest,
  UserDetailResponse,
} from '@/config/api/users/users.types'
import { useDialogs } from '@/hooks/useDialogs'
import { maskEmail } from '@/utils/formatters'
import { CreateUserAccountModal } from '@/features/system_admin/user_management/components/CreateUserAccountModal'
import { EditUserAccountModal } from '@/features/system_admin/user_management/components/EditUserAccountModal'
import { LockAccountModal } from '@/features/system_admin/user_management/components/LockAccountModal'
import { UserDetailPageView } from '@/features/system_admin/user_management/components/UserDetailPageView'

// ─── Filter Configurations ──────────────────────────────────────────────────
const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by name or email...',
  },
  {
    key: 'departmentName',
    label: 'Department Access',
    options: [
      { label: 'All departments', value: 'all' },
      { label: 'BCPC (Protection of Children)', value: 'BCPC' },
      { label: 'Barangay Clearance & Certification', value: 'CLEARANCE' },
      { label: 'Blotter Management', value: 'BLOTTER' },
      { label: 'FTJS (First Time Job Seekers)', value: 'FTJS' },
      { label: 'Lupong Tagapamayapa', value: 'LUPON' },
      { label: 'Office of the Barangay Captain', value: 'KAPITANA' },
      { label: 'VAWC (Women & Children)', value: 'VAWC' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All statuses', value: 'all' },
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
      { label: 'Locked', value: 'LOCKED' },
    ],
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function getUserDisplayName(user: Record<string, unknown>): string {
  const nameCandidate = user.fullName || user.personFullName || user.name
  if (
    nameCandidate &&
    typeof nameCandidate === 'string' &&
    nameCandidate !== 'N/A' &&
    nameCandidate.trim().length > 0
  ) {
    return nameCandidate
  }

  const first = typeof user.firstName === 'string' ? user.firstName : ''
  const last = typeof user.lastName === 'string' ? user.lastName : ''
  const combined = [first, last].filter(Boolean).join(' ')
  if (combined.trim().length > 0) return combined

  if (typeof user.username === 'string' && user.username !== 'N/A' && user.username.trim().length > 0) {
    return user.username
  }

  const email = (user.systemEmail || user.email) as string | undefined
  if (email && typeof email === 'string') {
    const handle = email.split('@')[0]
    if (handle) return handle
  }

  return 'User'
}

function getDepartmentAccess(user: Record<string, unknown>): string[] {
  const depts = user.departmentAccess || user.departments
  if (Array.isArray(depts)) {
    return depts.map((d) => (typeof d === 'string' ? d : (d as { name?: string }).name || String(d)))
  }
  return []
}

// ─── System User Management Component ────────────────────────────────────────
export function SystemUserManagementPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserTableResponse[]>([])
  const [stats, setStats] = useState<UserManagementStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    departmentName: 'all',
    status: 'all',
  })

  // Modal & Dedicated Detail Page States
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)
  const [viewingUserPhoto, setViewingUserPhoto] = useState<string | undefined>(undefined)
  const [editingUserDetail, setEditingUserDetail] = useState<UserDetailResponse | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  // Lock Modal state
  const [lockingUser, setLockingUser] = useState<{ id: number; name: string } | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (filters?: UserFilterRequest) => {
    try {
      setLoading(true)
      const [tableData, statsData] = await Promise.all([
        systemUsersService.getTable(filters),
        systemUsersService.getStats(),
      ])
      setUsers(tableData || [])
      setStats(statsData || null)
    } catch (err) {
      console.error('Failed to fetch system users data:', err)
      showFeedback({
        variant: 'error',
        title: 'Data Load Failed',
        description: 'Could not load system user list or statistics from server.',
      })
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  const refreshAll = useCallback(async () => {
    setDetailRefreshKey((prev) => prev + 1)
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Filter Handlers ────────────────────────────────────────────────────────
  const handleApplyFilter = (applied: FilterValues) => {
    const isAllBlank =
      (!applied.search || String(applied.search).trim() === '') &&
      (!applied.departmentName || applied.departmentName === 'all') &&
      (!applied.status || applied.status === 'all')

    if (isAllBlank) {
      handleClearFilter()
      return
    }

    setFilterValues(applied)
    const apiFilter: UserFilterRequest = {
      search: applied.search ? String(applied.search).trim() : undefined,
      departmentName: applied.departmentName !== 'all' ? String(applied.departmentName) : undefined,
      status: applied.status !== 'all' ? (String(applied.status) as UserFilterRequest['status']) : undefined,
    }
    fetchData(apiFilter)
  }

  const handleClearFilter = () => {
    setFilterValues({ search: '', departmentName: 'all', status: 'all' })
    fetchData()
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userObj = user as unknown as Record<string, unknown>
      const displayName = getUserDisplayName(userObj)
      const email = String(user.systemEmail || userObj.email || '')

      const matchSearch =
        !filterValues.search ||
        displayName.toLowerCase().includes(String(filterValues.search).toLowerCase()) ||
        email.toLowerCase().includes(String(filterValues.search).toLowerCase())

      const filterDept = String(filterValues.departmentName || 'all').toUpperCase()
      const userDepts = getDepartmentAccess(userObj).map((d) => d.toUpperCase())
      const matchDept =
        filterDept === 'ALL' ||
        userDepts.some((d) => d.includes(filterDept) || filterDept.includes(d))

      const matchStatus =
        !filterValues.status ||
        filterValues.status === 'all' ||
        (String(filterValues.status).toUpperCase() === 'LOCKED'
          ? Boolean(user.isLocked) || String(user.status).toUpperCase() === 'LOCKED'
          : String(user.status).toUpperCase() === String(filterValues.status).toUpperCase())

      return matchSearch && matchDept && matchStatus
    })
  }, [users, filterValues])

  // ── Stat Cards ─────────────────────────────────────────────────────────────
  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) return []
    return [
      {
        id: 'total',
        label: 'Total Users',
        value: stats.totalUsers.count,
        hint: stats.totalUsers.trendText || '+100.0% vs last month',
        icon: Users,
        tone: 'slate',
      },
      {
        id: 'active',
        label: 'Active Users',
        value: stats.activeUsers.count,
        hint: 'Currently active accounts',
        icon: UserCheck,
        tone: 'slate',
      },
      {
        id: 'locked',
        label: 'Locked Accounts',
        value: stats.lockedUsers.count,
        hint: 'Require attention',
        icon: Lock,
        tone: 'slate',
      },
      {
        id: 'inactive',
        label: 'Inactive Accounts',
        value: stats.inactiveUsers.count,
        hint: 'No recent activity',
        icon: UserX,
        tone: 'slate',
      },
    ]
  }, [stats])

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<UserTableResponse>[] = useMemo(
    () => [
      {
        key: 'profile',
        header: 'PROFILE',
        render: (user) => {
          const userObj = user as unknown as Record<string, unknown>
          const displayName = getUserDisplayName(userObj)
          const email = String(user.systemEmail || userObj.email || '')
          return (
            <div className="flex items-center gap-3">
              <Avatar name={displayName} src={user.photoBase64} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 leading-tight">{displayName}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{maskEmail(email)}</p>
              </div>
            </div>
          )
        },
      },
      {
        key: 'accountType',
        header: 'ACCOUNT TYPE',
        render: () => (
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
            User
          </span>
        ),
      },
      {
        key: 'departmentAccess',
        header: 'DEPARTMENT ACCESS',
        render: (user) => {
          const depts = getDepartmentAccess(user as unknown as Record<string, unknown>)
          const visible = depts.slice(0, 2)
          const hidden = depts.length - visible.length
          return (
            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
              {visible.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                >
                  {d}
                </span>
              ))}
              {hidden > 0 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-2xs">
                  +{hidden}
                </span>
              )}
              {depts.length === 0 && <span className="text-sm text-slate-400">—</span>}
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'STATUS',
        render: (user) => {
          const toneMap = {
            ACTIVE: 'emerald' as const,
            INACTIVE: 'amber' as const,
            LOCKED: 'rose' as const,
            ARCHIVED: 'slate' as const,
          }
          const isLocked = user.isLocked || user.status === 'LOCKED'
          const tone = isLocked ? 'rose' : toneMap[user.status] || 'emerald'
          const label = isLocked ? 'Locked' : user.status
          return <Badge tone={tone}>{label}</Badge>
        },
      },
      {
        key: 'lastLoginAt',
        header: 'LAST LOGIN',
        render: (user) => {
          if (!user.lastLoginAt) {
            return <span className="text-sm text-slate-400 whitespace-nowrap">Never</span>
          }
          const dt = new Date(user.lastLoginAt)
          if (isNaN(dt.getTime())) {
            return <span className="text-sm text-slate-400 whitespace-nowrap">Never</span>
          }
          const formatted = dt.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
          return (
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
              {formatted}
            </span>
          )
        },
      },
    ],
    []
  )

  // ── Status Toggle Handler ──────────────────────────────────────────────────
  const handleStatusToggle = useCallback(
    (userId: number, currentStatus: string, name?: string) => {
      const displayName = name || 'User'
      const isInactiveOrArchived = currentStatus === 'INACTIVE' || currentStatus === 'ARCHIVED'
      const actionLabel = isInactiveOrArchived ? 'Restore' : 'Inactivate'
      const newStatus = isInactiveOrArchived ? 'ACTIVE' : 'INACTIVE'

      confirm({
        title: `${actionLabel} Account – ${displayName}?`,
        description: isInactiveOrArchived
          ? 'This will reactivate the account and restore system access.'
          : 'This will temporarily disable this account. The user will not be able to log in until restored.',
        tone: isInactiveOrArchived ? 'emerald' : 'default',
        confirmLabel: `${actionLabel} Account`,
        onConfirm: async () => {
          if (currentStatus === 'ARCHIVED') {
            await systemUsersService.restore(userId)
          } else {
            await systemUsersService.updateStatus(userId, { status: newStatus as 'ACTIVE' | 'INACTIVE' })
          }
          await refreshAll()
          showFeedback({
            variant: 'success',
            title: `Account ${isInactiveOrArchived ? 'Restored' : 'Inactivated'}`,
            description: `${displayName}'s account has been ${isInactiveOrArchived ? 'reactivated' : 'inactivated'}.`,
          })
        },
      })
    },
    [confirm, showFeedback, refreshAll]
  )

  // ── Unlock Account Handler ─────────────────────────────────────────────────
  const handleUnlockUser = useCallback(
    (userId: number, name: string) => {
      confirm({
        title: `Unlock Account – ${name}?`,
        description: "This will restore the user's ability to log in.",
        tone: 'default',
        confirmLabel: 'Unlock Account',
        onConfirm: async () => {
          await systemUsersService.lockUnlock(userId, { isLocked: false })
          await refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Account Unlocked',
            description: `${name}'s account has been unlocked.`,
          })
        },
      })
    },
    [confirm, showFeedback, refreshAll]
  )

  // ── Archive User Handler ───────────────────────────────────────────────────
  const handleArchiveUser = useCallback(
    (userId: number, name?: string) => {
      const displayName = name || 'User'
      confirm({
        title: `Archive User – ${displayName}?`,
        description: 'This will move the user account to the archive vault. The account can be restored at any time.',
        tone: 'emerald',
        confirmLabel: 'Archive User',
        onConfirm: async () => {
          await systemUsersService.archive(userId)
          await fetchData()
          if (viewingUserId === userId) {
            setViewingUserId(null)
          }
          showFeedback({
            variant: 'success',
            title: 'User Archived',
            description: `${displayName}'s account has been moved to the archive vault.`,
          })
        },
      })
    },
    [confirm, showFeedback, fetchData, viewingUserId]
  )

  // ── Table Row Actions ──────────────────────────────────────────────────────
  const actions: RowAction<UserTableResponse>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (user) => {
          setViewingUserId(user.id)
          setViewingUserPhoto(user.photoBase64)
        },
      },
      {
        id: 'archive',
        label: 'Archive User',
        icon: Archive,
        tone: 'emerald',
        onClick: (user) => {
          const name = getUserDisplayName(user as unknown as Record<string, unknown>)
          handleArchiveUser(user.id, name)
        },
      },
    ],
    [handleArchiveUser]
  )

  // ── Lock Confirm Callback ──────────────────────────────────────────────────
  const handleConfirmLock = async (lockUntilDate?: string) => {
    if (!lockingUser) return
    const { id, name } = lockingUser

    let lockDurationMinutes: number | undefined = undefined
    if (lockUntilDate) {
      const diffMs = new Date(lockUntilDate).getTime() - Date.now()
      if (diffMs > 0) {
        lockDurationMinutes = Math.round(diffMs / (1000 * 60))
      }
    }

    await systemUsersService.lockUnlock(id, {
      isLocked: true,
      lockDurationMinutes,
    })
    await refreshAll()
    showFeedback({
      variant: 'success',
      title: 'Account Locked',
      description: `${name}'s account has been locked.`,
    })
  }

  // ── Dedicated User Detail Page View ────────────────────────────────────────
  if (viewingUserId) {
    return (
      <div className="space-y-6">
        <UserDetailPageView
          key={`${viewingUserId}-${detailRefreshKey}`}
          userId={viewingUserId}
          initialPhotoBase64={viewingUserPhoto}
          onBack={() => {
            setViewingUserId(null)
            setViewingUserPhoto(undefined)
          }}
          fetchDetailFn={(id) => systemUsersService.getDetail(id)}
          onEdit={(detail) => {
            setEditingUserDetail(detail)
            setEditModalOpen(true)
          }}
          onLockToggle={(uId, isLocked) => {
            if (isLocked) {
              handleUnlockUser(uId, 'User')
            } else {
              setLockingUser({ id: uId, name: 'User' })
            }
          }}
          onStatusToggle={(uId, currentStatus) => {
            handleStatusToggle(uId, currentStatus, 'User')
          }}
        />

        {/* Edit Account Modal */}
        <EditUserAccountModal
          open={editModalOpen}
          user={editingUserDetail}
          onClose={() => setEditModalOpen(false)}
          customUpdateFn={async (uId, data) => {
            await systemUsersService.update(uId, data)
          }}
          onSaved={(name) => {
            refreshAll()
            showFeedback({
              variant: 'success',
              title: 'Account Updated',
              description: `Account details for "${name}" have been updated successfully.`,
            })
          }}
        />

        {/* Lock Duration Modal */}
        <LockAccountModal
          open={Boolean(lockingUser)}
          userName={lockingUser?.name || 'User'}
          onClose={() => setLockingUser(null)}
          onConfirmLock={handleConfirmLock}
        />

        {/* Dialogs */}
        <ConfirmationDialog {...confirmDialogProps} />
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  // ── Main User Management Table View ────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system accounts, roles, department access, and account statuses."
        actions={[
          {
            label: 'Create Account',
            icon: UserPlus,
            onClick: () => {
              setCreateUserModalOpen(true)
            },
          },
        ]}
      />

      {/* Stats Cards */}
      <StatsCards stats={statCards} />

      {/* Filters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        rowKey={(user) => user.id}
        actions={actions}
        actionsVariant="menu"
        pageSize={10}
        emptyTitle="No system users found"
        emptyDescription="Try adjusting your search or filters to see more results."
      />

      {/* Create User Account Modal */}
      <CreateUserAccountModal
        open={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        customCreateFn={async (payload) => {
          await systemUsersService.create(payload)
        }}
        onCreated={(name) => {
          refreshAll()
          showFeedback({
            variant: 'success',
            title: 'Account Created',
            description: `System User account for "${name}" was created successfully.`,
          })
        }}
      />

      {/* Global Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
export default SystemUserManagementPage
