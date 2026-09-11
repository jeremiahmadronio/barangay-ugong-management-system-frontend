export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  const str = dateString.trim()
  if (!str) return '—'

  // Match YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10)
    const month = parseInt(isoMatch[2], 10) - 1
    const day = parseInt(isoMatch[3], 10)
    const date = new Date(year, month, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Match M/D/YYYY or MM/DD/YYYY
  const mdMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (mdMatch) {
    const month = parseInt(mdMatch[1], 10) - 1
    const day = parseInt(mdMatch[2], 10)
    const year = parseInt(mdMatch[3], 10)
    const date = new Date(year, month, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return str
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  const normalized = dateString.includes(' ') && !dateString.includes('T') ? dateString.replace(' ', 'T') : dateString
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return dateString

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${datePart}, ${timePart}`
}

export function formatEnumLabel(value?: string | null): string {
  if (!value?.trim()) return '—'

  const upper = value.trim().toUpperCase()
  const customMap: Record<string, string> = {
    LIST_VAWC_CASES_TABLE: 'View VAWC Cases List',
    LIST_VAWC_CASES: 'View VAWC Cases List',
    VIEW_VAWC_CASE: 'View VAWC Case Details',
    CREATE_VAWC_CASE: 'Create VAWC Case',
    ADD_VAWC_CASE_NOTE: 'Add VAWC Case Note',
    ACTIVATE_BPO: 'Issue / Activate BPO',
    SERVE_BPO: 'Serve BPO to Respondent',
    ISSUE_VAWC_REFERRAL: 'Issue VAWC Referral',
    RECORD_REFERRAL_FEEDBACK: 'Record Referral Feedback',
    ARCHIVE_VAWC_CASE: 'Archive VAWC Case',
    SOFT_DELETE_VAWC_CASE: 'Move VAWC Case to Trash',
    DELETE_VAWC_CASE_PERMANENT: 'Permanently Delete VAWC Case',
    PERMANENT_DELETE_VAWC_CASE: 'Permanently Delete VAWC Case',
    RESTORE_VAWC_CASE: 'Restore VAWC Case',
    // Blotter
    CREATE_BLOTTER_CASE: 'Create Blotter Case',
    UPDATE_BLOTTER_CASE: 'Update Blotter Case',
    UPDATE_CASE_STATUS: 'Update Case Status',
    REOPEN_CASE: 'Reopen Blotter Case',
    EXTEND_MEDIATION_PERIOD: 'Extend Mediation Period',
    SCHEDULE_MEDIATION_HEARING: 'Schedule Mediation Hearing',
    CANCEL_MEDIATION_HEARING: 'Cancel Mediation Hearing',
    RECORD_MEDIATION_MINUTES: 'Record Mediation Minutes',
    ADD_MEDIATION_FOLLOWUP: 'Add Mediation Follow-Up',
    ADD_BLOTTER_CASE_NOTE: 'Add Blotter Case Note',
    ARCHIVE_BLOTTER_CASE: 'Archive Blotter Case',
    RESTORE_BLOTTER_CASE: 'Restore Blotter Case',
    SOFT_DELETE_BLOTTER_CASE: 'Move Blotter Case to Trash',
    PERMANENT_DELETE_BLOTTER_CASE: 'Permanently Delete Blotter Case',
    REFER_CASE_TO_LUPON: 'Refer Case to Lupon',
    // Lupon
    SCHEDULE_CONCILIATION_HEARING: 'Schedule Conciliation Hearing',
    CANCEL_CONCILIATION_HEARING: 'Cancel Conciliation Hearing',
    RECORD_CONCILIATION_MINUTES: 'Record Conciliation Minutes',
    ADD_CONCILIATION_FOLLOWUP: 'Add Conciliation Follow-Up',
    EXTEND_CONCILIATION_PERIOD: 'Extend Conciliation Period',
    ARCHIVE_LUPON_CASE: 'Archive Lupon Case',
    RESTORE_LUPON_CASE: 'Restore Lupon Case',
    SOFT_DELETE_LUPON_CASE: 'Move Lupon Case to Trash',
    RESTORE_LUPON_CASE_FROM_TRASH: 'Restore Lupon Case from Trash',
    PERMANENT_DELETE_LUPON_CASE: 'Permanently Delete Lupon Case',
    // FTJS
    CREATE_FTJS_ENTRY: 'Issue FTJS Certificate',
    'CREATE_RE-ISSUANCE_REQUEST': 'Create FTJS Re-Issuance',
    ADD_FTJS_NOTE: 'Add FTJS Record Note',
    ARCHIVE_FTJS_RECORD: 'Archive FTJS Record',
    RESTORE_FTJS_RECORD: 'Restore FTJS Record',
    UPDATE_FTJS_RETENTION_SETTING: 'Update FTJS Retention Setting',
    SOFT_DELETE_FTJS_RECORD: 'Move FTJS Record to Trash',
    PERMANENT_DELETE_FTJS_RECORD: 'Permanently Delete FTJS Record',
    BATCH_PERMANENT_DELETE_FTJS_RECORDS: 'Batch Permanently Delete FTJS Records',
    UPDATE_OFFICER: 'Update Officer Profile',
    UPDATE_ADMIN: 'Update Admin Profile',
    UPDATE_USER_STATUS: 'Update User Account Status',
    LOCK_UNLOCK_USER: 'Lock / Unlock User Account',
    ARCHIVE_USER: 'Archive User Account',
    RESTORE_USER: 'Restore User Account',
    DELETE_USER: 'Soft Delete User Account',
    DELETE_USER_PERMANENT: 'Permanently Delete User Account',
    CREATE_OFFICER: 'Create Officer Account',
    CREATE_ADMIN: 'Create Admin Account',
    UPDATE_ARCHIVE_SETTINGS: 'Update Retention & Archive Policy',
    SOFT_DELETE_RESIDENT: 'Move Resident to Trash',
    DELETE_RESIDENT_PERMANENT: 'Permanently Delete Resident',
    RESTORE_RESIDENT: 'Restore Resident Profile',
    SOFT_DELETE_OFFICER: 'Move Officer to Trash',
    DELETE_OFFICER_PERMANENT: 'Permanently Delete Officer',
    RESTORE_OFFICER: 'Restore Officer Profile',
    LOGIN_ATTEMPT_LOCKED: 'Login Attempt on Locked Account',
    LOGIN_ATTEMPT_INACTIVE: 'Login Attempt on Inactive Account',
    VAWC: 'VAWC',
    BCPC: 'BCPC',
    FTJS: 'FTJS',
    OTP: 'OTP',
    MFA: 'MFA',
    IP: 'IP',
    BPO: 'BPO',
  }

  if (customMap[upper]) {
    return customMap[upper]
  }

  return value
    .replace(/^ROLE_/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bVawc\b/g, 'VAWC')
    .replace(/\bBcpc\b/g, 'BCPC')
    .replace(/\bFtjs\b/g, 'FTJS')
    .replace(/\bBpo\b/g, 'BPO')
    .replace(/\bOtp\b/g, 'OTP')
    .replace(/\bMfa\b/g, 'MFA')
    .replace(/\bIp\b/g, 'IP')
}

/**
 * Formats a person's name for compact table display.
 * Output: "Last Name, First Name M." (e.g. "Rivera, Quintin M.")
 * Falls back to the raw fullName string if individual parts are unavailable.
 */
export function formatTableName(opts: {
  firstName?: string | null
  lastName?: string | null
  middleName?: string | null
  fullName?: string | null
  fallback?: string | null
}): string {
  const { firstName, lastName, middleName, fullName, fallback } = opts

  if (lastName && firstName) {
    const mid = middleName?.trim()
    const initial = mid ? ` ${mid.charAt(0).toUpperCase()}.` : ''
    return `${lastName.trim()}, ${firstName.trim()}${initial}`
  }

  // If we only have a full name string, return it as-is (already stored cleanly)
  return fullName?.trim() || fallback?.trim() || '—'
}

/**
 * Masks an email address for privacy (e.g., madroniojeremiah49@gmail.com -> mad****49@gmail.com)
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email || '—'
  const [local, domain] = email.split('@')
  if (!local) return email

  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  if (local.length <= 4) {
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
  }
  if (local.length <= 6) {
    const first = local.slice(0, 2)
    const last = local.slice(-1)
    return `${first}${'*'.repeat(local.length - 3)}${last}@${domain}`
  }

  // Length > 6: keep first 3 chars and last 2 chars, mask middle with 4-6 asterisks
  const first = local.slice(0, 3)
  const last = local.slice(-2)
  const maskLen = Math.min(Math.max(local.length - 5, 3), 6)
  return `${first}${'*'.repeat(maskLen)}${last}@${domain}`
}

/**
 * Masks a name for confidentiality in compliance with VAWC & Data Privacy guidelines.
 * Examples:
 * - "Madronio, Jeremiah D." -> "M******, J."
 * - "Perez, Adelaida O." -> "P*****, A."
 * - "Jeremiah Madronio" -> "M******, J."
 */
export function maskConfidentialName(name?: string | null): string {
  if (!name || name === '—' || name === 'N/A' || name === 'Unspecified' || name === 'Anonymous') return '—'
  const trimmed = name.trim()
  if (!trimmed) return '—'

  // If already contains comma: "Last, First Middle"
  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map((s) => s.trim())
    const maskedLast = maskSingleWord(last)
    const firstInitial = first ? first.charAt(0).toUpperCase() + '.' : ''
    return firstInitial ? `${maskedLast}, ${firstInitial}` : maskedLast
  }

  // If "First Middle Last"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return maskSingleWord(parts[0])
  }

  const lastWord = parts[parts.length - 1]
  const firstInitial = parts[0].charAt(0).toUpperCase() + '.'
  const maskedLast = maskSingleWord(lastWord)
  return `${maskedLast}, ${firstInitial}`
}

function maskSingleWord(word: string): string {
  if (!word) return ''
  const clean = word.trim()
  if (clean.length <= 2) return clean.charAt(0).toUpperCase() + '*'
  const first = clean.charAt(0).toUpperCase()
  const maskCount = Math.min(Math.max(clean.length - 1, 3), 5)
  return first + '*'.repeat(maskCount)
}



