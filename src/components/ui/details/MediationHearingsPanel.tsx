import { useEffect, useState, useCallback } from 'react'
import { CalendarClock, Plus, XCircle, Calendar, Clock, MapPin, Printer, ChevronRight, FileText } from 'lucide-react'
import { mediationApi, type MediationSession } from '@/api/modules/mediation.api'
import { MediationSchedulerModal } from './MediationSchedulerModal'
import { RecordMinutesModal } from './RecordMinutesModal'
import { PaanyayaModal } from './PaanyayaModal'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { LoadingState } from '@/components/ui/LoadingState'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'

function formatSessionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatSessionTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: MediationSession['status'] }) {
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-600 border-blue-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
    RESCHEDULED: 'bg-amber-50 text-amber-700 border-amber-100',
    PENDING_MINUTES: 'bg-violet-50 text-violet-700 border-violet-100',
  }
  const labels: Record<string, string> = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    RESCHEDULED: 'RESCHEDULED',
    PENDING_MINUTES: 'PENDING MINUTES',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${styles[status] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

interface Props {
  caseId: number | string
  caseNumber?: string
  dateFiled?: string
  complainantName?: string
  respondentName?: string
  natureOfComplaint?: string
  isTerminal?: boolean
  isConciliation?: boolean
  onSessionChange?: () => void
}

export function MediationHearingsPanel({
  caseId,
  caseNumber,
  dateFiled,
  complainantName,
  respondentName,
  natureOfComplaint,
  isTerminal = false,
  isConciliation = false,
  onSessionChange,
}: Props) {
  const [sessions, setSessions] = useState<MediationSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [sessionToCancel, setSessionToCancel] = useState<MediationSession | null>(null)
  const { showFeedback, feedbackDialogProps } = useDialogs()
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'

  // Modals
  const [paanyayaSession, setPaanyayaSession] = useState<MediationSession | null>(null)
  const [minutesSession, setMinutesSession] = useState<MediationSession | null>(null)
  const [isMinutesReadOnly, setIsMinutesReadOnly] = useState(false)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await mediationApi.getSessions(caseId)
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => { loadSessions() }, [loadSessions])

  async function handleConfirmCancel() {
    if (!sessionToCancel) return
    const sessionId = Number(sessionToCancel.id)
    const hearingNum = sessionToCancel.hearingNumber
    const typeLabel = isConciliation ? 'Conciliation' : 'Mediation'
    setCancellingId(sessionId)
    try {
      const updated = await mediationApi.cancelSession(sessionId)
      setSessions(prev => prev.map(s => (s.id === sessionId ? updated : s)))
      setSessionToCancel(null)
      onSessionChange?.()
      showFeedback({
        variant: 'success',
        title: `${typeLabel} Hearing Cancelled`,
        description: `${typeLabel} Hearing #${hearingNum} has been successfully cancelled.`,
      })
    } catch {
      showFeedback({
        variant: 'error',
        title: 'Cancellation Failed',
        description: `Failed to cancel ${typeLabel.toLowerCase()} hearing session. Please try again.`,
      })
    } finally {
      setCancellingId(null)
    }
  }

  const nextHearingNumber = isConciliation
    ? sessions.filter(s => s.hearingType === 'CONCILIATION').length + 1
    : sessions.filter(s => s.hearingType !== 'CONCILIATION').length + 1

  const hasActiveHearing = sessions.some(
    (s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && !s.hasMinutes
  )

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isConciliation ? 'Conciliation Hearings' : 'Mediation Hearings'}
            </h3>
          </div>
          {!isTerminal && !isSystemAdmin && !hasActiveHearing && (
            <button
              type="button"
              onClick={() => setIsSchedulerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {isConciliation ? 'Schedule Conciliation Hearing' : 'Schedule New Mediation'}
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState message="Loading mediation sessions…" variant="inline" size="md" />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Calendar className="h-10 w-10 stroke-1" />
            <p className="text-sm">No hearings scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isScheduled = session.status === 'SCHEDULED'
              const isCompleted = session.status === 'COMPLETED' || session.hasMinutes

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    session.status === 'CANCELLED'
                      ? 'border-slate-100 bg-slate-50/40 opacity-70'
                      : 'border-slate-100 bg-slate-50/60'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {session.sessionTitle ||
                          (session.hearingType === 'CONCILIATION'
                            ? `Conciliation Hearing ${session.hearingNumber}`
                            : `Mediation ${session.hearingNumber}`)}
                      </span>
                      <StatusBadge status={session.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        {formatSessionDate(session.scheduledStart)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        {formatSessionTime(session.scheduledStart)} – {formatSessionTime(session.scheduledEnd)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        {session.venue}
                      </span>
                    </div>

                    {session.notes?.trim() && (
                      <p className="text-[11px] text-slate-500 bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 mt-1 leading-relaxed">
                        {session.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions matching screenshot */}
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {/* Paanyaya button */}
                    <button
                      type="button"
                      onClick={() => setPaanyayaSession(session)}
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Paanyaya
                    </button>

                    {/* Cancel Mediation button */}
                    {isScheduled && !isTerminal && !isSystemAdmin && (
                      <>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSessionToCancel(session)}
                          disabled={cancellingId === Number(session.id)}
                          className="inline-flex items-center gap-1 font-semibold text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {cancellingId === Number(session.id) ? 'Cancelling…' : `Cancel ${isConciliation ? 'Conciliation' : 'Mediation'}`}
                        </button>
                      </>
                    )}

                    {/* Record Minutes / View Minutes button */}
                    {session.status !== 'CANCELLED' && (
                      <>
                        <span className="text-slate-300">|</span>
                        {isCompleted || isSystemAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMinutesSession(session)
                              setIsMinutesReadOnly(true)
                            }}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Minutes
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : !isTerminal ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMinutesSession(session)
                              setIsMinutesReadOnly(false)
                            }}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Record Minutes
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Cancelling Hearing Session */}
      <ConfirmationDialog
        open={!!sessionToCancel}
        title={`Cancel ${isConciliation ? 'Conciliation' : 'Mediation'} Hearing`}
        description={`Are you sure you want to cancel ${isConciliation ? 'Conciliation' : 'Mediation'} Hearing #${sessionToCancel?.hearingNumber}? This action will mark the session as cancelled.`}
        tone="danger"
        confirmLabel="Yes, Cancel Hearing"
        cancelLabel="Keep Hearing"
        isLoading={cancellingId !== null}
        onConfirm={handleConfirmCancel}
        onCancel={() => setSessionToCancel(null)}
      />

      {/* Scheduler Modal */}
      <MediationSchedulerModal
        caseId={caseId}
        hearingNumber={nextHearingNumber}
        isConciliation={isConciliation}
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onSuccess={() => {
          loadSessions()
          onSessionChange?.()
        }}
      />

      {/* Record / View Minutes Modal */}
      <RecordMinutesModal
        session={minutesSession}
        caseNumber={caseNumber}
        natureOfComplaint={natureOfComplaint}
        complainantName={complainantName}
        respondentName={respondentName}
        isOpen={!!minutesSession}
        readOnly={isMinutesReadOnly || isSystemAdmin}
        onClose={() => setMinutesSession(null)}
        onSuccess={() => {
          loadSessions()
          onSessionChange?.()
        }}
      />

      {/* Paanyaya Document Modal */}
      <PaanyayaModal
        session={paanyayaSession}
        caseNumber={caseNumber}
        dateFiled={dateFiled}
        complainantName={complainantName}
        respondentName={respondentName}
        natureOfComplaint={natureOfComplaint}
        isConciliation={isConciliation}
        isOpen={!!paanyayaSession}
        onClose={() => setPaanyayaSession(null)}
      />

      {/* Feedback Dialog for Success/Error Notification */}
      <FeedbackDialog {...feedbackDialogProps} />
    </>
  )
}
