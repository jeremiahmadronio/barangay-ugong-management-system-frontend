import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Award,
  Clock,
  Users,
  Layers,
  BarChart3,
  Eye,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import {
  ClearanceReportFilters,
  type ClearanceFilterState,
} from '@/components/reports/ClearanceReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { HorizontalBarCard } from '@/components/reports/HorizontalBarCard'
import { type Delta, type TrendResult } from '@/components/reports/utils/trendAnalytics'
import { clearanceService } from '@/config/api/clearance/clearance.service'
import type {
  ClearanceReportKpiResponse,
  ClearanceDailyTrendResponse,
  ClearanceMonthlyTrendResponse,
  ClearanceTypeBreakdownResponse,
  ClearancePurposeBreakdownResponse,
  ClearanceDashboardKpiResponse,
  IssuedCertificateTableResponse,
} from '@/config/api/clearance/clearance.types'
import { DataTable } from '@/components/ui/table/DataTable'
import type { Column, RowAction } from '@/components/ui/table/types'
import { Badge } from '@/components/ui/table/Badge'
import { formatDate } from '@/utils/formatters'
import { ClearanceDetailsView } from './components/ClearanceDetailsView'

import { useAuth } from '@/hooks/useAuth'
import { documentAssets } from '@/utils/documentAssets'
import { exportClearanceExcel } from './exportClearanceExcel'

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

const DEFAULT_FILTERS: ClearanceFilterState = {
  dateFrom: getSixMonthsAgoDate(),
  dateTo: getTodayDate(),
}

// Format name helper (e.g. "Madronio, Jeremiah D.")
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

