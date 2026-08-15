/**
 * Single source of truth for chart colors.
 * A small, evenly-saturated categorical set — deliberately NOT a light-to-dark
 * ramp of one hue, so slices stay distinguishable without looking like a gradient.
 */
export const CHART_COLORS = {
  primary: '#2563eb',
  teal: '#0d9488',
  indigo: '#4f46e5',
  amber: '#d97706',
  slate: '#64748b',
  rose: '#be123c',
} as const

/** Order used when a chart has N categories. */
export const CATEGORICAL = [
  CHART_COLORS.primary,
  CHART_COLORS.teal,
  CHART_COLORS.indigo,
  CHART_COLORS.amber,
  CHART_COLORS.slate,
  CHART_COLORS.rose,
] as const

/** Two-way comparisons (original vs re-issuance, female vs male). */
export const PAIR = [CHART_COLORS.primary, CHART_COLORS.teal] as const

export const AXIS = {
  grid: '#e2e8f0',
  tick: '#64748b',
  cursor: '#cbd5e1',
} as const

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  boxShadow: 'none',
} as const

export function colorAt(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]
}
