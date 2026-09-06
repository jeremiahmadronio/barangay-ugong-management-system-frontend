import { useState, useEffect, type FormEvent } from 'react'
import {
  Send,
  X,
  Loader2,
} from 'lucide-react'
import { vawcApi } from '@/api/modules/vawc.api'
import type { FeedbackOptions } from '@/hooks/useDialogs'

interface VawcIssueReferralModalProps {
  isOpen: boolean
  caseId: string | number
  caseNumber: string
  partyName?: string
  assignedOfficer?: string
  onClose: () => void
  onSuccess: () => void
  showFeedback: (props: FeedbackOptions) => void
}

const PRESET_AGENCIES = [
  'PNP Women and Children Protection Center (WCPC)',
  'City Social Welfare and Development Office (CSWD / DSWD)',
  'Public Attorney\'s Office (PAO)',
  'Office of the City Prosecutor',
  'City Health Office / Medico-Legal Hospital Facility',
  'Crisis Intervention Center / Safe Shelter NGO',
  'Barangay Council for the Protection of Children (BCPC)',
  'Lupong Tagapamayapa',
  'Regional Trial Court (RTC) - Family Court',
  'Other Agency or Office',
]

function getFormattedToday(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

export function VawcIssueReferralModal({
  isOpen,
  caseId,
  caseNumber,
  partyName,
  assignedOfficer,
  onClose,
  onSuccess,
  showFeedback,
}: VawcIssueReferralModalProps) {
  const [selectedAgency, setSelectedAgency] = useState<string>('')
  const [customAgency, setCustomAgency] = useState<string>('')
  const [grounds, setGrounds] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dateIssuedDisplay = getFormattedToday()
  const referredByDisplay = assignedOfficer || 'VAWC Desk Officer'

  useEffect(() => {
    if (isOpen) {
      setSelectedAgency('')
      setCustomAgency('')
      setGrounds('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const resolvedAgency =
    selectedAgency === 'Other Agency or Office'
      ? customAgency.trim()
      : selectedAgency

  const isFormValid =
    Boolean(resolvedAgency) &&
    grounds.trim().length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!resolvedAgency) {
      showFeedback({
        variant: 'error',
        title: 'Recipient Agency Required',
        description: 'Please select or specify the agency / office where this case will be referred.',
      })
      return
    }

    if (!grounds.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Grounds Required',
        description: 'Please provide the specific reasons / grounds for referring this case.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await vawcApi.createReferral(caseId, {
        referredTo: resolvedAgency,
        grounds: grounds.trim(),
        referredBy: referredByDisplay,
        referralDate: new Date().toISOString(),
      })

      showFeedback({
        variant: 'success',
        title: 'Case Referral Issued',
        description: `Case ${caseNumber} has been officially referred to ${resolvedAgency}.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to issue referral:', err)
      showFeedback({
        variant: 'error',
        title: 'Referral Failed',
        description:
          err?.message ||
          err?.response?.data?.message ||
          'Failed to issue referral. Please check connection and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Issue Case Referral
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Case {caseNumber}{partyName ? ` — ${partyName}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Field 1: Referred To Agency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 tracking-wide">
              Referred To (Agency / Office) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full h-10 px-3 pr-8 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer"
            >
              <option value="">Select Agency / Office</option>
              {PRESET_AGENCIES.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>

            {selectedAgency === 'Other Agency or Office' && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Enter name of agency or organization..."
                  value={customAgency}
                  onChange={(e) => setCustomAgency(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Field 2: Grounds / Reason for Referral */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                Grounds / Reason for Referral <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  grounds.length >= 480 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {grounds.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="State the reason why this case needs to be referred..."
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full p-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Field 3 & 4: Date Issued & Referred By (Automatic & Non-editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                Date Issued <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={dateIssuedDisplay}
                readOnly
                disabled
                className="w-full h-10 px-3 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed select-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                Referred By
              </label>
              <input
                type="text"
                value={referredByDisplay}
                readOnly
                disabled
                className="w-full h-10 px-3 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Issuing Referral...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Issue Referral</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
