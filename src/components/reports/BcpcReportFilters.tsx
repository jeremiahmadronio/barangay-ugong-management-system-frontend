import React from 'react'
import { Printer, RotateCcw, Lightbulb, FileSpreadsheet } from 'lucide-react'
import { FilterBar, FilterButton, DateField } from './FilterBar'

export interface BcpcFilterState {
  dateFrom: string
  dateTo: string
}

interface Props {
  draft: BcpcFilterState
  onDraftChange: (next: BcpcFilterState) => void
  onApply: () => void
  onReset: () => void
  onPrint?: () => void
  onExportExcel?: () => void
  onToggleInsights?: () => void
  showInsights?: boolean
  dirty?: boolean
}

export function BcpcReportFilters({
  draft,
  onDraftChange,
  onApply,
  onReset,
  onPrint,
  onExportExcel,
  onToggleInsights,
  showInsights = false,
  dirty,
}: Props) {
  const set = <K extends keyof BcpcFilterState>(key: K, value: BcpcFilterState[K]) =>
    onDraftChange({ ...draft, [key]: value })

  const hasActiveFilters = dirty || Boolean(draft.dateFrom) || Boolean(draft.dateTo)

  return (
    <FilterBar
      label="BCPC report filters"
      onSubmit={onApply}
      actions={
        <>
          {onToggleInsights && (
            <FilterButton onClick={onToggleInsights} variant="ghost">
              <Lightbulb
                size={14}
                className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'}
                aria-hidden="true"
              />
              {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
            </FilterButton>
          )}

          {onPrint && (
            <FilterButton onClick={onPrint}>
              <Printer size={14} aria-hidden="true" />
              Print Report
            </FilterButton>
          )}

          {onExportExcel && (
            <FilterButton
              onClick={onExportExcel}
              className="hover:bg-emerald-50/80 hover:text-emerald-700 transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
              Export Excel
            </FilterButton>
          )}
        </>
      }
    >
      <DateField id="from" label="Date From" value={draft.dateFrom} onChange={(v) => set('dateFrom', v)} />
      <DateField id="to" label="Date To" value={draft.dateTo} onChange={(v) => set('dateTo', v)} />

      <FilterButton type="submit" variant="primary">
        Apply Filters
      </FilterButton>

      {hasActiveFilters && (
        <FilterButton onClick={onReset} variant="outline">
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </FilterButton>
      )}
    </FilterBar>
  )
}

