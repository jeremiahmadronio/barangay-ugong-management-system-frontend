import React, { useState, useEffect } from 'react'
import { Lightbulb, Handshake, type LucideIcon } from 'lucide-react'
import { ChartInsightBox } from './ChartInsightBox'
import type { SettlementEfficiencyResponse } from '@/api/modules/blotter.api'

export interface SettlementEfficiencyCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
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
  icon: Icon = Handshake,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />}
              <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
            </div>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {rate.toFixed(1)}% Settled
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading settlement data...</div>
        ) : (
          <div className="space-y-4 pt-3">
            {/* Top Metric Row: Big Percentage & Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {rate.toFixed(1)}%
                  </span>
                  <span className="text-xs font-medium text-slate-500">{rateLabel}</span>
                </div>
                <span className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{totalSettled}</span> of{' '}
                  <span className="font-semibold text-slate-800">{totalFormal}</span> cases settled
                </span>
              </div>

              {/* Clean Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* 2 Metric Breakdown Sub-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Total Subject Cases */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{totalLabel}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalFormal}</p>
              </div>

              {/* Settled Cases */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{settledLabel}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalSettled}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
          >
            <Lightbulb size={13} className={showInsights ? 'text-amber-500' : 'text-slate-400'} />
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
