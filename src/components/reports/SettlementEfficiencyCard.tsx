import React, { useState, useEffect } from 'react'
import { CheckCircle2, Lightbulb, Scale } from 'lucide-react'
import { ChartInsightBox } from './ChartInsightBox'
import type { SettlementEfficiencyResponse } from '@/api/modules/blotter.api'

export interface SettlementEfficiencyCardProps {
  title?: string
  description?: string
  data?: SettlementEfficiencyResponse | {
    totalFormalComplaints?: number
    totalSettledCases?: number
    settlementRate?: number
    totalCases?: number
  } | null
  loading?: boolean
  showInsightsDefault?: boolean
  className?: string
  totalLabel?: string
  settledLabel?: string
  rateLabel?: string
  summaryText?: string
  footerLabel?: string
  insightMessage?: React.ReactNode
}

export function SettlementEfficiencyCard({
  title = 'Desk Settlement Efficiency',
  description = 'Resolution rate of formal complaints settled directly at the blotter desk',
  data,
  loading = false,
  showInsightsDefault = false,
  className = '',
  totalLabel = 'Total Formal Complaints',
  settledLabel = 'Settled Cases',
  rateLabel = 'Settlement Efficiency Rate',
  summaryText,
  footerLabel = 'Formal Settlement Rate',
  insightMessage: customInsightMessage,
}: SettlementEfficiencyCardProps) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const totalFormal = data?.totalFormalComplaints || 0
  const totalSettled = data?.totalSettledCases || 0
  const rate = data?.settlementRate ?? 0

  const defaultSummary = summaryText || (
    <>
      <span className="font-semibold text-emerald-700">{totalSettled}</span> out of{' '}
      <span className="font-semibold text-slate-900">{totalFormal}</span> cases were successfully settled.
    </>
  )

  const defaultInsight = totalFormal > 0
    ? `This performance card measures settlement efficiency for dispute cases within the selected period. Currently, ${totalSettled} out of ${totalFormal} cases (${rate.toFixed(1)}%) were successfully resolved through amicable settlement.`
    : 'This performance card measures settlement efficiency. No cases were recorded within the selected date range.'

  const activeInsight = customInsightMessage ?? defaultInsight

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between ${className}`}>
      <div>
        {/* Header */}
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading settlement data...</div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Top Metric Row: Big Percentage & Progress Bar */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {rate.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">{rateLabel}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                />
              </div>

              <p className="text-xs text-slate-600">
                {defaultSummary}
              </p>
            </div>

            {/* 2 Metric Breakdown Sub-Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Subject Cases */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="flex justify-center text-slate-500 mb-1">
                  <Scale size={16} />
                </div>
                <span className="text-[11px] font-medium text-slate-500 block truncate">{totalLabel}</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalFormal}</span>
              </div>

              {/* Settled Cases */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <div className="flex justify-center text-emerald-600 mb-1">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-[11px] font-medium text-emerald-700 block truncate">{settledLabel}</span>
                <span className="text-xl font-bold text-emerald-800 mt-0.5 block">{totalSettled}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Lightbulb View Chart Insights button */}
      <div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {footerLabel}: <span className="font-semibold text-slate-800">{rate.toFixed(1)}%</span>
          </span>
          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <Lightbulb size={13} className={showInsights ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'} />
            {showInsights ? 'Hide Chart Insights' : 'View Chart Insights'}
          </button>
        </div>

        {/* Connected Chart Insight Box */}
        {showInsights && (
          <div className="mt-3 animate-in fade-in duration-200">
            <ChartInsightBox message={activeInsight} />
          </div>
        )}
      </div>
    </div>
  )
}
