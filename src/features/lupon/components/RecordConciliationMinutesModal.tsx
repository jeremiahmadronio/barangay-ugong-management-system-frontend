import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
  Save,
  MessageSquare,
  Loader2,
  Users,
  Scale,
  Plus,
} from 'lucide-react'
import {
  luponApi,
  type ConciliationSession,
  type PanelAttendanceResponse,
} from '@/api/modules/lupon.api'
import type { SessionMinutes, SessionFollowUp } from '@/api/modules/mediation.api'

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
  session: ConciliationSession | null
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  isOpen: boolean
  readOnly?: boolean
  onClose: () => void
  onSuccess: () => void
}

// ── Sleek Compact Pill Toggle (Present / Absent) ─────────────────────────────

function ToggleGroup({
  value,
  onChange,
  disabled,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 shrink-0 border border-slate-200/60">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
          value
            ? 'bg-blue-600 text-white shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Present
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
          !value
            ? 'bg-red-500 text-white shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Absent
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW MODE — Clean & Balanced
// ══════════════════════════════════════════════════════════════════════════════

function ViewConciliationMinutesContent({
  session,
  caseNumber,
  natureOfComplaint,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  onClose,
}: {
  session: ConciliationSession
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'minutes' | 'followups'>('minutes')
  const mins = session.minutes
  const [followUps, setFollowUps] = useState<SessionFollowUp[]>(session.followUps ?? [])
  const [newRemark, setNewRemark] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const outcome = mins?.outcome ?? null

  // Re-load follow-ups dynamically from server
  useEffect(() => {
    luponApi.getFollowUps(session.id)
      .then(setFollowUps)
      .catch(() => {})
  }, [session.id])

  async function handleAddFollowUp() {
    if (!newRemark.trim()) return
    setIsAdding(true)
    setAddError(null)
    try {
      const added = await luponApi.addFollowUp(session.id, { remarks: newRemark.trim() })
      setFollowUps(prev => [added, ...prev])
      setNewRemark('')
      setShowAddForm(false)
    } catch {
      setAddError('Failed to add follow-up remarks. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Session Record — {session.sessionTitle || `Conciliation Hearing #${session.hearingNumber}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {caseNumber ? `Case ${caseNumber}` : ''}{natureOfComplaint ? ` · ${natureOfComplaint}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
        {[
          { id: 'minutes', label: '1. Proceedings & Outcome', icon: FileText },
          { id: 'followups', label: `2. Follow-Up Notes (${followUps.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: MINUTES & OUTCOME */}
        {activeTab === 'minutes' && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* Clean Neutral Hearing Details Banner */}
            <div className="px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hearing</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{session.sessionTitle || `Hearing ${session.hearingNumber}`}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {fmtDate(session.scheduledStart)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  {fmtTime(session.scheduledStart)} – {fmtTime(session.scheduledEnd)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Venue</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  {session.venue}
                </p>
              </div>
            </div>

            {mins ? (
              <>
                {/* Hearing Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hearing Notes & Proceedings</label>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {mins.hearingNotes || 'No notes recorded.'}
                  </div>
                </div>

                {/* Outcome */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hearing Outcome</label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-bold text-slate-700">Result:</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1 text-xs font-bold ${OUTCOME_COLOR[outcome ?? ''] ?? 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      {outcome === 'SETTLED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {OUTCOME_LABEL[outcome ?? ''] ?? outcome}
                    </span>
                  </div>
                </div>

                {/* Settlement Agreement */}
                {outcome === 'SETTLED' && mins.settlementTerms && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Settlement Agreement / Kasunduan</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {mins.settlementTerms}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                {mins.createdAt && (
                  <p className="text-[11px] text-slate-400">
                    Recorded on {fmtDateTime(mins.createdAt)}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <FileText className="h-8 w-8 stroke-1" />
                <p className="text-xs">No minutes recorded yet for this session.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FOLLOW-UPS */}
        {activeTab === 'followups' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-700">Follow-Up Remarks & Post-Hearing Notes</h3>
                <p className="text-[11px] text-slate-400">Record subsequent updates, calls, or status checks related to this conciliation session.</p>
              </div>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Add Follow-Up
                </button>
              )}
            </div>

            {/* Inline Add Follow-Up Form */}
            {showAddForm && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700">
                  New Follow-Up Remark <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="Enter detailed follow-up remarks, actions taken, or party responses..."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
                />
                {addError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {addError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewRemark('')
                      setAddError(null)
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAdding || !newRemark.trim()}
                    onClick={handleAddFollowUp}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>{isAdding ? 'Saving…' : 'Save Remark'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Follow-up notes list */}
            {followUps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <MessageSquare className="h-7 w-7 stroke-1 text-slate-300" />
                <p className="text-xs">No follow-up notes recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {followUps.map((fu, i) => (
                  <div key={fu.id ?? i} className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5 shadow-2xs">
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{fu.remarks}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      {fu.recordedBy && <span className="font-semibold text-slate-600">{fu.recordedBy}</span>}
                      {fu.createdAt && <span>{fmtDateTime(fu.createdAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// RECORD MODE — Ultra-Clean Typography & Balanced Spacing
// ══════════════════════════════════════════════════════════════════════════════

function RecordConciliationMinutesContent({
  session,
  caseNumber,
  natureOfComplaint,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  onClose,
  onSuccess,
}: {
  session: ConciliationSession
  caseNumber?: string
  natureOfComplaint?: string
  complainantName?: string
  respondentName?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'minutes'>('attendance')
  const [complainantPresent, setComplainantPresent] = useState(true)
  const [respondentPresent, setRespondentPresent] = useState(true)
  const [panelMembers, setPanelMembers] = useState<PanelAttendanceResponse[]>([])
  const [panelAttendance, setPanelAttendance] = useState<Record<number, boolean>>({})
  const [hearingNotes, setHearingNotes] = useState('')
  const [outcome, setOutcome] = useState<'SETTLED' | 'FAILED'>('FAILED')
  const [settlementTerms, setSettlementTerms] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ((!complainantPresent || !respondentPresent) && outcome === 'SETTLED') {
      setOutcome('FAILED')
    }
  }, [complainantPresent, respondentPresent, outcome])

  // Load existing data or pangkat members
  useEffect(() => {
    const m: SessionMinutes | undefined = session.minutes
    if (m) {
      setComplainantPresent(m.complainantPresent ?? true)
      setRespondentPresent(m.respondentPresent ?? true)
      setHearingNotes(m.hearingNotes ?? '')
      setOutcome(m.outcome === 'SETTLED' ? 'SETTLED' : 'FAILED')
      setSettlementTerms(m.settlementTerms ?? '')
    }

    if (session.panelAttendances && session.panelAttendances.length > 0) {
      setPanelMembers(session.panelAttendances)
      const map: Record<number, boolean> = {}
      session.panelAttendances.forEach(pa => {
        map[pa.panelMemberId] = Boolean(pa.isPresent)
      })
      setPanelAttendance(map)
    } else if (session.caseId) {
      luponApi.getPangkatMembers(session.caseId).then(members => {
        setPanelMembers(members)
        const map: Record<number, boolean> = {}
        members.forEach(m => {
          map[m.id || m.panelMemberId] = true
        })
        setPanelAttendance(map)
      }).catch(() => {
        setPanelMembers([])
      })
    }
  }, [session])

  function handlePanelToggle(memberId: number, isPres: boolean) {
    setPanelAttendance(prev => ({
      ...prev,
      [memberId]: isPres,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hearingNotes.trim()) {
      setActiveTab('minutes')
      setError('Please provide hearing notes summarizing the proceedings.')
      return
    }
    if (outcome === 'SETTLED' && !settlementTerms.trim()) {
      setActiveTab('minutes')
      setError('Please state the agreed settlement terms.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await luponApi.recordMinutes(session.id, {
        complainantPresent,
        respondentPresent,
        hearingNotes: hearingNotes.trim(),
        outcome,
        settlementTerms: outcome === 'SETTLED' ? settlementTerms.trim() : undefined,
        panelAttendance,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save conciliation minutes')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Record Minutes — {session.sessionTitle || `Conciliation Hearing #${session.hearingNumber}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {caseNumber ? `Case ${caseNumber}` : ''}{natureOfComplaint ? ` · ${natureOfComplaint}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs matching EditCaseModal */}
      <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
        {[
          { id: 'attendance', label: '1. Hearing Details & Attendance', icon: Users },
          { id: 'minutes', label: '2. Proceedings, Outcome & Settlement', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* TAB 1: ATTENDANCE & DETAILS */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* Clean Neutral Hearing Details Banner */}
            <div className="px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Hearing</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{session.sessionTitle || `Hearing ${session.hearingNumber}`}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {fmtDate(session.scheduledStart)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  {fmtTime(session.scheduledStart)} – {fmtTime(session.scheduledEnd)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Venue</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  {session.venue}
                </p>
              </div>
            </div>

            {/* 1. Parties Attendance */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                1. Parties Attendance <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Complainant Card */}
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">{complainantName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Complainant</p>
                  </div>
                  <ToggleGroup value={complainantPresent} onChange={setComplainantPresent} />
                </div>

                {/* Respondent Card */}
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">{respondentName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Respondent</p>
                  </div>
                  <ToggleGroup value={respondentPresent} onChange={setRespondentPresent} />
                </div>
              </div>
            </div>

            {/* 2. Pangkat Tagapagkasundo Attendance (With Clean Space between 1 and 2) */}
            {panelMembers.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  2. Pangkat Tagapagkasundo Attendance <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {panelMembers.map((m) => {
                    const mId = m.panelMemberId || (m as any).id
                    const isPres = Boolean(panelAttendance[mId] ?? true)
                    const posLabel =
                      m.position === 'CHAIRMAN'
                        ? 'Pangkat Chairman'
                        : m.position === 'SECRETARY'
                        ? 'Pangkat Secretary'
                        : 'Pangkat Member'

                    return (
                      <div key={mId} className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{m.officerName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{posLabel}</p>
                        </div>
                        <ToggleGroup
                          value={isPres}
                          onChange={(v) => handlePanelToggle(mId, v)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MINUTES & OUTCOME */}
        {activeTab === 'minutes' && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* Hearing Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Hearing Notes & Proceedings <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={hearingNotes}
                onChange={e => setHearingNotes(e.target.value)}
                placeholder="Brief summary of what transpired during the conciliation hearing..."
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
              />
            </div>

            {/* Outcome — Compact horizontal cards */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Hearing Outcome <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const bothPresent = complainantPresent && respondentPresent;
                  return (['SETTLED', 'FAILED'] as const).map(opt => {
                    const isDisabled = opt === 'SETTLED' && !bothPresent;
                    const isSelected = outcome === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50/40 shadow-2xs cursor-pointer'
                            : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="radio"
                          name="outcome"
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={() => setOutcome(opt)}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800">{opt === 'SETTLED' ? 'Settled' : 'Not Settled'}</span>
                          <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                            {opt === 'SETTLED'
                              ? bothPresent
                                ? '(Close case in Lupon)'
                                : '— Both parties required'
                              : '(Schedule next hearing)'}
                          </span>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Settlement Terms (if Settled) */}
            {outcome === 'SETTLED' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700">
                  Settlement Agreement / Kasunduan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={settlementTerms}
                  onChange={e => setSettlementTerms(e.target.value)}
                  placeholder="State the agreed settlement terms before the Pangkat Tagapagkasundo..."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none"
                />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Saving Minutes…' : 'Save Minutes'}</span>
          </button>
        </div>
      </form>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main export — spacious max-w-4xl modal container
// ══════════════════════════════════════════════════════════════════════════════

export function RecordConciliationMinutesModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {readOnly ? (
          <ViewConciliationMinutesContent
            session={session}
            caseNumber={caseNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onClose={onClose}
          />
        ) : (
          <RecordConciliationMinutesContent
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
