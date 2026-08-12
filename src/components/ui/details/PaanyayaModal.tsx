import { X, Printer } from 'lucide-react'
import { type MediationSession } from '@/api/modules/mediation.api'

interface Props {
  session: MediationSession | null
  caseNumber?: string
  dateFiled?: string
  complainantName?: string
  respondentName?: string
  natureOfComplaint?: string
  isOpen: boolean
  onClose: () => void
}

function formatDateFormatted(iso: string): string {
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

function formatSessionTimeRange(startIso: string, endIso: string): string {
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
  complainantName = 'Eusebio Jagonap',
  respondentName = 'LORENA LLAMAS',
  natureOfComplaint = 'Public Disturbance / Scandal',
  isOpen,
  onClose,
}: Props) {
  if (!isOpen || !session) return null

  function handlePrint() {
    window.print()
  }

  const dateIssuedStr = formatDateFormatted(session.scheduledStart || dateFiled || new Date().toISOString())
  const hearingDateStr = formatDateFormatted(session.scheduledStart)
  const hearingTimeStr = formatSessionTimeRange(session.scheduledStart, session.scheduledEnd)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none animate-in fade-in zoom-in-95 duration-200">

        {/* Action Header — hidden during print */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Paanyaya (Summon Notice) Document</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto font-serif text-slate-900 bg-white leading-relaxed text-sm space-y-6 print:p-8 print:overflow-visible">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-xs font-sans text-slate-500 uppercase tracking-widest">Republic of the Philippines</p>
            <h1 className="text-xl font-bold text-slate-900 font-sans tracking-wide uppercase">BARANGAY UGONG</h1>
            <p className="text-xs font-sans text-slate-600">Valenzuela City, Metro Manila</p>
            <p className="text-xs font-sans italic text-slate-500">Office of the Lupong Tagapamayapa</p>
          </div>

          {/* Double Divider */}
          <div className="border-t-2 border-b border-slate-900 h-1 my-4"></div>

          {/* Document Title */}
          <div className="text-center space-y-1 py-2">
            <h2 className="text-2xl font-bold font-sans tracking-widest text-slate-900 uppercase">PAANYAYA</h2>
            <p className="text-xs font-sans italic text-slate-600">(Summon / Notice to Appear)</p>
          </div>

          {/* Case Info Bar */}
          <div className="flex justify-between items-center text-xs font-sans border-b border-slate-200 pb-3 pt-2">
            <div>
              <span className="text-slate-500">Case No.:</span> <strong className="font-bold text-slate-900">{caseNumber}</strong>
            </div>
            <div className="text-right">
              <div><span className="text-slate-500">Date Issued:</span> <strong className="font-bold text-slate-900">{dateIssuedStr}</strong></div>
              <div><span className="text-slate-500">Summon No.:</span> <strong className="font-bold text-slate-900">{session.hearingNumber}</strong></div>
            </div>
          </div>

          {/* Recipient Block */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-sans text-slate-500">Kay / To:</p>
            <h3 className="text-lg font-bold font-sans tracking-wide uppercase text-slate-900">{respondentName}</h3>
            <p className="text-xs font-sans italic text-slate-600">(Nasasakdal)</p>
          </div>

          {/* Statement Paragraphs */}
          <div className="space-y-4 text-justify font-sans text-xs text-slate-800 leading-relaxed pt-2">
            <p>
              Ipinaaalam sa inyo na ang reklamo laban sa inyo ni <strong>{complainantName}</strong> kaugnay ng usapin ukol sa &quot;<strong>{natureOfComplaint}</strong>&quot; ay kasalukuyang iniimbestigahan ng Lupong Tagapamayapa ng Barangay Ugong.
            </p>
            <p>
              Kayo ay inaanyahang lumitaw sa mediasyon/konsiliyasyon sa araw at oras na nakatakda sa ibaba. Ang inyong hindi paglitaw nang walang sapat na dahilan ay maaaring magbunga ng mga legal na hakbang alinsunod sa Katarungang Pambarangay (RA 7160).
            </p>
          </div>

          {/* Hearing Details Box */}
          <div className="border border-slate-900 rounded-none p-4 my-6 font-sans">
            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-3">
              MGA DETALYE NG MEDIASYON / HEARING DETAILS
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Petsa / Date:</span> {hearingDateStr}
              </div>
              <div>
                <span className="font-bold text-slate-900">Summon Blg.:</span> Ika-{session.hearingNumber}
              </div>
              <div>
                <span className="font-bold text-slate-900">Oras / Time:</span> {hearingTimeStr}
              </div>
              <div></div>
              <div>
                <span className="font-bold text-slate-900">Lugar / Venue:</span> {session.venue}
              </div>
            </div>
          </div>

          {/* Closing Text */}
          <div className="space-y-6 font-sans text-xs pt-2">
            <p>Umaasa kaming inyong pagsusukuran ang paanyayang ito.</p>
            
            <div className="text-right pt-6 space-y-1 float-right">
              <p className="italic text-slate-600">Taos-pusong gumagalang,</p>
              <div className="pt-10">
                <p className="font-bold text-slate-900 text-sm tracking-wide border-t border-slate-900 pt-1 inline-block min-w-[200px]">
                  HON. MARICEL PINEDA
                </p>
                <p className="italic text-slate-600 text-[11px]">Punong Barangay / Tagapangulo ng Lupon</p>
              </div>
            </div>
            <div className="clear-both"></div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-4 text-center font-sans text-[10px] text-slate-400 space-y-0.5">
            <p>Lupong Tagapamayapa · Barangay Ugong, Valenzuela City · Case No. {caseNumber}</p>
            <p>This document is strictly confidential and intended solely for the named recipient.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
