import React from 'react'
import { DetailCaseNotesPanel, type DetailCaseNoteItem } from '@/components/ui/details'
import { bcpcApi } from '@/api/modules/bcpc.api'

interface BcpcCaseNotesTabProps {
  caseId: string | number
  notes?: DetailCaseNoteItem[]
  onNotesCountChange?: (count: number) => void
}

export const BcpcCaseNotesTab: React.FC<BcpcCaseNotesTabProps> = ({
  caseId,
  notes = [],
  onNotesCountChange,
}) => {
  return (
    <div className="space-y-6">
      <DetailCaseNotesPanel
        caseId={caseId}
        notes={notes}
        onFetchNotes={async (id) => {
          const res = await bcpcApi.getCaseNotes(id)
          return res.map((n: any) => ({
            id: n.id,
            note: n.note,
            createdBy: n.createdBy,
            createdAt: n.createdAt,
          }))
        }}
        onAddNote={async (id, noteText) => {
          const res = await bcpcApi.addCaseNote(id, noteText)
          return {
            id: res.id,
            note: res.note,
            createdBy: res.createdBy,
            createdAt: res.createdAt,
          }
        }}
        emptyTitle="BCPC Case Notes"
        emptyDescription="No confidential case notes recorded by the child development or protection officer yet."
        onNotesCountChange={onNotesCountChange}
      />
    </div>
  )
}

