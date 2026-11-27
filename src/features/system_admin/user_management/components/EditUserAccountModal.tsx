import { useEffect, useMemo, useState }
 from 'react'
import { Pencil, X }
 from 'lucide-react'
import { FormModal }
 from '@/components/ui/FormModal'
import { FormSection }
 from '@/components/ui/FormSection'
import { maskEmail }
 from '@/utils/formatters'
import { sharedService } from '@/config/api/shared_api/shared.service'
import type { Department, Permission } from '@/config/api/shared_api/shared.types'
import { userService } from '@/config/api/users/users.service'
import type { UserDetailResponse, UserUpdateRequest } from '@/config/api/users/users.types'

interface EditUserAccountModalProps {
  open: boolean
  user: UserDetailResponse | null
  onClose: () => void
  onSaved: (name: string) => void
  customUpdateFn?: (userId: number, data: UserUpdateRequest) => Promise<void>
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


/** Returns true if department name represents Kapitana / Punong Barangay */
function isKapitanaDepartment(deptName?: string): boolean {
  if (!deptName) return false
  const upper = deptName.trim().toUpperCase()
  return (
    upper === 'KAPITANA' ||
    upper.includes('KAPITANA') ||
    upper.includes('PUNONG') ||
    upper.includes('BARANGAY CAPTAIN')
  )
}


export function EditUserAccountModal({
  open,
  user,
  onClose,
  onSaved,
  customUpdateFn,
}
: EditUserAccountModalProps) {
  const isAdminAccount = Boolean(user?.accountType?.toUpperCase().includes('ADMIN'))

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | number>('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<(string | number)[]>([])
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
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

  }
, [open])

  // Populate data when modal opens or user changes
  useEffect(() => {
    if (!open || !user) return
    setSubmitError(null)
    setIsChangingEmail(false)
    setNewEmail('')
    setIsActivated(user.status === 'ACTIVE')

    const initialDept = user.departments && user.departments.length > 0 ? user.departments[0] : null
    const initialDeptId = initialDept ? initialDept.id : ''
    setSelectedDepartmentId(initialDeptId)

    const isKap = initialDept ? isKapitanaDepartment(initialDept.name) : false
    if (isKap) {
      setSelectedPermissionIds([])
    }
 else {
      const initialPermIds = user.customPermissions ? user.customPermissions.map((p) => p.id) : []
      setSelectedPermissionIds(initialPermIds)
    }

  }
, [open, user])

  // Automatically clear permissions if Kapitana department is selected
  useEffect(() => {
    if (!selectedDepartmentId) {
      setSelectedPermissionIds([])
      return
    }

    const selectedDept = departments.find((d) => String(d.id) === String(selectedDepartmentId))
    if (selectedDept && isKapitanaDepartment(selectedDept.name)) {
      setSelectedPermissionIds([])
    }

  }
, [selectedDepartmentId, departments])

  // Filter out ADMIN / SYSTEM_ADMIN / PEACE from user creation department list
  const userDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const upper = (dept.name || '').trim().toUpperCase()
      return (
        upper !== 'ADMIN' &&
        upper !== 'SYSTEM_ADMIN' &&
        upper !== 'ROOTADMIN' &&
        !upper.includes('PEACE')
      )
    }
)
  }
