import { useState, useEffect, useCallback } from 'react'
import {
  History,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  FileCheck2,
  Scale,
  XCircle,
  ArrowRightCircle,
} from 'lucide-react'
import { DetailEmptyPanel } from './DetailEmptyPanel'
import { LoadingState } from '../LoadingState'
import { blotterService } from '@/config/api/blotter/blotter.service'
import type { TimelineEventResponse } from '@/config/api/blotter/blotter.types'

export interface DetailTimelineItem {
  id: string
  title: string
  timestamp?: string
  description?: string
  performedBy?: string
}

export interface DetailTimelinePanelProps {
  caseId?: number | string
  items?: DetailTimelineItem[]
  onFetchTimeline?: (caseId: number | string) => Promise<TimelineEventResponse[]>
  emptyTitle?: string
  emptyDescription?: string
}

function formatTimelineDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString

    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${datePart} at ${timePart}`
  } catch {
    return isoString
  }
}

function formatTimelineTitle(rawTitle: string): string {
  if (!rawTitle) return ''
  let t = rawTitle

  // BCPC titles cleanup (convert ALL CAPS to clean Title Case)
  if (/INTER-AGENCY REFERRAL ISSUED/i.test(t)) {
    const agencyMatch = t.match(/\(([^)]+)\)/)
    return agencyMatch ? `Inter-Agency Referral Issued (${agencyMatch[1].trim()})` : 'Inter-Agency Referral Issued'
  }
  if (/CUSTODY\s*\/\s*TURNOVER COMPLETED|CICL PHYSICAL TURNOVER COMPLETED/i.test(t)) {
    return 'Custody / Turnover Completed'
  }
  if (/NEW TURNOVER RECORDED/i.test(t)) {
    return 'Turnover Record Added'
  }
  if (/TURNOVER RECORD UPDATED/i.test(t)) {
    return 'Turnover Record Updated'
  }
  if (/REFERRAL FEEDBACK RECORDED/i.test(t)) {
    const ctrlMatch = t.match(/\(([^)]+)\)/)
    return ctrlMatch ? `Referral Feedback Received (${ctrlMatch[1].trim()})` : 'Referral Feedback Received'
  }
  if (/REFERRAL CANCELLED/i.test(t)) {
    const ctrlMatch = t.match(/\(([^)]+)\)/)
    return ctrlMatch ? `Referral Cancelled (${ctrlMatch[1].trim()})` : 'Referral Cancelled'
  }
  if (/CICL APPREHENSION RECORDED/i.test(t)) {
    return 'Child Apprehension Recorded'
  }
  if (/CICL CUSTODY RESOLVED/i.test(t)) {
    return 'Custody Resolved: Not in Custody'
  }

  // Specific common status change event strings
  if (/EXPIRED_UNACTIONED/i.test(t)) return 'Case Expired (Unactioned)'
  if (/CERTIFIED_TO_FILE_ACTION|CFA_ISSUED/i.test(t)) return 'Certificate to File Action (CFA) Issued'
  if (/UNDER_CONCILIATION/i.test(t)) return 'Referred to Lupon Conciliation'
  if (/UNDER_MEDIATION/i.test(t)) return 'Mediation Proceedings Initiated'
  if (/REFERRED_TO_LUPON/i.test(t)) return 'Case Escalated to Lupon'
  if (/SETTLED/i.test(t)) return 'Case Amicably Settled'
  if (/DISMISSED/i.test(t)) return 'Case Dismissed'
  if (/WITHDRAWN/i.test(t)) return 'Case Withdrawn by Complainant'
  if (/REOPENED/i.test(t)) return 'Case Re-opened for New Cycle'

  // Generic enum cleanups
  t = t.replace(/EXPIRED_UNACTIONED/gi, 'Expired Unactioned')
  t = t.replace(/CERTIFIED_TO_FILE_ACTION/gi, 'Certified to File Action')
  t = t.replace(/CFA_ISSUED/gi, 'CFA Issued')
  t = t.replace(/UNDER_MEDIATION/gi, 'Under Mediation')
  t = t.replace(/UNDER_CONCILIATION/gi, 'Under Conciliation')
  t = t.replace(/REFERRED_TO_LUPON/gi, 'Referred to Lupon')
  t = t.replace(/ON_GOING/gi, 'On Going')
  t = t.replace(/IN_PROGRESS/gi, 'In Progress')
  t = t.replace(/SETTLED/gi, 'Settled')
  t = t.replace(/DISMISSED/gi, 'Dismissed')
  t = t.replace(/WITHDRAWN/gi, 'Withdrawn')
  t = t.replace(/RECORDED/gi, 'Recorded')

  return t
}

function summarizeBcpcDescription(desc: string): string {
  // 1. Referral Issued key-value dump -> Clean 1-sentence summary
  if (desc.includes('Referred Agency:') || desc.includes('Control No:') || desc.includes('Referred To:')) {
    const agencyMatch = desc.match(/Referred (?:Agency|To):\s*([^\n]+)/i)
    const purposeMatch = desc.match(/Purpose:\s*([^\n]+)/i)

    const agency = agencyMatch ? agencyMatch[1].trim() : ''
    const purpose = purposeMatch ? purposeMatch[1].trim() : ''

    let summary = 'Issued inter-agency referral'
    if (agency && agency !== '—') summary += ` to ${agency}`
    if (purpose && purpose !== '—') summary += ` for ${purpose}`
    summary += '.'
    return summary
  }

  // 2. Custody / Turnover key-value dump -> Clean 1-sentence summary
  if (desc.includes('Destination:') || desc.includes('Receiving person:') || desc.includes('Turned Over To:')) {
    const destMatch = desc.match(/(?:Destination|Turned Over To):\s*([^\n]+)/i)
    const personMatch = desc.match(/(?:Receiving person|Recipient):\s*([^\n]+)/i)
    const roleMatch = desc.match(/(?:Role|Relationship):\s*([^\n]+)/i)
    const dateMatch = desc.match(/Date:\s*([^\n]+)/i)

    const destination = destMatch ? destMatch[1].trim() : ''
    const person = personMatch ? personMatch[1].trim() : ''
    const role = roleMatch ? roleMatch[1].trim() : ''
    const date = dateMatch ? dateMatch[1].trim() : ''

    if (destination.toLowerCase().includes('temporarily staying')) {
      return 'Child temporarily accommodated at the barangay while awaiting turnover.'
    }

    let summary = 'Child turned over'
    if (person && person !== '—') {
      summary += ` to ${person}`
      if (role && role !== '—') summary += ` (${role})`
    } else if (destination && destination !== '—') {
      summary += ` to ${destination}`
    }
    if (date && date !== '—') {
      summary += ` on ${date}`
    }
    summary += '.'
    return summary
  }

  // 3. Referral Feedback dump -> Clean 1-sentence summary
  if (desc.includes('Assessment Date:') || desc.includes('Caseworker:') || desc.includes('Feedback Type:') || desc.includes('Feedback Received:')) {
    const statusMatch = desc.match(/Status:\s*([^\n]+)/i)
    const workerMatch = desc.match(/Caseworker:\s*([^\n]+)/i)

    const status = statusMatch ? statusMatch[1].trim() : ''
    const worker = workerMatch ? workerMatch[1].trim() : ''

    let summary = status ? `Referral feedback received (${status}).` : 'Referral feedback received from agency.'
    if (worker && worker !== '—') summary += ` Assessed by ${worker}.`
    return summary
  }

  // 4. Referral Cancelled
  if (desc.includes('Cancelled referral') || desc.includes('Reason for cancellation:')) {
    return 'Inter-agency referral was cancelled.'
  }

  return desc
}

function formatTimelineDescription(rawDesc?: string): string {
  if (!rawDesc) return ''
  let d = summarizeBcpcDescription(rawDesc)

  // Convert raw ISO date tokens (e.g. 2026-08-13) inside strings into formatted dates
  d = d.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_match, y, m, day) => {
    try {
      const parsed = new Date(Number(y), Number(m) - 1, Number(day))
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return _match
    }
  })

  d = d.replace(/EXPIRED_UNACTIONED/gi, 'Expired Unactioned')
  d = d.replace(/CERTIFIED_TO_FILE_ACTION/gi, 'Certified to File Action')
  d = d.replace(/CFA_ISSUED/gi, 'CFA Issued')
  d = d.replace(/UNDER_MEDIATION/gi, 'Under Mediation')
  d = d.replace(/UNDER_CONCILIATION/gi, 'Under Conciliation')
  d = d.replace(/REFERRED_TO_LUPON/gi, 'Referred to Lupon')
  d = d.replace(/ON_GOING/gi, 'On Going')
  d = d.replace(/IN_PROGRESS/gi, 'In Progress')
  d = d.replace(/SETTLED/gi, 'Settled')
  d = d.replace(/DISMISSED/gi, 'Dismissed')
  d = d.replace(/WITHDRAWN/gi, 'Withdrawn')
  d = d.replace(/RECORDED/gi, 'Recorded')

  // Remove Risk Level mentions from timeline descriptions
  d = d.replace(/\s+with\s+Risk\s+Level:\s*[A-Za-z0-9_-]+/gi, '.')
  d = d.replace(/\s*,\s*Risk\s+Level:\s*[A-Za-z0-9_-]+/gi, '')
  d = d.replace(/\s*Risk\s+Level:\s*[A-Za-z0-9_-]+/gi, '')
  d = d.replace(/\.\.+/g, '.')

  return d
}

function getTimelineTheme(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes('expired') || lower.includes('unactioned')) {
    return {
      dotBg: 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/40',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
    }
  }
  if (lower.includes('certificate') || lower.includes('cfa') || lower.includes('file action')) {
    return {
      dotBg: 'bg-purple-600 ring-4 ring-purple-100 dark:ring-purple-950/40',
      icon: FileCheck2,
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    }
  }
  if (lower.includes('settled') || lower.includes('resolved')) {
    return {
      dotBg: 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/40',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    }
  }
  if (lower.includes('lupon') || lower.includes('conciliation')) {
    return {
      dotBg: 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950/40',
      icon: Scale,
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    }
  }
  if (lower.includes('dismissed') || lower.includes('withdrawn')) {
    return {
      dotBg: 'bg-slate-500 ring-4 ring-slate-100 dark:ring-slate-800',
      icon: XCircle,
      iconColor: 'text-slate-500',
      badgeBg: 'bg-slate-50 border-slate-200 text-slate-700',
    }
  }
  if (lower.includes('mediation') || lower.includes('scheduled')) {
    return {
      dotBg: 'bg-sky-500 ring-4 ring-sky-100 dark:ring-sky-950/40',
      icon: Calendar,
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-50 border-sky-200 text-sky-700',
    }
  }
  if (lower.includes('reopen') || lower.includes('re-opened')) {
    return {
      dotBg: 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/40',
      icon: ArrowRightCircle,
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    }
  }

  return {
    dotBg: 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/40',
    icon: FileText,
    iconColor: 'text-blue-600',
    badgeBg: 'bg-slate-50 border-slate-200 text-slate-700',
  }
}

export function DetailTimelinePanel({
  caseId,
  items: initialItems = [],
  onFetchTimeline,
  emptyTitle = 'Timeline',
  emptyDescription = 'No timeline entries are available yet.',
}: DetailTimelinePanelProps) {
  const [dbEvents, setDbEvents] = useState<TimelineEventResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTimeline = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      const data = onFetchTimeline
        ? await onFetchTimeline(caseId)
        : await blotterService.getTimeline(caseId)
      setDbEvents(data)
    } catch (err) {
      console.error('Failed to fetch case timeline:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId, onFetchTimeline])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  // Map DB timeline events to formatted display items
  const mappedDbItems: DetailTimelineItem[] = dbEvents.map((ev) => ({
    id: `timeline-${ev.id}`,
    title: formatTimelineTitle(ev.title),
    timestamp: formatTimelineDate(ev.eventDate),
    description: formatTimelineDescription(ev.description),
    performedBy: ev.performedBy,
  }))

  // Use DB timeline if available; otherwise use initial/fallback items
  const displayItems = mappedDbItems.length > 0 ? mappedDbItems : initialItems.map(item => ({
    ...item,
    title: formatTimelineTitle(item.title),
    description: formatTimelineDescription(item.description),
  }))

  if (isLoading) {
    return <LoadingState message="Loading timeline events..." variant="card" size="md" />
  }

  if (!displayItems.length) {
    return (
      <DetailEmptyPanel
        icon={<History className="h-10 w-10 text-slate-300 stroke-1" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      <div className="space-y-6 border-l-2 border-slate-200/80 pl-6 my-1">
        {displayItems.map((item, index) => {
          const theme = getTimelineTheme(item.title)

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Dot with Subtle Glow */}
              <span
                className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-transform group-hover:scale-125 ${
                  index === 0 ? theme.dotBg : 'bg-slate-300 ring-2 ring-slate-100'
                }`}
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 leading-snug">
                    {item.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                  {item.timestamp && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                      {item.timestamp}
                    </span>
                  )}
                  {item.performedBy && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        {item.performedBy}
                      </span>
                    </>
                  )}
                </div>

                {item.description && (
                  <div className="mt-1 rounded-xl bg-slate-50/70 border border-slate-100/90 p-3 text-xs text-slate-700 leading-relaxed">
                    <p className="whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
