"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Calendar, FileText, Users, DollarSign, Flag, StickyNote,
  ChevronDown, ChevronRight, Trash2, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/format"
import {
  type CollegeApp, type AppStatus, type AppClassification, type AppPlatform, type AppType,
  type SupplementalEssay, type Recommender, type AidPackage,
  APP_TYPE_LABELS, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS, PLATFORM_LABELS,
  COLUMNS, daysUntil,
} from "@/components/college-kanban"

interface Props {
  app: CollegeApp
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: Partial<CollegeApp>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
}

export function CollegeAppDetail({ app, open, onOpenChange, onUpdate, onDelete, onRefresh }: Props) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [essaysExpanded, setEssaysExpanded] = useState(false)
  const [recsExpanded, setRecsExpanded] = useState(false)
  const [aidExpanded, setAidExpanded] = useState(false)
  const [notesValue, setNotesValue] = useState(app.notes ?? "")
  const [notesDirty, setNotesDirty] = useState(false)

  const patch = useCallback(async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      await onUpdate(app.id, data as Partial<CollegeApp>)
    } finally {
      setSaving(false)
    }
  }, [app.id, onUpdate])

  const handleToggle = (field: string, value: boolean) => {
    patch({ [field]: value })
  }

  const handleSaveNotes = () => {
    patch({ notes: notesValue.trim() || null })
    setNotesDirty(false)
  }

  const handleCommit = async () => {
    await patch({ committed: true })
    toast.success(`Committed to ${app.universityName}!`)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(app.id)
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  const days = daysUntil(app.deadline)
  const essays: SupplementalEssay[] = Array.isArray(app.supplementalEssays) ? app.supplementalEssays : []
  const recs: Recommender[] = Array.isArray(app.recommenders) ? app.recommenders : []
  const aid: AidPackage = (app.aidPackage && typeof app.aidPackage === "object") ? app.aidPackage as AidPackage : {}
  const netCost = app.netCostEstimate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg text-[#1E3A5F]">{app.universityName}</DialogTitle>
          {app.college && (app.college.city || app.college.state) && (
            <p className="text-sm text-muted-foreground">
              {[app.college.city, app.college.state].filter(Boolean).join(", ")}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Application Info ── */}
          <Section icon={Calendar} title="Application Info">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Status">
                <Select value={app.status} onValueChange={(v) => v && patch({ status: v })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) =>
                      c.key === "WAITLISTED" ? (
                        <span key="wl-group">
                          <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                          <SelectItem value="DEFERRED">Deferred</SelectItem>
                        </span>
                      ) : (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </InfoRow>

              <InfoRow label="Type">
                <Select value={app.applicationType} onValueChange={(v) => v && patch({ applicationType: v })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(APP_TYPE_LABELS) as AppType[]).map((t) => (
                      <SelectItem key={t} value={t}>{APP_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InfoRow>

              <InfoRow label="Classification">
                <Select value={app.classification ?? "NONE"} onValueChange={(v) => patch({ classification: v === "NONE" ? null : v })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(CLASSIFICATION_LABELS) as AppClassification[]).map((c) => (
                      <SelectItem key={c} value={c}>{CLASSIFICATION_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InfoRow>

              <InfoRow label="Platform">
                <Select value={app.platform ?? "NONE"} onValueChange={(v) => patch({ platform: v === "NONE" ? null : v })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not set</SelectItem>
                    {(Object.keys(PLATFORM_LABELS) as AppPlatform[]).map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InfoRow>

              <InfoRow label="Deadline">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    defaultValue={app.deadline ? new Date(app.deadline).toISOString().split("T")[0] : ""}
                    onBlur={(e) => patch({ deadline: e.target.value || null })}
                  />
                  {days !== null && (
                    <span className={`text-xs font-medium whitespace-nowrap ${days <= 7 && days >= 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                      {days < 0 ? "Passed" : days === 0 ? "Today!" : `${days}d`}
                    </span>
                  )}
                </div>
              </InfoRow>

              <InfoRow label="Application Fee">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-8 text-xs w-20"
                    placeholder="0"
                    defaultValue={app.applicationFee ?? ""}
                    onBlur={(e) => patch({ applicationFee: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <Switch
                      size="sm"
                      checked={app.feeWaiverUsed}
                      onCheckedChange={(v) => handleToggle("feeWaiverUsed", !!v)}
                    />
                    Fee waiver
                  </label>
                </div>
              </InfoRow>
            </div>
          </Section>

          {/* ── Checklist ── */}
          <Section icon={FileText} title="Checklist">
            <div className="space-y-2.5">
              <CheckRow
                label="Transcript sent"
                checked={app.transcriptSent}
                onChange={(v) => handleToggle("transcriptSent", v)}
              />
              <CheckRow
                label="Test scores sent"
                checked={app.testScoresSent}
                onChange={(v) => handleToggle("testScoresSent", v)}
              />
              <CheckRow
                label={app.feeWaiverUsed ? "Fee waiver used" : "Fee paid"}
                checked={app.feeWaiverUsed || (app.applicationFee != null && app.applicationFee === 0)}
                onChange={(v) => handleToggle("feeWaiverUsed", v)}
              />

              {/* Supplemental Essays */}
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-xs font-medium text-[#1E3A5F] hover:text-[#2563EB] transition-colors"
                onClick={() => setEssaysExpanded(!essaysExpanded)}
              >
                {essaysExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Supplemental Essays ({essays.length})
              </button>
              {essaysExpanded && (
                <div className="ml-5 space-y-1.5">
                  {essays.length === 0 && (
                    <p className="text-xs text-muted-foreground">No supplemental essays tracked.</p>
                  )}
                  {essays.map((essay, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox
                        checked={essay.completed}
                        onCheckedChange={(v) => {
                          const updated = [...essays]
                          updated[i] = { ...updated[i], completed: !!v }
                          patch({ supplementalEssays: updated })
                        }}
                      />
                      <span className="text-xs">{essay.title}</span>
                      {essay.wordCount != null && (
                        <span className="text-[11px] text-muted-foreground">({essay.wordCount} words)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommenders */}
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-xs font-medium text-[#1E3A5F] hover:text-[#2563EB] transition-colors"
                onClick={() => setRecsExpanded(!recsExpanded)}
              >
                {recsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Recommenders ({recs.length})
              </button>
              {recsExpanded && (
                <div className="ml-5 space-y-1.5">
                  {recs.length === 0 && (
                    <p className="text-xs text-muted-foreground">No recommenders tracked.</p>
                  )}
                  {recs.map((rec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox
                        checked={rec.status === "SUBMITTED"}
                        onCheckedChange={(v) => {
                          const updated = [...recs]
                          updated[i] = { ...updated[i], status: v ? "SUBMITTED" : "REQUESTED" }
                          patch({ recommenders: updated })
                        }}
                      />
                      <span className="text-xs">{rec.name}</span>
                      {rec.role && (
                        <span className="text-[11px] text-muted-foreground">({rec.role})</span>
                      )}
                      <span className={`ml-auto text-[11px] font-medium ${
                        rec.status === "SUBMITTED" ? "text-emerald-600" :
                        rec.status === "REQUESTED" ? "text-amber-600" : "text-gray-400"
                      }`}>
                        {rec.status === "SUBMITTED" ? "Submitted" : rec.status === "REQUESTED" ? "Requested" : "Not Requested"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* ── Financial Aid ── */}
          <Section icon={DollarSign} title="Financial Aid">
            <div className="space-y-2.5">
              <CheckRow
                label="FAFSA sent"
                checked={app.fafsaSent}
                onChange={(v) => handleToggle("fafsaSent", v)}
              />
              <CheckRow
                label="CSS Profile sent"
                checked={app.cssProfileSent}
                onChange={(v) => handleToggle("cssProfileSent", v)}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Financial Aid Deadline">
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    defaultValue={app.financialAidDeadline ? new Date(app.financialAidDeadline).toISOString().split("T")[0] : ""}
                    onBlur={(e) => patch({ financialAidDeadline: e.target.value || null })}
                  />
                </InfoRow>
                <InfoRow label="Net Cost Estimate">
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    placeholder="Annual net cost"
                    defaultValue={netCost ?? ""}
                    onBlur={(e) => patch({ netCostEstimate: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </InfoRow>
              </div>

              {/* Aid package (only relevant for accepted) */}
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-xs font-medium text-[#1E3A5F] hover:text-[#2563EB] transition-colors"
                onClick={() => setAidExpanded(!aidExpanded)}
              >
                {aidExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Aid Package Details
              </button>
              {aidExpanded && (
                <div className="ml-5 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Grants</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="0"
                      defaultValue={aid.grants ?? ""}
                      onBlur={(e) => patch({ aidPackage: { ...aid, grants: e.target.value ? parseFloat(e.target.value) : undefined } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Loans</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="0"
                      defaultValue={aid.loans ?? ""}
                      onBlur={(e) => patch({ aidPackage: { ...aid, loans: e.target.value ? parseFloat(e.target.value) : undefined } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Work-Study</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="0"
                      defaultValue={aid.workStudy ?? ""}
                      onBlur={(e) => patch({ aidPackage: { ...aid, workStudy: e.target.value ? parseFloat(e.target.value) : undefined } })}
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── Decision ── */}
          {app.status === "ACCEPTED" && (
            <Section icon={Flag} title="Decision">
              <div className="space-y-2.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Deposit Deadline">
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      defaultValue={app.depositDeadline ? new Date(app.depositDeadline).toISOString().split("T")[0] : ""}
                      onBlur={(e) => patch({ depositDeadline: e.target.value || null })}
                    />
                  </InfoRow>
                  <div className="flex items-end gap-4 pb-1">
                    <CheckRow
                      label="Deposit paid"
                      checked={app.depositPaid}
                      onChange={(v) => handleToggle("depositPaid", v)}
                    />
                  </div>
                </div>
                {!app.committed && (
                  <Button
                    className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 w-full"
                    onClick={handleCommit}
                    disabled={saving}
                  >
                    <Flag className="h-4 w-4" />
                    Commit to {app.universityName}
                  </Button>
                )}
                {app.committed && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-700 font-medium text-center">
                    You are committed to this school
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Notes ── */}
          <Section icon={StickyNote} title="Notes">
            <Textarea
              placeholder="Any notes about this school..."
              value={notesValue}
              onChange={(e) => { setNotesValue(e.target.value); setNotesDirty(true) }}
              rows={3}
              className="text-sm"
            />
            {notesDirty && (
              <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90 mt-2" onClick={handleSaveNotes} disabled={saving}>
                Save Notes
              </Button>
            )}
          </Section>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="hover:text-rose-600 gap-1.5 text-xs"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Helpers ── */

function Section({ icon: Icon, title, children }: { icon: typeof Calendar; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
        <Icon className="h-4 w-4 text-[#1E3A5F]" />
        <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span className="text-xs">{label}</span>
    </label>
  )
}
