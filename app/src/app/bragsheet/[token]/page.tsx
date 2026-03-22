"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { GraduationCap, MapPin, Star, Trophy, Briefcase, Heart, Users, Award, BookOpen, Loader2 } from "@/lib/icons"

interface Profile {
  firstName: string | null
  lastName: string | null
  highSchool: string | null
  gradeLevel: number | null
  gpa: number | null
  intendedMajor: string | null
  city: string | null
  state: string | null
  goals: string | null
}

interface Activity {
  id: string
  title: string
  category: string
  organization: string | null
  role: string | null
  description: string | null
  impactStatement: string | null
  startDate: string | null
  endDate: string | null
  isOngoing: boolean
  hoursPerWeek: number | null
  totalHours: number | null
  skillsGained: string[]
  isLeadership: boolean
  isAward: boolean
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Star; color: string }> = {
  ATHLETICS: { label: "Athletics", icon: Trophy, color: "text-blue-600" },
  ARTS: { label: "Arts", icon: Star, color: "text-purple-600" },
  ACADEMIC: { label: "Academic", icon: BookOpen, color: "text-emerald-600" },
  VOLUNTEER: { label: "Volunteer & Community Service", icon: Heart, color: "text-rose-600" },
  WORK: { label: "Work Experience", icon: Briefcase, color: "text-amber-600" },
  LEADERSHIP: { label: "Leadership", icon: Users, color: "text-[#2563EB]" },
  AWARD: { label: "Awards & Honors", icon: Award, color: "text-yellow-600" },
  OTHER: { label: "Other Activities", icon: Star, color: "text-muted-foreground" },
}

function gradeLabel(level: number | null): string {
  if (!level) return ""
  const labels: Record<number, string> = { 9: "Freshman", 10: "Sophomore", 11: "Junior", 12: "Senior", 13: "College Freshman" }
  return labels[level] || `Grade ${level}`
}

export default function SharedBragSheet() {
  const { token } = useParams<{ token: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/resume/share?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invalid link")
        return r.json()
      })
      .then((data) => {
        setProfile(data.profile)
        setActivities(data.activities || [])
      })
      .catch(() => setError("This brag sheet link is invalid or has been revoked."))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-secondary-foreground">{error || "Not found"}</p>
          <p className="text-sm text-muted-foreground mt-2">This link may have expired or been revoked.</p>
        </div>
      </div>
    )
  }

  // Group activities by category
  const grouped = activities.reduce((acc, act) => {
    const cat = act.category || "OTHER"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(act)
    return acc
  }, {} as Record<string, Activity[]>)

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Student"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold text-sm">S</div>
          <span className="text-lg font-semibold text-secondary-foreground">ScholarSuite — Brag Sheet</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        {/* Student info */}
        <div className="rounded-xl bg-card p-6 ring-1 ring-gray-200/50 shadow-sm">
          <h1 className="text-2xl font-bold text-secondary-foreground">{name}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {profile.highSchool && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                {profile.highSchool}
              </span>
            )}
            {profile.gradeLevel && <span>{gradeLabel(profile.gradeLevel)}</span>}
            {profile.gpa && <span>GPA: {profile.gpa}</span>}
            {profile.intendedMajor && <span>Major: {profile.intendedMajor}</span>}
            {profile.city && profile.state && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {profile.city}, {profile.state}
              </span>
            )}
          </div>
          {profile.goals && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{profile.goals}</p>
          )}
        </div>

        {/* Activities by category */}
        {Object.entries(grouped).map(([category, acts]) => {
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER
          const Icon = config.icon
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <h2 className="text-lg font-semibold text-secondary-foreground">{config.label}</h2>
                <span className="text-xs text-muted-foreground">({acts.length})</span>
              </div>
              <div className="space-y-3">
                {acts.map((act) => (
                  <div key={act.id} className="rounded-lg bg-card p-4 ring-1 ring-gray-200/50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{act.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[act.organization, act.role].filter(Boolean).join(" — ")}
                          {act.startDate && (
                            <span className="ml-2">
                              {new Date(act.startDate).getFullYear()}
                              {act.isOngoing ? " – Present" : act.endDate ? ` – ${new Date(act.endDate).getFullYear()}` : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      {act.totalHours && (
                        <span className="text-xs text-muted-foreground shrink-0">{act.totalHours} hrs</span>
                      )}
                    </div>
                    {act.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{act.description}</p>
                    )}
                    {act.impactStatement && (
                      <p className="text-sm text-secondary-foreground mt-2 font-medium italic">&ldquo;{act.impactStatement}&rdquo;</p>
                    )}
                    {act.skillsGained?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {act.skillsGained.map((skill) => (
                          <span key={skill} className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-accent text-blue-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {activities.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No activities added yet.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t">
          <p>Generated by ScholarSuite — scholarsuite.com</p>
        </div>
      </main>
    </div>
  )
}
