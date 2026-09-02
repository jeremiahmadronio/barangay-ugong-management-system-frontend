import { useState, useEffect, useMemo, useRef } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchSelect, type SearchSelectOption } from '@/components/ui/SearchSelect'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import {
  clearanceApi,
  type TemplateOptionResponse,
  type TemplateDetailResponse,
  type ClearanceResidentSearchResponse,
} from '@/api/modules/clearance.api'
import {
  Search,
  X,
  FileText,
  ChevronLeft,
  Loader2,
  RotateCcw,
  Printer,
  Camera,
  Upload,
  Sparkles,
  CheckCircle,
  Building2,
  Award,
  HeartHandshake,
  Zap,
  Warehouse,
  Car,
  Scale,
  Home,
  Scroll,
  HardHat,
  Hammer,
  Shovel,
  Users,
  PhoneCall,
  Bike,
  Droplets,
  FileCheck2,
} from 'lucide-react'

const getTemplateMetadata = (title: string) => {
  const upper = (title || '').toUpperCase()
  if (upper.includes('BUILDING')) {
    return {
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Permit for residential and commercial building construction',
    }
  }
  if (upper.includes('MORAL')) {
    return {
      icon: Award,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Certification of good moral standing and character',
    }
  }
  if (upper.includes('INDIGENCY')) {
    return {
      icon: HeartHandshake,
      color: 'bg-rose-50 text-rose-600',
      description: 'Proof of low-income status for financial & medical assistance',
    }
  }
  if (upper.includes('UTILITY') || upper.includes('ELECTRICAL')) {
    return {
      icon: Zap,
      color: 'bg-amber-50 text-amber-600',
      description: 'Clearance for Meralco & electrical utility installation',
    }
  }
  if (upper.includes('GARAGE') || upper.includes('EBIKE') || upper.includes('ETRIKE')) {
    return {
      icon: Warehouse,
      color: 'bg-cyan-50 text-cyan-600',
      description: 'Certification for e-bike / e-trike garage space & ownership',
    }
  }
  if (upper.includes('REGISTRATION')) {
    return {
      icon: Car,
      color: 'bg-sky-50 text-sky-600',
      description: 'Barangay registration & verification for local vehicles',
    }
  }
  if (upper.includes('BAIL')) {
    return {
      icon: Scale,
      color: 'bg-violet-50 text-violet-600',
      description: 'Barangay court certificate for bail bond processing',
    }
  }
  if (upper.includes('RESIDENCY')) {
    return {
      icon: Home,
      color: 'bg-teal-50 text-teal-600',
      description: 'Official proof of active residence within the barangay',
    }
  }
  if (upper.includes('DECEASED')) {
    return {
      icon: Scroll,
      color: 'bg-slate-100 text-slate-600',
      description: 'Certification for deceased residents and burial assistance',
    }
  }
  if (upper.includes('CONTRACTOR')) {
    return {
      icon: HardHat,
      color: 'bg-orange-50 text-orange-600',
      description: 'Permit authorization for independent construction contractors',
    }
  }
  if (upper.includes('DEMOLITION')) {
    return {
      icon: Hammer,
      color: 'bg-red-50 text-red-600',
      description: 'Clearance authorizing building demolition & teardown',
    }
  }
  if (upper.includes('EXCAVATION')) {
    return {
      icon: Shovel,
      color: 'bg-yellow-50 text-yellow-700',
      description: 'Permit for road, ground, and pipe excavation work',
    }
  }
  if (upper.includes('GUARDIANSHIP')) {
    return {
      icon: Users,
      color: 'bg-pink-50 text-pink-600',
      description: 'Legal guardianship verification for minors and dependents',
    }
  }
  if (upper.includes('TELEPHONE')) {
    return {
      icon: PhoneCall,
      color: 'bg-blue-50 text-blue-600',
      description: 'Permit for telecom & internet fiber line installations',
    }
  }
  if (upper.includes('TRICYCLE')) {
    return {
      icon: Bike,
      color: 'bg-green-50 text-green-600',
      description: 'Barangay endorsement for TODA tricycle franchise application',
    }
  }
  if (upper.includes('WATER')) {
    return {
      icon: Droplets,
      color: 'bg-blue-50 text-blue-600',
      description: 'Clearance for Maynilad / Manila Water pipeline connection',
    }
  }
  return {
    icon: FileCheck2,
    color: 'bg-blue-50 text-blue-600',
    description: 'Official barangay clearance for employment, IDs, and transactions',
  }
}

