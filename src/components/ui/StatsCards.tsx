import { type ComponentType } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export type StatBadgeType = 'trend' | 'ratio' | 'progress' | 'text'

export interface StatCard {
  /** Stable id. */
  id: string
  /** Card title / label, e.g. "Total Users" or "Successfully Settled". */
  label: string
  /** Optional title alias */
  title?: string
  /** Big value, e.g. 128 or "128". */
  value: string | number

  /** Explicit badge / subtitle type: 'trend' | 'ratio' | 'progress' | 'text' */
  badgeType?: StatBadgeType

  /** For 'trend': Period-over-period percentage rate (e.g., -57.14 -> formatted to "↓ 57.1% vs last month") */
  trendRate?: number
  /** For 'trend': Comparison label (defaults to "vs last month") */
  comparisonLabel?: string
  /** Optional explicit trend direction override ('up' | 'down' | 'neutral') */
  trendDirection?: 'up' | 'down' | 'neutral'

  /** For 'ratio' | 'progress': Static proportion percentage (e.g., 20.0 -> formatted to "20.0%") */
  ratioRate?: number
  /** For 'ratio' | 'progress': Metric descriptor (e.g., "settlement rate") */
  ratioLabel?: string
  /** For 'ratio' | 'progress': Additional count details (e.g., "(1 of 5)") */
  ratioDetails?: string

  /** Text subtitle or legacy hint string */
  hint?: string
  /** Subtitle alias */
  subtitle?: string

  /** Legacy trend direction */
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
  emerald: 'bg-slate-100/80 text-slate-600',
  amber: 'bg-slate-100/80 text-slate-600',
  rose: 'bg-slate-100/80 text-slate-600',
  slate: 'bg-slate-100/80 text-slate-600',
  sky: 'bg-slate-100/80 text-slate-600',
  violet: 'bg-slate-100/80 text-slate-600',
  cyan: 'bg-slate-100/80 text-slate-600',
}

interface StatsCardsProps {
  cards: StatCard[]
  emptyMessage?: string
  className?: string
}

/** Formats decimal values to a maximum of 1 decimal place cleanly */
function formatNumber(val: number, maxDecimals: number = 1): string {
  const rounded = Number(val.toFixed(maxDecimals))
  return rounded.toFixed(1)
}

