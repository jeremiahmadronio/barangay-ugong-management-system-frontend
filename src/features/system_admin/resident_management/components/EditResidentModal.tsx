import { useEffect, useRef, useState } from 'react'
import { Camera, X, Users, Paperclip, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { FormModal } from '@/components/ui/FormModal'
import { FormSection } from '@/components/ui/FormSection'
import { residentService } from '@/config/api/residents/residents.service'
import type {
  ResidentDetailResponse,
  ResidentUpdateRequest,
  ResidentRelativeResponse,
  FamilyAssociationEntry,
} from '@/config/api/residents/residents.types'
import {
  buildCompleteAddress,
  DEFAULT_RESIDENT_ADDRESS,
  parseCompleteAddress,
  type ResidentAddressFields,
} from '@/features/system_admin/resident_management/addressForm'
import { ResidentAssociationDetailsModal } from './ResidentAssociationDetailsModal'

interface EditResidentModalProps {
  open: boolean
  resident: ResidentDetailResponse | null
  onClose: () => void
  onSaved: (name: string) => void
}

interface AttachedFileItem {
  id: string
  file: File
  name: string
  type: string
  url: string
}

const RELATIONSHIPS: { label: string; reverse: (newGender: string, otherGender: string) => string }[] = [
  { label: 'Father',   reverse: (ng) => ng === 'Female' ? 'Daughter' : 'Son' },
  { label: 'Mother',   reverse: (ng) => ng === 'Female' ? 'Daughter' : 'Son' },
  { label: 'Son',      reverse: (_ng, og) => og === 'Female' ? 'Mother' : 'Father' },
  { label: 'Daughter', reverse: (_ng, og) => og === 'Female' ? 'Mother' : 'Father' },
  { label: 'Spouse',   reverse: () => 'Spouse' },
  { label: 'Brother',  reverse: (ng) => ng === 'Female' ? 'Sister' : 'Brother' },
  { label: 'Sister',   reverse: (ng) => ng === 'Female' ? 'Sister' : 'Brother' },
  { label: 'Relative', reverse: () => 'Relative' },
]

const EDUCATION_OPTIONS = [
  'No Formal Education', 'Elementary', 'High School',
  'Vocational', 'College', 'Post Graduate',
]

const inputCls =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:bg-slate-50/40 focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400'

const selectCls =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-0'

const errorCls = 'mt-1 text-xs text-rose-500'

interface SelectedRelative {
  resident: ResidentRelativeResponse
  relationship: string
}

/** Ensures contact number always starts with '09', contains digits only, and max 11 digits */
function formatPhContactNumber(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('639')) {
    digits = '0' + digits.slice(2)
  }

  if (!digits.startsWith('09')) {
    if (digits.startsWith('9')) {
      digits = '0' + digits
    } else if (digits === '0' || digits === '') {
      digits = '09'
    } else {
      digits = '09' + digits.replace(/^0+/, '')
    }
  }

  if (digits.length < 2) {
    digits = '09'
  }

  return digits.slice(0, 11)
}

