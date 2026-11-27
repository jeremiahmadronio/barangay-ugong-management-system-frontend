import React, { useState, useMemo } from 'react'
import {
  X,
  Ban,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type { BcpcReferral, BcpcReferralCancelPayload } from '@/config/api/bcpc/bcpc.types'
import { useAuth } from '@/hooks/useAuth'

interface BcpcCancelReferralModalProps {
  isOpen: boolean
  onClose: () => void
  referral: BcpcReferral | null
  onSuccess: (cancelled: BcpcReferral) => void
}

export const BcpcCancelReferralModal: React.FC<BcpcCancelReferralModalProps> = ({
  isOpen,
  onClose,
  referral,
  onSuccess,
}) => {
  const { user } = useAuth()
  const loggedInOfficerName = useMemo(() => {
    if (!user) return 'BCPC Officer'
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (full) return full
    if (user.name && user.name.includes(' ') && !user.name.includes('@')) {
      return user.name
    }
    return 'BCPC Officer'
  }, [user])

  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !referral) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!reason.trim()) {
      setError('Please provide a specific reason for cancelling this referral.')
      return
    }

    if (reason.trim().length < 5) {
      setError('Cancellation reason must be at least 5 characters.')
      return
    }

    try {
      setLoading(true)
      const payload: BcpcReferralCancelPayload = {
        cancellationReason: reason.trim(),
        cancelledBy: loggedInOfficerName,
      }

      const res = await bcpcService.cancelReferral(referral.caseId, referral.id, payload)
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to cancel referral. Please check backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ban size={18} className="text-red-600" />
              Cancel Referral Endorsement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control No: {referral.referralControlNumber} · {referral.referredToOther || referral.referredTo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              Warning on Legal Record
            </p>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Cancelling will update this referral's status to <strong>Cancelled</strong>. The record and timeline entry will remain preserved for transparency and accountability.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] tabular-nums ${reason.length >= 500 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                {reason.length} / 500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the official reason (e.g. Issued by administrative error, Case amicably resolved prior to transmission, child relocated)..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer matching Custody modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep Referral
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

