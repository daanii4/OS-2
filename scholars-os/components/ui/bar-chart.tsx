'use client'

import * as React from 'react'
import type { BarShapeProps } from 'recharts'

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  type ChartConfig,
} from '@/components/ui/chart'

/** Dot grid behind bar plot area (brand-tinted). Use unique `patternId` per chart instance. */
export function ChartPlotDotBackground({ patternId }: { patternId: string }) {
  const href = `url(#${patternId})`
  return (
    <>
      <defs>
        <pattern id={patternId} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="var(--olive-400)" fillOpacity={0.22} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={href} style={{ pointerEvents: 'none' }} />
    </>
  )
}

/**
 * Diagonal hatch fill for vertical bars. Pass a stable id prefix from the chart
 * (e.g. `useId().replace(/:/g, ''))` so pattern URLs are unique per chart on the page.
 */
export function createOsHatchedBarShape(hatchBaseId: string) {
  return function OsHatchedBarShape(props: BarShapeProps) {
    const { x, y, width, height, fill, index } = props
    const pid = `${hatchBaseId}-bar-${index}`
  const w = Number(width) || 0
  const h = Number(height) || 0
  const bx = Number(x) || 0
  const by = Number(y) || 0

    if (w <= 0 || h <= 0) {
      return null
    }

    const fillColor = typeof fill === 'string' && fill.length > 0 ? fill : 'var(--olive-600)'

    return (
      <>
        <defs>
          <pattern
            id={pid}
            x="0"
            y="0"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <rect width="10" height="10" opacity={0.45} fill={fillColor} />
            <rect width="1" height="10" fill={fillColor} />
          </pattern>
        </defs>
        <rect rx={4} ry={4} x={bx} y={by} width={w} height={h} stroke="none" fill={`url(#${pid})`} />
      </>
    )
  }
}
