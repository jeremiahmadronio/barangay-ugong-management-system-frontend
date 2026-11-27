import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScrollText,
  Plus,
  Eye,
  BookOpen,
  Calendar,
  Archive,
  HelpCircle,
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
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { blotterService } from '@/config/api/blotter/blotter.service'
import type { BlotterBackendResponse } from '@/config/api/blotter/blotter.types'
import { formatDate, formatTableName } from '@/utils/formatters'
import { DEFAULT_NATURE_OF_COMPLAINT_OPTIONS } from '@/components/ui/complaint_form/NatureInputField'
import { BlotterCaseDetailsView } from './components/BlotterCaseDetailsView'

interface ForTheRecordRecord {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  dateReported: string
  filingTypeLabel: string
  cycleCount: number
  isReopened: boolean
  latestActiveCaseId: number
  status: string
  rawStatus: string
  mode: string
}

const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Record No., Reporting Person Last Name, or Person Involved Last Name...',
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Log Statuses', value: 'all' },
      { label: 'Recorded / Logged', value: 'RECORDED' },
      { label: 'Under Review', value: 'PENDING' },
      { label: 'Resolved / Closed', value: 'SETTLED' },
    ],
  },
  {
    key: 'nature',
    label: 'Nature of Incident',
    options: [
      { label: 'All Natures', value: 'all' },
      { label: 'Consultation / Legal Advice', value: 'Consultation' },
      { label: 'Incident Record Only', value: 'Incident' },
      ...DEFAULT_NATURE_OF_COMPLAINT_OPTIONS.map((n) => ({ label: n.label, value: n.value })),
    ],
  },
  {
    key: 'docketType',
    label: 'Docket Type',
    options: [
      { label: 'All Docket Types', value: 'all' },
      { label: 'Incident Report Log', value: 'Incident' },
      { label: 'Consultation & Inquiry', value: 'Consultation' },
      { label: 'General Docket Entry', value: 'General' },
    ],
  },
]

