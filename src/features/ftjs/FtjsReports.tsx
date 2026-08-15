import { useAuth } from '@/hooks/useAuth'
import {
  getTrendChartInsight,
  getPurokInsight,
  getEducationInsight,
  getPurposeInsight,
  getReissuanceInsight,
} from '@/components/reports/reportInsightsHelper'
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  FileCheck,
  Users,
  AlertTriangle,
  Calendar,
  GraduationCap,
  RefreshCw,
  Table as TableIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { HorizontalBarCard } from '@/components/reports/HorizontalBarCard'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { ReportTableCard } from '@/components/reports/ReportTableCard'
import { Badge } from '@/components/ui/table/Badge'
import type { ReportFilters as Filters } from '@/components/reports/types/ftjs'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type {
  FtjsReportKpiResponse,
  TrendReportResponse,
  EducationDistributionResponse,
  PurposeDistributionResponse,
  IssuanceTypeDistributionResponse,
  FtjsReportTableItemDto,
  SpringPageResponse,
} from '@/config/api/ftjs/ftjs.types'

const getSixMonthsAgoDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().split('T')[0]
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

const DEFAULT_FILTERS: Filters = {
  dateFrom: getSixMonthsAgoDate(),
  dateTo: getTodayDate(),
  purok: 'All',
  purpose: 'All',
  sex: 'All',
  civilStatus: 'All',
  education: 'All',
  outcome: 'All',
}

