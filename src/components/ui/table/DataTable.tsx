import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Column, RowAction } from './types'
import { TableActions } from './TableActions'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'

interface DataTableProps<T> {
  /** All rows to display (already filtered by the caller). */
  data: T[]
  /** Column definitions. */
  columns: Column<T>[]
  /** Unique key extractor for each row. */
  rowKey: (row: T) => string | number
  /** Optional per-row actions. Rendered in a trailing "Actions" column. */
  actions?: RowAction<T>[] | ((row: T) => RowAction<T>[])
  /** How row actions render. Defaults to 'menu'. */
  actionsVariant?: 'menu' | 'inline'
  /** Rows per page. Defaults to 7. */
  pageSize?: number
  /** Empty-state customization. */
  emptyTitle?: string
  emptyDescription?: string
  emptyImage?: string
  emptyAction?: React.ReactNode
  /** Optional card header (title/toolbar) rendered above the table. */
  header?: React.ReactNode
  /** Optional server-side pagination config. */
  serverPagination?: {
    page: number
    pageCount: number
    totalItems: number
    pageSize: number
    onPageChange: (page: number) => void
  }
  className?: string
}

const ALIGN: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * Config-driven data table with sticky-clean styling,
 * built-in client pagination (7 rows/page by default), framer-motion row animations,
 * an aesthetic empty state, and an optional per-row actions column.
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  actions,
  actionsVariant = 'menu',
  pageSize = 7,
  emptyTitle,
  emptyDescription,
  emptyImage,
  emptyAction,
  header,
  serverPagination,
  className = '',
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const isServerPaginated = Boolean(serverPagination)

  const clientPageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, clientPageCount)

  // Reset to page 1 whenever the dataset shrinks below the current page.
  if (!isServerPaginated && page !== safePage) setPage(safePage)

  const pageRows = useMemo(
    () => (isServerPaginated ? data : data.slice((safePage - 1) * pageSize, safePage * pageSize)),
    [data, isServerPaginated, safePage, pageSize],
  )

  const totalCols = columns.length + (actions ? 1 : 0)
  const rawPage = serverPagination?.page ?? safePage
  const paginationPage = typeof rawPage === 'number' && !Number.isNaN(rawPage) ? Math.max(1, rawPage) : 1

  const rawPageCount = serverPagination?.pageCount ?? clientPageCount
  const paginationPageCount = typeof rawPageCount === 'number' && !Number.isNaN(rawPageCount) ? Math.max(1, rawPageCount) : 1

  const rawTotal = serverPagination?.totalItems ?? data.length
  const paginationTotalItems = typeof rawTotal === 'number' && !Number.isNaN(rawTotal) ? Math.max(0, rawTotal) : 0

  const rawPageSize = serverPagination?.pageSize ?? pageSize
  const paginationPageSize = typeof rawPageSize === 'number' && !Number.isNaN(rawPageSize) ? Math.max(1, rawPageSize) : 7

  const rawChange = serverPagination?.onPageChange ?? setPage
  const handlePageChange = (targetPage: number) => {
    if (typeof targetPage === 'number' && !Number.isNaN(targetPage) && targetPage >= 1 && targetPage <= paginationPageCount) {
      rawChange(targetPage)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs ${className}`}
    >
      {header && (
        <div className="border-b border-slate-100 px-5 py-3.5">{header}</div>
      )}

      <div className="overflow-x-auto min-h-[200px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap ${
                    ALIGN[col.align ?? 'left']
                  } ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${
                    col.className ?? ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th
                  scope="col"
                  className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={totalCols}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    image={emptyImage}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <motion.tr
                  key={`${rowKey(row)}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.025, 0.15) }}
                  className="group transition-colors hover:bg-slate-50/70"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-2.5 text-sm text-slate-700 whitespace-nowrap ${
                        ALIGN[col.align ?? 'left']
                      } ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${
                        col.className ?? ''
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-2.5">
                      <TableActions
                        row={row}
                        actions={actions}
                        variant={actionsVariant}
                      />
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={paginationPage}
        pageCount={paginationPageCount}
        totalItems={paginationTotalItems}
        pageSize={paginationPageSize}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
