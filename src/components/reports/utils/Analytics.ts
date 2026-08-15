function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7)
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d)
  result.setMonth(result.getMonth() + months)
  return result
}

function differenceInCalendarDays(d1: Date, d2: Date): number {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime()
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime()
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24))
}

function startOfWeek(d: Date, options?: { weekStartsOn?: number }): Date {
  const result = new Date(d)
  const day = result.getDay()
  const weekStartsOn = options?.weekStartsOn ?? 1
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function format(d: Date, formatStr: string): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const year = d.getFullYear()
  const monthNum = d.getMonth()
  const monthStr = MONTHS[monthNum]
  const mm = String(monthNum + 1).padStart(2, '0')
  const day = d.getDate()
  const dd = String(day).padStart(2, '0')
  const yy = String(year).slice(-2)

  if (formatStr === 'yyyy-MM-dd') return `${year}-${mm}-${dd}`
  if (formatStr === 'yyyy-MM') return `${year}-${mm}`
  if (formatStr === 'MMM d') return `${monthStr} ${day}`
  if (formatStr === 'MMM yy') return `${monthStr} ${yy}`
  return `${year}-${mm}-${dd}`
}

import type { Applicant, ReportFilters } from '../types/ftjs'

export const TODAY = new Date('2026-08-15T00:00:00')

/** Certificates lapse one year after issuance; flag anything inside this window. */
export const EXPIRY_WINDOW_DAYS = 180

export function filterApplicants(rows: Applicant[], f: ReportFilters): Applicant[] {
  const from = new Date(f.dateFrom).getTime()
  const to = new Date(f.dateTo).getTime()
  return rows.filter((r) => {
    const d = new Date(r.dateIssued).getTime()
    if (d < from || d > to) return false
    if (f.sex !== 'All' && r.sex !== f.sex) return false
    if (f.civilStatus !== 'All' && r.civilStatus !== f.civilStatus) return false
    if (f.education !== 'All' && r.education !== f.education) return false
    if (f.purpose !== 'All' && r.purpose !== f.purpose) return false
    if (f.purok !== 'All' && r.purok !== f.purok) return false
    if (f.outcome !== 'All' && r.outcome !== f.outcome) return false
    return true
  })
}

export interface Slice {
  label: string
  value: number
  pct: number
}

export function countBy<K extends keyof Applicant>(rows: Applicant[], key: K, order?: string[]): Slice[] {
  const map = new Map<string, number>()
  order?.forEach((o) => map.set(o, 0))
  rows.forEach((r) => {
    const k = String(r[key])
    map.set(k, (map.get(k) ?? 0) + 1)
  })
  const total = rows.length || 1
  const out = Array.from(map, ([label, value]) => ({ label, value, pct: (value / total) * 100 }))
  return order ? out : out.sort((a, b) => b.value - a.value)
}

export const AGE_BANDS = [
  { label: '15–17', min: 15, max: 17 },
  { label: '18–20', min: 18, max: 20 },
  { label: '21–23', min: 21, max: 23 },
  { label: '24–26', min: 24, max: 26 },
  { label: '27–30', min: 27, max: 30 },
]

export function ageBands(rows: Applicant[]): Slice[] {
  const total = rows.length || 1
  return AGE_BANDS.map((b) => {
    const value = rows.filter((r) => r.age >= b.min && r.age <= b.max).length
    return { label: b.label, value, pct: (value / total) * 100 }
  })
}

/* ------------------------------------------------------------------ *
 * Trend — granularity follows the applied date range
 * ------------------------------------------------------------------ */

export type Granularity = 'daily' | 'weekly' | 'monthly'

export interface TrendPoint {
  /** sortable bucket id */
  key: string
  /** axis label */
  label: string
  /** ISOLATED count for that bucket only — never a running/cumulative total */
  issued: number
  original: number
  reissued: number
}

export interface TrendResult {
  granularity: Granularity
  /** singular noun for one bucket, e.g. "day" */
  unit: 'day' | 'week' | 'month'
  /** e.g. "Daily" */
  granularityLabel: string
  /** e.g. "Last 30 days" */
  rangeLabel: string
  points: TrendPoint[]
}

function pickGranularity(days: number): Granularity {
  if (days <= 31) return 'daily'
  if (days <= 92) return 'weekly'
  return 'monthly'
}

function emptyPoint(key: string, label: string): TrendPoint {
  return { key, label, issued: 0, original: 0, reissued: 0 }
}

/**
 * Buckets certificates by day, week, or month depending on how wide the applied
 * date range is: a one-month range is charted day by day, a quarter week by week,
 * anything longer month by month. Empty buckets are still emitted so the shape of
 * the trend stays honest (it dips on quiet days instead of skipping them).
 */
