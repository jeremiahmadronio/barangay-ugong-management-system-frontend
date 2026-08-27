import React, { useState, useMemo, useEffect } from 'react'
import {
  Table as TableIcon,
  Search,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { ChartInsightBox } from './ChartInsightBox'
import { EmptyState } from '@/components/ui/table/EmptyState'

export interface ColumnDef<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => React.ReactNode
}

export interface ReportTableCardProps<T> {
  /** Card title */
  title?: string
  /** Subtitle or description */
  description?: string
  /** Header icon */
  icon?: LucideIcon
  /** Column definitions */
  columns: ColumnDef<T>[]
  /** Array of report data rows */
  data: T[]
  /** Unique key extractor per row */
  getRowId?: (row: T, index: number) => string | number
  /** Items per page (default 5) */
  pageSize?: number
  /** Quick search placeholder (default "Filter this table...") */
  searchPlaceholder?: string
  /** Optional custom insight message */
  insightMessage?: React.ReactNode
  /** Optional secondary detail message for insight box */
  insightSecondaryMessage?: React.ReactNode
  /** Default visibility of chart insights (defaults to false) */
  showInsightsDefault?: boolean
  /** Extra CSS class name */
  className?: string
}

/**
 * Reusable Report Table Component with Pagination, Quick Table Search,
 * Status Badges, and toggleable ChartInsightBox integration.
 */
export function ReportTableCard<T>({
  title = 'Detailed Record List',
  description,
  icon: Icon = TableIcon,
  columns,
  data = [],
  getRowId,
  pageSize = 5,
  searchPlaceholder = 'Filter this table...',
  insightMessage,
  insightSecondaryMessage,
  showInsightsDefault = false,
  className = '',
}: ReportTableCardProps<T>) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  // Filter table data by Applicant Name (First Name, Middle Name, Last Name) and Application Number
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase().trim()
    return data.filter((row: any) => {
      const applicantName = String(row.applicantName ?? '').toLowerCase()
      const applicationNo = String(row.applicationNo ?? '').toLowerCase()
      const purpose = String(row.purpose ?? '').toLowerCase()
      const status = String(row.status ?? '').toLowerCase()
      return (
        applicantName.includes(query) ||
        applicationNo.includes(query) ||
        purpose.includes(query) ||
        status.includes(query)
      )
    })
  }, [data, searchQuery])

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pagination calculations
  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, startIndex, endIndex])

  const subtitleText = description ?? `${totalItems} record${totalItems === 1 ? '' : 's'} within the applied filters`

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />}
            <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed">{subtitleText}</p>
        </div>

        {/* Action Controls: Search & Toggle Insights */}
        <div className="flex flex-wrap items-center gap-3">
          {insightMessage && (
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Lightbulb size={13} className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
              {showInsights ? 'Hide Insights' : 'View Insights'}
            </button>
          )}

          {/* Quick Table Search Input */}
          <div className="relative min-w-[220px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Reusable Toggleable ChartInsightBox */}
      {insightMessage && showInsights && (
        <div className="animate-in fade-in duration-200">
          <ChartInsightBox
            message={insightMessage}
            secondaryMessage={insightSecondaryMessage}
          />
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-slate-700 font-medium">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => {
                const rowId = getRowId ? getRowId(row, idx) : idx
                return (
                  <tr key={rowId} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-4">
                  <EmptyState
                    title="No matching report records"
                    description="No case records match your applied filter options or search criteria within the date range."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalItems}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="px-2 font-semibold text-slate-700 text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
