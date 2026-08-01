import { type ReactNode, useState } from 'react'
import { DetailPageLayout } from './DetailPageLayout'
import { DetailTabs, type DetailTab } from './DetailTabs'

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

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-slate-200 bg-white py-24 text-slate-400 shadow-2xs">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

function NotFoundState({
  title,
  description,
  actionLabel,
  onBack,
}: {
  title: string
  description: string
  actionLabel: string
  onBack: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
      >
        {actionLabel}
      </button>
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

  let body: ReactNode

  if (isLoading) {
    body = <LoadingState message={loadingMessage} />
  } else if (isNotFound) {
    body = (
      <NotFoundState
        title={notFoundTitle}
        description={notFoundDescription}
        actionLabel={notFoundActionLabel}
        onBack={onBack}
      />
    )
  } else {
    body = (
      <DetailTabs
        tabs={tabs}
        activeTab={resolvedTab}
        onChange={handleTabChange}
        defaultTabId={defaultTabId}
      />
    )
  }

  return (
    <DetailPageLayout
      backLabel={backLabel}
      onBack={onBack}
      header={isLoading || isNotFound ? <div /> : header}
    >
      {body}
    </DetailPageLayout>
  )
}
