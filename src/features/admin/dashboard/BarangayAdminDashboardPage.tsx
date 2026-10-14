import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Shield,
  FileText,
  UserPlus,
  Archive,
  Megaphone,
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
import {
  PageHeader,
  StatsCards,
  QuickActionsPanel,
  type StatCard,
  type QuickActionItem,
} from '@/components/ui'
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

  // Reusable Quick Actions Items
  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        id: 'system-users',
        title: 'System Users',
        subtitle: 'Create & manage staff accounts',
        icon: UserPlus,
        onClick: () => navigate('/admin/user-management'),
      },
      {
        id: 'resident-directory',
        title: 'Resident Directory',
        subtitle: 'Register & view barangay residents',
        icon: UserCheck,
        onClick: () => navigate('/admin/residents'),
      },
      {
        id: 'officer-directory',
        title: 'Officer Directory',
        subtitle: 'View active barangay personnel',
        icon: Shield,
        onClick: () => navigate('/admin/officers'),
      },
      {
        id: 'announcements',
        title: 'Announcements & Services',
        subtitle: 'Publish community news & updates',
        icon: Megaphone,
        onClick: () => navigate('/admin/announcements'),
      },
      {
        id: 'archive-vault',
        title: 'Archive Vault',
        subtitle: 'Access preserved records & trash',
        icon: Archive,
        onClick: () => navigate('/admin/archive'),
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Barangay Admin Dashboard"
        description="Overview of barangay operations, resident directory, active personnel, and community public services."
      />

      {/* 1. Reusable KPI Stats Cards */}
      <StatsCards cards={statCards} loading={loading} />

      {/* 2. Middle Grid: Department Overview Chart (Left) & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Department Overview Chart (This Week Only) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5">
          {/* Card Header with System Theme Styling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Department Overview
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  This Week Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total operations across all barangay service desks for the current week.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Weekly Total:</span>
              {loading ? (
                <span className="w-10 h-6 rounded-full bg-slate-200/80 animate-pulse" />
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {totalWeeklyOps.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-6 animate-pulse px-4">
                <div className="flex items-end justify-between h-48 gap-3 sm:gap-6">
                  <div className="w-full bg-slate-100 rounded-t-lg h-[45%]" />
                  <div className="w-full bg-slate-100 rounded-t-lg h-[20%]" />
                  <div className="w-full bg-slate-100 rounded-t-lg h-[65%]" />
                  <div className="w-full bg-slate-100 rounded-t-lg h-[30%]" />
                  <div className="w-full bg-slate-100 rounded-t-lg h-[80%]" />
                  <div className="w-full bg-slate-100 rounded-t-lg h-[50%]" />
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-md" />
              </div>
            ) : (
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
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-md px-3 py-2 text-xs space-y-0.5">
                          <p className="font-bold text-slate-800">{data.department}</p>
                          <p className="text-slate-600 font-medium">
                            Records this week:{' '}
                            <span className="font-bold text-slate-900">{data.count}</span>
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
          )}
        </div>
      </div>

        {/* Right: Reusable Quick Actions Panel */}
        <div className="lg:col-span-5">
          <QuickActionsPanel
            title="Quick Actions"
            actions={quickActions}
            className="h-full flex flex-col justify-between"
          />
        </div>
      </div>
    </div>
  )
}
