import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck,
  Calendar,
  Users,
  GraduationCap,
  PlusCircle,
  FileText,
  BarChart3,
  Archive,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { getReissuanceInsight } from '@/components/reports/reportInsightsHelper'
import { CardPill } from '@/components/reports/ChartCard'
import { Badge } from '@/components/ui/table/Badge'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type {
  FtjsDashboardSummaryDto,
  TrendReportResponse,
  IssuanceTypeDistributionResponse,
  FtjsTableDTO,
} from '@/config/api/ftjs/ftjs.types'

interface FtjsDashboardProps {
  onNavigateTab?: (tab: string) => void
}

const getSevenDaysAgoDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

export const FtjsDashboard: React.FC<FtjsDashboardProps> = ({ onNavigateTab }) => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FtjsDashboardSummaryDto | null>(null)
  const [trendData, setTrendData] = useState<TrendReportResponse | null>(null)
  const [issuanceData, setIssuanceData] = useState<IssuanceTypeDistributionResponse | null>(null)
  const [recentItems, setRecentItems] = useState<FtjsTableDTO[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const dateFrom = getSevenDaysAgoDate()
      const dateTo = getTodayDate()

      const [summaryRes, trendRes, issuanceRes, recentRes] = await Promise.all([
        ftjsService.getDashboardSummaryStats().catch(() => null),
        ftjsService.getTrendReport({ dateFrom, dateTo }).catch(() => null),
        ftjsService.getIssuanceTypeDistribution({ dateFrom, dateTo }).catch(() => null),
        ftjsService.getSummaryTable({ page: 0, size: 5, sort: 'id,desc' }).catch(() => null),
      ])

      setSummary(summaryRes)
      setTrendData(trendRes)
      setIssuanceData(issuanceRes)
      if (recentRes && recentRes.content) {
        setRecentItems(recentRes.content)
      }
    } catch (err) {
      console.error('Failed to fetch FTJS dashboard metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleActionClick = (targetTab: string, routePath: string) => {
    if (onNavigateTab) {
      onNavigateTab(targetTab)
    } else {
      navigate(routePath)
    }
  }

  // 1. Reusable Top KPI Stats Cards
  const kpiCards: StatCard[] = useMemo(() => {
    const issuedToday = summary?.issuedToday ?? 0
    const issuedThisWeek = summary?.issuedThisWeek ?? 0
    const femaleCount = summary?.femaleBeneficiaries ?? 0
    const femalePct = summary?.femalePercentage ?? 0
    const youthCount = summary?.youthEntrants ?? 0
    const youthPct = summary?.youthPercentage ?? 0
    const totalVolume = summary?.totalActiveVolume ?? 0

    return [
      {
        id: 'today-issued',
        label: 'Certificates Issued Today',
        title: 'Certificates Issued Today',
        value: issuedToday,
        hint: 'Original & re-issued certificates today',
        subtitle: 'Original & re-issued certificates today',
        icon: FileCheck,
        tone: 'emerald',
      },
      {
        id: 'week-issued',
        label: 'Issued This Week',
        title: 'Issued This Week',
        value: issuedThisWeek,
        hint: 'Current ISO calendar week volume',
        subtitle: 'Current ISO calendar week volume',
        icon: Calendar,
        tone: 'indigo',
      },
      {
        id: 'female-beneficiaries',
        label: 'Female Beneficiaries',
        title: 'Female Beneficiaries',
        value: femaleCount,
        hint: `${femalePct}% of total active records (${totalVolume})`,
        subtitle: `${femalePct}% of total active records (${totalVolume})`,
        icon: Users,
        tone: 'violet',
      },
      {
        id: 'youth-entrants',
        label: 'Youth Entrants (18-24)',
        title: 'Youth Entrants (18-24)',
        value: youthCount,
        hint: `${youthPct}% under RA 11261 criteria`,
        subtitle: `${youthPct}% under RA 11261 criteria`,
        icon: GraduationCap,
        tone: 'amber',
      },
    ]
  }, [summary])

  // 2. Fixed Last 7 Days Trend Data & Delta formatting
  const trendObj = useMemo(() => {
    return {
      granularityLabel: trendData?.granularityLabel || 'Daily',
      rangeLabel: trendData?.rangeLabel || 'Last 7 Days',
      points: (trendData?.points || []).map((p) => ({
        label: p.label,
        issued: p.issued ?? 0,
        pointDate: p.pointDate,
      })),
    }
  }, [trendData])

  const totalIssued = useMemo(() => {
    return trendObj.points.reduce((acc, p) => acc + (p.issued ?? 0), 0)
  }, [trendObj])

  const deltaObj = useMemo(() => {
    return {
      unit: 'day',
      current: totalIssued,
      previous: 0,
      percent: null,
      direction: 'up' as const,
    }
  }, [totalIssued])

  // 3. Quick Actions Config
  const ftjsQuickActions: QuickActionItem[] = useMemo(() => [
    {
      id: 'new-app',
      title: 'New FTJS Application',
      subtitle: 'Verify resident & issue new certificate',
      icon: PlusCircle,
      onClick: () => handleActionClick('issuance-form', '/ftjs/issuance-form'),
    },
    {
      id: 'management',
      title: 'FTJS Management Table',
      subtitle: 'Search, filter, view details & re-issue',
      icon: FileText,
      onClick: () => handleActionClick('management', '/ftjs/management'),
    },
    {
      id: 'reports',
      title: 'Reports & Executive PDF',
      subtitle: 'Detailed analytics & printable 2-page report',
      icon: BarChart3,
      onClick: () => handleActionClick('reports', '/ftjs/reports'),
    },
    {
      id: 'archive',
      title: 'Archive Vault & Trash',
      subtitle: 'Access archived records & retention settings',
      icon: Archive,
      onClick: () => handleActionClick('archive-vault', '/ftjs/archive-vault'),
    },
  ], [onNavigateTab, navigate])

  // 4. Donut Breakdown Data Formatting
  const issuanceItems = useMemo(() => {
    return (issuanceData?.points || []).map((p) => ({
      label: p.typeLabel,
      value: p.count,
    }))
  }, [issuanceData])

  const reissuanceInsight = useMemo(() => {
    const origCount = issuanceData?.points?.find((p) => p.typeLabel?.toLowerCase().includes('original'))?.count ?? 0
    const reissuanceCount = issuanceData?.points?.find((p) => p.typeLabel?.toLowerCase().includes('re-issuance') || p.typeLabel?.toLowerCase().includes('reissuance'))?.count ?? 0
    const totalVolume = issuanceData?.totalVolume ?? 0
    return getReissuanceInsight({ originalCount: origCount, reissuanceCount, totalVolume })
  }, [issuanceData])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="FTJS Dashboard"
        description="Real-time certificate issuance stats, 7-day trend analysis, and quick management actions."
      />

      {/* Top Reusable KPI Stats */}
      <StatsCards cards={kpiCards} loading={loading} />

      {/* Middle 2-Column Section (7-Day Trend Chart + Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Reusable Executive 7-Day Trend Chart (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <TrendPanel trend={trendObj} delta={deltaObj} />
        </div>

        {/* Right Column: Reusable Quick Actions Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <QuickActionsPanel
            title="Quick Actions"
            actions={ftjsQuickActions}
            className="h-full"
          />
        </div>
      </div>

      {/* Bottom 2-Column Section (Recent Issuances Mini Table + Original vs Re-issuance Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Recent Issuances Mini Table (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="h-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">Recent Issuances</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Latest 5 certificate releases recorded in system</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleActionClick('management', '/ftjs/management')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All Records <ArrowRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    Loading recent issuances...
                  </div>
                ) : recentItems.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center italic">
                    No recent issuances recorded.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                        <th className="pb-2 text-left font-semibold">APPLICATION NO.</th>
                        <th className="pb-2 text-left font-semibold">APPLICANT</th>
                        <th className="pb-2 text-left font-semibold">PURPOSE</th>
                        <th className="pb-2 text-center font-semibold">STATUS</th>
                        <th className="pb-2 text-right font-semibold">DATE SUBMITTED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {recentItems.map((r) => {
                        const isReissuance = r.status === 'RE_ISSUANCE' || r.issuanceCount > 1
                        return (
                          <tr
                            key={r.id}
                            onClick={() => handleActionClick('management', '/ftjs/management')}
                            className="text-xs font-medium text-slate-700 hover:bg-slate-50/70 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 pr-2 font-semibold text-slate-800 text-xs tracking-tight">{r.trackingNumber}</td>
                            <td className="py-2.5 pr-2 font-bold text-slate-900">{r.fullName}</td>
                            <td className="py-2.5 pr-2 text-slate-600 truncate max-w-[140px]" title={r.purpose}>
                              {r.purpose || 'Local Employment'}
                            </td>
                            <td className="py-2.5 pr-2 text-center">
                              <Badge tone={isReissuance ? 'sky' : 'emerald'}>
                                {isReissuance ? 'Re-issuance' : 'Issued'}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                              {r.dateSubmitted ? new Date(r.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <span className="text-[11px] text-slate-400 font-medium">
                Displaying 5 most recent entries
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Reusable Original vs Re-issuance Donut Card (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <BreakdownDonutCard
            className="h-full flex flex-col justify-between"
            title="Original vs Re-issuance"
            badge={<CardPill>Last 7 days</CardPill>}
            description="Share of first-time releases versus re-issuance/replacement requests"
            icon={RefreshCw}
            centerLabel="Total"
            variant="list"
            data={issuanceItems}
            totalValue={issuanceData?.totalVolume}
            insightMessage={reissuanceInsight}
          />
        </div>
      </div>
    </div>
  )
}
