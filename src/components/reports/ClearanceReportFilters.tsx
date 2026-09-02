import React from 'react'
import { Printer, RotateCcw, Lightbulb } from 'lucide-react'
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
            Print Report
          </FilterButton>
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
