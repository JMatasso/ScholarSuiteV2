"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Save, Trash2, FolderOpen } from "@/lib/icons"
import {
  GRADE_OPTIONS, COURSE_TYPE_LABELS,
  calculateGpa, calculateWhatIfGpa,
  type CourseType, type CourseStatus, type WeightedScale,
} from "@/lib/gpa"

interface SimCourse {
  id: string
  name: string
  type: CourseType
  credits: number
  status: CourseStatus
  grade: string | null
  yearLabel: string
  semester: string
}

interface SavedPlan {
  id: string
  name: string
  grades: Record<string, string>
  resultUw: number | null
  resultW: number | null
  updatedAt: string
}

interface GpaSimulatorProps {
  years: {
    id: string
    year: number
    label: string
    courses: {
      id: string
      name: string
      type: CourseType
      credits: number
      status: CourseStatus
      grade: string | null
      semester: string
      subject: string
      apScore: number | null
      ibScore: number | null
    }[]
  }[]
  weightedScale: WeightedScale
}

export function GpaSimulator({ years, weightedScale }: GpaSimulatorProps) {
  // Collect all courses, tagging each with its year label
  const allCourses = useMemo(() => {
    const list: SimCourse[] = []
    for (const y of years) {
      for (const c of y.courses) {
        list.push({
          id: c.id,
          name: c.name,
          type: c.type,
          credits: c.credits,
          status: c.status,
          grade: c.grade,
          yearLabel: y.label,
          semester: c.semester,
        })
      }
    }
    return list
  }, [years])

  // Courses eligible for what-if grading: PLANNED or IN_PROGRESS without a final grade
  const ungradedCourses = useMemo(
    () => allCourses.filter((c) => (c.status === "PLANNED" || c.status === "IN_PROGRESS") && !c.grade),
    [allCourses],
  )

  // Hypothetical grades keyed by course id
  const [hypotheticals, setHypotheticals] = useState<Record<string, string>>({})
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [planName, setPlanName] = useState("")
  const [saving, setSaving] = useState(false)

  const hasAnyHypothetical = Object.values(hypotheticals).some(Boolean)

  // Fetch saved plans on mount
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/academics/gpa-plans")
      if (res.ok) {
        const data = await res.json()
        setSavedPlans(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  // Build the full course list with hypothetical grades merged in
  const mergedCourses = useMemo(() => {
    return allCourses.map((c) => ({
      grade: hypotheticals[c.id] || c.grade,
      credits: c.credits,
      type: c.type,
      status: c.status,
    }))
  }, [allCourses, hypotheticals])

  const currentGpa = useMemo(
    () => calculateGpa(mergedCourses, weightedScale),
    [mergedCourses, weightedScale],
  )

  const whatIfGpa = useMemo(
    () => calculateWhatIfGpa(mergedCourses, weightedScale),
    [mergedCourses, weightedScale],
  )

  const setGrade = (courseId: string, grade: string) => {
    setHypotheticals((prev) => ({ ...prev, [courseId]: grade }))
    setActivePlanId(null) // mark as modified
  }

  const fillAllWith = (grade: string) => {
    const filled: Record<string, string> = {}
    for (const c of ungradedCourses) {
      filled[c.id] = grade
    }
    setHypotheticals(filled)
    setActivePlanId(null)
  }

  const reset = () => {
    setHypotheticals({})
    setActivePlanId(null)
    setPlanName("")
  }

  const handleSave = async () => {
    const name = planName.trim() || "Untitled Plan"
    setSaving(true)
    try {
      if (activePlanId) {
        // Update existing plan
        const res = await fetch(`/api/academics/gpa-plans/${activePlanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            grades: hypotheticals,
            resultUw: whatIfGpa.unweighted,
            resultW: whatIfGpa.weighted,
          }),
        })
        if (!res.ok) throw new Error()
        toast.success("Plan updated")
      } else {
        // Create new plan
        const res = await fetch("/api/academics/gpa-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            grades: hypotheticals,
            resultUw: whatIfGpa.unweighted,
            resultW: whatIfGpa.weighted,
          }),
        })
        if (!res.ok) throw new Error()
        const plan = await res.json()
        setActivePlanId(plan.id)
        toast.success("Plan saved")
      }
      await fetchPlans()
    } catch {
      toast.error("Failed to save plan")
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = (plan: SavedPlan) => {
    const grades = (typeof plan.grades === "object" && plan.grades !== null)
      ? plan.grades as Record<string, string>
      : {}
    setHypotheticals(grades)
    setActivePlanId(plan.id)
    setPlanName(plan.name)
  }

  const handleDelete = async (planId: string) => {
    try {
      const res = await fetch(`/api/academics/gpa-plans/${planId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      if (activePlanId === planId) {
        setActivePlanId(null)
        setPlanName("")
      }
      toast.success("Plan deleted")
      await fetchPlans()
    } catch {
      toast.error("Failed to delete plan")
    }
  }

  if (ungradedCourses.length === 0 && savedPlans.length === 0) return null

  const gpaDelta = hasAnyHypothetical
    ? whatIfGpa.weighted - currentGpa.weighted
    : 0

  return (
    <Card variant="bento">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
            <TrendingUp className="h-3.5 w-3.5 text-[#1E3A5F]" />
          </div>
          GPA What-If Calculator
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v: string | null) => v && fillAllWith(v)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Fill all with..." />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.filter((g) => g.value !== "P" && g.value !== "W").map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasAnyHypothetical && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Assign hypothetical grades to your planned and in-progress courses to see how they&apos;d affect your GPA. Save plans to compare different scenarios.
        </p>

        {/* Saved plans bar */}
        {savedPlans.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" /> Saved Plans
            </h4>
            <div className="flex flex-wrap gap-2">
              {savedPlans.map((p) => (
                <div
                  key={p.id}
                  className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                    activePlanId === p.id
                      ? "border-[#2563EB] bg-blue-50/50 text-[#2563EB]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <button
                    className="flex items-center gap-2"
                    onClick={() => handleLoad(p)}
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.resultW != null && (
                      <span className="text-xs text-muted-foreground">W: {p.resultW.toFixed(2)}</span>
                    )}
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600"
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What-if results banner */}
        {hasAnyHypothetical && (
          <div className="flex items-center gap-6 rounded-lg border border-[#2563EB]/20 bg-blue-50/50 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Current Weighted</p>
              <p className="text-lg font-semibold text-[#1E3A5F]">{currentGpa.weighted.toFixed(3)}</p>
            </div>
            <div className="text-muted-foreground text-lg">&rarr;</div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Projected With What-If</p>
              <p className="text-lg font-semibold text-[#2563EB]">{whatIfGpa.weighted.toFixed(3)}</p>
            </div>
            <div className={`ml-auto rounded-md px-2.5 py-1 text-sm font-semibold ${gpaDelta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {gpaDelta >= 0 ? "+" : ""}{gpaDelta.toFixed(3)}
            </div>
          </div>
        )}

        {/* Course grade assignment table */}
        {ungradedCourses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Course</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Year</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Type</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide text-center">Credits</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Hypothetical Grade</th>
                </tr>
              </thead>
              <tbody>
                {ungradedCourses.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-sm font-medium">{c.name}</td>
                    <td className="py-2.5 px-3 text-sm text-muted-foreground">{c.yearLabel}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                        {COURSE_TYPE_LABELS[c.type]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-center">{c.credits}</td>
                    <td className="py-2.5 px-3">
                      <Select
                        value={hypotheticals[c.id] || "__none__"}
                        onValueChange={(v) => v && setGrade(c.id, v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger className="w-28 h-8 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">--</SelectItem>
                          {GRADE_OPTIONS.filter((g) => g.value !== "P" && g.value !== "W").map((g) => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save plan bar */}
        {hasAnyHypothetical && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3">
            <Input
              placeholder="Plan name (e.g. Best Case, Realistic)"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="h-8 max-w-xs text-sm"
            />
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
              disabled={saving}
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5" />
              {activePlanId ? "Update Plan" : "Save Plan"}
            </Button>
            {activePlanId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setActivePlanId(null); setPlanName("") }}
              >
                Save as New
              </Button>
            )}
          </div>
        )}

        {/* Unweighted comparison */}
        {hasAnyHypothetical && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span>Unweighted: {currentGpa.unweighted.toFixed(3)} &rarr; <span className="font-medium text-foreground">{whatIfGpa.unweighted.toFixed(3)}</span></span>
            <span>&middot;</span>
            <span>Total courses in projection: {whatIfGpa.courseCount}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
