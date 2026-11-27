import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  SearchSelect,
  type SearchSelectOption,
} from '@/components/ui/SearchSelect'
import { Badge } from '@/components/ui/table/Badge'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type { FtjsResidentSearchResponse } from '@/config/api/ftjs/ftjs.types'
import { residentService } from '@/config/api/residents/residents.service'
import { userService } from '@/config/api/users/users.service'
import { useAuth } from '@/hooks/useAuth'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { generateFtjsCertificate } from './generateFtjsCertificate'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  UserCheck,
  X,
} from 'lucide-react'

// Dynamic grade / year level options map based on Educational Attainment
const GRADE_LEVEL_OPTIONS: Record<string, string[]> = {
  Elementary: [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Elementary Graduate',
  ],
  'High School': [
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Junior High Graduate',
  ],
  'Senior High School': [
    'Grade 11',
    'Grade 12',
    'Senior High Graduate',
  ],
  Vocational: [
    'NC I Candidate',
    'NC II Certificate Holder',
    'NC III / Advanced Skills',
    'Short Course Certificate',
    'Vocational Graduate',
  ],
  'College Undergraduate': [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
  ],
  'College Graduate': [
    'Bachelor Degree Holder',
    'College Graduate',
  ],
  'Post Graduate': [
    'Masteral Candidate',
    'Master Degree Holder',
    'Doctorate Candidate',
    'Doctorate Degree Holder',
  ],
}

