import { type ReactNode, useState } from 'react'
import { DetailPageLayout } from './DetailPageLayout'
import { DetailTabs, type DetailTab } from './DetailTabs'
import { LoadingState } from '../LoadingState'

interface DetailCaseDetailsShellProps {
  backLabel: string
  onBack: () => void
  header: ReactNode
  tabs: DetailTab[]
  defaultTabId?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
  isLoading?: boolean
  loadingMessage?: string
  isNotFound?: boolean
  notFoundTitle?: string
  notFoundDescription?: string
  notFoundActionLabel?: string
}

function NotFoundState({
  title,
  description,
}: {
  title: string
  description?: string
  actionLabel?: string
  onBack?: () => void
}) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  )
}

function DetailCaseHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs animate-pulse select-none">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-6 w-44 bg-slate-200 rounded" />
              <div className="h-5 w-24 bg-slate-100 rounded-full" />
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-3.5 w-60 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function DetailCaseBodySkeleton({ tabCount = 4 }: { tabCount?: number }) {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Tabs Skeleton */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white/60 rounded-t-xl px-2">
        {Array.from({ length: tabCount }).map((_, i) => (
          <div key={i} className="relative px-5 py-3.5 shrink-0">
            <div
              className={`h-4 rounded ${
                i === 0 ? 'w-24 bg-blue-200' : 'w-28 bg-slate-200'
              }`}
            />
            {i === 0 && (
              <div className="absolute inset-x-5 bottom-0 h-0.5 bg-blue-500" />
            )}
          </div>
        ))}
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main 2-Column Content */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="h-4 w-44 bg-slate-200 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="h-4 w-48 bg-slate-200 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
            </div>
          </section>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * Reusable case detail page frame: back link, case header column, and tabbed content.
 * Pass only the tabs/sections you need (overview, notes, timeline, etc.).
 */
export function DetailCaseDetailsShell({
  backLabel,
  onBack,
  header,
  tabs,
  defaultTabId,
  activeTab,
  onTabChange,
  isLoading = false,
  loadingMessage = 'Loading case details...',
  isNotFound = false,
  notFoundTitle = 'Case Details Not Found',
  notFoundDescription = 'The requested case could not be loaded right now.',
  notFoundActionLabel = 'Go Back',
}: DetailCaseDetailsShellProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTabId ?? tabs[0]?.id ?? 'overview',
  )

  const resolvedTab = activeTab ?? internalTab
  const handleTabChange = (tabId: string) => {
    if (activeTab === undefined) {
      setInternalTab(tabId)
    }
    onTabChange?.(tabId)
  }

  if (isLoading) {
    return (
      <DetailPageLayout
        backLabel={backLabel}
        onBack={onBack}
        fullWidthHeader={true}
        header={<DetailCaseHeaderSkeleton />}
      >
        <DetailCaseBodySkeleton tabCount={tabs.length || 4} />
      </DetailPageLayout>
    )
  }

  if (isNotFound) {
    return (
      <DetailPageLayout
        backLabel={backLabel}
        onBack={onBack}
        fullWidthHeader={true}
        header={<div />}
      >
        <NotFoundState
          title={notFoundTitle}
          description={notFoundDescription}
          actionLabel={notFoundActionLabel}
          onBack={onBack}
        />
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      backLabel={backLabel}
      onBack={onBack}
      fullWidthHeader={true}
      header={header}
    >
      <DetailTabs
        tabs={tabs}
        activeTab={resolvedTab}
        onChange={handleTabChange}
        defaultTabId={defaultTabId}
      />
    </DetailPageLayout>
  )
}
