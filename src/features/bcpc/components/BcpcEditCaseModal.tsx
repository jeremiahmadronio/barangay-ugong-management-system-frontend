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
import {
  ComplaintEvidenceGrid,
  DEFAULT_EVIDENCE_ITEMS,
} from '@/components/ui/complaint_form/ComplaintEvidenceGrid'
import {
  bcpcApi,
  fileToBase64,
  type BcpcCarCaseUpdateRequest,
  type BcpcCiclCaseUpdateRequest,
  type CarActCategory,
  type SpecificCarAct,
  type CarOccurrenceCategory,
  type DiscernmentStatus,
  type PenaltyRoutingCategory,
  type DiversionAuthority,
} from '@/api/modules/bcpc.api'
import {
  CICL_OFFENSE_OPTIONS,
  GRADE_LEVELS,
  RELATIONSHIPS_TO_CHILD,
  GUARDIAN_UNAVAILABLE_REASONS,
  CAR_ACT_CATEGORY_OPTIONS,
  SPECIFIC_CAR_ACT_MAP,
} from '@/components/ui/complaint_form/BcpcComplaintForm'
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
  helperText,
}: {
  label: string
  value?: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  helperText?: string
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
      {helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  )
}

export interface BcpcEditCaseModalProps {
  isOpen: boolean
  caseRecord: any
  onClose: () => void
  onSuccess: () => void
  showFeedback: (opts: {
    variant: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
  }) => void
}

