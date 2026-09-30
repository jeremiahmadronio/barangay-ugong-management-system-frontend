import { type ReactNode, useEffect, useRef } from 'react'
import { XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export type FormModalSubmitTone = 'blue' | 'emerald' | 'amber' | 'rose'

const SUBMIT_BUTTON_STYLES: Record<FormModalSubmitTone, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 focus:ring-blue-500',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus:ring-emerald-500',
  amber: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 focus:ring-amber-400',
  rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 focus:ring-rose-500',
}

interface FormModalProps {
  open: boolean
  title: string
  submitLabel: string
  children: ReactNode
  isSubmitting?: boolean
  submitDisabled?: boolean
  maxWidthClass?: string
  submitTone?: FormModalSubmitTone
  onClose: () => void
  onSubmit: () => void
}

/**
 * Reusable long-form modal shell. It keeps the header and actions visible
 * while the form body scrolls, so any feature can provide only its own fields.
 */
export function FormModal({
  open,
  title,
  submitLabel,
  children,
  isSubmitting = false,
  submitDisabled = false,
  maxWidthClass = 'max-w-4xl',
  submitTone = 'blue',
  onClose,
  onSubmit,
}: FormModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onCloseRef.current()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isSubmitting, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close form"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-xs"
          />

          {/* Modal content */}
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative flex max-h-[calc(100vh-1.5rem)] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:max-h-[calc(100vh-3rem)]`}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <h2 id="form-modal-title" className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close form"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <XIcon size={20} />
              </button>
            </header>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
                {children}
              </div>
              <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitDisabled}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${SUBMIT_BUTTON_STYLES[submitTone]}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    submitLabel
                  )}
                </button>
              </footer>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
