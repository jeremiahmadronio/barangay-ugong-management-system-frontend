import { useState, useEffect, useMemo } from 'react'
import { FormModal } from './FormModal'
import { FormSection } from './FormSection'
import { SearchSelect, type SearchSelectOption } from './SearchSelect'
import { sharedService, type Department, type ActiveResidentOption } from '@/config/api/shared_api/shared.service'
import { Badge } from '@/components/ui/table'
import type { OfficerTableResponse } from '@/config/api/officers/officer.types'

export interface RegisterOfficerModalProps {
  open?: boolean
  isOpen?: boolean
  officer?: OfficerTableResponse | null
  onClose: () => void
  onSubmitSuccess: () => void
  onRegister: (data: {
    personId: number
    departmentId?: number | null
    isGlobal: boolean
    position: string
    status: 'ACTIVE' | 'INACTIVE'
  }) => Promise<void>
  onUpdate?: (id: number, data: {
    departmentId?: number | null
    isGlobal: boolean
    position: string
    status: 'ACTIVE' | 'INACTIVE'
  }) => Promise<void>
}

// Global role options matching user screenshot
const GLOBAL_POSITIONS = [
  'Punong Barangay',
  'Barangay Tanod Chief',
  'Barangay Tanod Deputy Chief',
  'Barangay Tanod Group Leader',
  'Barangay Tanod Member',
  'Barangay Social Worker',
  'Barangay Health Worker (BHW)',
  'Executive Secretary',
  'Barangay Secretary',
  'Barangay Treasurer',
]

// Position options mapping per Department
const DEPARTMENT_POSITIONS_MAP: Record<string, string[]> = {
  LUPON: ['Lupon Secretary', 'Lupon Members', 'Pangkat Chairman'],
  BCPC: [
    'BCPC Chairperson',
    'BCPC Vice Chairperson',
    'BCPC Secretary',
    'Day Care Worker',
    'NGO / Religious Sector Representative',
  ],
  BLOTTER: [
    'Barangay Desk Officer',
    'Barangay Tanod Chief',
    'Barangay Tanod Deputy Chief',
    'Barangay Tanod Group Leader',
    'Blotter Assigning Officer',
  ],
  VAWC: ['VAWC Focal Person', 'VAWC Desk Officer'],
  CLEARANCE: ['Clearance Focal Person', 'Clearance Officer'],
  KAPITANA: ['Barangay Secretary', 'Barangay Captain / Kapitana', 'Barangay Official'],
  FTJS: ['FTJS Desk Officer', 'FTJS Focal Person'],
  ADMIN: GLOBAL_POSITIONS,
  GLOBAL: GLOBAL_POSITIONS,
}

function getPositionsForDepartment(
  deptId: string,
  departments: Department[],
  isGlobal: boolean
): string[] {
  if (isGlobal || !deptId) {
    return GLOBAL_POSITIONS
  }
  const foundDept = departments.find((d) => String(d.id) === String(deptId))
  if (!foundDept) return GLOBAL_POSITIONS

  const deptKey = (foundDept.name || '').toUpperCase().trim()
  if (DEPARTMENT_POSITIONS_MAP[deptKey]) {
    return DEPARTMENT_POSITIONS_MAP[deptKey]
  }

  if (deptKey.includes('LUPON')) return DEPARTMENT_POSITIONS_MAP.LUPON
  if (deptKey.includes('BCPC')) return DEPARTMENT_POSITIONS_MAP.BCPC
  if (deptKey.includes('BLOTTER')) return DEPARTMENT_POSITIONS_MAP.BLOTTER
  if (deptKey.includes('VAWC')) return DEPARTMENT_POSITIONS_MAP.VAWC
  if (deptKey.includes('CLEARANCE')) return DEPARTMENT_POSITIONS_MAP.CLEARANCE
  if (deptKey.includes('KAPITANA')) return DEPARTMENT_POSITIONS_MAP.KAPITANA
  if (deptKey.includes('FTJS')) return DEPARTMENT_POSITIONS_MAP.FTJS

  return GLOBAL_POSITIONS
}

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-slate-50/40 focus:ring-0'

