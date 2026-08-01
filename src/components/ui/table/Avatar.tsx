import { useState } from 'react'

interface AvatarProps {
  name: string
  /** Optional image URL or base64 photo string from backend */
  src?: string
  /** Alias for src */
  photoBase64?: string
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Neutral initials avatar — shows photo if src/photoBase64 is provided, otherwise falls back to initials. */
export function Avatar({ name, src: srcProp, photoBase64, className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const photo = srcProp || photoBase64

  if (photo && !hasError && photo.length < 2000000) {
    const cleanPhoto = photo.trim().replace(/[\r\n]/g, '')
    const imgSrc = cleanPhoto.startsWith('data:') || cleanPhoto.startsWith('http') || cleanPhoto.startsWith('/')
      ? cleanPhoto
      : `data:image/jpeg;base64,${cleanPhoto}`

    return (
      <img
        src={imgSrc}
        alt={name}
        onError={() => setHasError(true)}
        className={`h-9 w-9 shrink-0 rounded-full object-cover select-none ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 select-none ${className}`}
    >
      {initials(name)}
    </div>
  )
}
