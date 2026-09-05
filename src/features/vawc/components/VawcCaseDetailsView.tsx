import { useCallback, useEffect, useState } from 'react'
import {
  FileText,
  Share2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
  Edit3,
} from 'lucide-react'
import {
  DetailActionButton,
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailCaseOverview,
  DetailCaseHistoryCard,
  DetailQuickActionCards,
  DetailTimelinePanel,
  DetailInfoCard,
  DetailCaseNotesPanel,
  type DetailTab,
  type DetailTimelineItem,
  type DetailQuickActionCardItem,
} from '@/components/ui/details'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { vawcApi, type VawcCaseDetailResponse } from '@/api/modules/vawc.api'
import { axiosInstance, API_BASE_URL } from '@/config/api/axios.config'
import { formatDate, formatEnumLabel } from '@/utils/formatters'
import { VawcBpoManagementPanel } from './VawcBpoManagementPanel'

export interface VawcCaseDetailsViewProps {
  caseId: string | number
  onBack: () => void
  onEdit?: () => void
  refreshKey?: number
}

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'SETTLED' || normalized === 'RESOLVED') return 'emerald'
  if (normalized === 'DISMISSED' || normalized === 'WITHDRAWN') return 'rose'
  if (normalized.includes('REFERRAL')) return 'sky'
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
  const [detail, setDetail] = useState<VawcCaseDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
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
      const contentType = response.headers['content-type'] || 'application/octet-stream'
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

  const quickActions: DetailQuickActionCardItem[] = [
    {
      id: 'refer',
      title: 'Issue Referral',
      subtitle: 'Refer to DSWD / PNP / Court',
      icon: Share2,
      onClick: () => {
        // Can integrate with referral modal
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
          {/* Quick Actions Panel */}
          <DetailQuickActionCards actions={quickActions} />

          {/* Case History Card */}
          <DetailCaseHistoryCard
            history={[
              {
                id: detail?.id || 1,
                caseNumber: detail?.caseNumber || '—',
                dateFiled: formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled),
                status: detail?.caseStatus || 'PENDING',
                isCurrent: true,
                isLatestActive: true,
              },
            ]}
            onViewHistoryCase={() => {}}
          />

          {/* Settled / Dismissed Status Banners */}
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

          {/* Assessed Risk Level Banner */}
          {detail?.riskLevel && (
            <div
              className={`rounded-xl border p-4 shadow-2xs space-y-1.5 ${
                String(detail.riskLevel).toUpperCase().includes('HIGH')
                  ? 'border-rose-200/80 bg-rose-50/40'
                  : String(detail.riskLevel).toUpperCase().includes('MODERATE')
                  ? 'border-amber-200/80 bg-amber-50/40'
                  : 'border-emerald-200/80 bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    String(detail.riskLevel).toUpperCase().includes('HIGH')
                      ? 'text-rose-900'
                      : String(detail.riskLevel).toUpperCase().includes('MODERATE')
                      ? 'text-amber-900'
                      : 'text-emerald-900'
                  }`}
                >
                  Assessed Risk Level
                </span>
                <Badge tone={getRiskTone(detail.riskLevel)}>
                  {detail.riskLevel === 'HIGH-IMMINENT' || detail.riskLevel === 'HIGH_IMMINENT'
                    ? 'HIGH-IMMINENT'
                    : (detail.riskLevel || 'LOW').toUpperCase()}
                </Badge>
              </div>
              {dangerAssessmentsList.length > 0 ? (
                <p
                  className={`text-sm font-medium leading-relaxed ${
                    String(detail.riskLevel).toUpperCase().includes('HIGH')
                      ? 'text-rose-950'
                      : String(detail.riskLevel).toUpperCase().includes('MODERATE')
                      ? 'text-amber-950'
                      : 'text-emerald-950'
                  }`}
                >
                  {dangerAssessmentsList.join(' • ')}
                </p>
              ) : (
                <p
                  className={`text-sm font-medium leading-relaxed ${
                    String(detail.riskLevel).toUpperCase().includes('HIGH')
                      ? 'text-rose-950'
                      : String(detail.riskLevel).toUpperCase().includes('MODERATE')
                      ? 'text-amber-950'
                      : 'text-emerald-950'
                  }`}
                >
                  No critical danger factors identified at intake.
                </p>
              )}
            </div>
          )}

          {/* Immediate Requests Banner */}
          {immediateRequestsList.length > 0 && (
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-900 uppercase tracking-wider">
                  Complainant Requested Actions
                </span>
                <Badge tone="sky">INTAKE REQUEST</Badge>
              </div>
              <p className="text-sm font-medium text-sky-950 leading-relaxed">
                {immediateRequestsList.join(' • ')}
              </p>
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
                value: detail?.violenceType || '—',
              },
              {
                label: 'DATE FILED',
                value: formatDisplayDate(detail?.dateFiledFormatted || detail?.createdAt || detail?.dateFiled),
              },
              {
                label: 'ASSESSED RISK LEVEL',
                value: formatEnumLabel(detail?.riskLevel || 'LOW'),
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
                    testimonyUrl: (w.hasTestimonyFile || w.testimonyFileName || w.testimonyFile || w.id)
                      ? vawcApi.getWitnessFileUrl(w.id || w.personId)
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
      label: 'Case Notes',
      content: (
        <DetailCaseNotesPanel
          caseId={detail?.id || caseId}
          onNotesCountChange={setNotesCount}
          isReadOnly={detail?.caseStatus === 'SETTLED' || detail?.caseStatus === 'DISMISSED'}
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
          bpoNumber={(detail as any)?.bpoNumber || (detail as any)?.bpoControlNumber || 'Not Issued'}
          issueDate={(detail as any)?.bpoIssueDate ? formatDisplayDate((detail as any).bpoIssueDate) : undefined}
          expiryDate={(detail as any)?.bpoExpiryDate ? formatDisplayDate((detail as any).bpoExpiryDate) : undefined}
          onPrintRequestLetter={() => {
            showFeedback({
              variant: 'info',
              title: 'Print BPO Request Letter',
              description: 'Generating BPO Request Letter for printing...',
            })
          }}
          onActivateBpo={() => {
            showFeedback({
              variant: 'info',
              title: 'Activate BPO',
              description: 'BPO Activation workflow initiated.',
            })
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
              subtitle={detail.violenceType || 'Barangay Case Record'}
              status={
                <Badge tone={getStatusTone(detail.caseStatus)}>
                  {(detail.caseStatus || 'PENDING').toUpperCase()}
                </Badge>
              }
              meta={
                detail.riskLevel ? (
                  <Badge tone={getRiskTone(detail.riskLevel)}>
                    {formatEnumLabel(detail.riskLevel)}
                  </Badge>
                ) : null
              }
              actions={
                <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
                  <DetailActionButton
                    icon={<Edit3 size={16} />}
                    onClick={() => {
                      if (onEdit) {
                        onEdit()
                      }
                    }}
                  >
                    Edit Case
                  </DetailActionButton>
                </div>
              }
            />
          ) : null
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
