import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { DetailsModal } from '@/components/ui/DetailsModal'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type { ReIssuanceRequestDto } from '@/config/api/ftjs/ftjs.types'

interface FtjsReissuanceModalProps {
  open: boolean
  onClose: () => void
  ftjsId: number
  applicantName?: string
  trackingNumber?: string
  onSuccess?: () => void
}

export function FtjsReissuanceModal({
  open,
  onClose,
  ftjsId,
  applicantName,
  trackingNumber,
  onSuccess,
}: FtjsReissuanceModalProps) {
  const [reason, setReason] = useState('')
  const [dateOfLoss, setDateOfLoss] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [orNumber, setOrNumber] = useState('')
  const [affidavitBase64, setAffidavitBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFileName('')
      setAffidavitBase64(null)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip base64 data header if present for byte[] backend mapping
      const cleanBase64 = result.replace(/^data:[^;]+;base64,/, '')
      setAffidavitBase64(cleanBase64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason.trim()) {
      setError('Please provide a reason for re-issuance.')
      return
    }
    if (!dateOfLoss) {
      setError('Please specify the date of loss or incident.')
      return
    }
    if (!orNumber.trim()) {
      setError('Please enter the official receipt (OR) number.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload: ReIssuanceRequestDto = {
        ftjsId,
        reason: reason.trim(),
        dateOfLoss,
        orNumber: orNumber.trim(),
        affidavit: affidavitBase64,
      }

      await ftjsService.createReIssuanceRequest(ftjsId, payload)

      // Reset state
      setReason('')
      setOrNumber('')
      setAffidavitBase64(null)
      setFileName('')
      onClose()
      onSuccess?.()
    } catch (err: any) {
      console.error('Failed to submit re-issuance request:', err)
      const msg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to submit request.')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DetailsModal
      open={open}
      onClose={onClose}
      title="Request New Certificate"
      description={
        applicantName
          ? `Submit replacement request for ${applicantName}${
              trackingNumber ? ` (${trackingNumber})` : ''
            }`
          : 'Submit replacement certificate request'
      }
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Reason for Re-issuance */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason for Re-issuance <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {reason.length} / 500 characters
            </span>
          </div>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why the applicant needs a replacement certificate..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
          />
        </div>

        {/* 2. Date of Loss & OR Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date of Loss / Incident <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dateOfLoss}
              onChange={(e) => setDateOfLoss(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              OR Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OR-99214"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* 3. Affidavit Attachment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Affidavit Attachment <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-50/70 text-blue-600 hover:bg-blue-100 text-xs font-semibold cursor-pointer border border-blue-100/80 transition-colors">
              Choose File
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <span className="text-xs text-slate-500 truncate max-w-xs">
              {fileName || 'No file chosen'}
            </span>
          </div>
        </div>

        {/* Clean Action Footer (Matching Screenshot 2) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </DetailsModal>
  )
}
