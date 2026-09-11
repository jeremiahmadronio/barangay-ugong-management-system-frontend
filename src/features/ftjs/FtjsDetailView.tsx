import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Edit3,
  Printer,
  RefreshCcw,
  User as UserIcon,
  GraduationCap,
  FileText,
  Briefcase,
  Loader2,
  History,
  Send,
  Plus,
  AlertCircle,
  Eye,
  Download,
} from 'lucide-react'
import {
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailInfoCard, 
  DetailEmptyPanel,
  DetailCaseNotesPanel,
  DetailQuickActionCards,
  type DetailTab,
} from '@/components/ui/details'
import { Badge } from '@/components/ui/table/Badge'
import { DetailsModal } from '@/components/ui/DetailsModal'
import { FtjsReissuanceModal } from './FtjsReissuanceModal'
import { ftjsService } from '@/config/api/ftjs/ftjs.service'
import type {
  FtjsDetailResponse,
  FtjsTimelineDto,
  FtjsNoteResponse,
  ReIssuanceHistoryDto,
  FtjsArchiveTableItem,
  FtjsTableDTO,
} from '@/config/api/ftjs/ftjs.types'
import { formatDate, formatDateTime, formatEnumLabel } from '@/utils/formatters'
import { generateFtjsCertificate } from '@/utils/generateFtjsCertificate'
import { useAuth } from '@/hooks/useAuth'

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatusLabel(status?: string | null): string {
  if (!status) return 'Issued'
  const upper = status.toUpperCase()
  if (upper === 'RE_ISSUANCE' || upper === 'REISSUANCE') return 'Re-Issuance Request'
  if (upper === 'ISSUED') return 'Certificate Issued'
  return formatEnumLabel(status)
}

function getStatusTone(status?: string | null): 'emerald' | 'sky' | 'amber' | 'slate' {
  const upper = String(status || '').toUpperCase()
  if (upper === 'ISSUED') return 'emerald'
  if (upper === 'RE_ISSUANCE' || upper === 'REISSUANCE') return 'sky'
  return 'amber'
}

function formatDisplayDate(value?: string | null): string {
  if (!value) return '—'
  return formatDate(value)
}

function formatTimelineDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${datePart} at ${timePart}`
  } catch {
    return isoString
  }
}

function computeExpiryDate(dateReleased?: string | null): string {
  if (!dateReleased) return '—'
  try {
    const d = new Date(dateReleased)
    if (isNaN(d.getTime())) return '—'
    d.setFullYear(d.getFullYear() + 1)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function computeAgeFromBirthDate(birthDateStr?: string | null, rawAge?: number | null): number | null {
  if (rawAge != null && !isNaN(Number(rawAge)) && Number(rawAge) > 0) {
    return Number(rawAge)
  }
  if (!birthDateStr) return null
  try {
    const dob = new Date(birthDateStr)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  } catch {
    return null
  }
}

// ── Component Props ────────────────────────────────────────────────────────

interface FtjsDetailViewProps {
  ftjsId: number
  onBack: () => void
  onEdit?: () => void
  onPrint?: () => void
  onReIssue?: () => void
  readOnly?: boolean
}

// ── Quick Action Cards (3 Clean Buttons) ───────────────────────────────────

function FtjsQuickActionCards({
  onEdit,
  onPrint,
  onReIssue,
  readOnly = false,
}: {
  onEdit?: () => void
  onPrint?: () => void
  onReIssue?: () => void
  readOnly?: boolean
}) {
  if (readOnly) return null

  return (
    <DetailQuickActionCards
      actions={[
        ...(onEdit ? [{
          id: 'edit-request',
          title: 'Edit Request',
          subtitle: 'Update request details',
          icon: Edit3,
          onClick: onEdit,
        }] : []),
        ...(onPrint ? [{
          id: 'print-cert',
          title: 'Print Certificate',
          subtitle: 'Generate official certificate copy',
          icon: Printer,
          onClick: onPrint,
        }] : []),
        ...(onReIssue ? [{
          id: 'reissue-request',
          title: 'Create Re-Issuance Request',
          subtitle: 'Prepare replacement request',
          icon: RefreshCcw,
          onClick: onReIssue,
        }] : []),
      ]}
    />
  )
}

// ── Helper: Convert Base64 or Number Array to Blob & Blob URL ──────────────

function getFileBlobInfo(
  fileData: string | number[] | Uint8Array,
  defaultMime = 'image/png'
) {
  try {
    let bytes: Uint8Array
    let mimeType = defaultMime

    if (typeof fileData === 'string') {
      const trimmed = fileData.trim()
      if (!trimmed) return null

      if (trimmed.startsWith('data:')) {
        const match = trimmed.match(/^data:([^;]+);base64,(.*)$/)
        if (match) {
          mimeType = match[1]
          const binary = atob(match[2])
          bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        } else {
          return null
        }
      } else if (trimmed.startsWith('http') || trimmed.startsWith('blob:')) {
        return { blobUrl: trimmed, mimeType: 'image/png', isImage: true, isPdf: false }
      } else {
        // Raw Base64 string from Spring Boot / Jackson byte[] serialization
        if (trimmed.startsWith('JVBERi0')) {
          mimeType = 'application/pdf'
        } else if (trimmed.startsWith('/9j/')) {
          mimeType = 'image/jpeg'
        } else if (trimmed.startsWith('iVBORw0KGgo')) {
          mimeType = 'image/png'
        } else if (trimmed.startsWith('R0lGOD')) {
          mimeType = 'image/gif'
        }

        const binary = atob(trimmed)
        bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      }
    } else if (Array.isArray(fileData)) {
      if (fileData.length === 0) return null
      bytes = new Uint8Array(fileData)
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        mimeType = 'application/pdf'
      } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        mimeType = 'image/jpeg'
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        mimeType = 'image/png'
      }
    } else {
      bytes = new Uint8Array(fileData)
    }

    const blob = new Blob([bytes.buffer as BlobPart], { type: mimeType })
    const blobUrl = URL.createObjectURL(blob)
    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'

    return { blobUrl, mimeType, isImage, isPdf }
  } catch (e) {
    console.error('Error creating file blob:', e)
    return null
  }
}

// ── Document Card with New-Tab View & Download Actions ─────────────────────

function FtjsDocumentCard({
  title,
  fileData,
  defaultFileName,
}: {
  title: string
  fileData: string | number[] | Uint8Array | null
  defaultFileName: string
}) {
  const blobInfo = useMemo(() => {
    if (!fileData) return null
    return getFileBlobInfo(fileData)
  }, [fileData])

  const hasFile = blobInfo !== null

  const handleOpenPreview = () => {
    if (!blobInfo) return
    try {
      const win = window.open(blobInfo.blobUrl, '_blank')
      if (win) {
        win.focus()
      } else {
        const a = document.createElement('a')
        a.href = blobInfo.blobUrl
        a.download = defaultFileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (e) {
      console.error('Error opening file in new tab:', e)
    }
  }

  const handleDownload = () => {
    if (!blobInfo) return
    try {
      const a = document.createElement('a')
      a.href = blobInfo.blobUrl
      a.download = defaultFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download file:', err)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {hasFile ? 'Document attached & verified' : 'No document attached'}
            </p>
          </div>
        </div>
        {hasFile ? (
          <Badge tone="emerald">ATTACHED</Badge>
        ) : (
          <Badge tone="slate">NOT SUBMITTED</Badge>
        )}
      </div>

      {hasFile ? (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            View Document
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 italic">No document file available</p>
        </div>
      )}
    </div>
  )
}

// ── Notes Panel (FTJS-specific, calls FTJS API) ───────────────────────────

function FtjsNotesPanel({ ftjsId }: { ftjsId: number }) {
  const [notes, setNotes] = useState<FtjsNoteResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await ftjsService.getNotes(ftjsId)
      setNotes(data)
    } catch (err) {
      console.error('Failed to fetch FTJS notes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [ftjsId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleOpenAddForm = () => {
    setIsAddingNote(true)
    setError(null)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleCancel = () => {
    setIsAddingNote(false)
    setNewNoteText('')
    setError(null)
  }

  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const created = await ftjsService.addNote(ftjsId, newNoteText.trim())
      setNotes((prev) => [created, ...prev])
      setNewNoteText('')
      setIsAddingNote(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveNote()
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notes...
      </div>
    )
  }

  if (!notes.length && !isAddingNote) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
        <div className="flex justify-end mb-4 -mt-6 -mr-6">
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-slate-50 p-4 mb-3 border border-slate-100">
            <FileText className="h-10 w-10 text-slate-300 stroke-1" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Case Notes</h3>
          <p className="mt-1 text-xs font-medium text-slate-400 max-w-sm">
            No notes have been recorded for this FTJS application yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Case Notes</h3>
        </div>
        {!isAddingNote && (
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </button>
        )}
      </div>

      {isAddingNote && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
          <textarea
            ref={textareaRef}
            rows={4}
            maxLength={500}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your note here... (Press Enter to save)"
            className="w-full rounded-xl border-2 border-blue-500 bg-white p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              {newNoteText.length} / 500 characters
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSaving || !newNoteText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSaving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 flex items-center gap-2 border border-red-100">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5 transition-colors hover:bg-slate-50"
            >
              <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {note.note}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{note.createdBy || 'Barangay Officer'}</span>
                {note.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatTimelineDate(note.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Timeline Panel (FTJS-specific) ─────────────────────────────────────────

function FtjsTimelinePanel({ ftjsId }: { ftjsId: number }) {
  const [events, setEvents] = useState<FtjsTimelineDto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    ftjsService
      .getTimeline(ftjsId)
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch((err) => console.error('Failed to fetch FTJS timeline:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ftjsId])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading timeline events...
      </div>
    )
  }

  if (!events.length) {
    return (
      <DetailEmptyPanel
        icon={<History className="h-10 w-10 text-slate-300 stroke-1" />}
        title="Timeline"
        description="No timeline events are available for this application yet."
      />
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      <div className="space-y-6 border-l-2 border-slate-200/80 pl-6 my-1">
        {events.map((ev, index) => (
          <div key={ev.id} className="relative group">
            <span
              className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-transform group-hover:scale-125 ${
                index === 0 ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
              }`}
            />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900">{ev.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                {ev.eventDate && <span>{formatTimelineDate(ev.eventDate)}</span>}
                {ev.actorName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500 font-semibold">
                      <UserIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      {ev.actorName}
                    </span>
                  </>
                )}
              </div>
              {ev.description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5 whitespace-pre-wrap">
                  {ev.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Re-Issuance Panel (Matching User Screenshot Exactly) ──────────────────

function FtjsReIssuancePanel({
  ftjsId,
  onCountChange,
  onRequestNew,
  onPrint,
}: {
  ftjsId: number
  onCountChange?: (count: number) => void
  onRequestNew?: () => void
  onPrint?: () => void
}) {
  const [history, setHistory] = useState<ReIssuanceHistoryDto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    ftjsService
      .getReIssuanceHistory(ftjsId)
      .then((data) => {
        if (!cancelled) {
          setHistory(data)
          onCountChange?.(data.length)
        }
      })
      .catch((err) => console.error('Failed to fetch re-issuance history:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ftjsId, onCountChange])

  const handleViewAffidavit = (fileData?: string | number[] | Uint8Array | null) => {
    if (fileData) {
      const info = getFileBlobInfo(fileData)
      if (info) {
        window.open(info.blobUrl, '_blank')
        return
      }
    }
    alert('No affidavit document attached to this re-issuance record.')
  }

  const handlePrintCertificate = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading re-issuance history...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RefreshCcw className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            Replacement / Re-issuance History
          </h3>
        </div>
        {onRequestNew && (
          <button
            type="button"
            onClick={onRequestNew}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Request
          </button>
        )}
      </div>

      {/* History Items or Empty State */}
      {!history.length ? (
        <div className="py-8 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            No re-issuance requests have been recorded for this certificate yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {history.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-2xs"
            >
              {/* Top Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Re-issuance #{item.issuanceNumber || idx + 1}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Requested on {formatDisplayDate(item.requestedAt)}
                  </p>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100/70 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-700" />
                    Print Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewAffidavit(item.affidavitFiles)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/60 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100/70 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                    View Affidavit
                  </button>
                </div>
              </div>

              {/* 4-Column Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    REASON
                  </p>
                  <p className="text-xs font-normal text-slate-700 mt-1 break-words">
                    {item.reason || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    DATE OF LOSS
                  </p>
                  <p className="text-xs font-normal text-slate-700 mt-1">
                    {formatDisplayDate(item.dateOfLoss)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    OR NUMBER
                  </p>
                  <p className="text-xs font-normal text-slate-700 mt-1">
                    {item.orNumber || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    PROVIDED BY
                  </p>
                  <p className="text-xs font-normal text-slate-700 mt-1">
                    {item.providedBy || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main FTJS Detail View ──────────────────────────────────────────────────

interface FtjsDetailViewProps {
  ftjsId: number
  onBack: () => void
  onEdit?: () => void
  onPrint?: () => void
  onReIssue?: () => void
  readOnly?: boolean
  initialData?: FtjsArchiveTableItem | FtjsTableDTO | null
}

export function FtjsDetailView({
  ftjsId,
  onBack,
  onEdit,
  onPrint,
  onReIssue,
  readOnly = false,
  initialData = null,
}: FtjsDetailViewProps) {
  const { currentRole } = useAuth()
  const isSystemAdmin = currentRole === 'rootadmin' || currentRole === 'admin'
  const isEffectiveReadOnly = Boolean(readOnly || isSystemAdmin)

  const [detail, setDetail] = useState<FtjsDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [reIssuanceCount, setReIssuanceCount] = useState(0)
  const [notesCount, setNotesCount] = useState(0)
  const [isReissuanceModalOpen, setIsReissuanceModalOpen] = useState(false)

  const handleGeneratePdf = useCallback(() => {
    if (!detail) return
    const dobStr = detail.detail?.birthDate || detail.detail?.dateOfBirth || detail.detail?.birthday || detail.detail?.residencyDate
    const computedAge = computeAgeFromBirthDate(dobStr, detail.detail?.age)
    generateFtjsCertificate({
      fullName: detail.applicantFullName,
      address: detail.detail?.completeAddress || '3S CENTER BARANGAY UGONG, VALENZUELA CITY',
      purpose: detail.purpose,
      dateIssued: detail.dateReleased || new Date(),
      age: computedAge,
    })
  }, [detail])

  const handlePrintClick = onPrint || handleGeneratePdf

  const handleOpenReissueModal = useCallback(() => {
    if (readOnly) return
    if (onReIssue) {
      onReIssue()
    } else {
      setIsReissuanceModalOpen(true)
    }
  }, [onReIssue, readOnly])

  const fetchDetail = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await ftjsService.getDetail(ftjsId)
      setDetail(data)
    } catch (error) {
      console.error('Failed to fetch FTJS detail:', error)
      if (initialData) {
        setDetail({
          id: initialData.id,
          ftjsApplicationNumber: initialData.trackingNumber || `FTJS-${initialData.id}`,
          applicantFullName: initialData.fullName,
          purpose: initialData.purpose,
          status: initialData.status,
          issuanceCount: initialData.issuanceCount,
          dateReleased: initialData.dateSubmitted,
          detail: {
            completeAddress: '3S CENTER BARANGAY UGONG, VALENZUELA CITY',
          },
        } as FtjsDetailResponse)
      } else {
        setDetail(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [ftjsId, initialData])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const statusLabel = getStatusLabel(detail?.status)
  const statusTone = getStatusTone(detail?.status)

  // ── Tab Content ─────────────────────────────────────────────────────────

  const tabs: DetailTab[] = useMemo(() => {
    if (!detail) return []

    const resident = detail.detail
    const dobStr = resident?.birthDate || resident?.dateOfBirth || resident?.birthday || resident?.residencyDate
    const computedAge = computeAgeFromBirthDate(dobStr, resident?.age)

    return [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <div className="space-y-6">
            {/* Three Quick Action Cards */}
            <FtjsQuickActionCards
              onEdit={onEdit}
              onPrint={handlePrintClick}
              onReIssue={handleOpenReissueModal}
              readOnly={readOnly}
            />

            {/* Two side-by-side info cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applicant Information */}
              <DetailInfoCard
                title="Applicant Information"
                icon={<UserIcon className="h-4 w-4 text-slate-600" />}
                columns={2}
                fields={[
                  {
                    label: 'FULL NAME',
                    value: detail.applicantFullName || '—',
                  },
                  {
                    label: 'BIRTHDAY',
                    value: dobStr
                      ? formatDisplayDate(dobStr)
                      : '—',
                  },
                  {
                    label: 'AGE',
                    value: computedAge != null ? String(computedAge) : '—',
                  },
                  {
                    label: 'GENDER',
                    value: resident?.gender || '—',
                  },
                  {
                    label: 'CIVIL STATUS',
                    value: resident?.civilStatus || '—',
                  },
                  {
                    label: 'CONTACT NUMBER',
                    value: resident?.contactNumber || '—',
                  },
                  {
                    label: 'EMAIL',
                    value: resident?.email || '—',
                  },
                  {
                    label: 'COMPLETE ADDRESS',
                    value: resident?.completeAddress || '—',
                  },
                ]}
              />

              {/* Request Information */}
              <DetailInfoCard
                title="Request Information"
                icon={<Briefcase className="h-4 w-4 text-slate-600" />}
                columns={1}
                fields={[
                  {
                    label: 'APPLICATION NUMBER',
                    value: (
                      <span className="font-semibold text-slate-900">
                        {detail.ftjsApplicationNumber || '—'}
                      </span>
                    ),
                  },
                  {
                    label: 'STATUS',
                    value: (
                      <Badge tone={statusTone}>
                        {statusLabel}
                      </Badge>
                    ),
                  },
                  {
                    label: 'DATE SUBMITTED',
                    value: formatDisplayDate(detail.dateReleased),
                  },
                  {
                    label: 'PURPOSE',
                    value: detail.purpose || '—',
                  },
                  {
                    label: 'ISSUANCE COUNT',
                    value: String(detail.issuanceCount ?? 1),
                  },
                  {
                    label: 'VERIFIED BY',
                    value: detail.verifiedBy || '—',
                  },
                ]}
              />
            </div>

            {/* Education Information */}
            <DetailInfoCard
              title="Education Information"
              icon={<GraduationCap className="h-4 w-4 text-slate-600" />}
              columns={3}
              fields={[
                {
                  label: 'EDUCATIONAL ATTAINMENT',
                  value: detail.educationalAttainment || '—',
                },
                {
                  label: 'GRADE / YEAR LEVEL',
                  value: detail.course || '—',
                },
                {
                  label: 'SCHOOL / INSTITUTION',
                  value: detail.institution || '—',
                },
              ]}
            />
          </div>
        ),
      },
      {
        id: 'documents',
        label: 'Documents',
        content: (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Uploaded Documents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valid ID */}
                <FtjsDocumentCard
                  title="Valid ID Requirement"
                  fileData={detail.validId}
                  defaultFileName={`Valid_ID_${detail.ftjsApplicationNumber || 'FTJS'}.png`}
                />

                {/* Oath Taking */}
                <FtjsDocumentCard
                  title="Oath Taking Certificate"
                  fileData={detail.oath}
                  defaultFileName={`Oath_Taking_${detail.ftjsApplicationNumber || 'FTJS'}.pdf`}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'notes',
        label: `Notes ${notesCount > 0 ? `(${notesCount})` : ''}`,
        content: (
          <DetailCaseNotesPanel
            caseId={ftjsId}
            onNotesCountChange={setNotesCount}
            isReadOnly={isEffectiveReadOnly}
            onFetchNotes={async (id) => {
              const res = await ftjsService.getNotes(Number(id))
              return res.map((n) => ({
                id: n.id,
                note: n.note,
                createdBy: n.createdBy,
                createdAt: n.createdAt,
              }))
            }}
            onAddNote={
              isEffectiveReadOnly
                ? undefined
                : async (id, noteText) => {
                    const res = await ftjsService.addNote(Number(id), noteText)
                    return {
                      id: res.id,
                      note: res.note,
                      createdBy: res.createdBy,
                      createdAt: res.createdAt,
                    }
                  }
            }
            emptyTitle="Application Notes"
            emptyDescription="No notes or remarks have been recorded for this FTJS application yet."
          />
        ),
      },
      {
        id: 'timeline',
        label: 'Timeline',
        content: <FtjsTimelinePanel ftjsId={ftjsId} />,
      },
      {
        id: 'reissuance',
        label: `Re-Issuance ${reIssuanceCount > 0 ? `(${reIssuanceCount})` : ''}`,
        content: (
          <FtjsReIssuancePanel
            ftjsId={ftjsId}
            onCountChange={setReIssuanceCount}
            onRequestNew={isEffectiveReadOnly ? undefined : handleOpenReissueModal}
            onPrint={isEffectiveReadOnly ? undefined : handlePrintClick}
          />
        ),
      },
    ]
  }, [detail, ftjsId, statusLabel, statusTone, notesCount, reIssuanceCount, onEdit, handlePrintClick, handleOpenReissueModal, isEffectiveReadOnly])

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <DetailCaseDetailsShell
        backLabel="Back to FTJS Records"
        onBack={onBack}
        isLoading={isLoading}
        loadingMessage="Loading FTJS application details..."
        isNotFound={!isLoading && !detail}
        notFoundTitle="FTJS Application Not Found"
        notFoundDescription="The requested FTJS certificate application could not be loaded."
        notFoundActionLabel="Return to FTJS Records"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        header={
          <DetailCaseHeader
            title={detail?.ftjsApplicationNumber || String(ftjsId)}
            subtitle={
              detail
                ? `${detail.applicantFullName}${detail.purpose ? ` · Purpose: ${detail.purpose}` : ''}`
                : 'Certificate Management View'
            }
            showIcon={false}
            status={
              <Badge tone={statusTone}>{statusLabel}</Badge>
            }
            actions={
              <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                <span>
                  Submitted:{' '}
                  <span className="font-semibold text-slate-700">
                    {formatDisplayDate(detail?.dateReleased)}
                  </span>
                </span>
                <span>
                  Expires:{' '}
                  <span className="font-semibold text-slate-700">
                    {computeExpiryDate(detail?.dateReleased)}
                  </span>
                </span>
                <span>
                  Issuance Count:{' '}
                  <span className="font-semibold text-slate-700">
                    {detail?.issuanceCount ?? 1}
                  </span>
                </span>
              </div>
            }
          />
        }
        tabs={tabs}
      />

      {/* Re-issuance Modal */}
      <FtjsReissuanceModal
        open={isReissuanceModalOpen}
        onClose={() => setIsReissuanceModalOpen(false)}
        ftjsId={ftjsId}
        applicantName={detail?.applicantFullName}
        trackingNumber={detail?.ftjsApplicationNumber}
        onSuccess={fetchDetail}
      />
    </>
  )
}
