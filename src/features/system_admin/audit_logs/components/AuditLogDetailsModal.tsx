import { useMemo } from 'react'
import { ArrowRightLeft, CalendarClock, Globe, UserCircle2 } from 'lucide-react'
import { DetailsModal } from '@/components/ui'
import { DetailInfoCard } from '@/components/ui/details'
import { Badge } from '@/components/ui/table'
import type { AuditLogResponse } from '@/config/api/audit_logs/audit_logs.types'
import { formatDateTime, formatEnumLabel } from '@/utils/formatters'

interface AuditLogDetailsModalProps {
  open: boolean
  auditLog: AuditLogResponse | null
  onClose: () => void
}

const severityToneMap = {
  INFO: 'sky',
  WARNING: 'amber',
  CRITICAL: 'rose',
} as const

const moduleToneMap = {
  SECURITY: 'rose',
  SYSTEM: 'indigo',
  ROOT_ADMIN: 'indigo',
  ADMINISTRATION: 'indigo',
  USER_MANAGEMENT: 'sky',
  RESIDENTS: 'emerald',
  BLOTTER: 'amber',
  LUPON: 'violet',
  LUPONG_TAGAPAMAYAPA: 'violet',
  VAWC: 'rose',
  BCPC: 'indigo',
  CLEARANCE: 'emerald',
  FTJS: 'slate',
} as const

const HTTP_HEADER_PATTERN =
  /^(content-type|authorization|accept|cookie|host|user-agent|connection|cache-control|x-[\w-]+)$/i

const HIDDEN_FIELD_PATTERN =
  /^(statusCode|status_code|statusCodeValue|status_code_value|headers|requestHeaders|responseHeaders)$/i

function formatTimestamp(timestamp?: string) {
  return formatDateTime(timestamp)
}

function formatModuleLabel(module: string) {
  return formatEnumLabel(module) || 'System'
}

function formatAuditLogId(id?: number) {
  if (!id) return 'AUD-000000'
  return `AUD-${String(id).padStart(6, '0')}`
}

function humanizeFieldKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function tryParseValue(value?: string | null): unknown {
  if (!value?.trim()) return null

  try {
    return JSON.parse(value)
  } catch {
    return value.trim()
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHttpHeaderPayload(value: unknown) {
  if (!isPlainObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.every((key) => HTTP_HEADER_PATTERN.test(key))
}

function shouldSkipField(key: string) {
  return HTTP_HEADER_PATTERN.test(key) || HIDDEN_FIELD_PATTERN.test(key)
}

interface ChangeRow {
  field: string
  oldValue: unknown
  newValue: unknown
  changed: boolean
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2})/

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    if (ISO_DATE_PATTERN.test(value)) {
      const formatted = formatDateTime(value)
      if (formatted !== '—') return formatted
    }
    if (/^[A-Z0-9_]+$/.test(value) && value.includes('_')) {
      return formatEnumLabel(value)
    }
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None'
    return value.map((item) => formatDisplayValue(item)).join(', ')
  }
  return String(value)
}

function isDisplayEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  if (isHttpHeaderPayload(value)) return true
  if (isPlainObject(value)) return flattenDisplayEntries(value).length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function flattenDisplayEntries(value: unknown) {
  if (!isPlainObject(value)) {
    return [{ label: 'Value', value: formatDisplayValue(value) }]
  }

  return Object.entries(value)
    .filter(([key]) => !shouldSkipField(key))
    .map(([key, nested]) => ({
      label: humanizeFieldKey(key),
      value: formatDisplayValue(nested),
    }))
    .filter((entry) => entry.value !== '—')
}

function valuesEqual(left: unknown, right: unknown) {
  if (isPlainObject(left) && isPlainObject(right)) {
    return JSON.stringify(left) === JSON.stringify(right)
  }
  return formatDisplayValue(left) === formatDisplayValue(right)
}

