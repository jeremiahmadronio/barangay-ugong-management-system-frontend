import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Edit3,
  ExternalLink,
  CheckCircle2,
  FolderCheck,
  XCircle,
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
import {
  bcpcApi,
  type BcpcCaseUniversalDetailResponse,
} from '@/api/modules/bcpc.api'
import { axiosInstance, API_BASE_URL } from '@/config/api/axios.config'
import { formatDate } from '@/utils/formatters'
import { BcpcCarOverviewTab } from './BcpcCarOverviewTab'
import { BcpcCiclOverviewTab } from './BcpcCiclOverviewTab'
import { BcpcCustodyTab } from './BcpcCustodyTab'
import { BcpcReferralsTab } from './BcpcReferralsTab'
import { BcpcInterventionTab } from './BcpcInterventionTab'
import { BcpcCaseNotesTab } from './BcpcCaseNotesTab'
import { BcpcTimelineTab } from './BcpcTimelineTab'

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
  if (st === 'WITHDRAWN' || st === 'DISMISSED') return 'rose'
  if (st.includes('REFERRAL') || st.includes('REFERRED')) return 'violet'
  if (st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY') return 'sky'
  if (st === 'PENDING') return 'amber'
  return 'slate'
}

function getStatusLabel(status?: string | null): string {
  const st = (status || 'PENDING').toUpperCase()
  if (st === 'PENDING') return 'Pending'
  if (st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY') return 'Under Custody'
  if (st.includes('REFERRAL') || st.includes('REFERRED')) return 'Referred'
  if (st === 'SETTLED' || st === 'RESOLVED') return 'Settled'
  if (st === 'DISMISSED') return 'Dismissed'
  if (st === 'WITHDRAWN') return 'Withdrawn'
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
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [caseData, setCaseData] = useState<BcpcCaseUniversalDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNotFound, setIsNotFound] = useState<boolean>(false)
  const fetchCaseDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsNotFound(false)
      const data = await bcpcApi.getCaseDetailsById(caseId)
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

  // Quick Action Buttons
  const quickActions: QuickActionCardItem[] = [
    {
      id: 'refer',
      title: 'Issue Referral',
      subtitle: 'Refer to LSWDO or agency',
      icon: ExternalLink,
      onClick: onRefer ? onRefer : () => setActiveTab('referrals'),
    },
    {
      id: 'settle',
      title: 'Mark as Settled',
      subtitle: 'Record completed intervention',
      icon: CheckCircle2,
      onClick: onSettle ? onSettle : () => console.log('Mark settled clicked'),
    },
    {
      id: 'closure',
      title: 'Case Closure',
      subtitle: 'Review & close case file',
      icon: FolderCheck,
      onClick: onCloseCase ? onCloseCase : () => console.log('Close case clicked'),
    },
    {
      id: 'dismiss',
      title: 'Dismiss Case',
      subtitle: 'Complainant withdrew / closed',
      icon: XCircle,
      onClick: onDismiss ? onDismiss : () => console.log('Dismiss case clicked'),
    },
  ]

  // BCPC Tabs: Overview, Custody & Turnover, Referrals, Intervention & Monitoring, Case Notes, Timeline
  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </h3>
            <DetailQuickActionCards actions={quickActions} />
          </div>

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
      content: (
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
      content: (
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
      content: (
        <BcpcInterventionTab caseId={caseId} caseNumber={displayCaseNumber} />
      ),
    },
    {
      id: 'notes',
      label: 'Case Notes',
      content: <BcpcCaseNotesTab caseId={caseId} />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      content: <BcpcTimelineTab caseId={caseId} />,
    },
  ]

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
              onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit3 className="h-4 w-4 text-slate-500" />
                  Edit Case
                </button>
              ) : null
            }
          />
        }
      />
    </>
  )
}

