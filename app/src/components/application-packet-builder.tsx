"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  GraduationCap,
  Award,
  FileText,
  Activity,
  Heart,
  Briefcase,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "@/lib/icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────
interface Profile {
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  county: string | null
  gpa: number | null
  gradeLevel: number | null
  highSchool: string | null
  graduationYear: number | null
  satScore: number | null
  actScore: number | null
  intendedMajor: string | null
  ethnicity: string | null
  citizenship: string | null
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
}

interface ActivityItem {
  id: string
  category: string
  title: string
  organization: string | null
  role: string | null
  description: string | null
  impactStatement: string | null
  skillsGained: string[]
  startDate: string | null
  endDate: string | null
  isOngoing: boolean
  hoursPerWeek: number | null
  totalHours: number | null
  isLeadership: boolean
  isAward: boolean
}

interface EssayItem {
  id: string
  title: string
  content: string | null
  status: string
  updatedAt: string
}

interface PacketData {
  profile: Profile | null
  activities: {
    all: ActivityItem[]
    awards: ActivityItem[]
    leadership: ActivityItem[]
    volunteer: ActivityItem[]
    extracurriculars: ActivityItem[]
    work: ActivityItem[]
  }
  essays: EssayItem[]
}

type SectionKey =
  | "profile"
  | "testScores"
  | "activities"
  | "awards"
  | "volunteer"
  | "leadership"
  | "work"
  | "essays"

interface Section {
  key: SectionKey
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  hasData: boolean
  itemCount?: number
}

