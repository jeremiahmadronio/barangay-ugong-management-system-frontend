import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type ConfirmationTone = 'default' | 'primary' | 'warning' | 'danger' | 'emerald' | 'rose' | 'sky'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmationTone
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const CONFIRM_BUTTON_STYLES: Record<ConfirmationTone, string> = {
  default: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 focus:ring-blue-500',
  primary: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 focus:ring-blue-500',
  sky: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20 focus:ring-sky-500',
  warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 focus:ring-amber-400',
  danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 focus:ring-rose-500',
  rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 focus:ring-rose-500',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus:ring-emerald-500',
}

/**
 * Confirmation dialog for destructive or consequential actions.
 * Focuses the cancel button by default for safety.
 *
 * Usage:
 *   <ConfirmationDialog
 *     open={isOpen}
 *     title="Delete Record"
 *     description="This action cannot be undone. Are you sure?"
 *     tone="danger"
 *     confirmLabel="Yes, Delete"
 *     isLoading={isDeleting}
 *     onConfirm={handleDelete}
 *     onCancel={() => setIsOpen(false)}
 *   />
 */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isLoading, onCancel, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close confirmation"
            onClick={!isLoading ? onCancel : undefined}
            disabled={isLoading}
            className="absolute inset-0 cursor-default bg-slate-950/30 backdrop-blur-xs"
          />

          {/* Dialog panel */}
          <motion.section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
          >
            <div className="px-6 pb-5 pt-6">
              <h2
                id="confirmation-title"
                className="text-base font-semibold text-slate-900"
              >
                {title}
              </h2>
              <p
                id="confirmation-description"
                className="mt-2 text-sm leading-5 text-slate-500"
              >
                {description}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${CONFIRM_BUTTON_STYLES[tone]}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
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
                    Processing…
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
