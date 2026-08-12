import { useLocation } from 'react-router-dom'
import { IssuanceForm } from './IssuanceForm'
import { Briefcase } from 'lucide-react'

export const FtjsPage = () => {
  const location = useLocation()

  // Render Issuance Form for /ftjs, /ftjs/issuance, or /ftjs/entry
  if (
    location.pathname === '/ftjs' ||
    location.pathname.endsWith('/ftjs') ||
    location.pathname.includes('/issuance') ||
    location.pathname.includes('/entry')
  ) {
    return <IssuanceForm />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-purple-600" />
            First-Time Job Seeker (FTJS) Management
          </h1>
          <p className="text-sm text-slate-500">
            View and manage job seeker assistance requests under Republic Act 11261.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-sm text-slate-600">FTJS applicant requests will be rendered here.</p>
      </div>
    </div>
  )
}
