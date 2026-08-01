import { useState } from 'react'
import { ForTheRecordForm } from './ForTheRecordForm'
import { FormalComplaintForm } from './FormalComplaintForm'
import type { ComplaintFormData, ComplaintFormMode } from './types'

interface ComplaintFormProps {
  initialData?: Partial<ComplaintFormData>
  mode?: ComplaintFormMode
  onSubmit?: (data: ComplaintFormData) => void
  onCancel?: () => void
  isSubmitting?: boolean
  className?: string
  showModeSelector?: boolean
}

export function ComplaintForm({
  initialData,
  mode = 'FORMAL_COMPLAINT',
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = '',
  showModeSelector = true,
}: ComplaintFormProps) {
  const [currentMode, setCurrentMode] = useState<ComplaintFormMode>(
    initialData?.mode || mode
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Optional Mode Selector Banner */}
      {showModeSelector && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setCurrentMode('FOR_THE_RECORD')}
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
              currentMode === 'FOR_THE_RECORD'
                ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="complaint_master_mode"
              checked={currentMode === 'FOR_THE_RECORD'}
              onChange={() => {}}
              className="w-4 h-4 text-blue-600 mt-1 cursor-pointer shrink-0"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                For the Record Only
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Walk-in consultation or blotter entry without formal complaint yet. (Para sa rekord lang)
              </p>
            </div>
          </label>

          <label
            onClick={() => setCurrentMode('FORMAL_COMPLAINT')}
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
              currentMode === 'FORMAL_COMPLAINT'
                ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="complaint_master_mode"
              checked={currentMode === 'FORMAL_COMPLAINT'}
              onChange={() => {}}
              className="w-4 h-4 text-blue-600 mt-1 cursor-pointer shrink-0"
            />
            <div>
              <p className="text-xs font-bold text-blue-600 leading-tight">
                Formal Complaint
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Formal complaint requiring barangay intervention. May involve mediation or legal action.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Render Dedicated Specialized Component */}
      {currentMode === 'FOR_THE_RECORD' ? (
        <ForTheRecordForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      ) : (
        <FormalComplaintForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
