import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

export interface RowAction {
  label: string
  onClick: () => void
  danger?: boolean
}

interface RowActionsProps {
  actions: RowAction[]
}

export function RowActions({ actions }: RowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [dropUp, setDropUp] = useState(false)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Determine if dropdown should open upward
  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 120)
    }
    setOpen((prev) => !prev)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                action.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
