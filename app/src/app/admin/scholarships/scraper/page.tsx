"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import LoaderOne from "@/components/ui/loader-one"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe, Loader2, CheckCircle2, XCircle, Clock, Plus,
  RefreshCw, ExternalLink, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react"

type Tab = "extract" | "refresh"
type ExtractStatus = "pending" | "extracting" | "done" | "error"

interface ExtractResult {
  url: string
  status: ExtractStatus
  error?: string
  data?: Record<string, unknown> & {
    name?: string; provider?: string; amount?: number; deadline?: string
  }
  added?: boolean
  duplicate?: boolean
}

interface ScrapedScholarship {
  id: string; name: string; sourceUrl?: string | null; lastScrapedAt?: string | null
  applicationYear?: string | null; scrapeStatus?: string | null
}

interface RefreshDiff { field: string; oldValue: string; newValue: string }

export default function ScraperPage() {
  const [tab, setTab] = React.useState<Tab>("extract")
  const [urls, setUrls] = React.useState("")
  const [results, setResults] = React.useState<ExtractResult[]>([])
  const [processing, setProcessing] = React.useState(false)
  const [processedCount, setProcessedCount] = React.useState(0)

  const [scholarships, setScholarships] = React.useState<ScrapedScholarship[]>([])
  const [refreshLoading, setRefreshLoading] = React.useState(false)
  const [refreshingIds, setRefreshingIds] = React.useState<Set<string>>(new Set())
  const [diffs, setDiffs] = React.useState<Record<string, RefreshDiff[]>>({})
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  const urlCount = urls.trim() ? urls.trim().split("\n").filter(Boolean).length : 0

  // --- Extract Tab ---
  const handleExtract = async () => {
    const parsed = urls.trim().split("\n").map(u => u.trim()).filter(Boolean)
    if (!parsed.length) return toast.error("Paste at least one URL")
    setProcessing(true)
    setProcessedCount(0)
    setResults(parsed.map(url => ({ url, status: "pending" })))

    try {
      const res = await fetch("/api/scholarships/extract-batch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: parsed }),
      })
      if (!res.ok) throw new Error("Extraction failed")
      const json = await res.json()
      const items: ExtractResult[] = (json.results ?? []).map((r: Record<string, unknown>) => ({
        url: r.url as string,
        status: r.error ? "error" : "done",
        error: r.error as string | undefined,
        data: r.data as ExtractResult["data"],
      }))
      setResults(items)
      setProcessedCount(parsed.length)
      toast.success(`Extracted ${items.filter(i => i.status === "done").length}/${parsed.length} scholarships`)
    } catch {
      toast.error("Batch extraction failed")
      setResults(prev => prev.map(r => r.status === "pending" ? { ...r, status: "error", error: "Request failed" } : r))
    } finally { setProcessing(false) }
  }

  const handleAddOne = async (idx: number) => {
    const r = results[idx]
    if (!r.data?.name) return
    // duplicate check
    const check = await fetch(`/api/scholarships?search=${encodeURIComponent(r.data.name)}`)
    const existing = await check.json()
    if (Array.isArray(existing) && existing.some((s: Record<string, string>) => s.name === r.data!.name)) {
      setResults(prev => prev.map((item, i) => i === idx ? { ...item, duplicate: true } : item))
      return toast.warning("Duplicate scholarship found")
    }
    const res = await fetch("/api/scholarships", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...r.data, sourceUrl: r.url, lastScrapedAt: new Date().toISOString(),
        applicationYear: "2025-2026", scrapeStatus: "CURRENT",
      }),
    })
    if (res.ok) {
      setResults(prev => prev.map((item, i) => i === idx ? { ...item, added: true } : item))
      toast.success(`Added "${r.data.name}"`)
    } else toast.error("Failed to add scholarship")
  }

  const handleAddAll = async () => {
    const ready = results.filter(r => r.status === "done" && !r.added && !r.duplicate)
    for (let i = 0; i < results.length; i++) {
      if (ready.includes(results[i])) await handleAddOne(i)
    }
  }

  // --- Refresh Tab ---
  const loadTracked = React.useCallback(async () => {
    setRefreshLoading(true)
    try {
      const res = await fetch("/api/scholarships")
      const all: ScrapedScholarship[] = await res.json()
      setScholarships(all.filter(s => s.sourceUrl))
    } catch { toast.error("Failed to load scholarships") }
    finally { setRefreshLoading(false) }
  }, [])

  React.useEffect(() => { if (tab === "refresh") loadTracked() }, [tab, loadTracked])

  const handleRefreshOne = async (id: string) => {
    setRefreshingIds(prev => new Set(prev).add(id))
    try {
      const res = await fetch("/api/scholarships/refresh", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId: id }),
      })
      const json = await res.json()
      if (json.changes?.length) {
        setDiffs(prev => ({ ...prev, [id]: json.changes }))
        setExpandedIds(prev => new Set(prev).add(id))
      } else toast.info("No changes detected")
    } catch { toast.error("Refresh failed") }
    finally { setRefreshingIds(prev => { const n = new Set(prev); n.delete(id); return n }) }
  }

  const handleRefreshAllStale = async () => {
    setRefreshLoading(true)
    try {
      await fetch("/api/scholarships/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      toast.success("Stale scholarships refreshed")
      await loadTracked()
    } catch { toast.error("Refresh failed") }
    finally { setRefreshLoading(false) }
  }

  const handleApplyChanges = async (id: string) => {
    const changes = diffs[id]
    if (!changes) return
    const patch: Record<string, string> = {}
    changes.forEach(c => { patch[c.field] = c.newValue })
    const res = await fetch(`/api/scholarships/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    })
    if (res.ok) {
      toast.success("Changes applied")
      setDiffs(prev => { const n = { ...prev }; delete n[id]; return n })
      setExpandedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      await loadTracked()
    } else toast.error("Failed to apply changes")
  }

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const relativeDate = (d?: string | null) => {
    if (!d) return "Never"
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const statusColor = (s?: string | null) => {
    if (!s) return "bg-gray-100 text-gray-600"
    const map: Record<string, string> = {
      CURRENT: "bg-emerald-100 text-emerald-700", NEEDS_REVIEW: "bg-amber-100 text-amber-700",
      EXPIRED: "bg-rose-100 text-rose-700", ERROR: "bg-red-100 text-red-700",
    }
    return map[s] ?? "bg-gray-100 text-gray-600"
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "extract", label: "Extract" }, { key: "refresh", label: "Refresh" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Scholarship Scraper" description="Extract scholarship data from URLs and keep your database current." />

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[#1E3A5F] text-white" : "bg-white text-muted-foreground ring-1 ring-gray-200 hover:bg-gray-50"
            }`}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "extract" ? (
          <motion.div key="extract" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* URL Input */}
            <Card variant="bento">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" />Paste Scholarship URLs</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea rows={8} placeholder="https://example.com/scholarship-1&#10;https://example.com/scholarship-2&#10;..." value={urls} onChange={e => setUrls(e.target.value)} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{urlCount} URL{urlCount !== 1 ? "s" : ""} entered</span>
                  <Button className="gap-2" onClick={handleExtract} disabled={processing || !urlCount}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Extract All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing status */}
            {processing && (
              <Card variant="bento" className="border-blue-200 bg-blue-50/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing {processedCount}/{urlCount} URLs...
                  </div>
                  <div className="mt-3 space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {r.status === "pending" && <Clock className="h-3 w-3 text-gray-400" />}
                        {r.status === "extracting" && <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />}
                        {r.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {r.status === "error" && <XCircle className="h-3 w-3 text-rose-500" />}
                        <span className="truncate max-w-md">{r.url}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {!processing && results.length > 0 && (
              <Card variant="bento">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">Extraction Results</CardTitle>
                  <Button size="sm" className="gap-1" onClick={handleAddAll}>
                    <Plus className="h-3.5 w-3.5" /> Add All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Provider</th>
                        <th className="pb-2 pr-3">Amount</th><th className="pb-2 pr-3">Deadline</th>
                        <th className="pb-2 pr-3">Source</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
                      </tr></thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">{r.data?.name ?? "—"}</td>
                            <td className="py-2 pr-3">{r.data?.provider ?? "—"}</td>
                            <td className="py-2 pr-3">{r.data?.amount ? `$${Number(r.data.amount).toLocaleString()}` : "—"}</td>
                            <td className="py-2 pr-3">{r.data?.deadline ?? "—"}</td>
                            <td className="py-2 pr-3">
                              <a href={r.url} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline inline-flex items-center gap-1 max-w-[160px] truncate">
                                {r.url.replace(/^https?:\/\//, "").slice(0, 30)}<ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </td>
                            <td className="py-2 pr-3">
                              {r.status === "done" && !r.added && !r.duplicate && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">Ready</span>}
                              {r.status === "error" && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-rose-100 text-rose-700" title={r.error}>Error</span>}
                              {r.added && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">Added</span>}
                              {r.duplicate && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700">Duplicate</span>}
                            </td>
                            <td className="py-2">
                              {r.status === "done" && !r.added && !r.duplicate && (
                                <Button size="sm" variant="outline" onClick={() => handleAddOne(i)} className="gap-1 text-xs">
                                  <Plus className="h-3 w-3" /> Add
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div key="refresh" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card variant="bento">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Tracked Scholarships</CardTitle>
                <Button size="sm" className="gap-1" onClick={handleRefreshAllStale} disabled={refreshLoading}>
                  {refreshLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Refresh All Stale
                </Button>
              </CardHeader>
              <CardContent>
                {refreshLoading && !scholarships.length ? (
                  <div className="py-8 flex justify-center"><LoaderOne /></div>
                ) : !scholarships.length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No scholarships with source URLs found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Source URL</th>
                        <th className="pb-2 pr-3">Last Scraped</th><th className="pb-2 pr-3">Year</th>
                        <th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
                      </tr></thead>
                      <tbody>
                        {scholarships.map(s => (
                          <React.Fragment key={s.id}>
                            <tr className="border-b last:border-0">
                              <td className="py-2 pr-3 font-medium">{s.name}</td>
                              <td className="py-2 pr-3">
                                <a href={s.sourceUrl!} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline inline-flex items-center gap-1 max-w-[160px] truncate">
                                  {s.sourceUrl!.replace(/^https?:\/\//, "").slice(0, 30)}<ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground">{relativeDate(s.lastScrapedAt)}</td>
                              <td className="py-2 pr-3">{s.applicationYear ?? "—"}</td>
                              <td className="py-2 pr-3">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${statusColor(s.scrapeStatus)}`}>
                                  {s.scrapeStatus ?? "Not Tracked"}
                                </span>
                              </td>
                              <td className="py-2 flex items-center gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleRefreshOne(s.id)} disabled={refreshingIds.has(s.id)} className="gap-1 text-xs">
                                  {refreshingIds.has(s.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  Refresh
                                </Button>
                                {diffs[s.id] && (
                                  <Button size="sm" variant="ghost" onClick={() => toggleExpand(s.id)}>
                                    {expandedIds.has(s.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  </Button>
                                )}
                              </td>
                            </tr>
                            {expandedIds.has(s.id) && diffs[s.id] && (
                              <tr><td colSpan={6} className="bg-gray-50 px-4 py-3">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Changes Detected</p>
                                  {diffs[s.id].map((d, j) => (
                                    <div key={j} className="flex items-center gap-2 text-xs">
                                      <span className="font-medium w-24">{d.field}:</span>
                                      <span className="text-rose-600 line-through">{d.oldValue}</span>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-emerald-600">{d.newValue}</span>
                                    </div>
                                  ))}
                                  <Button size="sm" className="gap-1 mt-2" onClick={() => handleApplyChanges(s.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Apply Changes
                                  </Button>
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
