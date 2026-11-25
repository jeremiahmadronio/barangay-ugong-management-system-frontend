import React, { useState, useMemo } from 'react'
import {
  X,
  FileText,
  Printer,
  AlertCircle,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  Loader2,
  Send,
  ChevronDown,
} from 'lucide-react'
import { bcpcApi, type BcpcReferral, type BcpcReferralCreatePayload } from '@/api/modules/bcpc.api'
import { useAuth } from '@/hooks/useAuth'
import { printBcpcReferralLetter } from '../generateBcpcReferralLetter'

interface BcpcIssueReferralModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newReferral: BcpcReferral) => void
  caseId: string | number
  caseNumber?: string
  childName?: string
  childAge?: number | string
  childGender?: string
  childCategory?: string
  incidentType?: string
  existingReferrals?: BcpcReferral[]
}

// CAR (Child at Risk) Agencies
const CAR_AGENCIES = [
  { value: 'LSWDO', label: 'Local Social Welfare and Development Office (LSWDO / CSWDO)' },
  { value: 'BARANGAY_OF_RESIDENCE', label: 'Barangay of Residence' },
  { value: 'PNP_WCPD', label: 'PNP Women and Children Protection Desk (PNP-WCPD)' },
  { value: 'OTHER', label: 'Other Agency / Office' },
]

// CICL (Child in Conflict with the Law) Agencies
const CICL_AGENCIES = [
  { value: 'LSWDO', label: 'Local Social Welfare and Development Office (LSWDO / CSWDO)' },
  { value: 'PNP_WCPD', label: 'PNP Women and Children Protection Desk (PNP-WCPD)' },
  { value: 'PROSECUTOR', label: "City / Provincial Prosecutor's Office" },
  { value: 'BARANGAY_OF_RESIDENCE', label: 'Barangay of Residence' },
  { value: 'OTHER', label: 'Other Agency / Office' },
]

// Purposes for CAR (Child at Risk) - matches reference exactly
const CAR_LSWDO_PURPOSES = [
  'Safety / Protection Assessment',
  'Psychosocial Intervention',
  'Family Support Assessment',
  'Intervention Assessment / Recommendation',
  'Other',
]

// Purposes for CICL (Child in Conflict with the Law)
const CICL_LSWDO_PURPOSES = [
  'Discernment Assessment',
  'Intervention Assessment / Recommendation',
  'Intervention Reassessment / Revised Recommendation',
  'Safety / Protection Assessment',
  'Psychosocial Intervention',
  'Family Support Assessment',
  'Other',
]

const PNP_PURPOSES = [
  'Protective / Law Enforcement Assistance',
  'Investigation / Coordination',
  'Child Protection Assistance',
  'Safety / Immediate Protection Concern',
  'Other',
]

const PROSECUTOR_PURPOSES = ['Failed Diversion Forwarding', 'Other']

const BRGY_RESIDENCE_PURPOSES = ['Transfer / Continuity of Case', 'Other']

