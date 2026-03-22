"use client"

import { X, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
} from "@/lib/college-utils"
import type { College } from "./types"

interface ComparisonPanelProps {
  colleges: College[]
  onRemove: (id: string) => void
  onAddToList: (college: College) => void
  onClearAll: () => void
}

function formatPct(val: number | null | undefined): string {
  if (val == null) return "N/A"
  return `${val.toFixed(1)}%`
}

const COMPARISON_ROWS: { label: string; getValue: (c: College) => string }[] = [
  { label: "Type", getValue: (c) => c.type ? getCollegeTypeLabel(c.type) : "N/A" },
  { label: "Acceptance Rate", getValue: (c) => formatAcceptanceRate(c.acceptanceRate ?? null) },
  { label: "SAT Range", getValue: (c) => c.sat25 != null && c.sat75 != null ? `${c.sat25}-${c.sat75}` : "N/A" },
  { label: "ACT Range", getValue: (c) => c.act25 != null && c.act75 != null ? `${c.act25}-${c.act75}` : "N/A" },
  { label: "In-State Tuition", getValue: (c) => formatTuition(c.inStateTuition ?? null) },
  { label: "Out-of-State Tuition", getValue: (c) => formatTuition(c.outOfStateTuition ?? null) },
  { label: "Room & Board", getValue: (c) => formatTuition(c.roomAndBoard ?? null) },
  { label: "Graduation Rate (6yr)", getValue: (c) => formatPct(c.gradRate6yr) },
  { label: "Retention Rate", getValue: (c) => formatPct(c.retentionRate) },
  { label: "Median Earnings (10yr)", getValue: (c) => formatTuition(c.medianEarnings10yr ?? null) },
  { label: "Median Debt", getValue: (c) => formatTuition(c.medianDebt ?? null) },
  { label: "Student-Faculty Ratio", getValue: (c) => c.studentFacultyRatio != null ? `${c.studentFacultyRatio}:1` : "N/A" },
  { label: "Enrollment", getValue: (c) => c.enrollment?.toLocaleString() ?? "N/A" },
]

export function ComparisonPanel({ colleges, onRemove, onAddToList, onClearAll }: ComparisonPanelProps) {
  if (colleges.length < 2) return null

  return (
    <Card variant="bento">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-secondary-foreground">
            Compare Colleges ({colleges.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-muted-foreground">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-40">Metric</th>
                {colleges.map((c) => (
                  <th key={c.id} className="text-left py-2 px-3 font-medium min-w-[160px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-secondary-foreground">{c.name}</span>
                      <button
                        onClick={() => onRemove(c.id)}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-rose-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border hover:bg-muted/50/50">
                  <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                  {colleges.map((c) => (
                    <td key={c.id} className="py-2 px-3 font-medium">{row.getValue(c)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-3 pr-4"></td>
                {colleges.map((c) => (
                  <td key={c.id} className="py-3 px-3">
                    <Button
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => onAddToList(c)}
                    >
                      <Plus className="h-3 w-3" />
                      Add to List
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
