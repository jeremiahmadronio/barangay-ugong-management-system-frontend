import { EmptyState } from '@/components/ui/table/EmptyState'
import { getTrendChartInsight } from './reportInsightsHelper'
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
  title?: string
  description?: string
  valueNoun?: string
}

/**
 * Issuance / Filing trend with reusable ChartInsightBox.
 * The bucket size follows the applied date range: a one-month
 * range is charted day by day, a quarter week by week, longer ranges monthly.
 */
export function TrendPanel({
  trend,
  delta,
  showInsightsDefault = false,
  customInsightMessage,
  title,
  description,
  valueNoun = 'cases',
}: Props) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const { busiest, slowest } = extremes(trend)
  const up = delta.direction !== 'down'
  const TrendIcon = up ? TrendingUp : TrendingDown

  const totalIssued = trend.points.reduce((acc, p) => acc + (p.issued ?? 0), 0)

  const defaultMessage = getTrendChartInsight({
    totalVolume: totalIssued,
    rangeLabel: trend.rangeLabel,
    busiest,
    slowest,
    granularityLabel: trend.granularityLabel,
    itemLabel: valueNoun,
  })

  const secondaryMessage = delta.percent !== null && (delta.previous > 0 || delta.current > 0) ? (
    <>
      Operational load shows{' '}
      {delta.previous === 0 && delta.current > 0 ? (
        <span className="font-semibold text-emerald-600">
          a recorded volume of {delta.current} {valueNoun} in this period
        </span>
      ) : (
        <>
          a{' '}
          <span className={`font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {delta.percent > 0 ? '+' : ''}{delta.percent.toFixed(1)}% {up ? 'increase' : 'decrease'}
          </span>{' '}
          compared to the previous {delta.unit} ({delta.previous} → {delta.current} {valueNoun})
        </>
      )}
      .
    </>
  ) : undefined

  return (
    <div className="space-y-3">
      <ChartCard
        title={title ?? `${trend.granularityLabel} Case Filing Trend`}
        description={
          description ??
          `Cases filed per ${delta.unit} within the applied date range — each point is that ${delta.unit} alone, not a running total`
        }
        icon={TrendIcon}
        badge={<CardPill>{trend.rangeLabel}</CardPill>}
        bleed
        footer={
          <>
            {delta.percent !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <TrendIcon
                  className={`h-4 w-4 ${up ? 'text-emerald-600' : 'text-rose-600'}`}
                  aria-hidden="true"
                />
                <span className={`font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {delta.percent > 0 ? '+' : ''}{delta.percent.toFixed(1)}%
                </span>
                vs last {delta.unit} ({delta.previous} → {delta.current})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                Total Volume: <span className="font-semibold text-slate-800">{delta.current} {valueNoun}</span>
              </span>
            )}
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
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Lightbulb size={13} className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
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

        {totalIssued > 0 ? (
          <TrendChart data={trend.points} valueKey="issued" valueNoun={valueNoun} height={300} />
        ) : (
          <div className="py-6">
            <EmptyState
              title="No case activity recorded"
              description="No blotter case filings were recorded within the applied date range."
            />
          </div>
        )}
      </ChartCard>
    </div>
  )
}
