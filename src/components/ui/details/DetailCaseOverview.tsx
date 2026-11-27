import { User, FileText, Users, Paperclip, Clipboard } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { DetailInfoCard } from './DetailInfoCard'

export interface ComplainantDetails {
  fullName: string
  age?: number | string
  civilStatus?: string
  currentAddress?: string
  contactNumber?: string
  gender?: string
  email?: string
}

export interface RespondentDetails {
  name: string
  age?: number | string
  civilStatus?: string
  relationshipToComplainant?: string
  address?: string
  livingWithComplainant?: string
  contactNumber?: string
  gender?: string
  occupation?: string
}

export interface IncidentEvidenceDetails {
  narrativeFileName?: string
  narrativeFileUrl?: string
  summary?: string
  evidenceFiles?: Array<{
    type?: string
    name: string
    description?: string
    url?: string
  }>
}

export interface WitnessItem {
  id: number | string
  name: string
  address?: string
  contact?: string
  testimonyUrl?: string
  testimonyText?: string
}

export interface ChildItem {
  id?: number | string
  name: string
  age?: number | string
  role?: string
}

export interface CaseSidebarInfo {
  caseNumber: string
  status: string
  remarks?: string
  dateFiled: string
  assignedOfficer?: string
  natureOfComplaint: string
  incidentDate: string
  incidentPlace: string
  frequency?: string
  descriptionOfInjuries?: string
}

export interface DetailCaseOverviewProps {
  complainant?: ComplainantDetails
  respondent?: RespondentDetails
  incidentEvidence?: IncidentEvidenceDetails
  witnesses?: WitnessItem[]
  childrenInvolved?: ChildItem[]
  caseInfo: CaseSidebarInfo
  onViewFile?: (fileUrl?: string, title?: string) => void
  onViewTestimony?: (witness: WitnessItem) => void
}

interface DetailCaseEvidencePanelProps {
  incidentEvidence?: IncidentEvidenceDetails
  onViewFile?: (fileUrl?: string, title?: string) => void
}

export function DetailCaseEvidencePanel({
  incidentEvidence,
  onViewFile,
}: DetailCaseEvidencePanelProps) {
  const hasNarrative = Boolean(incidentEvidence?.summary?.trim())
  const hasEvidence = Boolean(incidentEvidence?.evidenceFiles?.length)

  if (!hasNarrative && !incidentEvidence?.narrativeFileUrl && !hasEvidence) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4.5 w-4.5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">Incident Details</h3>
      </div>

      {hasNarrative && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Narrative Summary
          </h4>
          <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm leading-6 text-slate-700">
            {incidentEvidence?.summary}
          </p>
        </div>
      )}

      {incidentEvidence?.narrativeFileUrl && (
        <div>
          <button
            type="button"
            onClick={() => onViewFile?.(incidentEvidence.narrativeFileUrl, incidentEvidence.narrativeFileName || 'Narrative Document')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <Paperclip className="h-3.5 w-3.5" /> View File
          </button>
        </div>
      )}

      {hasEvidence && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Evidence Submitted
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incidentEvidence?.evidenceFiles?.map((ev, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="min-w-0 space-y-0.5">
                  {ev.type && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {ev.type}
                    </span>
                  )}
                </div>
                {ev.url && (
                  <button
                    type="button"
                    onClick={() => onViewFile?.(ev.url, ev.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> View File
                  </button>
                )}
              </div>

            ))}
          </div>
        </div>
      )}
    </div>
  )
}


interface DetailCaseWitnessPanelProps {
  witnesses?: WitnessItem[]
  onViewTestimony?: (witness: WitnessItem) => void
  onViewFile?: (fileUrl?: string, title?: string) => void
}

