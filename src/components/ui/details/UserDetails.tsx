import { Edit3Icon, LockKeyholeIcon, Unlock, ShieldCheckIcon, UserX, RotateCcw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActionButton,
  DetailHeader,
  DetailInfoCard,
  DetailListPanel,
  DetailPermissionPanel,
  DetailPageLayout,
  DetailTabs,
  type DetailTab,
} from './index'
import { Badge } from '@/components/ui/table/Badge'
import { USERS } from '@/data/users'

const STATUS_TONE = {
  Active: 'emerald',
  Inactive: 'amber',
  Locked: 'rose',
} as const

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: ['Manage user accounts', 'Review audit logs', 'Manage system settings'],
  'Desk Officer': ['Create service records', 'Update assigned cases', 'View resident profiles'],
  Viewer: ['View assigned records', 'View published reports'],
}

/** Example detail page that composes the reusable components/ui/details building blocks. */
export function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = USERS.find((item) => item.id === id)

  if (!user) {
    return (
      <DetailPageLayout backLabel="Back to Users" onBack={() => navigate('/')} header={<div />}>
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <h1 className="text-lg font-semibold text-slate-900">User not found</h1>
          <p className="mt-2 text-sm text-slate-500">This account may have been removed or is unavailable.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 cursor-pointer"
          >
            Return to users
          </button>
        </section>
      </DetailPageLayout>
    )
  }

  const permissions = ROLE_PERMISSIONS[user.role] ?? ['General Access']

  const overviewContent = (
    <DetailInfoCard
      title="Account Details"
      columns={2}
      fields={[
        { label: 'Full name', value: user.name },
        { label: 'Email address', value: user.email },
        { label: 'Role', value: user.role },
        { label: 'Account type', value: user.accountType },
        {
          label: 'Department access',
          value: (
            <div className="flex flex-wrap gap-1.5">
              {user.departments.map((department) => (
                <Badge key={department} tone="slate">{department}</Badge>
              ))}
            </div>
          ),
        },
        { label: 'Account status', value: <Badge tone={STATUS_TONE[user.status]} dot>{user.status}</Badge> },
        { label: 'Last login', value: user.lastLogin },
        { label: 'Account ID', value: `USR-${user.id.padStart(4, '0')}` },
        { label: 'Account lock', value: user.status === 'Locked' ? 'Locked' : 'Unlocked' },
        { label: 'Created at', value: 'July 18, 2026' },
      ]}
    />
  )

  const permissionContent = (
    <DetailPermissionPanel role={user.role} permissions={permissions} />
  )

  const activityContent = (
    <DetailListPanel
      title="Recent Activity"
      emptyMessage="No account activity has been recorded yet."
      items={
        user.lastLogin === 'Never'
          ? []
          : [
              {
                id: 'last-login',
                title: 'Signed in to the system',
                description: user.lastLogin,
                trailing: <Badge tone="slate">Login</Badge>,
              },
            ]
      }
    />
  )

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'permissions', label: `Permissions (${permissions.length})`, content: permissionContent },
    { id: 'activity', label: 'Activity', content: activityContent },
  ]

  return (
    <DetailPageLayout
      backLabel="Back to Users Management"
      onBack={() => navigate('/')}
      header={
        <DetailHeader
          name={user.name}
          subtitle={user.email}
          status={<Badge tone={STATUS_TONE[user.status]} dot>{user.status}</Badge>}
          meta={<Badge tone="slate"><ShieldCheckIcon size={13} className="inline mr-1" />{user.role}</Badge>}
          actions={
            <>
              <DetailActionButton
                icon={<Edit3Icon size={17} />}
                onClick={() => navigate('/', { state: { editUserId: user.id } })}
              >
                Edit User
              </DetailActionButton>

              <DetailActionButton
                tone={user.status === 'Locked' ? 'emerald' : 'warning'}
                icon={user.status === 'Locked' ? <Unlock size={17} /> : <LockKeyholeIcon size={17} />}
              >
                {user.status === 'Locked' ? 'Unlock Account' : 'Lock Account'}
              </DetailActionButton>

              <DetailActionButton
                tone={user.status === 'Inactive' ? 'emerald' : 'rose'}
                icon={user.status === 'Inactive' ? <RotateCcw size={17} /> : <UserX size={17} />}
              >
                {user.status === 'Inactive' ? 'Restore Account' : 'Inactivate Account'}
              </DetailActionButton>
            </>
          }
        />
      }
    >
      <DetailTabs tabs={tabs} />
    </DetailPageLayout>
  )
}
