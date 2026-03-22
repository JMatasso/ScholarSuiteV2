"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ClipboardCheck,
  Send,
  Star,
  Users,
  BarChart3,
  Download,
  Trash2,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

interface Campaign {
  id: string
  name: string
  message: string | null
  recipientCount: number
  responseCount: number
  responseRate: number
  createdAt: string
}

interface StudentOption {
  id: string
  name: string
  email: string
  status?: string
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [sending, setSending] = useState(false)

  // New campaign form
  const [campaignName, setCampaignName] = useState("")
  const [campaignMessage, setCampaignMessage] = useState("")
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [loadingStudents, setLoadingStudents] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/reviews/campaigns")
      if (res.ok) setCampaigns(await res.json())
    } catch {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch("/api/students")
      if (res.ok) {
        const data = await res.json()
        setStudents(
          data.map((s: { id: string; user?: { name: string; email: string }; name?: string; email?: string; status?: string }) => ({
            id: s.id,
            name: s.user?.name || s.name || "Unknown",
            email: s.user?.email || s.email || "",
            status: s.status,
          }))
        )
      }
    } catch {
      // ignore
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  const openNewCampaign = () => {
    setCampaignName("")
    setCampaignMessage("")
    setSelectedIds([])
    setStudentSearch("")
    setShowNewDialog(true)
    fetchStudents()
  }

  const handleSend = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name")
      return
    }
    if (selectedIds.length === 0) {
      toast.error("Please select at least one recipient")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/reviews/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          message: campaignMessage || undefined,
          recipientIds: selectedIds,
        }),
      })
      if (!res.ok) throw new Error("Failed to send")
      const data = await res.json()
      toast.success(`Review emails sent to ${data.sentCount} recipients`)
      setShowNewDialog(false)
      fetchCampaigns()
    } catch {
      toast.error("Failed to send review campaign")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign and all its responses?")) return
    try {
      await fetch(`/api/reviews/campaigns/${id}`, { method: "DELETE" })
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast.success("Campaign deleted")
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleExport = () => {
    window.open("/api/reviews/export", "_blank")
  }

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllGraduated = () => {
    const graduated = students.filter((s) => s.status === "GRADUATED")
    setSelectedIds(graduated.map((s) => s.id))
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  // Aggregate stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.recipientCount, 0)
  const totalResponses = campaigns.reduce((sum, c) => sum + c.responseCount, 0)
  const avgResponseRate =
    totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-foreground">
            Graduation Reviews
          </h1>
          <p className="mt-1 text-muted-foreground">
            Send exit surveys to graduating students and parents, and view their
            feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            className="gap-2"
            onClick={openNewCampaign}
          >
            <Send className="h-4 w-4" />
            Send Reviews
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Campaigns"
          value={campaigns.length}
          icon={ClipboardCheck}
          index={0}
        />
        <StatCard
          title="Emails Sent"
          value={totalSent}
          icon={Send}
          index={1}
        />
        <StatCard
          title="Responses"
          value={totalResponses}
          icon={Star}
          index={2}
        />
        <StatCard
          title="Avg Response Rate"
          value={`${avgResponseRate}%`}
          icon={BarChart3}
          index={3}
        />
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No review campaigns yet"
          description="Send your first graduation review to collect feedback from students and parents."
          action={
            <Button
              className="gap-2"
              onClick={openNewCampaign}
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between rounded-xl bg-card p-5 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                  <ClipboardCheck className="size-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-secondary-foreground">
                    {campaign.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(campaign.createdAt)} &middot;{" "}
                    {campaign.recipientCount} recipients
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700"
                    >
                      {campaign.responseCount} / {campaign.recipientCount}{" "}
                      responses
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {campaign.responseRate}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      router.push(`/admin/reviews/${campaign.id}`)
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:text-rose-600"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Campaign Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-secondary-foreground">
              Send Graduation Reviews
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Campaign Name
              </label>
              <Input
                placeholder="e.g., Class of 2026 Exit Survey"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Custom Message (optional)
              </label>
              <Textarea
                placeholder="Congratulations on graduating! We'd love to hear about your experience..."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground">
                This replaces the default email message. Leave blank for the
                default.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Select Recipients ({selectedIds.length} selected)
                </label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={selectAllGraduated}
                  className="text-xs text-[#2563EB]"
                >
                  Select All Graduated
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8"
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-gray-100">
                {loadingStudents ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    Loading students...
                  </p>
                ) : filteredStudents.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    No students found
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.email}
                        </p>
                      </div>
                      {student.status === "GRADUATED" && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 text-[10px]"
                        >
                          Graduated
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                Linked parents will automatically receive a review email too.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={handleSend}
              disabled={sending}
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : `Send to ${selectedIds.length} Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