// Default fallback active templates
const DEFAULT_TEMPLATES: TemplateOptionResponse[] = [
  { id: 1, certTitle: 'BARANGAY CLEARANCE' },
  { id: 2, certTitle: 'BUILDING CLEARANCE' },
  { id: 3, certTitle: 'GOOD MORAL CHARACTER' },
  { id: 4, certTitle: 'INDIGENCY' },
  { id: 5, certTitle: 'UTILITY CONNECTION CLEARANCE' },
  { id: 6, certTitle: 'EBIKE/ETRIKE GARAGE' },
  { id: 7, certTitle: 'ETRIKE REGISTRATION' },
  { id: 8, certTitle: 'CERTIFICATION FOR BAIL' },
  { id: 9, certTitle: 'RESIDENCY' },
  { id: 10, certTitle: 'CERTIFICATION FOR DECEASED' },
  { id: 11, certTitle: 'CONTRACTOR PERMIT' },
  { id: 12, certTitle: 'DEMOLITION CLEARANCE' },
  { id: 13, certTitle: 'EXCAVATION CLEARANCE' },
  { id: 14, certTitle: 'GUARDIANSHIP' },
  { id: 15, certTitle: 'TELEPHONE CONNECTION' },
  { id: 16, certTitle: 'TRICYCLE FRANCHISE' },
  { id: 17, certTitle: 'WATER CONNECTION' },
]

const COMMON_PURPOSES = [
  'Employment (Local)',
  'Employment (Abroad / OFW)',
  'School Requirement / Scholarship',
  'Postal ID / Government ID Application',
  'Bank Account Opening / Loan Application',
  'Police / NBI Clearance Application',
  'Business Permit / Franchise Application',
  'Legal / Court Proceedings',
  'Medical / Financial Assistance',
  'General Identification Purpose',
]

// Helper to get formatted today date (YYYY-MM-DD)
const getTodayIsoDate = () => new Date().toISOString().split('T')[0]

