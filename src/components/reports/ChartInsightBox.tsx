import React from 'react'
import { Lightbulb } from 'lucide-react'

export interface ChartInsightBoxProps {
  /** Main narrative message / text insight (manually typed or dynamic) */
  message: React.ReactNode
  /** Optional secondary metric or comparison note */
  secondaryMessage?: React.ReactNode
  /** Extra container styling */
  className?: string
}

/**
 * Reusable Chart Insight Callout Box.
 * Restored to original aesthetic design: rounded-xl border border-blue-100 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-2xs
 */
export function ChartInsightBox({
  message,
  secondaryMessage,
  className = '',
}: ChartInsightBoxProps) {
  return (
    <div
      className={`rounded-xl border border-blue-100 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-2xs ${className}`}
    >
      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1 min-w-0 flex-1">
        <div className="font-medium italic text-slate-700 leading-relaxed">
          {message}
        </div>

        {secondaryMessage && (
          <div className="text-[11.5px] text-slate-500 not-italic pt-0.5">
            {secondaryMessage}
          </div>
        )}
      </div>
    </div>
  )
}
