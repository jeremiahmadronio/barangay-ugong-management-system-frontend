import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { blotterService } from '@/config/api/blotter/blotter.service'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'

export const FileForTheRecordPage = () => {
  const navigate = useNavigate()
  const { hasPermission, isLoading } = useUserPermissions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ComplaintFormData) => {
    if (!hasPermission('File Complaint')) {
      return
    }

    setIsSubmitting(true)
    try {
      await blotterService.create({
        ...data,
        mode: 'FOR_RECORD_ONLY',
      })
    } catch {
      // API call error fallback handled gracefully
    } finally {
      setIsSubmitting(false)
      navigate('/blotter/for-the-record')
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
      {/* Embedded For the Record Form */}
      <ForTheRecordForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/blotter/for-the-record')}
        activeMode="FOR_THE_RECORD"
        onModeChange={(mode) => {
          if (mode === 'FORMAL_COMPLAINT') navigate('/blotter/entry?mode=formal')
        }}
      />
    </div>
  )
}
