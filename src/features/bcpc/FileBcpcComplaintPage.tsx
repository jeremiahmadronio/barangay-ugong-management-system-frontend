import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BcpcComplaintForm } from '@/components/ui/complaint_form/BcpcComplaintForm'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'

export const FileBcpcComplaintPage = () => {
  const navigate = useNavigate()
  const { showFeedback, feedbackDialogProps } = useDialogs()
  const [formKey, setFormKey] = useState(0)

  const handleSuccess = (response: any) => {
    const caseNo = response?.caseNumber || 'New BCPC Case'
    const childName = response?.child?.fullName || 'Child'
    const classification = response?.ciclAssessment ? 'CICL' : 'CAR'

    showFeedback({
      variant: 'success',
      title: 'BCPC Case Filed Successfully!',
      description: `Case #${caseNo} (${classification} - ${childName}) has been officially registered in the BCPC desk records.`,
      actionLabel: 'Done',
    })
  }

  const handleError = (errorMessage: string) => {
    let cleanMessage = errorMessage
    if (
      cleanMessage &&
      (cleanMessage.includes('JSON parse error') ||
        cleanMessage.includes('Cannot deserialize') ||
        cleanMessage.includes('SpecificCarAct') ||
        cleanMessage.includes('HttpMessageNotReadableException'))
    ) {
      cleanMessage = 'Invalid incident category or specific act selected. Please review your incident selection and submit again.'
    }

    showFeedback({
      variant: 'error',
      title: 'Filing BCPC Case Failed',
      description:
        cleanMessage ||
        'An error occurred while attempting to record the BCPC case. Please check required fields and try again.',
      actionLabel: 'Dismiss',
    })
  }

  return (
    <div className="space-y-4 select-none w-full pb-8">
      {/* Embedded BCPC Complaint Form */}
      <BcpcComplaintForm
        key={formKey}
        onSubmitSuccess={handleSuccess}
        onSubmitError={handleError}
        onCancel={() => navigate('/bcpc')}
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
            navigate('/bcpc')
          }
        }}
      />
    </div>
  )
}

export default FileBcpcComplaintPage
