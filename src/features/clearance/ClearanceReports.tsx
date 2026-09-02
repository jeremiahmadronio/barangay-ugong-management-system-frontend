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
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import {
  ClearanceReportFilters,
  type ClearanceFilterState,
} from '@/components/reports/ClearanceReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { type Delta, type TrendResult } from '@/components/reports/utils/Analytics'
import {
  clearanceApi,
  type ClearanceReportKpiResponse,
  type ClearanceDailyTrendResponse,
  type ClearanceMonthlyTrendResponse,
  type TemplateOptionResponse,
  type IssuedCertificateTableResponse,
} from '@/api/modules/clearance.api'
import { DataTable, type Column } from '@/components/ui/table'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { formatDate, formatDateTime } from '@/utils/formatters'

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
  templateId: 'ALL',
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
  const [templates, setTemplates] = useState<TemplateOptionResponse[]>([])

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
  const [tableRecords, setTableRecords] = useState<IssuedCertificateTableResponse[]>([])

  // 1. Fetch Template Options for Dropdown
  useEffect(() => {
    clearanceApi.getTemplateOptions().then((list) => {
      if (Array.isArray(list)) setTemplates(list)
    }).catch((err) => console.error('Failed to load template options', err))
  }, [])

  // 2. Fetch all report data
  const fetchAllReports = useCallback(async () => {
    setLoading(true)
    try {
      const templateParam = appliedFilters.templateId && appliedFilters.templateId !== 'ALL'
        ? Number(appliedFilters.templateId)
        : undefined

      const params = {
        startDate: appliedFilters.dateFrom || undefined,
        endDate: appliedFilters.dateTo || undefined,
        templateId: templateParam,
      }

      const [kpiRes, dailyRes, monthRes, recordsRes] = await Promise.all([
        clearanceApi.getReportKpi(params).catch(() => null),
        clearanceApi.getDailyTrend(params).catch(() => []),
        clearanceApi.getMonthlyTrend(params).catch(() => []),
        clearanceApi.getIssuedCertificates({
          typeOfCert: appliedFilters.templateId && appliedFilters.templateId !== 'ALL'
            ? templates.find(t => String(t.id) === String(appliedFilters.templateId))?.certTitle
            : undefined,
        }).catch(() => []),
      ])

      setKpiData(kpiRes)
      setDailyTrend(dailyRes || [])
      setMonthlyTrend(monthRes || [])
      setTableRecords(recordsRes || [])
    } catch (err) {
      console.error('Failed to fetch clearance reports:', err)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, templates])

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

  // Table Columns for Issued Records Overview
  const tableColumns: Column<IssuedCertificateTableResponse>[] = useMemo(() => [
    {
      key: 'certNumber',
      header: 'CONTROL NO.',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 text-xs">{r.certNumber}</span>
      ),
    },
    {
      key: 'certTitle',
      header: 'CERTIFICATE TYPE',
      render: (r) => (
        <span className="text-xs font-semibold text-slate-800">{r.certTitle}</span>
      ),
    },
    {
      key: 'requestorName',
      header: 'APPLICANT NAME',
      render: (r) => (
        <span className="text-xs font-medium text-slate-900">{r.requestorName}</span>
      ),
    },
    {
      key: 'purpose',
      header: 'APPLICATION PURPOSE',
      render: (r) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px] block">{r.purpose || 'General Purpose'}</span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => (
        <Badge tone={getStatusTone(r.status)}>
          {r.status || 'ACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'DATE ISSUED',
      render: (r) => (
        <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
      ),
    },
  ], [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Clearance & Certification Reports"
        description="Comprehensive issuance analytics, demographic distribution, and operational volume tracking."
      />

      {/* 2. Filter Bar with Presets & Certificate Template Selection */}
      <ClearanceReportFilters
        draft={draftFilters}
        templates={templates}
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

      {/* 5. Filtered Issuance Summary Data Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Clearance Issuance Records ({tableRecords.length})
            </h3>
          </div>
        </div>

        <DataTable
          data={tableRecords}
          columns={tableColumns}
          rowKey={(r) => r.id}
          pageSize={10}
          emptyTitle={loading ? 'Loading report data...' : 'No clearance records found'}
          emptyDescription="No certificates match the selected filter criteria."
        />
      </div>
    </div>
  )
}
