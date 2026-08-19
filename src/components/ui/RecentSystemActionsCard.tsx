import React from 'react'
import { Activity, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'

export interface RecentActionLog {
  id: string | number
  title?: string
  action?: string
  subtitle?: string
  user?: string
  module?: string
  timestamp: string | Date
  badgeText?: string
  badgeTone?: 'emerald' | 'sky' | 'amber' | 'slate' | 'indigo' | 'rose'
}

export interface RecentSystemActionsCardProps {
  title?: string
  actions: RecentActionLog[]
  loading?: boolean
  emptyMessage?: string
  onViewAll?: () => void
  viewAllText?: string
  className?: string
  onItemClick?: (item: RecentActionLog) => void
}

export const RecentSystemActionsCard: React.FC<RecentSystemActionsCardProps> = ({
  title = 'Recent System Actions',
  actions,
  loading = false,
  emptyMessage = 'No recent system actions found.',
  onViewAll,
  viewAllText = 'View All Logs',
  className = '',
  onItemClick,
}) => {
  const formatDateTime = (val: string | Date) => {
    if (!val) return '—'
    const date = typeof val === 'string' ? new Date(val) : val
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatEnumLabel = (str?: string) => {
    if (!str) return '—'
    return str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {viewAllText} <ArrowRight size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium">
          Loading recent actions...
        </div>
      ) : actions.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center italic">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {actions.slice(0, 5).map((log) => {
            const itemTitle = log.title || (log.action ? formatEnumLabel(log.action) : '—')
            const itemSub =
              log.subtitle ||
              (log.user
                ? `By ${log.user}${log.module ? ` in ${formatEnumLabel(log.module)}` : ''}`
                : '')

            return (
              <div
                key={log.id}
                onClick={() => onItemClick && onItemClick(log)}
                className={`py-3 flex items-center justify-between text-sm transition-colors px-2 rounded-lg ${
                  onItemClick ? 'hover:bg-slate-50/80 cursor-pointer group' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate">
                    {itemTitle}
                  </p>
                  {itemSub && <p className="text-xs text-slate-400 mt-0.5 truncate">{itemSub}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {log.badgeText && (
                    <Badge tone={log.badgeTone || 'emerald'}>{log.badgeText}</Badge>
                  )}
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
