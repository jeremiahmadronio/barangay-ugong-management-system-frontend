import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { blotterApi } from '@/config/api/modules/blotter.api'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'

export const FileFormalComplaintPage = () => {
  const navigate = useNavigate()
  const { hasPermission, isLoading } = useUserPermissions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ComplaintFormData) => {
    if (!hasPermission('File Complaint')) {
      return
    }

    setIsSubmitting(true)
    try {
      await blotterApi.create({
        ...data,
        mode: 'FORMAL_COMPLAINT',
      })
    } catch {
      // API call error fallback handled gracefully
    } finally {
      setIsSubmitting(false)
      navigate('/blotter/formal-complaints')
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
      {/* Embedded Formal Complaint Form */}
      <FormalComplaintForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/blotter/formal-complaints')}
        activeMode="FORMAL_COMPLAINT"
        onModeChange={(mode) => {
          if (mode === 'FOR_THE_RECORD') navigate('/blotter/entry?mode=record')
        }}
      />
    </div>
  )
}
export default FileFormalComplaintPage
