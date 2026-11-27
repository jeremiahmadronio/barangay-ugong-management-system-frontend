import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { authService } from '@/config/api/auth/auth.service'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      await authService.forgotPassword(trimmedEmail)
      navigate('/reset-code', { state: { email: trimmedEmail } })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset code.'
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
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Login
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password?</h2>
          <p className="text-slate-500 text-xs">
            Enter your email and we'll send you a verification code
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="admin@barangay.gov.ph"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-xs shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending Code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  )
}
