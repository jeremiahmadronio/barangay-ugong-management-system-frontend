import { useCallback, useEffect, useState } from 'react'
import {
  FileText,
  Share2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit3,
} from 'lucide-react'
import {
  DetailActionButton,
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailCaseOverview,
  DetailQuickActionCards,
  DetailTimelinePanel,
  DetailInfoCard,
  DetailCaseNotesPanel,
  DetailMediationBanner,
  type DetailTab,
  type DetailTimelineItem,
  type QuickActionCardItem,
} from '@/components/ui/details'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { vawcApi, type VawcCaseDetailResponse } from '@/api/modules/vawc.api'
import { axiosInstance, API_BASE_URL } from '@/config/api/axios.config'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatEnumLabel } from '@/utils/formatters'
import { generateBpoCertificate } from '@/utils/generateBpoDocument'
import { VawcBpoManagementPanel } from './VawcBpoManagementPanel'
import { VawcReferralsPanel } from './VawcReferralsPanel'
import { VawcEditCaseModal } from './VawcEditCaseModal'

export interface VawcCaseDetailsViewProps {
  caseId: string | number
  onBack: () => void
  onEdit?: () => void
  refreshKey?: number
}

const TERMINAL_STATUSES = new Set([
  'SETTLED',
  'DISMISSED',
  'WITHDRAWN',
  'RESOLVED',
  'CERTIFIED_TO_FILE_ACTION',
  'CFA_ISSUED',
  'EXPIRED_UNACTIONED',
  'EXPIRED',
])

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'SETTLED' || normalized === 'RESOLVED') return 'emerald'
  if (normalized === 'DISMISSED' || normalized === 'WITHDRAWN' || normalized === 'DECLINED_REFERRAL' || normalized.includes('DECLINE')) return 'rose'
  if (normalized.includes('REFERRAL')) return 'sky'
  if (normalized.includes('BPO') || normalized.includes('ISSUED') || normalized.includes('SERVED')) return 'indigo'
  if (normalized.includes('MEDIATION') || normalized.includes('CONCILIATION')) return 'indigo'
  return 'amber'
}

function getRiskTone(riskLevel?: string | null): BadgeTone {
  const normalized = String(riskLevel || '').toUpperCase()
  if (normalized.includes('HIGH')) return 'rose'
  if (normalized.includes('MODERATE')) return 'amber'
  return 'emerald'
}

function formatDisplayDate(value?: string | null) {
  if (!value) return '—'
  if (/^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$/.test(value)) return value
  return formatDate(value)
}

