import React from 'react'

interface TrendStyleTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  verb?: string
  noun?: string
}

/**
 * Custom Tooltip component matching exact screenshot typography:
 * Line 1: Category/Date title (13px font-medium text-slate-900)
 * Line 2: Verb : Value Noun (13px font-medium text-blue-600)
 */
export function TrendStyleTooltip({
  active,
  payload,
  label,
  verb = 'Total',
  noun = '',
}: TrendStyleTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]
  const title =
    label ||
    dataPoint.name ||
    dataPoint.payload?.label ||
    dataPoint.payload?.name ||
    'Details'

  const value = dataPoint.value ?? 0
  const nounSuffix = noun ? ` ${noun}` : ''

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md text-[13px] leading-snug z-50 pointer-events-none min-w-[120px]">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="font-medium text-blue-600 mt-1">
        {verb} : {value}{nounSuffix}
      </p>
    </div>
  )
}