// ── PDF Generation ───────────────────────────────────────────
async function generatePDF(data: PacketData, selectedSections: Set<SectionKey>, selectedEssayIds: Set<string>) {
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "letter" })

  const PAGE_WIDTH = 612
  const MARGIN = 50
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
  let y = MARGIN

  const COLORS = {
    primary: [30, 58, 95] as [number, number, number],     // #1E3A5F
    accent: [37, 99, 235] as [number, number, number],     // #2563EB
    text: [26, 26, 26] as [number, number, number],        // #1A1A1A
    muted: [107, 114, 128] as [number, number, number],    // gray-500
    divider: [229, 231, 235] as [number, number, number],  // gray-200
  }

  function checkPage(needed: number) {
    if (y + needed > 742) {
      doc.addPage()
      y = MARGIN
    }
  }

  function drawDivider() {
    checkPage(20)
    doc.setDrawColor(...COLORS.divider)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 16
  }

  function sectionHeading(text: string) {
    checkPage(40)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.setTextColor(...COLORS.primary)
    doc.text(text.toUpperCase(), MARGIN, y)
    y += 4
    doc.setDrawColor(...COLORS.accent)
    doc.setLineWidth(1.5)
    doc.line(MARGIN, y, MARGIN + doc.getTextWidth(text.toUpperCase()) + 8, y)
    y += 16
  }

  function label(text: string, x: number) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    doc.text(text, x, y)
  }

  function value(text: string, x: number) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.text)
    doc.text(text || "—", x, y)
  }

  function wrappedText(text: string, maxWidth: number, fontSize = 10): string[] {
    doc.setFontSize(fontSize)
    return doc.splitTextToSize(text, maxWidth)
  }

  const p = data.profile

  // ── Header ─────────────────────────────────────────────────
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, PAGE_WIDTH, 80, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  const name = p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "Student"
  doc.text(name || "Student", MARGIN, 38)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(200, 210, 230)
  const subtitle = [p?.highSchool, p?.graduationYear ? `Class of ${p.graduationYear}` : null]
    .filter(Boolean)
    .join(" • ")
  if (subtitle) doc.text(subtitle, MARGIN, 56)

  // Contact info on the right
  const contactLines = [
    p?.phone,
    [p?.city, p?.state].filter(Boolean).join(", "),
  ].filter(Boolean)
  contactLines.forEach((line, i) => {
    if (line) {
      doc.setFontSize(9)
      doc.setTextColor(200, 210, 230)
      const tw = doc.getTextWidth(line)
      doc.text(line, PAGE_WIDTH - MARGIN - tw, 38 + i * 14)
    }
  })

  y = 100

  // Timestamp
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, MARGIN, y)
  y += 20

  // ── Profile Section ────────────────────────────────────────
  if (selectedSections.has("profile") && p) {
    sectionHeading("Student Profile")

    const col1 = MARGIN
    const col2 = MARGIN + CONTENT_WIDTH / 3
    const col3 = MARGIN + (CONTENT_WIDTH * 2) / 3

    const fields = [
      [
        { l: "GPA", v: p.gpa?.toString() || "—" },
        { l: "Grade Level", v: p.gradeLevel ? `Grade ${p.gradeLevel}` : "—" },
        { l: "Intended Major", v: p.intendedMajor || "—" },
      ],
      [
        { l: "Ethnicity", v: p.ethnicity || "—" },
        { l: "Citizenship", v: p.citizenship || "—" },
        { l: "First Generation", v: p.isFirstGen ? "Yes" : "No" },
      ],
      [
        { l: "Location", v: [p.city, p.state].filter(Boolean).join(", ") || "—" },
        { l: "County", v: p.county || "—" },
        { l: "Financial Need", v: p.hasFinancialNeed ? "Yes" : "No" },
      ],
    ]

    for (const row of fields) {
      checkPage(32)
      const cols = [col1, col2, col3]
      row.forEach((f, i) => {
        label(f.l, cols[i])
      })
      y += 14
      row.forEach((f, i) => {
        value(f.v, cols[i])
      })
      y += 18
    }

    drawDivider()
  }

  // ── Test Scores ────────────────────────────────────────────
  if (selectedSections.has("testScores") && p) {
    sectionHeading("Test Scores")

    const col1 = MARGIN
    const col2 = MARGIN + CONTENT_WIDTH / 3

    checkPage(32)
    label("SAT Score", col1)
    label("ACT Score", col2)
    y += 14
    value(p.satScore?.toString() || "Not reported", col1)
    value(p.actScore?.toString() || "Not reported", col2)
    y += 22

    drawDivider()
  }

  // ── Activities & Extracurriculars ──────────────────────────
  if (selectedSections.has("activities") && data.activities.extracurriculars.length > 0) {
    sectionHeading("Activities & Extracurriculars")

    for (const act of data.activities.extracurriculars) {
      checkPage(60)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.text)
      doc.text(act.title, MARGIN, y)

      if (act.organization) {
        const titleWidth = doc.getTextWidth(act.title)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(` — ${act.organization}`, MARGIN + titleWidth, y)
      }
      y += 14

      // Role + dates
      const meta = [
        act.role,
        act.startDate
          ? `${new Date(act.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${act.isOngoing ? "Present" : act.endDate ? new Date(act.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}`
          : null,
        act.totalHours ? `${act.totalHours} total hours` : act.hoursPerWeek ? `${act.hoursPerWeek} hrs/week` : null,
      ]
        .filter(Boolean)
        .join(" • ")

      if (meta) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(meta, MARGIN, y)
        y += 13
      }

      if (act.description) {
        const lines = wrappedText(act.description, CONTENT_WIDTH, 9)
        checkPage(lines.length * 12 + 4)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lines, MARGIN, y)
        y += lines.length * 12 + 4
      }

      y += 8
    }

    drawDivider()
  }

  // ── Awards & Honors ────────────────────────────────────────
  if (selectedSections.has("awards") && data.activities.awards.length > 0) {
    sectionHeading("Awards & Honors")

    for (const award of data.activities.awards) {
      checkPage(36)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.text)
      doc.text(`• ${award.title}`, MARGIN, y)

      const meta = [
        award.organization,
        award.startDate ? new Date(award.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null,
      ]
        .filter(Boolean)
        .join(" — ")

      if (meta) {
        const titleWidth = doc.getTextWidth(`• ${award.title}`)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(`  ${meta}`, MARGIN + titleWidth, y)
      }
      y += 14

      if (award.description) {
        const lines = wrappedText(award.description, CONTENT_WIDTH - 12, 9)
        checkPage(lines.length * 12)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lines, MARGIN + 12, y)
        y += lines.length * 12 + 4
      }
    }

    drawDivider()
  }

  // ── Volunteer / Community Service ──────────────────────────
  if (selectedSections.has("volunteer") && data.activities.volunteer.length > 0) {
    sectionHeading("Volunteer & Community Service")

    for (const vol of data.activities.volunteer) {
      checkPage(50)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.text)
      doc.text(vol.title, MARGIN, y)
      y += 14

      const meta = [
        vol.organization,
        vol.role,
        vol.totalHours ? `${vol.totalHours} hours` : null,
      ]
        .filter(Boolean)
        .join(" • ")

      if (meta) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(meta, MARGIN, y)
        y += 13
      }

      if (vol.description) {
        const lines = wrappedText(vol.description, CONTENT_WIDTH, 9)
        checkPage(lines.length * 12)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lines, MARGIN, y)
        y += lines.length * 12 + 4
      }

      y += 6
    }

    drawDivider()
  }

  // ── Leadership ─────────────────────────────────────────────
  if (selectedSections.has("leadership") && data.activities.leadership.length > 0) {
    sectionHeading("Leadership Experience")

    for (const lead of data.activities.leadership) {
      checkPage(50)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.text)
      doc.text(lead.title, MARGIN, y)

      if (lead.organization) {
        const tw = doc.getTextWidth(lead.title)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(` — ${lead.organization}`, MARGIN + tw, y)
      }
      y += 14

      if (lead.role) {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lead.role, MARGIN, y)
        y += 13
      }

      if (lead.impactStatement || lead.description) {
        const text = lead.impactStatement || lead.description || ""
        const lines = wrappedText(text, CONTENT_WIDTH, 9)
        checkPage(lines.length * 12)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lines, MARGIN, y)
        y += lines.length * 12 + 4
      }

      y += 6
    }

    drawDivider()
  }

  // ── Work Experience ────────────────────────────────────────
  if (selectedSections.has("work") && data.activities.work.length > 0) {
    sectionHeading("Work Experience")

    for (const job of data.activities.work) {
      checkPage(50)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.text)
      doc.text(job.title, MARGIN, y)

      if (job.organization) {
        const tw = doc.getTextWidth(job.title)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(` — ${job.organization}`, MARGIN + tw, y)
      }
      y += 14

      const meta = [
        job.role,
        job.startDate
          ? `${new Date(job.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${job.isOngoing ? "Present" : job.endDate ? new Date(job.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}`
          : null,
        job.hoursPerWeek ? `${job.hoursPerWeek} hrs/week` : null,
      ]
        .filter(Boolean)
        .join(" • ")

      if (meta) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.muted)
        doc.text(meta, MARGIN, y)
        y += 13
      }

      if (job.description) {
        const lines = wrappedText(job.description, CONTENT_WIDTH, 9)
        checkPage(lines.length * 12)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.text)
        doc.text(lines, MARGIN, y)
        y += lines.length * 12 + 4
      }

      y += 6
    }

    drawDivider()
  }

  // ── Essays ─────────────────────────────────────────────────
  if (selectedSections.has("essays") && data.essays.length > 0) {
    const selectedEssays = data.essays.filter((e) => selectedEssayIds.has(e.id))
    if (selectedEssays.length > 0) {
      sectionHeading("Essays & Personal Statements")

      for (const essay of selectedEssays) {
        checkPage(40)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(...COLORS.primary)
        doc.text(essay.title, MARGIN, y)
        y += 18

        if (essay.content) {
          // Strip HTML tags if present
          const plainText = essay.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
          const lines = wrappedText(plainText, CONTENT_WIDTH, 10)
          for (let i = 0; i < lines.length; i++) {
            checkPage(14)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            doc.setTextColor(...COLORS.text)
            doc.text(lines[i], MARGIN, y)
            y += 14
          }
        }

        y += 16
      }
    }
  }

  // ── Footer on every page ───────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH / 2, 760, { align: "center" })
  }

  // Save
  const filename = `${(name || "Student").replace(/\s+/g, "_")}_Application_Packet.pdf`
  doc.save(filename)
  return filename
}

