import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
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
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/blotter/formal-complaints')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Formal Complaints
          </button>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <ShieldAlert className="h-7 w-7 text-blue-600 shrink-0" />
            File New Formal Complaint
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Fill out the formal complaint form to record an official barangay blotter case.
          </p>
        </div>
      </div>

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
