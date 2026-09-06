import React, { useState, useEffect } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Lightbulb, type LucideIcon } from 'lucide-react'
import { ChartInsightBox } from './ChartInsightBox'
import { TrendStyleTooltip } from './utils/TrendStyleTooltip'
import { CATEGORICAL } from './utils/ChartColor'
import { EmptyState } from '@/components/ui/table/EmptyState'

export interface BreakdownItem {
  label: string
  value: number
  color?: string
}

export interface BreakdownDonutCardProps {
  badge?: React.ReactNode
  badgeText?: string
  className?: string
  title: string
  description?: string
  icon?: LucideIcon
  centerLabel?: string
  data: BreakdownItem[]
  variant?: 'table' | 'list'
  categoryColumnHeader?: string
  showInsightsDefault?: boolean
  insightMessage?: React.ReactNode
  insightSecondaryMessage?: React.ReactNode
  totalValue?: number
}

export function BreakdownDonutCard({
  title,
  description,
  icon: Icon,
  centerLabel = 'Total',
  data = [],
  variant = 'table',
  categoryColumnHeader = 'Category',
  showInsightsDefault = false,
  insightMessage,
  insightSecondaryMessage,
  totalValue,
  badge,
  badgeText,
  className = '',
}: BreakdownDonutCardProps) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const computedTotal = totalValue ?? data.reduce((acc, item) => acc + item.value, 0)

  const itemsWithPct = data.map((item, idx) => ({
    ...item,
    color: item.color || CATEGORICAL[idx % CATEGORICAL.length],
    pct: computedTotal > 0 ? (item.value / computedTotal) * 100 : 0,
  }))

  const chartData = itemsWithPct.filter((i) => i.value > 0)

  const topCategory = [...itemsWithPct].sort((a, b) => b.value - a.value)[0]
  const defaultInsight = topCategory && topCategory.value > 0
    ? `This chart displays the percentage distribution across ${title.toLowerCase() || 'case statuses'}. Currently, ${topCategory.label} represents the largest share with ${topCategory.value} cases (${topCategory.pct.toFixed(1)}% of total volume).`
    : `This chart displays the percentage distribution across ${title.toLowerCase() || 'case statuses'}. No active case records were found within the applied date range.`

  const activeInsight = insightMessage ?? defaultInsight

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />}
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
            {badge && <div className="ml-1">{badge}</div>}
            {badgeText && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 ml-1">
                {badgeText}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {computedTotal > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          {/* Donut Chart */}
          <div className="sm:col-span-5 flex justify-center relative">
            <div className="w-[170px] h-[170px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    wrapperStyle={{ zIndex: 9999 }}
                    content={<TrendStyleTooltip verb="Cases" noun="" />}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-extrabold text-slate-900 leading-none">
                  {computedTotal}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {centerLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table / List */}
          <div className="sm:col-span-7">
            {variant === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                      <th className="text-left py-1.5 pl-1 font-semibold">{categoryColumnHeader}</th>
                      <th className="text-right py-1.5 px-2 font-semibold">Count</th>
                      <th className="text-right py-1.5 pr-1 font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {itemsWithPct.map((item) => (
                      <tr key={item.label} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 pl-1 font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">
                          {item.value}
                        </td>
                        <td className="py-2 pr-1 text-right font-medium text-slate-500">
                          {item.pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsWithPct.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-xs font-medium text-slate-700"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-slate-800 font-semibold">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <span className="w-10 text-right text-slate-500 text-xs font-semibold">
                        {item.pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6">
          <EmptyState
            title="No breakdown data available"
            description="No case records match your applied filter options or date range."
          />
        </div>
      )}

      {/* Footer with View Chart Insights Button */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Total Volume: <span className="font-semibold text-slate-800">{computedTotal}</span>
        </span>
        <button
          type="button"
          onClick={() => setShowInsights(!showInsights)}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Lightbulb size={13} className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
          {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
        </button>
      </div>

      {/* Reusable Toggleable ChartInsightBox */}
      {showInsights && (
        <div className="animate-in fade-in duration-200">
          <ChartInsightBox
            message={activeInsight}
            secondaryMessage={insightSecondaryMessage}
          />
        </div>
      )}
    </div>
  )
}
