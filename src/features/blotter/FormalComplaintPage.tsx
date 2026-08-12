import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  Plus,
  Eye,
  FileText,
  Users,
  Hourglass,
  CheckCircle2,
  Archive,
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
  type BadgeTone,
} from '@/components/ui'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { blotterApi, type BlotterBackendResponse } from '@/api/modules/blotter.api'
import { formatDate, formatTableName } from '@/utils/formatters'
import { DEFAULT_NATURE_OF_COMPLAINT_OPTIONS } from '@/components/ui/complaint_form/NatureInputField'

interface FormalComplaintRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  incidentType: string
  dateReported: string
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
    key: 'nature',
    label: 'Nature of Complaint',
    options: [
      { label: 'All Natures', value: 'all' },
      ...DEFAULT_NATURE_OF_COMPLAINT_OPTIONS.map((n) => ({ label: n.label, value: n.value })),
    ],
  },
  {
    key: 'docketType',
    label: 'Complaint Category',
    options: [
      { label: 'All Categories', value: 'all' },
      { label: 'Formal Complaint Case', value: 'FORMAL' },
      { label: 'Mediation Track', value: 'MEDIATION' },
      { label: 'Conciliation Track', value: 'CONCILIATION' },
    ],
  },
]

export const FormalComplaintPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState<FormalComplaintRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    nature: 'all',
  })

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  const fetchBackendRecords = async () => {
    setIsLoading(true)
    try {
      const data = await blotterApi.getAll({ filingType: 'FORMAL_COMPLAINT' })
      if (data && Array.isArray(data)) {
        const mapped: FormalComplaintRecord[] = data.map((b: BlotterBackendResponse) => {
          const rawSt = String(b.caseStatus || 'PENDING').toUpperCase()
          let displayStatus: FormalComplaintRecord['status'] = 'Pending'

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

          const rawDate = b.createdAt || b.dateFiledFormatted || b.dateOfIncident
          const formattedDate = formatDate(rawDate)

          const compDisplay = formatTableName({
            firstName: b.complainant?.firstName,
            lastName: b.complainant?.lastName,
            middleName: b.complainant?.middleName,
            fullName: b.complainant?.fullName,
            fallback: b.complainantName || 'N/A',
          })

          const respDisplay = formatTableName({
            firstName: b.respondent?.firstName,
            lastName: b.respondent?.lastName,
            middleName: b.respondent?.middleName,
            fullName: b.respondent?.fullName,
            fallback: b.respondentName || 'N/A',
          })

          return {
            id: String(b.id),
            caseNo: String(b.caseNumber || `BLT-${b.id}`),
            complainant: compDisplay,
            respondent: respDisplay,
            incidentType: b.natureOfComplaint || 'General Complaint',
            dateReported: formattedDate || 'N/A',
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
    fetchBackendRecords()
  }, [])

  const totalCases = records.length
  const pendingCases = records.filter((r) => r.status === 'Pending').length
  const underMediationCases = records.filter((r) => r.status === 'Under Mediation' || r.status === 'Under Conciliation').length
  const settledCases = records.filter((r) => r.status === 'Settled').length

  const statCards: StatCard[] = [
    {
      id: 'total_formal',
      label: 'Formal Complaints',
      value: totalCases,
      hint: 'Total active formal complaint records',
      icon: ShieldAlert,
      tone: 'indigo',
    },
    {
      id: 'pending_cases',
      label: 'Pending Cases',
      value: pendingCases,
      hint: 'Awaiting initial officer hearing',
      icon: Users,
      tone: 'amber',
    },
    {
      id: 'under_mediation',
      label: 'Under Mediation',
      value: underMediationCases,
      hint: 'Mediation & Conciliation active',
      icon: Hourglass,
      tone: 'violet',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: settledCases,
      hint: 'Amicably settled or resolved',
      icon: CheckCircle2,
      tone: 'emerald',
    },
  ]

  const handleArchive = (row: FormalComplaintRecord) => {
    const activeStatuses: FormalComplaintRecord['status'][] = ['Pending', 'On Going', 'Under Mediation', 'Under Conciliation']
    if (activeStatuses.includes(row.status)) {
      showFeedback({
        title: 'Archiving Blocked',
        message: `Cannot archive Case #${row.caseNo} because its status is ${row.status.toUpperCase()}. Only Settled, Dismissed, or Withdrawn cases can be archived.`,
        variant: 'error',
      })
      return
    }

    confirm({
      title: 'Archive Case?',
      message: `Are you sure you want to archive Case #${row.caseNo}? It will be stored in the Archive Vault.`,
      confirmLabel: 'Archive Case',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await blotterApi.delete(row.id)
          setRecords((prev) => prev.filter((r) => r.id !== row.id))
          showFeedback({
            title: 'Case Archived',
            message: `Case #${row.caseNo} has been safely archived.`,
            variant: 'success',
          })
          fetchBackendRecords()
        } catch {
          showFeedback({
            title: 'Archive Failed',
            message: 'Failed to archive case. Please check server connection.',
            variant: 'error',
          })
        }
      },
    })
  }

  const handleSettle = (row: FormalComplaintRecord) => {
    confirm({
      title: 'Mark Case as Settled?',
      message: `Are you sure you want to mark Case #${row.caseNo} (${row.complainant} vs ${row.respondent}) as SETTLED?`,
      confirmLabel: 'Mark as Settled',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await blotterApi.updateStatus(row.id, 'SETTLED')
          showFeedback({
            title: 'Case Settled',
            message: `Case #${row.caseNo} is now marked as SETTLED.`,
            variant: 'success',
          })
          fetchBackendRecords()
        } catch {
          showFeedback({
            title: 'Update Failed',
            message: 'Failed to update case status.',
            variant: 'error',
          })
        }
      },
    })
  }

  const handleView = (row: FormalComplaintRecord) => {
    showFeedback({
      title: `Case #${row.caseNo} Details`,
      message: `Complainant: ${row.complainant} | Respondent: ${row.respondent} | Nature: ${row.incidentType} | Date Filed: ${row.dateReported}`,
      actionLabel: 'Close Details',
    })
  }

  const filteredRecords = records.filter((r) => {
    const search = (filterValues.search ?? '').trim().toLowerCase()
    const selectedStatus = (filterValues.status ?? 'all').toLowerCase()
    const selectedNature = (filterValues.nature ?? 'all').toLowerCase()

    const matchesSearch =
      search === '' ||
      r.caseNo.toLowerCase().includes(search) ||
      r.complainant.toLowerCase().includes(search) ||
      r.respondent.toLowerCase().includes(search)

    const matchesStatus =
      selectedStatus === 'all' ||
      r.rawStatus.toLowerCase() === selectedStatus ||
      r.status.toLowerCase() === selectedStatus.replace('_', ' ')

    const matchesNature =
      selectedNature === 'all' ||
      r.incidentType.toLowerCase().includes(selectedNature)

    return matchesSearch && matchesStatus && matchesNature
  })

  const columns: Column<FormalComplaintRecord>[] = [
    {
      key: 'caseNo',
      header: 'CASE / BLOTTER NO.',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.caseNo}</span>
          <span className="block text-[10px] font-medium text-blue-600">Formal Complaint</span>
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
        const toneMap: Record<FormalComplaintRecord['status'], BadgeTone> = {
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

  const actions: RowAction<FormalComplaintRecord>[] = [
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-blue-600 shrink-0" />
            Formal Complaint Records
          </h1>
          <p className="text-sm text-slate-500">
            Record, track, and manage official barangay blotter complaint cases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/blotter/entry')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" /> File Formal Complaint
          </Button>
        </div>
      </div>

      {/* Reusable Stats Cards Component */}
      <StatsCards cards={statCards} />

      {/* Data Table with Reusable TableFilters */}
      <DataTable
        data={filteredRecords}
        columns={columns}
        rowKey={(r) => r.id}
        actions={actions}
        emptyTitle={isLoading ? 'Loading records...' : 'No formal complaint cases found'}
        emptyDescription={
          isLoading
            ? 'Fetching real blotter data from backend...'
            : 'There are no formal complaint cases matching your search criteria or filters.'
        }
        header={
          <TableFilters
            filters={filterConfigs}
            values={filterValues}
            onApply={(applied) => setFilterValues(applied)}
            onClear={() => setFilterValues({ search: '', status: 'all', nature: 'all' })}
          />
        }
      />

      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
