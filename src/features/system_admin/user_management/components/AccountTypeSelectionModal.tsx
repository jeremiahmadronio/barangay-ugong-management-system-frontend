import { Shield, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccountTypeSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelectAdmin: () => void
  onSelectUser: () => void
}

/**
 * Clean, simple Account Type Selection Modal matching the neutral project theme.
 */
export function AccountTypeSelectionModal({
  open,
  onClose,
  onSelectAdmin,
  onSelectUser,
}: AccountTypeSelectionModalProps) {
  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-slate-950/30 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-1 text-sm text-slate-500">
              What type of account would you like to create?
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Admin Account Option */}
            <button
              type="button"
              onClick={onSelectAdmin}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Shield size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600">
                    Admin Account
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Elevated privileges with access across multiple departments. All actions are audited.
                  </p>
                </div>
              </div>
            </button>

            {/* User Account Option */}
            <button
              type="button"
              onClick={onSelectUser}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-900">
                    User Account
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Staff / focal person with department-level access and specific permissions.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
