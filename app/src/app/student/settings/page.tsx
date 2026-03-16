"use client"

import { useState } from "react"
import { motion } from "motion/react"
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
} from "lucide-react"

const tabItems = [
  { id: "Account", label: "Account" },
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

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Account")

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
