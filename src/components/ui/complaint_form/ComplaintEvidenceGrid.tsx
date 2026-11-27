import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Upload, Paperclip, X } from 'lucide-react'

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
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; isImage: boolean } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const initialCount = items.length <= 10 ? items.length : 8

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

  const handlePreview = (item: EvidenceItem, file: File | string) => {
    if (onPreviewFile) {
      onPreviewFile(item.id)
      return
    }
    if (file instanceof File) {
      const isImg = file.type.startsWith('image/')
      const url = URL.createObjectURL(file)
      setPreviewFile({ url, name: file.name, isImage: isImg })
    }
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
                accept="image/*,.pdf,.doc,.docx"
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
                      <div className="flex items-center gap-1.5 mt-1">
                        {attachedFile instanceof File && attachedFile.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(attachedFile)}
                            alt="Evidence thumbnail"
                            className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <Paperclip size={11} className="shrink-0 text-blue-600" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreview(item, attachedFile)
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 truncate text-left cursor-pointer"
                          title="Click to view file"
                        >
                          <span className="truncate max-w-[120px]">
                            {typeof attachedFile === 'string' ? attachedFile : (attachedFile as any).name || 'Attached File'}
                          </span>
                          <span className="text-blue-500 font-normal shrink-0">(View)</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFileChange(item.id, null)
                          }}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Other / Specify
          </label>
          <span className="text-xs text-slate-400 font-normal">
            {(otherText || "").length}/250
          </span>
        </div>
        <input
          type="text"
          maxLength={250}
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder="e.g. Medical certificate, CCTV footage, etc."
          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
        />
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 truncate pr-2">
                {previewFile.name}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
              {previewFile.isImage ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[60vh] rounded-lg border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
