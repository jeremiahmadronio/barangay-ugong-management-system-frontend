import { type ReactNode, useEffect, useState } from 'react'

export interface DetailTab {
  id: string
  label: ReactNode
  content: ReactNode
}

interface DetailTabsProps {
  tabs: DetailTab[]
  defaultTabId?: string
  activeTab?: string
  onChange?: (tabId: string) => void
}

/** Reusable tab surface that keeps different detail-page content in one layout. */
export function DetailTabs({
  tabs,
  defaultTabId,
  activeTab,
  onChange,
}: DetailTabsProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    activeTab ?? defaultTabId ?? tabs[0]?.id ?? ''
  )

  useEffect(() => {
    if (activeTab !== undefined) {
      setInternalActiveTabId(activeTab)
    }
  }, [activeTab])

  const activeTabId = activeTab ?? internalActiveTabId
  const resolvedActiveTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

  if (!resolvedActiveTab) return null

  const handleTabChange = (tabId: string) => {
    if (activeTab === undefined) {
      setInternalActiveTabId(tabId)
    }
    onChange?.(tabId)
  }

  return (
    <section>
      <div
        role="tablist"
        aria-label="Record details"
        className="flex overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === resolvedActiveTab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={`relative shrink-0 px-4 py-3.5 text-sm font-medium transition-colors sm:px-5 cursor-pointer ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 bg-blue-600 sm:inset-x-5" />
              )}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" className="pt-5 sm:pt-6">
        {resolvedActiveTab.content}
      </div>
    </section>
  )
}
