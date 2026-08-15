import React, { useState, useEffect } from 'react'
import { PieChart as PieIcon, Lightbulb, type LucideIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CATEGORICAL } from './utils/ChartColor'
import { ChartInsightBox } from './ChartInsightBox'
import { TrendStyleTooltip } from './utils/TrendStyleTooltip'

export interface BreakdownItem {
  label: string
  value: number
  color?: string
}

export interface BreakdownDonutCardProps {
  /** Card title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Header icon */
  icon?: LucideIcon
  /** Donut center label (e.g. "Requests", "Total", "Applicants") */
  centerLabel?: string
  /** Data breakdown items */
  data: BreakdownItem[]
  /** Total count override (optional) */
  totalValue?: number
  /**
   * Layout style:
   * - 'table' (default): displays structured breakdown table with clean headers (Purpose, Count, Share)
   * - 'list': displays simple list with colored dots, counts, and percentages
   */
  variant?: 'table' | 'list'
  /** Header label for category column when variant='table' */
  categoryColumnHeader?: string
  /** Optional custom chart insight message (manually typed text / ReactNode) */
  insightMessage?: React.ReactNode
  /** Optional secondary detail message for the chart insight box */
  insightSecondaryMessage?: React.ReactNode
  /** Default visibility of chart insights (defaults to false) */
  showInsightsDefault?: boolean
  /** Extra CSS class name */
  className?: string
}

/**
 * Single unified Reusable Donut Breakdown Component with clean headers,
 * relevant icons, clean simple tooltip formatting, and toggleable ChartInsightBox integration.
 */
export function BreakdownDonutCard({
  title,
  description,
  icon: Icon = PieIcon,
  centerLabel = 'Total',
  data = [],
  totalValue,
  variant = 'table',
  categoryColumnHeader = 'Purpose',
  insightMessage,
  insightSecondaryMessage,
  showInsightsDefault = false,
  className = '',
}: BreakdownDonutCardProps) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const computedTotal = totalValue ?? data.reduce((acc, item) => acc + item.value, 0)

  const itemsWithPct = data.map((item, index) => {
    const pct = computedTotal > 0 ? (item.value / computedTotal) * 100 : 0
    const color = item.color ?? CATEGORICAL[index % CATEGORICAL.length]
    return { ...item, pct, color }
  })

  // Format chart data for Recharts (fallback to placeholder grey segment if total is 0)
  const chartData =
    computedTotal > 0
      ? itemsWithPct.map((item) => ({ name: item.label, value: item.value, color: item.color }))
      : [{ name: 'No data', value: 1, color: '#e2e8f0' }]

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs ${className}`}>
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />}
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>

        {/* View Chart Insights Toggle Button (If insight message exists) */}
        {insightMessage && (
          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer pt-0.5"
          >
            <Lightbulb size={13} />
            {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
          </button>
        )}
      </div>

      {/* Main Content Layout: Donut Chart on Left, Breakdown Info on Right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
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
                {/* Clean Simple Tooltip (No Repeated Words) */}
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={<TrendStyleTooltip verb="Total" noun="" />}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Count & Label */}
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
            /* Table Variant with Clean Soft Headers */
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                    <th className="pb-2 text-left font-semibold">{categoryColumnHeader}</th>
                    <th className="pb-2 text-right font-semibold">Count</th>
                    <th className="pb-2 text-right font-semibold">Share</th>
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
                        <td className="py-2.5 text-right font-bold text-slate-900">{item.value}</td>
                        <td className="py-2.5 text-right text-slate-500 font-semibold">
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
            /* List Variant */
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
