import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Shield, Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { authService } from '@/config/api'

export function ResetCodeVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = (location.state as { email?: string })?.email || ''
  const maskedEmail = email ? email.replace(/(.{1,3})(.*)(@.*)/, '$1***$3') : ''

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [countdown, canResend])

  const handleResend = async () => {
    if (!canResend) return
    setError('')
    try {
      if (email) {
        await authService.forgotPassword(email)
      }
      setCountdown(60)
      setCanResend(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.'
      setError(msg)
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
    if (!isComplete) return

    if (!email) {
      setError('Missing account email. Please restart the password reset process.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const fullCode = code.join('')
      await authService.verifyResetCode({ email, code: fullCode })
      navigate('/reset-password', { state: { email, code: fullCode } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.'
      setError(msg)
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
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-900">{maskedEmail}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
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

          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-sm shadow-md cursor-pointer"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-8 text-center">
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
          <div className="mt-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Link>
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  )
}
