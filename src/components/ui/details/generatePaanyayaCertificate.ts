import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { documentAssets, loadDocumentAsset } from '@/utils/documentAssets'

export interface PaanyayaCertificateData {
  caseNumber: string
  complainantName: string
  respondentName: string
  natureOfComplaint: string
  hearingNumber: number | string
  hearingDate: string
  hearingTime: string
  venue: string
  dateIssued: string
  isConciliation?: boolean
  punongBarangayName?: string
}

export async function buildPaanyayaPdfDoc(
  data: PaanyayaCertificateData,
  rotationAngle: number = 0
): Promise<PDFDocument> {
  const templateBytes = await loadDocumentAsset(documentAssets.certificateTemplate)
  const pdfDoc = await PDFDocument.load(templateBytes)
  const pages = pdfDoc.getPages()
  const page = pages[0]
  page.setRotation(degrees(rotationAngle))
  const { width, height } = page.getSize()

  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // 1. Official Watermark Seal in the Optical Center of the Page
  try {
    const sealBytes = await loadDocumentAsset(documentAssets.seal)
    const embeddedSeal = await pdfDoc.embedPng(sealBytes)
    if (embeddedSeal) {
      const sealSize = 295
      const sealX = (width - sealSize) / 2
      const sealY = 250
      page.drawImage(embeddedSeal, {
        x: sealX,
        y: sealY,
        width: sealSize,
        height: sealSize,
        opacity: 0.11,
      })
    }
  } catch (sealErr) {
    console.warn('Could not embed seal watermark in Paanyaya PDF:', sealErr)
  }

  const marginX = 54
  const contentWidth = width - marginX * 2 // ~487.5

  // Start safely below the graphic top header banner
  let currentY = height - 150

  // 2. Main Title (Centered & Underlined)
  const titleText = 'PAANYAYA'
  const titleSize = 18
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize)
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: currentY,
    size: titleSize,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  currentY -= 4
  page.drawLine({
    start: { x: (width - titleWidth - 24) / 2, y: currentY },
    end: { x: (width + titleWidth + 24) / 2, y: currentY },
    thickness: 1.5,
    color: rgb(37 / 255, 99 / 255, 235 / 255),
  })

  currentY -= 14
  const subText = data.isConciliation
    ? '(NOTICE TO APPEAR / SUMMON FOR CONCILIATION)'
    : '(NOTICE TO APPEAR / SUMMON FOR MEDIATION)'
  const subWidth = fontItalic.widthOfTextAtSize(subText, 9.5)
  page.drawText(subText, {
    x: (width - subWidth) / 2,
    y: currentY,
    size: 9.5,
    font: fontItalic,
    color: rgb(71 / 255, 85 / 255, 105 / 255),
  })

  currentY -= 26

  // 3. Case Info Header Bar (Left: Case No., Right: Date Issued & Hearing No.)
  const infoTopY = currentY
  const colSplit = marginX + contentWidth * 0.55

  // Left
  page.drawText('USAPING BARANGAY BLG.:', {
    x: marginX,
    y: infoTopY,
    size: 8.5,
    font: fontBold,
    color: rgb(71 / 255, 85 / 255, 105 / 255),
  })
  page.drawText(data.caseNumber || 'N/A', {
    x: marginX,
    y: infoTopY - 13,
    size: 11,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  // Right
  page.drawText('PETSA NG PAGLABAS:', {
    x: colSplit,
    y: infoTopY,
    size: 8.5,
    font: fontBold,
    color: rgb(71 / 255, 85 / 255, 105 / 255),
  })
  page.drawText(data.dateIssued || 'N/A', {
    x: colSplit,
    y: infoTopY - 13,
    size: 9.5,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  currentY = infoTopY - 30

  // Thin separator line
  page.drawLine({
    start: { x: marginX, y: currentY },
    end: { x: marginX + contentWidth, y: currentY },
    thickness: 0.8,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  })

  currentY -= 18

  // 4. Recipient Box
  page.drawText('KAY / TO:', {
    x: marginX,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(100 / 255, 116 / 255, 139 / 255),
  })
  currentY -= 14
  page.drawText((data.respondentName || 'Respondent').toUpperCase(), {
    x: marginX,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })
  currentY -= 12
  page.drawText('(Respondent / Ipinagsusumbong)', {
    x: marginX,
    y: currentY,
    size: 8.5,
    font: fontItalic,
    color: rgb(100 / 255, 116 / 255, 139 / 255),
  })

  currentY -= 20

  // Paragraph helper with bold token support and clean line wrapping
  const drawParagraph = (
    text: string,
    startY: number,
    fontSize: number = 9.5,
    lineHeight: number = 14.5,
    indent: number = 20
  ): number => {
    const parts = text.split('**')
    const tokens: { text: string; font: any }[] = []

    for (let i = 0; i < parts.length; i++) {
      const isBold = i % 2 !== 0
      const font = isBold ? fontBold : fontNormal
      const words = parts[i].split(/\s+/).filter((w) => w.length > 0)
      words.forEach((word) => tokens.push({ text: word, font }))
    }

    let lineY = startY
    let currentX = marginX + indent

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const spaceWidth = token.font.widthOfTextAtSize(' ', fontSize)
      const wordWidth = token.font.widthOfTextAtSize(token.text, fontSize)

      if (currentX + wordWidth > marginX + contentWidth) {
        lineY -= lineHeight
        currentX = marginX
      }

      page.drawText(token.text, {
        x: currentX,
        y: lineY,
        size: fontSize,
        font: token.font,
        color: rgb(30 / 255, 41 / 255, 59 / 255),
      })

      currentX += wordWidth + spaceWidth
    }

    return lineY - lineHeight
  }

  // 5. Statement Body
  const procName = data.isConciliation
    ? 'Konsiliyasyon sa ilalim ng Lupong Tagapamayapa / Pangkat Tagapagkasundo'
    : 'Mediasyon sa Tanggapan ng Punong Barangay'

  const natureDisplay = data.natureOfComplaint ? `"${data.natureOfComplaint}"` : '"Alitan / Pangyayari"'
  const p1 = `Ipinapaalam sa inyo na ang reklamo laban sa inyo ni **${data.complainantName || 'Mayreklamo'}** kaugnay ng usapin ukol sa **${natureDisplay}** ay kasalukuyang sumasailalim sa proseso ng **${procName}** ng Barangay Ugong, Lungsod ng Valenzuela.`
  currentY = drawParagraph(p1, currentY, 9.5, 14.5, 20)
  currentY -= 6

  const p2 = `Dahil dito, kayo ay magalang na inaanyayahan at inaatasan na lumitaw nang personal sa nakatakdang pagdinig sa araw, oras, at lugar na nakasaad sa ibaba upang mabigyan ng patas na pagkakataon ang bawat panig na maayos ang naturang usapin nang mapayapa.`
  currentY = drawParagraph(p2, currentY, 9.5, 14.5, 20)
  currentY -= 10

  // 6. Hearing Details Box (Framed Box)
  const boxTopY = currentY
  const boxHeight = 74
  const boxWidth = contentWidth
  const boxX = marginX
  const boxY = boxTopY - boxHeight

  // Draw background and border
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(248 / 255, 250 / 255, 252 / 255),
    borderColor: rgb(30 / 255, 41 / 255, 59 / 255),
    borderWidth: 1,
  })

  // Box Title Banner
  const boxTitle = 'MGA DETALYE NG PAGDINIG / HEARING DETAILS'
  const boxTitleWidth = fontBold.widthOfTextAtSize(boxTitle, 8.5)
  page.drawText(boxTitle, {
    x: boxX + (boxWidth - boxTitleWidth) / 2,
    y: boxTopY - 14,
    size: 8.5,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  page.drawLine({
    start: { x: boxX + 16, y: boxTopY - 18 },
    end: { x: boxX + boxWidth - 16, y: boxTopY - 18 },
    thickness: 0.6,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  })

  // Box Content Grid
  const row1Y = boxTopY - 33
  const row2Y = boxTopY - 49
  const row3Y = boxTopY - 65
  const bCol1 = boxX + 18
  const bCol2 = boxX + boxWidth * 0.52

  // Row 1
  page.drawText('Petsa / Date:', { x: bCol1, y: row1Y, size: 8.5, font: fontNormal, color: rgb(71 / 255, 85 / 255, 105 / 255) })
  page.drawText(data.hearingDate || 'N/A', { x: bCol1 + 65, y: row1Y, size: 8.5, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) })

  page.drawText('Hearing Blg.:', { x: bCol2, y: row1Y, size: 8.5, font: fontNormal, color: rgb(71 / 255, 85 / 255, 105 / 255) })
  page.drawText(`Ika-${data.hearingNumber || 1}`, { x: bCol2 + 65, y: row1Y, size: 8.5, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) })

  // Row 2
  page.drawText('Oras / Time:', { x: bCol1, y: row2Y, size: 8.5, font: fontNormal, color: rgb(71 / 255, 85 / 255, 105 / 255) })
  page.drawText(data.hearingTime || 'N/A', { x: bCol1 + 65, y: row2Y, size: 8.5, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) })

  page.drawText('Uri / Type:', { x: bCol2, y: row2Y, size: 8.5, font: fontNormal, color: rgb(71 / 255, 85 / 255, 105 / 255) })
  page.drawText(data.isConciliation ? 'Konsiliyasyon (Conciliation)' : 'Mediasyon (Mediation)', {
    x: bCol2 + 65,
    y: row2Y,
    size: 8.5,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  // Row 3 (Venue)
  page.drawText('Lugar / Venue:', { x: bCol1, y: row3Y, size: 8.5, font: fontNormal, color: rgb(71 / 255, 85 / 255, 105 / 255) })
  page.drawText(data.venue || 'Barangay Hall, Ugong, Valenzuela City', {
    x: bCol1 + 65,
    y: row3Y,
    size: 8.5,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  currentY = boxY - 18

  // 7. Legal Warning (Republic Act No. 7160)
  const pWarn = `Alinsunod sa **Katarungang Pambarangay (Republic Act No. 7160)**, ang hindi paglitaw nang walang makatuwirang dahilan matapos tanggapin ang paanyayang ito ay maaaring magresulta sa kaukulang aksyong legal o pagpapatuloy ng proseso alinsunod sa batas.`
  currentY = drawParagraph(pWarn, currentY, 8.5, 13, 20)
  currentY -= 8

  // 8. Closing
  const pClosing = 'Inaasahan namin ang inyong maagap at maayos na pagdalo.'
  currentY = drawParagraph(pClosing, currentY, 9, 13, 0)
  currentY -= 16

  // 9. Signatory Section (Right-aligned Punong Barangay)
  const signatoryX = width - marginX - 225
  page.drawText('Taos-pusong gumagalang,', {
    x: signatoryX,
    y: currentY,
    size: 9.5,
    font: fontItalic,
    color: rgb(71 / 255, 85 / 255, 105 / 255),
  })

  currentY -= 40

  const punongName = (data.punongBarangayName || 'HON. MARICEL PINEDA - EMPERADOR').toUpperCase()
  const nameWidth = fontBold.widthOfTextAtSize(punongName, 10.5)
  const lineW = Math.max(nameWidth + 20, 220)
  const lineStartX = width - marginX - lineW

  page.drawLine({
    start: { x: lineStartX, y: currentY + 12 },
    end: { x: lineStartX + lineW, y: currentY + 12 },
    thickness: 1,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  page.drawText(punongName, {
    x: lineStartX + (lineW - nameWidth) / 2,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  })

  currentY -= 12
  const roleText = data.isConciliation
    ? 'Punong Barangay / Tagapangulo ng Lupon'
    : 'Punong Barangay'
  const roleWidth = fontItalic.widthOfTextAtSize(roleText, 8.5)
  page.drawText(roleText, {
    x: lineStartX + (lineW - roleWidth) / 2,
    y: currentY,
    size: 8.5,
    font: fontItalic,
    color: rgb(100 / 255, 116 / 255, 139 / 255),
  })

  return pdfDoc
}
