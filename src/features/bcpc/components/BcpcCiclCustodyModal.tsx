import React, { useState } from 'react'
import { X, FileText, Loader2, Calendar, Clock } from 'lucide-react'
import type { BcpcCustodyLog, UpdateCiclCustodyPayload } from '@/config/api/bcpc/bcpc.types'

interface BcpcCiclCustodyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: UpdateCiclCustodyPayload) => Promise<void>
  existingData?: BcpcCustodyLog | null
  caseNumber?: string
}

export const CICL_RESOLUTIONS = [
  'Turned Over to Parent / Guardian',
  'Turned Over to Relative / Other Responsible Person',
  'Turned Over to LSWDO / CSWDO',
  'Turned Over to DSWD / Accredited NGO',
  'Turned Over to Bahay Pag-Asa / IJISC',
  'Turned Over to Youth Care Facility',
  'Other Authorized Custody Arrangement',
] as const

export const CICL_RECIPIENT_ROLES = [
  'Parent (Mother / Father)',
  'Legal Guardian',
  'Relative (Grandparent / Aunt / Uncle)',
  'Social Worker (LSWDO / CSWDO)',
  'Bahay Pag-asa Representative',
  'DSWD / NGO Worker',
  'Barangay Official / Personnel',
  'Police Officer (PNP-WCPD)',
  'Legal Counsel / PAO Lawyer',
  'Other',
] as const

