import React, { useState, useEffect, useRef } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import type { BlotterBackendResponse } from '@/api/modules/blotter.api'
import { generateCfaCertificate, buildCfaPdfDoc } from '@/utils/generateCfaCertificate'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

interface CfaDocumentPanelProps {
  caseDetail: BlotterBackendResponse
}

export function CfaDocumentPanel({ caseDetail }: CfaDocumentPanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
  const receivingOfficer = caseDetail.receivingOfficer || 'MS. JOYCE KRISHA TAN'
  const punongBarangay = 'Hon. MARICEL PINEDA-EMPERADOR'

  const renderPdfCanvas = async () => {
    setIsLoading(true)
    try {
      const pdfDoc = await buildCfaPdfDoc({
        caseNumber,
        complainantName,
        respondentName,
        natureOfComplaint,
        grounds,
        dateIssued,
        secretaryName: receivingOfficer,
        punongBarangayName: punongBarangay,
      })

      const pdfBytes = await pdfDoc.save()
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
      const pdf = await loadingTask.promise
      const page = await pdf.getPage(1)

      const scale = 2.0
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      if (canvas) {
        const context = canvas.getContext('2d')
        if (context) {
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'

          context.fillStyle = '#FFFFFF'
          context.fillRect(0, 0, canvas.width, canvas.height)

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          }
          await page.render(renderContext as any).promise
        }
      }
    } catch (err) {
      console.error('Failed to render PDF to canvas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    renderPdfCanvas()
  }, [caseDetail])

  async function handlePrintClick() {
    setIsPrinting(true)
    try {
      await generateCfaCertificate({
        caseNumber,
        complainantName,
        respondentName,
        natureOfComplaint,
        grounds,
        dateIssued,
        secretaryName: receivingOfficer,
        punongBarangayName: punongBarangay,
      })
    } catch (err) {
      console.error('Failed to generate/print CFA PDF:', err)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Clean Right-Aligned Print Button Only */}
      <div className="flex justify-end items-center">
        <button
          type="button"
          onClick={handlePrintClick}
          disabled={isPrinting || isLoading}
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
        <div className="w-full max-w-[850px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 relative flex justify-center">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 space-y-3 min-h-[500px]">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-600">
                Ikinakarga ang opisyal na dokumento ng CFA...
              </p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-auto bg-white block"
            style={{ display: 'block', backgroundColor: '#FFFFFF' }}
          />
        </div>
      </div>
    </div>
  )
}
