import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { documentAssets, loadDocumentAsset } from '@/utils/documentAssets'

export interface CfaCertificateData {
  caseNumber: string;
  complainantName: string;
  respondentName: string;
  natureOfComplaint: string;
  grounds: string;
  dateIssued: Date | string | number;
  secretaryName?: string;
  secretaryTitle?: string;
  pangkatChairmanName?: string;
  chairmanTitle?: string;
  punongBarangayName?: string;
}

function formatFilipinoDate(date: Date) {
  const months = [
    "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
    "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"
  ];
  return `ika-${date.getDate()} ng ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

export async function buildCfaPdfDoc(data: CfaCertificateData, rotationAngle: number = 0): Promise<PDFDocument> {
  const templateBytes = await loadDocumentAsset(documentAssets.certificateTemplate)
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  page.setRotation(degrees(rotationAngle));
  const { width, height } = page.getSize();

  const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const marginX = 54;
  const contentWidth = width - (marginX * 2);

  const dateObj = data.dateIssued instanceof Date ? data.dateIssued : new Date(data.dateIssued);
  const dateFormatted = formatFilipinoDate(dateObj);

  // Position below graphic banner
  let currentY = height - 165;

  // 1. Main Document Title (Centered & Underlined)
  const titleText = "KATIBAYAN UPANG MAKADULOG SA HUKUMAN";
  const titleSize = 15;
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: currentY,
    size: titleSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 3.5;
  page.drawLine({
    start: { x: (width - titleWidth) / 2, y: currentY },
    end: { x: (width + titleWidth) / 2, y: currentY },
    thickness: 1.2,
    color: rgb(0, 0, 0),
  });

  currentY -= 14;
  const subtitleText = "(CERTIFICATE TO FILE ACTION)";
  const subWidth = fontNormal.widthOfTextAtSize(subtitleText, 10);
  page.drawText(subtitleText, {
    x: (width - subWidth) / 2,
    y: currentY,
    size: 10,
    font: fontNormal,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 32;

  // 2. Docket / Case Caption (Clean without '- laban kay -')
  const docketTopY = currentY;
  const colSplit = marginX + contentWidth * 0.54;

  // Left Column: Complainant & Respondent
  page.drawText(data.complainantName.toUpperCase(), {
    x: marginX,
    y: docketTopY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("Mayreklamo", {
    x: marginX,
    y: docketTopY - 13,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(data.respondentName.toUpperCase(), {
    x: marginX,
    y: docketTopY - 36,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("Ipinagreklamo", {
    x: marginX,
    y: docketTopY - 49,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Right Column: Barangay Case No. & Nature of Action
  page.drawText("USAPING BARANGAY BLG.:", {
    x: colSplit,
    y: docketTopY,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  page.drawText(data.caseNumber, {
    x: colSplit,
    y: docketTopY - 14,
    size: 11.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("UKOL SA (FOR):", {
    x: colSplit,
    y: docketTopY - 32,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  page.drawText(data.natureOfComplaint, {
    x: colSplit,
    y: docketTopY - 46,
    size: 10,
    font: fontNormal,
    color: rgb(0, 0, 0),
  });

  currentY = docketTopY - 74;

  // 3. Center Heading: P A T U N A Y
  const patunayText = "P A T U N A Y";
  const patunayWidth = fontBold.widthOfTextAtSize(patunayText, 12);
  page.drawText(patunayText, {
    x: (width - patunayWidth) / 2,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= 24;

  page.drawText("Ipinatutunayan na:", {
    x: marginX,
    y: currentY,
    size: 11,
    font: fontItalic,
    color: rgb(0, 0, 0),
  });

  currentY -= 20;

  // Rich text paragraph drawer
  const drawParagraph = (text: string, normalFont: any, boldFont: any, size: number, y: number, indent: number = 0) => {
    const parts = text.split("**");
    const tokens: { text: string; font: any }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const isBold = i % 2 !== 0;
      const font = isBold ? boldFont : normalFont;
      const words = parts[i].split(/\s+/).filter(w => w.length > 0);
      words.forEach(word => tokens.push({ text: word, font }));
    }

    let lineY = y;
    let currentX = marginX + indent;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const spaceWidth = token.font.widthOfTextAtSize(" ", size);
      const wordWidth = token.font.widthOfTextAtSize(token.text, size);

      if (currentX + wordWidth > marginX + contentWidth) {
        lineY -= size * 1.55;
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

  // 4. Body Statements
  const p1 = "1. Nagkaroon ng personal na paghaharap at pagdinig sa pagitan ng mga partidong nabanggit sa itaas sa ilalim ng Tanggapan ng Punong Barangay / Pangkat ng Tagapagkasundo;";
  currentY = drawParagraph(p1, fontNormal, fontBold, 11, currentY, 20);
  currentY -= 16;

  const p2 = "2. Walang naganap na pagkakasundo sa pagitan ng mga partido at walang pagnanais na magkaayos alinsunod sa mga panuntunan ng Katarungang Pambarangay;";
  currentY = drawParagraph(p2, fontNormal, fontBold, 11, currentY, 20);
  currentY -= 16;

  // Number 3 in regular (non-bold) text
  const p3 = `3. Dahilan / Katwiran ng Pagpapalabas: ${data.grounds}`;
  currentY = drawParagraph(p3, fontNormal, fontBold, 11, currentY, 20);
  currentY -= 22;

  // Legal conclusion (fixed spacing)
  const pLaw = "Dahil dito, ang kaukulang sumbong ukol sa naturang usapin ay **MAAARI NANG IDULOG SA HUKUMAN O TANGGAPAN NG KATARUNGAN** (Court / Proper Government Agency) alinsunod sa isinasaad ng Batas Pambansa Blg. 7160 (Local Government Code of 1991, Katarungang Pambarangay Law).";
  currentY = drawParagraph(pLaw, fontNormal, fontBold, 11, currentY, 20);
  currentY -= 24;

  // Date of Issuance
  const pDate = `Nilagdaan at ipinagkaloob ngayong **${dateFormatted}** sa Tanggapan ng Lupon, Barangay Ugong, Lungsod ng Valenzuela.`;
  currentY = drawParagraph(pDate, fontNormal, fontBold, 11, currentY, 20);
  currentY -= 48;

  // 5. Signatories Block (Dynamic Lupon/Pangkat Secretary & Pangkat Chairman)
  const secName = data.secretaryName || "Elena Gomez";
  const secTitle = data.secretaryTitle || "Kalihim ng Pangkat / Lupon Secretary";
  const chairName = data.pangkatChairmanName || data.punongBarangayName || "Antonio Soriano";
  const chairTitle = data.chairmanTitle || "Pangkat Chairman / Tagapangulo ng Pangkat";

  const col1X = marginX + 10;
  const col2X = width - marginX - 220;

  // Captions
  page.drawText("Inihanda at Pinatutunayan ni:", {
    x: col1X,
    y: currentY,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("Pinagtibay at Inaprubahan ni:", {
    x: col2X,
    y: currentY,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentY -= 45;

  // Secretary Name & Title
  page.drawText(secName.toUpperCase(), {
    x: col1X,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const secLineWidth = Math.max(185, fontBold.widthOfTextAtSize(secName.toUpperCase(), 11) + 10);
  page.drawLine({
    start: { x: col1X, y: currentY - 2 },
    end: { x: col1X + secLineWidth, y: currentY - 2 },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  });
  page.drawText(secTitle, {
    x: col1X,
    y: currentY - 14,
    size: 9,
    font: fontNormal,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Chairman Name & Title
  page.drawText(chairName.toUpperCase(), {
    x: col2X,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  const chairLineWidth = Math.max(210, fontBold.widthOfTextAtSize(chairName.toUpperCase(), 11) + 10);
  page.drawLine({
    start: { x: col2X, y: currentY - 2 },
    end: { x: col2X + chairLineWidth, y: currentY - 2 },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  });
  page.drawText(chairTitle, {
    x: col2X,
    y: currentY - 14,
    size: 9,
    font: fontNormal,
    color: rgb(0.25, 0.25, 0.25),
  });

  return pdfDoc;
}

export async function generateCfaBlob(data: CfaCertificateData, rotationAngle: number = 0): Promise<string> {
  const pdfDoc = await buildCfaPdfDoc(data, rotationAngle);
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as BlobPart], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export async function generateCfaCertificate(data: CfaCertificateData, rotationAngle: number = 0) {
  try {
    const pdfDoc = await buildCfaPdfDoc(data, rotationAngle);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    // 1. Automatic Direct Download (No new tab)
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = `CFA-${data.caseNumber || "KP20"}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 2. Automatic Browser Print Dialog (via hidden iframe, No new tab)
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
    console.error("Error generating CFA PDF:", error);
    alert("Failed to generate CFA PDF: " + (error?.message || String(error)));
  }
}
