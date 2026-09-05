import { Printer } from 'lucide-react'

export interface VawcBpoManagementPanelProps {
  caseId: string | number
  caseNumber: string
  victimName: string
  respondentName: string
  assignedOfficer: string
  bpoNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  onPrintRequestLetter?: () => void
  onActivateBpo?: () => void
}

export function VawcBpoManagementPanel({
  caseNumber,
  victimName,
  respondentName,
  assignedOfficer,
  bpoNumber,
  issueDate,
  expiryDate,
  onPrintRequestLetter,
  onActivateBpo,
}: VawcBpoManagementPanelProps) {
  return (
    <div className="space-y-6">
      {/* Barangay Protection Order Details Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900">
            Barangay Protection Order Details
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onPrintRequestLetter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              Print BPO Request Letter
            </button>
            <button
              type="button"
              onClick={onActivateBpo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Activate BPO (Post-Signature)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CASE NUMBER
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{caseNumber || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              VICTIM (PROTECTED PARTY)
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{victimName || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              RESPONDENT
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{respondentName || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ASSIGNED OFFICER
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{assignedOfficer || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5 border-t border-slate-100">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              BPO NUMBER
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{bpoNumber || 'Not Issued'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ISSUE DATE
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{issueDate || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              EXPIRY DATE (15 DAYS)
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{expiryDate || '—'}</p>
          </div>
        </div>
      </div>

      {/* Workflow Instructions Card */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-2xs space-y-2.5 text-amber-950">
        <h4 className="text-xs font-bold text-amber-900">Workflow Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900/90 leading-relaxed font-medium">
          <li>Print the BPO Request Letter using the button above.</li>
          <li>Have the Punong Barangay (Barangay Captain) sign the document.</li>
          <li>
            Once signed, click &quot;Activate BPO&quot; to officially issue the order and start the 15-day validity period.
          </li>
        </ol>
      </div>
    </div>
  )
}
