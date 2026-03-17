"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileSettings } from "@/components/ui/profile-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import {
  Sparkles,
  Check,
  Search,
  PenTool,
  CheckSquare,
  MessageSquare,
  DollarSign,
  Video,
  Crown,
  Loader2,
  Save,
  Shield,
} from "lucide-react"

const tabItems = [
  { id: "Account", label: "Account" },
  { id: "Notifications", label: "Notifications" },
  { id: "Privacy", label: "Privacy" },
  { id: "Plan", label: "Plan & Billing" },
]
type Tab = typeof tabItems[number]["id"]

const includedFeatures = [
  { icon: Search, label: "Scholarship discovery & matching" },
  { icon: CheckSquare, label: "Task management & tracking" },
  { icon: PenTool, label: "Essay drafting (1 active)" },
  { icon: MessageSquare, label: "Counselor messaging" },
  { icon: DollarSign, label: "Basic financial planning" },
  { icon: Video, label: "Meeting scheduling" },
]

const premiumFeatures = [
  { icon: PenTool, label: "Unlimited essay drafts & AI feedback" },
  { icon: Search, label: "Advanced scholarship matching" },
  { icon: DollarSign, label: "Full financial planning tools" },
  { icon: Sparkles, label: "AI-powered application assistance" },
  { icon: Crown, label: "Priority counselor support" },
]

const notificationItems = [
  { key: "notifyTaskReminders", label: "Task Reminders", desc: "Get notified when tasks are due or approaching deadlines" },
  { key: "notifyScholarshipDeadlines", label: "Scholarship Deadlines", desc: "Alerts for upcoming scholarship application deadlines" },
  { key: "notifyNewMessages", label: "New Messages", desc: "When you receive a message from counselors or parents" },
  { key: "notifyMeetingReminders", label: "Meeting Reminders", desc: "Reminders before scheduled meetings" },
  { key: "notifyEssayFeedback", label: "Essay Feedback", desc: "When an essay review is completed or needs revision" },
]

const privacyItems = [
  { key: "privacyHideGpa", adminKey: "allowStudentHideGpa", label: "Hide GPA from parents", desc: "Your GPA won't be visible on your parent's dashboard" },
  { key: "privacyHideEssays", adminKey: "allowStudentHideEssays", label: "Hide essay drafts from parents", desc: "Your essay drafts won't be visible to parents" },
  { key: "privacyHideCohortProfile", adminKey: "allowStudentHideCohortProfile", label: "Hide profile from cohort", desc: "Other students in your cohort won't see your details" },
]

interface Preferences {
  notifyTaskReminders: boolean
  notifyScholarshipDeadlines: boolean
  notifyNewMessages: boolean
  notifyMeetingReminders: boolean
  notifyEssayFeedback: boolean
  privacyHideGpa: boolean
  privacyHideEssays: boolean
  privacyHideCohortProfile: boolean
}

