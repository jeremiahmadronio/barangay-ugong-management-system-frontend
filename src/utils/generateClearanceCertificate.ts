import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { fullPdfTemplate } from './certLogos'
import { ugongSealBase64 } from './ugongSealLogo'

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
  age?: number | string
  gender?: string
  civilStatus?: string
  propertyAddress?: string
  utilityApplicationType?: string
  registeredOwnerName?: string
  buildingClassification?: string
  deceasedName?: string
  dateOfDeath?: string
  defendantName?: string
  caseDetails?: string
  vehicleBrand?: string
  motorNumber?: string
  chassisNumber?: string
}

function formatFullName(fullName: string) {
  return (fullName || 'RESIDENT APPLICANT').toUpperCase().trim()
}

function cleanDisplayAddress(rawAddress = ''): string {
  if (!rawAddress) return 'BARANGAY UGONG, VALENZUELA CITY, METRO MANILA'
  const parts = rawAddress
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const cleanParts: string[] = []
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      cleanParts.push(part)
    }
  }

  let res = cleanParts.join(', ')
  if (!res.toLowerCase().includes('ugong')) {
    res += ', Barangay Ugong'
  }
  if (!res.toLowerCase().includes('valenzuela')) {
    res += ', Valenzuela City'
  }
  return res.toUpperCase()
}

function formatCertificateDate(dateStr?: string): string {
  if (!dateStr || dateStr === '—') return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr.replace(/-/g, '/')
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatResidencyDisplay(startDateStr?: string): string {
  if (!startDateStr) return 'Bonafide Resident'
  const start = new Date(startDateStr)
  if (isNaN(start.getTime())) return startDateStr
  const diffMs = Date.now() - start.getTime()
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24))
  const years = Math.floor(diffDays / 365.25)
  const months = Math.floor(diffDays / 30.4)

  const dateFormatted = start.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (years >= 1) {
    return `${dateFormatted} (${years} ${years === 1 ? 'Year' : 'Years'})`
  } else if (months >= 1) {
    return `${dateFormatted} (${months} ${months === 1 ? 'Month' : 'Months'})`
  } else {
    return `${dateFormatted} (Bonafide Resident)`
  }
}