export function trendSeries(rows: Applicant[], from: string, to: string): TrendResult {
  const start = new Date(from)
  const end = new Date(to)
  const days = Math.max(differenceInCalendarDays(end, start) + 1, 1)
  const granularity = pickGranularity(days)

  const buckets = new Map<string, TrendPoint>()
  const keyOf = (d: Date): string => {
    if (granularity === 'daily') return format(d, 'yyyy-MM-dd')
    if (granularity === 'weekly') return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    return format(startOfMonth(d), 'yyyy-MM')
  }
  const labelOf = (d: Date): string => {
    if (granularity === 'daily') return format(d, 'MMM d')
    if (granularity === 'weekly') {
      const s = startOfWeek(d, { weekStartsOn: 1 })
      return `${format(s, 'MMM d')}–${format(addDays(s, 6), 'd')}`
    }
    return format(d, 'MMM yy')
  }

  let cursor =
    granularity === 'daily'
      ? new Date(start)
      : granularity === 'weekly'
        ? startOfWeek(start, { weekStartsOn: 1 })
        : startOfMonth(start)

  while (cursor <= end) {
    buckets.set(keyOf(cursor), emptyPoint(keyOf(cursor), labelOf(cursor)))
    cursor =
      granularity === 'daily'
        ? addDays(cursor, 1)
        : granularity === 'weekly'
          ? addWeeks(cursor, 1)
          : addMonths(cursor, 1)
  }

  rows.forEach((r) => {
    const d = new Date(r.dateIssued)
    const k = keyOf(d)
    const bucket = buckets.get(k) ?? emptyPoint(k, labelOf(d))
    bucket.issued += 1
    if (r.firstAvailment) bucket.original += 1
    else bucket.reissued += 1
    buckets.set(k, bucket)
  })

  const points = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key))
  const unit = granularity === 'daily' ? 'day' : granularity === 'weekly' ? 'week' : 'month'
  const granularityLabel =
    granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'
  const rangeLabel =
    granularity === 'daily'
      ? `Last ${points.length} days`
      : granularity === 'weekly'
        ? `Last ${points.length} weeks`
        : `Last ${points.length} months`

  return { granularity, unit, granularityLabel, rangeLabel, points }
}

export interface Delta {
  current: number
  previous: number
  /** null when there is no previous bucket to compare against */
  percent: number | null
  direction: 'up' | 'down' | 'flat'
  unit: 'day' | 'week' | 'month'
}

/**
 * Period-over-period change using ISOLATED bucket counts.
 * formula: ((current - previous) / previous) * 100
 * guards: previous = 0 and current > 0 -> +100%; both 0 -> 0%; no previous -> null.
 */
export function periodChange(trend: TrendResult): Delta {
  const { points, unit } = trend
  const current = points.length ? points[points.length - 1].issued : 0
  const previous = points.length > 1 ? points[points.length - 2].issued : 0

  if (points.length < 2) return { current, previous, percent: null, direction: 'flat', unit }

  const percent = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100
  return {
    current,
    previous,
    percent,
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat',
    unit,
  }
}

export function extremes(trend: TrendResult): { busiest: TrendPoint | null; slowest: TrendPoint | null } {
  return {
    busiest: trend.points.reduce<TrendPoint | null>(
      (best, p) => (!best || p.issued > best.issued ? p : best),
      null,
    ),
    slowest: trend.points.reduce<TrendPoint | null>(
      (worst, p) => (!worst || p.issued < worst.issued ? p : worst),
      null,
    ),
  }
}

/* ------------------------------------------------------------------ */

export interface PurokRow {
  purok: string
  total: number
  male: number
  female: number
  placed: number
  placementRate: number
  incomplete: number
}

export function purokBreakdown(rows: Applicant[]): PurokRow[] {
  const map = new Map<string, PurokRow>()
  rows.forEach((r) => {
    const cur =
      map.get(r.purok) ??
      { purok: r.purok, total: 0, male: 0, female: 0, placed: 0, placementRate: 0, incomplete: 0 }
    cur.total += 1
    if (r.sex === 'Male') cur.male += 1
    else cur.female += 1
    if (r.outcome === 'Placed') cur.placed += 1
    if (!r.completeDocs) cur.incomplete += 1
    map.set(r.purok, cur)
  })
  return Array.from(map.values())
    .map((r) => ({ ...r, placementRate: r.total ? (r.placed / r.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

export function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86400000)
}

export interface Summary {
  total: number
  placed: number
  placementRate: number
  inTraining: number
  searching: number
  noUpdate: number
  original: number
  reissued: number
  incompleteDocs: number
  averageAge: number
  femaleShare: number
  expiringSoon: Applicant[]
  topPurpose: Slice | null
}

export function summarize(rows: Applicant[]): Summary {
  const total = rows.length
  const placed = rows.filter((r) => r.outcome === 'Placed').length
  const purposes = countBy(rows, 'purpose')
  return {
    total,
    placed,
    placementRate: total ? (placed / total) * 100 : 0,
    inTraining: rows.filter((r) => r.outcome === 'In Training').length,
    searching: rows.filter((r) => r.outcome === 'Searching').length,
    noUpdate: rows.filter((r) => r.outcome === 'No Update').length,
    original: rows.filter((r) => r.firstAvailment).length,
    reissued: rows.filter((r) => !r.firstAvailment).length,
    incompleteDocs: rows.filter((r) => !r.completeDocs).length,
    averageAge: total ? rows.reduce((s, r) => s + r.age, 0) / total : 0,
    femaleShare: total ? (rows.filter((r) => r.sex === 'Female').length / total) * 100 : 0,
    expiringSoon: rows
      .filter((r) => {
        const d = daysUntil(r.validUntil)
        return d >= 0 && d <= EXPIRY_WINDOW_DAYS
      })
      .sort((a, b) => daysUntil(a.validUntil) - daysUntil(b.validUntil)),
    topPurpose: purposes[0] ?? null,
  }
}

export function toCsv(rows: Applicant[]): string {
  const head = [
    'Control No',
    'Name',
    'Sex',
    'Age',
    'Civil Status',
    'Educational Attainment',
    'Purok / Sitio',
    'Purpose',
    'Date Issued',
    'Valid Until',
    'First Availment',
    'Desired Field',
    'Outcome',
    'Employer',
    'Complete Documents',
  ]
  const body = rows.map((r) =>
    [
      r.controlNo,
      r.name,
      r.sex,
      r.age,
      r.civilStatus,
      r.education,
      r.purok,
      r.purpose,
      r.dateIssued,
      r.validUntil,
      r.firstAvailment ? 'Yes' : 'No',
      r.desiredField,
      r.outcome,
      r.employer ?? '',
      r.completeDocs ? 'Yes' : 'No',
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(','),
  )
  return [head.join(','), ...body].join('\n')
}
