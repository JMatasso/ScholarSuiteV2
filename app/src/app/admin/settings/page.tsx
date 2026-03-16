"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"
import { ProfileSettings } from "@/components/ui/profile-settings"

const tabItems = [
  { id: "Account", label: "Account" },
  { id: "General", label: "General" },
  { id: "Email", label: "Email" },
  { id: "Security", label: "Security" },
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
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading settings...</div>
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

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
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
