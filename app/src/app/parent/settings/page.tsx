"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileSettings } from "@/components/ui/profile-settings"

export default function ParentSettingsPage() {
  const [prefs, setPrefs] = useState({
    phone: "",
    relationship: "",
    notifyTasks: true,
    notifyDeadlines: true,
    notifyAwards: true,
    notifyMessages: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/parents/onboarding")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setPrefs(p => ({ ...p, ...d }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your account and notification preferences." />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ProfileSettings />
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <h3 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h3>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
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
                      <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[item.key as keyof typeof prefs] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
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
    </div>
  )
}