function ChangeValueContent({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <p className="text-sm text-slate-500">—</p>
  }

  if (isPlainObject(value)) {
    const entries = flattenDisplayEntries(value)
    if (entries.length === 0) {
      return <p className="text-sm text-slate-500">—</p>
    }

    return (
      <dl className="space-y-2.5">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {entry.label}
            </dt>
            <dd className="mt-0.5 break-words text-sm leading-relaxed text-slate-700">
              {entry.value}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <p className="break-words text-sm leading-relaxed text-slate-700">
      {formatDisplayValue(value)}
    </p>
  )
}

function buildChangeRows(
  oldRaw?: string | null,
  newRaw?: string | null,
): ChangeRow[] {
  const oldParsed = tryParseValue(oldRaw)
  const newParsed = tryParseValue(newRaw)

  if (oldParsed === null && newParsed === null) {
    return []
  }

  if (isHttpHeaderPayload(oldParsed) || isHttpHeaderPayload(newParsed)) {
    return []
  }

  if (isPlainObject(oldParsed) || isPlainObject(newParsed)) {
    const oldObj = isPlainObject(oldParsed) ? oldParsed : {}
    const newObj = isPlainObject(newParsed) ? newParsed : {}
    const fields = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    const rows = [...fields]
      .filter((field) => !shouldSkipField(field))
      .map((field) => {
        const oldValue = oldObj[field]
        const newValue = newObj[field]
        return {
          field: humanizeFieldKey(field),
          oldValue,
          newValue,
          changed: !valuesEqual(oldValue, newValue),
        }
      })
      .filter((row) => {
        const oldEmpty = isDisplayEmpty(row.oldValue)
        const newEmpty = isDisplayEmpty(row.newValue)
        return !(oldEmpty && newEmpty)
      })

    if (rows.length > 0) return rows
  }

  const oldValue = oldParsed
  const newValue = newParsed

  if (isDisplayEmpty(oldValue) && isDisplayEmpty(newValue)) {
    return []
  }

  return [
    {
      field: 'Recorded change',
      oldValue,
      newValue,
      changed: !valuesEqual(oldValue, newValue),
    },
  ]
}

function AuditLogDetailsBody({ auditLog }: { auditLog: AuditLogResponse }) {
  const changeRows = useMemo(
    () => buildChangeRows(auditLog.oldValue, auditLog.newValue),
    [auditLog.oldValue, auditLog.newValue],
  )

  const hasFieldChanges = useMemo(() => {
    if (!auditLog.action) return false
    const act = auditLog.action.toUpperCase()
    // Non-edit actions (archive, restore, delete, login, logout, etc.) do not have field diffs
    if (
      act.includes('ARCHIVE') ||
      act.includes('RESTORE') ||
      act.includes('DELETE') ||
      act.includes('LOGIN') ||
      act.includes('LOGOUT')
    ) {
      return false
    }
    return changeRows.some((r) => !isDisplayEmpty(r.oldValue) && !isDisplayEmpty(r.newValue) && r.changed)
  }, [auditLog.action, changeRows])

  return (
    <div className="space-y-6">
      <DetailInfoCard
        title="Event metadata"
        columns={2}
        fields={[
          {
            label: 'User',
            value: (
              <div className="inline-flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-slate-400" />
                <span>{auditLog.userName || 'System'}</span>
              </div>
            ),
          },
          { label: 'Role', value: formatEnumLabel(auditLog.userRole) || 'System' },
          {
            label: 'Severity',
            value: (
              <Badge
                tone={
                  severityToneMap[auditLog.severity as keyof typeof severityToneMap] || 'slate'
                }
              >
                {formatEnumLabel(auditLog.severity)}
              </Badge>
            ),
          },
          {
            label: 'Module',
            value: (
              <Badge
                tone={moduleToneMap[auditLog.module as keyof typeof moduleToneMap] || 'slate'}
              >
                {formatModuleLabel(auditLog.module || 'SYSTEM')}
              </Badge>
            ),
          },
          {
            label: 'IP address',
            value: (
              <div className="inline-flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-xs text-slate-700">
                  {auditLog.ipAddress || '—'}
                </span>
              </div>
            ),
          },
          {
            label: 'Timestamp',
            value: (
              <div className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-400" />
                <span>{formatTimestamp(auditLog.timestamp)}</span>
              </div>
            ),
          },
        ]}
      />

      {hasFieldChanges && (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Changes summary</h3>
          </div>

          <div className="mt-5 space-y-4">
            {changeRows.map((row) => (
              <div
                key={row.field}
                className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.field}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div
                    className={`rounded-lg border px-3 py-2.5 ${
                      row.changed
                        ? 'border-rose-200/80 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Previous
                    </p>
                    <div className="mt-2">
                      <ChangeValueContent value={row.oldValue} />
                    </div>
                  </div>
                  <div
                    className={`rounded-lg border px-3 py-2.5 ${
                      row.changed
                        ? 'border-emerald-200/80 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Updated
                    </p>
                    <div className="mt-2">
                      <ChangeValueContent value={row.newValue} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {auditLog.reason ? (
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Reason: </span>
              {auditLog.reason}
            </p>
          ) : null}
        </section>
      )}
    </div>
  )
}

export function AuditLogDetailsModal({
  open,
  auditLog,
  onClose,
}: AuditLogDetailsModalProps) {
  const title = auditLog
    ? `Audit Event Log #${formatAuditLogId(auditLog.id)}`
    : 'Audit Event Log'

  return (
    <DetailsModal
      open={open}
      title={title}
      description={
        auditLog?.action
          ? `Action: ${formatEnumLabel(auditLog.action)}`
          : 'Review event metadata and captured field changes.'
      }
      maxWidthClass="max-w-3xl"
      onClose={onClose}
    >
      {auditLog ? (
        <AuditLogDetailsBody auditLog={auditLog} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          No audit log details available.
        </div>
      )}
    </DetailsModal>
  )
}