interface AdminControls {
  allowStudentHideGpa: string
  allowStudentHideEssays: string
  allowStudentHideCohortProfile: string
  [key: string]: string
}

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Account")
  const [prefs, setPrefs] = useState<Preferences>({
    notifyTaskReminders: true,
    notifyScholarshipDeadlines: true,
    notifyNewMessages: true,
    notifyMeetingReminders: true,
    notifyEssayFeedback: true,
    privacyHideGpa: false,
    privacyHideEssays: false,
    privacyHideCohortProfile: false,
  })
  const [adminControls, setAdminControls] = useState<AdminControls>({
    allowStudentHideGpa: "true",
    allowStudentHideEssays: "true",
    allowStudentHideCohortProfile: "true",
  })
  const [loading, setLoading] = useState(true)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/preferences").then(r => r.ok ? r.json() : null),
      fetch("/api/preferences/admin-controls").then(r => r.ok ? r.json() : null),
    ]).then(([prefsData, controlsData]) => {
      if (prefsData) setPrefs(p => ({ ...p, ...prefsData }))
      if (controlsData) setAdminControls(c => ({ ...c, ...controlsData }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSaveNotifications = async () => {
    setSavingNotifs(true)
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyTaskReminders: prefs.notifyTaskReminders,
          notifyScholarshipDeadlines: prefs.notifyScholarshipDeadlines,
          notifyNewMessages: prefs.notifyNewMessages,
          notifyMeetingReminders: prefs.notifyMeetingReminders,
          notifyEssayFeedback: prefs.notifyEssayFeedback,
        }),
      })
      if (res.ok) toast.success("Notification preferences saved")
      else toast.error("Failed to save preferences")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSavingNotifs(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacyHideGpa: prefs.privacyHideGpa,
          privacyHideEssays: prefs.privacyHideEssays,
          privacyHideCohortProfile: prefs.privacyHideCohortProfile,
        }),
      })
      if (res.ok) toast.success("Privacy preferences saved")
      else toast.error("Failed to save preferences")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSavingPrivacy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      <VercelTabs
        tabs={tabItems}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="border-b border-border pb-[6px]"
      />

      {activeTab === "Account" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProfileSettings />
        </motion.div>
      )}

      {activeTab === "Notifications" && (
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <section className="rounded-xl bg-white p-6 ring-1 ring-foreground/10">
            <h3 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {notificationItems.map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof Preferences] }))}
                        className={`h-6 w-11 rounded-full transition-colors ${prefs[item.key as keyof Preferences] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[item.key as keyof Preferences] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveNotifications} disabled={savingNotifs} className="rounded-lg gap-2">
                  {savingNotifs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Preferences
                </Button>
              </div>
            )}
          </section>
        </motion.div>
      )}

      {activeTab === "Privacy" && (
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <section className="rounded-xl bg-white p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#1E3A5F]" />
              <h3 className="text-base font-semibold text-foreground">Privacy Settings</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {privacyItems.map(item => {
                    const adminAllows = adminControls[item.adminKey] === "true"
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                          {!adminAllows && (
                            <p className="text-xs text-amber-600 mt-0.5">This setting is managed by your administrator</p>
                          )}
                        </div>
                        <button
                          disabled={!adminAllows}
                          onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof Preferences] }))}
                          className={`h-6 w-11 rounded-full transition-colors ${!adminAllows ? "opacity-40 cursor-not-allowed" : ""} ${prefs[item.key as keyof Preferences] ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[item.key as keyof Preferences] ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <Button onClick={handleSavePrivacy} disabled={savingPrivacy} className="rounded-lg gap-2">
                  {savingPrivacy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Privacy Settings
                </Button>
              </div>
            )}
          </section>
        </motion.div>
      )}

      {activeTab === "Plan" && (
        <motion.div
          className="max-w-2xl space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Current Plan */}
          <Card className="ring-1 ring-foreground/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1E3A5F]">Current Plan</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  Early Access — Free
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;re on the Early Access plan. All features are currently free while we&apos;re in beta. We&apos;ll notify you well in advance before any pricing changes.
              </p>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">What&apos;s included</p>
                <div className="grid gap-2">
                  {includedFeatures.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Preview */}
          <Card className="ring-1 ring-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/[0.03] to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#2563EB]" />
                <CardTitle className="text-base font-semibold text-[#1E3A5F]">Scholar Pro</CardTitle>
                <Badge variant="outline" className="text-[#2563EB] border-[#2563EB]/30 text-[10px]">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Unlock the full power of ScholarSuite with advanced tools to maximize your scholarship potential.
              </p>

              <div className="grid gap-2">
                {premiumFeatures.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB]/10">
                      <feature.icon className="h-3 w-3 text-[#2563EB]" />
                    </div>
                    <span className="text-sm text-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>

              <Button disabled className="gap-2 opacity-60 cursor-not-allowed">
                <Sparkles className="h-4 w-4" />
                Upgrade — Coming Soon
              </Button>

              <p className="text-xs text-muted-foreground">
                Pricing hasn&apos;t been finalized yet. Early Access users will receive special pricing when we launch paid plans.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
