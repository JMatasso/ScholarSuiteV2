"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Sparkles, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { ProfileSettings } from "@/components/ui/profile-settings"

const tabItems = [
  { id: "Account", label: "Account" },
  { id: "General", label: "General" },
  { id: "Email", label: "Email" },
  { id: "Security", label: "Security" },
  { id: "Privacy", label: "Privacy Controls" },
  { id: "AI", label: "AI Features" },
  { id: "API", label: "API" },
]
type Tab = typeof tabItems[number]["id"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("Account")
  const [settings, setSettings] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [apiKeyRevealed, setApiKeyRevealed] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(d => {
        if (d && typeof d === "object" && !d.error) {
          setSettings(d)
        }
        setLoading(false)
      })
      .catch(() => { setLoading(false) })
  }, [])

  const get = (key: string, fallback: string = "") => settings[key] ?? fallback

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const handleSave = async (tabSettings: Record<string, string>) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tabSettings),
      })
      if (!res.ok) throw new Error()
      setSettings(prev => ({ ...prev, ...tabSettings }))
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Settings" description="Configure your ScholarSuite workspace." />
        <div className="flex items-center justify-center h-32"><LoaderOne /></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Configure your ScholarSuite workspace."
      />

      {/* Tabs */}
      <VercelTabs
        tabs={tabItems}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="border-b border-border pb-[6px]"
      />

      {activeTab === "Account" && (
        <ProfileSettings />
      )}

      <div className="rounded-xl bg-card p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]">
        {activeTab === "General" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Organization Name</label>
              <Input
                type="text"
                value={get("orgName", "ScholarSuite Consulting")}
                onChange={e => set("orgName", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Admin Email</label>
              <Input
                type="email"
                value={get("adminEmail", "admin@scholarsuite.com")}
                onChange={e => set("adminEmail", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Time Zone</label>
              <select
                value={get("timezone", "America/New_York")}
                onChange={e => set("timezone", e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default Language</label>
              <select
                value={get("language", "English")}
                onChange={e => set("language", e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({ orgName: get("orgName", "ScholarSuite Consulting"), adminEmail: get("adminEmail", "admin@scholarsuite.com"), timezone: get("timezone", "America/New_York"), language: get("language", "English") })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "Email" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">SMTP Host</label>
              <Input
                type="text"
                value={get("smtpHost", "smtp.scholarsuite.com")}
                onChange={e => set("smtpHost", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">SMTP Port</label>
              <Input
                type="text"
                value={get("smtpPort", "587")}
                onChange={e => set("smtpPort", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">From Address</label>
              <Input
                type="email"
                value={get("emailFrom", "noreply@scholarsuite.com")}
                onChange={e => set("emailFrom", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={get("emailNotifications", "true") === "true"}
                onChange={e => set("emailNotifications", String(e.target.checked))}
                className="size-4 rounded border-input"
                id="email-notif"
              />
              <label htmlFor="email-notif" className="text-sm text-foreground">Send email notifications for new messages</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={get("weeklyDigest", "true") === "true"}
                onChange={e => set("weeklyDigest", String(e.target.checked))}
                className="size-4 rounded border-input"
                id="email-digest"
              />
              <label htmlFor="email-digest" className="text-sm text-foreground">Send weekly digest to students</label>
            </div>
            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({ smtpHost: get("smtpHost"), smtpPort: get("smtpPort"), emailFrom: get("emailFrom"), emailNotifications: get("emailNotifications"), weeklyDigest: get("weeklyDigest") })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password Minimum Length</label>
              <Input
                type="number"
                value={get("minPasswordLength", "8")}
                onChange={e => set("minPasswordLength", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={get("require2faAdmins", "true") === "true"}
                onChange={e => set("require2faAdmins", String(e.target.checked))}
                className="size-4 rounded border-input"
                id="2fa"
              />
              <label htmlFor="2fa" className="text-sm text-foreground">Require two-factor authentication for admins</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={get("require2faStudents", "false") === "true"}
                onChange={e => set("require2faStudents", String(e.target.checked))}
                className="size-4 rounded border-input"
                id="2fa-students"
              />
              <label htmlFor="2fa-students" className="text-sm text-foreground">Require two-factor authentication for students</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={get("sessionTimeout", "60")}
                onChange={e => set("sessionTimeout", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Allowed IP Ranges (optional)</label>
              <Input
                type="text"
                value={get("allowedIpRanges", "")}
                onChange={e => set("allowedIpRanges", e.target.value)}
                placeholder="e.g., 192.168.1.0/24"
                className="h-9"
              />
            </div>
            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({ minPasswordLength: get("minPasswordLength"), require2faAdmins: get("require2faAdmins"), require2faStudents: get("require2faStudents"), sessionTimeout: get("sessionTimeout"), allowedIpRanges: get("allowedIpRanges") })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "Privacy" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-accent px-4 py-3 text-sm text-blue-800 mb-4">
              <Shield className="size-4 shrink-0" />
              These controls determine which privacy options are available to students and parents in their settings.
            </div>

            <div>
              <h3 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-4">Student Privacy Options</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("privacy:allowStudentHideGpa", "true") === "true"}
                    onChange={e => set("privacy:allowStudentHideGpa", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="privacy-hide-gpa"
                  />
                  <div>
                    <label htmlFor="privacy-hide-gpa" className="text-sm font-medium text-foreground">Allow students to hide GPA</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Students can choose whether their GPA is visible to parents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("privacy:allowStudentHideEssays", "true") === "true"}
                    onChange={e => set("privacy:allowStudentHideEssays", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="privacy-hide-essays"
                  />
                  <div>
                    <label htmlFor="privacy-hide-essays" className="text-sm font-medium text-foreground">Allow students to hide essays</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Students can choose whether their essay drafts are visible to parents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("privacy:allowStudentHideCohortProfile", "true") === "true"}
                    onChange={e => set("privacy:allowStudentHideCohortProfile", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="privacy-hide-cohort"
                  />
                  <div>
                    <label htmlFor="privacy-hide-cohort" className="text-sm font-medium text-foreground">Allow cohort profile hiding</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Students can choose whether their profile is visible to other cohort members</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-4">Parent Privacy Options</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("privacy:allowParentHideContactFromCounselors", "true") === "true"}
                    onChange={e => set("privacy:allowParentHideContactFromCounselors", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="privacy-parent-contact"
                  />
                  <div>
                    <label htmlFor="privacy-parent-contact" className="text-sm font-medium text-foreground">Allow parents to hide contact info</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Parents can hide their phone/email from counselors</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("privacy:allowParentEmailOnlyComms", "true") === "true"}
                    onChange={e => set("privacy:allowParentEmailOnlyComms", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="privacy-parent-email-only"
                  />
                  <div>
                    <label htmlFor="privacy-parent-email-only" className="text-sm font-medium text-foreground">Allow email-only mode</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Parents can opt for email-only communications instead of in-app</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({
                "privacy:allowStudentHideGpa": get("privacy:allowStudentHideGpa", "true"),
                "privacy:allowStudentHideEssays": get("privacy:allowStudentHideEssays", "true"),
                "privacy:allowStudentHideCohortProfile": get("privacy:allowStudentHideCohortProfile", "true"),
                "privacy:allowParentHideContactFromCounselors": get("privacy:allowParentHideContactFromCounselors", "true"),
                "privacy:allowParentEmailOnlyComms": get("privacy:allowParentEmailOnlyComms", "true"),
              })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "AI" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-2">
              <AlertTriangle className="size-4 shrink-0" />
              AI features use the Anthropic API and will incur usage charges when enabled. Estimated cost: ~$0.02 per student per match refresh.
            </div>

            <div>
              <h3 className="text-sm font-semibold text-secondary-foreground uppercase tracking-wide mb-4">Scholarship Matching</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={get("feature:aiMatching", "false") === "true"}
                    onChange={e => set("feature:aiMatching", String(e.target.checked))}
                    className="size-4 rounded border-input mt-0.5"
                    id="ai-matching"
                  />
                  <div>
                    <label htmlFor="ai-matching" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#2563EB]" />
                      AI-Enhanced Matching
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When enabled, the matching engine runs a second AI-powered pass on the top 50 rule-based matches per student. Claude evaluates how well each student&apos;s activities, goals, and interests align with the scholarship&apos;s description — catching nuanced fits that structured fields miss.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scores are cached for 7 days. AI scoring runs in the background and does not slow down the initial match results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({
                "feature:aiMatching": get("feature:aiMatching", "false"),
              })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "API" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
              <div className="flex gap-2">
                <Input
                  type={apiKeyRevealed ? "text" : "password"}
                  readOnly
                  value={get("apiKey", "sk_live_••••••••••••••••••••••••")}
                  className="h-9 flex-1 bg-muted/50 font-mono"
                />
                <Button variant="outline" size="sm" onClick={() => setApiKeyRevealed(!apiKeyRevealed)}>
                  {apiKeyRevealed ? "Hide" : "Reveal"}
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  const newKey = `sk_live_${Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, "0")).join("")}`
                  set("apiKey", newKey)
                  try {
                    await handleSave({ apiKey: newKey })
                    toast.success("API key regenerated")
                    setApiKeyRevealed(true)
                  } catch {
                    toast.error("Failed to regenerate API key")
                  }
                }}>Regenerate</Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Keep this key secret. Do not share it publicly.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Webhook URL</label>
              <Input
                type="url"
                value={get("webhookUrl", "")}
                onChange={e => set("webhookUrl", e.target.value)}
                placeholder="https://your-server.com/webhooks/scholarsuite"
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Rate Limit (requests per minute)</label>
              <Input
                type="number"
                value={get("rateLimit", "100")}
                onChange={e => set("rateLimit", e.target.value)}
                className="h-9"
              />
            </div>
            <Button
              className="w-fit"
              disabled={saving}
              onClick={() => handleSave({ webhookUrl: get("webhookUrl"), rateLimit: get("rateLimit") })}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
