import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { authService } from '@/config/api'
import { useAuth } from '@/hooks/useAuth'
import { getRoleAndRouteFromBackend } from '@/features/auth/roleRouting'

export function LoginPage() {
  const navigate = useNavigate()
  const { setRole, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions before signing in.')
      return
    }

    setIsLoading(true)

    try {
      // Call Java Spring Boot backend via Axios authService
      const response = await authService.login({ email, password })

      if (response.status === 'MFA_REQUIRED') {
        navigate('/mfa-verification', { state: { email } })
        return
      }

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

      if (response.status === 'SUCCESS') {
        if (response.token) {
          sessionStorage.setItem('token', response.token)
        }
        const { userRole, targetRoute } = getRoleAndRouteFromBackend(
          response.role,
          response.departments
        )
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
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.'

      if (
        msg.includes('Network Error') ||
        msg.includes('unreachable') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('timeout')
      ) {
        setError('Unable to connect to the server. Please check your internet connection or try again later.')
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
        className="w-full max-w-[390px] sm:max-w-[410px] bg-white pt-[32px] pb-[24px] px-[28px] sm:px-[32px] rounded-[14px] shadow-2xl relative mt-6 antialiased"
      >
        {/* Overlapping Floating Seal Badge */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-full bg-[#eff6ff] border-[3px] border-blue-100 flex items-center justify-center shadow-md z-10 overflow-hidden">
          <img
            src="/ugong-logo.png"
            alt="Barangay Ugong Logo"
            className="w-full h-full object-contain p-1 drop-shadow-sm bg-white rounded-full"
            onError={(e) => {
              ; (e.target as HTMLImageElement).src = '/logo.png'
            }}
          />
        </div>

        {/* Card Header */}
        <div className="mb-4 text-center flex flex-col items-center mt-1">
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 mb-0.5">
            Welcome Back
          </h2>
          <p className="text-[13px] sm:text-[13.5px] text-slate-500 font-normal">
            Log in to your account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs leading-relaxed font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-3">
            <label
              htmlFor="email"
              className="block text-[11px] sm:text-[12px] font-semibold text-[#0f172a] tracking-wide mb-1.5 uppercase"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="official@barangay.gov.ph"
              className="block w-full px-3.5 py-1.5 h-[38px] sm:h-[40px] border border-slate-200 rounded-[8px] focus:border-[#2563eb] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all duration-200 text-[13.5px] font-normal text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="mb-2.5">
            <label
              htmlFor="password"
              className="block text-[11px] sm:text-[12px] font-semibold text-[#0f172a] tracking-wide mb-1.5 uppercase"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-3.5 pr-10 py-1.5 h-[38px] sm:h-[40px] border border-slate-200 rounded-[8px] focus:border-[#2563eb] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all duration-200 text-[13.5px] font-normal text-slate-700 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                disabled={isLoading}
              />
              {password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between mb-3 pt-0.5">
            <label className="flex items-center text-[12px] text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-[14px] w-[14px] text-[#2563eb] focus:ring-0 border-slate-300 rounded cursor-pointer mr-1.5"
                disabled={isLoading}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-[12px] sm:text-[12.5px] font-medium text-blue-600 hover:text-blue-700 focus:outline-none hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Terms & Conditions Agreement */}
          <div
            className={`mb-3 flex items-start gap-2.5 p-2.5 rounded-[8px] border transition-colors ${agreedToTerms
              ? 'bg-blue-50 border-blue-200'
              : 'bg-[#fafafa] border-slate-200'
              }`}
          >
            <input
              id="agree-terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-[2px] h-[15px] w-[15px] text-[#2563eb] focus:ring-0 border-slate-300 rounded cursor-pointer shrink-0 transition-all duration-200"
            />
            <label
              htmlFor="agree-terms"
              className="text-[12px] sm:text-[12.5px] text-slate-600 cursor-pointer leading-relaxed mt-0 select-none"
            >
              I have read and agree to the{' '}
              <button
                type="button"
                className="font-medium text-[#2563eb] hover:text-[#1d4ed8] focus:outline-none underline inline-block"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowTerms(true)
                }}
              >
                Terms and Conditions
              </button>
              . <span className="text-red-500 font-medium">*</span>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="w-full flex justify-center items-center h-[40px] sm:h-[42px] rounded-[8px] text-white bg-[#2563eb] hover:bg-[#1d4ed8] hover:-translate-y-[1px] hover:shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-[14px] font-bold shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Signing
                  in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            <p className="text-center text-[11.5px] text-slate-400 mt-2.5 font-normal">
              Need help logging in? Contact your barangay administrator.
            </p>
          </div>
        </form>

        {/* Back to Home Link */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-[12px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Public Portal
          </Link>
        </div>
      </motion.div>

      {/* Terms and Conditions Modal */}
      {showTerms &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowTerms(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 z-10">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Terms and Conditions
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3.5">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    1. Acceptance of Terms
                  </h4>
                  <p>
                    By accessing and using the Barangay Ugong Management System, you
                    agree to comply with and be bound by these terms and conditions.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    2. Authorized Use
                  </h4>
                  <p>
                    This system is strictly for the use of authorized personnel of
                    Barangay Ugong. Any unauthorized access, modification, or
                    distribution of data is strictly prohibited and punishable by law.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    3. Data Privacy (RA 10173)
                  </h4>
                  <p>
                    All information handled within this system must be treated with
                    the utmost confidentiality in compliance with the Data Privacy Act
                    of 2012. You are responsible for maintaining the security of your
                    account credentials.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    4. User Responsibilities & Audit Logging
                  </h4>
                  <p>
                    Users must ensure the accuracy of all records encoded. All
                    actions, updates, and transactions within this portal are
                    continuously audited and logged for accountability.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <Link
                  to="/terms-and-conditions"
                  target="_blank"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Read full document ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors focus:outline-none shadow-sm cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AuthLayout>
  )
}
