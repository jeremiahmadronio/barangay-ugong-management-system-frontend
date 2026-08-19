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

        {/* View Chart Insights Toggle Button */}
        {insightMessage && (
          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer pt-0.5"
          >
            <Lightbulb
              size={13}
              className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'}
            />
            {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
          </button>
        )}
      </div>

      {/* Main Content Body */}
      {computedTotal > 0 ? (
        <div className="flex-1 my-auto py-2 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Left Donut Chart Container */}
          <div className="sm:col-span-5 relative flex items-center justify-center min-h-[160px]">
            <div className="w-[160px] h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={computedTotal > 0 ? 2 : 0}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 50 }}
                    content={<TrendStyleTooltip verb="Total" noun="" />}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {computedTotal}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  {centerLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right Breakdown Container (Table or List Variant) */}
          <div className="sm:col-span-7 pl-0 sm:pl-2">
            {variant === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                      <th className="pb-2 text-left font-semibold">{categoryColumnHeader}</th>
                      <th className="pb-2 pr-3 text-right font-semibold w-16">Count</th>
                      <th className="pb-2 text-right font-semibold w-16">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {itemsWithPct.length > 0 ? (
                      itemsWithPct.map((item) => (
                        <tr key={item.label} className="text-xs font-medium text-slate-700 hover:bg-slate-50/50">
                          <td className="py-2.5 pr-2 flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate text-slate-800 font-semibold">{item.label}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-right font-bold text-slate-900 whitespace-nowrap">{item.value}</td>
                          <td className="py-2.5 text-right text-slate-500 font-semibold whitespace-nowrap">
                            {item.pct.toFixed(1)}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400 text-xs italic">
                          No breakdown data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsWithPct.length > 0 ? (
                  itemsWithPct.map((item) => (
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
                  ))
                ) : (
                  <div className="text-center text-slate-400 text-xs italic py-4">
                    No breakdown data
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6">
          <EmptyState
            title="No breakdown data available"
            description="No certificate records match your applied filter options or date range."
          />
        </div>
      )}

      {/* Reusable Toggleable ChartInsightBox */}
      {insightMessage && showInsights && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 animate-in fade-in duration-200">
          <ChartInsightBox
            message={insightMessage}
            secondaryMessage={insightSecondaryMessage}
          />
        </div>
      )}
    </div>
  )
}
