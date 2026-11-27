import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  Users,
  Paperclip,
  Trash2,
  Plus,
  UserCheck,
  ShieldAlert,
} from 'lucide-react'
import { ComplaintEvidenceGrid, DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'
import type { WitnessData } from '@/components/ui/complaint_form/types'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/SearchSelect'
import { residentsApi, type ResidentSearchOption } from '@/config/api/modules/residents.api'
import { vawcApi, fileToBase64 } from '@/config/api/modules/vawc.api'
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

export interface VawcEditCaseModalProps {
  isOpen: boolean
  caseRecord: any
  onClose: () => void
  onSuccess: () => void
  showFeedback: (opts: { variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => void
}

const VAWC_NATURE_OPTIONS = [
  { value: 'Physical Abuse / Violence', label: 'Physical Abuse / Violence' },
  { value: 'Threats & Intimidation', label: 'Threats & Intimidation' },
  { value: 'Emotional & Psychological Abuse', label: 'Emotional & Psychological Abuse' },
  { value: 'Economic & Financial Abuse / Deprivation', label: 'Economic & Financial Abuse / Deprivation' },
  { value: 'Sexual Harassment / Abuse', label: 'Sexual Harassment / Abuse' },
  { value: 'Stalking & Harassment', label: 'Stalking & Harassment' },
  { value: 'Other VAWC Violation', label: 'Other VAWC Violation' },
]

const VIOLENCE_OPTIONS = [
  { value: 'Physical Abuse', label: 'Physical Abuse' },
  { value: 'Psychological / Emotional Abuse', label: 'Psychological / Emotional Abuse' },
  { value: 'Economic Abuse', label: 'Economic Abuse' },
  { value: 'Sexual Abuse', label: 'Sexual Abuse' },
  { value: 'Stalking / Harassment', label: 'Stalking / Harassment' },
]

const FREQUENCY_OPTIONS = [
  'First Time',
  'Occasionally',
  'Repeatedly',
  'Chronic / Daily',
]

const RELATIONSHIP_OPTIONS = [
  'Spouse/Husband',
  'Live-in Partner',
  'Ex-Spouse',
  'Former Partner',
  'Boyfriend/Dating Partner',
  'Parent / Relative',
  'Other',
]

export function VawcEditCaseModal({
  isOpen,
  caseRecord,
  onClose,
  onSuccess,
  showFeedback,
}: VawcEditCaseModalProps) {
  const [activeTab, setActiveTab] = useState<'respondent' | 'incident' | 'narrative' | 'evidence' | 'witnesses'>('respondent')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [loadedDetail, setLoadedDetail] = useState<any>(null)
  const [evidenceMetaMap, setEvidenceMetaMap] = useState<Record<string, { id: any; fileName: string }>>({})
  const [relationshipToComplainant, setRelationshipToComplainant] = useState('')
  const [currentlyLivingWithComplainant, setCurrentlyLivingWithComplainant] = useState<'Yes' | 'No' | ''>('')

  // Incident Details
  const [natureOfComplaint, setNatureOfComplaint] = useState('')
  const [violenceType, setViolenceType] = useState('')
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
                id: r.id,
                label: `${r.firstName} ${r.lastName}`,
                sublabel: r.address || 'Resident',
                data: r,
              }))
            setWitnessOptionsMap((prev) => ({ ...prev, [witness.id]: mapped }))
          }
        } catch {
          // ignore error
        }
      }, 150)

      return () => clearTimeout(timer)
    })
  }, [witnesses])

  const handleSelectResidentOption = (witnessId: string, option: SearchSelectOption) => {
    const res = option.data as ResidentSearchOption
    setWitnesses((prev) =>
      prev.map((w) => {
        if (w.id !== witnessId) return w
        return {
          ...w,
          searchQuery: `${res.firstName} ${res.lastName}`,
          firstName: res.firstName || '',
          lastName: res.lastName || '',
          contactNumber: res.contactNumber || '',
          houseStreet: res.address || '',
          barangay: 'Ugong',
          city: 'Valenzuela City',
          province: 'NCR, Third District',
          address: res.address || '',
        }
      })
    )
  }

  const handlePreviewFile = async (url: string, downloadName?: string) => {
    try {
      if (!url) return
      const resolvedUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
      const blobResponse = await axiosInstance.get(resolvedUrl, { responseType: 'blob' })
      const contentType = blobResponse.headers['content-type'] || 'application/pdf'
      const blob = new Blob([blobResponse.data], { type: contentType })
      const blobUrl = URL.createObjectURL(blob)

      const newWindow = window.open(blobUrl, '_blank')
      if (!newWindow) {
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = downloadName || 'document.pdf'
        link.click()
      }
    } catch (err) {
      console.error('Failed to preview file:', err)
      showFeedback({
        variant: 'error',
        title: 'Preview Failed',
        description: 'Unable to load file preview. Please try again.',
      })
    }
  }

  // Load and pre-populate case record data
  useEffect(() => {
    if (!isOpen || !caseRecord) return

    const loadData = async () => {
      try {
        let detail = caseRecord
        if (caseRecord.id) {
          try {
            const fetched = await vawcApi.getById(caseRecord.id)
            if (fetched) detail = fetched
          } catch {
            // fallback to caseRecord
          }
        }
        setLoadedDetail(detail)

        // Respondent
        const resp = detail.respondent
        if (resp) {
          setRelationshipToComplainant(resp.relationshipToComplainant || detail.relationshipToComplainant || '')
          if (resp.livingWithComplainant !== undefined && resp.livingWithComplainant !== null) {
            setCurrentlyLivingWithComplainant(resp.livingWithComplainant ? 'Yes' : 'No')
          } else if (detail.currentlyLivingWithComplainant !== undefined && detail.currentlyLivingWithComplainant !== null) {
            setCurrentlyLivingWithComplainant(detail.currentlyLivingWithComplainant ? 'Yes' : 'No')
          } else {
            setCurrentlyLivingWithComplainant('')
          }
        } else {
          setRelationshipToComplainant(detail.relationshipToComplainant || '')
          setCurrentlyLivingWithComplainant(
            detail.currentlyLivingWithComplainant === true
              ? 'Yes'
              : detail.currentlyLivingWithComplainant === false
              ? 'No'
              : ''
          )
        }

        // Incident
        const inc = detail.incident || detail.incidentDetail
        if (inc) {
          setNatureOfComplaint(inc.natureOfComplaint || detail.natureOfComplaint || '')
          setDateOfIncident(inc.dateOfIncident || detail.incidentDate || '')
          setTimeOfIncident(inc.timeOfIncident || '')
          setPlaceOfIncident(inc.placeOfIncident || inc.incidentLocation || detail.incidentPlace || '')
          setFrequencyOfIncident(inc.frequencyOfIncident || inc.frequency || '')
          setDescriptionOfInjuries(inc.descriptionOfInjuries || inc.injuriesDamagesDescription || '')
        } else {
          setNatureOfComplaint(detail.natureOfComplaint || detail.violenceType || '')
          setDateOfIncident(detail.incidentDate || '')
          setPlaceOfIncident(detail.incidentPlace || '')
        }
        setViolenceType(detail.violenceType || '')

        // Narrative
        const narr = detail.narrative || detail.narrativeStatement
        if (narr) {
          setStatementText(narr.statementSummary || narr.narrativeDetails || narr.statement || '')
          setExistingNarrativeFileName(narr.fileName || null)
        } else {
          setStatementText(detail.narrativeDetails || detail.statementSummary || '')
          setExistingNarrativeFileName(null)
        }
        setNarrativeFile(null)

        // Evidences
        const rawEvidences = detail.evidences || detail.evidenceList || []
        const matchedIds: string[] = []
        const metaMap: Record<string, { id: any; fileName: string }> = {}
        const fileMap: Record<string, string | null> = {}

        if (Array.isArray(rawEvidences)) {
          rawEvidences.forEach((ev: any) => {
            const typeName = ev.type?.name || ev.evidenceTypeName || ev.name || ''
            const matched = DEFAULT_EVIDENCE_ITEMS.find(
              (item) => item.label.toLowerCase() === typeName.toLowerCase() || item.id === ev.type?.code?.toLowerCase()
            )
            const resolvedId = matched ? matched.id : `other_${ev.id || typeName}`
            matchedIds.push(resolvedId)
            const fName = ev.fileName || (matched ? `${matched.label}.pdf` : 'evidence.pdf')
            metaMap[resolvedId] = { id: ev.id, fileName: fName }
            if (ev.hasFile || ev.fileName || ev.files) {
              fileMap[resolvedId] = fName
            }
          })
        }
        setSelectedEvidenceIds(matchedIds)
        setEvidenceMetaMap(metaMap)
        setEvidenceFiles(fileMap)
        setOtherEvidence('')

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
        console.error('Failed to initialize VawcEditCaseModal:', err)
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
        violenceType: violenceType.trim() || undefined,
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

      await vawcApi.updateCase(loadedDetail?.id || caseRecord.id, updatePayload)

      showFeedback({
        variant: 'success',
        title: 'Case Updated Successfully',
        description: `VAWC Case ${caseRecord.caseNumber || caseRecord.caseNo || ''} has been updated.`,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to update VAWC case:', err)
      showFeedback({
        variant: 'error',
        title: 'Update Failed',
        description: err.response?.data?.message || 'Failed to update VAWC case details. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Edit Case Details — {caseRecord?.caseNumber || caseRecord?.caseNo}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update relationship, incident specifics, narrative, evidences, and witness testimonies.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 shrink-0 overflow-x-auto gap-2">
          {[
            { id: 'respondent', label: '1. Respondent Details', icon: UserCheck },
            { id: 'incident', label: '2. Incident Specifics', icon: ShieldAlert },
            { id: 'narrative', label: '3. Narrative Statement', icon: FileText },
            { id: 'evidence', label: '4. Evidence Files', icon: CheckCircle2 },
            { id: 'witnesses', label: `5. Witnesses (${witnesses.length})`, icon: Users },
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship to Complainant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relationshipToComplainant}
                    onChange={(e) => setRelationshipToComplainant(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Relationship</option>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currently Living with Complainant? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        currentlyLivingWithComplainant === 'Yes'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="vawc_living"
                        value="Yes"
                        checked={currentlyLivingWithComplainant === 'Yes'}
                        onChange={() => setCurrentlyLivingWithComplainant('Yes')}
                        className="sr-only"
                      />
                      <span>Yes</span>
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        currentlyLivingWithComplainant === 'No'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="vawc_living"
                        value="No"
                        checked={currentlyLivingWithComplainant === 'No'}
                        onChange={() => setCurrentlyLivingWithComplainant('No')}
                        className="sr-only"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
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
                  >
                    <option value="">Select Nature of Complaint</option>
                    {VAWC_NATURE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    {natureOfComplaint && !VAWC_NATURE_OPTIONS.some((o) => o.value === natureOfComplaint) && (
                      <option value={natureOfComplaint}>{natureOfComplaint}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type of Violence
                  </label>
                  <select
                    value={violenceType}
                    onChange={(e) => setViolenceType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Type of Violence</option>
                    {VIOLENCE_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                    {violenceType && !VIOLENCE_OPTIONS.some((o) => o.value === violenceType) && (
                      <option value={violenceType}>{violenceType}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Date of Incident"
                  value={dateOfIncident}
                  onChange={setDateOfIncident}
                  placeholder="YYYY-MM-DD"
                  helperText="Format: YYYY-MM-DD"
                />
                <FormInput
                  label="Time of Incident"
                  value={timeOfIncident}
                  onChange={setTimeOfIncident}
                  placeholder="HH:mm (e.g. 14:30)"
                />
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
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormInput
                label="Place of Incident / Location"
                value={placeOfIncident}
                onChange={setPlaceOfIncident}
                placeholder="Specific street, sitio, or establishment location"
              />

              <FormTextarea
                label="Description of Injuries / Damages"
                value={descriptionOfInjuries}
                onChange={setDescriptionOfInjuries}
                placeholder="Specify visible bodily injuries, psychological impact, or medical findings..."
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

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Attached Sworn Statement Document (PDF / DOCX)
                </label>

                {existingNarrativeFileName && !narrativeFile && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewFile(
                            `/api/v1/vawc/files/narrative/${loadedDetail?.id || caseRecord?.id}`,
                            existingNarrativeFileName
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Click to preview attached narrative document"
                      >
                        <Paperclip size={13} className="text-blue-600" />
                        <span>{existingNarrativeFileName} (Click to Preview)</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExistingNarrativeFileName(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}

                {narrativeFile && (
                  <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">
                        {narrativeFile.name} (New file ready to upload)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNarrativeFile(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Cancel
                    </button>
                  </div>
                )}

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
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <UploadCloud size={14} />
                  <span>{existingNarrativeFileName || narrativeFile ? 'Replace Document' : 'Upload Sworn Statement File'}</span>
                </button>
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
                    const localUrl = URL.createObjectURL(file)
                    window.open(localUrl, '_blank')
                    return
                  }
                  const meta = evidenceMetaMap[id]
                  if (meta?.id) {
                    handlePreviewFile(`/api/v1/vawc/files/evidence/${meta.id}`, meta.fileName)
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Witness
                </button>
              </div>

              {witnesses.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Users size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No witnesses added to this case yet.</p>
                  <button
                    type="button"
                    onClick={addWitness}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    Click here to add a witness
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {witnesses.map((w, index) => (
                    <div key={w.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-slate-700">Witness #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeWitness(w.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>

                      <SearchSelect
                        label="Search Resident (Auto-fill)"
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
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Sworn Witness Statement / Testimony File
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

                          {w.testimonyFile && (
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={13} /> {w.testimonyFile.name} (Ready)
                            </span>
                          )}

                          {!w.testimonyFile && w.testimonyFileName && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePreviewFile(
                                  `/api/v1/vawc/files/witness/${w.id}`,
                                  w.testimonyFileName || 'witness_testimony.pdf'
                                )
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="Click to preview witness testimony statement"
                            >
                              <Paperclip size={13} className="text-blue-600" />
                              <span>{w.testimonyFileName} (Click to Preview)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Confidential VAWC record. All updates are logged in the audit trail.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

