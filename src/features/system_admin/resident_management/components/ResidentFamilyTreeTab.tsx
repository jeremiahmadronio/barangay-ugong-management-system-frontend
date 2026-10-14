import { useState, useMemo } from 'react'
import {
  Users,
  GitBranch,
  LayoutGrid,
  Search,
  X,
  Heart,
  User,
  Eye,
  ExternalLink,
  Edit3,
} from 'lucide-react'
import { Avatar } from '@/components/ui/table/Avatar'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import type { ResidentDetailResponse, ResidentRelativeResponse } from '@/config/api/residents/residents.types'

interface ResidentFamilyTreeTabProps {
  residentDetail: ResidentDetailResponse
  onViewRelative: (relative: ResidentRelativeResponse) => void
  onNavigateToResident?: (residentId: number) => void
  onEdit?: () => void
  readOnly?: boolean
}

/** Categorize relatives into genealogical tiers */
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

function getRelationshipBadgeTone(type?: string): BadgeTone {
  const t = (type || '').toLowerCase()
  if (/father|mother|parent|guardian|grandfather|grandmother/.test(t)) return 'violet'
  if (/spouse|husband|wife|partner/.test(t)) return 'rose'
  if (/brother|sister|sibling/.test(t)) return 'amber'
  if (/son|daughter|child|kid|grandson|granddaughter/.test(t)) return 'emerald'
  return 'indigo'
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
      {/* ── Tab Subheader & Controls ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Family & Household Lineage
              </h3>
              <p className="text-xs text-slate-500">
                Visual relationship hierarchy and linked relatives for {primaryPerson?.fullName || 'Resident'}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Hierarchy Tree
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards Grid ({familyAssociations.length})
            </button>
          </div>

          {!readOnly && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit3 size={13} className="text-slate-500" />
              Edit Associations
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Stats Pills ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Total Linked</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{familyAssociations.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
          <p className="text-[11px] font-semibold tracking-wider text-violet-500 uppercase">Ascendants</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{parents.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
          <p className="text-[11px] font-semibold tracking-wider text-rose-500 uppercase">Spouse</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{spouse.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs">
          <p className="text-[11px] font-semibold tracking-wider text-amber-500 uppercase">Siblings</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{siblings.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold tracking-wider text-emerald-500 uppercase">Descendants</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{children.length}</p>
        </div>
      </div>

      {/* ── View 1: Tree Hierarchy ──────────────────────────────────────── */}
      {viewMode === 'tree' && (
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 p-6 sm:p-8 shadow-2xs overflow-x-auto">
          <div className="min-w-fit flex flex-col items-center">

            {/* LEVEL 1: Ascendants / Parents */}
            {parents.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200/80 px-3 py-1 text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                    Generation I • Ascendants / Parents ({parents.length})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
                  {parents.map((p) => (
                    <RelativeNodeCard
                      key={p.id}
                      relative={p}
                      onView={() => onViewRelative(p)}
                      onNavigate={onNavigateToResident ? () => onNavigateToResident(p.id) : undefined}
                    />
                  ))}
                </div>

                {/* Connecting stem down to Level 2 */}
                <div className="flex flex-col items-center my-3">
                  <div className="w-0.5 h-6 bg-slate-300" />
                  <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                  <div className="w-0.5 h-6 bg-slate-300" />
                </div>
              </div>
            )}

            {/* LEVEL 2: Current Generation (Siblings, Primary Resident, Spouse) */}
            <div className="flex flex-col items-center w-full">
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Generation II • Primary Resident & Immediate Household
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {/* Siblings on the left if any */}
                {siblings.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {siblings.map((sib) => (
                        <RelativeNodeCard
                          key={sib.id}
                          relative={sib}
                          onView={() => onViewRelative(sib)}
                          onNavigate={onNavigateToResident ? () => onNavigateToResident(sib.id) : undefined}
                        />
                      ))}
                    </div>
                    {/* Lateral connector to Primary Resident */}
                    <div className="hidden lg:flex items-center">
                      <div className="h-0.5 w-6 bg-slate-300" />
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Siblings
                      </span>
                      <div className="h-0.5 w-6 bg-slate-300" />
                    </div>
                  </div>
                )}

                {/* PRIMARY RESIDENT NODE (Focus) */}
                <div className="relative group rounded-2xl border-2 border-blue-500 bg-white p-4 sm:p-5 shadow-md ring-4 ring-blue-50/90 w-72 sm:w-80 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <Badge tone="indigo" className="font-bold">
                      <User size={12} className="inline mr-1" />
                      PRIMARY RESIDENT
                    </Badge>
                    <Badge tone={residentDetail.isHeadOfFamily ? 'emerald' : 'slate'}>
                      {residentDetail.isHeadOfFamily ? 'Head of Family' : 'Member'}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3">
                    <Avatar
                      name={primaryPerson?.fullName || 'Resident'}
                      photoBase64={residentDetail.photoBase64}
                      className="h-12 w-12 rounded-xl ring-2 ring-blue-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={primaryPerson?.fullName}>
                        {primaryPerson?.fullName || 'Resident'}
                      </h4>
                      <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                        {residentDetail.barangayIdNumber || 'No Barangay ID'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        {primaryPerson?.age && <span>Age {primaryPerson.age}</span>}
                        {primaryPerson?.gender && <span>• {primaryPerson.gender}</span>}
                        {primaryPerson?.civilStatus && <span>• {primaryPerson.civilStatus}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">
                      HH: {residentDetail.householdNumber || '—'}
                    </span>
                    <span className="font-medium text-emerald-600 capitalize">
                      {residentDetail.status.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Spouse on the right if any */}
                {spouse.length > 0 && (
                  <div className="flex items-center gap-3">
                    {/* Marriage / Partnership connector */}
                    <div className="hidden lg:flex items-center">
                      <div className="h-0.5 w-5 bg-rose-300" />
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <Heart size={10} className="fill-rose-500 text-rose-500" />
                        Spouse
                      </span>
                      <div className="h-0.5 w-5 bg-rose-300" />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {spouse.map((sp) => (
                        <RelativeNodeCard
                          key={sp.id}
                          relative={sp}
                          onView={() => onViewRelative(sp)}
                          onNavigate={onNavigateToResident ? () => onNavigateToResident(sp.id) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LEVEL 3: Descendants / Children */}
            {children.length > 0 && (
              <div className="flex flex-col items-center mt-3">
                {/* Connecting stem from Level 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-300" />
                  <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="w-0.5 h-6 bg-slate-300" />
                </div>

                <div className="my-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Generation III • Descendants / Children ({children.length})
                  </span>
                </div>

                {/* Branch line & Child cards */}
                <div className="relative pt-4">
                  {children.length > 1 && (
                    <div className="absolute top-0 left-12 right-12 h-0.5 bg-slate-300 hidden sm:block" />
                  )}

                  <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6">
                    {children.map((child) => (
                      <div key={child.id} className="flex flex-col items-center">
                        {children.length > 1 && (
                          <div className="w-0.5 h-4 bg-slate-300 hidden sm:block mb-1" />
                        )}
                        <RelativeNodeCard
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

            {/* LEVEL 4: Extended Relatives & Other Associations */}
            {extended.length > 0 && (
              <div className="flex flex-col items-center mt-10 pt-6 border-t border-slate-200/80 w-full">
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Extended Relatives & Household Associates ({extended.length})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  {extended.map((ext) => (
                    <RelativeNodeCard
                      key={ext.id}
                      relative={ext}
                      onView={() => onViewRelative(ext)}
                      onNavigate={onNavigateToResident ? () => onNavigateToResident(ext.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty Associations Notice */}
            {familyAssociations.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center max-w-md">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <h4 className="mt-2 text-sm font-bold text-slate-800">
                  No Family Associations Recorded
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  This resident has no linked household members or genealogical relatives. Click "Edit Associations" to add family links.
                </p>
                {!readOnly && onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    Link Family Members
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── View 2: Cards Grid View ─────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">
              Household & Familial Members Roster
            </h4>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, relation, ID..."
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-8 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
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
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                {gridSearch ? 'No Matching Relatives Found' : 'No Family Associations Linked'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {gridSearch
                  ? 'Try a different search term or clear the filter.'
                  : 'Link family members through the edit resident form.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGridRelatives.map((rel) => {
                const tone = getRelationshipBadgeTone(rel.relationshipType)
                return (
                  <div
                    key={rel.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 hover:border-blue-200 hover:bg-white transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100/80 pb-2.5 mb-2.5">
                        <Badge tone={tone}>
                          {rel.relationshipType || 'Relative'}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {rel.barangayIdNumber || '—'}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <Avatar
                          name={rel.fullName}
                          photoBase64={rel.photoBase64}
                          className="h-11 w-11 rounded-xl shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate" title={rel.fullName}>
                            {rel.fullName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {rel.age ? `Age ${rel.age}` : 'Age —'} • {rel.gender || '—'} • {rel.civilStatus || '—'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {rel.address || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onViewRelative(rel)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        <Eye size={13} />
                        View Details
                      </button>

                      {onNavigateToResident && rel.id && (
                        <button
                          type="button"
                          onClick={() => onNavigateToResident(rel.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          Full Profile
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Individual relative node card in the tree view */
function RelativeNodeCard({
  relative,
  onView,
  onNavigate,
}: {
  relative: ResidentRelativeResponse
  onView: () => void
  onNavigate?: () => void
}) {
  const tone = getRelationshipBadgeTone(relative.relationshipType)

  return (
    <div
      onClick={onView}
      className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer w-64 sm:w-72"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
        <Badge tone={tone} className="font-semibold">
          {relative.relationshipType || 'Relative'}
        </Badge>
        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[100px]">
          {relative.barangayIdNumber || '—'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <Avatar
          name={relative.fullName}
          photoBase64={relative.photoBase64}
          className="h-10 w-10 rounded-xl shrink-0 group-hover:ring-2 group-hover:ring-blue-100 transition-all"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors" title={relative.fullName}>
            {relative.fullName}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
            {relative.age && <span>Age {relative.age}</span>}
            {relative.gender && <span>• {relative.gender}</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {relative.address || relative.householdNumber ? `HH: ${relative.householdNumber || relative.address}` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
          <Eye size={12} />
          Details
        </span>
        {onNavigate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate()
            }}
            className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            <ExternalLink size={11} />
            Open
          </button>
        )}
      </div>
    </div>
  )
}