export const ForTheRecordPage = () => {
  const navigate = useNavigate()

  const [records, setRecords] = useState<ForTheRecordRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST')
  const [selectedRecord, setSelectedRecord] = useState<ForTheRecordRecord | null>(null)

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    nature: 'all',
    docketType: 'all',
  })

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  const fetchBackendRecords = async () => {
    setIsLoading(true)
    try {
      // Fetch both FOR_RECORD_ONLY and general blotter records as fallback
      const data = await blotterService.getAll({ filingType: 'FOR_RECORD_ONLY' })
      let recordsList = data

      if (!recordsList || !Array.isArray(recordsList) || recordsList.length === 0) {
        const allData = await blotterService.getAll()
        if (allData && Array.isArray(allData)) {
          recordsList = allData.filter((b) => b.filingType !== 'FORMAL_COMPLAINT')
          if (recordsList.length === 0) recordsList = allData
        }
      }

      if (recordsList && Array.isArray(recordsList)) {
        const mapped: ForTheRecordRecord[] = recordsList.map((b: any) => {
          const rawDate = b.dateFiled || b.createdAt || b.dateFiledFormatted || b.dateOfIncident
          const formattedDate = formatDate(rawDate)

          const caseNo = String(b.rootCaseNumber || b.caseNumber || `REC-${b.id}`)
          const filingTypeLabel = b.filingType || 'For the Record'
          const cycleCount = b.cycleCount || 1
          const isReopened = Boolean(b.isReopened || cycleCount > 1)
          const activeId = String(b.latestActiveCaseId || b.id || b.rootCaseId)

          const compDisplay = b.complainantFullName || formatTableName({
            firstName: b.complainant?.firstName,
            lastName: b.complainant?.lastName,
            middleName: b.complainant?.middleName,
            fullName: b.complainant?.fullName,
            fallback: b.complainantName || 'N/A',
          })

          const respDisplay = b.respondentFullName || formatTableName({
            firstName: b.respondent?.firstName,
            lastName: b.respondent?.lastName,
            middleName: b.respondent?.middleName,
            fullName: b.respondent?.fullName,
            fallback: b.respondentName || 'N/A',
          })

          return {
            id: activeId,
            caseNo,
            complainant: compDisplay,
            respondent: respDisplay,
            dateReported: formattedDate || 'N/A',
            filingTypeLabel,
            cycleCount,
            isReopened,
            latestActiveCaseId: Number(activeId),
            status: 'Recorded',
            rawStatus: String(b.effectiveStatus || b.caseStatus || 'PENDING'),
            mode: b.filingType || 'FOR_RECORD_ONLY',
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

  const totalLogs = records.length
  const incidentLogs = records.filter((r) => r.incidentType.toLowerCase().includes('incident')).length
  const consultationLogs = records.filter((r) => r.incidentType.toLowerCase().includes('consultation')).length
  const recentLogs = records.length

  const statCards: StatCard[] = [
    {
      id: 'total_records',
      label: 'For the Record Logs',
      value: totalLogs,
      hint: 'Total blotter entries logged for record',
      icon: BookOpen,
      tone: 'emerald',
    },
    {
      id: 'incident_logs',
      label: 'Incident Records',
      value: incidentLogs > 0 ? incidentLogs : totalLogs,
      hint: 'Reported incidents without filing a case',
      icon: ScrollText,
      tone: 'sky',
    },
    {
      id: 'consultation_logs',
      label: 'Consultation & Legal',
      value: consultationLogs,
      hint: 'Legal advice & agreement entries',
      icon: HelpCircle,
      tone: 'violet',
    },
    {
      id: 'recent_logs',
      label: 'Recent Entries',
      value: recentLogs,
      hint: 'Logged in recent timeline',
      icon: Calendar,
      tone: 'cyan',
    },
  ]

  const handleArchive = (row: ForTheRecordRecord) => {
    confirm({
      title: 'Archive Entry?',
      message: `Are you sure you want to archive Log #${row.caseNo}?`,
      confirmLabel: 'Archive Log',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await blotterService.delete(row.id)
          setRecords((prev) => prev.filter((r) => r.id !== row.id))
          showFeedback({
            title: 'Entry Archived',
            message: `Log #${row.caseNo} has been safely archived.`,
            variant: 'success',
          })
          fetchBackendRecords()
        } catch {
          showFeedback({
            title: 'Archive Failed',
            message: 'Failed to archive entry. Please check server connection.',
            variant: 'error',
          })
        }
      },
    })
  }

  const handleView = (row: ForTheRecordRecord) => {
    const targetId = row.latestActiveCaseId || row.id
    setSelectedRecord({ ...row, id: String(targetId) })
    setViewMode('DETAILS')
  }

  const filteredRecords = records.filter((r) => {
    const search = (filterValues.search ?? '').trim().toLowerCase()
    const selectedStatus = (filterValues.status ?? 'all').toLowerCase()
    const selectedNature = (filterValues.nature ?? 'all').toLowerCase()
    const selectedDocket = (filterValues.docketType ?? 'all').toLowerCase()

    const matchesSearch =
      search === '' ||
      r.caseNo.toLowerCase().includes(search) ||
      r.complainant.toLowerCase().includes(search) ||
      r.respondent.toLowerCase().includes(search)

    const matchesStatus =
      selectedStatus === 'all' ||
      r.rawStatus.toLowerCase() === selectedStatus ||
      r.status.toLowerCase() === selectedStatus

    return matchesSearch && matchesStatus
  })

  const columns: Column<ForTheRecordRecord>[] = [
    {
      key: 'caseNo',
      header: 'RECORD / DOCKET NO.',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.caseNo}</span>
          <span className="block text-[10px] font-medium text-emerald-600">
            {r.filingTypeLabel}
          </span>
        </div>
      ),
    },
    {
      key: 'complainant',
      header: 'REPORTING PERSON',
    },
    {
      key: 'respondent',
      header: 'PERSON INVOLVED',
      render: (r: DocketRecord) => {
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
      key: 'cycle',
      header: 'CASE CYCLE',
      render: () => 'For the Record',
    },
    {
      key: 'status',
      header: 'LOG STATUS',
      render: () => <Badge tone="slate">RECORDED</Badge>,
    },
    {
      key: 'dateReported',
      header: 'DATE FILED',
    },
  ]

  const actions: RowAction<ForTheRecordRecord>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: handleView,
    },
    {
      id: 'archive',
      label: 'Archive Record',
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
          onBack={() => {
            setSelectedRecord(null)
            setViewMode('LIST')
            fetchBackendRecords()
          }}
        />
      ) : (
        <>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ScrollText className="h-7 w-7 text-slate-800 shrink-0" />
                For the Record Logs
              </h1>
              <p className="text-sm text-slate-500">
                Log, track, and manage informational incident reports and legal consultation inquiries.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => navigate('/blotter/entry?mode=record')}
                className="flex items-center gap-2 font-bold text-xs shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Log For the Record
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
            emptyTitle={isLoading ? 'Loading records...' : 'No record logs found'}
            emptyDescription={
              isLoading
                ? 'Fetching real blotter data from backend...'
                : 'There are no record logs matching your search criteria or filters.'
            }
            header={
              <TableFilters
                filters={filterConfigs}
                values={filterValues}
                onApply={(applied) => setFilterValues(applied)}
                onClear={() => setFilterValues({ search: '', status: 'all', nature: 'all', docketType: 'all' })}
              />
            }
          />

          <ConfirmationDialog {...confirmDialogProps} />
          <FeedbackDialog {...feedbackDialogProps} />
        </>
      )}
    </div>
  )
}
