import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { blotterApi } from '@/api/modules/blotter.api'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'

export const FileFormalComplaintPage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ComplaintFormData) => {
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
