import React from 'react'

interface TrendStyleTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  verb?: string
  noun?: string
}

/**
 * Clean, senior-level Custom Tooltip component:
 * Line 1: Category / Date Title (e.g. "Pending", "Settled at Desk", "Feb 2026")
 * Line 2: Value & Percentage Share (e.g. "11 Cases (61.1%)")
 */
export function TrendStyleTooltip({
  active,
  payload,
  label,
  verb = 'Cases',
  noun = '',
}: TrendStyleTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]
  const itemPayload = dataPoint.payload ?? {}

  // Resolve clean title (Category label or Month/Date)
  let title = itemPayload.label || itemPayload.name || dataPoint.name

  if (!title || typeof title !== 'string' || !isNaN(Number(title))) {
    if (label && isNaN(Number(label))) {
      title = label
    } else {
      title = itemPayload.label || itemPayload.name || 'Details'
    }
  }

  const value = dataPoint.value ?? itemPayload.value ?? 0
  const pct = itemPayload.pct ?? itemPayload.percentage ?? null
  const pctStr = pct !== null && !isNaN(Number(pct)) ? ` (${Number(pct).toFixed(1)}%)` : ''

  const nounSuffix = noun ? ` ${noun}` : ''
  const displayVerb = verb ? `${verb}: ` : ''

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-lg text-[13px] leading-snug z-[9999] pointer-events-none min-w-[140px]">
      <p className="font-bold text-slate-900">{title}</p>
      <p className="font-semibold text-blue-600 mt-1">
        {value}{nounSuffix} {displayVerb ? `(${verb})` : ''}{pctStr}
      </p>
    </div>
  )
}
