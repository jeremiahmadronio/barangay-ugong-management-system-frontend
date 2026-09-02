import React from 'react'

export interface TrendInsightParams {
  totalVolume: number
  rangeLabel: string
  busiest?: { label: string; issued: number } | null
  slowest?: { label: string; issued: number } | null
  granularityLabel?: string
  itemLabel?: string
}

export interface PurokInsightParams {
  totalVolume: number
  highestPurok?: string | null
  highestCount?: number
  totalPuroks?: number
}

export interface EducationInsightParams {
  topEducation?: string | null
  topCount?: number
  totalVolume: number
}

export interface PurposeInsightParams {
  topPurpose?: string | null
  topCount?: number
  totalVolume: number
  sharePercentage?: number | string
}

export interface ReissuanceInsightParams {
  originalCount: number
  reissuanceCount: number
  totalVolume: number
}

/**
 * A. Trend Wave Chart Insight Generator - Detailed Analytical Narrative
 */
export function getTrendChartInsight({
  totalVolume,
  rangeLabel,
  busiest,
  slowest,
  granularityLabel = 'daily or monthly',
  itemLabel = 'cases',
}: TrendInsightParams): React.ReactNode {
  if (totalVolume === 0) {
    return (
      <>
        No {itemLabel} activity was recorded across{' '}
        <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>. During this window, operations recorded zero volume. Administrative staff can utilize this operational downtime to conduct comprehensive record auditing and verify archive logs in preparation for upcoming activity.
      </>
    )
  }

  const isSinglePeak =
    busiest &&
    busiest.issued > 0 &&
    (!slowest || slowest.issued === 0 || busiest.issued >= totalVolume * 0.5)

  const isCertOrClearance =
    itemLabel.toLowerCase().includes('cert') ||
    itemLabel.toLowerCase().includes('clearance') ||
    itemLabel.toLowerCase().includes('document')

  const operationalRecommendation = isCertOrClearance
    ? 'suggesting that front-desk staffing and clearance document processing capacity should be optimized during similar calendar periods.'
    : 'suggesting that desk staffing and mediation/conciliation scheduling should be optimized during similar calendar periods.'

  const workflowRecommendation = isCertOrClearance
    ? 'maintain smooth clearance issuance and release workflow.'
    : 'maintain smooth resolution workflow.'

  if (isSinglePeak && busiest) {
    const peakShare = ((busiest.issued / totalVolume) * 100).toFixed(1)
    return (
      <>
        This trend wave chart tracks total {itemLabel} volume across{' '}
        <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>. An aggregate total of{' '}
        <strong className="text-slate-900 font-semibold">{totalVolume} {itemLabel}</strong> were recorded during this period, with peak operational demand concentrated heavily in{' '}
        <strong className="text-slate-900 font-semibold">{busiest.label}</strong> accounting for{' '}
        <strong className="text-slate-900 font-semibold">{busiest.issued} entries ({peakShare}% of total volume)</strong>. This significant concentration highlights a high-demand processing window, {operationalRecommendation}
      </>
    )
  }

  return (
    <>
      This trend wave chart visualizes the temporal distribution of {itemLabel} over{' '}
      <strong className="text-slate-900 font-semibold">{rangeLabel}</strong>. Across this date range, a total of{' '}
      <strong className="text-slate-900 font-semibold">{totalVolume} {itemLabel}</strong> were processed. Processing activity reached its peak on{' '}
      <strong className="text-slate-900 font-semibold">{busiest?.label || 'the peak period'}</strong> with{' '}
      <strong className="text-slate-900 font-semibold">{busiest?.issued ?? 0} records</strong>, while the lowest volume period occurred on{' '}
      <strong className="text-slate-900 font-semibold">{slowest?.label || 'the low period'}</strong> recording{' '}
      <strong className="text-slate-900 font-semibold">{slowest?.issued ?? 0} records</strong>. Tracking these operational fluctuations enables officers to anticipate request volume and {workflowRecommendation}
    </>
  )
}

/**
 * B. Purok / Sitio Distribution Insight Generator - Detailed Analytical Narrative
 */
