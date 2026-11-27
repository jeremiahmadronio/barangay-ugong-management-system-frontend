import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Edit3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FolderCheck,
  ArrowLeft,
} from 'lucide-react'
import {
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailQuickActionCards,
  type DetailTab,
  type QuickActionCardItem,
} from '@/components/ui/details'
import { Badge } from '@/components/ui/table/Badge'
import type { BadgeTone } from '@/components/ui/table/Badge'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type { BcpcCaseUniversalDetailResponse } from '@/config/api/bcpc/bcpc.types'
import { axiosInstance, API_BASE_URL } from '@/config/api/axios.config'
import { formatDate } from '@/utils/formatters'
import { BcpcCarOverviewTab } from './BcpcCarOverviewTab'
import { BcpcCiclOverviewTab } from './BcpcCiclOverviewTab'
import { BcpcCustodyTab } from './BcpcCustodyTab'
import { BcpcReferralsTab } from './BcpcReferralsTab'
import { BcpcInterventionTab } from './BcpcInterventionTab'
import { BcpcCaseNotesTab } from './BcpcCaseNotesTab'
import { BcpcTimelineTab } from './BcpcTimelineTab'
import { BcpcEditCaseModal } from './BcpcEditCaseModal'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { CaseReasonModal } from '@/components/ui/details/CaseReasonModal'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'

export interface BcpcCaseDetailsViewProps {
  caseId: string | number
  caseNumber?: string
  onBack: () => void
  onEdit?: () => void
  onSettle?: () => void
  onDismiss?: () => void
  onCloseCase?: () => void
  onRefer?: () => void
}

