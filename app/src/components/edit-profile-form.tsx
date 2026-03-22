"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import LoaderOne from "@/components/ui/loader-one"
import { Loader2, Save } from "@/lib/icons"
import { monthOptions, journeyStageLabels } from "@/lib/journey"

interface ProfileData {
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
  disabilityStatus: string
  householdIncome: string
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
  journeyStage: string
  postSecondaryPath: string
  activities: string
  communityService: string
  leadershipRoles: string
  awards: string
  goals: string
  dreamSchools: string
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function EditProfileForm() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/students/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const update = (field: keyof ProfileData, value: string | boolean | null) => {
    setProfile(p => p ? { ...p, [field]: value } : p)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch("/api/students/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success("Profile updated successfully")
        // Update journey stage from server response
        if (updated.journeyStage) {
          setProfile(p => p ? { ...p, journeyStage: updated.journeyStage } : p)
        }
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoaderOne />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No profile found. Please complete onboarding first.
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Personal Information */}
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-secondary-foreground">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="First Name">
              <Input value={profile.firstName} onChange={e => update("firstName", e.target.value)} />
            </FieldRow>
            <FieldRow label="Last Name">
              <Input value={profile.lastName} onChange={e => update("lastName", e.target.value)} />
            </FieldRow>
            <FieldRow label="Date of Birth">
              <Input type="date" value={profile.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
            </FieldRow>
            <FieldRow label="Phone">
              <Input value={profile.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" />
            </FieldRow>
            <FieldRow label="Address">
              <Input value={profile.address} onChange={e => update("address", e.target.value)} />
            </FieldRow>
            <FieldRow label="City">
              <Input value={profile.city} onChange={e => update("city", e.target.value)} />
            </FieldRow>
            <FieldRow label="State">
              <Select value={profile.state} onValueChange={v => update("state", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="ZIP Code">
              <Input value={profile.zipCode} onChange={e => update("zipCode", e.target.value)} />
            </FieldRow>
            <FieldRow label="County">
              <Input value={profile.county} onChange={e => update("county", e.target.value)} />
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-secondary-foreground">Academic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="High School">
              <Input value={profile.highSchool} onChange={e => update("highSchool", e.target.value)} />
            </FieldRow>
            <FieldRow label="Grade Level">
              <Input type="number" value={profile.gradeLevel} onChange={e => update("gradeLevel", e.target.value)} />
            </FieldRow>
            <FieldRow label="Graduation Year">
              <Input type="number" value={profile.graduationYear} onChange={e => update("graduationYear", e.target.value)} placeholder="2026" />
            </FieldRow>
            <FieldRow label="Graduation Month">
              <Select value={profile.graduationMonth} onValueChange={v => update("graduationMonth", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="GPA">
              <Input value={profile.gpa} onChange={e => update("gpa", e.target.value)} placeholder="3.70" />
            </FieldRow>
            <FieldRow label="GPA Type">
              <Select value={profile.gpaType} onValueChange={v => update("gpaType", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNWEIGHTED_4">Unweighted (4.0)</SelectItem>
                  <SelectItem value="WEIGHTED_5">Weighted (5.0)</SelectItem>
                  <SelectItem value="WEIGHTED_4">Weighted (4.0)</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Class Rank">
              <Input type="number" value={profile.classRank} onChange={e => update("classRank", e.target.value)} />
            </FieldRow>
            <FieldRow label="Class Size">
              <Input type="number" value={profile.classSize} onChange={e => update("classSize", e.target.value)} />
            </FieldRow>
            <FieldRow label="SAT Score">
              <Input type="number" value={profile.satScore} onChange={e => update("satScore", e.target.value)} />
            </FieldRow>
            <FieldRow label="ACT Score">
              <Input type="number" value={profile.actScore} onChange={e => update("actScore", e.target.value)} />
            </FieldRow>
            <FieldRow label="Intended Major">
              <Input value={profile.intendedMajor} onChange={e => update("intendedMajor", e.target.value)} />
            </FieldRow>
            <FieldRow label="2nd Major">
              <Input value={profile.major2} onChange={e => update("major2", e.target.value)} />
            </FieldRow>
            <FieldRow label="3rd Major">
              <Input value={profile.major3} onChange={e => update("major3", e.target.value)} />
            </FieldRow>
          </div>

          {/* Journey stage display */}
          {profile.graduationYear && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              Journey stage: <strong>{journeyStageLabels[profile.journeyStage] || profile.journeyStage}</strong> (auto-calculated from graduation date)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background */}
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-secondary-foreground">Background</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Gender">
              <Select value={profile.gender} onValueChange={v => update("gender", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Ethnicity">
              <Input value={profile.ethnicity} onChange={e => update("ethnicity", e.target.value)} />
            </FieldRow>
            <FieldRow label="Citizenship">
              <Select value={profile.citizenship} onValueChange={v => update("citizenship", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US Citizen">US Citizen</SelectItem>
                  <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                  <SelectItem value="DACA">DACA</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Military Affiliation">
              <Select value={profile.militaryAffiliation || ""} onValueChange={v => update("militaryAffiliation", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Active Duty">Active Duty</SelectItem>
                  <SelectItem value="Veteran">Veteran</SelectItem>
                  <SelectItem value="Dependent">Military Dependent</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Household Income">
              <Select value={profile.householdIncome || ""} onValueChange={v => update("householdIncome", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $30,000">Under $30,000</SelectItem>
                  <SelectItem value="$30,000 - $48,000">$30,000 - $48,000</SelectItem>
                  <SelectItem value="$48,000 - $75,000">$48,000 - $75,000</SelectItem>
                  <SelectItem value="$75,000 - $110,000">$75,000 - $110,000</SelectItem>
                  <SelectItem value="$110,000+">$110,000+</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { key: "isFirstGen" as const, label: "First-generation college student" },
              { key: "hasFinancialNeed" as const, label: "Demonstrated financial need" },
              { key: "isPellEligible" as const, label: "Pell Grant eligible" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <button
                  onClick={() => update(item.key, !profile[item.key])}
                  className={`h-6 w-11 rounded-full transition-colors ${profile[item.key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${profile[item.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activities & Goals */}
      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-secondary-foreground">Activities & Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FieldRow label="Extracurricular Activities">
              <textarea
                value={profile.activities}
                onChange={e => update("activities", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </FieldRow>
            <FieldRow label="Community Service">
              <textarea
                value={profile.communityService}
                onChange={e => update("communityService", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </FieldRow>
            <FieldRow label="Leadership Roles">
              <textarea
                value={profile.leadershipRoles}
                onChange={e => update("leadershipRoles", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </FieldRow>
            <FieldRow label="Awards & Honors">
              <textarea
                value={profile.awards}
                onChange={e => update("awards", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </FieldRow>
            <FieldRow label="Dream Schools">
              <Input value={profile.dreamSchools} onChange={e => update("dreamSchools", e.target.value)} />
            </FieldRow>
            <FieldRow label="Personal Goals">
              <textarea
                value={profile.goals}
                onChange={e => update("goals", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
