import { ClearanceForm } from './ClearanceForm'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'

export const ClearanceIssuePage = () => {
  const { hasPermission, isLoading } = useUserPermissions()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!hasPermission('Issue Clearance')) {
    return (
      <PermissionDeniedPage
        title="You don't have permission to issue clearances!"
        message="The owner of the workspace has not given you permission to issue barangay clearances or certifications. Please contact the administrator."
      />
    )
  }

  return <ClearanceForm />
}
