import type { ComplaintFormMode } from './types'

interface NatureOfEntrySectionProps {
  activeMode: ComplaintFormMode
  onModeChange?: (mode: ComplaintFormMode) => void
  className?: string
}

export function NatureOfEntrySection({
  activeMode,
  onModeChange,
  className = '',
}: NatureOfEntrySectionProps) {
  return (
    <div className={`space-y-2 pt-3 border-t border-slate-200/90 ${className}`}>
      <div>
        <label className="block text-xs font-semibold text-slate-800">
          Nature of Entry <span className="text-red-500">*</span>
        </label>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Determines whether this docket proceeds to formal mediation or remains an informational walk-in log.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        {/* Option 1: For the Record Only */}
        <label
          onClick={() => onModeChange?.('FOR_THE_RECORD')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
            activeMode === 'FOR_THE_RECORD'
              ? 'border-blue-600 bg-blue-50/30'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <input
            type="radio"
            name="natureOfEntry"
            value="FOR_THE_RECORD"
            checked={activeMode === 'FOR_THE_RECORD'}
            onChange={() => onModeChange?.('FOR_THE_RECORD')}
            className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 block leading-tight">
              For the Record Only
            </span>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Walk-in consultation, lost item, document loss, or blotter entry without a formal complaint.
            </p>
          </div>
        </label>

        {/* Option 2: Formal Complaint */}
        <label
          onClick={() => onModeChange?.('FORMAL_COMPLAINT')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
            activeMode === 'FORMAL_COMPLAINT'
              ? 'border-blue-600 bg-blue-50/30'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <input
            type="radio"
            name="natureOfEntry"
            value="FORMAL_COMPLAINT"
            checked={activeMode === 'FORMAL_COMPLAINT'}
            onChange={() => onModeChange?.('FORMAL_COMPLAINT')}
            className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 block leading-tight">
              Formal Complaint
            </span>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Requires local government intervention — summons, mediation hearings, or conciliation action.
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
