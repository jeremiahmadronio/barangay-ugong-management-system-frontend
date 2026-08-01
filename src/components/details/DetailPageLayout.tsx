import { type ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

interface DetailPageLayoutProps {
  backLabel: string
  header: ReactNode
  children: ReactNode
  onBack: () => void
}

/** Shared page frame for record, person, account, and case detail views. */
export function DetailPageLayout({
  backLabel,
  header,
  children,
  onBack,
}: DetailPageLayoutProps) {
  return (
    <main className="min-h-full w-full bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeftIcon size={17} />
          {backLabel}
        </button>
        <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start">
          {header}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  )
}
