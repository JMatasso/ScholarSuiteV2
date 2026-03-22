"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Loader2, Save } from "@/lib/icons"
import { monthOptions, journeyStageLabels } from "@/lib/journey"
import { SchoolAutocomplete } from "@/components/ui/school-autocomplete"
import { CountyAutocomplete } from "@/components/ui/county-autocomplete"

interface AdminEditProfileDialogProps {
  open: boolean
  onClose: () => void
  studentId: string
  onSaved: () => void
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]

interface ProfileFields {
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  county: string
  gpa: string
  gpaType: string
  gradeLevel: string
  highSchool: string
  classRank: string
  classSize: string
  graduationYear: string
  graduationMonth: string
  satScore: string
  actScore: string
  intendedMajor: string
  major2: string
  major3: string
  gender: string
  ethnicity: string
  citizenship: string
  militaryAffiliation: string
  householdIncome: string
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
  activities: string
  communityService: string
  leadershipRoles: string
  awards: string
  goals: string
  dreamSchools: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function AdminEditProfileDialog({ open, onClose, studentId, onSaved }: AdminEditProfileDialogProps) {
  const [profile, setProfile] = useState<ProfileFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/students/${studentId}`)
      .then(r => r.json())
      .then(data => {
        const p = data.studentProfile
        if (p) {
          setProfile({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "",
            phone: p.phone || "",
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            zipCode: p.zipCode || "",
            county: p.county || "",
            gpa: p.gpa != null ? String(p.gpa) : "",
            gpaType: p.gpaType || "",
            gradeLevel: p.gradeLevel != null ? String(p.gradeLevel) : "",
            highSchool: p.highSchool || "",
            classRank: p.classRank || "",
            classSize: p.classSize || "",
            graduationYear: p.graduationYear != null ? String(p.graduationYear) : "",
            graduationMonth: p.graduationMonth != null ? String(p.graduationMonth) : "",
            satScore: p.satScore != null ? String(p.satScore) : "",
            actScore: p.actScore != null ? String(p.actScore) : "",
            intendedMajor: p.intendedMajor || "",
            major2: p.major2 || "",
            major3: p.major3 || "",
            gender: p.gender || "",
            ethnicity: p.ethnicity || "",
            citizenship: p.citizenship || "",
            militaryAffiliation: p.militaryAffiliation || "",
            householdIncome: p.householdIncome || "",
            isFirstGen: p.isFirstGen ?? false,
            isPellEligible: p.isPellEligible ?? false,
            hasFinancialNeed: p.hasFinancialNeed ?? false,
            activities: p.activities || "",
            communityService: p.communityService || "",
            leadershipRoles: p.leadershipRoles || "",
            awards: p.awards || "",
            goals: p.goals || "",
            dreamSchools: p.dreamSchools || "",
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open, studentId])

  const update = (field: keyof ProfileFields, value: string | boolean | null) => {
    setProfile(p => p ? { ...p, [field]: value } : p)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      })
      if (res.ok) {
        toast.success("Student profile updated")
        onSaved()
        onClose()
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student Profile</DialogTitle>
        </DialogHeader>

        {loading || !profile ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personal */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><Input value={profile.firstName} onChange={e => update("firstName", e.target.value)} /></Field>
                <Field label="Last Name"><Input value={profile.lastName} onChange={e => update("lastName", e.target.value)} /></Field>
                <Field label="Date of Birth"><Input type="date" value={profile.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} /></Field>
                <Field label="Phone"><Input value={profile.phone} onChange={e => update("phone", e.target.value)} /></Field>
                <Field label="Address"><Input value={profile.address} onChange={e => update("address", e.target.value)} /></Field>
                <Field label="City"><Input value={profile.city} onChange={e => update("city", e.target.value)} /></Field>
                <Field label="State">
                  <Select value={profile.state} onValueChange={v => update("state", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="ZIP"><Input value={profile.zipCode} onChange={e => update("zipCode", e.target.value)} /></Field>
                <Field label="County">
                  <CountyAutocomplete
                    value={profile.county}
                    onValueChange={v => update("county", v)}
                    state={profile.state || undefined}
                    placeholder="Search county..."
                  />
                </Field>
              </div>
            </div>

            {/* Academic */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Academic</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="High School">
                  <SchoolAutocomplete
                    value={profile.highSchool}
                    onValueChange={v => update("highSchool", v)}
                    placeholder="Search school..."
                  />
                </Field>
                <Field label="Grade Level"><Input type="number" value={profile.gradeLevel} onChange={e => update("gradeLevel", e.target.value)} /></Field>
                <Field label="Graduation Year"><Input type="number" value={profile.graduationYear} onChange={e => update("graduationYear", e.target.value)} /></Field>
                <Field label="Graduation Month">
                  <Select value={profile.graduationMonth} onValueChange={v => update("graduationMonth", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="GPA"><Input value={profile.gpa} onChange={e => update("gpa", e.target.value)} /></Field>
                <Field label="GPA Type">
                  <Select value={profile.gpaType} onValueChange={v => update("gpaType", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="Scale" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNWEIGHTED_4">Unweighted (4.0)</SelectItem>
                      <SelectItem value="WEIGHTED_5">Weighted (5.0)</SelectItem>
                      <SelectItem value="WEIGHTED_4">Weighted (4.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="SAT"><Input type="number" value={profile.satScore} onChange={e => update("satScore", e.target.value)} /></Field>
                <Field label="ACT"><Input type="number" value={profile.actScore} onChange={e => update("actScore", e.target.value)} /></Field>
                <Field label="Intended Major"><Input value={profile.intendedMajor} onChange={e => update("intendedMajor", e.target.value)} /></Field>
                <Field label="2nd Major"><Input value={profile.major2} onChange={e => update("major2", e.target.value)} /></Field>
              </div>
              {profile.graduationYear && (
                <p className="mt-2 text-xs text-emerald-600">
                  Journey stage will be auto-calculated from graduation date
                </p>
              )}
            </div>

            {/* Background */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Background</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gender">
                  <Select value={profile.gender} onValueChange={v => update("gender", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ethnicity"><Input value={profile.ethnicity} onChange={e => update("ethnicity", e.target.value)} /></Field>
                <Field label="Citizenship">
                  <Select value={profile.citizenship} onValueChange={v => update("citizenship", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US Citizen">US Citizen</SelectItem>
                      <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                      <SelectItem value="DACA">DACA</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Household Income">
                  <Select value={profile.householdIncome} onValueChange={v => update("householdIncome", v)}>
                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="Range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under $30,000">Under $30,000</SelectItem>
                      <SelectItem value="$30,000 - $48,000">$30,000 - $48,000</SelectItem>
                      <SelectItem value="$48,000 - $75,000">$48,000 - $75,000</SelectItem>
                      <SelectItem value="$75,000 - $110,000">$75,000 - $110,000</SelectItem>
                      <SelectItem value="$110,000+">$110,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="mt-3 space-y-2">
                {([
                  ["isFirstGen", "First-generation college student"],
                  ["hasFinancialNeed", "Demonstrated financial need"],
                  ["isPellEligible", "Pell Grant eligible"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{label}</span>
                    <button
                      onClick={() => update(key, !profile[key])}
                      className={`h-6 w-11 rounded-full transition-colors ${profile[key] ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${profile[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities & Goals */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activities & Goals</h4>
              <div className="space-y-3">
                <Field label="Activities">
                  <textarea value={profile.activities} onChange={e => update("activities", e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </Field>
                <Field label="Community Service">
                  <textarea value={profile.communityService} onChange={e => update("communityService", e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </Field>
                <Field label="Awards">
                  <textarea value={profile.awards} onChange={e => update("awards", e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </Field>
                <Field label="Goals">
                  <textarea value={profile.goals} onChange={e => update("goals", e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </Field>
                <Field label="Dream Schools"><Input value={profile.dreamSchools} onChange={e => update("dreamSchools", e.target.value)} /></Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
