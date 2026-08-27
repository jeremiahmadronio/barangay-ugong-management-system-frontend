import type { ReactNode } from 'react'

/**
 * A single column definition for the reusable DataTable.
 *
 * @template T The shape of a single row of data.
 */
export interface Column<T> {
  /** Unique key for the column (usually a field on T). */
  key: string
  /** Header label shown in the table head. */
  header: string | ReactNode
  /**
   * Custom cell renderer. Receives the full row so you can compose
   * avatars, badges, multi-line cells, etc. Falls back to `row[key]`.
   */
  render?: (row: T) => ReactNode
  /** Optional Tailwind width/alignment classes applied to the column. */
  className?: string
  /** Horizontal alignment of the column content. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right'
  /** Hide this column on small screens. */
  hideOnMobile?: boolean
}

/** A single action available in a row's action menu / action cluster. */
export interface RowAction<T> {
  /** Stable id for the action. */
  id: string
  /** Human label (used for tooltip + menu item). */
  label: string | ((row: T) => string)
  /** Lucide icon component. */
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  /** Handler invoked with the row. */
  onClick: (row: T) => void
  /** Visual tone. Defaults to 'default'. */
  tone?: 'default' | 'primary' | 'warning' | 'danger' | 'emerald'
  /** Optionally hide the action for specific rows. */
  hidden?: (row: T) => boolean
}

/** Definition for a single filter control in the TableFilters bar. */
export interface FilterConfig {
  /** Key used in the filter values object. */
  key: string
  /** Label shown above the control. */
  label: string
  /** Optional explicit control type for older pages. */
  type?: 'search' | 'select'
  /** Placeholder for search-type filters. */
  placeholder?: string
  /**
   * If provided, renders a select with these options.
   * Otherwise the filter is treated as a free-text search input.
   */
  options?: { label: string; value: string }[]
}

/** Map of filter key -> current value. */
export type FilterValues = Record<string, string>
