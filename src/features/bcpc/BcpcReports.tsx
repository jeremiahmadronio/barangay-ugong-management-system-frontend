import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  FileCheck,
  Scale,
  AlertTriangle,
  PieChart,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { BcpcReportFilters, type BcpcFilterState } from '@/components/reports/BcpcReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { HorizontalBarCard } from '@/components/reports/HorizontalBarCard'
import { SettlementEfficiencyCard } from '@/components/reports/SettlementEfficiencyCard'
import { extremes, type TrendResult } from '@/components/reports/utils/trendAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { exportBcpcExcel } from './exportBcpcExcel'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'
import type {
  BcpcReportKpiResponse,
  BcpcCategoryComparisonResponse,
  BcpcTableRowResponse,
  BcpcMonthlyCaseTrendResponse,
  BcpcDailyCaseTrendResponse,
  BcpcStatusBreakdownResponse,
  BcpcSettlementEfficiencyResponse,
} from '@/config/api/bcpc/bcpc.types'

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

const DEFAULT_FILTERS: BcpcFilterState = {
  dateFrom: getSixMonthsAgoDate(),
  dateTo: getTodayDate(),
}

/**
 * Dedicated BCPC Analytical Insight Generator
 * Aligned with child protection policies (CAR, CICL, LSWDO, diversion programs).
 */
function getBcpcTrendChartInsight({
  totalVolume,
  rangeLabel,
  busiest,
  slowest,
}: {
  totalVolume: number
  rangeLabel: string
  busiest: { label: string; issued: number } | null
  slowest: { label: string; issued: number } | null
}): React.ReactNode {
  if (totalVolume === 0) {
    return (
      <>
        No child protection cases (CAR or CICL) were recorded across{' '}
        <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>. During this
        monitoring window, operations recorded zero case filings. Desk officers can utilize this operational
        period to conduct proactive case follow-ups, review ongoing youth diversion programs, and audit child
        protection dossiers in the official archive vault.
      </>
    )
  }

  const isSinglePeak =
    busiest &&
    busiest.issued > 0 &&
    (!slowest || slowest.issued === 0 || busiest.issued >= totalVolume * 0.5)

  if (isSinglePeak && busiest) {
    const peakShare = ((busiest.issued / totalVolume) * 100).toFixed(1)
    return (
      <>
        This trend wave chart tracks child protection case volume (Children at Risk & Children in Conflict with
        the Law) across{' '}
        <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>. An aggregate total of{' '}
        <strong className="text-slate-900 font-semibold">{totalVolume} BCPC cases</strong> were recorded during
        this period, with peak operational demand concentrated in{' '}
        <strong className="text-slate-900 font-semibold">{busiest.label}</strong> accounting for{' '}
        <strong className="text-slate-900 font-semibold">{busiest.issued} entries ({peakShare}% of total volume)</strong>.
        This concentration highlights a high-demand intervention window, indicating that child counseling,
        officer availability, and referral coordination with LSWDO/DSWD should be proactively aligned during similar periods.
      </>
    )
  }

  return (
    <>
      This trend wave chart tracks child protection case volume across{' '}
      <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>, recording a total of{' '}
      <strong className="text-slate-900 font-semibold">{totalVolume} BCPC cases</strong>. Peak activity occurred in{' '}
      <strong className="text-slate-900 font-semibold">
        {busiest ? busiest.label : 'N/A'} ({busiest ? busiest.issued : 0} cases)
      </strong>
      , while the lowest intake was observed in{' '}
      <strong className="text-slate-900 font-semibold">
        {slowest ? slowest.label : 'N/A'} ({slowest ? slowest.issued : 0} cases)
      </strong>
      . The multi-month trend curve illustrates child protection dynamics across the community, supporting targeted preventive youth activities and intervention pacing.
    </>
  )
}

