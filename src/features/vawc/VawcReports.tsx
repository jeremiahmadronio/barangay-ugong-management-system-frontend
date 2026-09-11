import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  HeartHandshake,
  Share2,
  Award,
  FileX2,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { BlotterReportFilters, type BlotterFilterState } from '@/components/reports/BlotterReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard, type BreakdownItem } from '@/components/reports/BreakdownDonutCard'
import { ReportTableCard, type ColumnDef } from '@/components/reports/ReportTableCard'
import { Badge } from '@/components/ui/table/Badge'
import {
  vawcApi,
  type VawcReportKpiResponse,
  type VawcAgencyReferralBreakdownResponse,
  type VawcTableRowResponse,
} from '@/api/modules/vawc.api'
import type {
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
} from '@/api/modules/blotter.api'
import { formatDate, maskConfidentialName } from '@/utils/formatters'
import type { Delta, TrendResult } from '@/components/reports/utils/Analytics'

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSixMonthsAgoDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return formatLocalDate(d)
}

const getTodayDate = () => {
  return formatLocalDate(new Date())
}

const DEFAULT_FILTERS: BlotterFilterState = {
  dateFrom: getSixMonthsAgoDate(),
  dateTo: getTodayDate(),
}

// Curated agency brand color palette
const AGENCY_COLORS: Record<string, string> = {
  'CSWD / DSWD': '#10B981', // Emerald
  'PNP - WCPD': '#3B82F6', // Blue
  "Public Attorney's Office (PAO)": '#8B5CF6', // Purple
  'City Health / Medical Hospital': '#EC4899', // Pink
  'Others / NGOs': '#F59E0B', // Amber
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  BPO_ISSUED: '#0EA5E9',
  BPO_SERVED: '#10B981',
  ISSUED_REFERRAL: '#6366F1',
  DECLINED_REFERRAL: '#F43F5E',
  SETTLED: '#059669',
  DISMISSED: '#64748B',
  WITHDRAWN: '#94A3B8',
  EXPIRED_UNACTIONED: '#E11D48',
}

