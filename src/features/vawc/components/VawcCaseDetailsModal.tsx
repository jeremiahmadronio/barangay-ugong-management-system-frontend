import React, { useState, useEffect } from 'react'
import {
  X,
  HeartHandshake,
  ShieldAlert,
  FileText,
  User,
  Users,
  Download,
} from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { vawcService } from '@/config/api/vawc/vawc.service'
import type { VawcCaseDetailResponse } from '@/config/api/vawc/vawc.types'
import { formatDate } from '@/utils/formatters'

interface VawcCaseDetailsModalProps {
  open: boolean
  caseId: number | string | null
  onClose: () => void
}

export const VawcCaseDetailsModal: React.FC<VawcCaseDetailsModalProps> = ({
  open,
  caseId,
  onClose,
}) => {
  const [detail, setDetail] = useState<VawcCaseDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && caseId) {
      setIsLoading(true)
      vawcService
        .getById(caseId)
        .then((res) => setDetail(res))
        .catch(() => setDetail(null))
        .finally(() => setIsLoading(false))
    } else {
      setDetail(null)
    }
  }, [open, caseId])

  if (!open) return null

  const getRiskTone = (risk?: string) => {
    const r = (risk || '').toUpperCase()
    if (r.includes('HIGH')) return 'rose'
    if (r.includes('MODERATE')) return 'amber'
    return 'emerald'
  }

  const getStatusTone = (status?: string) => {
    const s = (status || '').toUpperCase()
    if (s.includes('SETTLED')) return 'emerald'
    if (s.includes('WITHDRAWN') || s.includes('DISMISSED')) return 'rose'
    if (s.includes('REFERRAL')) return 'sky'
    return 'amber'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {detail?.caseNumber || 'VAWC Case Details'}
                </h2>
                {detail?.riskLevel && (
                  <Badge tone={getRiskTone(detail.riskLevel)}>
                    {detail.riskLevel} RISK
                  </Badge>
                )}
                {detail?.caseStatus && (
                  <Badge tone={getStatusTone(detail.caseStatus)}>
                    {detail.caseStatus}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Violence Against Women and Children Desk Official Record
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading confidential case record...</p>
            </div>
          ) : !detail ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Unable to load VAWC case details.
            </div>
          ) : (
            <>
              {/* Primary Parties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Complainant Card */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="w-4 h-4 text-blue-600" />
                    COMPLAINANT / VICTIM-SURVIVOR
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 text-sm">
                      {detail.complainant?.fullName || `${detail.complainant?.firstName || ''} ${detail.complainant?.lastName || ''}`}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Contact:</span>{' '}
                      {detail.complainant?.contactNumber || '—'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Address:</span>{' '}
                      {detail.complainant?.completeAddress || '—'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Civil Status / Age / Gender:</span>{' '}
                      {[detail.complainant?.civilStatus, detail.complainant?.age ? `${detail.complainant.age} yrs` : null, detail.complainant?.gender].filter(Boolean).join(' • ') || '—'}
                    </p>
                  </div>
                </div>

                {/* Respondent Card */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="w-4 h-4 text-rose-600" />
                    RESPONDENT / ALLEGED PERPETRATOR
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 text-sm">
                      {detail.respondent?.fullName || `${detail.respondent?.firstName || ''} ${detail.respondent?.lastName || ''}`}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Relationship:</span>{' '}
                      <span className="font-semibold text-rose-700">{detail.respondent?.relationshipToComplainant || '—'}</span>
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Contact:</span>{' '}
                      {detail.respondent?.contactNumber || '—'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Address:</span>{' '}
                      {detail.respondent?.completeAddress || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Incident & Risk Details */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Incident & Violation Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Type of Violence</span>
                    <span className="font-semibold text-slate-800">{detail.violenceType || detail.incident?.natureOfComplaint || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date & Time of Incident</span>
                    <span className="font-semibold text-slate-800">
                      {detail.incident?.dateOfIncident ? formatDate(detail.incident.dateOfIncident) : '—'}{' '}
                      {detail.incident?.timeOfIncident ? `(${detail.incident.timeOfIncident})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Place of Incident</span>
                    <span className="font-semibold text-slate-800">{detail.incident?.placeOfIncident || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Frequency</span>
                    <span className="font-semibold text-slate-800">{detail.incident?.frequencyOfIncident || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Assigned Desk Officer</span>
                    <span className="font-semibold text-slate-800">{detail.assignedOfficer || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date Filed</span>
                    <span className="font-semibold text-slate-800">{detail.dateFiledFormatted || formatDate(detail.createdAt)}</span>
                  </div>
                </div>

                {detail.incident?.descriptionOfInjuries && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 block font-medium mb-1">Description of Injuries / Medical Findings</span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg leading-relaxed">
                      {detail.incident.descriptionOfInjuries}
                    </p>
                  </div>
                )}
              </div>

              {/* Danger Assessments */}
              {detail.dangerAssessments && (
                <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Danger Factors & Risk Assessment
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {detail.dangerAssessments}
                  </p>
                </div>
              )}

              {/* Narrative Statement */}
              {detail.narrative && (
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Sworn Statement / Narrative Summary
                    </div>
                    {caseId && (
                      <a
                        href={vawcService.getNarrativeFileUrl(caseId)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Statement
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {detail.narrative.statementSummary || 'Attached sworn statement document.'}
                  </p>
                </div>
              )}

              {/* Children Involved */}
              {detail.children && detail.children.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Users className="w-4 h-4 text-purple-600" />
                    Children Involved ({detail.children.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {detail.children.map((child: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                        <span className="font-bold text-slate-800">{child.name || child.fullName || `${child.firstName} ${child.lastName}`}</span>
                        <span className="text-slate-500 block text-[11px]">
                          {child.age ? `${child.age} yrs old` : ''} {child.childRole ? `• ${child.childRole}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
