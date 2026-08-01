import { type ComponentType } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCard {
  /** Stable id. */
  id: string
  /** Card title, e.g. "Total Users". */
  label: string
  /** Big value, e.g. 128 or "128". */
  value: string | number
  /** Small helper line under the value. */
  hint?: string
  /** Optional explicit trend direction override ('up' | 'down' | 'neutral') */
  trend?: 'up' | 'down' | 'neutral'
  /** Flag to force enabling or disabling trend styling. */
  showTrend?: boolean
  /** Lucide icon component. */
  icon?: ComponentType<{ size?: number | string; className?: string }>
  /** Accent tone for the icon chip. Defaults to 'indigo'. */
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'sky' | 'violet' | 'cyan'
}

// Quiet semantic emphasis for states, while overall card surfaces stay neutral.
const TONES: Record<NonNullable<StatCard['tone']>, string> = {
  indigo: 'bg-slate-100/80 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100/80 text-slate-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  cyan: 'bg-cyan-50 text-cyan-600',
}

interface StatsCardsProps {
  cards: StatCard[]
  emptyMessage?: string
  className?: string
}

/** Helper to render trend text with green Up arrow or red Down arrow */
function renderTrendHint(
  hint: string,
  explicitTrend?: 'up' | 'down' | 'neutral',
  allowTrend: boolean = false
) {
  const trimmed = hint.trim()
  const isPositive =
    allowTrend &&
    (explicitTrend === 'up' || (trimmed.startsWith('+') && !trimmed.includes('+0.0%')))
  const isNegative =
    allowTrend &&
    (explicitTrend === 'down' || (trimmed.startsWith('-') && !trimmed.includes('-0.0%')))

  if (isPositive) {
    return (
      <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <TrendingUp size={14} className="shrink-0" />
        <span>{hint}</span>
      </p>
    )
  }

  if (isNegative) {
    return (
      <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
        <TrendingDown size={14} className="shrink-0" />
        <span>{hint}</span>
      </p>
    )
  }

  return (
    <p className="mt-2.5 flex items-center gap-1 text-xs font-medium text-slate-400">
      <span>{hint}</span>
    </p>
  )
}

/**
 * Reusable responsive row of summary stat cards.
 * Handles empty stat arrays cleanly with a subtle empty placeholder card.
 */
export function StatsCards({
  cards,
  emptyMessage = 'No summary statistics available.',
  className = '',
}: StatsCardsProps) {
  if (cards.length === 0) {
    return (
      <div className={`rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-2xs ${className}`}>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 mb-2">
          <BarChart3 size={20} />
        </div>
        <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}
    >
      {cards.map((card) => {
        const Icon = card.icon
        // Only allow trend badge styling for Total Users, Total Residents, and Total Officers cards unless explicitly set
        const isTotalCard = /^(total users|total residents|total officers)$/i.test(card.label.trim())
        const allowTrend = card.showTrend ?? isTotalCard

        return (
          <div
            key={card.id}
            className="group flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 leading-none">
                {card.value}
              </p>
              {card.hint && renderTrendHint(card.hint, card.trend, allowTrend)}
            </div>
            {Icon && (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  TONES[card.tone ?? 'indigo']
                }`}
              >
                <Icon size={20} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
