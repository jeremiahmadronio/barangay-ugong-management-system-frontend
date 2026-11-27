import React, { useState, useEffect } from 'react'
import {
  X,
  FileText,
  MessageSquare,
  Loader2,
  Calendar,
  Clock,
  Building2,
  Phone,
  User,
} from 'lucide-react'
import type { BcpcCustodyLog } from '@/config/api/bcpc/bcpc.types'

interface GuardianSuggestion {
  name: string
  relationship?: string
  contact?: string
}

interface BcpcCustodyRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<BcpcCustodyLog>) => Promise<void>
  existingData?: BcpcCustodyLog | null
  suggestedGuardians?: GuardianSuggestion[]
  caseNumber?: string
}

export const TURNOVER_DESTINATIONS = [
  'Parent / Guardian / Caregiver',
  'Barangay of Residence',
  'Other Authorized Person',
  'Temporarily staying at the barangay while awaiting turnover',
  'LSWDO',
] as const

export const OTHER_AUTHORIZED_ROLES = [
  'Grandparent',
  'Aunt / Uncle',
  'Adult Sibling',
  'Extended Relative',
  'Teacher / School Authority',
  'Barangay / Community Leader',
  'Religious Leader',
  'Neighbor / Trusted Individual',
  'Other',
] as const

export const PARENT_ROLES = [
  'Mother',
  'Father',
  'Legal Guardian',
  'Caregiver',
  'Parent',
  'Other',
] as const

