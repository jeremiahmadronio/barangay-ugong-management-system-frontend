import { useEffect, useState } from 'react'
import { AlertTriangle, Search, Check, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { FormModal } from '@/components/ui/FormModal'
import { FormSection } from '@/components/ui/FormSection'
import { sharedService } from '@/config/api/shared_api/shared.service'
import type { PersonOption } from '@/config/api/shared_api/shared.types'
import { userService } from '@/config/api/users/users.service'

interface CreateAdminAccountModalProps {
  open: boolean
  onClose: () => void
  onSaved: (name: string) => void
}

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-slate-50/40 focus:ring-0'

export function CreateAdminAccountModal({
  open,
  onClose,
  onSaved,
}: CreateAdminAccountModalProps) {
  const [personQuery, setPersonQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null)
  const [personOptions, setPersonOptions] = useState<PersonOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [systemEmail, setSystemEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isEmailAvailable, setIsEmailAvailable] = useState(false)

  const [activateImmediately, setActivateImmediately] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Search residents autocomplete
  useEffect(() => {
    if (!open) return
    let isMounted = true

    const fetchPersons = async () => {
      setIsSearching(true)
      const results = await sharedService.searchAvailablePersons(personQuery)
      if (isMounted) {
        setPersonOptions(results)
        setIsSearching(false)
      }
    }

    const timer = setTimeout(fetchPersons, 200)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [personQuery, open])

  // Email format & backend availability check
  useEffect(() => {
    if (!open) return
    let isMounted = true

    const trimmed = systemEmail.trim()
    if (!trimmed) {
      setEmailError(null)
      setIsCheckingEmail(false)
      setIsEmailAvailable(false)
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

    const timer = setTimeout(async () => {
      try {
        const isTaken = await sharedService.checkEmailAvailability(trimmed)
        if (isMounted) {
          if (isTaken) {
            setEmailError('This email address is already in use by an active user.')
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
  }, [systemEmail, open])

  // Reset form on open
  useEffect(() => {
    if (!open) return
    setPersonQuery('')
    setSelectedPerson(null)
    setSystemEmail('')
    setEmailError(null)
    setSubmitError(null)
    setIsCheckingEmail(false)
    setIsEmailAvailable(false)
    setActivateImmediately(true)
  }, [open])

  const isGmailFormat = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(systemEmail.trim())
  const canSubmit = Boolean(selectedPerson && systemEmail.trim() && isGmailFormat && !emailError && !isCheckingEmail)

  const handleSubmit = async () => {
    if (!canSubmit || !selectedPerson) return
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await userService.createAdmin({
        personId: Number(selectedPerson.id),
        systemEmail: systemEmail.trim(),
        isActivated: activateImmediately,
      })
      onSaved(selectedPerson.fullName)
      onClose()
    } catch (error: unknown) {
      console.error('Failed to create admin account:', error)
      const msg = error instanceof Error ? error.message : 'Failed to create admin account. Please check backend server.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      title="Create Admin Account"
      submitLabel="Create Admin"
      submitDisabled={!canSubmit || isSubmitting}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <p className="font-semibold text-rose-800">Account Creation Error</p>
            <p className="mt-0.5">{submitError}</p>
          </div>
        )}

        {/* Select Resident */}
        <FormSection title="SELECT RESIDENT">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700">
                Search Resident <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  required
                  value={selectedPerson ? selectedPerson.fullName : personQuery}
                  onChange={(e) => {
                    setSelectedPerson(null)
                    setPersonQuery(e.target.value)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Type resident name..."
                  className={`${inputClassName} pl-10`}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  {isSearching ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400">Searching...</div>
                  ) : personOptions.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400">
                      No matching resident found.
                    </div>
                  ) : (
                    personOptions.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerson(person)
                          setPersonQuery(person.fullName)
                          setDropdownOpen(false)
                        }}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{person.fullName}</p>
                          <p className="text-xs text-slate-400">{person.completeAddress || `ID: ${person.id}`}</p>
                        </div>
                        {selectedPerson?.id === person.id && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                System Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  required
                  value={systemEmail}
                  onChange={(e) => setSystemEmail(e.target.value)}
                  placeholder="name@gmail.com"
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

        {/* Account Status */}
        <FormSection title="ACCOUNT STATUS">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={activateImmediately}
              onChange={(e) => setActivateImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span className="text-sm font-medium text-slate-700">
              Activate account immediately
            </span>
          </label>
        </FormSection>

        {/* Warning Box */}
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/70 p-4 text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-xs leading-relaxed">
            <strong className="font-semibold text-red-900">Important:</strong> Admin accounts have elevated privileges. Ensure proper authorization before creating this account. All admin actions are logged in the audit trail.
          </p>
        </div>
      </div>
    </FormModal>
  )
}
