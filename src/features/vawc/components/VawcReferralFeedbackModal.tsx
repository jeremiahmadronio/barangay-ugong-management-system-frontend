import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import {
  X,
  Loader2,
  UploadCloud,
  FileText,
  Trash2,
} from 'lucide-react'
import { vawcApi, fileToBase64 } from '@/api/modules/vawc.api'
import type { FeedbackOptions } from '@/hooks/useDialogs'

interface VawcReferralFeedbackModalProps {
  isOpen: boolean
  caseId: string | number
  referralId: string | number
  agencyName: string
  controlNumber?: string
  onClose: () => void
  onSuccess: () => void
  showFeedback: (props: FeedbackOptions) => void
}

type ResolutionChoice = 'UPDATE_ONLY' | 'DECLINED' | 'RESOLVED'

export function VawcReferralFeedbackModal({
  isOpen,
  caseId,
  referralId,
  agencyName,
  controlNumber,
  onClose,
  onSuccess,
  showFeedback,
}: VawcReferralFeedbackModalProps) {
  const [dateReceived, setDateReceived] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [details, setDetails] = useState<string>('')
  const [resolutionChoice, setResolutionChoice] = useState<ResolutionChoice>('UPDATE_ONLY')
  const [reasonForDecline, setReasonForDecline] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      setDateReceived(today.toISOString().split('T')[0])
      setDetails('')
      setResolutionChoice('UPDATE_ONLY')
      setReasonForDecline('')
      setUploadedFile(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isFormValid =
    details.trim().length > 0 &&
    (resolutionChoice !== 'DECLINED' || reasonForDecline.trim().length > 0)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      showFeedback({
        variant: 'error',
        title: 'File Too Large',
        description: 'Selected file exceeds the 10MB limit. Please upload a smaller file.',
      })
      return
    }
    setUploadedFile(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!details.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Feedback Details Required',
        description: 'Please enter the agency feedback details or response summary.',
      })
      return
    }

    if (resolutionChoice === 'DECLINED' && !reasonForDecline.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Reason for Decline Required',
        description: 'Please specify the reason why the referral was declined by the agency.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      let fileData: string | undefined = undefined
      let fileName: string | undefined = undefined

      if (uploadedFile) {
        fileData = await fileToBase64(uploadedFile)
        fileName = uploadedFile.name
      }

      await vawcApi.addReferralFeedback(caseId, referralId, {
        details: details.trim(),
        resolvesCase: resolutionChoice === 'RESOLVED',
        resolutionType: resolutionChoice === 'RESOLVED' ? 'SETTLED' : undefined,
        declinedByAgency: resolutionChoice === 'DECLINED',
        reasonForDecline: resolutionChoice === 'DECLINED' ? reasonForDecline.trim() : undefined,
        proofFileData: fileData,
        proofFileName: fileName,
      })

      showFeedback({
        variant: 'success',
        title: 'Feedback Logged',
        description: `Agency response from ${agencyName} has been successfully recorded.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to log referral feedback:', err)
      showFeedback({
        variant: 'error',
        title: 'Feedback Error',
        description:
          err?.message ||
          err?.response?.data?.message ||
          'Failed to record agency feedback. Please try again.',
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
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Log Feedback / Agency Response
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {controlNumber ? `${controlNumber} • ` : ''}{agencyName}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Date Received */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 tracking-wide">
              Date Received <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full h-10 px-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Feedback Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 tracking-wide">
                Feedback Details <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  details.length >= 480 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {details.length} / 500 max characters
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Enter agency feedback or update..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full p-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Does this resolve the case? Radio Group */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 tracking-wide">
              Does this resolve the case? <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-5 pt-0.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionOption"
                  value="UPDATE_ONLY"
                  checked={resolutionChoice === 'UPDATE_ONLY'}
                  onChange={() => setResolutionChoice('UPDATE_ONLY')}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>No – update only</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionOption"
                  value="DECLINED"
                  checked={resolutionChoice === 'DECLINED'}
                  onChange={() => setResolutionChoice('DECLINED')}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Declined by Agency</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="resolutionOption"
                  value="RESOLVED"
                  checked={resolutionChoice === 'RESOLVED'}
                  onChange={() => setResolutionChoice('RESOLVED')}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Yes – mark as Resolved</span>
              </label>
            </div>
          </div>

          {/* Additional Fields when Declined by Agency */}
          {resolutionChoice === 'DECLINED' && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              {/* Reason for Decline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Reason for Decline <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium tabular-nums ${
                      reasonForDecline.length >= 480 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {reasonForDecline.length} / 500 max characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="State reason for decline..."
                  value={reasonForDecline}
                  onChange={(e) => setReasonForDecline(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Upload Decline Letter/Notice */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  Upload Decline Letter/Notice
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                />

                {!uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/40 rounded-xl p-5 text-center cursor-pointer transition-colors"
                  >
                    <UploadCloud size={24} className="mx-auto text-blue-500 mb-1.5" />
                    <p className="text-xs font-bold text-blue-600">
                      Upload a file <span className="font-normal text-slate-500">or drag and drop</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PDF, PNG, JPG, DOC up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText size={18} className="text-blue-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Optional: Upload the decline letter/notice if available.
                </p>
              </div>
            </div>
          )}

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
                  <span>Saving Entry...</span>
                </>
              ) : (
                <span>Save Entry</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
