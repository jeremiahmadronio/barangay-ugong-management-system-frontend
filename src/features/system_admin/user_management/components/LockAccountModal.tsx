import { useState } from 'react'
import { FormModal } from '@/components/ui/FormModal'

interface LockAccountModalProps {
  open: boolean
  userName: string
  onClose: () => void
  onConfirmLock: (lockUntilDate?: string) => Promise<void>
}

export function LockAccountModal({
  open,
  userName,
  onClose,
  onConfirmLock,
}: LockAccountModalProps) {
  const [lockUntil, setLockUntil] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await onConfirmLock(lockUntil || undefined)
      onClose()
    } catch (err) {
      console.error('Failed to lock account:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      title="Lock Account"
      submitLabel="Lock Account"
      isSubmitting={isSubmitting}
      maxWidthClass="max-w-md"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Updating <span className="font-semibold text-slate-900">{userName}</span> (account)
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Lock Until <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={lockUntil}
            onChange={(e) => setLockUntil(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-slate-50/40 focus:ring-0"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            If empty, default lock period will be used.
          </p>
        </div>
      </div>
    </FormModal>
  )
}
