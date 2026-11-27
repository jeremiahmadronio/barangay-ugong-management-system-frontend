import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus2,
  Clock,
  Calendar,
  ShieldAlert,
  RefreshCw,
  FileText,
  Archive,
  BarChart3,
  ArrowRight,
  ScrollText,
  MapPin,
  User,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { EmptyState } from '@/components/ui/table/EmptyState'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { blotterService } from '@/config/api/blotter/blotter.service'
import type {
  BlotterDashboardKpiResponse,
  DailyCaseTrendResponse,
  RecentBlotterCaseResponse,
  QuickMediationSummaryDto,
} from '@/config/api/blotter/blotter.types'

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSevenDaysAgoDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return formatLocalDate(d)
}

const getTodayDate = () => {
  return formatLocalDate(new Date())
}

const formatDateRange = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return 'Mon – Sun'
  try {
    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startFormatted} – ${endFormatted} (Mon – Sun)`
  } catch {
    return `${startStr} to ${endStr}`
  }
}

const formatTrendDateLabel = (rawLabel?: string, rawDate?: string) => {
  if (rawLabel && !/^\d{4}-\d{2}-\d{2}$/.test(rawLabel)) {
    return rawLabel
  }
  const dateStr = rawLabel || rawDate
  if (!dateStr) return 'N/A'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const formatTimeOnly = (dateStr?: string) => {
  if (!dateStr) return 'TBA'
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

function getStatusConfig(rawStatus?: string): { label: string; tone: BadgeTone } {
  if (!rawStatus) return { label: 'Pending', tone: 'amber' }
  const s = rawStatus.toUpperCase()
  if (s.includes('SETTLED') || s.includes('RESOLVED')) {
    return { label: 'Settled', tone: 'emerald' }
  }
  if (s.includes('CONCILIATION')) {
    return { label: 'Under Conciliation', tone: 'indigo' }
  }
  if (s.includes('MEDIATION')) {
    return { label: 'Under Mediation', tone: 'sky' }
  }
  if (s.includes('CERTIFIED') || s.includes('CFA')) {
    return { label: 'Certified to File Action', tone: 'violet' }
  }
  if (s.includes('EXPIRED')) {
    return { label: 'Expired Unactioned', tone: 'rose' }
  }
  if (s === 'ON_GOING' || s === 'ON GOING') {
    return { label: 'On Going', tone: 'sky' }
  }
  if (s.includes('DISMISSED')) {
    return { label: 'Dismissed', tone: 'rose' }
  }
  if (s.includes('WITHDRAWN')) {
    return { label: 'Withdrawn', tone: 'rose' }
  }
  if (s.includes('RECORDED')) {
    return { label: 'Recorded', tone: 'slate' }
  }
  if (s.includes('PENDING')) {
    return { label: 'Pending', tone: 'amber' }
  }
  const formatted = rawStatus
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
  return { label: formatted, tone: 'slate' }
}

const renderCleanStatusBadge = (statusStr?: string) => {
  const { label, tone } = getStatusConfig(statusStr)
  return <Badge tone={tone}>{label}</Badge>
}

export function BlotterDashboardPage() {
  const navigate = useNavigate()
  const [kpiData, setKpiData] = useState<BlotterDashboardKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [recentCases, setRecentCases] = useState<RecentBlotterCaseResponse[]>([])
  const [todayMediations, setTodayMediations] = useState<QuickMediationSummaryDto[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      const startDate = getSevenDaysAgoDate()
      const endDate = getTodayDate()

      const [kpisRes, trendRes, recentRes, mediationsRes] = await Promise.all([
        blotterService.getDashboardKpi().catch(() => null),
        blotterService.getDailyTrend({ startDate, endDate }).catch(() => []),
        blotterService.getRecentCasesToday().catch(() => []),
        blotterService.getQuickTodayMediations().catch(() => []),
      ])

      setKpiData(kpisRes)
      if (Array.isArray(trendRes)) setDailyTrend(trendRes)
      if (Array.isArray(recentRes)) setRecentCases(recentRes)
      if (Array.isArray(mediationsRes)) setTodayMediations(mediationsRes)
    } catch (err) {
      console.error('Failed to fetch blotter dashboard metrics:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  // 1. 4 Key Operational Dashboard KPI Cards using system Reusable StatsCards
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'new-cases-this-week',
        label: 'New Cases (This Week)',
        value: isLoading ? '...' : (kpiData?.totalNewCasesThisWeek ?? 0).toLocaleString(),
        hint: formatDateRange(kpiData?.weekStartDate, kpiData?.weekEndDate),
        icon: FilePlus2,
        tone: 'indigo',
      },
      {
        id: 'needs-initial-action',
        label: 'Needs Initial Action',
        value: isLoading ? '...' : (kpiData?.totalPendingCases ?? 0).toLocaleString(),
        hint: 'Awaiting hearing schedule',
        icon: Clock,
        tone: 'amber',
      },
      {
        id: 'upcoming-mediations',
        label: 'Upcoming Mediations',
        value: isLoading ? '...' : (kpiData?.upcomingMediationsThisWeek ?? 0).toLocaleString(),
        hint: 'Scheduled hearings today',
        icon: Calendar,
        tone: 'sky',
      },
      {
        id: 'total-active-cases',
        label: 'Total Active Cases',
        value: isLoading ? '...' : (kpiData?.totalUnresolvedCases ?? 0).toLocaleString(),
        hint: 'Overall active workload',
        icon: ShieldAlert,
        tone: 'rose',
      },
    ],
    [isLoading, kpiData]
  )

  // 2. 7-Days Trend Data formatting for TrendPanel
  const trendObj = useMemo(() => {
    return {
      granularityLabel: 'Daily',
      rangeLabel: 'Last 7 days',
      points: (dailyTrend || []).map((d) => ({
        label: formatTrendDateLabel(d.label || d.dayLabel, d.date),
        issued: d.totalCases ?? 0,
        pointDate: d.date,
      })),
    }
  }, [dailyTrend])

  const totalVolume = useMemo(() => {
    return trendObj.points.reduce((acc, p) => acc + (p.issued ?? 0), 0)
  }, [trendObj])

  const deltaObj = useMemo(() => {
    return {
      unit: 'day',
      current: totalVolume,
      previous: 0,
      percent: null,
      direction: 'up' as const,
    }
  }, [totalVolume])

  // 3. Quick Actions List configuration
  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'file-complaint',
        title: 'File Formal Complaint',
        subtitle: 'Record a formal complaint for conciliation & mediation',
        icon: FilePlus2,
        onClick: () => navigate('/blotter/entry'),
      },
      {
        id: 'blotter-records',
        title: 'Blotter Desk Records',
        subtitle: 'Search, filter, view details & manage cases',
        icon: FileText,
        onClick: () => navigate('/blotter/records'),
      },
      {
        id: 'reports-analytics',
        title: 'Reports & Executive PDF',
        subtitle: 'Detailed analytics & printable 2-page report',
        icon: BarChart3,
        onClick: () => navigate('/blotter/reports'),
      },
      {
        id: 'archive-vault',
        title: 'Archive Vault & Trash',
        subtitle: 'Access archived records & retention settings',
        icon: Archive,
        onClick: () => navigate('/blotter/archive'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6">
      {/* --- PAGE HEADER --- */}
      <PageHeader
        title="Blotter Operational Dashboard"
        description="Real-time monitoring of active barangay complaints, scheduled mediations, and desk metrics."
      />

      {/* --- REUSABLE STATS CARDS (4 Operational Dashboard KPIs) --- */}
      <StatsCards cards={statCards} />

      {/* --- DASHBOARD MIDDLE GRID: Daily Case Filing Trend (7-cols) & Quick Actions (5-cols) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Daily Case Filing Trend Chart (Last 7 Days) */}
        <div className="lg:col-span-7 flex flex-col">
          <TrendPanel
            trend={trendObj}
            delta={deltaObj}
            title="Daily Case Filing Trend"
            description="Cases filed per day within the applied date range — each point is that day alone, not a running total"
            valueNoun="cases"
          />
        </div>

        {/* Right: Reusable Quick Actions Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <QuickActionsPanel title="Quick Actions" actions={quickActions} className="h-full" />
        </div>
      </div>

      {/* --- DASHBOARD BOTTOM GRID: Recent Blotter Cases Today (7-cols) & Upcoming Mediations (5-cols) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Recent Cases Table (Matching Exact Reference Design) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ScrollText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Blotter Cases</h2>
                  <p className="text-xs text-slate-500">Latest complaints filed today</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/blotter/records')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer hover:underline transition-all"
              >
                View All Records <ArrowRight size={14} />
              </button>
            </div>

            {/* Recent Cases Table */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading recent cases...</div>
            ) : recentCases.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No new cases filed today."
                  description="No blotter complaints have been recorded today."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-3">CASE / BLOTTER NO.</th>
                      <th className="py-2.5 px-3">COMPLAINANT</th>
                      <th className="py-2.5 px-3">RESPONDENT</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3">TIME FILED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentCases.map((c) => (
                      <tr key={c.id || c.caseNumber} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{c.caseNumber}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {c.filingType === 'FORMAL_COMPLAINT' ? 'Formal Complaint' : 'For the Record'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {c.complainantName}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {c.respondentName}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {renderCleanStatusBadge(c.status)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                          {formatTimeOnly(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Scheduled Mediations Widget */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upcoming Mediations</h2>
                  <p className="text-xs text-slate-500">Scheduled mediation hearings for today</p>
                </div>
              </div>
            </div>

            {/* Today's Mediations List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading scheduled mediations...</div>
            ) : todayMediations.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No mediations scheduled today"
                  description="There are no mediation hearings scheduled for today."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {todayMediations.map((m) => (
                  <div
                    key={m.sessionId || m.caseNumber}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Case #{m.caseNumber}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                        Summon #{m.summonNumber || 1}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <User size={13} className="text-slate-400 shrink-0" />
                      {m.partiesSummary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                        <Clock size={12} /> {formatTimeOnly(m.scheduledStart)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[170px]">
                        <MapPin size={12} className="shrink-0 text-slate-400" /> {m.venue || 'Office of Kapitana'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
