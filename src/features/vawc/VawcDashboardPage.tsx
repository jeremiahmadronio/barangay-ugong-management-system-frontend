import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartHandshake,
  ShieldCheck,
  Share2,
  FileX2,
  FilePlus2,
  FileText,
  Archive,
  BarChart3,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import {
  vawcApi,
  type VawcDashboardKpiResponse,
} from '@/api/modules/vawc.api'
import type {
  DailyCaseTrendResponse,
} from '@/api/modules/blotter.api'
import type { Delta, TrendResult } from '@/components/reports/utils/Analytics'

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSevenDaysAgoDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return formatLocalDate(d)
}

const getTodayDate = () => {
  return formatLocalDate(new Date())
}

const formatTrendDateLabel = (rawLabel?: string, rawDate?: string) => {
  // If backend provided a formatted label that isn't YYYY-MM-DD (e.g. "Oct 24"), use it directly
  if (rawLabel && !/^\d{4}-\d{2}-\d{2}$/.test(rawLabel)) {
    return rawLabel
  }
  const dateStr = rawLabel || rawDate
  if (!dateStr) return 'N/A'
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const formatDateRange = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return 'Mon – Sun'
  try {
    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startFormatted} – ${endFormatted} (Mon – Sun)`
  } catch {
    return `${startStr} to ${endStr}`
  }
}

export function VawcDashboardPage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [kpiData, setKpiData] = useState<VawcDashboardKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const sevenDaysAgo = getSevenDaysAgoDate()
      const today = getTodayDate()

      const [kpiRes, trendRes] = await Promise.allSettled([
        vawcApi.getDashboardKpis(),
        vawcApi.getDailyTrendReport(sevenDaysAgo, today),
      ])

      if (kpiRes.status === 'fulfilled') setKpiData(kpiRes.value)
      if (trendRes.status === 'fulfilled') setDailyTrend(trendRes.value)
    } catch (err) {
      console.error('Failed to load VAWC dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 1. KPI Stat Cards Definition
  const statCards: StatCard[] = useMemo(() => {
    return [
      {
        id: 'total_cases_this_week',
        label: 'New Cases (This Week)',
        value: isLoading ? '...' : (kpiData?.totalCasesThisWeek ?? 0),
        hint: formatDateRange(kpiData?.weekStartDate, kpiData?.weekEndDate),
        icon: HeartHandshake,
        tone: 'indigo',
      },
      {
        id: 'active_bpo_this_week',
        label: 'Active BPO (This Week)',
        value: isLoading ? '...' : (kpiData?.totalActiveBpoThisWeek ?? 0),
        hint: 'Barangay Protection Orders in effect',
        icon: ShieldCheck,
        tone: 'emerald',
      },
      {
        id: 'referred_cases_this_week',
        label: 'Referred Cases (This Week)',
        value: isLoading ? '...' : (kpiData?.totalReferredCasesThisWeek ?? 0),
        hint: 'Endorsed to partner agencies',
        icon: Share2,
        tone: 'sky',
      },
      {
        id: 'withdrawn_cases_this_week',
        label: 'Withdrawn Cases (This Week)',
        value: isLoading ? '...' : (kpiData?.totalWithdrawnCasesThisWeek ?? 0),
        hint: 'Withdrawn / settled complaints',
        icon: FileX2,
        tone: 'rose',
      },
    ]
  }, [isLoading, kpiData])

  // 2. Trend Panel Data (Last 7 Days)
  const trendData: TrendResult = useMemo(() => {
    const points = (dailyTrend || []).map((item, idx) => {
      const displayLabel = formatTrendDateLabel(item.label || item.dayLabel, item.date)
      return {
        key: item.date || displayLabel || `trend-${idx}`,
        label: displayLabel,
        issued: item.totalCases ?? 0,
        original: item.totalCases ?? 0,
        reissued: 0,
        pointDate: item.date,
      }
    })

    const dateRangeLabel = `${new Date(getSevenDaysAgoDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(getTodayDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

    return {
      granularity: 'daily',
      granularityLabel: 'Daily',
      rangeLabel: dateRangeLabel,
      unit: 'day',
      points,
    }
  }, [dailyTrend])

  const trendDelta: Delta = useMemo(() => {
    const current = (dailyTrend || []).reduce((acc, p) => acc + (p.totalCases ?? 0), 0)
    return {
      current,
      previous: 0,
      percent: null,
      direction: 'up',
      unit: 'day',
    }
  }, [dailyTrend])

  // 3. Quick Actions
  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'file_vawc',
        title: 'File VAWC Complaint',
        subtitle: 'Register a new confidential VAWC incident report with sworn statements.',
        icon: FilePlus2,
        onClick: () => navigate('/vawc/entry'),
      },
      {
        id: 'view_cases',
        title: 'Active VAWC Case Files',
        subtitle: 'Manage formal complaints, hearings, and track victim protection statuses.',
        icon: FileText,
        onClick: () => navigate('/vawc/cases'),
      },
      {
        id: 'archive_vault',
        title: 'Archive & Trash Vault',
        subtitle: 'Access archived cases, historical records, and soft-deleted items.',
        icon: Archive,
        onClick: () => navigate('/vawc/archive'),
      },
      {
        id: 'statistical_reports',
        title: 'Statistical Reports',
        subtitle: 'Generate compliance analytics, partner agency summaries, and export reports.',
        icon: BarChart3,
        onClick: () => navigate('/vawc/reports'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="VAWC Operations Dashboard"
        description="Real-time case monitoring, active Barangay Protection Orders (BPO), agency endorsements, and weekly trend analysis."
      />

      {/* 2. Reusable Header Stats Cards (Monday to Sunday) */}
      <StatsCards cards={statCards} />

      {/* 3. Trend Chart (7-Day Trend) & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendPanel
            title="VAWC 7-Day Case Volume Trend"
            description="Daily influx of new VAWC complaints filed over the past 7 days"
            trend={trendData}
            delta={trendDelta}
            showInsightsDefault={false}
            valueNoun="VAWC cases"
          />
        </div>
        <div>
          <QuickActionsPanel
            title="Quick Actions"
            actions={quickActions}
          />
        </div>
      </div>
    </div>
  )
}

export default VawcDashboardPage
