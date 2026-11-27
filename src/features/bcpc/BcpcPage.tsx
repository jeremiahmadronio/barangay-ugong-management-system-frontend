import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  FileText,
  Eye,
  Archive,
  Trash2,
} from 'lucide-react'
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
import { useDialogs } from '@/hooks/useDialogs'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import { PermissionDeniedPage } from '@/components/ui/PermissionDeniedPage'
import type { BadgeTone } from '@/components/ui/table/Badge'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
import {
  bcpcApi,
  type BcpcBackendStats,
  type BcpcTableRowResponse,
} from '@/config/api/modules/bcpc.api'
import { formatDate, maskConfidentialName } from '@/utils/formatters'
import { BcpcCaseDetailsView } from './components/BcpcCaseDetailsView'

/**
 * Formats case nature:
 * - Strips leading "CAR:" or "CICL:" prefix
 * - Replaces underscores with spaces
 * - Converts ALL CAPS to Title Case (Capital first letter of each word)
 */
function formatCaseNature(val?: string | null): string {
  if (!val || val === '—' || val === 'N/A') return '—'
  const clean = val.replace(/^(?:CAR|CICL)\s*:\s*/i, '').replace(/_/g, ' ').trim()
  if (!clean) return '—'
  return clean
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Truncates text with ellipsis if it exceeds maxLength to prevent overflow
 */
function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

const filterConfigs: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    placeholder: 'Search by Case No., Child Name, or Incident Nature...',
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'Ongoing', value: 'ONGOING' },
      { label: 'Settled', value: 'SETTLED' },
      { label: 'Dismissed', value: 'DISMISSED' },
      { label: 'Withdrawn', value: 'WITHDRAWN' },
      { label: 'Expired / Un-actioned', value: 'EXPIRED_UNACTIONED' },
    ],
  },
  {
    key: 'category',
    label: 'Classification',
    options: [
      { label: 'All Classifications', value: 'all' },
      { label: 'CAR (Child at Risk)', value: 'CAR' },
      { label: 'CICL (Child in Conflict with the Law)', value: 'CICL' },
    ],
  },
]

