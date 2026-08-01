import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { FormModal } from '@/components/ui/FormModal'
import { FormSection } from '@/components/ui/FormSection'
import {
  sharedService,
  type Department,
  type Permission,
} from '@/config/api/shared_api/shared.service'
import { userService } from '@/config/api/users/users.service'
import type { UserDetailResponse } from '@/config/api/users/users.types'

interface EditUserAccountModalProps {
  open: boolean
  user: UserDetailResponse | null
  onClose: () => void
  onSaved: (name: string) => void
}

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-slate-50/40 focus:ring-0'

/** Formats raw department code or ALL-CAPS name to friendly display title */
function formatDepartmentDisplayLabel(rawName: string): string {
  if (!rawName) return ''
  const upper = rawName.trim().toUpperCase()

  if (upper === 'BCPC' || upper.includes('COUNCIL FOR THE PROTECTION OF CHILDREN')) {
    return 'BCPC (Council for the Protection of Children)'
  }
  if (upper === 'CLEARANCE' || upper.includes('BARANGAY CLEARANCE')) {
    return 'Barangay Clearance & Certification'
  }
  if (upper === 'BLOTTER' || upper.includes('BLOTTER MANAGEMENT')) {
    return 'Blotter Management'
  }
  if (upper === 'FTJS' || upper.includes('FIRST TIME JOB SEEKERS')) {
    return 'FTJS (First Time Job Seekers)'
  }
  if (upper === 'LUPON' || upper.includes('LUPONG TAGAPAMAYAPA')) {
    return 'Lupong Tagapamayapa'
  }
  if (upper === 'KAPITANA' || upper.includes('PUNONG') || upper.includes('BARANGAY CAPTAIN')) {
    return 'Office of the Barangay Captain'
  }
  if (upper === 'VAWC' || upper.includes('VIOLENCE AGAINST WOMEN')) {
    return 'VAWC (Violence Against Women and Children)'
  }

  return rawName
}

