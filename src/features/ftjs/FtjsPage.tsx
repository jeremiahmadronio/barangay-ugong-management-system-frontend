import { Briefcase, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FtjsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-purple-600" />
            First-Time Job Seeker (FTJS) Desk
          </h1>
          <p className="text-sm text-slate-500">
            Issue job seeker assistance certificates under Republic Act 11261.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New FTJS Request
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">FTJS applicant requests will be rendered here.</p>
      </div>
    </div>
  )
}
