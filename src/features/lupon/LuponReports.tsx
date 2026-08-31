import React, { useState, useEffect, useCallback } from 'react'
import {
  Scale,
  FileCheck,
  Hourglass,
  FileSpreadsheet,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { BlotterReportFilters, type BlotterFilterState } from '@/components/reports/BlotterReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { SettlementEfficiencyCard } from '@/components/reports/SettlementEfficiencyCard'
import {
  luponApi,
  type LuponReportKpiResponse,
  type MonthlyCaseTrendResponse,
  type DailyCaseTrendResponse,
  type CaseStatusBreakdownResponse,
} from '@/api/modules/lupon.api'
import { LoadingState } from '@/components/ui/LoadingState'

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

export const LuponReports = () => {
  // Filter States
  const [draftFilters, setDraftFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // API Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<LuponReportKpiResponse | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyCaseTrendResponse[]>([])
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [statusData, setStatusData] = useState<CaseStatusBreakdownResponse | null>(null)

  // Fetch all Lupon report data
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        startDate: appliedFilters.dateFrom || undefined,
        endDate: appliedFilters.dateTo || undefined,
      }

      const [kpiRes, monthRes, dailyRes, statusRes] = await Promise.all([
        luponApi.getReportKpi(params).catch(() => null),
        luponApi.getMonthlyTrend(params).catch(() => []),
        luponApi.getDailyTrend(params).catch(() => []),
        luponApi.getStatusBreakdown(params).catch(() => null),
      ])

      setKpiData(kpiRes)
      setMonthlyTrend(monthRes || [])
      setDailyTrend(dailyRes || [])
      setStatusData(statusRes)
    } catch (err) {
      console.error('Failed to fetch Lupon report analytics:', err)
      setKpiData(null)
      setMonthlyTrend([])
      setDailyTrend([])
      setStatusData(null)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
    setDirty(false)
  }

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setDirty(false)
  }

  const handleDraftChange = (next: BlotterFilterState) => {
    setDraftFilters(next)
    setDirty(true)
  }

  const handlePrint = () => {
    window.print()
  }

  // Settlement rate formatted string
  const settlementRate = kpiData?.settlementRate ?? 0
  const settlementRateFormatted = `+${settlementRate.toFixed(2)}% settlement rate`

  // Lupon Stat Cards
  const statCards: StatCard[] = [
    {
      id: 'total_referred',
      label: 'Total Cases Referred',
      value: kpiData?.totalReferred ?? 0,
      hint: 'Referred & Escalated to Lupon',
      icon: Scale,
      tone: 'indigo',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: kpiData?.settledCases ?? 0,
      hint: settlementRateFormatted,
      trend: 'up',
      showTrend: true,
      icon: FileCheck,
      tone: 'emerald',
    },
    {
      id: 'active_conciliations',
      label: 'Active Conciliations',
      value: kpiData?.activeConciliations ?? 0,
      hint: 'Ongoing Pangkat hearings',
      icon: Hourglass,
      tone: 'amber',
    },
    {
      id: 'cfa_issued',
      label: 'CFA Issued / Endorsed',
      value: kpiData?.cfaIssued ?? 0,
      hint: 'Certificates to File Action',
      icon: FileSpreadsheet,
      tone: 'violet',
    },
  ]

  // Trend Data Preparation (determine daily vs monthly bucket based on date range difference)
  const diffDays = (() => {
    if (!appliedFilters.dateFrom || !appliedFilters.dateTo) return 180
    const start = new Date(appliedFilters.dateFrom).getTime()
    const end = new Date(appliedFilters.dateTo).getTime()
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
  })()

  const useDaily = diffDays <= 31 && dailyTrend.length > 0
  const activeTrendList = useDaily ? dailyTrend : (monthlyTrend.length > 0 ? monthlyTrend : dailyTrend)

  const trendPoints = activeTrendList.map((item: any) => ({
    label: item.label || item.dayLabel || item.monthLabel || 'N/A',
    issued: item.totalCases ?? 0,
  }))

  const trendObj = {
    granularityLabel: useDaily ? 'Daily' : 'Monthly',
    rangeLabel: 'Applied Date Range',
    points: trendPoints,
  }

  const totalIssued = trendPoints.reduce((acc, p) => acc + p.issued, 0)
  const deltaObj = {
    unit: useDaily ? 'day' : 'month',
    current: totalIssued,
    previous: 0,
    percent: null,
    direction: 'up' as const,
  }

  // Status Breakdown Items (For Donut Chart)
  const statusItems = (statusData?.breakdown || [])
    .filter((s) => s.count > 0)
    .map((s) => {
      let color: string | undefined = undefined
      const labelUpper = s.label.toUpperCase()
      if (labelUpper.includes('SETTLED')) color = '#10b981' // emerald
      else if (labelUpper.includes('UNDER CONCILIATION')) color = '#6366f1' // indigo
      else if (labelUpper.includes('CERTIFIED') || labelUpper.includes('CFA')) color = '#8b5cf6' // violet
      else if (labelUpper.includes('EXPIRED')) color = '#f43f5e' // rose
      else if (labelUpper.includes('DISMISSED') || labelUpper.includes('WITHDRAWN')) color = '#e11d48' // red
      else if (labelUpper.includes('PENDING')) color = '#f59e0b' // amber

      return {
        label: s.label,
        value: s.count,
        color,
      }
    })

  return (
    <div className="space-y-6">
      {/* Unified System PageHeader */}
      <PageHeader
        title="Lupon Tagapamayapa Reports & Analytics"
        description="Comprehensive conciliation metrics, settlement rates, hearing progress, and dispute resolution performance under Katarungang Pambarangay."
      />

      {/* Date Range Filters Bar */}
      <BlotterReportFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onPrint={handlePrint}
        onToggleInsights={() => setShowInsights((prev) => !prev)}
        showInsights={showInsights}
        dirty={dirty}
      />

      {/* Loading Indicator or Stat Cards */}
      {loading && !kpiData ? (
        <LoadingState
          message="Loading Lupon Report Analytics..."
          description="Aggregating conciliation metrics and KPIs for selected date range..."
          variant="card"
        />
      ) : (
        <StatsCards cards={statCards} />
      )}

      {/* Conciliation Case Trend Chart Panel */}
      <TrendPanel
        trend={trendObj}
        delta={deltaObj}
        showInsightsDefault={showInsights}
        title={`${trendObj.granularityLabel} Lupon Case Conciliation Trend`}
        description={`Lupon cases referred and conciliated per ${deltaObj.unit} within the applied date range — each point is that ${deltaObj.unit} alone, not a running total`}
        valueNoun="conciliation cases"
      />

      {/* Two-Column Section: Donut Chart (Left) + Conciliation Efficiency Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Donut Chart: Case Status Breakdown */}
        <BreakdownDonutCard
          title="Case Status Breakdown"
          description="Percentage distribution across all Lupon conciliation case statuses"
          data={statusItems}
          centerLabel="Total Cases"
          showInsightsDefault={showInsights}
        />

        {/* Right: Lupon Settlement Efficiency Card */}
        <SettlementEfficiencyCard
          title="Lupon Settlement Efficiency"
          description="Amicable settlement resolution rate of dispute cases referred to Lupon"
          data={{
            totalFormalComplaints: kpiData?.totalReferred ?? 0,
            totalSettledCases: kpiData?.settledCases ?? 0,
            settlementRate: kpiData?.settlementRate ?? 0,
          }}
          totalLabel="Total Cases Referred"
          settledLabel="Settled in Lupon"
          rateLabel="Conciliation Settlement Rate"
          summaryText={`${kpiData?.settledCases ?? 0} out of ${kpiData?.totalReferred ?? 0} referred cases were successfully settled through conciliation.`}
          footerLabel="Conciliation Settlement Rate"
          insightMessage={
            (kpiData?.totalReferred ?? 0) > 0
              ? `This performance card measures conciliation settlement efficiency for dispute cases referred to Lupong Tagapamayapa within the selected period. Currently, ${kpiData?.settledCases ?? 0} out of ${kpiData?.totalReferred ?? 0} referred cases (${(kpiData?.settlementRate ?? 0).toFixed(1)}%) were successfully resolved through amicable settlement.`
              : 'This performance card measures Lupon conciliation efficiency. No cases were referred to Lupon within the selected date range.'
          }
          loading={loading}
          showInsightsDefault={showInsights}
        />
      </div>
    </div>
  )
}
