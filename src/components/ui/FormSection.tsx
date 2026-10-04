import { type ReactNode } from 'react'

interface FormSectionProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/** Reusable form grouping with a restrained label and divider. */
export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <section className={className}>
      <h3 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800">
        {title}
      </h3>
      {description && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}

