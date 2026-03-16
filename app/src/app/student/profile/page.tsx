"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"

interface StudentData {
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  gpa: string
  gradeLevel: string
  highSchool: string
  graduationYear: string
  satScore: string
  actScore: string
  intendedMajor: string
  ethnicity: string
  citizenship: string
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
  journeyStage: string
  postSecondaryPath: string
  activities: string
  communityService: string
  leadershipRoles: string
  awards: string
  dreamSchools: string
  goals: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch("/api/students/profile")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  const update = (field: string, value: string | boolean) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch("/api/students/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success("Profile updated")
        setEditing(false)
      } else {
        toast.error("Failed to save profile")
      }
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Profile" description="Your profile information." />
        <div className="rounded-xl bg-card p-8 ring-1 ring-foreground/10 text-center">
          <p className="text-muted-foreground mb-4">No profile data found. Complete your onboarding to get started.</p>
          <Button onClick={() => router.push("/student/onboarding")}>Complete Onboarding</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Profile"
        description="View and update your personal information."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProfileCard title="Personal Information">
          <Field label="First Name" value={data.firstName} onChange={v => update("firstName", v)} editing={editing} />
          <Field label="Last Name" value={data.lastName} onChange={v => update("lastName", v)} editing={editing} />
          <Field label="Date of Birth" value={data.dateOfBirth} onChange={v => update("dateOfBirth", v)} editing={editing} type="date" />
          <Field label="Phone" value={data.phone} onChange={v => update("phone", v)} editing={editing} />
          <Field label="Address" value={data.address} onChange={v => update("address", v)} editing={editing} />
          <Field label="City" value={data.city} onChange={v => update("city", v)} editing={editing} />
          <Field label="State" value={data.state} onChange={v => update("state", v)} editing={editing} />
          <Field label="ZIP Code" value={data.zipCode} onChange={v => update("zipCode", v)} editing={editing} />
        </ProfileCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProfileCard title="Academic Information">
          <Field label="High School" value={data.highSchool} onChange={v => update("highSchool", v)} editing={editing} />
          <Field label="Grade Level" value={data.gradeLevel} onChange={v => update("gradeLevel", v)} editing={editing} />
          <Field label="Graduation Year" value={data.graduationYear} onChange={v => update("graduationYear", v)} editing={editing} />
          <Field label="GPA" value={data.gpa} onChange={v => update("gpa", v)} editing={editing} />
          <Field label="SAT Score" value={data.satScore} onChange={v => update("satScore", v)} editing={editing} />
          <Field label="ACT Score" value={data.actScore} onChange={v => update("actScore", v)} editing={editing} />
          <Field label="Intended Major" value={data.intendedMajor} onChange={v => update("intendedMajor", v)} editing={editing} />
        </ProfileCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProfileCard title="Background">
          <Field label="Ethnicity" value={data.ethnicity} onChange={v => update("ethnicity", v)} editing={editing} />
          <Field label="Citizenship" value={data.citizenship} onChange={v => update("citizenship", v)} editing={editing} />
          <BoolField label="First-Generation Student" value={data.isFirstGen} onChange={v => update("isFirstGen", v)} editing={editing} />
          <BoolField label="Pell Grant Eligible" value={data.isPellEligible} onChange={v => update("isPellEligible", v)} editing={editing} />
          <BoolField label="Financial Need" value={data.hasFinancialNeed} onChange={v => update("hasFinancialNeed", v)} editing={editing} />
        </ProfileCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProfileCard title="Activities & Interests">
          <TextAreaField label="Activities & Clubs" value={data.activities} onChange={v => update("activities", v)} editing={editing} />
          <TextAreaField label="Community Service" value={data.communityService} onChange={v => update("communityService", v)} editing={editing} />
          <TextAreaField label="Leadership Roles" value={data.leadershipRoles} onChange={v => update("leadershipRoles", v)} editing={editing} />
          <TextAreaField label="Awards & Achievements" value={data.awards} onChange={v => update("awards", v)} editing={editing} />
        </ProfileCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
        <ProfileCard title="Goals & Journey">
          <Field label="Journey Stage" value={data.journeyStage?.replace(/_/g, " ")} onChange={v => update("journeyStage", v)} editing={false} />
          <Field label="Pathway" value={data.postSecondaryPath?.replace(/_/g, " ")} onChange={v => update("postSecondaryPath", v)} editing={false} />
          <TextAreaField label="Dream Schools" value={data.dreamSchools} onChange={v => update("dreamSchools", v)} editing={editing} />
          <TextAreaField label="Personal Goals" value={data.goals} onChange={v => update("goals", v)} editing={editing} />
        </ProfileCard>
        </motion.div>
      </div>
    </div>
  )
}

function ProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, editing, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; editing: boolean; type?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {editing ? (
        <input
          type={type}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          className="h-8 w-48 rounded-md border border-input bg-transparent px-2 text-sm text-right outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      ) : (
        <span className="text-sm font-medium text-foreground text-right">{value || "—"}</span>
      )}
    </div>
  )
}

function BoolField({ label, value, onChange, editing }: {
  label: string; value: boolean; onChange: (v: boolean) => void; editing: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editing ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      ) : (
        <span className={`text-sm font-medium ${value ? "text-primary" : "text-muted-foreground"}`}>
          {value ? "Yes" : "No"}
        </span>
      )}
    </div>
  )
}

function TextAreaField({ label, value, onChange, editing }: {
  label: string; value: string; onChange: (v: string) => void; editing: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editing ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
        />
      ) : (
        <span className="text-sm font-medium text-foreground whitespace-pre-line">{value || "—"}</span>
      )}
    </div>
  )
}