export const BcpcCiclCustodyModal: React.FC<BcpcCiclCustodyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingData,
  caseNumber,
}) => {
  if (!isOpen) return null

  const [wasApprehended, setWasApprehended] = useState<boolean>(
    existingData?.wasApprehended ?? true
  )

  const [resolution, setResolution] = useState<string>(
    existingData?.custodyResolution || CICL_RESOLUTIONS[0]
  )

  const [turnoverDate, setTurnoverDate] = useState<string>(
    existingData?.turnoverDate || new Date().toISOString().split('T')[0]
  )
  const [turnoverTime, setTurnoverTime] = useState<string>(
    existingData?.turnoverTime ||
      new Date().toTimeString().split(' ')[0].substring(0, 5)
  )

  const [releasedTo, setReleasedTo] = useState<string>(
    existingData?.receivingPersonName || ''
  )
  const initialRel = existingData?.receivingRelationship || ''
  const isPredefinedRel = (CICL_RECIPIENT_ROLES as readonly string[]).includes(initialRel)
  const [recipientRole, setRecipientRole] = useState<string>(
    initialRel ? (isPredefinedRel ? initialRel : 'Other') : ''
  )
  const [customRecipientRole, setCustomRecipientRole] = useState<string>(
    initialRel && !isPredefinedRel ? initialRel : ''
  )
  const [contactNumber, setContactNumber] = useState<string>(
    existingData?.contactNumber || ''
  )
  const [turnedOverToSpecify, setTurnedOverToSpecify] = useState<string>('')
  const [delayReason, setDelayReason] = useState<string>(
    existingData?.delayReason || ''
  )
  const [remarks, setRemarks] = useState<string>(
    existingData?.custodyRemarks || ''
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const effectiveRelationship =
      recipientRole === 'Other' ? customRecipientRole.trim() : recipientRole.trim()

    if (wasApprehended) {
      if (!turnoverDate || !turnoverTime) {
        setError('Turnover date and time are required.')
        return
      }
      if (!releasedTo.trim()) {
        setError('Receiving person name is required.')
        return
      }
      if (releasedTo.trim().length > 100) {
        setError('Receiving person name cannot exceed 100 characters.')
        return
      }
      if (recipientRole === 'Other' && !customRecipientRole.trim()) {
        setError('Please specify the role / relationship.')
        return
      }
      if (contactNumber.trim() && (contactNumber.trim().length !== 11 || !contactNumber.trim().startsWith('09'))) {
        setError('Contact number must be exactly 11 digits starting with 09 (e.g. 09XXXXXXXXX).')
        return
      }
      if (delayReason.length > 200) {
        setError('Delay reason cannot exceed 200 characters.')
        return
      }
      if (remarks.length > 1000) {
        setError('Custody remarks cannot exceed 1000 characters.')
        return
      }
    }

    const payload: UpdateCiclCustodyPayload = {
      wasApprehended,
      custodyResolution: wasApprehended ? resolution : 'Not in Custody',
      turnoverDate: wasApprehended ? turnoverDate : undefined,
      turnoverTime: wasApprehended ? turnoverTime : undefined,
      turnedOverTo: wasApprehended ? resolution : undefined,
      turnedOverToSpecify: turnedOverToSpecify.trim() || undefined,
      releasedTo: wasApprehended ? releasedTo.trim() : undefined,
      recipientRelationship: wasApprehended ? (effectiveRelationship || undefined) : undefined,
      contactNumber: wasApprehended ? contactNumber.trim() : undefined,
      delayReason: wasApprehended ? delayReason.trim() : undefined,
      custodyRemarks: remarks.trim(),
    }

    try {
      setLoading(true)
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to update CICL custody record.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header matching image */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              CICL Custody & Turnover Resolution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Section: Status */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              1. Physical Custody Status
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name="ciclApprehended"
                  checked={wasApprehended === true}
                  onChange={() => setWasApprehended(true)}
                  className="text-blue-600"
                />
                <span>Child was taken into custody / apprehended</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name="ciclApprehended"
                  checked={wasApprehended === false}
                  onChange={() => setWasApprehended(false)}
                  className="text-blue-600"
                />
                <span>Not in Custody</span>
              </label>
            </div>
          </div>

          {wasApprehended ? (
            <>
              {/* Section: Resolution & Timing */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  2. Custody Turnover Resolution & Timing
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Custody Resolution <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {CICL_RESOLUTIONS.map((res) => (
                        <option key={res} value={res}>
                          {res}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Turnover Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={turnoverDate}
                      onChange={(e) => setTurnoverDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Turnover Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={turnoverTime}
                      onChange={(e) => setTurnoverTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: Receiving Details */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  3. Receiving Person Information
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Receiving Person Name <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {releasedTo.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      value={releasedTo}
                      maxLength={100}
                      onChange={(e) => setReleasedTo(e.target.value)}
                      placeholder="Full name of receiver"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className={recipientRole === 'Other' ? 'space-y-1.5' : ''}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Relationship / Role
                      </label>
                      {recipientRole === 'Other' && (
                        <span className="text-[10px] text-slate-400">
                          {customRecipientRole.length}/50
                        </span>
                      )}
                    </div>
                    <select
                      value={recipientRole}
                      onChange={(e) => {
                        setRecipientRole(e.target.value)
                        if (e.target.value !== 'Other') {
                          setCustomRecipientRole('')
                        }
                      }}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select relationship / role</option>
                      {CICL_RECIPIENT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    {recipientRole === 'Other' && (
                      <div>
                        <input
                          type="text"
                          value={customRecipientRole}
                          maxLength={50}
                          onChange={(e) => setCustomRecipientRole(e.target.value)}
                          placeholder="Specify relationship / role *"
                          className="w-full text-xs px-3 py-2 bg-white border border-blue-400 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 animate-in fade-in duration-100"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Contact Number
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {contactNumber.length}/11
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={contactNumber}
                      maxLength={11}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setContactNumber(digits)
                      }}
                      placeholder="09XXXXXXXXX"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Delay Reason (if turnover exceeded statutory 8 hours)
                      </label>
                      <span className={`text-[10px] ${delayReason.length >= 200 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {delayReason.length} / 200
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={200}
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="e.g. Awaited parent arrival from province, hospital clearance..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Custody Remarks & Conditions
                      </label>
                      <span className={`text-[10px] ${remarks.length >= 1000 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {remarks.length} / 1000
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Additional notes"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white text-slate-600">
              Child will be marked as Not in Custody. Legal case proceedings will continue without physical detention.
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
