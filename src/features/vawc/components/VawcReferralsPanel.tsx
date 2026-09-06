import { useState, useEffect, useCallback } from 'react'
import {
  Share2,
  Plus,
  Printer,
  Calendar,
  User,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Download,
} from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { vawcApi, type VawcReferralResponse } from '@/api/modules/vawc.api'
import { formatDate } from '@/utils/formatters'
import { generateReferralLetter } from '@/utils/generateReferralDocument'
import { VawcIssueReferralModal } from './VawcIssueReferralModal'
import { VawcReferralFeedbackModal } from './VawcReferralFeedbackModal'

export interface VawcReferralsPanelProps {
  caseId: string | number
  caseNumber: string
  caseStatus?: string
  victimName: string
  victimAddress?: string
  victimContact?: string
  respondentName: string
  respondentAddress?: string
  respondentContact?: string
  violenceType?: string
  incidentDate?: string
  incidentPlace?: string
  dateFiled?: string
  assignedOfficer?: string
  onReferralUpdated?: () => void
}

function getReferralStatusTone(status?: string): BadgeTone {
  const norm = String(status || '').toUpperCase()
  if (norm.includes('PENDING')) return 'amber'
  if (norm === 'COMPLETED' || norm === 'RESOLVED' || norm === 'SETTLED') return 'emerald'
  if (norm === 'DECLINED') return 'rose'
  return 'sky'
}

function formatReferralStatusLabel(status?: string): string {
  const norm = String(status || '').toUpperCase()
  if (norm.includes('PENDING')) return 'Referral Pending'
  if (norm === 'RESOLVED') return 'Resolved'
  if (norm === 'DECLINED') return 'Declined'
  if (norm === 'COMPLETED' || norm === 'REFERRED') return 'Referred'
  return status || 'Referral Pending'
}

