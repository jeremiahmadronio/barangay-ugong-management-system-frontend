import { Scale, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const LuponPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="h-7 w-7 text-indigo-600" />
            Lupon Tagapamayapa
          </h1>
          <p className="text-sm text-slate-500">Conciliation, mediation, and arbitration cases.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> File Lupon Case
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">Lupon cases will be rendered here.</p>
      </div>
    </div>
  )
}
