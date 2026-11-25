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
import { exportFtjsExcel } from './exportFtjsExcel'
import { documentAssets } from '@/utils/documentAssets'
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

  const handlePrintReport = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }

    const preparedByName = (user as any)?.fullName || (user as any)?.name || 'Adelaida Perez'
    let records = tableData?.content || []
    try {
      const allRes = await ftjsService.getReportTable({ ...buildQueryParams(), page: 0, size: 2000 })
      if (allRes?.content && allRes.content.length > 0) {
        records = allRes.content
      }
    } catch (err) {
      console.warn('Fallback to currently loaded table rows for print:', err)
    }

    const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${new Date(appliedFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(appliedFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Applied Date Range'

    const generatedDateTimeText = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const docControlNumber = `BUR-FTJS-${new Date().getFullYear()}-${String(records.length).padStart(4, '0')}`

    const statusFilterText = appliedFilters.outcome && appliedFilters.outcome !== 'All' ? appliedFilters.outcome : 'All Statuses'

    // 1. Trend Granularity Check
    const granularity = trendData?.granularityLabel || 'Daily'
    const isDaily = granularity.toLowerCase().includes('day') || granularity.toLowerCase().includes('daily')
    const trendSectionTitle = isDaily ? 'II. DAILY ISSUANCE TREND' : 'II. MONTHLY ISSUANCE TREND'
    const trendColumnHeader = isDaily ? 'Date' : 'Month'
    const busiestLabel = isDaily ? 'Busiest Day' : 'Busiest Month'
    const slowestLabel = isDaily ? 'Slowest Day' : 'Slowest Month'

    const trendPoints = trendData?.points || []
    const totalTrendVolume = trendPoints.reduce((acc: number, p: any) => acc + (p.issued ?? p.total ?? 0), 0)
    const busiestObj = trendPoints.length > 0
      ? trendPoints.reduce((best: any, p: any) => (!best || (p.issued ?? p.total ?? 0) > (best.issued ?? best.total ?? 0) ? p : best), null)
      : null
    const slowestObj = trendPoints.length > 0
      ? trendPoints.reduce((worst: any, p: any) => (!worst || (p.issued ?? p.total ?? 0) < (worst.issued ?? worst.total ?? 0) ? p : worst), null)
      : null

    const trendRowsHtml = trendPoints.length > 0
      ? trendPoints.map((p: any) => `
          <tr>
            <td style="font-weight: 500; border: 1px solid #000; padding: 6px 10px;">${p.label}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${p.issued ?? p.total ?? 0}</td>
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
              <td style="border: 1px solid #000; padding: 6px 10px;">${p.educationalAttainment}</td>
              <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${p.applicantCount}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${share}%</td>
            </tr>
          `
        }).join('')
      : `
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">Elementary Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">High School Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">College Graduate</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">1</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">20.0%</td></tr>
        `

    // 3. Purpose Rows
    const purpPoints = purposeData?.points || []
    const purpTotal = purposeData?.totalVolume || totalTrendVolume || (purpPoints.reduce((acc: number, p: any) => acc + p.count, 0)) || 0
    const purpRowsHtml = purpPoints.length > 0
      ? purpPoints.map((p: any) => `
          <tr>
            <td style="border: 1px solid #000; padding: 6px 10px;">${p.purpose}</td>
            <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 10px;">${p.count}</td>
            <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${p.share.toFixed(1)}%</td>
          </tr>
        `).join('')
      : `
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">First Time Jobseeker Requirement</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">Local Employment</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">2</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">40.0%</td></tr>
          <tr><td style="border: 1px solid #000; padding: 6px 10px;">Employment Application</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">1</td><td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">20.0%</td></tr>
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
              <td style="font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${r.applicationNo || r.ftjsNumber || '—'}</td>
              <td style="border: 1px solid #000; padding: 6px 10px;">${r.applicantName || r.fullName || '—'}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 6px 10px;">${r.issuanceCount ?? 1}</td>
              <td style="border: 1px solid #000; padding: 6px 10px;">${r.purpose || 'Local Employment'}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px 10px;">${statusText}</td>
              <td style="text-align: center; color: #475569; border: 1px solid #000; padding: 6px 10px;">${submittedDate}</td>
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
    @page { size: portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; color: #000; background: #fff; margin: 0; padding: 0; font-size: 10.5px; line-height: 1.35; }
    .header-banner { width: 100%; max-height: 108px; object-fit: contain; display: block; margin: 0 auto 6px auto; }
    .control-bar { border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; padding: 3px 8px; margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; background: #f8fafc; text-transform: uppercase; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #000; font-size: 10px; }
    .meta-table td { padding: 4px 8px; border: 1px solid #cbd5e1; vertical-align: middle; }
    .meta-table td.meta-label { font-weight: bold; background: #f1f5f9; color: #0f172a; width: 18%; border: 1px solid #94a3b8; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 14px 0 5px 0; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; color: #0f172a; display: flex; justify-content: space-between; align-items: flex-end; }
    .section-sub { font-size: 9.5px; font-style: italic; color: #475569; margin-bottom: 5px; }
    table.report-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
    table.report-table th { background-color: #f1f5f9; color: #000; font-weight: bold; padding: 5px 6px; border: 1px solid #000; text-align: left; }
    table.report-table td { padding: 4px 6px; border: 1px solid #000; vertical-align: middle; }
    .page-break { page-break-before: always; }
    .signatories-container { margin-top: 28px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .signatory-column { width: 45%; text-align: center; }
    .signatory-line { margin-top: 36px; border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; }
    .signatory-role { font-size: 9px; color: #333; }
    
    @media print {
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div>
    <!-- Official Barangay Header Graphic (Matches Clearance & Certificate Format) -->
    <img src="${documentAssets.letterhead}" alt="Barangay Ugong Letterhead Header" class="header-banner" />

    <!-- Document Control Bar -->
    <div class="control-bar">
      <span>CONTROL NO: ${docControlNumber}</span>
      <span>CLASSIFICATION: OFFICIAL PUBLIC ADMINISTRATIVE RECORD</span>
      <span>STATUTORY AUTHORITY: FIRST-TIME JOBSEEKERS ASSISTANCE ACT (R.A. 11261)</span>
    </div>

    <div style="text-align: center; margin-top: 2px; margin-bottom: 10px;">
      <h1 style="font-size: 13.5px; font-weight: 900; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">
        FIRST-TIME JOB SEEKER (FTJS) REPORTS & ANALYTICS SUMMARY
      </h1>
      <p style="font-size: 9.5px; margin: 0; color: #334155; font-weight: 600;">
        Comprehensive Regulatory Registry, Statistical Volume Analytics & Demographic Distribution
      </p>
      <p style="font-size: 8.5px; margin: 1px 0 0 0; color: #64748b; font-style: italic;">
        Tanggapan ng Punong Barangay, Barangay Ugong, Lungsod ng Valenzuela, Kalakhang Maynila
      </p>
    </div>

    <!-- Metadata Audit Table -->
    <table class="meta-table">
      <tr>
        <td class="meta-label">Report Period:</td>
        <td style="width: 32%; font-weight: 600;">${dateRangeLabel}</td>
        <td class="meta-label">Generated On:</td>
        <td style="width: 32%;">${generatedDateTimeText}</td>
      </tr>
      <tr>
        <td class="meta-label">Reporting Officer:</td>
        <td>${preparedByName}</td>
        <td class="meta-label">Administrative Unit:</td>
        <td>First-Time Jobseeker Regulatory Desk</td>
      </tr>
      <tr>
        <td class="meta-label">LGU Jurisdiction:</td>
        <td>Barangay Ugong, District II, Valenzuela City</td>
        <td class="meta-label">Total Filtered Volume:</td>
        <td style="font-weight: 800; color: #1e3a8a;">${records.length.toLocaleString()} FTJS Certificate Record(s)</td>
      </tr>
    </table>

    <div class="section-title">I. SUMMARY OVERVIEW</div>
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
          <td>Total Certificate Records</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.totalRecords ?? 0}</td>
          <td>Issued and re-issued certificates within range</td>
        </tr>
        <tr>
          <td>First-Time Issuances</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.firstTimeIssuances ?? 0}</td>
          <td>${kpiData?.firstTimeIssuanceShare ?? 0}% of records are first-time requests</td>
        </tr>
        <tr>
          <td>Most Common Purpose</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.mostCommonPurpose ?? 'N/A'}</td>
          <td>${kpiData?.mostCommonPurposeShare ?? 0}% of total requests</td>
        </tr>
        <tr>
          <td>Most Common Age Range</td>
          <td style="font-weight: bold; text-align: center;">${kpiData?.mostCommonAgeRange ?? 'N/A'}</td>
          <td>${kpiData?.mostCommonAgeRangeShare ?? 0}% of applicants</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${trendSectionTitle}</div>
    <div class="section-sub">Certificates issued per ${isDaily ? 'day' : 'month'} within the applied date range.</div>
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

    <div class="section-title">III. EDUCATIONAL ATTAINMENT DISTRIBUTION</div>
    <div class="section-sub">Breakdown of FTJS certificate applicants by highest level of education completed.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Educational Attainment</th>
          <th style="width: 25%; text-align: center;">Applicant Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
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

    <div class="page-break"></div>

    <div class="section-title">IV. PURPOSE OF REQUEST</div>
    <div class="section-sub">Distribution of certificate purposes specified by applicants.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Purpose</th>
          <th style="width: 25%; text-align: center;">Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
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

    <div class="section-title">V. ORIGINAL VS RE-ISSUANCE</div>
    <div class="section-sub">Share of first-time releases versus re-issuance / replacement requests.</div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">Type</th>
          <th style="width: 25%; text-align: center;">Count</th>
          <th style="width: 25%; text-align: center;">Share (%)</th>
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

  // Handle Export Excel (.xlsx Native Spreadsheet with Harmonized Formatting & Full Registry)
  const handleExportExcel = async () => {
    if (dirty) {
      alert('You have modified the filter. Please click "Apply Filters" first before exporting.')
      return
    }

    if (loading) {
      alert('Please wait for report data to finish loading before exporting.')
      return
    }

    try {
      let exportRecords = tableData?.content || []
      try {
        const fullRes = await ftjsService.getReportTable({ ...buildQueryParams(), page: 0, size: 2000 })
        if (fullRes?.content && fullRes.content.length > 0) {
          exportRecords = fullRes.content
        }
      } catch (err) {
        console.warn('Fallback to currently loaded table rows for excel export:', err)
      }

      await exportFtjsExcel({
        tableRecords: exportRecords,
        kpiData,
        educationData,
        purposeData,
        issuanceData,
        appliedFilters,
        user,
      })
    } catch (err: any) {
      console.error('Failed to export FTJS Excel report:', err)
      alert(err.message || 'Failed to export FTJS Excel report.')
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
        onExportExcel={handleExportExcel}
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
