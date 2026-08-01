import { useState } from 'react'
import { Layers, FileText, FileSpreadsheet } from 'lucide-react'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { FeedbackDialog } from '@/components/ui'
import { useDialogs } from '@/hooks/useDialogs'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'

export function SystemAdminReusablePage() {
  const [activeTab, setActiveTab] = useState<'FORMAL' | 'RECORD'>('FORMAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showFeedback, feedbackDialogProps } = useDialogs()

  const handleSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)

    showFeedback({
      variant: 'success',
      title: data.mode === 'FORMAL_COMPLAINT' ? 'Formal Complaint Demo Submitted!' : 'For the Record Demo Submitted!',
      description: `Case #${data.caseInfo.caseNumber} has been validated and submitted successfully in showcase mode.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Showcase Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Layers className="w-3.5 h-3.5" /> Component Showcase & Testing
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Reusable Complaint Forms & UI Components
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Preview, test, and validate the official Philippines PSGC Address Dropdowns, Form Field Validations, and Complaint Form Components.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex p-1.5 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('FORMAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'FORMAL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Formal Complaint Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RECORD')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'RECORD'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> For the Record Form
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm">
        {activeTab === 'FORMAL' ? (
          <FormalComplaintForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <ForTheRecordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </div>

      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
