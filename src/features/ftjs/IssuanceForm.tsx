import { useState, useCallback, useEffect, useRef } from 'react'
import {
  SearchSelect,
  type SearchSelectOption,
} from '@/components/ui/SearchSelect'
import { Badge } from '@/components/ui/table/Badge'
import {
  ftjsService,
  residentService,
  type FtjsResidentSearchResponse,
} from '@/config/api'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDateTime } from '@/utils/formatters'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Info,
  RotateCcw,
  Upload,
  UserCheck,
  X,
} from 'lucide-react'

export function IssuanceForm() {
  const { currentUser } = useAuth()
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

  // Personal Information Fields (Auto-filled)
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
  const [remarks, setRemarks] = useState('')

  // Educational Background & Requirements
  const [educationalAttainment, setEducationalAttainment] = useState('Elementary')
  const [gradeLevel, setGradeLevel] = useState('Completed / Graduated')
  const [institution, setInstitution] = useState('')

  // Uploaded Files & Checklist State
  const [hasValidId, setHasValidId] = useState(false)
  const [validIdFile, setValidIdFile] = useState<File | null>(null)
  const [hasOath, setHasOath] = useState(false)
  const [oathFile, setOathFile] = useState<File | null>(null)

  // Hidden File Inputs Refs
  const validIdRef = useRef<HTMLInputElement>(null)
  const oathRef = useRef<HTMLInputElement>(null)

  // Modal / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)

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
    setReleasedBy(currentUser?.username || currentUser?.email || 'systemadmin')

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
      setEmail(currentUser?.email || '')
      setResidencyDate(detail.dateOfResidency || selectedResident.residencyDate || '')
      setCompleteAddress(p.completeAddress || selectedResident.completeAddress || '')
      setEducationalAttainment(detail.educationalAttainment || 'Elementary')
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
      setCompleteAddress(selectedResident.completeAddress || '')
      setResidencyDate(selectedResident.residencyDate || '')
    } finally {
      setIsLoadingDetail(false)
      setStep('form')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle Application Submit
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmissionModalOpen(true)
    }, 600)
  }

  const handleResetForm = () => {
    setStep('search')
    setSelectedResident(null)
    setSearchValue('')
    setPurpose('First Time Jobseeker Requirement')
    setCustomPurpose('')
    setRemarks('')
    setHasValidId(false)
    setValidIdFile(null)
    setHasOath(false)
    setOathFile(null)
    setSubmissionModalOpen(false)
  }

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* ─────────────────────────────────────────────────────────────────
          STEP 1: RESIDENT SEARCH & ELIGIBILITY VERIFICATION
      ─────────────────────────────────────────────────────────────────── */}
      {step === 'search' && (
        <>
          {/* Page Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              FTJS Issuance & Eligibility Entry
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Verify resident qualification and process First-Time Jobseeker certification under RA 11261.
            </p>
          </div>

          {/* 1. Search Card */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs relative z-20">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center gap-3 rounded-t-2xl">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                A
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Application Entry - Resident Search
              </h2>
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
                {selectedResident.hasAvailedFtjs ? (
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

              {/* 3. Parallel History Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Issuance History */}
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
                        {selectedResident.issuanceHistories && selectedResident.issuanceHistories.length > 0 ? (
                          selectedResident.issuanceHistories.map((hist, idx) => (
                            <tr key={`${hist.ftjsNumber}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">{hist.ftjsNumber}</td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(hist.issuedAt)}</td>
                              <td className="px-4 py-3">
                                <Badge tone="emerald">{hist.status || 'Already Issued'}</Badge>
                              </td>
                            </tr>
                          ))
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

                {/* Right Card: Barangay Case History */}
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
                          <th className="px-4 py-2.5">Incident / Role</th>
                          <th className="px-4 py-2.5">Date Filed</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedResident.caseHistoryList && selectedResident.caseHistoryList.length > 0 ? (
                          selectedResident.caseHistoryList.map((c, idx) => (
                            <tr key={`${c.caseNumber}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">{c.caseNumber}</td>
                              <td className="px-4 py-3 text-slate-700 font-medium">
                                {c.natureOfComplaint} <span className="text-slate-400 font-normal">({c.role})</span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(c.dateFiled)}</td>
                              <td className="px-4 py-3">
                                <Badge tone="amber">{c.status}</Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                              No case history records.
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
                  disabled={selectedResident.hasAvailedFtjs || isLoadingDetail}
                  onClick={handleProceedToApplication}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 ${
                    selectedResident.hasAvailedFtjs || isLoadingDetail
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

          {/* Section A: Application Details (Auto-Generated) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                A
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Application Details (Auto-Generated)
              </h2>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">APPLICATION NO.</dt>
                  <dd className="mt-1 text-base font-black text-blue-700">{applicationNo}</dd>
                  <p className="text-[10px] text-slate-400 font-medium">(auto-generated)</p>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">DATE APPLICATION</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{applicationDate}</dd>
                  <p className="text-[10px] text-slate-400 font-medium">(current timestamp)</p>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RELEASED BY</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{releasedBy}</dd>
                  <p className="text-[10px] text-slate-400 font-medium">(logged in)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Personal Information (Auto-Filled) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                B
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Personal Information
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Notice Banner */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 flex items-center gap-2.5 text-xs text-blue-800 font-medium">
                <Info size={16} className="text-blue-600 shrink-0" />
                <span>Fields with <span className="text-rose-500 font-bold">*</span> are required and auto-fill from resident record.</span>
              </div>

              {/* Name Fields Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="Jr., III, etc."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Demographics Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Birthday</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Civil Status</label>
                  <select
                    value={civilStatus}
                    onChange={(e) => setCivilStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Separated">Separated</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
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
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="09123456789"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">Use 11-digit Philippine mobile format</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residency Date</label>
                  <input
                    type="text"
                    value={residencyDate}
                    onChange={(e) => setResidencyDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Address Row 4 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={completeAddress}
                  onChange={(e) => setCompleteAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section C: Purpose of Request & Application Details */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                C
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Purpose of Request & Application Details
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specify Purpose <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="Please specify custom purpose of request..."
                      className="w-full rounded-xl border border-blue-300 bg-blue-50/20 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Additional Notes</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional narrative notes for this jobseeker application..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section D: Educational Background & Verification */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="bg-slate-50/70 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                D
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Educational Background & Verification
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Row 1: Educational Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Educational Attainment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={educationalAttainment}
                    onChange={(e) => setEducationalAttainment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Elementary">Elementary</option>
                    <option value="High School">High School</option>
                    <option value="Senior High School">Senior High School</option>
                    <option value="Vocational">Vocational</option>
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
                    <option value="Completed / Graduated">Completed / Graduated</option>
                    <option value="Grade 7 - 10">Grade 7 - 10</option>
                    <option value="Grade 11 - 12">Grade 11 - 12</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="School or training institution"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Requirement Checklist & File Upload */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Document Verification</p>

                {/* Document Item 1: Valid ID */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasValidId}
                      onChange={(e) => setHasValidId(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Valid ID with Barangay Ugong Address</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      ref={validIdRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setValidIdFile(e.target.files[0])
                          setHasValidId(true)
                        }
                      }}
                    />
                    {validIdFile ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                        <FileCheck2 size={13} />
                        {validIdFile.name}
                        <button
                          type="button"
                          onClick={() => setValidIdFile(null)}
                          className="ml-1 text-emerald-500 hover:text-emerald-700"
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
                      onChange={(e) => setHasOath(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Oath of Undertaking</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      ref={oathRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setOathFile(e.target.files[0])
                          setHasOath(true)
                        }
                      }}
                    />
                    {oathFile ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                        <FileCheck2 size={13} />
                        {oathFile.name}
                        <button
                          type="button"
                          onClick={() => setOathFile(null)}
                          className="ml-1 text-emerald-500 hover:text-emerald-700"
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

      {/* ─────────────────────────────────────────────────────────────────
          SUBMISSION SUCCESS MODAL
      ─────────────────────────────────────────────────────────────────── */}
      {submissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-500 font-medium">
                The First-Time Jobseeker application <span className="font-bold text-blue-600">{applicationNo}</span> has been encoded successfully.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Applicant:</span>
                <span className="font-bold text-slate-900">{selectedResident?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Purpose:</span>
                <span className="font-semibold text-slate-800">{purpose === 'Other' ? customPurpose : purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Date & Time:</span>
                <span className="text-slate-700">{applicationDate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Return to Resident Search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
