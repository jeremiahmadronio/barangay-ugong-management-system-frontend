import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Award,
  Clock,
  Users,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
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
import { type Delta, type TrendResult } from '@/components/reports/utils/Analytics'
import {
  clearanceApi,
  type ClearanceReportKpiResponse,
  type ClearanceDailyTrendResponse,
  type ClearanceMonthlyTrendResponse,
  type ClearanceTypeBreakdownResponse,
  type ClearancePurposeBreakdownResponse,
  type IssuedCertificateTableResponse,
} from '@/api/modules/clearance.api'
import { DataTable, type Column, type RowAction } from '@/components/ui/table'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { ClearanceDetailsView } from './components/ClearanceDetailsView'

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

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'RELEASED' || normalized === 'ISSUED') return 'emerald'
  if (normalized === 'EXPIRED') return 'amber'
  if (normalized === 'VOID' || normalized === 'CANCELLED') return 'rose'
  return 'slate'
}

export function ClearanceReports() {
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

      const [kpiRes, dailyRes, monthRes, typeRes, purposeRes, recordsRes] = await Promise.all([
        clearanceApi.getReportKpi(params).catch(() => null),
        clearanceApi.getDailyTrend(params).catch(() => []),
        clearanceApi.getMonthlyTrend(params).catch(() => []),
        clearanceApi.getTypeBreakdown(params).catch(() => null),
        clearanceApi.getPurposeBreakdown(params).catch(() => null),
        clearanceApi.getIssuedCertificates().catch(() => []),
      ])

      setKpiData(kpiRes)
      setDailyTrend(dailyRes || [])
      setMonthlyTrend(monthRes || [])
      setTypeBreakdown(typeRes)
      setPurposeBreakdown(purposeRes)
      setTableRecords(recordsRes || [])
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

  const handlePrint = () => {
    window.print()
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
        const fromTime = new Date(appliedFilters.dateFrom).setHours(0, 0, 0, 0)
        const recTime = new Date(r.createdAt).getTime()
        if (recTime < fromTime) return false
      }
      if (appliedFilters.dateTo) {
        const toTime = new Date(appliedFilters.dateTo).setHours(23, 59, 59, 999)
        const recTime = new Date(r.createdAt).getTime()
        if (recTime > toTime) return false
      }
      return true
    })
  }, [tableRecords, appliedFilters])

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
        onPrint={handlePrint}
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
          description="Breakdown of clearance application reasons and purposes"
          icon={Sparkles}
          data={(purposeBreakdown?.breakdown || []).map((p) => ({
            label: p.purpose,
            value: p.count,
          }))}
          totalValue={purposeBreakdown?.totalVolume ?? 0}
          valueNoun="applications"
          showInsightsDefault={showInsights}
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
