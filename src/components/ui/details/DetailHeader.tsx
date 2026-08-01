import { type ReactNode } from 'react'
import { Avatar } from '@/components/ui/table/Avatar'

interface DetailHeaderProps {
  name: string
  subtitle?: string
  photoBase64?: string
  src?: string
  meta?: ReactNode
  status?: ReactNode
  actions?: ReactNode
}

/** Profile-style header shared by people, accounts, residents, and officers. */
export function DetailHeader({
  name,
  subtitle,
  photoBase64,
  src,
  meta,
  status,
  actions,
}: DetailHeaderProps) {
  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3.5 lg:flex-col lg:items-center lg:text-center">
        <Avatar name={name} photoBase64={photoBase64 || src} className="h-14 w-14 border border-slate-200 text-base lg:h-20 lg:w-20 lg:text-lg" />
        <div className="min-w-0 lg:w-full">
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 lg:text-xl">
            {name}
          </h1>
          {subtitle && <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>

      {(status || meta) && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 lg:justify-center">
          {status}
          {meta}
        </div>
      )}

      {actions && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</p>
          <div className="grid gap-2">{actions}</div>
        </div>
      )}
    </aside>
  )
}
