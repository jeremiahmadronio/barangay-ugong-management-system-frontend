import React, { useState } from 'react'
import { X, AlertCircle, Loader2 } from 'lucide-react'

interface ExtendCaseModalProps {
  isOpen: boolean
  caseNumber?: string
  isConciliation?: boolean
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
}

export function ExtendCaseModal({
  isOpen,
  caseNumber,
  isConciliation = false,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ExtendCaseModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason for the extension.')
      return
    }
    setError(null)
    try {
      await onConfirm(reason.trim())
      setReason('')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to extend case period.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Extend {isConciliation ? 'Conciliation' : 'Mediation'} Period
            </h2>
            {caseNumber && (
              <p className="text-xs text-slate-500 mt-0.5">Case {caseNumber} · +15 days</p>
            )}
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { setError(null); setReason(''); onClose() }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason for Extension <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError(null) }}
              placeholder="State the reason for extending the case period..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => { setError(null); setReason(''); onClose() }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Extending…' : 'Confirm Extension'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
