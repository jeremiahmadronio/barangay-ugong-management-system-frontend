import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react'

interface ComplaintFileUploadProps {
  file?: File | null
  fileName?: string
  fileSize?: string
  onFileSelect: (file: File | null) => void
  statementText?: string
  onStatementTextChange?: (text: string) => void
}

export function ComplaintFileUpload({
  file,
  fileName,
  fileSize,
  onFileSelect,
  statementText = '',
  onStatementTextChange,
}: ComplaintFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const currentFileName = file?.name || fileName
  const currentFileSize = file
    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    : fileSize

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 font-normal">
        Upload a document or image containing the narrative/statement of facts. Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG (max 10 MB).
      </p>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag & Drop Upload Zone */}
      {!currentFileName ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-center ${
            isDragging
              ? 'border-blue-600 bg-blue-50/60 shadow-sm'
              : 'border-slate-200/90 bg-slate-50/50 hover:bg-blue-50/20 hover:border-blue-400'
          }`}
        >
          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-100 text-blue-600 mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-slate-800 mb-1">
            Drag & drop your narrative file here
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            or click to browse — .pdf, .doc, .docx, .txt, .jpg, .png
          </p>
        </div>
      ) : (
        /* Selected File Display Card */
        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800">{currentFileName}</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              {currentFileSize && (
                <p className="text-[11px] text-slate-500 mt-0.5">{currentFileSize}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Optional Direct Statement Textarea */}
      {onStatementTextChange && (
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Statement Summary / Additional Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={statementText}
            onChange={(e) => onStatementTextChange(e.target.value)}
            placeholder="Type a brief summary of facts or narrative here..."
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white resize-y"
          />
        </div>
      )}
    </div>
  )
}