// ── Component ────────────────────────────────────────────────
export function ApplicationPacketBuilder({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<PacketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedSections, setSelectedSections] = useState<Set<SectionKey>>(
    new Set(["profile", "testScores", "activities", "awards", "volunteer", "leadership", "work", "essays"])
  )
  const [selectedEssayIds, setSelectedEssayIds] = useState<Set<string>>(new Set())
  const [essaysExpanded, setEssaysExpanded] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/documents/packet")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
      // Auto-select all essays
      if (json.essays) {
        setSelectedEssayIds(new Set(json.essays.map((e: EssayItem) => e.id)))
      }
    } catch {
      toast.error("Failed to load your data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  const toggleSection = (key: SectionKey) => {
    setSelectedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleEssay = (id: string) => {
    setSelectedEssayIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!data) return
    setGenerating(true)
    try {
      const filename = await generatePDF(data, selectedSections, selectedEssayIds)
      toast.success(`Downloaded ${filename}`)
      onOpenChange(false)
    } catch (err) {
      console.error("PDF generation error:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setGenerating(false)
    }
  }

  const sections: Section[] = data
    ? [
        {
          key: "profile",
          label: "Student Profile",
          description: "Name, GPA, grade level, school, intended major, demographics",
          icon: User,
          hasData: !!data.profile,
        },
        {
          key: "testScores",
          label: "Test Scores",
          description: "SAT and ACT scores",
          icon: GraduationCap,
          hasData: !!(data.profile?.satScore || data.profile?.actScore),
        },
        {
          key: "activities",
          label: "Activities & Extracurriculars",
          description: "Clubs, sports, organizations, and other activities",
          icon: Activity,
          hasData: data.activities.extracurriculars.length > 0,
          itemCount: data.activities.extracurriculars.length,
        },
        {
          key: "awards",
          label: "Awards & Honors",
          description: "Academic and extracurricular recognitions",
          icon: Award,
          hasData: data.activities.awards.length > 0,
          itemCount: data.activities.awards.length,
        },
        {
          key: "volunteer",
          label: "Volunteer & Community Service",
          description: "Community involvement and volunteer work",
          icon: Heart,
          hasData: data.activities.volunteer.length > 0,
          itemCount: data.activities.volunteer.length,
        },
        {
          key: "leadership",
          label: "Leadership Experience",
          description: "Leadership roles and impact",
          icon: Award,
          hasData: data.activities.leadership.length > 0,
          itemCount: data.activities.leadership.length,
        },
        {
          key: "work",
          label: "Work Experience",
          description: "Employment history and job responsibilities",
          icon: Briefcase,
          hasData: data.activities.work.length > 0,
          itemCount: data.activities.work.length,
        },
        {
          key: "essays",
          label: "Essays & Personal Statements",
          description: "Select which essays to include",
          icon: FileText,
          hasData: data.essays.length > 0,
          itemCount: data.essays.length,
        },
      ]
    : []

  const selectedCount = sections.filter((s) => selectedSections.has(s.key) && s.hasData).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-secondary-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Packet Builder
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select which sections to include in your PDF packet.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-1 py-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key}>
                <label
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors",
                    selectedSections.has(section.key) && section.hasData
                      ? "border-[#2563EB]/30 bg-[#2563EB]/5"
                      : "border-border hover:border-border/80",
                    !section.hasData && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={selectedSections.has(section.key) && section.hasData}
                    onCheckedChange={() => section.hasData && toggleSection(section.key)}
                    disabled={!section.hasData}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 text-secondary-foreground shrink-0" />
                      <span className="text-sm font-medium">{section.label}</span>
                      {section.hasData ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          {section.itemCount != null ? `${section.itemCount} items` : "Available"}
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          No data
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>

                    {/* Essay selector */}
                    {section.key === "essays" && section.hasData && selectedSections.has("essays") && (
                      <div className="mt-2 space-y-1">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            setEssaysExpanded(!essaysExpanded)
                          }}
                        >
                          {essaysExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Choose essays ({selectedEssayIds.size} of {data?.essays.length} selected)
                        </button>
                        {essaysExpanded && data?.essays.map((essay) => (
                          <label
                            key={essay.id}
                            className="flex items-center gap-2 pl-1 py-1 text-xs cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedEssayIds.has(essay.id)}
                              onCheckedChange={() => toggleEssay(essay.id)}
                            />
                            <span className="truncate">{essay.title}</span>
                            <span className={cn(
                              "ml-auto text-[10px] px-1.5 py-0.5 rounded",
                              essay.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                              essay.status === "DRAFT" ? "bg-muted text-muted-foreground" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {essay.status.toLowerCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1 text-xs text-muted-foreground">
            {selectedCount} section{selectedCount !== 1 ? "s" : ""} selected
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            onClick={handleGenerate}
            disabled={generating || loading || selectedCount === 0}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generating ? "Generating..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
