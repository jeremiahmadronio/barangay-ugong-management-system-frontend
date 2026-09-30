import { ArrowLeftIcon } from 'lucide-react'

interface DetailSkeletonProps {
  backLabel: string
  onBack: () => void
  tabCount?: number
  infoCardCount?: number
  actionCount?: number
  fieldsPerCard?: number
}

/**
 * Premium skeleton loading state for record, user, resident, and officer detail views.
 * Preserves the exact 2-column layout geometry with animated pulse elements to eliminate
 * layout shift (CLS) when navigating into detail views.
 */
export function DetailSkeleton({
  backLabel,
  onBack,
  tabCount = 3,
  infoCardCount = 2,
  actionCount = 3,
  fieldsPerCard = 8,
}: DetailSkeletonProps) {
  return (
    <main className="w-full bg-transparent select-none animate-pulse">
      <div>
        {/* Clickable Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeftIcon size={16} />
          {backLabel}
        </button>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start">
          {/* Left Sidebar Profile Card Skeleton */}
          <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-3.5 lg:flex-col lg:items-center lg:text-center">
              {/* Circular Avatar Skeleton */}
              <div className="h-14 w-14 rounded-full bg-slate-200 lg:h-20 lg:w-20 shrink-0" />
              <div className="min-w-0 flex-1 lg:w-full space-y-2 mt-1">
                {/* Name */}
                <div className="h-5 w-36 bg-slate-200 rounded mx-auto" />
                {/* Subtitle / Email */}
                <div className="h-3.5 w-28 bg-slate-100 rounded mx-auto" />
              </div>
            </div>

            {/* Badges Skeleton */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 justify-center">
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>

            {/* Actions Section Skeleton */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="h-3 w-14 bg-slate-200 rounded mb-3" />
              <div className="space-y-2">
                {Array.from({ length: actionCount }).map((_, i) => (
                  <div key={i} className="h-9 w-full bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          </aside>

          {/* Right Main Column Skeleton */}
          <div className="min-w-0 space-y-6">
            {/* Tabs Bar Skeleton */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {Array.from({ length: tabCount }).map((_, i) => (
                <div key={i} className="relative px-5 py-3.5 shrink-0">
                  <div className={`h-4 rounded ${i === 0 ? 'w-20 bg-blue-200' : 'w-24 bg-slate-200'}`} />
                  {i === 0 && (
                    <div className="absolute inset-x-5 bottom-0 h-0.5 bg-blue-500" />
                  )}
                </div>
              ))}
            </div>

            {/* Info Cards Skeleton */}
            <div className="space-y-6">
              {Array.from({ length: infoCardCount }).map((_, cardIndex) => (
                <section
                  key={cardIndex}
                  className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6"
                >
                  {/* Card Header Title */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className={`h-4 rounded bg-slate-200 ${cardIndex === 0 ? 'w-48' : 'w-40'}`} />
                  </div>

                  {/* 2-Column Fields Grid */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {Array.from({
                      length: cardIndex === 0 ? fieldsPerCard : Math.max(4, fieldsPerCard - 2),
                    }).map((_, fieldIndex) => (
                      <div key={fieldIndex} className="space-y-2">
                        <div className="h-2.5 w-20 bg-slate-200 rounded" />
                        <div
                          className={`h-4 rounded bg-slate-100 ${
                            fieldIndex % 2 === 0 ? 'w-36' : 'w-28'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
