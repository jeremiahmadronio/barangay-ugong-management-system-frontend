import { HeartHandshake, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const VawcPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartHandshake className="h-7 w-7 text-rose-600" />
            VAWC Cases
          </h1>
          <p className="text-sm text-slate-500">Violence Against Women and Children desk records.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Case Record
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">Confidential VAWC cases list will be rendered here.</p>
      </div>
    </div>
  )
}
