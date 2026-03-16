"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  ExternalLink,
  Building2,
  FileText,
  BookOpen,
  MapPin,
  GraduationCap,
  Save,
} from "lucide-react"

interface ApplicationDetail {
  id: string
  status: string
  amountAwarded: number | null
  isRecurring: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  scholarship: {
    id: string
    name: string
    provider: string | null
    amount: number | null
    amountMax: number | null
    deadline: string | null
    description: string | null
    url: string | null
    minGpa: number | null
    states: string[]
    fieldsOfStudy: string[]
    requiresFirstGen: boolean
    requiresPell: boolean
    requiresFinancialNeed: boolean
    minSat: number | null
    minAct: number | null
  }
  checklists: Array<{ id: string; title: string; isCompleted: boolean }>
  essays: Array<{ id: string; title: string; status: string }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-100 text-gray-700 border-gray-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  SUBMITTED: { label: "Submitted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  AWARDED: { label: "Awarded", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DENIED: { label: "Denied", color: "bg-rose-100 text-rose-700 border-rose-200" },
}

const statusOrder = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "AWARDED", "DENIED"]

function formatAmount(amount: number | null): string {
  if (!amount) return "—"
  return `$${amount.toLocaleString()}`
}

function formatDate(date: string | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [amountAwarded, setAmountAwarded] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoading(false); return }
        setApp(data)
        setNotes(data.notes || "")
        setAmountAwarded(data.amountAwarded?.toString() || "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setApp((prev) => prev ? { ...prev, status: newStatus } : prev)
      toast.success(`Status updated to ${statusConfig[newStatus]?.label}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { notes }
      if (amountAwarded) body.amountAwarded = parseFloat(amountAwarded)
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="space-y-6">
        <PageHeader title="Application Not Found" />
        <Link href="/student/applications">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
      </div>
    )
  }

  const s = app.scholarship
  const config = statusConfig[app.status] || statusConfig.NOT_STARTED

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={s.provider || undefined}
        actions={
          <div className="flex items-center gap-2">
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Visit Site
                </Button>
              </a>
            )}
            <Link href="/student/applications">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status + Amount header */}
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F]/10">
                    <DollarSign className="h-5 w-5 text-[#1E3A5F]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1E3A5F]">{formatAmount(s.amount)}</p>
                    {s.amountMax && s.amountMax !== s.amount && (
                      <p className="text-xs text-muted-foreground">Up to {formatAmount(s.amountMax)}</p>
                    )}
                  </div>
                </div>
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={cn("h-8 rounded-full border px-3 text-xs font-medium outline-none cursor-pointer", config.color)}
                >
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>{statusConfig[status].label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {s.description && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {s.description}
              </CardContent>
            </Card>
          )}

          {/* Eligibility */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Eligibility Requirements</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium">{formatDate(s.deadline)}</span>
                </div>
                {s.minGpa && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Min GPA:</span>
                    <span className="font-medium">{s.minGpa}</span>
                  </div>
                )}
                {s.minSat && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Min SAT:</span>
                    <span className="font-medium">{s.minSat}</span>
                  </div>
                )}
                {s.minAct && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Min ACT:</span>
                    <span className="font-medium">{s.minAct}</span>
                  </div>
                )}
                {s.states.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">States:</span>
                    <span className="font-medium">{s.states.join(", ")}</span>
                  </div>
                )}
                {s.fieldsOfStudy.length > 0 && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fields:</span>
                    <span className="font-medium">{s.fieldsOfStudy.join(", ")}</span>
                  </div>
                )}
                {(s.requiresFirstGen || s.requiresPell || s.requiresFinancialNeed) && (
                  <div className="sm:col-span-2 flex flex-wrap gap-1.5">
                    {s.requiresFirstGen && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">First-Gen Required</span>
                    )}
                    {s.requiresPell && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">Pell Eligible Required</span>
                    )}
                    {s.requiresFinancialNeed && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">Financial Need Required</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked essays */}
          {app.essays.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Linked Essays</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {app.essays.map((essay) => (
                  <Link
                    key={essay.id}
                    href={`/student/essays`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{essay.title}</span>
                    <span className={cn(
                      "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      essay.status === "FINAL" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      essay.status === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-gray-50 text-gray-600 border-gray-200"
                    )}>
                      {essay.status}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — notes + actions */}
        <div className="space-y-6">
          {/* Amount Awarded (when status is AWARDED) */}
          {app.status === "AWARDED" && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader><CardTitle className="text-sm text-emerald-700">Amount Awarded</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={amountAwarded}
                    onChange={(e) => setAmountAwarded(e.target.value)}
                    placeholder="Enter amount"
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this application..."
                rows={6}
                className="resize-none"
              />
              <Button
                size="sm"
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 w-full"
                onClick={handleSaveNotes}
                disabled={saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Info</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Added</span>
                <span className="font-medium text-foreground">{formatDate(app.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-foreground">{formatDate(app.updatedAt)}</span>
              </div>
              {app.isRecurring && (
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-medium text-foreground">Recurring</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
