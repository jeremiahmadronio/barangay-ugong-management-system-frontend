import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck2,
  CalendarCheck,
  ShieldCheck,
  Award,
  FilePlus2,
  FileText,
  ChartNoAxesCombined,
  Archive,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { EmptyState } from '@/components/ui/table/EmptyState'
import { Badge } from '@/components/ui/table/Badge'
import {
  clearanceApi,
  type ClearanceDashboardKpiResponse,
  type ClearanceDailyTrendResponse,
  type IssuedCertificateTableResponse,
} from '@/api/modules/clearance.api'

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
  if (!startStr || !endStr) return 'Current Month'
  try {
    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startFormatted} – ${endFormatted}`
  } catch {
    return `${startStr} to ${endStr}`
  }
}

const formatTodayLabel = () => {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return { datePart: '—', timePart: '' }
  try {
    const d = new Date(dateStr)
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return { datePart, timePart }
  } catch {
    return { datePart: dateStr, timePart: '' }
  }
}

const formatRequestorName = (rawName?: string) => {
  if (!rawName || !rawName.trim()) return 'Unknown Requestor'
  const name = rawName.trim()
  if (name.includes(',')) return name
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`
  if (parts.length >= 3) {
    const last = parts[parts.length - 1]
    const first = parts[0]
    const middle = parts[1]
    return `${last}, ${first} ${middle.charAt(0).toUpperCase()}.`
  }
  return name
}

export function ClearanceDashboardPage() {
  const navigate = useNavigate()
  const [kpiData, setKpiData] = useState<ClearanceDashboardKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<ClearanceDailyTrendResponse[]>([])
  const [recentIssuances, setRecentIssuances] = useState<IssuedCertificateTableResponse[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const startDate = getSevenDaysAgoDate()
      const endDate = getTodayDate()

      const [kpisRes, trendRes, recentRes] = await Promise.all([
        clearanceApi.getDashboardKpi().catch(() => null),
        clearanceApi.getDailyTrend({ startDate, endDate }).catch(() => []),
        clearanceApi.getIssuedCertificates().catch(() => []),
      ])

      setKpiData(kpisRes)
      if (Array.isArray(trendRes)) setDailyTrend(trendRes)
      if (Array.isArray(recentRes)) setRecentIssuances(recentRes.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch clearance dashboard metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 1. 4 Key Operational Dashboard KPI Cards using system Reusable StatsCards
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-issued-today',
        label: 'Total Issued Today',
        value: isLoading ? '...' : (kpiData?.totalIssuedToday ?? 0).toLocaleString(),
        hint: formatTodayLabel(),
        icon: FileCheck2,
        tone: 'indigo',
      },
      {
        id: 'total-issued-this-week',
        label: 'Total Issued (This Week)',
        value: isLoading ? '...' : (kpiData?.totalIssuedThisWeek ?? 0).toLocaleString(),
        hint: formatDateRange(kpiData?.weekStartDate, kpiData?.weekEndDate),
        icon: CalendarCheck,
        tone: 'emerald',
      },
      {
        id: 'total-active-clearances',
        label: 'Total Active Clearances',
        value: isLoading ? '...' : (kpiData?.totalActiveClearances ?? 0).toLocaleString(),
        hint: 'Currently valid & active',
        icon: ShieldCheck,
        tone: 'sky',
      },
      {
        id: 'most-issued-cert-this-week',
        label: 'Most Issued Cert (This Week)',
        value: isLoading ? '...' : (kpiData?.mostIssuedCertThisWeek || '—'),
        hint: kpiData?.mostIssuedCertCountThisWeek
          ? `${kpiData.mostIssuedCertCountThisWeek.toLocaleString()} issued this week`
          : 'Top requested certificate',
        icon: Award,
        tone: 'amber',
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
        label: d.label || d.date,
        issued: d.totalIssued ?? 0,
        pointDate: d.date,
      })),
    }
  }, [dailyTrend])

  const totalVolume = useMemo(() => {
    return (dailyTrend || []).reduce((acc, curr) => acc + (curr.totalIssued || 0), 0)
  }, [dailyTrend])

  const deltaObj = useMemo(() => {
    return {
      direction: 'neutral' as const,
      percent: null,
      previous: 0,
      current: totalVolume,
      unit: 'period',
    }
  }, [totalVolume])

  // 3. Reusable Quick Actions for Clearance Desk
  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'issue-cert',
        title: 'Issue New Certificate',
        subtitle: 'Verify resident identity, preview & print clearance certification',
        icon: FilePlus2,
        onClick: () => navigate('/clearance/issue'),
      },
      {
        id: 'issued-list',
        title: 'Issued Records List',
        subtitle: 'Search, filter, view details & manage all released clearances',
        icon: FileText,
        onClick: () => navigate('/clearance/issued'),
      },
      {
        id: 'reports-analytics',
        title: 'Clearance Reports & Analytics',
        subtitle: 'Detailed issuance volume, template breakdown & printable PDF',
        icon: ChartNoAxesCombined,
        onClick: () => navigate('/clearance/reports'),
      },
      {
        id: 'archive-vault',
        title: 'Archive Vault & Trash',
        subtitle: 'Access archived records, recycle bin & retention settings',
        icon: Archive,
        onClick: () => navigate('/clearance/archive'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Clearance Operational Dashboard"
        description="Real-time monitoring of certificate issuances, validity tracking, and desk metrics."
      />

      {/* 2. Top Row: 4 KPI Cards */}
      <StatsCards cards={statCards} />

      {/* 3. Middle Row: Daily Issuance Trend (7-cols) & Quick Actions (5-cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Daily Clearance Issuance Trend Chart (Last 7 Days) */}
        <div className="lg:col-span-7 flex flex-col">
          <TrendPanel
            trend={trendObj}
            delta={deltaObj}
            title="Daily Clearance Issuance Trend"
            description="Clearances issued per day within the applied date range — each point is that day alone, not a running total"
            valueNoun="clearances"
          />
        </div>

        {/* Right: Reusable Quick Actions Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <QuickActionsPanel title="Quick Actions" actions={quickActions} className="h-full" />
        </div>
      </div>

      {/* 4. Bottom Row: Recent Clearances Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Clearance Issuances</h2>
                <p className="text-xs text-slate-500">Latest certificates released at the desk</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/clearance/issued')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer hover:underline transition-all"
            >
              View All Records <ArrowRight size={14} />
            </button>
          </div>

          {/* Recent Clearances Table */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading recent issuances...</div>
          ) : recentIssuances.length === 0 ? (
            <div className="py-8">
              <EmptyState
                title="No clearances issued yet today."
                description="Recently processed certificates will appear here in real-time."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">CONTROL NO.</th>
                    <th className="py-2.5 px-3">APPLICANT NAME</th>
                    <th className="py-2.5 px-3">CERTIFICATE TYPE</th>
                    <th className="py-2.5 px-3">PURPOSE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">DATE & TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentIssuances.map((c) => {
                    const isExpired = c.status?.toUpperCase() === 'EXPIRED'
                    const dt = formatDateTime(c.createdAt)
                    return (
                      <tr key={c.id || c.certNumber} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{c.certNumber}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {formatRequestorName(c.requestorName)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-normal text-sm">
                          {c.certTitle}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                          {c.purpose || 'General Purpose'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge tone={isExpired ? 'amber' : 'emerald'}>
                            {c.status ? c.status.toUpperCase() : 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{dt.datePart}</span>
                            {dt.timePart ? (
                              <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 font-normal">
                                <Clock size={11} className="text-slate-400" />
                                {dt.timePart}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
