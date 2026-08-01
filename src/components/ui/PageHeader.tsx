import type { LucideIcon } from 'lucide-react'

export interface PageHeaderAction {
  /** Button label text */
  label: string
  /** Lucide icon component */
  icon?: LucideIcon
  /** Click handler */
  onClick: () => void
  /** Optional extra class overrides */
  className?: string
}

export interface PageHeaderProps {
  /** Main page title */
  title: string
  /** Optional short description below the title */
  description?: string
  /** Optional action buttons rendered on the right */
  actions?: PageHeaderAction[]
  /** Optional extra wrapper class */
  className?: string
}

/**
 * Reusable page header with optional action buttons.
 * Drop this at the top of any page content area for a consistent,
 * clean header layout.
 *
 * @example
 * <PageHeader
 *   title="Users Management"
 *   description="Manage accounts, roles, and department access."
 *   actions={[{ label: 'Create Account', icon: UserPlus, onClick: () => setOpen(true) }]}
 * />
 */
export function PageHeader({
  title,
  description,
  actions = [],
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left: Title + Description */}
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-800 leading-snug truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Right: Action Buttons */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          {actions.map((action, idx) => {
            const Icon = action.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                className={
                  action.className ??
                  'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md cursor-pointer'
                }
              >
                {Icon && <Icon size={15} />}
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
