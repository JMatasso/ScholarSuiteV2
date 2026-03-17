"use client"

import { GraduationCap, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatTuition,
  formatAcceptanceRate,
  getCollegeTypeLabel,
  getLocaleLabel,
} from "@/lib/college-utils"
import type { College } from "./types"
import { CLASSIFICATIONS } from "./types"
import { useState } from "react"

interface CollegeDetailDialogProps {
  college: College | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToList: (college: College, classification: string) => void
}

function StatRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value ?? "N/A"}</span>
    </div>
  )
}

function formatPct(val: number | null | undefined): string {
  if (val == null) return "N/A"
  return `${val.toFixed(1)}%`
}

export function CollegeDetailDialog({
  college,
  open,
  onOpenChange,
  onAddToList,
}: CollegeDetailDialogProps) {
  const [classification, setClassification] = useState("MATCH")

  if (!college) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{college.name}</DialogTitle>
              <DialogDescription>
                {college.city}, {college.state}
                {college.type && ` \u00b7 ${getCollegeTypeLabel(college.type)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Overview */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-2">Overview</h4>
            <StatRow label="Type" value={college.type ? getCollegeTypeLabel(college.type) : null} />
            <StatRow label="Locale" value={college.locale ? getLocaleLabel(college.locale) : null} />
            <StatRow label="Enrollment" value={college.enrollment?.toLocaleString()} />
            <StatRow label="Undergrad Population" value={college.undergradPop?.toLocaleString()} />
            <StatRow label="Student-Faculty Ratio" value={college.studentFacultyRatio != null ? `${college.studentFacultyRatio}:1` : null} />
            {college.hbcu && <StatRow label="HBCU" value="Yes" />}
            {college.testOptional && <StatRow label="Test Optional" value="Yes" />}
          </div>

          {/* Admissions */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-2">Admissions</h4>
            <StatRow label="Acceptance Rate" value={formatAcceptanceRate(college.acceptanceRate ?? null)} />
            <StatRow label="SAT Range (25th-75th)" value={college.sat25 != null && college.sat75 != null ? `${college.sat25} - ${college.sat75}` : "N/A"} />
            <StatRow label="SAT Average" value={college.satAvg} />
            <StatRow label="ACT Range (25th-75th)" value={college.act25 != null && college.act75 != null ? `${college.act25} - ${college.act75}` : "N/A"} />
            <StatRow label="ACT Average" value={college.actAvg} />
          </div>

          {/* Cost */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-2">Cost</h4>
            <StatRow label="In-State Tuition" value={formatTuition(college.inStateTuition ?? null)} />
            <StatRow label="Out-of-State Tuition" value={formatTuition(college.outOfStateTuition ?? null)} />
            <StatRow label="Room & Board" value={formatTuition(college.roomAndBoard ?? null)} />
            <StatRow label="Books & Supplies" value={formatTuition(college.booksSupplies ?? null)} />
          </div>

          {/* Outcomes */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-2">Outcomes</h4>
            <StatRow label="4-Year Graduation Rate" value={formatPct(college.gradRate4yr)} />
            <StatRow label="6-Year Graduation Rate" value={formatPct(college.gradRate6yr)} />
            <StatRow label="Retention Rate" value={formatPct(college.retentionRate)} />
            <StatRow label="Median Earnings (6yr)" value={formatTuition(college.medianEarnings6yr ?? null)} />
            <StatRow label="Median Earnings (10yr)" value={formatTuition(college.medianEarnings10yr ?? null)} />
            <StatRow label="Median Debt" value={formatTuition(college.medianDebt ?? null)} />
          </div>

          {/* Financial Aid */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-2">Financial Aid</h4>
            <StatRow label="Pell Grant Recipients" value={formatPct(college.pellPct)} />
            <StatRow label="Federal Loan Recipients" value={formatPct(college.fedLoanPct)} />
          </div>

          {/* Website */}
          {college.website && (
            <a
              href={college.website.startsWith("http") ? college.website : `https://${college.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Website
            </a>
          )}

          {/* Add to List */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Select value={classification} onValueChange={(v: string | null) => { if (v) setClassification(v) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="flex-1 bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1"
              onClick={() => onAddToList(college, classification)}
            >
              <Plus className="h-4 w-4" />
              Add to My List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
