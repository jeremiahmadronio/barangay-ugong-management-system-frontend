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

  return value
    .replace(/^ROLE_/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
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



