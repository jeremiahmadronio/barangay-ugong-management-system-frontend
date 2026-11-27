import React from 'react'
import { DetailTimelinePanel, type DetailTimelineItem } from '@/components/ui/details'
import { bcpcApi } from '@/config/api/modules/bcpc.api'

interface BcpcTimelineTabProps {
  caseId: string | number
  items?: DetailTimelineItem[]
}

export const BcpcTimelineTab: React.FC<BcpcTimelineTabProps> = ({
  caseId,
  items = [],
}) => {
  return (
    <div className="space-y-6">
      <DetailTimelinePanel
        caseId={caseId}
        items={items}
        onFetchTimeline={(id) => bcpcApi.getTimeline(id)}
        emptyTitle="BCPC Case Timeline"
        emptyDescription="No timeline activity recorded for this case yet."
      />
    </div>
  )
}

