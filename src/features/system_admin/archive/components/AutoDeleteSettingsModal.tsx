import { useState, useEffect } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { FormSection } from '@/components/ui/FormSection'
import { AlertTriangle } from 'lucide-react'
import type { ArchiveSettingsResponse } from '@/config/api/archive/archive.types'

interface AutoDeleteSettingsModalProps {
  open: boolean
  settings: ArchiveSettingsResponse
  onClose: () => void
  onSave: (newSettings: ArchiveSettingsResponse) => Promise<void>
}

export function AutoDeleteSettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: AutoDeleteSettingsModalProps) {
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(settings.autoDeleteEnabled)
  const [deleteAfterDays, setDeleteAfterDays] = useState(settings.deleteAfterDays)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setAutoDeleteEnabled(settings.autoDeleteEnabled)
      setDeleteAfterDays(settings.deleteAfterDays)
      setIsSubmitting(false)
    }
  }, [open, settings])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSave({
        autoDeleteEnabled,
        deleteAfterDays,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      size="md"
      title="Auto-Delete Settings"
      subtitle="Configure retention policy for Recently Deleted items."
      submitLabel="Save Changes"
      submitTone="blue"
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-5">
        <FormSection title="Retention Policy">
          <div className="space-y-4">
            {/* Toggle switch */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="pr-4">
                <span className="text-sm font-semibold text-slate-800 block">
                  Enable Auto-Delete
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Automatically purge records after the retention period.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={autoDeleteEnabled}
                  onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Retention Period Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Retention Duration
              </label>
              <select
                value={deleteAfterDays}
                onChange={(e) => setDeleteAfterDays(Number(e.target.value))}
                disabled={!autoDeleteEnabled}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Default)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>
        </FormSection>

        {/* Warning banner with colored styling */}
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertTriangle size={15} className="shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-900">Warning:</strong> Purged records cannot be recovered once permanently deleted.
          </p>
        </div>
      </div>
    </FormModal>
  )
}

