import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RowAction } from './types'

const TONE_TEXT: Record<NonNullable<RowAction<unknown>['tone']>, string> = {
  default: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  primary: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
  warning: 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
  danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
  emerald: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
}

interface TableActionsProps<T> {
  row: T
  actions: RowAction<T>[] | ((row: T) => RowAction<T>[])
  variant?: 'menu' | 'inline'
}

interface MenuCoords {
  top: number
  left: number
}

/**
 * Reusable per-row action control with Portal dropdown menu.
 * Uses createPortal onto document.body to completely avoid parent overflow/clipping issues.
 */
export function TableActions<T>({
  row,
  actions,
  variant = 'menu',
}: TableActionsProps<T>) {
  const actionList = typeof actions === 'function' ? actions(row) : (Array.isArray(actions) ? actions : [])
  const visible = actionList.filter((a) => Boolean(a) && !a.hidden?.(row))
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 192 // 12rem (w-48)
    const menuHeight = visible.length * 36 + 12

    let top = rect.bottom + 4
    let left = rect.right - menuWidth

    // If opening near bottom of viewport, pop above button
    if (rect.bottom + menuHeight > window.innerHeight) {
      top = Math.max(8, rect.top - menuHeight - 4)
    }

    // Keep within left viewport edge
    if (left < 8) left = 8

    setCoords({ top, left })
  }

  const handleToggle = () => {
    if (!open) {
      updatePosition()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open) return

    const handleScrollOrResize = () => setOpen(false)
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  if (visible.length === 0) return null

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-end gap-1">
        {visible.map((action) => {
          const Icon = action.icon
          const labelText = typeof action.label === 'function' ? action.label(row) : action.label
          return (
            <button
              key={action.id}
              type="button"
              title={labelText}
              aria-label={labelText}
              onClick={() => action.onClick(row)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                TONE_TEXT[action.tone ?? 'default']
              }`}
            >
              {Icon && <Icon size={17} />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer ${
          open ? 'bg-slate-100 text-slate-800' : ''
        }`}
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        coords &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 9999,
              }}
              className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/15"
            >
              {visible.map((action) => {
                const Icon = action.icon
                const labelText = typeof action.label === 'function' ? action.label(row) : action.label
                return (
                  <button
                    key={action.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      action.onClick(row)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                      TONE_TEXT[action.tone ?? 'default']
                    }`}
                  >
                    {Icon && <Icon size={16} />}
                    {labelText}
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
