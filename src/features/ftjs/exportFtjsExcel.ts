import ExcelJS from 'exceljs'
import { formatDate } from '@/utils/formatters'
import type {
  FtjsReportKpiResponse,
  EducationDistributionResponse,
  PurposeDistributionResponse,
  IssuanceTypeDistributionResponse,
  FtjsReportTableItemDto,
} from '@/config/api/ftjs/ftjs.types'
import type { FtjsReportFilters as Filters } from './ftjsReport.types'

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
  tableRecords = [],
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
    appliedFilters?.dateFrom && appliedFilters?.dateTo
      ? `${formatDate(appliedFilters.dateFrom)} to ${formatDate(appliedFilters.dateTo)}`
      : 'All Recorded Dates'

  const generatedDateTimeText = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Safe KPI calculations
  const totalRecords = kpiData?.totalRecords ?? tableRecords.length
  const firstTimeIssuances = kpiData?.firstTimeIssuances ?? 0
  const firstTimeShareVal =
    kpiData?.firstTimeIssuanceShare ??
    (kpiData as any)?.firstTimePercentage ??
    (totalRecords > 0 ? (firstTimeIssuances / totalRecords) * 100 : 0)
  const firstTimePct =
    typeof firstTimeShareVal === 'number' && !isNaN(firstTimeShareVal)
      ? `${firstTimeShareVal.toFixed(1)}%`
      : '0.0%'

  const mostCommonPurpose = kpiData?.mostCommonPurpose || 'First Time Jobseeker Requirement'
  const mostCommonPurposeShareVal =
    kpiData?.mostCommonPurposeShare ??
    (kpiData as any)?.mostCommonPurposePercentage ??
    0
  const mostCommonPurposePct =
    typeof mostCommonPurposeShareVal === 'number' && !isNaN(mostCommonPurposeShareVal)
      ? `${mostCommonPurposeShareVal.toFixed(1)}%`
      : '0.0%'

  const mostCommonAge = kpiData?.mostCommonAgeRange || 'N/A'

  // Initialize Excel Workbook
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Barangay Ugong - Serbisyoko FTJS System'
  wb.created = new Date()

  // Helper to style merged ranges properly
  const styleMergedCells = (
    ws: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    style: {
      fill?: ExcelJS.Fill
      font?: Partial<ExcelJS.Font>
      alignment?: Partial<ExcelJS.Alignment>
      border?: Partial<ExcelJS.Borders>
    }
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      const row = ws.getRow(r)
      for (let c = startCol; c <= endCol; c++) {
        const cell = row.getCell(c)
        if (style.fill) cell.fill = style.fill
        if (style.font) cell.font = style.font
        if (style.alignment) cell.alignment = style.alignment
        if (style.border) cell.border = style.border
      }
    }
  }

  // =============================================================
  // SHEET 1: MASTER FTJS REGISTRY & OPERATIONAL SUMMARY
  // =============================================================
  const ws1 = wb.addWorksheet('FTJS Reports', {
    views: [{ showGridLines: true }],
  })

  // Set Column Widths (11 Columns)
  ws1.columns = [
    { key: 'col1', width: 6 }, // A: #
    { key: 'col2', width: 22 }, // B: FTJS No.
    { key: 'col3', width: 30 }, // C: Applicant Name
    { key: 'col4', width: 14 }, // D: Sex / Age
    { key: 'col5', width: 26 }, // E: Educational Attainment
    { key: 'col6', width: 28 }, // F: Institution / School
    { key: 'col7', width: 30 }, // G: Purpose of Request
    { key: 'col8', width: 18 }, // H: Issuance Type
    { key: 'col9', width: 16 }, // I: Status
    { key: 'col10', width: 16 }, // J: Date Filed
    { key: 'col11', width: 24 }, // K: Released By
  ]

  let curRow = 1

  // 1. Official Letterhead
  const hRow1 = ws1.getRow(curRow++)
  hRow1.height = 16
  hRow1.getCell(1).value = 'Republika ng Pilipinas'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow2 = ws1.getRow(curRow++)
  hRow2.height = 16
  hRow2.getCell(1).value = 'Lungsod ng Valenzuela'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow3 = ws1.getRow(curRow++)
  hRow3.height = 22
  hRow3.getCell(1).value = 'BARANGAY UGONG'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow4 = ws1.getRow(curRow++)
  hRow4.height = 18
  hRow4.getCell(1).value = 'TANGGAPAN NG PUNONG BARANGAY'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow5 = ws1.getRow(curRow++)
  hRow5.height = 16
  hRow5.getCell(1).value = 'First-Time Jobseeker Regulatory Desk · RA 11261 Implementation'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  ws1.getRow(curRow++).height = 8 // Spacer

  const hRowTitle = ws1.getRow(curRow++)
  hRowTitle.height = 28
  hRowTitle.getCell(1).value = 'FIRST-TIME JOB SEEKER (FTJS) REGISTRY & ANALYTICS REPORT'
  ws1.mergeCells(`A${curRow - 1}:K${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 11, {
    font: { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  ws1.getRow(curRow++).height = 10 // Spacing

  // 2. Metadata Audit Cards
  const metaRow1 = ws1.getRow(curRow)
  metaRow1.height = 22
  metaRow1.getCell(1).value = 'Report Period:'
  metaRow1.getCell(2).value = dateRangeLabel
  metaRow1.getCell(7).value = 'Generated On:'
  metaRow1.getCell(8).value = generatedDateTimeText
  ws1.mergeCells(`B${curRow}:F${curRow}`)
  ws1.mergeCells(`H${curRow}:K${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 1, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 2, curRow, 6, {
    font: { bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 7, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 8, curRow, 11, {
    font: { size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  curRow++

  const metaRow2 = ws1.getRow(curRow)
  metaRow2.height = 22
  metaRow2.getCell(1).value = 'Reporting Officer:'
  metaRow2.getCell(2).value = preparedByName
  metaRow2.getCell(7).value = 'Total Records:'
  metaRow2.getCell(8).value = `${totalRecords.toLocaleString()} FTJS Record(s)`
  ws1.mergeCells(`B${curRow}:F${curRow}`)
  ws1.mergeCells(`H${curRow}:K${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 1, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 2, curRow, 6, {
    font: { bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 7, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 8, curRow, 11, {
    font: { bold: true, size: 9.5, color: { argb: 'FF1E40AF' } },
    alignment: { vertical: 'middle' },
  })
  curRow++

  ws1.getRow(curRow++).height = 10 // Spacing

  // 3. Section I: Executive Operational & Volume Summary
  const sec1Title = ws1.getRow(curRow)
  sec1Title.height = 26
  sec1Title.getCell(1).value = 'I. EXECUTIVE OPERATIONAL & VOLUME SUMMARY'
  ws1.mergeCells(`A${curRow}:K${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 11, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10.5, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  curRow++

  // KPI Metrics Table Header
  const t1Header = ws1.getRow(curRow)
  t1Header.height = 24
  t1Header.getCell(1).value = 'OPERATIONAL INDICATOR'
  t1Header.getCell(5).value = 'RECORDED METRIC'
  t1Header.getCell(7).value = 'ADMINISTRATIVE & AUDIT DESCRIPTION'
  ws1.mergeCells(`A${curRow}:D${curRow}`)
  ws1.mergeCells(`E${curRow}:F${curRow}`)
  ws1.mergeCells(`G${curRow}:K${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 11, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { name: 'Calibri', bold: true, size: 9, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  curRow++

  const kpiRows = [
    {
      metric: 'Total Registered FTJS Records',
      val: totalRecords.toLocaleString(),
      desc: 'All official first-time jobseeker certificates requested and released within period',
    },
    {
      metric: 'First-Time Issuances (Originals)',
      val: `${firstTimeIssuances.toLocaleString()} (${firstTimePct})`,
      desc: 'Constituents claiming RA 11261 free government documentation benefits for the first time',
    },
    {
      metric: 'Top Application Purpose',
      val: `${mostCommonPurpose} (${mostCommonPurposePct})`,
      desc: 'Primary pre-employment requirement or statutory application category',
    },
    {
      metric: 'Dominant Age Demographic',
      val: mostCommonAge,
      desc: 'Highest volume age bracket among registered barangay jobseeker applicants',
    },
  ]

  kpiRows.forEach((item, idx) => {
    const row = ws1.getRow(curRow)
    row.height = 22
    row.getCell(1).value = item.metric
    row.getCell(5).value = item.val
    row.getCell(7).value = item.desc
    ws1.mergeCells(`A${curRow}:D${curRow}`)
    ws1.mergeCells(`E${curRow}:F${curRow}`)
    ws1.mergeCells(`G${curRow}:K${curRow}`)

    const isEven = idx % 2 === 1
    const bg = isEven ? COLORS.zebraRow : 'FFFFFFFF'

    styleMergedCells(ws1, curRow, 1, curRow, 4, {
      font: { name: 'Calibri', bold: true, size: 9, color: { argb: 'FF0F172A' } },
      alignment: { vertical: 'middle', indent: 1 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 5, curRow, 6, {
      font: { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF1E40AF' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 7, curRow, 11, {
      font: { name: 'Calibri', size: 9, color: { argb: 'FF334155' } },
      alignment: { vertical: 'middle', indent: 1 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
    })
    curRow++
  })

  ws1.getRow(curRow++).height = 10 // Spacing

  // 4. Section II: Master Registry Table
  const sec2Title = ws1.getRow(curRow)
  sec2Title.height = 26
  sec2Title.getCell(1).value = 'II. MASTER FIRST-TIME JOBSEEKER CERTIFICATE REGISTRY'
  ws1.mergeCells(`A${curRow}:K${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 11, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10.5, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  curRow++

  // Registry Table Headers (11 columns)
  const regHeaders = [
    '#',
    'Application No.',
    'Applicant Name',
    'Sex / Age',
    'Educational Attainment',
    'Institution / School',
    'Stated Purpose',
    'Issuance Type',
    'Status',
    'Date Submitted',
    'Verified / Released By',
  ]

  const regHeaderRow = ws1.getRow(curRow)
  regHeaderRow.height = 25
  regHeaders.forEach((h, i) => {
    const c = regHeaderRow.getCell(i + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.font = { name: 'Calibri', bold: true, size: 9, color: { argb: COLORS.headerText } }
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 2 || i === 4 || i === 5 || i === 6 ? 'left' : 'center',
      indent: i === 2 || i === 4 || i === 5 || i === 6 ? 1 : 0,
    }
    c.border = thinBorder
  })
  curRow++

  // Registry Data Rows
  if (tableRecords.length > 0) {
    tableRecords.forEach((record, index) => {
      const row = ws1.getRow(curRow)
      row.height = 22
      const isEven = index % 2 === 1
      const isReissuance =
        record?.status === 'RE_ISSUANCE' ||
        (record?.issuanceCount != null && record.issuanceCount > 1)
      const issuanceType = isReissuance ? 'Re-issuance' : '1st Issuance'
      const statusText = isReissuance ? 'RE_ISSUANCE' : record?.status || 'ISSUED'

      const genderVal = record?.gender || (record as any)?.sex
      const ageVal = record?.age ? `${record.age}y` : ''
      const sexAge = [genderVal, ageVal].filter(Boolean).join(' / ') || '—'

      const rawDate =
        record?.dateSubmitted ||
        (record as any)?.dateFiled ||
        (record as any)?.dateReleased ||
        (record as any)?.createdAt
      const submittedDate = rawDate ? formatDate(rawDate) : '—'

      const rowValues = [
        index + 1,
        record.applicationNo || (record as any)?.ftjsNumber || '—',
        record.applicantName || (record as any)?.fullName || '—',
        sexAge,
        record.educationalAttainment || (record as any)?.education || '—',
        record.institution || (record as any)?.schoolInstitution || '—',
        record.purpose || 'First Time Jobseeker Requirement',
        issuanceType,
        statusText,
        submittedDate,
        record.releasedBy || (record as any)?.verifiedBy || preparedByName,
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
          horizontal: i === 2 || i === 4 || i === 5 || i === 6 ? 'left' : 'center',
          indent: i === 2 || i === 4 || i === 5 || i === 6 ? 1 : 0,
        }

        if (i === 8) {
          cell.font = {
            name: 'Calibri',
            bold: true,
            size: 8.5,
            color: { argb: isReissuance ? COLORS.amberBadge : COLORS.activeGreen },
          }
        }
      })
      curRow++
    })
  } else {
    const emptyRow = ws1.getRow(curRow)
    emptyRow.height = 24
    emptyRow.getCell(1).value =
      'No first-time jobseeker records found matching the applied date range and filter criteria.'
    ws1.mergeCells(`A${curRow}:K${curRow}`)
    styleMergedCells(ws1, curRow, 1, curRow, 11, {
      font: { name: 'Calibri', italic: true, size: 9.5, color: { argb: COLORS.textMuted } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    curRow++
  }

  curRow += 2 // Spacing

  // Signatories Block
  const sigRow1 = ws1.getRow(curRow)
  sigRow1.height = 20
  sigRow1.getCell(2).value = `PREPARED BY: ${preparedByName.toUpperCase()}`
  sigRow1.getCell(7).value = 'NOTED BY: HON. MARICEL PINEDA-EMPERADOR'
  ws1.mergeCells(`B${curRow}:E${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 2, curRow, 5, {
    font: { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 10, {
    font: { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  })
  curRow++

  const sigRow2 = ws1.getRow(curRow)
  sigRow2.height = 16
  sigRow2.getCell(2).value = 'FTJS Desk Officer / Records Custodian'
  sigRow2.getCell(7).value = 'Punong Barangay · Barangay Ugong'
  ws1.mergeCells(`B${curRow}:E${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 2, curRow, 5, {
    font: { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 10, {
    font: { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  })

  // =============================================================
  // SHEET 2: SUMMARY ANALYTICS BREAKDOWN
  // =============================================================
  const ws2 = wb.addWorksheet('Summary Analytics', {
    views: [{ showGridLines: true }],
  })

  ws2.columns = [
    { key: 'col1', width: 42 }, // Category / Name
    { key: 'col2', width: 18 }, // Volume / Count
    { key: 'col3', width: 18 }, // Share (%)
    { key: 'col4', width: 36 }, // Statutory Note / Benefit
  ]

  let r2 = 2

  // Sheet 2 Title
  ws2.mergeCells(r2, 1, r2, 4)
  const s2Hdr = ws2.getCell(r2, 1)
  s2Hdr.value = 'BARANGAY UGONG - FIRST-TIME JOBSEEKER SUMMARY ANALYTICS'
  s2Hdr.font = { name: 'Calibri', bold: true, size: 12, color: { argb: COLORS.headerBg } }
  s2Hdr.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws2.getRow(r2).height = 24
  r2 += 2

  // 1. Educational Attainment Table
  ws2.mergeCells(r2, 1, r2, 4)
  styleMergedCells(ws2, r2, 1, r2, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    border: thinBorder,
  })
  ws2.getCell(r2, 1).value = 'I. EDUCATIONAL ATTAINMENT DISTRIBUTION'
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
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 0 || i === 3 ? 'left' : 'center',
      indent: i === 0 || i === 3 ? 1 : 0,
    }
    c.border = thinBorder
  })
  r2++

  const eduPoints = educationData?.points || []
  const eduTotal =
    educationData?.totalVolume ||
    eduPoints.reduce((acc: number, p: any) => acc + (p.applicantCount || 0), 0) ||
    1

  if (eduPoints.length > 0) {
    eduPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const count = p.applicantCount || 0
      const shareVal =
        typeof (p as any).share === 'number'
          ? (p as any).share
          : eduTotal > 0
          ? (count / eduTotal) * 100
          : 0
      const vals = [
        p.educationalAttainment || '—',
        count,
        `${shareVal.toFixed(1)}%`,
        'RA 11261 Beneficiary',
      ]
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        c.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 ? 'left' : 'center',
          indent: i === 0 || i === 3 ? 1 : 0,
        }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    styleMergedCells(ws2, r2, 1, r2, 4, {
      font: { italic: true, size: 9, color: { argb: COLORS.textMuted } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    ws2.getCell(r2, 1).value = 'No educational attainment records for period'
    ws2.getRow(r2).height = 20
    r2++
  }

  r2 += 2 // Empty spacer

  // 2. Purpose Distribution Table
  ws2.mergeCells(r2, 1, r2, 4)
  styleMergedCells(ws2, r2, 1, r2, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    border: thinBorder,
  })
  ws2.getCell(r2, 1).value = 'II. PURPOSE OF REQUEST BREAKDOWN'
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
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 0 || i === 3 ? 'left' : 'center',
      indent: i === 0 || i === 3 ? 1 : 0,
    }
    c.border = thinBorder
  })
  r2++

  const purpPoints = purposeData?.points || []
  const purpTotal =
    purposeData?.totalVolume ||
    purpPoints.reduce((acc: number, p: any) => acc + (p.count || 0), 0) ||
    1

  if (purpPoints.length > 0) {
    purpPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const count = p.count || 0
      const shareVal =
        typeof p.share === 'number'
          ? p.share
          : purpTotal > 0
          ? (count / purpTotal) * 100
          : 0
      const vals = [p.purpose || '—', count, `${shareVal.toFixed(1)}%`, 'RA 11261 Pre-Employment']
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        c.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 ? 'left' : 'center',
          indent: i === 0 || i === 3 ? 1 : 0,
        }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    styleMergedCells(ws2, r2, 1, r2, 4, {
      font: { italic: true, size: 9, color: { argb: COLORS.textMuted } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    ws2.getCell(r2, 1).value = 'No purpose distribution records for period'
    ws2.getRow(r2).height = 20
    r2++
  }

  r2 += 2 // Empty spacer

  // 3. Original vs Re-issuance Table
  ws2.mergeCells(r2, 1, r2, 4)
  styleMergedCells(ws2, r2, 1, r2, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
    border: thinBorder,
  })
  ws2.getCell(r2, 1).value = 'III. ISSUANCE TYPE DISTRIBUTION (ORIGINAL VS. RE-ISSUANCE)'
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
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 0 || i === 3 ? 'left' : 'center',
      indent: i === 0 || i === 3 ? 1 : 0,
    }
    c.border = thinBorder
  })
  r2++

  const issPoints = issuanceData?.points || []
  const totalIssuanceVol =
    issuanceData?.totalVolume ||
    issPoints.reduce((acc: number, p: any) => acc + (p.count || 0), 0) ||
    1

  if (issPoints.length > 0) {
    issPoints.forEach((p, idx) => {
      const row = ws2.getRow(r2)
      row.height = 20
      const typeLabel = p.typeLabel || 'Unknown'
      const isReiss =
        typeLabel.toLowerCase().includes('re-issuance') ||
        typeLabel.toLowerCase().includes('reissuance')
      const count = p.count || 0
      const shareVal =
        typeof p.share === 'number'
          ? p.share
          : totalIssuanceVol > 0
          ? (count / totalIssuanceVol) * 100
          : 0
      const vals = [
        typeLabel,
        count,
        `${shareVal.toFixed(1)}%`,
        isReiss ? 'Subsequent Re-issue (Lost/Damaged)' : 'Initial 1-Time Benefit',
      ]
      vals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 9, color: { argb: 'FF0F172A' } }
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        c.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 ? 'left' : 'center',
          indent: i === 0 || i === 3 ? 1 : 0,
        }
        c.border = thinBorder
      })
      r2++
    })
  } else {
    ws2.mergeCells(r2, 1, r2, 4)
    styleMergedCells(ws2, r2, 1, r2, 4, {
      font: { italic: true, size: 9, color: { argb: COLORS.textMuted } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    ws2.getCell(r2, 1).value = 'No issuance classification records for period'
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
