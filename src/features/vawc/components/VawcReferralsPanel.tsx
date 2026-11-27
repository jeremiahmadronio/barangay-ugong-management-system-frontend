import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Printer,
  Building2,
  Calendar,
  UserCheck,
  FileText,
  FileCheck2,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquarePlus,
} from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useAuth } from '@/hooks/useAuth'
import { useDialogs } from '@/hooks/useDialogs'
import { vawcApi, type VawcReferralResponse } from '@/config/api/modules/vawc.api'
import { formatDate } from '@/utils/formatters'
import { generateReferralLetter } from '../generateReferralDocument'
import { VawcIssueReferralModal } from './VawcIssueReferralModal'
import { VawcReferralFeedbackModal } from './VawcReferralFeedbackModal'
import { VawcReferralDetailsModal } from './VawcReferralDetailsModal'

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
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'

  const [referrals, setReferrals] = useState<VawcReferralResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [feedbackReferral, setFeedbackReferral] = useState<VawcReferralResponse | null>(null)
  const [detailsReferral, setDetailsReferral] = useState<VawcReferralResponse | null>(null)
  const [printingId, setPrintingId] = useState<number | null>(null)
  const { showFeedback, feedbackDialogProps } = useDialogs()

  const isCaseClosed = caseStatus === 'SETTLED' || caseStatus === 'DISMISSED' || caseStatus === 'WITHDRAWN'

  const fetchReferrals = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      const data = await vawcApi.getReferrals(caseId)
      const list = Array.isArray(data) ? [...data] : []
      list.sort((a, b) => {
        const timeA = new Date(a.referralDate || a.createdAt || 0).getTime()
        const timeB = new Date(b.referralDate || b.createdAt || 0).getTime()
        if (timeB !== timeA) return timeB - timeA
        return (b.id || 0) - (a.id || 0)
      })
      setReferrals(list)
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

  const handleViewFeedbackFile = (fileData?: string, fileName?: string) => {
    if (!fileData || fileData.trim() === '' || fileData === 'null' || fileData === 'undefined') {
      showFeedback({
        variant: 'error',
        title: 'File Not Available',
        description: 'No attached document data found for this record. Please click "Update Feedback" to upload the file.',
      })
      return
    }
    try {
      let cleanData = fileData.trim()
      let mimeType = 'application/pdf'

      if (cleanData.startsWith('data:')) {
        const mimeMatch = cleanData.match(/^data:([^;]+);base64,/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
        cleanData = cleanData.split(',')[1] || cleanData
      } else {
        const lowerName = (fileName || '').toLowerCase()
        if (lowerName.endsWith('.png')) mimeType = 'image/png'
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mimeType = 'image/jpeg'
        else mimeType = 'application/pdf'
      }

      const byteCharacters = atob(cleanData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      const fileUrl = URL.createObjectURL(blob)

      const win = window.open(fileUrl, '_blank')
      if (!win) {
        const a = document.createElement('a')
        a.href = fileUrl
        a.download = fileName || 'referral_document.pdf'
        a.click()
      }
    } catch (err) {
      console.error('Failed to preview file:', err)
        showFeedback({
          variant: 'error',
          title: 'File Preview Failed',
          description: 'Failed to open the attached document. Please try re-uploading the file via "Update Feedback".',
        })
      }
    }

    const handleSuccess = () => {
      fetchReferrals()
      onReferralUpdated?.()
    }

  const sortedReferrals = [...referrals].sort((a, b) => {
    const getSuffixNum = (item: VawcReferralResponse) => {
      const match = String(item.referralControlNumber || '').match(/-(\d+)$/)
      if (match) return parseInt(match[1], 10)
      return Number(item.id) || 0
    }
    const numA = getSuffixNum(a)
    const numB = getSuffixNum(b)
    if (numB !== numA) return numB - numA

    const timeA = new Date(a.createdAt || a.referralDate || 0).getTime()
    const timeB = new Date(b.createdAt || b.referralDate || 0).getTime()
    if (timeB !== timeA) return timeB - timeA

    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })

  return (
    <>
      <div className="space-y-6">
        {/* Content Area */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-xs font-medium">Checking case referral records...</p>
          </div>
        ) : sortedReferrals.length === 0 ? (
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
            {!isSystemAdmin && !isCaseClosed && (
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
            {!isSystemAdmin && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Referral Records ({sortedReferrals.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  disabled={isCaseClosed}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Issue Referral</span>
                </button>
              </div>
            )}
            {sortedReferrals.map((referralItem) => (
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
                          {formatReferralStatusLabel(referralItem.status)}
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
                      onClick={() => setDetailsReferral(referralItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Eye size={14} className="text-slate-500" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintReferral(referralItem)}
                      disabled={printingId === (referralItem.id || 0)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
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

                  {/* Feedback Section */}
                  {referralItem.feedback ? (
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      referralItem.feedback.declinedByAgency
                        ? 'border-rose-200/80 bg-rose-50/30'
                        : referralItem.feedback.resolvesCase
                        ? 'border-emerald-200/80 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {referralItem.feedback.declinedByAgency ? (
                            <XCircle size={16} className="text-rose-600" />
                          ) : (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          )}
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            AGENCY FEEDBACK & OUTCOME
                          </span>
                          <Badge tone={referralItem.feedback.declinedByAgency ? 'rose' : referralItem.feedback.resolvesCase ? 'emerald' : 'sky'}>
                            {referralItem.feedback.declinedByAgency ? 'DECLINED' : referralItem.feedback.resolvesCase ? 'RESOLVED' : 'UPDATE LOGGED'}
                          </Badge>
                        </div>

                        {!isSystemAdmin && !isCaseClosed && (
                          <button
                            type="button"
                            onClick={() => setFeedbackReferral(referralItem)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                          >
                            Update Feedback
                          </button>
                        )}
                      </div>

                      <p className="text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {referralItem.feedback.details}
                      </p>

                      {/* If declined, show reason */}
                      {referralItem.feedback.declinedByAgency && referralItem.feedback.reasonForDecline && (
                        <div className="p-3 bg-white rounded-lg border border-rose-100 text-xs text-rose-900 space-y-0.5">
                          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                            Reason for Decline
                          </span>
                          <p className="font-medium">{referralItem.feedback.reasonForDecline}</p>
                        </div>
                      )}

                      {/* If file uploaded */}
                      {(referralItem.feedback.proofFileName || referralItem.feedback.proofFileData) && (
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText size={18} className="text-blue-600 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {referralItem.feedback.proofFileName || 'Agency_Response_Notice.pdf'}
                              </p>
                              <p className="text-[10px] text-slate-400">Attached Agency File</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewFeedbackFile(referralItem.feedback?.proofFileData, referralItem.feedback?.proofFileName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View Attached File</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Awaiting feedback box + Log Feedback button */
                    <div className="p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-amber-900">Awaiting Agency Feedback</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Referral is pending response from {referralItem.referredTo}.
                        </p>
                      </div>

                      {!isSystemAdmin && !isCaseClosed && (
                        <button
                          type="button"
                          onClick={() => setFeedbackReferral(referralItem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          <MessageSquarePlus size={14} />
                          <span>Record Agency Feedback</span>
                        </button>
                      )}
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
        isOpen={isIssueModalOpen}
        caseId={caseId}
        caseNumber={caseNumber}
        partyName={victimName ? `${victimName} vs. ${respondentName || 'Respondent'}` : undefined}
        assignedOfficer={assignedOfficer}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={handleSuccess}
        showFeedback={showFeedback}
      />

      {/* Record / Update Referral Feedback Modal */}
      <VawcReferralFeedbackModal
        isOpen={!!feedbackReferral}
        caseId={caseId}
        referral={feedbackReferral}
        onClose={() => setFeedbackReferral(null)}
        onSuccess={handleSuccess}
        showFeedback={showFeedback}
      />

      {/* View Referral Details Modal */}
      <VawcReferralDetailsModal
        isOpen={!!detailsReferral}
        referral={detailsReferral}
        onClose={() => setDetailsReferral(null)}
        onPrint={handlePrintReferral}
        onViewFile={handleViewFeedbackFile}
      />

      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
