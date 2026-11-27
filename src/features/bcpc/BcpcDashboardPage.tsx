import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus2,
  FileText,
  AlertCircle,
  Clock,
  Share2,
  Archive,
  Trash2,
  BarChart3,
  FolderKanban,
  ArrowRight,
  Eye,
  Scale,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { QuickActionsPanel, type QuickActionItem } from '@/components/ui/QuickActionsPanel'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { Badge } from '@/components/ui/table/Badge'
import type { BadgeTone } from '@/components/ui/table/Badge'
import { TableActions } from '@/components/ui/table/TableActions'
import type { RowAction } from '@/components/ui/table/types'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { useDialogs } from '@/hooks/useDialogs'
import {
  bcpcApi,
  type BcpcDashboardKpiResponse,
  type BcpcTableRowResponse,
  type BcpcDashboardMonitoringItem,
} from '@/config/api/modules/bcpc.api'
import type { DailyCaseTrendResponse } from '@/config/api/modules/blotter.api'
import type { Delta, TrendResult } from '@/components/reports/utils/Analytics'
import { formatDate, maskConfidentialName } from '@/utils/formatters'

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

function formatCaseNature(val?: string | null): string {
  if (!val || val === '—' || val === 'N/A') return '—'
  const clean = val.replace(/^(?:CAR|CICL)\s*:\s*/i, '').replace(/_/g, ' ').trim()
  if (!clean) return '—'
  return clean
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getStatusBadgeTone(status?: string | null): BadgeTone {
  const key = String(status || '').toUpperCase()
  if (key === 'PENDING') return 'amber'
  if (key === 'ONGOING') return 'amber'
  if (key === 'SETTLED' || key === 'RESOLVED') return 'emerald'
  if (key === 'DISMISSED') return 'rose'
  if (key === 'WITHDRAWN') return 'neutral'
  if (key === 'ISSUED_REFERRAL' || key === 'REFERRED') return 'sky'
  return 'neutral'
}

function getStatusLabel(status?: string | null): string {
  const st = (status || 'PENDING').toUpperCase()
  if (st === 'EXPIRED_UNACTIONED') return 'Expired / Un-actioned'
  if (st === 'ONGOING' || st === 'ACTIVE' || st === 'UNDER_CUSTODY' || st.includes('REFERRAL')) return 'Ongoing'
  if (st === 'PENDING') return 'Pending'
  if (st === 'SETTLED' || st === 'RESOLVED') return 'Settled'
  if (st === 'DISMISSED') return 'Dismissed'
  if (st === 'WITHDRAWN') return 'Withdrawn'
  if (st === 'CLOSED') return 'Closed'
  return st.replace(/_/g, ' ')
}

export function BcpcDashboardPage() {
  const navigate = useNavigate()
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [kpiData, setKpiData] = useState<BcpcDashboardKpiResponse | null>(null)
  const [dailyTrend, setDailyTrend] = useState<DailyCaseTrendResponse[]>([])
  const [recentCases, setRecentCases] = useState<BcpcTableRowResponse[]>([])
  const [monitoringFeed, setMonitoringFeed] = useState<BcpcDashboardMonitoringItem[]>([])

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const sevenDaysAgo = getSevenDaysAgoDate()
      const today = getTodayDate()

      const [kpiRes, trendRes, recentRes, feedRes] = await Promise.allSettled([
        bcpcApi.getDashboardKpi(),
        bcpcApi.getDailyTrend({ startDate: sevenDaysAgo, endDate: today }),
        bcpcApi.getRecentCases(5),
        bcpcApi.getMonitoringFeed(6),
      ])

      if (kpiRes.status === 'fulfilled') setKpiData(kpiRes.value)
      if (trendRes.status === 'fulfilled') setDailyTrend(trendRes.value)
      if (recentRes.status === 'fulfilled') setRecentCases(recentRes.value)
      if (feedRes.status === 'fulfilled') setMonitoringFeed(feedRes.value)
    } catch (err) {
      console.error('Failed to load BCPC dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Table Actions for Recent BCPC Intakes (matching Case Files & Blotter design)
  const tableActions: RowAction<BcpcTableRowResponse>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => {
          navigate(`/bcpc/${row.id}`)
        },
      },
      {
        id: 'archive',
        label: 'Archive Case',
        icon: Archive,
        tone: 'emerald',
        onClick: (row) => {
          const rawStatus = (row.status || '').toUpperCase().replace(/[\s-]+/g, '_')
          const isArchivable = ['SETTLED', 'DISMISSED', 'WITHDRAWN', 'RESOLVED', 'CLOSED'].includes(rawStatus)
          if (!isArchivable) {
            showFeedback({
              variant: 'error',
              title: 'Cannot Archive Active Case',
              description: `Case #${row.caseNumber} is currently ${getStatusLabel(
                row.status
              )}. Only cases that are already Settled, Dismissed, Withdrawn, or Closed can be moved to the archive.`,
            })
            return
          }

          confirm({
            title: `Archive Case – #${row.caseNumber}?`,
            description: `Are you sure you want to archive Case #${row.caseNumber}? This will move the case to the Archive vault.`,
            confirmLabel: 'Archive Case',
            tone: 'emerald',
            onConfirm: async () => {
              try {
                await bcpcApi.archiveCase(row.id)
                showFeedback({
                  variant: 'success',
                  title: 'Case Archived',
                  description: `Case #${row.caseNumber} has been moved to the Archive Vault successfully.`,
                })
                fetchDashboardData()
              } catch (err: any) {
                console.error('Failed to archive BCPC case:', err)
                showFeedback({
                  variant: 'error',
                  title: 'Unable to Archive Case',
                  description:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    'Failed to move this case to the archive. Please try again.',
                })
              }
            },
          })
        },
      },
      {
        id: 'delete',
        label: 'Move to Trash',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => {
          const rawStatus = (row.status || '').toUpperCase().replace(/[\s-]+/g, '_')
          const isActive = ['ONGOING', 'PENDING', 'ACTIVE', 'UNDER_CUSTODY', 'REFERRED'].includes(rawStatus)
          if (isActive) {
            showFeedback({
              variant: 'error',
              title: 'Active Case Cannot Be Deleted',
              description: `Case #${row.caseNumber} is currently ${getStatusLabel(
                row.status
              )}. Active cases cannot be moved to trash until they are resolved, settled, or dismissed.`,
            })
            return
          }

          confirm({
            title: `Move Case #${row.caseNumber} to Trash?`,
            description: `Are you sure you want to move Case #${row.caseNumber} to the Recycle Bin? You can restore it at any time from the Archive & Trash Vault.`,
            confirmLabel: 'Move to Trash',
            tone: 'danger',
            onConfirm: async () => {
              try {
                await bcpcApi.softDeleteCase(row.id)
                showFeedback({
                  variant: 'success',
                  title: 'Case Moved to Trash',
                  description: `Case #${row.caseNumber} has been moved to the Recycle Bin.`,
                })
                fetchDashboardData()
              } catch (err: any) {
                console.error('Failed to move BCPC case to trash:', err)
                showFeedback({
                  variant: 'error',
                  title: 'Unable to Delete Case',
                  description:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    'Failed to move this case to the recycle bin. Please try again.',
                })
              }
            },
          })
        },
      },
    ],
    [confirm, showFeedback, fetchDashboardData, navigate]
  )

  // 1. Operational KPI Stat Cards
  const statCards: StatCard[] = useMemo(() => {
    return [
      {
        id: 'new_intakes_this_week',
        label: 'New Intakes (This Week)',
        value: isLoading ? '...' : (kpiData?.totalNewCasesThisWeek ?? 0),
        hint: kpiData?.newCasesTrend || '0.0% vs last week',
        showTrend: true,
        badgeType: 'trend',
        comparisonLabel: 'vs last week',
        icon: FilePlus2,
        tone: 'indigo',
      },
      {
        id: 'needs_assessment',
        label: 'Needs Assessment / Action',
        value: isLoading ? '...' : (kpiData?.totalNeedsAssessment ?? 0),
        hint: 'Awaiting intake assessment or parent notice',
        icon: AlertCircle,
        tone: 'amber',
      },
      {
        id: 'active_interventions',
        label: 'Active Intervention Monitoring',
        value: isLoading ? '...' : (kpiData?.totalActiveInterventions ?? 0),
        hint: 'Under diversion contract or counseling',
        icon: Clock,
        tone: 'emerald',
      },
      {
        id: 'pending_agency_feedback',
        label: 'Pending Agency Feedback',
        value: isLoading ? '...' : (kpiData?.totalPendingAgencyFeedback ?? 0),
        hint: 'Awaiting reports from LSWDO, WCPD, etc.',
        icon: Share2,
        tone: 'sky',
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

    const dateRangeLabel = `${new Date(getSevenDaysAgoDate()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${new Date(getTodayDate()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`

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
        id: 'file_car',
        title: 'File Child at Risk (CAR) Intake',
        subtitle: 'Record child in need of protective custody or preventive intervention.',
        icon: FilePlus2,
        onClick: () => navigate('/bcpc/entry?type=CAR'),
      },
      {
        id: 'file_cicl',
        title: 'File CICL Intake',
        subtitle: 'Record child in conflict with the law for diversion proceedings.',
        icon: Scale,
        onClick: () => navigate('/bcpc/entry?type=CICL'),
      },
      {
        id: 'case_registry',
        title: 'BCPC Case Files & Registry',
        subtitle: 'Search, filter, and inspect child intake records and case statuses.',
        icon: FolderKanban,
        onClick: () => navigate('/bcpc/cases'),
      },
      {
        id: 'reports_analytics',
        title: 'Reports & Analytics',
        subtitle: 'Generate PDF summaries, Excel exports, and category comparison reports.',
        icon: BarChart3,
        onClick: () => navigate('/bcpc/reports'),
      },
      {
        id: 'archive_vault',
        title: 'Archive & Trash Vault',
        subtitle: 'Access archived cases, historical records, and soft-deleted items.',
        icon: Archive,
        onClick: () => navigate('/bcpc/archive'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="BCPC Operations Dashboard"
        description="Weekly operational cockpit: child intake assessments, diversion monitoring, and partner agency coordination."
        badge={
          kpiData?.weekStartDate && kpiData?.weekEndDate ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {formatDateRange(kpiData.weekStartDate, kpiData.weekEndDate)}
            </span>
          ) : undefined
        }
      />

      {/* 2. Reusable Header Stats Cards (Monday to Sunday) */}
      <StatsCards cards={statCards} />

      {/* 3. Trend Chart (7-Day Trend) & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendPanel
            title="BCPC 7-Day Intake Volume Trend"
            description="Daily influx of new CAR and CICL intakes filed over the past 7 days"
            trend={trendData}
            delta={trendDelta}
            showInsightsDefault={false}
            valueNoun="BCPC intakes"
          />
        </div>
        <div>
          <QuickActionsPanel title="Quick Actions" actions={quickActions} />
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Intakes Table & Monitoring Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left (2 cols): Recent BCPC Intakes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent BCPC Intakes</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest docket entries filed today and this week
              </p>
            </div>
            <button
              onClick={() => navigate('/bcpc/cases')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Case No.</th>
                  <th className="px-4 py-3">Child</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3">Nature / Offense</th>
                  <th className="px-4 py-3">Date Filed</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="h-40 text-center text-xs text-slate-400">
                      Loading recent intakes...
                    </td>
                  </tr>
                ) : recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-40 text-center text-xs text-slate-400">
                      No recent BCPC intakes recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td
                        onClick={() => navigate(`/bcpc/${c.id}`)}
                        className="px-4 py-3.5 font-bold text-xs sm:text-sm text-slate-900 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                        title="Click to view case details"
                      >
                        {c.caseNumber}
                      </td>
                      <td
                        onClick={() => navigate(`/bcpc/${c.id}`)}
                        className="px-4 py-3.5 text-xs sm:text-sm text-slate-900 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {maskConfidentialName(c.childName)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="text-slate-700 font-medium text-xs">
                          {(c.category || 'CAR').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[160px] truncate" title={c.caseNature}>
                        {formatCaseNature(c.caseNature)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(c.dateFiled || c.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <Badge tone={getStatusBadgeTone(c.status)}>
                          {c.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <TableActions row={c} actions={tableActions} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Live Intervention & Referral Tracker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Intervention & Referral Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pending partner endorsements & active diversion
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              {monitoringFeed.length}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[420px]">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                Loading monitoring feed...
              </div>
            ) : monitoringFeed.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center p-4">
                No pending partner referrals or active intervention programs at this time.
              </div>
            ) : (
              monitoringFeed.map((item) => {
                const isReferral = item.itemType === 'REFERRAL'
                return (
                  <div
                    key={`${item.itemType}-${item.id}`}
                    onClick={() => navigate(`/bcpc/${item.caseId}`)}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                  >
                    {/* Top row: Case Number, Subtle Type Tag, and Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.caseNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            isReferral
                              ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                              : 'bg-blue-50 text-blue-700 border-blue-200/70'
                          }`}
                        >
                          {isReferral ? 'Referral' : 'Intervention'}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {item.daysPending === 0 ? 'Today' : `${item.daysPending}d ago`}
                      </span>
                    </div>

                    {/* Program / Referral Purpose Title */}
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.title}>
                      {item.title}
                    </p>

                    {/* Clean Metadata: Partner / Target & Child */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[170px]" title={item.agencyOrFacilitator}>
                        To: <span className="font-medium text-slate-700">{item.agencyOrFacilitator}</span>
                      </span>
                      <span className="shrink-0">
                        Child: <span className="font-medium text-slate-700">{maskConfidentialName(item.childName)}</span>
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Confirmation & Feedback Dialogs for Table Actions */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}

export default BcpcDashboardPage

