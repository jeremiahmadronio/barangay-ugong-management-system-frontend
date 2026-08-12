import { useState, useEffect, useRef } from 'react'
import {
  X, Calendar, Clock, MapPin, AlertCircle, CheckCircle2,
  UserCheck, UserX, FileText, ChevronRight, Loader2, Plus, MessageSquare
} from 'lucide-react'
import { mediationApi, type MediationSession, type SessionMinutes, type SessionFollowUp } from '@/api/modules/mediation.api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}
function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return iso }
}
function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch { return iso }
}

const OUTCOME_LABEL: Record<string, string> = {
  SETTLED: 'Settled',
  FAILED: 'Not Settled',
  POSTPONED: 'Postponed',
}
const OUTCOME_COLOR: Record<string, string> = {
  SETTLED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  POSTPONED: 'bg-amber-50 text-amber-700 border-amber-200',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: MediationSession | null
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  isOpen: boolean
  /** readOnly = View Minutes mode (shows details + follow-ups). false = Record mode (form). */
  readOnly?: boolean
  onClose: () => void
  onSuccess: () => void
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW MODE — proper formatted view of minutes + follow-ups
// ══════════════════════════════════════════════════════════════════════════════

function ViewMinutesContent({
  session,
  caseNumber,
  natureOfComplaint,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  onClose,
}: {
  session: MediationSession
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  onClose: () => void
}) {
  const mins = session.minutes
  const [followUps, setFollowUps] = useState<SessionFollowUp[]>(session.followUps ?? [])
  const [newRemark, setNewRemark] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Re-load follow-ups from server (in case they changed)
  useEffect(() => {
    mediationApi.getFollowUps(session.id)
      .then(setFollowUps)
      .catch(() => {})
  }, [session.id])

  async function handleAddFollowUp() {
    if (!newRemark.trim()) return
    setIsAdding(true)
    setAddError(null)
    try {
      const added = await mediationApi.addFollowUp(session.id, { remarks: newRemark.trim() })
      setFollowUps(prev => [added, ...prev])
      setNewRemark('')
      setShowAddForm(false)
    } catch {
      setAddError('Failed to add follow-up. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const outcome = mins?.outcome ?? null

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Mediation #{session.hearingNumber} — Session Record
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {caseNumber ?? ''}{natureOfComplaint ? ` · ${natureOfComplaint}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 p-5 space-y-4 min-h-0">

        {/* Hearing info row */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hearing Details</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-blue-600">
              <FileText className="h-3.5 w-3.5" />
              Summon {session.hearingNumber}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {fmtDate(session.scheduledStart)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {fmtTime(session.scheduledStart)} – {fmtTime(session.scheduledEnd)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {session.venue}
            </span>
          </div>
        </div>

        {mins ? (
          <>
            {/* Attendance */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Attendance</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${mins.complainantPresent ? 'bg-blue-50/60 border-blue-100' : 'bg-red-50/40 border-red-100'}`}>
                  {mins.complainantPresent
                    ? <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    : <UserX className="h-4 w-4 text-red-400 shrink-0" />}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Complainant</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{complainantName}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${mins.complainantPresent ? 'text-blue-600' : 'text-red-500'}`}>
                      {mins.complainantPresent ? 'Present' : 'Absent'}
                    </p>
                  </div>
                </div>
                <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${mins.respondentPresent ? 'bg-blue-50/60 border-blue-100' : 'bg-red-50/40 border-red-100'}`}>
                  {mins.respondentPresent
                    ? <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    : <UserX className="h-4 w-4 text-red-400 shrink-0" />}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Respondent</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{respondentName}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${mins.respondentPresent ? 'text-blue-600' : 'text-red-500'}`}>
                      {mins.respondentPresent ? 'Present' : 'Absent'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hearing Notes */}
            {mins.hearingNotes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hearing Notes</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {mins.hearingNotes}
                </div>
              </div>
            )}

            {/* Outcome */}
            {outcome && (
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Outcome</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${OUTCOME_COLOR[outcome] ?? 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {outcome === 'SETTLED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {OUTCOME_LABEL[outcome] ?? outcome}
                </span>
              </div>
            )}

            {/* Settlement Terms */}
            {outcome === 'SETTLED' && mins.settlementTerms && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Settlement Agreement / Terms</p>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-900 whitespace-pre-wrap leading-relaxed font-medium">
                  {mins.settlementTerms}
                </div>
              </div>
            )}

            {/* Recorded at */}
            {mins.createdAt && (
              <p className="text-[10px] text-slate-400">
                Recorded on {fmtDateTime(mins.createdAt)}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
            <FileText className="h-8 w-8 stroke-1" />
            <p className="text-xs">No minutes recorded for this session.</p>
          </div>
        )}

        {/* ── Follow-Ups Section ────────────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Follow-Up Notes {followUps.length > 0 ? `(${followUps.length})` : ''}
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true)
                  setTimeout(() => textareaRef.current?.focus(), 50)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Follow-Up
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 space-y-2 mb-3">
              <textarea
                ref={textareaRef}
                rows={3}
                value={newRemark}
                onChange={e => setNewRemark(e.target.value)}
                placeholder="Enter follow-up notes or updates for this session..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
              {addError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{addError}
                </p>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewRemark(''); setAddError(null) }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddFollowUp}
                  disabled={isAdding || !newRemark.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {isAdding ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Follow-up list */}
          {followUps.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic px-1">No follow-ups recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {followUps.map((fu, i) => (
                <div key={fu.id ?? i} className="rounded-xl border border-slate-100 bg-white p-3 space-y-1">
                  <p className="text-xs text-slate-700 leading-relaxed">{fu.remarks}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    {fu.recordedBy && <span className="font-semibold text-slate-500">{fu.recordedBy}</span>}
                    {fu.createdAt && <span>{fmtDateTime(fu.createdAt)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// RECORD MODE — form to record new minutes
// ══════════════════════════════════════════════════════════════════════════════

function RecordMinutesContent({
  session,
  caseNumber,
  natureOfComplaint,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  onClose,
  onSuccess,
}: {
  session: MediationSession
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [complainantPresent, setComplainantPresent] = useState(true)
  const [respondentPresent, setRespondentPresent] = useState(true)
  const [hearingNotes, setHearingNotes] = useState('')
  const [outcome, setOutcome] = useState<'SETTLED' | 'FAILED'>('FAILED')
  const [settlementTerms, setSettlementTerms] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-populate if session already has minutes (editing)
  useEffect(() => {
    const m: SessionMinutes | undefined = session.minutes
    if (m) {
      setComplainantPresent(m.complainantPresent ?? true)
      setRespondentPresent(m.respondentPresent ?? true)
      setHearingNotes(m.hearingNotes ?? '')
      setOutcome(m.outcome === 'SETTLED' ? 'SETTLED' : 'FAILED')
      setSettlementTerms(m.settlementTerms ?? '')
    }
  }, [session])

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    try {
      await mediationApi.recordMinutes(session.id, {
        complainantPresent,
        respondentPresent,
        hearingNotes,
        outcome,
        settlementTerms: outcome === 'SETTLED' ? settlementTerms : undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save minutes')
    } finally {
      setIsSubmitting(false)
    }
  }

  function ToggleGroup({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
      <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${value ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Present
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${!value ? 'bg-red-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Absent
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Record Minutes — Mediation #{session.hearingNumber}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {caseNumber ?? ''}{natureOfComplaint ? ` · ${natureOfComplaint}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-5 space-y-5 min-h-0">
        {/* Hearing info */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mediation Information</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-semibold">Summon</p>
              <p className="font-bold text-blue-600 mt-0.5">Summon {session.hearingNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-semibold">Date</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />{fmtDate(session.scheduledStart)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-semibold">Time</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />{fmtTime(session.scheduledStart)} – {fmtTime(session.scheduledEnd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-semibold">Venue</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />{session.venue}
              </p>
            </div>
          </div>
        </div>

        {/* 1 Attendance */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1 Attendance</h4>
          <div className="rounded-xl border border-slate-100 bg-white divide-y divide-slate-100">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Complainant</p>
                <p className="text-xs text-slate-400">{complainantName}</p>
              </div>
              <ToggleGroup value={complainantPresent} onChange={setComplainantPresent} />
            </div>
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Respondent</p>
                <p className="text-xs text-slate-400">{respondentName}</p>
              </div>
              <ToggleGroup value={respondentPresent} onChange={setRespondentPresent} />
            </div>
          </div>
        </div>

        {/* 2 Hearing Notes */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2 Hearing Notes</h4>
          <textarea
            rows={4}
            value={hearingNotes}
            onChange={e => setHearingNotes(e.target.value)}
            placeholder="Brief summary of what transpired during the hearing..."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        {/* 3 Outcome */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3 Outcome</h4>
          <div className="space-y-2">
            {(['SETTLED', 'FAILED'] as const).map(opt => (
              <label key={opt} className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${outcome === opt ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input type="radio" name="outcome" checked={outcome === opt} onChange={() => setOutcome(opt)} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs">
                  <strong className="font-bold">{opt === 'SETTLED' ? 'Settled' : 'Not Settled'}</strong>
                  <span className="text-slate-400 font-normal ml-1">
                    {opt === 'SETTLED' ? '(proceed to close case)' : '— schedule next hearing'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 4 Settlement Agreement — animated show/hide */}
        {outcome === 'SETTLED' && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">4 Settlement Agreement / Terms</h4>
            <textarea
              rows={3}
              value={settlementTerms}
              onChange={e => setSettlementTerms(e.target.value)}
              placeholder="State the agreed settlement terms (e.g., Respondent agrees to pay ₱2,000 for damages before Aug 15)..."
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50/20 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {isSubmitting ? 'Saving...' : 'Save Minutes'}
        </button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main export — shell modal container
// ══════════════════════════════════════════════════════════════════════════════

export function RecordMinutesModal({
  session,
  caseNumber,
  natureOfComplaint,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  isOpen,
  readOnly = false,
  onClose,
  onSuccess,
}: Props) {
  if (!isOpen || !session) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {readOnly ? (
          <ViewMinutesContent
            session={session}
            caseNumber={caseNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onClose={onClose}
          />
        ) : (
          <RecordMinutesContent
            session={session}
            caseNumber={caseNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  )
}
