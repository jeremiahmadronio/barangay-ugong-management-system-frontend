
interface AvatarProps {
  name: string
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, className = '' }: AvatarProps) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 select-none ${className}`}
    >
      {initials(name)}
    </div>
  )
}
