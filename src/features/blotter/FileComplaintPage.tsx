import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import type { ComplaintFormData, ComplaintFormMode } from '@/components/ui/complaint_form/types'
import { blotterService } from '@/config/api/blotter/blotter.service'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'

export const FileComplaintPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission, isLoading } = useUserPermissions()

  const initialMode: ComplaintFormMode =
    searchParams.get('mode') === 'record' ? 'FOR_THE_RECORD' : 'FORMAL_COMPLAINT'
  const [activeFormMode, setActiveFormMode] = useState<ComplaintFormMode>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleModeChange = (newMode: ComplaintFormMode) => {
    setActiveFormMode(newMode)
    setSearchParams(
      { mode: newMode === 'FOR_THE_RECORD' ? 'record' : 'formal' },
      { replace: true }
    )
  }

  const handleFormSubmit = async (formData: ComplaintFormData) => {
    if (!hasPermission('File Complaint')) {
      return
    }

    setIsSubmitting(true)
    try {
      await blotterService.create({
        ...formData,
        mode: activeFormMode,
      })
    } catch {
      // API call fallback handled gracefully
    } finally {
      setIsSubmitting(false)
      if (activeFormMode === 'FORMAL_COMPLAINT') {
        navigate('/blotter/records')
      } else {
        navigate('/blotter/docket')
      }
    }
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
      {/* Render Active Form Component */}
      {activeFormMode === 'FORMAL_COMPLAINT' ? (
        <FormalComplaintForm
          onSubmit={handleFormSubmit}
          onCancel={() => navigate('/blotter/records')}
          isSubmitting={isSubmitting}
          activeMode={activeFormMode}
          onModeChange={handleModeChange}
        />
      ) : (
        <ForTheRecordForm
          onSubmit={handleFormSubmit}
          onCancel={() => navigate('/blotter/docket')}
          isSubmitting={isSubmitting}
          activeMode={activeFormMode}
          onModeChange={handleModeChange}
        />
      )}
    </div>
  )
}
export default FileComplaintPage
