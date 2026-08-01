import { useEffect, useState, useMemo } from 'react'
import {
  Edit3Icon,
  LockKeyholeIcon,
  Unlock,
  ShieldCheckIcon,
  UserX,
  RotateCcw,
  Clock,
  Search,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import {
  DetailPageLayout,
  DetailHeader,
  DetailInfoCard,
  DetailPermissionPanel,
  DetailTabs,
  DetailActionButton,
  type DetailTab,
} from '@/components/ui/details'
import { userService } from '@/config/api/users/users.service'
import type { UserDetailResponse } from '@/config/api/users/users.types'

import { formatDateTime } from '@/utils/formatters'

interface ActivityItem {
  id: number | string
  actionTaken: string
  module?: string | null
  reason?: string | null
  timestamp?: string | null
  severity?: string | null
}

const formatActionLabel = (action?: string | null): string => {
  if (!action) return 'System Event'
  const actionMap: Record<string, string> = {
    CREATE_BLOTTER_CASE: 'Created Blotter Case',
    LOGIN_SUCCESS: 'Successful Login',
    LOGIN_OTP_SENT: 'OTP Verification Sent',
    UPDATE_USER_ROLES: 'Updated User Roles',
    LOCK_USER_ACCOUNT: 'Account Locked',
    UNLOCK_USER_ACCOUNT: 'Account Unlocked',
    INACTIVATE_USER_ACCOUNT: 'Account Inactivated',
    RESTORE_USER_ACCOUNT: 'Account Restored',
    PASSWORD_RESET: 'Password Reset Requested',
    USER_LOGOUT: 'User Logged Out',
    NEW_ACCOUNT_INITIALIZED: 'New Account Initialized',
  }
  if (actionMap[action]) return actionMap[action]
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function UserActivityTabPanel({ activities }: { activities?: ActivityItem[] }) {
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = useMemo(() => {
    if (!activities) return []
    return activities.filter((act) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim()
        const titleMatch = formatActionLabel(act.actionTaken).toLowerCase().includes(query)
        const rawActionMatch = (act.actionTaken || '').toLowerCase().includes(query)
        const moduleMatch = (act.module || '').toLowerCase().includes(query)
        const reasonMatch = (act.reason || '').toLowerCase().includes(query)
        if (!titleMatch && !rawActionMatch && !moduleMatch && !reasonMatch) {
          return false
        }
      }

      if (act.timestamp) {
        const actDateStr = act.timestamp.substring(0, 10)
        if (fromDate && actDateStr < fromDate) return false
        if (toDate && actDateStr > toDate) return false
      }
      return true
    })
  }, [activities, search, fromDate, toDate])

  const hasActiveFilters = Boolean(search || fromDate || toDate)

  const handleClearFilters = () => {
    setSearch('')
    setFromDate('')
    setToDate('')
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            Account Activity & Audit Logs
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Activity List Container with Max Height & Scrollbar */}
      <div className="max-h-[440px] overflow-y-auto pr-1 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Clock className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No activity logs found</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters ? 'Try adjusting your search or date range filters.' : 'No audit activity recorded for this account yet.'}
            </p>
          </div>
        ) : (
          filtered.map((act) => (
            <div
              key={act.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3.5 transition-colors hover:border-slate-300 hover:shadow-2xs"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {formatActionLabel(act.actionTaken)}
                </p>
                {act.reason && (
                  <p className="text-xs text-slate-600">
                    {act.reason}
                  </p>
                )}
                {act.timestamp && (
                  <p className="text-xs font-medium text-slate-500">
                    {formatDateTime(act.timestamp)}
                  </p>
                )}
              </div>

              <Badge tone={act.severity === 'CRITICAL' ? 'rose' : act.severity === 'WARNING' ? 'amber' : 'slate'}>
                {act.severity || 'INFO'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface UserDetailPageViewProps {
  userId: number
  onBack: () => void
  onEdit: (userDetail: UserDetailResponse) => void
  onLockToggle: (userId: number, isCurrentlyLocked: boolean) => void
  onStatusToggle?: (userId: number, currentStatus: string) => void
  onArchive?: (userId: number) => void
}

export function UserDetailPageView({
  userId,
  onBack,
  onEdit,
  onLockToggle,
  onStatusToggle,
}: UserDetailPageViewProps) {
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchDetail = async () => {
      setIsLoading(true)
      try {
        const data = await userService.getUserDetail(userId)
        if (isMounted) {
          setUserDetail(data)
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [userId])

  if (isLoading) {
    return (
      <DetailPageLayout backLabel="Back to User Management" onBack={onBack} header={<div />}>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading user profile details...</p>
        </div>
      </DetailPageLayout>
    )
  }

  if (!userDetail) {
    return (
      <DetailPageLayout backLabel="Back to User Management" onBack={onBack} header={<div />}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <h2 className="text-lg font-bold text-slate-900">User Profile Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">The requested user account details could not be loaded.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            Return to User Management
          </button>
        </div>
      </DetailPageLayout>
    )
  }

  const isLocked = userDetail.isLocked || userDetail.status === 'LOCKED'
  const isAccountActive = userDetail.status === 'ACTIVE'
  const isInactiveOrArchived = userDetail.status === 'INACTIVE' || userDetail.status === 'ARCHIVED'
  const statusTone = isLocked ? 'rose' : isAccountActive ? 'emerald' : 'amber'
  const accountTypeLabel = userDetail.accountType?.toUpperCase().includes('ADMIN') ? 'Admin' : 'User'

  const userDisplayName = userDetail.personInfo?.fullName || userDetail.username || 'User Account'
  const departmentNames = userDetail.departments?.map((d) => d.name) || []
  const permissionNames = userDetail.customPermissions?.map((p) => p.permissionName || p.module) || []

  // Overview Tab
  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Account & System Details"
        columns={2}
        fields={[
          { label: 'FULL NAME', value: userDisplayName },
          { label: 'SYSTEM EMAIL', value: userDetail.systemEmail || '—' },
          { label: 'ACCOUNT TYPE', value: accountTypeLabel },
          {
            label: 'ACCOUNT STATUS',
            value: (
              <Badge tone={statusTone}>
                {userDetail.status}
              </Badge>
            ),
          },
          {
            label: 'DEPARTMENT ACCESS',
            value: departmentNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {departmentNames.map((d) => (
                  <Badge key={d} tone="slate">
                    {d}
                  </Badge>
                ))}
              </div>
            ) : (
              '—'
            ),
          },
          {
            label: 'LAST LOGIN',
            value: userDetail.lastLoginAt ? formatDateTime(userDetail.lastLoginAt) : 'Never',
          },
          { label: 'ACCOUNT ID', value: `USR-${String(userDetail.id).padStart(4, '0')}` },
          { label: 'SECURITY STATUS', value: isLocked ? 'Locked' : 'Unlocked' },
          {
            label: 'CREATED AT',
            value: formatDateTime(userDetail.createdAt),
          },
        ]}
      />

      {userDetail.personInfo && (
        <DetailInfoCard
          title="Resident Profile Information"
          columns={2}
          fields={[
            { label: 'CONTACT NUMBER', value: userDetail.personInfo.contactNumber || '—' },
            { label: 'CIVIL STATUS', value: userDetail.personInfo.civilStatus || '—' },
            { label: 'GENDER', value: userDetail.personInfo.gender || '—' },
            { label: 'OCCUPATION', value: userDetail.personInfo.occupation || '—' },
            { label: 'COMPLETE ADDRESS', value: userDetail.personInfo.completeAddress || '—' },
          ]}
        />
      )}
    </div>
  )

  // Permissions Tab
  const permissionContent = (
    <DetailPermissionPanel role={accountTypeLabel} permissions={permissionNames} />
  )

  // Activity Tab (Audit Logs with Date Range Filter & Scrollbar)
  const rawActivities = userDetail.recentActivities || []

  const activityContent = (
    <UserActivityTabPanel activities={rawActivities} />
  )

  const isAdminAccount = accountTypeLabel.toUpperCase() === 'ADMIN'

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    ...(!isAdminAccount
      ? [
          {
            id: 'permissions' as const,
            label: `Permissions (${permissionNames.length})`,
            content: permissionContent,
          },
        ]
      : []),
    {
      id: 'activity',
      label: `Activity (${rawActivities.length})`,
      content: activityContent,
    },
  ]

  return (
    <DetailPageLayout
      backLabel="Back to User Management"
      onBack={onBack}
      header={
        <DetailHeader
          name={userDisplayName}
          subtitle={userDetail.systemEmail}
          status={<Badge tone={statusTone}>{userDetail.status}</Badge>}
          meta={
            <Badge tone="slate">
              <ShieldCheckIcon size={13} className="inline mr-1" />
              {accountTypeLabel}
            </Badge>
          }
          actions={
            <>
              <DetailActionButton
                icon={<Edit3Icon size={17} />}
                onClick={() => onEdit(userDetail)}
              >
                Edit User
              </DetailActionButton>

              <DetailActionButton
                tone={isLocked ? 'emerald' : 'warning'}
                icon={isLocked ? <Unlock size={17} /> : <LockKeyholeIcon size={17} />}
                onClick={() => onLockToggle(userDetail.id, Boolean(isLocked))}
              >
                {isLocked ? 'Unlock Account' : 'Lock Account'}
              </DetailActionButton>

              {onStatusToggle && (
                <DetailActionButton
                  tone={isInactiveOrArchived ? 'emerald' : 'blue'}
                  icon={isInactiveOrArchived ? <RotateCcw size={17} /> : <UserX size={17} />}
                  onClick={() => onStatusToggle(userDetail.id, userDetail.status)}
                >
                  {isInactiveOrArchived ? 'Restore Account' : 'Inactivate Account'}
                </DetailActionButton>
              )}
            </>
          }
        />
      }
    >
      <DetailTabs tabs={tabs} />
    </DetailPageLayout>
  )
}
