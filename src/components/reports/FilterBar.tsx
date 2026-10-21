import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterBar({
  children,
  actions,
  onSubmit,
  label = 'Report filters',
}: {
  children: React.ReactNode
  actions?: React.ReactNode
  onSubmit: () => void
  label?: string
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      aria-label={label}
      className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
    >
      {/* Single Clean Aligned Flex Row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">{children}</div>
        {actions && <div className="flex flex-wrap items-end gap-2">{actions}</div>}
      </div>
    </form>
  )
}

export function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[210px] max-w-[250px]">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 truncate" title={label}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
      />
    </div>
  )
}

export type SelectOption = string | { value: string; label: string }

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  allLabel = 'All',
  showAllOption = true,
}: {
  id: string
  label: string
  value: string
  options: readonly SelectOption[] | SelectOption[]
  onChange: (next: string) => void
  allLabel?: string
  showAllOption?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[130px] max-w-[220px]">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 truncate" title={label}>
        {label}
      </label>
      <div className="relative w-full">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
        >
          {showAllOption && <option value="All">{allLabel}</option>}
          {options.map((o) => {
            const optVal = typeof o === 'string' ? o : o.value
            const optLabel = typeof o === 'string' ? o : o.label
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            )
          })}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  )
}

type ButtonVariant = 'primary' | 'ghost' | 'outline'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs cursor-pointer border-0',
  ghost: 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/90 cursor-pointer border-0',
  outline: 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/90 cursor-pointer border-0',
}

export function FilterButton({
  children,
  variant = 'ghost',
  type = 'button',
  className,
  onClick,
}: {
  children: React.ReactNode
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type={type}
      onClick={(e) => {
        if (type === 'button') {
          e.preventDefault()
          e.stopPropagation()
        }
        onClick?.(e)
      }}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all duration-150 focus:outline-none cursor-pointer',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </button>
  )
}
