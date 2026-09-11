import { useMemo } from 'react'
import {
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Globe,
  Info,
  Shield,
  ShieldAlert,
  UserCircle2,
} from 'lucide-react'
import { DetailsModal } from '@/components/ui'
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
    return <p className="text-xs text-slate-500">—</p>
  }

  if (isPlainObject(value)) {
    const entries = flattenDisplayEntries(value)
    if (entries.length === 0) {
      return <p className="text-xs text-slate-500">—</p>
    }

    return (
      <dl className="space-y-2.5">
        {entries.map((entry) => (
          <div key={entry.label} className="flex flex-col">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {entry.label}
            </dt>
            <dd className="mt-0.5 break-words text-xs font-medium leading-relaxed text-slate-700">
              {entry.value}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <p className="break-words text-xs font-medium leading-relaxed text-slate-700">
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

  // For archive/delete/restore: oldValue has the request payload (remarks, caseId).
  // For create/update: newValue has the resulting record.
  const singlePayload = useMemo(() => {
    if (hasFieldChanges) return null
    const act = auditLog.action?.toUpperCase() ?? ''
    const isStateChangeOnly =
      act.includes('ARCHIVE') ||
      act.includes('RESTORE') ||
      act.includes('DELETE') ||
      act.includes('LOGIN') ||
      act.includes('LOGOUT')

    if (isStateChangeOnly) {
      const parsedOld = tryParseValue(auditLog.oldValue)
      if (!isDisplayEmpty(parsedOld)) return parsedOld
      const parsedNew = tryParseValue(auditLog.newValue)
      if (!isDisplayEmpty(parsedNew)) return parsedNew
    } else {
      const parsedNew = tryParseValue(auditLog.newValue)
      if (!isDisplayEmpty(parsedNew)) return parsedNew
      const parsedOld = tryParseValue(auditLog.oldValue)
      if (!isDisplayEmpty(parsedOld)) return parsedOld
    }
    return null
  }, [auditLog.newValue, auditLog.oldValue, auditLog.action, hasFieldChanges])

  const singlePayloadEntries = useMemo(() => {
    if (!singlePayload) return []
    if (typeof singlePayload === 'number') {
      return [{ label: 'Case / Record ID', value: String(singlePayload) }]
    }
    if (!isPlainObject(singlePayload)) return []
    return flattenDisplayEntries(singlePayload)
  }, [singlePayload])

  const actionLabel = formatEnumLabel(auditLog.action)
  const moduleLabel = formatEnumLabel(auditLog.module)
  const roleLabel = formatEnumLabel(auditLog.userRole)

  return (
    <div className="space-y-5">
      {/* Activity Narrative Summary Banner */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 shadow-2xs">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
          <Shield size={16} />
        </div>
        <div className="min-w-0 flex-1 leading-relaxed">
          <p className="font-semibold text-slate-900 text-sm">
            {actionLabel}
          </p>
          <p className="mt-1 text-slate-600">
            User <strong className="text-slate-800">{auditLog.userName || 'System'}</strong> ({roleLabel}) performed this action on the <strong className="text-blue-700">{moduleLabel}</strong> desk.
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <UserCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">User Account</p>
            <p className="font-semibold text-slate-800 text-xs truncate">{auditLog.userName || 'System'}</p>
            <p className="text-[11px] text-slate-500 truncate">{roleLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <CalendarClock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Timestamp</p>
            <p className="font-semibold text-slate-800 text-xs">{formatTimestamp(auditLog.timestamp)}</p>
            <p className="text-[11px] text-slate-400">Event log time</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Globe size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">IP Address</p>
            <p className="font-mono text-xs font-semibold text-slate-800">{auditLog.ipAddress || '—'}</p>
            <p className="text-[11px] text-slate-400">Client network origin</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ShieldAlert size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Module &amp; Severity</p>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <Badge tone={moduleToneMap[auditLog.module as keyof typeof moduleToneMap] || 'slate'}>
                {moduleLabel}
              </Badge>
              <Badge tone={severityToneMap[auditLog.severity as keyof typeof severityToneMap] || 'slate'}>
                {formatEnumLabel(auditLog.severity)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks / Reason — from @LogAudit annotation */}
      {auditLog.reason && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <Info size={14} className="text-amber-600" />
            <span>Remarks / Reason</span>
          </div>
          <p className="mt-1 text-slate-700 leading-relaxed">{auditLog.reason}</p>
        </div>
      )}

      {/* Field Changes Comparison (For Updates/Edits) */}
      {hasFieldChanges && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Changes Summary</h3>
          </div>

          <div className="mt-3.5 space-y-3">
            {changeRows.map((row) => (
              <div
                key={row.field}
                className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {row.field}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div
                    className={`rounded-lg border px-3 py-2 ${
                      row.changed
                        ? 'border-rose-200/80 bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Previous
                    </p>
                    <div className="mt-1">
                      <ChangeValueContent value={row.oldValue} />
                    </div>
                  </div>
                  <div
                    className={`rounded-lg border px-3 py-2 ${
                      row.changed
                        ? 'border-emerald-200/80 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Updated
                    </p>
                    <div className="mt-1">
                      <ChangeValueContent value={row.newValue} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Details — payload from archive request / created record / caseId */}
      {!hasFieldChanges && singlePayloadEntries.length > 0 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Action Details</h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {singlePayloadEntries.map((entry) => (
              <div key={entry.label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{entry.label}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800 break-words">{entry.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fallback — no payload captured */}
      {!hasFieldChanges && singlePayloadEntries.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-500 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>This event was recorded without additional data payload. The action was completed successfully.</span>
        </div>
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
          : 'Review event metadata and recorded details.'
      }
      maxWidthClass="max-w-2xl"
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
