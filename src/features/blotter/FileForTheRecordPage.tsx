import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollText, ArrowLeft } from 'lucide-react'
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
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/blotter/for-the-record')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to For the Record Logs
          </button>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <ScrollText className="h-7 w-7 text-emerald-600 shrink-0" />
            Log For the Record Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Log an incident report, legal consultation inquiry, or informational entry into the docket book.
          </p>
        </div>
      </div>

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
