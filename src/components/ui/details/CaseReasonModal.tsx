import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export interface CaseReasonModalProps {
  open: boolean
  title: string
  label?: string
  caseNumber?: string
  caseLabel?: string
  placeholder?: string
  confirmLabel?: string
  confirmTone?: 'blue' | 'rose' | 'amber' | 'emerald'
  maxLength?: number
  isLoading?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

const BUTTON_TONE_STYLES = {
  blue: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20 focus:ring-blue-500',
  rose: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20 focus:ring-rose-500',
  amber: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20 focus:ring-amber-500',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20 focus:ring-emerald-500',
}

export function CaseReasonModal({
  open,
  title,
  label = 'Reason',
  caseNumber,
  caseLabel,
  placeholder = 'Provide a reason for this status change...',
  confirmLabel = 'Confirm',
  confirmTone = 'blue',
  maxLength = 1000,
  isLoading = false,
  onConfirm,
  onCancel,
}: CaseReasonModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || isLoading) return
    onConfirm(reason.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 leading-none">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {caseNumber && (
            <p className="text-sm text-slate-500 font-normal">
              Updating <span className="font-bold text-slate-900">{caseNumber}</span>
              {caseLabel && <span className="text-slate-400"> ({caseLabel})</span>}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {label} <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-3 bg-white">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, maxLength))}
                rows={4}
                required
                disabled={isLoading}
                placeholder={placeholder}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none bg-transparent"
              />
            </div>
            <div className="text-xs text-slate-400 text-right mt-1.5 font-medium">
              {reason.length} / {maxLength}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 -mx-6 -mb-6 px-6 py-4 bg-slate-50/60 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isLoading}
              className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_TONE_STYLES[confirmTone]}`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
