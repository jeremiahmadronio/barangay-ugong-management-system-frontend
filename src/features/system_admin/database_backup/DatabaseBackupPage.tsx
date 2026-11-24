import React, { useState, useEffect, useMemo } from 'react'
import {
  Download,
  Trash2,
  RotateCcw,
  Play,
  Clock,
  HardDrive,
  Calendar,
  Cloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { PageHeader, StatsCards, type StatCard } from '@/components/ui'
import {
  DataTable,
  TableFilters,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import {
  backupApi,
  type BackupItem,
  type BackupStats,
  type BackupScheduleConfig,
} from '@/api/modules/backupApi'
import { useDialogs } from '@/hooks/useDialogs'
import { ConfirmationDialog, FeedbackDialog } from '@/components/ui'

// ─── Filter Configs ──────────────────────────────────────────────────────────
const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by file name or label...',
  },
  {
    key: 'type',
    label: 'Type',
    options: [
      { label: 'All types', value: 'all' },
      { label: 'Manual', value: 'MANUAL' },
      { label: 'Scheduled', value: 'SCHEDULED' },
    ],
  },
  {
    key: 'startDate',
    label: 'Start Date',
    type: 'date',
  },
  {
    key: 'endDate',
    label: 'End Date',
    type: 'date',
  },
]

