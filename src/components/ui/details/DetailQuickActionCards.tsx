import { Calendar, AlertCircle, Edit3, XCircle } from 'lucide-react'

export interface DetailQuickActionCardsProps {
  onScheduleMediation?: () => void
  onEscalateLupon?: () => void
  onEditCase?: () => void
  onDismissCase?: () => void
  isEscalateDisabled?: boolean
}

export function DetailQuickActionCards({
  onScheduleMediation,
  onEscalateLupon,
  onEditCase,
  onDismissCase,
  isEscalateDisabled = true,
}: DetailQuickActionCardsProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Quick Actions
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Schedule Mediation */}
        <button
          type="button"
          onClick={onScheduleMediation}
          className="flex flex-col text-left justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                Schedule Mediation
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Set mediation date</p>
            </div>
          </div>
        </button>

        {/* 2. Escalate to Lupon */}
        <button
          type="button"
          disabled={isEscalateDisabled}
          onClick={onEscalateLupon}
          className={`flex flex-col text-left justify-between p-4 rounded-2xl border transition-all ${
            isEscalateDisabled
              ? 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
              : 'border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-2xs cursor-pointer group'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-600">Escalate to Lupon</p>
              <p className="text-xs text-slate-400 mt-0.5">
                0/3 complete sessions or ≤ 3 days remain
              </p>
            </div>
          </div>
        </button>

        {/* 3. Edit Case */}
        <button
          type="button"
          onClick={onEditCase}
          className="flex flex-col text-left justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-600 group-hover:text-amber-700">
                Edit Case
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Update details</p>
            </div>
          </div>
        </button>

        {/* 4. Dismiss Case */}
        <button
          type="button"
          onClick={onDismissCase}
          className="flex flex-col text-left justify-between p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-600 group-hover:text-rose-700">
                Dismiss Case
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Complainant withdrew</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
