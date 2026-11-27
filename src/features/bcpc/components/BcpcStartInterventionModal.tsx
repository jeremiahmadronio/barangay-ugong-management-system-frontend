import React, { useState, useEffect } from 'react'
import {
  X,
  FileCheck,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  bcpcApi,
  type BcpcIntervention,
  type BcpcInterventionType,
  type BcpcInterventionCreatePayload,
} from '@/config/api/modules/bcpc.api'

interface BcpcStartInterventionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newIntervention: BcpcIntervention) => void
  caseId: string | number
  caseNumber?: string
  childName?: string
  childCategory?: string
  suggestedType?: BcpcInterventionType
  suggestedFacilitator?: string
}

const INTERVENTION_TYPES: { value: BcpcInterventionType; label: string }[] = [
  { value: 'COMMUNITY_BASED_SERVICE', label: 'Community-Based Intervention' },
  { value: 'INDIVIDUAL_COUNSELING', label: 'Individual Counseling & Guidance' },
  { value: 'PARENTAL_GUIDANCE_AND_MONITORING', label: 'Parental Guidance & Home Monitoring' },
  { value: 'FAMILY_LIFE_EDUCATION', label: 'Parent Effectiveness Service (PES)' },
  { value: 'SKILLS_TRAINING_AND_EDUCATION', label: 'Skills Training & Alternative Learning (ALS)' },
  { value: 'DIVERSION_CONTRACT_PROGRAM', label: 'Barangay Diversion Program (CICL)' },
  { value: 'REPARATION_OR_RESTITUTION', label: 'Reparation & Restitution' },
  { value: 'REFERRAL_TO_YOUTH_REHABILITATION_CENTER', label: 'Youth Care Facility Placement' },
]

const COMMON_PROGRAM_TITLES = [
  'Community-Based Intervention Program',
  'Individual Counseling & Moral Recovery Program',
  'Parental Guidance & Home Monitoring Program',
  'Parent Effectiveness Service (PES) Program',
  'Alternative Learning System (ALS) Educational Support',
  'Barangay Youth Diversion Program',
  'Community Service & Restorative Program',
  'Other',
]

const COMMON_AGENCIES = [
  'Barangay BCPC Committee',
  'Local Social Welfare and Development Office (LSWDO / CSWDO)',
  'Barangay Health Center',
  'Department of Education (DepEd / ALS)',
  'PNP Women and Children Protection Desk (PNP-WCPD)',
  'Bahay Pag-asa / Youth Care Facility',
  'Other',
]

export const BcpcStartInterventionModal: React.FC<BcpcStartInterventionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  caseId,
  caseNumber,
  childName,
  childCategory,
  suggestedType,
  suggestedFacilitator,
}) => {
  const [interventionType, setInterventionType] = useState<BcpcInterventionType>(
    suggestedType || 'COMMUNITY_BASED_SERVICE'
  )

  // Program Title selection
  const [selectedTitle, setSelectedTitle] = useState('Community-Based Intervention Program')
  const [customTitle, setCustomTitle] = useState('')

  // Implementing Agency selection
  const [selectedAgency, setSelectedAgency] = useState('Barangay BCPC Committee')
  const [customAgency, setCustomAgency] = useState('')

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (suggestedFacilitator) {
      if (COMMON_AGENCIES.includes(suggestedFacilitator)) {
        setSelectedAgency(suggestedFacilitator)
        setCustomAgency('')
      } else if (
        suggestedFacilitator.toUpperCase().includes('LSWDO') ||
        suggestedFacilitator.toUpperCase().includes('CSWDO')
      ) {
        setSelectedAgency('Local Social Welfare and Development Office (LSWDO / CSWDO)')
        setCustomAgency('')
      } else {
        setSelectedAgency('Other')
        setCustomAgency(suggestedFacilitator)
      }
    }
  }, [suggestedFacilitator])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const resolvedTitle = selectedTitle === 'Other' ? customTitle.trim() : selectedTitle
    if (!resolvedTitle) {
      setError('Please provide a Program Title.')
      return
    }

    if (selectedAgency === 'Other' && !customAgency.trim()) {
      setError('Please specify the Implementing Agency.')
      return
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      setError('Target Completion Date cannot be earlier than Start Date.')
      return
    }

    const resolvedAgency =
      selectedAgency === 'Other' ? customAgency.trim() : selectedAgency

    try {
      setIsSubmitting(true)
      const payload: BcpcInterventionCreatePayload = {
        interventionType,
        programTitle: resolvedTitle,
        facilitatorOrAgency: resolvedAgency || 'Barangay BCPC Committee',
        startDate,
        endDate: endDate ? endDate : undefined,
        description: description.trim() || undefined,
      }

      const created = await bcpcApi.createIntervention(caseId, payload)
      onSuccess(created)
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to establish intervention plan. Please check your connection.'
      setError(String(msg))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck size={18} className="text-blue-600" />
              Initiate Child Intervention & Monitoring Plan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : ''}
              {childName ? ` — ${childName}` : ''}
              {childCategory ? ` · ${childCategory === 'CICL' ? 'CICL' : 'Child at Risk (CAR)'}` : ''}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Program Type & Title */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              1. Program Type & Title
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Intervention Type Dropdown (Shield icon removed) */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Intervention Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as BcpcInterventionType)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {INTERVENTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Title Dropdown with Other option */}
              <div className={selectedTitle === 'Other' ? 'space-y-2' : ''}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Program Title <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTitle}
                  onChange={(e) => {
                    setSelectedTitle(e.target.value)
                    if (e.target.value !== 'Other') {
                      setCustomTitle('')
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {COMMON_PROGRAM_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                {selectedTitle === 'Other' && (
                  <div className="animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Specify Program Title <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">{customTitle.length} / 150</span>
                    </div>
                    <input
                      type="text"
                      maxLength={150}
                      placeholder="Enter custom program title..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Objectives & Action Plan */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              2. Objectives & Action Plan
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Program Objectives & Activities
                </label>
                <span className="text-[10px] text-slate-400">{description.length} / 1000</span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Enter specific objectives, scheduled activities, and guidance plan for the child..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Section 3: Implementation & Schedule Details */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              3. Schedule & Implementing Agency
            </label>
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Implementing Agency */}
              <div className={selectedAgency === 'Other' ? 'sm:col-span-1 space-y-2' : ''}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Implementing Agency <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAgency}
                  onChange={(e) => {
                    setSelectedAgency(e.target.value)
                    if (e.target.value !== 'Other') {
                      setCustomAgency('')
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {COMMON_AGENCIES.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>

                {selectedAgency === 'Other' && (
                  <div className="animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Specify Agency Name <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">{customAgency.length} / 150</span>
                    </div>
                    <input
                      type="text"
                      maxLength={150}
                      placeholder="e.g. Bahay Kalinga / Local NGO"
                      value={customAgency}
                      onChange={(e) => setCustomAgency(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  Target Completion Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions - NO ICON on Establish Intervention button */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 shrink-0 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Plan...</span>
                </>
              ) : (
                <span>Establish Intervention Plan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
