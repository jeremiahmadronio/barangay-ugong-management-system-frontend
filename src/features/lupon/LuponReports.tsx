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
import { exportLuponExcel } from './exportLuponExcel'
import { useAuth } from '@/hooks/useAuth'
import {
  luponApi,
  type LuponReportKpiResponse,
  type MonthlyCaseTrendResponse,
  type DailyCaseTrendResponse,
  type CaseStatusBreakdownResponse,
  type LuponTableRowResponse,
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
  const { user } = useAuth()

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

  // Print Report Handler — Direct hidden iframe print (rekta print, no preview screen / window)
  const handlePrintReport = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }

    const preparedByName =
      (user as any)?.fullName ||
      ((user as any)?.firstName && (user as any)?.lastName
        ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
        : (user as any)?.name || 'Jeremiah Madronio')

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

    const trendSectionTitle = useDaily ? 'II. DAILY CONCILIATION CASE TREND' : 'II. MONTHLY CONCILIATION CASE TREND'
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

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Lupon Reports & Analytics - Barangay Ugong</title>
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
      body { padding: 0 !important; }
    }
  </style>
</head>
<body style="padding-bottom: 40px;">
  <div style="padding: 0 20px;">
    <div style="text-align: center; line-height: 1.35; font-family: Arial, sans-serif; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px;">
      <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">REPUBLIKA NG PILIPINAS</p>
      <p style="margin: 2px 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">PAMBANSANG PUNONG REHIYON</p>
      <h2 style="margin: 5px 0; font-size: 15px; font-weight: 900; text-transform: uppercase;">TANGGAPAN NG LUPONG TAGAPAMAYAPA</h2>
      <p style="margin: 2px 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">BARANGAY UGONG</p>
      <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">LUNGSOD NG VALENZUELA</p>
    </div>

    <div style="text-align: center; margin-top: 10px; margin-bottom: 14px;">
      <h1 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0; text-transform: uppercase;">LUPON TAGAPAMAYAPA REPORTS & ANALYTICS SUMMARY</h1>
      <p style="font-size: 10px; margin: 0; color: #333;">Official conciliation records summary, settlement rates, and Katarungang Pambarangay statistics</p>
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
        <td>Lupong Tagapamayapa</td>
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
          <td>Total Cases Referred</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalReferred ?? 0}</td>
          <td>Dispute cases referred and escalated to Lupon</td>
        </tr>
        <tr>
          <td>Settled Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.settledCases ?? 0}</td>
          <td>${(kpiData?.settlementRate ?? 0).toFixed(1)}% conciliation settlement rate</td>
        </tr>
        <tr>
          <td>Active Conciliations</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.activeConciliations ?? 0}</td>
          <td>Cases undergoing active Pangkat hearings</td>
        </tr>
        <tr>
          <td>CFA Issued / Endorsed</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.cfaIssued ?? 0}</td>
          <td>Certificates to File Action issued / endorsed</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${trendSectionTitle}</div>
    <div class="section-sub">Lupon conciliation cases per ${useDaily ? 'day' : 'month'} within the applied date range.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">${trendColumnHeader}</th>
          <th style="width: 50%; text-align: center;">Cases Conciliated</th>
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

    <div class="section-title">IV. LUPON SETTLEMENT EFFICIENCY</div>
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
          <td>Conciliation Settlement Rate</td>
          <td style="font-weight: bold; text-align: center;">${(kpiData?.settlementRate ?? 0).toFixed(1)}%</td>
          <td>Percentage of referred cases resolved through amicable settlement</td>
        </tr>
        <tr>
          <td>Total Cases Referred</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalReferred ?? 0}</td>
          <td>Dispute cases referred to Lupong Tagapamayapa</td>
        </tr>
        <tr>
          <td>Settled in Lupon</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.settledCases ?? 0}</td>
          <td>Cases successfully settled via Pangkat conciliation</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 10px; font-style: italic; color: #475569; margin-top: -6px; margin-bottom: 16px;">
      Note: ${kpiData?.settledCases ?? 0} out of ${kpiData?.totalReferred ?? 0} referred cases (${(kpiData?.settlementRate ?? 0).toFixed(1)}%) were successfully settled through conciliation.
    </p>

    <div class="signatories-container">
      <div class="signatory-column">
        <div class="signatory-line">${preparedByName}</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Prepared by</div>
        <div class="signatory-role">Lupon Secretary</div>
      </div>
      <div class="signatory-column">
        <div class="signatory-line">HON. MARICEL PINEDA-EMPERADOR</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Noted by</div>
        <div class="signatory-role">Punong Barangay / Lupon Chairman</div>
      </div>
    </div>
  </div>
</body>
</html>`

    // Direct Browser Print via hidden iframe (no preview window or tab)
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
      const tableRes = await luponApi.getTable({
        startDate: appliedFilters.dateFrom || undefined,
        endDate: appliedFilters.dateTo || undefined,
        page: 0,
        size: 1000,
      }).catch(() => null)

      const records = Array.isArray(tableRes)
        ? (tableRes as LuponTableRowResponse[])
        : tableRes && 'content' in tableRes
        ? (tableRes.content as LuponTableRowResponse[])
        : []

      await exportLuponExcel({
        tableRecords: records,
        kpiData,
        monthlyTrend,
        dailyTrend,
        statusData,
        appliedFilters,
        user,
      })
    } catch (err: any) {
      console.error('Failed to export Lupon Excel report:', err)
      alert(err.message || 'Failed to export Lupon Excel report.')
    }
  }

  // Settlement rate formatted string
  const settlementRate = kpiData?.settlementRate ?? 0
  const settlementRateFormatted = `${settlementRate.toFixed(1)}% settlement rate`

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
      badgeType: 'ratio',
      ratioRate: settlementRate,
      ratioLabel: 'settlement rate',
      hint: settlementRateFormatted,
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

      {/* Date Range Filters Bar with Print & Export Excel */}
      <BlotterReportFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onPrint={handlePrintReport}
        onExportExcel={handleExportExcel}
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
