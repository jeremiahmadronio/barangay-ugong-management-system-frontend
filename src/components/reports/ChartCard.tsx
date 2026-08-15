import React from 'react'
import type { LucideIcon } from 'lucide-react'

export function CardPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      {children}
    </span>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  bleed?: boolean
  className?: string
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  badge,
  children,
  footer,
  bleed = false,
  className = '',
}: ChartCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />}
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
            {badge && <div className="ml-1.5">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={bleed ? '-mx-2' : ''}>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  )
}
