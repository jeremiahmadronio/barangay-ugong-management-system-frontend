import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  Plus,
  Eye,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Users,
  Hourglass,
  CheckCircle2,
  Archive,
  ScrollText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  TableFilters,
  Badge,
  ConfirmationDialog,
  FeedbackDialog,
  StatsCards,
  type StatCard,
} from '@/components/ui'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { BlotterCaseDetailsView } from './components/BlotterCaseDetailsView'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'
import { blotterApi, type BlotterBackendResponse, type BlotterBackendStats } from '@/api/modules/blotter.api'
import { formatDate, formatTableName } from '@/utils/formatters'


interface BlotterRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  incidentType: string
  dateReported: string
  mode: 'FORMAL_COMPLAINT' | 'FOR_THE_RECORD'
  status: 'Pending' | 'Under Mediation' | 'Under Conciliation' | 'On Going' | 'Settled' | 'Dismissed' | 'Withdrawn'
  rawStatus: string
}

const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Complainant Last Name, or Respondent Last Name...',
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'On Going', value: 'ON_GOING' },
      { label: 'Under Mediation', value: 'UNDER_MEDIATION' },
      { label: 'Under Conciliation', value: 'UNDER_CONCILIATION' },
      { label: 'Settled', value: 'SETTLED' },
      { label: 'Dismissed', value: 'DISMISSED' },
      { label: 'Withdrawn', value: 'WITHDRAWN' },
    ],
  },
  {
    key: 'mode',
    label: 'Entry Type',
    options: [
      { label: 'All Entry Modes', value: 'all' },
      { label: 'Formal Complaint', value: 'FORMAL_COMPLAINT' },
      { label: 'For the Record', value: 'FOR_THE_RECORD' },
    ],
  },
  {
    key: 'nature',
    label: 'Nature of Complaint',
    options: [
      { label: 'All Natures', value: 'all' },
      { label: 'Consultation & Inquiry', value: 'Consultation' },
      { label: 'Incident Record', value: 'Incident' },
      { label: 'Physical Injury / Assault', value: 'Physical Injury' },
      { label: 'Property Damage / Theft', value: 'Theft' },
      { label: 'Noise Nuisance / Disturbance', value: 'Disturbance' },
    ],
  },
]

