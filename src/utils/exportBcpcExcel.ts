import ExcelJS from 'exceljs'
import { formatDate } from './formatters'
import type {
  BcpcReportKpiResponse,
  BcpcCategoryComparisonResponse,
  BcpcTableRowResponse,
} from '@/api/modules/bcpc.api'
import type {
  MonthlyCaseTrendResponse,
  DailyCaseTrendResponse,
  CaseStatusBreakdownResponse,
  SettlementEfficiencyResponse,
} from '@/api/modules/blotter.api'
import type { BcpcFilterState } from '@/components/reports/BcpcReportFilters'

export interface ExportBcpcExcelParams {
  tableRecords: BcpcTableRowResponse[]
  kpiData: BcpcReportKpiResponse | null
  monthlyTrend?: MonthlyCaseTrendResponse[]
  dailyTrend?: DailyCaseTrendResponse[]
  statusData?: CaseStatusBreakdownResponse | null
  categoryData?: BcpcCategoryComparisonResponse | null
  settlementData?: SettlementEfficiencyResponse | null
  appliedFilters: BcpcFilterState
  user: any
}

// Color palette matching Serbisyoko Royal Blue BCPC theme
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

export async function exportBcpcExcel({
  tableRecords = [],
  kpiData,
  monthlyTrend = [],
  dailyTrend = [],
  statusData,
  categoryData,
  settlementData,
  appliedFilters,
  user,
}: ExportBcpcExcelParams): Promise<void> {
  const preparedByName =
    (user as any)?.fullName ||
    ((user as any)?.firstName && (user as any)?.lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
      : (user as any)?.name || 'BCPC Focal Person')

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
  // SHEET 1: BCPC CASE REGISTRY
  // =============================================================
  const ws1 = wb.addWorksheet('BCPC Case Registry', {
    views: [{ showGridLines: true }],
  })

  ws1.columns = [
    { key: 'col1', width: 6 }, // A: #
    { key: 'col2', width: 22 }, // B: Case Number
    { key: 'col3', width: 28 }, // C: Child / Minor Involved
    { key: 'col4', width: 24 }, // D: Classification
    { key: 'col5', width: 32 }, // E: Nature / Specific Act
    { key: 'col6', width: 22 }, // F: Case Status
    { key: 'col7', width: 18 }, // G: Date Filed
  ]

  let curRow = 1

  // Letterhead
  const hRow1 = ws1.getRow(curRow++)
  hRow1.height = 16
  hRow1.getCell(1).value = 'Republika ng Pilipinas'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow2 = ws1.getRow(curRow++)
  hRow2.height = 16
  hRow2.getCell(1).value = 'Lungsod ng Valenzuela'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    font: { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow3 = ws1.getRow(curRow++)
  hRow3.height = 22
  hRow3.getCell(1).value = 'BARANGAY UGONG'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow4 = ws1.getRow(curRow++)
  hRow4.height = 18
  hRow4.getCell(1).value = 'TANGGAPAN NG SANGGUNIANG BARANGAY'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  const hRow5 = ws1.getRow(curRow++)
  hRow5.height = 16
  hRow5.getCell(1).value = 'Barangay Council for the Protection of Children (BCPC)'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    font: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  curRow++ // blank spacer

  // Title Box
  const tRow = ws1.getRow(curRow++)
  tRow.height = 24
  tRow.getCell(1).value = 'OFFICIAL BCPC CHILD PROTECTION CASE REGISTRY'
  ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
  styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.headerText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  // Meta Sub-header block
  const mRow1 = ws1.getRow(curRow++)
  mRow1.height = 18
  mRow1.getCell(1).value = 'Report Period:'
  mRow1.getCell(2).value = dateRangeLabel
  mRow1.getCell(4).value = 'Generated On:'
  mRow1.getCell(5).value = generatedDateTimeText
  ws1.mergeCells(`B${curRow - 1}:C${curRow - 1}`)
  ws1.mergeCells(`E${curRow - 1}:G${curRow - 1}`)

  const mRow2 = ws1.getRow(curRow++)
  mRow2.height = 18
  mRow2.getCell(1).value = 'Prepared By:'
  mRow2.getCell(2).value = preparedByName
  mRow2.getCell(4).value = 'Department:'
  mRow2.getCell(5).value = 'BCPC / Child Protection Desk'
  ws1.mergeCells(`B${curRow - 1}:C${curRow - 1}`)
  ws1.mergeCells(`E${curRow - 1}:G${curRow - 1}`)

  for (let r = curRow - 2; r < curRow; r++) {
    const row = ws1.getRow(r)
    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cardBg } }
      cell.font = { name: 'Calibri', size: 9, bold: c === 1 || c === 4 }
      cell.border = thinBorder
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    }
  }

  curRow++ // spacer

  // Table Headers
  const headers = [
    '#',
    'Case Number',
    'Child / Minor Involved',
    'Classification',
    'Nature / Specific Act',
    'Case Status',
    'Date Filed',
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

      const categoryLabel =
        String(item.category || '').toUpperCase() === 'CICL'
          ? 'Children in Conflict (CICL)'
          : 'Children at Risk (CAR)'
      const statusLabel = String(item.status || 'PENDING').replace(/_/g, ' ')
      const natureLabel = item.caseNature || 'Unspecified Case Nature'

      row.getCell(1).value = idx + 1
      row.getCell(2).value = item.caseNumber || '—'
      row.getCell(3).value = item.childName || 'Confidential Minor'
      row.getCell(4).value = categoryLabel
      row.getCell(5).value = natureLabel
      row.getCell(6).value = statusLabel
      row.getCell(7).value = item.dateFiled ? formatDate(item.dateFiled) : '—'

      const isZebra = idx % 2 === 1
      for (let c = 1; c <= 7; c++) {
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
          horizontal: c === 1 || c === 7 ? 'center' : 'left',
          indent: c === 1 || c === 7 ? 0 : 1,
        }
      }
    })
  } else {
    const emptyRow = ws1.getRow(curRow++)
    emptyRow.height = 24
    emptyRow.getCell(1).value = 'No BCPC case records found for the selected filter range.'
    ws1.mergeCells(`A${curRow - 1}:G${curRow - 1}`)
    styleMergedCells(ws1, curRow - 1, 1, curRow - 1, 7, {
      font: { name: 'Calibri', size: 9.5, italic: true, color: { argb: COLORS.textMuted } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    })
  }

  curRow += 2

  // Signatories
  ws1.mergeCells(`B${curRow}:C${curRow}`)
  ws1.getCell(`B${curRow}`).value = preparedByName.toUpperCase()
  ws1.getCell(`B${curRow}`).font = { name: 'Calibri', size: 9.5, bold: true }
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center' }

  ws1.mergeCells(`E${curRow}:F${curRow}`)
  ws1.getCell(`E${curRow}`).value = 'HON. MARICEL PINEDA-EMPERADOR'
  ws1.getCell(`E${curRow}`).font = { name: 'Calibri', size: 9.5, bold: true }
  ws1.getCell(`E${curRow}`).alignment = { horizontal: 'center' }
  curRow++

  ws1.mergeCells(`B${curRow}:C${curRow}`)
  ws1.getCell(`B${curRow}`).value = 'Prepared by (BCPC Desk Officer)'
  ws1.getCell(`B${curRow}`).font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: COLORS.textMuted } }
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center' }

  ws1.mergeCells(`E${curRow}:F${curRow}`)
  ws1.getCell(`E${curRow}`).value = 'Noted by (Punong Barangay)'
  ws1.getCell(`E${curRow}`).font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: COLORS.textMuted } }
  ws1.getCell(`E${curRow}`).alignment = { horizontal: 'center' }

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
  s2Title.getCell(1).value = 'BARANGAY UGONG - BCPC ANALYTICS & STATISTICAL KPI AUDIT'
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
      desc: 'Total BCPC Cases Filed',
      val: kpiData?.totalCases ?? 0,
      ratio: '100.0%',
      note: 'Total child protection intakes recorded within period',
    },
    {
      desc: 'Settled Cases',
      val: kpiData?.settledCases ?? 0,
      ratio: `${(kpiData?.settlementRate ?? 0).toFixed(1)}%`,
      note: 'Amicably settled through diversion or mediation',
    },
    {
      desc: 'Active Interventions',
      val: kpiData?.activeInterventions ?? 0,
      ratio: 'Active Cycle',
      note: 'Children undergoing youth counseling and rehabilitation',
    },
    {
      desc: 'Agency Referrals',
      val: kpiData?.agencyReferrals ?? 0,
      ratio: 'Multi-Agency',
      note: 'Officially referred to LSWDO / DSWD / PNP-WCPD',
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

  // Section 2: Case Filing Trend
  const diffDays = (() => {
    if (!appliedFilters?.dateFrom || !appliedFilters?.dateTo) return 180
    const start = new Date(appliedFilters.dateFrom).getTime()
    const end = new Date(appliedFilters.dateTo).getTime()
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
  })()

  const useDaily = diffDays <= 31 && dailyTrend.length > 0
  const activeTrend = useDaily ? dailyTrend : (monthlyTrend.length > 0 ? monthlyTrend : dailyTrend)

  const sec2 = ws2.getRow(r2++)
  sec2.height = 20
  sec2.getCell(1).value = useDaily ? 'II. DAILY CASE FILING TREND AUDIT' : 'II. MONTHLY CASE FILING TREND AUDIT'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const tHRow = ws2.getRow(r2++)
  tHRow.height = 20
  ;[useDaily ? 'Date' : 'Month Period', 'Cases Filed', 'Running Share', 'Operational Load'].forEach((h, idx) => {
    const c = tHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const trendPoints = activeTrend.map((t: any) => ({
    label: t.label || t.dayLabel || t.monthLabel || 'N/A',
    issued: t.totalCases ?? 0,
  }))

  const totalTrendVol = trendPoints.reduce((acc, p) => acc + p.issued, 0)

  if (trendPoints.length > 0) {
    trendPoints.forEach((tp, idx) => {
      const row = ws2.getRow(r2++)
      row.height = 19
      const pct = totalTrendVol > 0 ? ((tp.issued / totalTrendVol) * 100).toFixed(1) + '%' : '0.0%'

      row.getCell(1).value = tp.label
      row.getCell(2).value = tp.issued
      row.getCell(3).value = pct
      row.getCell(4).value = tp.issued > 0 ? 'Intakes Recorded' : 'No Intakes'

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

  // Section 3: Case Status Distribution
  const sec3 = ws2.getRow(r2++)
  sec3.height = 20
  sec3.getCell(1).value = 'III. CASE STATUS DISTRIBUTION'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const sHRow = ws2.getRow(r2++)
  sHRow.height = 20
  ;['Status Category', 'Case Count', 'Percentage Share', 'Lifecycle Phase'].forEach((h, idx) => {
    const c = sHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const statuses = statusData?.breakdown || []
  if (statuses.length > 0) {
    statuses.forEach((st, idx) => {
      const row = ws2.getRow(r2++)
      row.height = 19
      row.getCell(1).value = st.label
      row.getCell(2).value = st.count
      row.getCell(3).value = `${st.percentage.toFixed(1)}%`
      row.getCell(4).value = 'Active BCPC Case Cycle'

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

  // Section 4: Child Classification Comparison (CAR vs CICL)
  const sec4 = ws2.getRow(r2++)
  sec4.height = 20
  sec4.getCell(1).value = 'IV. CHILD CLASSIFICATION COMPARISON (CAR VS. CICL)'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const catHRow = ws2.getRow(r2++)
  catHRow.height = 20
  ;['Child Category', 'Intake Count', 'Share (%)', 'Applicable Statutory Framework'].forEach((h, idx) => {
    const c = catHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const catItems = [
    {
      label: 'Children at Risk (CAR)',
      val: categoryData?.carCases ?? 0,
      share: `${(categoryData?.carPercentage ?? 0).toFixed(1)}%`,
      note: 'Prevention, curfew/truancy supervision, and family support',
    },
    {
      label: 'Children in Conflict with the Law (CICL)',
      val: categoryData?.ciclCases ?? 0,
      share: `${(categoryData?.ciclPercentage ?? 0).toFixed(1)}%`,
      note: 'Restorative diversion, custody assessment, and LSWDO endorsement',
    },
  ]

  catItems.forEach((ci, idx) => {
    const row = ws2.getRow(r2++)
    row.height = 19
    row.getCell(1).value = ci.label
    row.getCell(2).value = ci.val
    row.getCell(3).value = ci.share
    row.getCell(4).value = ci.note

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

  // Section 5: BCPC Settlement Efficiency
  const sec5 = ws2.getRow(r2++)
  sec5.height = 20
  sec5.getCell(1).value = 'V. BCPC SETTLEMENT EFFICIENCY AUDIT'
  ws2.mergeCells(`A${r2 - 1}:D${r2 - 1}`)
  styleMergedCells(ws2, r2 - 1, 1, r2 - 1, 4, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } },
    font: { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.sectionText } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: thinBorder,
  })

  const effHRow = ws2.getRow(r2++)
  effHRow.height = 20
  ;['Performance Metric', 'Value', 'Rate / Ratio', 'Resolution Evaluation'].forEach((h, idx) => {
    const c = effHRow.getCell(idx + 1)
    c.value = h
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } }
    c.alignment = { horizontal: idx === 1 || idx === 2 ? 'center' : 'left', vertical: 'middle', indent: idx === 0 ? 1 : 0 }
    c.border = thinBorder
  })

  const effRate = settlementData?.settlementRate ?? 0
  const effTotal = settlementData?.totalFormalComplaints ?? 0
  const effSettled = settlementData?.totalSettledCases ?? 0

  const effItems = [
    {
      desc: 'Settlement Efficiency Rate',
      val: `${effRate.toFixed(1)}%`,
      ratio: 'Performance Metric',
      note: 'Percentage of BCPC cases resolved through diversion or amicable agreement',
    },
    {
      desc: 'Total BCPC Cases Evaluated',
      val: effTotal,
      ratio: '100.0%',
      note: 'All child cases eligible for barangay-level resolution',
    },
    {
      desc: 'Successfully Settled Cases',
      val: effSettled,
      ratio: `${effRate.toFixed(1)}%`,
      note: 'Cases amicably resolved without external escalation',
    },
  ]

  effItems.forEach((ei, idx) => {
    const row = ws2.getRow(r2++)
    row.height = 19
    row.getCell(1).value = ei.desc
    row.getCell(2).value = ei.val
    row.getCell(3).value = ei.ratio
    row.getCell(4).value = ei.note

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

  // =============================================================
  // DOWNLOAD TRIGGER IN BROWSER
  // =============================================================
  const safeFrom = appliedFilters.dateFrom || 'start'
  const safeTo = appliedFilters.dateTo || 'end'
  const fileName = `Barangay_Ugong_BCPC_Report_${safeFrom}_to_${safeTo}.xlsx`

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

