import React from 'react'

export type BadgeTone =
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'sky'

const TONES: Record<BadgeTone, string> = {
  slate: 'border border-slate-200 bg-white text-slate-600',
  indigo: 'border border-indigo-200/80 bg-indigo-50 text-indigo-700',
  emerald: 'border border-emerald-200/80 bg-emerald-50 text-emerald-700',
  amber: 'border border-amber-200/80 bg-amber-50 text-amber-700',
  rose: 'border border-rose-200/80 bg-rose-50 text-rose-700',
  violet: 'border border-purple-200/80 bg-purple-50 text-purple-700',
  sky: 'border border-sky-200/80 bg-sky-50 text-sky-700',
}

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}

/** Small pill badge used for status / role / type labels. */
export function Badge({
  children,
  tone = 'slate',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}
