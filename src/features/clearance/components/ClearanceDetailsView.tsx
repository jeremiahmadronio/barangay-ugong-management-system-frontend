import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Award,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  History,
  Info,
  Paperclip,
  RotateCcw,
  Scale,
  Scroll,
  User,
  Warehouse,
  Zap,
} from 'lucide-react'
import {
  DetailCaseDetailsShell,
  DetailCaseHeader,
  DetailInfoCard,
  type DetailTab,
} from '@/components/ui/details'
import { Badge, type BadgeTone } from '@/components/ui/table/Badge'
import {
  clearanceApi,
  type IssuedCertificateDetailResponse,
} from '@/api/modules/clearance.api'
import { formatDate, formatDateTime, formatEnumLabel } from '@/utils/formatters'

interface ClearanceDetailsViewProps {
  certId: string | number
  certNumber?: string
  onBack: () => void
  onEdit?: () => void
}

function getStatusTone(status?: string | null): BadgeTone {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'RELEASED' || normalized === 'ISSUED') return 'emerald'
  if (normalized === 'EXPIRED') return 'amber'
  if (normalized === 'VOID' || normalized === 'CANCELLED' || normalized === 'REVOKED') return 'rose'
  return 'slate'
}

function formatDisplayDate(value?: string | null) {
  if (!value) return '—'
  return formatDate(value)
}

function formatDisplayDateTime(value?: string | null) {
  if (!value) return '—'
  return formatDateTime(value)
}

