import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, SearchIcon } from 'lucide-react'

export interface SearchSelectOption {
  id: string
  label: string
  description?: string
  data?: any
}

interface SearchSelectProps {
  label: string
  options: SearchSelectOption[]
  value: string
  placeholder?: string
  required?: boolean
  emptyMessage?: string
  labelClassName?: string
  inputClassName?: string
  onChange: (value: string) => void
  onSelect: (option: SearchSelectOption) => void
  onSearchQueryChange?: (query: string) => void
}

/**
 * Reusable search-and-select field for long forms. It accepts any option list,
 * filters locally or fetches dynamically from backend, and confirms selection.
 */
export function SearchSelect({
  label,
  options,
  value,
  placeholder = 'Search…',
  required = false,
  emptyMessage = 'No matching results found.',
  labelClassName = 'block text-xs font-semibold text-slate-700 mb-1',
  inputClassName,
  onChange,
  onSelect,
  onSearchQueryChange,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const matchingOptions = useMemo(() => {
    if (onSearchQueryChange) {
      // Dynamic search powered directly by backend API response
      return options
    }
    const query = value.trim().toLowerCase()
    if (!query) return options.slice(0, 10)
    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(query)
    )
  }, [options, value, onSearchQueryChange])

  const selectedOption = options.find((option) => option.label === value)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const defaultInputCls =
    'w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-200 focus:border-slate-400 rounded-xl outline-none focus:outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white'

  return (
    <div ref={rootRef} className="relative">
      <label className={labelClassName}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <SearchIcon
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          required={required}
          value={value}
          onFocus={() => {
            setOpen(true)
            if (onSearchQueryChange && options.length === 0) {
              onSearchQueryChange(value)
            }
          }}
          onChange={(event) => {
            const val = event.target.value
            onChange(val)
            onSearchQueryChange?.(val)
            setOpen(true)
          }}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-select-results"
          className={inputClassName || defaultInputCls}
        />
      </div>

      {open && (
        <div
          id="search-select-results"
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/15 text-xs"
        >
          {matchingOptions.length > 0 ? (
            matchingOptions.map((option, index) => (
              <button
                key={`${option.id}_${index}`}
                type="button"
                role="option"
                aria-selected={option.label === value}
                onClick={() => {
                  onSelect(option)
                  setOpen(false)
                }}
                className="flex w-full items-start justify-between px-3.5 py-2 text-left hover:bg-blue-50/70 focus:bg-blue-50 focus:outline-none transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">{option.label}</div>
                  {option.description && (
                    <div className="text-[11px] text-slate-500">{option.description}</div>
                  )}
                </div>
                {option.label === value && (
                  <CheckIcon size={14} className="mt-0.5 text-blue-600 shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3.5 py-2.5 text-slate-400 font-medium">{emptyMessage}</div>
          )}
        </div>
      )}

      {selectedOption && (
        <p className="mt-1 text-[11px] text-slate-500 font-medium">
          Selected: <span className="font-semibold text-blue-600">{selectedOption.label}</span>
        </p>
      )}
    </div>
  )
}
