import { type ReactNode } from 'react'

interface DetailEmptyPanelProps {
  icon?: ReactNode
  title: string
  description: string
}

export function DetailEmptyPanel({
  icon,
  title,
  description,
}: DetailEmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        {icon ? <div className="text-slate-300">{icon}</div> : null}
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}
