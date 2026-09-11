import { useState, useEffect } from 'react'
import {
  Edit3Icon,
  ShieldCheckIcon,
  UserX,
  RotateCcw,
  Building2,
  Scale,
  Search,
  X,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import {
  DetailPageLayout,
  DetailHeader,
  DetailInfoCard,
  DetailTabs,
  DetailActionButton,
  type DetailTab,
} from '@/components/ui/details'
import type { OfficerTableResponse, OfficerCaseHistoryResponse } from '@/config/api/officers/officer.types'
import { officerService } from '@/config/api/officers/officer.service'

interface OfficerDetailPageViewProps {
  officer: OfficerTableResponse
  onBack: () => void
  onEdit: (officer: OfficerTableResponse) => void
  onStatusToggle: (officer: OfficerTableResponse) => void
}

function formatDepartmentName(deptName?: string): string {
  if (!deptName) return '—'
  if (deptName === 'LUPON') return 'Lupong Tagapamayapa'
  if (deptName === 'BCPC') return 'BCPC (Council for Protection of Children)'
  if (deptName === 'BLOTTER') return 'Blotter Management'
  if (deptName === 'VAWC') return 'VAWC (Women & Children)'
  if (deptName === 'CLEARANCE') return 'Clearance & Certifications'
  if (deptName === 'KAPITANA') return 'Office of the Barangay Captain'
  if (deptName === 'FTJS') return 'FTJS (First-Time Job Seeker)'
  return deptName
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export function OfficerDetailPageView({
  officer,
  onBack,
  onEdit,
  onStatusToggle,
}: OfficerDetailPageViewProps) {
  const isOfficerActive = officer.status === 'ACTIVE'
  const statusTone = isOfficerActive ? 'emerald' : 'amber'
  const formattedDept = formatDepartmentName(officer.departmentName)

  // Cases Handled state
  const [cases, setCases] = useState<OfficerCaseHistoryResponse[]>([])
  const [loadingCases, setLoadingCases] = useState<boolean>(true)
  const [caseSearch, setCaseSearch] = useState<string>('')
  const [caseDept, setCaseDept] = useState<string>('ALL')
  const [caseFromDate, setCaseFromDate] = useState<string>('')
  const [caseToDate, setCaseToDate] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    setLoadingCases(true)
    officerService.getOfficerCases(officer.id)
      .then((data) => {
        if (isMounted) {
          setCases(data || [])
        }
      })
      .catch(() => {
        if (isMounted) {
          setCases([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingCases(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [officer.id])

  // Overview Tab Content (Clean, necessary backend fields only)
  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Officer & Department Information"
        columns={2}
        fields={[
          { label: 'FULL NAME', value: officer.name || '—' },
          { label: 'POSITION / ROLE', value: officer.position || '—' },
          {
            label: 'DEPARTMENT',
            value: (
              <Badge tone="slate">
                <Building2 size={13} className="inline mr-1" />
                {formattedDept}
              </Badge>
            ),
          },
          {
            label: 'OFFICER STATUS',
            value: (
              <Badge tone={statusTone}>
                {officer.status}
              </Badge>
            ),
          },
          {
            label: 'ACTIVE CASES HANDLED',
            value: `${officer.activeCases ?? 0} cases`,
          },
          { label: 'SYSTEM EMAIL', value: officer.email || '—' },
          { label: 'OFFICER RECORD ID', value: `OFF-${String(officer.id).padStart(4, '0')}` },
        ]}
      />
    </div>
  )

  // Filter cases client-side
  const filteredCases = cases.filter((c) => {
    if (caseSearch.trim()) {
      const q = caseSearch.toLowerCase().trim()
      const matchesNum = (c.caseNumber || '').toLowerCase().includes(q)
      const matchesNature = (c.incidentNature || '').toLowerCase().includes(q)
      const matchesRole = (c.role || '').toLowerCase().includes(q)
      if (!matchesNum && !matchesNature && !matchesRole) return false
    }
    if (caseDept !== 'ALL' && c.department) {
      if (c.department.toUpperCase() !== caseDept.toUpperCase()) return false
    }
    if (caseFromDate) {
      const filed = c.issuedDate ? c.issuedDate.slice(0, 10) : ''
      if (filed && filed < caseFromDate) return false
    }
    if (caseToDate) {
      const filed = c.issuedDate ? c.issuedDate.slice(0, 10) : ''
      if (filed && filed > caseToDate) return false
    }
    return true
  })

  const hasActiveCaseFilters = Boolean(caseSearch || caseDept !== 'ALL' || caseFromDate || caseToDate)

  const getStatusBadgeTone = (status: string): 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo' => {
    const s = (status || '').toUpperCase()
    if (s.includes('SETTLED') || s.includes('RESOLVED') || s.includes('CLOSED')) return 'emerald'
    if (s.includes('PENDING') || s.includes('SCHEDULED') || s.includes('MEDIATION') || s.includes('CONCILIATION')) return 'amber'
    if (s.includes('DISMISSED') || s.includes('DECLINED') || s.includes('WITHDRAWN')) return 'slate'
    return 'indigo'
  }

  // Cases Handled Tab Content
  const casesHandledContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <Scale className="h-5 w-5 text-blue-600 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
            Cases Handled & Records
          </h3>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </span>
        </div>

        {/* Client-side Search & Date Range Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search case #..."
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={caseDept}
            onChange={(e) => setCaseDept(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="BLOTTER">Blotter</option>
            <option value="LUPON">Lupon</option>
            <option value="VAWC">VAWC</option>
            <option value="BCPC">BCPC</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <input
              type="date"
              value={caseFromDate}
              onChange={(e) => setCaseFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={caseToDate}
              onChange={(e) => setCaseToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {hasActiveCaseFilters && (
            <button
              type="button"
              onClick={() => {
                setCaseSearch('')
                setCaseDept('ALL')
                setCaseFromDate('')
                setCaseToDate('')
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loadingCases ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-xs font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Loading cases handled...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveCaseFilters ? 'No Matching Cases Found' : 'No Recorded Cases Handled'}
          </p>
          <p className="text-xs text-slate-400">
            {hasActiveCaseFilters
              ? 'Try adjusting your search query, department selection, or date range filters.'
              : 'This officer has no active, archived, or historical cases assigned.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Case Number</th>
                <th className="py-3 px-3 whitespace-nowrap">Department</th>
                <th className="py-3 px-3 whitespace-nowrap">Role</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredCases.map((c) => (
                <tr key={c.id || c.caseNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {c.caseNumber}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.department}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge tone="indigo">
                      {c.role || officer.position || 'Assigned Officer'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <Badge tone={getStatusBadgeTone(c.status)}>
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                    {c.issuedDate ? formatDate(c.issuedDate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const tabs: DetailTab[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    {
      id: 'cases-handled',
      label: (
        <span className="inline-flex items-center gap-1.5">
          Cases Handled
          {cases.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 min-w-[18px]">
              {cases.length}
            </span>
          )}
        </span>
      ),
      content: casesHandledContent,
    },
  ]

  return (
    <DetailPageLayout
      backLabel="Back to Officer Directory"
      onBack={onBack}
      header={
        <DetailHeader
          name={officer.name}
          subtitle={officer.position}
          status={<Badge tone={statusTone}>{officer.status}</Badge>}
          meta={
            <Badge tone="slate">
              <ShieldCheckIcon size={13} className="inline mr-1" />
              {formattedDept}
            </Badge>
          }
          actions={
            <>
              <DetailActionButton
                icon={<Edit3Icon size={17} />}
                onClick={() => onEdit(officer)}
              >
                Edit Officer
              </DetailActionButton>

              <DetailActionButton
                tone={isOfficerActive ? 'blue' : 'emerald'}
                icon={isOfficerActive ? <UserX size={17} /> : <RotateCcw size={17} />}
                onClick={() => onStatusToggle(officer)}
              >
                {isOfficerActive ? 'Inactivate Officer' : 'Restore Officer'}
              </DetailActionButton>
            </>
          }
        />
      }
    >
      <DetailTabs tabs={tabs} />
    </DetailPageLayout>
  )
}
