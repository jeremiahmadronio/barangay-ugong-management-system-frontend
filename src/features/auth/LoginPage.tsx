import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
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
        })
        navigate(targetRoute)
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.'

      // Fallback for demo when backend is offline
      if (msg.includes('Network Error') || msg.includes('unreachable') || msg.includes('404')) {
        login({
          id: '1',
          name: 'Barangay Official',
          email,
          role: 'official',
        })
        navigate('/mfa-verification', { state: { email } })
        return
      }

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
        <Link
          to="/"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Home
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Sign in to your official account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="official@barangay.gov.ph"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <div
            className={`flex items-start gap-2.5 p-3 rounded-lg border transition-colors ${
              agreedToTerms ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              id="agree-terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded cursor-pointer shrink-0"
            />
            <label htmlFor="agree-terms" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link
                to="/terms-and-conditions"
                className="font-semibold text-blue-600 hover:underline"
              >
                Terms and Conditions
              </Link>{' '}
              of Barangay Ugong System. <span className="text-red-500 font-bold">*</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !agreedToTerms}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  )
}
