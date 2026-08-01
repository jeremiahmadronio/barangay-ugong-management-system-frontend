import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users,
  UserCheck,
  ShieldAlert,
  FileText,
  Eye,
  Archive,
  Trash2,
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
import { userService } from '@/config/api/users/users.service'
import type {
  UserTableResponse,
  UserManagementStatsResponse,
  UserFilterRequest,
  UserDetailResponse,
} from '@/config/api/users/users.types'
import { useDialogs } from '@/hooks/useDialogs'
import { AccountTypeSelectionModal } from './components/AccountTypeSelectionModal'
import { CreateAdminAccountModal } from './components/CreateAdminAccountModal'
import { CreateUserAccountModal } from './components/CreateUserAccountModal'
import { EditUserAccountModal } from './components/EditUserAccountModal'
import { LockAccountModal } from './components/LockAccountModal'
import { UserDetailPageView } from './components/UserDetailPageView'

// ─── Filter Configs ──────────────────────────────────────────────────────────
const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by name or email...',
  },
  {
    key: 'accountType',
    label: 'Account Type',
    options: [
      { label: 'All account types', value: 'all' },
      { label: 'Admin', value: 'ADMIN' },
      { label: 'User', value: 'USER' },
    ],
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

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/** Safely resolves display name from any backend response field variation */
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

/** Formats raw enum string -> friendly account type (Admin / User) */
function formatAccountTypeLabel(type?: string): string {
  if (!type || type === 'N/A') return 'User'
  const upper = String(type).trim().toUpperCase()
  if (upper.includes('ADMIN')) return 'Admin'
  return 'User'
}

/** Extracts array of department string badges safely */
function getDepartmentAccess(user: Record<string, unknown>): string[] {
  const depts = user.departmentAccess || user.departments
  if (Array.isArray(depts)) {
    return depts.map((d) => (typeof d === 'string' ? d : (d as { name?: string }).name || String(d)))
  }
  return []
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function UserManagementPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserTableResponse[]>([])
  const [stats, setStats] = useState<UserManagementStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    accountType: 'all',
    departmentName: 'all',
    status: 'all',
  })

  // Modal & Dedicated Detail Page States
  const [selectionModalOpen, setSelectionModalOpen] = useState(false)
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)

  const [viewingUserId, setViewingUserId] = useState<number | null>(null)
  const [editingUserDetail, setEditingUserDetail] = useState<UserDetailResponse | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  // Lock Duration Modal state
  const [lockingUser, setLockingUser] = useState<{ id: number; name: string } | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // ── Fetch Data directly from Backend API ──────────────────────────────────
  const fetchData = useCallback(async (filters?: UserFilterRequest) => {
    try {
      setLoading(true)
      const [tableData, statsData] = await Promise.all([
        userService.getUsersTable(filters),
        userService.getUserStats(),
      ])
      setUsers(tableData || [])
      setStats(statsData || null)
    } catch (err) {
      console.error('Failed to fetch user management data:', err)
      showFeedback({
        variant: 'error',
        title: 'Data Load Failed',
        description: 'Could not load user list or stats from server.',
      })
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
    const apiFilter: UserFilterRequest = {
      search: applied.search || undefined,
      roleName: applied.accountType !== 'all' ? String(applied.accountType) : undefined,
      departmentName: applied.departmentName !== 'all' ? String(applied.departmentName) : undefined,
      status: applied.status !== 'all' ? (String(applied.status) as UserFilterRequest['status']) : undefined,
    }
    fetchData(apiFilter)
  }

  const handleClearFilter = () => {
    setFilterValues({ search: '', accountType: 'all', departmentName: 'all', status: 'all' })
    fetchData()
  }

  // Pure Backend Users Array Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userObj = user as unknown as Record<string, unknown>
      const displayName = getUserDisplayName(userObj)
      const email = String(user.systemEmail || userObj.email || '')
      const matchSearch =
        !filterValues.search ||
        displayName.toLowerCase().includes(filterValues.search.toLowerCase()) ||
        email.toLowerCase().includes(filterValues.search.toLowerCase())

      const accType = formatAccountTypeLabel(user.accountType || user.roleName).toUpperCase()
      const filterAccType = String(filterValues.accountType || 'all').toUpperCase()

      const matchType =
        filterAccType === 'ALL' ||
        (filterAccType === 'ADMIN' && accType === 'ADMIN') ||
        (filterAccType === 'USER' && accType !== 'ADMIN')

      const filterDept = String(filterValues.departmentName || 'all').toUpperCase()
      const userDepts = getDepartmentAccess(userObj).map((d) => d.toUpperCase())
      const matchDept =
        filterDept === 'ALL' ||
        userDepts.some((d) => d.includes(filterDept) || filterDept.includes(d))

      const matchStatus =
        !filterValues.status ||
        filterValues.status === 'all' ||
        String(user.status).toUpperCase() === String(filterValues.status).toUpperCase()

      return matchSearch && matchType && matchDept && matchStatus
    })
  }, [users, filterValues])

  // Stat Cards Mapping
  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) return []
    return [
      {
        id: 'total',
        label: 'Total Users',
        value: stats.totalUsers.count,
        hint: stats.totalUsers.trendText || '+100.0% vs last month',
        icon: Users,
        tone: 'indigo',
      },
      {
        id: 'active',
        label: 'Active Users',
        value: stats.activeUsers.count,
        hint: 'Currently active accounts',
        icon: UserCheck,
        tone: 'emerald',
      },
      {
        id: 'locked',
        label: 'Locked Accounts',
        value: stats.lockedUsers.count,
        hint: 'Require attention',
        icon: ShieldAlert,
        tone: 'rose',
      },
      {
        id: 'inactive',
        label: 'Inactive Accounts',
        value: stats.inactiveUsers.count,
        hint: 'No recent activity',
        icon: FileText,
        tone: 'amber',
      },
    ]
  }, [stats])

  // Table Columns
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
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{email}</p>
              </div>
            </div>
          )
        },
      },
      {
        key: 'accountType',
        header: 'ACCOUNT TYPE',
        render: (user) => (
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
            {formatAccountTypeLabel(user.accountType || user.roleName)}
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
          return (
            <Badge tone={tone}>
              {label}
            </Badge>
          )
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

  // ── Inactivate / Restore Account Handler ──────────────────────────────────
  const handleStatusToggle = useCallback(
    (userId: number, currentStatus: string, name?: string) => {
      const displayName = name || 'User'
      const isInactiveOrArchived = currentStatus === 'INACTIVE' || currentStatus === 'ARCHIVED'
      const actionLabel = isInactiveOrArchived ? 'Restore' : 'Inactivate'
      const newStatus = isInactiveOrArchived ? 'ACTIVE' : 'INACTIVE'

      confirm({
        title: `${actionLabel} Account – ${displayName}?`,
        description: isInactiveOrArchived
          ? "This will reactivate the account and restore system access."
          : "This will temporarily disable this account. The user will not be able to log in until restored.",
        tone: isInactiveOrArchived ? 'emerald' : 'default',
        confirmLabel: `${actionLabel} Account`,
        onConfirm: async () => {
          if (currentStatus === 'ARCHIVED') {
            await userService.restoreUser(userId)
          } else {
            await userService.updateUserStatus(userId, { status: newStatus as 'ACTIVE' | 'INACTIVE' })
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

  // ── Unlock Account Handler ───────────────────────────────────────────────
  const handleUnlockUser = useCallback((userId: number, name: string) => {
    confirm({
      title: `Unlock Account – ${name}?`,
      description: "This will restore the user's ability to log in.",
      tone: 'default',
      confirmLabel: 'Unlock Account',
      onConfirm: async () => {
        await userService.lockUnlockUser(userId, { isLocked: false })
        await refreshAll()
        showFeedback({
          variant: 'success',
          title: 'Account Unlocked',
          description: `${name}'s account has been unlocked.`,
        })
      },
    })
  }, [confirm, showFeedback, refreshAll])

  // ── Archive Account Handler ──────────────────────────────────────────────
  const handleArchiveUser = useCallback((userId: number, name?: string) => {
    const displayName = name || 'User'
    confirm({
      title: `Archive Account – ${displayName}?`,
      description: 'This will move the account to the archive vault. The account can be restored at any time.',
      tone: 'warning',
      confirmLabel: 'Archive Account',
      onConfirm: async () => {
        await userService.archiveUser(userId)
        await fetchData()
        if (viewingUserId === userId) {
          setViewingUserId(null)
        }
        showFeedback({
          variant: 'success',
          title: 'Account Archived',
          description: `${displayName}'s account has been moved to the archive vault.`,
        })
      },
    })
  }, [confirm, showFeedback, fetchData, viewingUserId])

  // ── Permanent Delete Handler ─────────────────────────────────────────────
  const handleRemoveUser = useCallback((userId: number, name?: string) => {
    const displayName = name || 'User'
    confirm({
      title: `Remove User – ${displayName}?`,
      description: 'This will permanently delete the account. This action cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Remove Account',
      onConfirm: async () => {
        await userService.deleteUser(userId)
        await fetchData()
        if (viewingUserId === userId) {
          setViewingUserId(null)
        }
        showFeedback({
          variant: 'success',
          title: 'User Removed',
          description: `${displayName} has been removed from the system.`,
        })
      },
    })
  }, [confirm, showFeedback, fetchData, viewingUserId])

  // ── Table Row Actions ────────────────────────────────────────────────────
  const actions: RowAction<UserTableResponse>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Profile Details',
        icon: Eye,
        tone: 'default',
        onClick: (user) => {
          setViewingUserId(user.id)
        },
      },
      {
        id: 'archive',
        label: 'Archive Account',
        icon: Archive,
        tone: 'warning',
        onClick: (user) => {
          const name = getUserDisplayName(user as unknown as Record<string, unknown>)
          handleArchiveUser(user.id, name)
        },
      },
      {
        id: 'delete',
        label: 'Remove User',
        icon: Trash2,
        tone: 'danger',
        onClick: (user) => {
          const name = getUserDisplayName(user as unknown as Record<string, unknown>)
          handleRemoveUser(user.id, name)
        },
      },
    ],
    [handleArchiveUser, handleRemoveUser]
  )

  // ── Lock Confirm Callback from LockAccountModal ─────────────────────────
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

    await userService.lockUnlockUser(id, {
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

  // ── Full Page Dedicated User Detail View ─────────────────────────────────
  if (viewingUserId) {
    return (
      <div className="space-y-6">
        <UserDetailPageView
          key={`${viewingUserId}-${detailRefreshKey}`}
          userId={viewingUserId}
          onBack={() => setViewingUserId(null)}
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
          onArchive={(uId) => {
            handleArchiveUser(uId)
          }}
        />

        {/* Edit Account Modal */}
        <EditUserAccountModal
          open={editModalOpen}
          user={editingUserDetail}
          onClose={() => setEditModalOpen(false)}
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

        {/* Global Dialogs */}
        <ConfirmationDialog {...confirmDialogProps} />
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  // ── Main User Management Table & Filters View ────────────────────────────
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
              setSelectionModalOpen(true)
            },
          },
        ]}
      />

      {/* Stats Cards */}
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
        data={filteredUsers}
        columns={columns}
        rowKey={(row) => row.id}
        actions={actions}
        pageSize={7}
        emptyTitle="No users found"
        emptyDescription="No users match your current filters. Try adjusting your search."
      />

      {/* 1. Account Type Selection Wizard Modal */}
      <AccountTypeSelectionModal
        open={selectionModalOpen}
        onClose={() => setSelectionModalOpen(false)}
        onSelectAdmin={() => {
          setSelectionModalOpen(false)
          setCreateAdminModalOpen(true)
        }}
        onSelectUser={() => {
          setSelectionModalOpen(false)
          setCreateUserModalOpen(true)
        }}
      />

      {/* 2. Create Admin Account Modal */}
      <CreateAdminAccountModal
        open={createAdminModalOpen}
        onClose={() => setCreateAdminModalOpen(false)}
        onSaved={(name) => {
          fetchData()
          showFeedback({
            variant: 'success',
            title: 'Admin Account Created',
            description: `Admin account for "${name}" has been created successfully. Credentials have been emailed to the user.`,
          })
        }}
      />

      {/* 3. Create User Account Modal */}
      <CreateUserAccountModal
        open={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSaved={(name) => {
          fetchData()
          showFeedback({
            variant: 'success',
            title: 'User Account Created',
            description: `User account for "${name}" has been created successfully. Credentials have been emailed to the user.`,
          })
        }}
      />

      {/* 4. Edit Account Modal */}
      <EditUserAccountModal
        open={editModalOpen}
        user={editingUserDetail}
        onClose={() => setEditModalOpen(false)}
        onSaved={(name) => {
          fetchData()
          showFeedback({
            variant: 'success',
            title: 'Account Updated',
            description: `Account details for "${name}" have been updated successfully.`,
          })
        }}
      />

      {/* 5. Lock Duration Modal */}
      <LockAccountModal
        open={Boolean(lockingUser)}
        userName={lockingUser?.name || 'User'}
        onClose={() => setLockingUser(null)}
        onConfirmLock={handleConfirmLock}
      />

      {/* Global Confirmation & Feedback Popups */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
