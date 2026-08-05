import { type ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

interface DetailPageLayoutProps {
  backLabel: string
  header: ReactNode
  children: ReactNode
  onBack: () => void
  fullWidthHeader?: boolean
}

/** Shared page frame for record, person, account, and case detail views. */
export function DetailPageLayout({
  backLabel,
  header,
  children,
  onBack,
  fullWidthHeader = true,
}: DetailPageLayoutProps) {
  return (
    <main className="w-full bg-transparent select-none">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeftIcon size={16} />
          {backLabel}
        </button>

        {fullWidthHeader ? (
          <div className="space-y-6">
            {header}
            <div className="w-full min-w-0">{children}</div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start">
            {header}
            <div className="min-w-0">{children}</div>
          </div>
        )}
      </div>
    </main>
  )
}
