import { Briefcase, UserCheck } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'

export interface CaseHandledItem {
  id: string
  caseNo: string
  complainant: string
  respondent: string
  incidentType: string
  department: string // e.g. "BCPC", "Blotter", "Lupon", "VAWC"
  dateAssigned: string
  status: string // e.g. "IN_PROGRESS" | "RESOLVED" | "PENDING_HEARING"
  statusTone?: BadgeTone
  onClick?: (item: CaseHandledItem) => void
}

interface DetailCaseHandledPanelProps {
  title?: string
  items: CaseHandledItem[]
  emptyMessage?: string
}

/**
 * Cases handled detail panel for officers and admins.
 * Displays cases assigned or handled by the user with complainant, respondent, and department.
 * Features an aesthetic empty state when no cases exist.
 */
export function DetailCaseHandledPanel({
  title = 'Cases Handled & Assigned',
  items,
  emptyMessage = 'No handled cases assigned to this user.',
}: DetailCaseHandledPanelProps) {
  const getStatusTone = (status: string, override?: BadgeTone): BadgeTone => {
    if (override) return override
    const s = status.toUpperCase()
    if (s.includes('RESOLVED') || s.includes('SETTLED')) return 'emerald'
    if (s.includes('PROGRESS') || s.includes('ACTIVE')) return 'sky'
    if (s.includes('PENDING') || s.includes('HEARING')) return 'amber'
    return 'slate'
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {item.caseNo}
                  </span>
                  <Badge tone="indigo">{item.department}</Badge>
                </div>

                <Badge tone={getStatusTone(item.status, item.statusTone)}>
                  {item.status}
                </Badge>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mt-2">
                {item.incidentType}
              </h3>

              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p>
                  Complainant: <span className="font-medium text-slate-900">{item.complainant}</span>
                </p>
                <p>
                  Respondent: <span className="font-medium text-slate-900">{item.respondent}</span>
                </p>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Briefcase size={13} className="text-slate-400" />
                  Assigned on {item.dateAssigned}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                  <UserCheck size={13} /> Desk Handling
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <Briefcase size={22} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">No Handled Cases</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}
