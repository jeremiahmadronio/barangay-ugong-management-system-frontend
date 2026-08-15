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
          {insightMessage && (
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Lightbulb size={13} />
              {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
            </button>
          )}
        </>
      }
    >
      {/* Reusable Toggleable ChartInsightBox */}
      {insightMessage && showInsights && (
        <div className="mb-4 animate-in fade-in duration-200">
          <ChartInsightBox
            message={insightMessage}
            secondaryMessage={insightSecondaryMessage}
          />
        </div>
      )}

      {/* Main Clean Horizontal Bar Chart without X-Axis or Gridlines */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={items}
            margin={{ top: 8, right: 36, bottom: 4, left: 10 }}
          >
            {/* Hidden X-Axis */}
            <XAxis type="number" hide />

            {/* Left Y-Axis Labels */}
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={90}
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
    </ChartCard>
  )
}
