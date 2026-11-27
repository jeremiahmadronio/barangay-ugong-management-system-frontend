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
} from '@/config/api/modules/vawc.api'
import type {
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
} from '@/config/api/modules/blotter.api'
import { formatDate, maskConfidentialName } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { exportVawcExcel } from './exportVawcExcel'
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
  const { user } = useAuth()

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
  const handlePrintReport = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }

    const preparedByName = (user as any)?.fullName || (user as any)?.name || 'Adelaida Perez'
    const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${new Date(appliedFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(appliedFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Applied Date Range'

    const generatedDateText = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // 1. Status breakdown rows HTML
    const statusItems = statusData?.breakdown || []
    const statusRowsHtml = statusItems.length > 0
      ? statusItems.map((item) => `
          <tr>
            <td style="border: 1px solid #000; padding: 6px 10px; font-weight: 500;">${item.label}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${item.count}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${item.percentage.toFixed(1)}%</td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No status records available.</td></tr>`

    // 2. Trend Data Calculation
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

    const trendSectionTitle = useDaily ? 'II. DAILY CASE FILING TREND' : 'II. MONTHLY CASE FILING TREND'
    const trendColumnHeader = useDaily ? 'Date' : 'Month'
    const busiestLabel = useDaily ? 'Busiest Day' : 'Busiest Month'
    const slowestLabel = useDaily ? 'Slowest Day' : 'Slowest Month'

    const totalTrendVolume = trendPoints.reduce((acc: number, p: any) => acc + p.issued, 0)
    const busiestObj = trendPoints.length > 0
      ? trendPoints.reduce((best: any, p: any) => (!best || p.issued > best.issued ? p : best), null)
      : null
    const slowestObj = trendPoints.length > 0
      ? trendPoints.reduce((worst: any, p: any) => (!worst || p.issued < worst.issued ? p : worst), null)
      : null

    const trendRowsHtml = trendPoints.length > 0
      ? trendPoints.map((p: any) => `
          <tr>
            <td style="font-weight: 500; border: 1px solid #000; padding: 6px 10px;">${p.label}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${p.issued}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No trend data recorded for this period.</td></tr>`

    // 3. Agency Referral Breakdown HTML
    const agencyRowsHtml = agencyBreakdown.length > 0
      ? agencyBreakdown.map((item) => `
          <tr>
            <td style="border: 1px solid #000; padding: 6px 10px; font-weight: 500;">${item.agencyName}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${item.totalReferrals}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${(item.percentage ?? 0).toFixed(1)}%</td>
            <td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">${item.resolvedCount}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">${item.declinedCount}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">${item.pendingCount}</td>
            <td style="text-align: right; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${(item.successRate ?? 0).toFixed(1)}%</td>
          </tr>
        `).join('')
      : `<tr><td colspan="7" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No inter-agency referrals recorded within this date range.</td></tr>`

    // 4. Confidential Records Registry HTML (names masked)
    const recordsRowsHtml = recordsData.length > 0
      ? recordsData.map((r) => `
          <tr>
            <td style="border: 1px solid #000; padding: 6px 10px; font-weight: 600;">${r.caseNumber}</td>
            <td style="border: 1px solid #000; padding: 6px 10px;">${maskConfidentialName(r.complainant)}</td>
            <td style="border: 1px solid #000; padding: 6px 10px;">${maskConfidentialName(r.respondent)}</td>
            <td style="border: 1px solid #000; padding: 6px 10px;">${(r.status || '').replace(/_/g, ' ')}</td>
            <td style="border: 1px solid #000; padding: 6px 10px;">${r.natureOfComplaint || '—'}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">${formatDate(r.dateFiled)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No VAWC case records found for this period.</td></tr>`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>VAWC Reports & Statistical Analytics - Barangay Ugong</title>
  <style>
    @page { size: portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, sans-serif; color: #000; background: #fff; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; border-top: 1px solid #000; border-bottom: 1px solid #000; }
    .meta-table td { padding: 6px 8px; font-size: 11px; vertical-align: middle; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 18px 0 6px 0; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    .section-sub { font-size: 10px; font-style: italic; color: #444; margin-bottom: 6px; }
    table.report-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    table.report-table th { background-color: #f1f5f9; color: #000; font-weight: bold; padding: 7px 10px; border: 1px solid #000; text-align: left; }
    table.report-table td { padding: 6px 10px; border: 1px solid #000; vertical-align: middle; }
    .page-break { page-break-before: always; }
    .signatories-container { margin-top: 45px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .signatory-column { width: 45%; text-align: center; }
    .signatory-line { margin-top: 45px; border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 11px; }
    .signatory-role { font-size: 10px; color: #333; }
    
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body style="padding-bottom: 40px;">
  <!-- Sticky Print Preview Action Bar -->
  <div class="no-print-bar" style="position: sticky; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; margin-bottom: 24px;">
    <div style="font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
      <span>VAWC Report Print Preview</span>
      <span style="font-size: 11px; color: #94a3b8; font-weight: normal; margin-left: 4px;">— Review document details before printing</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">
        Print Document
      </button>
      <button onclick="window.close()" style="background: #334155; color: #cbd5e1; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
        Close Preview
      </button>
    </div>
  </div>

  <div style="padding: 0 20px;">
    <div style="text-align: center; line-height: 1.35; font-family: Arial, sans-serif; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px;">
      <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">REPUBLIKA NG PILIPINAS</p>
      <p style="margin: 2px 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">PAMBANSANG PUNONG REHIYON</p>
      <h2 style="margin: 5px 0; font-size: 15px; font-weight: 900; text-transform: uppercase;">TANGGAPAN NG SANGGUINIANG BARANGAY</h2>
      <p style="margin: 2px 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">BARANGAY UGONG</p>
      <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">LUNGSOD NG VALENZUELA</p>
    </div>

    <div style="text-align: center; margin-top: 10px; margin-bottom: 14px;">
      <h1 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0; text-transform: uppercase;">VAWC DESK STATISTICAL & CASE MONITORING REPORT</h1>
      <p style="font-size: 10px; margin: 0; color: #333;">Official confidential summary in compliance with Republic Act No. 9262 (Anti-VAWC Act of 2004)</p>
    </div>

    <table class="meta-table">
      <tr>
        <td style="width: 18%; font-weight: bold;">Report Period:</td>
        <td style="width: 32%;">${dateRangeLabel}</td>
        <td style="width: 18%; font-weight: bold;">Generated On:</td>
        <td style="width: 32%;">${generatedDateText}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Prepared By:</td>
        <td>${preparedByName}</td>
        <td style="font-weight: bold;">Department:</td>
        <td>VAWC / Women & Children's Desk</td>
      </tr>
    </table>

    <div class="section-title">I. KPI SUMMARY OVERVIEW</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 35%;">Metric</th>
          <th style="width: 25%; text-align: center;">Value</th>
          <th style="width: 40%;">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total VAWC Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalCases ?? 0}</td>
          <td>Total complaints filed in selected period</td>
        </tr>
        <tr>
          <td>Total Referred Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalReferredCases ?? 0}</td>
          <td>Endorsed to specialized partner agencies</td>
        </tr>
        <tr>
          <td>Top Performing Partner Agency</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.mostReferredAgency || 'None'}</td>
          <td>${kpiData?.mostReferredAgencySuccessRate ? kpiData.mostReferredAgencySuccessRate.toFixed(1) + '%' : '0.0%'} resolution success rate</td>
        </tr>
        <tr>
          <td>Dismissed / Unactioned Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalDismissedCases ?? 0}</td>
          <td>Dismissed, withdrawn, or unpursued cases</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${trendSectionTitle}</div>
    <div class="section-sub">VAWC complaint cases filed per ${useDaily ? 'day' : 'month'} within the applied date range.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">${trendColumnHeader}</th>
          <th style="width: 50%; text-align: center;">Cases Filed</th>
        </tr>
      </thead>
      <tbody>
        ${trendRowsHtml}
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>Total Volume</td>
          <td style="text-align: center;">${totalTrendVolume}</td>
        </tr>
        <tr style="font-weight: bold;">
          <td>${busiestLabel}</td>
          <td style="text-align: center;">${busiestObj ? busiestObj.label + ' (' + busiestObj.issued + ')' : 'N/A'}</td>
        </tr>
        <tr style="font-weight: bold;">
          <td>${slowestLabel}</td>
          <td style="text-align: center;">${slowestObj ? slowestObj.label + ' (' + slowestObj.issued + ')' : 'N/A'}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">III. CASE STATUS DISTRIBUTION</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Status Category</th>
          <th style="width: 25%; text-align: center;">Case Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
        </tr>
      </thead>
      <tbody>
        ${statusRowsHtml}
      </tbody>
    </table>

    <div class="section-title">IV. PARTNER AGENCY REFERRAL PERFORMANCE & RESOLUTION</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 32%;">Partner Agency</th>
          <th style="width: 11%; text-align: center;">Referrals</th>
          <th style="width: 11%; text-align: center;">Share (%)</th>
          <th style="width: 11%; text-align: center;">Resolved</th>
          <th style="width: 11%; text-align: center;">Declined</th>
          <th style="width: 11%; text-align: center;">Pending</th>
          <th style="width: 13%; text-align: right;">Success Rate</th>
        </tr>
      </thead>
      <tbody>
        ${agencyRowsHtml}
      </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">V. CONFIDENTIAL VAWC CASE RECORDS REGISTRY</div>
    <div class="section-sub">Compliant with R.A. 9262: Complainant and respondent identities are masked for privacy and security.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 18%;">Case Number</th>
          <th style="width: 20%;">Complainant</th>
          <th style="width: 20%;">Respondent</th>
          <th style="width: 16%;">Status</th>
          <th style="width: 16%;">Referred Agency</th>
          <th style="width: 10%; text-align: center;">Date Filed</th>
        </tr>
      </thead>
      <tbody>
        ${recordsRowsHtml}
      </tbody>
    </table>

    <div class="signatories-container">
      <div class="signatory-column">
        <div class="signatory-line">${preparedByName}</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Prepared by</div>
        <div class="signatory-role">VAWC Desk Officer</div>
      </div>
      <div class="signatory-column">
        <div class="signatory-line">HON. MARICEL PINEDA-EMPERADOR</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Noted by</div>
        <div class="signatory-role">Punong Barangay</div>
      </div>
    </div>
  </div>
</body>
</html>`

    // Direct Browser Print via hidden iframe (rekta print, no preview screen / window)
    const printIframe = document.createElement('iframe')
    printIframe.style.position = 'fixed'
    printIframe.style.right = '0'
    printIframe.style.bottom = '0'
    printIframe.style.width = '0'
    printIframe.style.height = '0'
    printIframe.style.border = '0'
    printIframe.style.visibility = 'hidden'
    document.body.appendChild(printIframe)

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe)
        }
      }, 2500)
    }

    const doc = printIframe.contentWindow?.document || printIframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus()
          printIframe.contentWindow?.print()
        } catch (e) {
          console.error('Print iframe error:', e)
        } finally {
          cleanup()
        }
      }, 350)
    } else {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      printIframe.src = blobUrl
      printIframe.onload = () => {
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus()
            printIframe.contentWindow?.print()
          } catch (e) {
            console.error('Print iframe error:', e)
          } finally {
            cleanup()
            URL.revokeObjectURL(blobUrl)
          }
        }, 350)
      }
    }
  }

  // Handle Export Excel (.xlsx Native Spreadsheet)
  const handleExportExcel = async () => {
    if (dirty) {
      alert('You have modified the date filter. Please click "Apply Filters" first to update the report for your selected date range before exporting.')
      return
    }

    if (loading) {
      alert('Please wait for report data to finish loading before exporting.')
      return
    }

    try {
      await exportVawcExcel({
        tableRecords: recordsData,
        kpiData,
        agencyBreakdown,
        monthlyTrend,
        dailyTrend,
        statusData,
        appliedFilters,
        user,
      })
    } catch (err: any) {
      console.error('Failed to export VAWC Excel report:', err)
      alert(err.message || 'Failed to export VAWC Excel report.')
    }
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
        onExportExcel={handleExportExcel}
        onToggleInsights={() => setShowInsights(!showInsights)}
        showInsights={showInsights}
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
