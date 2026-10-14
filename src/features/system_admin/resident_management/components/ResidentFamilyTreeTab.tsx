import { useState, useMemo } from 'react'
import {
  GitBranch,
  LayoutGrid,
  Search,
  X,
  Edit3,
  ExternalLink,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/table/Avatar'
import type { ResidentDetailResponse, ResidentRelativeResponse } from '@/config/api/residents/residents.types'

interface ResidentFamilyTreeTabProps {
  residentDetail: ResidentDetailResponse
  onViewRelative: (relative: ResidentRelativeResponse) => void
  onNavigateToResident?: (residentId: number) => void
  onEdit?: () => void
  readOnly?: boolean
}

/** Categorize relatives into genealogical / organization chart tiers */
function categorizeFamily(relatives: ResidentRelativeResponse[]) {
  const parents: ResidentRelativeResponse[] = []
  const spouse: ResidentRelativeResponse[] = []
  const siblings: ResidentRelativeResponse[] = []
  const children: ResidentRelativeResponse[] = []
  const extended: ResidentRelativeResponse[] = []

  for (const rel of relatives) {
    const rawType = (rel.relationshipType || '').toLowerCase().trim()

    if (/^(father|mother|parent|grandfather|grandmother|grandparent|guardian|stepfather|stepmother)$/i.test(rawType)) {
      parents.push(rel)
    } else if (/^(spouse|husband|wife|partner)$/i.test(rawType)) {
      spouse.push(rel)
    } else if (/^(brother|sister|sibling|stepbrother|stepsister)$/i.test(rawType)) {
      siblings.push(rel)
    } else if (/^(son|daughter|child|kid|stepson|stepdaughter|grandson|granddaughter|grandchild)$/i.test(rawType)) {
      children.push(rel)
    } else {
      extended.push(rel)
    }
  }

  return { parents, spouse, siblings, children, extended }
}

export function ResidentFamilyTreeTab({
  residentDetail,
  onViewRelative,
  onNavigateToResident,
  onEdit,
  readOnly = false,
}: ResidentFamilyTreeTabProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree')
  const [gridSearch, setGridSearch] = useState('')

  const familyAssociations = useMemo(
    () => residentDetail.familyAssociations || [],
    [residentDetail.familyAssociations]
  )

  const { parents, spouse, siblings, children, extended } = useMemo(
    () => categorizeFamily(familyAssociations),
    [familyAssociations]
  )

  const filteredGridRelatives = useMemo(() => {
    if (!gridSearch.trim()) return familyAssociations
    const q = gridSearch.toLowerCase().trim()
    return familyAssociations.filter(
      (r) =>
        (r.fullName || '').toLowerCase().includes(q) ||
        (r.relationshipType || '').toLowerCase().includes(q) ||
        (r.barangayIdNumber || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q)
    )
  }, [familyAssociations, gridSearch])

  const primaryPerson = residentDetail.personInfo

  return (
    <div className="space-y-6">
      {/* ── Subheader Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            Family Tree & Lineage Chart
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Recorded household associations and kinship hierarchy for {primaryPerson?.fullName || 'Resident'}.
          </p>
        </div>

        {/* View switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch size={13} />
            Org Chart Tree
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={13} />
            List Roster ({familyAssociations.length})
          </button>
        </div>
      </div>

      {/* ── View 1: Professional Organization Chart Tree ──────────────────── */}
      {viewMode === 'tree' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-6 sm:p-10 shadow-2xs overflow-x-auto min-h-[480px]">
          <div className="min-w-fit flex flex-col items-center">

            {/* ── PARENTS (If any recorded) ────────────────────────────── */}
            {parents.length > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
                  Parents ({parents.length})
                </span>

                <div className="flex items-center gap-6">
                  {parents.map((p, idx) => (
                    <div key={p.id} className="relative flex items-center">
                      <OrgChartNodeCard
                        relative={p}
                        onView={() => onViewRelative(p)}
                        onNavigate={onNavigateToResident ? () => onNavigateToResident(p.id) : undefined}
                      />
                      {/* Marital link between two parents */}
                      {parents.length === 2 && idx === 0 && (
                        <div className="w-6 h-px bg-slate-300" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Vertical stem dropping down to Generation II */}
                <div className="w-px h-8 bg-slate-300" />
              </div>
            )}

            {/* ── PRIMARY RESIDENT & SPOUSE / SIBLINGS ───────────────────── */}
            <div className="flex flex-col items-center">

              {/* Siblings Branch (if any) and Resident + Spouse */}
              {siblings.length > 0 && parents.length > 0 ? (
                /* Siblings connected via horizontal rail with Subject */
                <div className="flex flex-col items-center">
                  {/* Rail connecting siblings and subject */}
                  <div className="relative flex justify-center w-full">
                    <div className="flex items-start gap-8">
                      {/* Siblings group */}
                      {siblings.map((sib) => (
                        <div key={sib.id} className="relative flex flex-col items-center">
                          <div className="w-px h-6 bg-slate-300" />
                          <OrgChartNodeCard
                            relative={sib}
                            onView={() => onViewRelative(sib)}
                            onNavigate={onNavigateToResident ? () => onNavigateToResident(sib.id) : undefined}
                          />
                        </div>
                      ))}

                      {/* Primary Subject & Spouse Group */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-px h-6 bg-slate-300" />
                        <div className="flex items-center">
                          <PrimaryResidentNodeCard
                            residentDetail={residentDetail}
                            primaryPerson={primaryPerson}
                          />
                          {spouse.length > 0 && (
                            <>
                              <div className="w-8 h-px bg-slate-300" />
                              <OrgChartNodeCard
                                relative={spouse[0]}
                                onView={() => onViewRelative(spouse[0])}
                                onNavigate={onNavigateToResident ? () => onNavigateToResident(spouse[0].id) : undefined}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No siblings, or parents not present: direct Subject + Spouse row */
                <div className="flex items-center">
                  {siblings.length > 0 && (
                    <>
                      <div className="flex items-center gap-4 mr-6">
                        {siblings.map((sib) => (
                          <OrgChartNodeCard
                            key={sib.id}
                            relative={sib}
                            onView={() => onViewRelative(sib)}
                            onNavigate={onNavigateToResident ? () => onNavigateToResident(sib.id) : undefined}
                          />
                        ))}
                      </div>
                      <div className="w-6 h-px bg-slate-300 mr-6" />
                    </>
                  )}

                  <PrimaryResidentNodeCard
                    residentDetail={residentDetail}
                    primaryPerson={primaryPerson}
                  />

                  {spouse.length > 0 && (
                    <>
                      <div className="w-8 h-px bg-slate-300" />
                      <OrgChartNodeCard
                        relative={spouse[0]}
                        onView={() => onViewRelative(spouse[0])}
                        onNavigate={onNavigateToResident ? () => onNavigateToResident(spouse[0].id) : undefined}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── CHILDREN (If any recorded) ────────────────────────────── */}
            {children.length > 0 && (
              <div className="flex flex-col items-center">
                {/* Vertical stem down from Subject/Spouse */}
                <div className="w-px h-8 bg-slate-300" />

                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
                  Children ({children.length})
                </span>

                {/* Horizontal branch rail spanning across children */}
                <div className="relative flex justify-center">
                  <div className="flex gap-8">
                    {children.map((child, idx) => (
                      <div key={child.id} className="relative flex flex-col items-center">
                        {/* Horizontal rail segments */}
                        {children.length > 1 && (
                          <>
                            {idx > 0 && (
                              <div className="absolute top-0 right-1/2 w-1/2 h-px bg-slate-300" />
                            )}
                            {idx < children.length - 1 && (
                              <div className="absolute top-0 left-1/2 w-1/2 h-px bg-slate-300" />
                            )}
                          </>
                        )}
                        {/* Vertical drop into node */}
                        <div className="w-px h-6 bg-slate-300" />
                        <OrgChartNodeCard
                          relative={child}
                          onView={() => onViewRelative(child)}
                          onNavigate={onNavigateToResident ? () => onNavigateToResident(child.id) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── OTHER RELATIVES SECTION ─────────────────────────────────── */}
            {extended.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200/90 w-full flex flex-col items-center">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">
                  Other Relatives ({extended.length})
                </span>

                <div className="flex flex-wrap items-center justify-center gap-5">
                  {extended.map((ext) => (
                    <OrgChartNodeCard
                      key={ext.id}
                      relative={ext}
                      onView={() => onViewRelative(ext)}
                      onNavigate={onNavigateToResident ? () => onNavigateToResident(ext.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── EMPTY STATE IF NO ASSOCIATIONS AT ALL ───────────────────── */}
            {familyAssociations.length === 0 && (
              <div className="mt-8 flex flex-col items-center text-center max-w-sm">
                <div className="w-px h-8 bg-slate-300 mb-4" />
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center w-full">
                  <Users className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-2 text-xs font-semibold text-slate-800">
                    No Linked Family Members
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    This resident has no recorded relatives or household members yet.
                  </p>
                  {!readOnly && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      Link Relatives
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── View 2: Clean Roster List ─────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Household Members & Relatives Directory
            </h4>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name or relation..."
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
              {gridSearch && (
                <button
                  type="button"
                  onClick={() => setGridSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {filteredGridRelatives.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {gridSearch ? 'No matching records found.' : 'No family associations recorded.'}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGridRelatives.map((rel) => (
                <div
                  key={rel.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-400 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        {rel.relationshipType || 'Relative'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {rel.barangayIdNumber || '—'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Avatar
                        name={rel.fullName}
                        photoBase64={rel.photoBase64}
                        className="h-9 w-9 rounded-full border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-xs truncate" title={rel.fullName}>
                          {rel.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {rel.age ? `Age ${rel.age}` : 'Age —'} • {rel.gender || '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {rel.address || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToResident && rel.id) {
                          onNavigateToResident(rel.id)
                        } else {
                          onViewRelative(rel)
                        }
                      }}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 cursor-pointer text-xs"
                    >
                      <ExternalLink size={11} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Primary Resident Node Card — Anchor node of the organization tree */
function PrimaryResidentNodeCard({
  residentDetail,
  primaryPerson,
}: {
  residentDetail: ResidentDetailResponse
  primaryPerson: ResidentDetailResponse['personInfo']
}) {
  return (
    <div className="w-60 rounded-xl border-2 border-slate-900 bg-white p-3.5 shadow-sm text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
          PRIMARY RESIDENT
        </span>
        {residentDetail.isHeadOfFamily && (
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
            Head of Family
          </span>
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <Avatar
          name={primaryPerson?.fullName || 'Resident'}
          photoBase64={residentDetail.photoBase64}
          className="h-10 w-10 rounded-full border border-slate-200 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-xs truncate" title={primaryPerson?.fullName}>
            {primaryPerson?.fullName || 'Resident'}
          </p>
          <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
            {residentDetail.barangayIdNumber || 'No ID Number'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {primaryPerson?.age ? `Age ${primaryPerson.age}` : 'Age —'} • {primaryPerson?.gender || '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Individual Org Chart Relative Node Card */
function OrgChartNodeCard({
  relative,
  onView,
  onNavigate,
}: {
  relative: ResidentRelativeResponse
  onView: () => void
  onNavigate?: () => void
}) {
  return (
    <div
      onClick={onView}
      className="group w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer text-left"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
          {relative.relationshipType || 'Relative'}
        </span>
        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
          {relative.barangayIdNumber || '—'}
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <Avatar
          name={relative.fullName}
          photoBase64={relative.photoBase64}
          className="h-8.5 w-8.5 rounded-full border border-slate-200 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors" title={relative.fullName}>
            {relative.fullName}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {relative.age ? `Age ${relative.age}` : 'Age —'} • {relative.gender || '—'}
          </p>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end text-[10px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (onNavigate) {
              onNavigate()
            } else {
              onView()
            }
          }}
          className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ExternalLink size={10} />
          View Details
        </button>
      </div>
    </div>
  )
}