// Convert File object to clean Base64 string for Jackson byte[] compatibility
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Str = reader.result.includes(',')
          ? reader.result.split(',')[1]
          : reader.result
        resolve(base64Str)
      } else {
        resolve('')
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export function IssuanceForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hasPermission, isLoading: isPermLoading } = useUserPermissions()
  const { showFeedback, feedbackDialogProps } = useDialogs()
  const [step, setStep] = useState<'search' | 'form'>('search')

  // Step 1: Search & Selected Resident State
  const [searchValue, setSearchValue] = useState('')
  const [options, setOptions] = useState<SearchSelectOption[]>([])
  const [selectedResident, setSelectedResident] = useState<FtjsResidentSearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Step 2: Application Entry Form State (Auto-filled)
  const [applicationNo, setApplicationNo] = useState('')
  const [applicationDate, setApplicationDate] = useState('')
  const [releasedBy, setReleasedBy] = useState('')

  // Personal Information Fields (Auto-filled & Read-only)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [suffix, setSuffix] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [age, setAge] = useState<number | string>('')
  const [gender, setGender] = useState('Female')
  const [civilStatus, setCivilStatus] = useState('Single')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [residencyDate, setResidencyDate] = useState('')
  const [completeAddress, setCompleteAddress] = useState('')

  // Purpose & Details
  const [purpose, setPurpose] = useState('First Time Jobseeker Requirement')
  const [customPurpose, setCustomPurpose] = useState('')

  // Educational Background & Requirements
  const [educationalAttainment, setEducationalAttainment] = useState('Elementary')
  const [gradeLevel, setGradeLevel] = useState('Grade 1')
  const [institution, setInstitution] = useState('')

  // Uploaded Files & Checklist State
  const [hasValidId, setHasValidId] = useState(false)
  const [validIdFile, setValidIdFile] = useState<File | null>(null)
  const [hasOath, setHasOath] = useState(false)
  const [oathFile, setOathFile] = useState<File | null>(null)
  const [docValidationError, setDocValidationError] = useState<string | null>(null)

  // Hidden File Inputs Refs
  const validIdRef = useRef<HTMLInputElement>(null)
  const oathRef = useRef<HTMLInputElement>(null)

  // Modal / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Exclude soft-deleted and permanently-deleted applications from Issuance History and Duplicate Blocking
  const activeIssuanceHistories = useMemo(() => {
    if (!selectedResident?.issuanceHistories) return []
    return selectedResident.issuanceHistories.filter((hist) => {
      const s = String(hist.status || '').toUpperCase()
      return s !== 'PERMANENTLY_DELETED' && s !== 'SOFT_DELETED' && s !== 'DELETED'
    })
  }, [selectedResident?.issuanceHistories])

  const isBlockedDuplicate = useMemo(() => {
    if (!selectedResident?.hasAvailedFtjs) return false
    if (selectedResident.issuanceHistories && selectedResident.issuanceHistories.length > 0) {
      return activeIssuanceHistories.length > 0
    }
    return true
  }, [selectedResident?.hasAvailedFtjs, selectedResident?.issuanceHistories, activeIssuanceHistories])

  // Helper to resolve full name of the logged-in user
  const getLoggedInUserFullName = useCallback((): string => {
    if (user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`.trim()
      }
      if (user.name && user.name !== 'User' && user.name !== 'systemadmin' && user.name !== 'Barangay Official') {
        return user.name
      }
    }

    try {
      const stored = sessionStorage.getItem('user_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.firstName && parsed.lastName) {
          return `${parsed.firstName} ${parsed.lastName}`.trim()
        }
        if (parsed.name && parsed.name !== 'User' && parsed.name !== 'systemadmin' && parsed.name !== 'Barangay Official') {
          return parsed.name
        }
      }
    } catch {
      // ignore
    }

    return 'Jeremiah Madronio'
  }, [user])

  // Dynamic Grade level options list based on selected Educational Attainment
  const currentGradeOptions = useMemo(() => {
    return GRADE_LEVEL_OPTIONS[educationalAttainment] || [
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
      'Elementary Graduate',
    ]
  }, [educationalAttainment])

  // Reset gradeLevel whenever educationalAttainment changes
  const handleEducationalAttainmentChange = (newAttainment: string) => {
    setEducationalAttainment(newAttainment)
    const availableGrades = GRADE_LEVEL_OPTIONS[newAttainment]
    if (availableGrades && availableGrades.length > 0) {
      setGradeLevel(availableGrades[0])
    }
  }

  // Dynamic resident search powered by backend Spring Boot API
  const handleSearchQueryChange = useCallback(async (query: string) => {
    setIsSearching(true)
    const searchTerm = query.trim()
    try {
      let results: FtjsResidentSearchResponse[] = []
      try {
        results = await ftjsService.searchResidents(searchTerm)
      } catch (err) {
        console.warn('ftjsService.searchResidents call failed, using fallback:', err)
      }

      // Fallback: If FTJS search endpoint returned empty or errored out, fetch via resident table endpoint
      if (!results || results.length === 0) {
        const tableResidents = await residentService.getResidentsTable({ search: searchTerm })
        results = tableResidents.map((tr) => ({
          residentId: typeof tr.id === 'number' ? tr.id : Number(tr.id),
          fullName: tr.fullName,
          age: tr.age || null,
          gender: tr.gender || null,
          civilStatus: tr.civilStatus || null,
          contactNumber: tr.contactNumber || null,
          completeAddress: tr.completeAddress || tr.address || null,
          residencyDate: tr.createdAt || null,
          hasAvailedFtjs: false,
          priorTrackingNumber: null,
          priorDateSubmitted: null,
          issuanceHistories: [],
          caseHistoryList: [],
        }))
      }

      const formattedOptions: SearchSelectOption[] = results.map((r) => ({
        id: String(r.residentId),
        label: r.fullName,
        description: `${r.completeAddress || 'Brgy. Ugong'} • ${r.age ? `${r.age} yrs` : ''} ${r.gender || ''}`,
        data: r,
      }))
      setOptions(formattedOptions)
    } catch (err) {
      console.error('Failed to search residents for FTJS:', err)
      setOptions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Load initial list of active residents on mount
  useEffect(() => {
    handleSearchQueryChange('')
  }, [handleSearchQueryChange])

  const handleSelectOption = (option: SearchSelectOption) => {
    if (option.data) {
      setSelectedResident(option.data as FtjsResidentSearchResponse)
      setSearchValue(option.label)
    }
  }

  const handleClearSelection = () => {
    setSelectedResident(null)
    setSearchValue('')
    setOptions([])
  }

  // Handle Transition from Search Step to Application Entry Form Step
  const handleProceedToApplication = async () => {
    if (!selectedResident) return

    // Generate Auto Application Number & Metadata
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000))
    const autoAppNo = `2026-FTJS-${randomSeq}`
    setApplicationNo(autoAppNo)
    setApplicationDate(formatDateTime(new Date().toISOString()))

    // Fetch / Determine Full Name of Logged-In Officer for "Released By"
    let officerFullName = getLoggedInUserFullName()
    if (user?.id) {
      try {
        const userDetail = await userService.getUserDetail(user.id)
        if (userDetail.personInfo?.fullName) {
          officerFullName = userDetail.personInfo.fullName
        } else if (userDetail.personInfo?.firstName && userDetail.personInfo?.lastName) {
          officerFullName = `${userDetail.personInfo.firstName} ${userDetail.personInfo.lastName}`.trim()
        }
      } catch (err) {
        console.warn('Could not fetch logged-in user details from API:', err)
      }
    }
    setReleasedBy(officerFullName)

    setIsLoadingDetail(true)
    try {
      // Attempt to fetch rich person profile details from resident API
      const detail = await residentService.getResidentDetail(selectedResident.residentId)
      const p = detail.personInfo || {}

      setLastName(p.lastName || selectedResident.fullName.split(' ').pop() || '')
      setFirstName(p.firstName || selectedResident.fullName.split(' ')[0] || '')
      setMiddleName(p.middleName || '')
      setSuffix(p.suffix || '')
      setBirthDate(p.birthDate || '')
      setAge(p.age || selectedResident.age || '')
      setGender(p.gender || selectedResident.gender || 'Female')
      setCivilStatus(p.civilStatus || selectedResident.civilStatus || 'Single')
      setContactNumber(p.contactNumber || selectedResident.contactNumber || '')
      setEmail(p.email || p.emailAddress || (detail as any).email || (selectedResident as any).email || '')
      setResidencyDate(detail.dateOfResidency || selectedResident.residencyDate || '')
      setCompleteAddress(p.completeAddress || selectedResident.completeAddress || '')

      const defaultEdu = detail.educationalAttainment || 'Elementary'
      setEducationalAttainment(defaultEdu)
      const defaultGrades = GRADE_LEVEL_OPTIONS[defaultEdu]
      if (defaultGrades && defaultGrades.length > 0) {
        setGradeLevel(defaultGrades[0])
      }
    } catch {
      // Fallback: Populate directly from search response
      const nameParts = selectedResident.fullName.trim().split(' ')
      setFirstName(nameParts[0] || '')
      setLastName(nameParts.length > 1 ? nameParts[nameParts.length - 1] : '')
      setMiddleName(nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '')
      setAge(selectedResident.age || '')
      setGender(selectedResident.gender || 'Female')
      setCivilStatus(selectedResident.civilStatus || 'Single')
      setContactNumber(selectedResident.contactNumber || '')
      setEmail((selectedResident as any).email || '')
      setCompleteAddress(selectedResident.completeAddress || '')
      setResidencyDate(selectedResident.residencyDate || '')
    } finally {
      setIsLoadingDetail(false)
      setStep('form')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle Valid ID file select with size and type limits
  const handleValidIdFileSelect = (file: File | null) => {
    if (!file) {
      setValidIdFile(null)
      return
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setDocValidationError('Invalid file format. Please upload a PDF or Image (JPG, PNG, WEBP).')
      showFeedback({
        variant: 'error',
        title: 'Invalid File Format',
        description: 'Only PDF documents and image files (JPG, PNG, WEBP) are supported.',
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocValidationError('Valid ID file exceeds the 5MB limit.')
      showFeedback({
        variant: 'error',
        title: 'File Too Large',
        description: 'Valid ID file exceeds the 5MB limit. Please select a smaller file.',
      })
      return
    }
    setValidIdFile(file)
    setHasValidId(true)
    setDocValidationError(null)
  }

  // Handle Oath of Undertaking file select with size and type limits
  const handleOathFileSelect = (file: File | null) => {
    if (!file) {
      setOathFile(null)
      return
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setDocValidationError('Invalid file format. Please upload a PDF or Image (JPG, PNG, WEBP).')
      showFeedback({
        variant: 'error',
        title: 'Invalid File Format',
        description: 'Only PDF documents and image files (JPG, PNG, WEBP) are supported.',
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocValidationError('Oath of Undertaking file exceeds the 5MB limit.')
      showFeedback({
        variant: 'error',
        title: 'File Too Large',
        description: 'Oath of Undertaking file exceeds the 5MB limit. Please select a smaller file.',
      })
      return
    }
    setOathFile(file)
    setHasOath(true)
    setDocValidationError(null)
  }

  // Handle Application Submit to Backend Spring Boot API
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResident) return

    // 1. Validation: Blocked duplicate application
    if (isBlockedDuplicate) {
      showFeedback({
        variant: 'error',
        title: 'Duplicate Application Blocked',
        description:
          'This resident has already availed of the First-Time Jobseeker benefit (RA 11261). Re-issuance as a new application is not permitted.',
      })
      return
    }

    // 2. Validation: Purpose of Request
    if (purpose === 'Other') {
      const trimmedPurpose = customPurpose.trim()
      if (!trimmedPurpose) {
        showFeedback({
          variant: 'error',
          title: 'Missing Required Field',
          description: 'Please specify the custom purpose of request.',
        })
        return
      }
      if (trimmedPurpose.length > 100) {
        showFeedback({
          variant: 'error',
          title: 'Input Limit Exceeded',
          description: 'Custom purpose must not exceed 100 characters.',
        })
        return
      }
    }

    // 3. Validation: Institution name limit
    if (institution.trim().length > 100) {
      showFeedback({
        variant: 'error',
        title: 'Input Limit Exceeded',
        description: 'Institution name must not exceed 100 characters.',
      })
      return
    }

    // 4. Validation: Email Address format & length
    if (email.trim()) {
      if (email.trim().length > 100) {
        showFeedback({
          variant: 'error',
          title: 'Input Limit Exceeded',
          description: 'Email address must not exceed 100 characters.',
        })
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        showFeedback({
          variant: 'error',
          title: 'Invalid Email Address',
          description: 'Please provide a valid email format (e.g., resident@example.com).',
        })
        return
      }
    }

    // 5. Validation: Uploaded files size check (max 5MB)
    if (validIdFile && validIdFile.size > 5 * 1024 * 1024) {
      showFeedback({
        variant: 'error',
        title: 'File Size Limit Exceeded',
        description: 'Valid ID file size exceeds the 5MB limit. Please upload a smaller file.',
      })
      return
    }
    if (oathFile && oathFile.size > 5 * 1024 * 1024) {
      showFeedback({
        variant: 'error',
        title: 'File Size Limit Exceeded',
        description: 'Oath of Undertaking file size exceeds the 5MB limit. Please upload a smaller file.',
      })
      return
    }

    // Open print window synchronously during user gesture so it is never blocked by browser pop-up blocker
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preparing First-Time Jobseeker Certificate...</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f8fafc;
                color: #334155;
              }
              .spinner {
                width: 42px;
                height: 42px;
                border: 3.5px solid #e2e8f0;
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h2 { font-size: 16px; margin: 0 0 6px 0; font-weight: 700; color: #0f172a; }
              p { font-size: 13px; margin: 0; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Processing FTJS Certificate</h2>
            <p>Please wait while your official certificate is being generated...</p>
          </body>
        </html>
      `)
    }

    setDocValidationError(null)
    setIsSubmitting(true)
    try {
      let validIdBase64: string | null = null
      let oathBase64: string | null = null

      if (validIdFile) {
        validIdBase64 = await fileToBase64(validIdFile)
      }
      if (oathFile) {
        oathBase64 = await fileToBase64(oathFile)
      }

      // Format LocalDateTime as ISO-8601 string without Z suffix (e.g. YYYY-MM-DDTHH:mm:ss)
      const nowIsoZoneless = new Date().toISOString().slice(0, 19)

      const payload = {
        residentId: selectedResident.residentId,
        ftjsNumber: applicationNo,
        dateFiled: nowIsoZoneless,
        releasedBy: releasedBy,
        purpose: purpose === 'Other' ? customPurpose : purpose,
        educationalAttainment: educationalAttainment,
        gradeLevel: gradeLevel,
        institution: institution,
        validId: validIdBase64,
        oathTaking: oathBase64,
      }

      await ftjsService.createEntry(payload)

      // Automatic Direct Print & Download Certificate
      try {
        await generateFtjsCertificate(
          {
            fullName: selectedResident.fullName || `${firstName} ${lastName}`.trim(),
            address: completeAddress || selectedResident.completeAddress || '3S Center Barangay Ugong, Valenzuela City',
            purpose: purpose === 'Other' ? customPurpose : purpose,
            dateIssued: new Date(),
            age: Number(age) || selectedResident.age || null,
          },
          printWindow
        )
      } catch (printErr) {
        console.error('Auto-print certificate error:', printErr)
        if (printWindow && !printWindow.closed) {
          printWindow.close()
        }
      }

      showFeedback({
        variant: 'success',
        title: 'Application Submitted Successfully',
        description: `The First-Time Jobseeker application (${applicationNo}) for ${selectedResident.fullName || `${firstName} ${lastName}`.trim()} has been processed, recorded, and automatically downloaded.`,
        actionLabel: 'Done',
      })

      handleResetForm()
    } catch (err: unknown) {
      if (printWindow && !printWindow.closed) {
        printWindow.close()
      }
      console.error('Failed to submit FTJS application to backend:', err)
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          .response?.data?.message ||
        (err as Error).message ||
        'Failed to connect to backend server.'
      showFeedback({
        variant: 'error',
        title: 'Application Submission Failed',
        description: errorMsg,
        actionLabel: 'Close',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setStep('search')
    setSelectedResident(null)
    setSearchValue('')
    setOptions([])
    setPurpose('First Time Jobseeker Requirement')
    setCustomPurpose('')
    setHasValidId(false)
    setValidIdFile(null)
    setHasOath(false)
    setOathFile(null)
    setDocValidationError(null)
    // Re-fetch fresh resident list from backend so updated issuance history is reflected
    handleSearchQueryChange('')
  }

  if (isPermLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasPermission('Issue FTJS')) {
    return (
      <div className="py-12 flex justify-center">
        <PermissionDeniedPage
          title="You don't have permission to issue FTJS certificates!"
          message="The owner of the workspace has not given you permission to issue First-Time Jobseeker certificates. Please contact the administrator."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* ─────────────────────────────────────────────────────────────────
          STEP 1: RESIDENT SEARCH & ELIGIBILITY VERIFICATION
      ─────────────────────────────────────────────────────────────────── */}
      {step === 'search' && (
        <>
          {/* Page Title */}
          <PageHeader
            title="FTJS Issuance & Eligibility Entry"
            description="Verify resident qualification and process First-Time Jobseeker certification under RA 11261."
          />

          {/* 1. Search Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs relative z-20">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Application Entry - Resident Search
              </h2>
              <button
                type="button"
                onClick={() => navigate('/residents')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck size={14} />
                Resident Directory
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Please search for an existing resident record to verify application eligibility.
              </p>
              <SearchSelect
                label="Search Resident Name"
                placeholder="Search resident name..."
                value={searchValue}
                options={options}
                emptyMessage={isSearching ? 'Searching active residents...' : 'No matching active resident found.'}
                onChange={setSearchValue}
                onSelect={handleSelectOption}
                onSearchQueryChange={handleSearchQueryChange}
              />
            </div>
          </section>

          {/* 2. Selected Resident Information Card */}
          {selectedResident && (
            <>
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Resident Information Card
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Verify basic demographic details
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    Clear Selection
                  </button>
                </div>

                {/* Demographics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FULL NAME</dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900">{selectedResident.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AGE / GENDER</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedResident.age ? `${selectedResident.age} yrs` : '—'} / {selectedResident.gender || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CIVIL STATUS</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">{selectedResident.civilStatus || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CONTACT NUMBER</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">{selectedResident.contactNumber || '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">COMPLETE ADDRESS</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-700">{selectedResident.completeAddress || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RESIDENCY DATE</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-700">{formatDate(selectedResident.residencyDate)}</dd>
                  </div>
                </div>

                {/* Duplicate Check Alert Banner */}
                {isBlockedDuplicate ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex items-start gap-3 text-rose-900">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h3 className="font-bold text-rose-900 text-sm">Duplicate Application Blocked</h3>
                      <p className="text-rose-700 leading-relaxed">
                        This resident has already availed of the FTJS certificate benefit ({selectedResident.priorTrackingNumber || 'prior record'}, issued on {formatDate(selectedResident.priorDateSubmitted)}). Under RA 11261, this benefit can only be claimed once and cannot be reissued as a new application.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3 text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h3 className="font-bold text-emerald-900 text-sm">Eligible for FTJS Certification</h3>
                      <p className="text-emerald-700 leading-relaxed">
                        This resident is verified and eligible to apply for First-Time Jobseeker (FTJS) certification under RA 11261.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. History Cards Stacked Full Width */}
              <div className="flex flex-col gap-6">
                {/* 1. Barangay Case History */}
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Barangay Case History</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Incident and blotter registry details
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Case No.</th>
                          <th className="px-4 py-2.5">Incident / Nature of Complaint</th>
                          <th className="px-4 py-2.5">Role</th>
                          <th className="px-4 py-2.5">Date Filed</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedResident.caseHistoryList && selectedResident.caseHistoryList.length > 0 ? (
                          selectedResident.caseHistoryList.map((ch, idx) => {
                            const caseNum = ch.caseNumber || (ch as any).caseNo || '—'
                            const nature = ch.natureOfComplaint || (ch as any).incidentType || 'General Incident'
                            const cleanRole = ch.role
                              ? ch.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                              : '—'
                            const rawStatus = (ch.status || '').toUpperCase()
                            const statusTone =
                              rawStatus === 'SETTLED' || rawStatus === 'RESOLVED'
                                ? 'emerald'
                                : rawStatus === 'CERTIFIED_TO_FILE_ACTION' || rawStatus === 'CFA_ISSUED'
                                ? 'rose'
                                : rawStatus === 'PENDING' || rawStatus === 'ACTIVE' || rawStatus === 'RECORDED' || rawStatus === 'UNDER_CONCILIATION'
                                ? 'amber'
                                : 'slate'

                            const cleanStatusLabel = ch.status
                              ? ch.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                              : '—'

                            return (
                              <tr key={`${caseNum}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{caseNum}</td>
                                <td className="px-4 py-3 text-slate-800 font-medium">{nature}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                    {cleanRole}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(ch.dateFiled)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge tone={statusTone}>{cleanStatusLabel}</Badge>
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                              No case history records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2. Issuance History */}
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Issuance History</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Record of previous First-Time Jobseeker certifications
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Application No.</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeIssuanceHistories && activeIssuanceHistories.length > 0 ? (
                          activeIssuanceHistories.map((hist, idx) => {
                            const cleanStatus = hist.status
                              ? hist.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                              : 'Already Issued'
                            return (
                              <tr key={`${hist.ftjsNumber}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{hist.ftjsNumber}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(hist.issuedAt)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge tone="emerald">{cleanStatus}</Badge>
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                              No previous FTJS issuance records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* 4. Action Buttons Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  disabled={isBlockedDuplicate || isLoadingDetail}
                  onClick={handleProceedToApplication}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 ${
                    isBlockedDuplicate || isLoadingDetail
                      ? 'bg-slate-300 cursor-not-allowed opacity-70'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer'
                  }`}
                >
                  {isLoadingDetail ? (
                    <>Fetching Resident Profile...</>
                  ) : (
                    <>
                      Proceed to Application
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 2: RESIDENT APPLICATION ENTRY FORM (ENCODING VIEW)
      ─────────────────────────────────────────────────────────────────── */}
      {step === 'form' && selectedResident && (
        <form onSubmit={handleSubmitApplication} className="space-y-6">
          {/* Top Navigation Header */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Resident Application Entry
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Encoding for applicant: <span className="font-semibold text-blue-600">{selectedResident.fullName}</span>
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Badge tone="emerald">
                <UserCheck size={13} className="inline mr-1" />
                Selected Resident Verified
              </Badge>
            </div>
          </div>

          {/* Section A: Application Details (Clean & Sleek) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Application Details
              </h2>
            </div>
            <div className="p-6">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">APPLICATION NO.</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-blue-600 tracking-tight">{applicationNo}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">Auto</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">DATE APPLICATION</span>
                  <span className="text-sm font-bold text-slate-800 block">{applicationDate}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">RELEASED BY</span>
                  <span className="text-sm font-bold text-slate-800 block">{releasedBy}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Personal Information (Auto-Filled & Locked / Read-Only) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Personal Information
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Notice Banner */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 flex items-center gap-2.5 text-xs text-blue-800 font-medium">
                <Info size={16} className="text-blue-600 shrink-0" />
                <span>Information auto-filled from verified resident record. Fields are read-only.</span>
              </div>

              {/* Name Fields Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={lastName}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={firstName}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    disabled
                    value={middleName}
                    placeholder="Middle Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    disabled
                    value={suffix}
                    placeholder="Jr., III, etc."
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Demographics Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Birthday</label>
                  <input
                    type="text"
                    disabled
                    value={birthDate}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="text"
                    disabled
                    value={age}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={gender}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Civil Status</label>
                  <input
                    type="text"
                    disabled
                    value={civilStatus}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Contact & Address Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={contactNumber}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <span className="text-xs text-slate-400 font-normal">{(email || '').length}/100</span>
                  </div>
                  <input
                    type="email"
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter applicant email address..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residency Date</label>
                  <input
                    type="text"
                    disabled
                    value={residencyDate}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Address Row 4 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  disabled
                  rows={2}
                  value={completeAddress}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-700 font-medium cursor-not-allowed select-none resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section C: Purpose of Request */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Purpose of Request
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose of Request <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="First Time Jobseeker Requirement">First Time Jobseeker Requirement</option>
                    <option value="Employment Application">Employment Application</option>
                    <option value="Local Employment">Local Employment</option>
                    <option value="Government Requirement">Government Requirement</option>
                    <option value="Other">Other (Please specify)</option>
                  </select>
                </div>

                {/* Conditional "Other" Specify Field */}
                {purpose === 'Other' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Specify Purpose <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-normal">{(customPurpose || '').length}/100</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="Please specify custom purpose of request..."
                      className="w-full rounded-xl border border-blue-300 bg-blue-50/20 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section D: Educational Background & Verification */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Educational Background & Verification
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Row 1: Educational Details with Dynamic Grade Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Educational Attainment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={educationalAttainment}
                    onChange={(e) => handleEducationalAttainmentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Elementary">Elementary</option>
                    <option value="High School">High School</option>
                    <option value="Senior High School">Senior High School</option>
                    <option value="Vocational">Vocational / TESDA</option>
                    <option value="College Undergraduate">College Undergraduate</option>
                    <option value="College Graduate">College Graduate</option>
                    <option value="Post Graduate">Post Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level / Year</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    {currentGradeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Institution</label>
                    <span className="text-xs text-slate-400 font-normal">{(institution || '').length}/100</span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="School or training institution"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Requirement Checklist & File Upload (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Document Verification
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">Max 5MB per file • PDF, JPG, PNG, WEBP</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px] tracking-wider uppercase">
                    OPTIONAL
                  </span>
                </div>

                {docValidationError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>{docValidationError}</span>
                  </div>
                )}

                {/* Document Item 1: Valid ID */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasValidId}
                      onChange={(e) => {
                        setHasValidId(e.target.checked)
                        if (!e.target.checked) setValidIdFile(null)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Valid ID with Barangay Ugong Address
                      </span>
                      <span className="text-[11px] text-slate-400">Proof of residency</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      ref={validIdRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        handleValidIdFileSelect(e.target.files?.[0] || null)
                        e.target.value = ''
                      }}
                    />
                    {validIdFile ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                        <FileCheck2 size={13} />
                        <span className="max-w-[150px] truncate">{validIdFile.name}</span>
                        <span className="text-[10px] text-emerald-500">({(validIdFile.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setValidIdFile(null)
                            setHasValidId(false)
                          }}
                          className="ml-1 text-emerald-500 hover:text-emerald-700 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => validIdRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        Upload File
                      </button>
                    )}
                  </div>
                </div>

                {/* Document Item 2: Oath of Undertaking */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOath}
                      onChange={(e) => {
                        setHasOath(e.target.checked)
                        if (!e.target.checked) setOathFile(null)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Oath of Undertaking
                      </span>
                      <span className="text-[11px] text-slate-400">Signed under RA 11261</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      ref={oathRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        handleOathFileSelect(e.target.files?.[0] || null)
                        e.target.value = ''
                      }}
                    />
                    {oathFile ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                        <FileCheck2 size={13} />
                        <span className="max-w-[150px] truncate">{oathFile.name}</span>
                        <span className="text-[10px] text-emerald-500">({(oathFile.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOathFile(null)
                            setHasOath(false)
                          }}
                          className="ml-1 text-emerald-500 hover:text-emerald-700 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => oathRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        Upload File
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel & Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      {/* Standard Feedback Dialog (Success / Error) */}
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
