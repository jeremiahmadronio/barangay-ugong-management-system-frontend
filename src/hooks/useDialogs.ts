import { useState, useCallback } from 'react'

export type ConfirmationTone = 'default' | 'warning' | 'danger' | 'emerald' | 'primary'
export type FeedbackVariant = 'success' | 'error'

export interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmationTone
  onConfirm: () => Promise<void> | void
}

export interface FeedbackOptions {
  variant: FeedbackVariant
  title: string
  description: string
  actionLabel?: string
}

/**
 * Reusable hook to manage Confirmation and Feedback dialog states
 * easily across any feature page or component.
 */
export function useDialogs() {
  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    isLoading: boolean
    options: ConfirmOptions | null
  }>({
    open: false,
    isLoading: false,
    options: null,
  })

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<{
    open: boolean
    options: FeedbackOptions | null
  }>({
    open: false,
    options: null,
  })

  /** Open confirmation dialog */
  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState({
      open: true,
      isLoading: false,
      options,
    })
  }, [])

  /** Close confirmation dialog */
  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false, isLoading: false }))
  }, [])

  /** Handle confirmation execute button */
  const handleConfirm = useCallback(async () => {
    if (!confirmState.options) return
    setConfirmState((prev) => ({ ...prev, isLoading: true }))
    try {
      await confirmState.options.onConfirm()
      setConfirmState({ open: false, isLoading: false, options: null })
    } catch {
      setConfirmState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [confirmState.options])

  /** Show feedback result popup (success or error) */
  const showFeedback = useCallback((options: FeedbackOptions) => {
    setFeedbackState({
      open: true,
      options,
    })
  }, [])

  /** Close feedback dialog */
  const closeFeedback = useCallback(() => {
    setFeedbackState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    confirm,
    showFeedback,
    confirmDialogProps: {
      open: confirmState.open,
      title: confirmState.options?.title ?? '',
      description: confirmState.options?.description ?? '',
      confirmLabel: confirmState.options?.confirmLabel,
      cancelLabel: confirmState.options?.cancelLabel,
      tone: confirmState.options?.tone,
      isLoading: confirmState.isLoading,
      onConfirm: handleConfirm,
      onCancel: closeConfirm,
    },
    feedbackDialogProps: {
      open: feedbackState.open,
      variant: feedbackState.options?.variant ?? 'success',
      title: feedbackState.options?.title ?? '',
      description: feedbackState.options?.description ?? '',
      actionLabel: feedbackState.options?.actionLabel,
      onClose: closeFeedback,
    },
  }
}
