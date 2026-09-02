import React, { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import type { FilterConfig, FilterValues } from './types'

interface TableFiltersProps {
  filters?: FilterConfig[]
  configs?: FilterConfig[]
  values: FilterValues
  onApply: (appliedValues: FilterValues) => void
  onClear: () => void
  className?: string
}

/**
 * Ultra-compact single-line filter bar.
 * Features visible ChevronDown arrow icons on all select dropdowns.
 * Filtering only triggers when "Apply Filter" is clicked or Enter is pressed.
 */
export function TableFilters({
  filters,
  configs,
  values = {},
  onApply,
  onClear,
  className = '',
}: TableFiltersProps) {
  const activeFilters = filters || configs || []
  // Local draft state — committed only on Apply Filter or Enter
  const [draft, setDraft] = useState<FilterValues>(values || {})

  // Sync draft if parent values change externally (e.g. on clear)
  useEffect(() => {
    setDraft(values)
  }, [values])

  const setDraftValue = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const hasActiveFilters = Object.values(values).some(
    (v) => v && v !== 'all' && v !== '',
  )

  const hasDraftChanges = Object.keys(draft).some(
    (key) => (draft[key] ?? '') !== (values[key] ?? ''),
  )

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onApply(draft)
  }

  const handleClear = () => {
    const cleared: FilterValues = {}
    activeFilters.forEach((f) => {
      cleared[f.key] = f.options ? 'all' : ''
    })
    setDraft(cleared)
    onClear()
  }

  const searchFilter = activeFilters.find((f) => !f.options)
  const selectFilters = activeFilters.filter((f) => f.options)

  return (
    <form
      onSubmit={handleApply}
      className={`rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input (Flex 1) */}
        {searchFilter && (
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={draft[searchFilter.key] ?? ''}
              onChange={(e) => setDraftValue(searchFilter.key, e.target.value)}
              placeholder={searchFilter.placeholder ?? 'Search by name or email…'}
              className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        )}

        {/* Compact Select Dropdowns with Explicit ChevronDown Arrow Icons */}
        {selectFilters.map((filter) => {
          const value = draft[filter.key] ?? 'all'
          return (
            <div key={filter.key} className="relative w-auto min-w-[130px]">
              <select
                value={value}
                onChange={(e) => setDraftValue(filter.key, e.target.value)}
                className="w-full h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
              >
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          )
        })}

        {/* Apply Filter Button */}
        <button
          type="submit"
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 cursor-pointer ${
            hasDraftChanges ? 'ring-2 ring-blue-500/40' : ''
          }`}
        >
          <Filter size={14} />
          Apply Filter
        </button>

        {/* Clear Button */}
        {(hasActiveFilters || hasDraftChanges) && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </form>
  )
}
