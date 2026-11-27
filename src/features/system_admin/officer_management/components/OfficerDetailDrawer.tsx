import { X, Edit3Icon, UserX, RotateCcw, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { DetailHeader } from '@/components/ui/details/DetailHeader'
import { DetailInfoCard } from '@/components/ui/details/DetailInfoCard'
import { DetailTabs, type DetailTab } from '@/components/ui/details/DetailTabs'
import { DetailActionButton } from '@/components/ui/details/DetailActionButton'
import type { OfficerTableResponse } from '@/config/api/officers/officer.types'
import { formatDateTime } from '@/utils/formatters'

interface OfficerDetailDrawerProps {
  open: boolean
  officer: OfficerTableResponse | null
  onClose: () => void
  onEdit: (officer: OfficerTableResponse) => void
  onStatusToggle: (officer: OfficerTableResponse) => void
}

export function OfficerDetailDrawer({
  open,
  officer,
  onClose,
  onEdit,
  onStatusToggle,
}: OfficerDetailDrawerProps) {
  if (!open || !officer) return null

  const isOfficerActive = officer.status === 'ACTIVE'
  const statusTone = isOfficerActive ? 'emerald' : 'slate'

  // Overview Tab Content
  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Officer & Role Details"
        columns={2}
        fields={[
          {
            label: 'Full Name',
            value: officer.name || '—',
          },
          { label: 'Position / Role', value: officer.position || '—' },
          {
            label: 'Department',
            value: (
              <Badge tone="slate">
                <Building2 size={13} className="inline mr-1" />
                {officer.departmentName || '—'}
              </Badge>
            ),
          },
          {
            label: 'Assignment Type',
            value: officer.isGlobal ? 'Global Assignment (Barangay-Wide)' : 'Department Assigned',
          },
          {
            label: 'Status',
            value: (
              <Badge tone={statusTone} dot>
                {officer.status}
              </Badge>
            ),
          },
          {
            label: 'Active Cases Handled',
            value: `${officer.activeCases ?? 0} cases`,
          },
          { label: 'System Email', value: officer.email || '—' },
          { label: 'Officer ID', value: `OFF-${String(officer.id).padStart(4, '0')}` },
          { label: 'Created At', value: formatDateTime(officer.createdAt) },
          { label: 'Last Updated At', value: formatDateTime(officer.updatedAt) },
        ]}
      />
    </div>
  )

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl border-l border-slate-200 bg-white shadow-2xl flex flex-col">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              {officer.photoBase64 ? (
                <img
                  src={`data:image/jpeg;base64,${officer.photoBase64}`}
                  alt={officer.name}
                  className="h-10 w-10 rounded-full border border-blue-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
                  {officer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900">{officer.name}</h2>
                <p className="text-xs text-slate-500">{officer.position} • {officer.departmentName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Reusable Detail Header with Edit & Status Toggle Actions */}
            <DetailHeader
              name={officer.name}
              subtitle={`${officer.position} • ${officer.departmentName}`}
              status={<Badge tone={statusTone} dot>{officer.status}</Badge>}
              actions={
                <>
                  <DetailActionButton
                    icon={<Edit3Icon size={17} />}
                    onClick={() => {
                      onEdit(officer)
                    }}
                  >
                    Edit Officer
                  </DetailActionButton>

                  <DetailActionButton
                    tone={isOfficerActive ? 'warning' : 'emerald'}
                    icon={isOfficerActive ? <UserX size={17} /> : <RotateCcw size={17} />}
                    onClick={() => onStatusToggle(officer)}
                  >
                    {isOfficerActive ? 'Archive Officer' : 'Restore Officer'}
                  </DetailActionButton>
                </>
              }
            />

            {/* Tabs */}
            <DetailTabs tabs={tabs} />
          </div>
        </div>
      </div>
    </div>
  )
}
