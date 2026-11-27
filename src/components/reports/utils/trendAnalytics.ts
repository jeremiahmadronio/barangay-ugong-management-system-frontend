export type Granularity = 'day' | 'week' | 'month' | 'daily' | 'weekly' | 'monthly'

export interface TrendPoint {
  label: string
  issued: number
}

export interface TrendResult {
  granularity?: Granularity
  unit?: 'day' | 'week' | 'month'
  granularityLabel: string
  rangeLabel: string
  points: TrendPoint[]
}

export interface Delta {
  current: number
  previous: number
  percent: number | null
  direction: 'up' | 'down' | 'flat' | 'neutral'
  unit: string
}

export function extremes(trend: TrendResult): {
  busiest: TrendPoint | null
  slowest: TrendPoint | null
} {
  return {
    busiest: trend.points.reduce<TrendPoint | null>(
      (best, point) => (!best || point.issued > best.issued ? point : best),
      null
    ),
    slowest: trend.points.reduce<TrendPoint | null>(
      (worst, point) => (!worst || point.issued < worst.issued ? point : worst),
      null
    ),
  }
}