export const BcpcReports = () => {
  const { user } = useAuth()

  // Filter States
  const [draftFilters, setDraftFilters] = useState<BcpcFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<BcpcFilterState>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // API Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<BcpcReportKpiResponse | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<BcpcMonthlyCaseTrendResponse[]>([])
  const [dailyTrend, setDailyTrend] = useState<BcpcDailyCaseTrendResponse[]>([])
  const [statusData, setStatusData] = useState<BcpcStatusBreakdownResponse | null>(null)
  const [categoryData, setCategoryData] = useState<BcpcCategoryComparisonResponse | null>(null)
  const [settlementData, setSettlementData] = useState<BcpcSettlementEfficiencyResponse | null>(null)
  const [tableData, setTableData] = useState<BcpcTableRowResponse[]>([])

  // Fetch all report data
  const fetchAllReportData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        startDate: appliedFilters.dateFrom,
        endDate: appliedFilters.dateTo,
      }
      const [kpiRes, monthRes, dailyRes, statusRes, catRes, settlementRes, tableRes] = await Promise.all([
        bcpcService.getReportKpi(params).catch(() => null),
        bcpcService.getMonthlyTrend(params).catch(() => []),
        bcpcService.getDailyTrend(params).catch(() => []),
        bcpcService.getStatusBreakdown(params).catch(() => null),
        bcpcService.getCategoryComparison(params).catch(() => null),
        bcpcService.getSettlementEfficiency(params).catch(() => null),
        bcpcService.getTable({ page: 0, size: 200 }).catch(() => null),
      ])

      setKpiData(kpiRes)
      setMonthlyTrend(monthRes || [])
      setDailyTrend(dailyRes || [])
      setStatusData(statusRes)
      setCategoryData(catRes)
      setSettlementData(settlementRes)

      const rawRecords = tableRes?.content || []
      const filteredRecords = rawRecords.filter((item: BcpcTableRowResponse) => {
        if (!appliedFilters.dateFrom && !appliedFilters.dateTo) return true
        const itemDateStr = item.dateFiled || item.createdAt
        if (!itemDateStr) return true
        const itemTime = new Date(itemDateStr).getTime()
        if (appliedFilters.dateFrom && itemTime < new Date(appliedFilters.dateFrom).getTime()) return false
        if (appliedFilters.dateTo) {
          const endDay = new Date(appliedFilters.dateTo)
          endDay.setHours(23, 59, 59, 999)
          if (itemTime > endDay.getTime()) return false
        }
        return true
      })
      setTableData(filteredRecords)
    } catch (err) {
      console.error('Failed to fetch BCPC report data:', err)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchAllReportData()
  }, [fetchAllReportData])

  // Handle draft filter changes
  const handleDraftChange = (next: BcpcFilterState) => {
    setDraftFilters(next)
    setDirty(
      next.dateFrom !== appliedFilters.dateFrom ||
      next.dateTo !== appliedFilters.dateTo
    )
  }

  // Handle Apply Filters
  const handleApplyFilters = () => {
    if (draftFilters.dateFrom && draftFilters.dateTo) {
      const from = new Date(draftFilters.dateFrom)
      const to = new Date(draftFilters.dateTo)
      if (from > to) {
        alert('Start date cannot be after end date.')
        return
      }
    }
    setAppliedFilters(draftFilters)
    setDirty(false)
  }

  // Handle Reset Filters
  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setDirty(false)
  }

  // Handle Print Report (Hidden iframe printing directly matching Blotter standards)
  const handlePrintReport = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }

    const preparedByName = (user as any)?.fullName || (user as any)?.name || 'BCPC Focal Person'
    const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${new Date(appliedFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(appliedFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Applied Date Range'

    const generatedDateText = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // 1. Status breakdown rows HTML
    const statusItemsList = statusData?.breakdown || []
    const statusRowsHtml = statusItemsList.length > 0
      ? statusItemsList.map((item) => `
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

    const useDailyPrint = diffDays <= 31 && dailyTrend.length > 0
    const activeTrendList = useDailyPrint ? dailyTrend : (monthlyTrend.length > 0 ? monthlyTrend : dailyTrend)

    const trendPointsPrint = activeTrendList.map((item: any) => ({
      label: item.label || item.dayLabel || item.monthLabel || 'N/A',
      issued: item.totalCases ?? 0,
    }))

    const trendSectionTitle = useDailyPrint ? 'II. DAILY CASE FILING TREND' : 'II. MONTHLY CASE FILING TREND'
    const trendColumnHeader = useDailyPrint ? 'Date' : 'Month'
    const busiestLabel = useDailyPrint ? 'Busiest Day' : 'Busiest Month'
    const slowestLabel = useDailyPrint ? 'Slowest Day' : 'Slowest Month'

    const totalTrendVolume = trendPointsPrint.reduce((acc: number, p: any) => acc + p.issued, 0)
    const busiestObj = trendPointsPrint.length > 0
      ? trendPointsPrint.reduce((best: any, p: any) => (!best || p.issued > best.issued ? p : best), null)
      : null
    const slowestObj = trendPointsPrint.length > 0
      ? trendPointsPrint.reduce((worst: any, p: any) => (!worst || p.issued < worst.issued ? p : worst), null)
      : null

    const trendRowsHtml = trendPointsPrint.length > 0
      ? trendPointsPrint.map((p: any) => `
          <tr>
            <td style="font-weight: 500; border: 1px solid #000; padding: 6px 10px;">${p.label}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${p.issued}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No trend data recorded for this period.</td></tr>`

    // 3. Child Classification Breakdown (CAR vs. CICL)
    const carCases = categoryData?.carCases ?? 0
    const carPercentage = categoryData?.carPercentage ?? 0
    const ciclCases = categoryData?.ciclCases ?? 0
    const ciclPercentage = categoryData?.ciclPercentage ?? 0
    const totalClassified = carCases + ciclCases

    // 4. Settlement Efficiency Data
    const efficiencyRate = settlementData?.settlementRate ?? 0
    const totalBcpcCases = settlementData?.totalFormalComplaints ?? (kpiData?.totalCases ?? 0)
    const totalSettled = settlementData?.totalSettledCases ?? (kpiData?.settledCases ?? 0)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>BCPC Reports & Analytics - Barangay Ugong</title>
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
      <h2 style="margin: 5px 0; font-size: 15px; font-weight: 900; text-transform: uppercase;">TANGGAPAN NG SANGGUNIANG BARANGAY</h2>
      <p style="margin: 2px 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">BARANGAY UGONG</p>
      <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">LUNGSOD NG VALENZUELA</p>
    </div>

    <div style="text-align: center; margin-top: 10px; margin-bottom: 14px;">
      <h1 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0; text-transform: uppercase;">BCPC DEPARTMENT REPORTS & ANALYTICS SUMMARY</h1>
      <p style="font-size: 10px; margin: 0; color: #333;">Official child protection records, youth diversion metrics, and classification distribution</p>
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
        <td>BCPC / Child Protection Desk</td>
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
          <td>Total Cases Filed</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalCases ?? 0}</td>
          <td>Recorded child protection cases (CAR & CICL)</td>
        </tr>
        <tr>
          <td>Settled Cases</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.settledCases ?? 0}</td>
          <td>${(kpiData?.settlementRate ?? 0).toFixed(1)}% settlement rate</td>
        </tr>
        <tr>
          <td>Active Interventions</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.activeInterventions ?? 0}</td>
          <td>Cases undergoing youth intervention & diversion</td>
        </tr>
        <tr>
          <td>Agency Referrals</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.agencyReferrals ?? 0}</td>
          <td>Referred to LSWDO / DSWD / PNP-WCPD</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${trendSectionTitle}</div>
    <div class="section-sub">BCPC cases filed per ${useDailyPrint ? 'day' : 'month'} within the applied date range.</div>
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

    <div class="section-title">IV. CHILD CLASSIFICATION COMPARISON (CAR VS. CICL)</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Classification Outcome</th>
          <th style="width: 25%; text-align: center;">Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Children at Risk (CAR)</td>
          <td style="font-weight: bold; text-align: center;">${carCases}</td>
          <td style="text-align: center;">${carPercentage.toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Children in Conflict with the Law (CICL)</td>
          <td style="font-weight: bold; text-align: center;">${ciclCases}</td>
          <td style="text-align: center;">${ciclPercentage.toFixed(1)}%</td>
        </tr>
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>Total Classified Intakes</td>
          <td style="text-align: center;">${totalClassified}</td>
          <td style="text-align: center;">100.0%</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">V. BCPC SETTLEMENT EFFICIENCY</div>
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
          <td>Percentage of BCPC cases resolved through diversion/settlement</td>
        </tr>
        <tr>
          <td>Total BCPC Cases</td>
          <td style="font-weight: bold; text-align: center;">${totalBcpcCases}</td>
          <td>Total child cases subject to community-level resolution</td>
        </tr>
        <tr>
          <td>Settled Cases</td>
          <td style="font-weight: bold; text-align: center;">${totalSettled}</td>
          <td>Cases successfully resolved or settled</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 10px; font-style: italic; color: #475569; margin-top: -6px; margin-bottom: 16px;">
      Note: ${totalSettled} out of ${totalBcpcCases} BCPC cases (${efficiencyRate.toFixed(1)}%) were successfully settled through amicable agreement, restorative diversion, or family intervention.
    </p>

    <div class="signatories-container">
      <div class="signatory-column">
        <div class="signatory-line">${preparedByName}</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Prepared by</div>
        <div class="signatory-role">BCPC Focal Person / Desk Officer</div>
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

  // Handle Export Excel (.xlsx Native Spreadsheet with Harmonized Formatting & Full BCPC Registry)
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
      await exportBcpcExcel({
        tableRecords: tableData,
        kpiData,
        monthlyTrend,
        dailyTrend,
        statusData,
        categoryData,
        settlementData,
        appliedFilters,
        user,
      })
    } catch (err: any) {
      console.error('Failed to export BCPC Excel report:', err)
      alert(err.message || 'Failed to export BCPC Excel report.')
    }
  }

  // KPI Cards Configuration
  const kpiCards: StatCard[] = useMemo(() => {
    const total = kpiData?.totalCases ?? 0
    const settled = kpiData?.settledCases ?? 0
    const rate = kpiData?.settlementRate ?? 0
    const active = kpiData?.activeInterventions ?? 0
    const referrals = kpiData?.agencyReferrals ?? 0

    return [
      {
        id: 'total_cases',
        label: 'Total Cases Filed',
        value: total,
        hint: 'Recorded child protection cases',
        icon: FileText,
        tone: 'indigo',
      },
      {
        id: 'settled_cases',
        label: 'Settled Cases',
        value: settled,
        badgeType: 'ratio',
        ratioRate: rate,
        ratioLabel: 'settlement rate',
        hint: `${rate.toFixed(1)}% settlement rate`,
        icon: FileCheck,
        tone: 'emerald',
      },
      {
        id: 'active_interventions',
        label: 'Active Interventions',
        value: active,
        hint: 'Cases undergoing intervention & diversion',
        icon: Scale,
        tone: 'sky',
      },
      {
        id: 'agency_referrals',
        label: 'Agency Referrals',
        value: referrals,
        hint: 'Referred to LSWDO / DSWD / PNP-WCPD',
        icon: AlertTriangle,
        tone: 'amber',
      },
    ]
  }, [kpiData])

  // Trend Panel Data Preparation
  const dateDifferenceDays = useMemo(() => {
    const from = new Date(appliedFilters.dateFrom)
    const to = new Date(appliedFilters.dateTo)
    const diffTime = Math.abs(to.getTime() - from.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [appliedFilters.dateFrom, appliedFilters.dateTo])

  const useDaily = dateDifferenceDays <= 31

  const trendObj: TrendResult = useMemo(() => {
    if (useDaily) {
      const points = dailyTrend.map((d) => ({
        label: d.label || d.dayLabel || `Day ${d.dayOfMonth}`,
        issued: d.totalCases,
      }))
      return {
        points,
        rangeLabel: 'Applied Date Range (Daily)',
        granularityLabel: 'Daily',
      }
    }
    const points = monthlyTrend.map((m) => ({
      label: m.monthLabel || `Month ${m.month}`,
      issued: m.totalCases,
    }))
    return {
      points,
      rangeLabel: 'Applied Date Range',
      granularityLabel: 'Monthly',
    }
  }, [useDaily, dailyTrend, monthlyTrend])

  const totalIssued = useMemo(
    () => trendObj.points.reduce((acc, p) => acc + p.issued, 0),
    [trendObj.points]
  )

  const deltaObj = {
    unit: useDaily ? ('day' as const) : ('month' as const),
    current: totalIssued,
    previous: 0,
    percent: null,
    direction: 'up' as const,
  }

  const { busiest, slowest } = useMemo(() => extremes(trendObj), [trendObj])

  const bcpcInsightMessage = useMemo(() => {
    return getBcpcTrendChartInsight({
      totalVolume: totalIssued,
      rangeLabel: trendObj.rangeLabel,
      busiest,
      slowest,
    })
  }, [totalIssued, trendObj.rangeLabel, busiest, slowest])

  // Status Breakdown Items (For Donut Chart)
  const statusItems = useMemo(() => {
    return (statusData?.breakdown || [])
      .filter((s) => s.count > 0)
      .map((s) => ({
        label: s.label,
        value: s.count,
      }))
  }, [statusData])

  // Dedicated BCPC Case Status Breakdown Insight
  const bcpcStatusInsight = useMemo(() => {
    if (!statusData || statusData.totalCases === 0) {
      return (
        <>
          This chart displays the percentage distribution across BCPC case statuses. No active case records were
          found within the applied date range.
        </>
      )
    }
    const topStatus = [...(statusData.breakdown || [])].sort((a, b) => b.count - a.count)[0]
    return (
      <>
        This breakdown illustrates the distribution of child welfare cases across lifecycle statuses during the
        selected date range. Currently,{' '}
        <strong className="text-slate-900 font-semibold">{topStatus ? topStatus.label : 'N/A'}</strong> holds the
        largest share with{' '}
        <strong className="text-slate-900 font-semibold">
          {topStatus ? topStatus.count : 0} cases ({topStatus ? topStatus.percentage.toFixed(1) : 0}% of all intakes)
        </strong>.
        Monitoring status distribution ensures active follow-through for cases awaiting intervention agreements,
        custody assessments, and formal multi-agency endorsements.
      </>
    )
  }, [statusData])

  // Child Classification Comparison Items (CAR vs CICL)
  const categoryComparisonItems = useMemo(() => [
    {
      label: 'Children at Risk (CAR)',
      value: categoryData?.carCases ?? 0,
    },
    {
      label: 'Children in Conflict (CICL)',
      value: categoryData?.ciclCases ?? 0,
    },
  ], [categoryData])

  // Dedicated BCPC Category Comparison Insight
  const bcpcCategoryInsight = useMemo(() => {
    const total = (categoryData?.carCases ?? 0) + (categoryData?.ciclCases ?? 0)
    if (!categoryData || total === 0) {
      return (
        <>
          This chart tracks child classification outcomes comparing Children at Risk (CAR) against Children in
          Conflict with the Law (CICL). No classified child records were found within the applied date range.
        </>
      )
    }
    const isCarHigher = (categoryData.carCases ?? 0) >= (categoryData.ciclCases ?? 0)
    return (
      <>
        This chart compares intake volume between{' '}
        <strong className="text-slate-900 font-semibold">Children at Risk (CAR)</strong> and{' '}
        <strong className="text-slate-900 font-semibold">Children in Conflict with the Law (CICL)</strong> across
        the selected date range. Currently,{' '}
        <strong className="text-slate-900 font-semibold">
          {isCarHigher ? 'Children at Risk (CAR)' : 'Children in Conflict with the Law (CICL)'}
        </strong>{' '}
        accounts for the majority with{' '}
        <strong className="text-slate-900 font-semibold">
          {isCarHigher ? categoryData.carCases : categoryData.ciclCases} cases ({isCarHigher ? categoryData.carPercentage.toFixed(1) : categoryData.ciclPercentage.toFixed(1)}% of classified intakes)
        </strong>.
        {isCarHigher
          ? ' High CAR incidence highlights the necessity of community-level preventive programs, curfew enforcement, and parental guidance to prevent children from escalating to juvenile offenses.'
          : ' Elevated CICL cases emphasize the need for active diversion proceedings, custody safety, and prompt endorsement to the Local Social Welfare and Development Office (LSWDO).'}
      </>
    )
  }, [categoryData])

  // Dedicated BCPC Settlement Efficiency Insight
  const bcpcSettlementInsight = useMemo(() => {
    const total = settlementData?.totalFormalComplaints ?? 0
    const settled = settlementData?.totalSettledCases ?? 0
    const rate = settlementData?.settlementRate ?? 0

    if (total === 0) {
      return 'This performance card measures settlement efficiency for child protection cases. No BCPC cases were recorded within the selected date range.'
    }

    return (
      <>
        This performance card measures settlement and resolution efficiency for BCPC cases recorded within the applied date range.
        Currently, <strong className="text-slate-900 font-semibold">{settled}</strong> out of{' '}
        <strong className="text-slate-900 font-semibold">{total}</strong> cases ({rate.toFixed(1)}%)
        were successfully settled through amicable agreement, restorative diversion, or family intervention.
        {rate >= 50
          ? ' High resolution indicates proactive barangay-level child advocacy and diversion mechanisms, minimizing institutional referral.'
          : ' Ongoing or pending cases highlight the importance of sustained social worker intervention, family counseling, and close inter-agency monitoring.'}
      </>
    )
  }, [settlementData])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="BCPC Department Reports & Analytics"
        description="Comprehensive analytics, filing trends, case status distribution, resolution metrics, and detailed child protection records."
        actions={[]}
      />

      {/* Filter Bar */}
      <BcpcReportFilters
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

      {/* KPI / Stats Cards */}
      <StatsCards cards={kpiCards} loading={loading} />

      {/* Case Filing Trend Chart Panel */}
      <TrendPanel
        trend={trendObj}
        delta={deltaObj}
        showInsightsDefault={showInsights}
        customInsightMessage={bcpcInsightMessage}
        title={`${trendObj.granularityLabel} Case Filing Trend`}
        description={`BCPC cases filed per ${deltaObj.unit} within the applied date range — each point is that ${deltaObj.unit} alone, not a running total`}
        valueNoun="cases"
      />

      {/* Two Column Section: Donut Chart + Horizontal Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Case Status Breakdown */}
        <BreakdownDonutCard
          title="Case Status Breakdown"
          description="Percentage distribution across all BCPC case statuses"
          icon={PieChart}
          data={statusItems}
          centerLabel="Total Cases"
          showInsightsDefault={showInsights}
          insightMessage={bcpcStatusInsight}
          totalValue={statusData?.totalCases}
        />

        {/* Horizontal Bar Chart: CAR vs CICL Comparison */}
        <HorizontalBarCard
          title="Child Classification Comparison"
          description="Breakdown and comparison of recorded Children at Risk (CAR) vs. Children in Conflict with the Law (CICL)"
          data={categoryComparisonItems}
          yAxisWidth={170}
          maxLabelLength={30}
          showInsightsDefault={showInsights}
          insightMessage={bcpcCategoryInsight}
          totalValue={(categoryData?.carCases ?? 0) + (categoryData?.ciclCases ?? 0)}
        />
      </div>

      {/* BCPC Settlement Efficiency Performance Card */}
      <SettlementEfficiencyCard
        title="BCPC Settlement Efficiency"
        description="Resolution rate of child protection cases settled directly through diversion and amicable intervention"
        totalLabel="Total BCPC Cases"
        settledLabel="Settled Cases"
        rateLabel="Settlement Efficiency Rate"
        data={settlementData}
        loading={loading}
        showInsightsDefault={showInsights}
        insightMessage={bcpcSettlementInsight}
      />
    </div>
  )
}

export default BcpcReports
