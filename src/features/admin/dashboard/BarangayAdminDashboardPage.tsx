import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  UserCheck,
  Shield,
  FileText,
} from 'lucide-react'
import { PageHeader, StatsCards, type StatCard } from '@/components/ui'
import {
  barangayAdminDashboardService,
  type BarangayAdminDashboardKpiResponse,
} from '@/config/api/admin_dashboard/barangayAdminDashboard.service'

export function BarangayAdminDashboardPage() {
  const [kpi, setKpi] = useState<BarangayAdminDashboardKpiResponse>({
    totalUsers: 0,
    totalResidents: 0,
    totalOfficers: 0,
    servicesIssuedThisWeek: 0,
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Barangay Admin Dashboard"
        description="Overview of barangay operations, resident directory, active personnel, and community public services."
      />

      {/* Reusable KPI Stats Cards */}
      {loading ? (
        <div className="h-28 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-center">
          <p className="text-sm font-medium text-slate-400">Loading dashboard metrics…</p>
        </div>
      ) : (
        <StatsCards cards={statCards} />
      )}
    </div>
  )
}
