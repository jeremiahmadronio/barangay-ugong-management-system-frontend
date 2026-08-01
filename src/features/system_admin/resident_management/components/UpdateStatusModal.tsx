import { useState, useEffect } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { residentService } from '@/config/api/residents/residents.service'
import type { ResidentStatus } from '@/config/api/residents/residents.types'

interface UpdateStatusModalProps {
  open: boolean
  residentId: number | null
  residentName: string
  currentStatus?: ResidentStatus
  onClose: () => void
  onSaved: (newStatus: ResidentStatus) => void
}

const STATUS_OPTIONS: { value: ResidentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active (Currently residing)' },
  { value: 'INACTIVE', label: 'Inactive (No longer active in records)' },
  { value: 'DECEASED', label: 'Deceased (Passed away)' },
  { value: 'MOVED_OUT', label: 'Moved Out (Resident moved out of barangay)' },
]

export function UpdateStatusModal({
  open,
  residentId,
  residentName,
  currentStatus = 'ACTIVE',
  onClose,
  onSaved,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ResidentStatus>(currentStatus)
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus)
      setRemarks('')
      setError(null)
    }
  }, [open, currentStatus])

  const handleSubmit = async () => {
    if (!residentId) return
    if (!selectedStatus) {
      setError('Please select a valid status.')
      return
    }
    if (!remarks.trim()) {
      setError('Reason / Remarks is required to update status.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await residentService.updateResidentStatus(residentId, {
        status: selectedStatus,
        remarks: remarks.trim(),
      })
      onSaved(selectedStatus)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update resident status.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    'mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs'
  const selectCls =
    'mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs'

  return (
    <FormModal
      open={open}
      title="Update Resident Status"
      submitLabel="Update Status"
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting}
      maxWidthClass="max-w-md"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600">
          Updating <span className="font-semibold text-slate-900">{residentName}</span> (resident)
        </p>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Select New Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ResidentStatus)}
            className={selectCls}
          >
            <option value="" disabled>
              Select a status
            </option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Reason / Remarks <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter reason for status change (e.g. Relocated to another city, Passed away, etc.)..."
            className={inputCls}
          />
        </div>
      </div>
    </FormModal>
  )
}
