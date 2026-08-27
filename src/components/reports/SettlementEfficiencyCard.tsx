import React, { useState, useEffect } from 'react'
import { CheckCircle2, Lightbulb, Scale } from 'lucide-react'
import { ChartInsightBox } from './ChartInsightBox'
import type { SettlementEfficiencyResponse } from '@/api/modules/blotter.api'

export interface SettlementEfficiencyCardProps {
  title?: string
  description?: string
  data?: SettlementEfficiencyResponse | null
  loading?: boolean
  showInsightsDefault?: boolean
  className?: string
}

export function SettlementEfficiencyCard({
  title = 'Desk Settlement Efficiency',
  description = 'Resolution rate of formal complaints settled directly at the blotter desk',
  data,
  loading = false,
  showInsightsDefault = false,
  className = '',
}: SettlementEfficiencyCardProps) {
  const [showInsights, setShowInsights] = useState(showInsightsDefault)

  useEffect(() => {
    setShowInsights(showInsightsDefault)
  }, [showInsightsDefault])

  const totalFormal = data?.totalFormalComplaints || 0
  const totalSettled = data?.totalSettledCases || 0
  const rate = data?.settlementRate ?? 0

  const insightMessage = totalFormal > 0
    ? `This performance card measures desk settlement efficiency for formal complaints filed within the selected period. Currently, ${totalSettled} out of ${totalFormal} formal complaints (${rate.toFixed(1)}%) were successfully settled directly at desk level without escalation to Lupon.`
    : 'This performance card measures desk settlement efficiency. No formal complaints were recorded within the selected date range.'

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-100 pb-3.5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading data...</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Main Hero Metric (Left Column) */}
            <div className="md:col-span-6 space-y-3 md:border-r md:border-slate-100 md:pr-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {rate.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Settlement Efficiency Rate</span>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                />
              </div>

              <p className="text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">{totalSettled}</span> out of{' '}
                <span className="font-semibold text-slate-900">{totalFormal}</span> formal complaints were successfully settled at the desk.
              </p>
            </div>

            {/* 2 Metric Breakdown Cards (Right Column) */}
            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              {/* Total Formal Complaints */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="flex justify-center text-slate-500 mb-1.5">
                  <Scale size={18} />
                </div>
                <span className="text-xs font-medium text-slate-500 block">Total Formal Complaints</span>
                <span className="text-2xl font-bold text-slate-900 mt-0.5 block">{totalFormal}</span>
              </div>

              {/* Settled Cases */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                <div className="flex justify-center text-emerald-600 mb-1.5">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-medium text-emerald-700 block">Settled Cases</span>
                <span className="text-2xl font-bold text-emerald-800 mt-0.5 block">{totalSettled}</span>
              </div>
            </div>
          </div>

          {/* Footer with Lightbulb View Chart Insights button */}
          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Formal Settlement Rate: <span className="font-semibold text-slate-800">{rate.toFixed(1)}%</span>
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
          {showInsights && <ChartInsightBox message={insightMessage} />}
        </div>
      )}
    </div>
  )
}