export function getPurokInsight({
  totalVolume,
  highestPurok,
  highestCount = 0,
  totalPuroks = 1,
}: PurokInsightParams): React.ReactNode {
  if (totalVolume === 0) {
    return <>No geographic distribution records are available for the currently applied date range and filter criteria.</>
  }

  const percentage = totalVolume > 0 ? ((highestCount / totalVolume) * 100).toFixed(1) : '0'

  return (
    <>
      This geographic breakdown maps applicant residency concentration across barangay puroks ({totalVolume} total applicants across {totalPuroks} puroks). Resident demand is highest in{' '}
      <strong className="text-slate-900 font-semibold">{highestPurok || 'N/A'}</strong>, generating{' '}
      <strong className="text-slate-900 font-semibold">{highestCount} applications ({percentage}% of all records)</strong>. This spatial clustering indicates key target areas where barangay livelihood desks, mobile job-matching caravans, and youth employment outreach programs should prioritize field operations.
    </>
  )
}

/**
 * C. Educational Attainment Breakdown Insight Generator - Detailed Analytical Narrative
 */
export function getEducationInsight({
  topEducation,
  topCount = 0,
  totalVolume,
}: EducationInsightParams): React.ReactNode {
  if (totalVolume === 0) {
    return <>No educational background data records match your currently selected filter parameters.</>
  }

  const percentage = totalVolume > 0 ? ((topCount / totalVolume) * 100).toFixed(1) : '0'

  return (
    <>
      This chart illustrates the qualification profile of workforce entrants requesting FTJS assistance ({totalVolume} total jobseekers). The primary educational background segment consists of{' '}
      <strong className="text-slate-900 font-semibold">{topEducation || 'N/A'}</strong> graduates, accounting for{' '}
      <strong className="text-slate-900 font-semibold">{topCount} applicants ({percentage}% of total volume)</strong>. Understanding this educational distribution enables barangay officials to align local vocational training partnerships, skill-upgrading workshops, and job placement drives with the actual qualifications of jobseekers.
    </>
  )
}

/**
 * D. Purpose of Request Breakdown Insight Generator - Detailed Analytical Narrative
 */
export function getPurposeInsight({
  topPurpose,
  topCount = 0,
  totalVolume,
  sharePercentage,
}: PurposeInsightParams): React.ReactNode {
  if (totalVolume === 0) {
    return <>No document request purpose records were found matching the applied filter criteria.</>
  }

  const pct =
    sharePercentage !== undefined
      ? sharePercentage
      : totalVolume > 0
      ? ((topCount / totalVolume) * 100).toFixed(1)
      : '0'

  return (
    <>
      This breakdown chart categorizes the specific document request purposes specified by jobseekers ({totalVolume} total requests). The leading driver of certificate requests is{' '}
      <strong className="text-slate-900 font-semibold">{topPurpose || 'N/A'}</strong>, representing{' '}
      <strong className="text-slate-900 font-semibold">{topCount} applications ({pct}% share)</strong>. This confirms that local employment documentation requirements represent the primary service driver, helping barangay officers evaluate service utilization and streamline document processing procedures.
    </>
  )
}

/**
 * E. Original vs. Re-issuance Breakdown Insight Generator - Detailed Analytical Narrative
 */
export function getReissuanceInsight({
  originalCount = 0,
  reissuanceCount = 0,
  totalVolume,
}: ReissuanceInsightParams): React.ReactNode {
  if (totalVolume === 0) {
    return <>No issuance breakdown records are available within the selected date range and filter criteria.</>
  }

  const originalPct = totalVolume > 0 ? ((originalCount / totalVolume) * 100).toFixed(1) : '0'
  const reissuancePct = totalVolume > 0 ? ((reissuanceCount / totalVolume) * 100).toFixed(1) : '0'

  return (
    <>
      This distribution chart compares first-time original releases versus replacement re-issuances under Republic Act 11261 ({totalVolume} total issuances). First-time original releases account for{' '}
      <strong className="text-slate-900 font-semibold">{originalPct}% ({originalCount} records)</strong> of total releases, while replacement re-issuances represent{' '}
      <strong className="text-slate-900 font-semibold">{reissuancePct}% ({reissuanceCount} records)</strong>. Tracking this ratio ensures strict legislative compliance and verifies single-availment statutory benefit enforcement under RA 11261.
    </>
  )
}
