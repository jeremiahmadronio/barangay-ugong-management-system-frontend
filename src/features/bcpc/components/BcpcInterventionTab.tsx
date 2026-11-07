import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ClipboardList,
  Plus,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import {
  bcpcApi,
  type BcpcIntervention,
  type BcpcReferral,
} from '@/api/modules/bcpc.api'
import { BcpcStartInterventionModal } from './BcpcStartInterventionModal'
import { BcpcAddInterventionProgressModal } from './BcpcAddInterventionProgressModal'

interface BcpcInterventionTabProps {
  caseId: string | number
  caseNumber?: string
  childName?: string
  childCategory?: string
}

interface ParsedProgressEntry {
  raw: string
  date?: string
  officer?: string
  status?: string
  content: string
}

export const BcpcInterventionTab: React.FC<BcpcInterventionTabProps> = ({
  caseId,
  caseNumber,
  childName,
  childCategory,
}) => {
  const [interventions, setInterventions] = useState<BcpcIntervention[]>([])
  const [referrals, setReferrals] = useState<BcpcReferral[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [activeInterventionForProgress, setActiveInterventionForProgress] =
    useState<BcpcIntervention | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [interventionsData, referralsData] = await Promise.all([
        bcpcApi.getInterventions(caseId).catch(() => [] as BcpcIntervention[]),
        bcpcApi.getReferrals(caseId).catch(() => [] as BcpcReferral[]),
      ])
      setInterventions(interventionsData || [])
      setReferrals(referralsData || [])
    } catch (err: any) {
      console.error('Failed to load interventions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const trimmed = dateStr.trim()
      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (isoMatch) {
        const [, y, m, d] = isoMatch
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      const d = new Date(trimmed)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Find if there's any accepted LSWDO feedback with recommendation
  const lswdoRecommendation = useMemo(() => {
    for (const ref of referrals) {
      const isLswdo =
        ref.referredTo?.toUpperCase().includes('LSWDO') ||
        ref.referredTo?.toUpperCase().includes('SOCIAL')
      if (isLswdo && ref.feedbacks && ref.feedbacks.length > 0) {
        const acceptedFb = ref.feedbacks.find((f) => f.acceptedByAgency)
        if (acceptedFb) {
          const rawRec =
            acceptedFb.recommendationType ||
            acceptedFb.details ||
            'Community-based intervention recommended'
          return {
            socialWorker: acceptedFb.socialWorkerName || 'Social Worker',
            date: acceptedFb.assessmentDate || acceptedFb.createdAt,
            type: acceptedFb.assessmentType || acceptedFb.feedbackTypeCode,
            recommendation: rawRec.replace(/_/g, ' '),
            discernment: acceptedFb.discernmentResult,
          }
        }
      }
    }
    return null
  }, [referrals])

  // Parse progress notes into structured cards
  const parseProgressNotes = (rawNotes?: string): ParsedProgressEntry[] => {
    if (!rawNotes || !rawNotes.trim()) return []
    const chunks = rawNotes.split(/\n\s*\n/)
    const parsed: ParsedProgressEntry[] = []

    for (const chunk of chunks) {
      const trimmed = chunk.trim()
      if (!trimmed) continue

      const headerMatch = trimmed.match(/^\[(.*?)\](?:\n+([\s\S]*))?$/)
      if (headerMatch) {
        const header = headerMatch[1].trim()
        const content = (headerMatch[2] || '').trim()

        // Robust match: [YYYY-MM-DD - Officer Name (STATUS)] or [Date - Officer Name]
        const headerPattern = /^(\d{4}-\d{2}-\d{2}|[^\-]+?)\s*-\s*(.*?)(?:\s*\((.*?)\))?$/
        const match = header.match(headerPattern)

        if (match) {
          const datePart = match[1]?.trim()
          const officerPart = match[2]?.trim()
          const statusPart = match[3]?.trim()

          parsed.push({
            raw: trimmed,
            date: datePart,
            officer: officerPart,
            status: statusPart,
            content: content || trimmed,
          })
        } else {
          parsed.push({
            raw: trimmed,
            content: content || trimmed,
          })
        }
      } else {
        parsed.push({
          raw: trimmed,
          content: trimmed,
        })
      }
    }

    return parsed.reverse()
  }

  const getProgressStatusBadge = (status?: string) => {
    const norm = (status || '').toUpperCase().trim()
    if (norm === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      )
    }
    if (norm === 'TERMINATED' || norm === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {norm === 'CANCELLED' ? 'Cancelled' : 'Terminated'}
        </span>
      )
    }
    if (norm === 'REVISED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Revised
        </span>
      )
    }
    if (norm === 'ONGOING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Ongoing
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        {status || 'Session Logged'}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const norm = (status || '').toUpperCase()
    if (norm === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      )
    }
    if (norm === 'REVISED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Revised
        </span>
      )
    }
    if (norm === 'TERMINATED' || norm === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {norm === 'CANCELLED' ? 'Cancelled' : 'Terminated'}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        Active Plan
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">Loading records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action button only when interventions exist */}
      {interventions.length > 0 && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsStartModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Intervention Program
          </button>
        </div>
      )}


      {/* Empty State matching Referrals Tab empty state */}
      {interventions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">
            No active intervention or monitoring plan recorded for this case.
          </p>
          <button
            type="button"
            onClick={() => setIsStartModalOpen(true)}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Start Intervention Plan
          </button>
        </div>
      ) : (
        /* Active Intervention Cards matching Custody & Referrals exactly */
        <div className="space-y-6">
          {interventions.map((intervention) => {
            const logs = parseProgressNotes(intervention.progressNotes)
            const isCancelled = (intervention.status || '').toUpperCase() === 'CANCELLED'
            const isActive =
              (intervention.status || '').toUpperCase() !== 'CANCELLED' &&
              (intervention.status || '').toUpperCase() !== 'COMPLETED' &&
              (intervention.status || '').toUpperCase() !== 'TERMINATED'

            return (
              <section
                key={intervention.id}
                className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-6 transition-colors hover:border-slate-300"
              >
                {/* Card Header matching Custody & Referral layout */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ClipboardList className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2
                          className={`text-sm font-semibold truncate ${
                            isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {intervention.programTitle}
                        </h2>
                        {getStatusBadge(intervention.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {intervention.interventionTypeDisplay ||
                          intervention.interventionType?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => setActiveInterventionForProgress(intervention)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Log Progress
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 1: Intervention Plan Details matching exact Custody <dl> style */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                    1. Program Details & Schedule
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        IMPLEMENTING AGENCY
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                        {intervention.facilitatorOrAgency || 'Barangay BCPC Committee'}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        PROGRAM DURATION
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                        {formatDateDisplay(intervention.startDate)} —{' '}
                        {intervention.endDate ? formatDateDisplay(intervention.endDate) : 'Continuous'}
                      </dd>
                    </div>

                    {intervention.description && (
                      <div className="min-w-0 sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          OBJECTIVES & ACTIVITIES
                        </dt>
                        <dd className="mt-1.5 break-words text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {intervention.description}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Section 2: Monitoring & Case Progress Records */}
                {logs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                      2. Monitoring & Progress Records
                    </h3>
                    <div className="space-y-4">
                      {logs.map((log, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-4 text-xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              {getProgressStatusBadge(log.status)}
                              {log.officer && (
                                <span className="text-xs font-medium text-slate-700">
                                  Conducted by <span className="font-semibold">{log.officer}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDateDisplay(log.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {log.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* Start Intervention Modal */}
      {isStartModalOpen && (
        <BcpcStartInterventionModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          onSuccess={() => {
            fetchData()
          }}
          caseId={caseId}
          caseNumber={caseNumber}
          childName={childName}
          childCategory={childCategory}
          suggestedFacilitator={
            lswdoRecommendation?.socialWorker
              ? `CSWDO / LSWDO (${lswdoRecommendation.socialWorker})`
              : 'Barangay BCPC Committee'
          }
        />
      )}

      {/* Add Progress Modal */}
      {activeInterventionForProgress && (
        <BcpcAddInterventionProgressModal
          isOpen={!!activeInterventionForProgress}
          onClose={() => setActiveInterventionForProgress(null)}
          onSuccess={() => {
            fetchData()
          }}
          caseId={caseId}
          caseNumber={caseNumber}
          intervention={activeInterventionForProgress}
        />
      )}
    </div>
  )
}
