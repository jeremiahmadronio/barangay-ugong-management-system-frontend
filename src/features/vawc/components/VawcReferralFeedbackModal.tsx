import React, { useState, useEffect } from 'react'
import {
  X,
  Loader2,
  UploadCloud,
  FileText,
  Trash2,
} from 'lucide-react'
import { vawcApi, fileToBase64, type VawcReferralResponse } from '@/config/api/modules/vawc.api'

interface VawcReferralFeedbackModalProps {
  isOpen: boolean
  caseId: string | number
  referral: VawcReferralResponse | null
  onClose: () => void
  onSuccess: () => void
  showFeedback: (options: { variant: 'success' | 'error'; title: string; description: string }) => void
}

export function VawcReferralFeedbackModal({
  isOpen,
  caseId,
  referral,
  onClose,
  onSuccess,
  showFeedback,
}: VawcReferralFeedbackModalProps) {
  const [outcome, setOutcome] = useState<'UPDATE_ONLY' | 'DECLINED' | 'RESOLVED'>('UPDATE_ONLY')
  const [details, setDetails] = useState('')
  const [reasonForDecline, setReasonForDecline] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [existingFileName, setExistingFileName] = useState<string | null>(null)
  const [existingFileData, setExistingFileData] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && referral) {
      if (referral.feedback) {
        if (referral.feedback.declinedByAgency) {
          setOutcome('DECLINED')
        } else if (referral.feedback.resolvesCase) {
          setOutcome('RESOLVED')
        } else {
          setOutcome('UPDATE_ONLY')
        }
        setDetails(referral.feedback.details || '')
        setReasonForDecline(referral.feedback.reasonForDecline || '')
        setExistingFileName(referral.feedback.proofFileName || null)
        setExistingFileData(referral.feedback.proofFileData || null)
      } else {
        setOutcome('UPDATE_ONLY')
        setDetails('')
        setReasonForDecline('')
        setExistingFileName(null)
        setExistingFileData(null)
      }
      setAttachedFile(null)
    }
  }, [isOpen, referral])

  if (!isOpen || !referral) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showFeedback({
          variant: 'error',
          title: 'File Too Large',
          description: 'Please upload a document or image smaller than 10MB.',
        })
        return
      }
      setAttachedFile(file)
      setExistingFileName(null)
      setExistingFileData(null)
    }
  }

  const handleRemoveExistingFile = () => {
    setExistingFileName(null)
    setExistingFileData(null)
    setAttachedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!details.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Feedback Details Required',
        description: 'Please enter the agency feedback narrative or action taken.',
      })
      return
    }

    if (outcome === 'DECLINED' && !reasonForDecline.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Reason for Decline Required',
        description: 'Please provide the specific reason why the partner agency declined the referral.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      let fileData: string | undefined = existingFileData || undefined
      let fileName: string | undefined = existingFileName || undefined

      if (attachedFile) {
        fileData = await fileToBase64(attachedFile)
        fileName = attachedFile.name
      }

      await vawcApi.addReferralFeedback(caseId, referral.id!, {
        details: details.trim(),
        declinedByAgency: outcome === 'DECLINED',
        reasonForDecline: outcome === 'DECLINED' ? reasonForDecline.trim() : undefined,
        resolvesCase: outcome === 'RESOLVED',
        resolutionType: outcome === 'RESOLVED' ? 'Referred Agency Resolution' : undefined,
        proofFileName: fileName,
        proofFileData: fileData,
      })

      showFeedback({
        variant: 'success',
        title: 'Feedback Saved Successfully',
        description: `Feedback from ${referral.referredTo} has been updated.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to log referral feedback:', err)
      showFeedback({
        variant: 'error',
        title: 'Submission Failed',
        description: err?.message || 'Failed to record agency feedback. Please try again.',
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
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Clean Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Record Agency Feedback
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-slate-500">
                {referral.referralControlNumber || 'Referral'}
              </span>
              {referral.referredTo && (
                <>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[280px]">
                    {referral.referredTo}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto max-h-[70vh]">
          {/* Outcome Radio Options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Agency Response / Case Outcome <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex flex-col p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  outcome === 'UPDATE_ONLY'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="UPDATE_ONLY"
                  checked={outcome === 'UPDATE_ONLY'}
                  onChange={() => setOutcome('UPDATE_ONLY')}
                  className="sr-only"
                />
                <span className="font-bold">Update Only</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">Progress logged</span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  outcome === 'DECLINED'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-1 ring-rose-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="DECLINED"
                  checked={outcome === 'DECLINED'}
                  onChange={() => setOutcome('DECLINED')}
                  className="sr-only"
                />
                <span className="font-bold">Declined</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">Agency rejected</span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  outcome === 'RESOLVED'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="RESOLVED"
                  checked={outcome === 'RESOLVED'}
                  onChange={() => setOutcome('RESOLVED')}
                  className="sr-only"
                />
                <span className="font-bold">Resolved</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">Case settled</span>
              </label>
            </div>
          </div>

          {/* Details / Narrative */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Feedback Narrative / Official Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detail the outcome of the referral, actions taken, or endorsement received..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
            />
          </div>

          {/* If Declined: Decline Reason & File Upload */}
          {outcome === 'DECLINED' && (
            <div className="space-y-3 p-4 rounded-xl border border-rose-200 bg-rose-50/30">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-rose-900">
                  Reason for Decline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reasonForDecline}
                  onChange={(e) => setReasonForDecline(e.target.value)}
                  placeholder="e.g., Lack of jurisdiction, incomplete requirements, referred to PAO"
                  className="w-full text-xs rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Upload Decline Letter / Notice */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-rose-900">
                  Attach Decline Notice / Endorsement Document (Optional)
                </label>

                {attachedFile ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-rose-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {attachedFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : existingFileName ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {existingFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveExistingFile}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-rose-200 bg-white hover:bg-rose-50/40 rounded-xl cursor-pointer transition-colors">
                    <UploadCloud size={20} className="text-rose-500 mb-1" />
                    <span className="text-xs font-semibold text-rose-700">Click or drag file here</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Modal Actions */}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Feedback...</span>
                </>
              ) : (
                <span>Save Feedback</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
