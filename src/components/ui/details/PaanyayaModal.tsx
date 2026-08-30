import React, { useRef } from 'react'
import { X, Printer } from 'lucide-react'

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
  const printContainerRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !session) return null

  const isConc = isConciliation ?? session.hearingType === 'CONCILIATION' ?? session.isConciliation ?? false
  const dateIssuedStr = formatDateFormatted(session.scheduledStart || dateFiled || new Date().toISOString())
  const hearingDateStr = formatDateFormatted(session.scheduledStart)
  const hearingTimeStr = formatSessionTimeRange(session.scheduledStart, session.scheduledEnd)
  const hearingNum = session.hearingNumber || session.summonNumber || 1
  const sessionTitle = isConc ? `Conciliation Hearing #${hearingNum}` : `Mediation Hearing #${hearingNum}`
  const venue = session.venue || 'Barangay Hall'

  function handlePrint() {
    const printDoc = printContainerRef.current
    if (!printDoc) return

    // Create an isolated iframe for clean printing without background page leaks
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Paanyaya - Case ${caseNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm 15mm 20mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #111827;
              line-height: 1.5;
              background: #fff;
              font-size: 13px;
              padding: 10px;
            }
            .header-text {
              text-align: center;
              font-family: Arial, Helvetica, sans-serif;
            }
            .header-text p {
              margin: 2px 0;
            }
            .header-text h1 {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 1px;
              margin: 4px 0;
            }
            .double-divider {
              border-top: 2px solid #111827;
              border-bottom: 1px solid #111827;
              height: 4px;
              margin: 12px 0 16px 0;
            }
            .doc-title {
              text-align: center;
              font-family: Arial, Helvetica, sans-serif;
              margin-bottom: 16px;
            }
            .doc-title h2 {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: 3px;
              text-transform: uppercase;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 14px;
            }
            .recipient-box {
              font-family: Arial, Helvetica, sans-serif;
              margin-bottom: 14px;
            }
            .recipient-name {
              font-size: 15px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .statement-body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              text-align: justify;
              line-height: 1.6;
              margin-bottom: 16px;
            }
            .statement-body p {
              margin-bottom: 10px;
              text-indent: 24px;
            }
            .details-box {
              border: 1.5px solid #111827;
              padding: 12px 16px;
              margin: 16px 0;
              font-family: Arial, Helvetica, sans-serif;
            }
            .details-box-title {
              text-align: center;
              font-weight: bold;
              font-size: 11px;
              letter-spacing: 1px;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 16px;
              font-size: 12px;
            }
            .closing-section {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              margin-top: 20px;
            }
            .signatory-block {
              float: right;
              text-align: right;
              margin-top: 15px;
            }
            .sig-line {
              margin-top: 35px;
              border-top: 1px solid #111827;
              display: inline-block;
              min-width: 220px;
              padding-top: 4px;
              text-align: center;
            }
            .sig-name {
              font-weight: bold;
              font-size: 13px;
              letter-spacing: 0.5px;
            }
            .sig-title {
              font-style: italic;
              font-size: 11px;
              color: #4b5563;
            }
            .doc-footer {
              border-top: 1px solid #e2e8f0;
              margin-top: 110px;
              padding-top: 8px;
              text-align: center;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header-text">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Republic of the Philippines</p>
            <h1>BARANGAY UGONG</h1>
            <p style="font-size: 11px; color: #475569;">Valenzuela City, Metro Manila</p>
            <p style="font-size: 11px; font-style: italic; color: #64748b;">
              ${isConc ? 'Office of the Lupong Tagapamayapa' : 'Tanggapan ng Punong Barangay / Mediasyon'}
            </p>
          </div>

          <div class="double-divider"></div>

          <div class="doc-title">
            <h2>PAANYAYA</h2>
            <p style="font-size: 12px; font-style: italic; color: #475569;">
              (${isConc ? 'Summon / Notice to Appear for Conciliation' : 'Summon / Notice to Appear for Mediation'})
            </p>
          </div>

          <div class="meta-bar">
            <div>
              <span style="color: #64748b;">Case No.:</span> <strong>${caseNumber}</strong>
            </div>
            <div style="text-align: right;">
              <div><span style="color: #64748b;">Date Issued:</span> <strong>${dateIssuedStr}</strong></div>
              <div><span style="color: #64748b;">Hearing No.:</span> <strong>Ika-${hearingNum}</strong></div>
            </div>
          </div>

          <div class="recipient-box">
            <p style="font-size: 11px; color: #64748b;">Kay / To:</p>
            <p class="recipient-name">${respondentName}</p>
            <p style="font-size: 11px; font-style: italic; color: #64748b;">(Respondent / Nasasakdal)</p>
          </div>

          <div class="statement-body">
            <p>
              Ipinapaalam sa inyo na ang reklamo laban sa inyo ni <strong>${complainantName}</strong> kaugnay ng usapin ukol sa &quot;<strong>${natureOfComplaint}</strong>&quot; ay kasalukuyang sumasailalim sa proseso ng ${isConc ? 'konsiliyasyon sa ilalim ng Lupong Tagapamayapa / Pangkat Tagapagkasundo' : 'mediasyon sa Tanggapan ng Punong Barangay'} ng Barangay Ugong.
            </p>
            <p>
              Dahil dito, kayo ay magalang na inaanyayahang lumitaw sa nakatakdang pagdinig sa araw, oras, at lugar na nakasaad sa ibaba. Ang inyong pagdalo ay mahalaga upang mabigyan ng patas na pagkakataon ang bawat panig na maayos ang naturang usapin nang mapayapa.
            </p>
            <p>
              Alinsunod sa Katarungang Pambarangay (Republic Act No. 7160), ang hindi paglitaw nang walang makatuwirang dahilan matapos tanggapin ang paanyayang ito ay maaaring magresulta sa kaukulang aksyong legal o pagpapatuloy ng proseso alinsunod sa batas.
            </p>
          </div>

          <div class="details-box">
            <div class="details-box-title">
              MGA DETALYE NG PAGDINIG / HEARING DETAILS
            </div>
            <div class="grid-2">
              <div><strong>Petsa / Date:</strong> ${hearingDateStr}</div>
              <div><strong>Hearing Blg.:</strong> Ika-${hearingNum}</div>
              <div><strong>Oras / Time:</strong> ${hearingTimeStr}</div>
              <div><strong>Uri / Type:</strong> ${isConc ? 'Konsiliyasyon (Conciliation)' : 'Mediasyon (Mediation)'}</div>
              <div style="grid-column: span 2;"><strong>Lugar / Venue:</strong> ${venue}</div>
            </div>
          </div>

          <div class="closing-section">
            <p>Inaasahan namin ang inyong maagap at maayos na pagdalo.</p>

            <div class="signatory-block">
              <p style="font-style: italic; color: #475569; margin-bottom: 4px;">Taos-pusong gumagalang,</p>
              <div class="sig-line">
                <p class="sig-name">HON. MARICEL PINEDA</p>
                <p class="sig-title">Punong Barangay / Tagapangulo ng Lupon</p>
              </div>
            </div>
            <div style="clear: both;"></div>
          </div>

          <div class="doc-footer">
            <p>Lupong Tagapamayapa · Barangay Ugong, Lungsod ng Valenzuela · Case No. ${caseNumber}</p>
            <p>This document is strictly confidential and intended solely for the named recipient.</p>
          </div>
        </body>
      </html>
    `)
    doc.close()

    // Allow resources to render, then invoke isolated print
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/80">

        {/* Action Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shrink-0">
          <div>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Printer size={16} className="text-blue-600" />
              Paanyaya (Summon Notice) Document
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Case {caseNumber} · {sessionTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Document Preview Body */}
        <div ref={printContainerRef} className="p-8 sm:p-12 overflow-y-auto font-serif text-slate-900 bg-white leading-relaxed text-sm space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-xs font-sans text-slate-500 uppercase tracking-widest">Republic of the Philippines</p>
            <h1 className="text-xl font-bold text-slate-900 font-sans tracking-wide uppercase">BARANGAY UGONG</h1>
            <p className="text-xs font-sans text-slate-600">Valenzuela City, Metro Manila</p>
            <p className="text-xs font-sans italic text-slate-500">
              {isConc ? 'Office of the Lupong Tagapamayapa' : 'Tanggapan ng Punong Barangay / Mediasyon'}
            </p>
          </div>

          {/* Double Divider */}
          <div className="border-t-2 border-b border-slate-900 h-1 my-4"></div>

          {/* Document Title */}
          <div className="text-center space-y-1 py-1">
            <h2 className="text-2xl font-bold font-sans tracking-widest text-slate-900 uppercase">PAANYAYA</h2>
            <p className="text-xs font-sans italic text-slate-600">
              ({isConc ? 'Summon / Notice to Appear for Conciliation' : 'Summon / Notice to Appear for Mediation'})
            </p>
          </div>

          {/* Case Info Bar */}
          <div className="flex justify-between items-center text-xs font-sans border-b border-slate-200 pb-3 pt-2">
            <div>
              <span className="text-slate-500">Case No.:</span> <strong className="font-bold text-slate-900">{caseNumber}</strong>
            </div>
            <div className="text-right">
              <div><span className="text-slate-500">Date Issued:</span> <strong className="font-bold text-slate-900">{dateIssuedStr}</strong></div>
              <div><span className="text-slate-500">Hearing No.:</span> <strong className="font-bold text-slate-900">Ika-{hearingNum}</strong></div>
            </div>
          </div>

          {/* Recipient Block */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-sans text-slate-500">Kay / To:</p>
            <h3 className="text-lg font-bold font-sans tracking-wide uppercase text-slate-900">{respondentName}</h3>
            <p className="text-xs font-sans italic text-slate-600">(Respondent / Nasasakdal)</p>
          </div>

          {/* Statement Paragraphs */}
          <div className="space-y-4 text-justify font-sans text-xs text-slate-800 leading-relaxed pt-2">
            <p>
              Ipinapaalam sa inyo na ang reklamo laban sa inyo ni <strong>{complainantName}</strong> kaugnay ng usapin ukol sa &quot;<strong>{natureOfComplaint}</strong>&quot; ay kasalukuyang sumasailalim sa proseso ng {isConc ? 'konsiliyasyon sa ilalim ng Lupong Tagapamayapa / Pangkat Tagapagkasundo' : 'mediasyon sa Tanggapan ng Punong Barangay'} ng Barangay Ugong.
            </p>
            <p>
              Dahil dito, kayo ay magalang na inaanyayahang lumitaw sa nakatakdang pagdinig sa araw, oras, at lugar na nakasaad sa ibaba. Ang inyong pagdalo ay mahalaga upang mabigyan ng patas na pagkakataon ang bawat panig na maayos ang naturang usapin nang mapayapa.
            </p>
            <p>
              Alinsunod sa Katarungang Pambarangay (Republic Act No. 7160), ang hindi paglitaw nang walang makatuwirang dahilan matapos tanggapin ang paanyayang ito ay maaaring magresulta sa kaukulang aksyong legal o pagpapatuloy ng proseso alinsunod sa batas.
            </p>
          </div>

          {/* Hearing Details Box */}
          <div className="border border-slate-900 rounded-none p-4 my-6 font-sans">
            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
              MGA DETALYE NG PAGDINIG / HEARING DETAILS
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Petsa / Date:</span> {hearingDateStr}
              </div>
              <div>
                <span className="font-bold text-slate-900">Hearing Blg.:</span> Ika-{hearingNum}
              </div>
              <div>
                <span className="font-bold text-slate-900">Oras / Time:</span> {hearingTimeStr}
              </div>
              <div>
                <span className="font-bold text-slate-900">Uri / Type:</span> {isConc ? 'Konsiliyasyon (Conciliation)' : 'Mediasyon (Mediation)'}
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-900">Lugar / Venue:</span> {venue}
              </div>
            </div>
          </div>

          {/* Closing Text */}
          <div className="space-y-6 font-sans text-xs pt-2">
            <p>Inaasahan namin ang inyong maagap at maayos na pagdalo.</p>
            
            <div className="text-right pt-6 space-y-1 float-right">
              <p className="italic text-slate-600">Taos-pusong gumagalang,</p>
              <div className="pt-8">
                <p className="font-bold text-slate-900 text-sm tracking-wide border-t border-slate-900 pt-1 inline-block min-w-[200px] text-center">
                  HON. MARICEL PINEDA
                </p>
                <p className="italic text-slate-600 text-[11px] text-center">Punong Barangay / Tagapangulo ng Lupon</p>
              </div>
            </div>
            <div className="clear-both"></div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-4 text-center font-sans text-[10px] text-slate-400 space-y-0.5">
            <p>Lupong Tagapamayapa · Barangay Ugong, Lungsod ng Valenzuela · Case No. {caseNumber}</p>
            <p>This document is strictly confidential and intended solely for the named recipient.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
