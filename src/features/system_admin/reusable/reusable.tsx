import { useState, useMemo } from 'react'
import { Layers, FileText, FileSpreadsheet, BarChart3, RefreshCw, MapPin, Table } from 'lucide-react'
import { FormalComplaintForm } from '@/components/ui/complaint_form/FormalComplaintForm'
import { ForTheRecordForm } from '@/components/ui/complaint_form/ForTheRecordForm'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { TrendPanel } from '@/components/reports/TrendPanel'
import { BreakdownDonutCard } from '@/components/reports/BreakdownDonutCard'
import { HorizontalBarCard } from '@/components/reports/HorizontalBarCard'
import { ReportTableCard, type ColumnDef } from '@/components/reports/ReportTableCard'
import { CardPill } from '@/components/reports/ChartCard'
import { MOCK_APPLICANTS } from '@/components/reports/data/applicants'
import { trendSeries, periodChange, filterApplicants, toCsv } from '@/components/reports/utils/Analytics'
import type { ReportFilters as Filters, Applicant } from '@/components/reports/types/ftjs'
import { FeedbackDialog } from '@/components/ui'
import { useDialogs } from '@/hooks/useDialogs'
import type { ComplaintFormData } from '@/components/ui/complaint_form/types'

export function SystemAdminReusablePage() {
  const [activeTab, setActiveTab] = useState<'REPORT_ANALYTICS' | 'FORMAL' | 'RECORD'>('REPORT_ANALYTICS')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const { showFeedback, feedbackDialogProps } = useDialogs()

  // Report Filters Showcase State
  const defaultFilters: Filters = {
    dateFrom: '2026-08-01',
    dateTo: '2026-08-15',
    purok: 'All',
    purpose: 'All',
    sex: 'All',
    civilStatus: 'All',
    education: 'All',
    outcome: 'All',
  }
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters)
  const [isDirty, setIsDirty] = useState(false)

  const filteredData = useMemo(() => {
    return filterApplicants(MOCK_APPLICANTS, appliedFilters)
  }, [appliedFilters])

  const trendData = useMemo(() => {
    return trendSeries(filteredData, appliedFilters.dateFrom, appliedFilters.dateTo)
  }, [filteredData, appliedFilters])

  const deltaData = useMemo(() => {
    return periodChange(trendData)
  }, [trendData])

  // Purpose Breakdown Data
  const purposeBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredData.forEach((row) => {
      counts[row.purpose] = (counts[row.purpose] ?? 0) + 1
    })
    const colors = ['#2563eb', '#0d9488', '#4f46e5', '#d97706', '#be123c']
    return Object.entries(counts).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }))
  }, [filteredData])

  // Original vs Reissuance Data
  const origVsReissuanceData = useMemo(() => {
    const orig = filteredData.filter((r) => r.firstAvailment).length
    const reissued = filteredData.length - orig
    return [
      { label: 'Original issuance', value: orig, color: '#2563eb' },
      { label: 'Re-issuance', value: reissued, color: '#0d9488' },
    ]
  }, [filteredData])

  // Purok Distribution Data for Horizontal Bar Chart
  const purokDistributionData = useMemo(() => {
    return [
      { label: 'Purok 1', value: 12, color: '#2563eb' },
      { label: 'Purok 2', value: 8, color: '#0d9488' },
      { label: 'Purok 3', value: 15, color: '#4f46e5' },
      { label: 'Purok 4', value: 6, color: '#d97706' },
      { label: 'Purok 5', value: 9, color: '#be123c' },
    ]
  }, [])

  // Report Table Columns Definition
  const reportColumns: ColumnDef<Applicant>[] = [
    {
      key: 'controlNo',
      header: 'CONTROL NO.',
      render: (r) => <span className="text-xs font-semibold text-slate-700">{r.controlNo}</span>,
    },
    {
      key: 'name',
      header: 'NAME',
      render: (r) => <span className="font-bold text-slate-900">{r.name}</span>,
    },
    {
      key: 'sex',
      header: 'SEX',
      render: (r) => <span className="text-slate-600 font-medium">{r.sex}</span>,
    },
    {
      key: 'age',
      header: 'AGE',
      render: (r) => <span className="text-slate-600 font-medium">{r.age}</span>,
    },
    {
      key: 'purok',
      header: 'PUROK / SITIO',
      render: (r) => <span className="text-slate-600 font-medium">{r.purok}</span>,
    },
    {
      key: 'purpose',
      header: 'PURPOSE',
      render: (r) => <span className="text-slate-700 font-semibold">{r.purpose}</span>,
    },
    {
      key: 'dateIssued',
      header: 'ISSUED',
      render: (r) => <span className="text-slate-600 font-medium">{r.dateIssued}</span>,
    },
    {
      key: 'outcome',
      header: 'STATUS',
      render: (r) => {
        const isPlaced = r.outcome === 'Placed'
        const isTraining = r.outcome === 'In Training'
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold ${isPlaced
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : isTraining
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'bg-slate-100 text-slate-700'
                }`}
            >
              {r.outcome}
            </span>
            {r.employer && (
              <span className="text-xs text-slate-400 truncate max-w-[140px]" title={r.employer}>
                {r.employer}
              </span>
            )}
          </div>
        )
      },
    },
  ]

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
    setIsDirty(false)
    showFeedback({
      variant: 'success',
      title: 'Report Filters Applied',
      description: `Showing ${filteredData.length} records from ${draftFilters.dateFrom} to ${draftFilters.dateTo}.`,
    })
  }

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setIsDirty(false)
  }

  const handleExportCsv = () => {
    const csv = toCsv(filteredData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FTJS_Report_${appliedFilters.dateFrom}_to_${appliedFilters.dateTo}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleSubmitComplaint = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)

    showFeedback({
      variant: 'success',
      title: data.mode === 'FORMAL_COMPLAINT' ? 'Formal Complaint Demo Submitted!' : 'For the Record Demo Submitted!',
      description: `Case #${data.caseInfo.caseNumber} has been validated and submitted successfully in showcase mode.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Showcase Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Layers className="w-3.5 h-3.5" /> Reusable Component Showcase
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Admin Reusable Components
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Interactive preview of Report Filters, Trend Charts, Donut Breakdowns, Horizontal Bar Charts, Reusable Report Table Card, and Master Chart Insights Toggle.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex p-1.5 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('REPORT_ANALYTICS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'REPORT_ANALYTICS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" /> Report Analytics & Charts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FORMAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'FORMAL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Formal Complaint Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RECORD')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'RECORD'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
              }`}
          >
            <FileText className="w-4 h-4" /> For the Record Form
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'REPORT_ANALYTICS' && (
        <div className="space-y-6">
          {/* 1. Report Filters Component with Master Chart Insights Toggle */}
          <ReportFilters
            draft={draftFilters}
            onDraftChange={(next) => {
              setDraftFilters(next)
              setIsDirty(true)
            }}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onPrint={handlePrintReport}
            onExport={handleExportCsv}
            onToggleInsights={() => setShowInsights(!showInsights)}
            dirty={isDirty}
          />

          {/* 2. Trend Panel Analytics Component */}
          <TrendPanel trend={trendData} delta={deltaData} showInsightsDefault={showInsights} />

          {/* 3. Reusable Horizontal Bar Chart Card (Purok Distribution Showcase) */}
          <HorizontalBarCard
            title="Purok / Sitio Applicant Distribution"
            description="Geographic distribution of First-Time Jobseeker applicants across barangay puroks"
            icon={MapPin}
            badge={<CardPill>5 PUROKS</CardPill>}
            data={purokDistributionData}
            valueNoun="applicants"
            showInsightsDefault={showInsights}
            insightMessage={
              <>
                <span className="font-semibold text-slate-900 not-italic">Purok 3</span> recorded the highest concentration of applicants with <span className="font-semibold text-slate-900 not-italic">15 out of 50 total jobseekers (30%)</span>.
              </>
            }
            insightSecondaryMessage="Targeted job placement caravans are recommended for high-volume puroks."
          />

          {/* 4. Reusable Donut Breakdown Cards (Unified Single Component Showcase) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Example 1: Table Variant (Purpose of Request) */}
            <BreakdownDonutCard
              title="Purpose of Request"
              description="Why the certificate was requested"
              icon={FileText}
              centerLabel="Requests"
              variant="table"
              categoryColumnHeader="Purpose"
              data={purposeBreakdownData}
              showInsightsDefault={showInsights}
              insightMessage={
                <>
                  <span className="font-semibold text-slate-900 not-italic">3 out of 4 applicants</span> requested documents for Local Employment Application. This confirms that our primary service load is driven by employment requirements.
                </>
              }
              insightSecondaryMessage="Employment clearances remain the highest requested service category this month."
            />

            {/* Example 2: List Variant (Original vs Re-issuance) */}
            <BreakdownDonutCard
              title="Original vs Re-issuance"
              description="Share of first releases and replacements"
              icon={RefreshCw}
              centerLabel="Total"
              variant="list"
              data={origVsReissuanceData}
              showInsightsDefault={showInsights}
              insightMessage={
                <>
                  <span className="font-semibold text-slate-900 not-italic">4 out of 4 applicants</span> are first-time releases (100% original issuance) with zero replacement requests recorded.
                </>
              }
              insightSecondaryMessage="No duplicate or replacement processing fees were assessed."
            />
          </div>

          {/* 5. Reusable Detailed Record List Report Table Card */}
          <ReportTableCard<Applicant>
            title="Detailed Record List"
            icon={Table}
            columns={reportColumns}
            data={filteredData}
            getRowId={(r) => r.id}
            pageSize={5}
            showInsightsDefault={showInsights}
            insightMessage={
              <>
                <span className="font-semibold text-slate-900 not-italic">4 out of 4 listed applicants</span> have fully verified document requirement submissions.
              </>
            }
          />
        </div>
      )}

      {activeTab === 'FORMAL' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm">
          <FormalComplaintForm onSubmit={handleSubmitComplaint} isSubmitting={isSubmitting} />
        </div>
      )}

      {activeTab === 'RECORD' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm">
          <ForTheRecordForm onSubmit={handleSubmitComplaint} isSubmitting={isSubmitting} />
        </div>
      )}

      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