function formatDayWithOrdinal(day: number): string {
  if (Number.isNaN(day)) return ''
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = day % 100
  return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

type CertCategory =
  | 'CLEARANCE'
  | 'UTILITY'
  | 'GUARDIANSHIP'
  | 'INDIGENCY'
  | 'RESIDENCY'
  | 'BUILDING'
  | 'SPECIAL'

function getCertificateCategory(rawTitle = ''): CertCategory {
  const upper = rawTitle.toUpperCase()
  if (
    upper.includes('WATER') ||
    upper.includes('TELEPHONE') ||
    upper.includes('UTILITY') ||
    upper.includes('ELECTRICAL')
  ) {
    return 'UTILITY'
  }
  if (upper.includes('GUARDIANSHIP')) {
    return 'GUARDIANSHIP'
  }
  if (upper.includes('INDIGEN')) {
    return 'INDIGENCY'
  }
  if (upper.includes('RESIDENCY')) {
    return 'RESIDENCY'
  }
  if (
    upper.includes('BUILDING') ||
    upper.includes('DEMOLITION') ||
    upper.includes('EXCAVATION') ||
    upper.includes('CONTRACTOR')
  ) {
    return 'BUILDING'
  }
  if (
    upper.includes('BAIL') ||
    upper.includes('DECEASED') ||
    upper.includes('TRICYCLE') ||
    upper.includes('EBIKE') ||
    upper.includes('ETRIKE') ||
    upper.includes('GARAGE')
  ) {
    return 'SPECIAL'
  }
  return 'CLEARANCE'
}

function getFormattedCertTitle(raw = ''): string {
  const upper = raw.trim().toUpperCase()
  if (upper === 'BARANGAY CLEARANCE') return 'BARANGAY CLEARANCE'
  if (upper.includes('WATER')) return 'CLEARANCE FOR WATER CONNECTION'
  if (upper.includes('TELEPHONE')) return 'TELEPHONE CONNECTION CLEARANCE'
  if (upper.includes('UTILITY')) return 'UTILITY CONNECTION CLEARANCE'
  if (upper.includes('GUARDIANSHIP')) return 'CERTIFICATE OF GUARDIANSHIP'
  if (upper.includes('INDIGEN')) return 'CERTIFICATE OF INDIGENCY'
  if (upper.includes('RESIDENCY')) return 'CERTIFICATE OF RESIDENCY'
  if (upper.includes('GOOD MORAL')) return 'CERTIFICATE OF GOOD MORAL CHARACTER'
  if (upper.includes('BUILDING')) return 'BARANGAY BUILDING CLEARANCE'
  if (upper.includes('DEMOLITION')) return 'BARANGAY DEMOLITION CLEARANCE'
  if (upper.includes('EXCAVATION')) return 'BARANGAY EXCAVATION PERMIT'
  if (upper.includes('CONTRACTOR')) return 'BARANGAY CONTRACTOR PERMIT'
  if (upper.includes('BAIL')) return 'CERTIFICATION FOR BAIL BOND'
  if (upper.includes('DECEASED')) return 'CERTIFICATION FOR DECEASED'
  if (upper.includes('TRICYCLE')) return 'TRICYCLE FRANCHISE CLEARANCE'
  if (upper.includes('EBIKE') || upper.includes('ETRIKE') || upper.includes('GARAGE'))
    return 'E-BIKE GARAGE CERTIFICATION'
  return upper || 'BARANGAY CLEARANCE'
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

    // 2. Embed standard fonts
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

    // Professional Justified Paragraph Drawer with First-Line Indent
    const drawJustifiedParagraph = (
      text: string,
      startY: number,
      options: {
        leftX?: number
        width?: number
        fontSize?: number
        lineHeight?: number
        indent?: number
        color?: ReturnType<typeof rgb>
      } = {}
    ): number => {
      const leftX = options.leftX ?? 56
      const maxW = options.width ?? 483
      const fontSize = options.fontSize ?? 10
      const lineHeight = options.lineHeight ?? 16.5
      const indent = options.indent ?? 26
      const color = options.color ?? rgb(30 / 255, 41 / 255, 59 / 255)

      const words = text.split(/\s+/).filter(Boolean)
      let y = startY
      let isFirstLine = true
      let currentWords: string[] = []

      const renderLine = (lineWords: string[], isLastLine: boolean) => {
        const currentIndent = isFirstLine ? indent : 0
        const availableWidth = maxW - currentIndent
        const currentLeftX = leftX + currentIndent

        if (lineWords.length === 0) return

        if (isLastLine || lineWords.length === 1) {
          let x = currentLeftX
          for (let i = 0; i < lineWords.length; i++) {
            const w = lineWords[i]
            page.drawText(w, { x, y, font: helveticaFont, size: fontSize, color })
            x += helveticaFont.widthOfTextAtSize(w, fontSize) + helveticaFont.widthOfTextAtSize(' ', fontSize)
          }
        } else {
          const totalWordsWidth = lineWords.reduce(
            (sum, w) => sum + helveticaFont.widthOfTextAtSize(w, fontSize),
            0
          )
          const totalSpace = availableWidth - totalWordsWidth
          const spaceWidth = Math.max(
            helveticaFont.widthOfTextAtSize(' ', fontSize),
            totalSpace / (lineWords.length - 1)
          )

          let x = currentLeftX
          for (let i = 0; i < lineWords.length; i++) {
            const w = lineWords[i]
            page.drawText(w, { x, y, font: helveticaFont, size: fontSize, color })
            x += helveticaFont.widthOfTextAtSize(w, fontSize) + spaceWidth
          }
        }

        y -= lineHeight
        isFirstLine = false
      }

      for (let i = 0; i < words.length; i++) {
        const testWords = [...currentWords, words[i]]
        const currentIndent = isFirstLine ? indent : 0
        const availableWidth = maxW - currentIndent

        const testLineWidth = testWords.reduce(
          (sum, w, idx) =>
            sum +
            helveticaFont.widthOfTextAtSize(w, fontSize) +
            (idx > 0 ? helveticaFont.widthOfTextAtSize(' ', fontSize) : 0),
          0
        )

        if (testLineWidth > availableWidth && currentWords.length > 0) {
          renderLine(currentWords, false)
          currentWords = [words[i]]
        } else {
          currentWords = testWords
        }
      }

      if (currentWords.length > 0) {
        renderLine(currentWords, true)
      }

      return y
    }

    // 3. Official Watermark Seal in the Center of the Paper
    try {
      if (ugongSealBase64 && ugongSealBase64.startsWith('data:')) {
        const sealClean = ugongSealBase64.split(',')[1]
        const sealBytes = Uint8Array.from(atob(sealClean), (c) => c.charCodeAt(0))
        const embeddedSeal = await pdfDoc.embedPng(sealBytes)
        if (embeddedSeal) {
          const sealSize = 310
          const sealX = (width - sealSize) / 2
          const sealY = 250 // Optical center of document content area
          page.drawImage(embeddedSeal, {
            x: sealX,
            y: sealY,
            width: sealSize,
            height: sealSize,
            opacity: 0.12,
          })
        }
      }
    } catch (sealErr) {
      console.warn('Could not embed seal watermark in clearance PDF:', sealErr)
    }

    // 4. Certificate Title Header (Horizontally Centered, elevated above photo box)
    const formattedTitle = getFormattedCertTitle(data.certTitle)
    const titleFontSize = formattedTitle.length > 32 ? 16.5 : 19
    const titleY = height - 146
    drawCenteredText(formattedTitle, helveticaBoldObliqueFont, titleFontSize, titleY, rgb(15 / 255, 23 / 255, 42 / 255))

    // Decorative underline beneath title (Safely above photo box)
    const titleWidth = helveticaBoldObliqueFont.widthOfTextAtSize(formattedTitle, titleFontSize)
    page.drawLine({
      start: { x: (width - titleWidth) / 2, y: titleY - 6 },
      end: { x: (width + titleWidth) / 2, y: titleY - 6 },
      thickness: 1.5,
      color: rgb(37 / 255, 99 / 255, 235 / 255),
    })

    // Determine category
    const category = getCertificateCategory(data.certTitle)

    // Common Date Computations
    const issueDateObj = data.issuedOn ? new Date(data.issuedOn) : new Date()
    const validIssueDate = isNaN(issueDateObj.getTime()) ? new Date() : issueDateObj
    const dayWithOrdinal = formatDayWithOrdinal(validIssueDate.getDate())
    const monthName = validIssueDate.toLocaleString('en-US', { month: 'long' })
    const yearNum = validIssueDate.getFullYear()

    const fullNameUpper = formatFullName(data.fullName)
    const cleanAddressUpper = cleanDisplayAddress(data.address)
    const purposeUpper = (data.purpose || 'Official Legal Requirement').toUpperCase()
    const ageString = data.age ? `${data.age} years old` : 'of legal age'
    const civilStatusString = data.civilStatus || 'Single'

    // Unified Photo Box & Thumbmark Box Geometry
    const shouldDrawPhoto = data.showPhotoOnCert !== false
    const photoWidth = 70
    const photoHeight = 70
    const photoX = width - photoWidth - 52 // 473.28
    const photoY = 612 // Top is 612 + 70 = 682, safely below underline at 690

    // Photo & Thumbmark Renderers
    const renderPhotoBox = async (x: number, y: number, w = 70, h = 70) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: rgb(0.3, 0.35, 0.42),
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
            const imgW = embeddedImage.width
            const imgH = embeddedImage.height
            const maxW = w - 2
            const maxH = h - 2
            const scale = Math.min(maxW / imgW, maxH / imgH)
            const drawW = imgW * scale
            const drawH = imgH * scale
            const drawX = x + 1 + (maxW - drawW) / 2
            const drawY = y + 1 + (maxH - drawH) / 2

            page.drawImage(embeddedImage, {
              x: drawX,
              y: drawY,
              width: drawW,
              height: drawH,
            })
            return
          }
        } catch (imgErr) {
          console.warn('Could not embed photo in certificate PDF:', imgErr)
        }
      }
      drawTextAt('PHOTO', x + 20, y + 38, helveticaFont, 8, rgb(0.5, 0.5, 0.5))
      drawTextAt('2x2 / 1x1', x + 16, y + 25, helveticaFont, 7.5, rgb(0.5, 0.5, 0.5))
    }

    const renderThumbmarkBox = (x: number, y: number, w = 60, h = 60) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: rgb(0.35, 0.4, 0.48),
        borderWidth: 1,
      })
      const thumbLabel = 'RIGHT THUMBMARK'
      const thumbLabelWidth = helveticaFont.widthOfTextAtSize(thumbLabel, 6.5)
      drawTextAt(
        thumbLabel,
        x + (w - thumbLabelWidth) / 2,
        y - 9,
        helveticaFont,
        6.5,
        rgb(100 / 255, 116 / 255, 139 / 255)
      )
    }

    // =========================================================================
    // CATEGORY: STANDARD BARANGAY CLEARANCE & GOOD MORAL (Classic Format)
    // =========================================================================
    if (category === 'CLEARANCE') {
      // Photo rendering (Top Right)
      if (shouldDrawPhoto) {
        await renderPhotoBox(photoX, photoY, photoWidth, photoHeight)
      }

      const salutationY = 664
      drawTextAt('TO WHOM IT MAY CONCERN:', 56, salutationY, helveticaBoldFont, 10, rgb(15 / 255, 23 / 255, 42 / 255))

      let cursorY = salutationY - 18
      const p1Text =
        'This is to CERTIFY that the individual whose name, photograph, specimen signature, and right thumbmark appear hereunder is a bonafide resident of Barangay Ugong, City of Valenzuela, with personal records on file as follows:'

      const p1Width = shouldDrawPhoto ? 400 : 483
      cursorY = drawJustifiedParagraph(p1Text, cursorY, { leftX: 56, width: p1Width, indent: 0, fontSize: 9.5, lineHeight: 14 })
      cursorY -= 14

      // Applicant Details Key-Value Block
      const detailsLeftX = 64
      const detailsColonX = 185
      const detailsValueX = 200
      const detailsSpacing = 16.5

      const formattedBirthDate = formatCertificateDate(data.birthDate)
      const formattedResidency = formatResidencyDisplay(data.residencySince)

      const details = [
        { label: 'FULL NAME', value: fullNameUpper },
        { label: 'PRESENT ADDRESS', value: cleanAddressUpper },
        { label: 'DATE OF BIRTH', value: formattedBirthDate },
        { label: 'PLACE OF BIRTH', value: (data.birthPlace || 'Valenzuela City').toUpperCase() },
        { label: 'PURPOSE', value: purposeUpper },
        { label: 'PERIOD OF RESIDENCY', value: formattedResidency },
      ]

      for (const item of details) {
        drawTextAt(item.label, detailsLeftX, cursorY, helveticaBoldFont, 9.5, rgb(15 / 255, 23 / 255, 42 / 255))
        drawTextAt(':', detailsColonX, cursorY, helveticaBoldFont, 9.5, rgb(15 / 255, 23 / 255, 42 / 255))

        const valText = item.value
        const maxValWidth = 330
        const valWords = valText.split(/\s+/)
        let curValLine = ''
        const valLines: string[] = []
        for (const w of valWords) {
          const test = curValLine ? `${curValLine} ${w}` : w
          if (helveticaFont.widthOfTextAtSize(test, 9.5) > maxValWidth && curValLine) {
            valLines.push(curValLine)
            curValLine = w
          } else {
            curValLine = test
          }
        }
        if (curValLine) valLines.push(curValLine)

        for (let i = 0; i < valLines.length; i++) {
          drawTextAt(valLines[i], detailsValueX, cursorY, helveticaFont, 9.5, rgb(15 / 255, 23 / 255, 42 / 255))
          if (i < valLines.length - 1) {
            cursorY -= 12
          }
        }
        cursorY -= detailsSpacing
      }

      // Applicant Signature Box
      let signatureY = cursorY - 10
      const lineLength = 220
      const lineX = (width - lineLength) / 2

      page.drawLine({
        start: { x: lineX, y: signatureY },
        end: { x: lineX + lineLength, y: signatureY },
        thickness: 1,
        color: rgb(0, 0, 0),
      })

      signatureY -= 11
      drawCenteredText(fullNameUpper, helveticaBoldFont, 9, signatureY, rgb(15 / 255, 23 / 255, 42 / 255))
      signatureY -= 10
      drawCenteredText("Applicant's Signature Over Printed Name", helveticaFont, 7.5, signatureY, rgb(100 / 255, 116 / 255, 139 / 255))
      signatureY -= 13
      drawCenteredText(`Clearance No. : ${data.clearanceNo}`, helveticaBoldFont, 9.5, signatureY, rgb(37 / 255, 99 / 255, 235 / 255))

      // Derogatory Record Assessment
      let p2Y = signatureY - 18
      const p2Text =
        'This is to further certify that upon verification of records filed in this office, subject individual has:'
      drawCenteredText(p2Text, helveticaFont, 9.5, p2Y, rgb(30 / 255, 41 / 255, 59 / 255))

      p2Y -= 15
      const statusText = data.hasOngoingCase ? 'HAS DEROGATORY RECORD' : 'NO DEROGATORY RECORD'
      const statusColor = data.hasOngoingCase
        ? rgb(220 / 255, 38 / 255, 38 / 255)
        : rgb(15 / 255, 23 / 255, 42 / 255)

      drawCenteredText(statusText, helveticaBoldFont, 12, p2Y, statusColor)

      cursorY = p2Y - 18
      const p3Text = `This clearance is hereby issued upon the request of the above-named person for the purpose of ${purposeUpper} and for whatever legal intent and purpose it may serve.`
      const p4Text = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`

      cursorY = drawJustifiedParagraph(p3Text, cursorY, { leftX: 56, width: 483, indent: 0, fontSize: 9, lineHeight: 13 })
      cursorY -= 4
      cursorY = drawJustifiedParagraph(p4Text, cursorY, { leftX: 56, width: 483, indent: 0, fontSize: 9, lineHeight: 13 })

      // Bottom: Left = Tax details, Middle = Thumbmark box, Right = Captain
      const bottomY = 220
      let taxY = bottomY
      const taxLeftX = 52
      const taxColonX = 112
      const taxValueX = 120
      const taxSpacing = 12

      const taxDetails = [
        { label: 'Com. Tax No.', value: data.ctcNo || '—' },
        { label: 'Issued At', value: data.issuedAt || 'Barangay Ugong, Valenzuela City' },
        { label: 'Issued On', value: formatCertificateDate(data.issuedOn) },
        { label: 'O.R. No.', value: data.orNo || '—' },
        { label: 'O.R. Date', value: formatCertificateDate(data.orDate) },
        { label: 'Valid Until', value: formatCertificateDate(data.validUntil) },
      ]

      for (const tax of taxDetails) {
        drawTextAt(tax.label, taxLeftX, taxY, helveticaFont, 7.5, rgb(71 / 255, 85 / 255, 105 / 255))
        drawTextAt(':', taxColonX, taxY, helveticaFont, 7.5, rgb(71 / 255, 85 / 255, 105 / 255))
        drawTextAt(tax.value, taxValueX, taxY, helveticaBoldFont, 7.5, rgb(15 / 255, 23 / 255, 42 / 255))
        taxY -= taxSpacing
      }

      // Middle Column: Right Thumbmark Box (Centered at 298 with 33px left gap and 40px right gap)
      if (data.showThumbmarkOnCert !== false) {
        renderThumbmarkBox(268, bottomY - 60 + 2, 60, 60)
      }

      // Right Column: Punong Barangay Signature (Right aligned with 52px margin)
      const captainLineLength = 175
      const captainX = width - 52 - captainLineLength
      const captainY = 195

      page.drawLine({
        start: { x: captainX, y: captainY },
        end: { x: captainX + captainLineLength, y: captainY },
        thickness: 1,
        color: rgb(0, 0, 0),
      })

      const captainName = (data.punongBarangayName || 'HON. MARICEL PINEDA - EMPERADOR').toUpperCase()
      const capNameWidth = helveticaBoldFont.widthOfTextAtSize(captainName, 9.5)
      drawTextAt(
        captainName,
        captainX + (captainLineLength - capNameWidth) / 2,
        captainY - 14,
        helveticaBoldFont,
        9.5,
        rgb(15 / 255, 23 / 255, 42 / 255)
      )

      const capTitle = 'Punong Barangay'
      const capTitleWidth = helveticaFont.widthOfTextAtSize(capTitle, 8.5)
      drawTextAt(
        capTitle,
        captainX + (captainLineLength - capTitleWidth) / 2,
        captainY - 26,
        helveticaFont,
        8.5,
        rgb(71 / 255, 85 / 255, 105 / 255)
      )
    }

    // =========================================================================
    // CATEGORIES B–F: FORMAL CERTIFICATIONS & PERMITS (Naka-gitna, Justified)
    // =========================================================================
    else {
      // Photo rendering (Top Right)
      if (shouldDrawPhoto) {
        await renderPhotoBox(photoX, photoY, photoWidth, photoHeight)
      }

      // Perfectly balanced vertical placement
      const salutationY = 664
      drawTextAt('TO WHOM IT MAY CONCERN:', 56, salutationY, helveticaBoldFont, 10.5, rgb(15 / 255, 23 / 255, 42 / 255))

      let cursorY = salutationY - 20
      const p1Width = shouldDrawPhoto ? 400 : 483

      // -----------------------------------------------------------------------
      // B. UTILITY & CONNECTION CLEARANCES
      // -----------------------------------------------------------------------
      if (category === 'UTILITY') {
        const isWaterCert = formattedTitle.includes('WATER') || (data.certTitle || '').toUpperCase().includes('WATER')
        const facilityLabel = isWaterCert
          ? (data.utilityApplicationType && data.utilityApplicationType.toLowerCase().includes('water')
              ? data.utilityApplicationType
              : 'Water Service Connection (Maynilad)')
          : data.utilityApplicationType ||
            (formattedTitle.includes('TELEPHONE')
              ? 'Telephone / Broadband Fiber Line Connection'
              : 'Electrical Service Connection (Meralco)')

        const uP1 = `This is to CERTIFY that ${fullNameUpper}, ${ageString}, Filipino, residing at ${cleanAddressUpper}, has been granted official BARANGAY CLEARANCE to apply for, install, and process a ${facilityLabel.toUpperCase()} at the aforesaid premises.`
        cursorY = drawJustifiedParagraph(uP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 16.5 })
        cursorY -= 16

        const uP2 = `This Office interposes NO OBJECTION to the application, installation, connection, and commissioning of the said utility facility, provided that all applicable engineering standards, safety requirements, and local city ordinances are strictly complied with.`
        cursorY = drawJustifiedParagraph(uP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 16.5 })
        cursorY -= 20

        // Specifications Box (Centered and bordered with clean indentation)
        const specs = [
          { label: 'APPLICANT NAME', value: fullNameUpper },
          { label: 'INSTALLATION ADDRESS', value: cleanAddressUpper },
          { label: 'UTILITY FACILITY', value: facilityLabel.toUpperCase() },
          { label: 'APPLICATION PURPOSE', value: purposeUpper },
          { label: 'CLEARANCE NUMBER', value: data.clearanceNo || '—' },
        ]

        const maxSpecValWidth = 300
        for (const item of specs) {
          drawTextAt(item.label, 64, cursorY, helveticaBoldFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))
          drawTextAt(':', 200, cursorY, helveticaBoldFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))

          const valWords = item.value.split(/\s+/)
          let curValLine = ''
          const valLines: string[] = []
          for (const w of valWords) {
            const test = curValLine ? `${curValLine} ${w}` : w
            if (helveticaFont.widthOfTextAtSize(test, 9) > maxSpecValWidth && curValLine) {
              valLines.push(curValLine)
              curValLine = w
            } else {
              curValLine = test
            }
          }
          if (curValLine) valLines.push(curValLine)

          for (let i = 0; i < valLines.length; i++) {
            drawTextAt(valLines[i], 212, cursorY, helveticaFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))
            if (i < valLines.length - 1) cursorY -= 12
          }
          cursorY -= 15
        }

        cursorY -= 16
        const uP3 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines, upon the request of the applicant for utility processing and endorsement purposes.`
        cursorY = drawJustifiedParagraph(uP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 16.5 })
      }

      // -----------------------------------------------------------------------
      // C. CERTIFICATE OF GUARDIANSHIP
      // -----------------------------------------------------------------------
      else if (category === 'GUARDIANSHIP') {
        const gP1 = `This is to CERTIFY that ${fullNameUpper}, ${ageString}, Filipino, and a bonafide resident of ${cleanAddressUpper}, is known to this Office as the recognized and lawful GUARDIAN of the minor child/dependent residing in the same household.`
        cursorY = drawJustifiedParagraph(gP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const gP2 = `It is further certified that the said guardian exercises full parental authority, guidance, and custody over the welfare, educational needs, and daily upbringing of the child in this community.`
        cursorY = drawJustifiedParagraph(gP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const gP3 = `This certification is officially issued upon the request of the above-named guardian for the purpose of ${purposeUpper} and for whatever legal intent and purpose it may serve.`
        cursorY = drawJustifiedParagraph(gP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 20

        const gP4 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`
        cursorY = drawJustifiedParagraph(gP4, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
      }

      // -----------------------------------------------------------------------
      // D. CERTIFICATE OF INDIGENCY
      // -----------------------------------------------------------------------
      else if (category === 'INDIGENCY') {
        const iP1 = `This is to CERTIFY that ${fullNameUpper}, ${ageString}, ${civilStatusString}, Filipino, residing at ${cleanAddressUpper}, is a bonafide resident of Barangay Ugong, City of Valenzuela.`
        cursorY = drawJustifiedParagraph(iP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const iP2 = `This is to FURTHER CERTIFY that the subject individual and his/her immediate household belong to the INDIGENT AND LOW-INCOME FAMILIES of this Barangay, with limited financial capacity and resources to meet basic living and social needs.`
        cursorY = drawJustifiedParagraph(iP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const iP3 = `This certification is issued upon the request of the interested party to support his/her application for ${purposeUpper} to avail of public assistance, financial aid, medical subsidy, or legal services.`
        cursorY = drawJustifiedParagraph(iP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 20

        const iP4 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`
        cursorY = drawJustifiedParagraph(iP4, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
      }

      // -----------------------------------------------------------------------
      // E. CERTIFICATE OF RESIDENCY
      // -----------------------------------------------------------------------
      else if (category === 'RESIDENCY') {
        const formattedResidency = formatResidencyDisplay(data.residencySince)

        const rP1 = `This is to CERTIFY that ${fullNameUpper}, ${ageString}, ${civilStatusString}, Filipino, is a bonafide resident of ${cleanAddressUpper}, Barangay Ugong, City of Valenzuela, Metro Manila.`
        cursorY = drawJustifiedParagraph(rP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const rP2 = `Based on the official resident registry records on file in this Office, the subject individual has been continuously residing in this community since ${formattedResidency}.`
        cursorY = drawJustifiedParagraph(rP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 18

        const rP3 = `This certification is officially issued upon the request of the above-named resident for the purpose of ${purposeUpper} and for whatever legal intent and purpose it may serve.`
        cursorY = drawJustifiedParagraph(rP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 20

        const rP4 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`
        cursorY = drawJustifiedParagraph(rP4, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
      }

      // -----------------------------------------------------------------------
      // F. BUILDING & CONSTRUCTION CLEARANCES
      // -----------------------------------------------------------------------
      else if (category === 'BUILDING') {
        const workType = formattedTitle.includes('DEMOLITION')
          ? 'DEMOLITION OF STRUCTURE'
          : formattedTitle.includes('EXCAVATION')
          ? 'GROUND & PIPELINE EXCAVATION WORK'
          : formattedTitle.includes('CONTRACTOR')
          ? 'CONSTRUCTION CONTRACT WORK'
          : 'BUILDING CONSTRUCTION / RENOVATION'

        const bP1 = `This is to CERTIFY that ${fullNameUpper}, representing ${(
          data.registeredOwnerName || fullNameUpper
        ).toUpperCase()}, has been granted official BARANGAY CLEARANCE to undertake ${workType} for the property situated at ${cleanDisplayAddress(
          data.propertyAddress || data.address
        )}.`
        cursorY = drawJustifiedParagraph(bP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 16.5 })
        cursorY -= 16

        const bP2 = `The applicant has complied with the preliminary requirements of this Barangay and has undertaken to strictly observe all environmental, safety, noise, and traffic management regulations enforced by the Barangay and the City Government of Valenzuela.`
        cursorY = drawJustifiedParagraph(bP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 16.5 })
        cursorY -= 20

        const bSpecs = [
          { label: 'PROJECT LOCATION', value: cleanDisplayAddress(data.propertyAddress || data.address) },
          { label: 'REGISTERED OWNER / APPLICANT', value: (data.registeredOwnerName || fullNameUpper).toUpperCase() },
          { label: 'TYPE OF WORK', value: (data.buildingClassification || workType).toUpperCase() },
          { label: 'APPLICATION PURPOSE', value: purposeUpper },
          { label: 'CLEARANCE NUMBER', value: data.clearanceNo || '—' },
        ]

        const maxSpecValWidth = 300
        for (const item of bSpecs) {
          drawTextAt(item.label, 64, cursorY, helveticaBoldFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))
          drawTextAt(':', 220, cursorY, helveticaBoldFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))

          const valWords = item.value.split(/\s+/)
          let curValLine = ''
          const valLines: string[] = []
          for (const w of valWords) {
            const test = curValLine ? `${curValLine} ${w}` : w
            if (helveticaFont.widthOfTextAtSize(test, 9) > maxSpecValWidth && curValLine) {
              valLines.push(curValLine)
              curValLine = w
            } else {
              curValLine = test
            }
          }
          if (curValLine) valLines.push(curValLine)

          for (let i = 0; i < valLines.length; i++) {
            drawTextAt(valLines[i], 228, cursorY, helveticaFont, 9, rgb(15 / 255, 23 / 255, 42 / 255))
            if (i < valLines.length - 1) cursorY -= 12
          }
          cursorY -= 15
        }

        cursorY -= 16
        const bP3 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`
        cursorY = drawJustifiedParagraph(bP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 16.5 })
      }

      // -----------------------------------------------------------------------
      // G. SPECIAL CERTIFICATIONS (Bail, Deceased, Tricycle, E-Bike)
      // -----------------------------------------------------------------------
      else {
        if (formattedTitle.includes('BAIL')) {
          const bailP1 = `This is to CERTIFY that ${fullNameUpper}, ${ageString}, ${civilStatusString}, a bonafide resident of ${cleanAddressUpper}, is known to this Barangay as a law-abiding resident in good standing, vouching as guarantor for defendant ${(
            data.defendantName || 'THE ACCUSED'
          ).toUpperCase()} in relation to case reference: ${(data.caseDetails || 'Court / Bail Proceedings').toUpperCase()}.`
          cursorY = drawJustifiedParagraph(bailP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
          cursorY -= 18
        } else if (formattedTitle.includes('DECEASED')) {
          const decP1 = `This is to CERTIFY that ${(data.deceasedName || 'THE DECEASED').toUpperCase()}, deceased, formerly residing at ${cleanAddressUpper}, passed away on ${
            data.dateOfDeath ? formatCertificateDate(data.dateOfDeath) : 'the recorded date'
          }.`
          cursorY = drawJustifiedParagraph(decP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
          cursorY -= 18
        } else if (formattedTitle.includes('TRICYCLE')) {
          const triP1 = `This certifies that ${fullNameUpper}, residing at ${cleanAddressUpper}, is authorized to operate a public tricycle transport service with Motor No. ${
            data.motorNumber || '—'
          } and Chassis No. ${data.chassisNumber || '—'} under Barangay Ugong Tricycle Operators and Drivers Association (TODA) jurisdiction.`
          cursorY = drawJustifiedParagraph(triP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
          cursorY -= 18
        } else {
          const ebP1 = `This certifies that ${fullNameUpper}, residing at ${cleanAddressUpper}, has a designated, safe, and off-street vehicle garage for E-bike / E-trike vehicle (Brand/Model: ${(
            data.vehicleBrand || 'Electric Vehicle'
          ).toUpperCase()}) at the said address.`
          cursorY = drawJustifiedParagraph(ebP1, cursorY, { leftX: 56, width: p1Width, indent: 26, fontSize: 10, lineHeight: 17 })
          cursorY -= 18
        }

        const spP2 = `This certification is officially issued upon the request of the interested party for the purpose of ${purposeUpper} and for whatever legal intent and purpose it may serve.`
        cursorY = drawJustifiedParagraph(spP2, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
        cursorY -= 20

        const spP3 = `Given and issued this ${dayWithOrdinal} day of ${monthName}, ${yearNum} at Barangay Ugong, City of Valenzuela, Metro Manila, Philippines.`
        cursorY = drawJustifiedParagraph(spP3, cursorY, { leftX: 56, width: 483, indent: 26, fontSize: 10, lineHeight: 17 })
      }

      // =======================================================================
      // BOTTOM SECTION: Clean Three-Column Layout (Tax Details, Thumbmark, Signatory)
      // =======================================================================
      const bottomY = 220

      // Left Column: Official Issuance & Tax Details (x = 52 to 235)
      let taxY = bottomY
      const taxLeftX = 52
      const taxColonX = 112
      const taxValueX = 120
      const taxSpacing = 12

      const taxDetails = [
        { label: 'Com. Tax No.', value: data.ctcNo || '—' },
        { label: 'Issued At', value: data.issuedAt || 'Barangay Ugong, Valenzuela City' },
        { label: 'Issued On', value: formatCertificateDate(data.issuedOn) },
        { label: 'O.R. No.', value: data.orNo || '—' },
        { label: 'O.R. Date', value: formatCertificateDate(data.orDate) },
        { label: 'Valid Until', value: formatCertificateDate(data.validUntil) },
      ]

      for (const tax of taxDetails) {
        drawTextAt(tax.label, taxLeftX, taxY, helveticaFont, 7.5, rgb(71 / 255, 85 / 255, 105 / 255))
        drawTextAt(':', taxColonX, taxY, helveticaFont, 7.5, rgb(71 / 255, 85 / 255, 105 / 255))
        drawTextAt(tax.value, taxValueX, taxY, helveticaBoldFont, 7.5, rgb(15 / 255, 23 / 255, 42 / 255))
        taxY -= taxSpacing
      }

      // Middle Column: Right Thumbmark Box (Centered at 298 with 33px left gap and 40px right gap)
      if (data.showThumbmarkOnCert !== false) {
        renderThumbmarkBox(268, bottomY - 60 + 2, 60, 60)
      }

      // Right Column: Official Punong Barangay Signatory Box (Right aligned with 52px margin)
      const captainLineLength = 175
      const captainX = width - 52 - captainLineLength
      const captainY = 195

      page.drawLine({
        start: { x: captainX, y: captainY },
        end: { x: captainX + captainLineLength, y: captainY },
        thickness: 1,
        color: rgb(0, 0, 0),
      })

      const captainName = (data.punongBarangayName || 'HON. MARICEL PINEDA - EMPERADOR').toUpperCase()
      const capNameWidth = helveticaBoldFont.widthOfTextAtSize(captainName, 9.5)
      drawTextAt(
        captainName,
        captainX + (captainLineLength - capNameWidth) / 2,
        captainY - 14,
        helveticaBoldFont,
        9.5,
        rgb(15 / 255, 23 / 255, 42 / 255)
      )

      const capTitle = 'Punong Barangay'
      const capTitleWidth = helveticaFont.widthOfTextAtSize(capTitle, 8.5)
      drawTextAt(
        capTitle,
        captainX + (captainLineLength - capTitleWidth) / 2,
        captainY - 26,
        helveticaFont,
        8.5,
        rgb(71 / 255, 85 / 255, 105 / 255)
      )
    }

    // 14. Official Seal Notice at the Bottom (Optical Center)
    const sealNotice = 'NOTE: NOT VALID WITHOUT OFFICIAL BARANGAY SEAL AND DRY SEAL'
    drawCenteredText(sealNotice, helveticaFont, 7.5, 130, rgb(100 / 255, 116 / 255, 139 / 255))

    // Save PDF and generate Blob
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
    const previewUrl = URL.createObjectURL(blob)

    // AUTOMATIC DIRECT DOWNLOAD TO LOCAL FILE
    const downloadLink = document.createElement('a')
    downloadLink.href = previewUrl
    const safeTitle = formattedTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
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

    // AUTOMATIC DIRECT PRINT
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
