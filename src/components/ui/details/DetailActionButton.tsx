import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type DetailActionTone = 'primary' | 'secondary' | 'warning' | 'danger' | 'success' | 'emerald' | 'rose' | 'blue'

interface DetailActionButtonProps {
  children: ReactNode
  icon?: ReactNode
  tone?: DetailActionTone
  onClick?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Detail-page adapter for the shared Button. Keep this small wrapper only for
 * readable detail-page code; visual styles live in components/ui/button.
 */
export function DetailActionButton({
  children,
  icon,
  tone = 'secondary',
  onClick,
  disabled = false,
  className = '',
}: DetailActionButtonProps) {
  const toneVariantMap: Record<DetailActionTone, 'primary' | 'secondary' | 'danger' | 'outline'> = {
    primary: 'primary',
    secondary: 'outline',
    warning: 'outline',
    danger: 'danger',
    success: 'outline',
    emerald: 'outline',
    rose: 'outline',
    blue: 'outline',
  }

  const customToneClasses: Partial<Record<DetailActionTone, string>> = {
    warning: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    rose: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100',
    blue: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
  }

  const toneClass = customToneClasses[tone] || ''

  return (
    <Button
      variant={toneVariantMap[tone]}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`w-full justify-center gap-2 ${toneClass} ${className}`}
    >
      {icon}
      {children}
    </Button>
  )
}