export const BlotterPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Real backend records & stats
  const [records, setRecords] = useState<BlotterRecord[]>([])
  const [statsData, setStatsData] = useState<BlotterBackendStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    mode: 'all',
  })

  // Detect route mode from URL path
  const isCreateRoute =
    location.pathname.includes('/entry') ||
    location.pathname.includes('/new') ||
    location.pathname.includes('/create')

  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAILS'>(
    isCreateRoute ? 'CREATE' : 'LIST'
  )
  const [selectedRecord, setSelectedRecord] = useState<BlotterRecord | null>(null)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)
  const [activeFormMode, setActiveFormMode] = useState<'FORMAL_COMPLAINT' | 'FOR_THE_RECORD'>('FORMAL_COMPLAINT')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Custom hook for dialogs
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Sync route mode
  useEffect(() => {
    if (isCreateRoute) {
      setViewMode('CREATE')
    } else {
      setViewMode('LIST')
    }
  }, [location.pathname, isCreateRoute])

  // Fetch real Blotter cases from Spring Boot backend API with server-side filtering & pagination
  const fetchBackendRecords = async (currentFilters = filterValues) => {
    setIsLoading(true)
    try {
      const [res, stats] = await Promise.all([
        blotterApi.getAll({
          search: currentFilters.search?.trim() || undefined,
          status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
          filingType: currentFilters.mode !== 'all' ? currentFilters.mode : undefined,
          natureOfComplaint: currentFilters.nature !== 'all' ? currentFilters.nature : undefined,
          page: 0,
          size: 50,
        }),
        blotterApi.getStats().catch(() => null),
      ])

      if (stats) {
        setStatsData(stats)
      }

      const data = Array.isArray(res) ? res : res && 'content' in res ? res.content : []

      if (data && Array.isArray(data)) {
        const mapped: BlotterRecord[] = data.map((b: BlotterBackendResponse) => {
          const rawSt = String(b.caseStatus || 'PENDING').toUpperCase()
          let displayStatus: BlotterRecord['status'] = 'Pending'

          if (rawSt === 'SETTLED' || rawSt === 'RESOLVED') {
            displayStatus = 'Settled'
          } else if (rawSt === 'UNDER_MEDIATION') {
            displayStatus = 'Under Mediation'
          } else if (rawSt === 'UNDER_CONCILIATION') {
            displayStatus = 'Under Conciliation'
          } else if (rawSt === 'IN_PROGRESS' || rawSt === 'ON_GOING') {
            displayStatus = 'On Going'
          } else if (rawSt === 'DISMISSED') {
            displayStatus = 'Dismissed'
          } else if (rawSt === 'WITHDRAWN') {
            displayStatus = 'Withdrawn'
          } else {
            displayStatus = 'Pending'
          }

          const compName = formatTableName({
            firstName: b.complainant?.firstName,
            lastName: b.complainant?.lastName,
            middleName: b.complainant?.middleName,
            fullName: b.complainant?.fullName,
            fallback: b.complainantName || 'Anonymous',
          })

          const respName = formatTableName({
            firstName: b.respondent?.firstName,
            lastName: b.respondent?.lastName,
            middleName: b.respondent?.middleName,
            fullName: b.respondent?.fullName,
            fallback: b.respondentName || 'Unspecified',
          })

          const natureName =
            b.incident?.natureOfComplaint ||
            b.natureOfComplaint ||
            'General Incident'

          return {
            id: String(b.id),
            caseNo: String(b.caseNumber || 'N/A'),
            complainant: compName,
            respondent: respName,
            incidentType: natureName,
            dateReported: formatDate(b.createdAt || b.dateFiledFormatted || b.incident?.dateOfIncident || b.dateOfIncident),
            mode: String(b.filingType || '').toUpperCase().includes('FORMAL') ? 'FORMAL_COMPLAINT' : 'FOR_THE_RECORD',
            status: displayStatus,
            rawStatus: rawSt,
          }

        })
        setRecords(mapped)
      } else {
        setRecords([])
      }
    } catch {
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBackendRecords(filterValues)
  }, [filterValues])


  // Calculate Stat Cards Metrics using real backend stats data or records fallback
  const totalCasesCount = statsData?.totalCases ?? records.length
  const totalForTheRecordCount = statsData?.totalForTheRecord ?? records.filter(
    (r) => r.mode === 'FOR_THE_RECORD' || String(r.mode).toUpperCase().includes('RECORD')
  ).length
  const underMediationCount = statsData?.inProgressCases ?? records.filter(
    (r) => r.status === 'Under Mediation' || r.status === 'Under Conciliation'
  ).length
  const settledCount = statsData?.resolvedCases ?? records.filter((r) => r.status === 'Settled').length

  const getTrendType = (trendStr?: string): 'up' | 'down' | 'neutral' => {
    if (!trendStr) return 'neutral'
    const trimmed = trendStr.trim()
    if (trimmed.startsWith('+') && !trimmed.includes('+0.0%') && !trimmed.includes('+0%')) return 'up'
    if (trimmed.startsWith('-') && !trimmed.includes('-0.0%') && !trimmed.includes('-0%')) return 'down'
    return 'neutral'
  }

  const casesTrendText = statsData?.totalCasesTrend || (totalCasesCount > 0 ? '+100.0% vs last month' : '0.0% vs last month')
  const recordTrendText = statsData?.totalForTheRecordTrend || (totalForTheRecordCount > 0 ? '+100.0% vs last month' : '0.0% vs last month')

  const statCards: StatCard[] = [
    {
      id: 'total_cases',
      label: 'Total Cases',
      value: totalCasesCount,
      hint: casesTrendText,
      trend: getTrendType(casesTrendText),
      showTrend: true,
      icon: FileText,
      tone: 'indigo',
    },
    {
      id: 'total_for_record',
      label: 'Total For the Record',
      value: totalForTheRecordCount,
      hint: recordTrendText,
      trend: getTrendType(recordTrendText),
      showTrend: true,
      icon: ScrollText,
      tone: 'emerald',
    },
    {
      id: 'under_mediation',
      label: 'Under Mediation',
      value: underMediationCount,
      hint: 'Mediation & Conciliation active',
      icon: Hourglass,
      tone: 'amber',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: settledCount,
      hint: 'Officially resolved cases',
      icon: CheckCircle2,
      tone: 'cyan',
    },
  ]

  // Handle Form Submission: saves to backend AND refreshes table list
  const handleFormSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    let savedCaseNo = data.caseInfo.caseNumber

    try {
      const res = await blotterApi.create(data)
      if (res && res.caseNumber) {
        savedCaseNo = String(res.caseNumber)
      }
      await fetchBackendRecords()
    } catch {
      // Backend call fails or offline -> optimistic addition
      const newRecord: BlotterRecord = {
        id: `blt_${Date.now()}`,
        caseNo: savedCaseNo,
        complainant: `${data.complainant.lastName}, ${data.complainant.firstName}`.trim(),
        respondent: `${data.respondent.lastName}, ${data.respondent.firstName}`.trim(),
        incidentType: data.incident.natureOfComplaint || 'General Incident',
        dateReported: data.caseInfo.dateFiled,
        mode: data.mode,
        status: 'Pending',
        rawStatus: 'PENDING',
      }
      setRecords((prev) => [newRecord, ...prev])
    } finally {
      setIsSubmitting(false)
    }

    setViewMode('LIST')
    navigate('/blotter/records')

    showFeedback({
      variant: 'success',
      title: data.mode === 'FORMAL_COMPLAINT' ? 'Formal Complaint Filed!' : 'Record Entry Logged!',
      description: `Case #${savedCaseNo} (${data.complainant.firstName} ${data.complainant.lastName} vs ${data.respondent.firstName} ${data.respondent.lastName}) has been recorded in the Blotter System.`,
    })
  }

  // Archive record — Enforces Business Rule: Cannot archive if Pending, On Going, Under Mediation, or Under Conciliation!
  const handleArchive = (row: BlotterRecord) => {
    const activeStatuses: BlotterRecord['status'][] = ['Pending', 'On Going', 'Under Mediation', 'Under Conciliation']
    if (activeStatuses.includes(row.status)) {
      showFeedback({
        variant: 'error',
        title: 'Archiving Blocked by Business Rule',
        description: `Cannot archive Case #${row.caseNo} because its status is currently ${row.status.toUpperCase()}. Only Settled, Dismissed, or Withdrawn cases can be archived.`,
      })
      return
    }

    confirm({
      title: 'Archive Blotter Case?',
      description: `Are you sure you want to archive Case #${row.caseNo}? It will be safely moved to the Barangay Archive Vault.`,
      tone: 'warning',
      confirmLabel: 'Archive Record',
      onConfirm: async () => {
        try {
          await blotterApi.delete(row.id)
          await fetchBackendRecords()
          showFeedback({
            variant: 'success',
            title: 'Case Archived',
            description: `Case #${row.caseNo} has been moved to the Archive Vault successfully.`,
          })
        } catch (err: any) {
          if (err?.response?.data?.message) {
            showFeedback({
              variant: 'error',
              title: 'Backend Business Rule Exception',
              description: err.response.data.message,
            })
          } else {
            setRecords((prev) => prev.filter((item) => item.id !== row.id))
          }
        }
      },
    })
  }

  // Mark as Settled
  const handleSettle = (row: BlotterRecord) => {
    confirm({
      title: 'Mark Case as Settled?',
      description: `Are you sure case #${row.caseNo} has been officially settled through conciliation?`,
      tone: 'default',
      confirmLabel: 'Mark as Settled',
      onConfirm: async () => {
        const settledRecord = {
          ...row,
          status: 'Settled' as const,
          rawStatus: 'SETTLED',
        }

        try {
          await blotterApi.updateStatus(row.id, 'SETTLED')
          await fetchBackendRecords()
        } catch {
          setRecords((prev) =>
            prev.map((item) =>
              item.id === row.id ? { ...item, status: 'Settled', rawStatus: 'SETTLED' } : item
            )
          )
        }

        setSelectedRecord((prev) => (prev?.id === row.id ? settledRecord : prev))
        setDetailRefreshKey((prev) => prev + 1)

        showFeedback({
          variant: 'success',
          title: 'Case Settled',
          description: `Case #${row.caseNo} status updated to Settled.`,
        })
      },
    })
  }

  // View Details
  const handleView = (row: BlotterRecord) => {
    setSelectedRecord(row)
    setViewMode('DETAILS')
  }

  const filteredRecords = records.filter((r) => {
    const search = (filterValues.search ?? '').trim().toLowerCase()
    const selectedStatus = (filterValues.status ?? 'all').toLowerCase()
    const selectedMode = (filterValues.mode ?? 'all').toLowerCase()
    const selectedNature = (filterValues.nature ?? 'all').toLowerCase()

    // 1. Search filter: Match Case Number OR Complainant (Last Name / Full Name) OR Respondent (Last Name / Full Name)
    const matchesSearch =
      search === '' ||
      r.caseNo.toLowerCase().includes(search) ||
      r.complainant.toLowerCase().includes(search) ||
      r.respondent.toLowerCase().includes(search)

    // 2. Status filter
    const matchesStatus =
      selectedStatus === 'all' ||
      r.rawStatus.toLowerCase() === selectedStatus ||
      r.status.toLowerCase() === selectedStatus.replace('_', ' ')

    // 3. Filing Mode filter
    const matchesMode =
      selectedMode === 'all' ||
      r.mode.toLowerCase().includes(selectedMode.replace('_the_', '_'))

    // 4. Nature filter
    const matchesNature =
      selectedNature === 'all' ||
      r.incidentType.toLowerCase().includes(selectedNature)

    return matchesSearch && matchesStatus && matchesMode && matchesNature
  })

  // Table Columns using Reusable UI DataTable Format
  const columns: Column<BlotterRecord>[] = [
    {
      key: 'caseNo',
      header: 'CASE / BLOTTER NO.',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.caseNo}</span>
          <span className="block text-[10px] font-medium text-slate-400">
            {r.mode === 'FORMAL_COMPLAINT' ? 'Formal Complaint' : 'For the Record'}
          </span>
        </div>
      ),
    },
    {
      key: 'complainant',
      header: 'COMPLAINANT',
    },
    {
      key: 'respondent',
      header: 'RESPONDENT',
    },
    {
      key: 'incidentType',
      header: 'NATURE OF COMPLAINT',
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const toneMap: Record<BlotterRecord['status'], BadgeTone> = {
          Pending: 'amber',
          'On Going': 'sky',
          'Under Mediation': 'amber',
          'Under Conciliation': 'amber',
          Settled: 'emerald',
          Dismissed: 'slate',
          Withdrawn: 'slate',
        }
        return <Badge tone={toneMap[r.status] || 'slate'}>{r.status.toUpperCase()}</Badge>
      },
    },
    {
      key: 'dateReported',
      header: 'DATE FILED',
    },
  ]

  // Table Actions — 3 dots dropdown menu using Reusable RowAction[]
  const actions: RowAction<BlotterRecord>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: handleView,
    },
    {
      id: 'settle',
      label: 'Mark as Settled',
      icon: CheckCircle2,
      tone: 'warning',
      hidden: (r) => r.status === 'Settled' || r.status === 'Dismissed',
      onClick: handleSettle,
    },
    {
      id: 'archive',
      label: 'Archive Case',
      icon: Archive,
      tone: 'danger',
      onClick: handleArchive,
    },
  ]

  return (
    <div className="space-y-6">
      {viewMode === 'DETAILS' && selectedRecord ? (
        <BlotterCaseDetailsView
          caseId={selectedRecord.id}
          caseNumber={selectedRecord.caseNo}
          refreshKey={detailRefreshKey}
          onBack={() => {
            setSelectedRecord(null)
            setViewMode('LIST')
          }}
          onSettle={() => handleSettle(selectedRecord)}
        />
      ) : viewMode === 'LIST' ? (
        <>
          {/* Header Bar for Blotter Table */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">

                Blotter Records
              </h1>
              <p className="text-sm text-slate-500">
                Record, track, and manage barangay incident reports and consultation records.
              </p>
            </div>

            {/* Action Buttons to launch Complaint Forms */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveFormMode('FOR_THE_RECORD')
                  setViewMode('CREATE')
                }}
                className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                <FileText className="h-4 w-4 text-slate-500" /> + For the Record Entry
              </Button>
              <Button
                onClick={() => {
                  setActiveFormMode('FORMAL_COMPLAINT')
                  setViewMode('CREATE')
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" /> File Formal Complaint
              </Button>
            </div>
          </div>

          {/* Reusable Stats Cards Component */}
          <StatsCards cards={statCards} />

          {/* Blotter Data Table with 3-Dots Action Menu */}
          <DataTable
            data={filteredRecords}
            columns={columns}
            rowKey={(r) => r.id}
            actions={actions}
            emptyTitle={isLoading ? 'Loading records...' : 'No blotter records found'}
            emptyDescription={
              isLoading
                ? 'Fetching real blotter data from backend...'
                : 'There are no blotter cases matching your search criteria or filters.'
            }
            header={
              <TableFilters
                filters={filterConfigs}
                values={filterValues}
                onApply={(applied) => setFilterValues(applied)}
                onClear={() => setFilterValues({ search: '', status: 'all', mode: 'all' })}
              />
            }
          />
        </>
      ) : viewMode === 'CREATE' ? (
        /* FORM FILING VIEW */
        <div className="space-y-6">
          {/* Top Navigation & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewMode('LIST')
                  navigate('/blotter/records')
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back to Records"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeFormMode === 'FORMAL_COMPLAINT'
                    ? 'File Formal Complaint'
                    : 'Log For the Record Entry'}
                </h2>
                <p className="text-xs text-slate-500">
                  Fill in the required information to record an official barangay case.
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFormMode('FORMAL_COMPLAINT')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeFormMode === 'FORMAL_COMPLAINT'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Formal Complaint
              </button>
              <button
                type="button"
                onClick={() => setActiveFormMode('FOR_THE_RECORD')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeFormMode === 'FOR_THE_RECORD'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <FileText className="w-4 h-4" /> For the Record
              </button>
            </div>
          </div>

          {/* Render Active Reusable Form Component */}
          {activeFormMode === 'FORMAL_COMPLAINT' ? (
            <FormalComplaintForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setViewMode('LIST')
                navigate('/blotter/records')
              }}
              isSubmitting={isSubmitting}
            />
          ) : (
            <ForTheRecordForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setViewMode('LIST')
                navigate('/blotter/records')
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      ) : null}

      {/* Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
