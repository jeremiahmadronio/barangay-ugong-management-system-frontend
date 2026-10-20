import React from 'react'
import { Printer, RotateCcw, Lightbulb, FileSpreadsheet } from 'lucide-react'
import { FilterBar, FilterButton, DateField, SelectField } from './FilterBar'
import type { TemplateOptionResponse } from '@/api/modules/clearance.api'

export interface ClearanceFilterState {
  dateFrom: string
  dateTo: string
}

interface Props {
  draft: ClearanceFilterState
  onDraftChange: (next: ClearanceFilterState) => void
  onApply: () => void
  onReset: () => void
  onPrint: () => void
  onExportExcel?: () => void
  onToggleInsights?: () => void
  showInsights?: boolean
  dirty?: boolean
}

export function ClearanceReportFilters({
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
  const set = <K extends keyof ClearanceFilterState>(key: K, value: ClearanceFilterState[K]) =>
  onDraftChange({ ...draft, [key]: value })

  const hasActiveFilters =
    dirty ||
    Boolean(draft.dateFrom) ||
    Boolean(draft.dateTo)

  return (
    <FilterBar
      label="Clearance report filters"
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

          <FilterButton onClick={onPrint}>
            <Printer size={14} aria-hidden="true" />
            Print PDF
          </FilterButton>

          {onExportExcel && (
            <FilterButton onClick={onExportExcel}>
              <FileSpreadsheet size={14} className="text-emerald-600" aria-hidden="true" />
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
