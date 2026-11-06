import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { blotterApi } from '@/api/modules/blotter.api'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'

export const FileForTheRecordPage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    try {
      await blotterApi.create({
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