export function EditUserAccountModal({
  open,
  user,
  onClose,
  onSaved,
}: EditUserAccountModalProps) {
  const isAdminAccount = Boolean(user?.accountType?.toUpperCase().includes('ADMIN'))

  const [systemEmail, setSystemEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isEmailAvailable, setIsEmailAvailable] = useState(true)

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | number>('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<(string | number)[]>([])
  const [isActivated, setIsActivated] = useState(true)

  const [departments, setDepartments] = useState<Department[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load dropdown data
  useEffect(() => {
    if (!open) return
    let isMounted = true

    const loadDropdownData = async () => {
      setIsLoadingDropdowns(true)
      const [deptsData, permsData] = await Promise.all([
        sharedService.getDepartments(),
        sharedService.getPermissions(),
      ])
      if (isMounted) {
        setDepartments(deptsData)
        setAllPermissions(permsData)
        setIsLoadingDropdowns(false)
      }
    }

    loadDropdownData()

    return () => {
      isMounted = false
    }
  }, [open])

  // Populate data when modal opens or user changes
  useEffect(() => {
    if (!open || !user) return
    setSystemEmail(user.systemEmail || '')
    setEmailError(null)
    setSubmitError(null)
    setIsEmailAvailable(true)
    setIsActivated(user.status === 'ACTIVE')

    const initialDeptId = user.departments && user.departments.length > 0 ? user.departments[0].id : ''
    setSelectedDepartmentId(initialDeptId)

    const initialPermIds = user.customPermissions ? user.customPermissions.map((p) => p.id) : []
    setSelectedPermissionIds(initialPermIds)
  }, [open, user])

  // Filter out ADMIN / SYSTEM_ADMIN from user creation department list
  const userDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const upper = (dept.name || '').trim().toUpperCase()
      return upper !== 'ADMIN' && upper !== 'SYSTEM_ADMIN' && upper !== 'ROOTADMIN'
    })
  }, [departments])

  // Email format & backend availability check
  useEffect(() => {
    if (!open || !user) return
    let isMounted = true

    const trimmed = systemEmail.trim()
    if (!trimmed) {
      setEmailError(null)
      setIsCheckingEmail(false)
      setIsEmailAvailable(false)
      return
    }

    // If unchanged, it's valid & available
    if (trimmed.toLowerCase() === user.systemEmail?.toLowerCase()) {
      setEmailError(null)
      setIsCheckingEmail(false)
      setIsEmailAvailable(true)
      return
    }

    // Gmail-only validation requirement
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(trimmed)
    if (!isGmail) {
      setEmailError('Email must be a valid @gmail.com address.')
      setIsCheckingEmail(false)
      setIsEmailAvailable(false)
      return
    }

    setIsCheckingEmail(true)
    setEmailError(null)
    setIsEmailAvailable(false)

    const timer = setTimeout(async () => {
      try {
        const isTaken = await sharedService.checkEmailAvailability(trimmed)
        if (isMounted) {
          if (isTaken) {
            setEmailError('This email address is already in use by another active user.')
            setIsEmailAvailable(false)
          } else {
            setEmailError(null)
            setIsEmailAvailable(true)
          }
          setIsCheckingEmail(false)
        }
      } catch {
        if (isMounted) {
          setEmailError(null)
          setIsEmailAvailable(true)
          setIsCheckingEmail(false)
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [systemEmail, open, user])

  // ─── Department Specific Permission Mapping ──────────────────────────────
  const filteredPermissions = useMemo(() => {
    if (!selectedDepartmentId || isAdminAccount) return []
    const selectedDept = departments.find((d) => String(d.id) === String(selectedDepartmentId))
    const deptName = selectedDept ? selectedDept.name.toUpperCase() : ''

    if (
      deptName.includes('KAPITANA') ||
      deptName.includes('PUNONG') ||
      deptName.includes('BARANGAY CAPTAIN')
    ) {
      return []
    }

    let allowedNames: string[] = []

    if (deptName.includes('VAWC')) {
      allowedNames = [
        'View Cases', 'Archive Cases', 'Manage Case notes', 'Issue Referral',
        'Issue BPO', 'Create Case Entry', 'Resolve & Finalize Case', 'Manage Reports',
        'Update Case information', 'Manage Intervention'
      ]
    } else if (deptName.includes('BCPC') || deptName.includes('CHILDREN')) {
      allowedNames = [
        'Manage Mediation', 'View Cases', 'Create Case Entry', 'Archive Cases',
        'Resolve & Finalize Case', 'Manage Case notes', 'Manage Reports',
        'Issue Referral', 'Update Case information', 'Issue BPO', 'Manage Intervention'
      ]
    } else if (deptName.includes('BLOTTER')) {
      allowedNames = [
        'View Records', 'Manage Mediation', 'Manage Lupon Escalation', 'View Cases',
        'Create Case Entry', 'Archive Cases', 'Resolve & Finalize Case',
        'Manage Case notes', 'Manage Reports', 'Update Case information'
      ]
    } else if (deptName.includes('CLEARANCE') || deptName.includes('CERTIFICATION')) {
      allowedNames = [
        'Issue Clearance', 'Edit Template', 'View Revenue Reports'
      ]
    } else if (deptName.includes('FTJS') || deptName.includes('JOB SEEKER')) {
      allowedNames = [
        'Register new Applicant', 'Issue ftjs Certificate', 'View ftjs Records', 'Update Applicant Info'
      ]
    } else if (deptName.includes('LUPON') || deptName.includes('TAGAPAMAYAPA')) {
      allowedNames = [
        'View Cases', 'Create Case Entry', 'Archive Cases', 'Resolve & Finalize Case',
        'Manage Case notes', 'Manage Reports', 'Issue Referral', 'Update Case information',
        'Manage Conciliation'
      ]
    }

    if (allowedNames.length === 0) {
      return allPermissions
    }

    const allowedSet = new Set(allowedNames.map((n) => n.trim().toLowerCase()))
    const matched = allPermissions.filter((p) => {
      const pName = (p.permissionName || p.name || p.code || '').trim().toLowerCase()
      return allowedSet.has(pName)
    })

    const existingNamesLower = new Set(matched.map((p) => (p.permissionName || p.name || '').trim().toLowerCase()))
    const synthetic: Permission[] = []

    allowedNames.forEach((name, index) => {
      if (!existingNamesLower.has(name.trim().toLowerCase())) {
        synthetic.push({
          id: `syn-${index}-${name}`,
          name: name,
          permissionName: name,
          code: name.toUpperCase().replace(/\s+/g, '_'),
        })
      }
    })

    return [...matched, ...synthetic]
  }, [selectedDepartmentId, departments, allPermissions, isAdminAccount])

  const isGmailFormat = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(systemEmail.trim())
  const canSubmit = Boolean(
    user &&
    systemEmail.trim() &&
    isGmailFormat &&
    !emailError &&
    !isCheckingEmail &&
    (isAdminAccount || selectedDepartmentId)
  )

  const togglePermission = (id: string | number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    )
  }

  const handleSelectAllPermissions = () => {
    if (selectedPermissionIds.length === filteredPermissions.length) {
      setSelectedPermissionIds([])
    } else {
      setSelectedPermissionIds(filteredPermissions.map((p) => p.id))
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit || !user) return
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      if (isAdminAccount) {
        await userService.updateAdmin(user.id, {
          systemEmail: systemEmail.trim(),
          isActivated,
        })
      } else {
        const deptIdNumber = Number(selectedDepartmentId)
        const departmentIds = !isNaN(deptIdNumber) && deptIdNumber > 0 ? [deptIdNumber] : []

        const permIdsNumbers = selectedPermissionIds
          .map((pId) => Number(pId))
          .filter((pId) => !isNaN(pId) && pId > 0)

        await userService.updateUser(user.id, {
          systemEmail: systemEmail.trim(),
          departmentIds,
          permissionIds: permIdsNumbers,
          isActivated,
        })
      }

      const residentName = user.personInfo?.fullName || user.username || 'User'
      onSaved(residentName)
      onClose()
    } catch (error: unknown) {
      console.error('Failed to update account:', error)
      const msg = error instanceof Error ? error.message : 'Failed to update account. Please check backend server.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const userDisplayName = user?.personInfo?.fullName || user?.username || 'User'

  return (
    <FormModal
      open={open}
      title={`Edit ${isAdminAccount ? 'Admin' : 'User'} Account`}
      submitLabel="Save Changes"
      submitDisabled={!canSubmit || isSubmitting}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <p className="font-semibold text-rose-800">Account Update Error</p>
            <p className="mt-0.5">{submitError}</p>
          </div>
        )}

        {/* Resident / Identity Info (Read-only) */}
        <FormSection title="RESIDENT & IDENTITY">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Resident / User Name</label>
              <input
                type="text"
                disabled
                value={userDisplayName}
                className={`${inputClassName} bg-slate-100/70 text-slate-500 cursor-not-allowed`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  System Email <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{systemEmail.length}/100</span>
              </div>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={systemEmail}
                  onChange={(e) => setSystemEmail(e.target.value)}
                  placeholder="juan@gmail.com"
                  className={`${inputClassName} mt-0 pr-10 ${
                    emailError
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                      : isEmailAvailable
                      ? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-500'
                      : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  {isCheckingEmail ? (
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  ) : isEmailAvailable ? (
                    <CheckCircle2 size={19} className="text-emerald-500 fill-emerald-100" />
                  ) : emailError ? (
                    <XCircle size={19} className="text-rose-500" />
                  ) : null}
                </div>
              </div>
              {emailError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        {/* Access Setup (Only for non-admin User accounts) */}
        {!isAdminAccount && (
          <FormSection title="ACCESS SETUP">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Departments <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">
                    {isLoadingDropdowns ? 'Loading departments...' : 'Select a department'}
                  </option>
                  {userDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {formatDepartmentDisplayLabel(dept.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Permissions <span className="text-rose-500">*</span>
                  </label>
                  {filteredPermissions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                    >
                      {selectedPermissionIds.length === filteredPermissions.length ? 'Clear all' : 'Select all'}
                    </button>
                  )}
                </div>

                <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  {isLoadingDropdowns ? (
                    <p className="py-2 text-center text-xs text-slate-400">Loading permissions...</p>
                  ) : !selectedDepartmentId ? (
                    <p className="py-2 text-center text-xs text-slate-400">Select a department first.</p>
                  ) : filteredPermissions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-400">No permissions available for this department.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredPermissions.map((perm) => {
                        const isChecked = selectedPermissionIds.includes(perm.id)
                        const label = perm.permissionName || perm.name || perm.code
                        return (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Account Status */}
        <FormSection title="ACCOUNT STATUS">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActivated}
                onChange={(e) => setIsActivated(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span className="text-sm font-medium text-slate-700">
                Account Active
              </span>
            </label>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
