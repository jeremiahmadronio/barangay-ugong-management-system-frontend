import React from 'react'
import {
  FileText,
  User,
  Users,
  Scale,
} from 'lucide-react'
import { DetailInfoCard, type DetailField } from '@/components/ui/details/DetailInfoCard'
import {
  DetailCaseEvidencePanel,
  DetailCaseWitnessPanel,
  DetailCaseSidebarCard,
} from '@/components/ui/details/DetailCaseOverview'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type { BcpcCiclCaseDetailResponse } from '@/config/api/bcpc/bcpc.types'
import { formatDate, formatDateTime } from '@/utils/formatters'

interface BcpcCiclOverviewTabProps {
  data: BcpcCiclCaseDetailResponse
  onViewFile?: (url: string, title?: string) => void
}

function formatEnumText(val?: string | null): string {
  if (!val) return '—'
  if (val === 'WCPD') return 'PNP-WCPD Referral'
  if (val === 'LSWDO') return 'LSWDO Intervention Program'
  if (val === 'BARANGAY') return 'Barangay Level Diversion (BCPC)'
  if (val === 'COURT') return 'Family Court / Bahay Pag-Asa'
  if (val === 'SIX_YEARS_OR_LESS') return '6 Years or Less (Barangay Diversion Eligible)'
  if (val === 'ABOVE_SIX_YEARS') return 'Above 6 Years (Court / Police Referral)'
  if (val === 'WITH_DISCERNMENT') return 'Acted With Discernment'
  if (val === 'WITHOUT_DISCERNMENT') return 'Acted Without Discernment (Exempt)'
  if (val === 'PENDING_LSWDO_EVALUATION') return 'Pending LSWDO Assessment'
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function cleanNature(val?: string | null): string {
  if (!val) return '—'
  return val
    .replace(/^CICL:\s*/i, '')
    .replace(/^CAR:\s*/i, '')
    .replace(/^Child in Conflict with the Law \(CICL\):\s*/i, '')
    .replace(/^Child at Risk \(CAR\):\s*/i, '')
    .trim() || '—'
}

function calculateAge(birthDate?: string | null, age?: number | string | null): string {
  if (age !== null && age !== undefined && String(age).trim() !== '' && String(age) !== '0') {
    return String(age)
  }
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return '—'
  const today = new Date()
  let diff = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) diff--
  return diff >= 0 ? `${diff}` : '—'
}

