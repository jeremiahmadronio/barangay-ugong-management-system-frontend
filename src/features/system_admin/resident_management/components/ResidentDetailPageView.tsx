import { useEffect, useState } from 'react'
import { Edit3Icon, RotateCcw, User, Users, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { Avatar } from '@/components/ui/table/Avatar'
import {
  DetailPageLayout,
  DetailHeader,
  DetailInfoCard,
  DetailTabs,
  DetailActionButton,
  type DetailTab,
} from '@/components/ui/details'
import { UpdateStatusModal } from './UpdateStatusModal'
import { residentService } from '@/config/api/residents/residents.service'
import type { ResidentDetailResponse, ResidentStatus } from '@/config/api/residents/residents.types'

import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { formatDate } from '@/utils/formatters'

interface ResidentDetailPageViewProps {
  residentId: number
  onBack: () => void
  onEdit: (residentDetail: ResidentDetailResponse) => void
  onStatusToggle?: (residentId: number, currentStatus: ResidentStatus) => void
}

export function ResidentDetailPageView({
  residentId,
  onBack,
  onEdit,
  onStatusToggle,
}: ResidentDetailPageViewProps) {
  const [residentDetail, setResidentDetail] = useState<ResidentDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [successFeedback, setSuccessFeedback] = useState<{ open: boolean; title: string; description: string } | null>(null)

  const fetchDetail = async () => {
    setIsLoading(true)
    try {
      const data = await residentService.getResidentDetail(residentId)
      setResidentDetail(data)
    } catch (err) {
      console.error('Failed to fetch resident details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [residentId])

  if (isLoading) {
    return (
      <DetailPageLayout backLabel="Back to Resident Management" onBack={onBack} header={<div />}>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading resident profile details...</p>
        </div>
      </DetailPageLayout>
    )
  }

  if (!residentDetail) {
    return (
      <DetailPageLayout backLabel="Back to Resident Management" onBack={onBack} header={<div />}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <h2 className="text-lg font-bold text-slate-900">Resident Profile Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">The requested resident account details could not be loaded.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            Return to Resident Management
          </button>
        </div>
      </DetailPageLayout>
    )
  }

  const statusToneMap: Record<ResidentStatus, 'emerald' | 'amber' | 'rose' | 'slate'> = {
    ACTIVE: 'emerald',
    INACTIVE: 'amber',
    DECEASED: 'rose',
    MOVED_OUT: 'slate',
    ARCHIVED: 'slate',
  }
  const statusTone = statusToneMap[residentDetail.status] || 'emerald'

  const personInfo = residentDetail.personInfo
  const fullName = personInfo?.fullName || 'Resident'
  const familyAssociations = residentDetail.familyAssociations || []

  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Resident & Household Information"
        columns={2}
        fields={[
          { label: 'FULL NAME', value: fullName },
          { label: 'BARANGAY ID NUMBER', value: residentDetail.barangayIdNumber || '—' },
          { label: 'HOUSEHOLD NUMBER', value: residentDetail.householdNumber || '—' },
          {
            label: 'HEAD OF FAMILY',
            value: (
              <Badge tone={residentDetail.isHeadOfFamily ? 'emerald' : 'slate'}>
                {residentDetail.isHeadOfFamily ? 'Head of Family' : 'Member'}
              </Badge>
            ),
          },
          {
            label: 'RESIDENT STATUS',
            value: (
              <Badge tone={statusTone}>
                {residentDetail.status}
              </Badge>
            ),
          },
          { label: 'CITIZENSHIP', value: residentDetail.citizenship || 'Filipino' },
          { label: 'EDUCATIONAL ATTAINMENT', value: residentDetail.educationalAttainment || '—' },
          {
            label: 'DATE OF RESIDENCY',
            value: formatDate(residentDetail.dateOfResidency),
          },
        ]}
      />

      {personInfo && (
        <DetailInfoCard
          title="Personal Profile Details"
          columns={2}
          fields={[
            { label: 'CONTACT NUMBER', value: personInfo.contactNumber || '—' },
            { label: 'AGE', value: personInfo.age ? `${personInfo.age} years old` : '—' },
            { label: 'GENDER', value: personInfo.gender || '—' },
            { label: 'CIVIL STATUS', value: personInfo.civilStatus || '—' },
            { label: 'OCCUPATION', value: personInfo.occupation || '—' },
            { label: 'COMPLETE ADDRESS', value: personInfo.completeAddress || '—' },
            {
              label: 'BIRTH DATE',
              value: formatDate(personInfo.birthDate),
            },
          ]}
        />
      )}

      {/* ── Family Associations Section ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Family Associations & Household Members ({familyAssociations.length})
            </h3>
          </div>
        </div>

        {familyAssociations.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-2">
            No family associations or linked household members recorded for this resident.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {familyAssociations.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5"
              >
                <Avatar name={rel.fullName} photoBase64={rel.photoBase64} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 truncate text-sm">{rel.fullName}</p>
                    <Badge tone="indigo">{rel.relationshipType || 'Relative'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {rel.barangayIdNumber || '—'} • Age {rel.age ?? '—'} • {rel.gender || '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{rel.address || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const documentsContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Attached Files & Verification Documents ({residentDetail.attachedFiles?.length || 0})
          </h3>
        </div>
      </div>

      {(!residentDetail.attachedFiles || residentDetail.attachedFiles.length === 0) ? (
        <p className="text-sm text-slate-400 italic py-2">
          No files or verification documents attached to this profile.
        </p>
      ) : (
        <div className="space-y-2.5">
          {residentDetail.attachedFiles.map((doc) => {
            const fileSrc = doc.fileBase64
              ? (doc.fileBase64.startsWith('data:') ? doc.fileBase64 : `data:${doc.fileType || 'application/octet-stream'};base64,${doc.fileBase64}`)
              : null

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Paperclip size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                    <p className="truncate text-xs text-slate-400 mt-0.5">{doc.fileType || 'Document'}</p>
                  </div>
                </div>

                {fileSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open()
                      if (win) {
                        win.document.write(`<iframe src="${fileSrc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
                      }
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                  >
                    View File
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'documents', label: `Documents & Files (${residentDetail.attachedFiles?.length || 0})`, content: documentsContent },
  ]

  return (
    <>
      <DetailPageLayout
        backLabel="Back to Resident Management"
        onBack={onBack}
        header={
          <DetailHeader
            name={fullName}
            subtitle={residentDetail.barangayIdNumber}
            photoBase64={residentDetail.photoBase64}
            status={<Badge tone={statusTone}>{residentDetail.status}</Badge>}
            meta={
              <Badge tone="slate">
                <User size={13} className="inline mr-1" />
                {residentDetail.isHeadOfFamily ? 'Head of Family' : 'Resident'}
              </Badge>
            }
            actions={
              <>
                <DetailActionButton
                  icon={<Edit3Icon size={17} />}
                  onClick={() => onEdit(residentDetail)}
                >
                  Edit Resident
                </DetailActionButton>

                <DetailActionButton
                  tone="primary"
                  icon={<RotateCcw size={17} />}
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  Update Status
                </DetailActionButton>
              </>
            }
          />
        }
      >
        <DetailTabs tabs={tabs} />
      </DetailPageLayout>

      <UpdateStatusModal
        open={isStatusModalOpen}
        residentId={residentDetail.id}
        residentName={fullName}
        currentStatus={residentDetail.status}
        onClose={() => setIsStatusModalOpen(false)}
        onSaved={(newStatus) => {
          fetchDetail()
          setSuccessFeedback({
            open: true,
            title: 'Resident Status Updated',
            description: `${fullName}'s status has been successfully updated to ${newStatus}.`,
          })
          if (onStatusToggle) onStatusToggle(residentDetail.id, newStatus)
        }}
      />

      <FeedbackDialog
        open={Boolean(successFeedback?.open)}
        variant="success"
        title={successFeedback?.title || ''}
        description={successFeedback?.description || ''}
        actionLabel="Done"
        onClose={() => setSuccessFeedback(null)}
      />
    </>
  )
}

