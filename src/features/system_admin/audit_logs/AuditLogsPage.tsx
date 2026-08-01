import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Eye,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { PageHeader, StatsCards, type StatCard } from '@/components/ui'
import {
  Avatar,
  Badge,
  DataTable,
  type Column,
  type RowAction,
} from '@/components/ui/table'
import { auditLogsService } from '@/config/api/audit_logs/audit_logs.service'
import { formatDateTime, formatEnumLabel } from '@/utils/formatters'
import type {
  AuditLogPageResponse,
  AuditLogResponse,
  AuditLogStatsResponse,
} from '@/config/api/audit_logs/audit_logs.types'
import { AuditLogDetailsModal } from './components/AuditLogDetailsModal'

interface AuditLogFilters {
  search: string
  severity: string
  fromDate: string
  toDate: string
}

const EMPTY_PAGE: AuditLogPageResponse = {
  content: [],
  number: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  last: true,
  first: true,
}

const EMPTY_STATS: AuditLogStatsResponse = {
  totalEntries: 0,
  todayEntries: 0,
  warningCount: 0,
  criticalCount: 0,
}

const DEFAULT_FILTERS: AuditLogFilters = {
  search: '',
  severity: 'all',
  fromDate: '',
  toDate: '',
}

const severityToneMap = {
  INFO: 'sky',
  WARNING: 'amber',
  CRITICAL: 'rose',
} as const

function formatTimestamp(timestamp?: string) {
  return formatDateTime(timestamp)
}

function formatModuleLabel(module: string) {
  return formatEnumLabel(module) || 'System'
}

function normalizeDateRange(filters: AuditLogFilters) {
  if (!filters.fromDate || !filters.toDate || filters.fromDate <= filters.toDate) {
    return filters
  }

  return {
    ...filters,
    fromDate: filters.toDate,
    toDate: filters.fromDate,
  }
}

export function AuditLogsPage() {
  const [stats, setStats] = useState<AuditLogStatsResponse>(EMPTY_STATS)
  const [pageData, setPageData] = useState<AuditLogPageResponse>(EMPTY_PAGE)
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await auditLogsService.getAuditLogStats()
      setStats(response)
    } catch (error) {
      console.error('Failed to fetch audit log stats:', error)
      setStats(EMPTY_STATS)
    }
  }, [])

  const fetchAuditLogs = useCallback(async (filters: AuditLogFilters, page: number) => {
    setLoading(true)

    try {
      const normalizedFilters = normalizeDateRange(filters)
      const response = await auditLogsService.getAuditLogs({
        search: normalizedFilters.search.trim() || undefined,
        severity: normalizedFilters.severity !== 'all' ? normalizedFilters.severity : undefined,
        fromDate: normalizedFilters.fromDate || undefined,
        toDate: normalizedFilters.toDate || undefined,
        page: page - 1,
        size: 5,
      })

      setPageData(response)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setPageData(EMPTY_PAGE)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchAuditLogs(appliedFilters, currentPage)
  }, [appliedFilters, currentPage, fetchAuditLogs])

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        id: 'total-audit-entries',
        label: 'Total Entries',
        value: stats.totalEntries,
        hint: 'All recorded audit events',
        tone: 'indigo',
        icon: ShieldCheck,
      },
      {
        id: 'today-audit-entries',
        label: 'Today',
        value: stats.todayEntries,
        hint: 'Entries logged since midnight',
        tone: 'emerald',
        icon: Filter,
      },
      {
        id: 'warning-audit-entries',
        label: 'Warnings',
        value: stats.warningCount,
        hint: 'Sensitive actions to review',
        tone: 'amber',
        icon: AlertTriangle,
      },
      {
        id: 'critical-audit-entries',
        label: 'Critical',
        value: stats.criticalCount,
        hint: 'High-severity system activity',
        tone: 'rose',
        icon: ShieldAlert,
      },
    ],
    [stats]
  )

  const columns = useMemo<Column<AuditLogResponse>[]>(
    () => [
      {
        key: 'user',
        header: 'USER',
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.userName || 'System'} />
            <div className="min-w-0">
              <p className="font-semibold leading-tight text-slate-800">{row.userName || 'System'}</p>
              <p className="mt-0.5 text-xs leading-tight text-slate-400">
                {formatEnumLabel(row.userRole) || 'System'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'action',
        header: 'ACTION',
        render: (row) => (
          <span className="font-semibold text-slate-800">
            {formatEnumLabel(row.action) || '—'}
          </span>
        ),
      },
      {
        key: 'module',
        header: 'MODULE',
        render: (row) => (
          <span className="text-slate-600 font-medium text-xs">
            {formatModuleLabel(row.module || 'SYSTEM')}
          </span>
        ),
      },
      {
        key: 'timestamp',
        header: 'DATE & TIME',
        render: (row) => (
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {formatTimestamp(row.timestamp)}
          </span>
        ),
      },
      {
        key: 'ipAddress',
        header: 'IP ADDRESS',
        render: (row) => (
          <span className="font-mono text-xs text-slate-600">{row.ipAddress || '—'}</span>
        ),
      },
      {
        key: 'severity',
        header: 'SEVERITY',
        render: (row) => (
          <Badge tone={severityToneMap[row.severity as keyof typeof severityToneMap] || 'slate'}>
            {formatEnumLabel(row.severity) || 'Info'}
          </Badge>
        ),
      },
    ],
    []
  )

  const rowActions = useMemo<RowAction<AuditLogResponse>[]>(
    () => [
      {
        id: 'view-audit-log',
        label: 'View Details',
        icon: Eye,
        tone: 'default',
        onClick: (row) => setSelectedLog(row),
      },
    ],
    []
  )

  const hasDraftFilters = Object.values(draftFilters).some(
    (value) => value !== '' && value !== 'all'
  )

  const handleApplyFilters = () => {
    const normalized = normalizeDateRange(draftFilters)
    setDraftFilters(normalized)
    setAppliedFilters(normalized)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Logs"
        description="Monitor sensitive system activity, trace user actions, and review captured audit payloads from one workspace."
      />

      <StatsCards
        cards={statCards}
        emptyMessage={loading ? 'Loading audit statistics…' : 'No audit statistics available.'}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleApplyFilters()
        }}
        className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search by user, role, action, module, or IP…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="min-w-[140px]">
            <select
              value={draftFilters.severity}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, severity: event.target.value }))}
              className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="all">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="min-w-[150px]">
            <input
              type="date"
              value={draftFilters.fromDate}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="min-w-[150px]">
            <input
              type="date"
              value={draftFilters.toDate}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, toDate: event.target.value }))}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 cursor-pointer"
          >
            <Filter size={14} />
            Apply
          </button>

          {hasDraftFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </form>

      <DataTable
        data={pageData.content}
        columns={columns}
        rowKey={(row) => row.id}
        actions={rowActions}
        pageSize={10}
        serverPagination={{
          page: pageData.number + 1,
          pageCount: Math.max(pageData.totalPages, 1),
          totalItems: pageData.totalElements,
          pageSize: pageData.size || 10,
          onPageChange: setCurrentPage,
        }}
        header={(
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Audit Entry Registry</h2>
              <p className="text-xs text-slate-500">
                {loading
                  ? 'Refreshing audit entries...'
                  : `${pageData.totalElements} audit records matched your current filters.`}
              </p>
            </div>
          </div>
        )}
        emptyTitle="No audit logs found"
        emptyDescription="No audit entries matched your current filters. Try broadening the date range or search term."
      />

      <AuditLogDetailsModal
        open={Boolean(selectedLog)}
        auditLog={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  )
}
