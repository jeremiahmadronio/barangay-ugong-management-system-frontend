import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Home,
  FolderKanban,
  Scale,
  FileBadge,
  GraduationCap,
  Layers,
  Handshake,
  FileWarning,
  HeartHandshake,
  Baby,
  ArrowRight,
  Table as TableIcon,
  Lightbulb,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { SettlementEfficiencyCard } from '@/components/reports/SettlementEfficiencyCard'
import { ReportTableCard, type ColumnDef } from '@/components/reports/ReportTableCard'
import { ChartInsightBox } from '@/components/reports/ChartInsightBox'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import { kapitanaDashboardService } from '@/config/api/kapitana/kapitana.service'
import type {
  KapitanaDashboardKpiResponse,
  KapitanaRecentCaseItem,
} from '@/config/api/kapitana/kapitana.types'
import { formatDate } from '@/utils/formatters'

interface DeptChartPoint {
  department: string
  count: number
}

// Consistent monochromatic system brand color matching other departments
const BRAND_BAR_COLOR = '#2563eb'

export function KapitanaDashboardPage() {
  const navigate = useNavigate()
  const [kpi, setKpi] = useState<KapitanaDashboardKpiResponse | null>(null)
  const [recentCases, setRecentCases] = useState<KapitanaRecentCaseItem[]>([])
  const [loading, setLoading] = useState(true)

  // Chart Insights toggles
  const [showCaseloadInsight, setShowCaseloadInsight] = useState(false)
  const [showDesksInsight, setShowDesksInsight] = useState(false)
  const [showDemographicsInsight, setShowDemographicsInsight] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [kpiRes, casesRes] = await Promise.all([
          kapitanaDashboardService.getKpiStats(),
          kapitanaDashboardService.getRecentCases(10),
        ])
        setKpi(kpiRes)
        setRecentCases(casesRes)
      } catch (err) {
        console.error('Failed to load Kapitana dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // 1. Executive Summary KPI Cards (5-Card System including Resident Population)
  const statCards: StatCard[] = useMemo(() => {
    if (!kpi) return []
    return [
      {
        id: 'total-residents',
        label: 'Total Residents',
        value: (kpi.demographics?.totalResidents ?? 0).toLocaleString(),
        hint: 'Registered in the barangay',
        icon: Users,
        tone: 'sky',
      },
      {
        id: 'total-active-cases',
        label: 'Ongoing Complaints',
        value: kpi.totalActiveCases,
        hint: 'Active in Blotter, Lupon, VAWC & BCPC',
        icon: FolderKanban,
        tone: 'indigo',
      },
      {
        id: 'resolution-rate',
        label: 'Cases Settled',
        value: `${(kpi.overallResolutionRate ?? 0).toFixed(1)}%`,
        hint: `${kpi.totalSettledCases} of ${kpi.totalCasesAcrossDepartments} cases settled peacefully`,
        icon: Scale,
        tone: 'emerald',
      },
      {
        id: 'clearances-issued',
        label: 'Clearances Issued',
        value: kpi.totalClearancesIssued,
        hint: 'Barangay clearances released',
        icon: FileBadge,
        tone: 'violet',
      },
      {
        id: 'ftjs-issued',
        label: 'First-Time Job Seekers',
        value: kpi.totalFtjsIssued,
        hint: 'Job seekers assisted',
        icon: GraduationCap,
        tone: 'amber',
      },
    ]
  }, [kpi])

  // 2. Department Caseload Chart Data (Unified clean monochromatic styling)
  const chartData: DeptChartPoint[] = useMemo(() => {
    if (!kpi?.departmentOverview) return []
    const overview = kpi.departmentOverview
    return [
      { department: 'Blotter', count: overview.blotter.totalCases },
      { department: 'Lupon', count: overview.lupon.totalCases },
      { department: 'VAWC', count: overview.vawc.totalCases },
      { department: 'BCPC', count: overview.bcpc.totalCases },
      { department: 'Clearance', count: overview.clearanceTotalIssued },
      { department: 'FTJS', count: overview.ftjsTotalIssued },
    ]
  }, [kpi])

  // 3. Department Desks Overview List (Matching the 6 Chart items in exact sequence)
  const departments = useMemo(() => {
    if (!kpi?.departmentOverview) return []
    const overview = kpi.departmentOverview
    return [
      {
        name: 'Blotter Desk',
        code: 'BLOTTER',
        icon: FileWarning,
        primaryCount: overview.blotter.activeCases,
        primaryLabel: 'Active',
        secondaryCount: overview.blotter.settledCases,
        secondaryLabel: 'Settled',
        badge: `${overview.blotter.resolutionRate.toFixed(1)}% Settled`,
        badgeTone: 'emerald' as const,
        link: '/blotter/records',
      },
      {
        name: 'Lupon Tagapamayapa',
        code: 'LUPON',
        icon: Scale,
        primaryCount: overview.lupon.activeCases,
        primaryLabel: 'Active',
        secondaryCount: overview.lupon.settledCases,
        secondaryLabel: 'Settled',
        badge: `${overview.lupon.resolutionRate.toFixed(1)}% Settled`,
        badgeTone: 'emerald' as const,
        link: '/lupon/cases',
      },
      {
        name: 'VAWC Desk',
        code: 'VAWC',
        icon: HeartHandshake,
        primaryCount: overview.vawc.activeCases,
        primaryLabel: 'Active',
        secondaryCount: overview.vawc.settledCases,
        secondaryLabel: 'Settled',
        badge: `${overview.vawc.resolutionRate.toFixed(1)}% Settled`,
        badgeTone: 'emerald' as const,
        link: '/vawc/cases',
      },
      {
        name: 'BCPC (Children Desk)',
        code: 'BCPC',
        icon: Baby,
        primaryCount: overview.bcpc.activeCases,
        primaryLabel: 'Active',
        secondaryCount: overview.bcpc.settledCases,
        secondaryLabel: 'Settled',
        badge: `${overview.bcpc.resolutionRate.toFixed(1)}% Settled`,
        badgeTone: 'emerald' as const,
        link: '/bcpc/cases',
      },
      {
        name: 'Barangay Clearance',
        code: 'CLEARANCE',
        icon: FileBadge,
        primaryCount: overview.clearanceTotalIssued,
        primaryLabel: 'Issued',
        secondaryLabel: 'Clearances',
        badge: 'Public Service',
        badgeTone: 'sky' as const,
        link: '/clearance/issued',
      },
      {
        name: 'First-Time Job Seekers',
        code: 'FTJS',
        icon: GraduationCap,
        primaryCount: overview.ftjsTotalIssued,
        primaryLabel: 'Assisted',
        secondaryLabel: 'Job Seekers',
        badge: 'Youth Program',
        badgeTone: 'indigo' as const,
        link: '/ftjs/requests',
      },
    ]
  }, [kpi])

  // 4. Demographic Statistics and Distribution Proportions
  const demographicsData = useMemo(() => {
    const demo = kpi?.demographics
    const total = demo?.totalResidents ?? 0
    const minors = demo?.minorsCount ?? 0
    const adults = demo?.adultsCount ?? 0
    const seniors = demo?.seniorCitizens ?? 0
    const heads = demo?.headsOfFamily ?? 0

    const minorPct = total > 0 ? (minors / total) * 100 : 0
    const adultPct = total > 0 ? (adults / total) * 100 : 0
    const seniorPct = total > 0 ? (seniors / total) * 100 : 0

    const male = demo?.maleCount ?? 0
    const female = demo?.femaleCount ?? 0
    const genderTotal = male + female
    const malePct = genderTotal > 0 ? (male / genderTotal) * 100 : 50
    const femalePct = genderTotal > 0 ? (female / genderTotal) * 100 : 50

    return {
      total,
      heads,
      seniors,
      minors,
      adults,
      minorPct,
      adultPct,
      seniorPct,
      male,
      female,
      malePct,
      femalePct,
    }
  }, [kpi])

  // Insight messages for cards
  const caseloadInsightMessage = useMemo(() => {
    if (!kpi?.departmentOverview) return 'Caseload and services data is currently synchronized.'
    const overview = kpi.departmentOverview
    return (
      <>
        <span className="font-semibold text-slate-800">Summary:</span> Blotter has the highest number of complaints ({overview.blotter.totalCases}), while {overview.ftjsTotalIssued} residents were assisted for job seeking and {overview.clearanceTotalIssued} clearances were issued. Lupon, VAWC, and BCPC handle ongoing mediation and family protection cases.
      </>
    )
  }, [kpi])

  const desksInsightMessage = useMemo(() => {
    if (!kpi?.departmentOverview) return 'Desk performance metrics are currently synchronized.'
    const overview = kpi.departmentOverview
    return (
      <>
        <span className="font-semibold text-slate-800">Summary:</span> BCPC has the highest settlement rate at <span className="font-semibold text-emerald-700">{overview.bcpc.resolutionRate.toFixed(1)}%</span>, followed by VAWC (<span className="font-semibold text-emerald-700">{overview.vawc.resolutionRate.toFixed(1)}%</span>), Blotter (<span className="font-semibold text-emerald-700">{overview.blotter.resolutionRate.toFixed(1)}%</span>), and Lupon (<span className="font-semibold text-emerald-700">{overview.lupon.resolutionRate.toFixed(1)}%</span>). In total, <span className="font-semibold text-slate-800">{kpi.totalSettledCases}</span> out of <span className="font-semibold text-slate-800">{kpi.totalCasesAcrossDepartments}</span> complaints were settled peacefully.
      </>
    )
  }, [kpi])

  const demographicsInsightMessage = useMemo(() => {
    if (!kpi?.demographics) return 'Demographic records are currently synchronized.'
    const demo = kpi.demographics
    const total = demo.totalResidents
    const minorPct = total > 0 ? ((demo.minorsCount / total) * 100).toFixed(1) : '0'
    const adultPct = total > 0 ? ((demo.adultsCount / total) * 100).toFixed(1) : '0'
    const seniorPct = total > 0 ? ((demo.seniorCitizens / total) * 100).toFixed(1) : '0'
    const hhSize = demo.headsOfFamily > 0 ? (total / demo.headsOfFamily).toFixed(1) : '1.0'
    return (
      <>
        <span className="font-semibold text-slate-800">Summary:</span> Most residents are working adults (<span className="font-semibold text-emerald-700">{adultPct}%</span>), followed by children (<span className="font-semibold text-emerald-700">{minorPct}%</span>) and senior citizens (<span className="font-semibold text-emerald-700">{seniorPct}%</span>). Each family has an average of <span className="font-semibold text-slate-800">{hhSize} members</span>, which is helpful for planning community programs and relief distribution.
      </>
    )
  }, [kpi])

  // 5. Table Columns for ReportTableCard
  const tableColumns: ColumnDef<KapitanaRecentCaseItem>[] = useMemo(
    () => [
      {
        key: 'caseNumber',
        header: 'Case Number',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.caseNumber}</span>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        render: (row) => (
          <span className="font-medium text-slate-700">{row.department}</span>
        ),
      },
      {
        key: 'incidentNature',
        header: 'Type of Complaint',
        render: (row) => (
          <span className="text-slate-700 font-medium">{row.incidentNature}</span>
        ),
      },
      {
        key: 'complainantName',
        header: 'Complainant',
        render: (row) => (
          <span className="text-slate-600">{row.complainantName}</span>
        ),
      },
      {
        key: 'dateFiled',
        header: 'Date Filed',
        render: (row) => (
          <span className="text-slate-500 whitespace-nowrap">
            {formatDate(row.dateFiled)}
          </span>
        ),
      },
      {
        key: 'caseStatus',
        header: 'Status',
        render: (row) => {
          const isSettled = row.caseStatus.includes('SETTLED')
          const isPending =
            row.caseStatus.includes('PENDING') ||
            row.caseStatus.includes('ONGOING') ||
            row.caseStatus.includes('CONCILIATION')
          const tone: BadgeTone = isSettled
            ? 'emerald'
            : isPending
            ? 'amber'
            : 'slate'
          return (
            <Badge tone={tone}>
              {row.caseStatus.replace(/_/g, ' ')}
            </Badge>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header (Standard Project Clean Header) */}
      <PageHeader
        title="Barangay Executive Overview"
        description="Quick overview of barangay residents, ongoing complaints, settled cases, and public services."
      />

      {/* 2. Top 5-KPI Stats Cards (Including Resident Population) */}
      <StatsCards
        cards={statCards}
        loading={loading}
        className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5"
      />

      {/* 3. Middle Section: Side-by-Side 12-Column Grid (Chart 7 Cols + Desks Overview 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 Cols): Department Caseload & Services Distribution Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Complaints & Services per Department
                </h2>
                <p className="text-xs text-slate-500">
                  Total complaints and document requests handled by each department
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 shrink-0">
              All Records
            </span>
          </div>

          <div className="h-80 w-full pt-4 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Loading chart data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                    formatter={(val: number) => [`${val} records`, 'Total']}
                  />
                  <Bar dataKey="count" fill={BRAND_BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BRAND_BAR_COLOR}
                        className="hover:opacity-85 transition-opacity"
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      style={{ fill: '#475569', fontSize: '11px', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Footer with Chart Insight Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowCaseloadInsight(!showCaseloadInsight)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
            >
              <Lightbulb size={13} className={showCaseloadInsight ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
              {showCaseloadInsight ? 'Hide Chart Insights' : 'View Chart Insights'}
            </button>
          </div>

          {showCaseloadInsight && (
            <div className="mt-3 animate-in fade-in duration-200">
              <ChartInsightBox message={caseloadInsightMessage} />
            </div>
          )}
        </div>

        {/* Right Column (5 Cols): Department Desks Overview (All 6 Departments in Exact Sequence) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Department Status Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Active and settled cases per office
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 shrink-0">
              6 Offices
            </span>
          </div>

          {/* Department List in Exact Chart Sequence */}
          <div className="space-y-2 flex-1 flex flex-col justify-between">
            {departments.map((dept) => {
              const Icon = dept.icon
              return (
                <div
                  key={dept.code}
                  className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white border border-slate-200/60 text-slate-700 shadow-2xs shrink-0 group-hover:text-blue-600 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-900 truncate">
                          {dept.name}
                        </h3>
                        {dept.badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              dept.badgeTone === 'emerald'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : dept.badgeTone === 'sky'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            }`}
                          >
                            {dept.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>
                          <strong className="text-slate-700 font-semibold">{dept.primaryCount}</strong>{' '}
                          {dept.primaryLabel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {dept.secondaryCount !== undefined ? (
                            <>
                              <strong className="text-slate-700 font-semibold">{dept.secondaryCount}</strong>{' '}
                            </>
                          ) : null}
                          {dept.secondaryLabel}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(dept.link)}
                    className="shrink-0 ml-2 inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    View
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer with Desks Insight Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowDesksInsight(!showDesksInsight)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
            >
              <Lightbulb size={13} className={showDesksInsight ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
              {showDesksInsight ? 'Hide Desk Insights' : 'View Desk Insights'}
            </button>
          </div>

          {showDesksInsight && (
            <div className="mt-3 animate-in fade-in duration-200">
              <ChartInsightBox message={desksInsightMessage} />
            </div>
          )}
        </div>
      </div>

      {/* 4. Barangay Community & Demographics Profile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Barangay Residents & Demographics
              </h2>
              <p className="text-xs text-slate-500">
                Overview of registered population, households, senior citizens, and youth
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/residents')}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Open Resident Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 4 Clean Metric Cards (Neutral Icons, No Distracting Colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Residents
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {demographicsData.total.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Registered population</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Heads of Family
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {demographicsData.heads.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Households for relief & aid</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <Home className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Senior Citizens (60+)
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {demographicsData.seniors.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Pensions & medical assistance</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Children & Youth (0–17)
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {demographicsData.minors.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Youth programs & student aid</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
              <Baby className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 2 Sector Breakdown Panels with Clean Format & Unified Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age Group Breakdown */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Population by Age Group
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Count and share of population by age</p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {demographicsData.total} Total
              </span>
            </div>

            <div className="space-y-4">
              {/* Minors */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Children & Minors (0–17 yrs)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{demographicsData.minors.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {demographicsData.minorPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(demographicsData.minorPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Adults */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Working Adults (18–59 yrs)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{demographicsData.adults.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {demographicsData.adultPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(demographicsData.adultPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Seniors */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Senior Citizens (60+ yrs)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{demographicsData.seniors.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {demographicsData.seniorPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(demographicsData.seniorPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gender & Household Ratio */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Gender & Household Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Male, female, and average family size</p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Overview
              </span>
            </div>

            <div className="space-y-4">
              {/* Male */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Male Residents</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{demographicsData.male.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {demographicsData.malePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(demographicsData.malePct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Female */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Female Residents</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{demographicsData.female.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {demographicsData.femalePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(demographicsData.femalePct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Household Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Average Household Size</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {demographicsData.heads > 0 ? (demographicsData.total / demographicsData.heads).toFixed(1) : '1.0'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      members per family
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((demographicsData.heads > 0 ? demographicsData.total / demographicsData.heads : 1) / 5) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Demographic Insight Toggle */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowDemographicsInsight(!showDemographicsInsight)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
          >
            <Lightbulb size={13} className={showDemographicsInsight ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
            {showDemographicsInsight ? 'Hide Demographic Insights' : 'View Demographic Insights'}
          </button>
        </div>

        {showDemographicsInsight && (
          <div className="mt-3 animate-in fade-in duration-200">
            <ChartInsightBox message={demographicsInsightMessage} />
          </div>
        )}
      </div>

      {/* 5. Full-Width Settlement Efficiency Card */}
      <SettlementEfficiencyCard
        title="Settled Complaints & Resolution Rate"
        description="Percentage of complaints resolved peacefully inside the barangay without filing cases in court"
        icon={Handshake}
        totalLabel="Total Complaints Filed"
        settledLabel="Settled Peacefully"
        rateLabel="Overall Settlement Rate"
        summaryText={
          <>
            <span className="font-semibold text-emerald-700">{kpi?.totalSettledCases ?? 0}</span> out of{' '}
            <span className="font-semibold text-slate-900">{kpi?.totalCasesAcrossDepartments ?? 0}</span> complaints were peacefully resolved.
          </>
        }
        insightMessage={
          <>
            <span className="font-semibold text-slate-800">Summary:</span> Across all departments (Blotter, Lupon, VAWC, and BCPC), <span className="font-semibold text-emerald-700">{kpi?.totalSettledCases ?? 0}</span> out of <span className="font-semibold text-slate-800">{kpi?.totalCasesAcrossDepartments ?? 0}</span> complaints ({(kpi?.overallResolutionRate ?? 0).toFixed(1)}%) were settled peacefully at the barangay level.
          </>
        }
        data={{
          totalFormalComplaints: kpi?.totalCasesAcrossDepartments ?? 0,
          totalSettledCases: kpi?.totalSettledCases ?? 0,
          settlementRate: kpi?.overallResolutionRate ?? 0,
        }}
        loading={loading}
      />

      {/* 6. Standard Reusable Report Table Card */}
      <ReportTableCard<KapitanaRecentCaseItem>
        title="Recent Complaints & Records"
        description="Latest cases filed across Blotter, Lupon, VAWC, and BCPC desks"
        icon={TableIcon}
        columns={tableColumns}
        data={recentCases}
        pageSize={6}
        searchPlaceholder="Search by case number, department, complaint, or complainant..."
        getRowId={(row) => row.id || row.caseNumber}
      />
    </div>
  )
}
export default KapitanaDashboardPage
