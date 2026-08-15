import React from 'react'
import { PieChartIcon } from 'lucide-react'
import { ChartCard } from '../ui/ChartCard'
import { DonutChart } from '../ui/DonutChart'
import { LegendTable } from '../ui/LegendTable'
import { colorAt } from '../../utils/chartColors'
import type { Slice } from '../../utils/analytics'

/** Distribution of certificate purposes. */
export function PurposeChart({ purposes, total }: { purposes: Slice[]; total: number }) {
  const data = purposes.filter((p) => p.value > 0)

  return (
    <ChartCard
      title="Purpose of Request"
      description="Why the certificate was requested"
      icon={PieChartIcon}
    >
      <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[200px_1fr]">
        <DonutChart
          data={data.map((d, i) => ({ label: d.label, value: d.value, color: colorAt(i) }))}
          size={200}
          thickness={40}
          centerValue={total}
          centerLabel="Requests"
          valueNoun="applicants"
        />
        <LegendTable rows={data} labelHeading="Purpose" />
      </div>
    </ChartCard>
  )
}
