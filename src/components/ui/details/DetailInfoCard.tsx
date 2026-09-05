import { type ReactNode } from 'react'

export interface DetailField {
  label: string
  value: ReactNode
}

interface DetailInfoCardProps {
  title: string
  fields?: DetailField[]
  children?: ReactNode
  columns?: 1 | 2 | 3
  icon?: ReactNode
}

/** A consistent label/value card for overview content across detail pages. */
export function DetailInfoCard({
  title,
  fields = [],
  children,
  columns = 2,
  icon,
}: DetailInfoCardProps) {
  const columnClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns]

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
      </div>
      {fields && fields.length > 0 && (
        <dl className={`mt-5 grid gap-x-8 gap-y-6 ${columnClass}`}>
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {field.label}
              </dt>
              <dd className="mt-1.5 break-words text-sm text-slate-700">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
