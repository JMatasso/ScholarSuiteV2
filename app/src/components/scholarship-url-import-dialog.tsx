"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Globe, Loader2, Sparkles, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ExtractedData {
  name?: string
  provider?: string
  amount?: number | null
  amountMax?: number | null
  deadline?: string | null
  description?: string | null
  url?: string
  minGpa?: number | null
  states?: string[]
  citizenships?: string[]
  gradeLevels?: number[]
  fieldsOfStudy?: string[]
  ethnicities?: string[]
  requiresFirstGen?: boolean
  requiresPell?: boolean
  requiresFinancialNeed?: boolean
  minSat?: number | null
  minAct?: number | null
}

export function ScholarshipUrlImportDialog({
  onImported,
}: {
  onImported: () => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<ExtractedData | null>(null)

  const handleExtract = async () => {
    if (!url.trim()) return
    setExtracting(true)
    setError("")
    setData(null)

    try {
      const res = await fetch("/api/scholarships/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || "Extraction failed")
        return
      }

      setData(result.extracted)
      toast.success("Scholarship data extracted — review and save")
    } catch {
      setError("Network error — could not reach the server")
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async () => {
    if (!data?.name) {
      toast.error("Scholarship name is required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          provider: data.provider || null,
          amount: data.amount ?? null,
          amountMax: data.amountMax ?? null,
          deadline: data.deadline || null,
          description: data.description || null,
          url: data.url || url,
          minGpa: data.minGpa ?? null,
          states: data.states || [],
          citizenships: data.citizenships || [],
          gradeLevels: data.gradeLevels || [],
          fieldsOfStudy: data.fieldsOfStudy || [],
          ethnicities: data.ethnicities || [],
          requiresFirstGen: data.requiresFirstGen || false,
          requiresPell: data.requiresPell || false,
          requiresFinancialNeed: data.requiresFinancialNeed || false,
        }),
      })

      if (res.ok) {
        toast.success(`"${data.name}" imported successfully`)
        setOpen(false)
        setUrl("")
        setData(null)
        onImported()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save scholarship")
      }
    } catch {
      toast.error("Failed to save scholarship")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setData(null); setError(""); setUrl("") } }}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Globe className="h-4 w-4" />
        Import from URL
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#2563EB]" />
            Import Scholarship from URL
          </DialogTitle>
          <DialogDescription>
            Paste a scholarship page URL and AI will extract the details for you to review.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: URL input */}
        {!data && (
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.example.com/scholarship"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                disabled={extracting}
              />
              <Button
                onClick={handleExtract}
                disabled={extracting || !url.trim()}
                className="gap-2 shrink-0"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review extracted data */}
        {data && (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                <Input value={data.name || ""} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Provider</label>
                <Input value={data.provider || ""} onChange={(e) => updateField("provider", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
                <Input value={data.url || ""} onChange={(e) => updateField("url", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount ($)</label>
                <Input type="number" value={data.amount ?? ""} onChange={(e) => updateField("amount", e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Amount ($)</label>
                <Input type="number" value={data.amountMax ?? ""} onChange={(e) => updateField("amountMax", e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Deadline</label>
                <Input type="date" value={data.deadline || ""} onChange={(e) => updateField("deadline", e.target.value || null)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min GPA</label>
                <Input type="number" step="0.1" value={data.minGpa ?? ""} onChange={(e) => updateField("minGpa", e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <Textarea value={data.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={2} />
              </div>
            </div>

            {/* Eligibility fields */}
            <div className="rounded-lg border border-input p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Eligibility Criteria (auto-detected)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">States (comma-separated)</label>
                  <Input
                    value={(data.states || []).join(", ")}
                    onChange={(e) => updateField("states", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="National (leave empty)"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fields of Study</label>
                  <Input
                    value={(data.fieldsOfStudy || []).join(", ")}
                    onChange={(e) => updateField("fieldsOfStudy", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="Open to all (leave empty)"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ethnicities</label>
                  <Input
                    value={(data.ethnicities || []).join(", ")}
                    onChange={(e) => updateField("ethnicities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="Open to all (leave empty)"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Citizenships</label>
                  <Input
                    value={(data.citizenships || []).join(", ")}
                    onChange={(e) => updateField("citizenships", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="e.g. US Citizen, Permanent Resident"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={data.requiresFirstGen || false} onChange={(e) => updateField("requiresFirstGen", e.target.checked)} className="size-4 rounded border-input" />
                  First-gen required
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={data.requiresPell || false} onChange={(e) => updateField("requiresPell", e.target.checked)} className="size-4 rounded border-input" />
                  Pell eligible required
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={data.requiresFinancialNeed || false} onChange={(e) => updateField("requiresFinancialNeed", e.target.checked)} className="size-4 rounded border-input" />
                  Financial need required
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
            Cancel
          </DialogClose>
          {data && (
            <Button
              onClick={handleSave}
              disabled={saving || !data.name}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Scholarship
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
