import React, { useState, useEffect } from 'react'
import { Printer, Loader2, Download } from 'lucide-react'
import type { BlotterBackendResponse } from '@/config/api/modules/blotter.api'
import { luponApi, type PanelAttendanceResponse } from '@/config/api/modules/lupon.api'
import { buildCfaPdfDoc } from '../generateCfaCertificate'

interface CfaDocumentPanelProps {
  caseDetail: BlotterBackendResponse
}

export function CfaDocumentPanel({ caseDetail }: CfaDocumentPanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [pangkatMembers, setPangkatMembers] = useState<PanelAttendanceResponse[]>([])
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const caseNumber = caseDetail.caseNumber || '2026-LUP-001'
  const complainantName =
    (caseDetail.complainant
      ? `${caseDetail.complainant.firstName || ''} ${caseDetail.complainant.lastName || ''}`.trim()
      : null) ||
    caseDetail.complainantName ||
    'Mayreklamo'

  const respondentName =
    (caseDetail.respondent
      ? `${caseDetail.respondent.firstName || ''} ${caseDetail.respondent.lastName || ''}`.trim()
      : null) ||
    caseDetail.respondentName ||
    'Ipinagreklamo'

  const natureOfComplaint =
    caseDetail.incident?.natureOfComplaint ||
    caseDetail.natureOfComplaint ||
    'Pangyayari / Alitan'

  const grounds =
    caseDetail.caseStatusRemarks ||
    'Walang naganap na pagkakasundo sa pagitan ng mga partido sa kabila ng maayos na pagpapadala ng paanyaya at pagsasagawa ng mga itinakdang sesyon ng pagdinig sa ilalim ng Pangkat Tagapagkasundo.'

  const dateIssued = caseDetail.updatedAt || caseDetail.createdAt || new Date().toISOString()

  // Fetch assigned Pangkat members dynamically for this case
  useEffect(() => {
    if (caseDetail.id) {
      luponApi.getPangkatMembers(caseDetail.id)
        .then(members => {
          if (Array.isArray(members) && members.length > 0) {
            setPangkatMembers(members)
          }
        })
        .catch(() => {})
    }
  }, [caseDetail.id])

  const chairmanMember = pangkatMembers.find(m => m.position === 'CHAIRMAN')
  const chairmanName = chairmanMember?.officerName || 'HON. MARICEL PINEDA-EMPERADOR'
  const chairmanTitle = chairmanMember ? 'Pangkat Chairman / Tagapangulo ng Pangkat' : 'Punong Barangay / Tagapangulo ng Lupon'

  const secretaryMember = pangkatMembers.find(m => m.position === 'SECRETARY')
  const secretaryName = secretaryMember?.officerName || caseDetail.receivingOfficer || 'MS. JOYCE KRISHA TAN'
  const secretaryTitle = secretaryMember ? 'Kalihim ng Pangkat / Lupon Secretary' : 'Kalihim ng Lupon / Barangay Secretary'

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    buildCfaPdfDoc({
      caseNumber,
      complainantName,
      respondentName,
      natureOfComplaint,
      grounds,
      dateIssued,
      secretaryName,
      secretaryTitle,
      pangkatChairmanName: chairmanName,
      chairmanTitle,
    })
      .then(async (pdfDoc) => {
        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        if (!isCancelled) {
          setPdfBlobUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
          setIsLoading(false)
        } else {
          URL.revokeObjectURL(url)
        }
      })
      .catch((err) => {
        console.error('Failed to generate CFA PDF preview:', err)
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [
    caseNumber,
    complainantName,
    respondentName,
    natureOfComplaint,
    grounds,
    dateIssued,
    secretaryName,
    secretaryTitle,
    chairmanName,
    chairmanTitle,
  ])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [pdfBlobUrl])

  const handlePrintClick = () => {
    if (!pdfBlobUrl) return
    setIsPrinting(true)
    try {
      const printIframe = document.createElement('iframe')
      printIframe.style.position = 'fixed'
      printIframe.style.right = '0'
      printIframe.style.bottom = '0'
      printIframe.style.width = '0'
      printIframe.style.height = '0'
      printIframe.style.border = '0'
      printIframe.src = pdfBlobUrl

      document.body.appendChild(printIframe)

      printIframe.onload = () => {
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus()
            printIframe.contentWindow?.print()
          } catch (e) {
            console.error('Print iframe error:', e)
          } finally {
            setTimeout(() => {
              if (document.body.contains(printIframe)) {
                document.body.removeChild(printIframe)
              }
            }, 2000)
          }
        }, 300)
      }
    } catch (err) {
      console.error('Failed to print CFA:', err)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadClick = () => {
    if (!pdfBlobUrl) return
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = `CFA-${caseNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-3">
      {/* Header Actions: Download and Print */}
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isLoading || !pdfBlobUrl}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          title="I-download ang CFA PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>I-download</span>
        </button>

        <button
          type="button"
          onClick={handlePrintClick}
          disabled={isPrinting || isLoading || !pdfBlobUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPrinting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5" />
          )}
          <span>{isPrinting ? 'Inihahanda...' : 'Print CFA'}</span>
        </button>
      </div>

      {/* Pure White High-Definition Document Preview */}
      <div className="w-full flex justify-center bg-white dark:bg-slate-900/50 p-2 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="w-full max-w-[850px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 relative flex justify-center min-h-[700px] h-[950px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 space-y-3">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-600">
                Ikinakarga ang opisyal na dokumento ng CFA...
              </p>
            </div>
          )}
          {pdfBlobUrl && (
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
              title="Certificate to File Action Preview"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
