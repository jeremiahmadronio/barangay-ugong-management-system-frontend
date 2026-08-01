import { type ReactNode, useState } from 'react'

export interface DetailTab {
  id: string
  label: string
  content: ReactNode
}

interface DetailTabsProps {
  tabs: DetailTab[]
  defaultTabId?: string
}

/** Reusable tab surface that keeps different detail-page content in one layout. */
export function DetailTabs({ tabs, defaultTabId }: DetailTabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id ?? '')
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

  if (!activeTab) return null

  return (
    <section>
      <div
        role="tablist"
        aria-label="Record details"
        className="flex overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabId(tab.id)}
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
        {activeTab.content}
      </div>
    </section>
  )
}
