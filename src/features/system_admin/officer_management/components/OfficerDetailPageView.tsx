import {
  Edit3Icon,
  ShieldCheckIcon,
  UserX,
  RotateCcw,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import {
  DetailPageLayout,
  DetailHeader,
  DetailInfoCard,
  DetailTabs,
  DetailActionButton,
  type DetailTab,
} from '@/components/ui/details'
import type { OfficerTableResponse } from '@/config/api/officers/officer.types'

interface OfficerDetailPageViewProps {
  officer: OfficerTableResponse
  onBack: () => void
  onEdit: (officer: OfficerTableResponse) => void
  onStatusToggle: (officer: OfficerTableResponse) => void
}

function formatDepartmentName(deptName?: string): string {
  if (!deptName) return '—'
  if (deptName === 'LUPON') return 'Lupong Tagapamayapa'
  if (deptName === 'BCPC') return 'BCPC (Council for Protection of Children)'
  if (deptName === 'BLOTTER') return 'Blotter Management'
  if (deptName === 'VAWC') return 'VAWC (Women & Children)'
  if (deptName === 'CLEARANCE') return 'Clearance & Certifications'
  if (deptName === 'KAPITANA') return 'Office of the Barangay Captain'
  if (deptName === 'FTJS') return 'FTJS (First-Time Job Seeker)'
  return deptName
}

export function OfficerDetailPageView({
  officer,
  onBack,
  onEdit,
  onStatusToggle,
}: OfficerDetailPageViewProps) {
  const isOfficerActive = officer.status === 'ACTIVE'
  const statusTone = isOfficerActive ? 'emerald' : 'amber'
  const formattedDept = formatDepartmentName(officer.departmentName)

  // Overview Tab Content (Clean, necessary backend fields only)
  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Officer & Department Information"
        columns={2}
        fields={[
          { label: 'FULL NAME', value: officer.name || '—' },
          { label: 'POSITION / ROLE', value: officer.position || '—' },
          {
            label: 'DEPARTMENT',
            value: (
              <Badge tone="slate">
                <Building2 size={13} className="inline mr-1" />
                {formattedDept}
              </Badge>
            ),
          },
          {
            label: 'OFFICER STATUS',
            value: (
              <Badge tone={statusTone}>
                {officer.status}
              </Badge>
            ),
          },
          {
            label: 'ACTIVE CASES HANDLED',
            value: `${officer.activeCases ?? 0} cases`,
          },
          { label: 'SYSTEM EMAIL', value: officer.email || '—' },
          { label: 'OFFICER RECORD ID', value: `OFF-${String(officer.id).padStart(4, '0')}` },
        ]}
      />
    </div>
  )

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
  ]

  return (
    <DetailPageLayout
      backLabel="Back to Officer Directory"
      onBack={onBack}
      header={
        <DetailHeader
          name={officer.name}
          subtitle={officer.position}
          status={<Badge tone={statusTone}>{officer.status}</Badge>}
          meta={
            <Badge tone="slate">
              <ShieldCheckIcon size={13} className="inline mr-1" />
              {formattedDept}
            </Badge>
          }
          actions={
            <>
              <DetailActionButton
                icon={<Edit3Icon size={17} />}
                onClick={() => onEdit(officer)}
              >
                Edit Officer
              </DetailActionButton>

              <DetailActionButton
                tone={isOfficerActive ? 'blue' : 'emerald'}
                icon={isOfficerActive ? <UserX size={17} /> : <RotateCcw size={17} />}
                onClick={() => onStatusToggle(officer)}
              >
                {isOfficerActive ? 'Inactivate Officer' : 'Restore Officer'}
              </DetailActionButton>
            </>
          }
        />
      }
    >
      <DetailTabs tabs={tabs} />
    </DetailPageLayout>
  )
}
