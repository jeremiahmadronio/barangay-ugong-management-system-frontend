import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { DetailsModal } from '@/components/ui/DetailsModal'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type { LinkedBlotterResponseDTO, ReIssuanceRequestDto } from '@/config/api/ftjs/ftjs.types'
import { formatDate } from '@/utils/formatters'

interface FtjsReissuanceModalProps {
  open: boolean
  onClose: () => void
  ftjsId: number
  applicantName?: string
  trackingNumber?: string
  linkedBlotter?: LinkedBlotterResponseDTO | null
  onSuccess?: () => void
}

export function FtjsReissuanceModal({
  open,
  onClose,
  ftjsId,
  applicantName,
  trackingNumber,
  linkedBlotter: initialLinkedBlotter,
  onSuccess,
}: FtjsReissuanceModalProps) {
  const [linkedBlotter, setLinkedBlotter] = useState<LinkedBlotterResponseDTO | null>(
    initialLinkedBlotter || null
  )
  const [loadingBlotter, setLoadingBlotter] = useState(false)
  const [orNumber, setOrNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialLinkedBlotter) {
        setLinkedBlotter(initialLinkedBlotter)
      } else {
        setLoadingBlotter(true)
        ftjsService
          .getLinkedBlotter(ftjsId)
          .then((data) => setLinkedBlotter(data))
          .catch(() => setLinkedBlotter(null))
          .finally(() => setLoadingBlotter(false))
      }
    }
  }, [open, ftjsId, initialLinkedBlotter])

  const isApproved =
    linkedBlotter &&
    linkedBlotter.documentReissuanceStatus === 'APPROVED_FOR_REISSUANCE' &&
    !linkedBlotter.isAlreadyReissued

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isApproved) {
      setError(
        'A cleared Blotter verification is required before this certificate can be reissued.'
      )
      return
    }

    const cleanedOr = orNumber.trim().replace(/\D/g, '')
    if (!cleanedOr) {
      setError('Please enter the Official Receipt (OR) Number.')
      return
    }

    if (cleanedOr.length !== 8) {
      setError('Official Receipt (OR) Number must be exactly 8 digits.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload: ReIssuanceRequestDto = {
        ftjsId,
        orNumber: orNumber.trim(),
        blotterCaseId: linkedBlotter?.blotterId,
      }

      await ftjsService.createReIssuanceRequest(ftjsId, payload)

      setOrNumber('')
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
      title="Reissue FTJS Certificate"
      description={
        applicantName
          ? `Submit replacement certificate for ${applicantName}${
              trackingNumber ? ` (${trackingNumber})` : ''
            }`
          : 'Submit replacement certificate request'
      }
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
            {error}
          </div>
        )}

        {loadingBlotter ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Blotter clearance status...
          </div>
        ) : linkedBlotter && isApproved ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <h4 className="text-xs font-bold text-emerald-900">
                Authoritative Blotter Verification Cleared
              </h4>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                Incident details, loss justification, and the Affidavit of Loss are authoritatively derived from Blotter Case #{linkedBlotter.blotterNumber}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Blotter Case Number</span>
                <span className="font-semibold text-slate-800">#{linkedBlotter.blotterNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Date of Loss / Incident</span>
                <span className="font-semibold text-slate-800">{formatDate(linkedBlotter.dateOfIncident)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Nature of Incident</span>
                <span className="font-semibold text-slate-800">{linkedBlotter.natureOfComplaint || 'Lost Document / Lost Certificate'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Affidavit of Loss</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {linkedBlotter.affidavitFileName || 'Affidavit Attached from Blotter'}
                </span>
              </div>
              {linkedBlotter.reviewedBy && (
                <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-medium block">Cleared By Officer</span>
                  <span className="font-semibold text-slate-800">{linkedBlotter.reviewedBy}</span>
                </div>
              )}
            </div>

            {/* Official Receipt Number input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Official Receipt (OR) Number <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {orNumber.length}/8
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={8}
                placeholder="e.g. 12345678"
                value={orNumber}
                onChange={(e) => {
                  const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setOrNumber(numbersOnly)
                }}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter 8 digits (numbers only).
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            {linkedBlotter?.documentReissuanceStatus === 'PENDING_VERIFICATION'
              ? `Blotter Case #${linkedBlotter.blotterNumber} is currently pending review.`
              : 'A verified Blotter record is required before this certificate can be reissued.'}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {isApproved && (
            <button
              type="submit"
              disabled={submitting || orNumber.length !== 8}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? 'Submitting...' : 'Reissue Certificate'}
            </button>
          )}
        </div>
      </form>
    </DetailsModal>
  )
}