, [departments])

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
        'File Complaint', 'View Cases', 'Manage Case Notes', 'Settled Case',
        'Dismiss Case', 'Issue Barangay Protection Order (BPO)', 'Manage Referral',
        'Edit Case', 'Archive Case', 'Delete Case', 'Permanent Delete Case', 'Restore Case'
      ]
    }
 else if (deptName.includes('BCPC') || deptName.includes('CHILDREN')) {
      allowedNames = [
        'File Complaint', 'View Cases', 'Dismiss Case', 'Close Case', 'Settled Case',
        'Edit Case', 'Manage Case Notes', 'Manage Custody & Turn Over', 'Manage Referral',
        'Manage Intervention & Monitoring', 'Archive Case', 'Delete Case',
        'Permanent Delete Case', 'Restore Case'
      ]
    }
 else if (deptName.includes('BLOTTER')) {
      allowedNames = [
        'File Complaint', 'View Cases', 'Manage Mediation', 'Manage Notes',
        'Settled Case', 'Dismiss Case', 'Edit Case', 'Escalate to Lupon',
        'Re-open Case', 'Archive Case', 'Delete Case', 'Permanent Delete Case', 'Restore Case'
      ]
    }
 else if (deptName.includes('CLEARANCE') || deptName.includes('CERTIFICATION')) {
      allowedNames = [
        'Issue Clearance', 'View Clearance', 'Archive Clearance',
        'Delete Clearance', 'Permanent Delete Clearance', 'Restore Clearance'
      ]
    }
 else if (deptName.includes('FTJS') || deptName.includes('JOB SEEKER')) {
      allowedNames = [
        'Issue FTJS', 'View FTJS', 'Re-issue FTJS', 'Manage FTJS Notes',
        'Archive FTJS', 'Delete FTJS', 'Permanent Delete FTJS', 'Restore FTJS'
      ]
    }
 else if (deptName.includes('LUPON') || deptName.includes('TAGAPAMAYAPA')) {
      allowedNames = [
        'View Cases', 'Manage Conciliation', 'Issue Certified to File Action (CFA)', 'Manage Case Notes',
        'Settled Case', 'Dismiss Case', 'Re-open Case', 'Archive Case', 'Delete Case',
        'Permanent Delete Case', 'Restore Case'
      ]
    }


    if (allowedNames.length === 0) {
      return allPermissions
    }


    const seenNames = new Set<string>()
    const result: Permission[] = []

    allowedNames.forEach((targetName, index) => {
      const normalizedTarget = targetName.trim().toLowerCase()
      if (seenNames.has(normalizedTarget)) return
      seenNames.add(normalizedTarget)

      // 1. Try exact match first
      let found = allPermissions.find((p) => {
        const pName = (p.permissionName || p.name || p.code || '').trim().toLowerCase()
        return pName === normalizedTarget
      }
)

      // 2. Comprehensive alias fallback if not exact match
      if (!found) {
        found = allPermissions.find((p) => {
          const pName = (p.permissionName || p.name || p.code || '').trim().toLowerCase()

          // Clearance specific aliases
          if (normalizedTarget.includes('clearance')) {
            if (!pName.includes('clearance')) return false
            if (normalizedTarget.includes('issue') && pName.includes('issue')) return true
            if (normalizedTarget.includes('view') && pName.includes('view')) return true
            if (normalizedTarget.includes('archive') && pName.includes('archive')) return true
            if (normalizedTarget.includes('permanent') && pName.includes('permanent')) return true
            if (normalizedTarget.includes('restore') && pName.includes('restore')) return true
            if (normalizedTarget.includes('delete') && !normalizedTarget.includes('permanent') && pName.includes('delete') && !pName.includes('permanent')) return true
            return false
          }


          // FTJS specific aliases
          if (normalizedTarget.includes('ftjs')) {
            if (!pName.includes('ftjs')) return false
            if (normalizedTarget.includes('re-issue') && (pName.includes('re-issue') || pName.includes('reissue') || pName.includes('re issuance'))) return true
            if (normalizedTarget.includes('issue') && !normalizedTarget.includes('re-issue') && pName.includes('issue') && !pName.includes('re-issue') && !pName.includes('reissue')) return true
            if (normalizedTarget.includes('view') && (pName.includes('view') || pName.includes('records'))) return true
            if ((normalizedTarget.includes('note') || normalizedTarget.includes('notes')) && (pName.includes('note') || pName.includes('notes'))) return true
            if (normalizedTarget.includes('archive') && pName.includes('archive')) return true
            if (normalizedTarget.includes('permanent') && pName.includes('permanent')) return true
            if (normalizedTarget.includes('restore') && pName.includes('restore')) return true
            if (normalizedTarget.includes('delete') && !normalizedTarget.includes('permanent') && pName.includes('delete') && !pName.includes('permanent')) return true
            return false
          }


          // Clearance specific aliases
          if (normalizedTarget.includes('clearance')) {
            if (!pName.includes('clearance')) return false
            if (normalizedTarget.includes('issue') && pName.includes('issue')) return true
            if (normalizedTarget.includes('view') && pName.includes('view')) return true
            if (normalizedTarget.includes('archive') && pName.includes('archive')) return true
            if (normalizedTarget.includes('permanent') && pName.includes('permanent')) return true
            if (normalizedTarget.includes('restore') && pName.includes('restore')) return true
            if (normalizedTarget.includes('delete') && !normalizedTarget.includes('permanent') && pName.includes('delete') && !pName.includes('permanent')) return true
            return false
          }


          // FTJS specific aliases
          if (normalizedTarget.includes('ftjs')) {
            if (!pName.includes('ftjs')) return false
            if (normalizedTarget.includes('re-issue') && (pName.includes('re-issue') || pName.includes('reissue') || pName.includes('re issuance'))) return true
            if (normalizedTarget.includes('issue') && !normalizedTarget.includes('re-issue') && pName.includes('issue') && !pName.includes('re-issue') && !pName.includes('reissue')) return true
            if (normalizedTarget.includes('view') && (pName.includes('view') || pName.includes('records'))) return true
            if ((normalizedTarget.includes('note') || normalizedTarget.includes('notes')) && (pName.includes('note') || pName.includes('notes'))) return true
            if (normalizedTarget.includes('archive') && pName.includes('archive')) return true
            if (normalizedTarget.includes('permanent') && pName.includes('permanent')) return true
            if (normalizedTarget.includes('restore') && pName.includes('restore')) return true
            if (normalizedTarget.includes('delete') && !normalizedTarget.includes('permanent') && pName.includes('delete') && !pName.includes('permanent')) return true
            return false
          }


          // BPO alias
          if (normalizedTarget.includes('bpo') && (pName.includes('bpo') || pName === 'issue bpo')) {
            return true
          }

          // Referral alias
          if (normalizedTarget.includes('referral') && (pName.includes('referral') || pName === 'issue referral' || pName === 'manage referral')) {
            return true
          }

          // Custody & Turn Over alias
          if ((normalizedTarget.includes('custody') || normalizedTarget.includes('turn over') || normalizedTarget.includes('turnover')) &&
              (pName.includes('custody') || pName.includes('turn over') || pName.includes('turnover'))) {
            return true
          }

          // Intervention & Monitoring alias
          if ((normalizedTarget.includes('intervention') || normalizedTarget.includes('monitoring')) &&
              (pName.includes('intervention') || pName.includes('monitoring'))) {
            return true
          }

          // Close Case alias
          if (normalizedTarget.includes('close') && (pName.includes('close') || pName === 'resolve & finalize case')) {
            return true
          }

          // Case notes alias
          if ((normalizedTarget.includes('note') || normalizedTarget.includes('notes')) && (pName.includes('note') || pName.includes('notes'))) {
            return true
          }

          // File Complaint / Case Entry alias
          if ((normalizedTarget.includes('complaint') || normalizedTarget.includes('case entry')) && (pName.includes('complaint') || pName.includes('case entry'))) {
            return true
          }

          // Settle alias
          if (normalizedTarget.includes('settle') && (pName.includes('settle') || pName === 'resolve & finalize case')) {
            return true
          }

          // Dismiss alias
          if (normalizedTarget.includes('dismiss') && pName.includes('dismiss')) {
            return true
          }

          // Edit Case / Update Case alias
          if ((normalizedTarget.includes('edit case') || normalizedTarget.includes('update case')) && (pName.includes('edit case') || pName.includes('update case'))) {
            return true
          }

          // Archive alias
          if (normalizedTarget.includes('archive') && pName.includes('archive')) {
            return true
          }

          // Restore alias
          if (normalizedTarget.includes('restore') && pName.includes('restore')) {
            return true
          }

          // Delete alias
          if (normalizedTarget === 'delete case' && (pName === 'delete case' || (pName.includes('delete') && !pName.includes('permanent')))) {
            return true
          }

          // Permanent delete alias
          if (normalizedTarget.includes('permanent') && pName.includes('permanent')) {
            return true
          }

          // CFA alias
          if (normalizedTarget.includes('cfa') && pName.includes('cfa')) {
            return true
          }

          // Lupon Escalation alias
          if (normalizedTarget.includes('lupon') && (pName.includes('lupon') || pName.includes('escalat'))) {
            return true
          }


          return false
        }
)
      }


      if (found) {
        result.push({
          ...found,
          permissionName: targetName,
          name: targetName,
        }
)
      }
 else {
        result.push({
          id: `syn-${index}
-${targetName}
`,
          name: targetName,
          permissionName: targetName,
          code: targetName.toUpperCase().replace(/\s+/g, '_'),
        }
)
      }

    }
)

    return result
  }