export function ClearanceReports() {
  const { user } = useAuth()

  // Filter States
  const [draftFilters, setDraftFilters] = useState<ClearanceFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ClearanceFilterState>(DEFAULT_FILTERS)
  const [dirty, setDirty] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // Compute difference in days to adaptively pick Daily (<= 31 days) vs Monthly (> 31 days)
  const diffDays = useMemo(() => {
    if (!appliedFilters.dateFrom || !appliedFilters.dateTo) return 180
    const start = new Date(appliedFilters.dateFrom).getTime()
    const end = new Date(appliedFilters.dateTo).getTime()
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
  }, [appliedFilters.dateFrom, appliedFilters.dateTo])

  const useDaily = diffDays <= 31

  // API Loading & Data States
  const [loading, setLoading] = useState(false)
  const [kpiData, setKpiData] = useState<ClearanceReportKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<ClearanceDailyTrendResponse[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<ClearanceMonthlyTrendResponse[]>([])
  const [typeBreakdown, setTypeBreakdown] = useState<ClearanceTypeBreakdownResponse | null>(null)
  const [purposeBreakdown, setPurposeBreakdown] = useState<ClearancePurposeBreakdownResponse | null>(null)
  const [tableRecords, setTableRecords] = useState<IssuedCertificateTableResponse[]>([])
  const [dashboardKpi, setDashboardKpi] = useState<ClearanceDashboardKpiResponse | null>(null)

  // Record Details View Mode
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<IssuedCertificateTableResponse | null>(null)
  const [viewMode, setViewMode] = useState<'REPORT' | 'DETAILS'>('REPORT')

  const handleViewDetails = (record: IssuedCertificateTableResponse) => {
    setSelectedRecord(record)
    setSelectedRecordId(record.id)
    setViewMode('DETAILS')
  }

  const tableActions: RowAction<IssuedCertificateTableResponse>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: handleViewDetails,
      },
    ],
    []
  )

  // Fetch all report data
  const fetchAllReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        startDate: appliedFilters.dateFrom || undefined,
        endDate: appliedFilters.dateTo || undefined,
      }

      const [kpiRes, dailyRes, monthRes, typeRes, purposeRes, recordsRes, dashRes] = await Promise.all([
        clearanceService.getReportKpi(params).catch(() => null),
        clearanceService.getDailyTrend(params).catch(() => []),
        clearanceService.getMonthlyTrend(params).catch(() => []),
        clearanceService.getTypeBreakdown(params).catch(() => null),
        clearanceService.getPurposeBreakdown(params).catch(() => null),
        clearanceService.getIssuedCertificates().catch(() => []),
        clearanceService.getDashboardKpi().catch(() => null),
      ])

      setKpiData(kpiRes)
      setDailyTrend(dailyRes || [])
      setMonthlyTrend(monthRes || [])
      setTypeBreakdown(typeRes)
      setPurposeBreakdown(purposeRes)
      setTableRecords(recordsRes || [])
      setDashboardKpi(dashRes)
    } catch (err) {
      console.error('Failed to fetch clearance reports:', err)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchAllReports()
  }, [fetchAllReports])

  const handleDraftChange = (next: ClearanceFilterState) => {
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

  // Build 4 KPI Stat Cards with Clean Typography
  const statCards: StatCard[] = useMemo(() => {
    const total = kpiData?.totalIssued ?? 0
    const malePct = kpiData ? kpiData.malePercentage.toFixed(1) : '0.0'
    const femalePct = kpiData ? kpiData.femalePercentage.toFixed(1) : '0.0'
    const maleCount = kpiData?.maleCount ?? 0
    const femaleCount = kpiData?.femaleCount ?? 0

    return [
      {
        id: 'total-issued',
        title: 'Total Issued Certificates',
        value: total.toLocaleString(),
        subtitle: 'Official clearances released in period',
        icon: FileText,
        tone: 'indigo',
      },
      {
        id: 'most-issued',
        title: 'Most Issued Certificate',
        value: kpiData?.mostIssuedCertName && kpiData.mostIssuedCertName !== '—'
          ? kpiData.mostIssuedCertName
          : 'Barangay Clearance',
        subtitle: kpiData && total > 0
          ? `${kpiData.mostIssuedCertCount} issued (${((kpiData.mostIssuedCertCount / Math.max(total, 1)) * 100).toFixed(0)}% of total)`
          : '0 issued',
        icon: Award,
        tone: 'indigo',
      },
      {
        id: 'total-expired',
        title: 'Total Expired Certificates',
        value: kpiData ? kpiData.totalExpired.toLocaleString() : '0',
        subtitle: 'Lapsed or expired validity period',
        icon: Clock,
        tone: 'amber',
      },
      {
        id: 'gender-breakdown',
        title: 'Applicant Demographics',
        value: total > 0 ? `${maleCount} Male / ${femaleCount} Female` : '0 Male / 0 Female',
        subtitle: total > 0 ? `${malePct}% Male, ${femalePct}% Female` : 'No applicant records in period',
        icon: Users,
        tone: 'emerald',
      },
    ]
  }, [kpiData])

  // Transform Trend Data for TrendPanel adaptively based on date filter range
  const { trendResult, deltaResult }: { trendResult: TrendResult; deltaResult: Delta } = useMemo(() => {
    const points = useDaily
      ? dailyTrend.map((d) => ({
          label: d.label,
          issued: d.totalIssued,
          pointDate: d.date,
        }))
      : monthlyTrend.map((m) => ({
          label: m.monthLabel,
          issued: m.totalIssued,
          pointDate: `${m.year}-${String(m.month).padStart(2, '0')}-01`,
        }))

    const rangeLabel = `${formatDate(appliedFilters.dateFrom)} – ${formatDate(appliedFilters.dateTo)}`
    const granularityLabel = useDaily ? 'Daily' : 'Monthly'

    const trend: TrendResult = {
      granularity: useDaily ? 'day' : 'month',
      granularityLabel,
      rangeLabel,
      points,
    }

    const currentSum = points.slice(-Math.ceil(points.length / 2)).reduce((acc, p) => acc + p.issued, 0)
    const prevSum = points.slice(0, Math.floor(points.length / 2)).reduce((acc, p) => acc + p.issued, 0)
    const diff = currentSum - prevSum
    const pct = prevSum > 0 ? (diff / prevSum) * 100 : 0

    const delta: Delta = {
      current: currentSum,
      previous: prevSum,
      percent: pct,
      direction: diff >= 0 ? 'up' : 'down',
      unit: useDaily ? 'period' : 'cycle',
    }

    return { trendResult: trend, deltaResult: delta }
  }, [useDaily, dailyTrend, monthlyTrend, appliedFilters])

  // Table Columns matching Clearance Issued Table style
  const tableColumns: Column<IssuedCertificateTableResponse>[] = useMemo(() => [
    {
      key: 'certNumber',
      header: 'APPLICATION NO.',
      render: (r) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {r.certNumber}
        </span>
      ),
    },
    {
      key: 'requestorName',
      header: 'NAME',
      render: (r) => (
        <div>
          <span className="text-sm font-semibold text-slate-800 block whitespace-nowrap">
            {formatRequestorName(r.requestorName)}
          </span>
          {r.totalIssuances && r.totalIssuances > 1 ? (
            <span className="block text-[10px] text-blue-600 font-medium">
              {r.totalIssuances}x Issued (Latest)
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'certTitle',
      header: 'TYPE OF CERTIFICATE',
      render: (r) => (
        <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
          {r.certTitle}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'PURPOSE',
      render: (r) => {
        const text = r.purpose || 'General Purpose'
        return (
          <span
            title={text}
            className="text-sm font-normal text-slate-600 block max-w-[180px] truncate"
          >
            {text}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const isExpired = r.status?.toUpperCase() === 'EXPIRED'
        return (
          <Badge tone={isExpired ? 'amber' : 'emerald'}>
            {r.status ? r.status.toUpperCase() : 'ACTIVE'}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'DATE SUBMITTED',
      render: (r) => (
        <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
          {formatDate(r.createdAt)}
        </span>
      ),
    },
  ], [])

  // 100% Filter-Synchronized Table Records (Date Range)
  const filteredRecords = useMemo(() => {
    return tableRecords.filter((r) => {
      if (appliedFilters.dateFrom) {
        const fromParts = appliedFilters.dateFrom.split('-')
        const fromTime = fromParts.length === 3
          ? new Date(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0, 0).getTime()
          : new Date(appliedFilters.dateFrom).setHours(0, 0, 0, 0)
        const recTime = new Date(r.createdAt).getTime()
        if (recTime < fromTime) return false
      }
      if (appliedFilters.dateTo) {
        const toParts = appliedFilters.dateTo.split('-')
        const toTime = toParts.length === 3
          ? new Date(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999).getTime()
          : new Date(appliedFilters.dateTo).setHours(23, 59, 59, 999)
        const recTime = new Date(r.createdAt).getTime()
        if (recTime > toTime) return false
      }
      return true
    })
  }, [tableRecords, appliedFilters])

  // Handle Official Print PDF (New Window Preview with Barangay Header, Seals, Complete Data & Signatories)
  const handlePrintPdf = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (dirty) {
      alert('You have modified the date filter. Please click "Apply Filters" first to update the report for your selected date range before printing.')
      return
    }

    if (loading) {
      alert('Please wait for report data to finish loading before printing.')
      return
    }

    const preparedByName = (user as any)?.fullName || (user as any)?.name || 'Clearance Processing Officer'
    const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${formatDate(appliedFilters.dateFrom)} – ${formatDate(appliedFilters.dateTo)}`
      : 'All Recorded Dates'

    const generatedDateTimeText = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // 1. KPI Summary Data
    const totalIssued = kpiData?.totalIssued ?? 0
    const mostIssuedName = kpiData?.mostIssuedCertName && kpiData.mostIssuedCertName !== '—'
      ? kpiData.mostIssuedCertName
      : 'Barangay Clearance'
    const mostIssuedCount = kpiData?.mostIssuedCertCount ?? 0
    const mostIssuedPct = totalIssued > 0 ? ((mostIssuedCount / totalIssued) * 100).toFixed(1) : '0.0'
    const totalExpired = kpiData?.totalExpired ?? 0
    const expiredPct = totalIssued > 0 ? ((totalExpired / totalIssued) * 100).toFixed(1) : '0.0'
    const maleCount = kpiData?.maleCount ?? 0
    const femaleCount = kpiData?.femaleCount ?? 0
    const malePct = kpiData ? kpiData.malePercentage.toFixed(1) : '0.0'
    const femalePct = kpiData ? kpiData.femalePercentage.toFixed(1) : '0.0'

    // Real-time Dashboard KPI fallback
    const totalActiveCirculation = dashboardKpi?.totalActiveClearances ?? Math.max(totalIssued - totalExpired, 0)
    const totalIssuedToday = dashboardKpi?.totalIssuedToday ?? 0
    const totalIssuedThisWeek = dashboardKpi?.totalIssuedThisWeek ?? 0

    // 2. Statutory Exemption and O.R. Audit Breakdown
    let paidWithOrCount = 0
    let ftjsExemptCount = 0
    let indigencyExemptCount = 0
    let generalExemptCount = 0
    let ctnCount = 0

    filteredRecords.forEach((r) => {
      if (r.ctnNumber && r.ctnNumber.trim() && r.ctnNumber !== '—') ctnCount++

      const lowerTitle = (r.certTitle || '').toLowerCase()
      const lowerPurpose = (r.purpose || '').toLowerCase()

      if (r.orNumber && r.orNumber.trim() && r.orNumber !== '—') {
        paidWithOrCount++
      } else if (lowerTitle.includes('first time') || lowerPurpose.includes('first time') || lowerPurpose.includes('ftjs') || lowerPurpose.includes('11261')) {
        ftjsExemptCount++
      } else if (lowerTitle.includes('indigen') || lowerPurpose.includes('indigen') || lowerPurpose.includes('financial') || lowerPurpose.includes('medical assistance')) {
        indigencyExemptCount++
      } else {
        generalExemptCount++
      }
    })

    const totalExempted = ftjsExemptCount + indigencyExemptCount + generalExemptCount
    const totalRecordsCount = Math.max(filteredRecords.length, 1)

    // 3. Certificate Type Breakdown Rows
    const typeItems = typeBreakdown?.breakdown || []
    const typeRowsHtml = typeItems.length > 0
      ? typeItems.map((item, idx) => {
          const lower = item.certTitle.toLowerCase()
          let classification = 'Standard Regulatory / Administrative'
          if (lower.includes('indigen')) classification = 'Social Welfare Assistance (Indigent)'
          else if (lower.includes('first time') || lower.includes('ftjs')) classification = 'Statutory Employment (R.A. 11261)'
          else if (lower.includes('residency')) classification = 'Civil Identification & Residency'
          else if (lower.includes('business')) classification = 'Commercial & Permitting Regulatory'
          else if (lower.includes('utility') || lower.includes('electric') || lower.includes('water')) classification = 'Utility Installation Regulatory'

          return `
            <tr>
              <td style="text-align: center; border: 1px solid #000; padding: 4px 6px; font-weight: 600;">${idx + 1}</td>
              <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 600;">${item.certTitle}</td>
              <td style="border: 1px solid #000; padding: 4px 8px; font-size: 9.5px; color: #334155;">${classification}</td>
              <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 4px 8px;">${item.count.toLocaleString()}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 4px 8px;">${item.percentage.toFixed(1)}%</td>
            </tr>
          `
        }).join('')
      : `<tr><td colspan="5" style="text-align: center; padding: 8px; border: 1px solid #000; color: #64748b;">No certificate template distribution records available.</td></tr>`

    // 4. Top Application Purposes Rows
    const purposeItems = purposeBreakdown?.breakdown || []
    const purposeRowsHtml = purposeItems.length > 0
      ? purposeItems.slice(0, 10).map((item, idx) => {
          const lower = (item.purpose || '').toLowerCase()
          let category = 'General Public Requirement'
          if (lower.includes('employ') || lower.includes('job') || lower.includes('work')) category = 'Local / Overseas Employment'
          else if (lower.includes('bank') || lower.includes('loan') || lower.includes('financial')) category = 'Banking & Financial Transaction'
          else if (lower.includes('postal') || lower.includes('id') || lower.includes('passport')) category = 'Government Identification'
          else if (lower.includes('school') || lower.includes('scholarship') || lower.includes('enrol')) category = 'Educational & Academic'
          else if (lower.includes('water') || lower.includes('electric') || lower.includes('meralco')) category = 'Utility & Housing Installation'
          else if (lower.includes('legal') || lower.includes('court') || lower.includes('bail') || lower.includes('police')) category = 'Legal & Judicial Requirement'

          return `
            <tr>
              <td style="text-align: center; border: 1px solid #000; padding: 4px 6px; font-weight: 600;">${idx + 1}</td>
              <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 600;">${item.purpose || 'General Purpose'}</td>
              <td style="border: 1px solid #000; padding: 4px 8px; font-size: 9.5px; color: #334155;">${category}</td>
              <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 4px 8px;">${item.count.toLocaleString()}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 4px 8px;">${item.percentage.toFixed(1)}%</td>
            </tr>
          `
        }).join('')
      : `<tr><td colspan="5" style="text-align: center; padding: 8px; border: 1px solid #000; color: #64748b;">No purpose distribution records available.</td></tr>`

    // 5. Timeline Trend Rows & Peak Calculation
    const activeTrendList = useDaily ? dailyTrend : (monthlyTrend.length > 0 ? monthlyTrend : dailyTrend)
    const trendPoints = activeTrendList.map((item: any) => ({
      label: item.label || item.dayLabel || item.monthLabel || 'N/A',
      issued: item.totalIssued ?? item.issued ?? 0,
    }))
    const trendColumnHeader = useDaily ? 'Issuance Date' : 'Month Period'
    const trendSectionTitle = useDaily ? 'V. DAILY CERTIFICATE ISSUANCE TIMELINE' : 'V. MONTHLY CERTIFICATE ISSUANCE TIMELINE'

    const peakPoint = trendPoints.length > 0
      ? trendPoints.reduce((max: any, p: any) => (!max || p.issued > max.issued ? p : max), null)
      : null
    const totalTrendSum = trendPoints.reduce((sum: number, p: any) => sum + p.issued, 0)

    const trendRowsHtml = trendPoints.length > 0
      ? trendPoints.map((p: any) => {
          const isPeak = peakPoint && p.issued === peakPoint.issued && p.issued > 0
          const sharePct = totalTrendSum > 0 ? ((p.issued / totalTrendSum) * 100).toFixed(1) : '0.0'
          return `
            <tr style="${isPeak ? 'background-color: #fefce8;' : ''}">
              <td style="font-weight: ${isPeak ? 'bold' : '500'}; border: 1px solid #000; padding: 4px 8px;">${p.label}</td>
              <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 4px 8px;">${p.issued.toLocaleString()}</td>
              <td style="text-align: center; font-weight: 600; border: 1px solid #000; padding: 4px 8px;">${sharePct}%</td>
              <td style="border: 1px solid #000; padding: 4px 8px; font-size: 9.5px; text-align: center;">${isPeak ? '<span style="color: #b45309; font-weight: bold;">★ Peak Issuance Period</span>' : '<span style="color: #64748b;">Normal Volume</span>'}</td>
            </tr>
          `
        }).join('')
      : `<tr><td colspan="4" style="text-align: center; padding: 8px; border: 1px solid #000; color: #64748b;">No timeline trend records available.</td></tr>`

    // 6. Detailed Clearance Registry (Filtered Records)
    const recordsRowsHtml = filteredRecords.length > 0
      ? filteredRecords.map((r, idx) => {
          const isExpired = r.status?.toUpperCase() === 'EXPIRED'
          const statusStyle = isExpired
            ? 'color: #b45309; font-weight: 700; text-transform: uppercase;'
            : 'color: #15803d; font-weight: 700; text-transform: uppercase;'
          
          let feeLabel = 'Exempted / Free'
          if (r.orNumber && r.orNumber.trim() && r.orNumber !== '—') {
            feeLabel = `O.R. #${r.orNumber}`
          } else {
            const lowerT = (r.certTitle || '').toLowerCase()
            const lowerP = (r.purpose || '').toLowerCase()
            if (lowerT.includes('first time') || lowerP.includes('first time') || lowerP.includes('ftjs')) {
              feeLabel = 'RA 11261 (FTJS)'
            } else if (lowerT.includes('indigen') || lowerP.includes('indigen')) {
              feeLabel = 'Indigency Exempt'
            }
          }

          const expiryDateFormatted = r.expiryDate ? formatDate(r.expiryDate) : '6 Mos. Standard'

          return `
            <tr>
              <td style="text-align: center; border: 1px solid #000; padding: 4px 5px; font-size: 9.5px;">${idx + 1}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-weight: 700; font-size: 9.5px; white-space: nowrap;">${r.certNumber || '—'}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-weight: 600; font-size: 10px;">${formatRequestorName(r.requestorName)}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px;">${r.certTitle || '—'}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px;">${r.purpose || 'General Purpose'}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px; text-align: center; white-space: nowrap;">${feeLabel}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px; text-align: center; white-space: nowrap;">${formatDate(r.createdAt)}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px; text-align: center; white-space: nowrap;">${expiryDateFormatted}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9.5px; text-align: center; ${statusStyle}">${r.status ? r.status.toUpperCase() : 'ACTIVE'}</td>
            </tr>
          `
        }).join('')
      : `<tr><td colspan="9" style="text-align: center; padding: 14px; border: 1px solid #000; color: #64748b;">No clearance certificates issued for the selected filter range.</td></tr>`

    const docControlNumber = `BUR-CLR-${new Date().getFullYear()}-${String(filteredRecords.length).padStart(4, '0')}`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Official Clearance & Certification Report - Barangay Ugong</title>
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
    table.report-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
    table.report-table th { background-color: #f1f5f9; color: #000; font-weight: bold; padding: 5px 6px; border: 1px solid #000; text-align: left; }
    table.report-table td { padding: 4px 6px; border: 1px solid #000; vertical-align: middle; }
    .signatories-container { margin-top: 28px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .signatory-column { width: 31%; text-align: center; }
    .signatory-line { margin-top: 36px; border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 10.5px; text-transform: uppercase; }
    .signatory-role { font-size: 9px; color: #333; }
    
    @media print {
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div>
    <!-- Official Barangay Header Graphic (Matches Certificate Format) -->
    <img src="${documentAssets.letterhead}" alt="Barangay Ugong Letterhead Header" class="header-banner" />

    <!-- Document Control Bar -->
    <div class="control-bar">
      <span>CONTROL NO: ${docControlNumber}</span>
      <span>CLASSIFICATION: OFFICIAL PUBLIC ADMINISTRATIVE RECORD</span>
      <span>STATUTORY AUTHORITY: LOCAL GOVERNMENT CODE (R.A. 7160)</span>
    </div>

    <div style="text-align: center; margin-top: 2px; margin-bottom: 10px;">
      <h1 style="font-size: 13.5px; font-weight: 900; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">
        OFFICIAL CLEARANCE & CERTIFICATION ISSUANCE REPORT
      </h1>
      <p style="font-size: 9.5px; margin: 0; color: #334155; font-weight: 600;">
        Comprehensive Regulatory Registry, Statistical Volume Analytics & Exemption Audit
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
        <td>Clearance & Permitting Regulatory Section</td>
      </tr>
      <tr>
        <td class="meta-label">LGU Jurisdiction:</td>
        <td>Barangay Ugong, District II, Valenzuela City</td>
        <td class="meta-label">Total Filtered Volume:</td>
        <td style="font-weight: 800; color: #1e3a8a;">${filteredRecords.length.toLocaleString()} Clearance Certificate(s)</td>
      </tr>
    </table>

    <!-- Section I: Executive Operational & Dashboard Metrics Overview -->
    <div class="section-title">
      <span>I. EXECUTIVE OPERATIONAL & VOLUME SUMMARY</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Key Performance Indicators</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 38%;">Operational Indicator</th>
          <th style="width: 24%; text-align: center;">Recorded Metric</th>
          <th style="width: 38%;">Administrative & Audit Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 600;">Total Clearances Released in Period</td>
          <td style="font-weight: 800; text-align: center; font-size: 11px; color: #1e3a8a;">${totalIssued.toLocaleString()}</td>
          <td>Clearance certificates processed and released within requested period</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Active Clearances in Legal Circulation</td>
          <td style="font-weight: 700; text-align: center; color: #15803d;">${totalActiveCirculation.toLocaleString()}</td>
          <td>Currently valid certificates within the 6-month statutory validity period</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Total Expired / Inactive Clearances</td>
          <td style="font-weight: 700; text-align: center; color: #b45309;">${totalExpired.toLocaleString()} (${expiredPct}%)</td>
          <td>Certificates that have lapsed beyond validity and require renewal</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Applicant Gender Distribution</td>
          <td style="font-weight: 700; text-align: center;">${maleCount} Male / ${femaleCount} Female</td>
          <td>Demographics: ${malePct}% Male vs ${femalePct}% Female applicants</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Most Requested Clearance Template</td>
          <td style="font-weight: 700; text-align: center;">${mostIssuedName} (${mostIssuedCount.toLocaleString()})</td>
          <td>Accounts for ${mostIssuedPct}% of all released clearance volume</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Recent Daily & Weekly Issuance Velocity</td>
          <td style="font-weight: 700; text-align: center;">${totalIssuedToday} Today / ${totalIssuedThisWeek} This Week</td>
          <td>Real-time operations tracking from barangay clearance service desk</td>
        </tr>
      </tbody>
    </table>

    <!-- Section II: Statutory Fee Collection & O.R. Revenue Audit -->
    <div class="section-title">
      <span>II. STATUTORY FEE COLLECTION & EXEMPTION AUDIT</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Revenue & Statutory Compliance</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 32%;">Fee Category / Classification</th>
          <th style="width: 15%; text-align: center;">Volume</th>
          <th style="width: 15%; text-align: center;">Share (%)</th>
          <th style="width: 38%;">Statutory Authority & Accounting Reference</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 600;">Paid Clearances (Official Receipts Issued)</td>
          <td style="font-weight: 700; text-align: center;">${paidWithOrCount.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 600;">${((paidWithOrCount / totalRecordsCount) * 100).toFixed(1)}%</td>
          <td>Official Barangay Revenue Collection with verified O.R. Number</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">First-Time Jobseekers Act Waivers</td>
          <td style="font-weight: 700; text-align: center;">${ftjsExemptCount.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 600;">${((ftjsExemptCount / totalRecordsCount) * 100).toFixed(1)}%</td>
          <td>Republic Act No. 11261 (Barangay Clearance issued Free of Charge)</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Indigency & Social Welfare Waivers</td>
          <td style="font-weight: 700; text-align: center;">${indigencyExemptCount.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 600;">${((indigencyExemptCount / totalRecordsCount) * 100).toFixed(1)}%</td>
          <td>Social Welfare Assistance Exemption for indigent constituents</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">General Statutory & Emergency Waivers</td>
          <td style="font-weight: 700; text-align: center;">${generalExemptCount.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 600;">${((generalExemptCount / totalRecordsCount) * 100).toFixed(1)}%</td>
          <td>Senior Citizens, PWDs, Solo Parents, or Sangguniang Resolution waivers</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td>Total Exempted / Free Issuances</td>
          <td style="text-align: center; color: #1e3a8a;">${totalExempted.toLocaleString()}</td>
          <td style="text-align: center; color: #1e3a8a;">${((totalExempted / totalRecordsCount) * 100).toFixed(1)}%</td>
          <td>Total clearances released without fee charges (O.R. not required)</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 8.5px; font-style: italic; color: #475569; margin-top: -8px; margin-bottom: 12px;">
      * Community Tax Certificates (Cedula) on record: ${ctnCount.toLocaleString()} certificates verified. All fee waivers are documented pursuant to R.A. 7160 and R.A. 11261.
    </p>

    <!-- Section III: Certificate Template Classification & Volume Distribution -->
    <div class="section-title">
      <span>III. CERTIFICATE TEMPLATE CLASSIFICATION & VOLUME DISTRIBUTION</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Breakdown by Template</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">#</th>
          <th style="width: 38%;">Certificate Template Title</th>
          <th style="width: 30%;">Regulatory Classification</th>
          <th style="width: 14%; text-align: center;">Volume Issued</th>
          <th style="width: 12%; text-align: center;">Share (%)</th>
        </tr>
      </thead>
      <tbody>
        ${typeRowsHtml}
      </tbody>
    </table>

    <!-- Section IV: Application Purpose Regulatory Demand Analysis -->
    <div class="section-title">
      <span>IV. APPLICATION PURPOSE & COMMUNITY DEMAND ANALYSIS</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Top 10 Stated Reasons</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">#</th>
          <th style="width: 38%;">Stated Application Purpose</th>
          <th style="width: 30%;">Primary Requirement Category</th>
          <th style="width: 14%; text-align: center;">Applications</th>
          <th style="width: 12%; text-align: center;">Share (%)</th>
        </tr>
      </thead>
      <tbody>
        ${purposeRowsHtml}
      </tbody>
    </table>

    <!-- Section V: Chronological Trend & Peak Operational Activity -->
    <div class="section-title">
      <span>${trendSectionTitle}</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Timeline Analysis</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 40%;">${trendColumnHeader}</th>
          <th style="width: 20%; text-align: center;">Certificates Issued</th>
          <th style="width: 20%; text-align: center;">Period Share (%)</th>
          <th style="width: 20%; text-align: center;">Operational Status</th>
        </tr>
      </thead>
      <tbody>
        ${trendRowsHtml}
      </tbody>
    </table>
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; margin-top: -6px; margin-bottom: 12px; font-size: 9px; color: #334155;">
      <strong>Operational Highlights:</strong> Highest issuance volume was recorded on <strong>${peakPoint ? peakPoint.label : 'N/A'}</strong> with <strong>${peakPoint ? peakPoint.issued : 0}</strong> certificate(s) processed. Average issuance volume across this period is <strong>${(totalIssued / Math.max(trendPoints.length, 1)).toFixed(1)}</strong> certificates per interval.
    </div>

    <!-- Section VI: Detailed Clearance Registry -->
    <div class="section-title" style="page-break-before: auto;">
      <span>VI. DETAILED CLEARANCE ISSUANCE REGISTRY (${filteredRecords.length.toLocaleString()} RECORDS)</span>
      <span style="font-size: 9px; font-weight: normal; color: #475569;">Official Registry Logbook</span>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 3%; text-align: center;">#</th>
          <th style="width: 13%;">Clearance No.</th>
          <th style="width: 19%;">Applicant Name</th>
          <th style="width: 17%;">Certificate Type</th>
          <th style="width: 14%;">Stated Purpose</th>
          <th style="width: 11%; text-align: center;">O.R. / Fee</th>
          <th style="width: 8%; text-align: center;">Date Issued</th>
          <th style="width: 9%; text-align: center;">Valid Until</th>
          <th style="width: 6%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${recordsRowsHtml}
      </tbody>
    </table>

    <!-- Section VII: Legal Attestation & Tripartite Signatories -->
    <div style="margin-top: 18px; padding: 8px 10px; border: 1px solid #94a3b8; background-color: #f8fafc; font-size: 9px; text-align: justify; line-height: 1.4; color: #334155;">
      <strong>LEGAL ATTESTATION:</strong> I HEREBY CERTIFY under official oath that the foregoing clearance report, statistical distributions, and registry logs have been duly verified from the computerized records of Barangay Ugong, Valenzuela City, in accordance with the Local Government Code of 1991 (R.A. 7160) and applicable Commission on Audit (COA) guidelines.
    </div>

    <div class="signatories-container">
      <div class="signatory-column">
        <div class="signatory-line">${preparedByName}</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">Prepared By</div>
        <div class="signatory-role">Clearance Processing Officer</div>
        <div style="font-size: 8.5px; color: #64748b;">Clearance & Permitting Section</div>
      </div>
      <div class="signatory-column">
        <div class="signatory-line">ROSALINDA R. MENDOZA</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">Certified Correct</div>
        <div class="signatory-role">Barangay Secretary</div>
        <div style="font-size: 8.5px; color: #64748b;">Sangguniang Barangay ng Ugong</div>
      </div>
      <div class="signatory-column">
        <div class="signatory-line">HON. MARICEL PINEDA-EMPERADOR</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">Approved & Attested By</div>
        <div class="signatory-role">Punong Barangay</div>
        <div style="font-size: 8.5px; color: #64748b;">Barangay Ugong, Valenzuela City</div>
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
      alert('You have modified the date filter. Please click "Apply Filters" first to update the report for your selected date range before exporting.')
      return
    }

    if (loading) {
      alert('Please wait for report data to finish loading before exporting.')
      return
    }

    try {
      await exportClearanceExcel({
        filteredRecords,
        kpiData,
        dashboardKpi,
        typeBreakdown,
        appliedFilters,
        user,
      })
    } catch (err: any) {
      console.error('Failed to export Clearance Excel report:', err)
      alert(err.message || 'Failed to export Clearance Excel report.')
    }
  }

  if (viewMode === 'DETAILS' && selectedRecordId) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <ClearanceDetailsView
          certId={selectedRecordId}
          certNumber={selectedRecord?.certNumber}
          onBack={() => {
            setViewMode('REPORT')
            setSelectedRecordId(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Clearance & Certification Reports"
        description="Comprehensive issuance analytics, demographic distribution, and operational volume tracking."
      />

      {/* 2. Filter Bar with Presets */}
      <ClearanceReportFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onPrint={handlePrintPdf}
        onExportExcel={handleExportExcel}
        onToggleInsights={() => setShowInsights(!showInsights)}
        showInsights={showInsights}
        dirty={dirty}
      />

      {/* 3. 4 Core KPI Stat Cards */}
      <StatsCards cards={statCards} />

      {/* 4. Issuance Trend Chart Panel */}
      <div className="space-y-4">
        <TrendPanel
          trend={trendResult}
          delta={deltaResult}
          showInsightsDefault={showInsights}
          title={`${trendResult.granularityLabel} Certificate Issuance Volume`}
          description={`Timeline distribution of official barangay clearances released from ${formatDate(appliedFilters.dateFrom)} to ${formatDate(appliedFilters.dateTo)}`}
          valueNoun="certificates"
        />
      </div>

      {/* 5. Distribution Breakdown Visualizations (Donut + Horizontal Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Certificate Type Breakdown Donut Chart */}
        <BreakdownDonutCard
          title="Certificate Type Breakdown"
          description="Percentage distribution across all certificate templates"
          centerLabel="Total Issued"
          data={(typeBreakdown?.breakdown || []).map((b) => ({
            label: b.certTitle,
            value: b.count,
          }))}
          categoryColumnHeader="Certificate Type"
          totalValue={typeBreakdown?.totalVolume ?? 0}
          showInsightsDefault={showInsights}
        />

        {/* B. Top Application Purposes Horizontal Bar Chart */}
        <HorizontalBarCard
          title="Top Application Purposes"
          description="Breakdown of top 5 clearance application reasons and purposes"
          icon={BarChart3}
          data={(purposeBreakdown?.breakdown || []).slice(0, 5).map((p) => ({
            label: p.purpose,
            value: p.count,
          }))}
          totalValue={purposeBreakdown?.totalVolume ?? 0}
          valueNoun="applications"
          showInsightsDefault={showInsights}
          yAxisWidth={170}
          maxLabelLength={28}
          insightMessage={
            purposeBreakdown && purposeBreakdown.totalVolume > 0 ? (
              <>
                <strong className="text-slate-900 font-semibold">{purposeBreakdown.highestPurpose}</strong> is the primary driver of clearance applications in this period with <strong className="text-slate-900 font-semibold">{purposeBreakdown.highestCount} requests</strong> ({((purposeBreakdown.highestCount / Math.max(purposeBreakdown.totalVolume, 1)) * 100).toFixed(1)}% share).
              </>
            ) : undefined
          }
        />
      </div>

      {/* 6. Filtered Issuance Summary Data Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Clearance Issuance Records ({filteredRecords.length})
            </h3>
          </div>
        </div>

        <DataTable
          data={filteredRecords}
          columns={tableColumns}
          rowKey={(r) => r.id}
          pageSize={5}
          actions={tableActions}
          emptyTitle={loading ? 'Loading report data...' : 'No clearance records found'}
          emptyDescription="No certificates match the selected filter criteria."
        />
      </div>
    </div>
  )
}
