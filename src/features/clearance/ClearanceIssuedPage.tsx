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

  // Handle Action: Archive (Reusable Confirmation Dialog)
  const handleArchive = (record: IssuedCertificateTableResponse) => {
    const displayName = record.requestorName || 'Applicant'
    confirm({
      title: `Archive Certificate – ${displayName}?`,
      description: 'This will move the certificate record to the archive vault. The record can be restored at any time.',
      tone: 'emerald',
      confirmLabel: 'Archive Certificate',
      onConfirm: async () => {
        try {
          await clearanceApi.archiveCertificate(record.id, {
            remarks: 'Archived from clearance table',
          })
          await fetchRecords()
          await fetchStats()
          showFeedback({
            variant: 'success',
            title: 'Certificate Archived',
            description: `${displayName}'s certificate record (#${record.certNumber}) has been moved to the archive vault.`,
          })
        } catch (err: any) {
          showFeedback({
            variant: 'error',
            title: 'Archive Failed',
            description: err?.response?.data?.message || err?.message || 'Failed to archive certificate record.',
          })
        }
      },
    })
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
      tone: 'slate',
    },
    {
      id: 'issued-this-month',
      label: 'Issued This Month',
      value: stats.issuedThisMonth,
      hint: 'Released this month',
      icon: CalendarCheck,
      tone: 'slate',
    },
    {
      id: 'most-issued-cert',
      label: 'Most Requested Document',
      value: stats.mostIssuedCert || 'Barangay Clearance',
      hint: 'Top requested certificate',
      icon: Award,
      tone: 'slate',
    },
    {
      id: 'most-common-purpose',
      label: 'Top Request Purpose',
      value: stats.mostCommonPurpose || 'Local Employment',
      hint: 'Most frequent reason',
      icon: Briefcase,
      tone: 'slate',
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
        title="Clearance Records"
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
        emptyTitle={loading ? 'Loading records...' : 'No clearance records found'}
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

      {/* Global Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
