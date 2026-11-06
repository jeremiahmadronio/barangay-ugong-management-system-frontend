import React from 'react'
import { ExternalLink, Building2, Send } from 'lucide-react'
import { DetailEmptyPanel } from '@/components/ui/details'

interface BcpcReferralsTabProps {
  caseId: string | number
  caseNumber?: string
}

export const BcpcReferralsTab: React.FC<BcpcReferralsTabProps> = ({
  caseId,
  caseNumber,
}) => {
  return (
    <div className="space-y-6">
      <DetailEmptyPanel
        icon={<ExternalLink className="h-10 w-10 text-slate-300" />}
        title="Inter-Agency Referrals"
        description="No external referrals issued to LSWDO, WCPD, or rehabilitation facilities for this case yet."
      />
    </div>
  )
}

