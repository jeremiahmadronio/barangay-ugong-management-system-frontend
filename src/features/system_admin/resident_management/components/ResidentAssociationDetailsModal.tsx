import { DetailsModal } from '@/components/ui/DetailsModal'
import { DetailInfoCard } from '@/components/ui/details/DetailInfoCard'
import { ExternalLink } from 'lucide-react'
import type { ResidentRelativeResponse } from '@/config/api/residents/residents.types'

interface ResidentAssociationDetailsModalProps {
  open: boolean
  resident: ResidentRelativeResponse | null
  onClose: () => void
  onNavigateToResident?: (residentId: number) => void
}

export function ResidentAssociationDetailsModal({
  open,
  resident,
  onClose,
  onNavigateToResident,
}: ResidentAssociationDetailsModalProps) {
  const footerActions = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        Close
      </button>

      {onNavigateToResident && resident?.id && (
        <button
          type="button"
          onClick={() => {
            const id = resident.id
            onClose()
            onNavigateToResident(id)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ExternalLink size={13} />
          View Full Profile
        </button>
      )}
    </div>
  )

  return (
    <DetailsModal
      open={open}
      title={resident ? `${resident.fullName}` : 'Resident Details'}
      description="Recorded resident profile details and familial linkage."
      maxWidthClass="max-w-2xl"
      footerActions={footerActions}
      onClose={onClose}
    >
      {resident ? (
        <div className="space-y-4">
          <DetailInfoCard
            title="Resident Profile Information"
            columns={2}
            fields={[
              { label: 'Full Name', value: resident.fullName || '—' },
              {
                label: 'Relationship',
                value: resident.relationshipType ? (
                  <span className="font-semibold text-blue-600">
                    {resident.relationshipType}
                  </span>
                ) : (
                  '—'
                ),
              },
              { label: 'Address', value: resident.address || '—' },
              { label: 'Age', value: resident.age ? `${resident.age} years old` : '—' },
              { label: 'Gender', value: resident.gender || '—' },
              { label: 'Civil Status', value: resident.civilStatus || '—' },
              { label: 'Contact No.', value: resident.contactNumber || '—' },
              { label: 'Household No.', value: resident.householdNumber || '—' },
              { label: 'Barangay ID', value: resident.barangayIdNumber || '—' },
              { label: 'Precinct No.', value: resident.precinctNumber || '—' },
            ]}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          No resident details available.
        </div>
      )}
    </DetailsModal>
  )
}

