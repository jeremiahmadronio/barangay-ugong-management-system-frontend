import ExcelJS from 'exceljs'
import { formatDate, maskConfidentialName } from '@/utils/formatters'
import type {
  VawcReportKpiResponse,
  VawcAgencyReferralBreakdownResponse,
  VawcTableRowResponse,
} from '@/api/modules/vawc.api'
import type {
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
} from '@/api/modules/blotter.api'
import type { BlotterFilterState } from '@/components/reports/BlotterReportFilters'

interface ExportVawcExcelParams {
  tableRecords: VawcTableRowResponse[]
  kpiData: VawcReportKpiResponse | null
  agencyBreakdown?: VawcAgencyReferralBreakdownResponse[]
  monthlyTrend?: MonthlyCaseTrendResponse[]
  dailyTrend?: DailyCaseTrendResponse[]
  statusData?: CaseStatusBreakdownResponse | null
  appliedFilters: BlotterFilterState
  user: any
}

// Color palette matching VAWC / Serbisyoko theme
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
  blueBadge: 'FF2563EB', // Blue-600
  purpleBadge: 'FF7C3AED', // Violet-600
  roseBadge: 'FFE11D48', // Rose-600
  textMuted: 'FF64748B', // Slate-500
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderColor } },
  left: { style: 'thin', color: { argb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
  right: { style: 'thin', color: { argb: COLORS.borderColor } },
}

export async function exportVawcExcel({
  tableRecords = [],
  kpiData,
  agencyBreakdown = [],
  monthlyTrend = [],
  dailyTrend = [],
  statusData,
  appliedFilters,
  user,
}: ExportVawcExcelParams): Promise<void> {
  const preparedByName =
    (user as any)?.fullName ||
    ((user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
      : (user as any)?.name || 'VAWC Desk Officer')

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

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Barangay Information System'
  wb.created = new Date()
  wb.properties.date1904 = true

  // Helper: style range
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
  // SHEET 1: VAWC CASE REGISTRY
  // =============================================================
  const ws1 = wb.addWorksheet('VAWC Case Registry', {
    views: [{ showGridLines: true }],
  })

  ws1.columns = [
    { key: 'col1', width: 6 }, // A: #
    { key: 'col2', width: 22 }, // B: Case Number
    { key: 'col3', width: 26 }, // C: Complainant
    { key: 'col4', width: 26 }, // D: Respondent
    { key: 'col5', width: 28 }, // E: Violence Category
    { key: 'col6', width: 22 }, // F: Case Status
    { key: 'col7', width: 16 }, // G: Risk Level
    { key: 'col8', width: 16 }, // H: Date Filed
  ]

  let curRow = 1

  // Letterhead
  const hRow1 = ws1.getRow(curRow++)
  hRow1.height = 16
  hRow1.getCell(1).value = 'Republika ng Pilipinas'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow2 = ws1.getRow(curRow++)
  hRow2.height = 16
  hRow2.getCell(1).value = 'Lungsod ng Valenzuela'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow3 = ws1.getRow(curRow++)
  hRow3.height = 22
  hRow3.getCell(1).value = 'BARANGAY UGONG'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow4 = ws1.getRow(curRow++)
  hRow4.height = 18
  hRow4.getCell(1).value = "VIOLENCE AGAINST WOMEN AND CHILDREN (VAWC) DESK"
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow5 = ws1.getRow(curRow++)
  hRow5.height = 16
  hRow5.getCell(1).value = 'Confidential Case Intake & Referral Registry (R.A. 9262)'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  curRow++ // blank spacer

  // Title Box
  const tRow = ws1.getRow(curRow++)
  tRow.height = 24
  tRow.getCell(1).value = 'OFFICIAL VAWC CASE REGISTRY REPORT'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  // Metadata Table
  const m1 = ws1.getRow(curRow++)
  m1.height = 19
  m1.getCell(1).value = 'Report Period:'
  m1.getCell(2).value = dateRangeLabel
  m1.getCell(6).value = 'Generated On:'
  m1.getCell(7).value = generatedDateTimeText
  ws1.mergeCells(`B${curRow - 1}:E${curRow - 1}`)
  ws1.mergeCells(`G${curRow - 1}:H${curRow - 1}`)

  const m2 = ws1.getRow(curRow++)
  m2.height = 19
  m2.getCell(1).value = 'Reporting Officer:'
  m2.getCell(2).value = preparedByName
  m2.getCell(6).value = 'Total Cases:'
  m2.getCell(7).value = `${tableRecords.length} Records`
  ws1.mergeCells(`B${curRow - 1}:E${curRow - 1}`)
  ws1.mergeCells(`G${curRow - 1}:H${curRow - 1}`)

  for (let r = curRow - 2; r < curRow; r++) {
    const row = ws1.getRow(r)
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c)
      cell.border = thinBorder
      cell.font = { name: 'Calibri', size: 9.5 }
      if (c === 1 || c === 6) {
        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF334155' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    }
  }

  curRow++ // blank spacer

  // Table Headers
  const tableHeaders = [
    '#',
    'Case Number',
    'Complainant',
    'Respondent',
    'Violence Category',
    'Status',
    'Risk Level',
    'Date Filed',
  ]

  const thRow = ws1.getRow(curRow++)
  thRow.height = 24
  tableHeaders.forEach((th, i) => {
    const cell = thRow.getCell(i + 1)
    cell.value = th
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: COLORS.headerText } }
    cell.alignment = {
      vertical: 'middle',
      horizontal: i === 0 || i === 7 ? 'center' : 'left',
      indent: i === 0 || i === 7 ? 0 : 1,
    }
    cell.border = thinBorder
  })

  // Table Data Rows
  if (tableRecords.length === 0) {
    const emptyRow = ws1.getRow(curRow++)
    emptyRow.height = 24
    emptyRow.getCell(1).value = 'No confidential VAWC case records found within the applied date range.'
    ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
    styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
      font: { name: 'Calibri', size: 9.5, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  } else {
    tableRecords.forEach((rec, idx) => {
      const row = ws1.getRow(curRow++)
      row.height = 21

      const compName = maskConfidentialName(rec.complainant || 'Confidential Complainant')
      const respName = maskConfidentialName(rec.respondent || 'Confidential Respondent')
      const statusLabel = (rec.status || 'PENDING').replace(/_/g, ' ')
      const riskLabel = (rec.riskLevel || 'LOW').toUpperCase()

      row.getCell(1).value = idx + 1
      row.getCell(2).value = rec.caseNumber || 'N/A'
      row.getCell(3).value = compName
      row.getCell(4).value = respName
      row.getCell(5).value = rec.natureOfComplaint || 'VAWC Violation'
      row.getCell(6).value = statusLabel
      row.getCell(7).value = riskLabel
      row.getCell(8).value = rec.dateFiled ? formatDate(rec.dateFiled) : '—'

      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9 }
        cell.border = thinBorder
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 1 || c === 7 || c === 8 ? 'center' : 'left',
          indent: c === 1 || c === 7 || c === 8 ? 0 : 1,
        }
      }
    })
  }

  // =============================================================
  // SHEET 2: KPI & INTER-AGENCY REFERRAL ANALYTICS
  // =============================================================
  const ws2 = wb.addWorksheet('KPI & Analytics', {
    views: [{ showGridLines: true }],
  })

  ws2.columns = [
    { key: 'col1', width: 28 }, // Metric / Agency / Month
    { key: 'col2', width: 18 }, // Value / Count
    { key: 'col3', width: 18 }, // Sub-metric / Percentage
    { key: 'col4', width: 36 }, // Description / Notes
    { key: 'col5', width: 16 }, // Extra numeric
    { key: 'col6', width: 16 }, // Extra numeric
    { key: 'col7', width: 18 }, // Success Rate
  ]

  let curRow2 = 1

  // Letterhead Sheet 2
  const s2H1 = ws2.getRow(curRow2++)
  s2H1.height = 16
  s2H1.getCell(1).value = 'BARANGAY UGONG — VAWC DESK ANALYTICS'
  ws2.mergeCells(`A${curRow2 - 1}:G${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 7, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const s2H2 = ws2.getRow(curRow2++)
  s2H2.height = 20
  s2H2.getCell(1).value = 'EXECUTIVE KPI & PARTNER AGENCY PERFORMANCE SUMMARY'
  ws2.mergeCells(`A${curRow2 - 1}:G${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 7, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  curRow2++ // blank spacer

  // SECTION I: KPI SUMMARY
  const kpiTitle = ws2.getRow(curRow2++)
  kpiTitle.height = 20
  kpiTitle.getCell(1).value = 'I. EXECUTIVE KPI SUMMARY'
  ws2.mergeCells(`A${curRow2 - 1}:G${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 7, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const kpiHeaders = ['KPI Metric', 'Value', 'Status / Rate', 'Operational Context']
  const kpiHeadRow = ws2.getRow(curRow2++)
  kpiHeadRow.height = 20
  kpiHeaders.forEach((h, i) => {
    const cell = kpiHeadRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.font = { name: 'Calibri', size: 9, bold: true }
    cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'center' : 'left', indent: 1 }
    cell.border = thinBorder
  })

  const kpis = [
    {
      metric: 'Total VAWC Cases',
      value: kpiData?.totalCases ?? 0,
      sub: `${kpiData?.totalCases ?? 0} Recorded`,
      desc: 'Total complaints filed in selected date range',
    },
    {
      metric: 'Total Referred Cases',
      value: kpiData?.totalReferredCases ?? 0,
      sub: `${kpiData?.totalReferredCases ?? 0} Endorsed`,
      desc: 'Officially referred to specialized partner agencies',
    },
    {
      metric: 'Top Performing Partner Agency',
      value: kpiData?.mostReferredAgency || 'None Yet',
      sub: kpiData?.mostReferredAgencySuccessRate ? `${kpiData.mostReferredAgencySuccessRate.toFixed(1)}%` : '0.0%',
      desc: 'Partner agency with highest resolution success rate',
    },
    {
      metric: 'Dismissed / Unactioned Cases',
      value: kpiData?.totalDismissedCases ?? 0,
      sub: `${kpiData?.totalDismissedCases ?? 0} Cases`,
      desc: 'Dismissed, withdrawn, or unpursued complaints',
    },
  ]

  kpis.forEach((k, idx) => {
    const row = ws2.getRow(curRow2++)
    row.height = 20
    row.getCell(1).value = k.metric
    row.getCell(2).value = k.value
    row.getCell(3).value = k.sub
    row.getCell(4).value = k.desc

    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c)
      cell.font = { name: 'Calibri', size: 9 }
      cell.border = thinBorder
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
      cell.alignment = {
        vertical: 'middle',
        horizontal: c === 2 || c === 3 ? 'center' : 'left',
        indent: c === 1 || c === 4 ? 1 : 0,
      }
    }
  })

  curRow2++ // blank spacer

  // SECTION II: INTER-AGENCY REFERRAL PERFORMANCE
  const agencyTitle = ws2.getRow(curRow2++)
  agencyTitle.height = 20
  agencyTitle.getCell(1).value = 'II. PARTNER AGENCY REFERRAL & RESOLUTION PERFORMANCE'
  ws2.mergeCells(`A${curRow2 - 1}:G${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 7, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const agencyHeaders = [
    'Agency Name',
    'Total Referrals',
    'Share (%)',
    'Resolved',
    'Declined',
    'Pending',
    'Success Rate (%)',
  ]
  const agencyHeadRow = ws2.getRow(curRow2++)
  agencyHeadRow.height = 20
  agencyHeaders.forEach((h, i) => {
    const cell = agencyHeadRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.font = { name: 'Calibri', size: 9, bold: true }
    cell.alignment = {
      vertical: 'middle',
      horizontal: i === 0 ? 'left' : 'center',
      indent: i === 0 ? 1 : 0,
    }
    cell.border = thinBorder
  })

  if (agencyBreakdown.length === 0) {
    const emptyRow = ws2.getRow(curRow2++)
    emptyRow.height = 20
    emptyRow.getCell(1).value = 'No inter-agency referrals recorded within this date range.'
    ws2.mergeCells(`A${curRow2 - 1}:G${curRow2 - 1}`)
    styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 7, {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  } else {
    agencyBreakdown.forEach((item, idx) => {
      const row = ws2.getRow(curRow2++)
      row.height = 20
      row.getCell(1).value = item.agencyName
      row.getCell(2).value = item.totalReferrals
      row.getCell(3).value = `${(item.percentage ?? 0).toFixed(1)}%`
      row.getCell(4).value = item.resolvedCount
      row.getCell(5).value = item.declinedCount
      row.getCell(6).value = item.pendingCount
      row.getCell(7).value = `${(item.successRate ?? 0).toFixed(1)}%`

      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9 }
        cell.border = thinBorder
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 1 ? 'left' : 'center',
          indent: c === 1 ? 1 : 0,
        }
      }
    })
  }

  curRow2++ // blank spacer

  // SECTION III: CASE STATUS BREAKDOWN
  const statusTitle = ws2.getRow(curRow2++)
  statusTitle.height = 20
  statusTitle.getCell(1).value = 'III. CASE STATUS DISTRIBUTION'
  ws2.mergeCells(`A${curRow2 - 1}:D${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const statusHeaders = ['Disposition Status', 'Count', 'Distribution (%)', 'Status Classification']
  const statusHeadRow = ws2.getRow(curRow2++)
  statusHeadRow.height = 20
  statusHeaders.forEach((h, i) => {
    const cell = statusHeadRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.font = { name: 'Calibri', size: 9, bold: true }
    cell.alignment = { vertical: 'middle', horizontal: i === 1 || i === 2 ? 'center' : 'left', indent: 1 }
    cell.border = thinBorder
  })

  const sList = statusData?.breakdown || []
  if (sList.length === 0) {
    const emptyRow = ws2.getRow(curRow2++)
    emptyRow.height = 20
    emptyRow.getCell(1).value = 'No case status records in applied date range.'
    ws2.mergeCells(`A${curRow2 - 1}:D${curRow2 - 1}`)
    styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 4, {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  } else {
    sList.forEach((s, idx) => {
      const row = ws2.getRow(curRow2++)
      row.height = 20
      row.getCell(1).value = s.label
      row.getCell(2).value = s.count
      row.getCell(3).value = `${(s.percentage ?? 0).toFixed(1)}%`
      row.getCell(4).value = 'Active VAWC case disposition status'

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9 }
        cell.border = thinBorder
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 2 || c === 3 ? 'center' : 'left',
          indent: c === 1 || c === 4 ? 1 : 0,
        }
      }
    })
  }

  curRow2++ // blank spacer

  // SECTION IV: CASE FILING TREND
  const activeTrend = dailyTrend.length > 0 && dailyTrend.length <= 31 ? dailyTrend : monthlyTrend
  const trendTitle = ws2.getRow(curRow2++)
  trendTitle.height = 20
  trendTitle.getCell(1).value = 'IV. CASE FILING VOLUME TREND'
  ws2.mergeCells(`A${curRow2 - 1}:D${curRow2 - 1}`)
  styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const trendHead = ['Timeline Interval', 'Cases Filed', 'Total Volume', 'Observation Note']
  const trendHeadRow = ws2.getRow(curRow2++)
  trendHeadRow.height = 20
  trendHead.forEach((h, i) => {
    const cell = trendHeadRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.font = { name: 'Calibri', size: 9, bold: true }
    cell.alignment = { vertical: 'middle', horizontal: i === 1 || i === 2 ? 'center' : 'left', indent: 1 }
    cell.border = thinBorder
  })

  if (activeTrend.length === 0) {
    const emptyRow = ws2.getRow(curRow2++)
    emptyRow.height = 20
    emptyRow.getCell(1).value = 'No filing trends available for selected period.'
    ws2.mergeCells(`A${curRow2 - 1}:D${curRow2 - 1}`)
    styleMergedCells(ws2, curRow2 - 1, 1, curRow2 - 1, 4, {
      font: { name: 'Calibri', size: 9, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  } else {
    activeTrend.forEach((t: any, idx) => {
      const row = ws2.getRow(curRow2++)
      row.height = 20
      row.getCell(1).value = t.label || t.dayLabel || t.monthLabel || 'N/A'
      row.getCell(2).value = t.totalCases ?? 0
      row.getCell(3).value = `${t.totalCases ?? 0} Cases`
      row.getCell(4).value = 'Intake cases filed within interval'

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9 }
        cell.border = thinBorder
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 2 || c === 3 ? 'center' : 'left',
          indent: c === 1 || c === 4 ? 1 : 0,
        }
      }
    })
  }

  // =============================================================
  // DOWNLOAD TRIGGER IN BROWSER
  // =============================================================
  const safeFrom = appliedFilters.dateFrom || 'start'
  const safeTo = appliedFilters.dateTo || 'end'
  const fileName = `Barangay_Ugong_VAWC_Report_${safeFrom}_to_${safeTo}.xlsx`

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

