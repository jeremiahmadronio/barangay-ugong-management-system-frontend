import React from 'react'

export interface LoadingStateProps {
  message?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'card' | 'inline' | 'transparent'
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  description,
  size = 'md',
  variant = 'card',
  className = '',
}: LoadingStateProps) {
  const spinnerSize =
    size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'

  const containerClasses =
    variant === 'card'
      ? 'rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs'
      : variant === 'inline'
      ? 'py-6 px-4'
      : 'py-12'

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 ${containerClasses} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`${spinnerSize} rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin`}
        />
      </div>
      <div className="space-y-0.5 text-center">
        <p className="text-xs font-bold text-slate-700">{message}</p>
        {description && (
          <p className="text-[11px] text-slate-400 font-medium">{description}</p>
        )}
      </div>
    </div>
  )
}
