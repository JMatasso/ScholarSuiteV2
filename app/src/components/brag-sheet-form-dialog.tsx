"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiStepForm } from "@/components/ui/multi-step-form"
import { Loader2, X, Info } from "@/lib/icons"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Types ──────────────────────────────────────────────────

export type CategoryKey =
  | "ATHLETICS" | "ARTS" | "ACADEMIC" | "VOLUNTEER" | "WORK"
  | "LEADERSHIP" | "ENTREPRENEURSHIP" | "RESEARCH" | "STUDY_ABROAD"
  | "CERTIFICATION" | "MENTORING" | "AWARD" | "PROJECT"
  | "PROFESSIONAL_DEV" | "OTHER"

export interface ActivityEntry {
  id: string
  title: string
  organization: string | null
  role: string | null
  category: CategoryKey
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
  isVerified: boolean
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  ATHLETICS: "Athletics",
  ARTS: "Arts",
  ACADEMIC: "Academic",
  VOLUNTEER: "Volunteer",
  WORK: "Work Experience",
  LEADERSHIP: "Leadership",
  ENTREPRENEURSHIP: "Entrepreneurship",
  RESEARCH: "Research",
  STUDY_ABROAD: "Study Abroad",
  CERTIFICATION: "Certifications",
  MENTORING: "Mentoring",
  AWARD: "Awards",
  PROJECT: "Projects",
  PROFESSIONAL_DEV: "Professional Development",
  OTHER: "Other",
}

const ALL_CATEGORIES: CategoryKey[] = [
  "ACADEMIC", "ATHLETICS", "ARTS", "VOLUNTEER", "MENTORING", "WORK",
  "LEADERSHIP", "AWARD", "CERTIFICATION", "PROJECT", "ENTREPRENEURSHIP",
  "RESEARCH", "STUDY_ABROAD", "PROFESSIONAL_DEV", "OTHER",
]

const CATEGORY_TIPS: Partial<Record<CategoryKey, string>> = {
  LEADERSHIP: "Leadership doesn't require a formal title — think about times you took initiative, organized something, or guided others.",
  VOLUNTEER: "Include any community service, even informal help. Mention specific numbers — hours, people helped, funds raised.",
  ATHLETICS: "Include team and individual sports, intramurals, and fitness activities. Mention positions, records, or honors.",
  ARTS: "Include performances, exhibitions, competitions, or creative projects. Mention awards or selections.",
  WORK: "Include part-time jobs, internships, and family business work. Focus on responsibilities and what you learned.",
  RESEARCH: "Describe your research question, methodology, and findings. Mention any publications or presentations.",
  PROJECT: "Describe what you built or created, the tools you used, and the impact or reach of the project.",
  AWARD: "Include academic honors, competition wins, scholarships, and recognitions at any level.",
}

interface FormState {
  title: string
  organization: string
  role: string
  category: CategoryKey
  description: string
  impactStatement: string
  skillsInput: string
  skillsGained: string[]
  startDate: string
  endDate: string
  isOngoing: boolean
  hoursPerWeek: string
  isLeadership: boolean
  isAward: boolean
}

const emptyForm: FormState = {
  title: "",
  organization: "",
  role: "",
  category: "OTHER",
  description: "",
  impactStatement: "",
  skillsInput: "",
  skillsGained: [],
  startDate: "",
  endDate: "",
  isOngoing: false,
  hoursPerWeek: "",
  isLeadership: false,
  isAward: false,
}

const TOTAL_STEPS = 3

/* ────── Tooltip helper ────── */

function FieldTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/* ────── Main component ────── */

interface BragSheetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editEntry?: ActivityEntry | null
  defaultCategory?: CategoryKey
  tip?: string
  onSaved: (entry: ActivityEntry, isEdit: boolean) => void
}

