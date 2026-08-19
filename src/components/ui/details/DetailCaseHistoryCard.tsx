import { ArrowRight, History } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'

function getStatusTone(status?: string): BadgeTone {
  const normalized = String(status || '').toUpperCase();
  if (normalized.includes('SETTLED') || normalized.includes('RESOLVED')) return 'emerald';
  if (normalized.includes('DISMISSED') || normalized.includes('WITHDRAWN')) return 'rose';
  if (normalized.includes('MEDIATION')) return 'sky';
  if (normalized.includes('CONCILIATION')) return 'indigo';
  return 'amber';
}

export interface CaseHistoryItem {
  id?: string | number
  caseNo: string
  filedDate: string
  status: string
  isCurrent?: boolean
  isPast?: boolean
  isLatestActive?: boolean
}

export interface DetailCaseHistoryCardProps {
  items: CaseHistoryItem[]
  onViewRecord?: (idOrNo: string | number) => void
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
                  {item.isLatestActive && <Badge tone="emerald">LATEST ACTIVE CASE</Badge>}
                  {isCurrent && <Badge tone="sky">CURRENT VIEW</Badge>}
                </div>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Filed: <span className="font-medium text-slate-700">{item.filedDate}</span></span>
                  <span className="flex items-center gap-1">Status: <Badge tone={getStatusTone(item.status)}>{item.status}</Badge></span>
                </p>
              </div>

              {!isCurrent && onViewRecord && (
                <button
                  type="button"
                  onClick={() => onViewRecord(item.id || item.caseNo)}
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
