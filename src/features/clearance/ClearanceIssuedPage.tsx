import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsCards, type StatCard } from '@/components/ui/StatsCards'
import {
  DataTable,
  TableFilters,
  Badge,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import {
  clearanceApi,
  type ClearanceStatsResponse,
  type IssuedCertificateTableResponse,
  type TemplateOptionResponse,
} from '@/api/modules/clearance.api'
import {
  FileCheck2,
  CalendarCheck,
  Award,
  Briefcase,
  FilePlus2,
  Eye,
  Archive,
  Trash2,
  Calendar,
  FileText,
  User,
  X,
  History,
} from 'lucide-react'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { useDialogs } from '@/hooks/useDialogs'

export const ClearanceIssuedPage = () => {
  const navigate = useNavigate()
  const {
    confirmDialogProps,
    feedbackDialogProps,
    showFeedback,
    confirmAction,
  } = useDialogs()

  // 1. Stats State
  const [stats, setStats] = useState<ClearanceStatsResponse>({
    totalIssued: 0,
    issuedThisMonth: 0,
    mostIssuedCert: 'Barangay Clearance',
    mostCommonPurpose: 'Local Employment',
  })

  // 2. Table & Filter State
  const [records, setRecords] = useState<IssuedCertificateTableResponse[]>([])
  const [templates, setTemplates] = useState<TemplateOptionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    typeOfCert: 'all',
    purpose: 'all',
  })

  // 3. View Full Info Modal State
  const [selectedRecord, setSelectedRecord] = useState<IssuedCertificateTableResponse | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // 4. Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await clearanceApi.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load clearance stats', err)
    }
  }, [])

  // 5. Fetch Templates for Filter Dropdown
  const fetchTemplates = useCallback(async () => {
    try {
      const list = await clearanceApi.getTemplateOptions()
      setTemplates(list)
    } catch (err) {
      console.error('Failed to load templates', err)
    }
  }, [])

  // 6. Fetch Issued Certificates List from Backend with Prefix Search and Filter
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const data = await clearanceApi.getIssuedCertificates({
        search: filterValues.search?.trim(),
        typeOfCert: filterValues.typeOfCert === 'all' ? undefined : filterValues.typeOfCert,
        purpose: filterValues.purpose === 'all' ? undefined : filterValues.purpose,
      })
      setRecords(data)
    } catch (err) {
      console.error('Failed to load issued certificates', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [filterValues])

  useEffect(() => {
    fetchStats()
    fetchTemplates()
  }, [fetchStats, fetchTemplates])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Extract unique purposes for filter dropdown
  const uniquePurposes = useMemo(() => {
    const defaultPurposes = [
      'Local Employment',
      'Overseas Employment (OFW)',
      'Postal ID / Government ID Application',
      'School Requirement / Scholarship',
      'Bank Account Opening / Loan Application',
      'Police / NBI Clearance Application',
      'Business Permit / Franchise Application',
      'Medical / Financial Assistance',
      'Local ID Applications',
    ]
    const list = new Set(defaultPurposes)
    records.forEach((r) => {
      if (r.purpose && r.purpose.trim()) {
        list.add(r.purpose.trim())
      }
    })
    return Array.from(list)
  }, [records])

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Format name helper (e.g. "Madronio, Jeremiah D.")
  const formatRequestorName = (rawName?: string) => {
    if (!rawName || !rawName.trim()) return 'Unknown Requestor'
    const name = rawName.trim()
    if (name.includes(',')) return name
    const parts = name.split(/\s+/)
    if (parts.length === 1) return parts[0]
    if (parts.length === 2) return `${parts[1]}, ${parts[0]}`
    if (parts.length >= 3) {
      const last = parts[parts.length - 1]
      const first = parts[0]
      const middle = parts[1]
      return `${last}, ${first} ${middle.charAt(0).toUpperCase()}.`
    }
    return name
  }

  // Handle Action: View Full Info
  const handleViewDetails = (record: IssuedCertificateTableResponse) => {
    setSelectedRecord(record)
    setIsDetailsOpen(true)
  }

  // Handle Action: Archive
  const handleArchive = (record: IssuedCertificateTableResponse) => {
    confirmAction({
      title: 'Archive Clearance Record?',
      message: `Are you sure you want to archive certificate "${record.certNumber}" for ${record.requestorName}? This will move the record to Archived Records.`,
      confirmLabel: 'Yes, Archive',
      tone: 'warning',
      onConfirm: async () => {
        try {
          showFeedback({
            title: 'Record Archived',
            message: `Certificate ${record.certNumber} has been successfully archived.`,
            tone: 'success',
          })
          fetchRecords()
          fetchStats()
        } catch {
          showFeedback({
            title: 'Error',
            message: 'Failed to archive certificate record.',
            tone: 'danger',
          })
        }
      },
    })
  }

  // Handle Action: Delete
  const handleDelete = (record: IssuedCertificateTableResponse) => {
    confirmAction({
      title: 'Delete Clearance Record?',
      message: `Are you sure you want to delete certificate "${record.certNumber}"? This action cannot be undone.`,
      confirmLabel: 'Yes, Delete',
      tone: 'danger',
      onConfirm: async () => {
        try {
          showFeedback({
            title: 'Record Deleted',
            message: `Certificate ${record.certNumber} has been deleted.`,
            tone: 'success',
          })
          fetchRecords()
          fetchStats()
        } catch {
          showFeedback({
            title: 'Error',
            message: 'Failed to delete certificate record.',
            tone: 'danger',
          })
        }
      },
    })
  }

  // 4 KPI Stats Cards
  const statCards: StatCard[] = [
    {
      id: 'total-issued',
      label: 'Total Issued',
      value: stats.totalIssued,
      hint: 'Total certificates released',
      icon: FileCheck2,
      tone: 'sky',
    },
    {
      id: 'issued-this-month',
      label: 'Issued This Month',
      value: stats.issuedThisMonth,
      hint: 'Released this month',
      icon: CalendarCheck,
      tone: 'emerald',
    },
    {
      id: 'most-issued-cert',
      label: 'Most Requested Document',
      value: stats.mostIssuedCert || 'Barangay Clearance',
      hint: 'Top requested certificate',
      icon: Award,
      tone: 'violet',
    },
    {
      id: 'most-common-purpose',
      label: 'Top Request Purpose',
      value: stats.mostCommonPurpose || 'Local Employment',
      hint: 'Most frequent reason',
      icon: Briefcase,
      tone: 'amber',
    },
  ]

  // Reusable Table Filters Config
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search Clearance',
      placeholder: 'Search by clearance no., first name (e.g. je), or last name...',
    },
    {
      key: 'typeOfCert',
      label: 'Type of Certificate',
      options: [
        { label: 'All Document Types', value: 'all' },
        ...templates.map((t) => ({ label: t.certTitle, value: t.certTitle })),
      ],
    },
    {
      key: 'purpose',
      label: 'Request Purpose',
      options: [
        { label: 'All Request Purposes', value: 'all' },
        ...uniquePurposes.map((p) => ({ label: p, value: p })),
      ],
    },
  ]

  // Reusable DataTable Columns matching Resident Management table style
  const columns: Column<IssuedCertificateTableResponse>[] = [
    {
      key: 'certNumber',
      header: 'APPLICATION NO.',
      render: (r) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {r.certNumber}
        </span>
      ),
    },
    {
      key: 'requestorName',
      header: 'NAME',
      render: (r) => (
        <div>
          <span className="text-sm font-semibold text-slate-800 block whitespace-nowrap">
            {formatRequestorName(r.requestorName)}
          </span>
          {r.totalIssuances && r.totalIssuances > 1 ? (
            <span className="block text-[10px] text-blue-600 font-medium">
              {r.totalIssuances}x Issued (Latest)
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'certTitle',
      header: 'TYPE OF CERTIFICATE',
      render: (r) => (
        <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
          {r.certTitle}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'PURPOSE',
      render: (r) => {
        const text = r.purpose || 'General Purpose'
        return (
          <span
            title={text}
            className="text-sm font-normal text-slate-600 block max-w-[180px] truncate"
          >
            {text}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) => {
        const isExpired = r.status?.toUpperCase() === 'EXPIRED'
        return (
          <Badge tone={isExpired ? 'amber' : 'emerald'}>
            {r.status ? r.status.toUpperCase() : 'ACTIVE'}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'DATE SUBMITTED',
      render: (r) => (
        <span className="text-sm font-normal text-slate-600 whitespace-nowrap">
          {formatDate(r.createdAt)}
        </span>
      ),
    },
  ]

  // Reusable DataTable Inline Actions
  const actions: RowAction<IssuedCertificateTableResponse>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      tone: 'primary',
      onClick: handleViewDetails,
    },
    {
      id: 'archive',
      label: 'Archive Record',
      icon: Archive,
      tone: 'default',
      onClick: handleArchive,
    },
    {
      id: 'delete',
      label: 'Delete Record',
      icon: Trash2,
      tone: 'danger',
      onClick: handleDelete,
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header with Action button to navigate to Issue Certificate */}
      <PageHeader
        title="Issued Certificates & Clearances"
        description="View, monitor, and track all officially released barangay clearances and certifications."
        actions={[
          {
            label: 'Issue Certificate',
            icon: FilePlus2,
            onClick: () => navigate('/clearance/issue'),
          },
        ]}
      />

      {/* 2. 4 KPI Stats Cards */}
      <StatsCards cards={statCards} />

      {/* 3. Reusable DataTable with TableFilters */}
      <DataTable
        data={records}
        columns={columns}
        rowKey={(r) => r.id}
        actions={actions}
        actionsVariant="menu"
        pageSize={10}
        emptyTitle={loading ? 'Loading records...' : 'No issued certificates found'}
        emptyDescription={
          loading
            ? 'Fetching certificate data from server...'
            : 'There are no active clearance records matching your search or filter criteria.'
        }
        header={
          <TableFilters
            filters={filterConfigs}
            values={filterValues}
            onApply={(applied) => setFilterValues(applied)}
            onClear={() => setFilterValues({ search: '', typeOfCert: 'all', purpose: 'all' })}
          />
        }
      />

      {/* 4. View Full Info Details Modal */}
      {isDetailsOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {selectedRecord.certNumber}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedRecord.status || 'Released'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedRecord.certTitle}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Requestor Info Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Requestor & Application Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Requestor Name</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRecord.requestorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Purpose</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.purpose}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Receipt (OR) No.</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.orNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cedula (CTN) No.</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.ctnNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Dates and Expiration */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Issuance & Validity Timeline
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date Issued</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedRecord.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid Until / Expiry</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedRecord.expiryDate)}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Values if available */}
              {selectedRecord.fieldValues && Object.keys(selectedRecord.fieldValues).length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Recorded Form Input Values
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {Object.entries(selectedRecord.fieldValues)
                      .filter(([key, val]) => val !== null && val !== undefined && val !== '' && typeof val !== 'object')
                      .map(([key, val], idx) => (
                        <div key={idx}>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="font-medium text-slate-800 break-words">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Complete Issuance History Timeline for Resident */}
              {selectedRecord.history && selectedRecord.history.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      All Issued Certificates ({selectedRecord.history.length})
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Newest to Oldest
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedRecord.history.map((h, idx) => (
                      <div
                        key={h.id || idx}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {h.certNumber}
                            </span>
                            <span className="font-semibold text-slate-700 text-xs">
                              • {h.certTitle}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span>Purpose: <strong>{h.purpose || 'General Purpose'}</strong></span>
                            {h.orNumber && <span>OR: <strong>{h.orNumber}</strong></span>}
                            <span>Issued: {formatDate(h.createdAt)}</span>
                          </div>
                        </div>

                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {h.status || 'Released'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
