import { DetailsModal } from '@/components/ui'
import { DetailInfoCard } from '@/components/ui/details'
import type { ResidentRelativeResponse } from '@/config/api/residents/residents.types'

interface ResidentAssociationDetailsModalProps {
  open: boolean
  resident: ResidentRelativeResponse | null
  onClose: () => void
}

export function ResidentAssociationDetailsModal({
  open,
  resident,
  onClose,
}: ResidentAssociationDetailsModalProps) {
  return (
    <DetailsModal
      open={open}
      title="Resident Details"
      description="Review the resident profile details before creating or updating a family association."
      maxWidthClass="max-w-2xl"
      onClose={onClose}
    >
      {resident ? (
        <DetailInfoCard
          title="Resident Profile Information"
          columns={2}
          fields={[
            { label: 'Full Name', value: resident.fullName || '—' },
            { label: 'Address', value: resident.address || '—' },
            { label: 'Age', value: resident.age ? `${resident.age} years old` : '—' },
            { label: 'Gender', value: resident.gender || '—' },
            { label: 'Civil Status', value: resident.civilStatus || '—' },
            { label: 'Contact No.', value: resident.contactNumber || '—' },
            { label: 'Household No.', value: resident.householdNumber || '—' },
            { label: 'Barangay ID', value: resident.barangayIdNumber || '—' },
          ]}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          No resident details available.
        </div>
      )}
    </DetailsModal>
  )
}
