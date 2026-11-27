import React from 'react'
import {
  FileText,
  User,
  Users,
  Scale,
} from 'lucide-react'
import {
  DetailInfoCard,
  DetailCaseEvidencePanel,
  DetailCaseWitnessPanel,
  DetailCaseSidebarCard,
  type DetailField,
} from '@/components/ui/details'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type { BcpcCarCaseDetailResponse } from '@/config/api/bcpc/bcpc.types'
import { formatDate, formatDateTime } from '@/utils/formatters'

interface BcpcCarOverviewTabProps {
  data: BcpcCarCaseDetailResponse
  onViewFile?: (url: string, title?: string) => void
}

function formatEnumText(val?: string | null): string {
  if (!val) return '—'
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
    .replace(/^CAR:\s*/i, '')
    .replace(/^CICL:\s*/i, '')
    .replace(/^Child at Risk \(CAR\):\s*/i, '')
    .replace(/^Child in Conflict with the Law \(CICL\):\s*/i, '')
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

export const BcpcCarOverviewTab: React.FC<BcpcCarOverviewTabProps> = ({
  data,
  onViewFile,
}) => {
  const reporter = data.reporter
  const child = data.child
  const guardian = data.guardian
  const incident = data.incident

  // 1. Case Intake Summary Fields (2 Columns matching Blotter format)
  const intakeFields: DetailField[] = [
    { label: 'ENTRY TYPE', value: 'Child at Risk (CAR)' },
    { label: 'RECEIVING OFFICER', value: data.reportingOfficer || '—' },
    { label: 'ASSIGNED OFFICER', value: data.assignedOfficer || 'Unassigned' },
    { label: 'LAST UPDATED', value: formatDateTime(data.attestedAt || data.createdAt) },
    { label: 'WITNESS COUNT', value: String(data.witnesses?.length ?? 0) },
  ]

  // 2. Complainant / Reporter Information Fields
  const reporterFields: DetailField[] = [
    {
      label: 'FULL NAME',
      value:
        reporter?.firstName || reporter?.lastName
          ? `${reporter.firstName} ${reporter.middleName ? reporter.middleName + ' ' : ''}${reporter.lastName}`.trim()
          : '—',
    },
    { label: 'REPORTER ROLE', value: data.reporterRole || '—' },
    { label: 'RELATIONSHIP TO CHILD', value: data.reporterRelationshipToChild || '—' },
    { label: 'CONTACT NUMBER', value: reporter?.contactNumber || (reporter as any)?.phoneNumber || '—' },
    { label: 'AGE', value: calculateAge((reporter as any)?.birthDate, reporter?.age) },
    { label: 'GENDER', value: reporter?.gender || '—' },
    { label: 'CIVIL STATUS', value: reporter?.civilStatus || '—' },
    { label: 'CURRENT ADDRESS', value: reporter?.completeAddress || '—' },
  ]

  // 3. Child at Risk Information Fields
  const childFields: DetailField[] = [
    {
      label: 'FULL NAME',
      value:
        child?.firstName || child?.lastName
          ? `${child.firstName} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName}`.trim()
          : '—',
    },
    {
      label: 'AGE',
      value:
        calculateAge(child?.birthDate, child?.age) !== '—'
          ? `${calculateAge(child?.birthDate, child?.age)} yrs old`
          : '—',
    },
    { label: 'BIRTH DATE', value: child?.birthDate ? formatDate(child.birthDate) : '—' },
    { label: 'GENDER', value: child?.gender || '—' },
    { label: 'CONTACT NUMBER', value: child?.contactNumber || (child as any)?.phoneNumber || '—' },
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

  // 5. CAR Assessment & Welfare Details Fields
  const carAssessmentFields: DetailField[] = [
    { label: 'CHILD AT RISK (CAR) CATEGORY', value: formatEnumText(data.carActCategory) },
    {
      label: 'SPECIFIC RISK ACT / OFFENSE',
      value:
        data.specificCarAct === 'OTHER_STATUS_OFFENSE' || data.specificCarAct === 'OTHER_LIGHT_OFFENSE'
          ? data.specificCarActOther || 'Other Status Offense'
          : formatEnumText(data.specificCarAct),
    },
    { label: 'OCCURRENCE COUNT', value: formatEnumText(data.carOccurrenceCategory) },
    {
      label: 'PROTECTIVE CUSTODY NEEDED',
      value: data.needsProtectiveCustody ? 'Yes' : 'No',
    },
    {
      label: 'SAFETY & WELFARE CONCERNS',
      value: data.needsProtectiveCustody || data.safetyWelfareNotes ? 'Yes' : 'No',
    },
    {
      label: 'SAFETY & WELFARE NOTES',
      value: data.safetyWelfareNotes || '—',
    },
    ...(data.temporaryShelterPlacement
      ? [{ label: 'TEMPORARY SHELTER PLACEMENT', value: data.temporaryShelterPlacement }]
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
          {/* Complainant / Reporter Information */}
          <DetailInfoCard
            title="Complainant Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            fields={reporterFields}
            columns={2}
          />

          {/* Child at Risk Information */}
          <DetailInfoCard
            title="Child at Risk (CAR) Information"
            icon={<User className="h-4.5 w-4.5 text-blue-600" />}
            fields={childFields}
            columns={2}
          />

          {/* CAR Assessment & Protective Welfare Details */}
          <DetailInfoCard
            title="Child at Risk (CAR) Assessment & Protective Welfare Details"
            icon={<Scale className="h-4.5 w-4.5 text-blue-600" />}
            fields={carAssessmentFields}
            columns={2}
          />

          {/* Incident Details & Evidence Panel */}
          <DetailCaseEvidencePanel
            incidentEvidence={{
              summary:
                data.narrative?.statementSummary ||
                data.narrative?.textStatement ||
                (data.incident
                  ? `Report filed on ${formatDate(data.createdAt)} regarding ${cleanNature(data.incident.natureOfComplaint || data.specificCarAct)} at ${data.incident.placeOfIncident || 'Barangay jurisdiction'}.`
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
                incident?.natureOfComplaint || (data.specificCarAct ? formatEnumText(data.specificCarAct) : formatEnumText(data.carActCategory))
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
