import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { documentAssets, loadDocumentAsset } from '@/utils/documentAssets'

export interface ReferralDocumentData {
  caseNumber: string;
  controlNumber?: string;
  victimName: string;
  victimAddress?: string;
  victimContact?: string;
  respondentName: string;
  respondentAddress?: string;
  respondentContact?: string;
  violenceType?: string;
  referredToAgency: string;
  agencyAddress?: string;
  grounds: string;
  incidentDate?: string;
  incidentPlace?: string;
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

export async function buildReferralPdfDoc(data: ReferralDocumentData): Promise<PDFDocument> {
  const templateBytes = await loadDocumentAsset(documentAssets.certificateTemplate)
  const pdfDoc = await PDFDocument.load(templateBytes);
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

  // Position cleanly below the official graphic letterhead banner
  let currentY = height - 145;

  // 1. Header Bar: Control Number (Left) & Date (Right)
  if (data.controlNumber) {
    page.drawText(`REFERRAL CONTROL NO.: ${data.controlNumber}`, {
      x: marginX,
      y: currentY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  const dateWidth = fontNormal.widthOfTextAtSize(dateFormatted, 10);
  page.drawText(dateFormatted, {
    x: width - marginX - dateWidth,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 24;

  // 2. Addressee (Agency & Office)
  page.drawText("TO:", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 14;

  const agencyName = (data.referredToAgency || "Concerned Agency / Office").toUpperCase();
  page.drawText(agencyName, {
    x: marginX,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 14;

  const agencyAddr = data.agencyAddress || "Valenzuela City Hall Complex, Metro Manila";
  page.drawText(agencyAddr, {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0.15, 0.15, 0.15),
  });

  currentY -= 22;

  // 3. Subject Line (Clean Formal Line)
  const caseNo = data.caseNumber || "2026-VAWC";
  page.drawText(`SUBJECT: FORMAL REFERRAL AND ENDORSEMENT — CASE NO. ${caseNo}`, {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 18;

  // 4. Salutation
  page.drawText("Sir / Madam:", {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 16;

  // Paragraph wrapping helper with bold syntax support
  const drawParagraph = (
    text: string,
    defaultFont: any,
    boldFont: any,
    fontSize: number,
    lineHeight: number,
    startY: number,
    indent: number = 0,
    customWidth: number = contentWidth
  ): number => {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const parts = cleanText.split("**");
    const tokens: { text: string; font: any }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const isBold = i % 2 !== 0;
      const font = isBold ? boldFont : defaultFont;
      const words = parts[i].split(" ").filter((w) => w.length > 0);
      words.forEach((word) => tokens.push({ text: word, font }));
    }

    let lineY = startY;
    let curX = marginX + indent;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const spaceW = token.font.widthOfTextAtSize(" ", fontSize);
      const wordW = token.font.widthOfTextAtSize(token.text, fontSize);

      if (curX + wordW > marginX + customWidth) {
        lineY -= lineHeight;
        curX = marginX;
      }

      page.drawText(token.text, {
        x: curX,
        y: lineY,
        size: fontSize,
        font: token.font,
        color: rgb(0, 0, 0),
      });

      curX += wordW + spaceW;
    }

    return lineY;
  };

  const victim = data.victimName?.trim() || "Complainant";
  const respondent = data.respondentName?.trim() || "Respondent";
  const violation = data.violenceType || "Violence Against Women and Their Children (R.A. 9262)";
  const incDate = (data.incidentDate || data.dateFiled || "recently").trim();
  const incPlace = (data.incidentPlace || "Barangay Ugong, Valenzuela City").trim();

  // Paragraph 1: Formal Transmittal
  const p1 = `Respectfully referred and endorsed to your good office is the confidential case involving **${victim.toUpperCase()}** (Complainant / Victim-Survivor) against **${respondent.toUpperCase()}** (Respondent), concerning reported incidents of **${violation}** pursuant to the provisions of Republic Act No. 9262.`;
  currentY = drawParagraph(p1, fontNormal, fontBold, 10, 15, currentY);
  currentY -= 14;

  // Paragraph 2: Incident Reference & Escalation Request
  const p2 = `Based on the intake assessment and sworn statements recorded by our Barangay VAWC Desk, the alleged incident transpired on or about **${incDate}** at **${incPlace}**. In accordance with established inter-agency protocols and referral guidelines, formal escalation to your office is respectfully requested for appropriate specialized intervention, protective services, and legal disposition.`;
  currentY = drawParagraph(p2, fontNormal, fontBold, 10, 15, currentY);
  currentY -= 14;

  // 5. Clean Formal Grounds / Reason for Referral (Clean & minimal layout)
  page.drawText("Grounds / Specific Reason for Referral:", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 14;

  const groundsText = data.grounds?.trim() || "Case referred for specialized assistance, protective intervention, and formal disposition beyond the jurisdiction of the Barangay VAWC Desk.";
  currentY = drawParagraph(groundsText, fontItalic, fontBold, 9.5, 14, currentY, 14);
  currentY -= 14;

  // Paragraph 3: Enclosures & Cooperation
  const p3 = "Transmitted herewith are copies of the initial intake sheet, incident reports, and pertinent records on file for your evaluation. We look forward to your immediate assistance in ensuring the safety, welfare, and best interest of the victim-survivor.";
  currentY = drawParagraph(p3, fontNormal, fontBold, 10, 15, currentY);
  currentY -= 22;

  // Closing
  page.drawText("Very truly yours,", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 48;

  // 6. Signatures (Clean 2-Column Layout, No redundant address lines)
  const officer = data.assignedOfficerName || "VAWC Desk Officer";
  const punongBarangay = data.punongBarangayName || "Hon. MARICEL PINEDA-EMPERADOR";

  const col1X = marginX;
  const col2X = width - marginX - 220;

  // Left Column: VAWC Desk Officer
  page.drawText(officer.toUpperCase(), {
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

  // Right Column: Punong Barangay
  page.drawText("NOTED / ENDORSED BY:", {
    x: col2X,
    y: currentY + 16,
    size: 8.5,
    font: fontBold,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(punongBarangay.toUpperCase(), {
    x: col2X,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("Punong Barangay", {
    x: col2X,
    y: currentY - 14,
    size: 9.5,
    font: fontNormal,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdfDoc;
}

export async function generateReferralLetter(data: ReferralDocumentData) {
  try {
    const pdfDoc = await buildReferralPdfDoc(data);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    // 1. Direct download option
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = `Referral-Endorsement-${data.caseNumber || "Case"}.pdf`;
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
    console.error("Error generating Referral PDF:", error);
    alert("Failed to generate Referral PDF: " + (error?.message || String(error)));
  }
}