export const BcpcPage = () => {
  const navigate = useNavigate()
  const { id: paramId } = useParams<{ id?: string }>()
  const { hasPermission } = useUserPermissions()

  const isCaseId = (val?: string): boolean => {
    if (!val) return false
    const trimmed = val.trim().toLowerCase()
    if (
      trimmed === 'cases' ||
      trimmed === 'dashboard' ||
      trimmed === 'reports' ||
      trimmed === 'archive' ||
      trimmed === 'entry' ||
      trimmed === 'new' ||
      trimmed === 'create' ||
      trimmed === 'file-complaint'
    ) {
      return false
    }
    return true
  }

  const [selectedCaseId, setSelectedCaseId] = useState<string | number | null>(
    isCaseId(paramId) ? (paramId as string) : null
  )
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  useEffect(() => {
    setSelectedCaseId(isCaseId(paramId) ? (paramId as string) : null)
  }, [paramId])

  // KPI Stats State
  const [statsData, setStatsData] = useState<BcpcBackendStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true)

  // Records Table State (5 items per page)
  const [records, setRecords] = useState<BcpcTableRowResponse[]>([])
  const [isTableLoading, setIsTableLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const pageSize = 5

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    category: 'all',
  })

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      setIsStatsLoading(true)
      const data = await bcpcApi.getStats()
      setStatsData(data)
    } catch (err) {
      console.error('Failed to load BCPC stats:', err)
    } finally {
      setIsStatsLoading(false)
    }
  }

  // Fetch Table Data (Pagination & Filters)
  const fetchTableData = useCallback(
    async (targetPage: number, currentFilters: FilterValues) => {
      try {
        setIsTableLoading(true)
        const response = await bcpcApi.getTable({
          page: targetPage - 1, // 0-indexed on backend
          size: pageSize,
          search: currentFilters.search?.trim() || undefined,
          status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
          category: currentFilters.category !== 'all' ? currentFilters.category : undefined,
        })

        if (response && response.content) {
          setRecords(response.content)
          setTotalElements(response.totalElements ?? response.content.length)
          setTotalPages(
            Math.max(
              1,
              response.totalPages ??
                Math.ceil((response.totalElements ?? response.content.length) / pageSize)
            )
          )
        } else {
          setRecords([])
          setTotalElements(0)
          setTotalPages(1)
        }
      } catch (err) {
        console.error('Failed to fetch BCPC case records:', err)
        setRecords([])
      } finally {
        setIsTableLoading(false)
      }
    },
    [pageSize]
  )

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchTableData(page, filterValues)
  }, [page, filterValues, fetchTableData])

  // Map Status to Badge Tone
  const getStatusTone = (status?: string): BadgeTone => {
    const st = (status || 'PENDING').toUpperCase()
    if (st === 'SETTLED' || st === 'RESOLVED') return 'emerald'
    if (st === 'WITHDRAWN' || st === 'DISMISSED' || st === 'CLOSED') return 'rose'
    if (st === 'ONGOING' || st === 'ACTIVE' || st.includes('REFERRAL') || st.includes('REFERRED') || st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY') return 'sky'
    if (st === 'PENDING') return 'amber'
    return 'slate'
  }

  // Format Status to Human-Readable Label
  const getStatusLabel = (status?: string): string => {
    const st = (status || 'PENDING').toUpperCase()
    if (st === 'ONGOING' || st === 'ACTIVE' || st === 'UNDER_CUSTODY' || st === 'UNDER CUSTODY' || st.includes('REFERRAL') || st.includes('REFERRED')) return 'Ongoing'
    if (st === 'PENDING') return 'Pending'
    if (st === 'SETTLED' || st === 'RESOLVED') return 'Settled'
    if (st === 'DISMISSED') return 'Dismissed'
    if (st === 'WITHDRAWN') return 'Withdrawn'
    if (st === 'CLOSED') return 'Closed'
    return st.replace(/_/g, ' ')
  }

  // 4 Top Stats Cards
  const statCards: StatCard[] = [
    {
      id: 'total_cases',
      label: 'Total Cases',
      value: statsData?.totalCases ?? 0,
      hint: statsData?.totalCasesTrend || '0.0% vs last month',
      icon: FileText,
      tone: 'sky',
    },
    {
      id: 'active_cases',
      label: 'On Going Cases',
      value: statsData?.totalActiveCases ?? statsData?.totalOngoing ?? 0,
      hint: 'Under intervention or diversion',
      icon: Clock,
      tone: 'amber',
    },
    {
      id: 'referred_cases',
      label: 'Referred Cases',
      value: statsData?.totalReferredCases ?? 0,
      hint: 'Cases referred to outside agency',
      icon: ExternalLink,
      tone: 'violet',
    },
    {
      id: 'settled_cases',
      label: 'Settled Cases',
      value: statsData?.totalSettledCases ?? 0,
      hint: 'Successfully resolved',
      icon: CheckCircle2,
      tone: 'emerald',
    },
  ]

  // Table Columns Definition matching Blotter style
  const columns: Column<BcpcTableRowResponse>[] = [
    {
      key: 'caseNumber',
      header: 'CASE / BCPC NO.',
      render: (r) => (
        <span className="font-bold text-slate-900">{r.caseNumber}</span>
      ),
    },
    {
      key: 'childName',
      header: 'CHILD',
      render: (r) => (
        <span className="font-semibold text-slate-800">
          {maskConfidentialName(r.childName)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'CLASSIFICATION',
      render: (r) => {
        const cat = (r.category || 'CAR').toUpperCase()
        return (
          <span className="text-slate-700 font-medium">
            {cat === 'CICL' ? 'CICL' : 'CAR'}
          </span>
        )
      },
    },
    {
      key: 'caseNature',
      header: 'CASE NATURE',
      render: (r) => {
        const formatted = formatCaseNature(r.caseNature)
        const truncated = truncateText(formatted, 32)
        return (
          <span className="text-slate-600 font-medium" title={formatted}>
            {truncated}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const st = r.status || 'PENDING'
        return (
          <Badge tone={getStatusTone(st)} className="font-medium">
            {getStatusLabel(st)}
          </Badge>
        )
      },
    },
    {
      key: 'dateFiled',
      header: 'DATE FILED',
      render: (r) => (
        <span className="text-slate-600">
          {formatDate(r.dateFiled || r.createdAt)}
        </span>
      ),
    },
  ]

  // Table Actions — 3 dots dropdown menu guarded by permissions
  const actions = useMemo<RowAction<BcpcTableRowResponse>[]>(() => {
    const list: RowAction<BcpcTableRowResponse>[] = []

    if (hasPermission('View Cases')) {
      list.push({
        id: 'view',
        label: 'View Details',
        icon: Eye,
        tone: 'primary',
        onClick: (row) => {
          setSelectedCaseId(row.id)
          navigate(`/bcpc/${row.id}`)
        },
      })
    }

    if (hasPermission('Archive Case')) {
      list.push({
        id: 'archive',
        label: 'Archive Case',
        icon: Archive,
        tone: 'emerald',
        onClick: (row) => {
          const rawStatus = (row.status || '').toUpperCase().replace(/[\s-]+/g, '_')
          const isArchivable = ['SETTLED', 'DISMISSED', 'WITHDRAWN', 'RESOLVED', 'CLOSED'].includes(rawStatus)
          if (!isArchivable) {
            showFeedback({
              variant: 'error',
              title: 'Cannot Archive Active Case',
              description: `Case #${row.caseNumber} is currently ${getStatusLabel(row.status)}. Only cases that are already Settled, Dismissed, Withdrawn, or Closed can be moved to the archive.`,
            })
            return
          }

          confirm({
            title: `Archive Case – #${row.caseNumber}?`,
            description: `Are you sure you want to archive Case #${row.caseNumber}? This will move the case to the Archive vault.`,
            confirmLabel: 'Archive Case',
            tone: 'emerald',
            onConfirm: async () => {
              try {
                await bcpcApi.archiveCase(row.id)
                showFeedback({
                  variant: 'success',
                  title: 'Case Archived',
                  description: `Case #${row.caseNumber} has been moved to the Archive Vault successfully.`,
                })
                fetchTableData(page, filterValues)
                fetchStats()
              } catch (err: any) {
                console.error('Failed to archive BCPC case:', err)
                showFeedback({
                  variant: 'error',
                  title: 'Unable to Archive Case',
                  description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to move this case to the archive. Please try again.',
                })
              }
            },
          })
        },
      })
    }

    if (hasPermission('Delete Case')) {
      list.push({
        id: 'delete',
        label: 'Delete Case',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => {
          const rawStatus = (row.status || '').toUpperCase().replace(/[\s-]+/g, '_')
          const isArchivable = ['SETTLED', 'DISMISSED', 'WITHDRAWN', 'RESOLVED', 'CLOSED'].includes(rawStatus)
          if (!isArchivable) {
            showFeedback({
              variant: 'error',
              title: 'Cannot Delete Active Case',
              description: `Case #${row.caseNumber} is currently ${getStatusLabel(row.status)}. You can only move cases to the Recycle Bin once they have been Settled, Dismissed, Withdrawn, or Closed.`,
            })
            return
          }

          confirm({
            title: `Move Case #${row.caseNumber} to Trash?`,
            description: `Are you sure you want to move Case #${row.caseNumber} to the Recycle Bin? You can restore it at any time from the Archive & Trash Vault.`,
            confirmLabel: 'Move to Trash',
            tone: 'danger',
            onConfirm: async () => {
              try {
                await bcpcApi.softDeleteCase(row.id)
                showFeedback({
                  variant: 'success',
                  title: 'Case Moved to Trash',
                  description: `Case #${row.caseNumber} has been moved to the Recycle Bin.`,
                })
                fetchTableData(page, filterValues)
                fetchStats()
              } catch (err: any) {
                console.error('Failed to move BCPC case to trash:', err)
                showFeedback({
                  variant: 'error',
                  title: 'Unable to Delete Case',
                  description: err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to move this case to the recycle bin. Please try again.',
                })
              }
            },
          })
        },
      })
    }

    return list
  }, [hasPermission, navigate, confirm, showFeedback, fetchTableData, fetchStats, page, filterValues])

  if (selectedCaseId) {
    if (!hasPermission('View Cases')) {
      return (
        <div className="py-12 flex justify-center">
          <PermissionDeniedPage
            title="Access Denied"
            message="The owner of the workspace has not given you permission to view BCPC cases. Please contact the administrator."
            onBack={() => {
              setSelectedCaseId(null)
              navigate('/bcpc/cases')
            }}
          />
        </div>
      )
    }

    return (
      <BcpcCaseDetailsView
        caseId={selectedCaseId}
        onBack={() => {
          setSelectedCaseId(null)
          navigate('/bcpc/cases')
          fetchTableData(page, filterValues)
        }}
        onEdit={() => {
          console.log('Edit BCPC case:', selectedCaseId)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Unified System PageHeader without Icon or Action Button */}
      <PageHeader
        title="BCPC Case Files"
        description="Record, track, and manage Child at Risk (CAR) and Child in Conflict with the Law (CICL) cases."
      />

      {/* Reusable BCPC KPI Stats Cards */}
      <StatsCards cards={statCards} loading={isStatsLoading} />

      {/* BCPC Case Records DataTable with 3-Dots Action Menu */}
      <DataTable
        data={records}
        columns={columns}
        rowKey={(r) => r.id}
        actions={actions.length > 0 ? actions : undefined}
        pageSize={pageSize}
        serverPagination={{
          page,
          pageCount: totalPages,
          totalItems: totalElements,
          pageSize,
          onPageChange: (newPage) => {
            setPage(newPage)
          },
        }}
        emptyTitle={
          isTableLoading ? 'Loading BCPC records...' : 'No BCPC case records found'
        }
        emptyDescription={
          isTableLoading
            ? 'Fetching BCPC case records from backend...'
            : 'There are no BCPC cases matching your search criteria or filters.'
        }
        header={
          <TableFilters
            filters={filterConfigs}
            values={filterValues}
            onApply={(applied) => {
              setFilterValues(applied)
              setPage(1)
            }}
            onClear={() => {
              setFilterValues({ search: '', status: 'all', category: 'all' })
              setPage(1)
            }}
          />
        }
      />

      {/* Reusable Confirmation and Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
