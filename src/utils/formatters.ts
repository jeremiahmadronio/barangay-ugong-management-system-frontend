export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  const normalized = dateString.includes(' ') && !dateString.includes('T') ? dateString.replace(' ', 'T') : dateString
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
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

