import React from 'react'
import { DetailTimelinePanel, type DetailTimelineItem } from '@/components/ui/details'
import { bcpcService } from '@/config/api/bcpc/bcpc.service'

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
        onFetchTimeline={(id) => bcpcService.getTimeline(id)}
        emptyTitle="BCPC Case Timeline"
        emptyDescription="No timeline activity recorded for this case yet."
      />
    </div>
  )
}

