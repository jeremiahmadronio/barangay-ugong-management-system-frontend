import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fullPdfTemplate } from "./certLogos";

export interface BpoDocumentData {
  caseNumber: string;
  bpoControlNumber?: string;
  victimName: string;
  victimAddress?: string;
  respondentName: string;
  respondentAddress?: string;
  violenceType?: string;
  incidentDate?: string;
  incidentPlace?: string;
  incidentSummary?: string;
  dateFiled?: string;
  issueDate?: Date | string | number;
  assignedOfficerName?: string;
  punongBarangayName?: string;
}

function formatLongDate(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function sanitizeSummaryText(text?: string, violenceType?: string): string {
  if (!text || text.trim().length === 0) {
    return `The complainant reported incidents of ${violenceType || "violence"} and has formally requested urgent protective relief under R.A. 9262 to prevent further distress and ensure personal safety.`;
  }
  // Check if string looks like raw base64 or garbage data
  if (
    text.startsWith("JVBER") ||
    text.startsWith("data:") ||
    text.startsWith("UEsDB") ||
    (text.length > 40 && !text.includes(" ") && (text.endsWith("==") || text.endsWith("=")))
  ) {
    return `The complainant filed a sworn statement detailing incidents of ${violenceType || "violence"} and is seeking immediate protective relief under R.A. 9262. (Sworn statement attachment is on file at the VAWC Desk).`;
  }
  return text.trim();
}

export async function buildBpoPdfDoc(data: BpoDocumentData): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.load(fullPdfTemplate);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();

  const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const marginX = 54;
  const contentWidth = width - (marginX * 2);

  const issueDateObj = data.issueDate
    ? data.issueDate instanceof Date
      ? data.issueDate
      : new Date(data.issueDate)
    : new Date();
  const dateFormatted = formatLongDate(isNaN(issueDateObj.getTime()) ? new Date() : issueDateObj);

  // Position below the graphic letterhead banner
  let currentY = height - 150;

  // 1. Date (Top Right)
  const dateWidth = fontNormal.widthOfTextAtSize(dateFormatted, 10.5);
  page.drawText(dateFormatted, {
    x: width - marginX - dateWidth,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  // 2. Addressee (Punong Barangay)
  page.drawText("PUNONG BARANGAY", {
    x: marginX,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 13;

  page.drawText("Barangay Ugong", {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });
  currentY -= 13;

  page.drawText("Valenzuela City", {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  // 3. Subject Line (Bold, Underlined/Highlighted)
  const subjectText = `SUBJECT: REQUEST FOR BARANGAY PROTECTION ORDER - CASE NO. ${data.caseNumber || "2026-VAWC"}`;
  page.drawText(subjectText, {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  // 4. Salutation
  page.drawText("Dear Punong Barangay:", {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 18;

  // Rich text paragraph drawer helper
  const drawParagraph = (
    text: string,
    normalFont: any,
    boldFont: any,
    size: number,
    y: number,
    indent: number = 0
  ) => {
    const parts = text.split("**");
    const tokens: { text: string; font: any }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const isBold = i % 2 !== 0;
      const font = isBold ? boldFont : normalFont;
      const words = parts[i].split(/\s+/).filter((w) => w.length > 0);
      words.forEach((word) => tokens.push({ text: word, font }));
    }

    let lineY = y;
    let currentX = marginX + indent;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const spaceWidth = token.font.widthOfTextAtSize(" ", size);
      const wordWidth = token.font.widthOfTextAtSize(token.text, size);

      if (currentX + wordWidth > marginX + contentWidth) {
        lineY -= size * 1.45;
        currentX = marginX + (indent > 0 ? indent : 0);
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

  // 5. Letter Body Paragraphs
  const p1 = `This is to respectfully endorse and request the issuance of a **Barangay Protection Order (BPO)** in favor of **${data.victimName.toUpperCase()}** against **${data.respondentName.toUpperCase()}** in connection with the reported **${data.violenceType || "VAWC"}** complaint under Republic Act No. 9262 (Anti-Violence Against Women and Their Children Act of 2004).`;
  currentY = drawParagraph(p1, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 14;

  const incidentLoc = data.incidentPlace || "Barangay Ugong, Valenzuela City";
  const incidentDt = data.incidentDate || data.dateFiled || dateFormatted;
  const p2 = `Based on the sworn complaint and initial assessment conducted by the VAWC Desk, the incident occurred on or about **${incidentDt}** at **${incidentLoc}**. Immediate protection is earnestly requested to safeguard the complainant and children from further harm while the case is under barangay jurisdiction.`;
  currentY = drawParagraph(p2, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 14;

  // 6. Brief Description Box / Incident Summary
  page.drawText("Brief description of the incident / assessment:", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  currentY -= 13;

  const cleanSummary = sanitizeSummaryText(data.incidentSummary, data.violenceType);
  currentY = drawParagraph(cleanSummary, fontItalic, fontBold, 9.5, currentY, 12);
  currentY -= 14;

  // 7. Reliefs Requested & Endorsement Conclusion
  const p3 = "In view of the foregoing, may we respectfully request your approval and signature on the attached Barangay Protection Order request for the immediate protection of the complainant.";
  currentY = drawParagraph(p3, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 28;

  // 8. Closing
  page.drawText("Very truly yours,", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 55;

  // 9. Signatures Block (2 Columns: VAWC Officer & Punong Barangay Action)
  const officerName = data.assignedOfficerName || "Kag. Maria Cruz";
  const captainName = data.punongBarangayName || "Hon. MARICEL PINEDA-EMPERADOR";

  const col1X = marginX;
  const col2X = width - marginX - 225;

  // Left Column (Endorsing Officer)
  page.drawText(officerName.toUpperCase(), {
    x: col1X,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("VAWC Desk Officer", {
    x: col1X,
    y: currentY - 14,
    size: 9.5,
    font: fontNormal,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Right Column (Approval Action for Punong Barangay)
  page.drawText("ACTION TAKEN / APPROVED BY:", {
    x: col2X,
    y: currentY + 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(captainName, {
    x: col2X,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("PUNONG BARANGAY", {
    x: col2X,
    y: currentY - 14,
    size: 9,
    font: fontNormal,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdfDoc;
}

export async function generateBpoCertificate(data: BpoDocumentData) {
  try {
    const pdfDoc = await buildBpoPdfDoc(data);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    // 1. Direct download option
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = `BPO-Request-${data.caseNumber || "Order"}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 2. Automatic Browser Print Dialog via hidden iframe
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    printIframe.src = blobUrl;

    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          console.error("Print iframe error:", e);
        }
      }, 300);
    };
  } catch (error: any) {
    console.error("Error generating BPO PDF:", error);
    alert("Failed to generate BPO PDF: " + (error?.message || String(error)));
  }
}