export function EditResidentModal({ open, resident, onClose, onSaved }: EditResidentModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)

  // Attached files/documents list
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])
  const [addressFields, setAddressFields] = useState<ResidentAddressFields>(DEFAULT_RESIDENT_ADDRESS)

  const [formData, setFormData] = useState<ResidentUpdateRequest>({
    firstName: '', lastName: '', middleName: '', suffix: '',
    contactNumber: '', email: '', completeAddress: '',
    gender: 'Male', civilStatus: 'Single', occupation: '',
    birthDate: '', barangayIdNumber: '', householdNumber: '',
    isHeadOfFamily: false, educationalAttainment: 'College',
    citizenship: 'Filipino', status: 'ACTIVE', statusRemarks: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Family association
  const [relatives, setRelatives] = useState<ResidentRelativeResponse[]>([])
  const [relativesLoading, setRelativesLoading] = useState(false)
  const [selectedRelatives, setSelectedRelatives] = useState<Map<number, SelectedRelative>>(new Map())
  const [viewingRelative, setViewingRelative] = useState<ResidentRelativeResponse | null>(null)
  const lastNameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastQueriedLastName = useRef<string>('')

  useEffect(() => {
    if (!open || !resident) return
    const p = resident.personInfo
    setPhoto(null)
    setPhotoPreview(resident.photoBase64 ? (resident.photoBase64.startsWith('data:') ? resident.photoBase64 : `data:image/jpeg;base64,${resident.photoBase64}`) : null)
    setZoomScale(1)
    setAttachedFiles([])
    setErrors({})
    setServerError(null)
    setRelatives([])
    setSelectedRelatives(new Map())
    setViewingRelative(null)
    setAddressFields(parseCompleteAddress(p?.completeAddress))
    lastQueriedLastName.current = ''
    setFormData({
      firstName: p?.firstName || '',
      lastName: p?.lastName || '',
      middleName: p?.middleName || '',
      suffix: p?.suffix || '',
      contactNumber: p?.contactNumber ? formatPhContactNumber(p.contactNumber) : '09',
      email: p?.email || p?.emailAddress || (resident as any).email || '',
      completeAddress: p?.completeAddress || '',
      gender: p?.gender || 'Male',
      civilStatus: p?.civilStatus || 'Single',
      occupation: p?.occupation || '',
      birthDate: p?.birthDate || '',
      barangayIdNumber: resident.barangayIdNumber || '',
      householdNumber: resident.householdNumber || '',
      isHeadOfFamily: resident.isHeadOfFamily || false,
      educationalAttainment: resident.educationalAttainment || 'College',
      citizenship: resident.citizenship || 'Filipino',
      status: resident.status || 'ACTIVE',
      statusRemarks: resident.statusRemarks || '',
      dateOfResidency: resident.dateOfResidency || '',
    })

    // Pre-fill attached files if available
    if (resident.attachedFiles && resident.attachedFiles.length > 0) {
      setAttachedFiles(resident.attachedFiles.map((doc) => ({
        id: String(doc.id),
        file: new File([], doc.fileName),
        name: doc.fileName,
        type: doc.fileType || 'application/octet-stream',
        url: doc.fileBase64 ? (doc.fileBase64.startsWith('data:') ? doc.fileBase64 : `data:${doc.fileType || 'application/octet-stream'};base64,${doc.fileBase64}`) : '',
      })))
    }

    // Pre-fill family associations if available
    if (resident.familyAssociations && resident.familyAssociations.length > 0) {
      const initialMap = new Map<number, SelectedRelative>()
      for (const rel of resident.familyAssociations) {
        initialMap.set(rel.id, {
          resident: rel,
          relationship: rel.relationshipType || 'Relative',
        })
      }
      setSelectedRelatives(initialMap)
    }

    if (p?.lastName && p.lastName.trim().length >= 2) {
      loadRelatives(p.lastName.trim(), resident.id)
    }
  }, [open, resident])

  const loadRelatives = async (lastName: string, excludeId: number) => {
    setRelativesLoading(true)
    try {
      const data = await residentService.getRelativesByLastName(lastName)
      const filtered = data.filter((r) => r.id !== excludeId)
      const existing = resident?.familyAssociations || []
      const mergedMap = new Map<number, ResidentRelativeResponse>()
      for (const r of filtered) mergedMap.set(r.id, r)
      for (const e of existing) {
        if (e.id !== excludeId && !mergedMap.has(e.id)) {
          mergedMap.set(e.id, e)
        }
      }
      setRelatives(Array.from(mergedMap.values()))
    } catch {
      setRelatives(resident?.familyAssociations?.filter((r) => r.id !== excludeId) || [])
    } finally {
      setRelativesLoading(false)
    }
  }

  const handleChange = (field: keyof ResidentUpdateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleAddressChange = (
    field: keyof Pick<ResidentAddressFields, 'houseUnitBuilding' | 'streetName' | 'subdivisionPhasePurok'>,
    value: string,
  ) => {
    setAddressFields((prev) => {
      const next = { ...prev, [field]: value }
      setFormData((current) => ({
        ...current,
        completeAddress: buildCompleteAddress(next),
      }))
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleLastNameChange = (value: string) => {
    handleChange('lastName', value)
    if (lastNameDebounce.current) clearTimeout(lastNameDebounce.current)

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setRelatives([])
      setSelectedRelatives(new Map())
      lastQueriedLastName.current = ''
      return
    }

    lastNameDebounce.current = setTimeout(async () => {
      if (trimmed === lastQueriedLastName.current) return
      lastQueriedLastName.current = trimmed
      await loadRelatives(trimmed, resident?.id ?? -1)
    }, 500)
  }

  const toggleRelative = (rel: ResidentRelativeResponse, checked: boolean) => {
    setSelectedRelatives((prev) => {
      const next = new Map(prev)
      if (checked) next.set(rel.id, { resident: rel, relationship: '' })
      else next.delete(rel.id)
      return next
    })
  }

  const setRelationship = (relId: number, relationship: string) => {
    setSelectedRelatives((prev) => {
      const next = new Map(prev)
      const entry = next.get(relId)
      if (entry) next.set(relId, { ...entry, relationship })
      return next
    })
  }

  const computeReverse = (relationship: string, otherGender?: string): string => {
    const rel = RELATIONSHIPS.find((r) => r.label === relationship)
    return rel ? rel.reverse(formData.gender ?? 'Male', otherGender ?? 'Male') : 'Relative'
  }

  // ── Photo Handlers & Zoom Controls ─────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setZoomScale(1)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const clearPhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setZoomScale(1)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleZoomIn = () => setZoomScale((s) => Math.min(s + 0.2, 3))
  const handleZoomOut = () => setZoomScale((s) => Math.max(s - 0.2, 0.6))
  const handleResetZoom = () => setZoomScale(1)

  // ── Files / Documents Handlers (No Limit) ───────────────────────────────────
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newItems: AttachedFileItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      type: f.type || 'application/octet-stream',
      url: URL.createObjectURL(f),
    }))

    setAttachedFiles((prev) => [...prev, ...newItems])
    if (docFileRef.current) docFileRef.current.value = ''
  }

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const handleViewFile = (item: AttachedFileItem) => {
    window.open(item.url, '_blank')
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.'
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.'
    if (!formData.birthDate) errs.birthDate = 'Date of birth is required.'
    if (!formData.gender) errs.gender = 'Gender is required.'
    if (!formData.civilStatus) errs.civilStatus = 'Civil status is required.'
    if (!addressFields.houseUnitBuilding.trim()) errs.houseUnitBuilding = 'House No. / Unit / Building No. is required.'
    if (!addressFields.streetName.trim()) errs.streetName = 'Street name is required.'
    if (!addressFields.subdivisionPhasePurok.trim()) errs.subdivisionPhasePurok = 'Subdivision / Phase / Purok is required.'
    if (!formData.barangayIdNumber?.trim()) errs.barangayIdNumber = 'Barangay ID number is required.'
    if (!formData.householdNumber?.trim()) errs.householdNumber = 'Household number is required.'
    if (!formData.dateOfResidency) errs.dateOfResidency = 'Date of residency is required.'
    if (!formData.contactNumber?.trim() || formData.contactNumber.trim() === '09') {
      errs.contactNumber = 'Contact number is required.'
    } else if (!/^09\d{9}$/.test(formData.contactNumber.trim())) {
      errs.contactNumber = 'Contact number must be exactly 11 digits starting with 09 (e.g. 09123456789).'
    }
    if (!formData.citizenship?.trim()) errs.citizenship = 'Citizenship is required.'
    if (!formData.occupation?.trim()) errs.occupation = 'Occupation is required.'
    if (!formData.educationalAttainment) errs.educationalAttainment = 'Educational attainment is required.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!resident || !validate()) return
    setIsSubmitting(true)
    setServerError(null)
    try {
      const familyAssociations: FamilyAssociationEntry[] = Array.from(selectedRelatives.values())
        .filter((s) => s.relationship)
        .map((s) => ({
          relatedResidentId: s.resident.id,
          relationship: s.relationship,
          reverseRelationship: computeReverse(s.relationship, s.resident.gender),
        }))

      const filesPayload = await Promise.all(
        attachedFiles.map(async (item) => ({
          fileName: item.name,
          fileType: item.type,
          fileBase64: await toBase64(item.file),
        }))
      )

      let photoBase64Payload: string | undefined = undefined
      if (photo) {
        photoBase64Payload = await toBase64(photo)
      } else if (photoPreview) {
        photoBase64Payload = photoPreview.includes(',') ? photoPreview.split(',')[1] : photoPreview
      }

      const payload: ResidentUpdateRequest = {
        ...formData,
        completeAddress: buildCompleteAddress(addressFields),
        familyAssociations: familyAssociations.length > 0 ? familyAssociations : undefined,
        attachedFiles: filesPayload.length > 0 ? filesPayload : undefined,
        photoBase64: photoBase64Payload,
      }

      await residentService.updateResident(resident.id, payload)
      onSaved(`${formData.firstName} ${formData.lastName}`.trim())
      onClose()
    } catch (err: any) {
      setServerError(err?.response?.data?.message || err.message || 'Failed to update resident.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = Boolean(
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.birthDate &&
    formData.gender &&
    formData.civilStatus &&
    addressFields.houseUnitBuilding.trim() &&
    addressFields.streetName.trim() &&
    addressFields.subdivisionPhasePurok.trim() &&
    formData.barangayIdNumber?.trim() &&
    formData.householdNumber?.trim() &&
    formData.dateOfResidency &&
    formData.contactNumber?.trim() &&
    formData.citizenship?.trim() &&
    formData.occupation?.trim() &&
    formData.educationalAttainment
  )

  return (
    <>
      <FormModal
        open={open}
        title="Edit Resident Record"
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        submitDisabled={!canSubmit}
        maxWidthClass="max-w-3xl"
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <div className="space-y-8">
        {serverError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">
            {serverError}
          </div>
        )}

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <FormSection title="PERSONAL INFORMATION">
          <div className="flex gap-5 items-start">
            {/* Photo Avatar + Zoom Controls (OPTIONAL) */}
            <div className="shrink-0 flex flex-col items-center">
              <p className="text-sm font-medium text-slate-700 mb-1.5 self-start">Photo <span className="text-xs text-slate-400 font-normal">(Optional)</span></p>
              <div className="relative mb-2">
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ transform: `scale(${zoomScale})` }}
                      className="h-full w-full object-cover transition-transform duration-150"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="h-full w-full flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Camera size={26} className="text-slate-400" />
                    </button>
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {photoPreview && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button
                    type="button"
                    title="Zoom Out"
                    onClick={handleZoomOut}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-semibold text-slate-600 min-w-[28px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    title="Zoom In"
                    onClick={handleZoomIn}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    title="Reset Zoom"
                    onClick={handleResetZoom}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                First Name <span className="text-rose-500">*</span>
                <input type="text" value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  maxLength={40}
                  className={`${inputCls} ${errors.firstName ? 'border-rose-400' : ''}`} />
                {errors.firstName && <p className={errorCls}>{errors.firstName}</p>}
              </label>

              <div className="block text-sm font-medium text-slate-700">
                Last Name <span className="text-rose-500">*</span>
                <input type="text" value={formData.lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  maxLength={40}
                  className={`${inputCls} ${errors.lastName ? 'border-rose-400' : ''}`} />
                {errors.lastName && <p className={errorCls}>{errors.lastName}</p>}
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Middle Name <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                <input type="text" value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  maxLength={40} className={inputCls} />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Suffix <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                <select value={formData.suffix} onChange={(e) => handleChange('suffix', e.target.value)} className={selectCls}>
                  <option value="">None</option>
                  <option>Jr.</option><option>Sr.</option>
                  <option>II</option><option>III</option><option>IV</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              Date of Birth <span className="text-rose-500">*</span>
              <input type="date" value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className={`${inputCls} ${errors.birthDate ? 'border-rose-400' : ''}`} />
              {errors.birthDate && <p className={errorCls}>{errors.birthDate}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Gender <span className="text-rose-500">*</span>
              <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}
                className={`${selectCls} ${errors.gender ? 'border-rose-400' : ''}`}>
                <option value="">- Select -</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className={errorCls}>{errors.gender}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Civil Status <span className="text-rose-500">*</span>
              <select value={formData.civilStatus} onChange={(e) => handleChange('civilStatus', e.target.value)}
                className={`${selectCls} ${errors.civilStatus ? 'border-rose-400' : ''}`}>
                <option value="">- Select -</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Annulled">Annulled</option>
              </select>
              {errors.civilStatus && <p className={errorCls}>{errors.civilStatus}</p>}
            </label>
          </div>
        </FormSection>

        {/* ── Resident Information ─────────────────────────────────────────── */}
        <FormSection title="RESIDENT INFORMATION">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              House No. / Unit / Building No. <span className="text-rose-500">*</span>
              <input
                type="text"
                value={addressFields.houseUnitBuilding}
                onChange={(e) => handleAddressChange('houseUnitBuilding', e.target.value)}
                placeholder="e.g. 12A / Unit 3B"
                maxLength={80}
                className={`${inputCls} ${errors.houseUnitBuilding ? 'border-rose-400' : ''}`}
              />
              {errors.houseUnitBuilding && <p className={errorCls}>{errors.houseUnitBuilding}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Street Name <span className="text-rose-500">*</span>
              <input
                type="text"
                value={addressFields.streetName}
                onChange={(e) => handleAddressChange('streetName', e.target.value)}
                placeholder="e.g. F. Legaspi Street"
                maxLength={80}
                className={`${inputCls} ${errors.streetName ? 'border-rose-400' : ''}`}
              />
              {errors.streetName && <p className={errorCls}>{errors.streetName}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Subdivision / Phase / Purok <span className="text-rose-500">*</span>
              <input
                type="text"
                value={addressFields.subdivisionPhasePurok}
                onChange={(e) => handleAddressChange('subdivisionPhasePurok', e.target.value)}
                placeholder="e.g. Purok 3 / Phase 2"
                maxLength={80}
                className={`${inputCls} ${errors.subdivisionPhasePurok ? 'border-rose-400' : ''}`}
              />
              {errors.subdivisionPhasePurok && <p className={errorCls}>{errors.subdivisionPhasePurok}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Barangay
              <input
                type="text"
                value={addressFields.barangay}
                disabled
                readOnly
                className={inputCls}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              City / Municipality
              <input
                type="text"
                value={addressFields.cityMunicipality}
                disabled
                readOnly
                className={inputCls}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Province / Region
              <input
                type="text"
                value={addressFields.provinceRegion}
                disabled
                readOnly
                className={inputCls}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              Barangay ID Number <span className="text-rose-500">*</span>
              <input type="text" value={formData.barangayIdNumber}
                onChange={(e) => handleChange('barangayIdNumber', e.target.value)}
                className={`${inputCls} ${errors.barangayIdNumber ? 'border-rose-400' : ''}`} />
              {errors.barangayIdNumber && <p className={errorCls}>{errors.barangayIdNumber}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Household Number <span className="text-rose-500">*</span>
              <input type="text" value={formData.householdNumber}
                onChange={(e) => handleChange('householdNumber', e.target.value)}
                className={`${inputCls} ${errors.householdNumber ? 'border-rose-400' : ''}`} />
              {errors.householdNumber && <p className={errorCls}>{errors.householdNumber}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Date of Residency <span className="text-rose-500">*</span>
              <input type="date" value={formData.dateOfResidency ?? ''}
                onChange={(e) => handleChange('dateOfResidency', e.target.value)}
                className={`${inputCls} ${errors.dateOfResidency ? 'border-rose-400' : ''}`} />
              {errors.dateOfResidency && <p className={errorCls}>{errors.dateOfResidency}</p>}
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <input id="edit-head" type="checkbox" checked={formData.isHeadOfFamily}
                onChange={(e) => handleChange('isHeadOfFamily', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="edit-head" className="cursor-pointer text-sm font-medium text-slate-700">
                Head of Household / Family <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* ── Additional Details ───────────────────────────────────────────── */}
        <FormSection title="ADDITIONAL DETAILS">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Contact Number <span className="text-rose-500">*</span>
              <input
                type="tel"
                value={formData.contactNumber}
                maxLength={11}
                onChange={(e) => handleChange('contactNumber', formatPhContactNumber(e.target.value))}
                onKeyDown={(e) => {
                  const target = e.currentTarget
                  if (
                    (e.key === 'Backspace' && target.selectionStart !== null && target.selectionStart <= 2 && (target.selectionEnd ?? 0) <= 2) ||
                    (e.key === 'Delete' && target.selectionStart !== null && target.selectionStart < 2)
                  ) {
                    e.preventDefault()
                  }
                }}
                placeholder="09XXXXXXXXX"
                className={`${inputCls} ${errors.contactNumber ? 'border-rose-400' : ''}`}
              />
              {errors.contactNumber && <p className={errorCls}>{errors.contactNumber}</p>}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Citizenship <span className="text-rose-500">*</span>
              <select value={formData.citizenship} onChange={(e) => handleChange('citizenship', e.target.value)}
                className={`${selectCls} ${errors.citizenship ? 'border-rose-400' : ''}`}>
                <option value="Filipino">Filipino</option>
                <option value="Dual Citizen">Dual Citizen</option>
                <option value="Foreign National">Foreign National</option>
              </select>
              {errors.citizenship && <p className={errorCls}>{errors.citizenship}</p>}
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Occupation <span className="text-rose-500">*</span>
              <input type="text" value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="e.g. Driver" maxLength={80}
                className={`${inputCls} ${errors.occupation ? 'border-rose-400' : ''}`} />
              {errors.occupation && <p className={errorCls}>{errors.occupation}</p>}
              <span className="mt-0.5 block text-right text-xs text-slate-400">
                {(formData.occupation ?? '').length}/80
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Educational Attainment <span className="text-rose-500">*</span>
              <select value={formData.educationalAttainment}
                onChange={(e) => handleChange('educationalAttainment', e.target.value)}
                className={`${selectCls} ${errors.educationalAttainment ? 'border-rose-400' : ''}`}>
                <option value="">- Select -</option>
                {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.educationalAttainment && <p className={errorCls}>{errors.educationalAttainment}</p>}
            </label>
          </div>

          {/* ── Resident Files / Documents Section (Unlimited Upload) ── */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-800">Resident Files / Documents</h4>
              </div>

              <input
                ref={docFileRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAddFiles}
              />
              <button
                type="button"
                onClick={() => docFileRef.current?.click()}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                Add Files
              </button>
            </div>

            {attachedFiles.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files attached yet.</p>
            ) : (
              <div className="space-y-2">
                {attachedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{item.type}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        className="font-medium text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewFile(item)}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* ── Family Association ───────────────────────────────────────────── */}
        <FormSection title="FAMILY ASSOCIATION">
          <p className="text-sm text-slate-500 mb-3">
            Associate this resident with an existing family member in the barangay.
          </p>

          {formData.lastName.trim().length >= 2 && (
            <p className="text-xs text-slate-400 mb-3">
              Residents with last name &ldquo;<span className="font-medium text-slate-600">{formData.lastName.trim()}</span>&rdquo;
            </p>
          )}

          {relativesLoading && (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching residents…
            </div>
          )}

          {!relativesLoading && formData.lastName.trim().length >= 2 && relatives.length === 0 && (
            <p className="text-sm text-slate-400 italic py-2">No other residents found with this last name.</p>
          )}

          {!relativesLoading && relatives.length > 0 && (
            <div className="space-y-2">
              {relatives.map((rel) => {
                const isSelected = selectedRelatives.has(rel.id)
                const selected = selectedRelatives.get(rel.id)
                const reverseLabel = selected?.relationship
                  ? computeReverse(selected.relationship, rel.gender)
                  : null

                return (
                  <div key={rel.id}
                    className={`rounded-lg border px-3.5 py-3 transition-colors ${
                      isSelected ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <input type="checkbox" id={`edit-rel-${rel.id}`} checked={isSelected}
                        onChange={(e) => toggleRelative(rel, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" />

                      <label htmlFor={`edit-rel-${rel.id}`} className="flex-1 cursor-pointer min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{rel.fullName}</p>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate">
                          {rel.address || 'Purok 4, Brgy. Ugong, Valenzuela City'} | Age {rel.age ?? '64'} | {rel.status ?? 'ACTIVE'}
                        </p>
                      </label>

                      <button
                        type="button"
                        onClick={() => setViewingRelative(rel)}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer mr-2"
                      >
                        [View Details]
                      </button>

                      {isSelected && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-600 whitespace-nowrap font-medium">Relationship:</span>
                          <select value={selected?.relationship ?? ''}
                            onChange={(e) => setRelationship(rel.id, e.target.value)}
                            className="rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">- Select -</option>
                            {RELATIONSHIPS.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {isSelected && reverseLabel && (
                      <p className="mt-2 ml-7 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{rel.fullName}</span> will be tagged as your{' '}
                        <span className="font-semibold text-blue-600">{reverseLabel}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {formData.lastName.trim().length < 2 && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
              <Users size={16} className="shrink-0" />
              Type the last name above to search for existing family members.
            </div>
          )}
        </FormSection>
        </div>
      </FormModal>

      <ResidentAssociationDetailsModal
        open={Boolean(viewingRelative)}
        resident={viewingRelative}
        onClose={() => setViewingRelative(null)}
      />
    </>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      res(result.split(',')[1] ?? result)
    }
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}
