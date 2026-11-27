import React, { useState } from 'react'
import {
  X,
  MessageSquare,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  FileText,
  FileCheck,
} from 'lucide-react'
import { bcpcApi, type BcpcReferral, type BcpcReferralFeedbackPayload } from '@/config/api/modules/bcpc.api'

interface BcpcReferralFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  referral: BcpcReferral | null
  onSuccess: (updated: BcpcReferral) => void
  isCicl?: boolean
}

export const BcpcReferralFeedbackModal: React.FC<BcpcReferralFeedbackModalProps> = ({
  isOpen,
  onClose,
  referral,
  onSuccess,
  isCicl = false,
}) => {
  const [dateReceived, setDateReceived] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [responseMode, setResponseMode] = useState<'update' | 'accepted' | 'declined'>('accepted')
  const [feedbackType, setFeedbackType] = useState<string>('DISCERNMENT_ASSESSMENT')
  const [feedbackTypeOther, setFeedbackTypeOther] = useState<string>('')

  // Discernment fields
  const [discernmentResult, setDiscernmentResult] = useState<'WITH_DISCERNMENT' | 'WITHOUT_DISCERNMENT'>('WITH_DISCERNMENT')
  const [discernmentIntervention, setDiscernmentIntervention] = useState<'COMMUNITY_BASED' | 'CENTER_BASED'>('COMMUNITY_BASED')
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [socialWorkerName, setSocialWorkerName] = useState<string>('')

  // Safety / General Assessment
  const [safetyRecommendation, setSafetyRecommendation] = useState<string>('RETURN_TO_PARENT_GUARDIAN')
  const [assessmentFindings, setAssessmentFindings] = useState<string>('')
  const [recommendedFamilySupport, setRecommendedFamilySupport] = useState<string>('')
  const [recommendedPsychosocialAction, setRecommendedPsychosocialAction] = useState<string>('')

  // Decline
  const [reasonForDecline, setReasonForDecline] = useState<string>('')

  // Details
  const [details, setDetails] = useState<string>('')

  // File Upload
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofFileData, setProofFileData] = useState<string>('')
  const [proofFileName, setProofFileName] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !referral) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must not exceed 10MB.')
      return
    }

    setProofFile(file)
    setProofFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      setProofFileData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!dateReceived) {
      setError('Please provide the date feedback was received.')
      return
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (dateReceived > todayStr) {
      setError('Date received cannot be in the future.')
      return
    }

    if (responseMode === 'declined') {
      if (!reasonForDecline.trim()) {
        setError('Please provide the official reason for decline.')
        return
      }
      if (reasonForDecline.trim().length < 5) {
        setError('Reason for decline must be at least 5 characters.')
        return
      }
    }

    if (responseMode === 'accepted') {
      if (feedbackType === 'OTHER' && !feedbackTypeOther.trim()) {
        setError('Please specify the custom assessment or feedback type.')
        return
      }
      if (assessmentDate && assessmentDate > todayStr) {
        setError('Assessment date cannot be in the future.')
        return
      }
    }

    if (socialWorkerName.trim()) {
      const cleanName = socialWorkerName.trim()
      if (cleanName.length < 2) {
        setError('Social worker / caseworker name must be at least 2 characters.')
        return
      }
      if (/\d/.test(cleanName)) {
        setError('Social worker name must not contain numbers.')
        return
      }
      if (!/^[a-zA-ZñÑ\s.'-]+$/.test(cleanName)) {
        setError('Social worker name must contain letters and spaces only.')
        return
      }
    }

    if (responseMode !== 'declined') {
      const mainText = details.trim() || assessmentFindings.trim()
      if (!mainText) {
        setError('Please provide the assessment details and recommendations.')
        return
      }
      if (mainText.length < 10) {
        setError('Assessment details must be at least 10 characters for a complete official record.')
        return
      }
    }

    try {
      setLoading(true)

      const payload: BcpcReferralFeedbackPayload = {
        dateReceived,
        feedbackResponse:
          responseMode === 'accepted'
            ? 'Accepted'
            : responseMode === 'declined'
            ? 'Declined'
            : 'Status Update',
        acceptedByAgency: responseMode === 'accepted',
        declinedByAgency: responseMode === 'declined',
        reasonForDecline: responseMode === 'declined' ? reasonForDecline.trim() : undefined,
        feedbackTypeCode: responseMode === 'accepted' ? feedbackType : 'ACKNOWLEDGEMENT_ONLY',
        feedbackTypeOther: feedbackType === 'OTHER' ? feedbackTypeOther.trim() : undefined,
        details: (details.trim() || assessmentFindings.trim()),
        assessmentFindings: assessmentFindings.trim() || undefined,
        socialWorkerName: socialWorkerName.trim() || undefined,
        assessmentDate,
        discernmentResult:
          responseMode === 'accepted' && feedbackType === 'DISCERNMENT_ASSESSMENT'
            ? discernmentResult
            : undefined,
        recommendationType:
          responseMode === 'accepted' && feedbackType === 'DISCERNMENT_ASSESSMENT'
            ? (discernmentResult === 'WITHOUT_DISCERNMENT' ? discernmentIntervention : undefined)
            : (responseMode === 'accepted' && feedbackType === 'SAFETY_PROTECTION_ASSESSMENT' ? safetyRecommendation : undefined),
        recommendedFamilySupport:
          feedbackType === 'FAMILY_SUPPORT_ASSESSMENT' ? recommendedFamilySupport.trim() : undefined,
        recommendedPsychosocialAction:
          feedbackType === 'PSYCHOSOCIAL_ASSESSMENT' ? recommendedPsychosocialAction.trim() : undefined,
        proofFileData: proofFileData || undefined,
        proofFileName: proofFileName || undefined,
      }

      const res = await bcpcApi.recordReferralFeedback(referral.caseId, referral.id, payload)
      onSuccess(res)
      onClose()
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to record feedback. Please check backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Log Feedback / Agency Response
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control No: {referral.referralControlNumber} · {referral.referredToOther || referral.referredTo}
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto min-h-0 bg-white text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Date Received & Response Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Date Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Agency Response Status <span className="text-red-500">*</span>
                </label>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-full justify-between">
                  <button
                    type="button"
                    onClick={() => setResponseMode('update')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      responseMode === 'update'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Update Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseMode('accepted')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      responseMode === 'accepted'
                        ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseMode('declined')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      responseMode === 'declined'
                        ? 'bg-white text-red-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Declined
                  </button>
                </div>
              </div>
            </div>

            {/* When Accepted: Assessment Type Selection */}
            {responseMode === 'accepted' && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Type of Assessment / Feedback <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="DISCERNMENT_ASSESSMENT">Discernment Assessment (RA 9344 / RA 10630)</option>
                    <option value="INTERVENTION_ASSESSMENT">Intervention Assessment / Recommendation</option>
                    <option value="SAFETY_PROTECTION_ASSESSMENT">Safety / Protection Assessment</option>
                    <option value="FAMILY_SUPPORT_ASSESSMENT">Family Support Assessment</option>
                    <option value="PSYCHOSOCIAL_ASSESSMENT">Psychosocial Assessment</option>
                    <option value="ACKNOWLEDGEMENT_ONLY">Acknowledgement / Status Update Only</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* If Other Type Selected */}
                {feedbackType === 'OTHER' && (
                  <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Specify Assessment / Feedback Type <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[11px] tabular-nums ${feedbackTypeOther.length >= 50 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {feedbackTypeOther.length} / 50
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="e.g. Medical / Physical Examination, Psychological Report"
                      value={feedbackTypeOther}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^a-zA-ZñÑ0-9\s.,()/-]/g, '').slice(0, 50)
                        setFeedbackTypeOther(clean)
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {/* Discernment Specific Fields */}
                {feedbackType === 'DISCERNMENT_ASSESSMENT' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Does the child have discernment? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="discernment"
                            value="WITH_DISCERNMENT"
                            checked={discernmentResult === 'WITH_DISCERNMENT'}
                            onChange={() => setDiscernmentResult('WITH_DISCERNMENT')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          With Discernment
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="discernment"
                            value="WITHOUT_DISCERNMENT"
                            checked={discernmentResult === 'WITHOUT_DISCERNMENT'}
                            onChange={() => setDiscernmentResult('WITHOUT_DISCERNMENT')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Acted Without Discernment
                        </label>
                      </div>
                    </div>

                    {discernmentResult === 'WITHOUT_DISCERNMENT' && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-xs font-semibold text-slate-700">
                          Recommended Intervention <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={discernmentIntervention}
                          onChange={(e: any) => setDiscernmentIntervention(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          <option value="COMMUNITY_BASED">Community-Based Intervention Program</option>
                          <option value="CENTER_BASED">Center-Based / Bahay Pag-asa Facility Placement</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Safety / Protection Specific Fields */}
                {feedbackType === 'SAFETY_PROTECTION_ASSESSMENT' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                    <label className="block text-xs font-semibold text-slate-700">
                      Recommendation / Disposition <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={safetyRecommendation}
                      onChange={(e) => setSafetyRecommendation(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="RETURN_TO_PARENT_GUARDIAN">Return / Turn Over to Parent or Guardian</option>
                      <option value="REFER_FOR_INTERVENTION">Refer for Barangay Intervention</option>
                      <option value="TURN_OVER_TO_LSWDO">Turn Over to LSWDO for Protective Custody</option>
                      <option value="FURTHER_ASSESSMENT_REQUIRED">Further Safety Assessment Required</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                )}

                {/* Social Worker & Assessment Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Social Worker / Caseworker Name
                      </label>
                      <span className={`text-[11px] tabular-nums ${socialWorkerName.length >= 50 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {socialWorkerName.length} / 50
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="e.g. Maria Santos"
                      value={socialWorkerName}
                      onChange={(e) => {
                        // Letters, spaces, dots, dashes, apostrophes only. Strictly blocks all numbers (0-9) and symbols!
                        const clean = e.target.value.replace(/[^a-zA-ZñÑ\s.'-]/g, '').slice(0, 50)
                        setSocialWorkerName(clean)
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Assessment Date
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* When Declined */}
            {responseMode === 'declined' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Reason for Decline <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] tabular-nums ${reasonForDecline.length >= 500 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                    {reasonForDecline.length} / 500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={reasonForDecline}
                  onChange={(e) => setReasonForDecline(e.target.value)}
                  placeholder="State the official ground for decline or redirection by agency..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Feedback Details / Findings */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Assessment Details & Findings / Recommendations <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] tabular-nums ${details.length >= 1000 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                  {details.length} / 1000
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Enter comprehensive findings, recommendations, and disposition received from partner agency..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Supporting Document Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Supporting Document / Official Report (Optional)
              </label>
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="referral-proof-file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="referral-proof-file" className="cursor-pointer block">
                  {proofFileName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold">
                      <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-xs">{proofFileName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setProofFile(null)
                          setProofFileName('')
                          setProofFileData('')
                        }}
                        className="ml-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-slate-500">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <span className="font-medium text-blue-600 hover:underline">Click to attach report</span>
                      <span className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Footer matching Custody style */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 px-6 py-4 bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Record Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