export function VawcReferralsPanel({
  caseId,
  caseNumber,
  caseStatus,
  victimName,
  victimAddress,
  victimContact,
  respondentName,
  respondentAddress,
  respondentContact,
  violenceType,
  incidentDate,
  incidentPlace,
  dateFiled,
  assignedOfficer,
  onReferralUpdated,
}: VawcReferralsPanelProps) {
  const [referrals, setReferrals] = useState<VawcReferralResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [feedbackReferral, setFeedbackReferral] = useState<VawcReferralResponse | null>(null)
  const [printingId, setPrintingId] = useState<number | null>(null)
  const { showFeedback, feedbackDialogProps } = useDialogs()

  const isCaseClosed = caseStatus === 'SETTLED' || caseStatus === 'DISMISSED' || caseStatus === 'WITHDRAWN'

  const fetchReferrals = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      const data = await vawcApi.getReferrals(caseId)
      setReferrals(Array.isArray(data) ? data : [])
    } catch {
      setReferrals([])
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  const handlePrintReferral = async (refItem: VawcReferralResponse) => {
    setPrintingId(refItem.id || 0)
    try {
      await generateReferralLetter({
        caseNumber: caseNumber || refItem.caseNumber || '2026-VAWC',
        controlNumber: refItem.referralControlNumber,
        victimName: victimName || 'Complainant',
        victimAddress: victimAddress,
        victimContact,
        respondentName: respondentName || 'Respondent',
        respondentAddress: respondentAddress,
        respondentContact,
        violenceType: violenceType || 'VAWC Violation',
        referredToAgency: refItem.referredTo || 'Concerned Agency / Office',
        grounds: refItem.grounds || 'Case referred for official assistance and jurisdiction.',
        incidentDate,
        incidentPlace,
        dateFiled,
        issueDate: refItem.referralDate || refItem.createdAt || new Date(),
        assignedOfficerName: refItem.referredBy || assignedOfficer || 'VAWC Desk Officer',
      })
    } catch (err) {
      console.error('Failed to print referral letter:', err)
      showFeedback({
        variant: 'error',
        title: 'Print Failed',
        description: 'Failed to generate printable referral endorsement. Please try again.',
      })
    } finally {
      setPrintingId(null)
    }
  }

  const handleSuccess = () => {
    fetchReferrals()
    onReferralUpdated?.()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Panel Header */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                <Share2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Referrals
                  </h3>
                  {referrals.length > 0 && (
                    <Badge tone="sky">{referrals.length} {referrals.length === 1 ? 'ISSUED' : 'REFERRALS'}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official endorsements and inter-agency transfers to partner agencies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(true)}
                disabled={isCaseClosed}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                <span>Issue New Referral</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading case referral records...</p>
          </div>
        ) : referrals.length === 0 ? (
          /* Clean Empty State */
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-3.5">
              <FileText size={26} strokeWidth={1.5} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No referrals issued yet.
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              This VAWC case has not been referred to any partner agency yet. You can endorse this case to PNP, DSWD, PAO, or Court when higher-tier assistance is required.
            </p>
            {!isCaseClosed && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Issue Referral Now</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* List of Issued Referral Cards */
          <div className="space-y-4">
            {referrals.map((referralItem) => {
              const hasFeedback = Boolean(referralItem.feedback)
              return (
                <div
                  key={referralItem.id || referralItem.referralControlNumber}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4"
                >
                  {/* Top Row: Agency Name, Status, Print Button */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {referralItem.referredTo}
                        </h4>
                        {referralItem.referralControlNumber && (
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {referralItem.referralControlNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed pt-0.5">
                        {referralItem.grounds || 'No specific grounds provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start shrink-0">
                      <Badge tone={getReferralStatusTone(referralItem.status)}>
                        {formatReferralStatusLabel(referralItem.status)}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handlePrintReferral(referralItem)}
                        disabled={printingId === (referralItem.id || 0)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {printingId === (referralItem.id || 0) ? (
                          <Loader2 size={13} className="animate-spin text-blue-600" />
                        ) : (
                          <Printer size={13} className="text-slate-500" />
                        )}
                        <span>Print Letter</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row: Date & Officer */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {referralItem.referralDate ? formatDate(referralItem.referralDate) : 'Recently Issued'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      {referralItem.referredBy || assignedOfficer || 'VAWC Desk Officer'}
                    </span>
                  </div>

                  {/* Log Feedback / Agency Response Section */}
                  {!hasFeedback ? (
                    <button
                      type="button"
                      onClick={() => setFeedbackReferral(referralItem)}
                      disabled={isCaseClosed}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                      <span>Log Feedback / Agency Response</span>
                    </button>
                  ) : (
                    /* Recorded Feedback Summary Card */
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {referralItem.feedback?.declinedByAgency ? (
                            <XCircle size={15} className="text-rose-500" />
                          ) : referralItem.feedback?.resolvesCase ? (
                            <CheckCircle2 size={15} className="text-emerald-500" />
                          ) : (
                            <FileText size={15} className="text-blue-500" />
                          )}
                          <span className="text-xs font-bold text-slate-800">
                            Agency Feedback Logged
                          </span>
                          <Badge tone={referralItem.feedback?.declinedByAgency ? 'rose' : referralItem.feedback?.resolvesCase ? 'emerald' : 'sky'}>
                            {referralItem.feedback?.declinedByAgency ? 'DECLINED' : referralItem.feedback?.resolvesCase ? 'RESOLVED' : 'UPDATE LOGGED'}
                          </Badge>
                        </div>
                        {referralItem.feedback?.createdAt && (
                          <span className="text-[11px] text-slate-400">
                            {formatDate(referralItem.feedback.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {referralItem.feedback?.details}
                      </p>

                      {referralItem.feedback?.declinedByAgency && referralItem.feedback?.reasonForDecline && (
                        <div className="text-xs text-rose-800 bg-rose-50/80 p-2.5 rounded-lg border border-rose-100">
                          <span className="font-bold">Reason for Decline:</span> {referralItem.feedback.reasonForDecline}
                        </div>
                      )}

                      {referralItem.feedback?.proofFileName && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 pt-1">
                          <FileText size={13} />
                          <span className="font-semibold">{referralItem.feedback.proofFileName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Issue Referral Modal */}
      <VawcIssueReferralModal
        isOpen={isIssueModalOpen}
        caseId={caseId}
        caseNumber={caseNumber}
        partyName={victimName ? `${victimName} vs. ${respondentName || 'Respondent'}` : undefined}
        assignedOfficer={assignedOfficer}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleSuccess}
        showFeedback={showFeedback}
      />

      {/* Referral Feedback Modal */}
      {feedbackReferral && (
        <VawcReferralFeedbackModal
          isOpen={Boolean(feedbackReferral)}
          caseId={caseId}
          referralId={feedbackReferral.id || 0}
          agencyName={feedbackReferral.referredTo}
          controlNumber={feedbackReferral.referralControlNumber}
          onClose={() => setFeedbackReferral(null)}
          onSuccess={handleSuccess}
          showFeedback={showFeedback}
        />
      )}

      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