export function VawcCaseDetailsView({
  caseId,
  onBack,
  onEdit,
}: VawcCaseDetailsViewProps) {
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'

  const [detail, setDetail] = useState<VawcCaseDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { showFeedback, feedbackDialogProps } = useDialogs()

  const fetchDetail = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      const data = await vawcApi.getById(caseId)
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleViewFile = useCallback(async (fileUrl?: string, fileTitle?: string) => {
    if (!fileUrl) return
    try {
      if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
        window.open(fileUrl, '_blank')
        return
      }

      const resolvedUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `${API_BASE_URL}${fileUrl}`

      const response = await axiosInstance.get(resolvedUrl, { responseType: 'blob' })
      const contentType = (response.headers['content-type'] as string) || 'application/octet-stream'
      const blob = new Blob([response.data], { type: contentType })
      const blobUrl = URL.createObjectURL(blob)

      const win = window.open(blobUrl, '_blank')
      if (!win) {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileTitle || 'file'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to view file:', err)
      showFeedback({
        variant: 'error',
        title: 'Preview Unavailable',
        description: 'Unable to preview file. Please ensure backend server is running.',
      })
    }
  }, [showFeedback])

  const dangerAssessmentsList: string[] = (() => {
    if (!detail?.dangerAssessments) return []
    try {
      const parsed = JSON.parse(detail.dangerAssessments)
      return Array.isArray(parsed) ? parsed : [detail.dangerAssessments]
    } catch {
      return detail.dangerAssessments.split(',').map((s) => s.trim()).filter(Boolean)
    }
  })()

  const immediateRequestsList: string[] = (() => {
    if (!detail?.immediateRequests) return []
    try {
      const parsed = JSON.parse(detail.immediateRequests)
      return Array.isArray(parsed) ? parsed : [detail.immediateRequests]
    } catch {
      return detail.immediateRequests.split(',').map((s) => s.trim()).filter(Boolean)
    }
  })()

  const isCaseClosed = TERMINAL_STATUSES.has(String(detail?.caseStatus || '').toUpperCase())

  // 15-Day BPO Monitoring Calculation
  const bpoActivatedDate = detail?.bpo?.activatedAt || detail?.dateFiled
  const bpoExpiryDate = detail?.bpo?.expiredAt || (bpoActivatedDate ? new Date(new Date(bpoActivatedDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() : undefined)

  const bpoDaysRemaining = (() => {
    if (!bpoExpiryDate) return 15
    const now = new Date().getTime()
    const exp = new Date(bpoExpiryDate).getTime()
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, Math.min(15, diff))
  })()

  const isReferred = String(detail?.caseStatus || '').toUpperCase().includes('REFERRAL')
  const isBpoActive = Boolean(detail?.bpo?.activatedAt || detail?.bpo?.status === 'ISSUED' || detail?.bpo?.status === 'SERVED')
  const isBpoTerminated = detail?.bpo?.status === 'CLOSED' || detail?.bpo?.status === 'EXPIRED' || detail?.bpo?.status === 'REVOKED'
  const showBpoMonitoringBanner = isBpoActive && !isBpoTerminated && !isCaseClosed && !isReferred

  const quickActions: QuickActionCardItem[] = [
    {
      id: 'refer',
      title: 'Issue Referral',
      subtitle: 'Refer to DSWD / PNP / Court',
      icon: Share2,
      onClick: () => {
        setActiveTab('referrals')
      },
    },
    {
      id: 'bpo',
      title: 'Issue BPO',
      subtitle: 'Barangay Protection Order',
      icon: ShieldAlert,
      onClick: () => {
        setActiveTab('bpo')
      },
    },
    {
      id: 'settle',
      title: 'Mark as Settled',
      subtitle: 'Record settlement agreement',
      icon: CheckCircle2,
      onClick: () => {
        // Can integrate with status settlement modal
      },
    },
    {
      id: 'dismiss',
      title: 'Dismiss Case',
      subtitle: 'Complainant withdrew',
      icon: XCircle,
      onClick: () => {
        // Can integrate with dismissal modal
      },
    },
  ]

  const timelineItems: DetailTimelineItem[] = [
    {
      id: 'initial-intake',
      title: 'VAWC Case Filed',
      description: `Intake recorded by ${detail?.assignedOfficer || detail?.assignedOfficerName || 'VAWC Desk Officer'}. Risk assessment categorized as ${detail?.riskLevel || 'LOW'}.`,
      timestamp: formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled),
      performedBy: detail?.assignedOfficer || detail?.assignedOfficerName || 'VAWC Desk Officer',
    },
  ]

  const [notesCount, setNotesCount] = useState<number | undefined>(undefined)

  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Quick Actions Panel - Hidden when system admin or case is Settled, Dismissed, Withdrawn, or Closed */}
          {!isSystemAdmin && !isCaseClosed && <DetailQuickActionCards actions={quickActions} />}

          {/* 15-Day BPO Monitoring Period Banner (Active while BPO is active; stops/disappears when referred or closed) */}
          {showBpoMonitoringBanner && (
            <DetailMediationBanner
              title="15-Day Monitoring Period"
              daysRemaining={bpoDaysRemaining}
              totalDays={15}
              filedDate={formatDisplayDate(bpoActivatedDate)}
              deadlineDate={formatDisplayDate(bpoExpiryDate)}
            />
          )}

          {/* Settled / Dismissed / Withdrawn Status Banners */}
          {String(detail?.caseStatus || '').toUpperCase() === 'SETTLED' && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  Settlement Agreement Terms
                </span>
                <Badge tone="emerald">SETTLED</Badge>
              </div>
              <p className="text-sm font-medium text-emerald-950 leading-relaxed">
                {detail?.caseStatusRemarks || 'Case resolved and settlement terms agreed.'}
              </p>
            </div>
          )}

          {String(detail?.caseStatus || '').toUpperCase() === 'DISMISSED' && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                  Reason for Dismissal
                </span>
                <Badge tone="rose">DISMISSED</Badge>
              </div>
              <p className="text-sm font-medium text-rose-950 leading-relaxed">
                {detail?.caseStatusRemarks || 'No remarks recorded.'}
              </p>
            </div>
          )}

          {String(detail?.caseStatus || '').toUpperCase() === 'WITHDRAWN' && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                  Case Withdrawn
                </span>
                <Badge tone="rose">WITHDRAWN</Badge>
              </div>
              <p className="text-sm font-medium text-rose-950 leading-relaxed">
                {detail?.caseStatusRemarks || 'Case formally withdrawn by the complainant.'}
              </p>
            </div>
          )}

          {String(detail?.caseStatus || '').toUpperCase() === 'DECLINED_REFERRAL' && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                  Referral Declined by Partner Agency
                </span>
                <Badge tone="rose">DECLINED REFERRAL</Badge>
              </div>
              <p className="text-sm font-medium text-rose-950 leading-relaxed">
                {detail?.caseStatusRemarks || 'The referral was declined by the partner agency. You may review the referral tab or issue a new endorsement.'}
              </p>
            </div>
          )}

          {/* Emergency Alert Banner (Only shown if case is assessed as High / Imminent Danger) */}
          {String(detail?.riskLevel || '').toUpperCase().includes('HIGH') && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">
                  High Risk Danger Assessment
                </span>
                <Badge tone="rose">
                  {detail?.riskLevel === 'HIGH-IMMINENT' || detail?.riskLevel === 'HIGH_IMMINENT'
                    ? 'HIGH-IMMINENT'
                    : 'HIGH RISK'}
                </Badge>
              </div>
              {dangerAssessmentsList.length > 0 ? (
                <p className="text-sm font-medium leading-relaxed text-rose-950">
                  {dangerAssessmentsList.join(' • ')}
                </p>
              ) : (
                <p className="text-sm font-medium leading-relaxed text-rose-950">
                  High risk danger factors identified during case intake. Immediate protective action recommended.
                </p>
              )}
            </div>
          )}

          {/* Case Intake Summary */}
          <DetailInfoCard
            title="Case Intake Summary"
            icon={<FileText className="h-4 w-4 text-blue-600" />}
            columns={2}
            fields={[
              {
                label: 'ENTRY TYPE',
                value: detail?.filingType === 'FORMAL_COMPLAINT' ? 'Formal Complaint' : 'For the Record',
              },
              {
                label: 'ASSIGNED VAWC OFFICER',
                value: detail?.assignedOfficer || detail?.assignedOfficerName || '—',
              },
              {
                label: 'VIOLENCE CATEGORY',
                value: detail?.violenceType || detail?.incident?.natureOfComplaint || '—',
              },
              {
                label: 'DATE FILED',
                value: formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled),
              },
              {
                label: 'ASSESSED RISK LEVEL',
                value: (
                  <Badge tone={getRiskTone(detail?.riskLevel)}>
                    {formatEnumLabel(detail?.riskLevel || 'LOW')}
                  </Badge>
                ),
              },
              {
                label: 'IMMEDIATE REQUEST',
                value: immediateRequestsList.length > 0 ? (
                  <span className="font-semibold text-slate-800">
                    {immediateRequestsList.join(', ')}
                  </span>
                ) : (
                  'None specified'
                ),
              },
              {
                label: 'WITNESS COUNT',
                value: String(detail?.witnesses?.length || 0),
              },
            ]}
          />

          {/* Standard Overview (Complainant, Respondent, Incident, Narrative, Witnesses) */}
          <DetailCaseOverview
            caseInfo={{
              caseNumber: detail?.caseNumber || '—',
              status: detail?.caseStatus || 'PENDING',
              remarks: detail?.caseStatusRemarks || '—',
              dateFiled: formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled),
              assignedOfficer: detail?.assignedOfficer || detail?.assignedOfficerName || 'VAWC Officer',
              natureOfComplaint: detail?.violenceType || detail?.incident?.natureOfComplaint || 'VAWC Complaint',
              incidentDate: formatDisplayDate(detail?.incident?.dateOfIncident),
              incidentPlace: detail?.incident?.placeOfIncident || '—',
              frequency: detail?.incident?.frequencyOfIncident || '—',
              descriptionOfInjuries: detail?.incident?.descriptionOfInjuries || 'None reported',
            }}
            complainant={
              detail?.complainant
                ? {
                    fullName:
                      detail.complainant.fullName ||
                      `${detail.complainant.firstName || ''} ${detail.complainant.middleName || ''} ${detail.complainant.lastName || ''}`.trim() ||
                      'Complainant',
                    age: detail.complainant.age,
                    civilStatus: detail.complainant.civilStatus,
                    currentAddress: detail.complainant.completeAddress,
                    contactNumber: detail.complainant.contactNumber,
                    gender: detail.complainant.gender,
                    email: detail.complainant.email,
                  }
                : undefined
            }
            respondent={
              detail?.respondent
                ? {
                    name:
                      detail.respondent.fullName ||
                      `${detail.respondent.firstName || ''} ${detail.respondent.middleName || ''} ${detail.respondent.lastName || ''}`.trim() ||
                      'Respondent',
                    age: detail.respondent.age,
                    civilStatus: detail.respondent.civilStatus,
                    relationshipToComplainant: detail.respondent.relationshipToComplainant,
                    address: detail.respondent.completeAddress,
                    livingWithComplainant: detail.respondent.currentlyLivingWithComplainant ? 'Yes' : 'No',
                    contactNumber: detail.respondent.contactNumber,
                    gender: detail.respondent.gender,
                    occupation: detail.respondent.occupation,
                  }
                : undefined
            }
            incidentEvidence={{
              summary: detail?.narrative?.statementSummary || detail?.narrative?.statementText,
              narrativeFileName: detail?.narrative?.fileName || 'Narrative_Statement.pdf',
              narrativeFileUrl:
                (detail?.narrative?.fileName || detail?.narrative?.hasFile || detail?.narrative?.fileData || detail?.narrative?.statementSummary) && detail?.id
                  ? vawcApi.getNarrativeFileUrl(detail.id)
                  : undefined,
              evidenceFiles: Array.isArray(detail?.evidences) && detail.evidences.length > 0
                ? detail.evidences.map((ev) => ({
                    type: ev.evidenceTypeName || 'Case Evidence',
                    name: ev.fileName || 'Evidence Attachment',
                    description: ev.description,
                    url: ev.id ? vawcApi.getEvidenceFileUrl(ev.id) : undefined,
                  }))
                : detail?.evidence
                ? [
                    {
                      type: detail.evidence.evidenceTypeName || 'Case Evidence',
                      name: detail.evidence.fileName || 'Evidence Attachment',
                      description: detail.evidence.description,
                      url: detail.evidence.id ? vawcApi.getEvidenceFileUrl(detail.evidence.id) : undefined,
                    },
                  ]
                : [],
            }}
            witnesses={
              Array.isArray(detail?.witnesses)
                ? detail.witnesses.map((w, idx) => ({
                    id: w.id || idx,
                    name: w.fullName || `${w.firstName || ''} ${w.lastName || ''}`.trim() || `Witness #${idx + 1}`,
                    address: w.completeAddress || w.address,
                    contact: w.contactNumber,
                    testimonyUrl: (w.hasTestimonyFile || w.testimonyFileName || w.testimonyFile) && (w.id || w.personId)
                      ? (typeof vawcApi.getWitnessFileUrl === 'function' ? vawcApi.getWitnessFileUrl(w.id || w.personId) : undefined)
                      : undefined,
                  }))
                : []
            }
            childrenInvolved={
              Array.isArray(detail?.children)
                ? detail.children.map((c: any, idx: number) => ({
                    id: c.id || idx,
                    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || `Child #${idx + 1}`,
                    age: c.age,
                    role: c.childRole || c.role || 'Affected Child',
                  }))
                : []
            }
            onViewFile={handleViewFile}
          />
        </div>
      ),
    },
    {
      id: 'notes',
      label: notesCount !== undefined ? `Case Notes ${notesCount}` : 'Case Notes',
      content: (
        <DetailCaseNotesPanel
          caseId={detail?.id || caseId}
          onNotesCountChange={setNotesCount}
          isReadOnly={isSystemAdmin || isCaseClosed}
          onFetchNotes={async (id) => {
            const res = await vawcApi.getNotes(id)
            return res.map((n) => ({
              id: n.id,
              note: n.note,
              createdBy: n.createdBy,
              createdAt: n.createdAt,
            }))
          }}
          onAddNote={async (id, noteText) => {
            const res = await vawcApi.addNote(id, noteText)
            return {
              id: res.id,
              note: res.note,
              createdBy: res.createdBy,
              createdAt: res.createdAt,
            }
          }}
          emptyTitle="Case Notes"
          emptyDescription="No case notes or confidential officer remarks have been recorded for this VAWC case yet."
        />
      ),
    },
    {
      id: 'referrals',
      label: 'Referrals',
      content: (
        <VawcReferralsPanel
          caseId={detail?.id || caseId}
          caseNumber={detail?.caseNumber || '—'}
          caseStatus={detail?.caseStatus}
          victimName={
            detail?.complainant?.fullName ||
            `${detail?.complainant?.firstName || ''} ${detail?.complainant?.middleName || ''} ${detail?.complainant?.lastName || ''}`.trim() ||
            'Complainant'
          }
          victimAddress={detail?.complainant?.completeAddress}
          victimContact={detail?.complainant?.contactNumber}
          respondentName={
            detail?.respondent?.fullName ||
            `${detail?.respondent?.firstName || ''} ${detail?.respondent?.middleName || ''} ${detail?.respondent?.lastName || ''}`.trim() ||
            'Respondent'
          }
          respondentAddress={detail?.respondent?.completeAddress}
          respondentContact={detail?.respondent?.contactNumber}
          violenceType={detail?.violenceType || detail?.incident?.natureOfComplaint || 'VAWC Violation'}
          incidentDate={detail?.incident?.dateOfIncident ? formatDisplayDate(detail.incident.dateOfIncident) : undefined}
          incidentPlace={detail?.incident?.placeOfIncident}
          dateFiled={formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled)}
          assignedOfficer={detail?.assignedOfficer || detail?.assignedOfficerName || 'VAWC Desk Officer'}
          onReferralUpdated={() => {
            fetchDetail()
          }}
        />
      ),
    },
    {
      id: 'bpo',
      label: 'BPO Management',
      content: (
        <VawcBpoManagementPanel
          caseId={detail?.id || caseId}
          caseNumber={detail?.caseNumber || '—'}
          victimName={
            detail?.complainant?.fullName ||
            `${detail?.complainant?.firstName || ''} ${detail?.complainant?.middleName || ''} ${detail?.complainant?.lastName || ''}`.trim() ||
            '—'
          }
          respondentName={
            detail?.respondent?.fullName ||
            `${detail?.respondent?.firstName || ''} ${detail?.respondent?.middleName || ''} ${detail?.respondent?.lastName || ''}`.trim() ||
            '—'
          }
          assignedOfficer={detail?.assignedOfficer || detail?.assignedOfficerName || '—'}
          assignedOfficerId={detail?.assignedOfficerId}
          bpo={detail?.bpo}
          bpoNumber={detail?.bpo?.bpoControlNumber || (detail as any)?.bpoNumber || (detail as any)?.bpoControlNumber || 'Not Issued'}
          issueDate={
            detail?.bpo?.activatedAt
              ? formatDisplayDate(detail.bpo.activatedAt)
              : detail?.bpo?.dateServed
              ? formatDisplayDate(detail.bpo.dateServed)
              : (detail as any)?.bpoIssueDate
              ? formatDisplayDate((detail as any).bpoIssueDate)
              : undefined
          }
          expiryDate={
            detail?.bpo?.expiredAt
              ? formatDisplayDate(detail.bpo.expiredAt)
              : (detail as any)?.bpoExpiryDate
              ? formatDisplayDate((detail as any).bpoExpiryDate)
              : undefined
          }
          onPrintRequestLetter={async () => {
            if (!detail) return
            try {
              const compName =
                detail.complainant?.fullName ||
                `${detail.complainant?.firstName || ''} ${detail.complainant?.lastName || ''}`.trim() ||
                'Complainant'
              const respName =
                detail.respondent?.fullName ||
                `${detail.respondent?.firstName || ''} ${detail.respondent?.lastName || ''}`.trim() ||
                'Respondent'

              await generateBpoCertificate({
                caseNumber: detail.caseNumber || '2026-VAWC',
                bpoControlNumber: detail.bpo?.bpoControlNumber || (detail as any)?.bpoNumber || (detail as any)?.bpoControlNumber,
                victimName: compName,
                victimAddress: detail.complainant?.completeAddress,
                respondentName: respName,
                respondentAddress: detail.respondent?.completeAddress,
                violenceType: detail.violenceType || detail.incident?.natureOfComplaint || 'VAWC Incident',
                incidentDate: detail.incident?.dateOfIncident ? formatDisplayDate(detail.incident.dateOfIncident) : undefined,
                incidentPlace: detail.incident?.placeOfIncident,
                incidentSummary: detail.narrative?.statementSummary || detail.narrative?.statementText || detail.incident?.natureOfComplaint,
                dateFiled: formatDisplayDate(detail.dateFiledFormatted || detail.createdAt || detail.dateFiled),
                issueDate: detail.bpo?.activatedAt || detail.createdAt || new Date(),
                expiryDate: detail.bpo?.expiredAt,
                assignedOfficerName: detail.assignedOfficer || detail.assignedOfficerName || 'VAWC Desk Officer',
              })
            } catch (e) {
              console.error('Failed to print BPO document:', e)
              showFeedback({
                variant: 'error',
                title: 'Print Failed',
                description: 'Failed to generate BPO document for printing. Please try again.',
              })
            }
          }}
          onBpoUpdated={() => {
            fetchDetail()
          }}
        />
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      content: (
        <DetailTimelinePanel
          caseId={detail?.id || caseId}
          onFetchTimeline={async (id) => {
            return await vawcApi.getTimeline(id)
          }}
          items={timelineItems}
        />
      ),
    },
  ]

  return (
    <>
      <DetailCaseDetailsShell
        backLabel="Back to VAWC Records"
        onBack={onBack}
        isLoading={isLoading}
        isNotFound={!isLoading && !detail}
        notFoundTitle="VAWC Case Not Found"
        notFoundDescription={`We could not locate confidential VAWC case file #${caseId}.`}
        notFoundActionLabel="Return to Records"
        header={
          detail ? (
            <DetailCaseHeader
              title={detail.caseNumber || 'VAWC Case'}
              subtitle={detail.violenceType || detail.incident?.natureOfComplaint || 'Barangay Case Record'}
              status={
                <Badge tone={getStatusTone(detail.caseStatus)}>
                  {(detail.caseStatus || 'PENDING').replace(/_/g, ' ').toUpperCase()}
                </Badge>
              }
              actions={
                !isSystemAdmin ? (
                  <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
                    <DetailActionButton
                      icon={<Edit3 size={16} />}
                      onClick={() => {
                        if (onEdit) {
                          onEdit()
                        } else {
                          setIsEditModalOpen(true)
                        }
                      }}
                    >
                      Edit Case
                    </DetailActionButton>
                  </div>
                ) : undefined
              }
            />
          ) : null
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Unified VAWC Edit Case Modal */}
      {isEditModalOpen && (
        <VawcEditCaseModal
          isOpen={isEditModalOpen}
          caseRecord={detail}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchDetail()
            showFeedback({
              variant: 'success',
              title: 'Case Updated',
              description: `VAWC Case ${detail?.caseNumber || ''} details successfully saved.`,
            })
          }}
          showFeedback={showFeedback}
        />
      )}

      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
