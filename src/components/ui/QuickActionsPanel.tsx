import React, { type ComponentType } from 'react'
import { ArrowRight } from 'lucide-react'

export interface QuickActionItem {
  id: string
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string; size?: number | string }>
  onClick: () => void
}

export interface QuickActionsPanelProps {
  title?: string
  actions: QuickActionItem[]
  className?: string
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  title = 'Quick Actions',
  actions,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3.5 ${className}`}>
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {action.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