export const BcpcCiclOverviewTab: React.FC<BcpcCiclOverviewTabProps> = ({
  data,
  onViewFile,
}) => {
  const victim = data.victim
  const child = data.child
  const guardian = data.guardian
  const incident = data.incident
  const cicl = data.ciclAssessment

  // 1. Case Intake Summary Fields (2 Columns matching Blotter format)
  const intakeFields: DetailField[] = [
    { label: 'ENTRY TYPE', value: 'Child in Conflict with the Law (CICL)' },
    { label: 'RECEIVING OFFICER', value: data.reportingOfficer || '—' },
    { label: 'ASSIGNED OFFICER', value: data.assignedOfficer || 'Unassigned' },
    { label: 'LAST UPDATED', value: formatDateTime(data.attestedAt || data.createdAt) },
    { label: 'WITNESS COUNT', value: String(data.witnesses?.length ?? 0) },
  ]

  // 2. Offended Party / Victim Information Fields
  const victimFields: DetailField[] = data.isVictimlessOffense
    ? [
        {
          label: 'OFFENDED PARTY TYPE',
          value: 'Victimless Offense (State / Community)',
        },
        { label: 'COMPLAINANT ROLE', value: data.victimRole || 'Barangay Officer / Tanod' },
      ]
    : [
        {
          label: 'FULL NAME',
          value:
            victim?.firstName || victim?.lastName
              ? `${victim.firstName} ${victim.middleName ? victim.middleName + ' ' : ''}${victim.lastName}`.trim()
              : '—',
        },
        { label: 'VICTIM / COMPLAINANT ROLE', value: data.victimRole || '—' },
        { label: 'RELATIONSHIP TO CHILD', value: data.victimRelationshipToChild || 'Offended Party' },
        { label: 'CONTACT NUMBER', value: victim?.contactNumber || (victim as any)?.phoneNumber || (victim as any)?.contact || '—' },
        { label: 'AGE', value: calculateAge((victim as any)?.birthDate, victim?.age) },
        { label: 'GENDER', value: victim?.gender || '—' },
        { label: 'CIVIL STATUS', value: victim?.civilStatus || '—' },
        { label: 'CURRENT ADDRESS', value: victim?.completeAddress || '—' },
      ]

  // 3. CICL Minor (Respondent Child) Information Fields
  const childFields: DetailField[] = [
    {
      label: 'FULL NAME',
      value:
        child?.firstName || child?.lastName
          ? `${child.firstName} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName}`.trim()
          : '—',
    },
    {
      label: 'AGE AT INTAKE',
      value:
        calculateAge(child?.birthDate, child?.age) !== '—'
          ? `${calculateAge(child?.birthDate, child?.age)} yrs old`
          : '—',
    },
    { label: 'AGE AT INCIDENT', value: cicl?.ageAtIncident ? `${cicl.ageAtIncident} yrs old` : '—' },
    { label: 'BIRTH DATE', value: child?.birthDate ? formatDate(child.birthDate) : '—' },
    { label: 'GENDER', value: child?.gender || '—' },
    { label: 'CONTACT NUMBER', value: child?.contactNumber || '—' },
    { label: 'CURRENT ADDRESS', value: child?.completeAddress || '—' },
    { label: 'SCHOOL NAME', value: data.schoolName || 'Not specified' },
    { label: 'GRADE / LEVEL', value: data.gradeLevel || 'Not specified' },
  ]

  // 4. Parent / Guardian Information Fields
  const hasGuardian = Boolean(guardian?.firstName?.trim() || guardian?.lastName?.trim())
  const guardianFields: DetailField[] = hasGuardian
    ? [
        {
          label: 'FULL NAME',
          value: `${guardian?.firstName || ''} ${guardian?.middleName ? guardian.middleName + ' ' : ''}${guardian?.lastName || ''}`.trim(),
        },
        ...(data.guardianRelationship
          ? [{ label: 'RELATIONSHIP', value: data.guardianRelationship }]
          : []),
        { label: 'CONTACT NUMBER', value: guardian?.contactNumber || '—' },
        { label: 'CURRENT ADDRESS', value: guardian?.completeAddress || '—' },
        {
          label: 'PRESENT AT INTAKE',
          value: data.isGuardianPresentAtIntake ? 'Yes (Present)' : 'No (Absent)',
        },
        ...(!data.isGuardianPresentAtIntake && data.guardianUnavailableReason
          ? [{ label: 'REASON UNAVAILABLE', value: data.guardianUnavailableReason }]
          : []),
      ]
    : [
        {
          label: 'PRESENT AT INTAKE',
          value: data.isGuardianPresentAtIntake ? 'Yes (Present)' : 'No (Absent)',
        },
        ...(data.guardianUnavailableReason
          ? [{ label: 'REASON UNAVAILABLE', value: data.guardianUnavailableReason }]
          : []),
      ]

  // 5. Juvenile Justice Assessment & Routing Fields (RA 9344 / RA 10630)
  const routingFields: DetailField[] = [
    { label: 'ALLEGED OFFENSE / VIOLATION', value: cicl?.allegedViolation || (data as any).allegedViolation || '—' },
    { label: 'LEGAL PATHWAY (CICL)', value: formatEnumText(cicl?.ciclPathway) },
    { label: 'DISCERNMENT STATUS', value: formatEnumText(cicl?.discernmentStatus) },
    { label: 'PENALTY RANGE', value: formatEnumText(cicl?.penaltyRoutingCategory) },
    { label: 'DIVERSION AUTHORITY', value: formatEnumText(cicl?.diversionAuthority) },
    {
      label: 'DIVERSION ELIGIBILITY',
      value: cicl?.isDiversionEligible ? 'Eligible for Diversion' : 'Not Eligible (Court / WCPD Jurisdiction)',
    },
    {
      label: 'ADMITTED OFFENSE',
      value: cicl?.admittedOffense ? 'Yes (Admitted)' : 'No (Did not admit)',
    },
    {
      label: 'REPEAT OFFENDER / PRIOR RECORD',
      value: cicl?.isRepeatOffender ? 'Yes, has previous offenses' : 'No, first time offense',
    },
    ...(cicl?.apprehendingOfficerName
      ? [
          {
            label: 'APPREHENDING OFFICER',
            value: `${cicl.apprehendingOfficerName}${cicl.apprehendingOfficerOffice ? ` (${cicl.apprehendingOfficerOffice})` : ''}`,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* 1. Case Intake Summary Card (Top Full Width, 2 Columns) */}
      <DetailInfoCard
        title="Case Intake Summary"
        icon={<FileText className="h-4.5 w-4.5 text-blue-600" />}
        fields={intakeFields}
        columns={2}
      />

      {/* 2. Main Content & Sidebar Grid (Matching Blotter 2/3 and 1/3 layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Offended Party / Victim Information */}
          <DetailInfoCard
            title="Offended Party / Victim Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            fields={victimFields}
            columns={2}
          />

          {/* CICL Child (Respondent Minor) */}
          <DetailInfoCard
            title="Child in Conflict with the Law (CICL) Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            fields={childFields}
            columns={2}
          />

          {/* Juvenile Justice Assessment & Routing */}
          <DetailInfoCard
            title="Juvenile Justice Assessment & Legal Routing — CICL (RA 9344 / RA 10630)"
            icon={<Scale className="h-4.5 w-4.5 text-blue-600" />}
            fields={routingFields}
            columns={2}
          />

          {/* Incident Details & Evidence Panel */}
          <DetailCaseEvidencePanel
            incidentEvidence={{
              summary:
                data.narrative?.statementSummary ||
                data.narrative?.textStatement ||
                (data.incident
                  ? `Report filed on ${formatDate(data.createdAt)} regarding ${cleanNature(data.incident.natureOfComplaint || data.allegedViolation)} at ${data.incident.placeOfIncident || 'Barangay jurisdiction'}.`
                  : '—'),
              narrativeFileName: data.narrative?.fileName || `Narrative_${data.caseNumber}.pdf`,
              narrativeFileUrl:
                data.narrative?.hasFile || data.narrative?.fileData || data.narrative?.fileName || data.narrative?.statementSummary
                  ? bcpcService.files.narrative(data.caseId)
                  : undefined,
              evidenceFiles:
                data.evidences && data.evidences.length > 0
                  ? data.evidences.map((ev: any, idx: number) => ({
                      type: ev.evidenceTypeName || ev.evidenceType || 'Supporting Document',
                      name: ev.fileName || `Evidence #${idx + 1}`,
                      description: ev.description,
                      url: bcpcService.files.evidence(ev.id || idx),
                    }))
                  : [],
            }}
            onViewFile={onViewFile}
          />

          {/* Witnesses Panel */}
          <DetailCaseWitnessPanel
            witnesses={
              data.witnesses && data.witnesses.length > 0
                ? data.witnesses.map((w: any, idx: number) => ({
                    id: w.id || idx,
                    name:
                      w.fullName ||
                      (w.firstName
                        ? `${w.firstName} ${w.lastName || ''}`.trim()
                        : `Witness #${idx + 1}`),
                    address: w.address || w.completeAddress,
                    contact: w.contactNumber,
                    testimonyText: w.testimonyText,
                    testimonyUrl:
                      w.hasTestimonyFile || w.testimonyFile || w.testimonyFileName
                        ? bcpcService.files.witness(w.id || w.personId || idx)
                        : undefined,
                  }))
                : []
            }
            onViewFile={onViewFile}
          />
        </div>

        {/* Right Column (Sidebar 1/3 Width) */}
        <div className="space-y-6">
          <DetailCaseSidebarCard
            caseInfo={{
              caseNumber: data.caseNumber,
              status: data.caseStatus,
              dateFiled: formatDate(data.createdAt),
              assignedOfficer: data.assignedOfficer,
              natureOfComplaint: cleanNature(
                incident?.natureOfComplaint || data.allegedViolation
              ),
              incidentDate: incident?.dateOfIncident
                ? `${formatDate(incident.dateOfIncident)}${incident.timeOfIncident ? ` at ${incident.timeOfIncident.substring(0, 5)}` : ''}`
                : '—',
              incidentPlace: incident?.placeOfIncident || '—',
              frequency: incident?.frequencyOfIncident,
              descriptionOfInjuries: incident?.descriptionOfInjuries,
            }}
          />

          {/* Parent / Guardian Information */}
          <DetailInfoCard
            title="Parent / Guardian Information"
            icon={<Users className="h-4.5 w-4.5 text-blue-600" />}
            fields={guardianFields}
            columns={1}
          />
        </div>
      </div>
    </div>
  )
}
