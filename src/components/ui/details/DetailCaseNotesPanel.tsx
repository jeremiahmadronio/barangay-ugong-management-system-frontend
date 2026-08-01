import { FileText } from 'lucide-react'
import { DetailEmptyPanel } from './DetailEmptyPanel'

export interface DetailCaseNoteItem {
  id: string
  label: string
  value: string
  timestamp?: string
}

interface DetailCaseNotesPanelProps {
  notes: DetailCaseNoteItem[]
  emptyTitle?: string
  emptyDescription?: string
}

export function DetailCaseNotesPanel({
  notes,
  emptyTitle = 'Case Notes',
  emptyDescription = 'No notes have been recorded for this case yet.',
}: DetailCaseNotesPanelProps) {
  if (!notes.length) {
    return (
      <DetailEmptyPanel
        icon={<FileText className="h-10 w-10" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <section
          key={note.id}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">{note.label}</h3>
            </div>
            {note.timestamp ? (
              <p className="text-xs font-medium text-slate-400">{note.timestamp}</p>
            ) : null}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {note.value}
          </p>
        </section>
      ))}
    </div>
  )
}
