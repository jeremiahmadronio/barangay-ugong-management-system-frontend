import React from 'react'
import { Clock, CalendarPlus, CheckCircle2 } from 'lucide-react'

export interface DetailMediationBannerProps {
  title?: string
  daysRemaining?: number
  totalDays?: number
  filedDate?: string
  deadlineDate?: string
  isExtended?: boolean
  canExtend?: boolean
  onExtend?: () => void
}

export function DetailMediationBanner({
  title = '15-Day Mediation Period',
  daysRemaining = 12,
  totalDays = 15,
  filedDate = 'Jul 30, 2026',
  deadlineDate = 'Aug 14, 2026',
  isExtended = false,
  canExtend = false,
  onExtend,
}: DetailMediationBannerProps) {
  const percentUsed = Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">{title}</span>
          {isExtended && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} className="text-emerald-600" />
              +15-Day Extension Applied
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${daysRemaining <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
          </span>

          {canExtend && onExtend && (
            <button
              type="button"
              onClick={onExtend}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <CalendarPlus size={13} />
              Extend 15 Days
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            daysRemaining <= 3 ? 'bg-amber-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Filed: {filedDate}</span>
        <span>Deadline: {deadlineDate}</span>
      </div>
    </div>
  )
}
