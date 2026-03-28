"use client"

import React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(330, 81%, 60%)",
  "hsl(160, 60%, 45%)",
]

interface DailyCostChartProps {
  data: { date: string; cost: number }[]
}

export function DailyCostChart({ data }: DailyCostChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily AI Cost (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `$${v.toFixed(3)}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface CostByModelChartProps {
  data: { model: string; cost: number }[]
}

export function CostByModelChart({ data }: CostByModelChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="model"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `$${v.toFixed(3)}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface DailyTokenChartProps {
  data: { date: string; input: number; output: number }[]
}

export function DailyTokenChart({ data }: DailyTokenChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Token Usage (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                formatter={(value, name) => [
                  Number(value).toLocaleString("en-US"),
                  name === "input" ? "Input Tokens" : "Output Tokens",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="input" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="output" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface UsageByFeatureChartProps {
  data: { feature: string; count: number }[]
}

export function UsageByFeatureChart({ data }: UsageByFeatureChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage by Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="count"
                nameKey="feature"
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ""} (${((Number(props.percent) || 0) * 100).toFixed(0)}%)`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [Number(value).toLocaleString("en-US"), String(name)]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureTimeHeatmapProps {
  features: string[]
  weeks: string[]
  matrix: Record<string, Record<string, number>>
  maxCount: number
}

export function FeatureTimeHeatmap({ features, weeks, matrix, maxCount }: FeatureTimeHeatmapProps) {
  function getIntensity(count: number): string {
    if (count === 0) return "transparent"
    const ratio = Math.min(count / Math.max(maxCount, 1), 1)
    const alpha = 0.15 + ratio * 0.85
    return `hsla(221, 83%, 53%, ${alpha})`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-px" style={{
            gridTemplateColumns: `140px repeat(${weeks.length}, minmax(60px, 1fr))`,
          }}>
            {/* Header row */}
            <div className="sticky left-0 bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Feature
            </div>
            {weeks.map((w) => (
              <div key={w} className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground text-center truncate">
                {w}
              </div>
            ))}

            {/* Data rows */}
            {features.map((feature) => (
              <React.Fragment key={feature}>
                <div className="sticky left-0 bg-background px-2 py-1.5 text-xs font-medium truncate border-t border-border/50">
                  {feature}
                </div>
                {weeks.map((week) => {
                  const count = matrix[feature]?.[week] ?? 0
                  return (
                    <div
                      key={`${feature}-${week}`}
                      className="px-2 py-1.5 text-xs text-center tabular-nums border-t border-border/50 rounded-sm relative group cursor-default"
                      style={{ backgroundColor: getIntensity(count) }}
                    >
                      {count > 0 ? count : ""}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-md z-10">
                        {feature}: {count} requests ({week})
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0.08, 0.25, 0.5, 0.75, 1].map((o) => (
            <div key={o} className="size-3 rounded-sm" style={{ backgroundColor: `hsla(221, 83%, 53%, ${o})` }} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
