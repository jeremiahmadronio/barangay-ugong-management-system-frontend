import { useState, useEffect, useCallback } from 'react'
import { History, Loader2, User } from 'lucide-react'
import { DetailEmptyPanel } from './DetailEmptyPanel'
import { blotterApi, type TimelineEventResponse } from '@/api/modules/blotter.api'

export interface DetailTimelineItem {
  id: string
  title: string
  timestamp?: string
  description?: string
  performedBy?: string
}

interface DetailTimelinePanelProps {
  caseId?: number | string
  items?: DetailTimelineItem[]
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


export function DetailTimelinePanel({
  caseId,
  items: initialItems = [],
  emptyTitle = 'Timeline',
  emptyDescription = 'No timeline entries are available yet.',
}: DetailTimelinePanelProps) {
  const [dbEvents, setDbEvents] = useState<TimelineEventResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTimeline = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      const data = await blotterApi.getTimeline(caseId)
      setDbEvents(data)
    } catch (err) {
      console.error('Failed to fetch case timeline:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  // Map DB timeline events to display items
  const mappedDbItems: DetailTimelineItem[] = dbEvents.map((ev) => ({
    id: `timeline-${ev.id}`,
    title: ev.title,
    timestamp: formatTimelineDate(ev.eventDate),
    description: ev.description,
    performedBy: ev.performedBy,
  }))

  // Use DB timeline if available; otherwise use initial/fallback items
  const displayItems = mappedDbItems.length > 0 ? mappedDbItems : initialItems

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading timeline events...
      </div>
    )
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
        {displayItems.map((item, index) => (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
            <span
              className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-transform group-hover:scale-125 ${
                index === 0 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
              }`}
            />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900">{item.title}</p>
              
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                {item.timestamp && <span>{item.timestamp}</span>}
                {item.performedBy && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500 font-semibold">
                      <User className="h-3 w-3 text-slate-400 shrink-0" />
                      {item.performedBy}
                    </span>
                  </>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
