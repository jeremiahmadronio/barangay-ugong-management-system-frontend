import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { documentAssets, loadDocumentAsset } from '@/utils/documentAssets'

export interface ReferralLetterData {
  controlNumber: string
  caseNumber: string
  referralDate: string
  referredTo: string
  referredToOther?: string
  purpose: string
  purposeOther?: string
  grounds?: string
  referredBy?: string
  childName?: string
  childAge?: number | string
  childGender?: string
  childCategory?: string // CAR or CICL
  incidentType?: string
  punongBarangayName?: string
}

function formatLongDate(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
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

function getAgencyName(data: ReferralLetterData): string {
  if (data.referredTo === 'LSWDO') {
    return 'LOCAL SOCIAL WELFARE AND DEVELOPMENT OFFICE (LSWDO / CSWDO)'
  }
  if (data.referredTo === 'PNP_WCPD') {
    return 'PHILIPPINE NATIONAL POLICE - WOMEN AND CHILDREN PROTECTION DESK (PNP-WCPD)'
  }
  if (data.referredTo === 'BPO' || data.referredTo === 'COURT') {
    return 'OFFICE OF THE CLERK OF COURT / REGIONAL TRIAL COURT - FAMILY COURT'
  }
  if (data.referredTo === 'HEALTH_OFFICE') {
    return 'CITY HEALTH OFFICE / MEDICAL & PSYCHIATRIC EVALUATION CENTER'
  }
  if (data.referredTo === 'NGO_FACILITY') {
    return 'LICENSED CHILD-CARING INSTITUTION / YOUTH REHABILITATION FACILITY'
  }
  return (data.referredToOther || data.referredTo || 'CONCERNED CHILD WELFARE AGENCY').toUpperCase()
}

function getPurposeLabel(data: ReferralLetterData): string {
  if (data.purposeOther && data.purposeOther.trim()) {
    return data.purposeOther.trim()
  }
  const p = (data.purpose || '').toUpperCase()
  if (p === 'PSYCHOSOCIAL') return 'Psychosocial Support, Counseling & Case Management'
  if (p === 'MEDICAL_LEGAL') return 'Immediate Medical Assessment, Medicolegal & Healthcare Assistance'
  if (p === 'SHELTER_PLACEMENT') return 'Protective Custody, Temporary Shelter & Rehabilitation Placement'
  if (p === 'LEGAL_ACTION') return 'Legal Evaluation, Court Representation & Appropriate Disposition'
  if (p === 'COMMUNITY_DIVERSION') return 'Structured Diversion Program & Community Re-integration'
  if (p === 'INTENSIVE_INTERVENTION') return 'Intensive Juvenile Intervention & Special Care Program'
  return data.purpose || 'Comprehensive Child Welfare Assessment & Specialized Protection Services'
}

export async function buildBcpcReferralPdfDoc(data: ReferralLetterData): Promise<PDFDocument> {
  // 1. Load official Barangay Ugong Canva PDF template (same background used for Clearance & Permits)
  const templateBytes = await loadDocumentAsset(documentAssets.certificateTemplate)
  const pdfDoc = await PDFDocument.load(templateBytes)
  const pages = pdfDoc.getPages()
  const page = pages[0]
  const { width, height } = page.getSize()

  const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  // 2. Official Watermark Seal in the Center
  try {
    const sealBytes = await loadDocumentAsset(documentAssets.seal)
    const embeddedSeal = await pdfDoc.embedPng(sealBytes)
    if (embeddedSeal) {
      const sealSize = 280
      const sealX = (width - sealSize) / 2
      const sealY = 240
      page.drawImage(embeddedSeal, {
        x: sealX,
        y: sealY,
        width: sealSize,
        height: sealSize,
        opacity: 0.08,
      })
    }
  } catch (sealErr) {
    console.warn('Could not embed watermark seal in BCPC Referral Letter:', sealErr)
  }

  const marginX = 58
  const contentWidth = width - marginX * 2 // ~479 pt

  const formattedDate = formatLongDate(data.referralDate)
  const agencyName = getAgencyName(data)
  const purposeLabel = getPurposeLabel(data)

  // Formal Block Paragraph Drawer (Full Block Style matching standard business letter format)
  const drawBlockParagraph = (
    text: string,
    startY: number,
    options: {
      defaultFont?: any
      boldFont?: any
      fontSize?: number
      lineHeight?: number
      leftX?: number
      maxWidth?: number
      paragraphGap?: number
      color?: any
    } = {}
  ): number => {
    const {
      defaultFont = fontNormal,
      boldFont = fontBold,
      fontSize = 10,
      lineHeight = 14.5,
      leftX = marginX,
      maxWidth = contentWidth,
      paragraphGap = 10,
      color = rgb(0, 0, 0),
    } = options

    const cleanText = text.replace(/\s+/g, ' ').trim()
    const parts = cleanText.split('**')
    const tokens: { word: string; font: any }[] = []

    for (let i = 0; i < parts.length; i++) {
      const isBold = i % 2 !== 0
      const tokenFont = isBold ? boldFont : defaultFont
      const words = parts[i].split(' ').filter((w) => w.length > 0)
      for (const w of words) {
        tokens.push({ word: w, font: tokenFont })
      }
    }

    if (tokens.length === 0) return startY

    // Break into lines (Full block style - left aligned)
    const lines: { word: string; font: any }[][] = []
    let currentLine: { word: string; font: any }[] = []
    let currentLineWidth = 0

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      const wordW = t.font.widthOfTextAtSize(t.word, fontSize)
      const spaceW = t.font.widthOfTextAtSize(' ', fontSize)
      const neededW = currentLine.length > 0 ? spaceW + wordW : wordW

      if (currentLineWidth + neededW > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = [t]
        currentLineWidth = wordW
      } else {
        currentLine.push(t)
        currentLineWidth += neededW
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    let lineY = startY
    for (let l = 0; l < lines.length; l++) {
      let curX = leftX
      const lineTokens = lines[l]

      for (let i = 0; i < lineTokens.length; i++) {
        const t = lineTokens[i]
        page.drawText(t.word, {
          x: curX,
          y: lineY,
          size: fontSize,
          font: t.font,
          color,
        })
        const wordW = t.font.widthOfTextAtSize(t.word, fontSize)
        const spaceW = t.font.widthOfTextAtSize(' ', fontSize)
        curX += wordW + spaceW
      }

      if (l < lines.length - 1) {
        lineY -= lineHeight
      }
    }

    return lineY - lineHeight - paragraphGap
  }

  // 3. Date & Document Reference (Top of letter below Canva banner)
  let currentY = height - 150

  page.drawText(formattedDate, {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  const refText = `Case No.: ${data.caseNumber || 'N/A'}`
  const refW = fontNormal.widthOfTextAtSize(refText, 9)
  page.drawText(refText, {
    x: width - marginX - refW,
    y: currentY,
    size: 9,
    font: fontNormal,
    color: rgb(70 / 255, 70 / 255, 70 / 255),
  })

  currentY -= 20

  // 4. Inside Address (Block style matching formal letter sample)
  page.drawText(agencyName, {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  currentY -= 13

  page.drawText('City Social Welfare & Development Office', {
    x: marginX,
    y: currentY,
    size: 9.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })
  currentY -= 13

  page.drawText('City Government of Valenzuela, Metro Manila', {
    x: marginX,
    y: currentY,
    size: 9.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  currentY -= 18

  // 5. Salutation & Greeting
  page.drawText('Sir / Madam:', {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  currentY -= 15

  page.drawText('Warmest greetings!', {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  currentY -= 14

  // 6. Body Paragraph 1: Child Endorsement
  const child = (data.childName || 'Child on Record').trim()
  const ageStr = data.childAge ? `${data.childAge} years old` : 'Minor'
  const genderStr = data.childGender ? `(${data.childGender})` : ''
  const catStr =
    data.childCategory === 'CICL'
      ? 'Child in Conflict with the Law (CICL)'
      : 'Child at Risk (CAR)'
  const incidentStr = data.incidentType || 'Child Welfare / Protection Matter'

  const p1 = `This is to formally endorse and refer to your competent office the confidential child protection case involving **${child.toUpperCase()}** (${ageStr} ${genderStr}), residing within the jurisdiction of Barangay Ugong, Valenzuela City, officially documented under BCPC Case Reference No. **${data.caseNumber || 'N/A'}** and categorized as a **${catStr}**.`
  currentY = drawBlockParagraph(p1, currentY)

  // 7. Body Paragraph 2: Statutory Mandate & Purpose
  const p2 = `Pursuant to the statutory mandate under Republic Act No. 9344 (Juvenile Justice and Welfare Act of 2006) as amended by Republic Act No. 10630, and the established Child Protection Protocols of Barangay Ugong, this referral is respectfully transmitted for the purpose of **${purposeLabel}** regarding reported matter(s) concerning **${incidentStr}**.`
  currentY = drawBlockParagraph(p2, currentY)

  // 8. Body Paragraph 3: Grounds & Assessment Findings
  const groundsContent =
    (data.grounds && data.grounds.trim()) ||
    'Case referred for appropriate specialized intervention, assessment, and protective management beyond the capacity of the Barangay Desk.'

  const p3 = `Based on the preliminary assessment conducted by our Council, the grounds and initial findings are as follows: "${groundsContent}". In the highest interest and protection of the child, comprehensive evaluation, professional psycho-social assessment, and specialized protective intervention beyond the immediate facilities of the Barangay Desk are earnestly required.`
  currentY = drawBlockParagraph(p3, currentY)

  // 9. Body Paragraph 4: Formal Case Intake Request
  const p4 = `In line with this, we would like to respectfully request your good office to conduct the requisite case intake and furnish the Barangay Council for the Protection of Children (BCPC) of Barangay Ugong with your formal feedback, assessment report, or disposition acknowledgment for complete integration into the child's case docket.`
  currentY = drawBlockParagraph(p4, currentY)

  // 10. Body Paragraph 5: Confidentiality & Closing Wish
  const p5 = `In this regard, we strictly value the principle of confidentiality under R.A. 9344 and R.A. 10173 in safeguarding the best interests and welfare of the child. We are hoping for your kind consideration and prompt action on this referral. Thank you very much, God bless, and more power!`
  currentY = drawBlockParagraph(p5, currentY, { paragraphGap: 14 })

  // 11. Complimentary Close
  page.drawText('Respectfully yours,', {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  // 12. Signatures (2-Column Formal Layout)
  const officerName = (data.referredBy || 'BCPC Focal Person').toUpperCase()
  const punongBarangayName = (
    data.punongBarangayName || 'HON. MARICEL PINEDA-EMPERADOR'
  ).toUpperCase()

  const sigColWidth = 190
  const col1X = marginX
  const col2X = width - marginX - sigColWidth
  const sigStartY = 240

  page.drawText('Referred & Endorsed by:', {
    x: col1X,
    y: sigStartY,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })
  page.drawText('Noted & Approved by:', {
    x: col2X,
    y: sigStartY,
    size: 9,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  const sigLineY = sigStartY - 28

  // Signature lines
  page.drawLine({
    start: { x: col1X, y: sigLineY },
    end: { x: col1X + sigColWidth, y: sigLineY },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  })
  page.drawLine({
    start: { x: col2X, y: sigLineY },
    end: { x: col2X + sigColWidth, y: sigLineY },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  })

  page.drawText(officerName, {
    x: col1X,
    y: sigLineY - 12,
    size: 9.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  page.drawText(punongBarangayName, {
    x: col2X,
    y: sigLineY - 12,
    size: 9.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  page.drawText('BCPC Focal Person / Intake Officer', {
    x: col1X,
    y: sigLineY - 22,
    size: 8.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })
  page.drawText('Punong Barangay / Chairperson, BCPC', {
    x: col2X,
    y: sigLineY - 22,
    size: 8.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  })

  // 13. Official Clearance-Style Note above the Canva graphic bottom footer
  const noteText = 'NOTE: NOT VALID WITHOUT OFFICIAL BARANGAY SEAL AND DRY SEAL'
  const noteW = fontNormal.widthOfTextAtSize(noteText, 7.5)
  page.drawText(noteText, {
    x: (width - noteW) / 2,
    y: 138,
    size: 7.5,
    font: fontNormal,
    color: rgb(100 / 255, 116 / 255, 139 / 255),
  })

  return pdfDoc
}

function escapeHtml(str?: string | number | null): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getAgencyDetails(data: ReferralLetterData): { name: string; address: string } {
  if (data.referredTo === 'LSWDO') {
    return {
      name: 'LOCAL SOCIAL WELFARE AND DEVELOPMENT OFFICE (LSWDO / CSWDO)',
      address: 'City Social Welfare & Development Office, City Government of Valenzuela, Metro Manila',
    }
  }
  if (data.referredTo === 'PNP_WCPD') {
    return {
      name: 'PHILIPPINE NATIONAL POLICE - WOMEN AND CHILDREN PROTECTION DESK (PNP-WCPD)',
      address: 'Valenzuela City Police Station, PNP-WCPD Section, Valenzuela City',
    }
  }
  if (data.referredTo === 'BPO' || data.referredTo === 'COURT') {
    return {
      name: 'OFFICE OF THE CLERK OF COURT / REGIONAL TRIAL COURT - FAMILY COURT',
      address: 'Hall of Justice, Regional Trial Court - Designated Family Court, Valenzuela City',
    }
  }
  if (data.referredTo === 'HEALTH_OFFICE') {
    return {
      name: 'CITY HEALTH OFFICE / MEDICAL & PSYCHIATRIC EVALUATION DESK',
      address: 'Valenzuela City Health Office / City Medical Center, Valenzuela City',
    }
  }
  if (data.referredTo === 'NGO_FACILITY') {
    return {
      name: 'LICENSED CHILD-CARING INSTITUTION / YOUTH REHABILITATION FACILITY',
      address: 'Accredited DSWD Youth Care Facility / Intervention Center',
    }
  }
  return {
    name: (data.referredToOther || data.referredTo || 'CONCERNED CHILD WELFARE AGENCY').toUpperCase(),
    address: 'City of Valenzuela, Metro Manila',
  }
}

/**
 * Builds the official printable HTML letterhead with 4 logos, official blue banner,
 * seal watermark, document control numbers, and formal transmittal structure.
 */
export function generateBcpcReferralHtml(data: ReferralLetterData): string {
  const formattedDate = formatLongDate(data.referralDate)
  const agency = getAgencyDetails(data)
  const purposeLabel = getPurposeLabel(data)

  const childCategoryCode = (data.childCategory || 'CAR').toUpperCase()
  const childCategoryText =
    childCategoryCode === 'CICL'
      ? 'Child in Conflict with the Law (CICL)'
      : 'Child at Risk (CAR)'

  const ageText = data.childAge ? `${data.childAge} yrs old` : '—'
  const genderText = data.childGender ? data.childGender.toUpperCase() : '—'
  const ageGenderCombined = `${ageText} / ${genderText}`

  const signatoryReferredBy = data.referredBy?.trim() || 'BCPC Focal Person'
  const signatoryPunongBarangay = data.punongBarangayName?.trim() || 'HON. MARICEL PINEDA-EMPERADOR'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Official Inter-Agency Referral Letter - ${escapeHtml(data.controlNumber || 'BCPC-REF')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 14mm 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.45;
    }
    .page-container {
      position: relative;
      width: 100%;
      min-height: 100%;
    }
    .watermark-seal {
      position: fixed;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 360px;
      height: 360px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }
    .header-banner {
      width: 100%;
      max-height: 104px;
      object-fit: contain;
      display: block;
      margin: 0 auto 6px auto;
    }
    .control-bar {
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding: 3px 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-weight: bold;
      background: #f8fafc;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .office-heading {
      text-align: center;
      margin-bottom: 10px;
    }
    .office-heading .republic {
      font-size: 9px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .office-heading .city {
      font-size: 9.5px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
    }
    .office-heading .office {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .office-heading .council {
      font-size: 11px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .doc-title-box {
      text-align: center;
      margin: 10px 0 12px 0;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      display: inline-block;
      padding-bottom: 2px;
    }
    .doc-subtitle {
      font-size: 8.5px;
      color: #475569;
      font-style: italic;
      margin-top: 3px;
    }
    .recipient-box {
      margin-bottom: 10px;
      padding: 6px 10px;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .recipient-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .recipient-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .recipient-address {
      font-size: 9.5px;
      color: #475569;
      margin-top: 1px;
    }
    .subject-line {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      padding-bottom: 3px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .salutation {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 7px;
    }
    .body-p {
      text-align: justify;
      margin-bottom: 7px;
      text-indent: 24px;
      font-size: 10px;
      line-height: 1.5;
      color: #1e293b;
    }
    .narrative-grounds-box {
      margin: 6px 0 8px 18px;
      padding: 6px 12px;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      border-radius: 0 4px 4px 0;
    }
    .grounds-quote {
      font-style: italic;
      font-size: 9.5px;
      line-height: 1.45;
      color: #334155;
      margin: 0;
      white-space: pre-wrap;
    }
    .closing {
      font-size: 10px;
      margin-top: 10px;
      margin-bottom: 24px;
      color: #0f172a;
    }
    .signatories-section {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signatory-box {
      width: 46%;
    }
    .sign-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 30px;
    }
    .sign-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      border-top: 1px solid #0f172a;
      display: inline-block;
      padding-top: 3px;
      min-width: 170px;
      text-align: center;
    }
    .sign-role {
      font-size: 9px;
      color: #334155;
      margin-top: 2px;
      text-align: center;
    }
    .sign-office {
      font-size: 8px;
      color: #64748b;
      text-align: center;
    }
    .footer-bar {
      margin-top: 20px;
      border-top: 1.5px solid #2563eb;
      padding-top: 4px;
      text-align: center;
      font-size: 8px;
      color: #475569;
      page-break-inside: avoid;
    }
    .footer-confidential {
      font-weight: 800;
      color: #dc2626;
      font-size: 8px;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    @media print {
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Centered Watermark Seal -->
    <img src="${documentAssets.seal}" alt="Watermark Seal" class="watermark-seal" />

    <!-- Official Header Banner (4 Logos + Blue Bar) -->
    <img src="${documentAssets.letterhead}" alt="Barangay Ugong Letterhead" class="header-banner" />

    <!-- Document Control Bar -->
    <div class="control-bar">
      <span>CONTROL NO: ${escapeHtml(data.controlNumber || 'REF-BCPC-PENDING')}</span>
      <span>CASE NO: ${escapeHtml(data.caseNumber || 'CASE-RECORD')}</span>
      <span>DATE: ${escapeHtml(formattedDate)}</span>
    </div>

    <!-- Office Heading -->
    <div class="office-heading">
      <div class="republic">Republic of the Philippines · Kalakhang Maynila</div>
      <div class="city">Lungsod ng Valenzuela</div>
      <div class="office">TANGGAPAN NG SANGGUNIANG BARANGAY</div>
      <div class="council">BARANGAY COUNCIL FOR THE PROTECTION OF CHILDREN (BCPC)</div>
    </div>

    <!-- Title -->
    <div class="doc-title-box">
      <div class="doc-title">INTER-AGENCY REFERRAL TRANSMITTAL</div>
      <div class="doc-subtitle">Pursuant to Republic Act No. 9344 as amended by R.A. 10630 / Child Protection Protocol</div>
    </div>

    <!-- Recipient Agency Box -->
    <div class="recipient-box">
      <div class="recipient-label">TO (REFERRED AGENCY / DESK):</div>
      <div class="recipient-name">${escapeHtml(agency.name)}</div>
      <div class="recipient-address">${escapeHtml(agency.address)}</div>
    </div>

    <!-- Subject Line -->
    <div class="subject-line">
      <strong>SUBJECT:</strong> OFFICIAL INTER-AGENCY REFERRAL FOR ${escapeHtml(childCategoryText.toUpperCase())}
    </div>

    <!-- Formal Body (Essay Type) -->
    <p class="salutation">
      Dear Sir / Madam:
    </p>

    <p class="body-p">
      This is to respectfully endorse and refer to your competent office the confidential child protection case involving <strong>${escapeHtml((data.childName || 'Child on Record').toUpperCase())}</strong> (${escapeHtml(ageGenderCombined)}), residing at Barangay Ugong, Valenzuela City, officially documented under BCPC Case Reference No. <strong>${escapeHtml(data.caseNumber || 'N/A')}</strong> and categorized as a <strong>${escapeHtml(childCategoryText)}</strong>.
    </p>

    <p class="body-p">
      Pursuant to the statutory mandate under <strong>Republic Act No. 9344</strong> (<em>Juvenile Justice and Welfare Act of 2006</em>), as amended by <strong>Republic Act No. 10630</strong>, and the established Child Protection Protocols of Barangay Ugong, this official endorsement is formally transmitted for the purpose of <strong>${escapeHtml(purposeLabel)}</strong> in connection with reported matter(s) concerning <strong>${escapeHtml(data.incidentType || 'Barangay Child Protection Case')}</strong>.
    </p>

    <p class="body-p">
      Based on the preliminary intake, inquiry, and case assessment conducted by the Barangay Council for the Protection of Children (BCPC), the grounds and initial findings are respectfully presented as follows:
    </p>

    <div class="narrative-grounds-box">
      <p class="grounds-quote">"${escapeHtml(data.grounds && data.grounds.trim() ? data.grounds.trim() : 'Referred for comprehensive case management, intervention assessment, and protective welfare services.')}"</p>
    </div>

    <p class="body-p">
      In the highest interest and protection of the child, comprehensive evaluation, professional psycho-social assessment, and specialized protective intervention beyond the immediate capacity and facilities of the Barangay Desk are earnestly required.
    </p>

    <p class="body-p">
      May we respectfully request your good office to conduct the requisite case intake and furnish our Council with your formal feedback, assessment report, or disposition acknowledgment for complete integration into the child's case docket.
    </p>

    <p class="body-p">
      Thank you very much for your steadfast cooperation in safeguarding the best interests and welfare of our children.
    </p>

    <p class="closing">
      Very truly yours,
    </p>

    <!-- Signatories -->
    <div class="signatories-section">
      <div class="signatory-box">
        <div class="sign-title">Referred & Endorsed By:</div>
        <div class="sign-name">${escapeHtml(signatoryReferredBy)}</div>
        <div class="sign-role">BCPC Focal Person / Intake Officer</div>
        <div class="sign-office">Barangay Council for the Protection of Children</div>
      </div>
      <div class="signatory-box" style="text-align: right;">
        <div class="sign-title">Noted & Approved By:</div>
        <div class="sign-name">${escapeHtml(signatoryPunongBarangay)}</div>
        <div class="sign-role">Punong Barangay / Chairperson, BCPC</div>
        <div class="sign-office">Barangay Ugong, Valenzuela City</div>
      </div>
    </div>

    <!-- Official Footer -->
    <div class="footer-bar">
      <div>Tanggapan ng Punong Barangay · Sangguniang Barangay ng Ugong, Lungsod ng Valenzuela, Kalakhang Maynila</div>
      <div style="margin-top: 1px;">Tel: (02) 8983-9330 · Email: ugong.valenzuelacity@gmail.com · Official Website: www.barangayugong.gov.ph</div>
      <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">NOTE: NOT VALID WITHOUT OFFICIAL BARANGAY SEAL AND DRY SEAL</div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Direct print trigger for BCPC Referral Letter ("rekta print").
 * Generates the authentic Canva PDF (with 4 logos, double border, and Canva footer)
 * and opens/prints the PDF directly.
 */
export async function printBcpcReferralLetter(
  data: ReferralLetterData,
  providedWindow?: Window | null
): Promise<string> {
  let targetWindow: Window | null = providedWindow || null
  if (!targetWindow) {
    try {
      targetWindow = window.open('', '_blank')
    } catch {
      targetWindow = null
    }
  }

  try {
    const pdfDoc = await buildBcpcReferralPdfDoc(data)
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
    const previewUrl = URL.createObjectURL(blob)

    // Load PDF directly into targetWindow for viewing and print
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = previewUrl
      setTimeout(() => {
        try {
          targetWindow?.focus()
          targetWindow?.print()
        } catch {
          // Handled by browser native PDF viewer
        }
      }, 600)
    } else {
      const existingIframe = document.getElementById('bcpc-referral-print-iframe')
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe)
      }

      const printIframe = document.createElement('iframe')
      printIframe.id = 'bcpc-referral-print-iframe'
      printIframe.style.position = 'fixed'
      printIframe.style.right = '0'
      printIframe.style.bottom = '0'
      printIframe.style.width = '0'
      printIframe.style.height = '0'
      printIframe.style.border = '0'
      printIframe.style.visibility = 'hidden'
      printIframe.src = previewUrl
      document.body.appendChild(printIframe)

      const triggerPrint = () => {
        try {
          printIframe.contentWindow?.focus()
          printIframe.contentWindow?.print()
        } catch (e) {
          console.warn('Iframe print trigger handled:', e)
        }
      }

      printIframe.onload = () => {
        setTimeout(triggerPrint, 350)
      }
      setTimeout(triggerPrint, 1200)

      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe)
        }
      }, 5000)
    }

    return previewUrl
  } catch (err: any) {
    console.error('Error in printBcpcReferralLetter:', err)
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }
    alert('Failed to generate Referral Letter: ' + (err?.message || String(err)))
    throw err
  }
}
