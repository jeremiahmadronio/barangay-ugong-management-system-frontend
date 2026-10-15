import { useEffect, useState } from 'react'
import { X, Edit3Icon, LockKeyholeIcon, Unlock, UserX, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import {
  DetailHeader,
  DetailInfoCard,
  DetailPermissionPanel,
  DetailListPanel,
  DetailTabs,
  DetailActionButton,
  type DetailTab,
} from '@/components/ui/details'
import { userService } from '@/config/api/users/users.service'
import type { UserDetailResponse } from '@/config/api/users/users.types'
import { maskEmail } from '@/utils/formatters'

interface UserDetailDrawerProps {
  open: boolean
  userId: number | null
  onClose: () => void
  onEdit: (userDetail: UserDetailResponse) => void
  onLockToggle: (userId: number, isCurrentlyLocked: boolean) => void
  onStatusToggle?: (userId: number, currentStatus: string) => void
}

export function UserDetailDrawer({
  open,
  userId,
  onClose,
  onEdit,
  onLockToggle,
  onStatusToggle,
}: UserDetailDrawerProps) {
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !userId) {
      setUserDetail(null)
      return
    }
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
  }, [open, userId])

  if (!open) return null

  const isLocked = userDetail?.isLocked || userDetail?.status === 'LOCKED'
  const isAccountActive = userDetail?.status === 'ACTIVE'
  const isInactiveOrArchived = userDetail?.status === 'INACTIVE' || userDetail?.status === 'ARCHIVED'
  const statusTone = isLocked ? 'rose' : isAccountActive ? 'emerald' : 'amber'
  const accountTypeLabel = userDetail?.accountType?.toUpperCase().includes('ADMIN') ? 'Admin' : 'User'

  // Extract department names
  const departmentNames = userDetail?.departments?.map((d) => d.name) || []

  // Extract permissions list
  const permissionNames =
    userDetail?.customPermissions?.map((p) => p.permissionName || p.module) || []

  // Overview Tab Content
  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Account & Identity Overview"
        columns={2}
        fields={[
          {
            label: 'Full name',
            value: userDetail?.personInfo?.fullName || userDetail?.username || '—',
          },
          { label: 'System email', value: maskEmail(userDetail?.systemEmail) },
          { label: 'Account type', value: accountTypeLabel },
          {
            label: 'Department access',
            value: departmentNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {departmentNames.map((dept) => (
                  <Badge key={dept} tone="slate">
                    {dept}
                  </Badge>
                ))}
              </div>
            ) : (
              '—'
            ),
          },
          {
            label: 'Last login',
            value: userDetail?.lastLoginAt ? new Date(userDetail.lastLoginAt).toLocaleString() : 'Never',
          },
          { label: 'Account ID', value: userDetail ? `USR-${String(userDetail.id).padStart(4, '0')}` : '—' },
          {
            label: 'Account security',
            value: isLocked ? 'Locked (Access restricted)' : 'Unlocked (Normal access)',
          },
          {
            label: 'Created at',
            value: userDetail?.createdAt ? new Date(userDetail.createdAt).toLocaleDateString() : '—',
          },
        ]}
      />

      {userDetail?.personInfo && (
        <DetailInfoCard
          title="Resident Personal Details"
          columns={2}
          fields={[
            { label: 'Contact number', value: userDetail.personInfo.contactNumber || '—' },
            { label: 'Civil status', value: userDetail.personInfo.civilStatus || '—' },
            { label: 'Gender', value: userDetail.personInfo.gender || '—' },
            { label: 'Occupation', value: userDetail.personInfo.occupation || '—' },
            { label: 'Complete address', value: userDetail.personInfo.completeAddress || '—' },
          ]}
        />
      )}
    </div>
  )

  // Permissions Tab Content
  const permissionContent = (
    <DetailPermissionPanel role={accountTypeLabel} permissions={permissionNames} />
  )

  // Activity Tab Content (Audit Logs)
  const activityItems =
    userDetail?.recentActivities?.map((act) => ({
      id: String(act.id),
      title: act.actionTaken,
      description: `${act.module ? `Module: ${act.module} • ` : ''}${act.reason ? `Reason: ${act.reason} • ` : ''}${
        act.timestamp ? new Date(act.timestamp).toLocaleString() : ''
      }`,
      trailing: (
        <Badge tone={act.severity === 'CRITICAL' ? 'rose' : act.severity === 'WARNING' ? 'amber' : 'slate'}>
          {act.severity || 'INFO'}
        </Badge>
      ),
    })) || []

  const activityContent = (
    <DetailListPanel
      title="User Activity & System Audit Logs"
      emptyMessage="No audit activity logs recorded for this account yet."
      items={activityItems}
    />
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
      label: `Activity (${activityItems.length})`,
      content: activityContent,
    },
  ]

  const userDisplayName = userDetail?.personInfo?.fullName || userDetail?.username || 'User Profile'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-3xl border-l border-slate-200 bg-white shadow-2xl flex flex-col">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{userDisplayName}</h2>
                <p className="text-xs text-slate-500">{maskEmail(userDetail?.systemEmail)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-6 animate-pulse select-none">
                {/* Header Profile Skeleton */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-200 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-3.5 w-48 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-slate-100 rounded-full" />
                </div>

                {/* Tabs Bar Skeleton */}
                <div className="flex border-b border-slate-200 gap-4">
                  <div className="relative pb-3">
                    <div className="h-4 w-20 bg-blue-200 rounded" />
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500" />
                  </div>
                  <div className="pb-3">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="pb-3">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </div>
                </div>

                {/* Info Card Skeleton */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : !userDetail ? (
              <div className="py-20 text-center text-slate-500">
                <p className="text-sm">Unable to load user details.</p>
              </div>
            ) : (
              <>
                {/* Reusable Detail Header with Edit & Lock Actions */}
                <DetailHeader
                  name={userDisplayName}
                  subtitle={maskEmail(userDetail.systemEmail)}
                  status={<Badge tone={statusTone} dot>{userDetail.status}</Badge>}
                  actions={
                    <>
                      <DetailActionButton
                        icon={<Edit3Icon size={17} />}
                        onClick={() => {
                          onEdit(userDetail)
                        }}
                      >
                        Edit Account
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

                {/* Tabs */}
                <DetailTabs tabs={tabs} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
