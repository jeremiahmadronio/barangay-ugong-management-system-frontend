import React, { useState, useEffect, useMemo } from 'react'
import { Scale, X, Loader2, AlertCircle } from 'lucide-react'
import { officerService } from '@/config/api/officers/officer.service'
import type { LuponOfficerOption } from '@/config/api/officers/officer.types'
import { blotterService } from '@/config/api/blotter/blotter.service'

interface ReferToLuponModalProps {
  isOpen: boolean
  caseNumber: string
  caseId: string | number
  onClose: () => void
  onSuccess: () => void
  showFeedback: (props: {
    variant: 'success' | 'error' | 'warning'
    title: string
    description?: string
  }) => void
}

interface PanelMemberSelection {
  chairmanId: string
  secretaryId: string
  memberId: string
}

export function ReferToLuponModal({
  isOpen,
  caseNumber,
  caseId,
  onClose,
  onSuccess,
  showFeedback,
}: ReferToLuponModalProps) {
  const [officers, setOfficers] = useState<LuponOfficerOption[]>([])
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selections, setSelections] = useState<PanelMemberSelection>({
    chairmanId: '',
    secretaryId: '',
    memberId: '',
  })

  useEffect(() => {
    if (!isOpen) return

    setSelections({
      chairmanId: '',
      secretaryId: '',
      memberId: '',
    })

    const fetchOfficers = async () => {
      setIsLoadingOfficers(true)
      try {
        const data = await officerService.getLuponOfficers()
        setOfficers(data || [])
      } catch (err) {
        console.error('Failed to load Lupon officers:', err)
        showFeedback({
          variant: 'error',
          title: 'Officers Unavailable',
          description: 'Failed to retrieve Lupon Tagapamayapa officers list.',
        })
      } finally {
        setIsLoadingOfficers(false)
      }
    }

    fetchOfficers()
  }, [isOpen, showFeedback])

  // Filter officers strictly according to position
  const chairmanList = useMemo(() => {
    const matched = officers.filter((o) => /chairman/i.test(o.position || ''))
    return matched.length > 0 ? matched : officers
  }, [officers])

  const secretaryList = useMemo(() => {
    const matched = officers.filter((o) => /secretary/i.test(o.position || ''))
    return matched.length > 0 ? matched : officers
  }, [officers])

  const memberList = useMemo(() => {
    const matched = officers.filter((o) => /member/i.test(o.position || ''))
    return matched.length > 0 ? matched : officers
  }, [officers])

  if (!isOpen) return null

  // Duplicate Check
  const selectedIds = [selections.chairmanId, selections.secretaryId, selections.memberId].filter(Boolean)
  const hasDuplicate = new Set(selectedIds).size !== selectedIds.length
  const isComplete = Boolean(selections.chairmanId && selections.secretaryId && selections.memberId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isComplete) {
      showFeedback({
        variant: 'warning',
        title: 'Incomplete Panel',
        description: 'Please assign all 3 required Pangkat Tagapagkasundo panel members.',
      })
      return
    }

    if (hasDuplicate) {
      showFeedback({
        variant: 'warning',
        title: 'Duplicate Officer Selection',
        description: 'Each role in the 3-member Pangkat panel must be assigned to a distinct officer.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = [
        { officerId: Number(selections.chairmanId), position: 'CHAIRMAN' },
        { officerId: Number(selections.secretaryId), position: 'SECRETARY' },
        { officerId: Number(selections.memberId), position: 'MEMBER' },
      ]

      await blotterService.referToLupon(caseNumber, payload)

      showFeedback({
        variant: 'success',
        title: 'Case Escalated to Lupon',
        description: `Case ${caseNumber} has been successfully referred to Lupong Tagapamayapa.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to refer case to Lupon:', err)
      showFeedback({
        variant: 'error',
        title: 'Referral Failed',
        description: err?.message || err?.response?.data?.error || 'Failed to refer case to Lupon. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatOptionLabel = (off: LuponOfficerOption) => {
    const mid = off.middleName ? ` ${off.middleName}` : ''
    const fullName = `${off.firstName}${mid} ${off.lastName}`.trim()
    return off.position ? `${fullName} (${off.position})` : fullName
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-none">
                  Escalate / Refer Case to Lupon
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {caseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Constitution of the 3-member Pangkat Tagapagkasundo panel for conciliation hearings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Blue Notification Banner (No shield icon) */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold text-blue-950">Katarungang Pambarangay Escalation:</span> Referring this case will transition its status to{' '}
          <span className="font-semibold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">UNDER CONCILIATION</span> and assign the panel for official conciliation proceedings.
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLoadingOfficers ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading Lupon officers...</p>
            </div>
          ) : officers.length === 0 ? (
            <div className="p-5 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No active Lupon officers found.</p>
              <p className="text-slate-400 mt-0.5">Please ensure officers are registered under the Lupon department.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between pb-1">
                <span>Pangkat Tagapagkasundo Composition</span>
                <span className="text-[11px] font-medium text-slate-500 normal-case">
                  {selectedIds.length}/3 Assigned
                </span>
              </div>

              {/* Role 1: Pangkat Chairman */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-5/12">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Pangkat Chairman</h4>
                      <p className="text-[11px] text-slate-500">Tagapangulo (Presiding Officer)</p>
                    </div>
                  </div>
                </div>

                <div className="sm:w-7/12">
                  <select
                    value={selections.chairmanId}
                    onChange={(e) => setSelections((prev) => ({ ...prev, chairmanId: e.target.value }))}
                    required
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Pangkat Chairman --</option>
                    {chairmanList.map((off, idx) => (
                      <option key={`chairman-${off.officerId}-${idx}`} value={String(off.officerId)}>
                        {formatOptionLabel(off)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role 2: Pangkat Secretary */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-5/12">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Pangkat Secretary</h4>
                      <p className="text-[11px] text-slate-500">Kalihim (Minutes & Notices)</p>
                    </div>
                  </div>
                </div>

                <div className="sm:w-7/12">
                  <select
                    value={selections.secretaryId}
                    onChange={(e) => setSelections((prev) => ({ ...prev, secretaryId: e.target.value }))}
                    required
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Pangkat Secretary --</option>
                    {secretaryList.map((off, idx) => (
                      <option key={`secretary-${off.officerId}-${idx}`} value={String(off.officerId)}>
                        {formatOptionLabel(off)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role 3: Pangkat Member */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-5/12">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Pangkat Member</h4>
                      <p className="text-[11px] text-slate-500">Kagawad / Miyembro</p>
                    </div>
                  </div>
                </div>

                <div className="sm:w-7/12">
                  <select
                    value={selections.memberId}
                    onChange={(e) => setSelections((prev) => ({ ...prev, memberId: e.target.value }))}
                    required
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Pangkat Member --</option>
                    {memberList.map((off, idx) => (
                      <option key={`member-${off.officerId}-${idx}`} value={String(off.officerId)}>
                        {formatOptionLabel(off)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasDuplicate && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>An officer cannot be assigned to multiple positions in the same panel.</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isComplete || hasDuplicate || officers.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing Referral...</span>
                </>
              ) : (
                <span>Confirm Lupon Referral</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
