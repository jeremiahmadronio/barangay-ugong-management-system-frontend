import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Save,
  FileText,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Users,
  Paperclip,
  Trash2,
  Plus,
  UserCheck,
} from 'lucide-react'
import { ComplaintEvidenceGrid, DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'
import type { WitnessData } from '@/components/ui/complaint_form/types'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/SearchSelect'
import { residentsApi, type ResidentSearchOption } from '@/config/api/modules/residents.api'
import { blotterApi, fileToBase64 } from '@/config/api/modules/blotter.api'
import { axiosInstance, API_BASE_URL } from '@/config/api/axios.config'

function FormInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  helperText,
}: {
  label: string
  value?: string
  onChange: (val: string) => void
  required?: boolean
  placeholder?: string
  helperText?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
      />
      {helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: {
  label: string
  value?: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
      />
    </div>
  )
}

export interface EditCaseModalProps {
  isOpen: boolean
  caseRecord: any
  onClose: () => void
  onSuccess: () => void
  showFeedback: (opts: { variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => void
}

const NATURE_OPTIONS = [
  { value: 'Physical Injuries', label: 'Physical Injuries / Pang-aabuso sa Katawan' },
  { value: 'Oral Defamation / Slander', label: 'Oral Defamation / Paninirang Puri' },
  { value: 'Threats / Grave Threats', label: 'Threats / Pananakot' },
  { value: 'Property Damage / Malicious Mischief', label: 'Damage to Property / Paninira ng Ari-arian' },
  { value: 'Unjust Vexation / Harassment', label: 'Unjust Vexation / Pang-iinis o Harassment' },
  { value: 'Neighborhood / Boundary Dispute', label: 'Neighborhood / Boundary Dispute' },
  { value: 'Debt / Financial Dispute', label: 'Debt / Financial Dispute' },
  { value: 'Theft / Estafa', label: 'Theft / Estafa / Panloloko' },
  { value: 'Other Violations / Misconduct', label: 'Other Violations / Iba pang Reklamo' },
]

export function EditCaseModal({
  isOpen,
  caseRecord,
  onClose,
  onSuccess,
  showFeedback,
}: EditCaseModalProps) {
  const [activeTab, setActiveTab] = useState<'respondent' | 'incident' | 'narrative' | 'evidence' | 'witnesses'>('respondent')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [loadedDetail, setLoadedDetail] = useState<any>(null)
  const [evidenceMetaMap, setEvidenceMetaMap] = useState<Record<string, { id: any; fileName: string }>>({})
  const [relationshipToComplainant, setRelationshipToComplainant] = useState('')
  const [currentlyLivingWithComplainant, setCurrentlyLivingWithComplainant] = useState<'Yes' | 'No' | ''>('')

  // Incident Details
  const [natureOfComplaint, setNatureOfComplaint] = useState('')
  const [dateOfIncident, setDateOfIncident] = useState('')
  const [timeOfIncident, setTimeOfIncident] = useState('')
  const [placeOfIncident, setPlaceOfIncident] = useState('')
  const [frequencyOfIncident, setFrequencyOfIncident] = useState('')
  const [descriptionOfInjuries, setDescriptionOfInjuries] = useState('')

  // Narrative Statement
  const [statementText, setStatementText] = useState('')
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null)
  const [existingNarrativeFileName, setExistingNarrativeFileName] = useState<string | null>(null)
  const narrativeFileInputRef = useRef<HTMLInputElement | null>(null)

  // Evidences
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File | string | null>>({})
  const [otherEvidence, setOtherEvidence] = useState('')

  // Witnesses
  const [witnesses, setWitnesses] = useState<WitnessData[]>([])
  const [witnessOptionsMap, setWitnessOptionsMap] = useState<Record<string, SearchSelectOption[]>>({})
  const witnessFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Debounced resident search for each witness input
  useEffect(() => {
    witnesses.forEach((witness) => {
      const query = (witness.searchQuery || '').trim()
      const otherWitnessNames = witnesses
        .filter((w) => w.id !== witness.id)
        .map((w) => `${w.firstName || ''} ${w.lastName || ''}`.trim().toLowerCase())
        .filter(Boolean)

      const timer = setTimeout(async () => {
        try {
          const residents = await residentsApi.searchActive(query)
          if (residents && Array.isArray(residents)) {
            const mapped: SearchSelectOption[] = residents
              .filter((r: ResidentSearchOption) => {
                const rName = `${r.firstName || ''} ${r.lastName || ''}`.trim().toLowerCase()
                if (otherWitnessNames.includes(rName)) return false
                return true
              })
              .map((r: ResidentSearchOption) => ({
                id: String(r.id),
                label: r.fullName || `${r.firstName} ${r.lastName}`,
                description: `${r.contactNumber || 'No contact'} • ${r.completeAddress || 'Brgy. Ugong'}`,
                data: r,
              }))
            setWitnessOptionsMap((prev) => ({ ...prev, [witness.id]: mapped }))
          }
        } catch {
          // Fail silently
        }
      }, 150)

      return () => clearTimeout(timer)
    })
  }, [witnesses])

  const handleSelectResidentOption = (witnessId: string, option: SearchSelectOption) => {
    const rData = option.data as ResidentSearchOption | undefined
    if (rData) {
      setWitnesses((prev) =>
        prev.map((w) => {
          if (w.id !== witnessId) return w
          return {
            ...w,
            searchQuery: rData.fullName || option.label,
            selectedResidentName: rData.fullName || option.label,
            firstName: rData.firstName || option.label.split(' ')[0] || '',
            lastName: rData.lastName || option.label.split(' ').slice(1).join(' ') || '',
            contactNumber: rData.contactNumber || '',
          }
        })
      )
    }
  }

  // Preview File Handler — Matches BlotterCaseDetailsView handleViewFile
  const handlePreviewFile = async (url?: string, fileTitle?: string) => {
    if (!url) return
    try {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        window.open(url, '_blank')
        return
      }

      const resolvedUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
      const blobResponse = await axiosInstance.get(resolvedUrl, { responseType: 'blob' })
      const contentType = blobResponse.headers['content-type'] || 'application/pdf'
      const blob = new Blob([blobResponse.data], { type: contentType })
      const blobUrl = URL.createObjectURL(blob)

      const win = window.open(blobUrl, '_blank')
      if (!win) {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileTitle || 'document.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to preview file:', err)
      showFeedback({
        variant: 'error',
        title: 'Preview Unavailable',
        description: 'Unable to preview file. Please ensure backend server is running.',
      })
    }
  }

  // Initialize data on open
  useEffect(() => {
    if (!isOpen || !caseRecord) return

    const loadData = async () => {
      try {
        let detail: any = caseRecord
        if (caseRecord.id) {
          try {
            const fetched = await blotterApi.getById(caseRecord.id)
            if (fetched) detail = fetched
          } catch {
            // fallback to caseRecord
          }
        }
        setLoadedDetail(detail)

        // Respondent living status
        const isLiving: 'Yes' | 'No' | '' =
          detail.respondent?.currentlyLivingWithComplainant === true ||
          detail.respondent?.currentlyLivingWithComplainant === 'Yes' ||
          detail.livingWithComplainant === true ||
          detail.livingWithComplainant === 'Yes' ||
          detail.isLivingWithComplainant === true ||
          detail.isLivingTogether === true ||
          detail.respondent?.livingWithComplainant === true ||
          detail.respondent?.isLivingTogether === true ||
          detail.currentlyLivingWithComplainant === 'Yes' ||
          detail.currentlyLivingWithComplainant === true
            ? 'Yes'
            : detail.respondent?.currentlyLivingWithComplainant === false ||
              detail.respondent?.currentlyLivingWithComplainant === 'No' ||
              detail.livingWithComplainant === false ||
              detail.livingWithComplainant === 'No' ||
              detail.isLivingWithComplainant === false ||
              detail.isLivingTogether === false ||
              detail.respondent?.livingWithComplainant === false ||
              detail.respondent?.isLivingTogether === false ||
              detail.currentlyLivingWithComplainant === 'No' ||
              detail.currentlyLivingWithComplainant === false
            ? 'No'
            : ''

        setRelationshipToComplainant(detail.relationshipToComplainant || detail.respondent?.relationshipToComplainant || '')
        setCurrentlyLivingWithComplainant(isLiving)

        // Incident
        setNatureOfComplaint(detail.incident?.natureOfComplaint || detail.natureOfComplaint || 'Physical Injuries')
        setDateOfIncident(detail.incident?.dateOfIncident || detail.dateOfIncident || '')
        setTimeOfIncident(detail.incident?.timeOfIncident || detail.timeOfIncident || '')
        setPlaceOfIncident(detail.incident?.placeOfIncident || detail.placeOfIncident || '')
        setFrequencyOfIncident(detail.incident?.frequencyOfIncident || detail.frequencyOfIncident || '')
        setDescriptionOfInjuries(detail.incident?.descriptionOfInjuries || detail.descriptionOfInjuries || '')

        // Narrative
        const narrativeContent = detail.narrativeStatement || detail.narrative?.statementSummary || detail.narrativeStatementText || ''
        setStatementText(narrativeContent)
        setExistingNarrativeFileName(detail.narrative?.fileName || (narrativeContent ? 'Narrative_Statement.pdf' : null))
        setNarrativeFile(null)

        // Evidences
        const rawEvidences = detail.evidences || detail.evidence || []
        const matchedEvIds: string[] = []
        const initialFiles: Record<string, File | string | null> = {}
        const evMap: Record<string, { id: any; fileName: string }> = {}

        if (Array.isArray(rawEvidences)) {
          rawEvidences.forEach((ev: any) => {
            const typeName = String(ev.typeName || ev.evidenceTypeName || '').toLowerCase()
            const typeId = String(ev.typeId || ev.id || '')
            const match = DEFAULT_EVIDENCE_ITEMS.find((item) => item.id === typeId || item.label.toLowerCase() === typeName)
            const resolvedId = match ? match.id : typeId
            if (resolvedId) {
              matchedEvIds.push(resolvedId)
              const fName = ev.fileName || `${match?.label || 'Evidence'}_Attachment.pdf`
              if (ev.hasFile || ev.fileData || ev.fileName || ev.id) {
                initialFiles[resolvedId] = fName
                evMap[resolvedId] = { id: ev.id || ev.evidenceId, fileName: fName }
              }
            }
          })
        }
        setSelectedEvidenceIds(matchedEvIds)
        setEvidenceFiles(initialFiles)
        setEvidenceMetaMap(evMap)

        // Witnesses
        const rawWitnesses = detail.witnesses || detail.witnessList || []
        const mappedW: WitnessData[] = []
        if (Array.isArray(rawWitnesses)) {
          rawWitnesses.forEach((w: any) => {
            const rawName = w.fullName || w.name || ''
            const parts = rawName.trim().split(' ')
            const firstName = parts[0] || ''
            const lastName = parts.slice(1).join(' ') || ''
            const fullAddr = w.address || w.completeAddress || ''
            const house = fullAddr.split(',')[0]?.trim() || ''

            const statementName =
              w.testimonyFileName ||
              w.statementFileName ||
              w.fileName ||
              (w.hasTestimonyFile ? `${rawName ? rawName.replace(/\s+/g, '_') : 'Witness'}_Testimony.pdf` : null) ||
              (w.testimonyFile ? `${rawName ? rawName.replace(/\s+/g, '_') : 'Witness'}_Testimony.pdf` : null) ||
              (w.hasSwornStatement ? `${rawName ? rawName.replace(/\s+/g, '_') : 'Witness'}_Statement.pdf` : null)

            mappedW.push({
              id: String(w.personId || w.id || Math.random()),
              firstName,
              lastName,
              contactNumber: w.contactNumber || w.contact || '',
              houseStreet: house,
              barangay: 'Ugong',
              city: 'Valenzuela City',
              province: 'NCR, Third District',
              address: fullAddr,
              testimonyFileName: statementName || undefined,
            })
          })
        }
        setWitnesses(mappedW)
      } catch (err) {
        console.error('Failed to initialize EditCaseModal:', err)
      }
    }

    loadData()
  }, [isOpen, caseRecord])

  if (!isOpen) return null

  // Witness management
  const addWitness = () => {
    setWitnesses((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        firstName: '',
        lastName: '',
        contactNumber: '',
        houseStreet: '',
        barangay: 'Ugong',
        city: 'Valenzuela City',
        province: 'NCR, Third District',
        address: '',
      },
    ])
  }

  const removeWitness = (id: string) => {
    setWitnesses((prev) => prev.filter((w) => w.id !== id))
  }

  const updateWitness = (id: string, field: keyof WitnessData, val: any) => {
    setWitnesses((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w
        return { ...w, [field]: val }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasRespondent = Boolean(
      loadedDetail?.respondent?.firstName ||
      loadedDetail?.respondent?.lastName ||
      (loadedDetail?.respondentName &&
        loadedDetail?.respondentName !== '—' &&
        loadedDetail?.respondentName !== 'N/A' &&
        !loadedDetail?.respondentName.toLowerCase().includes('no respondent'))
    )

    if (hasRespondent) {
      if (!relationshipToComplainant.trim()) {
        setActiveTab('respondent')
        showFeedback({
          variant: 'warning',
          title: 'Validation Error',
          description: 'Please specify the relationship to the complainant.',
        })
        return
      }

      if (!currentlyLivingWithComplainant) {
        setActiveTab('respondent')
        showFeedback({
          variant: 'warning',
          title: 'Validation Error',
          description: 'Please select whether the respondent currently lives with the complainant.',
        })
        return
      }
    }

    if (!natureOfComplaint.trim()) {
      setActiveTab('incident')
      showFeedback({
        variant: 'warning',
        title: 'Validation Error',
        description: 'Please specify the Nature of Complaint.',
      })
      return
    }

    if (!caseRecord) return
    setIsSubmitting(true)

    try {
      // 1. Process Narrative Statement File
      let narrativeBase64: string | null = null
      if (narrativeFile) {
        try {
          narrativeBase64 = await fileToBase64(narrativeFile)
        } catch {
          narrativeBase64 = null
        }
      }

      // 2. Process Evidences
      const mappedEvidences = await Promise.all(
        selectedEvidenceIds.map(async (evId) => {
          const matchedItem = DEFAULT_EVIDENCE_ITEMS.find((item) => item.id === evId)
          const file = evidenceFiles[evId]
          const meta = evidenceMetaMap[evId]
          let base64Files: string | null = null
          let fName = meta?.fileName || (matchedItem ? `${matchedItem.label}.pdf` : 'evidence.pdf')
          if (file instanceof File) {
            fName = file.name
            try {
              base64Files = await fileToBase64(file)
            } catch {
              base64Files = null
            }
          } else if (typeof file === 'string') {
            fName = file
          }
          return {
            id: meta?.id && !isNaN(Number(meta.id)) ? Number(meta.id) : null,
            evidenceTypeName: matchedItem ? matchedItem.label : evId,
            fileName: fName,
            description: matchedItem ? matchedItem.label : evId,
            files: base64Files,
          }
        })
      )

      if (otherEvidence.trim()) {
        mappedEvidences.push({
          id: null,
          evidenceTypeName: otherEvidence.trim(),
          fileName: 'Other_Evidence.pdf',
          description: otherEvidence.trim(),
          files: null,
        })
      }

      // 3. Process Witnesses
      const mappedWitnesses = await Promise.all(
        witnesses.map(async (w) => {
          let testimonyBase64: string | null = null
          if (w.testimonyFile instanceof File) {
            try {
              testimonyBase64 = await fileToBase64(w.testimonyFile)
            } catch {
              testimonyBase64 = null
            }
          }
          const isNumericId = w.id && !w.id.startsWith('temp_') && !isNaN(Number(w.id))
          return {
            id: isNumericId ? Number(w.id) : null,
            firstName: w.firstName?.trim() || 'Witness',
            lastName: w.lastName?.trim() || 'Statement',
            contactNumber: w.contactNumber?.trim() || '',
            completeAddress: 'Barangay Ugong, Valenzuela City',
            testimonyText: null,
            testimonyFileName: w.testimonyFile ? w.testimonyFile.name : (w.testimonyFileName || null),
            testimonyFile: testimonyBase64,
          }
        })
      )

      const updatePayload = {
        relationshipToComplainant: relationshipToComplainant.trim() || undefined,
        currentlyLivingWithComplainant:
          currentlyLivingWithComplainant === 'Yes'
            ? true
            : currentlyLivingWithComplainant === 'No'
            ? false
            : undefined,
        incident: {
          natureOfComplaint: natureOfComplaint.trim() || undefined,
          frequencyOfIncident: frequencyOfIncident.trim() || undefined,
          dateOfIncident: dateOfIncident || undefined,
          timeOfIncident: timeOfIncident
            ? timeOfIncident.length === 5
              ? `${timeOfIncident}:00`
              : timeOfIncident
            : undefined,
          placeOfIncident: placeOfIncident.trim() || undefined,
          descriptionOfInjuries: descriptionOfInjuries.trim() || undefined,
        },
        narrative: {
          statementSummary: statementText.trim() || undefined,
          fileName: narrativeFile ? narrativeFile.name : (existingNarrativeFileName || undefined),
          fileData: narrativeBase64,
        },
        evidences: mappedEvidences,
        witnesses: mappedWitnesses,
      }

      await blotterApi.updateCase(loadedDetail?.id || caseRecord.id, updatePayload)

      showFeedback({
        variant: 'success',
        title: 'Case Updated Successfully',
        description: `Case ${caseRecord.blotterNumber || caseRecord.caseNo || ''} has been updated.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to update case:', err)
      showFeedback({
        variant: 'error',
        title: 'Update Failed',
        description: err.response?.data?.message || 'Failed to update case details. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Edit Case Details — {caseRecord?.blotterNumber || caseRecord?.caseNo}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update relationship, incident specifics, narrative, evidences, and witness testimonies.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto">
          {[
            { id: 'respondent', label: 'Respondent & Living Status', icon: UserCheck },
            { id: 'incident', label: 'Incident Details', icon: AlertCircle },
            { id: 'narrative', label: 'Narrative Statement', icon: FileText },
            { id: 'evidence', label: 'Evidences Attached', icon: Paperclip },
            { id: 'witnesses', label: `Witnesses (${witnesses.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RESPONDENT */}
          {activeTab === 'respondent' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" />
                  Complainant & Respondent Identity Protection
                </p>
                <p className="text-blue-700">
                  Complainant and respondent identity information remain fixed to preserve formal docket lineage. You can update their relationship and living arrangement below.
                </p>
              </div>

              {!loadedDetail?.respondent?.firstName &&
              !loadedDetail?.respondent?.lastName &&
              (!loadedDetail?.respondentName ||
                loadedDetail?.respondentName === '—' ||
                loadedDetail?.respondentName === 'N/A' ||
                loadedDetail?.respondentName.toLowerCase().includes('no respondent')) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">No Respondent Assigned to this Record</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    This case was logged without an opposing party.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Relationship to Complainant"
                    value={relationshipToComplainant}
                    onChange={setRelationshipToComplainant}
                    required
                    placeholder="e.g. Neighbor, Spouse / Partner, Relative"
                    helperText="Identify how the respondent relates to the complainant."
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Currently Living with Complainant? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentlyLivingWithComplainant}
                      onChange={(e) => setCurrentlyLivingWithComplainant(e.target.value as 'Yes' | 'No')}
                      className={inputCls}
                    >
                      <option value="">Select Option</option>
                      <option value="Yes">Yes, living together</option>
                      <option value="No">No, living separately</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Required for determining jurisdiction & mediation process.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INCIDENT DETAILS */}
          {activeTab === 'incident' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nature of Complaint <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={natureOfComplaint}
                    onChange={(e) => setNatureOfComplaint(e.target.value)}
                    className={inputCls}
                    required
                  >
                    {NATURE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency of Incident
                  </label>
                  <select
                    value={frequencyOfIncident}
                    onChange={(e) => setFrequencyOfIncident(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Frequency</option>
                    <option value="First Time">First Time (Unang Pagkakataon)</option>
                    <option value="Repeated / Multiple Times">Repeated / Multiple Times (Paulit-ulit)</option>
                    <option value="Constant / Habitual">Constant / Habitual (Palagian)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Incident <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfIncident}
                    onChange={(e) => setDateOfIncident(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time of Incident
                  </label>
                  <input
                    type="time"
                    value={timeOfIncident}
                    onChange={(e) => setTimeOfIncident(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <FormInput
                label="Place of Incident"
                value={placeOfIncident}
                onChange={setPlaceOfIncident}
                required
                placeholder="e.g. Purok 3, Near Barangay Hall, Ugong"
              />

              <FormTextarea
                label="Description of Injuries / Damages (Optional)"
                value={descriptionOfInjuries}
                onChange={setDescriptionOfInjuries}
                placeholder="Detail any physical injuries, property damages, or losses sustained..."
                rows={3}
              />
            </div>
          )}

          {/* TAB 3: NARRATIVE */}
          {activeTab === 'narrative' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <FormTextarea
                label="Narrative Statement / Facts of the Case"
                value={statementText}
                onChange={setStatementText}
                placeholder="Narrate chronologically what happened during the incident..."
                rows={6}
                required
              />

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Attached Sworn Narrative Statement Document
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={narrativeFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setNarrativeFile(e.target.files[0])
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => narrativeFileInputRef.current?.click()}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                  >
                    <UploadCloud size={15} /> Select Document
                  </button>

                  {narrativeFile ? (
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {narrativeFile.name} ({(narrativeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : existingNarrativeFileName ? (
                    <button
                      type="button"
                      onClick={() => handlePreviewFile(`/api/v1/blotter/files/narrative/${loadedDetail?.id || caseRecord?.id}`, existingNarrativeFileName)}
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Click to preview attached narrative document"
                    >
                      <Paperclip size={13} className="text-blue-600" />
                      <span>{existingNarrativeFileName} (Click to Preview)</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">PDF, DOCX, or Image (Max 10MB)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="animate-in fade-in duration-100">
              <ComplaintEvidenceGrid
                selectedIds={selectedEvidenceIds}
                onChange={setSelectedEvidenceIds}
                evidenceFiles={evidenceFiles as any}
                onFileUpload={(id, file) => {
                  setEvidenceFiles((prev) => ({ ...prev, [id]: file }))
                }}
                onPreviewFile={(id) => {
                  const file = evidenceFiles[id]
                  if (file instanceof File) {
                    handlePreviewFile(URL.createObjectURL(file), file.name)
                    return
                  }
                  const meta = evidenceMetaMap[id]
                  if (meta?.id) {
                    handlePreviewFile(`/api/v1/blotter/files/evidence/${meta.id}`, meta.fileName)
                  }
                }}
                otherText={otherEvidence}
                onOtherTextChange={setOtherEvidence}
              />
            </div>
          )}

          {/* TAB 5: WITNESSES */}
          {activeTab === 'witnesses' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Witnesses & Testimony Statements
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add or update witness information and attached sworn testimonies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWitness}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer border border-blue-200"
                >
                  <Plus size={14} /> Add Witness
                </button>
              </div>

              {witnesses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  No witnesses added to this case yet. Click &quot;Add Witness&quot; to include testimonies.
                </div>
              ) : (
                witnesses.map((w, idx) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-slate-800">
                        Witness #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWitness(w.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Witness"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Search Resident to link */}
                    <SearchSelect
                      label="Search Resident to Link (Auto-fill)"
                      options={witnessOptionsMap[w.id] || []}
                      value={w.searchQuery || ''}
                      onChange={(val) => updateWitness(w.id, 'searchQuery', val)}
                      onSelect={(opt) => handleSelectResidentOption(w.id, opt)}
                      placeholder="Type name to search active resident..."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormInput
                        label="First Name"
                        value={w.firstName}
                        onChange={(v) => updateWitness(w.id, 'firstName', v)}
                        required
                        placeholder="Manual or Auto-filled"
                      />
                      <FormInput
                        label="Last Name"
                        value={w.lastName}
                        onChange={(v) => updateWitness(w.id, 'lastName', v)}
                        required
                        placeholder="Manual or Auto-filled"
                      />
                      <FormInput
                        label="Contact Number"
                        value={w.contactNumber}
                        onChange={(v) => updateWitness(w.id, 'contactNumber', v)}
                        placeholder="09..."
                      />
                    </div>

                    {/* Witness Testimony File Upload */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Witness Testimony / Sworn Statement
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={(el) => {
                            witnessFileInputRefs.current[w.id] = el
                          }}
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              updateWitness(w.id, 'testimonyFile', e.target.files[0])
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => witnessFileInputRefs.current[w.id]?.click()}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <UploadCloud size={13} /> Upload Testimony
                        </button>

                        {w.testimonyFile ? (
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            {w.testimonyFile.name} ({(w.testimonyFile.size / 1024).toFixed(1)} KB)
                          </span>
                        ) : w.testimonyFileName ? (
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(`/api/v1/blotter/files/witness/${w.id}`, w.testimonyFileName || 'witness_testimony.pdf')}
                            className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Click to preview witness testimony statement"
                          >
                            <Paperclip size={13} className="text-blue-600" />
                            <span>{w.testimonyFileName} (Click to Preview)</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">PDF, DOCX, or Image (Max 10MB)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
