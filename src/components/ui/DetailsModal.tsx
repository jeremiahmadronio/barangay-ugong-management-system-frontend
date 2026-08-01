import { type ReactNode, useEffect, useRef } from 'react'
import { XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface DetailsModalProps {
  open: boolean
  title: string
  children: ReactNode
  description?: string
  closeLabel?: string
  maxWidthClass?: string
  onClose: () => void
}

export function DetailsModal({
  open,
  title,
  children,
  description,
  closeLabel = 'Close',
  maxWidthClass = 'max-w-3xl',
  onClose,
}: DetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-xs"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative flex max-h-[calc(100vh-1.5rem)] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:max-h-[calc(100vh-3rem)]`}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <h2 id="details-modal-title" className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close details"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <XIcon size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
              {children}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              >
                {closeLabel}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