export function RegisterOfficerModal({
  open,
  isOpen,
  officer = null,
  onClose,
  onSubmitSuccess,
  onRegister,
  onUpdate,
}: RegisterOfficerModalProps) {
  const isModalOpen = Boolean(open ?? isOpen)
  const isEdit = Boolean(officer)

  // Form States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ActiveResidentOption[]>([])
  const [selectedPerson, setSelectedPerson] = useState<ActiveResidentOption | null>(null)

  const [isGlobal, setIsGlobal] = useState(false)
  const [departmentId, setDepartmentId] = useState<string>('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [position, setPosition] = useState('')
  const [isActiveAccount, setIsActiveAccount] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Options for reusable SearchSelect component
  const residentOptions: SearchSelectOption[] = useMemo(() => {
    if (selectedPerson && !searchResults.some((r) => r.id === selectedPerson.id)) {
      return [
        {
          id: String(selectedPerson.id),
          label: selectedPerson.fullName,
          description: `ID: ${selectedPerson.barangayIdNumber || 'Active Resident'}`,
        },
        ...searchResults.map((r) => ({
          id: String(r.id),
          label: r.fullName,
          description: `ID: ${r.barangayIdNumber || 'Active Resident'}`,
        })),
      ]
    }
    return searchResults.map((r) => ({
      id: String(r.id),
      label: r.fullName,
      description: `ID: ${r.barangayIdNumber || 'Active Resident'}`,
    }))
  }, [searchResults, selectedPerson])

  // Available position options dynamically computed
  const availablePositions = useMemo(() => {
    return getPositionsForDepartment(departmentId, departments, isGlobal)
  }, [departmentId, departments, isGlobal])

  // Fetch departments & load officer if editing
  useEffect(() => {
    if (!isModalOpen) return

    sharedService.getDepartments().then((depts) => {
      setDepartments(depts)
    })

    if (officer) {
      const personObj: ActiveResidentOption = {
        id: officer.personId || officer.id,
        personId: officer.personId,
        fullName: officer.name,
        email: officer.email,
        photoBase64: officer.photoBase64,
        status: officer.status,
      }
      setSelectedPerson(personObj)
      setSearchQuery(officer.name)
      setSearchResults([personObj])

      const globalState = Boolean(officer.isGlobal || officer.departmentName === 'OVERALL')
      setIsGlobal(globalState)
      setDepartmentId(officer.departmentId ? String(officer.departmentId) : '')
      setPosition(officer.position || '')
      setIsActiveAccount(officer.status === 'ACTIVE')
    } else {
      setSearchQuery('')
      setSearchResults([])
      setSelectedPerson(null)
      setIsGlobal(false)
      setDepartmentId('')
      setPosition('')
      setIsActiveAccount(true)
    }
    setErrorMsg(null)
  }, [isModalOpen, officer])

  // Auto-select position if current choice is invalid for current department / global mode
  useEffect(() => {
    if (!isModalOpen) return
    if (availablePositions.length > 0) {
      if (!position || !availablePositions.includes(position)) {
        setPosition(availablePositions[0])
      }
    }
  }, [availablePositions, isModalOpen])

  // Debounced active resident search
  useEffect(() => {
    if (!isModalOpen) return
    if (selectedPerson && selectedPerson.fullName === searchQuery) return

    const timer = setTimeout(async () => {
      try {
        const results = await sharedService.searchActiveResidents(searchQuery)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isModalOpen, selectedPerson])

  const handleSelectPersonOption = (option: SearchSelectOption) => {
    const found = searchResults.find((r) => String(r.id) === option.id)
    if (found) {
      setSelectedPerson(found)
      setSearchQuery(found.fullName)
    } else {
      const fallback: ActiveResidentOption = {
        id: Number(option.id),
        personId: Number(option.id),
        fullName: option.label,
        email: '',
        status: 'ACTIVE',
      }
      setSelectedPerson(fallback)
      setSearchQuery(option.label)
    }
    setErrorMsg(null)
  }

  const handleSubmit = async () => {
    setErrorMsg(null)

    if (!selectedPerson) {
      setErrorMsg('Please select a resident/person using the search field.')
      return
    }

    if (!isGlobal && !departmentId) {
      setErrorMsg('Please select a department or check Global Assignment.')
      return
    }

    if (!position.trim()) {
      setErrorMsg('Please select a position.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && officer && onUpdate) {
        await onUpdate(officer.id, {
          departmentId: isGlobal || !departmentId ? null : Number(departmentId),
          isGlobal,
          position: position.trim(),
          status: isActiveAccount ? 'ACTIVE' : 'INACTIVE',
        })
      } else {
        await onRegister({
          personId: selectedPerson.personId || selectedPerson.id,
          departmentId: isGlobal || !departmentId ? null : Number(departmentId),
          isGlobal,
          position: position.trim(),
          status: isActiveAccount ? 'ACTIVE' : 'INACTIVE',
        })
      }
      onSubmitSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to save officer record. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={isModalOpen}
      title={isEdit ? 'Edit Officer / Staff' : 'Register Officer / Staff'}
      submitLabel={isEdit ? 'Update Officer' : 'Register'}
      isSubmitting={isSubmitting}
      submitDisabled={!selectedPerson || (!isGlobal && !departmentId) || !position.trim()}
      maxWidthClass="max-w-4xl"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-8">
        {errorMsg && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            {errorMsg}
          </div>
        )}

        <FormSection title="Person & Role Assignment">
          <div className="space-y-5">
            {/* 1. Reusable SearchSelect for Resident / Person */}
            <SearchSelect
              label="Resident / Person"
              required
              value={searchQuery}
              options={residentOptions}
              placeholder="Search by name…"
              emptyMessage="No active resident found."
              onChange={(val) => {
                setSearchQuery(val)
                if (selectedPerson && val !== selectedPerson.fullName) {
                  setSelectedPerson(null)
                }
              }}
              onSelect={handleSelectPersonOption}
            />

            {/* 2. Global Assignment Checkbox */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setIsGlobal(checked)
                    if (checked) {
                      setDepartmentId('')
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="font-medium text-slate-800 text-sm">Global Assignment</span>
                  <span className="ml-2 text-xs text-slate-500">
                    Use this for barangay-wide roles (no department required)
                  </span>
                </div>
              </label>
            </div>

            {/* 3. Department & Position Grid */}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Department {!isGlobal && <span className="text-rose-500">*</span>}
                <select
                  required={!isGlobal}
                  value={isGlobal ? '' : departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isGlobal}
                  className={`${inputClassName} ${
                    isGlobal ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''
                  }`}
                >
                  {isGlobal ? (
                    <option value="">Global mode enabled</option>
                  ) : (
                    <>
                      <option value="">Select department</option>
                      {departments
                        .filter((d) => d.name !== 'OVERALL' && d.name !== 'ADMIN')
                        .map((d) => {
                          let label = d.name
                          if (d.name === 'LUPON') label = 'Lupong Tagapamayapa'
                          if (d.name === 'BCPC') label = 'BCPC (Council for the Protection of Children)'
                          if (d.name === 'BLOTTER') label = 'Blotter Management'
                          if (d.name === 'VAWC') label = 'VAWC (Violence Against Women and Children)'
                          if (d.name === 'CLEARANCE') label = 'Clearance & Certifications'
                          if (d.name === 'KAPITANA') label = 'Kapitana / Barangay Official'
                          if (d.name === 'FTJS') label = 'FTJS (First-Time Job Seeker)'
                          return (
                            <option key={d.id} value={d.id}>
                              {label}
                            </option>
                          )
                        })}
                    </>
                  )}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Position <span className="text-rose-500">*</span>
                <select
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className={inputClassName}
                >
                  {availablePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection title="Officer Status">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActiveAccount}
                  onChange={(e) => setIsActiveAccount(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-slate-800">Set as Active Officer</span>
              </label>
              <Badge tone={isActiveAccount ? 'emerald' : 'slate'}>
                {isActiveAccount ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