export function DatabaseBackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [schedule, setSchedule] = useState<BackupScheduleConfig | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [triggering, setTriggering] = useState<boolean>(false)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    type: 'all',
    startDate: '',
    endDate: '',
  })

  // Manual Trigger Modal State
  const [showTriggerModal, setShowTriggerModal] = useState(false)
  const [manualLabel, setManualLabel] = useState('')
  const [manualReason, setManualReason] = useState('')

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [frequency, setFrequency] = useState('DAILY')
  const [hour, setHour] = useState(0)
  const [minute, setMinute] = useState(0)
  const [dayOfWeek, setDayOfWeek] = useState('SUN')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [scheduleEnabled, setScheduleEnabled] = useState(true)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  const loadData = async () => {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        backupApi.getBackups(),
        backupApi.getStats(),
        backupApi.getSchedule(),
      ])

      if (results[0].status === 'fulfilled') {
        setBackups(Array.isArray(results[0].value) ? results[0].value : [])
      }

      if (results[1].status === 'fulfilled') {
        setStats(results[1].value)
      }

      if (results[2].status === 'fulfilled') {
        const scheduleData = results[2].value
        setSchedule(scheduleData)
        if (scheduleData) {
          setFrequency(scheduleData.frequency || 'DAILY')
          setHour(scheduleData.hour ?? 0)
          setMinute(scheduleData.minute ?? 0)
          setDayOfWeek(scheduleData.dayOfWeek || 'SUN')
          setDayOfMonth(scheduleData.dayOfMonth || '1')
          setScheduleEnabled(scheduleData.enabled ?? true)
        }
      }

      // Check if all failed
      const allFailed = results.every((r) => r.status === 'rejected')
      if (allFailed) {
        showFeedback({
          title: 'Error Loading Backups',
          description: 'Unable to connect to backend backup service. Please check your network or server status.',
          variant: 'error',
        })
      }
    } catch (err: any) {
      showFeedback({
        title: 'Error Loading Backups',
        description: err.message || 'Failed to load backup data.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered backups based on TableFilters
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      const q = (filterValues.search || '').trim().toLowerCase()
      const matchesSearch =
        !q ||
        b.fileName.toLowerCase().includes(q) ||
        (b.label && b.label.toLowerCase().includes(q)) ||
        (b.createdBy && b.createdBy.toLowerCase().includes(q))

      const matchesType =
        !filterValues.type ||
        filterValues.type === 'all' ||
        b.type.toUpperCase() === filterValues.type.toUpperCase()

      // Date Range Matching (Start Date & End Date)
      let matchesDate = true
      if (filterValues.startDate) {
        const itemDate = new Date(b.createdAt)
        const start = new Date(`${filterValues.startDate}T00:00:00`)
        if (itemDate < start) matchesDate = false
      }
      if (filterValues.endDate) {
        const itemDate = new Date(b.createdAt)
        const end = new Date(`${filterValues.endDate}T23:59:59`)
        if (itemDate > end) matchesDate = false
      }

      return matchesSearch && matchesType && matchesDate
    })
  }, [backups, filterValues])

  // Reusable StatsCards configuration (matches UserManagement tone & structure)
  const statCards: StatCard[] = useMemo(() => {
    if (!stats) return []

    const usedGb = stats.storageUsedGb.toFixed(2)
    const limitGb = stats.storageLimitGb || 20
    const percentUsed = ((stats.storageUsedGb / limitGb) * 100).toFixed(1)

    // Format last backup date nicely with explicit AM/PM
    let formattedLastDate = 'No backups recorded'
    if (stats.lastBackupDate && stats.lastBackupDate !== 'N/A') {
      // If the backend returned "Nov 24, 2026 11:17", format to 12-hour AM/PM
      const match = stats.lastBackupDate.match(/([A-Za-z]+ \d{1,2}, \d{4})\s+(\d{1,2}):(\d{2})/)
      if (match) {
        const [, datePart, hourStr, minStr] = match
        const h = parseInt(hourStr, 10)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const displayH = h % 12 || 12
        formattedLastDate = `${datePart} at ${String(displayH).padStart(2, '0')}:${minStr} ${ampm}`
      } else {
        formattedLastDate = stats.lastBackupDate
      }
    }

    // Next schedule time formatted cleanly
    const formattedNextSchedule = stats.nextBackupTime && stats.nextBackupTime !== 'N/A'
      ? stats.nextBackupTime
      : '12:00 AM'

    return [
      {
        id: 'storage-used',
        title: 'S3 Storage Used',
        value: `${usedGb} GB`,
        subtitle: `${percentUsed}% used of ${limitGb} GB quota`,
        icon: HardDrive,
        tone: 'indigo',
      },
      {
        id: 's3-bucket',
        title: 'AWS S3 Cloud Bucket',
        value: stats.s3Bucket ? 'Connected' : 'Offline',
        subtitle: '256-bit AES Encrypted',
        icon: Cloud,
        tone: 'emerald',
      },
      {
        id: 'backup-schedule',
        title: 'Auto-Backup Schedule',
        value:
          stats.autoBackupFrequency === 'DAILY'
            ? 'Every Day'
            : stats.autoBackupFrequency === 'WEEKLY'
            ? 'Weekly'
            : stats.autoBackupFrequency === 'MONTHLY'
            ? 'Monthly'
            : stats.autoBackupFrequency,
        subtitle:
          stats.autoBackupFrequency !== 'DISABLED'
            ? `Next Schedule: ${formattedNextSchedule}`
            : 'Automated schedule is disabled',
        icon: Calendar,
        tone: 'sky',
      },
      {
        id: 'last-backup',
        title: 'Last Backup Execution',
        value: stats.lastBackupStatus === 'SUCCESS' || stats.lastBackupStatus === 'ACTIVE' ? 'Active' : stats.lastBackupStatus,
        subtitle: formattedLastDate !== 'No backups recorded' ? `Completed ${formattedLastDate}` : 'No backups recorded',
        icon: stats.lastBackupStatus === 'SUCCESS' || stats.lastBackupStatus === 'ACTIVE' ? CheckCircle2 : AlertCircle,
        tone: stats.lastBackupStatus === 'SUCCESS' || stats.lastBackupStatus === 'ACTIVE' ? 'emerald' : 'amber',
      },
    ]
  }, [stats])

  // Manual Backup Creation Progress State
  const [backupProgressModal, setBackupProgressModal] = useState<{
    open: boolean
    label: string
    stage: string
    percent: number
  } | null>(null)

  // Actions
  const handleTriggerManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualLabel.trim()) {
      showFeedback({
        title: 'Validation Error',
        description: 'Please provide a Backup Label before triggering manual backup.',
        variant: 'error',
      })
      return
    }

    const currentLabel = manualLabel.trim()
    const currentReason = manualReason.trim() || undefined

    setShowTriggerModal(false)
    setManualLabel('')
    setManualReason('')
    setTriggering(true)

    setBackupProgressModal({
      open: true,
      label: currentLabel,
      stage: 'Dumping PostgreSQL database...',
      percent: 25,
    })

    const timer1 = setTimeout(() => {
      setBackupProgressModal((prev) =>
        prev ? { ...prev, stage: 'Compressing database dump (gzip)...', percent: 60 } : null
      )
    }, 2500)

    const timer2 = setTimeout(() => {
      setBackupProgressModal((prev) =>
        prev ? { ...prev, stage: 'Uploading compressed snapshot to AWS S3...', percent: 85 } : null
      )
    }, 5500)

    try {
      await backupApi.triggerBackup({
        label: currentLabel,
        reason: currentReason,
      })

      clearTimeout(timer1)
      clearTimeout(timer2)
      setBackupProgressModal((prev) =>
        prev ? { ...prev, stage: 'Backup completed and verified on S3!', percent: 100 } : null
      )

      setTimeout(() => {
        setBackupProgressModal(null)
        showFeedback({
          title: 'Backup Created',
          description: 'PostgreSQL database dump successfully compressed and uploaded to AWS S3.',
          variant: 'success',
        })
      }, 700)

      await loadData()
    } catch (err: any) {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setBackupProgressModal(null)
      showFeedback({
        title: 'Backup Failed',
        description: err.message || 'Could not complete backup process.',
        variant: 'error',
      })
    } finally {
      setTriggering(false)
    }
  }

  // Download Progress Modal State & Abort Controller
  const downloadAbortControllerRef = React.useRef<AbortController | null>(null)
  const [downloadModal, setDownloadModal] = useState<{
    open: boolean
    fileName: string
    receivedMb: number
    totalMb: number
    percent: number
  } | null>(null)

  const handleCancelDownload = () => {
    if (downloadAbortControllerRef.current) {
      downloadAbortControllerRef.current.abort()
      downloadAbortControllerRef.current = null
    }
    setDownloadModal(null)
  }

  const handleDownload = async (fileName: string) => {
    if (downloadModal?.open) return // Prevent duplicate download calls

    const abortController = new AbortController()
    downloadAbortControllerRef.current = abortController

    setDownloadModal({
      open: true,
      fileName,
      receivedMb: 0,
      totalMb: 0,
      percent: 0,
    })

    try {
      const blob = await backupApi.downloadBackup(
        fileName,
        (loaded, total) => {
          const receivedMb = Math.round((loaded / (1024 * 1024)) * 100) / 100
          const totalMb = total > 0 ? Math.round((total / (1024 * 1024)) * 100) / 100 : 0
          const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
          setDownloadModal((prev) =>
            prev
              ? {
                  ...prev,
                  receivedMb,
                  totalMb,
                  percent,
                }
              : null
          )
        },
        abortController.signal
      )

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)

      setDownloadModal(null)
      downloadAbortControllerRef.current = null
      showFeedback({
        title: 'Download Complete',
        description: `Successfully downloaded "${fileName}" to your device.`,
        variant: 'success',
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User intentionally cancelled, no error toast needed
        setDownloadModal(null)
        downloadAbortControllerRef.current = null
        return
      }
      setDownloadModal(null)
      downloadAbortControllerRef.current = null
      showFeedback({
        title: 'Download Failed',
        description: err.message || 'Could not stream backup file from AWS S3.',
        variant: 'error',
      })
    }
  }

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await backupApi.updateSchedule({
        frequency,
        hour: Number(hour),
        minute: Number(minute),
        dayOfWeek,
        dayOfMonth,
        enabled: scheduleEnabled,
      })
      setShowScheduleModal(false)
      showFeedback({
        title: 'Schedule Updated',
        description: 'Automated backup scheduler refreshed successfully.',
        variant: 'success',
      })
      await loadData()
    } catch (err: any) {
      showFeedback({
        title: 'Update Schedule Failed',
        description: err.message || 'Could not save schedule configuration.',
        variant: 'error',
      })
    }
  }

  // Columns definition matching standard DataTable styling
  const columns: Column<BackupItem>[] = [
    {
      key: 'fileName',
      header: 'FILE NAME & S3 OBJECT',
      render: (r) => (
        <div className="flex flex-col max-w-[340px]">
          <span className="font-medium text-slate-800 text-sm truncate" title={r.fileName}>
            {r.fileName}
          </span>
          {r.label && (
            <span
              className="text-xs text-slate-400 mt-0.5 truncate block"
              title={r.label}
            >
              {r.label}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (r) => (
        <span className="text-sm text-slate-600 font-normal">
          {r.type}
        </span>
      ),
    },
    {
      key: 'fileSizeKb',
      header: 'SIZE',
      render: (r) => {
        const mb = (r.fileSizeKb / 1024).toFixed(2)
        return <span className="text-sm text-slate-600 font-normal">{mb} MB</span>
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: () => (
        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
          ACTIVE
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'DATE CREATED',
      render: (r) => {
        const d = new Date(r.createdAt)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        return (
          <span className="text-sm text-slate-600 whitespace-nowrap font-normal">
            {dateStr} at {timeStr}
          </span>
        )
      },
    },
  ]

  // Row actions for DataTable (Immutable Archives: Download Only)
  const actions = (r: BackupItem): RowAction<BackupItem>[] => {
    const isDownloading = Boolean(downloadModal?.open)

    return [
      {
        id: 'download',
        label: 'Download File',
        icon: Download,
        disabled: isDownloading,
        onClick: () => handleDownload(r.fileName),
        tone: 'primary',
      },
    ]
  }

  return (
    <div className="space-y-6">
      {/* Unified PageHeader matching UserManagement style (No Refresh Button) */}
      <PageHeader
        title="Database Backup"
        description="Automated and manual snapshots stored securely in Amazon Web Services (AWS S3)."
        actions={[
          {
            label: 'Configure Schedule',
            icon: Clock,
            className:
              'inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer',
            onClick: () => setShowScheduleModal(true),
          },
          {
            label: triggering || stats?.isBackupInProgress ? 'Backing Up...' : 'Manual Backup',
            icon: Play,
            disabled: triggering || stats?.isBackupInProgress,
            onClick: () => setShowTriggerModal(true),
          },
        ]}
      />

      {/* Reusable StatsCards */}
      <StatsCards
        cards={statCards}
        loading={loading}
        emptyMessage={loading ? 'Loading statistics…' : 'No statistics available.'}
      />

      {/* Unified Reusable TableFilters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={(applied) => setFilterValues(applied)}
        onClear={() => setFilterValues({ search: '', type: 'all', startDate: '', endDate: '' })}
      />

      {/* Unified Reusable DataTable */}
      <DataTable
        data={filteredBackups}
        columns={columns}
        rowKey={(row) => row.fileName}
        actions={actions}
        pageSize={5}
        emptyTitle="No backup snapshots found"
        emptyDescription="Database backups uploaded to AWS S3 will appear here."
      />

      {/* Manual Backup Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Trigger Manual Backup</h3>
            <p className="text-xs text-slate-500 mt-1">
              Creates a compressed PostgreSQL dump and uploads directly to your AWS S3 bucket.
            </p>

            <form onSubmit={handleTriggerManual} className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Backup Label <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {manualLabel.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  placeholder="e.g. Before Major System Migration"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Reason / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {manualReason.length}/100
                  </span>
                </div>
                <textarea
                  maxLength={100}
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Optional audit reason..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {triggering ? 'Starting...' : 'Start Backup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Automated Backup Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set recurring background database backups to AWS S3.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="pt-4 space-y-4">
              {/* Enable / Disable */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-800">Enable Automated Backups</span>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
              </div>

              {scheduleEnabled && (
                <>
                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  {/* Day of Week for Weekly */}
                  {frequency === 'WEEKLY' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Day of Week <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                      >
                        <option value="SUN">Sunday</option>
                        <option value="MON">Monday</option>
                        <option value="TUE">Tuesday</option>
                        <option value="WED">Wednesday</option>
                        <option value="THU">Thursday</option>
                        <option value="FRI">Friday</option>
                        <option value="SAT">Saturday</option>
                      </select>
                    </div>
                  )}

                  {/* Day of Month for Monthly */}
                  {frequency === 'MONTHLY' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Day of Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            Day {d} of the month
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Execution Time (Philippine Standard Time, UTC+8) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map(Number)
                        setHour(h)
                        setMinute(m)
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Creation Progress Modal */}
      {backupProgressModal?.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
              <Cloud size={24} className="animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Creating Database Backup</h3>
            <p className="text-xs text-slate-500 mt-1 truncate font-medium bg-slate-50 p-1.5 rounded border border-slate-100" title={backupProgressModal.label}>
              {backupProgressModal.label}
            </p>

            <div className="mt-5 space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${backupProgressModal.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
                <span className="truncate pr-2">{backupProgressModal.stage}</span>
                <span className="font-semibold text-blue-600 shrink-0">
                  {backupProgressModal.percent}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Please wait while the snapshot is created, compressed, and uploaded to AWS S3.
            </p>
          </div>
        </div>
      )}

      {/* Download Progress Modal */}
      {downloadModal?.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
              <Download size={24} className="animate-bounce" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Downloading Backup File</h3>
            <p className="text-xs text-slate-500 mt-1 truncate font-mono bg-slate-50 p-1.5 rounded border border-slate-100" title={downloadModal.fileName}>
              {downloadModal.fileName}
            </p>

            <div className="mt-5 space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${downloadModal.percent > 0 ? downloadModal.percent : 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
                <span>
                  {downloadModal.totalMb > 0
                    ? `${downloadModal.receivedMb} MB / ${downloadModal.totalMb} MB`
                    : `${downloadModal.receivedMb} MB downloaded`}
                </span>
                <span className="font-semibold text-blue-600">
                  {downloadModal.percent > 0 ? `${downloadModal.percent}%` : 'Streaming...'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 mb-4">
              Please do not close this window while the snapshot is streaming from AWS S3.
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={handleCancelDownload}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Dialogs Confirmation & Feedback */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
