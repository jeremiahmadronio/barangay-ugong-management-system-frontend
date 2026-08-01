import { useEffect, useRef } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type FeedbackVariant = 'success' | 'error'

interface FeedbackDialogProps {
  open: boolean
  variant: FeedbackVariant
  title: string
  description: string
  actionLabel?: string
  onClose: () => void
}

const MARK_STYLES: Record<FeedbackVariant, string> = {
  success: 'bg-emerald-500 shadow-emerald-600/25',
  error: 'bg-rose-500 shadow-rose-600/25',
}

/**
 * Result-focused modal for successful and failed actions.
 * No decision required — only a clear outcome is shown.
 *
 * Usage:
 *   <FeedbackDialog
 *     open={isOpen}
 *     variant="success"
 *     title="Record Saved"
 *     description="The blotter record has been saved successfully."
 *     onClose={() => setIsOpen(false)}
 *   />
 */
export function FeedbackDialog({
  open,
  variant,
  title,
  description,
  actionLabel = 'Done',
  onClose,
}: FeedbackDialogProps) {
  const actionButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    actionButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const Icon = variant === 'success' ? CheckIcon : XIcon

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
            aria-label="Close result"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-slate-950/30 backdrop-blur-xs"
          />

          {/* Dialog panel */}
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            aria-describedby="feedback-description"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative mt-5 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-6 pb-6 pt-10 text-center shadow-xl shadow-slate-900/10"
          >
            {/* Icon badge */}
            <div
              className={`absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-white shadow-md ${MARK_STYLES[variant]}`}
            >
              <Icon size={23} strokeWidth={2.75} />
            </div>

            <h2
              id="feedback-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              {title}
            </h2>

            <p
              id="feedback-description"
              className="mx-auto mt-2 max-w-xs text-sm leading-5 text-slate-500"
            >
              {description}
            </p>

            <button
              ref={actionButtonRef}
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {actionLabel}
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