, [selectedDepartmentId, departments, allPermissions, isAdminAccount])

  const isEmailValid = !isChangingEmail || Boolean(
    newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())
  )

  const canSubmit = Boolean(
    user &&
    isEmailValid &&
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
    }
 else {
      setSelectedPermissionIds(filteredPermissions.map((p) => p.id))
    }

  }


  const handleSubmit = async () => {
    if (!canSubmit || !user) return
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const finalEmail = isChangingEmail && newEmail.trim() ? newEmail.trim() : (user.systemEmail || '')

      if (isAdminAccount) {
        await userService.updateAdmin(user.id, {
          systemEmail: finalEmail,
          isActivated,
        }
)
      }
 else {
        const deptIdNumber = Number(selectedDepartmentId)
        const departmentIds = !isNaN(deptIdNumber) && deptIdNumber > 0 ? [deptIdNumber] : []

        const selectedDept = departments.find((d) => String(d.id) === String(selectedDepartmentId))
        const isKap = selectedDept ? isKapitanaDepartment(selectedDept.name) : false

        const permIdsNumbers = isKap
          ? []
          : selectedPermissionIds
              .map((pId) => Number(pId))
              .filter((pId) => !isNaN(pId) && pId > 0)

        const updatePayload = {
          systemEmail: finalEmail,
          departmentIds,
          permissionIds: permIdsNumbers,
          isActivated,
        }


        if (customUpdateFn) {
          await customUpdateFn(user.id, updatePayload)
        }
 else {
          await userService.updateUser(user.id, updatePayload)
        }

      }


      const residentName = user.personInfo?.fullName || user.username || 'User'
      onSaved(residentName)
      onClose()
    }
 catch (error: unknown) {
      console.error('Failed to update account:', error)
      const msg = error instanceof Error ? error.message : 'Failed to update account. Please check backend server.'
      setSubmitError(msg)
    }
 finally {
      setIsSubmitting(false)
    }

  }


  const userDisplayName = user?.personInfo?.fullName || user?.username || 'User'

  return (
    <FormModal
      open={open}

      title={`Edit ${isAdminAccount ? 'Admin' : 'User'}
 Account`}

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
            <p className="mt-0.5">{submitError}
</p>
          </div>
        )}


        {/* Account Identity & Credentials */}

        <FormSection title="ACCOUNT IDENTITY & CREDENTIALS">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Resident / User Name</label>
              <input
                type="text"
                disabled
                value={userDisplayName}

                className={`${inputClassName}
 bg-slate-100/70 text-slate-500 cursor-not-allowed`}

              />
              <p className="mt-1 text-xs text-slate-400">
                Linked identity profile (managed in Resident Directory).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  System Email <span className="text-rose-500">*</span>
                </label>
                {!isChangingEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingEmail(true)
                      setNewEmail('')
                    }
}

                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <Pencil size={12}
 />
                    Change Email
                  </button>
                )}

              </div>

              {!isChangingEmail ? (
                <div className="mt-1.5">
                  <input
                    type="text"
                    disabled
                    value={maskEmail(user?.systemEmail)}

                    className={`${inputClassName}
 mt-0 bg-slate-100/70 text-slate-600 font-mono text-xs cursor-not-allowed`}

                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Email address is masked for data privacy. Click &ldquo;Change Email&rdquo; to assign a new address.
                  </p>
                </div>
              ) : (
                <div className="mt-1.5 space-y-1.5">
                  <div className="relative">
                    <input
                      type="email"
                      autoFocus
                      required
                      value={newEmail}

                      onChange={(e) => {
                        setNewEmail(e.target.value)
                        if (submitError) setSubmitError(null)
                      }
}

                      placeholder="Enter new email address (e.g. user@example.com)"
                      className={`${inputClassName}
 mt-0 pr-16`}

                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingEmail(false)
                        setNewEmail('')
                        if (submitError) setSubmitError(null)
                      }
}

                      className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={13}
 />
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 font-medium">
                    The existing email will be replaced with this new address upon saving.
                  </p>
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

                  onChange={(e) => {
                    const newDeptId = e.target.value
                    setSelectedDepartmentId(newDeptId)
                    setSelectedPermissionIds([])
                  }
}

                  className={inputClassName}

                >
                  <option value="">
                    {isLoadingDropdowns ? 'Loading departments...' : 'Select a department'}

                  </option>
                  {userDepartments.map((dept) => (
                    <option key={dept.id}
 value={dept.id}
>
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
                        const isChecked = selectedPermissionIds.some((id) => String(id) === String(perm.id))
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
                            <span>{label}
</span>
                          </label>
                        )
                      }
)}

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