/** Renders clean badge / subtitle based on badgeType and props */
function renderMetricSubtitle(card: StatCard) {
  const cardTitle = card.label || card.title || ''
  const isTotalCard = /^(total users|total residents|total officers|total cases|recorded cases)$/i.test(cardTitle.trim())
  const rawSub = card.hint || card.subtitle || ''

  // 1. Explicit 'trend' or Trend by rate prop
  if (card.badgeType === 'trend' || card.trendRate !== undefined) {
    const rate = card.trendRate ?? 0
    const compLabel = card.comparisonLabel || 'vs last month'
    const absRateStr = formatNumber(Math.abs(rate))

    if (rate > 0 || card.trendDirection === 'up' || card.trend === 'up') {
      return (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
          <TrendingUp size={13} className="shrink-0 text-emerald-600" />
          <span>+{absRateStr}% {compLabel}</span>
        </div>
      )
    }

    if (rate < 0 || card.trendDirection === 'down' || card.trend === 'down') {
      return (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
          <TrendingDown size={13} className="shrink-0 text-rose-600" />
          <span>-{absRateStr}% {compLabel}</span>
        </div>
      )
    }

    return (
      <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/60">
        <span>0.0% {compLabel}</span>
      </div>
    )
  }

  // 2. Explicit 'ratio' or 'progress'
  if (card.badgeType === 'ratio' || card.badgeType === 'progress' || card.ratioRate !== undefined) {
    const rateStr = card.ratioRate !== undefined ? `${formatNumber(card.ratioRate)}% ` : ''
    const label = card.ratioLabel || ''
    const details = card.ratioDetails ? ` ${card.ratioDetails}` : ''

    return (
      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
        <span>{rateStr}{label}{details}</span>
      </div>
    )
  }

  // 3. Fallback: Parse string hint / subtitle
  if (!rawSub) return null

  const trimmed = rawSub.trim()
  const allowTrend = card.showTrend ?? isTotalCard

  // Handle proportion/rate strings (e.g. "+20.00% settlement rate")
  if (/settlement rate|success rate|issuance rate/i.test(trimmed)) {
    const cleaned = trimmed
      .replace(/^[+↗↖↘↙↑↓\s]+/, '') // Strip redundant arrows / pluses
      .replace(/(\d+\.\d{2,})%/, (_, n) => `${formatNumber(parseFloat(n))}%`) // Format max 1 decimal

    return (
      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
        <span>{cleaned}</span>
      </div>
    )
  }

  // Handle strings with trend pattern (e.g., "-57.1% vs last month", "↘ -57.1% vs last month", "+12.5% vs last month")
  if (allowTrend || /vs last month|vs previous/i.test(trimmed)) {
    // Extract rate number
    const numMatch = trimmed.match(/([+-]?\s*[\d.]+)\s*%/i)
    const compMatch = trimmed.match(/vs\s+[a-zA-Z\s]+/i)
    const compStr = compMatch ? compMatch[0] : 'vs last month'

    if (numMatch) {
      const num = parseFloat(numMatch[1].replace(/\s+/g, ''))
      const isNeg = num < 0 || trimmed.startsWith('-') || trimmed.includes('↘') || trimmed.includes('↓')
      const isPos = (num > 0 || trimmed.startsWith('+') || trimmed.includes('↗') || trimmed.includes('↑')) && !isNeg

      if (isPos && num > 0) {
        return (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
            <TrendingUp size={13} className="shrink-0 text-emerald-600" />
            <span>+{formatNumber(Math.abs(num))}% {compStr}</span>
          </div>
        )
      }

      if (isNeg && num !== 0) {
        return (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
            <TrendingDown size={13} className="shrink-0 text-rose-600" />
            <span>-{formatNumber(Math.abs(num))}% {compStr}</span>
          </div>
        )
      }

      return (
        <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/60">
          <span>0.0% {compStr}</span>
        </div>
      )
    }
  }

  // Static text indicator
  return (
    <p className="mt-2.5 flex items-center gap-1 text-xs font-medium text-slate-500">
      <span>{trimmed}</span>
    </p>
  )
}

export interface StatsCardsProps {
  cards?: StatCard[]
  stats?: StatCard[]
  loading?: boolean
  emptyMessage?: string
  className?: string
}

/**
 * Reusable responsive row of summary stat cards.
 * Handles empty stat arrays cleanly with a subtle empty placeholder card.
 */
export function StatsCards({
  cards,
  stats,
  loading = false,
  emptyMessage = 'No summary statistics available.',
  className = '',
}: StatsCardsProps) {
  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs animate-pulse"
          >
            <div className="space-y-2.5 w-full pr-4">
              <div className="h-3.5 w-24 bg-slate-200/80 rounded-md" />
              <div className="h-7 w-20 bg-slate-200/80 rounded-lg" />
              <div className="h-3 w-32 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  const list = cards || stats || []

  if (list.length === 0) {
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
      {list.map((card) => {
        const Icon = card.icon
        const cardTitle = card.label || card.title || ''

        return (
          <div
            key={card.id}
            className="group flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{cardTitle}</p>
              <p
                className={`mt-1 font-bold tracking-tight text-slate-900 leading-tight ${
                  String(card.value).length > 20
                    ? 'text-sm font-semibold line-clamp-2'
                    : String(card.value).length > 12
                    ? 'text-lg font-bold'
                    : 'text-2xl font-bold'
                }`}
                title={String(card.value)}
              >
                {card.value}
              </p>
              {renderMetricSubtitle(card)}
            </div>
            {Icon && (
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  TONES[card.tone ?? 'indigo']
                }`}
              >
                <Icon size={18} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

