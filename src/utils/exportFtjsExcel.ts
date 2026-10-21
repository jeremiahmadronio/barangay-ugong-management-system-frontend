import ExcelJS from 'exceljs'
import { formatDate } from './formatters'
import type {
  FtjsReportKpiResponse,
  EducationDistributionResponse,
  PurposeDistributionResponse,
  IssuanceTypeDistributionResponse,
  FtjsReportTableItemDto,
} from '@/config/api/ftjs/ftjs.types'
import type { ReportFilters as Filters } from '@/components/reports/types/ftjs'

interface ExportFtjsExcelParams {
  tableRecords: FtjsReportTableItemDto[]
  kpiData: FtjsReportKpiResponse | null
  educationData?: EducationDistributionResponse | null
  purposeData?: PurposeDistributionResponse | null
  issuanceData?: IssuanceTypeDistributionResponse | null
  appliedFilters: Filters
  user: any
}

// Color palette matching Serbisyoko POI Royal Blue theme
const COLORS = {
  headerBg: 'FF1E3A8A', // Deep Royal Blue
  headerText: 'FFFFFFFF', // Pure White
  sectionBg: 'FFF1F5F9', // Soft Slate-100
  sectionText: 'FF0F172A', // Slate-900
  cardBg: 'FFF8FAFC', // Slate-50
  zebraRow: 'FFF8FAFC', // Alternating light gray
  borderColor: 'FFE2E8F0', // Slate-200 border
  activeGreen: 'FF059669', // Emerald-600
  amberBadge: 'FFD97706', // Amber-600
  textMuted: 'FF64748B', // Slate-500
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderColor } },
  left: { style: 'thin', color: { argb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
  right: { style: 'thin', color: { argb: COLORS.borderColor } },
}

export async function exportFtjsExcel({
  tableRecords,
  kpiData,
  educationData,
  purposeData,
  issuanceData,
  appliedFilters,
  user,
}: ExportFtjsExcelParams): Promise<void> {
  const preparedByName =
    (user as any)?.fullName ||
    ((user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
      : (user as any)?.name || 'FTJS Processing Officer')

  const dateRangeLabel =
    appliedFilters.dateFrom && appliedFilters.dateTo
      ? `${appliedFilters.dateFrom} to ${appliedFilters.dateTo}`
      : 'All Recorded Dates'

  const generatedDateTimeText = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const totalRecords = kpiData?.totalRecords ?? tableRecords.length
  const firstTimeIssuances = kpiData?.firstTimeIssuances ?? 0
  const firstTimePct = kpiData ? `${kpiData.firstTimePercentage.toFixed(1)}%` : '0.0%'
  const mostCommonPurpose = kpiData?.mostCommonPurpose || 'First Time Jobseeker Requirement'
  const mostCommonPurposePct = kpiData ? `${kpiData.mostCommonPurposePercentage.toFixed(1)}%` : '0.0%'
  const mostCommonAge = kpiData?.mostCommonAgeRange || 'N/A'

  // Initialize Excel Workbook
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Barangay Ugong - Serbisyoko FTJS System'
  wb.created = new Date()

  // =============================================================
  // SHEET 1: MASTER FTJS REGISTRY REPORT
  // =============================================================
  const ws1 = wb.addWorksheet('FTJS_Registry_Report', {
    views: [{ showGridLines: true }],
  })

  // Set Column Widths (11 Columns)
  ws1.columns = [
    { width: 7 }, // Col 1: SEQ NO
    { width: 22 }, // Col 2: FTJS NO
    { width: 30 }, // Col 3: APPLICANT FULL NAME
    { width: 14 }, // Col 4: SEX / AGE
    { width: 24 }, // Col 5: EDUCATIONAL ATTAINMENT
    { width: 28 }, // Col 6: INSTITUTION
    { width: 30 }, // Col 7: PURPOSE
    { width: 18 }, // Col 8: ISSUANCE TYPE
    { width: 16 }, // Col 9: STATUS
    { width: 16 }, // Col 10: DATE FILED
    { width: 24 }, // Col 11: RELEASED BY
  ]

  let r = 2

  // Formal Republic Header (Row 2 - 6)
  const repLines = [
    { text: 'REPUBLIKA NG PILIPINAS', size: 10, bold: true, color: 'FF475569' },
    { text: 'PAMBANSANG PUNONG REHIYON', size: 9, bold: true, color: 'FF64748B' },
    { text: 'LUNGSOD NG VALENZUELA', size: 9.5, bold: true, color: 'FF334155' },
    {
      text: 'BARANGAY UGONG - FIRST-TIME JOB SEEKER (FTJS) REGISTRY REPORT',
      size: 13,
      bold: true,
      color: COLORS.headerBg,
    },
    {
      text: 'Republic Act No. 11261 (First-Time Jobseekers Assistance Act)',
      size: 9.5,
      bold: false,
      italic: true,
      color: 'FF64748B',
    },
  ]

  repLines.forEach((line) => {
    ws1.mergeCells(r, 1, r, 11)
    const cell = ws1.getCell(r, 1)
    cell.value = line.text
    cell.font = { name: 'Calibri', size: line.size, bold: line.bold, italic: line.italic, color: { argb: line.color } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    ws1.getRow(r).height = line.size > 12 ? 26 : 18
    r++
  })

  r++ // Empty spacer

  // Metadata Table Block
  const metaItems = [
    { label: 'Date Generated', val: generatedDateTimeText },
    { label: 'Report Period', val: dateRangeLabel },
    { label: 'Status Filter', val: appliedFilters.outcome === 'All' ? 'All Applications' : appliedFilters.outcome },
    { label: 'Total Volume', val: `${totalRecords} Registered Record(s)` },
    { label: 'Generated By', val: preparedByName },
    { label: 'Barangay Office', val: '3S Center Barangay Ugong, Valenzuela City' },
  ]

  metaItems.forEach((m) => {
    ws1.mergeCells(r, 2, r, 4)
    ws1.mergeCells(r, 5, r, 10)
    const lblCell = ws1.getCell(r, 2)
    lblCell.value = m.label
    lblCell.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF475569' } }
    lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
    lblCell.border = thinBorder
    lblCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

    const valCell = ws1.getCell(r, 5)
    valCell.value = m.val
    valCell.font = { name: 'Calibri', bold: false, size: 9.5, color: { argb: 'FF0F172A' } }
    valCell.border = thinBorder
    valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

    ws1.getRow(r).height = 20
    r++
  })

  r++ // Empty spacer

  // KPI Summary Cards Grid
  ws1.mergeCells(r, 2, r, 3)
  ws1.mergeCells(r, 4, r, 5)
  ws1.mergeCells(r, 6, r, 7)
  ws1.mergeCells(r, 8, r, 10)

  const cardHeaders = [
    { col: 2, label: 'TOTAL CERTIFICATES' },
    { col: 4, label: '1ST ISSUANCE (ORIGINAL)' },
    { col: 6, label: 'TOP PURPOSE OF REQUEST' },
    { col: 8, label: 'MOST COMMON AGE GROUP' },
  ]

  cardHeaders.forEach((ch) => {
    const c = ws1.getCell(r, ch.col)
    c.value = ch.label
    c.font = { name: 'Calibri', bold: true, size: 8.5, color: { argb: COLORS.headerText } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    c.border = thinBorder
  })
  ws1.getRow(r).height = 20
  r++

  ws1.mergeCells(r, 2, r, 3)
  ws1.mergeCells(r, 4, r, 5)
  ws1.mergeCells(r, 6, r, 7)
  ws1.mergeCells(r, 8, r, 10)

  const cardValues = [
    { col: 2, val: totalRecords },
    { col: 4, val: `${firstTimeIssuances} (${firstTimePct})` },
    { col: 6, val: `${mostCommonPurpose} (${mostCommonPurposePct})` },
    { col: 8, val: mostCommonAge },
  ]

  cardValues.forEach((cv) => {
    const c = ws1.getCell(r, cv.col)
    c.value = cv.val
    c.font = { name: 'Calibri', bold: true, size: 12, color: { argb: COLORS.headerBg } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cardBg } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    c.border = thinBorder
  })
  ws1.getRow(r).height = 26
  r += 2 // Empty spacer

  // Section Header: Master Registry Table
  ws1.mergeCells(r, 1, r, 11)
  const secHdr = ws1.getCell(r, 1)
  secHdr.value = 'MASTER REGISTRY OF FIRST-TIME JOBSEEKER CERTIFICATES ISSUED'
  secHdr.font = { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } }
  secHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
  secHdr.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  secHdr.border = thinBorder
  ws1.getRow(r).height = 24
  r++

  // Master Table Columns Header
  const headers = [
    'NO.',
    'APPLICATION NO.',
    'APPLICANT FULL NAME',
    'SEX / AGE',
    'EDUCATIONAL ATTAINMENT',
    'INSTITUTION',
    'PURPOSE OF REQUEST',
    'ISSUANCE TYPE',
    'STATUS',
    'DATE FILED',
    'RELEASED BY',
  ]

  const tblHeaderRow = ws1.getRow(r)
  tblHeaderRow.height = 26
  headers.forEach((h, idx) => {
    const cell = tblHeaderRow.getCell(idx + 1)
    cell.value = h
    cell.font = { name: 'Calibri', bold: true, size: 9, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 || idx === 3 || idx === 7 || idx === 8 || idx === 9 ? 'center' : 'left',
      indent: idx === 0 || idx === 3 || idx === 7 || idx === 8 || idx === 9 ? 0 : 1,
    }
    cell.border = thinBorder
  })
  r++

  // Master Table Data Rows
  if (tableRecords.length > 0) {
    tableRecords.forEach((record, index) => {
      const row = ws1.getRow(r)
      row.height = 22
      const isEven = index % 2 === 1
      const isReissuance = record.status === 'RE_ISSUANCE' || (record.issuanceCount && record.issuanceCount > 1)
      const issuanceType = isReissuance ? 'Re-issuance' : '1st Issuance'
      const statusText = isReissuance ? 'RE_ISSUANCE' : 'ISSUED'
      const sexAge = [record.gender || (record as any).sex, record.age ? `${record.age}y` : '']
        .filter(Boolean)
        .join(' / ') || '—'

      const submittedDate = record.dateSubmitted
        ? formatDate(record.dateSubmitted)
        : (record as any).dateFiled
        ? formatDate((record as any).dateFiled)
        : '—'

      const rowValues = [
        index + 1,
        record.applicationNo || record.ftjsNumber || '—',
        record.applicantName || record.fullName || '—',
        sexAge,
        record.educationalAttainment || '—',
        record.institution || '—',
        record.purpose || 'First Time Jobseeker Requirement',
        issuanceType,
        statusText,
        submittedDate,
        record.releasedBy || preparedByName,
      ]

      rowValues.forEach((val, i) => {
        const cell = row.getCell(i + 1)
        cell.value = val
        cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        cell.border = thinBorder
        cell.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 || i === 7 || i === 8 || i === 9 ? 'center' : 'left',
          indent: i === 0 || i === 3 || i === 7 || i === 8 || i === 9 ? 0 : 1,
        }

        // Status pill styling
        if (i === 8) {
          cell.font = {
            name: 'Calibri',
            bold: true,
            size: 8.5,
            color: { argb: isReissuance ? COLORS.amberBadge : COLORS.activeGreen },
          }
        }
      })
      r++
    })
  } else {
    ws1.mergeCells(r, 1, r, 11)
    const emptyCell = ws1.getCell(r, 1)
    emptyCell.value = 'No First-Time Jobseeker records found matching the applied date range and filter criteria.'
    emptyCell.font = { name: 'Calibri', italic: true, size: 9.5, color: { argb: COLORS.textMuted } }
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' }
    emptyCell.border = thinBorder
    ws1.getRow(r).height = 24
    r++
  }

  r += 2 // Empty spacer

  // Signatory Block (Philippine Local Government Code Format)
  ws1.mergeCells(r, 2, r, 5)
  ws1.mergeCells(r, 7, r, 10)
  const sig1 = ws1.getCell(r, 2)
  sig1.value = `PREPARED BY: ${preparedByName.toUpperCase()}`
  sig1.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } }
  sig1.alignment = { vertical: 'middle', horizontal: 'center' }

  const sig2 = ws1.getCell(r, 7)
  sig2.value = 'NOTED BY: HON. MARICEL PINEDA-EMPERADOR'
  sig2.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } }
  sig2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws1.getRow(r).height = 20
  r++

  ws1.mergeCells(r, 2, r, 5)
  ws1.mergeCells(r, 7, r, 10)
  const role1 = ws1.getCell(r, 2)
  role1.value = 'FTJS Desk Officer / Barangay Staff'
  role1.font = { name: 'Calibri', italic: true, size: 8.5, color: { argb: COLORS.textMuted } }
  role1.alignment = { vertical: 'middle', horizontal: 'center' }

  const role2 = ws1.getCell(r, 7)
  role2.value = 'Punong Barangay - Barangay Ugong'
  role2.font = { name: 'Calibri', italic: true, size: 8.5, color: { argb: COLORS.textMuted } }
  role2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws1.getRow(r).height = 18

  // =============================================================
  // SHEET 2: SUMMARY ANALYTICS & DEMOGRAPHICS
  // =============================================================
  const ws2 = wb.addWorksheet('Summary_Analytics', {
    views: [{ showGridLines: true }],
  })

  ws2.columns = [
    { width: 35 }, // Category / Name
    { width: 16 }, // Count
    { width: 16 }, // Share %
    { width: 35 }, // Remarks
  ]

  let r2 = 2

  // Sheet 2 Header
  ws2.mergeCells(r2, 1, r2, 4)
  const s2Hdr = ws2.getCell(r2, 1)
  s2Hdr.value = 'BARANGAY UGONG - FIRST-TIME JOBSEEKER SUMMARY ANALYTICS'
  s2Hdr.font = { name: 'Calibri', bold: true, size: 12, color: { argb: COLORS.headerBg } }
  s2Hdr.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws2.getRow(r2).height = 24
  r2 += 2

  // 1. Educational Attainment Table
  ws2.mergeCells(r2, 1, r2, 4)
  const eduSec = ws2.getCell(r2, 1)
  eduSec.value = 'I. EDUCATIONAL ATTAINMENT DISTRIBUTION'
  eduSec.font = { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } }
  eduSec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
  eduSec.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  eduSec.border = thinBorder
  ws2.getRow(r2).height = 22
  r2++

  const eduHeaders = ['EDUCATIONAL LEVEL', 'APPLICANT COUNT', 'SHARE (%)', 'BENEFIT STATUS']
  const eduHdrRow = ws2.getRow(r2)
  eduHdrRow.height = 22
  eduHeaders.forEach((h, i) => {
    const c = eduHdrRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true, size: 9, color: { argb: COLORS.headerText } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
    c.border = thinBorder
  })
  r2++

  const eduPoints = educationData?.points || []
  if (eduPoints.length > 0) {
    eduPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const vals = [p.educationalAttainment, p.applicantCount, `${p.share.toFixed(1)}%`, 'RA 11261 Availee']
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    const emptyC = ws2.getCell(r2, 1)
    emptyC.value = 'No educational attainment records for period'
    emptyC.font = { italic: true, size: 9, color: { argb: COLORS.textMuted } }
    emptyC.alignment = { vertical: 'middle', horizontal: 'center' }
    emptyC.border = thinBorder
    ws2.getRow(r2).height = 20
    r2++
  }

  r2 += 2 // Empty spacer

  // 2. Purpose Distribution Table
  ws2.mergeCells(r2, 1, r2, 4)
  const purpSec = ws2.getCell(r2, 1)
  purpSec.value = 'II. PURPOSE OF REQUEST BREAKDOWN'
  purpSec.font = { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } }
  purpSec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
  purpSec.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  purpSec.border = thinBorder
  ws2.getRow(r2).height = 22
  r2++

  const purpHeaders = ['PURPOSE OF APPLICATION', 'COUNT', 'SHARE (%)', 'LEGAL BASIS']
  const purpHdrRow = ws2.getRow(r2)
  purpHdrRow.height = 22
  purpHeaders.forEach((h, i) => {
    const c = purpHdrRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true, size: 9, color: { argb: COLORS.headerText } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
    c.border = thinBorder
  })
  r2++

  const purpPoints = purposeData?.points || []
  if (purpPoints.length > 0) {
    purpPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const vals = [p.purpose, p.count, `${p.share.toFixed(1)}%`, 'RA 11261 Pre-Employment']
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    const emptyC = ws2.getCell(r2, 1)
    emptyC.value = 'No purpose distribution records for period'
    emptyC.font = { italic: true, size: 9, color: { argb: COLORS.textMuted } }
    emptyC.alignment = { vertical: 'middle', horizontal: 'center' }
    emptyC.border = thinBorder
    ws2.getRow(r2).height = 20
    r2++
  }

  r2 += 2 // Empty spacer

  // 3. Original vs Re-issuance Table
  ws2.mergeCells(r2, 1, r2, 4)
  const issSec = ws2.getCell(r2, 1)
  issSec.value = 'III. ISSUANCE TYPE DISTRIBUTION (ORIGINAL VS. RE-ISSUANCE)'
  issSec.font = { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } }
  issSec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
  issSec.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  issSec.border = thinBorder
  ws2.getRow(r2).height = 22
  r2++

  const issHeaders = ['ISSUANCE CLASSIFICATION', 'VOLUME', 'PERCENTAGE', 'BENEFIT NATURE']
  const issHdrRow = ws2.getRow(r2)
  issHdrRow.height = 22
  issHeaders.forEach((h, i) => {
    const c = issHdrRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true, size: 9, color: { argb: COLORS.headerText } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
    c.border = thinBorder
  })
  r2++

  const issPoints = issuanceData?.points || []
  if (issPoints.length > 0) {
    issPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const isReiss = p.typeLabel.toLowerCase().includes('re-issuance') || p.typeLabel.toLowerCase().includes('reissuance')
      const vals = [p.typeLabel, p.count, `${p.share.toFixed(1)}%`, isReiss ? 'Subsequent Re-issue (Lost/Damaged)' : 'Initial 1-Time Benefit']
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        c.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'center', indent: i === 0 || i === 3 ? 1 : 0 }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    const emptyC = ws2.getCell(r2, 1)
    emptyC.value = 'No issuance classification records for period'
    emptyC.font = { italic: true, size: 9, color: { argb: COLORS.textMuted } }
    emptyC.alignment = { vertical: 'middle', horizontal: 'center' }
    emptyC.border = thinBorder
    ws2.getRow(r2).height = 20
    r2++
  }

  // =============================================================
  // DOWNLOAD TRIGGER IN BROWSER
  // =============================================================
  const safeFrom = appliedFilters.dateFrom || 'start'
  const safeTo = appliedFilters.dateTo || 'end'
  const fileName = `Barangay_Ugong_FTJS_Report_${safeFrom}_to_${safeTo}.xlsx`

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}
