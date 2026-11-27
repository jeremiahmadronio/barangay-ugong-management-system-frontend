import ExcelJS from 'exceljs'
import { formatDate } from '@/utils/formatters'
import type {
  ClearanceReportKpiResponse,
  ClearanceDashboardKpiResponse,
  IssuedCertificateTableResponse,
} from '@/config/api/clearance/clearance.types'

interface ExportClearanceExcelParams {
  filteredRecords: IssuedCertificateTableResponse[]
  kpiData: ClearanceReportKpiResponse | null
  dashboardKpi?: ClearanceDashboardKpiResponse | null
  typeBreakdown?: Array<{ name: string; count: number; percentage: number }>
  appliedFilters: { dateFrom: string; dateTo: string }
  user: any
}

const formatRequestorName = (rawName?: string) => {
  if (!rawName || !rawName.trim()) return 'Unknown Requestor'
  const name = rawName.trim()
  if (name.includes(',')) return name
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`
  if (parts.length >= 3) {
    const last = parts[parts.length - 1]
    const first = parts[0]
    const middle = parts[1]
    return `${last}, ${first} ${middle.charAt(0).toUpperCase()}.`
  }
  return name
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
  expiredAmber: 'FFD97706', // Amber-600
  textMuted: 'FF64748B', // Slate-500
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderColor } },
  left: { style: 'thin', color: { argb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
  right: { style: 'thin', color: { argb: COLORS.borderColor } },
}

export async function exportClearanceExcel({
  filteredRecords,
  kpiData,
  dashboardKpi,
  typeBreakdown = [],
  appliedFilters,
  user,
}: ExportClearanceExcelParams): Promise<void> {
  const preparedByName = (user as any)?.fullName || (user as any)?.name || 'Clearance Processing Officer'
  const dateRangeLabel = appliedFilters.dateFrom && appliedFilters.dateTo
    ? `${appliedFilters.dateFrom} to ${appliedFilters.dateTo}`
    : 'All Recorded Dates'

  const generatedDateTimeText = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const totalIssued = kpiData?.totalIssued ?? 0
  const mostIssuedName = kpiData?.mostIssuedCertName && kpiData.mostIssuedCertName !== '—' && kpiData.mostIssuedCertName !== '-'
    ? kpiData.mostIssuedCertName
    : 'Barangay Clearance'
  const mostIssuedCount = kpiData?.mostIssuedCertCount ?? 0
  const totalExpired = kpiData?.totalExpired ?? 0
  const maleCount = kpiData?.maleCount ?? 0
  const femaleCount = kpiData?.femaleCount ?? 0
  const malePct = kpiData ? kpiData.malePercentage.toFixed(1) : '0.0'
  const femalePct = kpiData ? kpiData.femalePercentage.toFixed(1) : '0.0'

  const totalActiveCirculation = dashboardKpi?.totalActiveClearances ?? Math.max(totalIssued - totalExpired, 0)
  const totalIssuedToday = dashboardKpi?.totalIssuedToday ?? 0
  const totalIssuedThisWeek = dashboardKpi?.totalIssuedThisWeek ?? 0

  // Audit breakdown
  let paidWithOrCount = 0
  let ftjsExemptCount = 0
  let indigencyExemptCount = 0
  let generalExemptCount = 0

  filteredRecords.forEach((r) => {
    const lowerTitle = (r.certTitle || '').toLowerCase()
    const lowerPurpose = (r.purpose || '').toLowerCase()

    if (r.orNumber && r.orNumber.trim() && r.orNumber !== '—' && r.orNumber !== '-') {
      paidWithOrCount++
    } else if (
      lowerTitle.includes('first time') ||
      lowerPurpose.includes('first time') ||
      lowerPurpose.includes('ftjs') ||
      lowerPurpose.includes('11261')
    ) {
      ftjsExemptCount++
    } else if (
      lowerTitle.includes('indigen') ||
      lowerPurpose.includes('indigen') ||
      lowerPurpose.includes('financial')
    ) {
      indigencyExemptCount++
    } else {
      generalExemptCount++
    }
  })

  const totalExempted = ftjsExemptCount + indigencyExemptCount + generalExemptCount

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Barangay Information System'
  wb.created = new Date()
  wb.properties.date1904 = true

  // -------------------------------------------------------------
  // HELPER: APPLY UNIFORM BORDER & FILL TO A RANGE OR CELL
  // -------------------------------------------------------------
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
  // SHEET 1: OFFICIAL CLEARANCE REPORTS (MASTER EXECUTIVE & REGISTRY)
  // =============================================================
  const ws1 = wb.addWorksheet('Clearance Reports', {
    views: [{ showGridLines: true }],
  })

  ws1.columns = [
    { key: 'col1', width: 6 },   // A: #
    { key: 'col2', width: 22 },  // B: Clearance No.
    { key: 'col3', width: 30 },  // C: Applicant Name
    { key: 'col4', width: 26 },  // D: Certificate Type
    { key: 'col5', width: 28 },  // E: Stated Purpose
    { key: 'col6', width: 18 },  // F: O.R. Number
    { key: 'col7', width: 22 },  // G: Fee Status
    { key: 'col8', width: 16 },  // H: Date Issued
    { key: 'col9', width: 16 },  // I: Valid Until
    { key: 'col10', width: 15 }, // J: Status
  ]

  let curRow = 1

  // 1. Official Barangay Letterhead (Standard Philippine Government Multi-tier Header)
  const hRow1 = ws1.getRow(curRow++)
  hRow1.height = 16
  hRow1.getCell(1).value = 'Republika ng Pilipinas'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow2 = ws1.getRow(curRow++)
  hRow2.height = 16
  hRow2.getCell(1).value = 'Lungsod ng Valenzuela'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow3 = ws1.getRow(curRow++)
  hRow3.height = 22
  hRow3.getCell(1).value = 'BARANGAY UGONG'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow4 = ws1.getRow(curRow++)
  hRow4.height = 18
  hRow4.getCell(1).value = 'TANGGAPAN NG PUNONG BARANGAY'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow5 = ws1.getRow(curRow++)
  hRow5.height = 16
  hRow5.getCell(1).value = 'Clearance & Permitting Regulatory Section'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  ws1.getRow(curRow++).height = 8 // Spacer

  const hRowTitle = ws1.getRow(curRow++)
  hRowTitle.height = 28
  hRowTitle.getCell(1).value = 'OFFICIAL CLEARANCE & CERTIFICATION ISSUANCE REPORT'
  ws1.mergeCells(`A${curRow - 1}:J${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 10, {
    font: { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  ws1.getRow(curRow++).height = 10 // Spacing

  // 2. Metadata Cards (Report Coverage, Date, Reporting Officer, Total Records)
  const metaRow1 = ws1.getRow(curRow)
  metaRow1.height = 22
  metaRow1.getCell(1).value = 'Report Period:'
  metaRow1.getCell(2).value = dateRangeLabel
  metaRow1.getCell(6).value = 'Generated On:'
  metaRow1.getCell(7).value = generatedDateTimeText
  ws1.mergeCells(`B${curRow}:E${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 1, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 2, curRow, 5, {
    font: { bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 6, curRow, 6, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 10, {
    font: { size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  curRow++

  const metaRow2 = ws1.getRow(curRow)
  metaRow2.height = 22
  metaRow2.getCell(1).value = 'Reporting Officer:'
  metaRow2.getCell(2).value = preparedByName
  metaRow2.getCell(6).value = 'Total Records:'
  metaRow2.getCell(7).value = `${filteredRecords.length.toLocaleString()} Certificate(s)`
  ws1.mergeCells(`B${curRow}:E${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 1, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 2, curRow, 5, {
    font: { bold: true, size: 9.5, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 6, curRow, 6, {
    font: { bold: true, size: 9.5, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle' },
  })
  styleMergedCells(ws1, curRow, 7, curRow, 10, {
    font: { bold: true, size: 9.5, color: { argb: 'FF1E40AF' } },
    alignment: { vertical: 'middle' },
  })
  curRow++

  ws1.getRow(curRow++).height = 10 // Spacing

  // =============================================================
  // SECTION I: EXECUTIVE OPERATIONAL & VOLUME SUMMARY
  // =============================================================
  const sec1Title = ws1.getRow(curRow)
  sec1Title.height = 26
  sec1Title.getCell(1).value = 'I. EXECUTIVE OPERATIONAL & VOLUME SUMMARY'
  ws1.mergeCells(`A${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10.5, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  curRow++

  // Table 1 Header
  const t1Header = ws1.getRow(curRow)
  t1Header.height = 25
  t1Header.getCell(1).value = 'OPERATIONAL METRIC INDICATOR'
  t1Header.getCell(5).value = 'RECORDED METRIC'
  t1Header.getCell(7).value = 'ADMINISTRATIVE & AUDIT DESCRIPTION'
  ws1.mergeCells(`A${curRow}:D${curRow}`)
  ws1.mergeCells(`E${curRow}:F${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { bold: true, size: 9.5, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  curRow++

  const kpiRows = [
    {
      metric: 'Total Issued Clearances in Period',
      val: totalIssued.toLocaleString(),
      desc: 'Clearances released within requested period',
    },
    {
      metric: 'Active Clearances in Legal Circulation',
      val: totalActiveCirculation.toLocaleString(),
      desc: 'Valid within 6-month statutory validity period',
    },
    {
      metric: 'Total Expired / Lapsed Clearances',
      val: totalExpired.toLocaleString(),
      desc: 'Lapsed beyond validity period and require renewal',
    },
    {
      metric: 'Applicant Demographics (Gender)',
      val: `${maleCount} Male / ${femaleCount} Female`,
      desc: `${malePct}% Male, ${femalePct}% Female applicants`,
    },
    {
      metric: 'Most Requested Clearance Template',
      val: `${mostIssuedName} (${mostIssuedCount})`,
      desc: 'Highest requested certification category',
    },
    {
      metric: 'Recent Issuance Operations Velocity',
      val: `${totalIssuedToday} Today / ${totalIssuedThisWeek} This Week`,
      desc: 'Clearance desk daily and weekly processing volume',
    },
  ]

  kpiRows.forEach((item, idx) => {
    const r = ws1.getRow(curRow)
    r.height = 22
    r.getCell(1).value = item.metric
    r.getCell(5).value = item.val
    r.getCell(7).value = item.desc
    ws1.mergeCells(`A${curRow}:D${curRow}`)
    ws1.mergeCells(`E${curRow}:F${curRow}`)
    ws1.mergeCells(`G${curRow}:J${curRow}`)

    const isZebra = idx % 2 === 1
    const bg = isZebra ? COLORS.zebraRow : 'FFFFFFFF'

    styleMergedCells(ws1, curRow, 1, curRow, 4, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { size: 9.5, color: { argb: 'FF0F172A' } },
      alignment: { vertical: 'middle', indent: 1 },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 5, curRow, 6, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { bold: true, size: 9.5, color: { argb: 'FF1E40AF' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 7, curRow, 10, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { size: 9, color: { argb: 'FF475569' } },
      alignment: { vertical: 'middle', indent: 1 },
      border: thinBorder,
    })
    curRow++
  })

  ws1.getRow(curRow++).height = 10 // Spacing

  // =============================================================
  // SECTION II: STATUTORY FEE COLLECTION & EXEMPTION AUDIT
  // =============================================================
  const sec2Title = ws1.getRow(curRow)
  sec2Title.height = 26
  sec2Title.getCell(1).value = 'II. STATUTORY FEE COLLECTION & EXEMPTION AUDIT'
  ws1.mergeCells(`A${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10.5, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  curRow++

  // Table 2 Header
  const t2Header = ws1.getRow(curRow)
  t2Header.height = 25
  t2Header.getCell(1).value = 'FEE CATEGORY / EXEMPTION STATUS'
  t2Header.getCell(5).value = 'VOLUME ISSUED'
  t2Header.getCell(7).value = 'STATUTORY EXEMPTION AUTHORITY & ACCOUNTING REFERENCE'
  ws1.mergeCells(`A${curRow}:D${curRow}`)
  ws1.mergeCells(`E${curRow}:F${curRow}`)
  ws1.mergeCells(`G${curRow}:J${curRow}`)

  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { bold: true, size: 9.5, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  curRow++

  const feeRows = [
    {
      category: 'Paid Clearances (Official Receipts Issued)',
      val: paidWithOrCount.toLocaleString(),
      desc: 'Official Barangay Revenue Collection with verified O.R.',
    },
    {
      category: 'First-Time Jobseekers Act Waivers',
      val: ftjsExemptCount.toLocaleString(),
      desc: 'Republic Act No. 11261 (Issued 100% Free of Charge)',
    },
    {
      category: 'Indigency & Social Welfare Waivers',
      val: indigencyExemptCount.toLocaleString(),
      desc: 'Social Welfare Assistance Exemption for indigent constituents',
    },
    {
      category: 'General Statutory & Emergency Waivers',
      val: generalExemptCount.toLocaleString(),
      desc: 'Senior Citizens, PWDs, Solo Parents, or Sangguniang Resolution waivers',
    },
    {
      category: 'Total Exempted / Free Clearances',
      val: totalExempted.toLocaleString(),
      desc: 'Total fee-exempted releases (O.R. not required)',
    },
  ]

  feeRows.forEach((item, idx) => {
    const r = ws1.getRow(curRow)
    r.height = 22
    r.getCell(1).value = item.category
    r.getCell(5).value = item.val
    r.getCell(7).value = item.desc
    ws1.mergeCells(`A${curRow}:D${curRow}`)
    ws1.mergeCells(`E${curRow}:F${curRow}`)
    ws1.mergeCells(`G${curRow}:J${curRow}`)

    const isZebra = idx % 2 === 1
    const bg = isZebra ? COLORS.zebraRow : 'FFFFFFFF'

    styleMergedCells(ws1, curRow, 1, curRow, 4, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { size: 9.5, color: { argb: 'FF0F172A' } },
      alignment: { vertical: 'middle', indent: 1 },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 5, curRow, 6, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { bold: true, size: 9.5, color: { argb: 'FF1E40AF' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    styleMergedCells(ws1, curRow, 7, curRow, 10, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      font: { size: 9, color: { argb: 'FF475569' } },
      alignment: { vertical: 'middle', indent: 1 },
      border: thinBorder,
    })
    curRow++
  })

  ws1.getRow(curRow++).height = 10 // Spacing

  // =============================================================
  // SECTION III: DETAILED CLEARANCE ISSUANCE REGISTRY
  // =============================================================
  const sec3Title = ws1.getRow(curRow)
  sec3Title.height = 26
  sec3Title.getCell(1).value = `III. DETAILED CLEARANCE ISSUANCE REGISTRY (${filteredRecords.length.toLocaleString()} RECORDS)`
  ws1.mergeCells(`A${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10.5, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  curRow++

  // Registry Table Headers (10 columns)
  const regHeaders = [
    '#',
    'Clearance No.',
    'Applicant Name',
    'Certificate Type',
    'Stated Purpose',
    'O.R. Number',
    'Fee / Exemption Status',
    'Date Issued',
    'Valid Until',
    'Status',
  ]

  const regHeaderRow = ws1.getRow(curRow)
  regHeaderRow.height = 26
  regHeaders.forEach((h, i) => {
    const c = regHeaderRow.getCell(i + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: COLORS.headerText } }
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 2 || i === 3 || i === 4 ? 'left' : 'center',
      indent: i === 2 || i === 3 || i === 4 ? 1 : 0,
    }
    c.border = thinBorder
  })
  curRow++

  // Registry Data Rows
  filteredRecords.forEach((r, idx) => {
    let feeLabel = 'Exempted / Free'
    if (r.orNumber && r.orNumber.trim() && r.orNumber !== '—' && r.orNumber !== '-') {
      feeLabel = `Paid (O.R. #${r.orNumber})`
    } else {
      const lowerT = (r.certTitle || '').toLowerCase()
      const lowerP = (r.purpose || '').toLowerCase()
      if (lowerT.includes('first time') || lowerP.includes('first time') || lowerP.includes('ftjs')) {
        feeLabel = 'RA 11261 (FTJS)'
      } else if (lowerT.includes('indigen') || lowerP.includes('indigen')) {
        feeLabel = 'Indigency Exempt'
      } else {
        feeLabel = 'Fee Exempt'
      }
    }

    const expiryFormatted = r.expiryDate ? formatDate(r.expiryDate) : '6 Mos. Standard'
    const statusText = (r.status || 'ACTIVE').toUpperCase()
    const isZebra = idx % 2 === 1
    const bg = isZebra ? COLORS.zebraRow : 'FFFFFFFF'

    const dataRow = ws1.getRow(curRow)
    dataRow.height = 22

    const rowValues = [
      idx + 1,
      r.certNumber || '-',
      formatRequestorName(r.requestorName),
      r.certTitle || '-',
      r.purpose || 'General Purpose',
      r.orNumber || '-',
      feeLabel,
      formatDate(r.createdAt),
      expiryFormatted,
      statusText,
    ]

    rowValues.forEach((val, i) => {
      const c = dataRow.getCell(i + 1)
      c.value = val
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      c.border = thinBorder

      // Column-specific font and alignment
      if (i === 0) {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF64748B' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (i === 1) {
        c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF1E40AF' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (i === 2) {
        c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } }
        c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      } else if (i === 3 || i === 4) {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } }
        c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      } else if (i === 9) {
        const isAct = statusText === 'ACTIVE' || statusText === 'RELEASED' || statusText === 'ISSUED'
        c.font = {
          name: 'Calibri',
          bold: true,
          size: 9.5,
          color: { argb: isAct ? COLORS.activeGreen : COLORS.expiredAmber },
        }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })

    curRow++
  })

  if (filteredRecords.length === 0) {
    const emptyRow = ws1.getRow(curRow)
    emptyRow.height = 24
    emptyRow.getCell(1).value = 'No clearance records found matching the applied filter criteria.'
    ws1.mergeCells(`A${curRow}:J${curRow}`)
    styleMergedCells(ws1, curRow, 1, curRow, 10, {
      font: { italic: true, size: 9.5, color: { argb: COLORS.textMuted } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: thinBorder,
    })
    curRow++
  }

  ws1.getRow(curRow++).height = 14 // Spacing

  // =============================================================
  // LEGAL ATTESTATION
  // =============================================================
  const attestRow = ws1.getRow(curRow)
  attestRow.height = 36
  attestRow.getCell(1).value =
    'LEGAL ATTESTATION: I HEREBY CERTIFY under official oath that the foregoing clearance report, statistical distributions, and registry logs have been duly verified from the computerized records of Barangay Ugong, Valenzuela City, in accordance with the Local Government Code of 1991 (R.A. 7160).'
  ws1.mergeCells(`A${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
    font: { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF475569' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: thinBorder,
  })
  curRow += 2

  // =============================================================
  // SIGNATORIES BLOCK (3-COLUMN HARMONIZED WITH BARANGAY OFFICIALS)
  // =============================================================
  const sigRow1 = ws1.getRow(curRow)
  sigRow1.height = 18
  sigRow1.getCell(1).value = 'Prepared By:'
  sigRow1.getCell(4).value = 'Certified Correct:'
  sigRow1.getCell(8).value = 'Approved By:'
  ws1.mergeCells(`A${curRow}:C${curRow}`)
  ws1.mergeCells(`D${curRow}:G${curRow}`)
  ws1.mergeCells(`H${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    font: { size: 9, bold: true, color: { argb: 'FF64748B' } },
    alignment: { vertical: 'middle', indent: 1 },
  })
  curRow++

  const sigRow2 = ws1.getRow(curRow)
  sigRow2.height = 22
  sigRow2.getCell(1).value = preparedByName.toUpperCase()
  sigRow2.getCell(4).value = 'ROSALINDA R. MENDOZA'
  sigRow2.getCell(8).value = 'HON. MARICEL PINEDA-EMPERADOR'
  ws1.mergeCells(`A${curRow}:C${curRow}`)
  ws1.mergeCells(`D${curRow}:G${curRow}`)
  ws1.mergeCells(`H${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    font: { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', indent: 1 },
  })
  curRow++

  const sigRow3 = ws1.getRow(curRow)
  sigRow3.height = 18
  sigRow3.getCell(1).value = 'Clearance Processing Officer'
  sigRow3.getCell(4).value = 'Barangay Secretary'
  sigRow3.getCell(8).value = 'Punong Barangay'
  ws1.mergeCells(`A${curRow}:C${curRow}`)
  ws1.mergeCells(`D${curRow}:G${curRow}`)
  ws1.mergeCells(`H${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    font: { size: 9, color: { argb: 'FF334155' } },
    alignment: { vertical: 'middle', indent: 1 },
  })
  curRow++

  const sigRow4 = ws1.getRow(curRow)
  sigRow4.height = 18
  sigRow4.getCell(1).value = 'Clearance & Permitting Section'
  sigRow4.getCell(4).value = 'Sangguniang Barangay ng Ugong'
  sigRow4.getCell(8).value = 'Barangay Ugong, Valenzuela City'
  ws1.mergeCells(`A${curRow}:C${curRow}`)
  ws1.mergeCells(`D${curRow}:G${curRow}`)
  ws1.mergeCells(`H${curRow}:J${curRow}`)
  styleMergedCells(ws1, curRow, 1, curRow, 10, {
    font: { size: 8.5, color: { argb: 'FF64748B' } },
    alignment: { vertical: 'middle', indent: 1 },
  })
  curRow++

  // =============================================================
  // SHEET 2: REGISTRY RAW DATA (FLAT TABLE WITH NATIVE AUTOFILTER)
  // =============================================================
  const ws2 = wb.addWorksheet('Registry Raw Data', {
    views: [{ showGridLines: true }],
  })

  ws2.columns = [
    { key: 'col1', width: 6 },
    { key: 'col2', width: 22 },
    { key: 'col3', width: 30 },
    { key: 'col4', width: 26 },
    { key: 'col5', width: 28 },
    { key: 'col6', width: 18 },
    { key: 'col7', width: 22 },
    { key: 'col8', width: 16 },
    { key: 'col9', width: 16 },
    { key: 'col10', width: 15 },
  ]

  const ws2Header = ws2.getRow(1)
  ws2Header.height = 26
  regHeaders.forEach((h, i) => {
    const c = ws2Header.getCell(i + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: COLORS.headerText } }
    c.alignment = {
      vertical: 'middle',
      horizontal: i === 2 || i === 3 || i === 4 ? 'left' : 'center',
      indent: i === 2 || i === 3 || i === 4 ? 1 : 0,
    }
    c.border = thinBorder
  })

  filteredRecords.forEach((r, idx) => {
    let feeLabel = 'Exempted / Free'
    if (r.orNumber && r.orNumber.trim() && r.orNumber !== '—' && r.orNumber !== '-') {
      feeLabel = `Paid (O.R. #${r.orNumber})`
    } else {
      const lowerT = (r.certTitle || '').toLowerCase()
      const lowerP = (r.purpose || '').toLowerCase()
      if (lowerT.includes('first time') || lowerP.includes('first time') || lowerP.includes('ftjs')) {
        feeLabel = 'RA 11261 (FTJS)'
      } else if (lowerT.includes('indigen') || lowerP.includes('indigen')) {
        feeLabel = 'Indigency Exempt'
      } else {
        feeLabel = 'Fee Exempt'
      }
    }

    const expiryFormatted = r.expiryDate ? formatDate(r.expiryDate) : '6 Mos. Standard'
    const statusText = (r.status || 'ACTIVE').toUpperCase()
    const isZebra = idx % 2 === 1
    const bg = isZebra ? COLORS.zebraRow : 'FFFFFFFF'

    const row = ws2.getRow(idx + 2)
    row.height = 22

    const values = [
      idx + 1,
      r.certNumber || '-',
      formatRequestorName(r.requestorName),
      r.certTitle || '-',
      r.purpose || 'General Purpose',
      r.orNumber || '-',
      feeLabel,
      formatDate(r.createdAt),
      expiryFormatted,
      statusText,
    ]

    values.forEach((val, i) => {
      const c = row.getCell(i + 1)
      c.value = val
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      c.border = thinBorder

      if (i === 0) {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF64748B' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (i === 1) {
        c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF1E40AF' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (i === 2) {
        c.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0F172A' } }
        c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      } else if (i === 3 || i === 4) {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } }
        c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      } else if (i === 9) {
        const isAct = statusText === 'ACTIVE' || statusText === 'RELEASED' || statusText === 'ISSUED'
        c.font = {
          name: 'Calibri',
          bold: true,
          size: 9.5,
          color: { argb: isAct ? COLORS.activeGreen : COLORS.expiredAmber },
        }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      } else {
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } }
        c.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })
  })

  ws2.autoFilter = `A1:J${Math.max(filteredRecords.length + 1, 2)}`

  // =============================================================
  // SHEET 3: EXECUTIVE AUDIT & TYPE BREAKDOWN
  // =============================================================
  const ws3 = wb.addWorksheet('Executive Audit', {
    views: [{ showGridLines: true }],
  })

  ws3.columns = [
    { key: 'col1', width: 44 },
    { key: 'col2', width: 20 },
    { key: 'col3', width: 22 },
    { key: 'col4', width: 55 },
  ]

  let r3 = 1

  const s3Title = ws3.getRow(r3)
  s3Title.height = 28
  s3Title.getCell(1).value = 'BARANGAY UGONG, VALENZUELA CITY - CLEARANCE EXECUTIVE AUDIT'
  ws3.mergeCells(`A${r3}:D${r3}`)
  styleMergedCells(ws3, r3, 1, r3, 4, {
    font: { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle' },
  })
  r3++

  const s3Sub = ws3.getRow(r3)
  s3Sub.height = 20
  s3Sub.getCell(1).value = `Report Period: ${dateRangeLabel}  |  Generated On: ${generatedDateTimeText}`
  ws3.mergeCells(`A${r3}:D${r3}`)
  styleMergedCells(ws3, r3, 1, r3, 4, {
    font: { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF64748B' } },
    alignment: { vertical: 'middle' },
  })
  r3++

  ws3.getRow(r3++).height = 10 // Spacing

  // Section 1: Operational Metrics
  const s3Sec1 = ws3.getRow(r3)
  s3Sec1.height = 24
  s3Sec1.getCell(1).value = 'I. OPERATIONAL VOLUME & PERFORMANCE SUMMARY'
  ws3.mergeCells(`A${r3}:D${r3}`)
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  r3++

  const s3H1 = ws3.getRow(r3)
  s3H1.height = 24
  s3H1.getCell(1).value = 'Operational Metric Indicator'
  s3H1.getCell(2).value = 'Recorded Value'
  s3H1.getCell(3).value = 'Period Share / Status'
  s3H1.getCell(4).value = 'Administrative & Audit Description'
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { bold: true, size: 9.5, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  r3++

  const s3KpiData = [
    ['Total Clearances Released in Period', totalIssued, '100.0%', 'Clearance certificates processed and released within requested period'],
    ['Active Clearances in Legal Circulation', totalActiveCirculation, `${totalIssued > 0 ? ((totalActiveCirculation / totalIssued) * 100).toFixed(1) : 0}%`, 'Currently valid within 6-month statutory validity period'],
    ['Total Expired / Inactive Clearances', totalExpired, `${totalIssued > 0 ? ((totalExpired / totalIssued) * 100).toFixed(1) : 0}%`, 'Certificates that have lapsed beyond validity and require renewal'],
    ['Applicant Demographics (Gender)', `${maleCount} Male / ${femaleCount} Female`, `${malePct}% M / ${femalePct}% F`, 'Constituent demographics from verified database records'],
    ['Most Requested Clearance Template', mostIssuedName, `${mostIssuedCount} certificates issued`, 'Highest volume certificate category'],
    ['Recent Operations Velocity', `${totalIssuedToday} Today / ${totalIssuedThisWeek} This Week`, 'Active Operations', 'Current day and 7-day rolling issuance count'],
  ]

  s3KpiData.forEach((rowVals, idx) => {
    const row = ws3.getRow(r3)
    row.height = 22
    rowVals.forEach((val, i) => {
      const c = row.getCell(i + 1)
      c.value = val
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
      c.border = thinBorder
      c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } }
      c.alignment = {
        vertical: 'middle',
        horizontal: i === 0 || i === 3 ? 'left' : 'center',
        indent: i === 0 || i === 3 ? 1 : 0,
      }
    })
    r3++
  })

  ws3.getRow(r3++).height = 10 // Spacing

  // Section 2: Statutory Fee Collection & Exemption
  const s3Sec2 = ws3.getRow(r3)
  s3Sec2.height = 24
  s3Sec2.getCell(1).value = 'II. STATUTORY FEE COLLECTION & EXEMPTION AUDIT'
  ws3.mergeCells(`A${r3}:D${r3}`)
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  r3++

  const s3H2 = ws3.getRow(r3)
  s3H2.height = 24
  s3H2.getCell(1).value = 'Fee Category / Exemption Status'
  s3H2.getCell(2).value = 'Volume Issued'
  s3H2.getCell(3).value = 'Share (%)'
  s3H2.getCell(4).value = 'Statutory Authority & Accounting Reference'
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { bold: true, size: 9.5, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  r3++

  const s3FeeData = [
    ['Paid Clearances (Official Receipts Issued)', paidWithOrCount, `${totalIssued > 0 ? ((paidWithOrCount / totalIssued) * 100).toFixed(1) : 0}%`, 'Official Barangay Revenue Collection with verified O.R. Number'],
    ['First-Time Jobseekers Act Waivers', ftjsExemptCount, `${totalIssued > 0 ? ((ftjsExemptCount / totalIssued) * 100).toFixed(1) : 0}%`, 'Republic Act No. 11261 (Issued 100% Free of Charge)'],
    ['Indigency & Social Welfare Waivers', indigencyExemptCount, `${totalIssued > 0 ? ((indigencyExemptCount / totalIssued) * 100).toFixed(1) : 0}%`, 'Social Welfare Assistance Exemption for indigent constituents'],
    ['General Statutory & Emergency Waivers', generalExemptCount, `${totalIssued > 0 ? ((generalExemptCount / totalIssued) * 100).toFixed(1) : 0}%`, 'Senior Citizens, PWDs, Solo Parents, or Sangguniang Resolution waivers'],
    ['Total Exempted / Free Issuances', totalExempted, `${totalIssued > 0 ? ((totalExempted / totalIssued) * 100).toFixed(1) : 0}%`, 'Total clearances released without fee charges (O.R. not required)'],
  ]

  s3FeeData.forEach((rowVals, idx) => {
    const row = ws3.getRow(r3)
    row.height = 22
    rowVals.forEach((val, i) => {
      const c = row.getCell(i + 1)
      c.value = val
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
      c.border = thinBorder
      c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } }
      c.alignment = {
        vertical: 'middle',
        horizontal: i === 0 || i === 3 ? 'left' : 'center',
        indent: i === 0 || i === 3 ? 1 : 0,
      }
    })
    r3++
  })

  ws3.getRow(r3++).height = 10 // Spacing

  // Section 3: Certificate Type Volume Distribution
  const s3Sec3 = ws3.getRow(r3)
  s3Sec3.height = 24
  s3Sec3.getCell(1).value = 'III. CERTIFICATE TYPE VOLUME DISTRIBUTION'
  ws3.mergeCells(`A${r3}:D${r3}`)
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { bold: true, size: 10, color: { argb: COLORS.sectionText } },
    alignment: { vertical: 'middle', indent: 1 },
    border: thinBorder,
  })
  r3++

  const s3H3 = ws3.getRow(r3)
  s3H3.height = 24
  s3H3.getCell(1).value = 'Certificate Type Name'
  s3H3.getCell(2).value = 'Issued Volume'
  s3H3.getCell(3).value = 'Share (%)'
  s3H3.getCell(4).value = 'Regulatory Classification'
  styleMergedCells(ws3, r3, 1, r3, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { bold: true, size: 9.5, color: { argb: COLORS.headerText } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: thinBorder,
  })
  r3++

  if (typeBreakdown && typeBreakdown.length > 0) {
    typeBreakdown.forEach((t, idx) => {
      const row = ws3.getRow(r3)
      row.height = 22
      const vals = [t.name, t.count, `${t.percentage.toFixed(1)}%`, 'Official Barangay Certificate Format']
      vals.forEach((val, i) => {
        const c = row.getCell(i + 1)
        c.value = val
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        c.border = thinBorder
        c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } }
        c.alignment = {
          vertical: 'middle',
          horizontal: i === 0 || i === 3 ? 'left' : 'center',
          indent: i === 0 || i === 3 ? 1 : 0,
        }
      })
      r3++
    })
  } else {
    const emptyR = ws3.getRow(r3)
    emptyR.height = 22
    emptyR.getCell(1).value = 'No certificate type distribution data available for period'
    emptyR.getCell(2).value = 0
    emptyR.getCell(3).value = '0.0%'
    emptyR.getCell(4).value = 'N/A'
    for (let i = 1; i <= 4; i++) {
      const c = emptyR.getCell(i)
      c.border = thinBorder
      c.font = { italic: true, size: 9.5, color: { argb: COLORS.textMuted } }
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'center', indent: i === 1 ? 1 : 0 }
    }
    r3++
  }

  // =============================================================
  // DOWNLOAD TRIGGER IN BROWSER
  // =============================================================
  const safeFrom = appliedFilters.dateFrom || 'start'
  const safeTo = appliedFilters.dateTo || 'end'
  const fileName = `Barangay_Ugong_Clearance_Report_${safeFrom}_to_${safeTo}.xlsx`

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
