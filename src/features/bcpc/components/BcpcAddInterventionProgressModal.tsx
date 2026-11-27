import React, { useState, useMemo } from 'react'
import {
  X,
  ClipboardList,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type {
  BcpcIntervention,
  BcpcInterventionProgressPayload,
} from '@/config/api/bcpc/bcpc.types'
import { useAuth } from '@/hooks/useAuth'

interface BcpcAddInterventionProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedIntervention: BcpcIntervention) => void
  caseId: string | number
  caseNumber?: string
  intervention: BcpcIntervention
}

export const BcpcAddInterventionProgressModal: React.FC<
  BcpcAddInterventionProgressModalProps
> = ({ isOpen, onClose, onSuccess, caseId, caseNumber, intervention }) => {
  const { user } = useAuth()

  const officerName = useMemo(() => {
    if (!user) return 'BCPC Officer'
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (full) return full
    if (user.name && user.name.includes(' ') && !user.name.includes('@')) {
      return user.name
    }
    return user.username || 'BCPC Officer'
  }, [user])

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])
  const defaultSessionDate = useMemo(() => {
    if (intervention.startDate && todayIso < intervention.startDate) {
      return intervention.startDate
    }
    if (intervention.endDate && todayIso > intervention.endDate) {
      return intervention.endDate
    }
    return todayIso
  }, [intervention.startDate, intervention.endDate, todayIso])

  const [sessionDate, setSessionDate] = useState(defaultSessionDate)
  const [status, setStatus] = useState<string>(intervention.status || 'ONGOING')
  const [conductedBy, setConductedBy] = useState(officerName)
  const [progressNotes, setProgressNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (intervention.startDate && sessionDate < intervention.startDate) {
      setError(`Session date cannot be earlier than program start date (${intervention.startDate}).`)
      return
    }

    if (intervention.endDate && sessionDate > intervention.endDate) {
      setError(`Session date cannot be later than program target completion date (${intervention.endDate}).`)
      return
    }

    if (!progressNotes.trim()) {
      setError('Progress notes or session summary is required.')
      return
    }

    if (progressNotes.trim().length < 5) {
      setError('Progress notes must be at least 5 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: BcpcInterventionProgressPayload = {
        sessionDate,
        status,
        conductedBy: conductedBy.trim() || officerName,
        progressNotes: progressNotes.trim(),
      }

      const updated = await bcpcService.recordInterventionProgress(
        caseId,
        intervention.id,
        payload
      )
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to log progress session. Please check your connection.'
      setError(String(msg))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header matching Issue Referral design */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              Log Monitoring Session / Case Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              {caseNumber ? `Case ${caseNumber} — ` : ''}
              {intervention.programTitle}
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

        {/* Content Form matching Section Cards */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Session Details */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              1. Session & Monitoring Details
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Session Date */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Session Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={intervention.startDate || undefined}
                  max={intervention.endDate || undefined}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Program Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ONGOING">Ongoing (Active Monitoring)</option>
                  <option value="COMPLETED">Completed (Rehabilitated / Goal Met)</option>
                  <option value="REVISED">Revised (Needs Reassessment)</option>
                  <option value="TERMINATED">Terminated / Escalated</option>
                </select>
              </div>

              {/* Officer / Conducted By */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Conducted By / Officer Name
                  </label>
                  <span className="text-[10px] text-slate-400">{conductedBy.length} / 100</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={conductedBy}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-ZñÑ\s.'-]/g, '').slice(0, 100)
                    setConductedBy(clean)
                  }}
                  placeholder="e.g. Adelaida Andrada"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Progress Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              2. Session Findings & Notes
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Session Notes / Remarks <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[10px] ${
                    progressNotes.length >= 2000 ? 'text-red-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {progressNotes.length} / 2000
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={2000}
                placeholder="State the session findings, observations, and child progress..."
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Modal Actions matching Issue Referral buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 shrink-0 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !progressNotes.trim()}
              className="inline-flex items-center gap-2 py-2.5 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                'Log Progress'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
