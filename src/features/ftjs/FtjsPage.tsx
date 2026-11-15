import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Plus,
  FileCheck,
  Calendar,
  FileText,
  Award,
  Eye,
  Trash2,
  Archive,
} from 'lucide-react'
import { FtjsDashboard } from './FtjsDashboard'
import { IssuanceForm } from './IssuanceForm'
import { FtjsDetailView } from './FtjsDetailView'
import { FtjsReissuanceModal } from './FtjsReissuanceModal'
import { FtjsArchive } from './FtjsArchive'
import { FtjsReports } from './FtjsReports'
import { ChartNoAxesCombined } from 'lucide-react'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { PageHeader } from '@/components/ui/PageHeader'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { DataTable } from '@/components/ui/table/DataTable'
import { Badge } from '@/components/ui/table/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type {
  FtjsStatsResponse,
  FtjsTableDTO,
  FtjsTableQueryParams,
  SpringPageResponse,
} from '@/config/api/ftjs/ftjs.types'

const PURPOSE_OPTIONS = [
  { label: 'All Purposes', value: 'all' },
  { label: 'Local Employment Application', value: 'Local Employment Application' },
  { label: 'Overseas Employment Application (OFW)', value: 'Overseas Employment Application (OFW)' },
  { label: 'NBI Clearance Application', value: 'NBI Clearance Application' },
  { label: 'Police Clearance Application', value: 'Police Clearance Application' },
  { label: 'Other (Specify in Other Purpose Field)', value: 'Other (Specify in Other Purpose Field)' },
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Certificate Issued', value: 'ISSUED' },
  { label: 'Re-issuance Request', value: 'RE_ISSUANCE' },
]

const ISSUANCE_COUNT_OPTIONS = [
  { label: 'All Issuances', value: 'all' },
  { label: '1st Issuance (Original)', value: '1' },
  { label: '2nd Issuance (Re-issuance)', value: '2' },
  { label: '3+ Issuances', value: '3' },
]

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by App No. or Applicant Name…',
  },
  {
    key: 'status',
    label: 'Status',
    options: STATUS_OPTIONS,
  },
  {
    key: 'purpose',
    label: 'Purpose',
    options: PURPOSE_OPTIONS,
  },
  {
    key: 'issuanceCount',
    label: 'Issuance Count',
    options: ISSUANCE_COUNT_OPTIONS,
  },
]

