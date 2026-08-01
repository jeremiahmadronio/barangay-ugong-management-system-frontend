import { useEffect, useMemo, useState } from 'react'
import { USERS, type User } from '@/data/users'
import { FormModal } from './FormModal'
import { FormSection } from './FormSection'
import { SearchSelect, type SearchSelectOption } from './SearchSelect'

interface CreateAccountModalProps {
  open: boolean
  /** Pass a user to turn the same form into an edit experience. */
  account?: User | null
  onClose: () => void
  onSaved: (name: string, mode: 'create' | 'edit') => void
}

const DEPARTMENTS = ['BCPC', 'Clearance', 'Blotter', 'Lupon', 'VAWC', 'FTJS', 'Reports']

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-slate-50/40 focus:ring-0'

function usernameFromName(name: string) {
  return name.toLowerCase().trim().split(/\s+/).join('.')
}

/**
 * Reusable account form modal. Use `account` for Edit mode; omit it for Create mode.
 * The shared FormModal supplies the layout while this component owns account fields.
 */
export function CreateAccountModal({
  open,
  account = null,
  onClose,
  onSaved,
}: CreateAccountModalProps) {
  const [resident, setResident] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState(true)

  const isEdit = account !== null
  const availableDepartments = account?.departments[0] && !DEPARTMENTS.includes(account.departments[0])
    ? [account.departments[0], ...DEPARTMENTS]
    : DEPARTMENTS

  const residentOptions = useMemo<SearchSelectOption[]>(() => {
    const people = account && !USERS.some((user) => user.id === account.id) ? [...USERS, account] : USERS
    return people.map((user) => ({
      id: user.id,
      label: user.name,
      description: `${user.id.padStart(4, '0')} • ${user.departments[0] ?? 'Barangay resident'}`,
    }))
  }, [account])

  useEffect(() => {
    if (!open) return

    setResident(account?.name ?? '')
    setUsername(account ? usernameFromName(account.name) : '')
    setEmail(account?.email ?? '')
    setDepartment(account?.departments[0] ?? '')
    setRole(account?.role ?? '')
    setActive(account ? account.status === 'Active' : true)
  }, [account, open])

  const canSubmit = Boolean(resident && username && email && department && role)

  const submit = () => {
    onSaved(resident, isEdit ? 'edit' : 'create')
    onClose()
  }

  return (
    <FormModal
      open={open}
      title={isEdit ? 'Edit User Account' : 'Create User Account'}
      submitLabel={isEdit ? 'Update Account' : 'Create Account'}
      submitDisabled={!canSubmit}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="space-y-8">
        <FormSection title="Person & Account">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <SearchSelect
                label="Resident / Person"
                required
                value={resident}
                options={residentOptions}
                placeholder="Search by resident name…"
                emptyMessage="No matching resident found."
                onChange={setResident}
                onSelect={(option) => setResident(option.label)}
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Username <span className="text-rose-500">*</span>
              <input
                required
                maxLength={20}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. juan.delacruz"
                className={inputClassName}
              />
              <span className="mt-1 block text-right text-xs text-slate-400">{username.length}/20</span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              System Email <span className="text-rose-500">*</span>
              <input
                required
                type="email"
                maxLength={100}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@barangay.gov.ph"
                className={inputClassName}
              />
              <span className="mt-1 block text-right text-xs text-slate-400">{email.length}/100</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Access Setup">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Department <span className="text-rose-500">*</span>
              <select
                required
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className={inputClassName}
              >
                <option value="">Select a department</option>
                {availableDepartments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Role <span className="text-rose-500">*</span>
              <select
                required
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className={inputClassName}
              >
                <option value="">Select a role</option>
                <option value="Admin">Admin</option>
                <option value="Desk Officer">Desk Officer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <input
                id={account ? `active-account-${account.id}` : 'active-account'}
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-0"
              />
              <label
                htmlFor={account ? `active-account-${account.id}` : 'active-account'}
                className="cursor-pointer text-sm text-slate-600"
              >
                <span className="font-medium text-slate-800">Activate account immediately</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  The user can sign in once this account is {isEdit ? 'updated' : 'created'}.
                </span>
              </label>
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
