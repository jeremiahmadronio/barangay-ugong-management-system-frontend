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
} from 'lucide-react'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FormModal } from '@/components/ui/FormModal'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'
import { ClearanceDetailsView } from './components/ClearanceDetailsView'

export const ClearanceIssuedPage = () => {
  const navigate = useNavigate()
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'
  const {
    confirm,
    showFeedback,
    confirmDialogProps,
    feedbackDialogProps,
  } = useDialogs()

  // 1. View Mode & Selection State
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST')
  const [selectedRecordId, setSelectedRecordId] = useState<string | number | null>(null)

  // 1.1 Archive Modal State
  const [archivingRecord, setArchivingRecord] = useState<IssuedCertificateTableResponse | null>(null)
  const [archiveRemarksInput, setArchiveRemarksInput] = useState<string>('')
  const [isArchivingSubmitting, setIsArchivingSubmitting] = useState<boolean>(false)

  // 2. Stats State
  const [stats, setStats] = useState<ClearanceStatsResponse>({
    totalIssued: 0,
    issuedThisMonth: 0,
    mostIssuedCert: 'Barangay Clearance',
    mostCommonPurpose: 'Local Employment',
  })

  // 3. Table & Filter State
  const [records, setRecords] = useState<IssuedCertificateTableResponse[]>([])
  const [templates, setTemplates] = useState<TemplateOptionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    typeOfCert: 'all',
    purpose: 'all',
  })

  // 4. Selected Record State
  const [selectedRecord, setSelectedRecord] = useState<IssuedCertificateTableResponse | null>(null)


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
    setSelectedRecordId(record.id)
    setViewMode('DETAILS')
  }

  // Handle Action: Archive (Open Modal)
  const handleArchive = (record: IssuedCertificateTableResponse) => {
    setArchivingRecord(record)
    setArchiveRemarksInput('')
  }

  // Handle Archive Submission
  const handleSubmitArchive = async () => {
    if (!archivingRecord) return
    setIsArchivingSubmitting(true)
    try {
      await clearanceApi.archiveCertificate(archivingRecord.id, {
        remarks: archiveRemarksInput.trim() || 'Archived Record',
      })
      const archivedCertNo = archivingRecord.certNumber
      setArchivingRecord(null)
      setArchiveRemarksInput('')
      await fetchRecords()
      await fetchStats()
      showFeedback({
        variant: 'success',
        title: 'Certificate Archived',
        description: `Certificate #${archivedCertNo} has been moved to the Archive Vault successfully.`,
      })
    } catch (err: any) {
      showFeedback({
        variant: 'error',
        title: 'Archive Failed',
        description: err?.response?.data?.message || err?.message || 'Failed to archive certificate record.',
      })
    } finally {
      setIsArchivingSubmitting(false)
    }
  }

  // Handle Action: Delete (Move to Trash)
  const handleDelete = (record: IssuedCertificateTableResponse) => {
    confirm({
      title: 'Move to Recycle Bin?',
      description: `Are you sure you want to move certificate "${record.certNumber}" for ${record.requestorName} to the Trash Vault? You can restore it anytime.`,
      confirmLabel: 'Move to Trash',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await clearanceApi.softDeleteCertificate(record.id)
          showFeedback({
            variant: 'success',
            title: 'Moved to Recycle Bin',
            description: `Certificate "${record.certNumber}" has been moved to the Recycle Bin.`,
          })
          fetchRecords()
          fetchStats()
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: err?.response?.data?.message || err?.message || 'Failed to move certificate record to trash.',
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
  const actions: RowAction<IssuedCertificateTableResponse>[] = isSystemAdmin
    ? [
        {
          id: 'view',
          label: 'View Details',
          icon: Eye,
          tone: 'primary',
          onClick: handleViewDetails,
        },
      ]
    : [
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
          tone: 'emerald',
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

  if (viewMode === 'DETAILS' && selectedRecordId) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <ClearanceDetailsView
          certId={selectedRecordId}
          certNumber={selectedRecord?.certNumber}
          onBack={() => {
            setViewMode('LIST')
            setSelectedRecordId(null)
            fetchRecords()
            fetchStats()
          }}
        />
        <ConfirmationDialog {...confirmDialogProps} />
        <FeedbackDialog {...feedbackDialogProps} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header with Action button to navigate to Issue Certificate */}
      <PageHeader
        title="Issued Certificates & Clearances"
        description="View, monitor, and track all officially released barangay clearances and certifications."
        actions={
          isSystemAdmin
            ? []
            : [
                {
                  label: 'Issue Certificate',
                  icon: FilePlus2,
                  onClick: () => navigate('/clearance/issue'),
                },
              ]
        }
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
        pageSize={5}
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

      {/* Archive Clearance Modal (Matching Blotter Standard with Blue Submit Button) */}
      <FormModal
        open={Boolean(archivingRecord)}
        title={archivingRecord ? `Archive Certificate #${archivingRecord.certNumber}` : 'Archive Clearance Record'}
        submitLabel="Archive Certificate"
        submitTone="blue"
        maxWidthClass="max-w-md"
        isSubmitting={isArchivingSubmitting}
        onClose={() => {
          if (!isArchivingSubmitting) {
            setArchivingRecord(null)
          }
        }}
        onSubmit={handleSubmitArchive}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Archive size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-blue-950 mb-0.5">Barangay Archive Policy</span>
              Archiving will move <strong>Certificate #{archivingRecord?.certNumber}</strong> for <strong>{archivingRecord?.requestorName}</strong> from active records into the official Barangay Archive Vault. You can restore it at any time.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Archive Remarks / Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={archiveRemarksInput}
              onChange={(e) => setArchiveRemarksInput(e.target.value)}
              placeholder="Enter reason or remarks for archiving this clearance (e.g. Expired, Requirement fulfilled, Archived by Admin)..."
              rows={3}
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </FormModal>

      {/* Global Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
