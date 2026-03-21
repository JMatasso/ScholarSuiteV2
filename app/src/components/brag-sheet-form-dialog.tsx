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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

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

interface BragSheetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editEntry?: ActivityEntry | null
  defaultCategory?: CategoryKey
  /** Contextual tip shown at top of form */
  tip?: string
  onSaved: (entry: ActivityEntry, isEdit: boolean) => void
}

export function BragSheetFormDialog({
  open,
  onOpenChange,
  editEntry,
  defaultCategory,
  tip,
  onSaved,
}: BragSheetFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (editEntry) return entryToForm(editEntry)
    if (defaultCategory) return { ...emptyForm, category: defaultCategory }
    return { ...emptyForm }
  })
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens with new data
  const handleOpenChange = (v: boolean) => {
    if (v) {
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

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEntry ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>
            {editEntry
              ? "Update this activity or achievement."
              : "Add an activity, award, or achievement to your brag sheet."}
          </DialogDescription>
        </DialogHeader>

        {/* Contextual tip */}
        {tip && !editEntry && (
          <div className="rounded-lg bg-blue-50/70 border border-blue-200/50 px-3 py-2.5">
            <p className="text-xs text-[#1E3A5F]/80">💡 {tip}</p>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input
              placeholder="e.g., Debate Team, National Honor Society"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Organization + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Organization</label>
              <Input
                placeholder="e.g., Lincoln High School"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your Role</label>
              <Input
                placeholder="e.g., Captain, President"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">What did you do?</label>
            <Textarea
              placeholder="Describe your role and what you contributed..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Impact Statement */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Impact (optional but recommended)</label>
            <Textarea
              placeholder="What was the result? Use numbers if you can — e.g., 'Raised $2,000 for local food bank'"
              rows={2}
              value={form.impactStatement}
              onChange={(e) => setForm((f) => ({ ...f, impactStatement: e.target.value }))}
            />
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Skills you gained</label>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={form.endDate}
                disabled={form.isOngoing}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Ongoing + Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isOngoing}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isOngoing: v, endDate: v ? "" : f.endDate }))}
              />
              <label className="text-xs font-medium text-muted-foreground">Still doing this</label>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Hours / Week</label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={form.hoursPerWeek}
                onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: e.target.value }))}
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
              <label className="text-xs font-medium text-muted-foreground">Leadership Role</label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isAward}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isAward: v }))}
              />
              <label className="text-xs font-medium text-muted-foreground">Award / Honor</label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {editEntry ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogFooter>
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
