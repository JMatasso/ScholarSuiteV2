"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"

const tabs = ["General", "Email", "Security", "API"] as const
type Tab = typeof tabs[number]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("General")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Configure your ScholarSuite workspace."
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 ring-1 ring-foreground/10">
        {activeTab === "General" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Organization Name</label>
              <input
                type="text"
                defaultValue="ScholarSuite Consulting"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Admin Email</label>
              <input
                type="email"
                defaultValue="admin@scholarsuite.com"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Time Zone</label>
              <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option>America/New_York (EST)</option>
                <option>America/Chicago (CST)</option>
                <option>America/Denver (MST)</option>
                <option>America/Los_Angeles (PST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default Language</label>
              <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option>English</option>
                <option>Spanish</option>
              </select>
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        )}

        {activeTab === "Email" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">SMTP Host</label>
              <input
                type="text"
                defaultValue="smtp.scholarsuite.com"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">SMTP Port</label>
              <input
                type="text"
                defaultValue="587"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">From Address</label>
              <input
                type="email"
                defaultValue="noreply@scholarsuite.com"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="size-4 rounded border-input" id="email-notif" />
              <label htmlFor="email-notif" className="text-sm text-foreground">Send email notifications for new messages</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="size-4 rounded border-input" id="email-digest" />
              <label htmlFor="email-digest" className="text-sm text-foreground">Send weekly digest to students</label>
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        )}

        {activeTab === "Security" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password Minimum Length</label>
              <input
                type="number"
                defaultValue={8}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="size-4 rounded border-input" id="2fa" />
              <label htmlFor="2fa" className="text-sm text-foreground">Require two-factor authentication for admins</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="size-4 rounded border-input" id="2fa-students" />
              <label htmlFor="2fa-students" className="text-sm text-foreground">Require two-factor authentication for students</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Session Timeout (minutes)</label>
              <input
                type="number"
                defaultValue={60}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Allowed IP Ranges (optional)</label>
              <input
                type="text"
                placeholder="e.g., 192.168.1.0/24"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        )}

        {activeTab === "API" && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  defaultValue="sk_live_••••••••••••••••••••••••"
                  className="h-9 flex-1 rounded-lg border border-input bg-muted/50 px-3 text-sm font-mono outline-none"
                />
                <Button variant="outline" size="sm">Reveal</Button>
                <Button variant="outline" size="sm">Regenerate</Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Keep this key secret. Do not share it publicly.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Webhook URL</label>
              <input
                type="url"
                placeholder="https://your-server.com/webhooks/scholarsuite"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Rate Limit (requests per minute)</label>
              <input
                type="number"
                defaultValue={100}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        )}
      </div>
    </div>
  )
}
