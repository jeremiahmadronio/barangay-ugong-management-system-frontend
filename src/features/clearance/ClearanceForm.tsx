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
import { generateClearanceCertificate } from '@/utils/generateClearanceCertificate'
import {
  Search,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Printer,
  Upload,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

type TemplateCategory = 'Clearance' | 'Certification' | 'Permit'

interface TemplateMetadata {
  displayTitle: string
  category: TemplateCategory
  description: string
}

const getTemplateMetadata = (title: string): TemplateMetadata => {
  const upper = (title || '').toUpperCase()

  if (upper.includes('BUILDING')) {
    return {
      displayTitle: 'Building Clearance',
      category: 'Clearance',
      description: 'Permit clearance for residential and commercial building construction',
    }
  }
  if (upper.includes('MORAL')) {
    return {
      displayTitle: 'Certificate of Good Moral Character',
      category: 'Certification',
      description: 'Attestation of good moral standing and conduct in the barangay',
    }
  }
  if (upper.includes('INDIGENCY')) {
    return {
      displayTitle: 'Certificate of Indigency',
      category: 'Certification',
      description: 'Verification of low-income status for financial, medical, and legal assistance',
    }
  }
  if (upper.includes('UTILITY') || upper.includes('ELECTRICAL')) {
    return {
      displayTitle: 'Utility Connection Clearance',
      category: 'Clearance',
      description: 'Clearance endorsement for Meralco & electrical utility installation',
    }
  }
  if (upper.includes('GARAGE') || (upper.includes('EBIKE') && upper.includes('GARAGE'))) {
    return {
      displayTitle: 'E-Bike / E-Trike Garage Certificate',
      category: 'Certification',
      description: 'Certification for private garage parking space & vehicle ownership',
    }
  }
  if (upper.includes('ETRIKE REGISTRATION') || (upper.includes('REGISTRATION') && upper.includes('ETRIKE'))) {
    return {
      displayTitle: 'E-Trike Registration',
      category: 'Permit',
      description: 'Barangay registration and sticker verification for electric tricycles',
    }
  }
  if (upper.includes('BAIL')) {
    return {
      displayTitle: 'Certification for Bail',
      category: 'Certification',
      description: 'Barangay court certificate for bail bond processing and court appearance',
    }
  }
  if (upper.includes('RESIDENCY')) {
    return {
      displayTitle: 'Certificate of Residency',
      category: 'Certification',
      description: 'Official proof of active domicile and residency within the barangay',
    }
  }
  if (upper.includes('DECEASED')) {
    return {
      displayTitle: 'Certification for Deceased',
      category: 'Certification',
      description: 'Certification for deceased residents and burial / funeral assistance',
    }
  }
  if (upper.includes('CONTRACTOR')) {
    return {
      displayTitle: 'Contractor Permit',
      category: 'Permit',
      description: 'Permit authorization for independent construction contractors and workers',
    }
  }
  if (upper.includes('DEMOLITION')) {
    return {
      displayTitle: 'Demolition Clearance',
      category: 'Clearance',
      description: 'Barangay clearance authorizing building demolition and site teardown',
    }
  }
  if (upper.includes('EXCAVATION')) {
    return {
      displayTitle: 'Excavation Clearance',
      category: 'Clearance',
      description: 'Permit authorization for road, ground, and pipeline excavation work',
    }
  }
  if (upper.includes('GUARDIANSHIP')) {
    return {
      displayTitle: 'Certificate of Guardianship',
      category: 'Certification',
      description: 'Legal guardianship verification for minors and legal dependents',
    }
  }
  if (upper.includes('TELEPHONE')) {
    return {
      displayTitle: 'Telephone Connection Permit',
      category: 'Permit',
      description: 'Permit for telephone, telecom, and internet fiber line installations',
    }
  }
  if (upper.includes('TRICYCLE')) {
    return {
      displayTitle: 'Tricycle Franchise Endorsement',
      category: 'Permit',
      description: 'Barangay endorsement for TODA tricycle franchise application',
    }
  }
  if (upper.includes('WATER')) {
    return {
      displayTitle: 'Water Connection Clearance',
      category: 'Clearance',
      description: 'Clearance for Maynilad / Manila Water pipeline and meter connection',
    }
  }

  const isCert = upper.includes('CERT') || upper.includes('INDIGEN') || upper.includes('RESIDEN')
  const isPermit = upper.includes('PERMIT') || upper.includes('FRANCHISE') || upper.includes('REGISTRAT')
  const category: TemplateCategory = isCert ? 'Certification' : isPermit ? 'Permit' : 'Clearance'

  const formatted = title
    ? title
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Barangay Clearance'

  return {
    displayTitle: formatted,
    category,
    description: 'Official barangay clearance for employment, identification, and transactions',
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
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Clearance' | 'Certification' | 'Permit'>('ALL')

  // Resident Search & Profile State
  const [residentSearchQuery, setResidentSearchQuery] = useState('')
  const [residentOptions, setResidentOptions] = useState<SearchSelectOption[]>([])
  const [isSearchingResident, setIsSearchingResident] = useState(false)
  const [selectedResident, setSelectedResident] = useState<ClearanceResidentSearchResponse | null>(null)

  // Resident Histories Pagination (5 items per page)
  const [issuancePage, setIssuancePage] = useState(1)
  const [caseHistoryPage, setCaseHistoryPage] = useState(1)
  const ISSUANCE_PAGE_SIZE = 5
  const CASE_HISTORY_PAGE_SIZE = 5

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

  // Resident lock flag: when a resident is selected, auto-filled personal fields are locked to prevent editing
  const isResidentLocked = !!selectedResident

  // Dynamic calculated age derived from Date of Birth
  const calculatedAge = useMemo(() => {
    if (!formData.dateOfBirth) return null
    const dob = new Date(formData.dateOfBirth)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }, [formData.dateOfBirth])

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

  // Check if all required requirements (those with required: true) are fulfilled (checked or file uploaded)
  const missingRequirements = useMemo(() => {
    return currentRequirements.filter(
      (req) => req.required && !formData.requirementChecks[req.id] && !formData.requirementFiles[req.id]
    )
  }, [currentRequirements, formData.requirementChecks, formData.requirementFiles])

  const areAllRequirementsMet = missingRequirements.length === 0

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
    setIssuancePage(1)
    setCaseHistoryPage(1)

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
    setIssuancePage(1)
    setCaseHistoryPage(1)
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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: templates.length, Clearance: 0, Certification: 0, Permit: 0 }
    templates.forEach((tpl) => {
      const meta = getTemplateMetadata(tpl.certTitle)
      if (meta.category in counts) {
        counts[meta.category]++
      }
    })
    return counts
  }, [templates])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return templates.filter((tpl) => {
      const meta = getTemplateMetadata(tpl.certTitle)
      const matchesSearch =
        !query ||
        tpl.certTitle.toLowerCase().includes(query) ||
        meta.displayTitle.toLowerCase().includes(query) ||
        meta.description.toLowerCase().includes(query)

      const matchesCategory =
        selectedCategory === 'ALL' || meta.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, selectedCategory])

  // Handle Form Submission / Issuance with Audit Logging
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    // Validation: Name fields max 50 chars
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Missing Required Fields',
        description: 'First Name and Last Name are required.',
      })
      return
    }

    if (formData.firstName.trim().length > 50 || formData.lastName.trim().length > 50) {
      showFeedback({
        variant: 'error',
        title: 'Input Limit Exceeded',
        description: 'First Name and Last Name must not exceed 50 characters.',
      })
      return
    }

    if (formData.middleName.trim().length > 50) {
      showFeedback({
        variant: 'error',
        title: 'Input Limit Exceeded',
        description: 'Middle Name must not exceed 50 characters.',
      })
      return
    }

    // Validation: Date of Birth and Age
    if (formData.dateOfBirth) {
      if (calculatedAge === null || calculatedAge < 0) {
        showFeedback({
          variant: 'error',
          title: 'Invalid Date of Birth',
          description: 'Date of birth cannot be in the future.',
        })
        return
      }
      if (calculatedAge > 125) {
        showFeedback({
          variant: 'error',
          title: 'Invalid Age',
          description: 'Age exceeds 125 years. Please verify the date of birth.',
        })
        return
      }
    }

    // Validation: All required requirements (with red asterisk) must be verified or uploaded
    if (!areAllRequirementsMet) {
      showFeedback({
        variant: 'error',
        title: 'Missing Required Requirements',
        description: `Please verify or upload the following required documents before issuing: ${missingRequirements
          .map((r) => r.label)
          .join(', ')}.`,
      })
      return
    }

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

      // Automatic Direct Print & Download Certificate Locally
      try {
        const fullAddress =
          [
            formData.houseNumber,
            formData.street,
            formData.purok,
            formData.barangay,
            formData.city,
            formData.province,
          ]
            .filter(Boolean)
            .join(', ') ||
          selectedResident?.completeAddress ||
          'Barangay Ugong, Valenzuela City'

        await generateClearanceCertificate({
          certTitle: selectedTemplate.certTitle,
          fullName: fullName || selectedResident?.fullName || 'Resident Applicant',
          address: fullAddress,
          birthDate:
            formData.dateOfBirth ||
            (selectedResident?.birthDate ? String(selectedResident.birthDate) : ''),
          birthPlace: formData.placeOfBirth || selectedResident?.placeOfBirth || 'Valenzuela City',
          purpose:
            formData.customPurpose ||
            formData.purpose ||
            'Employment / Identification Requirement',
          residencySince: formData.residencySince || selectedResident?.residencyDate || '',
          clearanceNo: res.certificateNumber,
          ctcNo: formData.ctnNumber,
          issuedAt: formData.issuedAt || 'Barangay Ugong, Valenzuela City',
          issuedOn: formData.issuedOn || new Date().toISOString().split('T')[0],
          orNo: formData.orNumber,
          orDate: formData.orDate || new Date().toISOString().split('T')[0],
          validUntil: formData.validUntil,
          photoBase64: formData.photoPreviewUrl || selectedResident?.photoBase64,
          hasOngoingCase: Boolean(
            selectedResident?.caseHistory && selectedResident.caseHistory.length > 0
          ),
          showPhotoOnCert: formData.showPhotoOnCert,
          showThumbmarkOnCert: formData.showThumbmarkOnCert,
        })
      } catch (printErr) {
        console.error('Auto-print clearance certificate error:', printErr)
      }

      showFeedback({
        variant: 'success',
        title: 'Clearance Issued Successfully',
        description: `${selectedTemplate.certTitle} (Cert No: ${res.certificateNumber}) has been officially issued, automatically downloaded to your device, and prepared for direct printing for ${fullName || selectedResident?.fullName || 'Resident'}.`,
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
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {getTemplateMetadata(selectedTemplate.certTitle).category}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    {getTemplateMetadata(selectedTemplate.certTitle).displayTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.firstName || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={isResidentLocked}
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Middle Name</label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.middleName || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      maxLength={50}
                      disabled={isResidentLocked}
                      placeholder="Middle Name"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.lastName || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={isResidentLocked}
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Suffix</label>
                    <select
                      value={formData.suffix}
                      disabled={isResidentLocked}
                      onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          House No. / Unit / Building No. <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-normal">{(formData.houseNumber || '').length}/50</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        disabled={isResidentLocked}
                        placeholder="e.g. 12A / Unit 3B"
                        value={formData.houseNumber}
                        onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Street Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-normal">{(formData.street || '').length}/50</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        disabled={isResidentLocked}
                        placeholder="e.g. F. Legaspi Street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Subdivision / Phase / Purok <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.purok || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={isResidentLocked}
                      placeholder="e.g. Purok 3 / Phase 2"
                      value={formData.purok}
                      onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      {calculatedAge !== null && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            calculatedAge < 0 || calculatedAge > 125
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {calculatedAge < 0
                            ? 'Invalid (Future Date)'
                            : calculatedAge > 125
                            ? 'Invalid Age'
                            : `Age: ${calculatedAge} yrs old`}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      required
                      max={getTodayIsoDate()}
                      min="1900-01-01"
                      disabled={isResidentLocked}
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Place of Birth <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.placeOfBirth || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={isResidentLocked}
                      placeholder="City / Municipality"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Other Purpose</label>
                            <span className="text-xs text-slate-400 font-normal">{(formData.customPurpose || '').length}/50</span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={50}
                            placeholder="State other purpose..."
                            value={formData.customPurpose}
                            onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Other Purpose</label>
                            <span className="text-xs text-slate-400 font-normal">{(formData.customPurpose || '').length}/50</span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={50}
                            placeholder="State other purpose..."
                            value={formData.customPurpose}
                            onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">Other Purpose</label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.customPurpose || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Please specify custom purpose..."
                          value={formData.customPurpose}
                          onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Defendant Name <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.defendantName || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Defendant Full Name"
                          value={formData.defendantName}
                          onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Case Details / Court Ref <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.caseDetails || '').length}/100</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="e.g. Criminal Case No. 12345"
                          value={formData.caseDetails}
                          onChange={(e) => setFormData({ ...formData, caseDetails: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Deceased Full Name <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.deceasedName || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Full Name of Deceased"
                          value={formData.deceasedName}
                          onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Brand / Model <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.vehicleBrand || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="e.g. Nwow / Hatasu"
                          value={formData.vehicleBrand}
                          onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Body Color <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.bodyColor || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="e.g. Red / White"
                          value={formData.bodyColor}
                          onChange={(e) => setFormData({ ...formData, bodyColor: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Motor Number <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.motorNumber || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Motor / Engine No."
                          value={formData.motorNumber}
                          onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Chassis Number <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.chassisNumber || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Chassis / VIN No."
                          value={formData.chassisNumber}
                          onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">Specify Purpose</label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.customPurpose || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="State specific purpose..."
                          value={formData.customPurpose}
                          onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Property/Lot Address <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-normal">{(formData.propertyAddress || '').length}/100</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Complete property / construction lot address"
                        value={formData.propertyAddress}
                        onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">Other Application Type</label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.otherTypeOfApplication || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Specify type of application..."
                          value={formData.otherTypeOfApplication}
                          onChange={(e) => setFormData({ ...formData, otherTypeOfApplication: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {formData.ownershipDocumentType === 'Others (specify in others field)'
                              ? 'Document Reference Number'
                              : 'Transfer Certificate of Title (TCT) / Tax Declaration Number'}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.tctNumber || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="e.g. TCT-102934 / TD-0912"
                          value={formData.tctNumber}
                          onChange={(e) => setFormData({ ...formData, tctNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Registered Owner Name <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs text-slate-400 font-normal">{(formData.registeredOwnerName || '').length}/50</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="Full Name of Registered Owner"
                          value={formData.registeredOwnerName}
                          onChange={(e) => setFormData({ ...formData, registeredOwnerName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Community Tax No. (Cedula) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-normal">{(formData.ctnNumber || '').length}/8</span>
                  </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Issued At <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.issuedAt || '').length}/50</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={formData.issuedAt}
                      onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        OR Number <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(formData.orNumber || '').length}/7</span>
                    </div>
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
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Requirements Verification
                  </div>
                  {currentRequirements.some((r) => r.required) && (
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border transition-colors ${
                        areAllRequirementsMet
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {areAllRequirementsMet
                        ? 'All Required Verified'
                        : `${missingRequirements.length} Required Pending`}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {currentRequirements.map((req) => {
                    const isChecked = !!formData.requirementChecks[req.id]
                    const uploadedFile = formData.requirementFiles[req.id]

                    return (
                      <div
                        key={req.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-xl transition-colors ${
                          isChecked || uploadedFile
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : req.required
                            ? 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                        }`}
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
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
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
                  disabled={isSubmitting || !areAllRequirementsMet}
                  title={
                    !areAllRequirementsMet
                      ? `Please verify all required requirements (${missingRequirements.map((r) => r.label).join(', ')})`
                      : 'Issue Clearance'
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* 2.2 Issuance History Card (Paginated 5 per page) */}
                {(() => {
                  const totalIssuanceItems = selectedResident.issuanceHistory?.length || 0
                  const totalIssuancePages = Math.max(1, Math.ceil(totalIssuanceItems / ISSUANCE_PAGE_SIZE))
                  const currentIssuancePage = Math.min(issuancePage, totalIssuancePages)
                  const paginatedIssuance = (selectedResident.issuanceHistory || []).slice(
                    (currentIssuancePage - 1) * ISSUANCE_PAGE_SIZE,
                    currentIssuancePage * ISSUANCE_PAGE_SIZE
                  )

                  return (
                    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                      <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            Issuance History
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Record of previous clearances/certificates
                          </p>
                        </div>
                        {totalIssuanceItems > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {totalIssuanceItems} total
                          </span>
                        )}
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
                            {paginatedIssuance && paginatedIssuance.length > 0 ? (
                              paginatedIssuance.map((item, idx) => (
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
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        item.status === 'ACTIVE'
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

                      {totalIssuancePages > 1 && (
                        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
                          <span>
                            Showing {(currentIssuancePage - 1) * ISSUANCE_PAGE_SIZE + 1}–{Math.min(currentIssuancePage * ISSUANCE_PAGE_SIZE, totalIssuanceItems)} of {totalIssuanceItems}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={currentIssuancePage <= 1}
                              onClick={() => setIssuancePage((p) => Math.max(1, p - 1))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Prev</span>
                            </button>
                            <span className="px-2 font-semibold text-slate-700">
                              {currentIssuancePage} / {totalIssuancePages}
                            </span>
                            <button
                              type="button"
                              disabled={currentIssuancePage >= totalIssuancePages}
                              onClick={() => setIssuancePage((p) => Math.min(totalIssuancePages, p + 1))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </section>
                  )
                })()}

                {/* 2.3 Barangay Case History Card (Paginated 5 per page) */}
                {(() => {
                  const totalCaseItems = selectedResident.caseHistory?.length || 0
                  const totalCasePages = Math.max(1, Math.ceil(totalCaseItems / CASE_HISTORY_PAGE_SIZE))
                  const currentCasePage = Math.min(caseHistoryPage, totalCasePages)
                  const paginatedCaseHistory = (selectedResident.caseHistory || []).slice(
                    (currentCasePage - 1) * CASE_HISTORY_PAGE_SIZE,
                    currentCasePage * CASE_HISTORY_PAGE_SIZE
                  )

                  return (
                    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                      <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            Barangay Case History
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Incident and blotter registry details
                          </p>
                        </div>
                        {totalCaseItems > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {totalCaseItems} total
                          </span>
                        )}
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
                            {paginatedCaseHistory && paginatedCaseHistory.length > 0 ? (
                              paginatedCaseHistory.map((item, idx) => (
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

                      {totalCasePages > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
                          <span>
                            Showing {(currentCasePage - 1) * CASE_HISTORY_PAGE_SIZE + 1}–{Math.min(currentCasePage * CASE_HISTORY_PAGE_SIZE, totalCaseItems)} of {totalCaseItems}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={currentCasePage <= 1}
                              onClick={() => setCaseHistoryPage((p) => Math.max(1, p - 1))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Prev</span>
                            </button>
                            <span className="px-2 font-semibold text-slate-700">
                              {currentCasePage} / {totalCasePages}
                            </span>
                            <button
                              type="button"
                              disabled={currentCasePage >= totalCasePages}
                              onClick={() => setCaseHistoryPage((p) => Math.min(totalCasePages, p + 1))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </section>
                  )
                })()}
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
      />

      {/* 2. Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search document type (e.g. Barangay Clearance, Indigency, Good Moral, Building)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs transition-colors"
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

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'ALL', label: 'All Documents' },
              { key: 'Clearance', label: 'Clearances' },
              { key: 'Certification', label: 'Certifications' },
              { key: 'Permit', label: 'Permits & Endorsements' },
            ] as const
          ).map((tab) => {
            const active = selectedCategory === tab.key
            const count = categoryCounts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Section Header with Counter */}
      <div className="space-y-3 pt-1">
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
          <div className="flex items-center justify-center bg-white rounded-xl border border-slate-200/90 py-16 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 py-16 text-center shadow-xs">
            <Search className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No document templates found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => {
              const meta = getTemplateMetadata(template.certTitle)

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 hover:border-blue-400/80 hover:shadow-xs transition-all duration-150 cursor-pointer text-left space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {meta.category}
                      </span>
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {meta.displayTitle}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-normal line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
                    <span>Issue document</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" />
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
