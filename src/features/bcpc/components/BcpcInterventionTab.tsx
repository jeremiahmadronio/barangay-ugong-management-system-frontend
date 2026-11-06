import React from 'react'
import { CheckCircle2, Calendar, ClipboardCheck } from 'lucide-react'
import { DetailEmptyPanel } from '@/components/ui/details'

interface BcpcInterventionTabProps {
  caseId: string | number
  caseNumber?: string
}

export const BcpcInterventionTab: React.FC<BcpcInterventionTabProps> = ({
  caseId,
  caseNumber,
}) => {
  return (
    <div className="space-y-6">
      <DetailEmptyPanel
        icon={<ClipboardCheck className="h-10 w-10 text-slate-300" />}
        title="Intervention & Monitoring Plan"
        description="No active community-based intervention contract, diversion program, or counseling monitoring sessions logged yet."
      />
    </div>
  )
}

