import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export interface PermissionDeniedPageProps {
  title?: string
  message?: string
  hint?: string
  userEmail?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  compact?: boolean
  size?: 'default' | 'compact' | 'sm'
}

function useSafeUserEmail(): string {
  try {
    const authContext = useContext(AuthContext)
    if (authContext?.user?.email) return authContext.user.email
    if (authContext?.user?.username) {
      return authContext.user.username.includes('@')
        ? authContext.user.username
        : `${authContext.user.username}@barangay.gov.ph`
    }
  } catch {
    // context not available
  }

  try {
    const storedProfile = sessionStorage.getItem('user_profile')
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile)
      if (parsed?.email) return parsed.email
      if (parsed?.username) {
        return parsed.username.includes('@')
          ? parsed.username
          : `${parsed.username}@barangay.gov.ph`
      }
    }
  } catch {
    // ignore
  }

  const storedEmail =
    sessionStorage.getItem('userEmail') ||
    sessionStorage.getItem('email') ||
    sessionStorage.getItem('username')
  if (storedEmail) {
    return storedEmail.includes('@') ? storedEmail : `${storedEmail}@barangay.gov.ph`
  }

  return 'user@barangay.gov.ph'
}

export function PermissionDeniedPage({
  title = "You don't have permission to access this application!",
  message = 'The owner of the workspace has not given you permission to access this application. Please contact the owner of the workspace.',
  hint,
  userEmail,
  actionLabel,
  onAction,
  className = '',
  compact = false,
  size,
}: PermissionDeniedPageProps) {
  const emailToDisplay = userEmail || useSafeUserEmail()
  const isCompact = compact || size === 'compact' || size === 'sm'

  return (
    <div
      className={`w-full flex items-center justify-center bg-transparent select-none ${
        isCompact ? 'py-4 px-3' : 'min-h-[45vh] py-8 px-6'
      } ${className}`}
    >
      <div className={`w-full ${isCompact ? 'max-w-md' : 'max-w-lg'} text-center flex flex-col items-center`}>
        {/* Computer Screen Illustration with Lock & Key */}
        <div className={`w-full ${isCompact ? 'max-w-[130px] sm:max-w-[145px] mb-3' : 'max-w-[180px] sm:max-w-[210px] mb-5'}`}>
          <svg
            viewBox="0 0 300 230"
            className="w-full h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Permission denied illustration"
          >
            {/* Monitor Outer Frame */}
            <rect
              x="35"
              y="18"
              width="230"
              height="156"
              rx="22"
              stroke="#22272e"
              strokeWidth="3.2"
              fill="#ffffff"
            />

            {/* Monitor Inner Screen Bezel */}
            <rect
              x="45"
              y="28"
              width="210"
              height="136"
              rx="15"
              stroke="#22272e"
              strokeWidth="1.8"
              fill="#ffffff"
            />

            {/* Power indicator circle at bottom center of bezel */}
            <circle
              cx="150"
              cy="168"
              r="3.2"
              stroke="#22272e"
              strokeWidth="2.2"
              fill="none"
            />

            {/* Monitor Stand Stem / Neck */}
            <line
              x1="140"
              y1="176"
              x2="140"
              y2="192"
              stroke="#22272e"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="160"
              y1="176"
              x2="160"
              y2="192"
              stroke="#22272e"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Monitor Stand Base */}
            <path
              d="M118 212 L134 193 H166 L182 212 C183.5 213.8 182.2 215.5 180 215.5 H120 C117.8 215.5 116.5 213.8 118 212 Z"
              fill="#2b333e"
              stroke="#22272e"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />

            {/* Padlock Open Shackle */}
            <path
              d="M136 92 V66 C136 52 147 42 160 42 C173 42 182 52 182 66 V74"
              fill="none"
              stroke="#2b333e"
              strokeWidth="7.5"
              strokeLinecap="round"
            />

            {/* Padlock Body */}
            <path
              d="M125 92 C125 87 129 83 134 83 H166 C171 83 175 87 175 92 L177 120 C177 136 165 145 150 145 C135 145 123 136 123 120 Z"
              fill="#2b333e"
            />

            {/* Keyhole Socket */}
            <circle cx="152" cy="114" r="6" fill="#181e26" />
            <path d="M150 115 L147 129 H157 L154 115 Z" fill="#181e26" />

            {/* Key inserting horizontally from right */}
            <g>
              {/* Key shaft with teeth */}
              <path
                d="M154 111 H195 V120 H191 V116 H182 V120 H178 V116 H154 V111 Z"
                fill="#ffffff"
                stroke="#22272e"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              {/* Key bow (handle) */}
              <ellipse
                cx="205"
                cy="115.5"
                rx="9"
                ry="7"
                fill="#ffffff"
                stroke="#22272e"
                strokeWidth="2.2"
              />
              <ellipse
                cx="205"
                cy="115.5"
                rx="4"
                ry="3"
                fill="#ffffff"
                stroke="#22272e"
                strokeWidth="1.5"
              />
              {/* Vertical boundary line next to key */}
              <line
                x1="220"
                y1="83"
                x2="220"
                y2="133"
                stroke="#22272e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Title */}
        <h1
          className={`${
            isCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          } font-bold text-gray-900 tracking-tight leading-snug`}
        >
          {title}
        </h1>

        {/* Subtitle / Message */}
        <p
          className={`${
            isCompact
              ? 'mt-1.5 text-xs text-gray-500 max-w-sm'
              : 'mt-2 text-xs sm:text-sm text-gray-500 max-w-md'
          } leading-relaxed`}
        >
          {message}
        </p>

        {hint && (
          <p className="mt-1 text-[11px] text-gray-400 max-w-md">
            {hint}
          </p>
        )}

        {/* Optional Action Button */}
        {actionLabel && onAction && (
          <div className={isCompact ? 'mt-4' : 'mt-5'}>
            <button
              type="button"
              onClick={onAction}
              className={`inline-flex items-center justify-center gap-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export default PermissionDeniedPage

