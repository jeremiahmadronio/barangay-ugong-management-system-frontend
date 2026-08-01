import { FolderKanban } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'

export interface CaseHistoryItem {
  id: string
  caseNo: string
  title: string
  dateFiled: string
  role?: string // e.g. "COMPLAINANT" | "RESPONDENT" | "WITNESS"
  status: string // e.g. "SETTLED" | "ISSUED_REFERRAL" | "UNDER_MEDIATION" | "PENDING"
  statusTone?: BadgeTone
  onClick?: (item: CaseHistoryItem) => void
}

interface DetailCaseHistoryPanelProps {
  title?: string
  items: CaseHistoryItem[]
  emptyMessage?: string
}

/**
 * Case history detail panel.
 * Displays case records with case #, incident summary, filed date, role badge, and status.
 * Features an aesthetic empty state when no cases exist.
 */
export function DetailCaseHistoryPanel({
  title = 'Case History',
  items,
  emptyMessage = 'No case history records found for this person.',
}: DetailCaseHistoryPanelProps) {
  const getRoleTone = (role?: string): BadgeTone => {
    if (!role) return 'slate'
    const r = role.toUpperCase()
    if (r.includes('COMPLAINANT')) return 'rose'
    if (r.includes('RESPONDENT')) return 'amber'
    return 'sky'
  }

  const getStatusTone = (status: string, override?: BadgeTone): BadgeTone => {
    if (override) return override
    const s = status.toUpperCase()
    if (s.includes('SETTLED') || s.includes('RESOLVED')) return 'emerald'
    if (s.includes('REFERRAL') || s.includes('ISSUED')) return 'slate'
    if (s.includes('MEDIATION') || s.includes('PENDING')) return 'amber'
    return 'sky'
  }

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-slate-900">{title} ({items.length})</h2>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => item.onClick?.(item)}
              className={`rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all ${
                item.onClick ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer' : ''
              }`}
            >
              {/* Header Row: Case No. + Status */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold tracking-tight text-slate-900">
                  {item.caseNo}
                </span>
                <Badge tone={getStatusTone(item.status, item.statusTone)}>
                  {item.status}
                </Badge>
              </div>

              {/* Title / Incident Description */}
              <p className="mt-2 text-sm font-medium leading-normal text-slate-700">
                {item.title}
              </p>

              {/* Footer Row: Date Filed + Role Badge */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Date Filed: {item.dateFiled}</span>
                {item.role && (
                  <>
                    <span>•</span>
                    <Badge tone={getRoleTone(item.role)}>{item.role}</Badge>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <FolderKanban size={22} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">No Case History</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}
