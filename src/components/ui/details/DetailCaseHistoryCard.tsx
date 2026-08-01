import { ArrowRight, History } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'

export interface CaseHistoryItem {
  caseNo: string
  filedDate: string
  status: string
  isCurrent?: boolean
  isPast?: boolean
}

export interface DetailCaseHistoryCardProps {
  items: CaseHistoryItem[]
  onViewRecord?: (caseNo: string) => void
}

export function DetailCaseHistoryCard({ items, onViewRecord }: DetailCaseHistoryCardProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">Case History</h3>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => {
          const isCurrent = item.isCurrent
          return (
            <div
              key={item.caseNo}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 transition-colors ${
                isCurrent
                  ? 'border border-emerald-300/90 bg-emerald-50/50'
                  : 'border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.caseNo}</span>
                  {item.isPast && <Badge tone="slate">PAST RECORD</Badge>}
                  {isCurrent && <Badge tone="emerald">LATEST ACTIVE CASE</Badge>}
                  {isCurrent && <Badge tone="sky">CURRENT VIEW</Badge>}
                </div>
                <p className="text-xs text-slate-500">
                  Filed: {item.filedDate} <span className="mx-1">•</span> Status:{' '}
                  <span className="font-semibold text-slate-700">{item.status}</span>
                </p>
              </div>

              {!isCurrent && onViewRecord && (
                <button
                  type="button"
                  onClick={() => onViewRecord(item.caseNo)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer self-start sm:self-center"
                >
                  View Record <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
