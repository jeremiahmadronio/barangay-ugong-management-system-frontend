import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

function getPages(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7)
    return Array.from({ length: pageCount }, (_, i) => i + 1)

  const pages: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)

  if (start > 2) pages.push('gap')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < pageCount - 1) pages.push('gap')

  pages.push(pageCount)
  return pages
}

export function Pagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (pageCount <= 1 && totalItems === 0) return null

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  const pages = getPages(page, pageCount)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row bg-white">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </p>

      {totalItems > 0 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {pages.map((p, i) =>
              p === 'gap' ? (
                <span
                  key={`gap-${i}`}
                  className="px-1 text-sm text-slate-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => onPageChange(p)}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    p === page
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'border border-transparent bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
