import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/table/Badge'
import { officersApi, type OfficerOption } from '@/api/modules/officers.api'
import { vawcApi, fileToBase64, type BpoDetailDto, type BpoServeRequest } from '@/api/modules/vawc.api'
import { useDialogs } from '@/hooks/useDialogs'
import { FeedbackDialog } from '@/components/ui/FeedbackDialog'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { generateBpoCertificate } from '@/utils/generateBpoDocument'

export interface VawcBpoManagementPanelProps {
  caseId: string | number
  caseNumber: string
  victimName: string
  respondentName: string
  assignedOfficer: string
  assignedOfficerId?: number | null
  bpo?: BpoDetailDto | null
  bpoNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  onPrintRequestLetter?: () => void
  onBpoUpdated?: () => void
}

function getLocalIsoDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDisplayDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

export function VawcBpoManagementPanel({
  caseId,
  caseNumber,
  victimName,
  respondentName,
  assignedOfficer,
  assignedOfficerId,
  bpo,
  bpoNumber,
  issueDate,
  expiryDate,
  onPrintRequestLetter,
  onBpoUpdated,
}: VawcBpoManagementPanelProps) {
  const { showFeedback, feedbackDialogProps, confirm, confirmDialogProps } = useDialogs()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Officers list state
  const [officers, setOfficers] = useState<OfficerOption[]>([])
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(true)

  // Form states for BPO Service
  const isBpoActivated = useMemo(() => {
    const status = String(bpo?.status || '').toUpperCase()
    return (
      status === 'ISSUED' ||
      status === 'SERVED' ||
      (Boolean(bpoNumber) && bpoNumber !== 'Not Issued' && bpoNumber !== '—') ||
      Boolean(bpo?.activatedAt)
    )
  }, [bpo, bpoNumber])

  const isBpoServed = useMemo(() => {
    const status = String(bpo?.status || '').toUpperCase()
    return status === 'SERVED' || Boolean(bpo?.dateServed)
  }, [bpo])

  const [servedBy, setServedBy] = useState<string>('')
  const [dateServed, setDateServed] = useState<string>(getLocalIsoDateTime())
  const [serviceMethod, setServiceMethod] = useState<string>('Personal service to respondent')
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certFileName, setCertFileName] = useState<string>('')
  const [certFileData, setCertFileData] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isEditingService, setIsEditingService] = useState(false)

  const [isActivating, setIsActivating] = useState(false)
  const [isSubmittingService, setIsSubmittingService] = useState(false)

  // 1. Fetch active officers and filter for VAWC / Barangay staff
  useEffect(() => {
    let isMounted = true
    setIsLoadingOfficers(true)

    officersApi
      .getActiveOfficers()
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data) && data.length > 0) {
          const vawcOfficers = data.filter((o) => {
            const dept = (o.departmentName || '').toUpperCase()
            return (
              dept.includes('VAWC') ||
              dept.includes('OVERALL') ||
              dept.includes('BARANGAY OFFICE') ||
              dept.includes('ADMIN') ||
              dept === ''
            )
          })
          setOfficers(vawcOfficers.length > 0 ? vawcOfficers : data)
        } else {
          setOfficers([])
        }
      })
      .catch((err) => {
        console.error('Failed to fetch VAWC officers:', err)
        if (isMounted) setOfficers([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingOfficers(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Initialize or auto-select servedBy default value
  useEffect(() => {
    if (bpo?.servedBy) {
      setServedBy(bpo.servedBy)
      return
    }

    // Auto-select assigned case officer by default
    if (assignedOfficer && assignedOfficer !== '—') {
      const matched = officers.find(
        (o) =>
          (assignedOfficerId && o.id === assignedOfficerId) ||
          o.name.toLowerCase().includes(assignedOfficer.toLowerCase()) ||
          assignedOfficer.toLowerCase().includes(o.name.toLowerCase())
      )
      if (matched) {
        setServedBy(matched.name)
      } else {
        setServedBy(assignedOfficer)
      }
    } else if (officers.length > 0 && !servedBy) {
      setServedBy(officers[0].name)
    }
  }, [officers, assignedOfficer, assignedOfficerId, bpo?.servedBy])

  // 3. Initialize dateServed & serviceMethod from bpo data if existing
  useEffect(() => {
    if (bpo?.dateServed) {
      try {
        const d = new Date(bpo.dateServed)
        if (!isNaN(d.getTime())) {
          setDateServed(getLocalIsoDateTime(d))
        }
      } catch {
        // keep fallback
      }
    }
    if (bpo?.serviceMethod) {
      setServiceMethod(bpo.serviceMethod)
    }
    if (bpo?.certificationOfServiceFileData) {
      setCertFileData(bpo.certificationOfServiceFileData)
      setCertFileName(bpo.certificationFileName || 'Certification_of_Service.pdf')
    }
  }, [bpo])

  // Handle File Upload
  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      showFeedback({
        variant: 'error',
        title: 'File Too Large',
        description: 'The selected certification file exceeds the maximum 10MB file size limit.',
      })
      return
    }

    try {
      const base64 = await fileToBase64(file)
      setCertFile(file)
      setCertFileName(file.name)
      setCertFileData(base64)
    } catch {
      showFeedback({
        variant: 'error',
        title: 'File Read Failed',
        description: 'Unable to read the selected file. Please select a valid document or image.',
      })
    }
  }

  const handleRemoveFile = () => {
    setCertFile(null)
    setCertFileName('')
    setCertFileData('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadProof = () => {
    if (!certFileData) return
    try {
      const link = document.createElement('a')
      link.href = certFileData.startsWith('data:')
        ? certFileData
        : `data:application/octet-stream;base64,${certFileData}`
      link.download = certFileName || 'Certification_Of_Service'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error('Failed to download file:', e)
    }
  }

  // Handle Print BPO Request Letter / Order
  const handlePrint = async () => {
    if (onPrintRequestLetter) {
      onPrintRequestLetter()
      return
    }
    try {
      await generateBpoCertificate({
        caseNumber: caseNumber || '2026-VAWC',
        bpoControlNumber: bpo?.bpoControlNumber || bpoNumber || undefined,
        victimName: victimName || 'Complainant',
        respondentName: respondentName || 'Respondent',
        issueDate: bpo?.activatedAt || issueDate || new Date(),
        expiryDate: bpo?.expiredAt || expiryDate || undefined,
        assignedOfficerName: assignedOfficer || 'VAWC Desk Officer',
      })
    } catch (e) {
      console.error('Failed to print BPO document:', e)
    }
  }

  // Handle Activate BPO
  const handleActivateBpo = () => {
    confirm({
      title: 'Activate Barangay Protection Order?',
      description: `This will officially issue the Protection Order for Case #${caseNumber || caseId} with a 15-day validity period and enable the Service of BPO form.`,
      confirmLabel: 'Activate BPO',
      cancelLabel: 'Cancel',
      tone: 'emerald',
      onConfirm: async () => {
        setIsActivating(true)
        try {
          await vawcApi.activateBpo(caseId)
          showFeedback({
            variant: 'success',
            title: 'BPO Activated Successfully!',
            description: 'The Barangay Protection Order has been officially issued. You can now record service details to the respondent below.',
          })
          if (onBpoUpdated) onBpoUpdated()
        } catch (err: any) {
          console.error('Failed to activate BPO:', err)
          showFeedback({
            variant: 'error',
            title: 'Activation Failed',
            description:
              err?.response?.data?.message || 'Failed to activate BPO. Please check network and try again.',
          })
        } finally {
          setIsActivating(false)
        }
      },
    })
  }

  // Handle Mark as Served
  const handleMarkAsServed = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!servedBy.trim()) {
      showFeedback({
        variant: 'error',
        title: 'Served by Required',
        description: 'Please select or enter the VAWC officer who served the BPO.',
      })
      return
    }

    if (!dateServed) {
      showFeedback({
        variant: 'error',
        title: 'Date/Time Required',
        description: 'Please specify the exact date and time the BPO was served to the respondent.',
      })
      return
    }

    const payload: BpoServeRequest = {
      servedBy: servedBy.trim(),
      dateServed: new Date(dateServed).toISOString(),
      serviceMethod: serviceMethod.trim(),
      certificationFileName: certFileName || undefined,
      certificationFileData: certFileData || undefined,
    }

    setIsSubmittingService(true)
    try {
      await vawcApi.serveBpo(caseId, payload)
      showFeedback({
        variant: 'success',
        title: 'BPO Marked as Served!',
        description: `Service of BPO has been recorded by ${payload.servedBy}. The case timeline has been updated.`,
      })
      setIsEditingService(false)
      if (onBpoUpdated) onBpoUpdated()
    } catch (err: any) {
      console.error('Failed to record BPO service:', err)
      showFeedback({
        variant: 'error',
        title: 'Service Submission Failed',
        description:
          err?.response?.data?.message || 'An error occurred while recording the service of BPO.',
      })
    } finally {
      setIsSubmittingService(false)
    }
  }

  // Display values for BPO summary header
  const displayBpoNumber = bpo?.bpoControlNumber || bpoNumber || 'Not Issued'
  const displayIssueDate = bpo?.activatedAt ? formatDisplayDate(bpo.activatedAt) : issueDate || '—'
  const displayExpiryDate = bpo?.expiredAt ? formatDisplayDate(bpo.expiredAt) : expiryDate || '—'

  return (
    <div className="space-y-6">
      {/* 1. Barangay Protection Order Details Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">
              Barangay Protection Order Details
            </h3>
            {isBpoActivated && (
              <Badge tone={isBpoServed ? 'emerald' : 'sky'}>
                {isBpoServed ? 'SERVED' : 'ACTIVE ORDER (15 DAYS)'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              Print BPO Request Letter
            </button>

            {!isBpoActivated && (
              <button
                type="button"
                onClick={handleActivateBpo}
                disabled={isActivating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isActivating ? 'Activating...' : 'Activate BPO (Post-Signature)'}
              </button>
            )}
          </div>
        </div>

        {/* Details Grid Row 1 (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CASE NUMBER
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{caseNumber || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              VICTIM (PROTECTED PARTY)
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{victimName || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              RESPONDENT
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{respondentName || '—'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ASSIGNED OFFICER
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{assignedOfficer || '—'}</p>
          </div>
        </div>

        {/* Details Grid Row 2 (3 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5 border-t border-slate-100">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              BPO NUMBER
            </p>
            <p
              className={`text-sm font-semibold mt-1 ${
                isBpoActivated ? 'text-blue-600 font-bold' : 'text-slate-700'
              }`}
            >
              {displayBpoNumber}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ISSUE DATE
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{displayIssueDate}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              EXPIRY DATE (15 DAYS)
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{displayExpiryDate}</p>
          </div>
        </div>
      </div>

      {/* 2. Workflow Instructions Card (Shown only before BPO is activated) */}
      {!isBpoActivated && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-2xs space-y-2.5 text-amber-950">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
            <h4 className="text-xs font-bold text-amber-900">Workflow Instructions:</h4>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900/90 leading-relaxed font-medium pl-1">
            <li>Print the BPO Request Letter using the button above.</li>
            <li>Have the Punong Barangay (Barangay Captain) sign the document.</li>
            <li>
              Once signed, click &quot;Activate BPO (Post-Signature)&quot; to officially issue the order
              and start the 15-day validity period.
            </li>
          </ol>
        </div>
      )}

      {/* 3. Service of BPO Card (Shown once BPO is Activated) */}
      {isBpoActivated && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900">Service of BPO</h3>
              <p className="text-xs text-slate-500 font-medium">
                Official delivery of the Protection Order to the respondent in compliance with VAWC regulations.
              </p>
            </div>
            <div>
              <Badge tone={isBpoServed ? 'emerald' : 'amber'}>
                {isBpoServed ? 'Served' : 'Pending Service'}
              </Badge>
            </div>
          </div>

          {/* If already served and not in edit mode, show confirmation banner */}
          {isBpoServed && !isEditingService ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4.5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    BPO Service Successfully Completed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-emerald-800/80 font-medium">SERVED BY</p>
                    <p className="font-bold text-emerald-950 mt-0.5">{bpo?.servedBy || servedBy || '—'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/80 font-medium">DATE & TIME SERVED</p>
                    <p className="font-bold text-emerald-950 mt-0.5">{formatDisplayDateTime(bpo?.dateServed || dateServed)}</p>
                  </div>
                  <div>
                    <p className="text-emerald-800/80 font-medium">SERVICE METHOD</p>
                    <p className="font-bold text-emerald-950 mt-0.5">{bpo?.serviceMethod || serviceMethod || 'Personal service'}</p>
                  </div>
                </div>

                {certFileData && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-semibold text-emerald-950">
                        {certFileName || 'Certification_of_Service.pdf'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadProof}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-2xs transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Certificate
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingService(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                >
                  Edit Service Details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMarkAsServed} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Served By (Dropdown populated with VAWC officers, auto-selected to assigned officer) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Served by <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={servedBy}
                      onChange={(e) => setServedBy(e.target.value)}
                      required
                      className="w-full h-10 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      {isLoadingOfficers ? (
                        <option value="">Loading VAWC Officers...</option>
                      ) : (
                        <>
                          <option value="">— Select VAWC Officer —</option>
                          {officers.map((officer) => (
                            <option key={officer.id} value={officer.name}>
                              {officer.name}{' '}
                              {officer.position ? `(${officer.position})` : ''}
                            </option>
                          ))}
                          {/* Ensure assignedOfficer is in the list if not already present */}
                          {assignedOfficer &&
                            assignedOfficer !== '—' &&
                            !officers.some((o) => o.name.toLowerCase() === assignedOfficer.toLowerCase()) && (
                              <option value={assignedOfficer}>
                                {assignedOfficer} (Assigned Case Officer)
                              </option>
                            )}
                        </>
                      )}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-slate-400" />
                    Auto-selected to case handler ({assignedOfficer || 'VAWC Officer'}).
                  </p>
                </div>

                {/* 2. Date/Time Served */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date/Time Served <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={dateServed}
                      onChange={(e) => setDateServed(e.target.value)}
                      required
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Exact timestamp when respondent received notice.
                  </p>
                </div>
              </div>

              {/* 3. Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={serviceMethod}
                  onChange={(e) => setServiceMethod(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Personal service to respondent">
                    Personal service to respondent
                  </option>
                  <option value="Substituted service (left with resident of suitable age and discretion)">
                    Substituted service (left with resident of suitable age and discretion)
                  </option>
                  <option value="Officer delivery escorted by Barangay Police / Tanod">
                    Officer delivery escorted by Barangay Police / Tanod
                  </option>
                  <option value="Direct in-person delivery at respondent workplace">
                    Direct in-person delivery at respondent workplace
                  </option>
                </select>
              </div>

              {/* 4. Certification of Service Document (Drag & Drop zone) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Certification of Service (Document)
                </label>

                {certFileName || certFileData ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {certFileName || 'Certification_Document.pdf'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {certFile
                            ? `${(certFile.size / 1024).toFixed(1)} KB`
                            : 'Attached Certificate'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {certFileData && (
                        <button
                          type="button"
                          onClick={handleDownloadProof}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          title="Download/Preview"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                      handleFileChange(e.dataTransfer.files)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                    <UploadCloud className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium">
                      <span className="font-semibold text-blue-600 hover:underline">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      PDF, DOC, DOCX, PNG, JPG (MAX. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* 5. Submit Action Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                {isEditingService && (
                  <button
                    type="button"
                    onClick={() => setIsEditingService(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmittingService ? 'Saving Service...' : 'Mark as Served'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Confirmation & Feedback Modals */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
export default VawcBpoManagementPanel
