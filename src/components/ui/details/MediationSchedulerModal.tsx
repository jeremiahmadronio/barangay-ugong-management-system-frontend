import { useState, useMemo } from 'react'
import { X, MapPin, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { blotterService } from '@/config/api/blotter/blotter.service'
import type { ScheduleMediationPayload } from '@/config/api/blotter/blotter.types'

// ─── Constants ───────────────────────────────────────────────────────────────

const VENUE_OPTIONS = [
  'Office of Kapitana',
  'Lupon',
  'Barangay Hall',
  'Multi-Purpose Hall',
  'Barangay Health Center',
]

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function formatLocalDateTime(date: Date, time: string): string {
  const [h, m] = time.split(':')
  const d = new Date(date)
  d.setHours(Number(h), Number(m), 0, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  caseId: number | string
  hearingNumber: number
  isConciliation?: boolean
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MediationSchedulerModal({
  caseId,
  hearingNumber,
  isConciliation = false,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [venue, setVenue] = useState(isConciliation ? 'Lupon' : VENUE_OPTIONS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d))
    }
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [viewYear, viewMonth],
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const endBeforeStart = useMemo(
    () => parseTime(endTime) <= parseTime(startTime),
    [startTime, endTime],
  )

  const canSubmit =
    selectedDate !== null &&
    !isPast(selectedDate) &&
    !endBeforeStart &&
    venue.trim().length > 0

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedDate || !canSubmit) return
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: ScheduleMediationPayload = {
        scheduledStart: formatLocalDateTime(selectedDate, startTime),
        scheduledEnd: formatLocalDateTime(selectedDate, endTime),
        venue,
      }
      await blotterService.scheduleMediationSession(caseId, payload)
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[MediationSchedulerModal] Schedule failed:', msg)
      setError(`Failed to schedule session: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isConciliation
                ? `Schedule Conciliation Hearing #${hearingNumber}`
                : `Schedule Mediation #${hearingNumber}`}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Pick a date, set a time, then confirm. You can generate the
              summon letter (Paanyaya) manually afterwards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row gap-0 p-6 pt-4">

          {/* ── LEFT: Calendar ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Month nav */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-slate-900">{monthLabel}</span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {DAYS.map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />
                const past = isPast(date)
                const todayCell = isToday(date)
                const selected = selectedDate && isSameDay(date, selectedDate)

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={past}
                    onClick={() => setSelectedDate(date)}
                    className={[
                      'mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      past
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'hover:bg-blue-50 cursor-pointer',
                      selected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : todayCell
                          ? 'border-2 border-blue-400 text-blue-600'
                          : 'text-slate-700',
                    ].join(' ')}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: Date info + form ─────────────────────────────────────── */}
          <div className="sm:w-60 sm:ml-6 mt-4 sm:mt-0 space-y-3">
            {/* Selected Date card */}
            {selectedDate ? (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Selected Date
                </p>
                <p className="text-sm font-bold text-blue-800 mt-0.5">
                  {formatFullDate(selectedDate)}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  ← Pick a date from the calendar
                </p>
              </div>
            )}

            {/* Conflict check */}
            {selectedDate && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs font-medium text-emerald-700">No conflicts on this date</p>
              </div>
            )}

            {/* Time range */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Time Range <span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-slate-400 text-xs shrink-0">–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              {endBeforeStart && (
                <div className="mt-1.5 rounded-lg border border-red-100 bg-red-50 p-2 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600">End time must be after start time.</p>
                </div>
              )}
            </div>

            {/* Venue */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Venue <span className="text-red-500">*</span>
              </p>
              <select
                value={venue}
                onChange={e => setVenue(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
              >
                {VENUE_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={[
                'w-full rounded-xl py-2.5 text-sm font-bold transition-all',
                canSubmit && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                  : 'bg-blue-200 text-blue-400 cursor-not-allowed',
              ].join(' ')}
            >
              {isSubmitting
                ? 'Scheduling…'
                : isConciliation
                ? 'Schedule Conciliation Hearing'
                : 'Schedule Mediation'}
            </button>

            {/* Note */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Ang Paanyaya (summon letter) ay maaari mong i-download o i-print sa{' '}
              {isConciliation ? 'Conciliation' : 'Mediation'} table pagkatapos mag-schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
