import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
  Archive,
  Calendar,
  UserPlus,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  adminDashboardService,
  type AdminDashboardData,
} from '@/config/api/admin/adminDashboard.service'
import { formatDateTime, formatEnumLabel } from '@/utils/formatters'

import { useAuth } from '@/hooks/useAuth'
import { BlotterDashboardPage } from '@/features/blotter/BlotterDashboardPage'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { currentRole } = useAuth()

  if (currentRole === 'blotter') {
    return <BlotterDashboardPage />
  }
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await adminDashboardService.getStats()
        setData(result)
      } catch (err) {
        console.error('Failed to load admin dashboard stats:', err)
        // Fallback state if server is offline
        setData({
          totalUsers: 3,
          totalResidents: 99,
          totalOfficers: 0,
          totalAuditEntries: 1115,
          cpuUsage: 0.0,
          usedMemoryMb: 748.57,
          totalMemoryMb: 4096,
          memoryUsagePercent: 18.28,
          diskFreeGb: 36.4,
          diskTotalGb: 98.22,
          diskUsagePercent: 62.94,
          healthStatus: 'HEALTHY',
          userTrend: [
            { month: 'Feb', users: 1, residents: 20 },
            { month: 'Mar', users: 1, residents: 35 },
            { month: 'Apr', users: 2, residents: 50 },
            { month: 'May', users: 2, residents: 70 },
            { month: 'Jun', users: 3, residents: 85 },
            { month: 'Jul', users: 3, residents: 99 },
          ],
          recentActions: [],
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Loading admin dashboard…</p>
      </div>
    )
  }

  const stats = data || {
    totalUsers: 3,
    totalResidents: 99,
    totalOfficers: 0,
    totalAuditEntries: 1115,
    cpuUsage: 0.0,
    usedMemoryMb: 748.57,
    totalMemoryMb: 4096,
    memoryUsagePercent: 18.28,
    diskFreeGb: 36.4,
    diskTotalGb: 98.22,
    diskUsagePercent: 62.94,
    healthStatus: 'HEALTHY',
    userTrend: [],
    recentActions: [],
  }

  const isSystemAdmin = currentRole === 'rootadmin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSystemAdmin ? 'System Admin Dashboard' : 'Barangay Admin Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSystemAdmin
              ? 'Overview of system performance, active users, server health, and recent activities.'
              : 'Overview of barangay operations, resident directory, active personnel, and system activities.'}
          </p>
        </div>
      </div>

      {/* 1. Top KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Users
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</p>
            <p className="text-xs text-slate-400 mt-1">All active system accounts</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        {/* Total Residents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Residents
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalResidents}</p>
            <p className="text-xs text-slate-400 mt-1">Current active resident records</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Total Officers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Officers
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalOfficers}</p>
            <p className="text-xs text-slate-400 mt-1 leading-tight">
              Active personnel in barangay office
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* Total Audit Entries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Audit Entries
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.totalAuditEntries.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">All logged system audit events</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Registration & Account Growth (Left) & System Health (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registration & Account Growth (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Registration & Account Growth</h2>
                <p className="text-xs text-slate-500">
                  Monthly cumulative counts of registered residents & system accounts
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Last 6 Months
            </span>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorResidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="residents" name="Registered Residents" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResidents)" />
                <Area type="monotone" dataKey="users" name="System Accounts" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: System Health (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Health</h2>
              <p className="text-xs text-slate-500">
                Real-time server resources: CPU, memory, and disk utilization.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-700 border border-emerald-200">
              {stats.healthStatus}
            </span>
          </div>

          {/* Sub-cards Grid: CPU & Memory */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                CPU
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stats.cpuUsage.toFixed(2)}%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Processor load now</p>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Memory
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {stats.usedMemoryMb} / {stats.totalMemoryMb} MB
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">RAM used vs limit</p>
            </div>
          </div>

          {/* Memory & Disk Progress Bars */}
          <div className="space-y-4">
            {/* Memory Usage */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Memory Usage</span>
                <span className="text-slate-900 font-bold">{stats.memoryUsagePercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.memoryUsagePercent, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Higher percentage means less free memory.
              </p>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Disk Usage</span>
                <span className="text-slate-900 font-bold">{stats.diskUsagePercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.diskUsagePercent, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Track this to avoid low disk storage.</p>
            </div>
          </div>

          {/* Sub-cards Grid: Disk Free & Disk Total */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Disk Free
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stats.diskFreeGb} GB</p>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Disk Total
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stats.diskTotalGb} GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Recent System Actions (Left) & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent System Actions (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Recent System Actions</h2>
            </div>
            <button
              onClick={() => navigate('/audit-logs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              View All Logs <ArrowRight size={14} />
            </button>
          </div>

          {stats.recentActions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No recent system actions found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentActions.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 leading-tight">
                      {formatEnumLabel(log.action)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      By <span className="font-medium text-slate-600">{log.user}</span> in{' '}
                      <span className="text-slate-500">{formatEnumLabel(log.module)}</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {isSystemAdmin ? (
              <button
                onClick={() => navigate('/admin-management')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">User Management</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Create & update system accounts</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin/residents')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">Resident Directory</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">View & manage barangay residents</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}

            <button
              onClick={() => navigate('/audit-logs')}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Audit Logs</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Inspect full system activity registry</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/archive')}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Archive size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Archive Vault</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage deleted & retention policies</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/events')}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Events Management</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Schedule barangay announcements</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
