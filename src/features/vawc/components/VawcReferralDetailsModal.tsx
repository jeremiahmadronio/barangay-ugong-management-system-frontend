import {
  X,
  Printer,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Share2,
} from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import type { VawcReferralResponse } from '@/api/modules/vawc.api'
import { formatDate } from '@/utils/formatters'

interface VawcReferralDetailsModalProps {
  isOpen: boolean
  referral: VawcReferralResponse | null
  onClose: () => void
  onPrint: (referral: VawcReferralResponse) => void
  onViewFile: (fileData?: string, fileName?: string) => void
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

export function VawcReferralDetailsModal({
  isOpen,
  referral,
  onClose,
  onPrint,
  onViewFile,
}: VawcReferralDetailsModalProps) {
  if (!isOpen || !referral) return null

  const feedback = referral.feedback

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">
                  {referral.referralControlNumber || 'Referral Record Details'}
                </h2>
                <Badge tone={getReferralStatusTone(referral.status)}>
                  {formatReferralStatusLabel(referral.status)}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Case {referral.caseNumber || '2026-VAWC'} • Inter-Agency Endorsement Record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Agency & Issuance Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agency Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={15} className="text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  REFERRED AGENCY / OFFICE
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {referral.referredTo}
              </h3>
              <p className="text-xs text-slate-500">
                Official External Agency / Partner Office Endorsement
              </p>
            </div>

            {/* Issuance Details Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <UserCheck size={15} className="text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  ISSUANCE DETAILS
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Issued By:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {referral.referredBy || 'VAWC Desk Officer'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Date Issued:</span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {referral.referralDate ? formatDate(referral.referralDate) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Grounds for Referral */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText size={15} className="text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                GROUNDS & REASON FOR REFERRAL
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap shadow-2xs">
              {referral.grounds || 'No specific grounds recorded.'}
            </div>
          </div>

          {/* Row 3: Agency Feedback & Outcome */}
          {feedback ? (
            <div
              className={`p-4.5 rounded-xl border space-y-3.5 ${
                feedback.declinedByAgency
                  ? 'border-rose-200 bg-rose-50/30'
                  : feedback.resolvesCase
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  {feedback.declinedByAgency ? (
                    <XCircle size={16} className="text-rose-600" />
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  )}
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    AGENCY FEEDBACK & OUTCOME
                  </span>
                </div>
                <Badge
                  tone={
                    feedback.declinedByAgency
                      ? 'rose'
                      : feedback.resolvesCase
                      ? 'emerald'
                      : 'sky'
                  }
                >
                  {feedback.declinedByAgency
                    ? 'DECLINED'
                    : feedback.resolvesCase
                    ? 'RESOLVED'
                    : 'UPDATE LOGGED'}
                </Badge>
              </div>

              {/* Feedback Narrative */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Feedback Narrative / Remarks
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {feedback.details}
                </p>
              </div>

              {/* Reason for Decline */}
              {feedback.declinedByAgency && feedback.reasonForDecline && (
                <div className="p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-950 space-y-0.5">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                    Reason for Decline
                  </span>
                  <p className="font-medium leading-relaxed">{feedback.reasonForDecline}</p>
                </div>
              )}

              {/* Uploaded File */}
              {(feedback.proofFileName || feedback.proofFileData) && (
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {feedback.proofFileName || 'Agency_Response_Notice.pdf'}
                      </p>
                      <p className="text-[11px] text-slate-400">Attached Agency Response Document</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewFile(feedback.proofFileData, feedback.proofFileName)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Eye size={13} />
                    <span>View Attached File</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 text-center space-y-1">
              <p className="text-xs font-bold text-amber-900">Awaiting Agency Feedback</p>
              <p className="text-xs text-amber-700">
                Official response from {referral.referredTo} has not been recorded yet.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPrint(referral)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={14} className="text-slate-600" />
            <span>Print Official Referral Letter</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
