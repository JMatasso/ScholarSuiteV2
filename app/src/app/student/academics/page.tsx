"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import {
  Plus, Trash2, Edit, BookOpen, GraduationCap, Award, Settings,
} from "@/lib/icons"
import { TranscriptUploadSection } from "@/components/transcript-upload"
import { GpaSimulator } from "@/components/gpa-simulator"
import {
  GRADE_OPTIONS, COURSE_TYPE_LABELS, SUBJECT_OPTIONS,
  type CourseType, type CourseStatus, type WeightedScale,
} from "@/lib/gpa"
import { AP_COURSES, IB_COURSES, detectSubject } from "@/lib/course-catalog"

// ── Types ──

interface Course {
  id: string
  name: string
  type: CourseType
  credits: number
  semester: string
  grade: string | null
  status: CourseStatus
  subject: string
  apScore: number | null
  ibScore: number | null
}

interface AcademicYear {
  id: string
  year: number
  label: string
  courses: Course[]
}

interface GpaSummary {
  cumulative: { unweighted: number; weighted: number }
  projected: { unweighted: number; weighted: number }
  byYear: { year: number; label: string; unweighted: number; weighted: number }[]
  weightedScale: WeightedScale
  totalCourses: number
}

const YEAR_LABELS = ["Freshman", "Sophomore", "Junior", "Senior"]
const SEMESTER_OPTIONS = [
  { value: "Fall", label: "Fall" },
  { value: "Spring", label: "Spring" },
  { value: "Full Year", label: "Full Year" },
]
const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
]

const emptyCourse = {
  name: "", type: "REGULAR" as CourseType, credits: 1, semester: "Fall",
  grade: null as string | null, status: "PLANNED" as CourseStatus,
  subject: "Other", apScore: null as number | null, ibScore: null as number | null,
}

// ── GPA Summary Component ──