export function ClearanceDetailsView({
  certId,
  certNumber: initialCertNumber,
  onBack,
}: ClearanceDetailsViewProps) {
  const rootCertId = useRef<string | number>(certId)
  const [activeCertId, setActiveCertId] = useState<string | number>(certId)
  const [detail, setDetail] = useState<IssuedCertificateDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    rootCertId.current = certId
    setActiveCertId(certId)
  }, [certId])

  const fetchDetail = useCallback(async (targetId: string | number) => {
    try {
      setIsLoading(true)
      const data = await clearanceApi.getIssuedCertificateById(targetId)
      setDetail(data)
    } catch (err) {
      console.error('Failed to load clearance details', err)
      setDetail(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDetail(activeCertId)
  }, [activeCertId, fetchDetail])

  const handleInspectHistoryItem = (historyId: string | number) => {
    setActiveCertId(historyId)
    setActiveTab('overview')
  }

  const handleReturnToLatest = () => {
    setActiveCertId(rootCertId.current)
    setActiveTab('overview')
  }

  const fieldsObj = (detail?.fieldValues && typeof detail.fieldValues === 'object')
    ? (detail.fieldValues as Record<string, any>)
    : {}

  // 1. UNIFIED FULL NAME
  const unifiedFullName = (() => {
    if (detail?.applicant?.fullName && detail.applicant.fullName.trim() && !detail.applicant.fullName.toLowerCase().includes('unknown')) {
      return detail.applicant.fullName.trim()
    }
    if (fieldsObj.fullName && typeof fieldsObj.fullName === 'string' && fieldsObj.fullName.trim()) {
      return fieldsObj.fullName.trim()
    }
    if (fieldsObj.full_name && typeof fieldsObj.full_name === 'string' && fieldsObj.full_name.trim()) {
      return fieldsObj.full_name.trim()
    }
    const parts = [fieldsObj.firstName, fieldsObj.middleName, fieldsObj.lastName, fieldsObj.suffix].filter(Boolean).join(' ')
    if (parts.trim()) return parts.trim()
    return detail?.applicant?.lastName && detail?.applicant?.firstName
      ? `${detail.applicant.firstName} ${detail.applicant.middleName ? detail.applicant.middleName + ' ' : ''}${detail.applicant.lastName}${detail.applicant.suffix ? ' ' + detail.applicant.suffix : ''}`
      : 'Resident Applicant'
  })()

  // 2. UNIFIED COMPLETE ADDRESS
  const unifiedAddress = (() => {
    if (detail?.applicant?.completeAddress && detail.applicant.completeAddress.trim() && detail.applicant.completeAddress !== '—') {
      return detail.applicant.completeAddress.trim()
    }
    if (fieldsObj.completeAddress && typeof fieldsObj.completeAddress === 'string' && fieldsObj.completeAddress.trim()) {
      return fieldsObj.completeAddress.trim()
    }
    if (fieldsObj.address && typeof fieldsObj.address === 'string' && fieldsObj.address.trim()) {
      return fieldsObj.address.trim()
    }
    const streetParts = [fieldsObj.houseNumber, fieldsObj.street, fieldsObj.purok].filter(Boolean).join(' ')
    if (streetParts.trim()) {
      return `${streetParts}, Barangay Ugong, Valenzuela City, Metro Manila`
    }
    return 'Barangay Ugong, Valenzuela City, Metro Manila'
  })()

  const [isPhotoError, setIsPhotoError] = useState(false)

  useEffect(() => {
    setIsPhotoError(false)
  }, [activeCertId])

  // 3. RESOLVE 1x1 PHOTO
  const rawPhoto = fieldsObj.photoUrl || fieldsObj.photoPreviewUrl || null
  const hasValidPhoto = Boolean(
    rawPhoto &&
    typeof rawPhoto === 'string' &&
    rawPhoto.trim().length > 20 &&
    !isPhotoError &&
    (rawPhoto.startsWith('data:image') || rawPhoto.startsWith('http') || rawPhoto.startsWith('blob:'))
  )
  const photoUrl = hasValidPhoto ? rawPhoto : null

  // 4. RESOLVE VERIFIED REQUIREMENTS / ATTACHED FILES
  const requirementsList: Array<{ id: string; label: string; verified: boolean; fileName?: string; fileData?: string; fileType?: string; fileSize?: string }> = (() => {
    if (Array.isArray(fieldsObj.requirements) && fieldsObj.requirements.length > 0) {
      return fieldsObj.requirements
    }
    if (Array.isArray(fieldsObj.uploadedFiles) && fieldsObj.uploadedFiles.length > 0) {
      return fieldsObj.uploadedFiles.map((f: any) => ({
        id: f.key || 'uploaded_doc',
        label: f.name || 'Submitted Document',
        verified: true,
        fileName: f.name,
      }))
    }
    return []
  })()

  // 5. TEMPLATE SPECIFIC LOGIC (Strictly based on Certificate Template Type)
  const titleLower = (detail?.certTitle || '').toLowerCase()
  const isBuildingClearance =
    titleLower.includes('building') ||
    titleLower.includes('demolition') ||
    titleLower.includes('contractor') ||
    titleLower.includes('excavation')

  const isUtilityClearance =
    titleLower.includes('utility') ||
    titleLower.includes('electrical') ||
    titleLower.includes('telephone')

  const isBail = titleLower.includes('bail')
  const isDeceased = titleLower.includes('deceased')
  const isEbike =
    titleLower.includes('ebike') ||
    titleLower.includes('etrike') ||
    titleLower.includes('garage')

  // View Document in New Tab Handler
  const handleViewDocumentInNewTab = (doc: { label: string; fileName?: string; fileData?: string }) => {
    if (doc.fileData && doc.fileData.trim()) {
      if (doc.fileData.startsWith('data:')) {
        try {
          const parts = doc.fileData.split(';base64,')
          const contentType = parts[0].replace('data:', '') || 'application/pdf'
          const byteCharacters = atob(parts[1])
          const byteArrays = []
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512)
            const byteNumbers = new Array(slice.length)
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            byteArrays.push(byteArray)
          }
          const blob = new Blob(byteArrays, { type: contentType })
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, '_blank')
          return
        } catch {
          const win = window.open()
          if (win) {
            win.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`)
          }
          return
        }
      } else {
        window.open(doc.fileData, '_blank')
        return
      }
    }

    // Official Verification Sheet HTML Preview for physical records
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Document Verification - ${doc.label}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 48px 20px; display: flex; justify-content: center; margin: 0; }
    .card { background: #ffffff; max-width: 580px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 20px; border: 1px solid #a7f3d0; }
    h1 { font-size: 20px; margin: 0 0 6px; color: #0f172a; }
    p.subtitle { font-size: 13px; color: #64748b; margin: 0 0 28px; }
    .field { margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; }
    .label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .val { font-size: 14px; font-weight: 600; color: #334155; margin-top: 4px; }
    .note { margin-top: 24px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 12px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">✓ Officially Verified & Recorded</span>
    <h1>${doc.label}</h1>
    <p class="subtitle">Barangay Clearance Documentary Requirement Record</p>

    <div class="field">
      <div class="label">Requirement Name</div>
      <div class="val">${doc.label}</div>
    </div>
    <div class="field">
      <div class="label">Submitted File Reference</div>
      <div class="val">${doc.fileName || 'Physically Verified Copy on File'}</div>
    </div>
    <div class="field">
      <div class="label">Applicant Full Name</div>
      <div class="val">${unifiedFullName}</div>
    </div>
    <div class="field">
      <div class="label">Certificate Control Number</div>
      <div class="val">${detail?.certNumber || '—'}</div>
    </div>
    <div class="field">
      <div class="label">Date Verified & Issued</div>
      <div class="val">${formatDisplayDateTime(detail?.createdAt)}</div>
    </div>

    <div class="note">
      <strong>Physical Record Notice:</strong> This document was physically inspected and approved by the issuing officer during application verification. Physical documents are securely archived in the Barangay records office.
    </div>
  </div>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  }

  // Document Download Handler
  const handleDownloadDocument = (doc: { label: string; fileName?: string; fileData?: string }) => {
    if (doc.fileData) {
      const link = document.createElement('a')
      link.href = doc.fileData
      link.download = doc.fileName || `${doc.label.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const content = `BARANGAY CLEARANCE DOCUMENT VERIFICATION\n\nRequirement: ${doc.label}\nFilename: ${doc.fileName || 'Verified Document'}\nStatus: Officially Verified & Recorded\nCertificate Number: ${detail?.certNumber}\nApplicant: ${unifiedFullName}\nDate Issued: ${formatDisplayDateTime(detail?.createdAt)}`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(doc.fileName || doc.label).replace(/\.[^/.]+$/, '')}_Verification.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const isViewingPastRecord = String(activeCertId) !== String(certId)
  const historyList = detail?.history || []

  const tabs: DetailTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: detail ? (
        <div className="space-y-6">
          {/* Past Record Notice Banner (if inspecting previous record) */}
          {isViewingPastRecord && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                  Viewing Past Issuance Record
                </span>
                <p className="text-xs font-medium text-blue-950 mt-0.5">
                  Currently viewing past certificate record <strong className="font-mono text-blue-900">{detail.certNumber}</strong> ({detail.certTitle}) issued for this applicant.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReturnToLatest}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 cursor-pointer self-start sm:self-center shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" /> Return to Latest Certificate
              </button>
            </div>
          )}

          {/* CARD 1: CERTIFICATE & ISSUANCE SUMMARY */}
          <DetailInfoCard
            title="Certificate & Issuance Summary"
            icon={<FileText className="h-4 w-4 text-blue-600" />}
            columns={2}
            fields={[
              {
                label: 'CERTIFICATE TYPE',
                value: detail.certTitle,
              },
              {
                label: 'CONTROL NUMBER',
                value: (
                  <Badge tone="sky">
                    {detail.certNumber}
                  </Badge>
                ),
              },
              {
                label: 'APPLICATION PURPOSE',
                value: detail.purpose || fieldsObj.purpose || 'General Purpose',
              },
              {
                label: 'DOCUMENT STATUS',
                value: (
                  <Badge tone={getStatusTone(detail.status)}>
                    {detail.status || 'ACTIVE'}
                  </Badge>
                ),
              },
              {
                label: 'DATE ISSUED',
                value: formatDisplayDateTime(detail.createdAt),
              },
              {
                label: 'VALIDITY PERIOD',
                value: detail.expiryDate ? `Expires ${formatDisplayDate(detail.expiryDate)}` : 'Indefinite / Valid',
              },
              {
                label: 'OFFICIAL RECEIPT (OR) NO.',
                value: detail.orNumber ? (
                  <span className="font-mono font-medium text-slate-800">{detail.orNumber}</span>
                ) : (
                  '—'
                ),
              },
              {
                label: 'CEDULA / CTC NO.',
                value: detail.ctnNumber ? (
                  <span className="font-mono font-medium text-slate-800">{detail.ctnNumber}</span>
                ) : (
                  '—'
                ),
              },
            ]}
          />

          {/* CARD 2: APPLICANT & RESIDENT PROFILE */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Applicant & Resident Profile</h2>
              </div>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => handleViewDocumentInNewTab({ label: 'Applicant 1x1 Photo', fileName: `${unifiedFullName}_Photo.png`, fileData: photoUrl })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>View 1x1 Photo</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-col md:flex-row gap-6 items-start">
              {/* 1x1 Photo Thumbnail */}
              {photoUrl && (
                <div
                  onClick={() => handleViewDocumentInNewTab({ label: 'Applicant 1x1 Photo', fileName: `${unifiedFullName}_Photo.png`, fileData: photoUrl })}
                  className="shrink-0 space-y-1.5 text-center group cursor-pointer"
                  title="Click to view photo in new tab"
                >
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={photoUrl}
                      alt="Applicant"
                      onError={() => setIsPhotoError(true)}
                      className="w-20 h-20 object-cover border-2 border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    1x1 Photo
                  </span>
                </div>
              )}

              {/* Clean Unified Fields */}
              <dl className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    FULL NAME
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                    {unifiedFullName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    RESIDENT CLASSIFICATION
                  </dt>
                  <dd className="mt-1.5">
                    <Badge tone={detail.applicant?.isResident ? 'emerald' : 'slate'}>
                      {detail.applicant?.isResident ? 'Registered Resident' : 'Walk-In Applicant'}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    GENDER
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-700">
                    {formatEnumLabel(detail.applicant?.gender || fieldsObj.gender || '—')}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    CONTACT NUMBER
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-700">
                    {detail.applicant?.contactNumber || fieldsObj.contactNumber || '—'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    APPLICANT TYPE
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-700">
                    {fieldsObj.applicantType || 'Individual'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    COMPLETE RESIDENCE ADDRESS
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-700">
                    {unifiedAddress}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* CARD 3: APPLICATION-SPECIFIC DETAILS (Only if relevant based on cert template) */}
          {isBuildingClearance && (
            <DetailInfoCard
              title="Building Project & Property Details"
              icon={<Building2 className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: 'PROJECT / PROPERTY ADDRESS',
                  value: fieldsObj.propertyAddress || unifiedAddress,
                },
                {
                  label: 'TYPE OF APPLICATION',
                  value: fieldsObj.typeOfApplication === 'Others' || fieldsObj.typeOfApplication === 'Others (specify in others field)'
                    ? fieldsObj.otherTypeOfApplication || 'Custom Application'
                    : fieldsObj.typeOfApplication || 'New Construction',
                },
                {
                  label: 'BUILDING CLASSIFICATION',
                  value: fieldsObj.buildingClassification === 'Others (specify in others field)'
                    ? fieldsObj.otherBuildingClassification || 'Custom Classification'
                    : fieldsObj.buildingClassification || 'Residential',
                },
                {
                  label: 'OWNERSHIP DOCUMENT TYPE',
                  value: fieldsObj.ownershipDocumentType || 'Transfer Certificate of Title (TCT)',
                },
                {
                  label: 'TCT / TAX DECLARATION NUMBER',
                  value: fieldsObj.tctNumber ? (
                    <span className="font-mono text-slate-900">{fieldsObj.tctNumber}</span>
                  ) : (
                    '—'
                  ),
                },
                {
                  label: 'REGISTERED OWNER NAME',
                  value: fieldsObj.registeredOwnerName || unifiedFullName || '—',
                },
              ]}
            />
          )}

          {isUtilityClearance && (
            <DetailInfoCard
              title="Utility Connection Details"
              icon={<Zap className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: 'UTILITY APPLICATION TYPE',
                  value: fieldsObj.utilityApplicationType || 'Electrical Permit (Meralco)',
                },
                {
                  label: 'INSTALLATION ADDRESS',
                  value: fieldsObj.propertyAddress || unifiedAddress,
                },
              ]}
            />
          )}

          {isBail && (
            <DetailInfoCard
              title="Bail Bond Certification Details"
              icon={<Scale className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: 'DEFENDANT / ACCUSED NAME',
                  value: fieldsObj.defendantName || '—',
                },
                {
                  label: 'CASE INFORMATION / REMARKS',
                  value: fieldsObj.caseDetails || 'Barangay Court Verification',
                },
              ]}
            />
          )}

          {isDeceased && (
            <DetailInfoCard
              title="Deceased Resident Information"
              icon={<Scroll className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: 'DECEASED PERSON FULL NAME',
                  value: fieldsObj.deceasedName || '—',
                },
                {
                  label: 'DATE OF DEATH',
                  value: formatDisplayDate(fieldsObj.dateOfDeath),
                },
              ]}
            />
          )}

          {isEbike && (
            <DetailInfoCard
              title="E-Bike / Vehicle Specifications"
              icon={<Warehouse className="h-4 w-4 text-blue-600" />}
              columns={2}
              fields={[
                {
                  label: 'VEHICLE BRAND / MAKE',
                  value: fieldsObj.vehicleBrand || '—',
                },
                {
                  label: 'MOTOR NUMBER',
                  value: <span className="font-mono text-slate-900">{fieldsObj.motorNumber || '—'}</span>,
                },
                {
                  label: 'CHASSIS NUMBER',
                  value: <span className="font-mono text-slate-900">{fieldsObj.chassisNumber || '—'}</span>,
                },
                {
                  label: 'BODY COLOR',
                  value: fieldsObj.bodyColor || '—',
                },
              ]}
            />
          )}

          {/* CARD 4: VERIFIED REQUIREMENTS & ATTACHED DOCUMENTS */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Verified Requirements & Attached Documents {requirementsList.length > 0 ? `(${requirementsList.length})` : ''}
                </h2>
              </div>
            </div>

            <div className="mt-4">
              {requirementsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requirementsList.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              {req.label}
                            </p>
                            {req.fileName ? (
                              <p className="text-[11px] text-blue-600 font-medium truncate mt-0.5 flex items-center gap-1">
                                <Paperclip className="h-3 w-3 shrink-0" />
                                {req.fileName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Physically verified upon application
                              </p>
                            )}
                          </div>
                        </div>

                        <Badge tone="emerald">Verified</Badge>
                      </div>

                      {/* View (New Tab) & Download Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleViewDocumentInNewTab(req)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>View in New Tab</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(req)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 text-center text-xs text-slate-500">
                  All standard documentary requirements were physically verified upon issuance.
                </div>
              )}
            </div>
          </section>

          {/* CARD 5: ISSUING AUTHORITY */}
          <DetailInfoCard
            title="Issuing Authority"
            icon={<Award className="h-4 w-4 text-blue-600" />}
            columns={2}
            fields={[
              {
                label: 'PROCESSING OFFICER',
                value: detail.issuingOfficer?.fullName || detail.issuingOfficer?.username || 'Barangay Staff',
              },
              {
                label: 'DATE ISSUED',
                value: formatDisplayDateTime(detail.createdAt),
              },
              {
                label: 'LAST UPDATED',
                value: detail.updatedAt ? formatDisplayDateTime(detail.updatedAt) : formatDisplayDateTime(detail.createdAt),
              },
            ]}
          />

          {/* Archive Remarks (if archived) */}
          {detail.isArchived && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-amber-900 text-sm">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <Info className="h-4 w-4" /> Record Archived
              </div>
              <p className="mt-1 text-xs text-amber-700">
                Archived on {formatDisplayDateTime(detail.archivedAt)}. Remarks: {detail.archiveRemarks || 'None'}
              </p>
            </div>
          )}
        </div>
      ) : null,
    },
    {
      id: 'history',
      label: `Cert History (${historyList.length})`,
      content: (
        <div className="space-y-6">
          {historyList.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Certificate Issuance Records ({historyList.length})</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Previous certificates issued for <strong>{unifiedFullName}</strong>. Click any record to inspect its full details.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.certTitle}</span>
                        <Badge tone="sky">{item.certNumber}</Badge>
                        <Badge tone={getStatusTone(item.status)}>{item.status || 'ACTIVE'}</Badge>
                      </div>

                      <p className="text-xs text-slate-600 font-medium truncate">
                        Purpose: <span className="text-slate-800 font-semibold">{item.purpose || 'General Purpose'}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                        <span>
                          Date Issued: <span className="text-slate-700 font-medium">{formatDisplayDateTime(item.createdAt)}</span>
                        </span>
                        <span>
                          Validity: <span className="text-slate-700 font-medium">{item.expiryDate ? formatDisplayDate(item.expiryDate) : 'Valid'}</span>
                        </span>
                        {item.orNumber && (
                          <span>
                            OR No.: <span className="font-mono text-slate-700 font-medium">{item.orNumber}</span>
                          </span>
                        )}
                        {item.issuingOfficerName && (
                          <span>
                            Officer: <span className="text-slate-700 font-medium">{item.issuingOfficerName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInspectHistoryItem(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      <span>Inspect Details</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
                <History className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No Previous Issuance History</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                There are no other recorded certificates issued for this applicant in the database.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  const headerTitle = detail?.certNumber || (initialCertNumber ? String(initialCertNumber) : 'Clearance Details')
  const headerSubtitle = detail
    ? `Issued for ${unifiedFullName}`
    : 'Viewing Issued Certificate Details'

  return (
    <DetailCaseDetailsShell
      backLabel="Back to Clearance Records"
      onBack={onBack}
      isLoading={isLoading}
      loadingMessage="Loading certificate details from server..."
      isNotFound={!isLoading && !detail}
      notFoundTitle="Certificate Record Not Found"
      notFoundDescription="The certificate details could not be retrieved. It may have been permanently deleted or moved."
      notFoundActionLabel="Back to Clearance Table"
      header={
        <DetailCaseHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          status={
            <Badge tone={getStatusTone(detail?.status)}>
              {detail?.status ? detail.status.toUpperCase() : 'ACTIVE'}
            </Badge>
          }
          meta={
            detail?.certTitle ? (
              <Badge tone="slate">
                {detail.certTitle}
              </Badge>
            ) : null
          }
        />
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}