export const BcpcIssueReferralModal: React.FC<BcpcIssueReferralModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  caseId,
  caseNumber,
  childName = 'Child on Record',
  childAge,
  childGender,
  childCategory = 'CAR',
  incidentType,
  existingReferrals = [],
}) => {
  const { user } = useAuth()
  const loggedInOfficerName = useMemo(() => {
    if (!user) return 'BCPC Officer'
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (full) return full
    if (user.name && user.name.includes(' ') && !user.name.includes('@')) {
      return user.name
    }
    return 'BCPC Officer'
  }, [user])

  const isCicl = (childCategory || '').toUpperCase() === 'CICL'

  const [referredTo, setReferredTo] = useState<string>('')
  const [referredToCustom, setReferredToCustom] = useState<string>('')
  const [purpose, setPurpose] = useState<string>('')
  const [purposeOther, setPurposeOther] = useState<string>('')
  const [grounds, setGrounds] = useState<string>('')

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issuedReferral, setIssuedReferral] = useState<BcpcReferral | null>(null)

  const groundsWordCount = useMemo(() => {
    return grounds.trim() ? grounds.trim().split(/\s+/u).length : 0
  }, [grounds])

  // Check for duplicate active referral (declared before any early return)
  const duplicateReferral = useMemo(() => {
    if (!referredTo || !purpose) return null
    return existingReferrals.find((r) => {
      const active = (r.status || '').toUpperCase() === 'ACTIVE'
      if (!active) return false
      const sameAgency =
        referredTo === 'OTHER'
          ? (r.referredToOther || '').trim().toLowerCase() === referredToCustom.trim().toLowerCase()
          : r.referredTo === referredTo
      const samePurpose =
        purpose === 'Other'
          ? (r.purposeOther || '').trim().toLowerCase() === purposeOther.trim().toLowerCase()
          : r.purpose === purpose
      return sameAgency && samePurpose
    })
  }, [referredTo, referredToCustom, purpose, purposeOther, existingReferrals])

  const availableAgencies = isCicl ? CICL_AGENCIES : CAR_AGENCIES

  const availablePurposes = useMemo(() => {
    if (!referredTo) return []
    if (referredTo === 'LSWDO') return isCicl ? CICL_LSWDO_PURPOSES : CAR_LSWDO_PURPOSES
    if (referredTo === 'PNP_WCPD') return PNP_PURPOSES
    if (referredTo === 'PROSECUTOR') return PROSECUTOR_PURPOSES
    if (referredTo === 'BARANGAY_OF_RESIDENCE') return BRGY_RESIDENCE_PURPOSES
    return ['Other']
  }, [referredTo, isCicl])

  if (!isOpen) return null

  const handleAgencyChange = (val: string) => {
    setReferredTo(val)
    if (val === 'OTHER') {
      setPurpose('Other')
    } else {
      setPurpose('')
      setReferredToCustom('')
    }
    setPurposeOther('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!referredTo) {
      setError('Please select an Agency / Office.')
      return
    }

    if (referredTo === 'OTHER' && !referredToCustom.trim()) {
      setError('Please specify the custom agency or office name.')
      return
    }

    if (!purpose) {
      setError('Please select the Referral Purpose.')
      return
    }

    if (purpose === 'Other' && !purposeOther.trim()) {
      setError('Please specify the referral purpose.')
      return
    }

    if (!grounds.trim()) {
      setError('Grounds / Reason for Referral is required.')
      return
    }

    if (groundsWordCount > 150) {
      setError('Grounds / Reason for Referral must not exceed 150 words.')
      return
    }

    if (duplicateReferral) {
      setError(`Referral already exists. An active ${purpose} referral to this agency is already pending for this case.`)
      return
    }

    try {
      setLoading(true)
      const payload: BcpcReferralCreatePayload = {
        referredTo,
        referredToOther: referredTo === 'OTHER' ? referredToCustom.trim() : undefined,
        purpose,
        purposeOther: purpose === 'Other' ? purposeOther.trim() : undefined,
        grounds: grounds.trim(),
        referredBy: loggedInOfficerName,
        referralDate: new Date().toISOString(),
      }

      const res = await bcpcApi.issueReferral(caseId, payload)
      setIssuedReferral(res)
      onSuccess(res)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to issue referral. Please check backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!issuedReferral) return
    printBcpcReferralLetter({
      controlNumber: issuedReferral.referralControlNumber,
      caseNumber: caseNumber || issuedReferral.caseNumber || `Case #${caseId}`,
      referralDate: issuedReferral.referralDate || new Date().toISOString(),
      referredTo: issuedReferral.referredTo,
      referredToOther: issuedReferral.referredToOther,
      purpose: issuedReferral.purpose,
      purposeOther: issuedReferral.purposeOther,
      grounds: issuedReferral.grounds,
      referredBy: issuedReferral.referredBy || loggedInOfficerName,
      childName,
      childAge,
      childGender,
      childCategory,
      incidentType,
    })
  }

  const handleClose = () => {
    setIssuedReferral(null)
    setReferredTo('')
    setReferredToCustom('')
    setPurpose('')
    setPurposeOther('')
    setGrounds('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header matching Custody & Turnover design */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Issue Case Referral
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : ''}
              {childName ? ` — ${childName}` : ''}
              {childCategory ? ` · ${childCategory === 'CICL' ? 'CICL' : 'Child at Risk (CAR)'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {issuedReferral ? (
          /* Success Screen */
          <div className="p-8 flex flex-col items-center gap-5 text-center flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Referral Issued Successfully
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Formal endorsement filed for{' '}
                <span className="font-semibold text-slate-800">
                  {issuedReferral.referredToOther || issuedReferral.referredTo}
                </span>{' '}
                under Control No.{' '}
                <span className="font-semibold text-slate-800">
                  {issuedReferral.referralControlNumber}
                </span>.
              </p>
            </div>

            <div className="w-full max-w-md p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Control Number:</span>
                <span className="font-bold text-slate-800">{issuedReferral.referralControlNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Target Agency:</span>
                <span className="font-semibold text-slate-800">{issuedReferral.referredToOther || issuedReferral.referredTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Referral Purpose:</span>
                <span className="font-semibold text-slate-800">{issuedReferral.purposeOther || issuedReferral.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Issued By:</span>
                <span className="font-semibold text-slate-800">{issuedReferral.referredBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Active Referral
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Printer size={15} />
                Print Referral Letter
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form matching reference form structure & options */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {duplicateReferral && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                An active <strong>{purpose}</strong> referral to this agency is already open for this case.
              </div>
            )}

            {/* Section 1: Referral Agency & Purpose */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                1. Target Agency & Referral Purpose
              </label>
              <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1 Lane: Dropdown 1 (Agency) */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Building2 size={11} className="text-slate-400" />
                    Referred To (Agency / Office) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={referredTo}
                    onChange={(e) => handleAgencyChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">— Select Agency / Office —</option>
                    {availableAgencies.map((agency) => (
                      <option key={agency.value} value={agency.value}>
                        {agency.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1 Lane: Dropdown 2 (Referral Purpose) */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Referral Purpose <span className="text-red-500">*</span>
                  </label>
                  {referredTo ? (
                    <select
                      value={purpose}
                      disabled={referredTo === 'OTHER'}
                      onChange={(e) => {
                        setPurpose(e.target.value)
                        if (e.target.value !== 'Other') setPurposeOther('')
                      }}
                      className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none ${
                        referredTo === 'OTHER'
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 cursor-pointer'
                      }`}
                    >
                      <option value="">— Select Purpose —</option>
                      {availablePurposes.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
                      — Select Agency / Office First —
                    </div>
                  )}
                </div>

                {/* Conditional Custom Inputs (Below the 1-lane dropdowns) */}
                {referredTo === 'OTHER' && (
                  <div className="animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Specify Agency / Office <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] tabular-nums ${referredToCustom.length >= 50 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {referredToCustom.length} / 50
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter custom agency or office..."
                      value={referredToCustom}
                      onChange={(e) => setReferredToCustom(e.target.value.slice(0, 50))}
                      maxLength={50}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {purpose === 'Other' && (
                  <div className={`${referredTo === 'OTHER' ? '' : 'sm:col-span-2'} animate-in fade-in duration-150`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Specify Purpose <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] tabular-nums ${purposeOther.length >= 50 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {purposeOther.length} / 50
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter custom referral purpose..."
                      value={purposeOther}
                      onChange={(e) => setPurposeOther(e.target.value.slice(0, 50))}
                      maxLength={50}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Grounds & Legal Basis */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                2. Grounds & Legal Basis
              </label>
              <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Grounds / Reason for Referral <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={grounds}
                  onChange={(e) => {
                    const nextVal = e.target.value
                    const count = nextVal.trim() ? nextVal.trim().split(/\s+/u).length : 0
                    if (count <= 150) setGrounds(nextVal)
                  }}
                  placeholder="State the reason why this case needs to be referred..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
                <div className="text-[11px] flex justify-between items-center text-slate-400">
                  <span>Provide details on the reason for this referral</span>
                  <span className={groundsWordCount >= 150 ? 'text-red-600 font-semibold' : ''}>
                    {groundsWordCount} / 150 words
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Endorsement Details */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                3. Endorsement Details
              </label>
              <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar size={11} className="text-slate-400" />
                    Date Issued <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={todayStr}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <User size={11} className="text-slate-400" />
                    Referred By
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={loggedInOfficerName}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Footer matching Custody & Turnover style */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(duplicateReferral) || !referredTo || !purpose}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Issue Referral
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
