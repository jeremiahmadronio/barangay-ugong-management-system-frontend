import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Plus, User, Send, Loader2, AlertCircle } from 'lucide-react'
import { blotterApi, type CaseNoteResponse } from '@/api/modules/blotter.api'
import { Badge } from '@/components/ui/table/Badge'
import { LoadingState } from '../LoadingState'

export interface DetailCaseNoteItem {
  id: string
  label: string
  value: string
  timestamp?: string
  createdBy?: string
}

export interface GenericNoteDto {
  id: number | string
  note: string
  createdBy?: string | null
  createdAt: string
}

interface DetailCaseNotesPanelProps {
  caseId?: number | string
  notes?: DetailCaseNoteItem[]
  emptyTitle?: string
  emptyDescription?: string
  isReadOnly?: boolean
  onNotesCountChange?: (count: number) => void
  onFetchNotes?: (id: number | string) => Promise<GenericNoteDto[]>
  onAddNote?: (id: number | string, noteText: string) => Promise<GenericNoteDto>
}

function formatNoteDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    
    // Format: "Aug 6, 2026 at 9:32 AM"
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return `${datePart} at ${timePart}`
  } catch {
    return isoString
  }
}

function formatCleanErrorMessage(raw?: string): string {
  if (!raw) return 'Failed to save note. Please try again.'
  if (raw.includes('No static resource') || raw.includes('404')) {
    return 'The case notes service is temporarily unavailable. Please try again.'
  }
  if (raw.includes('Network Error') || raw.includes('ECONNREFUSED')) {
    return 'Network connection error. Please ensure the backend server is running.'
  }
  if (raw.startsWith('Something went wrong:')) {
    const cleaned = raw.replace('Something went wrong:', '').trim()
    if (cleaned.includes('No static resource')) {
      return 'The case notes service is temporarily unavailable. Please try again.'
    }
    return cleaned || 'Failed to save note. Please try again.'
  }
  return raw
}

export function DetailCaseNotesPanel({
  caseId,
  notes: initialNotes = [],
  emptyTitle = 'Case Notes',
  emptyDescription = 'No case notes or narrative summary have been recorded for this case yet.',
  isReadOnly = false,
  onNotesCountChange,
  onFetchNotes,
  onAddNote,
}: DetailCaseNotesPanelProps) {
  const [dbNotes, setDbNotes] = useState<CaseNoteResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch DB case notes if caseId is provided
  const fetchNotes = useCallback(async () => {
    if (!caseId) return
    setIsLoading(true)
    try {
      if (onFetchNotes) {
        const customData = await onFetchNotes(caseId)
        setDbNotes(
          customData.map((n) => ({
            id: Number(n.id) || Date.now(),
            caseId: Number(caseId) || 0,
            note: n.note,
            createdBy: n.createdBy || 'Barangay Officer',
            createdAt: n.createdAt,
          }))
        )
      } else {
        const data = await blotterApi.getCaseNotes(caseId)
        setDbNotes(data)
      }
    } catch (err) {
      console.error('Failed to fetch case notes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [caseId, onFetchNotes])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Combine initial narrative statement notes with fetched DB notes
  const allNotes: DetailCaseNoteItem[] = [
    ...dbNotes.map((n) => ({
      id: `db-note-${n.id}`,
      label: 'Case Note',
      value: n.note,
      timestamp: formatNoteDate(n.createdAt),
      createdBy: n.createdBy || 'Barangay Officer',
    })),
    ...initialNotes,
  ]

  // Update total count up to parent if needed
  useEffect(() => {
    onNotesCountChange?.(allNotes.length)
  }, [allNotes.length, onNotesCountChange])

  const handleOpenAddForm = () => {
    if (isReadOnly) return
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
    if (isReadOnly) return
    if (!newNoteText.trim()) return
    if (!caseId) {
      setError('Cannot add note: Case ID missing')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      let created: CaseNoteResponse
      if (onAddNote) {
        const customCreated = await onAddNote(caseId, newNoteText.trim())
        created = {
          id: Number(customCreated.id) || Date.now(),
          caseId: Number(caseId) || 0,
          note: customCreated.note,
          createdBy: customCreated.createdBy || 'Barangay Officer',
          createdAt: customCreated.createdAt,
        }
      } else {
        created = await blotterApi.addCaseNote(caseId, newNoteText.trim())
      }
      setDbNotes((prev) => [created, ...prev])
      setNewNoteText('')
      setIsAddingNote(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save note'
      setError(formatCleanErrorMessage(msg))
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

  // 1. EMPTY STATE (Matching Screenshot 1 & 2)
  if (!allNotes.length && !isAddingNote && !isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
        {!isReadOnly && Boolean(onAddNote) && (
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
        )}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-slate-50 p-4 mb-3 border border-slate-100">
            <FileText className="h-10 w-10 text-slate-300 stroke-1" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{emptyTitle}</h3>
          <p className="mt-1 text-xs font-medium text-slate-400 max-w-sm">
            {emptyDescription}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
      {/* Top Header Row (Matching Screenshot 2 & 3) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Case Notes</h3>
        </div>

        {isReadOnly ? (
          <Badge tone="slate">READ ONLY</Badge>
        ) : (
          !isAddingNote && Boolean(onAddNote) && (
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </button>
          )
        )}
      </div>

      {/* Add Note Form (Matching Screenshot 3) */}
      {isAddingNote && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
          <div className="relative">
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
          </div>

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

      {/* Loading state */}
      {isLoading && (
        <LoadingState message="Loading case notes..." variant="inline" size="sm" />
      )}

      {/* Notes List (Matching Screenshot 2) */}
      {!isLoading && allNotes.length > 0 && (
        <div className="space-y-3">
          {allNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5 transition-colors hover:bg-slate-50"
            >
              <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {note.value}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{note.createdBy || 'Hannah Masangkay'}</span>
                {note.timestamp && (
                  <>
                    <span>•</span>
                    <span>{note.timestamp}</span>
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
