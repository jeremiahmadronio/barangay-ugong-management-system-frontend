import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  FileCheck,
  Scale,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { BlotterReportFilters, type BlotterFilterState } from '@/components/reports/BlotterReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { HorizontalBarCard } from '@/components/reports/HorizontalBarCard'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { SettlementEfficiencyCard } from '@/components/reports/SettlementEfficiencyCard'
import { ReportTableCard } from '@/components/reports/ReportTableCard'
import { Badge } from '@/components/ui/table/Badge'
import type { BadgeTone } from '@/components/ui/table/Badge'
import { useAuth } from '@/hooks/useAuth'
import { sharedService } from '@/config/api/shared_api/shared.service'
import {
  blotterApi,
  type BlotterReportKpiResponse,
  type MonthlyCaseTrendResponse,
  type DailyCaseTrendResponse,
  type CaseStatusBreakdownResponse,
  type FormalComplaintReportResponse,
  type SettlementEfficiencyResponse,
  type BlotterTableRowResponse,
  type BlotterBackendResponse,
} from '@/api/modules/blotter.api'

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

export const BlotterReports = () => {
  const { user } = useAuth()

  // Filter States
  const [draftFilters, setDraftFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<BlotterFilterState>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // API Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<BlotterReportKpiResponse | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyCaseTrendResponse[]>([])
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [statusData, setStatusData] = useState<CaseStatusBreakdownResponse | null>(null)
  const [resolutionData, setResolutionData] = useState<FormalComplaintReportResponse | null>(null)
  const [settlementData, setSettlementData] = useState<SettlementEfficiencyResponse | null>(null)
  const [tableData, setTableData] = useState<BlotterTableRowResponse[]>([])

  // Fetch all report data
  const fetchAllReports = useCallback(async () => {
    setLoading(true)
    try {
      let deptId: number | undefined = undefined

      try {
        const allDepts = await sharedService.getDepartments()
        const blotterDept = allDepts?.find(
          (d: any) => d.name?.toUpperCase().includes('BLOTTER') || d.code?.toUpperCase().includes('BLOTTER')
        )
        if (blotterDept && blotterDept.id) {
          deptId = Number(blotterDept.id)
        }
      } catch (e) {}

      if (!deptId) {
        const userId = (user as any)?.id || (user as any)?.userId
        if (userId) {
          const userDeptRes = await sharedService.getUserDepartments(userId)
          if (userDeptRes) {
            const blotterDept = userDeptRes.departments?.find(
              (d: any) => d.name?.toUpperCase().includes('BLOTTER') || d.code?.toUpperCase().includes('BLOTTER')
            )
            if (blotterDept && blotterDept.id) {
              deptId = Number(blotterDept.id)
            }
          }
        }
      }

      const params = {
        startDate: appliedFilters.dateFrom || undefined,
        endDate: appliedFilters.dateTo || undefined,
        departmentId: deptId,
      }

      const [kpiRes, monthRes, dailyRes, settlementRes, statusRes, resRes, recordsRes] = await Promise.all([
        blotterApi.getReportKpi(params).catch(() => null),
        blotterApi.getMonthlyTrend(params).catch(() => []),
        blotterApi.getDailyTrend(params).catch(() => []),
        blotterApi.getSettlementEfficiency(params).catch(() => null),
        blotterApi.getStatusBreakdown(params).catch(() => null),
        blotterApi.getFormalResolutionReport(params).catch(() => null),
        blotterApi.getAll({
          search: undefined,
          startDate: params.startDate,
          endDate: params.endDate,
          page: 0,
          size: 50,
        }).catch(() => null),
      ])

      setKpiData(kpiRes)
      setMonthlyTrend(monthRes || [])
      setDailyTrend(dailyRes || [])
      setStatusData(statusRes)
      setResolutionData(resRes)
      setSettlementData(settlementRes)

      const rawContent = Array.isArray(recordsRes)
        ? recordsRes
        : recordsRes && 'content' in recordsRes
        ? recordsRes.content
        : []

      const mapped: BlotterTableRowResponse[] = rawContent.map((b: any) => ({
        rootCaseId: b.rootCaseId || b.id,
        rootCaseNumber: b.rootCaseNumber || b.caseNumber || 'N/A',
        latestActiveCaseId: b.latestActiveCaseId || b.id,
        latestCaseNumber: b.latestCaseNumber || b.caseNumber || 'N/A',
        filingType: b.filingType || 'FORMAL_COMPLAINT',
        cycleCount: b.cycleCount || 1,
        isReopened: Boolean(b.isReopened),
        effectiveStatus: b.effectiveStatus || b.caseStatus || 'PENDING',
        complainantFullName: b.complainantFullName || b.complainantName || 'Complainant',
        respondentFullName: b.respondentFullName || b.respondentName || 'Respondent',
        dateFiled: b.dateFiled || b.createdAt || '',
      }))

      setTableData(mapped)
    } catch (err) {
      console.error('Failed to fetch Blotter report data:', err)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, user])

  useEffect(() => {
    fetchAllReports()
  }, [fetchAllReports])

  const handleDraftChange = (next: any) => {
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

    // 3. Formal Resolution Breakdown HTML
    const resBreakdown = resolutionData?.resolutionBreakdown || resolutionData?.breakdown
    const settledAtBlotter = resBreakdown?.settledAtBlotter ?? 0
    const settledRate = resBreakdown?.settledRate ?? 0
    const referredToLupon = resBreakdown?.referredToLupon ?? 0
    const referredRate = resBreakdown?.referredRate ?? 0

    // 4. Desk Settlement Efficiency Data
    const efficiencyRate = settlementData?.settlementRate ?? 0
    const totalFormal = settlementData?.totalFormalComplaints ?? 0
    const totalSettled = settlementData?.totalSettledCases ?? 0

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Blotter Reports & Analytics - Barangay Ugong</title>
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
      <span>Blotter Report Print Preview</span>
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
      <h1 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0; text-transform: uppercase;">BLOTTER DEPARTMENT REPORTS & ANALYTICS SUMMARY</h1>
      <p style="font-size: 10px; margin: 0; color: #333;">Official incident records summary, resolution metrics, and settlement statistics</p>
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
        <td>Blotter Department</td>
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
          <td>Total Blotter Cases Filed</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalCases ?? 0}</td>
          <td>Formal complaints & for-the-record entries filed</td>
        </tr>
        <tr>
          <td>Settled Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.settledCases ?? 0}</td>
          <td>${kpiData?.settlementRate ?? 0}% overall settlement rate</td>
        </tr>
        <tr>
          <td>Active Mediations</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.activeMediations ?? 0}</td>
          <td>Cases undergoing active mediation hearings</td>
        </tr>
        <tr>
          <td>Lupon Referrals</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.luponReferrals ?? 0}</td>
          <td>Referred to Lupon Tagapamayapa for conciliation</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${trendSectionTitle}</div>
    <div class="section-sub">Cases filed per ${useDaily ? 'day' : 'month'} within the applied date range.</div>
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

    <div class="section-title">IV. FORMAL COMPLAINTS RESOLUTION</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Resolution Outcome</th>
          <th style="width: 25%; text-align: center;">Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Settled at Blotter Desk</td>
          <td style="font-weight: bold; text-align: center;">${settledAtBlotter}</td>
          <td style="text-align: center;">${settledRate.toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Referred to Lupon</td>
          <td style="font-weight: bold; text-align: center;">${referredToLupon}</td>
          <td style="text-align: center;">${referredRate.toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">V. DESK SETTLEMENT EFFICIENCY</div>
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
          <td>Settlement Efficiency Rate</td>
          <td style="font-weight: bold; text-align: center;">${efficiencyRate.toFixed(1)}%</td>
          <td>Percentage of formal complaints resolved at desk</td>
        </tr>
        <tr>
          <td>Total Formal Complaints</td>
          <td style="font-weight: bold; text-align: center;">${totalFormal}</td>
          <td>Formal complaints subject to desk resolution</td>
        </tr>
        <tr>
          <td>Settled Cases</td>
          <td style="font-weight: bold; text-align: center;">${totalSettled}</td>
          <td>Cases resolved directly without Lupon referral</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 10px; font-style: italic; color: #475569; margin-top: -6px; margin-bottom: 16px;">
      Note: ${totalSettled} out of ${totalFormal} formal complaints (${efficiencyRate.toFixed(1)}%) were successfully settled directly at desk level.
    </p>

    <div class="signatories-container">
      <div class="signatory-column">
        <div class="signatory-line">${preparedByName}</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Prepared by</div>
        <div class="signatory-role">Blotter Desk Officer</div>
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

    const printWin = window.open('', '_blank')
    if (printWin) {
      try {
        printWin.document.title = 'Blotter Reports & Analytics - Barangay Ugong'
      } catch (e) {}
      printWin.document.open()
      printWin.document.write(html)
      printWin.document.close()
      printWin.focus()
    }
  }

  // KPI Cards Preparation
  const kpiCards: StatCard[] = [
    {
      id: 'total_cases',
      label: 'Total Cases Filed',
      value: kpiData?.totalCases ?? 0,
      hint: 'Formal complaints & for-the-record entries',
      icon: FileText,
      tone: 'indigo',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: kpiData?.settledCases ?? 0,
      badgeType: 'ratio',
      ratioRate: kpiData?.settlementRate ?? 0,
      ratioLabel: 'settlement rate',
      hint: `${(kpiData?.settlementRate ?? 0).toFixed(1)}% settlement rate`,
      icon: FileCheck,
      tone: 'emerald',
    },
    {
      id: 'active_mediations',
      label: 'Active Mediations',
      value: kpiData?.activeMediations ?? 0,
      hint: 'Cases undergoing active mediation',
      icon: Scale,
      tone: 'sky',
    },
    {
      id: 'lupon_referrals',
      label: 'Lupon Referrals',
      value: kpiData?.luponReferrals ?? 0,
      hint: 'Referred to Lupon Tagapamayapa',
      icon: AlertTriangle,
      tone: 'amber',
    },
  ]

  // Trend Data Preparation: Determine whether to use Daily or Monthly trend based on date range
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
    .map((s) => ({
      label: s.label,
      value: s.count,
    }))

  // Formal Complaints Resolution Items (Settled at Blotter Desk & Referred to Lupon ONLY)
  const resBreakdown = resolutionData?.resolutionBreakdown || resolutionData?.breakdown
  const resolutionItems = [
    {
      label: 'Settled at Blotter Desk',
      value: resBreakdown?.settledAtBlotter || 0,
    },
    {
      label: 'Referred to Lupon',
      value: resBreakdown?.referredToLupon || 0,
    },
  ]

  // Table Columns
  const tableColumns = [
    {
      key: 'latestCaseNumber',
      header: 'CASE NUMBER',
      render: (row: BlotterTableRowResponse) => (
        <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
          {row.latestCaseNumber}
        </span>
      ),
    },
    {
      key: 'complainantFullName',
      header: 'COMPLAINANT',
      render: (row: BlotterTableRowResponse) => (
        <span className="font-semibold text-slate-800 leading-tight">
          {row.complainantFullName || '—'}
        </span>
      ),
    },
    {
      key: 'respondentFullName',
      header: 'RESPONDENT',
      render: (row: BlotterTableRowResponse) => (
        <span className="text-sm text-slate-700">
          {row.respondentFullName || '—'}
        </span>
      ),
    },
    {
      key: 'filingType',
      header: 'FILING MODE',
      render: (row: BlotterTableRowResponse) => {
        const isFormal = String(row.filingType || '').toUpperCase().includes('FORMAL')
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isFormal ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'}`}>
            {isFormal ? 'Formal Complaint' : 'For the Record'}
          </span>
        )
      },
    },
    {
      key: 'effectiveStatus',
      header: 'STATUS',
      render: (row: BlotterTableRowResponse) => {
        const st = String(row.effectiveStatus || 'PENDING').toUpperCase()
        let tone: BadgeTone = 'slate'
        if (st === 'SETTLED') tone = 'emerald'
        else if (st === 'UNDER_MEDIATION' || st === 'ON_GOING') tone = 'sky'
        else if (st === 'UNDER_CONCILIATION') tone = 'indigo'
        else if (st === 'PENDING') tone = 'amber'
        else if (st === 'DISMISSED' || st === 'WITHDRAWN') tone = 'rose'

        return <Badge tone={tone}>{st.replace('_', ' ')}</Badge>
      },
    },
    {
      key: 'dateFiled',
      header: 'DATE FILED',
      render: (row: BlotterTableRowResponse) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">
          {row.dateFiled
            ? new Date(row.dateFiled).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <PageHeader
        title="Blotter Department Reports & Analytics"
        description="Comprehensive analytics, filing trends, case status distribution, resolution metrics, and detailed incident records."
        actions={[]}
      />

      {/* Filter Bar */}
      <BlotterReportFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onPrint={handlePrintReport}
        onToggleInsights={() => setShowInsights(!showInsights)}
        showInsights={showInsights}
        dirty={dirty}
      />

      {/* KPI / Stats Cards */}
      <StatsCards cards={kpiCards} />

      {/* Case Filing Trend Chart Panel */}
      <TrendPanel
        trend={trendObj}
        delta={deltaObj}
        showInsightsDefault={showInsights}
        title={`${trendObj.granularityLabel} Case Filing Trend`}
        description={`Blotter cases filed per ${deltaObj.unit} within the applied date range — each point is that ${deltaObj.unit} alone, not a running total`}
        valueNoun="cases"
      />

      {/* Two Column Section: Donut Chart + Horizontal Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Case Status Breakdown */}
        <BreakdownDonutCard
          title="Case Status Breakdown"
          description="Percentage distribution across all blotter case statuses"
          data={statusItems}
          centerLabel="Total Cases"
          showInsightsDefault={showInsights}
        />

        {/* Horizontal Bar Chart: Resolution Efficiency */}
        <HorizontalBarCard
          title="Formal Complaints Resolution"
          description="Breakdown of formal complaint outcomes (Settled at Desk vs Referred to Lupon)"
          data={resolutionItems}
          showInsightsDefault={showInsights}
        />
      </div>

      {/* Desk Settlement Efficiency Performance Card */}
      <SettlementEfficiencyCard
        data={settlementData}
        loading={loading}
        showInsightsDefault={showInsights}
      />
    </div>
  )
}
