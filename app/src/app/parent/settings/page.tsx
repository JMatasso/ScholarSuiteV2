"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Loader2, Save, Shield, Check, Sparkles, Crown, TrendingUp, Bell, MessageSquare, FileText, Mail, Phone, Smartphone } from "@/lib/icons"
import LoaderOne from "@/components/ui/loader-one"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileSettings } from "@/components/ui/profile-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"

const tabItems = [
  { id: "Account", label: "Account" },
  { id: "Notifications", label: "Notifications" },
  { id: "Privacy", label: "Privacy" },
  { id: "Plan", label: "Plan & Billing" },
]
type Tab = typeof tabItems[number]["id"]

const includedFeatures = [
  { icon: TrendingUp, label: "Student progress dashboard" },
  { icon: Bell, label: "Task & deadline notifications" },
  { icon: MessageSquare, label: "Counselor messaging" },
  { icon: FileText, label: "Application status tracking" },
]

const premiumFeatures = [
  { icon: TrendingUp, label: "Detailed analytics & insights" },
  { icon: Bell, label: "Custom notification rules" },
  { icon: Sparkles, label: "AI-powered progress reports" },
  { icon: Crown, label: "Priority support access" },
]

const privacyItems = [
  { key: "privacyHideContactFromCounselors", adminKey: "allowParentHideContactFromCounselors", label: "Hide contact info from counselors", desc: "Counselors won't see your phone number or email" },
  { key: "privacyEmailOnlyComms", adminKey: "allowParentEmailOnlyComms", label: "Email-only communications", desc: "Receive updates via email only, not in-app notifications" },
]

interface Preferences {
  phone: string
  relationship: string
  notifyTasks: boolean
  notifyDeadlines: boolean
  notifyAwards: boolean
  notifyMessages: boolean
  privacyHideContactFromCounselors: boolean
  privacyEmailOnlyComms: boolean
  notifyChannel: "EMAIL" | "SMS" | "BOTH"
  smsConsent: boolean
  smsPhone: string
  [key: string]: string | boolean
}

interface AdminControls {
  allowParentHideContactFromCounselors: string
  allowParentEmailOnlyComms: string
  [key: string]: string
}

export default function ParentSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Account")
  const [prefs, setPrefs] = useState<Preferences>({
    phone: "",
    relationship: "",
    notifyTasks: true,
    notifyDeadlines: true,
    notifyAwards: true,
    notifyMessages: true,
    privacyHideContactFromCounselors: false,
    privacyEmailOnlyComms: false,
    notifyChannel: "EMAIL",
    smsConsent: false,
    smsPhone: "",
  })
  const [adminControls, setAdminControls] = useState<AdminControls>({
    allowParentHideContactFromCounselors: "true",
    allowParentEmailOnlyComms: "true",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/parents/onboarding").then(r => r.ok ? r.json() : null),
      fetch("/api/preferences").then(r => r.ok ? r.json() : null),
      fetch("/api/preferences/admin-controls").then(r => r.ok ? r.json() : null),
    ]).then(([onboardingData, prefsData, controlsData]) => {
      if (onboardingData) setPrefs(p => ({ ...p, ...onboardingData }))
      if (prefsData) setPrefs(p => ({ ...p, ...prefsData }))
      if (controlsData) setAdminControls(c => ({ ...c, ...controlsData }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/parents/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (res.ok) toast.success("Preferences saved")
      else toast.error("Failed to save")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacyHideContactFromCounselors: prefs.privacyHideContactFromCounselors,
          privacyEmailOnlyComms: prefs.privacyEmailOnlyComms,
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
      <PageHeader title="Settings" description="Manage your account and notification preferences." />

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
          <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
            <h3 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h3>
            {loading ? (
              <div className="flex justify-center py-4"><LoaderOne /></div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {[
                    { key: "notifyTasks", label: "Task updates", desc: "When your student's tasks are updated" },
                    { key: "notifyDeadlines", label: "Deadline reminders", desc: "Upcoming scholarship deadlines" },
                    { key: "notifyAwards", label: "Award notifications", desc: "When scholarships are awarded" },
                    { key: "notifyMessages", label: "New messages", desc: "When you receive a message" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                        className={`h-6 w-11 rounded-full transition-colors ${prefs[item.key as keyof typeof prefs] ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${prefs[item.key as keyof typeof prefs] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Notification Channel */}
                <div className="rounded-lg border border-input p-4 space-y-3">
                  <label className="text-xs font-medium text-muted-foreground block">Notification Channel</label>
                  <div className="flex gap-2">
                    {(["EMAIL", "SMS", "BOTH"] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setPrefs(p => ({ ...p, notifyChannel: ch }))}
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
                  {(prefs.notifyChannel === "SMS" || prefs.notifyChannel === "BOTH") && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">SMS Phone Number</label>
                        <input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={(prefs.smsPhone as string) || ""}
                          onChange={e => setPrefs(p => ({ ...p, smsPhone: e.target.value }))}
                          className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(prefs.smsConsent)}
                          onChange={e => setPrefs(p => ({ ...p, smsConsent: e.target.checked }))}
                          className="size-4 rounded border-input mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground">
                          I agree to receive text alerts from ScholarSuite. Reply STOP to unsubscribe.
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={prefs.phone}
                      onChange={e => setPrefs(p => ({ ...p, phone: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Relationship</label>
                    <select
                      value={prefs.relationship}
                      onChange={e => setPrefs(p => ({ ...p, relationship: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Select...</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="rounded-lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
          <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-secondary-foreground" />
              <h3 className="text-base font-semibold text-foreground">Privacy Settings</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <LoaderOne />
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
                          <span className={`block h-5 w-5 rounded-full bg-card shadow transition-transform ${prefs[item.key as keyof Preferences] ? "translate-x-5" : "translate-x-0.5"}`} />
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
          <Card variant="bento">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-secondary-foreground">Current Plan</CardTitle>
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
                <p className="text-xs font-semibold text-secondary-foreground uppercase tracking-wide mb-3">What&apos;s included</p>
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
          <Card variant="bento" className="bg-gradient-to-br from-[#2563EB]/[0.03] to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#2563EB]" />
                <CardTitle className="text-base font-semibold text-secondary-foreground">Family Pro</CardTitle>
                <Badge variant="outline" className="text-[#2563EB] border-[#2563EB]/30 text-[10px]">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get deeper insights into your student&apos;s journey with advanced tools and priority access.
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
