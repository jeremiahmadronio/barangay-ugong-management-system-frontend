import React, { useState } from 'react'
import {
  X,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Phone,
  Building2,
  HeartPulse,
  ShieldCheck,
  MapPin,
} from 'lucide-react'
import type { BcpcCustodyLog } from '@/config/api/modules/bcpc.api'

interface BcpcCustodyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  custodyData: BcpcCustodyLog | null
  caseNumber?: string
}

export const BcpcCustodyDetailsModal: React.FC<BcpcCustodyDetailsModalProps> = ({
  isOpen,
  onClose,
  custodyData,
  caseNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'turnover' | 'remarks'>('turnover')

  if (!isOpen || !custodyData) return null

  const fmtDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const fmtTime = (timeStr?: string) => {
    if (!timeStr) return '—'
    if (timeStr.includes(':')) {
      const [hStr, mStr] = timeStr.split(':')
      const h = parseInt(hStr, 10)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${mStr} ${ampm}`
    }
    return timeStr
  }

  const isCompleted =
    custodyData.custodyStatus === 'Turnover Completed' ||
    Boolean(custodyData.temporaryPlacement && custodyData.custodyStatus !== 'Temporarily Accommodated')

  const isParent = custodyData.temporaryPlacement === 'Parent / Guardian / Caregiver'
  const isLswdo = custodyData.temporaryPlacement === 'LSWDO'
  const isBrgy = custodyData.temporaryPlacement === 'Barangay of Residence'
  const isTemporary =
    custodyData.temporaryPlacement ===
    'Temporarily staying at the barangay while awaiting turnover'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Custody & Turnover Record
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseNumber ? `Case ${caseNumber}` : ''}
              {custodyData.temporaryPlacement ? ` · ${custodyData.temporaryPlacement}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0">
          {[
            { id: 'turnover', label: '1. Custody Transfer & Receiving Party', icon: FileText },
            { id: 'remarks', label: '2. Guidance & Assessment', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'turnover' ? (
            <div className="space-y-5 animate-in fade-in duration-100">
              {/* Top Neutral Summary Banner */}
              <div className="px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    STATUS
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {custodyData.custodyStatus || 'Turnover Completed'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    TURNED OVER TO
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                    {custodyData.temporaryPlacement || custodyData.custodyResolution || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    DATE
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {fmtDate(custodyData.transferDate || custodyData.turnoverDate)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    TIME
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    {fmtTime(custodyData.transferTime || custodyData.turnoverTime)}
                  </p>
                </div>
              </div>

              {/* 1. Receiving Person & Entity */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isLswdo
                    ? '1. LSWDO / Receiving Office & Representative'
                    : isBrgy
                    ? '1. Receiving Barangay Information'
                    : isTemporary
                    ? '1. Responsible Barangay Personnel'
                    : '1. Receiving Person & Entity'}
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {isLswdo ? (
                    <>
                      <div className="sm:col-span-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Receiving Office / Facility
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {custodyData.receivingOffice || custodyData.temporaryPlacement || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Social Worker / Representative
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingPersonName || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Position
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingRelationship || '—'}
                        </p>
                      </div>
                    </>
                  ) : isBrgy ? (
                    <>
                      <div className="sm:col-span-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Receiving Barangay
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {custodyData.receivingOffice || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Barangay Representative
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingPersonName || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Position / Role
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingRelationship || '—'}
                        </p>
                      </div>
                    </>
                  ) : isTemporary ? (
                    <>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Responsible Personnel
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {custodyData.receivingPersonName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Position / Role
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingRelationship || 'Barangay Personnel'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Full Name
                        </p>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {custodyData.receivingPersonName || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Relationship / Role
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {custodyData.receivingRelationship || '—'}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Contact Number
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                      {custodyData.contactNumber ? (
                        <>
                          <Phone size={12} className="text-slate-400" />
                          {custodyData.contactNumber}
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Reason / Legal Basis */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Reason / Basis for Turnover
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {custodyData.temporaryPlacementReason || 'Parent/guardian assumed physical custody.'}
                </div>
              </div>

              {/* 3. Turnover Outcome matching Hearing Outcome */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Turnover Outcome
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Result:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {custodyData.custodyStatus || 'Turnover Completed'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-100">
              {/* Guidance & Counseling */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  1. Parental & Child Guidance
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span className="font-semibold text-slate-700">Status:</span>
                    <span className="text-slate-800">
                      {custodyData.carGuidanceApplicable === false
                        ? 'Not Applicable'
                        : custodyData.childGuidanceProvided && custodyData.parentAdviceProvided
                        ? 'Completed (Child guidance and parent advisory provided)'
                        : 'Pending'}
                    </span>
                  </div>
                  {custodyData.guidanceNotes && (
                    <div className="pt-2 border-t border-slate-100 text-slate-600 whitespace-pre-wrap">
                      {custodyData.guidanceNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Immediate Medical Assessment */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isParent ? '2. Immediate Medical Assessment' : '1. Immediate Medical Assessment'}
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={14} className="text-amber-600" />
                    <span className="font-semibold text-slate-700">Medical Attention:</span>
                    <span className="text-slate-800">
                      {custodyData.needsMedicalAttention ? 'Attention required' : 'None required'}
                      {custodyData.healthCoordinationConfirmed && ' · Health Office contacted'}
                    </span>
                  </div>
                  {custodyData.immediateActionNotes && (
                    <div className="pt-2 border-t border-slate-100 text-slate-600 whitespace-pre-wrap">
                      {custodyData.immediateActionNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Basis & Case Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {isParent ? '3. Legal Basis & Case Notes' : '2. Legal Basis & Case Notes'}
                </label>
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Reason / Basis for Turnover
                    </span>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap">
                      {custodyData.temporaryPlacementReason || 'None recorded.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Remarks / Case Notes
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {custodyData.transferNotes || custodyData.custodyRemarks || 'None recorded.'}
                    </p>
                  </div>
                </div>
              </div>

              {custodyData.delayReason && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    4. Statutory Turnover Delay Reason
                  </label>
                  <div className="rounded-xl border border-slate-200/80 p-4 bg-white text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {custodyData.delayReason}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp footer line */}
          <p className="text-[11px] text-slate-400">
            Recorded for Case {caseNumber ? `#${caseNumber}` : ''}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex justify-end bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
