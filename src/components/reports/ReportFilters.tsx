import React from 'react'
import { Filter, RotateCcw, Download, Printer, Lightbulb } from 'lucide-react'
import type { ReportFilters as Filters } from './types/ftjs'
import { PUROKS } from './data/applicants'
import { DateField, FilterBar, FilterButton, SelectField } from './FilterBar'

interface Props {
  draft: Filters
  onDraftChange: (next: Filters) => void
  onApply: () => void
  onReset: () => void
  onPrint: () => void
  onExport: () => void
  onToggleInsights?: () => void
  dirty: boolean
}

const PURPOSES = [
  'Local Employment',
  'OFW / Overseas',
  'NBI Clearance',
  'Police Clearance',
  'PSA Documents',
  'TESDA Training',
  'Other',
] as const

const EDUCATION = [
  'Elementary',
  'Junior High School',
  'Senior High School',
  'Vocational / Technical',
  'College Undergraduate',
  'College Graduate',
] as const

const CIVIL = ['Single', 'Married', 'Live-in', 'Widowed', 'Separated'] as const
const SEX = ['Female', 'Male'] as const
const OUTCOMES = ['Placed', 'In Training', 'Searching', 'No Update'] as const

export function ReportFilters({
  draft,
  onDraftChange,
  onApply,
  onReset,
  onPrint,
  onExport,
  onToggleInsights,
  dirty,
}: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onDraftChange({ ...draft, [key]: value })

  // Reset button ONLY appears when there are dirty changes or active filters
  const hasActiveFilters =
    dirty ||
    draft.purok !== 'All' ||
    draft.purpose !== 'All' ||
    draft.sex !== 'All' ||
    draft.civilStatus !== 'All' ||
    draft.education !== 'All' ||
    draft.outcome !== 'All'

  return (
    <FilterBar
      label="Report filters"
      onSubmit={onApply}
      actions={
        <>
          <FilterButton type="submit" variant="primary">
            <Filter size={14} aria-hidden="true" />
            Apply Filter
          </FilterButton>

          {/* Reset button only shows when filtered */}
          {hasActiveFilters && (
            <FilterButton onClick={onReset}>
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </FilterButton>
          )}

          {dirty && (
            <span className="text-xs font-medium text-amber-600 ml-1">
              Unapplied changes
            </span>
          )}

          <span className="ml-auto flex flex-wrap items-center gap-2">
            {onToggleInsights && (
              <FilterButton onClick={onToggleInsights}>
                <Lightbulb size={14} className="text-amber-500" aria-hidden="true" />
                Chart Insights
              </FilterButton>
            )}

            <FilterButton onClick={onExport}>
              <Download size={14} aria-hidden="true" />
              Export CSV
            </FilterButton>

            <FilterButton onClick={onPrint}>
              <Printer size={14} aria-hidden="true" />
              Print Report
            </FilterButton>
          </span>
        </>
      }
    >
      <DateField id="from" label="Date From" value={draft.dateFrom} onChange={(v) => set('dateFrom', v)} />
      <DateField id="to" label="Date To" value={draft.dateTo} onChange={(v) => set('dateTo', v)} />
      <SelectField
        id="purok"
        label="Purok / Sitio"
        allLabel="All Puroks"
        value={draft.purok}
        options={PUROKS}
        onChange={(v) => set('purok', v)}
      />
      <SelectField
        id="purpose"
        label="Purpose"
        allLabel="All Purposes"
        value={draft.purpose}
        options={PURPOSES}
        onChange={(v) => set('purpose', v as Filters['purpose'])}
      />
      <SelectField
        id="sex"
        label="Sex"
        value={draft.sex}
        options={SEX}
        onChange={(v) => set('sex', v as Filters['sex'])}
      />
      <SelectField
        id="civil"
        label="Civil Status"
        value={draft.civilStatus}
        options={CIVIL}
        onChange={(v) => set('civilStatus', v as Filters['civilStatus'])}
      />
      <SelectField
        id="educ"
        label="Educational Attainment"
        value={draft.education}
        options={EDUCATION}
        onChange={(v) => set('education', v as Filters['education'])}
      />
      <SelectField
        id="outcome"
        label="Employment Status"
        value={draft.outcome}
        options={OUTCOMES}
        onChange={(v) => set('outcome', v as Filters['outcome'])}
      />
    </FilterBar>
  )
}
