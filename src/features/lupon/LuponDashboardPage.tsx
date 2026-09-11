import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale,
  Clock,
  Calendar,
  ShieldAlert,
  FileText,
  Archive,
  BarChart3,
  UserCheck,
  ScrollText,
  ArrowRight,
  User,
  MapPin,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { EmptyState } from '@/components/ui/table/EmptyState'
import {
  luponApi,
  type LuponDashboardKpiResponse,
} from '@/api/modules/lupon.api'
import type {
  DailyCaseTrendResponse,
  RecentBlotterCaseResponse,
  QuickMediationSummaryDto,
} from '@/api/modules/blotter.api'

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

const renderCleanStatusBadge = (statusStr?: string) => {
  const s = statusStr?.toUpperCase() || ''
  if (s.includes('SETTLED') || s.includes('RESOLVED')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-emerald-300 bg-emerald-50 text-emerald-600 uppercase">
        {statusStr}
      </span>
    )
  }
  if (s.includes('CONCILIATION') || s.includes('MEDIATION')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-indigo-300 bg-indigo-50 text-indigo-600 uppercase">
        {statusStr}
      </span>
    )
  }
  if (s.includes('CFA') || s.includes('CERTIFIED')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-purple-300 bg-purple-50 text-purple-600 uppercase">
        {statusStr}
      </span>
    )
  }
  if (s.includes('PENDING')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-amber-300/80 bg-amber-50/80 text-amber-600 uppercase">
        {statusStr}
      </span>
    )
  }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-slate-200 bg-slate-50 text-slate-600 uppercase">
      {statusStr}
    </span>
  )
}

export function LuponDashboardPage() {
  const navigate = useNavigate()
  const [kpiData, setKpiData] = useState<LuponDashboardKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [recentCases, setRecentCases] = useState<RecentBlotterCaseResponse[]>([])
  const [todayConciliations, setTodayConciliations] = useState<QuickMediationSummaryDto[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      const startDate = getSevenDaysAgoDate()
      const endDate = getTodayDate()

      const [kpisRes, trendRes, recentRes, conciliationsRes] = await Promise.all([
        luponApi.getDashboardKpi().catch(() => null),
        luponApi.getDailyTrend({ startDate, endDate }).catch(() => []),
        luponApi.getRecentCasesToday().catch(() => []),
        luponApi.getQuickTodayConciliations().catch(() => []),
      ])

      setKpiData(kpisRes)
      if (Array.isArray(trendRes)) setDailyTrend(trendRes)
      if (Array.isArray(recentRes)) setRecentCases(recentRes)
      if (Array.isArray(conciliationsRes)) setTodayConciliations(conciliationsRes)
    } catch (err) {
      console.error('Failed to fetch Lupon dashboard metrics:', err)
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

  // 4 Core Operational Dashboard KPI Cards using Reusable StatsCards
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'referred-this-week',
        label: 'Referred to Lupon (This Week)',
        value: isLoading ? '...' : (kpiData?.totalReferredThisWeek ?? 0).toLocaleString(),
        hint: formatDateRange(kpiData?.weekStartDate, kpiData?.weekEndDate),
        icon: Scale,
        tone: 'indigo',
      },
      {
        id: 'under-conciliation',
        label: 'Under Conciliation',
        value: isLoading ? '...' : (kpiData?.totalUnderConciliation ?? 0).toLocaleString(),
        hint: 'Active ongoing conciliations',
        icon: Clock,
        tone: 'amber',
      },
      {
        id: 'upcoming-conciliations',
        label: 'Upcoming Conciliations',
        value: isLoading ? '...' : (kpiData?.upcomingHearingsThisWeek ?? 0).toLocaleString(),
        hint: 'Scheduled hearings this week',
        icon: Calendar,
        tone: 'sky',
      },
      {
        id: 'total-cfa-issued',
        label: 'Total CFA Issued (This Week)',
        value: isLoading ? '...' : (kpiData?.totalCfaIssuedThisWeek ?? 0).toLocaleString(),
        hint: 'Certificates to File Action',
        icon: ShieldAlert,
        tone: 'rose',
      },
    ],
    [isLoading, kpiData]
  )

  // 7-Days Trend Data formatting for TrendPanel sourced from Lupon Reports
  const trendObj = useMemo(() => {
    return {
      granularityLabel: 'Daily',
      rangeLabel: 'Last 7 days',
      points: (dailyTrend || []).map((d) => ({
        label: d.label || d.date,
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

  // Reusable Quick Action items
  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'lupon-cases',
        title: 'Lupon Case Records',
        subtitle: 'Search, review conciliation docket & minutes',
        icon: FileText,
        onClick: () => navigate('/lupon/cases'),
      },
      {
        id: 'reports-analytics',
        title: 'Conciliation Analytics',
        subtitle: 'Settlement efficiency & monthly breakdown',
        icon: BarChart3,
        onClick: () => navigate('/lupon/reports'),
      },
      {
        id: 'archive-vault',
        title: 'Archive Vault & Trash',
        subtitle: 'Access archived conciliation files & recycle bin',
        icon: Archive,
        onClick: () => navigate('/lupon/archive'),
      },
      {
        id: 'resident-directory',
        title: 'Resident Directory',
        subtitle: 'Lookup official resident records and verification',
        icon: UserCheck,
        onClick: () => navigate('/residents'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="Lupon Operational Dashboard"
        description="Real-time monitoring of active conciliations, scheduled hearings, and department metrics."
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Reusable Stats Cards */}
      <StatsCards cards={statCards} />

      {/* Dashboard Middle Grid: Daily Conciliation Trend (7-cols) & Quick Actions (5-cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Daily Conciliation Trend Chart (Last 7 Days) */}
        <div className="lg:col-span-7 flex flex-col">
          <TrendPanel
            trend={trendObj}
            delta={deltaObj}
            title="Daily Conciliation Trend"
            description="Lupon cases referred and processed per day within the applied date range"
            valueNoun="cases"
          />
        </div>

        {/* Right: Reusable Quick Actions Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <QuickActionsPanel title="Quick Actions" actions={quickActions} className="h-full" />
        </div>
      </div>

      {/* Dashboard Bottom Grid: Recent Lupon Cases (7-cols) & Upcoming Conciliations (5-cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Recent Lupon Cases Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ScrollText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Lupon Cases</h2>
                  <p className="text-xs text-slate-500">Latest conciliations referred & updated today</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/lupon/cases')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer hover:underline transition-all"
              >
                View All Records <ArrowRight size={14} />
              </button>
            </div>

            {/* Recent Cases Table */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading recent Lupon cases...</div>
            ) : recentCases.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No new Lupon cases today."
                  description="No conciliation cases have been referred or updated today."
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
                      <th className="py-2.5 px-3">TIME REFERRED</th>
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

        {/* Right Column: Today's Scheduled Conciliations Widget */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upcoming Conciliations</h2>
                  <p className="text-xs text-slate-500">Scheduled conciliation hearings for today</p>
                </div>
              </div>
            </div>

            {/* Today's Conciliations List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading scheduled conciliations...</div>
            ) : todayConciliations.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No conciliations scheduled today"
                  description="There are no conciliation hearings scheduled for today."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {todayConciliations.map((m) => (
                  <div
                    key={m.sessionId || m.caseNumber}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Case #{m.caseNumber}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                        Hearing #{m.summonNumber || 1}
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
                        <MapPin size={12} className="shrink-0 text-slate-400" /> {m.venue || 'Lupon Office'}
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
