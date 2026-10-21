import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fullPdfTemplate } from "./certLogos";

export interface FtjsCertificateData {
  fullName: string;
  address: string;
  purpose?: string;
  dateIssued: Date | string | number;
  age?: number | null;
}

// Helpers
function formatFullName(fullName: string) {
  return fullName.toUpperCase();
}

function formatDayWithOrdinal(day: number) {
  if (Number.isNaN(day)) return "";
  const suffixes = ["th", "st", "nd", "rd"];
  const v = day % 100;
  return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatLongMonth(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "long" });
}

export async function generateFtjsCertificate(data: FtjsCertificateData, providedWindow?: Window | null) {
  try {
    // Load the final full template
    const pdfDoc = await PDFDocument.load(fullPdfTemplate);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width, height } = page.getSize();
    
    // Embed standard fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const actualTimesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const drawCenteredText = (text: string, font: any, size: number, y: number, color = rgb(0,0,0)) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        size,
        font,
        color,
      });
    };

    // --- Content ---
    const marginX = 40;
    const contentWidth = width - (marginX * 2);

    const dateObj = data.dateIssued instanceof Date ? data.dateIssued : new Date(data.dateIssued);

    const residencyYears = "six (6) months"; 
    const agePart = typeof data.age === "number" && Number.isFinite(data.age) ? `, **${data.age} years old**` : "";
    const namePart = formatFullName(data.fullName);
    
    // Use ** for bold text
    const p1 = `This is to certify that **${namePart}**${agePart} is a bonafide resident at **${data.address.toUpperCase()}** and is a qualified availee of **RA 11261** or the **First Time Jobseekers Act of 2019** for **${residencyYears}**.`;
    
    const p2 = "I further certify that the holder/bearer was informed of his/her rights, including the duties and responsibilities accorded by RA 11261 through the Oath of Undertaking he/she signed and executed in the presence of our Barangay Official.";
    
    const p3 = "This certification was issued upon the request of the above mentioned name for whatever purposes it may serve.";
    
    const VENUE = "3S Center Barangay Ugong Valenzuela City.";
    const p4 = `Signed and issued this **${formatDayWithOrdinal(dateObj.getDate())}** Day of **${formatLongMonth(dateObj).toUpperCase()} ${dateObj.getFullYear()}** at **${VENUE}**`;

    const paragraphs = [p1, p2, p3, p4];

    // "CERTIFICATION" header - moved higher up (was 190, now 165)
    let currentY = height - 165; 

    drawCenteredText("CERTIFICATION", actualTimesRomanBoldFont, 24, currentY);
    // Underline
    const certWidth = actualTimesRomanBoldFont.widthOfTextAtSize("CERTIFICATION", 24);
    page.drawLine({
      start: { x: (width - certWidth) / 2, y: currentY - 5 },
      end: { x: (width + certWidth) / 2, y: currentY - 5 },
      thickness: 1.5,
      color: rgb(22/255, 100/255, 165/255)
    });

    currentY -= 50; // Spacing before body

    // Rich text body paragraph drawer
    const drawRichParagraph = (text: string, normalFont: any, boldFont: any, size: number, y: number, indent: number = 40) => {
      const parts = text.split('**');
      let tokens: { text: string, font: any }[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        const isBold = i % 2 !== 0;
        const font = isBold ? boldFont : normalFont;
        const words = parts[i].split(/\s+/).filter(w => w.length > 0);
        
        // Retain spacing correctly by treating space as a logical gap, not part of the word
        words.forEach(word => {
          tokens.push({ text: word, font });
        });
      }

      let lineY = y;
      let currentX = marginX + indent;
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const spaceWidth = token.font.widthOfTextAtSize(" ", size);
        const wordWidth = token.font.widthOfTextAtSize(token.text, size);

        // Check if word fits on current line, if not wrap to next line
        if (currentX + wordWidth > marginX + contentWidth) {
           lineY -= (size * 1.7);
           currentX = marginX;
        }

        page.drawText(token.text, {
          x: currentX,
          y: lineY,
          size,
          font: token.font,
          color: rgb(0, 0, 0),
        });

        currentX += wordWidth + spaceWidth;
      }
      return lineY;
    };

    // Draw the paragraphs
    for (let i = 0; i < paragraphs.length; i++) {
      currentY = drawRichParagraph(paragraphs[i], timesRomanFont, timesRomanBoldFont, 12, currentY);
      currentY -= 35; // larger standard spacing between paragraphs
    }

    // Signatories
    // Big spacing between body and punong barangay
    currentY -= 60; 
    
    const signatoryX = width - marginX - 200;
    
    const drawSignatoryText = (text: string, font: any, size: number, y: number) => {
      page.drawText(text, {
        x: signatoryX,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    const PUNONG_BARANGAY = "Hon. MARICEL PINEDA-EMPERADOR";
    const BARANGAY_SECRETARY = "MS. JOYCE KRISHA TAN";

    drawSignatoryText(PUNONG_BARANGAY, timesRomanBoldFont, 12, currentY);
    currentY -= 15;
    drawSignatoryText("Punong Barangay", timesRomanFont, 12, currentY);
    
    // Big spacing between punong barangay and secretary
    currentY -= 90;
    drawSignatoryText(BARANGAY_SECRETARY, timesRomanBoldFont, 12, currentY);

    currentY -= 15;
    drawSignatoryText("Barangay Secretary", timesRomanFont, 12, currentY);

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' })
    const previewUrl = URL.createObjectURL(blob)

    // 1. Automatic Download
    const downloadLink = document.createElement('a')
    downloadLink.href = previewUrl
    const safeName = (data.fullName || 'Resident').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    downloadLink.download = `FTJS_Certificate_${safeName}.pdf`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    setTimeout(() => {
      document.body.removeChild(downloadLink)
    }, 200)

    // 2. Open / Print preview
    if (providedWindow && !providedWindow.closed) {
      providedWindow.location.href = previewUrl
      setTimeout(() => {
        try {
          providedWindow.focus()
          providedWindow.print()
        } catch {
          // Browser native PDF viewer handles print UI
        }
      }, 500)
    } else {
      // Trigger native browser print dialog using invisible iframe
      const printIframe = document.createElement('iframe')
      printIframe.style.position = 'fixed'
      printIframe.style.right = '0'
      printIframe.style.bottom = '0'
      printIframe.style.width = '0'
      printIframe.style.height = '0'
      printIframe.style.border = '0'
      printIframe.src = previewUrl

      document.body.appendChild(printIframe)

      const triggerPrint = () => {
        try {
          printIframe.contentWindow?.focus()
          printIframe.contentWindow?.print()
        } catch (e) {
          console.error('Print iframe error:', e)
        }
      }

      printIframe.onload = () => {
        setTimeout(triggerPrint, 300)
      }
      setTimeout(triggerPrint, 1200)

      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe)
        }
      }, 4000)
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    if (providedWindow && !providedWindow.closed) {
      providedWindow.close()
    }
    alert('Failed to generate PDF: ' + (error?.message || String(error)))
  }
}
