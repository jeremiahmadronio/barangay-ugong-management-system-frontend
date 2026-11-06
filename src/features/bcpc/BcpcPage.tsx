import { useNavigate } from 'react-router-dom'
import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const BcpcPage = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-7 w-7 text-sky-600" />
            BCPC Desk (Barangay Council for the Protection of Children)
          </h1>
          <p className="text-sm text-slate-500">
            Protection, welfare, and intervention cases for children in conflict with the law or needing protection.
          </p>
        </div>
        <Button onClick={() => navigate('/bcpc/new')} className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" /> New BCPC Case
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">BCPC case records table will be rendered here.</p>
      </div>
    </div>
  )
}