export function BragSheetFormDialog({
  open,
  onOpenChange,
  editEntry,
  defaultCategory,
  onSaved,
}: BragSheetFormDialogProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => {
    if (editEntry) return entryToForm(editEntry)
    if (defaultCategory) return { ...emptyForm, category: defaultCategory }
    return { ...emptyForm }
  })
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens with new data
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setStep(1)
      if (editEntry) setForm(entryToForm(editEntry))
      else setForm({ ...emptyForm, category: defaultCategory || "OTHER" })
    }
    onOpenChange(v)
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const val = form.skillsInput.trim().replace(/,$/g, "")
      if (val && !form.skillsGained.includes(val)) {
        setForm((f) => ({ ...f, skillsGained: [...f.skillsGained, val], skillsInput: "" }))
      }
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!form.title.trim()) {
        toast.error("Title is required")
        return
      }
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      handleSave()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      title: form.title,
      organization: form.organization || null,
      role: form.role || null,
      category: form.category,
      description: form.description || null,
      impactStatement: form.impactStatement || null,
      skillsGained: form.skillsGained,
      startDate: form.startDate || null,
      endDate: form.isOngoing ? null : form.endDate || null,
      isOngoing: form.isOngoing,
      hoursPerWeek: form.hoursPerWeek ? Number(form.hoursPerWeek) : null,
      totalHours: null,
      isLeadership: form.isLeadership,
      isAward: form.isAward,
    }

    try {
      if (editEntry) {
        const res = await fetch(`/api/activities/${editEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          onSaved(updated, true)
          toast.success("Entry updated!")
        } else {
          toast.error("Failed to update")
        }
      } else {
        const res = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          onSaved(created, false)
          toast.success("Entry added!")
        } else {
          toast.error("Failed to add entry")
        }
      }
      onOpenChange(false)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const stepTitle = editEntry ? "Edit Entry" : "Add Activity"
  const stepDescriptions = [
    "Start by telling us what you did and where.",
    "Describe your experience and what you accomplished.",
    "Add dates and time commitment details.",
  ]

  const nextLabel =
    step === TOTAL_STEPS
      ? saving
        ? "Saving..."
        : editEntry
          ? "Save Changes"
          : "Add Entry"
      : "Next Step"

  const categoryTip = CATEGORY_TIPS[form.category]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[750px] p-0 gap-0 border-0 shadow-none bg-transparent overflow-visible [&>button]:hidden">
        <MultiStepForm
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          title={stepTitle}
          description={stepDescriptions[step - 1]}
          onBack={handleBack}
          onNext={handleNext}
          onClose={() => onOpenChange(false)}
          nextButtonText={nextLabel}
          size="default"
        >
          {/* ═══ Step 1: The Basics ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Activity Title *</label>
                  <FieldTooltip text="Give your activity a clear, specific name — e.g., 'Varsity Debate Team' or 'Summer Coding Bootcamp'." />
                </div>
                <Input
                  placeholder="e.g., Debate Team, National Honor Society"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <FieldTooltip text="Pick the category that best fits. You can always change it later." />
                </div>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as CategoryKey }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Organization + Role */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Organization</label>
                    <FieldTooltip text="The school, club, company, or group this activity is associated with." />
                  </div>
                  <Input
                    placeholder="e.g., Lincoln High School"
                    value={form.organization}
                    onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Your Role</label>
                    <FieldTooltip text="Your title or position — e.g., 'Captain', 'Treasurer', 'Intern'." />
                  </div>
                  <Input
                    placeholder="e.g., Captain, President"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.isLeadership}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isLeadership: v }))}
                  />
                  <label className="text-sm font-medium text-foreground">Leadership Role</label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.isAward}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isAward: v }))}
                  />
                  <label className="text-sm font-medium text-foreground">Award / Honor</label>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 2: Tell Your Story ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Contextual tip */}
              {categoryTip && (
                <div className="rounded-lg border border-blue-200/50 bg-accent/70 px-4 py-3">
                  <p className="text-xs text-secondary-foreground/80">{categoryTip}</p>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">What did you do?</label>
                  <FieldTooltip text="Describe your day-to-day responsibilities and contributions. Be specific about what YOU did." />
                </div>
                <Textarea
                  placeholder="Describe your role and what you contributed..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Impact Statement */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Impact & Results</label>
                  <FieldTooltip text="What was the outcome? Use numbers whenever possible — colleges love quantifiable results." />
                </div>
                <Textarea
                  placeholder="e.g., 'Raised $2,000 for local food bank' or 'Grew club membership from 12 to 45 students'"
                  rows={3}
                  value={form.impactStatement}
                  onChange={(e) => setForm((f) => ({ ...f, impactStatement: e.target.value }))}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Skills You Gained</label>
                  <FieldTooltip text="Type a skill and press Enter to add it. Think about both hard skills (coding, writing) and soft skills (teamwork, communication)." />
                </div>
                {form.skillsGained.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {form.skillsGained.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1 text-xs">
                        {skill}
                        <button onClick={() => setForm((f) => ({ ...f, skillsGained: f.skillsGained.filter((s) => s !== skill) }))} className="ml-0.5 hover:text-rose-600">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="Type a skill and press Enter"
                  value={form.skillsInput}
                  onChange={(e) => setForm((f) => ({ ...f, skillsInput: e.target.value }))}
                  onKeyDown={handleSkillKeyDown}
                />
              </div>
            </div>
          )}

          {/* ═══ Step 3: When & How Much ═══ */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Dates */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <FieldTooltip text="When did you begin this activity?" />
                  </div>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <FieldTooltip text="When did this activity end? Leave blank or toggle 'Still doing this' if it's ongoing." />
                  </div>
                  <Input
                    type="date"
                    value={form.endDate}
                    disabled={form.isOngoing}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Ongoing + Hours */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.isOngoing}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isOngoing: v, endDate: v ? "" : f.endDate }))}
                  />
                  <label className="text-sm font-medium text-foreground">Still doing this</label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">Hours / Week</label>
                    <FieldTooltip text="Approximately how many hours per week do you spend on this?" />
                  </div>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={form.hoursPerWeek}
                    onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: e.target.value }))}
                  />
                </div>
              </div>

              {/* Helpful note */}
              <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 px-4 py-3">
                <p className="text-xs text-amber-800">
                  All fields on this step are optional. Approximate dates and hours are fine — you can always update them later.
                </p>
              </div>
            </div>
          )}
        </MultiStepForm>
      </DialogContent>
    </Dialog>
  )
}

function entryToForm(a: ActivityEntry): FormState {
  return {
    title: a.title,
    organization: a.organization || "",
    role: a.role || "",
    category: a.category,
    description: a.description || "",
    impactStatement: a.impactStatement || "",
    skillsInput: "",
    skillsGained: a.skillsGained || [],
    startDate: a.startDate ? a.startDate.slice(0, 10) : "",
    endDate: a.endDate ? a.endDate.slice(0, 10) : "",
    isOngoing: a.isOngoing,
    hoursPerWeek: a.hoursPerWeek?.toString() || "",
    isLeadership: a.isLeadership,
    isAward: a.isAward,
  }
}
