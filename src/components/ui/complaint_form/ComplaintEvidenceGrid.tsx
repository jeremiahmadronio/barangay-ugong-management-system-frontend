import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Upload, Paperclip } from 'lucide-react'

export interface EvidenceItem {
  id: string
  label: string
}

export const DEFAULT_EVIDENCE_ITEMS: EvidenceItem[] = [
  { id: 'damaged_equipment', label: 'Actual Damaged Equipment/Part' },
  { id: 'affidavit', label: 'Affidavit / Sworn Statement' },
  { id: 'cctv_footage', label: 'CCTV Footage (Digital/USB)' },
  { id: 'personal_belonging', label: 'Clothing or Personal Belonging' },
  { id: 'complaint_affidavit', label: 'Complaint Affidavit' },
  { id: 'lease_contract', label: 'Contract / Lease Agreement' },
  { id: 'court_subpoena', label: 'Court Order / Subpoena' },
  { id: 'dashcam_footage', label: 'Dashcam Footage' },
  { id: 'medical_certificate', label: 'Medical Certificate / Medico-Legal' },
  { id: 'police_blotter', label: 'Police Blotter / Extract' },
  { id: 'photographs', label: 'Photographs of Incident / Injury' },
  { id: 'audio_recording', label: 'Audio / Voice Recording' },
  { id: 'receipts_invoices', label: 'Receipts / Financial Invoices' },
  { id: 'text_messages', label: 'Text Messages / Messenger Screenshots' },
  { id: 'land_title', label: 'Land Title / Property Tax Declaration' },
  { id: 'barangay_clearance', label: 'Barangay Clearance / ID Copy' },
  { id: 'witness_statement', label: 'Witness Written Statement' },
  { id: 'repair_estimate', label: 'Vehicle / Property Repair Estimate' },
  { id: 'vawc_intake', label: 'VAWC Protection Order / Referral' },
  { id: 'lupon_notice', label: 'Lupon Summons / Notice of Hearing' },
  { id: 'inventory_list', label: 'Itemized Loss / Inventory List' },
  { id: 'social_media', label: 'Social Media Post / Printout' },
]

interface ComplaintEvidenceGridProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  evidenceFiles?: Record<string, File | null>
  onFileUpload?: (id: string, file: File | null) => void
  onPreviewFile?: (id: string) => void
  otherText: string
  onOtherTextChange: (val: string) => void
  items?: EvidenceItem[]
}

export function ComplaintEvidenceGrid({
  selectedIds,
  onChange,
  evidenceFiles = {},
  onFileUpload,
  onPreviewFile,
  otherText,
  onOtherTextChange,
  items = DEFAULT_EVIDENCE_ITEMS,
}: ComplaintEvidenceGridProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const initialCount = 8

  const visibleItems = isExpanded ? items : items.slice(0, initialCount)
  const hiddenCount = Math.max(0, items.length - initialCount)

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleFileChange = (id: string, file: File | null) => {
    onFileUpload?.(id, file)
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 font-normal">
        Choose the relevant evidence types submitted by the complainant.
      </p>

      {/* Grid of Checkbox Items (2 columns on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleItems.map((item) => {
          const isChecked = selectedIds.includes(item.id)
          const attachedFile = evidenceFiles[item.id]

          return (
            <div key={item.id} className="relative">
              {/* Hidden file input for this item */}
              <input
                ref={(el) => {
                  fileInputRefs.current[item.id] = el
                }}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(item.id, e.target.files[0])
                  }
                }}
              />

              <div
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-medium ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/40 text-slate-900 shadow-xs'
                    : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="leading-tight block truncate">{item.label}</span>
                    {attachedFile && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPreviewFile?.(item.id)
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 truncate text-left cursor-pointer"
                          title="Click to view file"
                        >
                          <Paperclip size={11} className="shrink-0 text-blue-600" />
                          <span className="truncate">{typeof attachedFile === 'string' ? attachedFile : (attachedFile as any).name || 'Attached File'}</span>
                          <span className="text-blue-500 font-normal">(View)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload File button appears when item is checked (Sample Image 1) */}
                {isChecked && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRefs.current[item.id]?.click()
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                      <Upload size={12} className="text-slate-500" />
                      {attachedFile ? 'Change File' : 'Upload File'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Expand / Collapse Button */}
      {hiddenCount > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Show {hiddenCount} more... <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Other / Specify Text Input */}
      <div className="pt-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Other / Specify
        </label>
        <input
          type="text"
          maxLength={250}
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder="e.g. Medical certificate, CCTV footage, etc."
          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
        />
      </div>
    </div>
  )
}
