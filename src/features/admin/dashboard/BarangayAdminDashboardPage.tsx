import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Shield,
  FileText,
  BarChart3,
  CalendarDays,
  Activity,
  ArrowRight,
  UserPlus,
  Archive,
  Megaphone,
  Sparkles,
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
import { PageHeader, StatsCards, type StatCard } from '@/components/ui'
import {
  barangayAdminDashboardService,
  type BarangayAdminDashboardKpiResponse,
} from '@/config/api/admin_dashboard/barangayAdminDashboard.service'

interface DeptChartPoint {
  department: string
  count: number
  color: string
}

export function BarangayAdminDashboardPage() {
  const navigate = useNavigate()
  const [kpi, setKpi] = useState<BarangayAdminDashboardKpiResponse>({
    totalUsers: 0,
    totalResidents: 0,
    totalOfficers: 0,
    servicesIssuedThisWeek: 0,
    departmentOverview: {
      blotter: 0,
      lupon: 0,
      bcpc: 0,
      vawc: 0,
      clearance: 0,
      ftjs: 0,
      totalWeeklyOperations: 0,
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKpi() {
      try {
        const data = await barangayAdminDashboardService.getKpiStats()
        setKpi(data)
      } catch (err) {
        console.error('Failed to load Barangay Admin KPI stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchKpi()
  }, [])

  // Reusable StatsCards Configuration
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-users',
        label: 'Total Users',
        value: kpi.totalUsers,
        hint: 'Active system users',
        icon: Users,
        tone: 'indigo',
      },
      {
        id: 'total-residents',
        label: 'Total Residents',
        value: kpi.totalResidents,
        hint: 'Active resident directory',
        icon: UserCheck,
        tone: 'emerald',
      },
      {
        id: 'total-officers',
        label: 'Total Officers',
        value: kpi.totalOfficers,
        hint: 'Active barangay personnel',
        icon: Shield,
        tone: 'amber',
      },
      {
        id: 'services-issued-week',
        label: 'Services Issued',
        value: kpi.servicesIssuedThisWeek,
        hint: 'Clearances issued this week',
        icon: FileText,
        tone: 'sky',
      },
    ],
    [kpi]
  )

  // Department Overview Chart Data (This Week Only)
  const chartData: DeptChartPoint[] = useMemo(() => {
    const overview = kpi.departmentOverview || {
      blotter: 0,
      lupon: 0,
      bcpc: 0,
      vawc: 0,
      clearance: 0,
      ftjs: 0,
    }
    return [
      { department: 'Blotter', count: overview.blotter, color: '#3b82f6' },
      { department: 'Lupon', count: overview.lupon, color: '#6366f1' },
      { department: 'BCPC', count: overview.bcpc, color: '#8b5cf6' },
      { department: 'VAWC', count: overview.vawc, color: '#ec4899' },
      { department: 'Clearance', count: overview.clearance, color: '#10b981' },
      { department: 'FTJS', count: overview.ftjs, color: '#f59e0b' },
    ]
  }, [kpi.departmentOverview])

  const totalWeeklyOps = useMemo(() => {
    return (
      kpi.departmentOverview?.totalWeeklyOperations ??
      chartData.reduce((acc, curr) => acc + curr.count, 0)
    )
  }, [kpi.departmentOverview, chartData])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Barangay Admin Dashboard"
        description="Overview of barangay operations, resident directory, active personnel, and community public services."
      />

      {/* 1. Reusable KPI Stats Cards */}
      {loading ? (
        <div className="h-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-center">
          <p className="text-sm font-medium text-slate-400">Loading dashboard metrics…</p>
        </div>
      ) : (
        <StatsCards cards={statCards} />
      )}

      {/* 2. Middle Grid: Department Overview Chart (Left) & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Department Overview Chart (This Week Only) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5">
          {/* Card Header with System Theme Styling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                <BarChart3 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Department Overview
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    <CalendarDays size={12} />
                    This Week Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total operations across all barangay service desks for the current week.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Weekly Total:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {totalWeeklyOps.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 24, right: 16, left: -16, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="department"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DeptChartPoint
                      const percent =
                        totalWeeklyOps > 0
                          ? ((data.count / totalWeeklyOps) * 100).toFixed(1)
                          : '0.0'
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-md p-3 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: data.color }}
                            />
                            <p className="font-bold text-slate-800">{data.department}</p>
                          </div>
                          <p className="text-slate-600 font-medium">
                            Records this week:{' '}
                            <span className="font-bold text-slate-900">{data.count}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {percent}% of total weekly operations
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="#475569"
                    fontSize={12}
                    fontWeight={700}
                    offset={8}
                  />
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Badges Summary */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {chartData.map((d) => (
                <div
                  key={d.department}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="font-medium text-slate-600">{d.department}:</span>
                  <span className="font-bold text-slate-900">{d.count}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Activity size={14} className="text-blue-500" />
              <span>Live records</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Quick Actions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct shortcuts to frequent barangay services
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* User Management */}
              <button
                onClick={() => navigate('/admin/user-management')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      System Users
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Create & manage staff accounts
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                />
              </button>

              {/* Resident Directory */}
              <button
                onClick={() => navigate('/admin/residents')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Resident Directory
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Register & view barangay residents
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                />
              </button>

              {/* Officer Directory */}
              <button
                onClick={() => navigate('/admin/officers')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Officer Directory
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      View active barangay personnel
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                />
              </button>

              {/* Content & Announcements */}
              <button
                onClick={() => navigate('/admin/announcements')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg group-hover:bg-sky-100 transition-colors">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Announcements & Services
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Publish community news & updates
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                />
              </button>

              {/* Archive Vault */}
              <button
                onClick={() => navigate('/admin/archive')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Archive size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Archive Vault
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Access preserved records & trash
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
