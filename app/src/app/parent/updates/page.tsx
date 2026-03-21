"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bell,
  CheckCircle2,
  FileText,
  GraduationCap,
  PenTool,
  Loader2,
  Save,
  Mail,
  Phone,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface ActivityEvent {
  id: string
  studentId: string
  type: string
  title: string
  description: string | null
  metadata: string | null
  createdAt: string
}

interface NotifPrefs {
  notifyChannel: "EMAIL" | "SMS" | "BOTH"
  notifyScholarshipSubmissions: boolean
  notifyCollegeAppSubmissions: boolean
  notifyWeeklyDigest: boolean
  notifyTasks: boolean
  notifyDeadlines: boolean
  notifyAwards: boolean
  notifyMessages: boolean
  smsConsent: boolean
  smsPhone: string | null
}

const EVENT_ICONS: Record<string, typeof CheckCircle2> = {
  TASK_COMPLETED: CheckCircle2,
  SCHOLARSHIP_APP_SUBMITTED: FileText,
  COLLEGE_APP_SUBMITTED: GraduationCap,
  ESSAY_STATUS_CHANGED: PenTool,
}

const EVENT_COLORS: Record<string, string> = {
  TASK_COMPLETED: "text-emerald-600 bg-emerald-50",
  SCHOLARSHIP_APP_SUBMITTED: "text-blue-600 bg-blue-50",
  COLLEGE_APP_SUBMITTED: "text-violet-600 bg-violet-50",
  ESSAY_STATUS_CHANGED: "text-amber-600 bg-amber-50",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ParentUpdatesPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [prefs, setPrefs] = useState<NotifPrefs>({
    notifyChannel: "EMAIL",
    notifyScholarshipSubmissions: true,
    notifyCollegeAppSubmissions: true,
    notifyWeeklyDigest: true,
    notifyTasks: true,
    notifyDeadlines: true,
    notifyAwards: true,
    notifyMessages: true,
    smsConsent: false,
    smsPhone: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/activity-events").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/parents/notification-prefs").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([evts, prefsData]) => {
        setEvents(Array.isArray(evts) ? evts : [])
        if (prefsData) setPrefs((p) => ({ ...p, ...prefsData }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSavePrefs = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/parents/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (res.ok) toast.success("Notification preferences saved")
      else toast.error("Failed to save preferences")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  // Weekly summary from last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recentEvents = events.filter((e) => e.createdAt >= weekAgo)
  const weeklyCounts = {
    tasks: recentEvents.filter((e) => e.type === "TASK_COMPLETED").length,
    scholarships: recentEvents.filter((e) => e.type === "SCHOLARSHIP_APP_SUBMITTED").length,
    collegeApps: recentEvents.filter((e) => e.type === "COLLEGE_APP_SUBMITTED").length,
    essays: recentEvents.filter((e) => e.type === "ESSAY_STATUS_CHANGED").length,
  }

  const needsSetup = !prefs.smsConsent && prefs.notifyChannel === "EMAIL"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Updates"
        description="Activity feed and notification preferences for your student."
      />

      {/* Notification Setup Banner */}
      {needsSetup && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="bento" className="border-[#2563EB]/20 bg-gradient-to-r from-[#2563EB]/[0.04] to-transparent">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <Smartphone className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Stay in the loop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get text or email alerts when your student submits applications or completes milestones.
                  </p>
                </div>
              </div>
              <Button
                className="shrink-0"
                onClick={() => setShowPrefs(true)}
              >
                Set up alerts
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1E3A5F]">
              This Week&apos;s Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-emerald-50/50 p-3 text-center">
                <p className="text-lg font-semibold text-emerald-700">{weeklyCounts.tasks}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              <div className="rounded-lg bg-blue-50/50 p-3 text-center">
                <p className="text-lg font-semibold text-blue-700">{weeklyCounts.scholarships}</p>
                <p className="text-xs text-muted-foreground">Scholarship Apps</p>
              </div>
              <div className="rounded-lg bg-violet-50/50 p-3 text-center">
                <p className="text-lg font-semibold text-violet-700">{weeklyCounts.collegeApps}</p>
                <p className="text-xs text-muted-foreground">College Apps</p>
              </div>
              <div className="rounded-lg bg-amber-50/50 p-3 text-center">
                <p className="text-lg font-semibold text-amber-700">{weeklyCounts.essays}</p>
                <p className="text-xs text-muted-foreground">Essay Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Preferences (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card variant="bento">
          <CardHeader>
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className="flex w-full items-center justify-between"
            >
              <CardTitle className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </CardTitle>
              {showPrefs ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showPrefs && (
            <CardContent className="space-y-5">
              {/* Channel Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  How would you like to be notified?
                </label>
                <div className="flex gap-2">
                  {(["EMAIL", "SMS", "BOTH"] as const).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setPrefs((p) => ({ ...p, notifyChannel: ch }))}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        prefs.notifyChannel === ch
                          ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] font-medium"
                          : "border-input text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {ch === "EMAIL" && <Mail className="h-3.5 w-3.5" />}
                      {ch === "SMS" && <Phone className="h-3.5 w-3.5" />}
                      {ch === "BOTH" && <Smartphone className="h-3.5 w-3.5" />}
                      {ch === "BOTH" ? "Email & Text" : ch === "EMAIL" ? "Email" : "Text"}
                    </button>
                  ))}
                </div>
              </div>

              {/* SMS Phone + Consent */}
              {(prefs.notifyChannel === "SMS" || prefs.notifyChannel === "BOTH") && (
                <div className="space-y-3 rounded-lg border border-input p-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Phone number for texts
                    </label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={prefs.smsPhone || ""}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, smsPhone: e.target.value }))
                      }
                    />
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.smsConsent}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, smsConsent: e.target.checked }))
                      }
                      className="size-4 rounded border-input mt-0.5"
                    />
                    <span className="text-xs text-muted-foreground">
                      I agree to receive text message alerts from ScholarSuite. Message and data rates may apply. Reply STOP to unsubscribe.
                    </span>
                  </label>
                </div>
              )}

              {/* Event Toggles */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">
                  What events should we notify you about?
                </label>
                {[
                  { key: "notifyScholarshipSubmissions", label: "Scholarship applications", desc: "When your student starts or submits a scholarship application" },
                  { key: "notifyCollegeAppSubmissions", label: "College applications", desc: "When a college application is created or submitted" },
                  { key: "notifyTasks", label: "Task completions", desc: "When your student completes a task" },
                  { key: "notifyWeeklyDigest", label: "Weekly digest", desc: "A summary email every Monday with the week's activity" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          [item.key]: !p[item.key as keyof NotifPrefs],
                        }))
                      }
                      className={`h-6 w-11 rounded-full transition-colors ${
                        prefs[item.key as keyof NotifPrefs]
                          ? "bg-[#2563EB]"
                          : "bg-muted"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          prefs[item.key as keyof NotifPrefs]
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSavePrefs}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Preferences
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
          Activity Feed
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoaderOne />
          </div>
        ) : events.length === 0 ? (
          <Card variant="bento">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No activity yet. Events will appear here as your student makes progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const Icon = EVENT_ICONS[event.type] || Bell
              const colorClass = EVENT_COLORS[event.type] || "text-gray-600 bg-gray-50"

              return (
                <Card key={event.id} variant="bento">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(event.createdAt)}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
