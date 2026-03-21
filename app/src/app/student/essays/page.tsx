"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PenTool,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Loader2,
  Sparkles,
  Brain,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  X,
  ThumbsUp,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"
import { LearnMoreBanner } from "@/components/ui/learn-more-banner"

interface EssayVersion {
  id: string
  content: string
  version: number
}

interface EssayReview {
  id: string
  feedback: string | null
  createdAt: string
}

interface EssayPrompt {
  id: string
  text: string
  wordLimit: number | null
}

interface EssayApplication {
  id: string
  scholarship: {
    name: string
  }
}

interface Essay {
  id: string
  title: string
  content: string
  status: "DRAFT" | "UNDER_REVIEW" | "REVISION_NEEDED" | "APPROVED"
  updatedAt: string
  versions: EssayVersion[]
  reviews: EssayReview[]
  prompt: EssayPrompt | null
  application: EssayApplication | null
}

interface AIReviewResult {
  overallScore: number
  summary: string
  strengths: string[]
  improvements: string[]
  categories: {
    content: { score: number; feedback: string }
    structure: { score: number; feedback: string }
    voice: { score: number; feedback: string }
    grammar: { score: number; feedback: string }
    impact: { score: number; feedback: string }
  }
  suggestions: string[]
}

interface WritingTipsResult {
  angles: { title: string; description: string; profileConnection: string }[]
  structure: { recommended: string; tips: string[] }
  dos: string[]
  donts: string[]
  openingStrategies: string[]
  keyThemes: string[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Edit3 }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Edit3 },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  REVISION_NEEDED: { label: "Revision Needed", color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"
  const bgColor = score >= 75 ? "bg-emerald-50 border-emerald-200" : score >= 50 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"
  const ringColor = score >= 75 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500"
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 ${bgColor}`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200" />
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className={ringColor} />
      </svg>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
    </div>
  )
}

function CategoryBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#1E3A5F]">{label}</span>
        <span className="text-xs text-muted-foreground">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{feedback}</p>
    </div>
  )
}

export default function EssaysPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)

  // AI Review state
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  // Writing Tips state
  const [tipsOpen, setTipsOpen] = useState(false)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [tipsResult, setTipsResult] = useState<WritingTipsResult | null>(null)
  const [tipsPrompt, setTipsPrompt] = useState("")
  const [tipsScholarship, setTipsScholarship] = useState("")
  const [tipsEssayType, setTipsEssayType] = useState("")

  const handleNewEssay = async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      })
      if (res.ok) {
        const essay = await res.json()
        setEssays((prev) => [...prev, essay])
        setSelectedId(essay.id)
        toast.success("Essay created!")
        setNewOpen(false)
        setNewTitle("")
        setNewContent("")
      } else { toast.error("Failed to create essay") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const handleEditEssay = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/essays/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        setEssays((prev) => prev.map((e) => e.id === selectedId ? { ...e, content: editContent, updatedAt: new Date().toISOString() } : e))
        toast.success("Essay updated!")
        setEditOpen(false)
      } else { toast.error("Failed to update essay") }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const handleAIReview = async (essayId: string) => {
    setReviewLoading(essayId)
    try {
      const res = await fetch(`/api/essays/${essayId}/review`, {
        method: "POST",
      })
      if (res.ok) {
        const data: AIReviewResult = await res.json()
        setReviewResult(data)
        setReviewOpen(true)
      } else {
        toast.error("Failed to get AI review")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setReviewLoading(null)
    }
  }

  const handleGetTips = async () => {
    if (!tipsPrompt.trim()) { toast.error("Please enter an essay prompt"); return }
    setTipsLoading(true)
    try {
      const res = await fetch("/api/essays/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: tipsPrompt,
          scholarshipName: tipsScholarship || undefined,
          essayType: tipsEssayType || undefined,
        }),
      })
      if (res.ok) {
        const data: WritingTipsResult = await res.json()
        setTipsResult(data)
      } else {
        toast.error("Failed to generate writing tips")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setTipsLoading(false)
    }
  }

  useEffect(() => {
    fetch("/api/essays")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setEssays(list)
        if (list.length > 0) setSelectedId(list[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmitForReview = async (essay: Essay) => {
    const res = await fetch(`/api/essays/${essay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "UNDER_REVIEW" }),
    })
    if (res.ok) {
      setEssays((prev) =>
        prev.map((e) => e.id === essay.id ? { ...e, status: "UNDER_REVIEW" } : e)
      )
      toast.success("Essay submitted for review")
    } else {
      toast.error("Failed to submit essay")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading essays...</p>
      </div>
    )
  }

  const selected = essays.find((e) => e.id === selectedId) ?? essays[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Essays</h1>
          <p className="mt-1 text-muted-foreground">Write, review, and manage your scholarship essays.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { setTipsResult(null); setTipsPrompt(""); setTipsScholarship(""); setTipsEssayType(""); setTipsOpen(true) }}
          >
            <Lightbulb className="h-4 w-4" />
            Get Writing Tips
          </Button>
          <Button className="gap-2" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            New Essay
          </Button>
        </div>

        {/* New Essay Dialog */}
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Essay</DialogTitle>
              <DialogDescription>Start a new scholarship essay.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Personal Statement" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-none" rows={6} placeholder="Start writing your essay..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button onClick={handleNewEssay} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Essay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Essay Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Essay</DialogTitle>
              <DialogDescription>Edit your essay content below.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <textarea className="w-full rounded-md border px-3 py-2 text-sm resize-none" rows={12} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditEssay} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Review Results Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto sm:max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1E3A5F]">
                <Sparkles className="h-5 w-5 text-[#2563EB]" />
                AI Essay Review
              </DialogTitle>
              <DialogDescription>AI-powered analysis of your essay.</DialogDescription>
            </DialogHeader>
            {reviewResult && (
              <div className="space-y-6 py-2">
                {/* Overall Score + Summary */}
                <div className="flex items-start gap-5">
                  <ScoreCircle score={reviewResult.overallScore} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-[#1E3A5F]">Overall Score</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{reviewResult.summary}</p>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Category Scores</h3>
                  <div className="space-y-4">
                    <CategoryBar label="Content" score={reviewResult.categories.content.score} feedback={reviewResult.categories.content.feedback} />
                    <CategoryBar label="Structure" score={reviewResult.categories.structure.score} feedback={reviewResult.categories.structure.feedback} />
                    <CategoryBar label="Voice" score={reviewResult.categories.voice.score} feedback={reviewResult.categories.voice.feedback} />
                    <CategoryBar label="Grammar" score={reviewResult.categories.grammar.score} feedback={reviewResult.categories.grammar.feedback} />
                    <CategoryBar label="Impact" score={reviewResult.categories.impact.score} feedback={reviewResult.categories.impact.feedback} />
                  </div>
                </div>

                {/* Strengths */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Strengths</h3>
                  <div className="space-y-1.5">
                    {reviewResult.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Areas for Improvement</h3>
                  <div className="space-y-1.5">
                    {reviewResult.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                        <span className="text-sm">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Suggestions */}
                {reviewResult.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Suggestions</h3>
                    <div className="space-y-1.5">
                      {reviewResult.suggestions.map((sug, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Target className="h-4 w-4 mt-0.5 shrink-0 text-[#2563EB]" />
                          <span className="text-sm">{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Writing Tips Dialog */}
        <Dialog open={tipsOpen} onOpenChange={setTipsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto sm:max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#1E3A5F]">
                <Lightbulb className="h-5 w-5 text-[#2563EB]" />
                Writing Tips
              </DialogTitle>
              <DialogDescription>Get AI-powered writing guidance for your essay.</DialogDescription>
            </DialogHeader>

            {!tipsResult ? (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Essay Prompt *</label>
                  <Textarea
                    placeholder="Paste or describe the essay prompt..."
                    rows={3}
                    value={tipsPrompt}
                    onChange={(e) => setTipsPrompt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Scholarship Name (optional)</label>
                  <Input
                    placeholder="e.g., Gates Millennium Scholarship"
                    value={tipsScholarship}
                    onChange={(e) => setTipsScholarship(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Essay Type</label>
                  <Select value={tipsEssayType} onValueChange={(v) => v && setTipsEssayType(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select essay type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal Statement">Personal Statement</SelectItem>
                      <SelectItem value="Why This School">Why This School</SelectItem>
                      <SelectItem value="Financial Need">Financial Need</SelectItem>
                      <SelectItem value="Community Service">Community Service</SelectItem>
                      <SelectItem value="Leadership">Leadership</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTipsOpen(false)}>Cancel</Button>
                  <Button className="gap-2" onClick={handleGetTips} disabled={tipsLoading}>
                    {tipsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    Generate Tips
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                {/* Brainstorming Angles */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Brainstorming Angles</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {tipsResult.angles.map((angle, i) => (
                      <Card key={i} variant="bento">
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-sm font-medium text-[#1E3A5F]">{angle.title}</p>
                          <p className="text-xs text-muted-foreground">{angle.description}</p>
                          <div className="flex items-start gap-1.5 mt-1">
                            <ThumbsUp className="h-3 w-3 mt-0.5 shrink-0 text-[#2563EB]" />
                            <span className="text-xs text-[#2563EB]">{angle.profileConnection}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Structural Tips */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Structure</h3>
                  <p className="text-sm text-muted-foreground">{tipsResult.structure.recommended}</p>
                  <ul className="space-y-1">
                    {tipsResult.structure.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Do's and Don'ts */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Do</h3>
                    <div className="space-y-1.5">
                      {tipsResult.dos.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                          <span className="text-sm">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-rose-700 uppercase tracking-wide">Don&apos;t</h3>
                    <div className="space-y-1.5">
                      {tipsResult.donts.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
                          <span className="text-sm">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Opening Strategies */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Opening Strategies</h3>
                  <div className="space-y-1.5">
                    {tipsResult.openingStrategies.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                        <span className="text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Themes */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">Key Themes from Your Profile</h3>
                  <div className="flex flex-wrap gap-2">
                    {tipsResult.keyThemes.map((theme, i) => (
                      <span key={i} className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setTipsResult(null)}>Back</Button>
                  <Button variant="outline" onClick={() => setTipsOpen(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Learn more banner */}
      <LearnMoreBanner
        title="Learn: Essay Writing"
        description="Tips for brainstorming, financial need essays, common prompts, and avoiding cliches."
        href="/student/learning/scholarships"
      />

      {essays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No essays yet. Start writing your first essay.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Left panel - Essay list */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {essays.map((essay) => {
              const config = statusConfig[essay.status] ?? statusConfig.DRAFT
              const Icon = config.icon
              const wordCount = countWords(essay.content)
              const targetWords = essay.prompt?.wordLimit ?? 650
              return (
                <button
                  key={essay.id}
                  onClick={() => setSelectedId(essay.id)}
                  className={`w-full rounded-lg border p-3 sm:p-3 text-left transition-colors min-h-[44px] ${
                    selectedId === essay.id
                      ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{essay.title}</p>
                    <Icon className={`h-4 w-4 shrink-0 ${
                      essay.status === "APPROVED" ? "text-emerald-600" :
                      essay.status === "UNDER_REVIEW" ? "text-amber-600" :
                      essay.status === "REVISION_NEEDED" ? "text-rose-600" : "text-gray-400"
                    }`} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{wordCount}/{targetWords} words</span>
                    <span>Edited {formatDate(essay.updatedAt)}</span>
                  </div>
                  <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </motion.div>

          {/* Right panel - Essay preview */}
          {selected && (() => {
            const config = statusConfig[selected.status] ?? statusConfig.DRAFT
            const StatusIcon = config.icon
            const wordCount = countWords(selected.content)
            const targetWords = selected.prompt?.wordLimit ?? 650
            return (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
              <Card variant="bento">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{selected.title}</CardTitle>
                      {selected.prompt && (
                        <p className="text-sm text-muted-foreground">{selected.prompt.text}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {wordCount} / {targetWords} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last edited {formatDate(selected.updatedAt)}
                    </span>
                  </div>

                  {/* Word count progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        wordCount >= targetWords ? "bg-emerald-500" : "bg-[#2563EB]"
                      }`}
                      style={{ width: `${Math.min((wordCount / targetWords) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Linked scholarship */}
                  {selected.application && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Scholarship</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                          {selected.application.scholarship.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Essay content */}
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="prose prose-sm max-w-none">
                      {selected.content ? (
                        selected.content.split("\n\n").map((paragraph, i) => (
                          <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No content yet. Click Edit to start writing.</p>
                      )}
                    </div>
                  </div>

                  {/* Latest review feedback */}
                  {selected.reviews.length > 0 && selected.reviews[0].feedback && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Counselor Feedback</p>
                      <p className="text-sm text-muted-foreground">{selected.reviews[0].feedback}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button className="gap-2" onClick={() => { setEditContent(selected.content); setEditOpen(true) }}>
                      <PenTool className="h-4 w-4" />
                      Edit Essay
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleAIReview(selected.id)}
                      disabled={reviewLoading === selected.id || !selected.content}
                    >
                      {reviewLoading === selected.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          AI Review
                        </>
                      )}
                    </Button>
                    {selected.status === "DRAFT" || selected.status === "REVISION_NEEDED" ? (
                      <Button variant="outline" onClick={() => handleSubmitForReview(selected)}>
                        Submit for Review
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
