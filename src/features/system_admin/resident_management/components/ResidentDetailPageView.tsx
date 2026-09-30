import { useEffect, useState } from 'react'
import { Edit3Icon, RotateCcw, User, Users, Paperclip, Scale, FileCheck, GraduationCap, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { Avatar } from '@/components/ui/table/Avatar'
import {
  DetailPageLayout,
  DetailHeader,
  DetailInfoCard,
  DetailTabs,
  DetailActionButton,
  DetailSkeleton,
  type DetailTab,
} from '@/components/ui/details'
import { UpdateStatusModal } from './UpdateStatusModal'
import { residentService } from '@/config/api/residents/residents.service'
import type { ResidentDetailResponse, ResidentStatus } from '@/config/api/residents/residents.types'

import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { formatDate } from '@/utils/formatters'

interface ResidentDetailPageViewProps {
  residentId: number
  onBack: () => void
  onEdit: (residentDetail: ResidentDetailResponse) => void
  onStatusToggle?: (residentId: number, currentStatus: ResidentStatus) => void
}

export function ResidentDetailPageView({
  residentId,
  onBack,
  onEdit,
  onStatusToggle,
}: ResidentDetailPageViewProps) {
  const [residentDetail, setResidentDetail] = useState<ResidentDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [successFeedback, setSuccessFeedback] = useState<{ open: boolean; title: string; description: string } | null>(null)

  // Case History Filter State
  const [caseSearch, setCaseSearch] = useState('')
  const [caseDept, setCaseDept] = useState('ALL')
  const [caseFromDate, setCaseFromDate] = useState('')
  const [caseToDate, setCaseToDate] = useState('')

  // Clearances Filter State
  const [clearanceSearch, setClearanceSearch] = useState('')
  const [clearanceStatus, setClearanceStatus] = useState('ALL')
  const [clearanceFromDate, setClearanceFromDate] = useState('')
  const [clearanceToDate, setClearanceToDate] = useState('')

  // FTJS Filter State
  const [ftjsSearch, setFtjsSearch] = useState('')
  const [ftjsStatus, setFtjsStatus] = useState('ALL')
  const [ftjsFromDate, setFtjsFromDate] = useState('')
  const [ftjsToDate, setFtjsToDate] = useState('')

  const fetchDetail = async () => {
    setIsLoading(true)
    try {
      const data = await residentService.getResidentDetail(residentId)
      setResidentDetail(data)
    } catch (err) {
      console.error('Failed to fetch resident details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [residentId])

  if (isLoading) {
    return (
      <DetailSkeleton
        backLabel="Back to Resident Management"
        onBack={onBack}
        tabCount={4}
        infoCardCount={2}
        actionCount={2}
      />
    )
  }

  if (!residentDetail) {
    return (
      <DetailPageLayout backLabel="Back to Resident Management" onBack={onBack} header={<div />}>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <h2 className="text-lg font-bold text-slate-900">Resident Profile Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">The requested resident account details could not be loaded.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            Return to Resident Management
          </button>
        </div>
      </DetailPageLayout>
    )
  }

  const statusToneMap: Record<ResidentStatus, 'emerald' | 'amber' | 'rose' | 'slate'> = {
    ACTIVE: 'emerald',
    INACTIVE: 'amber',
    DECEASED: 'rose',
    MOVED_OUT: 'slate',
    ARCHIVED: 'slate',
  }
  const statusTone = statusToneMap[residentDetail.status] || 'emerald'

  const personInfo = residentDetail.personInfo
  const fullName = personInfo?.fullName || 'Resident'
  const familyAssociations = residentDetail.familyAssociations || []

  const overviewContent = (
    <div className="space-y-6">
      <DetailInfoCard
        title="Resident & Household Information"
        columns={2}
        fields={[
          { label: 'FULL NAME', value: fullName },
          { label: 'BARANGAY ID NUMBER', value: residentDetail.barangayIdNumber || '—' },
          { label: 'HOUSEHOLD NUMBER', value: residentDetail.householdNumber || '—' },
          {
            label: 'HEAD OF FAMILY',
            value: (
              <Badge tone={residentDetail.isHeadOfFamily ? 'emerald' : 'slate'}>
                {residentDetail.isHeadOfFamily ? 'Head of Family' : 'Member'}
              </Badge>
            ),
          },
          {
            label: 'RESIDENT STATUS',
            value: (
              <Badge tone={statusTone}>
                {residentDetail.status}
              </Badge>
            ),
          },
          { label: 'CITIZENSHIP', value: residentDetail.citizenship || 'Filipino' },
          { label: 'EDUCATIONAL ATTAINMENT', value: residentDetail.educationalAttainment || '—' },
          {
            label: 'DATE OF RESIDENCY',
            value: formatDate(residentDetail.dateOfResidency),
          },
        ]}
      />

      {personInfo && (
        <DetailInfoCard
          title="Personal Profile Details"
          columns={2}
          fields={[
            { label: 'CONTACT NUMBER', value: personInfo.contactNumber || '—' },
            { label: 'AGE', value: personInfo.age ? `${personInfo.age} years old` : '—' },
            { label: 'GENDER', value: personInfo.gender || '—' },
            { label: 'CIVIL STATUS', value: personInfo.civilStatus || '—' },
            { label: 'OCCUPATION', value: personInfo.occupation || '—' },
            { label: 'COMPLETE ADDRESS', value: personInfo.completeAddress || '—' },
            {
              label: 'BIRTH DATE',
              value: formatDate(personInfo.birthDate),
            },
          ]}
        />
      )}

      {/* ── Family Associations Section ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Family Associations & Household Members ({familyAssociations.length})
            </h3>
          </div>
        </div>

        {familyAssociations.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-2">
            No family associations or linked household members recorded for this resident.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {familyAssociations.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5"
              >
                <Avatar name={rel.fullName} photoBase64={rel.photoBase64} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 truncate text-sm">{rel.fullName}</p>
                    <Badge tone="indigo">{rel.relationshipType || 'Relative'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {rel.barangayIdNumber || '—'} • Age {rel.age ?? '—'} • {rel.gender || '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{rel.address || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const documentsContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Attached Files & Verification Documents ({residentDetail.attachedFiles?.length || 0})
          </h3>
        </div>
      </div>

      {(!residentDetail.attachedFiles || residentDetail.attachedFiles.length === 0) ? (
        <p className="text-sm text-slate-400 italic py-2">
          No files or verification documents attached to this profile.
        </p>
      ) : (
        <div className="space-y-2.5">
          {residentDetail.attachedFiles.map((doc) => {
            const fileSrc = doc.fileBase64
              ? (doc.fileBase64.startsWith('data:') ? doc.fileBase64 : `data:${doc.fileType || 'application/octet-stream'};base64,${doc.fileBase64}`)
              : null

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Paperclip size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                    <p className="truncate text-xs text-slate-400 mt-0.5">{doc.fileType || 'Document'}</p>
                  </div>
                </div>

                {fileSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open()
                      if (win) {
                        win.document.write(`<iframe src="${fileSrc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
                      }
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                  >
                    View File
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const caseHistoryList = residentDetail.caseHistory || []

  const filteredCases = caseHistoryList.filter((c) => {
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
      const filed = c.dateFiled ? c.dateFiled.slice(0, 10) : ''
      if (filed && filed < caseFromDate) return false
    }
    if (caseToDate) {
      const filed = c.dateFiled ? c.dateFiled.slice(0, 10) : ''
      if (filed && filed > caseToDate) return false
    }
    return true
  })

  const hasActiveCaseFilters = Boolean(caseSearch || caseDept !== 'ALL' || caseFromDate || caseToDate)

  const getRoleBadgeTone = (role: string): 'emerald' | 'rose' | 'amber' | 'slate' | 'indigo' => {
    const r = (role || '').toUpperCase()
    if (r.includes('COMPLAINANT')) return 'emerald'
    if (r.includes('RESPONDENT')) return 'rose'
    if (r.includes('WITNESS')) return 'slate'
    return 'indigo'
  }

  const getStatusBadgeTone = (status: string): 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo' => {
    const s = (status || '').toUpperCase()
    if (s.includes('SETTLED') || s.includes('RESOLVED') || s.includes('CLOSED')) return 'emerald'
    if (s.includes('PENDING') || s.includes('SCHEDULED') || s.includes('MEDIATION') || s.includes('CONCILIATION')) return 'amber'
    if (s.includes('DISMISSED') || s.includes('DECLINED') || s.includes('WITHDRAWN')) return 'slate'
    return 'indigo'
  }

  const caseHistoryContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <Scale className="h-5 w-5 text-blue-600 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
            Barangay Case History & Records
          </h3>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </span>
        </div>

        {/* Filters */}
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

      {filteredCases.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveCaseFilters ? 'No Matching Cases Found' : 'No Recorded Barangay Cases'}
          </p>
          <p className="text-xs text-slate-400">
            {hasActiveCaseFilters
              ? 'Try adjusting your search query, department selection, or date range filters.'
              : 'This resident has no active or historical cases recorded as Complainant, Respondent, or Witness.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Case Number</th>
                <th className="py-3 px-3 whitespace-nowrap">Department</th>
                <th className="py-3 px-3 whitespace-nowrap">Involved Role</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Date Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredCases.map((c) => (
                <tr key={c.caseId || c.caseNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {c.caseNumber}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.department}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge tone={getRoleBadgeTone(c.role)}>
                      {c.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <Badge tone={getStatusBadgeTone(c.status)}>
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                    {c.dateFiled ? formatDate(c.dateFiled) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const clearancesList = residentDetail.clearancesIssued || []

  const filteredClearances = clearancesList.filter((c) => {
    if (clearanceSearch.trim()) {
      const q = clearanceSearch.toLowerCase().trim()
      const matchesCert = (c.certNumber || '').toLowerCase().includes(q)
      const matchesType = (c.clearanceType || '').toLowerCase().includes(q)
      const matchesOr = (c.orNumber || '').toLowerCase().includes(q)
      const matchesCtc = (c.ctnNumber || '').toLowerCase().includes(q)
      if (!matchesCert && !matchesType && !matchesOr && !matchesCtc) return false
    }
    if (clearanceStatus !== 'ALL' && c.status) {
      if (c.status.toUpperCase() !== clearanceStatus.toUpperCase()) return false
    }
    if (clearanceFromDate) {
      const issued = c.issuedAt ? c.issuedAt.slice(0, 10) : ''
      if (issued && issued < clearanceFromDate) return false
    }
    if (clearanceToDate) {
      const issued = c.issuedAt ? c.issuedAt.slice(0, 10) : ''
      if (issued && issued > clearanceToDate) return false
    }
    return true
  })

  const hasActiveClearanceFilters = Boolean(
    clearanceSearch || clearanceStatus !== 'ALL' || clearanceFromDate || clearanceToDate
  )

  const getClearanceStatusTone = (status: string): 'emerald' | 'amber' | 'rose' | 'slate' => {
    const s = (status || '').toUpperCase()
    if (s === 'ACTIVE') return 'emerald'
    if (s === 'EXPIRED') return 'amber'
    if (s === 'VOID' || s === 'CANCELLED') return 'rose'
    return 'slate'
  }

  const clearancesContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <FileCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
            Issued Clearances & Certifications
          </h3>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
            {filteredClearances.length} {filteredClearances.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cert # or type..."
              value={clearanceSearch}
              onChange={(e) => setClearanceSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={clearanceStatus}
            onChange={(e) => setClearanceStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="VOID">Void</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <input
              type="date"
              value={clearanceFromDate}
              onChange={(e) => setClearanceFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={clearanceToDate}
              onChange={(e) => setClearanceToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {hasActiveClearanceFilters && (
            <button
              type="button"
              onClick={() => {
                setClearanceSearch('')
                setClearanceStatus('ALL')
                setClearanceFromDate('')
                setClearanceToDate('')
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredClearances.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveClearanceFilters ? 'No Matching Clearances Found' : 'No Clearances Issued'}
          </p>
          <p className="text-xs text-slate-400">
            {hasActiveClearanceFilters
              ? 'Try adjusting your search query, status selection, or date range filters.'
              : 'No official barangay clearances or certifications have been issued to this resident yet.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Certificate No.</th>
                <th className="py-3 px-3.5">Clearance Type</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Expiry Date</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Date Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredClearances.map((c) => (
                <tr key={c.clearanceId || c.certNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {c.certNumber}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap max-w-[240px] truncate" title={c.clearanceType}>
                    {c.clearanceType || 'Barangay Clearance'}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <Badge tone={getClearanceStatusTone(c.status)}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 font-medium whitespace-nowrap">
                    {c.expiryDate ? formatDate(c.expiryDate) : '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                    {c.issuedAt ? formatDate(c.issuedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const ftjsList = residentDetail.ftjsIssued || []

  const filteredFtjs = ftjsList.filter((f) => {
    if (ftjsSearch.trim()) {
      const q = ftjsSearch.toLowerCase().trim()
      const matchesNum = (f.ftjsNumber || '').toLowerCase().includes(q)
      const matchesPurpose = (f.purpose || '').toLowerCase().includes(q)
      const matchesSchool = (f.schoolInstitution || '').toLowerCase().includes(q)
      const matchesEdu = (f.educationalAttainment || '').toLowerCase().includes(q)
      if (!matchesNum && !matchesPurpose && !matchesSchool && !matchesEdu) return false
    }
    if (ftjsStatus !== 'ALL' && f.status) {
      if (f.status.toUpperCase() !== ftjsStatus.toUpperCase()) return false
    }
    if (ftjsFromDate) {
      const date = (f.dateSubmitted || f.issuedAt) ? (f.dateSubmitted || f.issuedAt)!.slice(0, 10) : ''
      if (date && date < ftjsFromDate) return false
    }
    if (ftjsToDate) {
      const date = (f.dateSubmitted || f.issuedAt) ? (f.dateSubmitted || f.issuedAt)!.slice(0, 10) : ''
      if (date && date > ftjsToDate) return false
    }
    return true
  })

  const hasActiveFtjsFilters = Boolean(
    ftjsSearch || ftjsStatus !== 'ALL' || ftjsFromDate || ftjsToDate
  )

  const ftjsContent = (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <GraduationCap className="h-5 w-5 text-blue-600 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
            First-Time Jobseeker (FTJS) Certificates
          </h3>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
            {filteredFtjs.length} {filteredFtjs.length === 1 ? 'certificate' : 'certificates'}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search FTJS # or purpose..."
              value={ftjsSearch}
              onChange={(e) => setFtjsSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={ftjsStatus}
            onChange={(e) => setFtjsStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active / Original</option>
            <option value="RE_ISSUANCE">Re-issuance</option>
            <option value="PENDING">Pending</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <input
              type="date"
              value={ftjsFromDate}
              onChange={(e) => setFtjsFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={ftjsToDate}
              onChange={(e) => setFtjsToDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {hasActiveFtjsFilters && (
            <button
              type="button"
              onClick={() => {
                setFtjsSearch('')
                setFtjsStatus('ALL')
                setFtjsFromDate('')
                setFtjsToDate('')
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredFtjs.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveFtjsFilters ? 'No Matching Certificates Found' : 'No FTJS Certificates Issued'}
          </p>
          <p className="text-xs text-slate-400">
            {hasActiveFtjsFilters
              ? 'Try adjusting your search query, status selection, or date range filters.'
              : 'No First-Time Jobseeker certificates or eligibility records have been requested by this resident.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs">
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Application / Cert No.</th>
                <th className="py-3 px-3.5">Purpose</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredFtjs.map((f) => (
                <tr key={f.ftjsId || f.ftjsNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {f.ftjsNumber}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-800 max-w-[320px] truncate" title={f.purpose}>
                    {f.purpose || 'First Time Jobseeker Requirement'}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <Badge tone={f.status === 'RE_ISSUANCE' ? 'violet' : 'emerald'}>
                      {f.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                    {f.issuedAt ? formatDate(f.issuedAt) : (f.dateSubmitted ? formatDate(f.dateSubmitted) : '—')}
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
    { id: 'case-history', label: `Case History (${caseHistoryList.length})`, content: caseHistoryContent },
    { id: 'clearances', label: `Clearances Issued (${clearancesList.length})`, content: clearancesContent },
    { id: 'ftjs', label: `FTJS Certificates (${ftjsList.length})`, content: ftjsContent },
    { id: 'documents', label: `Documents & Files (${residentDetail.attachedFiles?.length || 0})`, content: documentsContent },
  ]

  return (
    <>
      <DetailPageLayout
        backLabel="Back to Resident Management"
        onBack={onBack}
        header={
          <DetailHeader
            name={fullName}
            subtitle={residentDetail.barangayIdNumber}
            photoBase64={residentDetail.photoBase64}
            status={<Badge tone={statusTone}>{residentDetail.status}</Badge>}
            meta={
              <Badge tone="slate">
                <User size={13} className="inline mr-1" />
                {residentDetail.isHeadOfFamily ? 'Head of Family' : 'Resident'}
              </Badge>
            }
            actions={
              <>
                <DetailActionButton
                  icon={<Edit3Icon size={17} />}
                  onClick={() => onEdit(residentDetail)}
                >
                  Edit Resident
                </DetailActionButton>

                <DetailActionButton
                  tone="primary"
                  icon={<RotateCcw size={17} />}
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  Update Status
                </DetailActionButton>
              </>
            }
          />
        }
      >
        <DetailTabs tabs={tabs} />
      </DetailPageLayout>

      <UpdateStatusModal
        open={isStatusModalOpen}
        residentId={residentDetail.id}
        residentName={fullName}
        currentStatus={residentDetail.status}
        onClose={() => setIsStatusModalOpen(false)}
        onSaved={(newStatus) => {
          fetchDetail()
          setSuccessFeedback({
            open: true,
            title: 'Resident Status Updated',
            description: `${fullName}'s status has been successfully updated to ${newStatus}.`,
          })
          if (onStatusToggle) onStatusToggle(residentDetail.id, newStatus)
        }}
      />

      <FeedbackDialog
        open={Boolean(successFeedback?.open)}
        variant="success"
        title={successFeedback?.title || ''}
        description={successFeedback?.description || ''}
        actionLabel="Done"
        onClose={() => setSuccessFeedback(null)}
      />
    </>
  )
}

