import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2,
  Plus,
  Printer,
  MessageSquare,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Eye,
  FileText,
  X,
  Paperclip,
} from 'lucide-react'
import { bcpcApi, type BcpcReferral, type BcpcReferralFeedbackDTO } from '@/api/modules/bcpc.api'
import { useAuth } from '@/hooks/useAuth'
import { BcpcIssueReferralModal } from './BcpcIssueReferralModal'
import { BcpcReferralFeedbackModal } from './BcpcReferralFeedbackModal'
import { BcpcCancelReferralModal } from './BcpcCancelReferralModal'
import { printBcpcReferralLetter } from '@/utils/generateBcpcReferralLetter'

interface BcpcReferralsTabProps {
  caseId: string | number
  caseNumber?: string
  childName?: string
  childAge?: number | string
  childGender?: string
  childCategory?: string
  incidentType?: string
  onReferralIssued?: () => void
  openIssueModalOnInit?: boolean
}

export const BcpcReferralsTab: React.FC<BcpcReferralsTabProps> = ({
  caseId,
  caseNumber,
  childName,
  childAge,
  childGender,
  childCategory,
  incidentType,
  onReferralIssued,
  openIssueModalOnInit = false,
}) => {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState<BcpcReferral[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(openIssueModalOnInit)
  const [feedbackReferral, setFeedbackReferral] = useState<BcpcReferral | null>(null)
  const [cancelReferral, setCancelReferral] = useState<BcpcReferral | null>(null)

  // Document Viewer Modal
  const [viewingFile, setViewingFile] = useState<{ name: string; data: string } | null>(null)

  // Status Filter Tabs
  type ReferralFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'cancelled'
  const [statusFilter, setStatusFilter] = useState<ReferralFilter>('all')

  const counts = useMemo(() => {
    let pending = 0
    let accepted = 0
    let declined = 0
    let cancelled = 0

    referrals.forEach((r) => {
      const s = (r.status || '').toUpperCase()
      if (s === 'ACTIVE' || s === 'PENDING') pending++
      else if (s === 'ACCEPTED') accepted++
      else if (s === 'DECLINED') declined++
      else if (s === 'CANCELLED') cancelled++
    })

    return {
      all: referrals.length,
      pending,
      accepted,
      declined,
      cancelled,
    }
  }, [referrals])

  const filteredReferrals = useMemo(() => {
    if (statusFilter === 'all') return referrals
    return referrals.filter((r) => {
      const s = (r.status || '').toUpperCase()
      if (statusFilter === 'pending') return s === 'ACTIVE' || s === 'PENDING'
      if (statusFilter === 'accepted') return s === 'ACCEPTED'
      if (statusFilter === 'declined') return s === 'DECLINED'
      if (statusFilter === 'cancelled') return s === 'CANCELLED'
      return true
    })
  }, [referrals, statusFilter])

  const filterTabs = useMemo<{ id: ReferralFilter; label: string; count: number }[]>(
    () => [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'pending', label: 'Pending', count: counts.pending },
      { id: 'accepted', label: 'Accepted', count: counts.accepted },
      { id: 'declined', label: 'Declined', count: counts.declined },
      { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    ],
    [counts]
  )

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await bcpcApi.getReferrals(caseId)
      setReferrals(data || [])
    } catch (err: any) {
      console.error('Failed to load referrals:', err)
      setError(err?.message || 'Failed to load inter-agency referrals')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  const handleIssueSuccess = (newReferral: BcpcReferral) => {
    fetchReferrals()
    onReferralIssued?.()
  }

  const handleFeedbackSuccess = (updated: BcpcReferral) => {
    fetchReferrals()
    onReferralIssued?.()
  }

  const handleCancelSuccess = (cancelled: BcpcReferral) => {
    fetchReferrals()
    onReferralIssued?.()
  }

  const handlePrint = (r: BcpcReferral) => {
    // Open synchronously on user click to prevent popup blockers
    let win: Window | null = null
    try {
      win = window.open('', '_blank')
      if (win) {
        win.document.write(
          '<div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;color:#1e3a5f;">' +
            '<div style="width:36px;height:36px;border:3px solid #cbd5e1;border-top-color:#1e3a5f;border-radius:50%;animation:spin 1s linear infinite;"></div>' +
            '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>' +
            '<p style="font-size:14px;font-weight:600;">Generating Official BCPC Referral Letter...</p>' +
            '</div>'
        )
      }
    } catch {
      win = null
    }

    printBcpcReferralLetter(
      {
        controlNumber: r.referralControlNumber,
        caseNumber: caseNumber || r.caseNumber || `Case #${caseId}`,
        referralDate: r.referralDate,
        referredTo: r.referredTo,
        referredToOther: r.referredToOther,
        purpose: r.purpose,
        purposeOther: r.purposeOther,
        grounds: r.grounds,
        referredBy: r.referredBy,
        childName,
        childAge,
        childGender,
        childCategory,
        incidentType,
      },
      win
    )
  }

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatCancelledBy = (cancelledBy?: string, fallbackReferredBy?: string) => {
    const raw = (cancelledBy || '').trim()
    if (raw && raw.includes(' ') && !raw.includes('@')) {
      return raw
    }

    const userFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    if (userFullName) return userFullName
    if (user?.name && user.name.includes(' ') && !user.name.includes('@')) {
      return user.name
    }

    if (fallbackReferredBy && fallbackReferredBy.includes(' ') && !fallbackReferredBy.includes('@')) {
      return fallbackReferredBy
    }

    return 'BCPC Officer'
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Referral Pending
        </span>
      )
    }
    if (s === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Referral Accepted
        </span>
      )
    }
    if (s === 'DECLINED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Referral Declined
        </span>
      )
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Cancelled
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    )
  }

  const getAgencyDisplay = (r: BcpcReferral) => {
    if (r.referredTo === 'LSWDO') return 'Local Social Welfare and Development Office (LSWDO / CSWDO)'
    if (r.referredTo === 'PNP_WCPD') return 'PNP Women and Children Protection Desk (PNP-WCPD)'
    if (r.referredTo === 'PROSECUTOR') return "City / Provincial Prosecutor's Office"
    if (r.referredTo === 'BARANGAY_OF_RESIDENCE') return 'Barangay of Residence'
    return r.referredToOther || r.referredTo || 'Other Agency / Office'
  }

  const handleOpenFile = (fileName: string, fileData: string) => {
    try {
      let mimeType = 'application/octet-stream'
      let base64 = fileData
      if (fileData.startsWith('data:')) {
        const [header, b64] = fileData.split(',')
        mimeType = header.replace('data:', '').replace(';base64', '')
        base64 = b64
      } else {
        const name = (fileName || '').toLowerCase()
        if (name.endsWith('.pdf')) mimeType = 'application/pdf'
        else if (name.endsWith('.png')) mimeType = 'image/png'
        else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg'
      }

      const byteChars = atob(base64)
      const byteArr = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArr], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank')
      if (win) win.focus()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch {
      window.open(fileData, '_blank')
    }
  }

  if (loading && referrals.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading inter-agency referrals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {referrals.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Inter-Agency Referrals
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            No external referrals issued to LSWDO, WCPD, or rehabilitation facilities for this case yet.
          </p>
          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Issue Referral
          </button>
        </div>
      ) : (
        /* Populated List */
        <div className="space-y-4">
          {/* Filter Tabs & Issue Action */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {filterTabs.map((tab) => {
                const isSelected = statusFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                        isSelected
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              Issue Referral
            </button>
          </div>

          {/* Referrals Cards */}
          {filteredReferrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium">
                No {statusFilter === 'all' ? '' : statusFilter} referrals found for this case.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReferrals.map((r) => {
              const isActive = (r.status || '').toUpperCase() === 'ACTIVE'
              const feedbackList = r.feedbacks || []

              return (
                <section
                  key={r.id}
                  className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-6 transition-colors hover:border-slate-300"
                >
                  {/* Card Header matching Custody layout */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2
                            className={`text-sm font-semibold truncate ${
                              r.status === 'Cancelled' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {getAgencyDisplay(r)}
                          </h2>
                          {/* Colored Status Badge (without dot) */}
                          {getStatusBadge(r.status)}
                        </div>
                        {/* Reference number placed BELOW the agency name */}
                        <p className="text-xs text-slate-900 font-semibold tracking-wide mt-0.5">
                          {r.referralControlNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handlePrint(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer"
                        title="Print Formal Referral Letter"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Print Letter
                      </button>

                      {isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => setFeedbackReferral(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Log Feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelReferral(r)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-medium text-rose-600 transition shadow-2xs cursor-pointer"
                            title="Cancel Referral"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section 1: Referral Endorsement Details (Matching Custody DL typography) */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                      1. Referral Endorsement Details
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          CURRENT STATUS
                        </dt>
                        <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                          {getStatusBadge(r.status)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          REFERRED AGENCY / OFFICE
                        </dt>
                        <dd className="mt-1.5 break-words text-sm font-medium text-slate-800">
                          {getAgencyDisplay(r)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          REFERRAL PURPOSE
                        </dt>
                        <dd className="mt-1.5 break-words text-sm font-medium text-slate-800">
                          {r.purposeOther || r.purpose}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          DATE ISSUED
                        </dt>
                        <dd className="mt-1.5 break-words text-sm text-slate-700">
                          {formatDateDisplay(r.referralDate)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          REFERRED BY
                        </dt>
                        <dd className="mt-1.5 break-words text-sm text-slate-700">
                          {r.referredBy || 'BCPC Officer'}
                        </dd>
                      </div>

                      <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          GROUNDS / REASON FOR REFERRAL
                        </dt>
                        <dd className="mt-1.5 break-words text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {r.grounds || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Section 2: Agency Feedback & Assessment Records */}
                  {feedbackList.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                        2. Agency Feedback & Assessment Records
                      </h3>
                      <div className="space-y-4">
                        {feedbackList.map((fb) => (
                          <div
                            key={fb.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-4 text-xs"
                          >
                            {/* Feedback Header: Status pill + Date */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/60">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    fb.acceptedByAgency
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : fb.declinedByAgency
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {fb.acceptedByAgency
                                    ? 'Referral Accepted'
                                    : fb.declinedByAgency
                                    ? 'Referral Declined'
                                    : 'Status Update'}
                                </span>
                                {fb.feedbackTypeCode && fb.feedbackTypeCode !== 'ACKNOWLEDGEMENT_ONLY' && (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-600 border border-slate-200">
                                    {fb.feedbackTypeCode.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                Received on {formatDateDisplay(fb.dateReceived || fb.createdAt)}
                              </span>
                            </div>

                            {/* Feedback Details using exact Custody <dl> text style */}
                            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                              {fb.socialWorkerName && (
                                <div className="min-w-0">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    CASEWORKER / SOCIAL WORKER
                                  </dt>
                                  <dd className="mt-1.5 break-words text-sm font-medium text-slate-800">
                                    <span>{fb.socialWorkerName}</span>
                                    {fb.assessmentDate && (
                                      <span className="text-slate-500 font-normal ml-1.5">
                                        (Assessed on {formatDateDisplay(fb.assessmentDate)})
                                      </span>
                                    )}
                                  </dd>
                                </div>
                              )}

                              {/* Attached File (placed in grid row alongside caseworker) */}
                              {fb.proofFileData && (
                                <div className="min-w-0">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    ATTACHED FILE
                                  </dt>
                                  <dd className="mt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFile(fb.proofFileName || 'Document.pdf', fb.proofFileData!)}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                    >
                                      <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                                      View File
                                    </button>
                                  </dd>
                                </div>
                              )}

                              {fb.discernmentResult && (
                                <div className="min-w-0">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    DISCERNMENT FINDING
                                  </dt>
                                  <dd className="mt-1.5 break-words text-sm font-semibold text-slate-900">
                                    {fb.discernmentResult === 'WITH_DISCERNMENT'
                                      ? 'With Discernment'
                                      : 'Acted Without Discernment'}
                                  </dd>
                                </div>
                              )}

                              {fb.recommendationType && (
                                <div className="min-w-0">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    RECOMMENDATION / DISPOSITION
                                  </dt>
                                  <dd className="mt-1.5 break-words text-sm font-semibold text-slate-900">
                                    {fb.recommendationType.replace(/_/g, ' ')}
                                  </dd>
                                </div>
                              )}

                              {fb.declinedByAgency && fb.reasonForDecline && (
                                <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    REASON FOR DECLINE
                                  </dt>
                                  <dd className="mt-1.5 break-words text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                                    {fb.reasonForDecline}
                                  </dd>
                                </div>
                              )}

                              {fb.details &&
                                fb.details !== 'Agency accepted the referral.' &&
                                fb.details !== 'Agency status update.' && (
                                  <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      ASSESSMENT NOTES & REMARKS
                                    </dt>
                                    <dd className="mt-1.5 break-words text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {fb.details}
                                    </dd>
                                  </div>
                                )}
                            </dl>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation details if cancelled */}
                  {r.status === 'Cancelled' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">
                          Cancelled by {formatCancelledBy(r.cancelledBy, r.referredBy)}
                        </span>
                      </div>
                      {r.cancelledAt && (
                        <span className="text-slate-400 text-[11px]">{formatDateDisplay(r.cancelledAt)}</span>
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BcpcIssueReferralModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleIssueSuccess}
        caseId={caseId}
        caseNumber={caseNumber}
        childName={childName}
        childAge={childAge}
        childGender={childGender}
        childCategory={childCategory}
        incidentType={incidentType}
        existingReferrals={referrals}
      />

      <BcpcReferralFeedbackModal
        isOpen={!!feedbackReferral}
        onClose={() => setFeedbackReferral(null)}
        referral={feedbackReferral}
        onSuccess={handleFeedbackSuccess}
        isCicl={childCategory === 'CICL'}
      />

      <BcpcCancelReferralModal
        isOpen={!!cancelReferral}
        onClose={() => setCancelReferral(null)}
        referral={cancelReferral}
        onSuccess={handleCancelSuccess}
      />
    </div>
  )
}
