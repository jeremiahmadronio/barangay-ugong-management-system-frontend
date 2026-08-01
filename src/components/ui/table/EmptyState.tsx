import { type ReactNode } from 'react'
import { SearchX } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  image?: string
  action?: ReactNode
}

/**
 * Aesthetic empty state shown when a table has no rows to display.
 * Features pure SVG vector fallback if no custom image is provided.
 */
export function EmptyState({
  title = 'No results found',
  description = 'Try adjusting your search or filters to find what you’re looking for.',
  image,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {image ? (
        <div className="mb-5 h-28 w-28 select-none opacity-85">
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      ) : (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 border border-slate-200/80">
          <SearchX size={32} />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
