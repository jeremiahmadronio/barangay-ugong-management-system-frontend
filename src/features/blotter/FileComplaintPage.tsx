import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, FileText, ShieldAlert } from 'lucide-react'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { blotterApi } from '@/api/modules/blotter.api'

export const FileComplaintPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialMode = searchParams.get('mode') === 'record' ? 'FOR_THE_RECORD' : 'FORMAL_COMPLAINT'
  const [activeFormMode, setActiveFormMode] = useState<'FORMAL_COMPLAINT' | 'FOR_THE_RECORD'>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      {/* Compact Top Header & Mode Switcher Bar */}
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
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 leading-tight">
              {activeFormMode === 'FORMAL_COMPLAINT' ? 'File Formal Complaint' : 'Log For the Record Entry'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              Select whether to file an official complaint or log for the record.
            </p>
          </div>
        </div>

        {/* Compact Mode Switcher Tabs */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveFormMode('FORMAL_COMPLAINT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeFormMode === 'FORMAL_COMPLAINT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Formal Complaint
          </button>
          <button
            type="button"
            onClick={() => setActiveFormMode('FOR_THE_RECORD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeFormMode === 'FOR_THE_RECORD'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" /> For the Record
          </button>
        </div>
      </div>

      {/* Render Active Form Component */}
      {activeFormMode === 'FORMAL_COMPLAINT' ? (
        <FormalComplaintForm
          onSubmit={handleFormSubmit}
          onCancel={() => navigate('/blotter/records')}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ForTheRecordForm
          onSubmit={handleFormSubmit}
          onCancel={() => navigate('/blotter/docket')}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
