import { EmptyState } from '@/components/ui/table/EmptyState'
import React, { useState, useEffect } from 'react'
import { BarChart2 as BarIcon, Lightbulb, type LucideIcon } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts'
import { CardPill, ChartCard } from './ChartCard'
import { ChartInsightBox } from './ChartInsightBox'
import { TrendStyleTooltip } from './utils/TrendStyleTooltip'

export interface BarItem {
  label: string
  value: number
  color?: string
}

export interface HorizontalBarCardProps {
  /** Card title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Header icon */
  icon?: LucideIcon
  /** Badge pill node */
  badge?: React.ReactNode
  /** Array of bar items */
  data: BarItem[]
  /** Total value override (optional) */
  totalValue?: number
  /** Value noun shown in labels/tooltips (e.g. "Total", "Issued") */
  valueNoun?: string
  /** Chart height in pixels (default 260) */
  height?: number
  /** Primary bar color (defaults to monochromatic brand color #2563eb) */
  barColor?: string
  /** Optional custom chart insight message (manually typed text / ReactNode) */
  insightMessage?: React.ReactNode
  /** Optional secondary detail message for the chart insight box */
  insightSecondaryMessage?: React.ReactNode
  /** Default visibility of chart insights (defaults to false) */
  showInsightsDefault?: boolean
  /** Extra CSS class name */
  className?: string
  /** Left Y-Axis width for labels (default 160) */
  yAxisWidth?: number
  /** Max label character length before truncating with ellipsis (default 26) */
  maxLabelLength?: number
}

/**
 * Clean, clutter-free Reusable Horizontal Bar Chart Component.
 * Refactored to Senior Frontend Engineer specifications:
 * 1. Hidden X-Axis & zero gridlines (no visual clutter behind bars)
 * 2. Monochromatic brand color theme (#2563eb)
 * 3. Soft rounded pill corners (radius={[0, 6, 6, 0]})
 * 4. Direct value labels on right tip (<LabelList dataKey="value" position="right" />)
 * 5. Clean Y-Axis alignment, footer metadata summary, and toggleable ChartInsightBox
 */
export function HorizontalBarCard({
  title,
  description,
  icon: Icon = BarIcon,
  badge,
  data = [],
  totalValue,
  valueNoun = 'Total',
  height = 260,
  barColor = '#2563eb',
  insightMessage,
  insightSecondaryMessage,
  showInsightsDefault = false,
  className = '',
  yAxisWidth = 160,
  maxLabelLength = 26,
}: HorizontalBarCardProps) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const computedTotal = totalValue ?? data.reduce((acc, item) => acc + item.value, 0)

  const items = data.map((item) => ({
    ...item,
    pct: computedTotal > 0 ? (item.value / computedTotal) * 100 : 0,
  }))

  const topItem = [...items].sort((a, b) => b.value - a.value)[0]
  const defaultInsight = topItem && topItem.value > 0
    ? `This chart tracks formal complaint resolution outcomes (cases settled directly at desk level vs escalated to Lupon Tagapamayapa). Currently, ${topItem.label} represents the highest outcome with ${topItem.value} cases (${topItem.pct.toFixed(1)}%).`
    : 'This chart tracks formal complaint resolution outcomes. No complaint resolution outcomes were recorded within the selected date range.'

  const activeInsight = insightMessage ?? defaultInsight

  return (
    <ChartCard
      title={title}
      description={description}
      icon={Icon}
      badge={badge}
      className={className}
      footer={
        <>
          {topItem && (
            <span>
              Highest: <span className="font-semibold text-slate-800">{topItem.label}</span> (
              {topItem.value})
            </span>
          )}
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
        </>
      }
    >
      {/* Reusable Toggleable ChartInsightBox */}
      {showInsights && (
        <div className="mb-4 animate-in fade-in duration-200">
          <ChartInsightBox
            message={activeInsight}
            secondaryMessage={insightSecondaryMessage}
          />
        </div>
      )}

      {/* Main Clean Horizontal Bar Chart without X-Axis or Gridlines */}
      {computedTotal > 0 ? (
        <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={items}
            margin={{ top: 8, right: 36, bottom: 4, left: 10 }}
          >
            {/* Hidden X-Axis */}
            <XAxis type="number" hide />

            {/* Left Y-Axis Labels with Ellipsis Truncation and Tooltip */}
            <YAxis
              type="category"
              dataKey="label"
              tick={({ x, y, payload }) => {
                const rawLabel = String(payload?.value || '')
                const truncated =
                  rawLabel.length > maxLabelLength
                    ? `${rawLabel.slice(0, maxLabelLength - 3)}...`
                    : rawLabel
                return (
                  <g transform={`translate(${x},${y})`}>
                    <title>{rawLabel}</title>
                    <text
                      x={-6}
                      y={0}
                      dy={4}
                      textAnchor="end"
                      fill="#334155"
                      fontSize={11.5}
                      fontWeight={600}
                    >
                      {truncated}
                    </text>
                  </g>
                )
              }}
              axisLine={false}
              tickLine={false}
              width={yAxisWidth}
            />

            {/* Clean Hover Tooltip */}
            <Tooltip content={<TrendStyleTooltip verb={valueNoun} noun="" />} />

            {/* Monochromatic Brand Color Bar with Soft Rounded Pill Corners */}
            <Bar
              dataKey="value"
              fill={barColor}
              radius={[0, 6, 6, 0]}
              barSize={18}
            >
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: '12px', fontWeight: 600, fill: '#334155' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-6">
          <EmptyState
            title="No distribution data available"
            description="No case records match your applied filter options or date range."
          />
        </div>
      )}
    </ChartCard>
  )
}
