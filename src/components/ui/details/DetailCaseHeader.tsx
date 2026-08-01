import { type ReactNode } from 'react'
import { FileText } from 'lucide-react'

interface DetailCaseHeaderProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  status?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
}

/** Case-record header (no resident/profile photo) aligned with other detail views. */
export function DetailCaseHeader({
  title,
  subtitle,
  meta,
  status,
  actions,
  icon,
}: DetailCaseHeaderProps) {
  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3.5 lg:flex-col lg:items-center lg:text-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-blue-600 lg:h-20 lg:w-20">
          {icon ?? <FileText className="h-6 w-6 lg:h-8 lg:w-8" />}
        </div>
        <div className="min-w-0 lg:w-full">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 lg:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {(status || meta) && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 lg:justify-center">
          {status}
          {meta}
        </div>
      )}

      {actions ? (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Actions
          </p>
          <div className="grid gap-2">{actions}</div>
        </div>
      ) : null}
    </aside>
  )
}
