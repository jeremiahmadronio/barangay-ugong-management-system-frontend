import React, { useState, useEffect } from 'react'
import { X, Printer, Download, Loader2 } from 'lucide-react'
import { buildPaanyayaPdfDoc } from '@/utils/generatePaanyayaCertificate'

interface Props {
  session: any | null
  caseNumber?: string
  dateFiled?: string
  complainantName?: string
  respondentName?: string
  natureOfComplaint?: string
  isConciliation?: boolean
  isOpen: boolean
  onClose: () => void
}

function formatDateFormatted(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatSessionTimeRange(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return ''
  try {
    const start = new Date(startIso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const end = new Date(endIso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${start} – ${end}`
  } catch {
    return ''
  }
}

export function PaanyayaModal({
  session,
  caseNumber = '2026-BLT-001',
  dateFiled,
  complainantName = 'Complainant',
  respondentName = 'Respondent',
  natureOfComplaint = 'Barangay Incident',
  isConciliation,
  isOpen,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const isConc = isConciliation ?? session?.hearingType === 'CONCILIATION' ?? session?.isConciliation ?? false
  const dateIssuedStr = formatDateFormatted(session?.scheduledStart || dateFiled || new Date().toISOString())
  const hearingDateStr = formatDateFormatted(session?.scheduledStart)
  const hearingTimeStr = formatSessionTimeRange(session?.scheduledStart, session?.scheduledEnd)
  const hearingNum = session?.hearingNumber || session?.summonNumber || 1
  const sessionTitle = isConc ? `Conciliation Hearing #${hearingNum}` : `Mediation Hearing #${hearingNum}`
  const venue = session?.venue || 'Barangay Hall, Ugong, Valenzuela City'

  useEffect(() => {
    if (!isOpen || !session) return

    let isCancelled = false
    setIsLoading(true)

    buildPaanyayaPdfDoc({
      caseNumber,
      complainantName,
      respondentName,
      natureOfComplaint,
      hearingNumber: hearingNum,
      hearingDate: hearingDateStr,
      hearingTime: hearingTimeStr,
      venue,
      dateIssued: dateIssuedStr,
      isConciliation: isConc,
    })
      .then(async (doc) => {
        const pdfBytes = await doc.save()
        const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        if (!isCancelled) {
          setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
          setIsLoading(false)
        } else {
          URL.revokeObjectURL(url)
        }
      })
      .catch((err) => {
        console.error('Failed to generate Paanyaya PDF preview:', err)
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [
    isOpen,
    session,
    caseNumber,
    dateFiled,
    complainantName,
    respondentName,
    natureOfComplaint,
    isConc,
    hearingNum,
    hearingDateStr,
    hearingTimeStr,
    venue,
    dateIssuedStr,
  ])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [pdfBlobUrl])

  if (!isOpen || !session) return null

  const handleDownloadClick = () => {
    if (!pdfBlobUrl) return
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = `Paanyaya_${caseNumber}_Hearing${hearingNum}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

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
            }, 2500)
          }
        }, 300)
      }
    } catch (err) {
      console.error('Failed to print Paanyaya:', err)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-800">

        {/* Action Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer size={16} className="text-blue-600" />
              Paanyaya (Summon Notice) Document
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Case {caseNumber} · {sessionTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={isLoading || !pdfBlobUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="I-download ang Paanyaya PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">I-download</span>
            </button>

            <button
              type="button"
              onClick={handlePrintClick}
              disabled={isPrinting || isLoading || !pdfBlobUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>{isPrinting ? 'Inihahanda...' : 'Print Paanyaya'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Preview Body (Official PDF rendering with Header, Watermark & Footer) */}
        <div className="w-full flex justify-center bg-slate-100/70 dark:bg-slate-950 p-2 sm:p-5 overflow-y-auto flex-1">
          <div className="w-full max-w-[850px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 relative flex justify-center min-h-[580px] h-[78vh] max-h-[880px]">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 space-y-3">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Ikinakarga ang opisyal na dokumento ng Paanyaya...
                </p>
              </div>
            )}
            {pdfBlobUrl && (
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                title="Paanyaya Document Preview"
                className="w-full h-full border-0 bg-white"
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
