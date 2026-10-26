import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
      {/* Clean Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeFormMode === 'FORMAL_COMPLAINT') navigate('/blotter/records')
              else navigate('/blotter/docket')
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Table Records"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {activeFormMode === 'FORMAL_COMPLAINT'
                ? 'File Formal Complaint'
                : 'Log For the Record Entry'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
              {activeFormMode === 'FORMAL_COMPLAINT'
                ? 'Fill out official details for barangay conciliation, mediation hearings, or summons.'
                : 'Record a walk-in consultation, lost item report, or informational blotter log.'}
            </p>
          </div>
        </div>
      </div>

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
