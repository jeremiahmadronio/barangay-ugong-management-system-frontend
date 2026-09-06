import { useState, useEffect, useCallback } from 'react'
import {
  Share2,
  Plus,
  Printer,
  Building2,
  Calendar,
  UserCheck,
  FileText,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { vawcApi, type VawcReferralResponse } from '@/api/modules/vawc.api'
import { formatDate } from '@/utils/formatters'
import { generateReferralLetter } from '@/utils/generateReferralDocument'
import { VawcIssueReferralModal } from './VawcIssueReferralModal'

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
  if (norm === 'COMPLETED' || norm === 'RESOLVED') return 'emerald'
  if (norm === 'DECLINED') return 'rose'
  return 'sky'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
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
                    Case Referrals & Endorsements
                  </h3>
                  {referrals.length > 0 && (
                    <Badge tone="sky">{referrals.length} {referrals.length === 1 ? 'ISSUED' : 'REFERRALS'}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official endorsements and inter-agency transfers to PNP, DSWD, PAO, or City Prosecutor.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={isCaseClosed}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                <span>Issue Referral</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium">Checking case referral records...</p>
          </div>
        ) : referrals.length === 0 ? (
          /* Clean Empty State */
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-3.5">
              <FileText size={26} strokeWidth={1.5} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No referrals issued yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              This VAWC case has not been referred to any partner agency. You can issue a formal endorsement to PNP Women's Desk, DSWD, PAO, or Court when higher-tier assistance is required.
            </p>
            {!isCaseClosed && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
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
            {referrals.map((referralItem) => (
              <div
                key={referralItem.id || referralItem.referralControlNumber}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs space-y-0"
              >
                {/* Card Header */}
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100/80 text-sky-800">
                      <FileCheck2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-900">
                          {referralItem.referralControlNumber || 'REFERRAL ISSUED'}
                        </span>
                        <Badge tone={getReferralStatusTone(referralItem.status)}>
                          {(referralItem.status || 'REFERRED').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Case {caseNumber} officially endorsed to partner agency
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintReferral(referralItem)}
                      disabled={printingId === (referralItem.id || 0)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {printingId === (referralItem.id || 0) ? (
                        <Loader2 size={14} className="animate-spin text-blue-600" />
                      ) : (
                        <Printer size={14} className="text-slate-600" />
                      )}
                      <span>Print Official Referral Letter</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Agency Box */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 size={15} className="text-blue-600" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          REFERRED TO AGENCY / OFFICE
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {referralItem.referredTo || 'External Agency / Office'}
                      </p>
                    </div>

                    {/* Officer & Date Box */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <UserCheck size={15} className="text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          ISSUED BY & DATE
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">
                          {referralItem.referredBy || assignedOfficer || 'VAWC Desk Officer'}
                        </p>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {referralItem.referralDate ? formatDate(referralItem.referralDate) : 'Recently Issued'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grounds / Reason Box */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                      Grounds / Reason for Referral
                    </span>
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white text-xs text-slate-800 leading-relaxed">
                      <p className="whitespace-pre-wrap font-medium">
                        {referralItem.grounds || 'No specific grounds recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Section if available */}
                  {referralItem.feedback && (
                    <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          Agency Feedback & Outcome
                        </span>
                        <Badge tone={referralItem.feedback.declinedByAgency ? 'rose' : 'emerald'}>
                          {referralItem.feedback.declinedByAgency ? 'DECLINED' : 'ACTION TAKEN'}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-emerald-950 leading-relaxed">
                        {referralItem.feedback.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Referral Modal */}
      <VawcIssueReferralModal
        isOpen={isModalOpen}
        caseId={caseId}
        caseNumber={caseNumber}
        partyName={victimName ? `${victimName} vs. ${respondentName || 'Respondent'}` : undefined}
        assignedOfficer={assignedOfficer}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        showFeedback={showFeedback}
      />

      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
