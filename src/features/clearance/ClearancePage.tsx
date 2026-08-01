import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ClearancePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-7 w-7 text-emerald-600" />
            Clearance & Certificates
          </h1>
          <p className="text-sm text-slate-500">Issue barangay clearances, residency, and certificates.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Issue Clearance
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">Issued clearances and pending requests will be rendered here.</p>
      </div>
    </div>
  )
}
