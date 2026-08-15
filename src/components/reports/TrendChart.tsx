import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { AXIS, CHART_COLORS } from './utils/ChartColor'
import { TrendStyleTooltip } from './utils/TrendStyleTooltip'

export interface TrendChartPoint {
  label: string
  [key: string]: string | number
}

interface TrendChartProps {
  data: TrendChartPoint[]
  /** numeric field to plot */
  valueKey: string
  /** noun shown in the tooltip, e.g. "certificates" */
  valueNoun: string
  height?: number
  color?: string
  /** show every Nth x tick — useful for daily ranges */
  tickInterval?: number | 'preserveStartEnd'
}

/** Reusable single-series trend chart with exact TrendStyleTooltip card. */
export function TrendChart({
  data,
  valueKey,
  valueNoun,
  height = 300,
  color = CHART_COLORS.primary,
  tickInterval = 'preserveStartEnd',
}: TrendChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 26, bottom: 0, left: 6 }}>
          <CartesianGrid stroke={AXIS.grid} strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12.5, fill: AXIS.tick }}
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            minTickGap={16}
            interval={tickInterval}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tick={{ fontSize: 12.5, fill: AXIS.tick }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={34}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: AXIS.cursor, strokeDasharray: '4 4' }}
            content={<TrendStyleTooltip verb="Issued" noun={valueNoun} />}
          />
          <Area
            type="monotone"
            dataKey={valueKey}
            name="Issued"
            stroke={color}
            strokeWidth={2.5}
            fill={color}
            fillOpacity={0.06}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
