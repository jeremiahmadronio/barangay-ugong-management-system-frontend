import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Archive,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
  RefreshCw,
  FolderArchive,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import {
  bcpcApi,
} from '@/api/modules/bcpc.api'
import type {
  BlotterLifecycleKpiResponse,
} from '@/api/modules/blotter.api'

type VaultTab = 'archived' | 'recently_deleted'

export function BcpcArchiveVaultPage() {
  const [activeTab, setActiveTab] = useState<VaultTab>('archived')

  // Lifecycle KPI Data exclusively for BCPC
  const [kpiData, setKpiData] = useState<BlotterLifecycleKpiResponse | null>(null)
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Fetch BCPC Archive KPI Data
  const fetchKpis = useCallback(async () => {
    try {
      const data = await bcpcApi.getArchiveKpi()
      setKpiData(data)
    } catch (err: any) {
      console.error('Failed to fetch BCPC archive KPIs:', err)
    } finally {
      setIsLoadingKpis(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchKpis()
  }

  // Memoized Stat Cards matching Blotter format
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: 'total-archived',
        label: 'Total Archived Cases',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchived ?? 0).toLocaleString(),
        hint: 'All-time archived BCPC records',
        icon: Archive,
        tone: 'emerald',
      },
      {
        id: 'archived-this-month',
        label: 'Archived This Month',
        value: isLoadingKpis ? '...' : (kpiData?.totalArchivedThisMonth ?? 0).toLocaleString(),
        hint: 'Archived in current month',
        icon: Calendar,
        tone: 'sky',
      },
      {
        id: 'recycle-bin',
        label: 'Recycle Bin (Trash)',
        value: isLoadingKpis ? '...' : (kpiData?.totalRecentlyDeleted ?? 0).toLocaleString(),
        hint: 'Soft-deleted records (restoreable)',
        icon: Trash2,
        tone: 'rose',
      },
      {
        id: 'deleted-this-month',
        label: 'Deleted This Month',
        value: isLoadingKpis ? '...' : (kpiData?.totalRecentlyDeletedThisMonth ?? 0).toLocaleString(),
        hint: 'Deleted & purged in current month',
        icon: Clock,
        tone: 'amber',
      },
    ],
    [isLoadingKpis, kpiData]
  )

  return (
    <div className="space-y-6">
      {/* --- REUSABLE PAGE HEADER --- */}
      <PageHeader
        title="BCPC Archive & Trash Vault"
        description="Centralized repository for archived BCPC cases and soft-deleted records."
      >
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoadingKpis || isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Refresh Statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </PageHeader>

      {/* --- REUSABLE STATS CARDS --- */}
      <StatsCards cards={statCards} />

      {/* --- PILL TABS SELECTOR --- */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 bg-slate-100/70 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-emerald-600" />
            <span>Archived Cases</span>
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'archived'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              {kpiData?.totalArchived ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recently_deleted')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'recently_deleted'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Recycle Bin (Trash)</span>
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'recently_deleted'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              {kpiData?.totalRecentlyDeleted ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        {activeTab === 'archived' ? (
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">BCPC Archived Records</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Total of{' '}
              <strong className="text-slate-800">{kpiData?.totalArchived ?? 0}</strong> archived case(s) on record.
              {kpiData?.totalArchivedThisMonth
                ? ` (${kpiData.totalArchivedThisMonth} archived in the current month).`
                : ''}
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">BCPC Recycle Bin</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Currently{' '}
              <strong className="text-slate-800">{kpiData?.totalRecentlyDeleted ?? 0}</strong> record(s) in the trash vault.
              Soft-deleted records can be restored or will be purged according to retention policy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export const BcpcArchive = BcpcArchiveVaultPage
export default BcpcArchiveVaultPage

