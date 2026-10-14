import { useEffect, useState } from 'react'

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

/** Resolves raw base64 or URL into a valid browser image source */
export function resolveAvatarSrc(photo?: string | null): string {
  if (!photo) return ''
  const clean = photo.trim().replace(/[\r\n]/g, '')
  if (!clean) return ''

  // Already a full data URL, blob URL, or HTTP(S) URL
  if (
    clean.startsWith('data:') ||
    clean.startsWith('blob:') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://')
  ) {
    return clean
  }

  // Base64 JPEG starts with /9j/
  if (clean.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${clean}`
  }

  // Base64 PNG starts with iVBORw0KGgo
  if (clean.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${clean}`
  }

  // Base64 WebP starts with UklGR
  if (clean.startsWith('UklGR')) {
    return `data:image/webp;base64,${clean}`
  }

  // Base64 GIF starts with R0lGOD
  if (clean.startsWith('R0lGOD')) {
    return `data:image/gif;base64,${clean}`
  }

  // Short relative paths like "/placeholder.svg" or "/assets/avatar.png"
  if (
    clean.startsWith('/') &&
    (clean.includes('.png') ||
      clean.includes('.jpg') ||
      clean.includes('.jpeg') ||
      clean.includes('.svg') ||
      clean.includes('.webp') ||
      clean.includes('.gif') ||
      clean.length < 100)
  ) {
    return clean
  }

  // Default assumption for raw base64 photo string
  return `data:image/jpeg;base64,${clean}`
}

/** Neutral initials avatar — shows photo if src/photoBase64 is provided, otherwise falls back to initials. */
export function Avatar({ name, src: srcProp, photoBase64, className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const photo = srcProp || photoBase64

  // Reset error when photo prop updates
  useEffect(() => {
    setHasError(false)
  }, [photo])

  const hasExplicitSize = /\b(h-|w-)\d+/.test(className)
  const defaultSizeClass = hasExplicitSize ? '' : 'h-9 w-9'

  const imgSrc = resolveAvatarSrc(photo)

  if (imgSrc && !hasError) {
    return (
      <img
        src={imgSrc}
        alt={name}
        onError={() => setHasError(true)}
        className={`${defaultSizeClass} shrink-0 rounded-full object-cover select-none ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex ${defaultSizeClass} shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 select-none ${className}`}
    >
      {initials(name)}
    </div>
  )
}