export function DetailCaseWitnessPanel({
  witnesses = [],
  onViewTestimony,
  onViewFile,
}: DetailCaseWitnessPanelProps) {
  if (!witnesses.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Witnesses ({witnesses.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {witnesses.map((w, index) => (
          <div
            key={w.id ? `${w.id}-${index}` : `witness-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Witness #{index + 1}
              </span>
              <span className="text-xs font-semibold text-slate-900 truncate block">{w.name}</span>
              {w.address && (
                <p className="text-[11px] text-slate-500 truncate">{w.address}</p>
              )}
              {w.contact && (
                <p className="text-[11px] text-slate-400">{w.contact}</p>
              )}
            </div>
            {(w.testimonyUrl || onViewTestimony) && (
              <button
                type="button"
                onClick={() => {
                  if (onViewTestimony) {
                    onViewTestimony(w)
                  } else if (w.testimonyUrl && onViewFile) {
                    onViewFile(w.testimonyUrl, `Witness Statement - ${w.name}`)
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5" /> View File
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailCaseChildrenPanel({
  items = [],
}: {
  items?: ChildItem[]
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4.5 w-4.5 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">
          Children Involved / Dependents ({items.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((child, index) => (
          <div
            key={child.id ? `${child.id}-${index}` : `child-${index}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
          >
            <div className="min-w-0 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Child #{index + 1}
              </span>
              <span className="text-xs font-bold text-slate-900 capitalize block truncate">
                {child.name || 'Child'}
              </span>
              <p className="text-[11px] text-slate-500">
                Age: <span className="font-semibold text-slate-700">{child.age ?? '—'}</span>
              </p>
            </div>
            {child.role && (
              <Badge tone="indigo" className="text-[10px] shrink-0 font-medium">
                {child.role}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DetailCaseSidebarCardProps {
  caseInfo: CaseSidebarInfo
}

export function DetailCaseSidebarCard({ caseInfo }: DetailCaseSidebarCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <Clipboard className="h-4.5 w-4.5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">Case Information</h3>
      </div>

      <div className="space-y-3.5 text-xs">
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">CASE NUMBER</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{caseInfo.caseNumber}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">DATE FILED</p>
          <p className="text-slate-700 mt-0.5">{caseInfo.dateFiled}</p>
        </div>

        {caseInfo.assignedOfficer && (
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">
              ASSIGNED OFFICER
            </p>
            <p className="text-slate-700 mt-0.5">{caseInfo.assignedOfficer}</p>
          </div>
        )}

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">
            NATURE OF COMPLAINT
          </p>
          <p className="text-slate-900 font-semibold mt-0.5">{caseInfo.natureOfComplaint}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">INCIDENT DATE</p>
          <p className="text-slate-700 mt-0.5">{caseInfo.incidentDate}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">INCIDENT PLACE</p>
          <p className="text-slate-700 mt-0.5">{caseInfo.incidentPlace}</p>
        </div>

        {caseInfo.frequency && (
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">FREQUENCY</p>
            <p className="text-slate-700 mt-0.5">{caseInfo.frequency}</p>
          </div>
        )}

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">
            DESCRIPTION OF INJURIES
          </p>
          <p className="text-slate-700 mt-0.5">{caseInfo.descriptionOfInjuries || 'None reported'}</p>
        </div>
      </div>
    </div>
  )
}

export function DetailCaseOverview({
  complainant,
  respondent,
  incidentEvidence,
  witnesses = [],
  childrenInvolved = [],
  caseInfo,
  onViewFile,
  onViewTestimony,
}: DetailCaseOverviewProps) {
  const complainantFields = [
    { label: 'FULL NAME', value: complainant?.fullName || (complainant as any)?.name || '—' },
    { label: 'CONTACT NUMBER', value: complainant?.contactNumber || '—' },
    complainant?.age ? { label: 'AGE', value: String(complainant.age) } : null,
    complainant?.gender ? { label: 'GENDER', value: complainant.gender } : null,
    complainant?.civilStatus ? { label: 'CIVIL STATUS', value: complainant.civilStatus } : null,
    { label: 'CURRENT ADDRESS', value: complainant?.currentAddress || (complainant as any)?.completeAddress || (complainant as any)?.address || '—' },
  ].filter(Boolean) as { label: string; value: string }[]

  const respondentFields = [
    { label: 'NAME', value: respondent?.name || (respondent as any)?.fullName || '—' },
    { label: 'CONTACT NUMBER', value: respondent?.contactNumber || '—' },
    respondent?.age ? { label: 'AGE', value: String(respondent.age) } : null,
    respondent?.gender ? { label: 'GENDER', value: respondent.gender } : null,
    respondent?.relationshipToComplainant ? { label: 'RELATIONSHIP TO COMPLAINANT', value: respondent.relationshipToComplainant } : null,
    respondent?.livingWithComplainant ? { label: 'LIVING WITH COMPLAINANT', value: String(respondent.livingWithComplainant) } : null,
    { label: 'ADDRESS', value: respondent?.address || (respondent as any)?.completeAddress || (respondent as any)?.currentAddress || '—' },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column (2/3 Width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Complainant Information */}
        {complainant && (
          <DetailInfoCard
            title="Complainant Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            columns={2}
            fields={complainantFields}
          />
        )}

        {/* Respondent Information */}
        {respondent && (
          <DetailInfoCard
            title="Respondent Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            columns={2}
            fields={respondentFields}
          />
        )}

        <DetailCaseEvidencePanel incidentEvidence={incidentEvidence} onViewFile={onViewFile} />
        <DetailCaseWitnessPanel witnesses={witnesses} onViewTestimony={onViewTestimony} onViewFile={onViewFile} />
        <DetailCaseChildrenPanel items={childrenInvolved} />

      </div>

      {/* Right Column (Sidebar 1/3 Width) */}
      <div className="space-y-6">
        <DetailCaseSidebarCard caseInfo={caseInfo} />
      </div>
    </div>
  )
}
