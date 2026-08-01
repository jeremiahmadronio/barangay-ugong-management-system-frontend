import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { ActionModal } from '@/components/ui/ActionModal'
import { authService } from '@/config/api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const email = (location.state as { email?: string; code?: string })?.email || ''
  const code = (location.state as { email?: string; code?: string })?.code || ''

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[@$!%*?&]/.test(newPassword),
  }

  const isPasswordValid = Object.values(passwordRules).every(Boolean)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !code) {
      setError('Password reset session has expired or is invalid. Please start again from Forgot Password.')
      return
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword({
        email,
        code,
        newPassword,
        confirmPassword,
      })
      setShowSuccessModal(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    navigate('/login')
  }

  const RuleItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        valid ? 'text-emerald-600 font-semibold' : 'text-slate-400'
      }`}
    >
      {valid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      {text}
    </div>
  )

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Reset Your Password</h2>
          <p className="text-slate-500 text-xs">Create a strong new password for ({email})</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pl-9 pr-9 py-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300'
                    : confirmPassword && passwordsMatch
                    ? 'border-emerald-300'
                    : 'border-slate-200'
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[11px] font-bold text-slate-600 mb-2">Password requirements:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <RuleItem valid={passwordRules.minLength} text="8+ characters" />
              <RuleItem valid={passwordRules.hasUppercase} text="Uppercase (A-Z)" />
              <RuleItem valid={passwordRules.hasLowercase} text="Lowercase (a-z)" />
              <RuleItem valid={passwordRules.hasNumber} text="Number (0-9)" />
              <RuleItem valid={passwordRules.hasSpecial} text="Special (@$!%*?&)" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-xs shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Login
          </button>
        </div>
      </motion.div>

      <ActionModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Password Reset Successful"
        type="success"
      >
        <p>Your password has been successfully reset. Please log in with your new credentials.</p>
      </ActionModal>
    </AuthLayout>
  )
}
