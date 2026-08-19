import React, { type ComponentType } from 'react'
import { Calendar, AlertCircle, Edit3, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

export interface QuickActionCardItem {
  id: string
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string; size?: number | string }>
  onClick?: () => void
  disabled?: boolean
}

export interface DetailQuickActionCardsProps {
  actions?: QuickActionCardItem[]
  onScheduleMediation?: () => void
  onEscalateLupon?: () => void
  onEditCase?: () => void
  onMarkSettled?: () => void
  onDismissCase?: () => void
  onReopenCase?: () => void
  isEscalateDisabled?: boolean
  className?: string
}

export function DetailQuickActionCards({
  actions,
  onScheduleMediation,
  onEscalateLupon,
  onEditCase,
  onMarkSettled,
  onDismissCase,
  onReopenCase,
  isEscalateDisabled = false,
  className = '',
}: DetailQuickActionCardsProps) {
  // All Blotter buttons using the exact PLAIN HORIZONTAL design
  const items: QuickActionCardItem[] = actions ?? [
    ...(onScheduleMediation ? [{
      id: 'schedule-mediation',
      title: 'Schedule Mediation',
      subtitle: 'Set mediation date',
      icon: Calendar,
      onClick: onScheduleMediation,
    }] : []),
    ...(onEscalateLupon ? [{
      id: 'escalate-lupon',
      title: 'Escalate to Lupon',
      subtitle: '0/3 complete sessions or ≤ 3 days remain',
      icon: AlertCircle,
      onClick: onEscalateLupon,
      disabled: isEscalateDisabled,
    }] : []),
    ...(onEditCase ? [{
      id: 'edit-case',
      title: 'Edit Case',
      subtitle: 'Update details',
      icon: Edit3,
      onClick: onEditCase,
    }] : []),
    ...(onMarkSettled ? [{
      id: 'mark-settled',
      title: 'Mark as Settled',
      subtitle: 'Record settlement agreement',
      icon: CheckCircle2,
      onClick: onMarkSettled,
    }] : []),
    ...(onDismissCase ? [{
      id: 'dismiss-case',
      title: 'Dismiss Case',
      subtitle: 'Complainant withdrew',
      icon: XCircle,
      onClick: onDismissCase,
    }] : []),
    ...(onReopenCase ? [{
      id: 'reopen-case',
      title: 'Re-open Case',
      subtitle: 'Create new case cycle',
      icon: RotateCcw,
      onClick: onReopenCase,
    }] : []),
  ]

  if (items.length === 0) return null

  return (
    <div className={`space-y-2.5 ${className}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Quick Actions
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {items.map((item) => {
          const Icon = item.icon
          const isDisabled = item.disabled
          return (
            <button
              key={item.id}
              type="button"
              disabled={isDisabled}
              onClick={item.onClick}
              className={`flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-white transition-all text-left active:scale-[0.99] ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-slate-50/50'
                  : 'hover:bg-slate-50/80 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {item.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
