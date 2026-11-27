import React, { useState, useEffect, useCallback } from 'react'
import { HandHeart, Loader2, Plus } from 'lucide-react'
import { bcpcApi, type BcpcCustodyLog } from '@/config/api/modules/bcpc.api'
import { BcpcCustodyRecordModal } from './BcpcCustodyRecordModal'
import { BcpcCiclCustodyModal } from './BcpcCiclCustodyModal'

interface BcpcCustodyTabProps {
  caseId: string | number
  caseNumber?: string
  category?: 'CAR' | 'CICL' | string
  guardianName?: string
  guardianRelationship?: string
  guardianContact?: string
  onRecordUpdated?: () => void
}

export const BcpcCustodyTab: React.FC<BcpcCustodyTabProps> = ({
  caseId,
  caseNumber,
  category = 'CAR',
  guardianName,
  guardianRelationship,
  guardianContact,
  onRecordUpdated,
}) => {
  const [custodyData, setCustodyData] = useState<BcpcCustodyLog | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false)
  const [showCiclModal, setShowCiclModal] = useState<boolean>(false)

  const isCicl = category === 'CICL'

  const fetchCustodyLog = useCallback(async () => {
    try {
      setLoading(true)
      const data = await bcpcApi.getCustodyLog(caseId)
      setCustodyData(data)
    } catch (err: any) {
      console.error('Failed to load custody log:', err)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCustodyLog()
  }, [fetchCustodyLog])

  const handleSaveCarCustody = async (payload: Partial<BcpcCustodyLog>) => {
    await bcpcApi.updateCustodyLog(caseId, payload)
    await fetchCustodyLog()
    onRecordUpdated?.()
  }

  const handleSaveCiclCustody = async (payload: any) => {
    await bcpcApi.updateCiclCustodyLog(caseId, payload)
    await fetchCustodyLog()
    onRecordUpdated?.()
  }

  const formatTurnoverDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr + 'T00:00:00')
      const formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      if (!timeStr) return formattedDate

      if (timeStr.includes(':')) {
        const [hStr, mStr] = timeStr.split(':')
        const h = parseInt(hStr, 10)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${formattedDate}, ${h12}:${mStr} ${ampm}`
      }
      return `${formattedDate}, ${timeStr}`
    } catch {
      return `${dateStr} ${timeStr || ''}`.trim()
    }
  }

  const hasRecord = Boolean(
    (custodyData?.temporaryPlacement && custodyData.temporaryPlacement.trim().length > 0) ||
      (custodyData?.custodyResolution &&
        custodyData.custodyResolution.trim().length > 0 &&
        custodyData.custodyResolution !== 'Pending Resolution') ||
      custodyData?.wasApprehended === false ||
      (custodyData?.transferDate && String(custodyData.transferDate).trim().length > 0) ||
      (custodyData?.turnoverDate && String(custodyData.turnoverDate).trim().length > 0) ||
      (custodyData?.receivingPersonName && custodyData.receivingPersonName.trim().length > 0)
  )

  const getGuidanceValue = () => {
    if (custodyData?.carGuidanceApplicable === false) return 'Not Applicable'
    if (custodyData?.childGuidanceProvided && custodyData?.parentAdviceProvided) {
      return 'Completed'
    }
    if (custodyData?.childGuidanceProvided || custodyData?.parentAdviceProvided) {
      return 'Partially Completed'
    }
    return 'Pending'
  }

  const suggestedGuardians = guardianName
    ? [
        {
          name: guardianName,
          relationship: guardianRelationship || 'Parent / Guardian',
          contact: guardianContact || '',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 rounded" />
              <div className="h-4 w-48 bg-slate-200 rounded" />
            </div>
            <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-4 w-36 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasRecord ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 space-y-6">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Custody & Turnover Overview
              </h2>
            </div>
          </div>

          {/* Section 1: Custody Transfer & Receiving Party */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
              1. Transfer Details & Receiving Party
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  CURRENT STATUS
                </dt>
                <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                  {custodyData?.custodyStatus || 'Turnover Completed'}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  TURNED OVER TO
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700">
                  {custodyData?.temporaryPlacement || custodyData?.custodyResolution || '—'}
                </dd>
              </div>

              {isCicl ? (
                <>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RECEIVING PERSON
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData?.receivingPersonName || '—'}
                    </dd>
                  </div>

                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RELATIONSHIP / ROLE
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData?.receivingRelationship || '—'}
                    </dd>
                  </div>
                </>
              ) : custodyData?.temporaryPlacement === 'LSWDO' ? (
                <>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RECEIVING OFFICE / FACILITY
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingOffice || custodyData.temporaryPlacement || '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      SOCIAL WORKER / REPRESENTATIVE
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingPersonName || 'Not specified'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      OFFICE POSITION
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingRelationship || '—'}
                    </dd>
                  </div>
                </>
              ) : custodyData?.temporaryPlacement === 'Barangay of Residence' ? (
                <>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RECEIVING BARANGAY
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingOffice || '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      BARANGAY REPRESENTATIVE
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingPersonName || 'Not specified'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      POSITION / ROLE
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingRelationship || '—'}
                    </dd>
                  </div>
                </>
              ) : custodyData?.temporaryPlacement ===
                'Temporarily staying at the barangay while awaiting turnover' ? (
                <>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RESPONSIBLE PERSONNEL
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingPersonName || '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      ROLE / POSITION
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingRelationship || 'Barangay Personnel'}
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RECEIVING PERSON
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData?.receivingPersonName || '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RELATIONSHIP
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData?.receivingRelationship || '—'}
                    </dd>
                  </div>
                </>
              )}

              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  CONTACT NUMBER
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700">
                  {custodyData?.contactNumber || '—'}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  TURNOVER DATE & TIME
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700">
                  {formatTurnoverDateTime(
                    custodyData?.transferDate || custodyData?.turnoverDate,
                    custodyData?.transferTime || custodyData?.turnoverTime
                  )}
                </dd>
              </div>

              {custodyData?.receivingOffice &&
                custodyData.temporaryPlacement !== 'LSWDO' &&
                custodyData.temporaryPlacement !== 'Barangay of Residence' && (
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      RECEIVING OFFICE / BARANGAY
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700">
                      {custodyData.receivingOffice}
                    </dd>
                  </div>
                )}
            </dl>
          </div>

          {/* Section 2: Apprehension & Statutory 8-Hour Turnover (CICL) or Guidance & Medical Assessment (CAR) */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
              {isCicl ? '2. Apprehension & Statutory 8-Hour Turnover' : '2. Guidance & Medical Assessment'}
            </h3>
            {isCicl ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    CUSTODY / APPREHENSION STATUS
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700">
                    {custodyData?.wasApprehended ? 'Apprehended & Turned Over' : 'Not in Physical Custody'}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    STATUTORY 8-HOUR WINDOW
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700">
                    {custodyData?.delayReason
                      ? 'Exceeded statutory window'
                      : 'Compliant within 8 hours'}
                  </dd>
                </div>

                <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    DELAY REASON (IF TURN OVER EXCEEDED 8 HOURS)
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700 whitespace-pre-wrap">
                    {custodyData?.delayReason || 'Turnover conducted within statutory window.'}
                  </dd>
                </div>
              </dl>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    CHILD GUIDANCE
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700">
                    {custodyData?.childGuidanceProvided
                      ? 'Child guidance & counseling provided'
                      : 'Not provided'}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    PARENT / GUARDIAN ADVICE
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700">
                    {custodyData?.parentAdviceProvided
                      ? 'Advised on parental responsibilities'
                      : 'Not advised'}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    IMMEDIATE MEDICAL ATTENTION
                  </dt>
                  <dd className="mt-1.5 break-words text-sm text-slate-700">
                    {custodyData?.needsMedicalAttention
                      ? 'Yes (Attention required)'
                      : 'No (Not required)'}
                  </dd>
                </div>

                {custodyData?.needsMedicalAttention && (
                  <>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        HEALTH OFFICE COORDINATION
                      </dt>
                      <dd className="mt-1.5 break-words text-sm text-slate-700">
                        {custodyData?.healthCoordinationConfirmed
                          ? 'Health Office / Health Center contacted'
                          : 'Not contacted'}
                      </dd>
                    </div>

                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        IMMEDIATE ACTION NOTES
                      </dt>
                      <dd className="mt-1.5 break-words text-sm text-slate-700 whitespace-pre-wrap">
                        {custodyData?.immediateActionNotes || 'None recorded.'}
                      </dd>
                    </div>
                  </>
                )}

                {custodyData?.guidanceNotes && (
                  <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      GUIDANCE NOTES
                    </dt>
                    <dd className="mt-1.5 break-words text-sm text-slate-700 whitespace-pre-wrap">
                      {custodyData.guidanceNotes}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Section 3: Legal Basis & Case Notes */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
              3. Legal Basis & Case Notes
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {isCicl ? 'CUSTODY RESOLUTION & DISPOSITION' : 'REASON / BASIS FOR TURNOVER'}
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700 whitespace-pre-wrap">
                  {isCicl
                    ? (custodyData?.custodyResolution || custodyData?.temporaryPlacement || 'Turnover completed in accordance with RA 9344 / RA 10630.')
                    : (custodyData?.temporaryPlacementReason || 'Parent/guardian assumed physical custody.')}
                </dd>
              </div>

              <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  REMARKS / CASE NOTES
                </dt>
                <dd className="mt-1.5 break-words text-sm text-slate-700 whitespace-pre-wrap">
                  {custodyData?.custodyRemarks || custodyData?.transferNotes || 'None recorded.'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : (
        /* Empty State */
        <section className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
          <p className="text-sm font-semibold text-slate-800">
            No Custody or Turnover Record Yet
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Document the formal physical handoff of the child to a parent, guardian, caregiver, or welfare facility.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => (isCicl ? setShowCiclModal(true) : setShowRecordModal(true))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Record Custody & Turnover
            </button>
          </div>
        </section>
      )}

      {/* Record / Edit Modal */}
      <BcpcCustodyRecordModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSave={handleSaveCarCustody}
        existingData={custodyData}
        suggestedGuardians={suggestedGuardians}
        caseNumber={caseNumber}
      />

      {/* CICL Modal */}
      <BcpcCiclCustodyModal
        isOpen={showCiclModal}
        onClose={() => setShowCiclModal(false)}
        onSave={handleSaveCiclCustody}
        existingData={custodyData}
        caseNumber={caseNumber}
      />
    </div>
  )
}