function getStatusTone(status?: string | null): BadgeTone {
  const st = (status || 'PENDING').toUpperCase()
  if (st === 'SETTLED' || st === 'RESOLVED') return 'emerald'
  if (st === 'WITHDRAWN' || st === 'DISMISSED' || st === 'CLOSED' || st === 'EXPIRED_UNACTIONED' || st.includes('EXPIRED')) return 'rose'
  if (st === 'ONGOING' || st === 'ACTIVE' || st.includes('REFERRAL') || st.includes('REFERRED') || st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY') return 'sky'
  if (st === 'PENDING') return 'amber'
  return 'slate'
}

function getStatusLabel(status?: string | null): string {
  const st = (status || 'PENDING').toUpperCase()
  if (st === 'EXPIRED_UNACTIONED') return 'Expired / Un-actioned'
  if (st === 'ONGOING' || st === 'ACTIVE' || st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY' || st.includes('REFERRAL') || st.includes('REFERRED')) return 'Ongoing'
  if (st === 'PENDING') return 'Pending'
  if (st === 'SETTLED' || st === 'RESOLVED') return 'Settled'
  if (st === 'DISMISSED') return 'Dismissed'
  if (st === 'WITHDRAWN') return 'Withdrawn'
  if (st === 'CLOSED') return 'Closed'
  return st.replace(/_/g, ' ')
}

export const BcpcCaseDetailsView: React.FC<BcpcCaseDetailsViewProps> = ({
  caseId,
  caseNumber: initialCaseNumber,
  onBack,
  onEdit,
  onSettle,
  onDismiss,
  onCloseCase,
  onRefer,
}) => {
  const { showFeedback, feedbackDialogProps } = useDialogs()
  const { hasPermission } = useUserPermissions()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [caseData, setCaseData] = useState<BcpcCaseUniversalDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [statusModalConfig, setStatusModalConfig] = useState<{
    open: boolean
    targetStatus: 'SETTLED' | 'DISMISSED' | 'CLOSED'
    title: string
    label: string
    placeholder: string
    confirmLabel: string
    confirmTone: 'emerald' | 'rose' | 'blue'
  } | null>(null)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false)
  const fetchCaseDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsNotFound(false)
      const data = await bcpcService.getCaseDetailsById(caseId)
      setCaseData(data)
    } catch (err) {
      console.error('Failed to load BCPC case details:', err)
      setIsNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCaseDetails()
  }, [fetchCaseDetails])

  const handleViewFile = useCallback(async (fileUrl?: string, fileTitle?: string) => {
    if (!fileUrl) return
    try {
      if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
        window.open(fileUrl, '_blank')
        return
      }

      const resolvedUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`

      // Request as blob to preserve original binary data without UTF-8 string corruption
      const response = await axiosInstance.get(resolvedUrl, { responseType: 'blob' })
      const rawBlob = response.data instanceof Blob ? response.data : new Blob([response.data])
      const contentType =
        (response.headers?.['content-type'] as string) || rawBlob.type || 'application/octet-stream'

      // If backend returned JSON (e.g. error message or base64 wrapper)
      if (contentType.includes('application/json')) {
        const text = await rawBlob.text()
        try {
          const json = JSON.parse(text)
          const base64Str =
            json.documentBase64 || json.fileData || json.fileBase64 || json.statementFileBase64
          if (base64Str) {
            const byteCharacters = atob(base64Str)
            const byteNumbers = new Uint8Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const docFormat = (json.documentFormat || fileTitle || '').toLowerCase()
            let mimeType = 'application/pdf'
            if (docFormat.includes('png')) mimeType = 'image/png'
            else if (docFormat.includes('jpg') || docFormat.includes('jpeg')) mimeType = 'image/jpeg'
            else if (docFormat.includes('docx'))
              mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            else if (docFormat.includes('doc')) mimeType = 'application/msword'

            const parsedBlob = new Blob([byteNumbers], { type: mimeType })
            const parsedBlobUrl = URL.createObjectURL(parsedBlob)
            const isOfficeDoc =
              mimeType.includes('officedocument') ||
              mimeType.includes('msword') ||
              (fileTitle && (fileTitle.toLowerCase().endsWith('.docx') || fileTitle.toLowerCase().endsWith('.doc')))

            if (!isOfficeDoc) {
              const win = window.open(parsedBlobUrl, '_blank')
              if (win) return
            }

            const a = document.createElement('a')
            a.href = parsedBlobUrl
            a.download = fileTitle || json.fileName || 'document'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            return
          }
        } catch {
          // If JSON parse fails, continue with raw blob
        }
      }

      // Check if this is an office document (docx/doc) or if filename implies it
      const isOfficeDoc =
        contentType.includes('officedocument') ||
        contentType.includes('msword') ||
        (fileTitle && (fileTitle.toLowerCase().endsWith('.docx') || fileTitle.toLowerCase().endsWith('.doc')))

      // Ensure appropriate MIME type for browser preview (e.g. PDF or images)
      let finalBlob = rawBlob
      if (!isOfficeDoc) {
        if (contentType.includes('pdf') || (fileTitle && fileTitle.toLowerCase().endsWith('.pdf'))) {
          finalBlob = new Blob([rawBlob], { type: 'application/pdf' })
        } else if (
          contentType.includes('image/') ||
          (fileTitle &&
            (fileTitle.toLowerCase().endsWith('.png') ||
              fileTitle.toLowerCase().endsWith('.jpg') ||
              fileTitle.toLowerCase().endsWith('.jpeg')))
        ) {
          finalBlob = new Blob([rawBlob], {
            type: contentType.includes('image/') ? contentType : 'image/png',
          })
        }
      }

      const blobUrl = URL.createObjectURL(finalBlob)

      if (!isOfficeDoc) {
        const win = window.open(blobUrl, '_blank')
        if (win) return
      }

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileTitle || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to view file:', err)
      if (fileUrl) {
        const directUrl = fileUrl.startsWith('http')
          ? fileUrl
          : `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
        window.open(directUrl, '_blank')
      }
    }
  }, [])

  const isCar = caseData?.category === 'CAR'
  const displayCaseNumber = caseData?.caseNumber || initialCaseNumber || `BCPC-${caseId}`
  const displayStatus = caseData?.caseStatus || 'PENDING'
  const createdAtStr = caseData?.carDetails?.createdAt || caseData?.ciclDetails?.createdAt

  const guardianPerson = caseData?.carDetails?.guardian || caseData?.ciclDetails?.guardian
  const resolvedGuardianName =
    guardianPerson?.fullName?.trim() ||
    [guardianPerson?.firstName, guardianPerson?.middleName, guardianPerson?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    ''
  const resolvedGuardianRelationship =
    caseData?.carDetails?.guardianRelationship ||
    caseData?.ciclDetails?.guardianRelationship ||
    'Parent / Guardian'
  const resolvedGuardianContact =
    guardianPerson?.contactNumber ||
    caseData?.carDetails?.guardian?.contactNumber ||
    caseData?.ciclDetails?.guardian?.contactNumber ||
    ''

  const childPerson = caseData?.carDetails?.child || caseData?.ciclDetails?.child
  const resolvedChildName =
    childPerson?.fullName ||
    [childPerson?.firstName, childPerson?.lastName].filter(Boolean).join(' ').trim() ||
    'Child on Record'
  const resolvedChildAge = childPerson?.age
  const resolvedChildGender = childPerson?.gender
  const resolvedIncidentType = isCar
    ? caseData?.carDetails?.assessment?.specificAct
    : caseData?.ciclDetails?.allegedViolation

  const isSettledOrClosed = ['SETTLED', 'DISMISSED', 'WITHDRAWN', 'RESOLVED', 'CLOSED'].includes(
    (displayStatus || '').toUpperCase().replace(/[\s-]+/g, '_')
  )

  const handleStatusSubmit = async (reason: string) => {
    if (!statusModalConfig) return
    const { targetStatus } = statusModalConfig

    if (targetStatus === 'SETTLED' && !hasPermission('Settled Case')) {
      showFeedback({
        variant: 'error',
        title: 'Permission Denied',
        description: 'You do not have permission to mark cases as settled.',
      })
      return
    }

    if (targetStatus === 'DISMISSED' && !hasPermission('Dismiss Case')) {
      showFeedback({
        variant: 'error',
        title: 'Permission Denied',
        description: 'You do not have permission to dismiss cases.',
      })
      return
    }

    if (targetStatus === 'CLOSED' && !hasPermission('Close Case')) {
      showFeedback({
        variant: 'error',
        title: 'Permission Denied',
        description: 'You do not have permission to close cases.',
      })
      return
    }

    try {
      setIsSubmittingStatus(true)
      await bcpcService.updateCaseStatus(caseId, targetStatus, reason)
      setStatusModalConfig(null)
      await fetchCaseDetails()
      const titleMap: Record<string, string> = {
        SETTLED: 'Case Settled',
        DISMISSED: 'Case Dismissed',
        CLOSED: 'Case Closed',
      }
      showFeedback({
        variant: 'success',
        title: titleMap[targetStatus] || 'Status Updated',
        description: `Case #${displayCaseNumber} status updated to ${titleMap[targetStatus]?.replace('Case ', '') || targetStatus} successfully.`,
      })
    } catch (err: any) {
      console.error('Failed to update BCPC case status:', err)
      showFeedback({
        variant: 'error',
        title: 'Unable to Update Status',
        description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to update the case status. Please try again.',
      })
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  // Quick Action Buttons (4 actions: Issue Referral, Mark as Settled, Dismiss Case, Close Case)
  const quickActions: QuickActionCardItem[] = useMemo(() => {
    const list: QuickActionCardItem[] = []

    if (hasPermission('Manage Referral')) {
      list.push({
        id: 'refer',
        title: 'Issue Referral',
        subtitle: 'Refer to LSWDO or agency',
        icon: ExternalLink,
        onClick: onRefer ? onRefer : () => setActiveTab('referrals'),
      })
    }

    if (!isSettledOrClosed && hasPermission('Settled Case')) {
      list.push({
        id: 'settle',
        title: 'Mark as Settled',
        subtitle: 'Record completed intervention',
        icon: CheckCircle2,
        onClick: onSettle
          ? onSettle
          : () => {
              setStatusModalConfig({
                open: true,
                targetStatus: 'SETTLED',
                title: `Mark Case #${displayCaseNumber} as Settled`,
                label: 'Settlement Terms / Agreement Summary',
                placeholder: 'Enter settlement terms, diversion compliance details, or agreement notes...',
                confirmLabel: 'Mark as Settled',
                confirmTone: 'emerald',
              })
            },
      })
    }

    if (!isSettledOrClosed && hasPermission('Dismiss Case')) {
      list.push({
        id: 'dismiss',
        title: 'Dismiss Case',
        subtitle: 'Dropped or withdrawn by parties',
        icon: XCircle,
        onClick: onDismiss
          ? onDismiss
          : () => {
              setStatusModalConfig({
                open: true,
                targetStatus: 'DISMISSED',
                title: `Dismiss Case #${displayCaseNumber}`,
                label: 'Reason for Dismissal / Grounds',
                placeholder: 'State reasons or grounds for dismissal (e.g. lack of merit, withdrawal of complaint, or insufficient grounds)...',
                confirmLabel: 'Dismiss Case',
                confirmTone: 'rose',
              })
            },
      })
    }

    if (!isSettledOrClosed && hasPermission('Close Case')) {
      list.push({
        id: 'close',
        title: 'Close Case',
        subtitle: 'Officially conclude case record',
        icon: FolderCheck,
        onClick: onCloseCase
          ? onCloseCase
          : () => {
              setStatusModalConfig({
                open: true,
                targetStatus: 'CLOSED',
                title: `Close Case #${displayCaseNumber}`,
                label: 'Closing Remarks / Final Summary',
                placeholder: 'Enter final remarks, summary of actions taken, or disposition notes...',
                confirmLabel: 'Close Case',
                confirmTone: 'blue',
              })
            },
      })
    }

    return list
  }, [hasPermission, isSettledOrClosed, displayCaseNumber, onRefer, onSettle, onDismiss, onCloseCase])

  // BCPC Tabs: Overview, Custody & Turnover, Referrals, Intervention & Monitoring, Case Notes, Timeline
  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          {quickActions.length > 0 && <DetailQuickActionCards actions={quickActions} />}

          {/* Differentiated Overview Content */}
          {isCar && caseData?.carDetails ? (
            <BcpcCarOverviewTab
              data={caseData.carDetails}
              onViewFile={handleViewFile}
            />
          ) : caseData?.ciclDetails ? (
            <BcpcCiclOverviewTab
              data={caseData.ciclDetails}
              onViewFile={handleViewFile}
            />
          ) : null}
        </div>
      ),
    },
    {
      id: 'custody',
      label: 'Custody & Turnover',
      content: !hasPermission('Manage Custody & Turn Over') ? (
        <div className="py-6 flex items-center justify-center">
          <PermissionDeniedPage
            compact
            title="You don't have permission to access Custody & Turnover!"
            message="The owner of the workspace has not given you permission to manage custody records. Please contact the owner of the workspace."
          />
        </div>
      ) : (
        <BcpcCustodyTab
          caseId={caseId}
          caseNumber={displayCaseNumber}
          category={caseData?.category}
          guardianName={resolvedGuardianName}
          guardianRelationship={resolvedGuardianRelationship}
          guardianContact={resolvedGuardianContact}
          onRecordUpdated={fetchCaseDetails}
        />
      ),
    },
    {
      id: 'referrals',
      label: 'Referrals',
      content: !hasPermission('Manage Referral') ? (
        <div className="py-6 flex items-center justify-center">
          <PermissionDeniedPage
            compact
            title="You don't have permission to access Referrals!"
            message="The owner of the workspace has not given you permission to manage referrals. Please contact the owner of the workspace."
          />
        </div>
      ) : (
        <BcpcReferralsTab
          caseId={caseId}
          caseNumber={displayCaseNumber}
          childName={resolvedChildName}
          childAge={resolvedChildAge}
          childGender={resolvedChildGender}
          childCategory={caseData?.category}
          incidentType={resolvedIncidentType}
          onReferralIssued={fetchCaseDetails}
        />
      ),
    },
    {
      id: 'intervention',
      label: 'Intervention & Monitoring',
      content: !hasPermission('Manage Intervention & Monitoring') ? (
        <div className="py-6 flex items-center justify-center">
          <PermissionDeniedPage
            compact
            title="You don't have permission to access Intervention & Monitoring!"
            message="The owner of the workspace has not given you permission to manage interventions. Please contact the owner of the workspace."
          />
        </div>
      ) : (
        <BcpcInterventionTab
          caseId={caseId}
          caseNumber={displayCaseNumber}
          childName={resolvedChildName}
          childCategory={caseData?.category}
        />
      ),
    },
    {
      id: 'notes',
      label: 'Case Notes',
      content: !hasPermission('Manage Case Notes') ? (
        <div className="py-6 flex items-center justify-center">
          <PermissionDeniedPage
            compact
            title="You don't have permission to access Case Notes!"
            message="The owner of the workspace has not given you permission to manage case notes. Please contact the owner of the workspace."
          />
        </div>
      ) : (
        <BcpcCaseNotesTab caseId={caseId} isReadOnly={isSettledOrClosed} />
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      content: <BcpcTimelineTab caseId={caseId} />,
    },
  ]

  if (!hasPermission('View Cases')) {
    return (
      <div className="py-12 flex justify-center">
        <PermissionDeniedPage
          title="Access Denied"
          message="The owner of the workspace has not given you permission to view BCPC cases. Please contact the administrator."
          onBack={onBack}
        />
      </div>
    )
  }

  return (
    <>
      <DetailCaseDetailsShell
        backLabel="Back to BCPC Case Files"
        onBack={onBack}
        isLoading={isLoading}
        isNotFound={!isLoading && (!caseData || isNotFound)}
        notFoundTitle="BCPC Case Record Not Found"
        notFoundDescription={`We couldn't locate BCPC case record #${displayCaseNumber}. It may have been permanently deleted or moved.`}
        notFoundActionLabel="Return to BCPC Records"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        header={
          <DetailCaseHeader
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            title={displayCaseNumber}
            subtitle={
              isCar
                ? 'BCPC Case Record — Child at Risk (CAR)'
                : 'BCPC Case Record — Child in Conflict with the Law (CICL)'
            }
            status={
              <Badge tone={getStatusTone(displayStatus)}>
                {getStatusLabel(displayStatus)}
              </Badge>
            }
            actions={
              !isSettledOrClosed && hasPermission('Edit Case') ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(true)
                    onEdit?.()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit3 className="h-4 w-4 text-slate-500" />
                  Edit Case
                </button>
              ) : undefined
            }
          />
        }
      />

      {isEditModalOpen && caseData && hasPermission('Edit Case') && !isSettledOrClosed && (
        <BcpcEditCaseModal
          isOpen={isEditModalOpen}
          caseRecord={caseData}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchCaseDetails()
          }}
          showFeedback={showFeedback}
        />
      )}

      {statusModalConfig && (
        <CaseReasonModal
          open={statusModalConfig.open}
          title={statusModalConfig.title}
          label={statusModalConfig.label}
          caseNumber={displayCaseNumber}
          caseLabel="BCPC Case"
          placeholder={statusModalConfig.placeholder}
          confirmLabel={statusModalConfig.confirmLabel}
          confirmTone={statusModalConfig.confirmTone}
          isLoading={isSubmittingStatus}
          onConfirm={handleStatusSubmit}
          onCancel={() => setStatusModalConfig(null)}
        />
      )}

      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}