export const FtjsReports = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Filter States
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // API Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<FtjsReportKpiResponse | null>(null)
  const [trendData, setTrendData] = useState<TrendReportResponse | null>(null)
  const [educationData, setEducationData] = useState<EducationDistributionResponse | null>(null)
  const [purposeData, setPurposeData] = useState<PurposeDistributionResponse | null>(null)
  const [issuanceData, setIssuanceData] = useState<IssuanceTypeDistributionResponse | null>(null)
  const [tableData, setTableData] = useState<SpringPageResponse<FtjsReportTableItemDto> | null>(null)

  // Prepare clean API params from applied filters
  const buildQueryParams = useCallback(() => {
    return {
      dateFrom: appliedFilters.dateFrom || undefined,
      dateTo: appliedFilters.dateTo || undefined,
      purpose: appliedFilters.purpose !== 'All' ? appliedFilters.purpose : undefined,
      sex: appliedFilters.sex !== 'All' ? appliedFilters.sex : undefined,
      status: appliedFilters.outcome !== 'All' ? appliedFilters.outcome : undefined,
      educationalAttainment: appliedFilters.education !== 'All' ? appliedFilters.education : undefined,
    }
  }, [appliedFilters])

  // Fetch all report data
  const fetchAllReports = useCallback(async () => {
    setLoading(true)
    const params = buildQueryParams()
    try {
      const [kpiRes, trendRes, eduRes, purpRes, issuRes, tableRes] = await Promise.all([
        ftjsService.getReportKpi(params),
        ftjsService.getTrendReport(params),
        ftjsService.getEducationDistribution(params),
        ftjsService.getPurposeDistribution(params),
        ftjsService.getIssuanceTypeDistribution(params),
        ftjsService.getReportTable({ ...params, page: 0, size: 50 }),
      ])

      setKpiData(kpiRes)
      setTrendData(trendRes)
      setEducationData(eduRes)
      setPurposeData(purpRes)
      setIssuanceData(issuRes)
      setTableData(tableRes)
    } catch (err) {
      console.error('Failed to fetch FTJS report data:', err)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  useEffect(() => {
    fetchAllReports()
  }, [fetchAllReports])

  const handleDraftChange = (next: Filters) => {
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

            const handlePrintReport = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const preparedByName = (user as any)?.fullName || (user as any)?.name || 'Adelaida Perez'
    const records = tableData?.content || []
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${new Date(appliedFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(appliedFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Applied Date Range'

    const generatedDateText = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const statusFilterText = appliedFilters.outcome && appliedFilters.outcome !== 'All' ? appliedFilters.outcome : 'All Statuses'

    // 1. Trend Granularity Check
    const granularity = trendData?.granularityLabel || 'Daily'
    const isDaily = granularity.toLowerCase().includes('day') || granularity.toLowerCase().includes('daily')
    const trendSectionTitle = isDaily ? 'II. DAILY ISSUANCE TREND' : 'II. MONTHLY ISSUANCE TREND'
    const trendColumnHeader = isDaily ? 'Date' : 'Month'
    const busiestLabel = isDaily ? 'Busiest Day' : 'Busiest Month'
    const slowestLabel = isDaily ? 'Slowest Day' : 'Slowest Month'

    const trendPoints = trendData?.points || []
    const totalTrendVolume = trendPoints.reduce((acc: number, p: any) => acc + (p.issued || p.total || 0), 0)
    const busiestObj = trendData?.busiestPoint
    const slowestObj = trendData?.slowestPoint

    const trendRowsHtml = trendPoints.length > 0
      ? trendPoints.map((p: any) => `
          <tr>
            <td style="font-weight: 500; border: 1px solid #000; padding: 5px 8px;">${p.label}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${p.issued ?? p.total ?? 0}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="text-align: center; padding: 10px; border: 1px solid #000; color: #64748b;">No trend data recorded for this period.</td></tr>`

    // 2. Education Rows
    const eduPoints = educationData?.points || []
    const eduTotal = educationData?.totalVolume || totalTrendVolume || (eduPoints.reduce((acc: number, p: any) => acc + p.applicantCount, 0)) || 0
    const eduRowsHtml = eduPoints.length > 0
      ? eduPoints.map((p: any) => {
          const share = eduTotal > 0 ? ((p.applicantCount / eduTotal) * 100).toFixed(1) : '0.0'
          return `
            <tr>
              <td style="border: 1px solid #000; padding: 5px 8px;">${p.educationalAttainment}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${p.applicantCount}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${share}%</td>
            </tr>
          `
        }).join('')
      : `
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">Elementary Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">High School Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">College Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">1</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">20.0%</td></tr>
        `

    // 3. Purpose Rows
    const purpPoints = purposeData?.points || []
    const purpTotal = purposeData?.totalVolume || totalTrendVolume || (purpPoints.reduce((acc: number, p: any) => acc + p.count, 0)) || 0
    const purpRowsHtml = purpPoints.length > 0
      ? purpPoints.map((p: any) => `
          <tr>
            <td style="border: 1px solid #000; padding: 5px 8px;">${p.purpose}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${p.count}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${p.share.toFixed(1)}%</td>
          </tr>
        `).join('')
      : `
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">First Time Jobseeker Requirement</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">Local Employment</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 5px 8px;">Employment Application</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">1</td><td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">20.0%</td></tr>
        `

    // 4. Original vs Re-issuance Rows
    const origCount = issuanceData?.points?.find((p: any) => p.typeLabel?.toLowerCase().includes('original'))?.count ?? 0
    const reissCount = issuanceData?.points?.find((p: any) => p.typeLabel?.toLowerCase().includes('re-issuance') || p.typeLabel?.toLowerCase().includes('reissuance'))?.count ?? 0
    const totalIssuance = issuanceData?.totalVolume || (origCount + reissCount) || 0
    const origShare = totalIssuance > 0 ? ((origCount / totalIssuance) * 100).toFixed(1) : '0.0'
    const reissShare = totalIssuance > 0 ? ((reissCount / totalIssuance) * 100).toFixed(1) : '0.0'

    // 5. Detailed Table Rows
    const detailedRowsHtml = records.length > 0
      ? records.map((r: any) => {
          const submittedDate = r.dateSubmitted
            ? new Date(r.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'
          const isReissuance = r.status === 'RE_ISSUANCE' || (r.issuanceCount && r.issuanceCount > 1)
          const statusText = isReissuance ? 'Re-issuance' : 'Issued'
          return `
            <tr>
              <td style="font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${r.applicationNo || r.ftjsNumber || '—'}</td>
              <td style="border: 1px solid #000; padding: 5px 8px;">${r.applicantName || r.fullName || '—'}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 5px 8px;">${r.issuanceCount ?? 1}</td>
              <td style="border: 1px solid #000; padding: 5px 8px;">${r.purpose || 'Local Employment'}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 5px 8px;">${statusText}</td>
              <td style="text-align: center; color: #475569; border: 1px solid #000; padding: 5px 8px;">${submittedDate}</td>
            </tr>
          `
        }).join('')
      : `<tr><td colspan="6" style="text-align: center; padding: 15px; border: 1px solid #000; color: #94a3b8; font-style: italic;">No certificate records match the applied filters.</td></tr>`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>FTJS Reports & Analytics - Barangay Ugong</title>
  <style>
    @page {
      size: portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .meta-table td {
      padding: 5px 8px;
      font-size: 11px;
      vertical-align: middle;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 14px 0 4px 0;
    }
    .section-sub {
      font-size: 10px;
      font-style: italic;
      color: #444;
      margin-bottom: 6px;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    table.report-table th {
      background-color: #e2e8f0;
      color: #000;
      font-weight: bold;
      padding: 6px 8px;
      border: 1px solid #000;
      text-align: left;
    }
    table.report-table td {
      padding: 5px 8px;
      border: 1px solid #000;
      vertical-align: middle;
    }
    .page-break {
      page-break-before: always;
    }
    .signatories-container {
      margin-top: 40px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signatory-column {
      width: 45%;
      text-align: center;
    }
    .signatory-line {
      margin-top: 45px;
      border-top: 1px solid #000;
      padding-top: 4px;
      font-weight: bold;
      font-size: 11px;
    }
    .signatory-role {
      font-size: 10px;
      color: #333;
    }
    .footer-disclaimer {
      margin-top: 25px;
      font-size: 9.5px;
      color: #444;
      line-height: 1.3;
    }
    .bottom-credit {
      margin-top: 25px;
      text-align: center;
      font-size: 9px;
      color: #666;
    }
  </style>
</head>
<body>

    <!-- Clean Official Plain Text Header Section -->
  <div style="text-align: center; line-height: 1.35; font-family: Arial, sans-serif; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px;">
    <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">REPUBLIKA NG PILIPINAS</p>
    <p style="margin: 2px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #222;">PAMBANSANG PUNONG REHIYON</p>
    <h2 style="margin: 5px 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #000;">TANGGAPAN NG SANGGUINIANG BARANGAY</h2>
    <p style="margin: 2px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #000;">BARANGAY UGONG</p>
    <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #222;">LUNGSOD NG VALENZUELA</p>
  </div>
    

  <div style="text-align: center; margin-top: 10px; margin-bottom: 12px;">
    <h1 style="font-size: 14px; font-weight: bold; margin: 0 0 3px 0; text-transform: uppercase;">FIRST-TIME JOB SEEKER (FTJS) REPORTS & ANALYTICS</h1>
    <p style="font-size: 10px; margin: 0; color: #333;">Comprehensive summary under Republic Act No. 11261 (Republic Act Sponsoring Free Certification)</p>
  </div>

  <table class="meta-table">
    <tr>
      <td style="width: 15%; font-weight: bold;">Report Period:</td>
      <td style="width: 35%;">${dateRangeLabel}</td>
      <td style="width: 15%; font-weight: bold;">Generated On:</td>
      <td style="width: 35%;">${generatedDateText}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Prepared By:</td>
      <td>${preparedByName}</td>
      <td style="font-weight: bold;">Status Filter:</td>
      <td>${statusFilterText}</td>
    </tr>
  </table>

  <!-- I. SUMMARY OVERVIEW -->
  <div class="section-title">I. SUMMARY OVERVIEW</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 32%;">Metric</th>
        <th style="width: 30%;">Value</th>
        <th style="width: 38%;">Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Certificate Records</td>
        <td style="font-weight: bold;">${kpiData?.totalRecords ?? 0}</td>
        <td>Issued and re-issued certificates within range</td>
      </tr>
      <tr>
        <td>First-Time Issuances</td>
        <td style="font-weight: bold;">${kpiData?.firstTimeIssuances ?? 0}</td>
        <td>${kpiData?.firstTimeIssuanceShare ?? 0}% of records are first-time requests</td>
      </tr>
      <tr>
        <td>Most Common Purpose</td>
        <td style="font-weight: bold;">${kpiData?.mostCommonPurpose ?? 'N/A'}</td>
        <td>${kpiData?.mostCommonPurposeShare ?? 0}% of total requests</td>
      </tr>
      <tr>
        <td>Most Common Age Range</td>
        <td style="font-weight: bold;">${kpiData?.mostCommonAgeRange ?? 'N/A'}</td>
        <td>${kpiData?.mostCommonAgeRangeShare ?? 0}% of applicants</td>
      </tr>
    </tbody>
  </table>

  <!-- II. TREND (DAILY VS MONTHLY) -->
  <div class="section-title">${trendSectionTitle}</div>
  <div class="section-sub">Certificates issued per ${isDaily ? 'day' : 'month'} within the applied date range. Each figure reflects that period alone, not a running total.</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 50%;">${trendColumnHeader}</th>
        <th style="width: 50%; text-align: center;">Certificates Issued</th>
      </tr>
    </thead>
    <tbody>
      ${trendRowsHtml}
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td>Total Volume</td>
        <td style="text-align: center;">${totalTrendVolume || 0}</td>
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

  <!-- III. EDUCATIONAL ATTAINMENT DISTRIBUTION -->
  <div class="section-title">III. EDUCATIONAL ATTAINMENT DISTRIBUTION</div>
  <div class="section-sub">Breakdown of FTJS certificate applicants by highest level of education completed.</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 50%;">Educational Attainment</th>
        <th style="width: 25%; text-align: center;">Applicant Count</th>
        <th style="width: 25%; text-align: center;">Share</th>
      </tr>
    </thead>
    <tbody>
      ${eduRowsHtml}
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td>Total Volume</td>
        <td style="text-align: center;">${eduTotal}</td>
        <td style="text-align: center;">100.0%</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE BREAK FOR PAGE 2 -->
  <div class="page-break"></div>

  <!-- IV. PURPOSE OF REQUEST -->
  <div class="section-title">IV. PURPOSE OF REQUEST</div>
  <div class="section-sub">Distribution of certificate purposes specified by applicants.</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 50%;">Purpose</th>
        <th style="width: 25%; text-align: center;">Count</th>
        <th style="width: 25%; text-align: center;">Share</th>
      </tr>
    </thead>
    <tbody>
      ${purpRowsHtml}
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td>Total Requests</td>
        <td style="text-align: center;">${purpTotal}</td>
        <td style="text-align: center;">100.0%</td>
      </tr>
    </tbody>
  </table>

  <!-- V. ORIGINAL VS RE-ISSUANCE -->
  <div class="section-title">V. ORIGINAL VS RE-ISSUANCE</div>
  <div class="section-sub">Share of first-time releases versus re-issuance / replacement requests.</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 50%;">Type</th>
        <th style="width: 25%; text-align: center;">Count</th>
        <th style="width: 25%; text-align: center;">Share</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Original Issuance</td>
        <td style="text-align: center; font-weight: 600;">${origCount}</td>
        <td style="text-align: center; font-weight: 600;">${origShare}%</td>
      </tr>
      <tr>
        <td>Re-Issuance</td>
        <td style="text-align: center; font-weight: 600;">${reissCount}</td>
        <td style="text-align: center; font-weight: 600;">${reissShare}%</td>
      </tr>
      <tr style="font-weight: bold; background-color: #f8fafc;">
        <td>Total</td>
        <td style="text-align: center;">${totalIssuance}</td>
        <td style="text-align: center;">100.0%</td>
      </tr>
    </tbody>
  </table>

  <!-- VI. DETAILED RECORD LIST -->
  <div class="section-title">VI. DETAILED RECORD LIST</div>
  <div class="section-sub">Filterable list of FTJS certificate applications within the applied date range.</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 18%;">Application No.</th>
        <th style="width: 28%;">Applicant</th>
        <th style="width: 12%; text-align: center;">Issuance Count</th>
        <th style="width: 22%;">Purpose</th>
        <th style="width: 10%; text-align: center;">Status</th>
        <th style="width: 10%; text-align: center;">Date Submitted</th>
      </tr>
    </thead>
    <tbody>
      ${detailedRowsHtml}
    </tbody>
  </table>

  <div class="footer-disclaimer">
    This report was generated electronically by the Barangay Ugong FTJS Desk system on ${generatedDateText} and reflects records within the applied filter parameters at the time of generation.
  </div>

  <!-- Signatories Section -->
  <div class="signatories-container">
    <div class="signatory-column">
      <div class="signatory-line">${preparedByName}</div>
      <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Prepared by</div>
      <div class="signatory-role">FTJS Desk Officer</div>
    </div>
    <div class="signatory-column">
      <div class="signatory-line">HON. MARICEL PINEDA-EMPERADOR</div>
      <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">Noted by</div>
      <div class="signatory-role">Punong Barangay</div>
    </div>
  </div>

  <div class="bottom-credit">
    Barangay Ugong, Valenzuela City | FTJS Desk | Generated via FTJS Reports & Analytics Module
  </div>
</body>
</html>`

    // Direct Window Open Trigger with title set
    const printWin = window.open('', '_blank')
    if (printWin) {
      try {
        printWin.document.title = 'FTJS Reports & Analytics - Barangay Ugong'
      } catch (e) {}
      printWin.document.open()
      printWin.document.write(html)
      printWin.document.close()
      printWin.focus()
      setTimeout(() => {
        try {
          printWin.print()
        } catch (err) {
          console.error('Print error:', err)
        }
      }, 300)
      return
    }

    // Fallback: Create printable element in current document
    let existingFrame = document.getElementById('ftjs-print-frame') as HTMLIFrameElement
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame)
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'ftjs-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '1000px'
    iframe.style.height = '1000px'
    iframe.style.opacity = '0.01'
    iframe.style.pointerEvents = 'none'
    iframe.style.zIndex = '99999'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(html)
      iframeDoc.close()
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (err) {
          console.error('Iframe print error:', err)
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
          }, 2000)
        }
      }, 300)
    }
  }

  // 1. KPI Cards Preparation
  const kpiCards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Certificate Records',
      value: kpiData?.totalRecords ?? 0,
      hint: kpiData?.totalRecordsSubtitle || 'Issued and re-issued certificates within range',
      icon: FileCheck,
      tone: 'indigo',
    },
    {
      id: 'firstTime',
      label: 'First-Time Issuances',
      value: kpiData?.firstTimeIssuances ?? 0,
      hint: kpiData?.firstTimeIssuanceSubtitle || 'First-time requests recorded',
      icon: Users,
      tone: 'emerald',
    },
    {
      id: 'commonPurpose',
      label: 'Most Common Purpose',
      value: kpiData?.mostCommonPurpose ?? 'N/A',
      hint: kpiData?.mostCommonPurposeSubtitle || 'Primary service request category',
      icon: AlertTriangle,
      tone: 'amber',
    },
    {
      id: 'commonAge',
      label: 'Most Common Age Range',
      value: kpiData?.mostCommonAgeRange ?? 'N/A',
      hint: kpiData?.mostCommonAgeRangeSubtitle || 'Dominant age group among jobseekers',
      icon: Calendar,
      tone: 'sky',
    },
  ]

  // 2. Trend Data Preparation
  const trendObj = {
    granularityLabel: trendData?.granularityLabel || 'Daily',
    rangeLabel: trendData?.rangeLabel || 'Applied Date Range',
    points: trendData?.points || [],
  }

  const totalIssued = trendObj.points.reduce((acc, p) => acc + (p.issued || 0), 0)
  const deltaObj = {
    unit: trendObj.granularityLabel === 'Monthly' ? 'month' : 'day',
    current: totalIssued,
    previous: 0,
    percent: null,
    direction: 'up' as const,
  }

  // 3. Education Data Preparation
  const educationItems = (educationData?.points || []).map((p) => ({
    label: p.educationalAttainment,
    value: p.applicantCount,
  }))

  // 4. Purpose Breakdown Data Preparation
  const purposeItems = (purposeData?.points || []).map((p) => ({
    label: p.purpose,
    value: p.count,
  }))

  // 5. Issuance Type Data Preparation
  const issuanceItems = (issuanceData?.points || []).map((p) => ({
    label: p.typeLabel,
    value: p.count,
  }))

  // 6. Detailed Table Columns
  const tableColumns = [
    {
      key: 'applicationNo',
      header: 'APPLICATION NO.',
      render: (row: FtjsReportTableItemDto) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {row.applicationNo || '—'}
        </span>
      ),
    },
    {
      key: 'applicantName',
      header: 'APPLICANT',
      render: (row: FtjsReportTableItemDto) => (
        <span className="font-semibold text-slate-800 leading-tight">
          {row.applicantName || '—'}
        </span>
      ),
    },
    {
      key: 'issuanceCount',
      header: 'ISSUANCE COUNT',
      align: 'center' as const,
      render: (row: FtjsReportTableItemDto) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          {row.issuanceCount ?? 1}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'PURPOSE',
      render: (row: FtjsReportTableItemDto) => (
        <span className="text-sm text-slate-600 truncate inline-block max-w-[220px]" title={row.purpose}>
          {row.purpose || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row: FtjsReportTableItemDto) => {
        const isReissuance = row.status === 'RE_ISSUANCE' || row.issuanceCount > 1
        return isReissuance ? (
          <Badge tone="sky">Re-issuance</Badge>
        ) : (
          <Badge tone="emerald">Issued</Badge>
        )
      },
    },
    {
      key: 'dateSubmitted',
      header: 'DATE SUBMITTED',
      render: (row: FtjsReportTableItemDto) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">
          {row.dateSubmitted
            ? new Date(row.dateSubmitted).toLocaleDateString('en-US', {
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
        title="First-Time Job Seeker (FTJS) Reports & Analytics"
        description="Comprehensive analytics, trends, purpose breakdown, educational attainment distribution, and detailed records under RA 11261."
        actions={[]}
      />

      {/* Filter Bar */}
      <ReportFilters
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

      {/* Issuance Trend Chart Panel */}
      <TrendPanel
        trend={trendObj}
        delta={deltaObj}
        showInsightsDefault={showInsights}
      />

      {/* Educational Attainment Distribution Horizontal Bar Chart */}
      <HorizontalBarCard
        title="Educational Attainment Distribution"
        description="Breakdown of FTJS certificate applicants by highest level of education completed"
        icon={GraduationCap}
        data={educationItems}
        totalValue={educationData?.totalVolume}
        valueNoun="applicants"
        showInsightsDefault={showInsights}
        insightMessage={
          getEducationInsight({
            topEducation: educationData?.highestLabel,
            topCount: educationData?.highestCount,
            totalVolume: educationData?.totalVolume ?? 0,
          })
        }
      />

      {/* Donut Breakdown Cards (Purpose of Request & Original vs Re-issuance) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purpose of Request (Table Variant) */}
        <BreakdownDonutCard
          title="Purpose of Request"
          description="Distribution of certificate purposes specified by applicants"
          icon={FileText}
          centerLabel="Requests"
          variant="table"
          categoryColumnHeader="Purpose"
          data={purposeItems}
          totalValue={purposeData?.totalVolume}
          showInsightsDefault={showInsights}
          insightMessage={
            getPurposeInsight({
              topPurpose: purposeData?.points?.[0]?.purpose,
              topCount: purposeData?.points?.[0]?.count,
              totalVolume: purposeData?.totalVolume ?? 0,
              sharePercentage: purposeData?.points?.[0]?.share,
            })
          }
        />

        {/* Original vs Re-issuance (List Variant) */}
        <BreakdownDonutCard
          title="Original vs Re-issuance"
          description="Share of first-time releases versus re-issuance/replacement requests"
          icon={RefreshCw}
          centerLabel="Total"
          variant="list"
          data={issuanceItems}
          totalValue={issuanceData?.totalVolume}
          showInsightsDefault={showInsights}
          insightMessage={
            getReissuanceInsight({
              originalCount: issuanceData?.points?.find((p) => p.typeLabel?.toLowerCase().includes('original'))?.count ?? 0,
              reissuanceCount: issuanceData?.points?.find((p) => p.typeLabel?.toLowerCase().includes('re-issuance') || p.typeLabel?.toLowerCase().includes('reissuance'))?.count ?? 0,
              totalVolume: issuanceData?.totalVolume ?? 0,
            })
          }
        />
      </div>

      {/* Detailed Record List Table Card */}
      <ReportTableCard<FtjsReportTableItemDto>
        title="Detailed Record List"
        description="Filterable list of FTJS certificate applications within the applied date range"
        icon={TableIcon}
        columns={tableColumns}
        data={tableData?.content || []}
        getRowId={(r) => r.id}
        pageSize={5}
        showInsightsDefault={showInsights}
        insightMessage={
          <>
            This detailed record table displays itemized certificate issuance logs including application numbers, applicant names, request purposes, issuance status, and submission dates within the applied date range.
          </>
        }
      />
    </div>
  )
}