export const BcpcCustodyRecordModal: React.FC<BcpcCustodyRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingData,
  suggestedGuardians = [],
  caseNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'placement' | 'assessment'>('placement')

  const isExisting = Boolean(existingData?.temporaryPlacement)

  const [destination, setDestination] = useState<string>(
    existingData?.temporaryPlacement || TURNOVER_DESTINATIONS[0]
  )

  // Person fields
  const [firstName, setFirstName] = useState<string>('')
  const [middleName, setMiddleName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [singleName, setSingleName] = useState<string>('')
  const [relationship, setRelationship] = useState<string>('')
  const [customRelationship, setCustomRelationship] = useState<string>('')
  const [position, setPosition] = useState<string>('')
  const [contactNumber, setContactNumber] = useState<string>(
    existingData?.contactNumber || ''
  )
  const [receivingOffice, setReceivingOffice] = useState<string>('')
  const [receivingBarangay, setReceivingBarangay] = useState<string>('')

  // Date & Time
  const [transferDate, setTransferDate] = useState<string>(
    existingData?.transferDate || new Date().toISOString().split('T')[0]
  )
  const [transferTime, setTransferTime] = useState<string>(
    existingData?.transferTime ||
      new Date().toTimeString().split(' ')[0].substring(0, 5)
  )

  // Remarks & Reason
  const [reason, setReason] = useState<string>(
    existingData?.temporaryPlacementReason || ''
  )
  const [remarks, setRemarks] = useState<string>(
    existingData?.transferNotes || ''
  )

  // Guidance (Parent only)
  const [childGuidance, setChildGuidance] = useState<boolean>(
    existingData?.childGuidanceProvided ?? true
  )
  const [parentAdvice, setParentAdvice] = useState<boolean>(
    existingData?.parentAdviceProvided ?? true
  )
  const [guidanceNotes, setGuidanceNotes] = useState<string>(
    existingData?.guidanceNotes || ''
  )

  // Medical
  const [needsMedical, setNeedsMedical] = useState<boolean>(
    existingData?.needsMedicalAttention ?? false
  )
  const [immediateNotes, setImmediateNotes] = useState<string>(
    existingData?.immediateActionNotes || ''
  )
  const [healthCoordination, setHealthCoordination] = useState<boolean>(
    existingData?.healthCoordinationConfirmed ?? false
  )

  const [editReason, setEditReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isParent = destination === 'Parent / Guardian / Caregiver'
  const isLswdo = destination === 'LSWDO'
  const isBrgy = destination === 'Barangay of Residence'
  const isOther = destination === 'Other Authorized Person'
  const isTemporary =
    destination ===
    'Temporarily staying at the barangay while awaiting turnover'

  const applyInitialRelationship = (rel?: string) => {
    if (!rel) {
      setRelationship('')
      setCustomRelationship('')
      return
    }
    const trimmed = rel.trim()
    const isKnownParent = (['Mother', 'Father', 'Legal Guardian', 'Caregiver', 'Parent'] as string[]).includes(trimmed)
    const isKnownOther = (OTHER_AUTHORIZED_ROLES.filter((r) => r !== 'Other') as string[]).includes(trimmed)

    if (isKnownParent || isKnownOther) {
      setRelationship(trimmed)
      setCustomRelationship('')
    } else {
      setRelationship('Other')
      setCustomRelationship(trimmed)
    }
  }

  // Pre-fill on open or destination change
  useEffect(() => {
    if (!isOpen) return
    setActiveTab('placement')
    setError(null)
    setDestination(existingData?.temporaryPlacement || TURNOVER_DESTINATIONS[0])
    setTransferDate(existingData?.transferDate || new Date().toISOString().split('T')[0])
    setTransferTime(
      existingData?.transferTime ||
        new Date().toTimeString().split(' ')[0].substring(0, 5)
    )
    setReason(existingData?.temporaryPlacementReason || '')
    setRemarks(existingData?.transferNotes || '')
    setContactNumber(existingData?.contactNumber || '')
    setChildGuidance(existingData?.childGuidanceProvided ?? true)
    setParentAdvice(existingData?.parentAdviceProvided ?? true)
    setGuidanceNotes(existingData?.guidanceNotes || '')
    setNeedsMedical(existingData?.needsMedicalAttention ?? false)
    setImmediateNotes(existingData?.immediateActionNotes || '')
    setHealthCoordination(existingData?.healthCoordinationConfirmed ?? false)
    setEditReason('')

    if (existingData?.initialResponsibility) {
      try {
        const parsed = JSON.parse(existingData.initialResponsibility)
        setFirstName(parsed.firstName || '')
        setMiddleName(parsed.middleName || '')
        setLastName(parsed.lastName || '')
        setSingleName(parsed.representativeName || parsed.firstName || '')
        applyInitialRelationship(parsed.relationship)
        setPosition(parsed.officePosition || '')
        setReceivingOffice(parsed.receivingOffice || '')
        setReceivingBarangay(parsed.receivingBarangay || '')
        if (parsed.immediateActionNotes) {
          setImmediateNotes(parsed.immediateActionNotes)
        }
      } catch {
        if (existingData.receivingPersonName) {
          setFirstName(existingData.receivingPersonName)
          setSingleName(existingData.receivingPersonName)
        }
      }
    } else if (existingData?.receivingPersonName) {
      setFirstName(existingData.receivingPersonName)
      setSingleName(existingData.receivingPersonName)
      if (existingData.receivingRelationship) {
        applyInitialRelationship(existingData.receivingRelationship)
      }
    } else {
      if (suggestedGuardians && suggestedGuardians.length > 0 && destination === 'Parent / Guardian / Caregiver') {
        handleApplyGuardian(suggestedGuardians[0])
      } else {
        setFirstName('')
        setMiddleName('')
        setLastName('')
        setSingleName('')
        setRelationship('')
        setCustomRelationship('')
        setPosition('')
        setReceivingOffice('')
        setReceivingBarangay('')
      }
    }
  }, [isOpen, existingData, suggestedGuardians])

  const handleDestinationChange = (newDest: string) => {
    if (newDest === destination) return
    setDestination(newDest)

    // If returning to the existing record's original destination, restore its saved values
    if (isExisting && existingData?.temporaryPlacement === newDest) {
      if (existingData?.initialResponsibility) {
        try {
          const parsed = JSON.parse(existingData.initialResponsibility)
          setFirstName(parsed.firstName || '')
          setMiddleName(parsed.middleName || '')
          setLastName(parsed.lastName || '')
          setSingleName(parsed.representativeName || parsed.firstName || '')
          applyInitialRelationship(parsed.relationship)
          setPosition(parsed.officePosition || '')
          setReceivingOffice(parsed.receivingOffice || '')
          setReceivingBarangay(parsed.receivingBarangay || '')
        } catch {
          if (existingData.receivingPersonName) {
            setFirstName(existingData.receivingPersonName)
            setSingleName(existingData.receivingPersonName)
          }
        }
      }
      setContactNumber(existingData.contactNumber || '')
      setReason(existingData.temporaryPlacementReason || '')
      return
    }

    // When switching destination, completely clear intake guardian / previous destination info
    // so that receiving officer, contact number, and other fields NEVER auto-fill inappropriately.
    setFirstName('')
    setMiddleName('')
    setLastName('')
    setSingleName('')
    setRelationship('')
    setCustomRelationship('')
    setPosition('')
    setReceivingOffice('')
    setReceivingBarangay('')
    setContactNumber('')

    // Reset parent-specific default reasons
    if (
      reason === 'Parent/guardian assumed physical custody.' ||
      reason === 'Parent assumed physical custody; child is safe to return home.'
    ) {
      setReason('')
    }
  }

  const handleApplyGuardian = (g: GuardianSuggestion) => {
    const parts = g.name.trim().split(/\s+/)
    if (parts.length === 1) {
      setFirstName(parts[0])
      setLastName('')
    } else if (parts.length === 2) {
      setFirstName(parts[0])
      setLastName(parts[1])
    } else {
      setFirstName(parts[0])
      setMiddleName(parts[1])
      setLastName(parts.slice(2).join(' '))
    }
    if (g.relationship) {
      applyInitialRelationship(g.relationship)
    }
    if (g.contact) setContactNumber(g.contact)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const effectiveRelationship =
      relationship === 'Other' ? customRelationship.trim() : relationship.trim()

    // Destination-specific validation
    if (isParent) {
      if (!firstName.trim() || !effectiveRelationship) {
        setActiveTab('placement')
        setError(
          relationship === 'Other' && !customRelationship.trim()
            ? 'Please specify the relationship.'
            : 'Receiving parent / guardian name and relationship are required.'
        )
        return
      }
    } else if (isOther) {
      if (!firstName.trim() || !effectiveRelationship) {
        setActiveTab('placement')
        setError(
          relationship === 'Other' && !customRelationship.trim()
            ? 'Please specify the role / relationship.'
            : 'Receiving person name and role / relationship are required.'
        )
        return
      }
    } else if (isLswdo) {
      if (!receivingOffice.trim()) {
        setActiveTab('placement')
        setError('Receiving Office / Agency name is required (e.g. CSWDO Valenzuela / Bahay Pag-asa).')
        return
      }
    } else if (isBrgy) {
      if (!receivingBarangay.trim()) {
        setActiveTab('placement')
        setError('Receiving Barangay name is required.')
        return
      }
    } else if (isTemporary) {
      if (!singleName.trim()) {
        setActiveTab('placement')
        setError('Responsible barangay personnel name is required.')
        return
      }
    }

    if (contactNumber.trim()) {
      if (contactNumber.trim().length !== 11 || !contactNumber.trim().startsWith('09')) {
        setActiveTab('placement')
        setError('Contact number must be exactly 11 digits starting with 09 (e.g. 09XXXXXXXXX).')
        return
      }
    }

    if (
      firstName.length > 50 ||
      middleName.length > 50 ||
      lastName.length > 50 ||
      singleName.length > 50
    ) {
      setActiveTab('placement')
      setError('Name fields cannot exceed 50 characters.')
      return
    }

    if (!transferDate || !transferTime) {
      setActiveTab('placement')
      setError('Turnover date and time are required.')
      return
    }
    if (!reason.trim()) {
      setActiveTab('assessment')
      setError('Reason / basis for turnover is required.')
      return
    }
    if (reason.trim().length < 5) {
      setActiveTab('assessment')
      setError('Reason / basis for turnover must be at least 5 characters.')
      return
    }
    if (reason.length > 500) {
      setActiveTab('assessment')
      setError('Reason / basis for turnover cannot exceed 500 characters.')
      return
    }
    if (needsMedical) {
      if (!immediateNotes.trim()) {
        setActiveTab('assessment')
        setError('Immediate action notes are required when medical attention is noted.')
        return
      }
      if (immediateNotes.trim().length < 5) {
        setActiveTab('assessment')
        setError('Immediate action notes must be at least 5 characters.')
        return
      }
      if (immediateNotes.length > 500) {
        setActiveTab('assessment')
        setError('Immediate action notes cannot exceed 500 characters.')
        return
      }
    }
    if (guidanceNotes.length > 500) {
      setActiveTab('assessment')
      setError('Guidance notes cannot exceed 500 characters.')
      return
    }
    if (remarks.length > 1000) {
      setActiveTab('assessment')
      setError('Remarks / case notes cannot exceed 1000 characters.')
      return
    }
    if (isParent && (!childGuidance || !parentAdvice)) {
      setActiveTab('assessment')
      setError('Please complete both child guidance and parent advisory confirmations.')
      return
    }
    if (isExisting && !editReason.trim()) {
      setError('Reason for Edit is required.')
      return
    }

    // Prepare JSON payload depending on destination
    let initialResp: any = {
      immediateActionNotes: immediateNotes.trim(),
      expectedNextAction: '',
    }

    if (isParent || isOther) {
      initialResp.firstName = firstName.trim()
      initialResp.middleName = middleName.trim()
      initialResp.lastName = lastName.trim()
      initialResp.relationship = effectiveRelationship
    } else if (isLswdo) {
      initialResp.firstName = singleName.trim()
      initialResp.receivingOffice = receivingOffice.trim()
      initialResp.officePosition = position.trim()
      initialResp.relationship = position.trim() || 'Social Welfare Officer'
    } else if (isBrgy) {
      initialResp.firstName = singleName.trim()
      initialResp.receivingBarangay = receivingBarangay.trim()
      initialResp.officePosition = position.trim()
      initialResp.relationship = position.trim() || 'Barangay Official'
    } else if (isTemporary) {
      initialResp.firstName = singleName.trim()
      initialResp.officePosition = position.trim() || 'Barangay Personnel'
      initialResp.relationship = position.trim() || 'Barangay Personnel'
    }

    const payload: Partial<BcpcCustodyLog> = {
      turnoverAction: isExisting ? 'CORRECTION' : 'NEW_TURNOVER',
      editReason: isExisting ? editReason.trim() : undefined,
      temporaryPlacement: destination,
      initialResponsibility: JSON.stringify(initialResp),
      receivingPersonName:
        isParent || isOther
          ? [firstName, middleName, lastName].filter(Boolean).join(' ').trim()
          : singleName.trim() || undefined,
      receivingRelationship:
        isParent || isOther
          ? effectiveRelationship
          : isLswdo
          ? 'LSWDO Representative'
          : isBrgy
          ? 'Barangay Personnel'
          : isTemporary
          ? 'Barangay Personnel'
          : undefined,
      contactNumber: contactNumber.trim(),
      transferDate,
      transferTime,
      temporaryPlacementReason: reason.trim(),
      transferNotes: remarks.trim(),
      needsMedicalAttention: needsMedical,
      healthCoordinationConfirmed: healthCoordination,
      childGuidanceProvided: isParent ? childGuidance : false,
      parentAdviceProvided: isParent ? parentAdvice : false,
      guidanceNotes: isParent ? guidanceNotes.trim() : undefined,
    }

    try {
      setLoading(true)
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save turnover record.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              {isExisting ? 'Update Custody & Turnover Record' : 'Record Custody & Turnover'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : ''}
              {destination ? ` · ${destination}` : ''}
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

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
          {[
            { id: 'placement', label: '1. Custody Transfer & Receiving Party', icon: FileText },
            { id: 'assessment', label: '2. Guidance & Assessment', icon: MessageSquare },
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isExisting && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Reason for Edit <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] ${editReason.length >= 200 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                  {editReason.length} / 200
                </span>
              </div>
              <input
                type="text"
                value={editReason}
                maxLength={200}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="State the reason for modifying this record"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {activeTab === 'placement' ? (
            <div className="space-y-5 animate-in fade-in duration-100">
              {/* Section 1: Transfer Details & Schedule */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  1. Transfer Details & Schedule
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Custody Released To <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {TURNOVER_DESTINATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      Turnover Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      Turnover Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={transferTime}
                      onChange={(e) => setTransferTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Phone size={11} className="text-slate-400" />
                      Contact Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setContactNumber(digits)
                      }}
                      maxLength={11}
                      inputMode="numeric"
                      placeholder="09XXXXXXXXX"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                      {contactNumber.length}/11
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: DYNAMICALLY ADAPTED RECEIVING SECTION */}

              {/* 2A: PARENT / GUARDIAN / CAREGIVER */}
              {isParent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      2. Receiving Parent / Guardian / Caregiver
                    </label>
                    {suggestedGuardians.length > 0 && (
                      <div className="flex gap-2">
                        {suggestedGuardians.map((g, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyGuardian(g)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            Use Intake Guardian: {g.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value.slice(0, 50))}
                        placeholder="First name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {firstName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value.slice(0, 50))}
                        placeholder="Middle name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {middleName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value.slice(0, 50))}
                        placeholder="Last name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {lastName.length}/50
                      </span>
                    </div>

                    <div className={relationship === 'Other' ? 'space-y-1.5' : ''}>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Relationship <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => {
                          setRelationship(e.target.value)
                          if (e.target.value !== 'Other') {
                            setCustomRelationship('')
                          }
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">Select relationship</option>
                        {PARENT_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      {relationship === 'Other' && (
                        <div>
                          <input
                            type="text"
                            value={customRelationship}
                            maxLength={50}
                            onChange={(e) => setCustomRelationship(e.target.value)}
                            placeholder="Specify relationship *"
                            className="w-full text-xs px-3 py-2 bg-white border border-blue-400 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 animate-in fade-in duration-100"
                            required
                          />
                          <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                            {customRelationship.length}/50
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2B: LSWDO DESTINATION */}
              {isLswdo && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. LSWDO / Social Welfare Facility
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Receiving Office / Facility Name <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {receivingOffice.length} / 150
                        </span>
                      </div>
                      <input
                        type="text"
                        value={receivingOffice}
                        maxLength={150}
                        onChange={(e) => setReceivingOffice(e.target.value)}
                        placeholder="e.g. CSWDO Valenzuela / Bahay Pag-asa"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Receiving Social Worker / Representative Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value.slice(0, 50))}
                        placeholder="Full name of representative"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {singleName.length}/50
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Office / Position (Optional)
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {position.length} / 100
                        </span>
                      </div>
                      <input
                        type="text"
                        value={position}
                        maxLength={100}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Social Welfare Officer II"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2C: BARANGAY OF RESIDENCE */}
              {isBrgy && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Receiving Barangay Information
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Receiving Barangay <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {receivingBarangay.length} / 150
                        </span>
                      </div>
                      <input
                        type="text"
                        value={receivingBarangay}
                        maxLength={150}
                        onChange={(e) => setReceivingBarangay(e.target.value)}
                        placeholder="e.g. Barangay San Antonio, Pasig City"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Receiving Official / Officer Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value.slice(0, 50))}
                        placeholder="Full name of barangay representative"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {singleName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Position / Role (Optional)
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Barangay Tanod / Kagawad"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2D: OTHER AUTHORIZED PERSON */}
              {isOther && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Receiving Authorized Person
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value.slice(0, 50))}
                        placeholder="First name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {firstName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value.slice(0, 50))}
                        placeholder="Middle name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {middleName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value.slice(0, 50))}
                        placeholder="Last name"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {lastName.length}/50
                      </span>
                    </div>

                    <div className={relationship === 'Other' ? 'space-y-1.5' : ''}>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Relationship / Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => {
                          setRelationship(e.target.value)
                          if (e.target.value !== 'Other') {
                            setCustomRelationship('')
                          }
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">Select role</option>
                        {OTHER_AUTHORIZED_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      {relationship === 'Other' && (
                        <div>
                          <input
                            type="text"
                            value={customRelationship}
                            onChange={(e) => setCustomRelationship(e.target.value)}
                            placeholder="Specify role / relationship *"
                            className="w-full text-xs px-3 py-2 bg-white border border-blue-400 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 animate-in fade-in duration-100"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2E: TEMPORARY BARANGAY STAY */}
              {isTemporary && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Responsible Barangay Personnel
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Personnel Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value.slice(0, 50))}
                        placeholder="Full name of responsible officer"
                        maxLength={50}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                        {singleName.length}/50
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Role / Position
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. BCPC Focal Person / Barangay Kagawad"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-100">
              {/* Guidance Section (Parent only) */}
              {isParent && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    1. Parental & Child Guidance
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={childGuidance}
                        onChange={(e) => setChildGuidance(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Child guidance and counseling provided</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={parentAdvice}
                        onChange={(e) => setParentAdvice(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Parent / guardian advised on parental responsibilities</span>
                    </label>
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Guidance Notes (Optional)
                        </label>
                        <span className={`text-[10px] ${guidanceNotes.length >= 500 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                          {guidanceNotes.length} / 500
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={guidanceNotes}
                        onChange={(e) => setGuidanceNotes(e.target.value)}
                        placeholder="Brief notes on advice given"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Attention Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isParent ? '2. Immediate Medical Assessment' : '1. Immediate Medical Assessment'}
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={needsMedical}
                      onChange={(e) => setNeedsMedical(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Child requires immediate medical attention</span>
                  </label>

                  {needsMedical && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Immediate Action Notes <span className="text-red-500">*</span>
                          </label>
                          <span className={`text-[10px] ${immediateNotes.length >= 500 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                            {immediateNotes.length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={immediateNotes}
                          onChange={(e) => setImmediateNotes(e.target.value)}
                          placeholder="Describe observed injuries or immediate medical steps taken"
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                          required={needsMedical}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={healthCoordination}
                          onChange={(e) => setHealthCoordination(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Health Office / Barangay Health Center contacted</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Basis & Case Notes Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isParent ? '3. Legal Basis & Case Notes' : '2. Legal Basis & Case Notes'}
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Reason / Basis for Turnover <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] ${reason.length >= 500 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {reason.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={
                        isTemporary
                          ? 'e.g., Temporarily sheltered awaiting referral or guardian contact'
                          : 'e.g., Restored to parental custody following curfew apprehension and verification'
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Remarks / Case Notes (Optional)
                      </label>
                      <span className={`text-[10px] ${remarks.length >= 1000 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {remarks.length} / 1000
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Any additional remarks or conditions"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm & Save Turnover</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
