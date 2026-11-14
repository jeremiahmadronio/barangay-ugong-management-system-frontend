import { useState, useEffect, useMemo } from 'react'
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
  Trash2,
  FolderKanban,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
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
import { useAuth } from '@/hooks/useAuth'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { ComplaintEvidenceGrid, DEFAULT_EVIDENCE_ITEMS } from '@/components/ui/complaint_form/ComplaintEvidenceGrid'
import { BlotterCaseDetailsView } from './components/BlotterCaseDetailsView'
import { EditCaseModal } from './components/EditCaseModal'
import type { ComplaintFormData, WitnessData } from '@/components/ui/complaint_form/types'
import { blotterApi, type BlotterBackendResponse, type BlotterBackendStats } from '@/api/modules/blotter.api'
import { formatDate, formatTableName } from '@/utils/formatters'


interface BlotterRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  dateReported: string
  mode: 'FORMAL_COMPLAINT' | 'FOR_THE_RECORD'
  filingTypeLabel: string
  cycleCount: number
  isReopened: boolean
  latestActiveCaseId: number
  status:
    | 'Pending'
    | 'Under Mediation'
    | 'Under Conciliation'
    | 'On Going'
    | 'Settled'
    | 'Certified to File Action'
    | 'Expired Unactioned'
    | 'Dismissed'
    | 'Withdrawn'
    | 'Recorded'
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
      { label: 'Under Mediation', value: 'UNDER_MEDIATION' },
      { label: 'Under Conciliation', value: 'UNDER_CONCILIATION' },
      { label: 'Settled', value: 'SETTLED' },
      { label: 'Certified to File Action', value: 'CERTIFIED_TO_FILE_ACTION' },
      { label: 'Expired Unactioned', value: 'EXPIRED_UNACTIONED' },
      { label: 'Dismissed', value: 'DISMISSED' },
      { label: 'Recorded', value: 'RECORDED' },
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
]

