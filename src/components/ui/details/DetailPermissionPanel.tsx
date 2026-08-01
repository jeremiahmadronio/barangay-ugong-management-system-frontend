import { Badge } from '@/components/ui/table/Badge'
import { DetailListPanel } from './DetailListPanel'

interface DetailPermissionPanelProps {
  role: string
  permissions: string[]
  title?: string
  emptyMessage?: string
}

/**
 * Dedicated permission list panel component.
 * Can be reused directly across any detail page or role management screen.
 */
export function DetailPermissionPanel({
  role,
  permissions,
  title = 'Assigned Permissions',
  emptyMessage = 'No specific permissions are assigned to this account.',
}: DetailPermissionPanelProps) {
  return (
    <DetailListPanel
      title={title}
      emptyMessage={emptyMessage}
      items={permissions.map((permission) => ({
        id: permission,
        title: permission,
        description: `Granted through the ${role} role.`,
        trailing: <Badge tone="indigo">Access</Badge>,
      }))}
    />
  )
}
