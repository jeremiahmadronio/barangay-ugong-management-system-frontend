import { FileText, Download, Eye, HardDrive } from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'

export interface DetailFileItem {
  id: string
  name: string
  size?: string // e.g. "2.4 MB"
  fileType?: string // e.g. "PDF", "DOCX", "PNG"
  uploadDate?: string
  url?: string
  onDownload?: (file: DetailFileItem) => void
  onView?: (file: DetailFileItem) => void
}

interface DetailFilesPanelProps {
  title?: string
  items: DetailFileItem[]
  emptyMessage?: string
}

/**
 * Files viewing detail panel.
 * Displays uploaded files, documents, attachments with file size, extension badge, and actions.
 * Features an aesthetic empty state when no files exist.
 */
export function DetailFilesPanel({
  title = 'Attached Files & Documents',
  items,
  emptyMessage = 'No files or documents uploaded for this record.',
}: DetailFilesPanelProps) {
  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-slate-900">{title} ({items.length})</h2>
      )}

      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((file) => (
            <div
              key={file.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {file.fileType && <Badge tone="indigo">{file.fileType}</Badge>}
                    {file.size && <span>{file.size}</span>}
                    {file.uploadDate && (
                      <>
                        <span>•</span>
                        <span>{file.uploadDate}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {file.onView && (
                  <button
                    type="button"
                    onClick={() => file.onView?.(file)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> View
                  </button>
                )}
                {file.onDownload && (
                  <button
                    type="button"
                    onClick={() => file.onDownload?.(file)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <HardDrive size={22} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">No Attached Files</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}
