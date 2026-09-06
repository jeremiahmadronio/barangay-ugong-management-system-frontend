import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fullPdfTemplate } from "./certLogos";

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

  let currentY = height - 145;

  // 1. Control Number (Top Left) & Date (Top Right)
  if (data.controlNumber) {
    page.drawText(`REF. CONTROL NO: ${data.controlNumber}`, {
      x: marginX,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
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

  currentY -= 20;

  // 2. Addressee (Referred Agency)
  page.drawText(data.referredToAgency.toUpperCase(), {
    x: marginX,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 13;

  page.drawText(data.agencyAddress || "Valenzuela City, Metro Manila", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 22;

  // 3. Subject Line
  const subjectText = `SUBJECT: FORMAL REFERRAL / ENDORSEMENT — CASE NO. ${data.caseNumber || "2026-VAWC"}`;
  page.drawText(subjectText, {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  // 4. Salutation
  page.drawText("Sir / Madam:", {
    x: marginX,
    y: currentY,
    size: 10.5,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 16;

  // Helper function to draw multi-line wrapped text with bold markdown
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
        lineY -= size * 1.42;
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

  // 5. Letter Body
  const p1 = `Respectfully referred and endorsed to your good office is the confidential case file concerning **${data.victimName.toUpperCase()}** (Complainant / Victim-Survivor) against **${data.respondentName.toUpperCase()}** (Respondent), involving reported incidents of **${data.violenceType || "VAWC (Violence Against Women and Their Children)"}** under Republic Act No. 9262.`;
  currentY = drawParagraph(p1, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 14;

  const incidentLoc = data.incidentPlace || "Barangay Ugong, Valenzuela City";
  const incidentDt = data.incidentDate || data.dateFiled || dateFormatted;
  const p2 = `Based on initial intake and assessment conducted by our Barangay VAWC Desk, the incident transpired on or about **${incidentDt}** at **${incidentLoc}**. Due to the nature and specific requirements of the matter, formal escalation to your office is deemed necessary for appropriate protective, legal, medical, or social intervention.`;
  currentY = drawParagraph(p2, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 14;

  // 6. Grounds Box
  page.drawText("Specific Grounds / Reason for Referral:", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  currentY -= 13;

  const cleanGrounds = data.grounds?.trim() || "Case requires higher-tier intervention, legal representation, or specialized protective support beyond the jurisdiction of the Barangay VAWC Desk.";
  currentY = drawParagraph(cleanGrounds, fontItalic, fontBold, 9.5, currentY, 12);
  currentY -= 14;

  // 7. Conclusion
  const p3 = "Attached herewith are the relevant intake records, initial statements, and pertinent documents for your reference and appropriate disposition. We look forward to your prompt assistance in ensuring the safety and welfare of the victim-survivor.";
  currentY = drawParagraph(p3, fontNormal, fontBold, 10, currentY, 0);
  currentY -= 24;

  // 8. Closing
  page.drawText("Very truly yours,", {
    x: marginX,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY -= 48;

  // 9. Signatures Block (2 Columns)
  const officerName = data.assignedOfficerName || "Kag. Maria Cruz";
  const captainName = data.punongBarangayName || "Hon. MARICEL PINEDA-EMPERADOR";

  const col1X = marginX;
  const col2X = width - marginX - 225;

  // Left: VAWC Desk Officer
  page.drawText(officerName.toUpperCase(), {
    x: col1X,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("VAWC Desk Officer", {
    x: col1X,
    y: currentY - 13,
    size: 9.5,
    font: fontNormal,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Right: Punong Barangay Endorsement
  page.drawText("NOTED / ENDORSED BY:", {
    x: col2X,
    y: currentY + 15,
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
    y: currentY - 13,
    size: 9,
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
