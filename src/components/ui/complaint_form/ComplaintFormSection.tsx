import { type ReactNode } from 'react'

interface ComplaintFormSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  headerExtra?: ReactNode
}

export function ComplaintFormSection({
  title,
  subtitle,
  children,
  className = '',
  headerExtra,
}: ComplaintFormSectionProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs transition-all duration-200 p-5 sm:p-6 space-y-4 ${className}`}
    >
      {/* Seamless Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {headerExtra && <div className="shrink-0">{headerExtra}</div>}
      </div>

      {/* Section Content */}
      <div className="pt-0">{children}</div>
    </div>
  )
}
