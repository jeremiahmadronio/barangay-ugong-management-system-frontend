import { type ReactNode } from 'react'
import { FolderKanban } from 'lucide-react'

interface DetailCaseHeaderProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  status?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
}

/** Executive Case Header Banner (Full Width, Document/Docket style). */
export function DetailCaseHeader({
  title,
  subtitle,
  meta,
  status,
  actions,
  icon,
}: DetailCaseHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left Side: Docket Icon + Title + Status Badges */}
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/90 text-blue-600 shadow-2xs">
            {icon ?? <FolderKanban className="h-6 w-6" />}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                {title}
              </h1>
              {status}
              {meta}
            </div>
            {subtitle ? (
              <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        {actions ? (
          <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
