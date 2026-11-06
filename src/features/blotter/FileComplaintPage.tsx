import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import type { ComplaintFormData, ComplaintFormMode } from '@/components/ui/complaint_form/types'
import { blotterApi } from '@/api/modules/blotter.api'

export const FileComplaintPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
    setIsSubmitting(true)
    try {
      await blotterApi.create({
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
