import React from 'react'
import { Shield, ShieldAlert, UserCheck } from 'lucide-react'
import { DetailEmptyPanel } from '@/components/ui/details'

interface BcpcCustodyTabProps {
  caseId: string | number
  caseNumber?: string
}

export const BcpcCustodyTab: React.FC<BcpcCustodyTabProps> = ({
  caseId,
  caseNumber,
}) => {
  return (
    <div className="space-y-6">
      <DetailEmptyPanel
        icon={<Shield className="h-10 w-10 text-slate-300" />}
        title="Custody & Turnover Records"
        description="No custody turnover, protective shelter placement, or parent turnover logs recorded yet for this child."
      />
    </div>
  )
}

