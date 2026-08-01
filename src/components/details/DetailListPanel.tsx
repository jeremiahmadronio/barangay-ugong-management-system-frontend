import { type ReactNode } from 'react'

export interface DetailListItem {
  id: string
  title: string
  description?: string
  trailing?: ReactNode
}

interface DetailListPanelProps {
  title: string
  items: DetailListItem[]
  emptyMessage: string
}

/** A shared list panel for permissions, files, cases, activities, and similar records. */
export function DetailListPanel({
  title,
  items,
  emptyMessage,
}: DetailListPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                )}
              </div>
              {item.trailing && <div className="shrink-0">{item.trailing}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </section>
  )
}
