import { Clock } from 'lucide-react'

export interface DetailMediationBannerProps {
  title?: string
  daysRemaining?: number
  totalDays?: number
  filedDate?: string
  deadlineDate?: string
}

export function DetailMediationBanner({
  title = '15-Day Mediation Period',
  daysRemaining = 12,
  totalDays = 15,
  filedDate = 'Jul 30, 2026',
  deadlineDate = 'Aug 14, 2026',
}: DetailMediationBannerProps) {
  const percentUsed = Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">{title}</span>
        </div>
        <span className="text-xs font-semibold text-blue-600">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
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
