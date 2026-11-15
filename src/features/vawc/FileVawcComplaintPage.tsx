import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VawcComplaintForm } from '@/components/ui/complaint_form/VawcComplaintForm'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'

export const FileVawcComplaintPage = () => {
  const navigate = useNavigate()
  const { hasPermission, isLoading } = useUserPermissions()
  const { showFeedback, feedbackDialogProps } = useDialogs()
  const [formKey, setFormKey] = useState(0)

  const handleSuccess = (response: any) => {
    const caseNo = response?.caseNumber || 'New Case'
    const compName = response?.complainant?.fullName || 'Complainant'
    const respName = response?.respondent?.fullName || 'Respondent'

    showFeedback({
      variant: 'success',
      title: 'VAWC Complaint Filed Successfully!',
      description: `Case #${caseNo} (${compName} vs ${respName}) has been officially registered in the VAWC desk records.`,
      actionLabel: 'Done',
    })
  }

  const handleError = (errorMessage: string) => {
    showFeedback({
      variant: 'error',
      title: 'Filing VAWC Complaint Failed',
      description: errorMessage || 'An error occurred while attempting to record the VAWC complaint. Please review required fields and try again.',
      actionLabel: 'Dismiss',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!hasPermission('File Complaint')) {
    return <PermissionDeniedPage />
  }

  return (
    <div className="space-y-4 select-none w-full pb-8">
      {/* Embedded VAWC Complaint Form */}
      <VawcComplaintForm
        key={formKey}
        onSubmitSuccess={handleSuccess}
        onSubmitError={handleError}
        onCancel={() => navigate('/vawc')}
      />

      {/* Result Feedback Dialog Modal */}
      <FeedbackDialog
        {...feedbackDialogProps}
        onClose={() => {
          const isSuccess = feedbackDialogProps.variant === 'success'
          feedbackDialogProps.onClose()
          if (isSuccess) {
            setFormKey((prev) => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
      />
    </div>
  )
}
export default FileVawcComplaintPage
