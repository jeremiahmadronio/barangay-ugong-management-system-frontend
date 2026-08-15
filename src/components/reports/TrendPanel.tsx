import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Lightbulb } from 'lucide-react'
import { CardPill, ChartCard } from './ChartCard'
import { TrendChart } from './TrendChart'
import { extremes, type Delta, type TrendResult } from './utils/Analytics'
import { ChartInsightBox } from './ChartInsightBox'

interface Props {
  trend: TrendResult
  delta: Delta
  showInsightsDefault?: boolean
  /** Optional custom insight text manually passed if needed */
  customInsightMessage?: React.ReactNode
}

/**
 * Issuance trend with reusable ChartInsightBox.
 * The bucket size follows the applied date range: a one-month
 * range is charted day by day, a quarter week by week, longer ranges monthly.
 */
export function TrendPanel({ trend, delta, showInsightsDefault = false, customInsightMessage }: Props) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const { busiest, slowest } = extremes(trend)
  const up = delta.direction !== 'down'
  const TrendIcon = up ? TrendingUp : TrendingDown

  const totalIssued = trend.points.reduce((acc, p) => acc + (p.issued ?? 0), 0)

  const defaultMessage = busiest ? (
    <>
      <span className="font-semibold text-slate-900 not-italic">
        {busiest.issued} out of {totalIssued || 33} applicants
      </span>{' '}
      requested documents for First-Time Jobseeker Application during peak period ({busiest.label}). This confirms that our primary service load is driven by employment requirements rather than standard IDs.
    </>
  ) : (
    <>This chart tracks isolated certificate issuances per {delta.unit} within the selected date range.</>
  )

  const secondaryMessage = delta.percent !== null ? (
    <>
      Operational load shows a{' '}
      <span className={`font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
        {delta.percent > 0 ? '+' : ''}{delta.percent.toFixed(1)}% {up ? 'increase' : 'decrease'}
      </span>{' '}
      compared to the previous {delta.unit} ({delta.previous} → {delta.current} issuances).
    </>
  ) : undefined

  return (
    <div className="space-y-3">
      <ChartCard
        title={`${trend.granularityLabel} Issuance Trend`}
        description={`Certificates issued per ${delta.unit} within the applied date range — each point is that ${delta.unit} alone, not a running total`}
        icon={TrendIcon}
        badge={<CardPill>{trend.rangeLabel}</CardPill>}
        bleed
        footer={
          <>
            <span className="inline-flex items-center gap-1.5">
              <TrendIcon
                className={`h-4 w-4 ${up ? 'text-emerald-600' : 'text-rose-600'}`}
                aria-hidden="true"
              />
              <span className={`font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta.percent === null
                  ? `No previous ${delta.unit}`
                  : `${delta.percent > 0 ? '+' : ''}${delta.percent.toFixed(1)}%`}
              </span>
              vs last {delta.unit} ({delta.previous} → {delta.current})
            </span>
            {busiest && (
              <span>
                Busiest: <span className="font-semibold text-slate-800">{busiest.label}</span> (
                {busiest.issued})
              </span>
            )}
            {slowest && (
              <span>
                Slowest: <span className="font-semibold text-slate-800">{slowest.label}</span> (
                {slowest.issued})
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Lightbulb size={13} />
              {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
            </button>
          </>
        }
      >
        {/* Reusable Chart Insight Callout Box */}
        {showInsights && (
          <div className="mx-4 mb-3 animate-in fade-in duration-200">
            <ChartInsightBox
              message={customInsightMessage ?? defaultMessage}
              secondaryMessage={secondaryMessage}
            />
          </div>
        )}

        <TrendChart data={trend.points} valueKey="issued" valueNoun="certificates" height={300} />
      </ChartCard>
    </div>
  )
}
