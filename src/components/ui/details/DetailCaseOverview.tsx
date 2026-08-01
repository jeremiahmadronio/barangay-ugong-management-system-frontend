import { User, FileText, Users, Eye, Paperclip, Clipboard } from 'lucide-react'
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
  narrativeFileUrl?: string
  summary?: string
  evidenceFiles?: Array<{
    name: string
    url?: string
  }>
}

export interface WitnessItem {
  id: number | string
  name: string
  address?: string
  contact?: string
  testimonyUrl?: string
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
            onClick={() => onViewFile?.(incidentEvidence.narrativeFileUrl, 'Narrative File')}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            View Narrative File
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
                <span className="text-xs font-medium text-slate-800 truncate">
                  {ev.name}
                </span>
                <button
                  type="button"
                  onClick={() => onViewFile?.(ev.url, ev.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                >
                  <Paperclip className="h-3.5 w-3.5" /> View File
                </button>
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
}

export function DetailCaseWitnessPanel({
  witnesses = [],
  onViewTestimony,
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

      <div className="space-y-3">
        {witnesses.map((w, index) => (
          <div
            key={w.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-xs font-bold text-slate-700">
                {index + 1}
              </span>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  NAME
                </p>
                <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                {w.address && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-1">
                      ADDRESS
                    </p>
                    <p className="text-xs text-slate-700">{w.address}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              {w.contact && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    CONTACT
                  </p>
                  <p className="text-xs text-slate-700">{w.contact}</p>
                </div>
              )}
              {onViewTestimony && (
                <button
                  type="button"
                  onClick={() => onViewTestimony(w)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" /> View Testimony
                </button>
              )}
            </div>
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
          <p className="font-bold uppercase tracking-wider text-slate-400">STATUS</p>
          <div className="mt-1">
            <Badge
              tone={
                caseInfo.status.toUpperCase() === 'SETTLED'
                  ? 'emerald'
                  : caseInfo.status.toUpperCase().includes('MEDIATION')
                  ? 'amber'
                  : 'sky'
              }
            >
              {caseInfo.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">REMARKS</p>
          <p className="text-slate-700 mt-0.5">{caseInfo.remarks || '—'}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">DATE FILED</p>
          <p className="text-slate-700 mt-0.5">{caseInfo.dateFiled}</p>
        </div>

        <div>
          <p className="font-bold uppercase tracking-wider text-slate-400">
            ASSIGNED OFFICER
          </p>
          <p className="text-slate-700 mt-0.5">{caseInfo.assignedOfficer || 'Unassigned'}</p>
        </div>

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
  caseInfo,
  onViewFile,
  onViewTestimony,
}: DetailCaseOverviewProps) {
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
            fields={[
              { label: 'FULL NAME', value: complainant.fullName || '—' },
              { label: 'CONTACT NUMBER', value: complainant.contactNumber || '—' },
              { label: 'AGE', value: complainant.age ? String(complainant.age) : '—' },
              { label: 'GENDER', value: complainant.gender || '—' },
              { label: 'CIVIL STATUS', value: complainant.civilStatus || '—' },
              { label: 'EMAIL', value: complainant.email || '—' },
              { label: 'CURRENT ADDRESS', value: complainant.currentAddress || '—' },
            ]}
          />
        )}

        {/* Respondent Information */}
        {respondent && (
          <DetailInfoCard
            title="Respondent Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            columns={2}
            fields={[
              { label: 'NAME', value: respondent.name || '—' },
              { label: 'CONTACT NUMBER', value: respondent.contactNumber || '—' },
              { label: 'AGE', value: respondent.age ? String(respondent.age) : '—' },
              { label: 'GENDER', value: respondent.gender || '—' },
              { label: 'CIVIL STATUS', value: respondent.civilStatus || '—' },
              { label: 'OCCUPATION', value: respondent.occupation || '—' },
              { label: 'RELATIONSHIP TO COMPLAINANT', value: respondent.relationshipToComplainant || '—' },
              { label: 'LIVING WITH COMPLAINANT', value: respondent.livingWithComplainant || 'No' },
              { label: 'ADDRESS', value: respondent.address || '—' },
            ]}
          />
        )}

        <DetailCaseEvidencePanel incidentEvidence={incidentEvidence} onViewFile={onViewFile} />
        <DetailCaseWitnessPanel witnesses={witnesses} onViewTestimony={onViewTestimony} />
      </div>

      {/* Right Column (Sidebar 1/3 Width) */}
      <div className="space-y-6">
        <DetailCaseSidebarCard caseInfo={caseInfo} />
      </div>
    </div>
  )
}
