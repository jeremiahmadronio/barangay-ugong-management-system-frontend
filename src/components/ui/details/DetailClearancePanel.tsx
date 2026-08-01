import { Award, Calendar, FileCheck } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'

export interface ClearanceItem {
  id: string
  controlNo: string
  clearanceType: string // e.g. "Barangay Clearance", "Certificate of Residency", "Business Permit"
  purpose: string // e.g. "Employment", "Postal ID Application"
  dateIssued: string
  status: 'ISSUED' | 'EXPIRED' | 'REVOKED' | string
  statusTone?: BadgeTone
  onClick?: (item: ClearanceItem) => void
}

interface DetailClearancePanelProps {
  title?: string
  items: ClearanceItem[]
  emptyMessage?: string
}

/**
 * Clearances issued detail panel.
 * Displays issued clearance certificates with control #, type, purpose, and status.
 * Features an aesthetic empty state when no clearances exist.
 */
export function DetailClearancePanel({
  title = 'Clearances Issued',
  items,
  emptyMessage = 'No clearance records found for this person.',
}: DetailClearancePanelProps) {
  const getStatusTone = (status: string, override?: BadgeTone): BadgeTone => {
    if (override) return override
    const s = status.toUpperCase()
    if (s === 'ISSUED' || s === 'ACTIVE' || s === 'VALID') return 'emerald'
    if (s === 'EXPIRED') return 'slate'
    if (s === 'REVOKED' || s === 'CANCELLED') return 'rose'
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {item.controlNo}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                      {item.clearanceType}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Purpose: <span className="text-slate-700 font-medium">{item.purpose}</span>
                    </p>
                  </div>
                </div>

                <Badge tone={getStatusTone(item.status, item.statusTone)}>
                  {item.status}
                </Badge>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Calendar size={13} className="text-slate-400" />
                  Issued on {item.dateIssued}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                  <Award size={13} /> Verified Official
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <FileCheck size={22} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">No Clearances Issued</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}