export function BcpcEditCaseModal({
  isOpen,
  caseRecord,
  onClose,
  onSuccess,
  showFeedback,
}: BcpcEditCaseModalProps) {
  const [activeTab, setActiveTab] = useState<'respondent' | 'incident' | 'narrative' | 'evidence' | 'witnesses'>('respondent')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Robust detection of CAR vs CICL across universal wrapper and direct models
  const isCar =
    caseRecord?.category === 'CAR' ||
    caseRecord?.classification === 'CAR' ||
    caseRecord?.filingType === 'CHILD_AT_RISK' ||
    Boolean(caseRecord?.carDetails) ||
    Boolean(caseRecord?.carAssessment) ||
    Boolean(caseRecord?.car?.carActCategory) ||
    (!caseRecord?.ciclDetails && !caseRecord?.ciclAssessment && !caseRecord?.allegedViolation && caseRecord?.category !== 'CICL')

  // Form State - Parties & Guardian
  const [gradeLevel, setGradeLevel] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [isGuardianAvailable, setIsGuardianAvailable] = useState<'Yes' | 'No'>('Yes')
  const [guardianFirstName, setGuardianFirstName] = useState('')
  const [guardianLastName, setGuardianLastName] = useState('')
  const [guardianContact, setGuardianContact] = useState('')
  const [guardianAddress, setGuardianAddress] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [guardianRelationshipOther, setGuardianRelationshipOther] = useState('')
  const [guardianUnavailableReason, setGuardianUnavailableReason] = useState('')
  const [guardianUnavailableReasonOther, setGuardianUnavailableReasonOther] = useState('')
  const [victimRelationshipToChild, setVictimRelationshipToChild] = useState('')
  const [victimRole, setVictimRole] = useState('')

  // Form State - Incident Details (Common)
  const [dateOfIncident, setDateOfIncident] = useState('')
  const [timeOfIncident, setTimeOfIncident] = useState('')
  const [placeOfIncident, setPlaceOfIncident] = useState('')
  const [descriptionOfInjuries, setDescriptionOfInjuries] = useState('')

  // CAR specifics
  const [carActCategory, setCarActCategory] = useState<CarActCategory>('JUVENILE_STATUS_OFFENSE')
  const [specificCarAct, setSpecificCarAct] = useState<SpecificCarAct>('CURFEW_VIOLATION')
  const [specificCarActOther, setSpecificCarActOther] = useState('')
  const [carOccurrenceCategory, setCarOccurrenceCategory] = useState<CarOccurrenceCategory>('FIRST_OCCURRENCE')
  const [hasAdditionalProtectionConcern, setHasAdditionalProtectionConcern] = useState(false)
  const [safetyNotes, setSafetyNotes] = useState('')

  // CICL specifics
  const [allegedViolation, setAllegedViolation] = useState('Theft')
  const [allegedViolationOther, setAllegedViolationOther] = useState('')
  const [discernmentStatus, setDiscernmentStatus] = useState<DiscernmentStatus>('PENDING_LSWDO_EVALUATION')
  const [penaltyRoutingCategory, setPenaltyRoutingCategory] = useState<PenaltyRoutingCategory>('SIX_YEARS_OR_LESS')
  const [diversionAuthority, setDiversionAuthority] = useState<DiversionAuthority>('BARANGAY')
  const [admittedOffense, setAdmittedOffense] = useState<'Yes' | 'No'>('No')
  const [isRepeatOffender, setIsRepeatOffender] = useState<'Yes' | 'No'>('No')
  const [apprehendingOfficerName, setApprehendingOfficerName] = useState('')
  const [apprehendingOfficerOffice, setApprehendingOfficerOffice] = useState('')
  const [apprehendingOfficerContact, setApprehendingOfficerContact] = useState('')
  const [apprehensionDateTime, setApprehensionDateTime] = useState('')
  const [apprehensionPlace, setApprehensionPlace] = useState('')

  // Form State - Narrative
  const [statementText, setStatementText] = useState('')
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null)
  const [existingNarrativeFileName, setExistingNarrativeFileName] = useState<string | null>(null)
  const narrativeFileInputRef = useRef<HTMLInputElement | null>(null)

  // Form State - Evidences
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([])
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File | string | null>>({})
  const [otherEvidence, setOtherEvidence] = useState('')
  const [evidenceMetaMap, setEvidenceMetaMap] = useState<Record<string, { id: any; fileName: string }>>({})

  // Form State - Witnesses
  const [witnesses, setWitnesses] = useState<
    {
      id: string
      firstName: string
      lastName: string
      contactNumber: string
      address: string
      testimonyText: string
      testimonyFileName?: string
      testimonyFile?: File | null
    }[]
  >([])
  const witnessFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Preview File Handler
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

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen || !caseRecord) return

    const loadData = async () => {
      try {
        const rawDetail =
          caseRecord?.carDetails ||
          caseRecord?.ciclDetails ||
          caseRecord?.car ||
          caseRecord?.cicl ||
          caseRecord

        let detail: any = { ...rawDetail }
        const caseId = caseRecord.id || caseRecord.caseId || rawDetail?.caseId || rawDetail?.id

        if (caseId) {
          try {
            const fetched = isCar
              ? await bcpcApi.getCarCaseById(caseId)
              : await bcpcApi.getCiclCaseById(caseId)
            if (fetched) {
              detail = { ...detail, ...fetched }
            }
          } catch (err) {
            console.warn('Could not fetch fresh detail, using preloaded record:', err)
          }
        }

        // 1. Guardian & Education
        const initialGrade = detail.gradeLevel || detail.child?.gradeLevel || ''
        setGradeLevel(initialGrade)

        const initialSchool = detail.schoolName || detail.child?.schoolName || ''
        setSchoolName(initialSchool)

        const isGuardAvail =
          detail.isGuardianAvailable === false ||
          detail.isGuardianPresentAtIntake === false ||
          Boolean(detail.guardianUnavailableReason)
            ? 'No'
            : 'Yes'
        setIsGuardianAvailable(isGuardAvail)

        const rawReason = detail.guardianUnavailableReason || ''
        if (rawReason) {
          const matched = GUARDIAN_UNAVAILABLE_REASONS.find((r) => r === rawReason)
          if (matched) {
            setGuardianUnavailableReason(matched)
            setGuardianUnavailableReasonOther('')
          } else {
            setGuardianUnavailableReason('Other Reason')
            setGuardianUnavailableReasonOther(rawReason)
          }
        } else {
          setGuardianUnavailableReason('')
          setGuardianUnavailableReasonOther('')
        }

        const rawRel = detail.guardianRelationship || ''
        if (rawRel) {
          const matched = RELATIONSHIPS_TO_CHILD.find(
            (r) => r.toLowerCase() === rawRel.toLowerCase()
          )
          if (matched) {
            setGuardianRelationship(matched)
            setGuardianRelationshipOther('')
          } else {
            setGuardianRelationship('Other')
            setGuardianRelationshipOther(rawRel)
          }
        } else {
          setGuardianRelationship('')
          setGuardianRelationshipOther('')
        }

        if (detail.guardian) {
          setGuardianFirstName(detail.guardian.firstName || '')
          setGuardianLastName(detail.guardian.lastName || '')
          setGuardianContact(detail.guardian.contactNumber || detail.guardian.phoneNumber || '')
          setGuardianAddress(detail.guardian.completeAddress || detail.guardian.address || '')
        }

        // CICL Victim
        setVictimRelationshipToChild(detail.victimRelationshipToChild || '')
        setVictimRole(detail.victimRole || '')

        // 2. Incident Details
        const inc = detail.incident || {}
        setDateOfIncident(inc.dateOfIncident || detail.incidentDate || detail.dateOfIncident || '')
        const rawTime = inc.timeOfIncident || detail.incidentTime || detail.timeOfIncident || ''
        setTimeOfIncident(rawTime ? rawTime.substring(0, 5) : '')
        setPlaceOfIncident(
          inc.placeOfIncident || inc.incidentLocation || detail.placeOfIncident || detail.incidentLocation || ''
        )
        setDescriptionOfInjuries(
          inc.descriptionOfInjuries || inc.injuriesDamagesDescription || detail.descriptionOfInjuries || ''
        )

        // 3. CAR Assessment
        if (isCar) {
          const car = detail.carAssessment || detail
          if (car.carActCategory) setCarActCategory(car.carActCategory)
          if (car.specificCarAct) setSpecificCarAct(car.specificCarAct)
          setSpecificCarActOther(car.specificCarActOther || '')
          if (car.carOccurrenceCategory) setCarOccurrenceCategory(car.carOccurrenceCategory)
          setHasAdditionalProtectionConcern(Boolean(car.needsProtectiveCustody || car.hasSafetyWelfareConcerns))
          setSafetyNotes(car.safetyAndWelfareNotes || car.safetyWelfareNotes || car.safetyNotes || '')
        }

        // 4. CICL Assessment
        if (!isCar) {
          const cicl = detail.ciclAssessment || detail
          const violation = cicl.allegedViolation || detail.allegedViolation || ''
          if (violation) {
            const matched = CICL_OFFENSE_OPTIONS.find(
              (opt) => opt.toLowerCase() === violation.toLowerCase()
            )
            if (matched) {
              setAllegedViolation(matched)
              setAllegedViolationOther('')
            } else {
              setAllegedViolation('Other')
              setAllegedViolationOther(violation)
            }
          }
          if (cicl.discernmentStatus) setDiscernmentStatus(cicl.discernmentStatus)
          if (cicl.penaltyRoutingCategory) setPenaltyRoutingCategory(cicl.penaltyRoutingCategory)
          if (cicl.diversionAuthority) setDiversionAuthority(cicl.diversionAuthority)
          setAdmittedOffense(cicl.admittedOffense ? 'Yes' : 'No')
          setIsRepeatOffender(cicl.isRepeatOffender ? 'Yes' : 'No')

          setApprehendingOfficerName(cicl.apprehendingOfficerName || '')
          setApprehendingOfficerOffice(cicl.apprehendingOfficerOffice || '')
          setApprehendingOfficerContact(cicl.apprehendingOfficerContact || '')
          setApprehensionDateTime(
            cicl.apprehensionDateTime
              ? cicl.apprehensionDateTime.substring(0, 16)
              : ''
          )
          setApprehensionPlace(cicl.apprehensionPlace || '')
        }

        // 5. Narrative
        const narr = detail.narrative || {}
        setStatementText(narr.statementSummary || narr.statementText || detail.narrativeStatement || '')
        setExistingNarrativeFileName(
          narr.statementFileName || (detail.narrativeDocumentPath ? 'Attached_Narrative_Document.pdf' : null)
        )
        setNarrativeFile(null)

        // 6. Evidences
        const rawEvidences: any[] = detail.evidences || []
        const loadedIds: string[] = []
        const fileMap: Record<string, string> = {}
        const metaMap: Record<string, { id: any; fileName: string }> = {}

        rawEvidences.forEach((ev: any) => {
          const typeName = ev.evidenceTypeName || ev.evidenceType?.name || ev.description || ''
          const matchedItem = DEFAULT_EVIDENCE_ITEMS.find(
            (item) => item.label.toLowerCase() === typeName.toLowerCase()
          )
          const evId = matchedItem ? matchedItem.id : ev.id ? `ev_${ev.id}` : typeName
          if (matchedItem) {
            loadedIds.push(evId)
            if (ev.fileName) fileMap[evId] = ev.fileName
            metaMap[evId] = { id: ev.id, fileName: ev.fileName || `${matchedItem.label}.pdf` }
          } else if (typeName) {
            setOtherEvidence(typeName)
          }
        })

        setSelectedEvidenceIds(loadedIds)
        setEvidenceFiles(fileMap)
        setEvidenceMetaMap(metaMap)

        // 7. Witnesses
        const rawWitnesses: any[] = detail.witnesses || []
        setWitnesses(
          rawWitnesses.map((w: any, idx: number) => ({
            id: String(w.id || `wit_${idx}`),
            firstName: w.firstName || '',
            lastName: w.lastName || '',
            contactNumber: w.contactNumber || '',
            address: w.completeAddress || w.address || '',
            testimonyText: w.testimonyText || '',
            testimonyFileName: w.testimonyFileName || (w.statementDocumentPath ? 'Attached_Testimony.pdf' : undefined),
            testimonyFile: null,
          }))
        )
      } catch (err) {
        console.error('Failed to populate BCPC edit form:', err)
      }
    }

    loadData()
  }, [isOpen, caseRecord, isCar])

  const addWitness = () => {
    setWitnesses((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        firstName: '',
        lastName: '',
        contactNumber: '',
        address: '',
        testimonyText: '',
        testimonyFile: null,
      },
    ])
  }

  const updateWitness = (id: string, field: string, val: any) => {
    setWitnesses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    )
  }

  const removeWitness = (id: string) => {
    setWitnesses((prev) => prev.filter((w) => w.id !== id))
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const caseId = caseRecord.caseId || caseRecord.id
    if (!caseId) return

    // Basic Validations
    if (!placeOfIncident.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Validation Error',
        description: 'Please provide the place/location of incident.',
      })
      setActiveTab('incident')
      return
    }

    if (!statementText.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Validation Error',
        description: 'Narrative statement / facts of the case is required.',
      })
      setActiveTab('narrative')
      return
    }

    if (!isCar && allegedViolation === 'Other' && !allegedViolationOther.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Validation Error',
        description: 'Please specify the alleged offense or violation.',
      })
      setActiveTab('incident')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Process Narrative File
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
            completeAddress: w.address?.trim() || 'Barangay Ugong, Valenzuela City',
            testimonyText: w.testimonyText?.trim() || null,
            testimonyFileName: w.testimonyFile ? w.testimonyFile.name : (w.testimonyFileName || null),
            testimonyFile: testimonyBase64,
          }
        })
      )

      // 4. Guardian Payload
      const guardianPayload =
        isGuardianAvailable === 'Yes' && (guardianFirstName.trim() || guardianLastName.trim())
          ? {
              firstName: guardianFirstName.trim(),
              lastName: guardianLastName.trim(),
              contactNumber: guardianContact.trim() || undefined,
              completeAddress: guardianAddress.trim() || undefined,
            }
          : null

      const guardianRelationshipFinal =
        isGuardianAvailable === 'Yes'
          ? (guardianRelationship === 'Other' ? guardianRelationshipOther.trim() || 'Other' : guardianRelationship.trim() || undefined)
          : undefined

      const guardianUnavailableReasonFinal =
        isGuardianAvailable === 'No'
          ? (guardianUnavailableReason === 'Other Reason' ? guardianUnavailableReasonOther.trim() || 'Other Reason' : guardianUnavailableReason.trim() || undefined)
          : undefined

      const incidentPayload = {
        natureOfComplaint: isCar
          ? `CAR: ${specificCarAct}`
          : `CICL: ${allegedViolation === 'Other' ? allegedViolationOther.trim() : allegedViolation}`,
        dateOfIncident: dateOfIncident || undefined,
        timeOfIncident: timeOfIncident
          ? timeOfIncident.length === 5
            ? `${timeOfIncident}:00`
            : timeOfIncident
          : undefined,
        placeOfIncident: placeOfIncident.trim(),
        descriptionOfInjuries: descriptionOfInjuries.trim() || undefined,
      }

      const narrativePayload = {
        statementSummary: statementText.trim(),
        statementFileBase64: narrativeBase64 || undefined,
        statementFileName: narrativeFile ? narrativeFile.name : (existingNarrativeFileName || undefined),
      }

      if (isCar) {
        const carPayload: BcpcCarCaseUpdateRequest = {
          isGuardianAvailable: isGuardianAvailable === 'Yes',
          guardianRelationship: guardianRelationshipFinal,
          guardianUnavailableReason: guardianUnavailableReasonFinal,
          guardian: guardianPayload,
          gradeLevel: gradeLevel.trim() || undefined,
          schoolName: schoolName.trim() || undefined,
          incident: incidentPayload,
          carActCategory,
          specificCarAct,
          specificCarActOther: specificCarAct?.startsWith('OTHER_') ? specificCarActOther.trim() || undefined : undefined,
          carOccurrenceCategory,
          hasAdditionalProtectionConcern,
          safetyNotes: safetyNotes.trim() || undefined,
          narrative: narrativePayload,
          evidences: mappedEvidences as any,
          witnesses: mappedWitnesses as any,
        }

        await bcpcApi.updateCarCase(caseId, carPayload)
      } else {
        const ciclPayload: BcpcCiclCaseUpdateRequest = {
          victimRole: victimRole.trim() || undefined,
          victimRelationshipToChild: victimRelationshipToChild.trim() || undefined,
          isGuardianAvailable: isGuardianAvailable === 'Yes',
          guardianRelationship: guardianRelationshipFinal,
          guardianUnavailableReason: guardianUnavailableReasonFinal,
          guardian: guardianPayload,
          gradeLevel: gradeLevel.trim() || undefined,
          schoolName: schoolName.trim() || undefined,
          incident: incidentPayload,
          allegedViolation: allegedViolation === 'Other' ? allegedViolationOther.trim() : allegedViolation,
          discernmentStatus,
          penaltyRoutingCategory,
          diversionAuthority,
          admittedOffense: admittedOffense === 'Yes',
          isRepeatOffender: isRepeatOffender === 'Yes',
          apprehendingOfficerName: apprehendingOfficerName.trim() || undefined,
          apprehendingOfficerOffice: apprehendingOfficerOffice.trim() || undefined,
          apprehendingOfficerContact: apprehendingOfficerContact.trim() || undefined,
          apprehensionDateTime: apprehensionDateTime ? `${apprehensionDateTime}:00` : undefined,
          apprehensionPlace: apprehensionPlace.trim() || undefined,
          narrative: narrativePayload,
          evidences: mappedEvidences as any,
          witnesses: mappedWitnesses as any,
        }

        await bcpcApi.updateCiclCase(caseId, ciclPayload)
      }

      showFeedback({
        variant: 'success',
        title: 'Case Updated Successfully',
        description: `BCPC Case #${caseRecord?.caseNumber || caseId} details have been successfully saved and synchronized.`,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error updating BCPC case:', err)
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unable to update case. Please check server connection.'
      showFeedback({
        variant: 'error',
        title: 'Update Failed',
        description: String(errorMsg),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputCls =
    'w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Edit Case Details — {caseRecord?.caseNumber || caseRecord?.caseNo || 'BCPC'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update relationship, incident specifics, narrative, evidences, and witness testimonies.
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto">
          {[
            { id: 'respondent', label: isCar ? 'Child & Guardian Details' : 'Respondent & Living Status', icon: UserCheck },
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
          {/* TAB 1: RESPONDENT & LIVING STATUS / PARTIES */}
          {activeTab === 'respondent' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <UserCheck size={15} className="text-blue-600" />
                  {isCar ? 'Child & Complainant Identity Protection' : 'Complainant & Respondent Identity Protection'}
                </p>
                <p className="text-blue-700">
                  {isCar
                    ? 'Child and reporter/complainant identity records remain fixed to preserve formal docket lineage. You can update education, guardian details, and relationships below.'
                    : 'Complainant and respondent identity information remain fixed to preserve formal docket lineage. You can update their relationship and living arrangement below.'}
                </p>
              </div>

              {!isCar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Relationship to Complainant"
                    value={victimRelationshipToChild}
                    onChange={setVictimRelationshipToChild}
                    placeholder="e.g. Neighbor, Classmate, Unrelated, Relative"
                    helperText="Identify how the respondent relates to the complainant."
                  />
                  <FormInput
                    label="Victim Role"
                    value={victimRole}
                    onChange={setVictimRole}
                    placeholder="e.g. Complainant, Private Offended Party"
                    helperText="Role of the victim or complainant in this case."
                  />
                </div>
              )}

              {/* Education Information */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Education & Schooling Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Grade Level / Education Status
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select Grade</option>
                      {GRADE_LEVELS.map((gl) => (
                        <option key={gl} value={gl}>
                          {gl}
                        </option>
                      ))}
                      {gradeLevel && !GRADE_LEVELS.includes(gradeLevel) && (
                        <option value={gradeLevel}>{gradeLevel}</option>
                      )}
                    </select>
                  </div>
                  <FormInput
                    label="School Name (Optional)"
                    value={schoolName}
                    onChange={setSchoolName}
                    placeholder="e.g. Ugong National High School"
                  />
                </div>
              </div>

              {/* Parent / Guardian Information */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Parent / Guardian Status
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Guardian Available?
                    </label>
                    <select
                      value={isGuardianAvailable}
                      onChange={(e) => setIsGuardianAvailable(e.target.value as 'Yes' | 'No')}
                      className="px-2.5 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    >
                      <option value="Yes">Yes, available</option>
                      <option value="No">No, unavailable</option>
                    </select>
                  </div>
                </div>

                {isGuardianAvailable === 'Yes' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Guardian Relationship to Child
                        </label>
                        <select
                          value={guardianRelationship}
                          onChange={(e) => {
                            const val = e.target.value
                            setGuardianRelationship(val)
                            if (val !== 'Other') setGuardianRelationshipOther('')
                          }}
                          className={inputCls}
                        >
                          <option value="">Select Relationship</option>
                          {RELATIONSHIPS_TO_CHILD.map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                          {guardianRelationship && !RELATIONSHIPS_TO_CHILD.includes(guardianRelationship) && (
                            <option value={guardianRelationship}>{guardianRelationship}</option>
                          )}
                        </select>
                        {guardianRelationship === 'Other' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              maxLength={50}
                              value={guardianRelationshipOther}
                              onChange={(e) => setGuardianRelationshipOther(e.target.value)}
                              placeholder="Specify relationship..."
                              className={inputCls}
                            />
                          </div>
                        )}
                      </div>

                      <FormInput
                        label="Guardian First Name"
                        value={guardianFirstName}
                        onChange={setGuardianFirstName}
                        placeholder="First Name"
                      />
                      <FormInput
                        label="Guardian Last Name"
                        value={guardianLastName}
                        onChange={setGuardianLastName}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Guardian Contact Number"
                        value={guardianContact}
                        onChange={setGuardianContact}
                        placeholder="09XXXXXXXXX"
                      />
                      <FormInput
                        label="Guardian Complete Address"
                        value={guardianAddress}
                        onChange={setGuardianAddress}
                        placeholder="House No., Street, Barangay"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason Guardian is Unavailable
                    </label>
                    <select
                      value={guardianUnavailableReason}
                      onChange={(e) => {
                        const val = e.target.value
                        setGuardianUnavailableReason(val)
                        if (val !== 'Other Reason') setGuardianUnavailableReasonOther('')
                      }}
                      className={inputCls}
                    >
                      <option value="">Select Reason</option>
                      {GUARDIAN_UNAVAILABLE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      {guardianUnavailableReason && !GUARDIAN_UNAVAILABLE_REASONS.includes(guardianUnavailableReason) && (
                        <option value={guardianUnavailableReason}>{guardianUnavailableReason}</option>
                      )}
                    </select>

                    {guardianUnavailableReason === 'Other Reason' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={guardianUnavailableReasonOther}
                          onChange={(e) => setGuardianUnavailableReasonOther(e.target.value)}
                          placeholder="Enter specific reason..."
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INCIDENT DETAILS */}
          {activeTab === 'incident' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Common Incident Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                rows={2}
              />

              {/* CAR Specific Section - Plain & Clean */}
              {isCar && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Child at Risk (CAR) Legal Assessment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CAR Act Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={carActCategory}
                        onChange={(e) => {
                          const cat = e.target.value as CarActCategory
                          setCarActCategory(cat)
                          const list = SPECIFIC_CAR_ACT_MAP[cat] || []
                          if (list.length > 0) {
                            setSpecificCarAct(list[0].value)
                            setSpecificCarActOther('')
                          }
                        }}
                        className={inputCls}
                        required
                      >
                        {CAR_ACT_CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Occurrence Frequency <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={carOccurrenceCategory}
                        onChange={(e) => setCarOccurrenceCategory(e.target.value as CarOccurrenceCategory)}
                        className={inputCls}
                        required
                      >
                        <option value="FIRST_OCCURRENCE">First Occurrence (Unang Pagkakataon)</option>
                        <option value="SECOND_OCCURRENCE">Second Occurrence (Ikalawang Pagkakataon)</option>
                        <option value="THIRD_OR_SUBSEQUENT">Third or Subsequent (Paulit-ulit / Habitual)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specific CAR Act <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={specificCarAct}
                      onChange={(e) => {
                        const act = e.target.value as SpecificCarAct
                        setSpecificCarAct(act)
                        if (!act?.startsWith('OTHER_')) {
                          setSpecificCarActOther('')
                        }
                      }}
                      className={inputCls}
                      required
                    >
                      {(SPECIFIC_CAR_ACT_MAP[carActCategory] || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {specificCarAct?.startsWith('OTHER_') && (
                    <FormInput
                      label="Specify Custom CAR Act / Circumstance"
                      value={specificCarActOther}
                      onChange={setSpecificCarActOther}
                      required
                      placeholder="Enter specific details regarding the situation..."
                    />
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={hasAdditionalProtectionConcern}
                        onChange={(e) => setHasAdditionalProtectionConcern(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Child requires immediate protective custody or emergency safety intervention</span>
                    </label>

                    {hasAdditionalProtectionConcern && (
                      <FormTextarea
                        label="Safety & Welfare Concerns / Protective Measures"
                        value={safetyNotes}
                        onChange={setSafetyNotes}
                        placeholder="Detail safety concerns or reason for requiring protective custody..."
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* CICL Specific Section - Plain & Clean */}
              {!isCar && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Child in Conflict with the Law (CICL) Statutory Assessment
                  </h3>

                  {/* Alleged Offense Dropdown with Other */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alleged Offense / Violation <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={allegedViolation}
                      onChange={(e) => {
                        const val = e.target.value
                        setAllegedViolation(val)
                        if (val !== 'Other') setAllegedViolationOther('')
                      }}
                      className={inputCls}
                      required
                    >
                      <option value="">Select Alleged Offense / Violation</option>
                      {CICL_OFFENSE_OPTIONS.map((offense) => (
                        <option key={offense} value={offense}>
                          {offense}
                        </option>
                      ))}
                      {allegedViolation && !CICL_OFFENSE_OPTIONS.includes(allegedViolation) && (
                        <option value={allegedViolation}>{allegedViolation}</option>
                      )}
                    </select>
                  </div>

                  {allegedViolation === 'Other' && (
                    <FormInput
                      label="Specify Alleged Offense / Violation"
                      value={allegedViolationOther}
                      onChange={setAllegedViolationOther}
                      required
                      placeholder="Type the specific offense / violation here..."
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Discernment Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={discernmentStatus}
                        onChange={(e) => setDiscernmentStatus(e.target.value as DiscernmentStatus)}
                        className={inputCls}
                        required
                      >
                        <option value="PENDING_LSWDO_EVALUATION">Pending LSWDO Evaluation</option>
                        <option value="WITH_DISCERNMENT">With Discernment</option>
                        <option value="WITHOUT_DISCERNMENT">Without Discernment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Penalty Severity <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={penaltyRoutingCategory}
                        onChange={(e) => setPenaltyRoutingCategory(e.target.value as PenaltyRoutingCategory)}
                        className={inputCls}
                        required
                      >
                        <option value="SIX_YEARS_OR_LESS">6 Years or Less (Barangay / Diversion)</option>
                        <option value="ABOVE_SIX_YEARS">Above 6 Years (Court Jurisdiction)</option>
                        <option value="UNDETERMINED">Undetermined</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Diversion Authority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={diversionAuthority}
                        onChange={(e) => setDiversionAuthority(e.target.value as DiversionAuthority)}
                        className={inputCls}
                        required
                      >
                        <option value="">Select Authority</option>
                        <option value="BARANGAY">Barangay Level Diversion (BCPC)</option>
                        <option value="WCPD">PNP-WCPD Referral</option>
                        <option value="LSWDO">LSWDO Intervention Program</option>
                        <option value="COURT">Family Court / Bahay Pag-Asa</option>
                        <option value="UNDETERMINED">Undetermined / To Be Assessed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Did Child Admit to Offense?
                      </label>
                      <select
                        value={admittedOffense}
                        onChange={(e) => setAdmittedOffense(e.target.value as 'Yes' | 'No')}
                        className={inputCls}
                      >
                        <option value="No">No, denied or silent</option>
                        <option value="Yes">Yes, voluntarily admitted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Repeat Offender / Prior Record?
                      </label>
                      <select
                        value={isRepeatOffender}
                        onChange={(e) => setIsRepeatOffender(e.target.value as 'Yes' | 'No')}
                        className={inputCls}
                      >
                        <option value="No">No, first time offense</option>
                        <option value="Yes">Yes, has previous offenses</option>
                      </select>
                    </div>
                  </div>

                  {/* Apprehension Information */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Apprehension & Law Enforcement Turnover Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormInput
                        label="Apprehending Officer"
                        value={apprehendingOfficerName}
                        onChange={setApprehendingOfficerName}
                        placeholder="Officer Name"
                      />
                      <FormInput
                        label="Office / Unit"
                        value={apprehendingOfficerOffice}
                        onChange={setApprehendingOfficerOffice}
                        placeholder="e.g. Pasig CPS / BPSO"
                      />
                      <FormInput
                        label="Officer Contact"
                        value={apprehendingOfficerContact}
                        onChange={setApprehendingOfficerContact}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Apprehension Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={apprehensionDateTime}
                          onChange={(e) => setApprehensionDateTime(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <FormInput
                        label="Place of Apprehension"
                        value={apprehensionPlace}
                        onChange={setApprehensionPlace}
                        placeholder="e.g. Ugong Market, Valenzuela"
                      />
                    </div>
                  </div>
                </div>
              )}
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

              <div className="pt-2 border-t border-slate-100 space-y-2">
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
                      onClick={() =>
                        handlePreviewFile(
                          `/api/v1/bcpc/files/narrative/${caseRecord?.caseId || caseRecord?.id}`,
                          existingNarrativeFileName
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Click to preview attached sworn narrative document"
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
                    handlePreviewFile(`/api/v1/bcpc/files/evidence/${meta.id}`, meta.fileName)
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput
                        label="First Name"
                        value={w.firstName}
                        onChange={(v) => updateWitness(w.id, 'firstName', v)}
                        required
                        placeholder="First Name"
                      />
                      <FormInput
                        label="Last Name"
                        value={w.lastName}
                        onChange={(v) => updateWitness(w.id, 'lastName', v)}
                        required
                        placeholder="Last Name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormInput
                        label="Contact Number"
                        value={w.contactNumber}
                        onChange={(v) => updateWitness(w.id, 'contactNumber', v)}
                        placeholder="09XXXXXXXXX"
                      />
                      <FormInput
                        label="Address"
                        value={w.address}
                        onChange={(v) => updateWitness(w.id, 'address', v)}
                        placeholder="Complete Address"
                      />
                    </div>

                    <FormTextarea
                      label="Testimony Text (Optional)"
                      value={w.testimonyText}
                      onChange={(v) => updateWitness(w.id, 'testimonyText', v)}
                      placeholder="Brief summary of witness statement..."
                      rows={2}
                    />

                    {/* Witness Testimony File Upload */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Witness Sworn Statement File
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
                            onClick={() =>
                              handlePreviewFile(
                                `/api/v1/bcpc/files/witness/${w.id}`,
                                w.testimonyFileName || 'witness_testimony.pdf'
                              )
                            }
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
