import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { fullPdfTemplate } from './certLogos'

export interface ClearanceCertificateData {
  certTitle?: string
  fullName: string
  address: string
  birthDate?: string
  birthPlace?: string
  purpose: string
  residencySince?: string
  clearanceNo: string
  ctcNo?: string
  issuedAt?: string
  issuedOn?: string
  orNo?: string
  orDate?: string
  validUntil?: string
  photoBase64?: string
  hasOngoingCase?: boolean
  showPhotoOnCert?: boolean
  showThumbmarkOnCert?: boolean
  punongBarangayName?: string
  barangaySecretaryName?: string
}

function formatFullName(fullName: string) {
  return (fullName || 'RESIDENT APPLICANT').toUpperCase().trim()
}

function computeYearsOfResidency(startDateStr?: string): number {
  if (!startDateStr) return 0
  const start = new Date(startDateStr)
  if (isNaN(start.getTime())) return 0
  const diffMs = Date.now() - start.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.floor(diffDays / 365.25))
}

export async function generateClearanceCertificate(
  data: ClearanceCertificateData,
  providedWindow?: Window | null
) {
  try {
    // 1. Load official Barangay Ugong PDF template
    const pdfDoc = await PDFDocument.load(fullPdfTemplate)
    const pages = pdfDoc.getPages()
    const page = pages[0]
    const { width, height } = page.getSize()

    // 2. Embed standard Helvetica fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helveticaBoldObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

    const drawCenteredText = (
      text: string,
      font: typeof helveticaFont,
      size: number,
      y: number,
      color = rgb(0, 0, 0)
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size)
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        size,
        font,
        color,
      })
    }

    const drawTextAt = (
      text: string,
      x: number,
      y: number,
      font: typeof helveticaFont,
      size: number,
      color = rgb(0, 0, 0)
    ) => {
      page.drawText(text, {
        x,
        y,
        size,
        font,
        color,
      })
    }

    // 3. Certificate Title Header
    const titleText = (data.certTitle || 'BARANGAY CLEARANCE').toUpperCase()
    const titleY = height - 165
    drawCenteredText(titleText, helveticaBoldObliqueFont, 22, titleY, rgb(15 / 255, 23 / 255, 42 / 255))

    // Decorative underline beneath title
    const titleWidth = helveticaBoldObliqueFont.widthOfTextAtSize(titleText, 22)
    page.drawLine({
      start: { x: (width - titleWidth) / 2, y: titleY - 5 },
      end: { x: (width + titleWidth) / 2, y: titleY - 5 },
      thickness: 1.5,
      color: rgb(37 / 255, 99 / 255, 235 / 255),
    })

    // 4. 1x1 Photo Box (Top-Right)
    const photoWidth = 76
    const photoHeight = 76
    const photoX = width - photoWidth - 48
    const photoY = height - 195

    if (data.showPhotoOnCert !== false) {
      page.drawRectangle({
        x: photoX,
        y: photoY,
        width: photoWidth,
        height: photoHeight,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 1,
      })

      if (data.photoBase64 && data.photoBase64.startsWith('data:')) {
        try {
          const base64Clean = data.photoBase64.split(',')[1]
          const imageBytes = Uint8Array.from(atob(base64Clean), (c) => c.charCodeAt(0))
          let embeddedImage
          if (data.photoBase64.includes('image/png')) {
            embeddedImage = await pdfDoc.embedPng(imageBytes)
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes)
          }
          if (embeddedImage) {
            page.drawImage(embeddedImage, {
              x: photoX + 1,
              y: photoY + 1,
              width: photoWidth - 2,
              height: photoHeight - 2,
            })
          }
        } catch (imgErr) {
          console.warn('Could not embed photo in clearance PDF:', imgErr)
        }
      } else {
        drawTextAt('PHOTO 1x1', photoX + 16, photoY + 32, helveticaFont, 8, rgb(0.5, 0.5, 0.5))
      }
    }

    // 5. Preamble Paragraph
    const paragraphWidth = 500
    const p1X = 48
    let p1Y = height - 208
    const p1Text =
      'This is to CERTIFY that the person whose name, signature, right thumbmark, and photograph appear herein is a bonafide resident of this barangay, requesting for official clearance from this office to wit:'

    const words = p1Text.split(' ')
    let currentLine = ''
    const p1Lines: string[] = []
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10.5)
      if (testWidth > paragraphWidth) {
        p1Lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) p1Lines.push(currentLine)

    for (const line of p1Lines) {
      drawTextAt(line, p1X, p1Y, helveticaFont, 10.5)
      p1Y -= 15
    }

    // 6. Applicant Details Key-Value Block
    let detailsY = p1Y - 18
    const detailsLeftX = 68
    const detailsColonX = 188
    const detailsValueX = 206
    const detailsSpacing = 18

    const formattedBirthDate = data.birthDate ? data.birthDate.replace(/-/g, '/') : '—'
    const years = computeYearsOfResidency(data.residencySince)
    const formattedResidencyDate = data.residencySince
      ? `${data.residencySince.replace(/-/g, '/')} (${years} ${years === 1 ? 'year' : 'years'})`
      : '3S Center Barangay Ugong'

    const details = [
      { label: 'NAME', value: formatFullName(data.fullName) },
      { label: 'ADDRESS', value: (data.address || 'Barangay Ugong, Valenzuela City').toUpperCase() },
      { label: 'DATE OF BIRTH', value: formattedBirthDate },
      { label: 'PLACE OF BIRTH', value: (data.birthPlace || 'Valenzuela City').toUpperCase() },
      { label: 'PURPOSE', value: (data.purpose || 'Employment / Identification Requirement').toUpperCase() },
      { label: 'RESIDENCY DATE', value: formattedResidencyDate },
    ]

    for (const item of details) {
      drawTextAt(item.label, detailsLeftX, detailsY, helveticaBoldFont, 10)
      drawTextAt(':', detailsColonX, detailsY, helveticaBoldFont, 10)

      const valText = item.value
      const maxValWidth = 330
      const valWords = valText.split(/\s+/)
      let curValLine = ''
      const valLines: string[] = []
      for (const w of valWords) {
        const test = curValLine ? `${curValLine} ${w}` : w
        if (helveticaFont.widthOfTextAtSize(test, 10) > maxValWidth && curValLine) {
          valLines.push(curValLine)
          curValLine = w
        } else {
          curValLine = test
        }
      }
      if (curValLine) valLines.push(curValLine)

      for (let i = 0; i < valLines.length; i++) {
        drawTextAt(valLines[i], detailsValueX, detailsY, helveticaFont, 10)
        if (i < valLines.length - 1) {
          detailsY -= 13
        }
      }
      detailsY -= detailsSpacing
    }

    // 7. Applicant Signature Box
    let signatureY = detailsY - 22
    const lineLength = 220
    const lineX = (width - lineLength) / 2

    page.drawLine({
      start: { x: lineX, y: signatureY },
      end: { x: lineX + lineLength, y: signatureY },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    signatureY -= 13
    drawCenteredText("Applicant's Signature Over Printed Name", helveticaFont, 9.5, signatureY)
    signatureY -= 15
    drawCenteredText(`Clearance No. : ${data.clearanceNo}`, helveticaBoldFont, 10.5, signatureY, rgb(37 / 255, 99 / 255, 235 / 255))

    // 8. Derogatory Record Assessment
    let p2Y = signatureY - 26
    const p2Text =
      'This is to further certify that upon verification of records filed in this office, subject individual has:'
    drawCenteredText(p2Text, helveticaFont, 10, p2Y)

    p2Y -= 18
    const statusText = data.hasOngoingCase ? 'HAS DEROGATORY RECORD' : 'NO DEROGATORY RECORD'
    const statusColor = data.hasOngoingCase ? rgb(220 / 255, 38 / 255, 38 / 255) : rgb(15 / 255, 23 / 255, 42 / 255)
    drawCenteredText(statusText, helveticaBoldFont, 13, p2Y, statusColor)

    // 9. Bottom Tax & OR Details (Left)
    let taxY = p2Y - 32
    const taxLeftX = 68
    const taxColonX = 148
    const taxValueX = 162
    const taxSpacing = 14

    const formattedORDate = data.orDate ? data.orDate.replace(/-/g, '/') : '—'
    const formattedIssuedOn = data.issuedOn ? data.issuedOn.replace(/-/g, '/') : '—'
    const formattedValidUntil = data.validUntil ? data.validUntil.replace(/-/g, '/') : '—'

    const taxDetails = [
      { label: 'Com. Tax No.', value: data.ctcNo || '—' },
      { label: 'Issued At', value: data.issuedAt || 'Barangay Ugong, Valenzuela City' },
      { label: 'Issued On', value: formattedIssuedOn },
      { label: 'O.R. No.', value: data.orNo || '—' },
      { label: 'O.R. Date', value: formattedORDate },
      { label: 'Valid Until', value: formattedValidUntil },
    ]

    for (const tax of taxDetails) {
      drawTextAt(tax.label, taxLeftX, taxY, helveticaFont, 8.5)
      drawTextAt(':', taxColonX, taxY, helveticaFont, 8.5)
      drawTextAt(tax.value, taxValueX, taxY, helveticaBoldFont, 8.5)
      taxY -= taxSpacing
    }

    // 10. Thumbmark Box (Bottom-Right, aligned with details)
    const thumbWidth = 68
    const thumbHeight = 68
    const thumbX = width - thumbWidth - 48
    const thumbY = taxY + taxSpacing

    if (data.showThumbmarkOnCert !== false) {
      page.drawRectangle({
        x: thumbX,
        y: thumbY,
        width: thumbWidth,
        height: thumbHeight,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 1,
      })
      drawTextAt('THUMBMARK', thumbX + 6, thumbY - 10, helveticaFont, 7.5, rgb(0.4, 0.4, 0.4))
    }

    // 11. Punong Barangay Signatory Box
    const captainLineLength = 200
    const captainX = width - captainLineLength - 48
    const captainY = 135

    page.drawLine({
      start: { x: captainX, y: captainY },
      end: { x: captainX + captainLineLength, y: captainY },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    const captainName = data.punongBarangayName || 'MARICEL PINEDA - EMPERADOR'
    drawTextAt(captainName, captainX + 10, captainY - 13, helveticaBoldFont, 9.5)
    drawTextAt('Punong Barangay', captainX + 46, captainY - 24, helveticaFont, 8.5)

    // 12. Save PDF and generate Blob
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
    const previewUrl = URL.createObjectURL(blob)

    // 13. AUTOMATIC DIRECT DOWNLOAD TO LOCAL FILE
    const downloadLink = document.createElement('a')
    downloadLink.href = previewUrl
    const safeTitle = (data.certTitle || 'Barangay_Clearance').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeCertNo = (data.clearanceNo || 'CERT').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeName = (data.fullName || 'Resident').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    downloadLink.download = `${safeTitle}_${safeCertNo}_${safeName}.pdf`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink)
      }
    }, 200)

    // 14. AUTOMATIC DIRECT PRINT
    if (providedWindow && !providedWindow.closed) {
      providedWindow.location.href = previewUrl
    } else {
      const printIframe = document.createElement('iframe')
      printIframe.style.position = 'fixed'
      printIframe.style.right = '0'
      printIframe.style.bottom = '0'
      printIframe.style.width = '0'
      printIframe.style.height = '0'
      printIframe.style.border = '0'
      printIframe.src = previewUrl

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
            }, 3000)
          }
        }, 300)
      }
    }

    return previewUrl
  } catch (error: any) {
    console.error('Error generating Barangay Clearance PDF:', error)
    if (providedWindow && !providedWindow.closed) {
      providedWindow.close()
    }
    throw error
  }
}
