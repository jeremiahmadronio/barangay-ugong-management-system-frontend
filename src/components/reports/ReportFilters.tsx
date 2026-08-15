import React from 'react'
import { Download, Printer, RotateCcw, Lightbulb } from 'lucide-react'
import { FilterBar, FilterButton, DateField, SelectField } from './FilterBar'

const PURPOSES = [
  'First Time Jobseeker Requirement',
  'Local Employment',
  'Employment Application',
  'Government Requirement',
  'Pre-Employment Document',
  'Other Employment Purpose',
] as const

const SEX = ['Male', 'Female'] as const

const STATUS = ['ISSUED', 'RE_ISSUANCE'] as const

const EDUCATION = [
  'Elementary',
  'Elementary Graduate',
  'High School',
  'Junior High Graduate',
  'Senior High School',
  'Senior High Graduate',
  'Vocational / TESDA',
  'Vocational Graduate',
  'College Undergraduate',
  'College Graduate',
  'Post Graduate',
] as const

export interface Filters {
  purpose: string
  sex: string
  education: string
  outcome: string
  dateFrom: string
  dateTo: string
}

export const DEFAULT_FILTERS: Filters = {
  purpose: 'All',
  sex: 'All',
  education: 'All',
  outcome: 'All',
  dateFrom: '',
  dateTo: '',
}

interface Props {
  draft: Filters
  onDraftChange: (next: Filters) => void
  onApply: () => void
  onReset: () => void
  onPrint: () => void
  onToggleInsights?: () => void
  showInsights?: boolean
  dirty?: boolean
}

export function ReportFilters({
  draft,
  onDraftChange,
  onApply,
  onReset,
  onPrint,
  onToggleInsights,
  showInsights = false,
  dirty,
}: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onDraftChange({ ...draft, [key]: value })

  const hasActiveFilters =
    dirty ||
    draft.purpose !== 'All' ||
    draft.sex !== 'All' ||
    draft.education !== 'All' ||
    draft.outcome !== 'All' ||
    Boolean(draft.dateFrom) ||
    Boolean(draft.dateTo)

  return (
    <FilterBar
      label="Report filters"
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
        allLabel="All Sexes"
        value={draft.sex}
        options={SEX}
        onChange={(v) => set('sex', v as Filters['sex'])}
      />
      <SelectField
        id="education"
        label="Educational Attainment"
        allLabel="All Education"
        value={draft.education}
        options={EDUCATION}
        onChange={(v) => set('education', v as Filters['education'])}
      />
      <SelectField
        id="outcome"
        label="Status"
        allLabel="All Statuses"
        value={draft.outcome}
        options={STATUS}
        onChange={(v) => set('outcome', v as Filters['outcome'])}
      />

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
