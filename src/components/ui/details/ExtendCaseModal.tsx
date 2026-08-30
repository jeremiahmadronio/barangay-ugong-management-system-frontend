import React, { useState } from 'react'
import { X, CalendarPlus, AlertCircle, Loader2, Info } from 'lucide-react'

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
      setError('Please provide a reason or justification for extending the case period.')
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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarPlus size={17} className="text-blue-600" />
              Extend {isConciliation ? 'Conciliation' : 'Mediation'} Period (+15 Days)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : 'Extend Case Duration'}
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setError(null)
              setReason('')
              onClose()
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Statutory Policy Notice */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950">Katarungang Pambarangay (RA 7160) Rule</p>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                The standard 15-day period may be extended for an additional <strong>15 days</strong> for valid reasons or upon mutual agreement of the parties. 
                <span className="font-semibold text-blue-950"> Note: Each case can only be granted an extension once.</span>
              </p>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason / Justification for Extension <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError(null)
              }}
              placeholder="State the reason or justification for extending the 15-day period (e.g., ongoing negotiations between parties, agreed hearing postponement, waiting for additional witness statement)..."
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
              onClick={() => {
                setError(null)
                setReason('')
                onClose()
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Extending…' : 'Confirm 15-Day Extension'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