// Helper to get validity date (N months from now)
const getFutureIsoDate = (months = 6) => {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export interface ClearanceFormProps {
  onIssuanceComplete?: () => void
}

export function ClearanceForm({ onIssuanceComplete }: ClearanceFormProps = {}) {
  // Navigation step: 'select' (Document grid) vs 'form' (Issuance inputs + Resident verification)
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOptionResponse | null>(null)
  const [templateDetail, setTemplateDetail] = useState<TemplateDetailResponse | null>(null)

  // Document list state
  const [templates, setTemplates] = useState<TemplateOptionResponse[]>(DEFAULT_TEMPLATES)
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Resident Search & Profile State
  const [residentSearchQuery, setResidentSearchQuery] = useState('')
  const [residentOptions, setResidentOptions] = useState<SearchSelectOption[]>([])
  const [isSearchingResident, setIsSearchingResident] = useState(false)
  const [selectedResident, setSelectedResident] = useState<ClearanceResidentSearchResponse | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    houseNumber: '',
    street: '',
    purok: '',
    barangay: 'Barangay Ugong',
    city: 'Valenzuela City',
    province: 'Metro Manila',
    dateOfBirth: '',
    placeOfBirth: 'Valenzuela City',
    purpose: '',
    customPurpose: '',
    residencySince: '',
    applicantType: 'Individual',
    // Property Information (Building Clearance)
    propertyAddress: '',
    typeOfApplication: '',
    otherTypeOfApplication: '',
    buildingClassification: '',
    otherBuildingClassification: '',
    ownershipDocumentType: '',
    otherOwnershipDocumentType: '',
    tctNumber: '',
    registeredOwnerName: '',
    // Utility Connection
    utilityApplicationType: 'Electrical Permit (Meralco)',
    // Certification for Bail
    defendantName: '',
    caseDetails: '',
    // Certification for Deceased
    deceasedName: '',
    dateOfDeath: '',
    // Ebike / Etrike
    vehicleBrand: '',
    motorNumber: '',
    chassisNumber: '',
    bodyColor: '',
    // Clearance Issuance Details
    ctnNumber: '',
    issuedAt: 'Barangay Ugong, Valenzuela City',
    issuedOn: getTodayIsoDate(),
    orNumber: '',
    orDate: getTodayIsoDate(),
    validUntil: getFutureIsoDate(6),
    // Photo & Thumbmark print flags
    showPhotoOnCert: true,
    showThumbmarkOnCert: true,
    photoPreviewUrl: null as string | null,
    // Requirements Verification
    hasValidId: false,
    validIdFile: null as File | null,
    requirementChecks: {} as Record<string, boolean>,
    requirementFiles: {} as Record<
      string,
      { name: string; file: File; fileData?: string; fileType?: string; size?: string }
    >,
  })

  const { showFeedback, feedbackDialogProps } = useDialogs()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // File Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Dynamic Template Detection
  const titleLower = (selectedTemplate?.certTitle || templateDetail?.certTitle || '').toLowerCase()
  const isBuildingClearance = titleLower.includes('building')
  const isUtilityClearance = titleLower.includes('utility') || titleLower.includes('electrical')
  const isIndigency = titleLower.includes('indigen')
  const isBail = titleLower.includes('bail')
  const isDeceased = titleLower.includes('deceased')
  const isEbike = titleLower.includes('ebike') || titleLower.includes('etrike') || titleLower.includes('garage')

  // Dynamic Requirements Checklist Definition
  const currentRequirements = useMemo(() => {
    if (isBuildingClearance) {
      return [
        { id: 'req_valid_id', label: 'Valid ID with Ugong Address', required: true },
        { id: 'req_cedula', label: 'Cedula', required: true },
        { id: 'req_building_plan', label: 'Building Plan / Blueprint', required: true },
        { id: 'req_site_photo', label: 'Photo of Lot/Project Site', required: true },
        { id: 'req_title', label: 'Proof of Ownership / Lease Contract', required: true },
        ...(formData.applicantType === 'Corporation/Partnership'
          ? [{ id: 'req_sec_cert', label: "Secretary's Certificate", required: true }]
          : []),
        ...(formData.ownershipDocumentType === 'Lease Contract'
          ? [{ id: 'req_owner_consent', label: "Owner's Consent / Authorization Letter", required: true }]
          : []),
      ]
    }
    if (isUtilityClearance) {
      return [
        { id: 'req_land_title', label: 'Land Title (TCT/Tax Declaration)', required: true },
        { id: 'req_hoa_cert', label: 'HOA Certificate', required: true },
        { id: 'req_valid_id', label: 'Valid ID of Owner', required: true },
      ]
    }
    if (isIndigency) {
      return [
        { id: 'req_valid_id', label: 'Valid ID with Ugong Address', required: true },
        { id: 'req_proof_indigency', label: 'Proof of Indigency / Case Study', required: false },
      ]
    }
    if (isBail) {
      return [
        { id: 'req_rep_id', label: "Representative's Valid ID", required: true },
        { id: 'req_def_id', label: "Defendant's Valid ID", required: true },
        { id: 'req_house_sketch', label: 'House Sketch Submitted', required: true },
        { id: 'req_police_report', label: 'Police Report / Court Order', required: true },
      ]
    }
    if (isDeceased) {
      return [
        { id: 'req_death_cert', label: 'Death Certificate Submitted', required: true },
        { id: 'req_rep_id', label: 'Deceased / Representative Valid ID', required: true },
      ]
    }
    if (isEbike) {
      return [
        { id: 'req_valid_id', label: 'Valid ID with Ugong Address', required: true },
        { id: 'req_ebike_papers', label: 'E-bike / E-trike Purchase Receipt / Papers', required: true },
        { id: 'req_garage_photo', label: 'Proof of Garage / Land Title', required: true },
        { id: 'req_hoa_cert', label: 'HOA Certificate', required: false },
      ]
    }
    // Default (Barangay Clearance, Good Moral, etc.)
    return [
      { id: 'req_valid_id', label: 'Valid ID with Ugong Address', required: true },
      { id: 'req_cedula', label: 'Cedula', required: true },
    ]
  }, [
    isBuildingClearance,
    isUtilityClearance,
    isIndigency,
    isBail,
    isDeceased,
    isEbike,
    formData.applicantType,
    formData.ownershipDocumentType,
  ])

  // 1. Fetch live template options from Backend
  useEffect(() => {
    let mounted = true
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const data = await clearanceApi.getTemplateOptions()
        if (mounted && Array.isArray(data) && data.length > 0) {
          setTemplates(data)
        }
      } catch (err) {
        console.warn('Could not fetch active clearance templates, using default seed fallback.', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchTemplates()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Search Residents for Right Panel Autocomplete via Clearance API
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!residentSearchQuery || residentSearchQuery.length < 2) {
      setResidentOptions([])
      return
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingResident(true)
        const results = await clearanceApi.searchResidents(residentSearchQuery)
        const mapped: SearchSelectOption[] = (results || []).map((r: ClearanceResidentSearchResponse) => {
          const middle = r.middleName ? ` ${r.middleName.charAt(0)}.` : ''
          const suffix = r.suffix ? ` ${r.suffix}` : ''
          const fullName = `${r.lastName}, ${r.firstName}${middle}${suffix}`
          return {
            id: String(r.residentId),
            label: fullName,
            description: `${r.completeAddress || 'Brgy. Ugong, Valenzuela'} • ${r.civilStatus || 'Single'}`,
            data: r,
          }
        })
        setResidentOptions(mapped)
      } catch (err) {
        console.error('Resident search failed', err)
      } finally {
        setIsSearchingResident(false)
      }
    }, 280)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [residentSearchQuery])

  // Handle Resident Selection from Right Panel
  const handleResidentSelect = (option: SearchSelectOption) => {
    const resident: ClearanceResidentSearchResponse = option.data
    setSelectedResident(resident)

    // Parse resident address if available
    const rawAddr = resident.completeAddress || ''
    const parts = rawAddr.split(',').map((p) => p.trim())
    const parsedHouse = parts.length > 0 ? parts[0] : ''
    const parsedStreet = parts.length > 1 ? parts[1] : ''
    const parsedPurok = parts.length > 2 ? parts[2] : ''

    // Auto-fill Left Panel Form Data
    setFormData((prev) => ({
      ...prev,
      firstName: resident.firstName || '',
      middleName: resident.middleName || '',
      lastName: resident.lastName || '',
      suffix: resident.suffix || '',
      houseNumber: parsedHouse || '',
      street: parsedStreet || '',
      purok: parsedPurok || '',
      barangay: 'Barangay Ugong',
      city: 'Valenzuela City',
      province: 'Metro Manila',
      dateOfBirth: resident.birthDate ? String(resident.birthDate) : '',
      placeOfBirth: resident.placeOfBirth || 'Valenzuela City',
      residencySince: resident.residencyDate || '',
      propertyAddress: resident.completeAddress || '',
      registeredOwnerName: `${resident.firstName || ''} ${resident.lastName || ''}`.trim(),
    }))
  }

  // Clear resident selection
  const handleClearResidentSelection = () => {
    setSelectedResident(null)
    setResidentSearchQuery('')
  }

  // Handle Template Selection
  const handleSelectTemplate = async (template: TemplateOptionResponse) => {
    setSelectedTemplate(template)
    setStep('form')

    try {
      const detail = await clearanceApi.getTemplateById(template.id)
      setTemplateDetail(detail)
      if (detail) {
        const validityMonths = detail.validityMonths ?? 6
        setFormData((prev) => ({
          ...prev,
          showPhotoOnCert: detail.requiresPhoto ?? true,
          showThumbmarkOnCert: detail.requiresThumbmark ?? true,
          validUntil: getFutureIsoDate(validityMonths),
        }))
      }
    } catch (err) {
      console.warn('Could not fetch template details, using default state.', err)
    }
  }

  // Reset Form Fields
  const handleResetForm = () => {
    setSelectedResident(null)
    setResidentSearchQuery('')
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      houseNumber: '',
      street: '',
      purok: '',
      barangay: 'Barangay Ugong',
      city: 'Valenzuela City',
      province: 'Metro Manila',
      dateOfBirth: '',
      placeOfBirth: 'Valenzuela City',
      purpose: '',
      customPurpose: '',
      residencySince: '',
      applicantType: 'Individual',
      propertyAddress: '',
      typeOfApplication: '',
      otherTypeOfApplication: '',
      buildingClassification: '',
      otherBuildingClassification: '',
      ownershipDocumentType: '',
      otherOwnershipDocumentType: '',
      tctNumber: '',
      registeredOwnerName: '',
      utilityApplicationType: 'Electrical Permit (Meralco)',
      defendantName: '',
      caseDetails: '',
      deceasedName: '',
      dateOfDeath: '',
      vehicleBrand: '',
      motorNumber: '',
      chassisNumber: '',
      bodyColor: '',
      ctnNumber: '',
      issuedAt: 'Barangay Ugong, Valenzuela City',
      issuedOn: getTodayIsoDate(),
      orNumber: '',
      orDate: getTodayIsoDate(),
      validUntil: getFutureIsoDate(6),
      showPhotoOnCert: templateDetail ? templateDetail.requiresPhoto : true,
      showThumbmarkOnCert: templateDetail ? templateDetail.requiresThumbmark : true,
      photoPreviewUrl: null,
      hasValidId: false,
      validIdFile: null,
      requirementChecks: {},
      requirementFiles: {},
    })
  }

  // Handle Photo & File Uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, photoPreviewUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleValidIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setFormData((prev) => ({
          ...prev,
          validIdFile: file,
          hasValidId: true,
          requirementChecks: {
            ...prev.requirementChecks,
            req_valid_id: true,
          },
          requirementFiles: {
            ...prev.requirementFiles,
            req_valid_id: {
              name: file.name,
              file,
              fileData: dataUrl,
              fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'PDF',
              size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            },
          },
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) =>
      tpl.certTitle.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  }, [templates, searchQuery])

  // Handle Form Submission / Issuance with Audit Logging
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    try {
      setIsSubmitting(true)

      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}${formData.suffix ? ' ' + formData.suffix : ''}`.trim()

      const requirementsPayload = currentRequirements.map((req) => {
        const isChecked = !!formData.requirementChecks[req.id]
        const file = formData.requirementFiles[req.id]
        return {
          id: req.id,
          label: req.label,
          required: !!req.required,
          verified: isChecked || !!file,
          fileName: file ? file.name : undefined,
          fileData: file ? file.fileData : undefined,
          fileType: file ? file.fileType : undefined,
          fileSize: file ? file.size : undefined,
        }
      })

      const streetParts = [formData.houseNumber, formData.street, formData.purok].filter(Boolean).join(' ')
      const fullAddress = streetParts
        ? `${streetParts}, Barangay Ugong, Valenzuela City, Metro Manila`
        : 'Barangay Ugong, Valenzuela City, Metro Manila'

      const titleLower = (selectedTemplate.certTitle || '').toLowerCase()
      const isBuilding = titleLower.includes('building') || titleLower.includes('demolition') || titleLower.includes('contractor') || titleLower.includes('excavation')
      const isUtility = titleLower.includes('utility') || titleLower.includes('electrical') || titleLower.includes('telephone')
      const isBailDoc = titleLower.includes('bail')
      const isDeceasedDoc = titleLower.includes('deceased')
      const isEbikeDoc = titleLower.includes('ebike') || titleLower.includes('etrike') || titleLower.includes('garage')

      const fieldValues: Record<string, any> = {
        fullName: fullName,
        completeAddress: fullAddress,
        birthDate: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: selectedResident?.gender || 'N/A',
        civilStatus: selectedResident?.civilStatus || 'Single',
        contactNumber: selectedResident?.contactNumber || '',
        purpose: formData.purpose === 'Others' || formData.purpose === 'OTHER' ? formData.customPurpose : formData.purpose,
        residencySince: formData.residencySince,
        applicantType: formData.applicantType,
        showPhotoOnCert: formData.showPhotoOnCert,
        showThumbmarkOnCert: formData.showThumbmarkOnCert,
        photoUrl: formData.photoPreviewUrl,
        requirements: requirementsPayload,
        uploadedFiles: Object.entries(formData.requirementFiles).map(([k, v]) => ({
          key: k,
          name: v.name,
        })),
      }

      if (isBuilding) {
        fieldValues.propertyAddress = formData.propertyAddress
        fieldValues.typeOfApplication = formData.typeOfApplication
        fieldValues.otherTypeOfApplication = formData.otherTypeOfApplication
        fieldValues.buildingClassification = formData.buildingClassification
        fieldValues.ownershipDocumentType = formData.ownershipDocumentType
        fieldValues.tctNumber = formData.tctNumber
        fieldValues.registeredOwnerName = formData.registeredOwnerName
      }

      if (isUtility) {
        fieldValues.utilityApplicationType = formData.utilityApplicationType
        fieldValues.propertyAddress = formData.propertyAddress
      }

      if (isBailDoc) {
        fieldValues.defendantName = formData.defendantName
        fieldValues.caseDetails = formData.caseDetails
      }

      if (isDeceasedDoc) {
        fieldValues.deceasedName = formData.deceasedName
        fieldValues.dateOfDeath = formData.dateOfDeath
      }

      if (isEbikeDoc) {
        fieldValues.vehicleBrand = formData.vehicleBrand
        fieldValues.motorNumber = formData.motorNumber
        fieldValues.chassisNumber = formData.chassisNumber
        fieldValues.bodyColor = formData.bodyColor
      }

      const payload = {
        templateId: selectedTemplate.id,
        personId: selectedResident?.personId ?? selectedResident?.residentId,
        requestorName: fullName || selectedResident?.fullName || 'Resident Applicant',
        orNumber: formData.orNumber,
        ctnNumber: formData.ctnNumber,
        remarks: formData.customPurpose || formData.purpose,
        fieldValues: fieldValues,
      }

      const res = await clearanceApi.issueClearance(payload)

      showFeedback({
        variant: 'success',
        title: 'Clearance Issued Successfully',
        description: `${selectedTemplate.certTitle} (Cert No: ${res.certificateNumber}) has been officially issued for ${fullName || selectedResident?.fullName || 'Resident'}.`,
        actionLabel: 'Done',
      })

      handleResetForm()
      setStep('select')
      setSelectedTemplate(null)
      onIssuanceComplete?.()
    } catch (err: any) {
      console.error('Failed to issue clearance', err)
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to issue clearance. Please check the fields and try again.'

      showFeedback({
        variant: 'error',
        title: 'Failed to Issue Clearance',
        description: errorMsg,
        actionLabel: 'Try Again',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: ISSUANCE FORM & RESIDENT VERIFICATION VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'form' && selectedTemplate) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Back to Documents Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStep('select')
              setSelectedTemplate(null)
              setTemplateDetail(null)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Documents</span>
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN: FORM PANEL (7 Cols) ── */}
          <section className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {/* Template Header */}
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                  {selectedTemplate.certTitle}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Fill in the required information below
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >
              {/* 1. PERSONAL INFORMATION */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personal Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      placeholder="Middle Name"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Suffix</label>
                    <select
                      value={formData.suffix}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="V">V</option>
                      <option value="VI">VI</option>
                      <option value="VII">VII</option>
                      <option value="VIII">VIII</option>
                    </select>
                  </div>
                </div>

                {/* Structured Address Format */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        House No. / Unit / Building No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12A / Unit 3B"
                        value={formData.houseNumber}
                        onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Street Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. F. Legaspi Street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subdivision / Phase / Purok <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purok 3 / Phase 2"
                      value={formData.purok}
                      onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500">Full Address on Certificate: </span>
                    {[formData.houseNumber, formData.street, formData.purok, 'Barangay Ugong', 'Valenzuela City', 'Metro Manila']
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Place of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City / Municipality"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>

                {/* DYNAMIC PURPOSE & CERTIFICATION DETAILS */}
                {isBuildingClearance ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Certification Purpose
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Applicant Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.applicantType}
                          onChange={(e) => setFormData({ ...formData, applicantType: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="Individual">Individual</option>
                          <option value="Corporation/Partnership">Corporation/Partnership</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Purpose <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="">Select Purpose...</option>
                          <option value="Building Permit Application">Building Permit Application</option>
                          <option value="Occupancy Permit Application">Occupancy Permit Application</option>
                          <option value="Business Permit Application">Business Permit Application</option>
                          <option value="Renovation/Repair Clearance">Renovation/Repair Clearance</option>
                          <option value="Fence/Perimeter Wall Construction">Fence/Perimeter Wall Construction</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {formData.purpose === 'Others' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Other Purpose</label>
                          <input
                            type="text"
                            required
                            placeholder="State other purpose..."
                            value={formData.customPurpose}
                            onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : isUtilityClearance ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Application Details
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Type of Application <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.utilityApplicationType}
                          onChange={(e) => setFormData({ ...formData, utilityApplicationType: e.target.value, purpose: '' })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="Electrical Permit (Meralco)">Electrical Permit (Meralco)</option>
                          <option value="Water Service Permit (Maynilad)">Water Service Permit (Maynilad)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Purpose <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="">Select Purpose...</option>
                          {formData.utilityApplicationType === 'Water Service Permit (Maynilad)' ? (
                            <>
                              <option value="Water Service Connection">Water Service Connection</option>
                              <option value="New Water Service Connection">New Water Service Connection</option>
                              <option value="Additional Water Meter Installation">Additional Water Meter Installation</option>
                              <option value="Reconnection of Inactive Water Line">Reconnection of Inactive Water Line</option>
                              <option value="Relocation of Water Meter Facility">Relocation of Water Meter Facility</option>
                              <option value="Water Service Line Upgrade">Water Service Line Upgrade</option>
                              <option value="OTHER">Others (Specify in Other Purpose Field)</option>
                            </>
                          ) : (
                            <>
                              <option value="Electrical Permit">Electrical Permit</option>
                              <option value="New Service Connection">New Service Connection</option>
                              <option value="Separation of Service">Separation of Service</option>
                              <option value="Reconnection">Reconnection</option>
                              <option value="Relocation of Metering Facilities">Relocation of Metering Facilities</option>
                              <option value="OTHER">Others (Specify in Other Purpose Field)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {formData.purpose === 'OTHER' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Other Purpose</label>
                          <input
                            type="text"
                            required
                            placeholder="State other purpose..."
                            value={formData.customPurpose}
                            onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : isIndigency ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Purpose of Indigency
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Purpose <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                      >
                        <option value="">Select Purpose...</option>
                        <option value="Medical Assistance">Medical Assistance</option>
                        <option value="Educational Assistance / Scholarship">Educational Assistance / Scholarship</option>
                        <option value="Public Attorney Office (PAO) Legal Aid">Public Attorney Office (PAO) Legal Aid</option>
                        <option value="Financial / Burial Assistance">Financial / Burial Assistance</option>
                        <option value="Employment / Social Programs">Employment / Social Programs</option>
                        <option value="OTHER">Others (Specify in Other Purpose Field)</option>
                      </select>
                    </div>

                    {formData.purpose === 'OTHER' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Other Purpose</label>
                        <input
                          type="text"
                          required
                          placeholder="Please specify custom purpose..."
                          value={formData.customPurpose}
                          onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                ) : isBail ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Bail & Defendant Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Defendant Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Defendant Full Name"
                          value={formData.defendantName}
                          onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Case Details / Court Ref <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Criminal Case No. 12345"
                          value={formData.caseDetails}
                          onChange={(e) => setFormData({ ...formData, caseDetails: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ) : isDeceased ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Deceased Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Deceased Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name of Deceased"
                          value={formData.deceasedName}
                          onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date of Death <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateOfDeath}
                          onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ) : isEbike ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Vehicle Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Brand / Model <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Nwow / Hatasu"
                          value={formData.vehicleBrand}
                          onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Body Color <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Red / White"
                          value={formData.bodyColor}
                          onChange={(e) => setFormData({ ...formData, bodyColor: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Motor Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Motor / Engine No."
                          value={formData.motorNumber}
                          onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Chassis Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Chassis / VIN No."
                          value={formData.chassisNumber}
                          onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Purpose <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                      >
                        <option value="">Select Purpose...</option>
                        {COMMON_PURPOSES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="OTHER">Other / Specific Purpose</option>
                      </select>
                    </div>

                    {formData.purpose === 'OTHER' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Specify Purpose</label>
                        <input
                          type="text"
                          required
                          placeholder="State specific purpose..."
                          value={formData.customPurpose}
                          onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DYNAMIC PROPERTY INFORMATION (For Building Clearance) */}
                {isBuildingClearance && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Property Information
                      </h4>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Property/Lot Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Complete property / construction lot address"
                        value={formData.propertyAddress}
                        onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Type of Application <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.typeOfApplication}
                          onChange={(e) => setFormData({ ...formData, typeOfApplication: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="">Select Type of Application...</option>
                          <option value="New Construction">New Construction</option>
                          <option value="Renovation">Renovation</option>
                          <option value="Improvement">Improvement</option>
                          <option value="Others (specify in others field)">Others (specify in others field)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Building Classification <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.buildingClassification}
                          onChange={(e) => setFormData({ ...formData, buildingClassification: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                        >
                          <option value="">Select Building Classification...</option>
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Mixed-Use">Mixed-Use</option>
                          <option value="Others (specify in others field)">Others (specify in others field)</option>
                        </select>
                      </div>
                    </div>

                    {formData.typeOfApplication === 'Others (specify in others field)' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Other Application Type</label>
                        <input
                          type="text"
                          required
                          placeholder="Specify type of application..."
                          value={formData.otherTypeOfApplication}
                          onChange={(e) => setFormData({ ...formData, otherTypeOfApplication: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ownership Document Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.ownershipDocumentType}
                        onChange={(e) => setFormData({ ...formData, ownershipDocumentType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                      >
                        <option value="">Select Ownership Document Type...</option>
                        <option value="Transfer Certificate of Title (TCT)">Transfer Certificate of Title (TCT)</option>
                        <option value="Tax Declaration">Tax Declaration</option>
                        <option value="Lease Contract">Lease Contract</option>
                        <option value="Others (specify in others field)">Others (specify in others field)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {formData.ownershipDocumentType === 'Others (specify in others field)'
                            ? 'Document Reference Number'
                            : 'Transfer Certificate of Title (TCT) / Tax Declaration Number'}{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TCT-102934 / TD-0912"
                          value={formData.tctNumber}
                          onChange={(e) => setFormData({ ...formData, tctNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Registered Owner Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name of Registered Owner"
                          value={formData.registeredOwnerName}
                          onChange={(e) => setFormData({ ...formData, registeredOwnerName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residency Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.residencySince}
                    onChange={(e) => setFormData({ ...formData, residencySince: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* 3. CLEARANCE ISSUANCE DETAILS */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Clearance Issuance Details
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Community Tax No. (Cedula) <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(0/8)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="e.g. 10294812"
                    value={formData.ctnNumber}
                    onChange={(e) => setFormData({ ...formData, ctnNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Issued At <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.issuedAt}
                      onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Issued On <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.issuedOn}
                      onChange={(e) => setFormData({ ...formData, issuedOn: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      OR Number <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(0/7)</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={7}
                      placeholder="e.g. 9824102"
                      value={formData.orNumber}
                      onChange={(e) => setFormData({ ...formData, orNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      OR Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.orDate}
                      onChange={(e) => setFormData({ ...formData, orDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Until <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* 4. PHOTO & PRINT OPTIONS */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Photo & Print Options
                </div>

                <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/40">
                  {/* 1x1 Photo Box */}
                  {formData.photoPreviewUrl ? (
                    <img
                      src={formData.photoPreviewUrl}
                      alt="Uploaded Photo"
                      className="w-[60px] h-[60px] object-cover border border-slate-300 rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                      <span className="text-[10px] font-bold">1x1</span>
                      <span className="text-[9px] font-medium">PHOTO</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        1x1 Photo (for certificate) <span className="text-rose-500">*</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        This will appear on the certificate. Use a clear 1x1 photo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                        <span>Take Photo</span>
                      </button>

                      <input
                        type="file"
                        accept="image/*"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Upload Photo</span>
                      </button>

                      {formData.photoPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, photoPreviewUrl: null }))}
                          className="text-xs text-rose-600 hover:underline cursor-pointer ml-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Certificate Print Options */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Print on Certificate
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.showPhotoOnCert}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, showPhotoOnCert: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-slate-600 font-medium">Show photo box on certificate</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.showThumbmarkOnCert}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, showThumbmarkOnCert: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-slate-600 font-medium">Show thumbmark box on certificate</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. DYNAMIC REQUIREMENTS VERIFICATION */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Requirements Verification
                </div>

                <div className="space-y-3">
                  {currentRequirements.map((req) => {
                    const isChecked = !!formData.requirementChecks[req.id]
                    const uploadedFile = formData.requirementFiles[req.id]

                    return (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={req.id}
                            checked={isChecked}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                requirementChecks: {
                                  ...prev.requirementChecks,
                                  [req.id]: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0 mt-0.5"
                          />
                          <div>
                            <label htmlFor={req.id} className="text-xs font-bold text-slate-800 cursor-pointer block">
                              {req.label} {req.required && <span className="text-rose-500">*</span>}
                            </label>
                            <p className="text-[11px] text-slate-400">
                              {uploadedFile ? uploadedFile.name : 'Max 2MB, JPEG/PNG/PDF only'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-slate-400" />
                            <span>{uploadedFile ? 'Change File' : 'Upload File'}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    const dataUrl = reader.result as string
                                    setFormData((prev) => ({
                                      ...prev,
                                      requirementChecks: {
                                        ...prev.requirementChecks,
                                        [req.id]: true,
                                      },
                                      requirementFiles: {
                                        ...prev.requirementFiles,
                                        [req.id]: {
                                          name: file.name,
                                          file,
                                          fileData: dataUrl,
                                          fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'PDF',
                                          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                                        },
                                      },
                                    }))
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                          </label>
                          {uploadedFile && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => {
                                  const updatedFiles = { ...prev.requirementFiles }
                                  delete updatedFiles[req.id]
                                  return { ...prev, requirementFiles: updatedFiles }
                                })
                              }
                              className="text-xs text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing Clearance...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Issue Clearance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ── RIGHT COLUMN: RESIDENT SEARCH & VERIFICATION PANEL (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Resident Search Card (relative z-30 without overflow-hidden to allow dropdown to float) */}
            <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs relative z-30">
              <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Resident Search
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Please search for an existing resident record to verify application eligibility.
                </p>

                <SearchSelect
                  label="Search Resident"
                  placeholder="Type resident name to auto-fill..."
                  value={residentSearchQuery}
                  options={residentOptions}
                  emptyMessage={isSearchingResident ? 'Searching active residents...' : 'No matching resident found.'}
                  onChange={setResidentSearchQuery}
                  onSelect={handleResidentSelect}
                  onSearchQueryChange={setResidentSearchQuery}
                />
              </div>
            </section>

            {/* 2. Resident Information Card & Histories (When resident selected) */}
            {selectedResident ? (
              <>
                {/* 2.1 Resident Information Card */}
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Resident Information Card
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Verify basic demographic details
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearResidentSelection}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">FULL NAME</span>
                      <span className="font-bold text-slate-900 mt-1 block leading-snug">{selectedResident.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">AGE / GENDER</span>
                      <span className="font-semibold text-slate-800 mt-1 block">
                        {selectedResident.age ? `${selectedResident.age} yrs` : 'N/A'} / {selectedResident.gender || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">CIVIL STATUS</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{selectedResident.civilStatus || 'Single'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">CONTACT NUMBER</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{selectedResident.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-100/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">COMPLETE ADDRESS</span>
                      <span className="font-semibold text-slate-800 mt-1 block leading-relaxed">
                        {selectedResident.completeAddress || 'Barangay Ugong, Valenzuela City, Metro Manila'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">RESIDENCY DATE</span>
                      <span className="font-bold text-slate-900 mt-1 block">
                        {selectedResident.residencyDate
                          ? new Date(selectedResident.residencyDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 2.2 Issuance History Card */}
                <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                  <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Issuance History
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Record of previous clearances/certificates
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3">Application No.</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedResident.issuanceHistory && selectedResident.issuanceHistory.length > 0 ? (
                          selectedResident.issuanceHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-semibold text-slate-800">{item.certNumber}</td>
                              <td className="px-6 py-3 font-medium text-slate-700">{item.certTitle}</td>
                              <td className="px-6 py-3 text-slate-500">
                                {new Date(item.issuedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'ACTIVE'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.status === 'EXPIRED'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                              No clearance records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2.3 Barangay Case History Card */}
                <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                  <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Barangay Case History
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Incident and blotter registry details
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3 w-[150px] whitespace-nowrap">Case No.</th>
                          <th className="px-5 py-3">Incident / Role</th>
                          <th className="px-5 py-3 w-[140px] whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedResident.caseHistory && selectedResident.caseHistory.length > 0 ? (
                          selectedResident.caseHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap align-top">
                                {item.caseNumber}
                              </td>
                              <td className="px-5 py-3.5 align-top">
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-slate-800 leading-snug block">
                                    {item.incidentNature || 'General Complaint'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      item.role === 'COMPLAINANT'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : item.role === 'RESPONDENT'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {item.role}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 align-top whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'SETTLED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.status === 'PENDING'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {item.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400 font-medium">
                              No case history records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center flex flex-col items-center justify-center min-h-[220px] shadow-xs">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Please search and select a resident to view history and verify details.</p>
              </section>
            )}
          </div>
        </div>

        {/* Global Reusable Feedback Dialog */}
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: SELECT DOCUMENT TYPE (CLEAN 17 CARDS GRID)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Issue Certificate & Clearance"
        description="Select a document type to begin filling out and issuing an official certificate for a resident."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/80">
            <Sparkles size={13} className="text-blue-600" />
            {templates.length} Available Types
          </span>
        }
      />

      {/* 2. Clean Top Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search document type (e.g. Barangay Clearance, Indigency, Good Moral, Building)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Section Header with Counter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Choose Document Type
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {/* 4. Document Cards Grid */}
        {loading && templates.length === 0 ? (
          <div className="flex items-center justify-center bg-white rounded-2xl border border-slate-200/90 py-16 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 py-16 text-center shadow-xs">
            <Search className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No document templates found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => {
              const meta = getTemplateMetadata(template.certTitle)
              const IconComponent = meta.icon

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 cursor-pointer space-y-4 hover:-translate-y-0.5"
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.color} flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors leading-snug">
                      {template.certTitle}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Global Reusable Feedback Dialog */}
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