export const VawcReports: React.FC = () => {
  // Filter States
  const [draftFilters, setDraftFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<VawcReportKpiResponse | null>(null)
  const [agencyBreakdown, setAgencyBreakdown] = useState<VawcAgencyReferralBreakdownResponse[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyCaseTrendResponse[]>([])
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [statusData, setStatusData] = useState<CaseStatusBreakdownResponse | null>(null)
  const [recordsData, setRecordsData] = useState<VawcTableRowResponse[]>([])

  // Fetch all VAWC reports data
  const fetchAllReports = useCallback(async () => {
    setLoading(true)
    try {
      const { dateFrom, dateTo } = appliedFilters

      const [kpiRes, agencyRes, monthlyRes, dailyRes, statusRes, recordsRes] =
        await Promise.allSettled([
          vawcApi.getReportKpi(dateFrom, dateTo),
          vawcApi.getAgencyReferralBreakdown(dateFrom, dateTo),
          vawcApi.getMonthlyTrendReport(dateFrom, dateTo),
          vawcApi.getDailyTrendReport(dateFrom, dateTo),
          vawcApi.getStatusBreakdownReport(dateFrom, dateTo),
          vawcApi.getReportRecords(dateFrom, dateTo),
        ])

      if (kpiRes.status === 'fulfilled') setKpiData(kpiRes.value)
      if (agencyRes.status === 'fulfilled') setAgencyBreakdown(agencyRes.value)
      if (monthlyRes.status === 'fulfilled') setMonthlyTrend(monthlyRes.value)
      if (dailyRes.status === 'fulfilled') setDailyTrend(dailyRes.value)
      if (statusRes.status === 'fulfilled') setStatusData(statusRes.value)
      if (recordsRes.status === 'fulfilled') setRecordsData(recordsRes.value)
    } catch (err) {
      console.error('Failed to fetch VAWC reports:', err)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchAllReports()
  }, [fetchAllReports])

  const handleDraftChange = (next: BlotterFilterState) => {
    setDraftFilters(next)
    setDirty(true)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
    setDirty(false)
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setDirty(false)
  }

  // 1. KPI Stat Cards Definition
  const statCards: StatCard[] = useMemo(() => {
    const mostAgencyText =
      kpiData?.mostReferredAgency && kpiData.mostReferredAgency !== 'None Yet'
        ? kpiData.mostReferredAgency
        : 'None Yet'

    const mostAgencyHint =
      kpiData?.mostReferredAgencyCount && kpiData.mostReferredAgencyCount > 0
        ? `${kpiData.mostReferredAgencyCount} referrals (${kpiData.mostReferredAgencySuccessRate.toFixed(1)}% success)`
        : 'No referrals in period'

    return [
      {
        id: 'total_cases',
        label: 'Total VAWC Cases',
        value: kpiData?.totalCases ?? 0,
        hint: 'Total complaints in selected period',
        icon: HeartHandshake,
        tone: 'indigo',
      },
      {
        id: 'total_referred',
        label: 'Total Referred Cases',
        value: kpiData?.totalReferredCases ?? 0,
        hint: 'Endorsed to partner agencies',
        icon: Share2,
        tone: 'sky',
      },
      {
        id: 'most_agency',
        label: 'Most Agency Success Referred',
        value: mostAgencyText,
        hint: mostAgencyHint,
        icon: Award,
        tone: 'emerald',
      },
      {
        id: 'total_dismissed',
        label: 'Total Dismissed Cases',
        value: kpiData?.totalDismissedCases ?? 0,
        hint: 'Dismissed / unactioned complaints',
        icon: FileX2,
        tone: 'rose',
      },
    ]
  }, [kpiData])

  // 2. Trend Panel Data (Monthly vs Daily based on date range duration)
  const diffDays = useMemo(() => {
    if (!appliedFilters.dateFrom || !appliedFilters.dateTo) return 180
    const start = new Date(appliedFilters.dateFrom).getTime()
    const end = new Date(appliedFilters.dateTo).getTime()
    return Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)))
  }, [appliedFilters])

  const useDailyTrend = diffDays <= 31 && dailyTrend.length > 0
  const activeTrendList = useDailyTrend ? dailyTrend : monthlyTrend

  const trendData: TrendResult = useMemo(() => {
    const points = activeTrendList.map((item: any, index: number) => ({
      key: item.pointDate || item.date || item.monthLabel || item.dayLabel || `point-${index}`,
      label: item.label || item.dayLabel || item.monthLabel || 'N/A',
      issued: item.totalCases ?? 0,
      original: item.totalCases ?? 0,
      reissued: 0,
    }))

    const dateRangeLabel =
      appliedFilters.dateFrom && appliedFilters.dateTo
        ? `${new Date(appliedFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(appliedFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'Selected Date Range'

    return {
      granularity: useDailyTrend ? 'daily' : 'monthly',
      granularityLabel: useDailyTrend ? 'Daily' : 'Monthly',
      rangeLabel: dateRangeLabel,
      unit: useDailyTrend ? 'day' : 'month',
      points,
    }
  }, [activeTrendList, useDailyTrend, appliedFilters])

  const trendDelta: Delta = useMemo(() => {
    const current = kpiData?.totalCases ?? 0
    return {
      current,
      previous: 0,
      percent: null,
      direction: 'up',
      unit: useDailyTrend ? 'day' : 'month',
    }
  }, [kpiData, useDailyTrend])

  // 3. Case Status Breakdown Donut Data
  const statusDonutData: BreakdownItem[] = useMemo(() => {
    if (!statusData?.breakdown) return []
    return statusData.breakdown.map((item) => ({
      label: item.label,
      value: item.count,
      color: STATUS_COLORS[item.status] || '#64748B',
    }))
  }, [statusData])

  // 5. Table Columns Definition
  const columns: ColumnDef<VawcTableRowResponse>[] = [
    {
      key: 'caseNumber',
      header: 'CASE NO.',
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.caseNumber || '—'}</span>
      ),
    },
    {
      key: 'complainant',
      header: 'COMPLAINANT',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {maskConfidentialName(row.complainant || (row as any).complainantFullName || '—')}
        </span>
      ),
    },
    {
      key: 'respondent',
      header: 'RESPONDENT',
      render: (row) => (
        <span className="font-medium text-slate-800">
          {maskConfidentialName(row.respondent || (row as any).respondentFullName || '—')}
        </span>
      ),
    },
    {
      key: 'natureOfComplaint',
      header: 'NATURE / VIOLATION',
      render: (row) => (
        <span className="text-slate-600 line-clamp-1">{row.natureOfComplaint || 'VAWC Violation'}</span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => {
        const s = String(row.status || (row as any).caseStatus || '').toUpperCase()
        let tone: 'emerald' | 'amber' | 'sky' | 'rose' | 'slate' | 'indigo' = 'slate'
        let label = s.replace(/_/g, ' ')

        if (s.includes('SETTLED') || s.includes('RESOLVED')) {
          tone = 'emerald'
          label = 'Settled'
        } else if (s.includes('REFERRAL') || s.includes('REFERRED')) {
          tone = s.includes('DECLINED') ? 'rose' : 'indigo'
          label = s.includes('DECLINED') ? 'Declined Referral' : 'Referred'
        } else if (s.includes('BPO_SERVED')) {
          tone = 'emerald'
          label = 'BPO Served'
        } else if (s.includes('BPO_ISSUED')) {
          tone = 'sky'
          label = 'BPO Issued'
        } else if (s.includes('PENDING')) {
          tone = 'amber'
          label = 'Pending'
        } else if (s.includes('DISMISSED') || s.includes('WITHDRAWN')) {
          tone = 'rose'
          label = s.includes('DISMISSED') ? 'Dismissed' : 'Withdrawn'
        }

        return <Badge tone={tone}>{label}</Badge>
      },
    },
    {
      key: 'dateFiled',
      header: 'DATE FILED',
      render: (row) => (
        <span className="text-slate-500 font-medium">{formatDate(row.dateFiled || row.createdAt)}</span>
      ),
    },
  ]

  // Status Breakdown Chart Insights
  const statusInsight = useMemo(() => {
    if (!statusData || statusData.totalCases === 0) {
      return 'This chart displays the percentage distribution across VAWC case disposition statuses. No active case records were found within the applied date range.'
    }
    const top = statusData.breakdown && statusData.breakdown.length > 0 ? statusData.breakdown[0] : null
    if (!top || top.count === 0) {
      return 'All logged complaints are actively being processed under standard VAWC protection protocols.'
    }
    return `This chart displays the percentage distribution across VAWC case disposition statuses. Currently, ${top.label} represents the largest share with ${top.count} cases (${top.percentage.toFixed(1)}% of total volume).`
  }, [statusData])

  const statusSecondaryInsight = useMemo(() => {
    if (!statusData || statusData.totalCases === 0) return undefined
    const bpoCount =
      statusData.breakdown?.filter(
        (b) => String(b.status).includes('BPO')
      ).reduce((acc, b) => acc + b.count, 0) ?? 0
    const referredCount =
      statusData.breakdown?.filter(
        (b) => String(b.status).includes('REFERRAL')
      ).reduce((acc, b) => acc + b.count, 0) ?? 0

    return (
      <>
        Protection & Referral compliance: <span className="font-semibold text-slate-800">{bpoCount} cases</span> with active Barangay Protection Orders (BPO) and <span className="font-semibold text-slate-800">{referredCount} cases</span> endorsed to specialized partner agencies.
      </>
    )
  }, [statusData])

  const recordsInsight = useMemo(() => {
    return `Showing ${recordsData.length} official VAWC complaint records filed within the selected date range. In compliance with R.A. 9262 (Anti-Violence Against Women and Their Children Act), all complainant and respondent identities are masked to ensure victim safety and confidentiality.`
  }, [recordsData])

  // Print Report Handler
  const handlePrintReport = () => {
    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }
    window.print()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="VAWC Reports & Statistical Analytics"
        description="Comprehensive statistical analysis, partner agency referrals, case volume trends, and status compliance monitoring."
      />

      {/* 2. Reusable Date Range Filter Bar */}
      <BlotterReportFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onPrint={handlePrintReport}
        onToggleInsights={() => setShowInsights(!showInsights)}
        dirty={dirty}
      />

      {/* 3. Four Requested KPI Stats Cards */}
      <StatsCards cards={statCards} />

      {/* 4. Visual Analytics: Trend Chart */}
      <TrendPanel
        title="VAWC Case Filing Trend"
        description="Volume of newly filed VAWC complaint cases within the selected period"
        trend={trendData}
        delta={trendDelta}
        showInsightsDefault={showInsights}
        valueNoun="VAWC cases"
      />

      {/* 5. Case Status Breakdown & Agency Resolution Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Status Distribution Donut */}
        <div>
          <BreakdownDonutCard
            title="Case Status Breakdown"
            description="Distribution of current case disposition statuses"
            icon={ShieldAlert}
            centerLabel="Total Cases"
            data={statusDonutData}
            categoryColumnHeader="Case Status"
            showInsightsDefault={showInsights}
            insightMessage={statusInsight}
            insightSecondaryMessage={statusSecondaryInsight}
            totalValue={kpiData?.totalCases}
            badgeText={
              statusDonutData.length > 0
                ? `${statusDonutData.length} Statuses`
                : 'No Records'
            }
          />
        </div>

        {/* Agency Referral Performance & Success Rates */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Partner Agency Performance & Resolution
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Breakdown of resolved, declined, and active referral cases per receiving agency.
                </p>
              </div>
              <Badge tone="indigo">
                {agencyBreakdown.reduce((acc, a) => acc + a.totalReferrals, 0)} Total Endorsements
              </Badge>
            </div>

            {agencyBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No inter-agency referrals recorded within this date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5">Partner Agency</th>
                      <th className="py-3 px-3 text-center">Referrals</th>
                      <th className="py-3 px-3 text-center">Share (%)</th>
                      <th className="py-3 px-3 text-center">Resolved</th>
                      <th className="py-3 px-3 text-center">Declined</th>
                      <th className="py-3 px-3 text-center">Pending</th>
                      <th className="py-3 px-3.5 text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agencyBreakdown.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                AGENCY_COLORS[item.agencyName] || '#3B82F6',
                            }}
                          />
                          <span className="truncate">{item.agencyName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {item.totalReferrals}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {item.percentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                          {item.resolvedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-rose-600">
                          {item.declinedCount}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-amber-600">
                          {item.pendingCount}
                        </td>
                        <td className="py-3 px-3.5 text-right font-bold text-emerald-700">
                          {item.successRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. VAWC Records Table Preview */}
      <ReportTableCard
        title="VAWC Case Records Within Filtered Period"
        description="Detailed log of all formal complaints, BPO records, and referral actions filed within the selected date range."
        data={recordsData}
        columns={columns}
        showInsightsDefault={showInsights}
        insightMessage={recordsInsight}
      />
    </div>
  )
}

export default VawcReports
