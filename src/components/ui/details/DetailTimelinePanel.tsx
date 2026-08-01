import { History } from 'lucide-react'
import { DetailEmptyPanel } from './DetailEmptyPanel'

export interface DetailTimelineItem {
  id: string
  title: string
  timestamp?: string
  description?: string
}

interface DetailTimelinePanelProps {
  items: DetailTimelineItem[]
  emptyTitle?: string
  emptyDescription?: string
}

export function DetailTimelinePanel({
  items,
  emptyTitle = 'Timeline',
  emptyDescription = 'No timeline entries are available yet.',
}: DetailTimelinePanelProps) {
  if (!items.length) {
    return (
      <DetailEmptyPanel
        icon={<History className="h-10 w-10" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      <div className="space-y-5 border-l-2 border-slate-200 pl-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                index === 0 ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-slate-300'
              }`}
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.timestamp ? (
                <p className="text-xs font-medium text-slate-500">{item.timestamp}</p>
              ) : null}
              {item.description ? (
                <p className="text-sm text-slate-600">{item.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
