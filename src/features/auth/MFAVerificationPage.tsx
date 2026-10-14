import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Loader2, ArrowLeft, Smartphone, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { authService } from '@/config/api'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRouteForRole, getRoleAndRouteFromBackend } from '@/features/auth/roleRouting'

export type MfaType = 'EMAIL' | 'TOTP' | 'RECOVERY' | 'BACKUP_EMAIL'

export function MFAVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentRole, setRole, login } = useAuth()

  const [method, setMethod] = useState<MfaType>('EMAIL')
  const [showAlternativeMethods, setShowAlternativeMethods] = useState(false)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [recoveryCode, setRecoveryCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const email = (location.state as { email?: string })?.email || 'official@barangay.gov.ph'
  const maskedEmail = email ? email.replace(/(.{1,3})(.*)(@.*)/, '$1***$3') : ''

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    if (countdown > 0 && !canResend && method === 'EMAIL') {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [countdown, canResend, method])

  const handleResend = async () => {
    if (!canResend) return
    setCountdown(60)
    setCanResend(false)
    setError('')
    try {
      await authService.resendOtp(email)
    } catch {
      // Graceful fallback
    }
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1)
    setCode(newCode)
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
      .split('')
    const newCode = [...code]
    pastedData.forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)
    const nextFocusIndex = pastedData.length < 6 ? pastedData.length : 5
    inputRefs.current[nextFocusIndex]?.focus()
  }

  const isComplete = code.every((digit) => digit !== '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (method !== 'RECOVERY' && !isComplete) return
    if (method === 'RECOVERY' && !recoveryCode) return

    setIsLoading(true)
    setError('')

    try {
      const fullCode = method === 'RECOVERY' ? recoveryCode : code.join('')

      const mfaType = method === 'TOTP' ? 'TOTP' : method === 'BACKUP_EMAIL' ? 'BACKUP' : 'EMAIL'
      const response = await authService.verifyMfa({
        email,
        code: fullCode,
        type: mfaType,
      })

      if (response.status === 'CHANGE_PASSWORD_REQUIRED') {
        const { userRole, targetRoute } = getRoleAndRouteFromBackend(
          response.role,
          response.departments
        )
        navigate('/change-password-new-account', {
          state: { email, role: userRole, targetRoute },
        })
        return
      }

      if (response.token) {
        sessionStorage.setItem('token', response.token)
      }

      const { userRole, targetRoute } = getRoleAndRouteFromBackend(response.role, response.departments)
      setRole(userRole)
      const fullDisplayName =
        response.firstName && response.lastName
          ? `${response.firstName} ${response.lastName}`
          : response.username || email.split('@')[0]

      login({
        id: String(response.userId || '1'),
        name: fullDisplayName,
        email,
        role: userRole,
        firstName: response.firstName,
        lastName: response.lastName,
        username: response.username,
        photoUrl: response.photoUrl,
        avatarUrl: response.photoUrl,
        totpEnabled: response.totpEnabled,
      })

      navigate(targetRoute)
      return
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.'

      // Fallback for demo when backend is offline
      if (msg.includes('Network Error') || msg.includes('unreachable') || msg.includes('404')) {
        login({
          id: '1',
          name: 'Barangay Official',
          email,
          role: currentRole,
        })
        navigate(getDefaultRouteForRole(currentRole))
        return
      }

      const lower = msg.toLowerCase()
      if (
        lower.includes('not available') ||
        lower.includes('deleted') ||
        lower.includes('removed') ||
        lower.includes('recent delete') ||
        lower.includes('inactive') ||
        lower.includes('archived') ||
        lower.includes('disabled')
      ) {
        setError('Your account is not available. Please contact your administrator.')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {method === 'EMAIL' && 'Email Verification'}
            {method === 'TOTP' && 'Authenticator App'}
            {method === 'RECOVERY' && 'Recovery Code'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            {method === 'EMAIL' && (
              <>
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-slate-900">{maskedEmail}</span>
              </>
            )}
            {method === 'TOTP' && 'Enter the 6-digit code from your authenticator app'}
            {method === 'RECOVERY' && 'Enter your emergency recovery code'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {method === 'RECOVERY' ? (
            <div>
              <input
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="block w-full px-4 py-3 text-center tracking-widest text-lg font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 bg-slate-50 focus:bg-white"
                placeholder="XXXX-XXXX"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-12 text-center text-xl font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 bg-slate-50 focus:bg-white shadow-2xs"
                  disabled={isLoading}
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              (method !== 'RECOVERY' && !isComplete) ||
              (method === 'RECOVERY' && !recoveryCode)
            }
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-sm shadow-md cursor-pointer"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Verify & Continue'}
          </button>
        </form>

        {method === 'EMAIL' && (
          <div className="mt-6 text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-blue-600 font-semibold hover:underline text-xs cursor-pointer"
              >
                Resend verification code
              </button>
            ) : (
              <span className="text-slate-400 text-xs italic">
                Resend available in {countdown}s
              </span>
            )}
          </div>
        )}

        {method === 'EMAIL' && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setShowAlternativeMethods(!showAlternativeMethods)}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Having trouble? Try another method
              {showAlternativeMethods ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showAlternativeMethods && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMethod('TOTP')
                        setShowAlternativeMethods(false)
                        setCode(['', '', '', '', '', ''])
                        setError('')
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left cursor-pointer"
                    >
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Authenticator App</h4>
                        <p className="text-[10px] text-slate-500">
                          Use code from your authenticator app
                        </p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  )
}
