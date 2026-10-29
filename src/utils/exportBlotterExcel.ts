import ExcelJS from 'exceljs'
import { formatDate } from './formatters'
import type {
  BlotterReportKpiResponse,
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
  FormalComplaintReportResponse,
  SettlementEfficiencyResponse,
  BlotterTableRowResponse,
} from '@/api/modules/blotter.api'
import type { BlotterFilterState } from '@/components/reports/BlotterReportFilters'

interface ExportBlotterExcelParams {
  tableRecords: BlotterTableRowResponse[]
  kpiData: BlotterReportKpiResponse | null
  monthlyTrend?: MonthlyCaseTrendResponse[]
  dailyTrend?: DailyCaseTrendResponse[]
  statusData?: CaseStatusBreakdownResponse | null
  resolutionData?: FormalComplaintReportResponse | null
  settlementData?: SettlementEfficiencyResponse | null
  appliedFilters: BlotterFilterState
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
  blueBadge: 'FF2563EB', // Blue-600
  purpleBadge: 'FF7C3AED', // Violet-600
  textMuted: 'FF64748B', // Slate-500
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderColor } },
  left: { style: 'thin', color: { argb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
  right: { style: 'thin', color: { argb: COLORS.borderColor } },
}

export async function exportBlotterExcel({
  tableRecords = [],
  kpiData,
  monthlyTrend = [],
  dailyTrend = [],
  statusData,
  resolutionData,
  settlementData,
  appliedFilters,
  user,
}: ExportBlotterExcelParams): Promise<void> {
  const preparedByName =
    (user as any)?.fullName ||
    ((user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
      : (user as any)?.name || 'Blotter Desk Officer')

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
  // SHEET 1: BLOTTER CASE REGISTRY
  // =============================================================
  const ws1 = wb.addWorksheet('Blotter Registry', {
    views: [{ showGridLines: true }],
  })

  ws1.columns = [
    { key: 'col1', width: 6 }, // A: #
    { key: 'col2', width: 22 }, // B: Case Number
    { key: 'col3', width: 28 }, // C: Complainant
    { key: 'col4', width: 28 }, // D: Respondent
    { key: 'col5', width: 20 }, // E: Filing Mode
    { key: 'col6', width: 22 }, // F: Effective Status
    { key: 'col7', width: 16 }, // G: Date Filed
    { key: 'col8', width: 16 }, // H: Case Cycle
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
  hRow4.getCell(1).value = 'TANGGAPAN NG SANGGUNIANG BARANGAY'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow5 = ws1.getRow(curRow++)
  hRow5.height = 16
  hRow5.getCell(1).value = 'Blotter & Incident Records Section'
  ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
    font: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  curRow++ // blank spacer

  // Title Box
  const tRow = ws1.getRow(curRow++)
  tRow.height = 24
  tRow.getCell(1).value = 'OFFICIAL BLOTTER & INCIDENT REGISTRY REPORT'
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
  m1.getCell(5).value = 'Generated On:'
  m1.getCell(6).value = generatedDateTimeText
  ws1.mergeCells(`B${curRow - 1}:D${curRow - 1}`)
  ws1.mergeCells(`F${curRow - 1}:H${curRow - 1}`)

  const m2 = ws1.getRow(curRow++)
  m2.height = 19
  m2.getCell(1).value = 'Reporting Officer:'
  m2.getCell(2).value = preparedByName
  m2.getCell(5).value = 'Total Records:'
  m2.getCell(6).value = `${tableRecords.length} Cases Listed`
  ws1.mergeCells(`B${curRow - 1}:D${curRow - 1}`)
  ws1.mergeCells(`F${curRow - 1}:H${curRow - 1}`)

  for (let r = curRow - 2; r < curRow; r++) {
    const row = ws1.getRow(r)
    row.getCell(1).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF334155' } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
    row.getCell(1).border = thinBorder
    row.getCell(2).font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } }
    row.getCell(2).border = thinBorder
    row.getCell(5).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF334155' } }
    row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
    row.getCell(5).border = thinBorder
    row.getCell(6).font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } }
    row.getCell(6).border = thinBorder
  }

  curRow++ // blank spacer

  // Table Header
  const headers = [
    '#',
    'Case Number',
    'Complainant',
    'Respondent',
    'Filing Mode',
    'Effective Status',
    'Date Filed',
    'Case Cycle',
  ]

  const thRow = ws1.getRow(curRow++)
  thRow.height = 24
  headers.forEach((h, idx) => {
    const cell = thRow.getCell(idx + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: COLORS.headerText } }
    cell.alignment = { horizontal: idx === 0 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 0 : 1 }
    cell.border = thinBorder
  })

  // Table Rows
  if (tableRecords.length > 0) {
    tableRecords.forEach((item, idx) => {
      const row = ws1.getRow(curRow++)
      row.height = 20

      const isFormal = String(item.filingType || '').toUpperCase().includes('FORMAL')
      const filingLabel = isFormal ? 'Formal Complaint' : 'For the Record'
      const statusLabel = String(item.effectiveStatus || 'PENDING').replace('_', ' ')
      const cycleLabel = item.isReopened ? `Cycle #${item.cycleCount || 2} (Reopened)` : 'Initial Cycle'

      row.getCell(1).value = idx + 1
      row.getCell(2).value = item.latestCaseNumber || item.rootCaseNumber || '—'
      row.getCell(3).value = item.complainantFullName || '—'
      row.getCell(4).value = item.respondentFullName || '—'
      row.getCell(5).value = filingLabel
      row.getCell(6).value = statusLabel
      row.getCell(7).value = item.dateFiled ? formatDate(item.dateFiled) : '—'
      row.getCell(8).value = cycleLabel

      const isZebra = idx % 2 === 1
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } }
        cell.border = thinBorder
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isZebra ? COLORS.zebraRow : 'FFFFFFFF' },
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 1 || c === 7 || c === 8 ? 'center' : 'left',
          indent: c === 1 || c === 7 || c === 8 ? 0 : 1,
        }
      }
    })
  } else {
    const emptyRow = ws1.getRow(curRow++)
    emptyRow.height = 24
    emptyRow.getCell(1).value = 'No blotter records found for the selected filter range.'
    ws1.mergeCells(`A${curRow - 1}:H${curRow - 1}`)
    styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 8, {
      font: { name: 'Calibri', size: 9.5, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  }

  curRow += 2

  // Signatories
  ws1.mergeCells(`B${curRow}:D${curRow}`)
  ws1.getCell(`B${curRow}`).value = preparedByName.toUpperCase()
  ws1.getCell(`B${curRow}`).font = { name: 'Calibri', size: 9.5, bold: true }
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center' }

  ws1.mergeCells(`F${curRow}:H${curRow}`)
  ws1.getCell(`F${curRow}`).value = 'HON. MARICEL PINEDA-EMPERADOR'
  ws1.getCell(`F${curRow}`).font = { name: 'Calibri', size: 9.5, bold: true }
  ws1.getCell(`F${curRow}`).alignment = { horizontal: 'center' }
  curRow++

  ws1.mergeCells(`B${curRow}:D${curRow}`)
  ws1.getCell(`B${curRow}`).value = 'Prepared by: Blotter Desk Officer'
  ws1.getCell(`B${curRow}`).font = { name: 'Calibri', size: 8.5, color: { argb: COLORS.textMuted } }
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center' }

  ws1.mergeCells(`F${curRow}:H${curRow}`)
  ws1.getCell(`F${curRow}`).value = 'Noted by: Punong Barangay'
  ws1.getCell(`F${curRow}`).font = { name: 'Calibri', size: 8.5, color: { argb: COLORS.textMuted } }
  ws1.getCell(`F${curRow}`).alignment = { horizontal: 'center' }

  // =============================================================
  // SHEET 2: ANALYTICS & STATISTICAL KPI SUMMARY
  // =============================================================
  const ws2 = wb.addWorksheet('Analytics & KPI', {
    views: [{ showGridLines: true }],
  })

  ws2.columns = [
    { key: 'col1', width: 35 },
    { key: 'col2', width: 18 },
    { key: 'col3', width: 18 },
    { key: 'col4', width: 45 },
  ]

  let r2 = 1

  // Sheet 2 Title
  const s2Title = ws2.getRow(r2++)
  s2Title.height = 22
  s2Title.getCell(1).value = 'BARANGAY UGONG - BLOTTER ANALYTICS & STATISTICAL KPI AUDIT'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  r2++

  // Section 1: Executive KPI Metrics
  const sec1 = ws2.getRow(r2++)
  sec1.height = 20
  sec1.getCell(1).value = 'I. EXECUTIVE KEY PERFORMANCE INDICATORS'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const kpiHeaders = ['Metric Description', 'Value', 'Rate / Ratio', 'Administrative Note']
  const kpiHRow = ws2.getRow(r2++)
  kpiHRow.height = 20
  kpiHeaders.forEach((h, idx) => {
    const c = kpiHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const kpis = [
    {
      desc: 'Total Blotter Cases Filed',
      val: kpiData?.totalCases ?? 0,
      ratio: '100.0%',
      note: 'Total formal complaints & for-the-record entries within period',
    },
    {
      desc: 'Amicably Settled Cases',
      val: kpiData?.settledCases ?? 0,
      ratio: `${(kpiData?.settlementRate ?? 0).toFixed(1)}%`,
      note: 'Cases successfully settled via mediation agreement',
    },
    {
      desc: 'Active Mediations Underway',
      val: kpiData?.activeMediations ?? 0,
      ratio: 'Active Cycle',
      note: 'Formal complaints undergoing active mediation hearings',
    },
    {
      desc: 'Escalated / Referred to Lupon',
      val: kpiData?.luponReferrals ?? 0,
      ratio: 'Under Conciliation',
      note: 'Cases forwarded to Lupong Tagapamayapa for Pangkat panel conciliation',
    },
    {
      desc: 'Total For the Record Entries',
      val: tableRecords.filter((r) => !String(r.filingType || '').toUpperCase().includes('FORMAL')).length,
      ratio: 'Documentation',
      note: 'Non-actionable / informational blotter entries for police or legal record',
    },
  ]

  kpis.forEach((k, idx) => {
    const row = ws2.getRow(r2++)
    row.height = 19
    row.getCell(1).value = k.desc
    row.getCell(2).value = k.val
    row.getCell(3).value = k.ratio
    row.getCell(4).value = k.note

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

  r2++

  // Section 2: Case Status Breakdown
  const sec2 = ws2.getRow(r2++)
  sec2.height = 20
  sec2.getCell(1).value = 'II. CASE STATUS DISTRIBUTION'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const statusHRow = ws2.getRow(r2++)
  statusHRow.height = 20
  ;['Status Classification', 'Case Count', 'Percentage Share', 'Operational Phase'].forEach((h, idx) => {
    const c = statusHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const statusItems = statusData?.breakdown || []
  if (statusItems.length > 0) {
    statusItems.forEach((st, idx) => {
      const row = ws2.getRow(r2++)
      row.height = 19
      row.getCell(1).value = st.label || st.status
      row.getCell(2).value = st.count
      row.getCell(3).value = `${st.percentage.toFixed(1)}%`
      row.getCell(4).value = 'Official Registry Status'

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

  r2++

  // Section 3: Desk Settlement Performance
  const sec3 = ws2.getRow(r2++)
  sec3.height = 20
  sec3.getCell(1).value = 'III. DESK SETTLEMENT EFFICIENCY'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const totalFormalCases = settlementData?.totalFormalComplaints ?? (kpiData?.totalCases ?? 0)
  const totalSettledCases = settlementData?.totalSettledCases ?? (kpiData?.settledCases ?? 0)
  const effRate = settlementData?.settlementRate ?? (kpiData?.settlementRate ?? 0)

  const sRow = ws2.getRow(r2++)
  sRow.height = 19
  sRow.getCell(1).value = 'Total Formal Dispute Complaints'
  sRow.getCell(2).value = totalFormalCases
  sRow.getCell(3).value = 'Subject Cases'
  sRow.getCell(4).value = 'Dispute cases filed at blotter desk eligible for amicable settlement'
  for (let c = 1; c <= 4; c++) {
    sRow.getCell(c).border = thinBorder
    sRow.getCell(c).font = { name: 'Calibri', size: 9 }
    sRow.getCell(c).alignment = { vertical: 'middle', horizontal: c === 2 ? 'center' : 'left', indent: c === 1 || c === 4 ? 1 : 0 }
  }

  const sRow2 = ws2.getRow(r2++)
  sRow2.height = 19
  sRow2.getCell(1).value = 'Successfully Settled Cases'
  sRow2.getCell(2).value = totalSettledCases
  sRow2.getCell(3).value = `${effRate.toFixed(1)}% Rate`
  sRow2.getCell(4).value = 'Cases with signed amicable settlement agreements'
  for (let c = 1; c <= 4; c++) {
    sRow2.getCell(c).border = thinBorder
    sRow2.getCell(c).font = { name: 'Calibri', size: 9 }
    sRow2.getCell(c).alignment = { vertical: 'middle', horizontal: c === 2 ? 'center' : 'left', indent: c === 1 || c === 4 ? 1 : 0 }
  }

  // Section 4: Case Filing Trend
  const activeTrends = dailyTrend.length > 0 ? dailyTrend : monthlyTrend
  if (activeTrends.length > 0) {
    r2++
    const sec4 = ws2.getRow(r2++)
    sec4.height = 20
    sec4.getCell(1).value = 'IV. CASE FILING VELOCITY & TREND'
    ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
    styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
      font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
      alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
      border: thinBorder,
    })

    const trendHRow = ws2.getRow(r2++)
    trendHRow.height = 20
    ;['Timeline Period', 'Cases Filed', 'Trend Assessment', 'Period Remarks'].forEach((h, idx) => {
      const c = trendHRow.getCell(idx + 1)
      c.value = h
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
      c.alignment = { horizontal: idx === 1 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
      c.border = thinBorder
    })

    activeTrends.forEach((t: any, idx) => {
      const row = ws2.getRow(r2++)
      row.height = 19
      row.getCell(1).value = t.label || t.dayLabel || t.monthLabel || 'N/A'
      row.getCell(2).value = t.totalCases ?? 0
      row.getCell(3).value = `${t.totalCases ?? 0} Cases`
      row.getCell(4).value = 'Registered blotter filings for interval'

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Calibri', size: 9 }
        cell.border = thinBorder
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 1 ? COLORS.zebraRow : 'FFFFFFFF' } }
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 2 ? 'center' : 'left',
          indent: c === 1 || c === 4 ? 1 : 0,
        }
      }
    })
  }

  // Section 5: Formal Dispute Resolution Breakdown
  const resBreakdown = resolutionData?.resolutionBreakdown || resolutionData?.breakdown
  if (resBreakdown) {
    r2++
    const sec5 = ws2.getRow(r2++)
    sec5.height = 20
    sec5.getCell(1).value = 'V. FORMAL DISPUTE RESOLUTION SUMMARY'
    ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
    styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
      font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
      alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
      border: thinBorder,
    })

    const resItems = [
      { label: 'Settled at Blotter Desk', val: resBreakdown.settledAtBlotter ?? 0, rate: `${(resBreakdown.settledRate ?? 0).toFixed(1)}%` },
      { label: 'Referred to Lupon Conciliation', val: resBreakdown.referredToLupon ?? 0, rate: `${(resBreakdown.referredRate ?? 0).toFixed(1)}%` },
      { label: 'Pending / Ongoing at Blotter', val: resBreakdown.pendingAtBlotter ?? 0, rate: `${(resBreakdown.pendingRate ?? 0).toFixed(1)}%` },
    ]

    resItems.forEach((ri, idx) => {
      const row = ws2.getRow(r2++)
      row.height = 19
      row.getCell(1).value = ri.label
      row.getCell(2).value = ri.val
      row.getCell(3).value = ri.rate
      row.getCell(4).value = 'Statutory dispute stage'

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
  const fileName = `Barangay_Ugong_Blotter_Report_${safeFrom}_to_${safeTo}.xlsx`

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
