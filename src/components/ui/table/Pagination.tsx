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
  const safePage = typeof page === 'number' && !Number.isNaN(page) ? Math.max(1, page) : 1
  const safePageCount = typeof pageCount === 'number' && !Number.isNaN(pageCount) ? Math.max(1, pageCount) : 1
  const safeTotalItems = typeof totalItems === 'number' && !Number.isNaN(totalItems) ? Math.max(0, totalItems) : 0
  const safePageSize = typeof pageSize === 'number' && !Number.isNaN(pageSize) ? Math.max(1, pageSize) : 7

  if (safePageCount <= 1 && safeTotalItems === 0) return null

  const from = safeTotalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1
  const to = Math.min(safePage * safePageSize, safeTotalItems)
  const pages = getPages(safePage, safePageCount)

  const handleSafePageChange = (target: number) => {
    if (typeof target === 'number' && !Number.isNaN(target) && target >= 1 && target <= safePageCount) {
      onPageChange(target)
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-2.5 sm:flex-row bg-white">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{safeTotalItems}</span>
      </p>

      {safeTotalItems > 0 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous page"
            disabled={safePage <= 1}
            onClick={() => handleSafePageChange(safePage - 1)}
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
                  aria-current={p === safePage ? 'page' : undefined}
                  onClick={() => handleSafePageChange(p)}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    p === safePage
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
            disabled={safePage >= safePageCount}
            onClick={() => handleSafePageChange(safePage + 1)}
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