export const FtjsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentRole } = useAuth()
  const { hasPermission, isLoading: isPermLoading } = useUserPermissions()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'

  // Reusable Dialogs
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // State for stats
  const [stats, setStats] = useState<FtjsStatsResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // State for paginated table
  const [records, setRecords] = useState<FtjsTableDTO[]>([])
  const [loadingTable, setLoadingTable] = useState(false)

  // Filter & Pagination state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    purpose: 'all',
    issuanceCount: 'all',
  })

  // View mode (LIST vs DETAILS)
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST')

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<FtjsTableDTO | null>(null)
  const [reissueModalOpen, setReissueModalOpen] = useState(false)
  const [reissueForm, setReissueForm] = useState({
    reason: '',
    dateOfLoss: '',
    orNumber: '',
    amountPaid: 0,
  })

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await ftjsService.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch FTJS stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Fetch summary table
  const fetchSummaryTable = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params: FtjsTableQueryParams = {
        page: 0,
        size: 1000,
        search: filterValues.search || undefined,
        status: filterValues.status || undefined,
        purpose: filterValues.purpose || undefined,
        issuanceCount: filterValues.issuanceCount || undefined,
        sort: 'id,desc',
      }
      const data = await ftjsService.getSummaryTable(params)
      const list = Array.isArray(data) ? data : data?.content || []
      setRecords(list)
    } catch (err) {
      console.error('Failed to fetch FTJS summary table:', err)
      setRecords([])
    } finally {
      setLoadingTable(false)
    }
  }, [filterValues])

  useEffect(() => {
    fetchStats()
  }, [fetchStats, location.pathname, location.key])

  useEffect(() => {
    fetchSummaryTable()
  }, [fetchSummaryTable, location.pathname, location.key])

  // Sub-routes checks
  if (
    location.pathname.endsWith('/dashboard') ||
    location.pathname.includes('/dashboard')
  ) {
    return <FtjsDashboard />
  }

  if (location.pathname.includes('/archive')) {
    return <FtjsArchive />
  }

  if (location.pathname.includes('/reports')) {
    return <FtjsReports />
  }

  if (
    location.pathname.includes('/issuance') ||
    location.pathname.includes('/entry') ||
    location.pathname.includes('/new')
  ) {
    if (isPermLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )
    }
    if (!hasPermission('Issue FTJS')) {
      return (
        <div className="py-12 flex justify-center">
          <PermissionDeniedPage
            title="You don't have permission to issue FTJS certificates!"
            message="The owner of the workspace has not given you permission to issue First-Time Jobseeker certificates. Please contact the administrator."
          />
        </div>
      )
    }
    return <IssuanceForm />
  }

  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
  }

  const handleClearFilter = () => {
    const cleared: FilterValues = {
      search: '',
      status: 'all',
      purpose: 'all',
      issuanceCount: 'all',
    }
    setFilterValues(cleared)
  }

  // Actions
  const handleView = (row: FtjsTableDTO) => {
    setSelectedRecord(row)
    setViewMode('DETAILS')
  }

  const handleOpenReissue = (row: FtjsTableDTO) => {
    setSelectedRecord(row)
    setReissueForm({
      reason: '',
      dateOfLoss: new Date().toISOString().split('T')[0],
      orNumber: '',
      amountPaid: 0,
    })
    setReissueModalOpen(true)
  }

  const handleArchiveRecord = (row: FtjsTableDTO) => {
    confirm({
      title: `Archive Record – ${row.fullName}?`,
      description: `Are you sure you want to archive the record for "${row.fullName}" (${row.trackingNumber})? This will move the application to the Archive vault.`,
      confirmLabel: 'Archive Record',
      tone: 'emerald',
      onConfirm: async () => {
        await ftjsService.archiveRecord(row.id)
        showFeedback({
          variant: 'success',
          title: 'Record Archived',
          description: `The application for "${row.fullName}" was archived successfully.`,
        })
        fetchSummaryTable()
        fetchStats()
      },
    })
  }

  const handleDeleteRecord = (row: FtjsTableDTO) => {
    confirm({
      title: `Move to Recently Deleted – ${row.fullName}?`,
      description: `Are you sure you want to move the record for "${row.fullName}" (${row.trackingNumber}) to Recently Deleted?`,
      confirmLabel: 'Move to Recently Deleted',
      tone: 'danger',
      onConfirm: async () => {
        await ftjsService.softDeleteRecord(row.id)
        showFeedback({
          variant: 'success',
          title: 'Moved to Recently Deleted',
          description: `The application for "${row.fullName}" was moved to Recently Deleted.`,
        })
        fetchSummaryTable()
        fetchStats()
      },
    })
  }

  // Cards preparation
  const cards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Certificates Issued',
      value: stats?.totalCertificatesIssued ?? 0,
      hint: 'All certificate releases recorded',
      icon: FileCheck,
      tone: 'slate',
    },
    {
      id: 'month',
      label: 'Issued This Month',
      value: stats?.totalCertificatedThisMonth ?? 0,
      hint: stats?.issuedThisMonthTrendHint || 'Current month certificate output',
      showTrend: true,
      trend: (stats?.issuedThisMonthTrendPercentage ?? 0) < 0 ? 'down' : 'up',
      icon: Calendar,
      tone: 'slate',
    },
    {
      id: 'original',
      label: 'Original Issuances',
      value: stats?.originalIssuances ?? 0,
      hint: 'First release requests',
      icon: FileText,
      tone: 'slate',
    },
    {
      id: 'reissuance',
      label: 'Re-issuances',
      value: stats?.reIssuances ?? 0,
      hint: 'Replacement certificates processed',
      icon: Award,
      tone: 'slate',
    },
  ]

  // Columns preparation
  const columns: Column<FtjsTableDTO>[] = [
    {
      key: 'trackingNumber',
      header: 'APPLICATION NO.',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {row.trackingNumber || '—'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'APPLICANT',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 leading-tight">{row.fullName}</p>
          {row.isResident && (
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">Barangay Resident</p>
          )}
        </div>
      ),
    },
    {
      key: 'issuanceCount',
      header: 'ISSUANCE COUNT',
      align: 'center',
      render: (row) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          {row.issuanceCount ?? 1}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'PURPOSE',
      render: (row) => (
        <span
          className="text-sm font-normal text-slate-600 max-w-[200px] truncate inline-block whitespace-nowrap"
          title={row.purpose}
        >
          {row.purpose || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (row) => {
        const isReissuance = row.status === 'RE_ISSUANCE' || row.issuanceCount > 1
        return isReissuance ? (
          <Badge tone="sky">Re-issuance</Badge>
        ) : (
          <Badge tone="emerald">Issued</Badge>
        )
      },
    },
    {
      key: 'dateSubmitted',
      header: 'DATE SUBMITTED',
      render: (row) => (
        <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
          {row.dateSubmitted
            ? new Date(row.dateSubmitted).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
  ]

  // Row Actions
  const actions: RowAction<FtjsTableDTO>[] = useMemo(() => {
    const list: RowAction<FtjsTableDTO>[] = []

    if (hasPermission('View FTJS')) {
      list.push({
        id: 'view',
        label: 'View Details',
        icon: Eye,
        onClick: handleView,
      })
    }

    if (!isSystemAdmin && hasPermission('Archive FTJS')) {
      list.push({
        id: 'archive',
        label: 'Archive Record',
        icon: Archive,
        tone: 'emerald',
        onClick: handleArchiveRecord,
      })
    }

    if (!isSystemAdmin && hasPermission('Delete FTJS')) {
      list.push({
        id: 'delete',
        label: 'Delete Record',
        icon: Trash2,
        tone: 'danger',
        onClick: handleDeleteRecord,
      })
    }

    return list
  }, [hasPermission, isSystemAdmin, handleView, handleArchiveRecord, handleDeleteRecord])

  return (
    <div className="space-y-6">
      {viewMode === 'DETAILS' && selectedRecord ? (
        !hasPermission('View FTJS') ? (
          <div className="py-12 flex justify-center">
            <PermissionDeniedPage
              title="You don't have permission to view FTJS records!"
              message="The owner of the workspace has not given you permission to view First-Time Jobseeker details. Please contact the administrator."
              onBack={() => {
                setSelectedRecord(null)
                setViewMode('LIST')
              }}
            />
          </div>
        ) : (
          <FtjsDetailView
            ftjsId={selectedRecord.id ?? selectedRecord.ftjsId ?? 0}
            onBack={() => {
              setSelectedRecord(null)
              setViewMode('LIST')
            }}
            onReIssue={
              isSystemAdmin || !hasPermission('Re-issue FTJS')
                ? undefined
                : () => handleOpenReissue(selectedRecord)
            }
            readOnly={isSystemAdmin || !hasPermission('Re-issue FTJS')}
          />
        )
      ) : (
        <>
          <PageHeader
            title="Jobseeker Records"
            description="View, monitor, and manage job seeker assistance records under Republic Act 11261."
            actions={
              isSystemAdmin || !hasPermission('Issue FTJS')
                ? []
                : [
                    {
                      label: 'Issue FTJS Certificate',
                      icon: Plus,
                      onClick: () => navigate('/ftjs/issuance'),
                    },
                  ]
            }
          />

          {/* Summary Cards */}
          <StatsCards cards={cards} />

          {/* Paginated Data Table with Integrated Filter Header */}
          <DataTable
            data={records}
            columns={columns}
            rowKey={(row) => row.id ?? row.ftjsId ?? Math.random()}
            actions={actions.length > 0 ? actions : undefined}
            actionsVariant="menu"
            pageSize={5}
            emptyTitle={loadingTable ? 'Loading records...' : 'No jobseeker records found'}
            emptyDescription="Try adjusting your filter options or submit a new FTJS certificate application."
            header={
              <TableFilters
                filters={FILTER_CONFIGS}
                values={filterValues}
                onApply={handleApplyFilter}
                onClear={handleClearFilter}
              />
            }
          />
        </>
      )}

      {/* Re-issuance Modal */}
      {selectedRecord && (
        <FtjsReissuanceModal
          open={reissueModalOpen}
          onClose={() => setReissueModalOpen(false)}
          ftjsId={selectedRecord.id ?? selectedRecord.ftjsId ?? 0}
          applicantName={selectedRecord.fullName}
          trackingNumber={selectedRecord.trackingNumber}
          onSuccess={() => {
            fetchSummaryTable()
            fetchStats()
          }}
        />
      )}

      {/* Reusable Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}