export const BlotterPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentRole } = useAuth()
  const { hasPermission } = useUserPermissions()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'


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
  const [editingInitialData, setEditingInitialData] = useState<Partial<ComplaintFormData> | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [caseForEdit, setCaseForEdit] = useState<any>(null)
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
      const modeVal = currentFilters.mode
      let filingTypeParam: string | undefined = undefined
      if (modeVal && modeVal !== 'all') {
        if (modeVal === 'FOR_THE_RECORD' || modeVal === 'FOR_RECORD_ONLY' || modeVal === 'RECORDED') {
          filingTypeParam = 'FOR_RECORD_ONLY'
        } else {
          filingTypeParam = modeVal
        }
      }

      const statusVal = currentFilters.status
      let statusParam: string | undefined = undefined
      if (statusVal && statusVal !== 'all') {
        statusParam = statusVal
      }

      const [res, stats] = await Promise.all([
        blotterApi.getAll({
          search: currentFilters.search?.trim() || undefined,
          status: statusParam,
          filingType: filingTypeParam,
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
        const mapped: BlotterRecord[] = data.map((b: any) => {
          const rawSt = String(b.effectiveStatus || b.caseStatus || 'PENDING').toUpperCase()
          let displayStatus: BlotterRecord['status'] = 'Pending'

          if (rawSt === 'RECORDED') {
            displayStatus = 'Recorded'
          } else if (rawSt === 'SETTLED' || rawSt === 'RESOLVED') {
            displayStatus = 'Settled'
          } else if (rawSt === 'UNDER_MEDIATION') {
            displayStatus = 'Under Mediation'
          } else if (rawSt === 'UNDER_CONCILIATION') {
            displayStatus = 'Under Conciliation'
          } else if (rawSt === 'CERTIFIED_TO_FILE_ACTION' || rawSt === 'CFA_ISSUED') {
            displayStatus = 'Certified to File Action'
          } else if (rawSt === 'EXPIRED_UNACTIONED' || rawSt === 'EXPIRED') {
            displayStatus = 'Expired Unactioned'
          } else if (rawSt === 'IN_PROGRESS' || rawSt === 'ON_GOING') {
            displayStatus = 'On Going'
          } else if (rawSt === 'DISMISSED') {
            displayStatus = 'Dismissed'
          } else if (rawSt === 'WITHDRAWN') {
            displayStatus = 'Withdrawn'
          } else {
            displayStatus = 'Pending'
          }

          const caseNo = String(b.rootCaseNumber || b.caseNumber || 'N/A')
          const filingTypeLabel = b.filingType || (String(b.filingType || '').toUpperCase().includes('FORMAL') ? 'Formal Complaint' : 'For the Record')
          const cycleCount = b.cycleCount || 1
          const isReopened = Boolean(b.isReopened || cycleCount > 1)
          const activeId = String(b.latestActiveCaseId || b.id || b.rootCaseId)

          const compName = b.complainantFullName || formatTableName({
            firstName: b.complainant?.firstName,
            lastName: b.complainant?.lastName,
            middleName: b.complainant?.middleName,
            fullName: b.complainant?.fullName,
            fallback: b.complainantName || 'Anonymous',
          })

          const respName = b.respondentFullName || formatTableName({
            firstName: b.respondent?.firstName,
            lastName: b.respondent?.lastName,
            middleName: b.respondent?.middleName,
            fullName: b.respondent?.fullName,
            fallback: b.respondentName || 'Unspecified',
          })

          return {
            id: activeId,
            caseNo,
            complainant: compName,
            respondent: respName,
            dateReported: formatDate(b.dateFiled || b.createdAt || b.dateFiledFormatted),
            mode: String(filingTypeLabel).toUpperCase().includes('FORMAL') ? 'FORMAL_COMPLAINT' : 'FOR_THE_RECORD',
            filingTypeLabel,
            cycleCount,
            isReopened,
            latestActiveCaseId: Number(activeId),
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
    if (viewMode === 'LIST') {
      fetchBackendRecords(filterValues)
    }

    const handleFocus = () => {
      if (viewMode === 'LIST') {
        fetchBackendRecords(filterValues)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [viewMode, filterValues])


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

  const formatMonthlyTrend = (trendStr?: string, count: number = 0) => {
    if (!trendStr) {
      return count > 0 ? '+100.0% vs last month' : '0.0% vs last month'
    }
    const trimmed = trendStr.trim()
    const numMatch = trimmed.match(/([+-]?\s*[\d.]+)\s*%/)
    if (numMatch) {
      const val = parseFloat(numMatch[1].replace(/\s+/g, ''))
      const sign = val > 0 ? '+' : val < 0 ? '-' : ''
      return `${sign}${Math.abs(val).toFixed(1)}% vs last month`
    }
    return count > 0 ? '+100.0% vs last month' : '0.0% vs last month'
  }

  const casesTrendText = formatMonthlyTrend(statsData?.totalCasesTrend, totalCasesCount)

  const statCards: StatCard[] = [
    {
      id: 'total_cases',
      label: 'Total Cases',
      value: totalCasesCount,
      hint: casesTrendText,
      trend: getTrendType(casesTrendText),
      showTrend: true,
      icon: FolderKanban,
      tone: 'slate',
    },
    {
      id: 'total_for_record',
      label: 'Total For the Record',
      value: totalForTheRecordCount,
      hint: 'Incident entries for record only',
      icon: ScrollText,
      tone: 'slate',
    },
    {
      id: 'under_mediation',
      label: 'Under Mediation',
      value: underMediationCount,
      hint: 'Mediation & Conciliation active',
      icon: Scale,
      tone: 'slate',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: settledCount,
      hint: 'Officially resolved cases',
      icon: ShieldCheck,
      tone: 'slate',
    },
  ]

  // Handle Form Submission: saves to backend AND refreshes table list with Success/Error popups
  // Handle Case Edit Mode — Opens dedicated EditCaseModal
  const handleEditCase = async () => {
    if (!selectedRecord) return
    try {
      setIsLoading(true)
      const detail: any = await blotterApi.getById(selectedRecord.id)
      setCaseForEdit(detail || selectedRecord)
      setIsEditModalOpen(true)
    } catch {
      setCaseForEdit(selectedRecord)
      setIsEditModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Form Submission: saves/updates backend AND refreshes table list with Success/Error popups
  const handleFormSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    let savedCaseNo = data.caseInfo.caseNumber
    const isFormal = data.mode === 'FORMAL_COMPLAINT'

    try {
      if (viewMode === 'EDIT' && selectedRecord) {
        await blotterApi.updateCase(selectedRecord.id, data)
        await fetchBackendRecords()
        setDetailRefreshKey((prev) => prev + 1)
        setViewMode('DETAILS')

        showFeedback({
          variant: 'success',
          title: 'Case Updated Successfully!',
          description: `Case #${selectedRecord.caseNo} details have been updated successfully.`,
        })
      } else {
        const res = await blotterApi.create(data)
        if (res && res.caseNumber) {
          savedCaseNo = String(res.caseNumber)
        }
        await fetchBackendRecords()

        setViewMode('LIST')
        navigate('/blotter/records')

        showFeedback({
          variant: 'success',
          title: isFormal ? 'Formal Complaint Filed Successfully!' : 'For the Record Entry Logged!',
          description: `Case #${savedCaseNo} (${data.complainant.firstName} ${data.complainant.lastName} vs ${data.respondent.firstName} ${data.respondent.lastName}) has been successfully saved into official Blotter records.`,
        })
      }
    } catch (err: any) {
      console.error('Error submitting blotter complaint:', err)
      const errMsg = err?.response?.data?.message || err?.message || 'An error occurred while attempting to record the case. Please check required fields and try again.'
      showFeedback({
        variant: 'error',
        title: viewMode === 'EDIT' ? 'Case Update Failed' : (isFormal ? 'Filing Formal Complaint Failed' : 'Logging Record Entry Failed'),
        description: errMsg,
      })
    } finally {
      setIsSubmitting(false)
    }
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
      title: `Archive Case – #${row.caseNo}?`,
      description: `Are you sure you want to archive Case #${row.caseNo} (${row.complainant} vs ${row.respondent})? This will move the case to the Archive vault.`,
      confirmLabel: 'Archive Case',
      tone: 'emerald',
      onConfirm: async () => {
        try {
          await blotterApi.archiveCase(row.id, 'Archived Record')
          await fetchBackendRecords()
          showFeedback({
            variant: 'success',
            title: 'Case Archived',
            description: `Case #${row.caseNo} has been moved to the Archive Vault successfully.`,
          })
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || err?.message || 'Failed to archive case.'
          showFeedback({
            variant: 'error',
            title: 'Archive Failed',
            description: errMsg,
          })
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
      r.status.toLowerCase() === selectedStatus.replace('_', ' ') ||
      (selectedStatus === 'recorded' && (
        r.rawStatus === 'RECORDED' ||
        r.status === 'Recorded' ||
        r.mode === 'FOR_THE_RECORD' ||
        (r.filingTypeLabel && r.filingTypeLabel.toLowerCase().includes('record'))
      ))

    // 3. Filing Mode filter
    const matchesMode =
      selectedMode === 'all' ||
      r.mode.toLowerCase() === selectedMode.toLowerCase() ||
      (selectedMode.includes('record') && (
        r.mode === 'FOR_THE_RECORD' ||
        r.rawStatus === 'RECORDED' ||
        r.status === 'Recorded' ||
        (r.filingTypeLabel && r.filingTypeLabel.toLowerCase().includes('record'))
      )) ||
      (selectedMode.includes('formal') && (
        r.mode === 'FORMAL_COMPLAINT' ||
        (r.filingTypeLabel && r.filingTypeLabel.toLowerCase().includes('formal'))
      ))

    return matchesSearch && matchesStatus && matchesMode
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
            {r.filingTypeLabel}
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
      render: (r: BlotterRecord) => {
        if (
          !r.respondent ||
          r.respondent === 'N/A' ||
          r.respondent === '—' ||
          r.respondent.toLowerCase().includes('no respondent')
        ) {
          return <span className="text-slate-400 italic text-[11px]">No Respondent</span>
        }
        return <span className="font-medium text-slate-800">{r.respondent}</span>
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const toneMap: Record<BlotterRecord['status'], BadgeTone> = {
          Pending: 'amber',
          Recorded: 'slate',
          'On Going': 'sky',
          'Under Mediation': 'sky',
          'Under Conciliation': 'indigo',
          Settled: 'emerald',
          'Certified to File Action': 'violet',
          'Expired Unactioned': 'rose',
          Dismissed: 'rose',
          Withdrawn: 'rose',
        }
        return <Badge tone={toneMap[r.status] || 'slate'}>{r.status.toUpperCase()}</Badge>
      },
    },
    {
      key: 'dateReported',
      header: 'DATE FILED',
    },
  ]

  // Handle Soft Delete for Blotter Desk Cases
  const handleSoftDelete = (row: BlotterRecord) => {
    const activeStatuses: BlotterRecord['status'][] = ['Pending', 'On Going', 'Under Mediation', 'Under Conciliation']
    if (activeStatuses.includes(row.status)) {
      showFeedback({
        variant: 'error',
        title: 'Action Blocked',
        description: `Cannot move active case #${row.caseNo} to trash while it is ${row.status.toUpperCase()}. Please settle, dismiss, or withdraw the case first.`,
      })
      return
    }

    confirm({
      title: `Move Case #${row.caseNo} to Trash?`,
      description: `Are you sure you want to move Case #${row.caseNo} (${row.complainant} vs ${row.respondent}) to the Recycle Bin? You can restore it at any time from the Archive & Trash Vault.`,
      confirmLabel: 'Move to Trash',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await blotterApi.softDeleteCase(row.id)
          await fetchBackendRecords()
          showFeedback({
            variant: 'success',
            title: 'Case Moved to Trash',
            description: `Case #${row.caseNo} has been moved to the Recycle Bin successfully.`,
          })
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || err?.message || 'Failed to move case to trash.'
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: errMsg,
          })
        }
      },
    })
  }

  // Table Actions — 3 dots dropdown menu filtered by permissions
  const actions: RowAction<BlotterRecord>[] = useMemo(() => {
    const list: RowAction<BlotterRecord>[] = []

    if (hasPermission('View Cases')) {
      list.push({
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: handleView,
      })
    }

    if (!isSystemAdmin && hasPermission('Archive Case')) {
      list.push({
        id: 'archive',
        label: 'Archive Case',
        icon: Archive,
        tone: 'emerald',
        onClick: handleArchive,
      })
    }

    if (!isSystemAdmin && hasPermission('Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Case',
        icon: Trash2,
        tone: 'danger',
        onClick: handleSoftDelete,
      })
    }

    return list
  }, [hasPermission, isSystemAdmin])

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
            fetchBackendRecords()
          }}
          onEdit={handleEditCase}
          onSettle={() => handleSettle(selectedRecord)}
        />
      ) : viewMode === 'LIST' ? (
        <>
          {/* Unified System PageHeader */}
          <PageHeader
            title="Blotter Case Files"
            description="Record, track, and manage barangay incident reports and consultation records."
          />

          {/* Reusable Stats Cards Component */}
          <StatsCards cards={statCards} />

          {/* Blotter Data Table with 3-Dots Action Menu */}
          <DataTable
            data={filteredRecords}
            columns={columns}
            rowKey={(r) => r.id}
            actions={actions.length > 0 ? actions : undefined}
            pageSize={5}
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


      {/* Edit Case Modal */}
      <EditCaseModal
        isOpen={isEditModalOpen}
        caseRecord={caseForEdit}
        onClose={() => {
          setIsEditModalOpen(false)
          setCaseForEdit(null)
        }}
        onSuccess={() => {
          setDetailRefreshKey((prev) => prev + 1)
          fetchBackendRecords()
        }}
        showFeedback={showFeedback}
      />

      {/* Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
