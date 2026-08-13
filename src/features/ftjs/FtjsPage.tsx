import { useState, useEffect, useCallback } from 'react'
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
import { IssuanceForm } from './IssuanceForm'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import { TableFilters } from '@/components/ui/table/TableFilters'
import { DataTable } from '@/components/ui/table/DataTable'
import { Badge } from '@/components/ui/table/Badge'
import { DetailsModal } from '@/components/ui/DetailsModal'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import type { Column, RowAction, FilterConfig, FilterValues } from '@/components/ui/table/types'
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

  // State for stats
  const [stats, setStats] = useState<FtjsStatsResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // State for paginated table
  const [tableData, setTableData] = useState<SpringPageResponse<FtjsTableDTO> | null>(null)
  const [loadingTable, setLoadingTable] = useState(false)

  // Filter & Pagination state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: 'all',
    purpose: 'all',
    issuanceCount: 'all',
  })
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<FtjsTableDTO | null>(null)
  const [fullDetails, setFullDetails] = useState<Record<string, unknown> | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  // Re-issuance Modal state
  const [reissueModalOpen, setReissueModalOpen] = useState(false)
  const [reissueForm, setReissueForm] = useState({
    reason: '',
    dateOfLoss: '',
    orNumber: '',
    amountPaid: 0,
  })
  const [submittingReissue, setSubmittingReissue] = useState(false)

  // Archive state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveRemarks, setArchiveRemarks] = useState('')
  const [submittingArchive, setSubmittingArchive] = useState(false)

  // Render standalone IssuanceForm for /ftjs/issuance or /ftjs/entry
  if (
    location.pathname.includes('/issuance') ||
    location.pathname.includes('/entry') ||
    location.pathname.includes('/new')
  ) {
    return <IssuanceForm />
  }

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

  // Fetch summary table (server pagination & filtering)
  const fetchSummaryTable = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params: FtjsTableQueryParams = {
        page: page - 1, // Spring backend is 0-indexed
        size: pageSize,
        search: filterValues.search || undefined,
        status: filterValues.status || undefined,
        purpose: filterValues.purpose || undefined,
        issuanceCount: filterValues.issuanceCount || undefined,
      }
      const data = await ftjsService.getSummaryTable(params)
      setTableData(data)
    } catch (err) {
      console.error('Failed to fetch FTJS summary table:', err)
    } finally {
      setLoadingTable(false)
    }
  }, [page, filterValues])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchSummaryTable()
  }, [fetchSummaryTable])

  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied)
    setPage(1) // Reset to page 1 on filter change
  }

  const handleClearFilter = () => {
    const cleared: FilterValues = {
      search: '',
      status: 'all',
      purpose: 'all',
      issuanceCount: 'all',
    }
    setFilterValues(cleared)
    setPage(1)
  }

  // Actions
  const handleView = async (row: FtjsTableDTO) => {
    setSelectedRecord(row)
    setViewModalOpen(true)
    try {
      const details = await ftjsService.getFullDetails(row.id)
      setFullDetails(details)
    } catch (err) {
      console.error('Failed to fetch FTJS details:', err)
    }
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

  const handleSubmitReissue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return
    setSubmittingReissue(true)
    try {
      await ftjsService.requestNewFtjs({
        ftjsId: selectedRecord.id,
        reason: reissueForm.reason,
        dateOfLoss: reissueForm.dateOfLoss,
        orNumber: reissueForm.orNumber,
        amountPaid: Number(reissueForm.amountPaid),
      })
      setReissueModalOpen(false)
      fetchSummaryTable()
      fetchStats()
    } catch (err) {
      console.error('Failed to submit re-issuance:', err)
    } finally {
      setSubmittingReissue(false)
    }
  }

  const handleOpenArchive = (row: FtjsTableDTO) => {
    setSelectedRecord(row)
    setArchiveRemarks('')
    setArchiveModalOpen(true)
  }

  const handleConfirmArchive = async () => {
    if (!selectedRecord) return
    setSubmittingArchive(true)
    try {
      await ftjsService.toggleArchive(selectedRecord.id, true, archiveRemarks)
      setArchiveModalOpen(false)
      fetchSummaryTable()
      fetchStats()
    } catch (err) {
      console.error('Failed to archive FTJS record:', err)
    } finally {
      setSubmittingArchive(false)
    }
  }

  // Cards preparation
  const cards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Certificates Issued',
      value: stats?.totalCertificatesIssued ?? 0,
      hint: 'All certificate releases recorded',
      icon: FileCheck,
      tone: 'indigo',
    },
    {
      id: 'month',
      label: 'Issued This Month',
      value: stats?.totalCertificatedThisMonth ?? 0,
      hint: stats?.issuedThisMonthTrendHint || 'Current month certificate output',
      showTrend: true,
      trend: (stats?.issuedThisMonthTrendPercentage ?? 0) < 0 ? 'down' : 'up',
      icon: Calendar,
      tone: 'emerald',
    },
    {
      id: 'original',
      label: 'Original Issuances',
      value: stats?.originalIssuances ?? 0,
      hint: 'First release requests',
      icon: FileText,
      tone: 'amber',
    },
    {
      id: 'reissuance',
      label: 'Re-issuances',
      value: stats?.reIssuances ?? 0,
      hint: 'Replacement certificates processed',
      icon: Award,
      tone: 'sky',
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
        <span className="text-sm font-normal text-slate-600 max-w-[200px] truncate inline-block whitespace-nowrap" title={row.purpose}>
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
  const actions: RowAction<FtjsTableDTO>[] = [
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
      tone: 'warning',
      onClick: handleOpenArchive,
    },
    {
      id: 'delete',
      label: 'Delete Record',
      icon: Trash2,
      tone: 'danger',
      onClick: (_row) => {},
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            First-Time Job Seeker (FTJS) Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage job seeker assistance requests under Republic Act 11261.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ftjs/issuance')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus size={18} />
          Issue FTJS Certificate
        </button>
      </div>

      {/* Summary Cards */}
      <StatsCards cards={cards} />

      {/* Filters Bar */}
      <TableFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      {/* Paginated Data Table */}
      <DataTable
        data={tableData?.content ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        actions={actions}
        actionsVariant="menu"
        pageSize={pageSize}
        emptyTitle="No FTJS records found"
        emptyDescription="Try adjusting your filter options or submit a new FTJS certificate application."
        serverPagination={{
          page: page,
          pageCount: tableData?.totalPages ?? 1,
          totalItems: tableData?.totalElements ?? 0,
          pageSize: pageSize,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Details Modal */}
      <DetailsModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedRecord ? `FTJS Record - ${selectedRecord.trackingNumber}` : 'FTJS Record Details'}
        description="Full application details and status history."
      >
        {selectedRecord && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Applicant Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Application No.</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.trackingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Issuance Count</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.issuanceCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Purpose</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.purpose || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Date Submitted</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.dateSubmitted}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Residency</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.isResident ? 'Barangay Resident' : 'Walk-in / Non-Resident'}</p>
              </div>
            </div>

            {fullDetails && (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extended Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-400">Contact Number:</span> <span className="font-medium">{String(fullDetails.contactNumber || 'N/A')}</span></div>
                  <div><span className="text-slate-400">Email:</span> <span className="font-medium">{String(fullDetails.email || 'N/A')}</span></div>
                  <div><span className="text-slate-400">School/Institution:</span> <span className="font-medium">{String(fullDetails.schoolInstitution || 'N/A')}</span></div>
                  <div><span className="text-slate-400">Educational Attainment:</span> <span className="font-medium">{String(fullDetails.educationalAttainment || 'N/A')}</span></div>
                  <div><span className="text-slate-400">Valid ID Type:</span> <span className="font-medium">{String(fullDetails.validIdType || 'N/A')}</span></div>
                  <div><span className="text-slate-400">Verified By:</span> <span className="font-medium">{String(fullDetails.verifiedBy || 'N/A')}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailsModal>

      {/* Re-issuance Modal */}
      <DetailsModal
        open={reissueModalOpen}
        onClose={() => setReissueModalOpen(false)}
        title="Request Certificate Re-issuance"
        description={`Submit replacement request for ${selectedRecord?.fullName} (${selectedRecord?.trackingNumber})`}
      >
        <form onSubmit={handleSubmitReissue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason for Loss / Re-issuance *
            </label>
            <textarea
              required
              rows={3}
              value={reissueForm.reason}
              onChange={(e) => setReissueForm({ ...reissueForm, reason: e.target.value })}
              placeholder="Enter details explaining loss or damage of original certificate..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date of Loss</label>
              <input
                type="date"
                required
                value={reissueForm.dateOfLoss}
                onChange={(e) => setReissueForm({ ...reissueForm, dateOfLoss: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">OR Number</label>
              <input
                type="text"
                required
                placeholder="e.g. OR-99214"
                value={reissueForm.orNumber}
                onChange={(e) => setReissueForm({ ...reissueForm, orNumber: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount Paid (₱)</label>
              <input
                type="number"
                required
                min="0"
                value={reissueForm.amountPaid}
                onChange={(e) => setReissueForm({ ...reissueForm, amountPaid: Number(e.target.value) })}
                className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReissueModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReissue}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingReissue ? 'Submitting…' : 'Submit Re-issuance'}
            </button>
          </div>
        </form>
      </DetailsModal>

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveModalOpen}
        title="Archive FTJS Record"
        description={`Are you sure you want to archive the record for ${selectedRecord?.fullName}? This will move the record to the archive list.`}
        tone="danger"
        confirmLabel="Archive Record"
        isLoading={submittingArchive}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveModalOpen(false)}
      />
    </div>
  )
}