function GpaSummary({ gpa, loading }: { gpa: GpaSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card variant="bento" key={i}><CardContent className="py-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        ))}
      </div>
    )
  }
  if (!gpa) return null

  const stats = [
    { label: "Unweighted GPA", value: gpa.cumulative.unweighted.toFixed(3), icon: BookOpen },
    { label: "Weighted GPA", value: gpa.cumulative.weighted.toFixed(3), icon: Award },
    { label: "Projected Weighted", value: gpa.projected.weighted.toFixed(3), icon: GraduationCap },
    { label: "Total Courses", value: String(gpa.totalCourses), icon: BookOpen },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card variant="bento" key={s.label}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold text-[#1E3A5F]">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Course Row Component ──

function CourseRow({
  course, onEdit, onDelete,
}: {
  course: Course
  onEdit: () => void
  onDelete: () => void
}) {
  const statusColors: Record<CourseStatus, string> = {
    PLANNED: "bg-gray-100 text-gray-600 border-gray-200",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }
  const statusLabel: Record<CourseStatus, string> = {
    PLANNED: "Planned", IN_PROGRESS: "In Progress", COMPLETED: "Completed",
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
      <td className="py-2.5 px-3 text-sm font-medium">{course.name}</td>
      <td className="py-2.5 px-3">
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
          {COURSE_TYPE_LABELS[course.type]}
        </span>
      </td>
      <td className="py-2.5 px-3 text-sm text-muted-foreground">{course.subject}</td>
      <td className="py-2.5 px-3 text-sm text-center">{course.credits}</td>
      <td className="py-2.5 px-3 text-sm text-muted-foreground">{course.semester}</td>
      <td className="py-2.5 px-3 text-sm font-medium">{course.grade ?? "--"}</td>
      <td className="py-2.5 px-3">
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColors[course.status]}`}>
          {statusLabel[course.status]}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" className="hover:text-rose-600" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </td>
    </tr>
  )
}

// ── Course Name Autocomplete ──

function CourseAutocomplete({
  value, onChange, courseType,
}: {
  value: string
  onChange: (name: string, autoSubject?: string) => void
  courseType: CourseType
}) {
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  const catalog = courseType === "AP" ? AP_COURSES : courseType === "IB" ? IB_COURSES : []
  const suggestions = catalog.filter(
    (c) => c.toLowerCase().includes(query.toLowerCase()) && c !== query
  ).slice(0, 8)
  const showSuggestions = focused && query.length > 0 && suggestions.length > 0

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder={courseType === "AP" ? "Start typing AP course name..." : courseType === "IB" ? "Start typing IB course name..." : "e.g. English 10"}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value) }}
        onFocus={() => setFocused(true)}
      />
      {showSuggestions && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(s)
                onChange(s, detectSubject(s))
                setFocused(false)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Add/Edit Course Dialog ──

function CourseDialog({
  open, onOpenChange, initial, onSave, saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: typeof emptyCourse & { id?: string }
  onSave: (data: typeof emptyCourse & { id?: string }) => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  useEffect(() => { if (open) setForm(initial) }, [open, initial])

  const isEdit = !!initial.id
  const isAP = form.type === "AP"
  const isIB = form.type === "IB"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Add Course"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Course Name</label>
            <CourseAutocomplete
              value={form.name}
              courseType={form.type}
              onChange={(name, autoSubject) => setForm((f) => ({
                ...f,
                name,
                ...(autoSubject ? { subject: autoSubject } : {}),
              }))}
            />
            {(isAP || isIB) && (
              <p className="text-[11px] text-muted-foreground">
                Start typing to see official {isAP ? "AP" : "IB"} course suggestions
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={form.type} onValueChange={(v) => v && setForm((f) => ({ ...f, type: v as CourseType, name: "" }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(COURSE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Select value={form.subject} onValueChange={(v) => v && setForm((f) => ({ ...f, subject: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Credits</label>
            <Input
              type="number" min={0.5} max={5} step={0.5}
              value={form.credits}
              onChange={(e) => setForm((f) => ({ ...f, credits: parseFloat(e.target.value) || 1 }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Semester</label>
            <Select value={form.semester} onValueChange={(v) => v && setForm((f) => ({ ...f, semester: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Grade</label>
            <Select value={form.grade ?? "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, grade: v === "__none__" ? null : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Not graded" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not graded</SelectItem>
                {GRADE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as CourseStatus }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAP && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">AP Score (1-5)</label>
              <Input
                type="number" min={1} max={5}
                value={form.apScore ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, apScore: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="Optional"
              />
            </div>
          )}

          {isIB && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">IB Score (1-7)</label>
              <Input
                type="number" min={1} max={7}
                value={form.ibScore ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ibScore: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="Optional"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            disabled={!form.name.trim() || saving}
            onClick={() => onSave(form)}
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Year Section Component ──

function YearSection({
  academicYear, yearGpa, onAddCourse, onEditCourse, onDeleteCourse,
}: {
  academicYear: AcademicYear
  yearGpa: { unweighted: number; weighted: number } | null
  onAddCourse: (yearId: string) => void
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
}) {
  const courses = academicYear.courses

  return (
    <Card variant="bento">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>{academicYear.label}</CardTitle>
          {yearGpa && (
            <span className="text-xs text-muted-foreground">
              UW: {yearGpa.unweighted.toFixed(2)} | W: {yearGpa.weighted.toFixed(2)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
          onClick={() => onAddCourse(academicYear.id)}
        >
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-[#1E3A5F]">No courses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Course&quot; to start building your {academicYear.label} schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Course</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Type</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Subject</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide text-center">Credits</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Semester</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Grade</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Status</th>
                  <th className="py-2 px-3 text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    onEdit={() => onEditCourse(c)}
                    onDelete={() => onDeleteCourse(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ──

export default function AcademicsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [gpa, setGpa] = useState<GpaSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("1")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogYearId, setDialogYearId] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<(typeof emptyCourse & { id?: string }) | null>(null)

  // Scale dialog
  const [scaleOpen, setScaleOpen] = useState(false)
  const [scale, setScale] = useState<WeightedScale>("5.0")

  // Transcript state
  const [transcripts, setTranscripts] = useState<import("@/components/transcript-upload").TranscriptUploadData[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, gpaRes, transcriptRes] = await Promise.all([
        fetch("/api/academics/courses"),
        fetch("/api/academics/gpa"),
        fetch("/api/academics/transcript"),
      ])
      if (coursesRes.ok) {
        const data: AcademicYear[] = await coursesRes.json()
        setYears(data.length > 0 ? data : [])
      }
      if (transcriptRes.ok) {
        const data = await transcriptRes.json()
        setTranscripts(Array.isArray(data) ? data : [])
      }
      if (gpaRes.ok) {
        const data: GpaSummary = await gpaRes.json()
        setGpa(data)
        setScale(data.weightedScale)
      }
    } catch {
      toast.error("Failed to load academic data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // If no years exist, initialize 4 default years
  const displayYears: AcademicYear[] = years.length > 0
    ? years
    : YEAR_LABELS.map((label, i) => ({
        id: `temp-${i + 1}`,
        year: i + 1,
        label,
        courses: [],
      }))

  const tabs = displayYears.map((y) => ({ id: String(y.year), label: y.label }))

  const activeYear = displayYears.find((y) => String(y.year) === activeTab) ?? displayYears[0]

  const handleAddCourse = (yearId: string) => {
    setDialogYearId(yearId)
    setEditingCourse({ ...emptyCourse })
    setDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setDialogYearId(null)
    setEditingCourse({
      id: course.id,
      name: course.name,
      type: course.type,
      credits: course.credits,
      semester: course.semester,
      grade: course.grade,
      status: course.status,
      subject: course.subject,
      apScore: course.apScore,
      ibScore: course.ibScore,
    })
    setDialogOpen(true)
  }

  const handleSaveCourse = async (data: typeof emptyCourse & { id?: string }) => {
    setSaving(true)
    try {
      if (data.id && !data.id.startsWith("temp-")) {
        // Edit existing course
        const res = await fetch(`/api/academics/courses/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to update course")
        toast.success("Course updated")
      } else {
        // Add new course to a year
        const year = displayYears.find((y) => y.id === dialogYearId)
        if (!year) return
        const res = await fetch("/api/academics/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: year.year,
            label: year.label,
            courses: [data],
          }),
        })
        if (!res.ok) throw new Error("Failed to add course")
        toast.success("Course added")
      }
      setDialogOpen(false)
      await fetchData()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/academics/courses/${courseId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete course")
      toast.success("Course deleted")
      await fetchData()
    } catch {
      toast.error("Failed to delete course")
    }
  }

  const handleScaleSave = async (newScale: WeightedScale) => {
    try {
      await fetch("/api/academics/gpa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightedScale: newScale }),
      })
      setScale(newScale)
      setScaleOpen(false)
      toast.success(`GPA scale set to ${newScale}`)
      await fetchData()
    } catch {
      toast.error("Failed to update GPA scale")
    }
  }

  const yearGpa = gpa?.byYear.find((y) => String(y.year) === activeTab) ?? null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Course Planner</h1>
          <p className="mt-1 text-muted-foreground">
            Plan and track your high school courses, grades, and GPA year by year.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setScaleOpen(true)}>
          <Settings className="h-4 w-4" />
          GPA Scale: {scale}
        </Button>
      </div>

      {/* GPA Summary */}
      <GpaSummary gpa={gpa} loading={loading} />

      {/* Year Tabs */}
      {loading ? (
        <Card variant="bento"><CardContent className="py-8"><Skeleton className="h-48 w-full" /></CardContent></Card>
      ) : (
        <>
          <VercelTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
          />
          {activeYear && (
            <YearSection
              academicYear={activeYear}
              yearGpa={yearGpa}
              onAddCourse={handleAddCourse}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
            />
          )}
        </>
      )}

      {/* Add / Edit Course Dialog */}
      {editingCourse && (
        <CourseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editingCourse}
          onSave={handleSaveCourse}
          saving={saving}
        />
      )}

      {/* GPA What-If Calculator */}
      {!loading && displayYears.length > 0 && (
        <GpaSimulator years={displayYears} weightedScale={scale} />
      )}

      {/* Transcript Upload Section */}
      <TranscriptUploadSection transcripts={transcripts} onDataChanged={fetchData} />

      {/* GPA Scale Dialog */}
      <Dialog open={scaleOpen} onOpenChange={setScaleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Weighted GPA Scale</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose the weighted scale your school uses. A 5.0 scale adds +0.5 for Honors and +1.0 for AP/IB/DC. A 6.0 scale adds +1.0 for Honors and +2.0 for AP/IB/DC.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant={scale === "5.0" ? "default" : "outline"}
              className={scale === "5.0" ? "bg-[#2563EB] hover:bg-[#2563EB]/90 flex-1" : "flex-1"}
              onClick={() => handleScaleSave("5.0")}
            >
              5.0 Scale
            </Button>
            <Button
              variant={scale === "6.0" ? "default" : "outline"}
              className={scale === "6.0" ? "bg-[#2563EB] hover:bg-[#2563EB]/90 flex-1" : "flex-1"}
              onClick={() => handleScaleSave("6.0")}
            >
              6.0 Scale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
