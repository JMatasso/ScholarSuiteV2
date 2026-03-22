"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import { exportBudgetToExcel } from "@/lib/export-budget"
import { toast } from "sonner"
import {
  DollarSign,
  Receipt,
  Plus,
  Trash2,
  Globe,
  Sun,
  Download,
  ChevronDown,
  ChevronUp,
} from "@/lib/icons"

interface IncomeSource {
  id: string
  name: string
  amount: number
  type: string
  status: string
  isRecurring: boolean
}

interface Semester {
  id: string
  name: string
  type: string
  order: number
  isCustom: boolean
  tuition: number
  housing: number
  food: number
  transportation: number
  books: number
  personal: number
  other: number
  incomeSources: IncomeSource[]
}

interface FinancialPlan {
  id: string
  userId: string
  semesters: Semester[]
}

interface SemesterBudgetProps {
  plan: FinancialPlan
  onPlanUpdate: (plan: FinancialPlan) => void
  totalScholarships?: number
  studentName?: string
}

const SEMESTER_PRESETS = [
  { label: "Freshman Summer", type: "SUMMER" },
  { label: "Sophomore Summer", type: "SUMMER" },
  { label: "Junior Summer", type: "SUMMER" },
  { label: "Senior Summer", type: "SUMMER" },
  { label: "Study Abroad — Fall", type: "STUDY_ABROAD" },
  { label: "Study Abroad — Spring", type: "STUDY_ABROAD" },
  { label: "Study Abroad — Summer", type: "STUDY_ABROAD" },
  { label: "Winter Session", type: "WINTER" },
] as const

const INCOME_TYPES = [
  "Scholarship",
  "Grant",
  "Work-Study",
  "Part-Time Job",
  "Summer Job",
  "Family Contribution",
  "Savings",
  "Loan",
  "Other",
]

function getSemesterTotal(sem: Semester): number {
  return sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

export function SemesterBudget({ plan, onPlanUpdate, totalScholarships = 0, studentName }: SemesterBudgetProps) {
  const [addTermOpen, setAddTermOpen] = useState(false)
  const [addIncomeOpen, setAddIncomeOpen] = useState<string | null>(null) // semId or null
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())
  const [customTermName, setCustomTermName] = useState("")
  const [selectedPreset, setSelectedPreset] = useState("")
  const [saving, setSaving] = useState(false)

  // Income form state
  const [incomeName, setIncomeName] = useState("")
  const [incomeType, setIncomeType] = useState("Other")
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeStatus, setIncomeStatus] = useState("CONFIRMED")
  const [incomeRecurring, setIncomeRecurring] = useState(false)
  const [recurringTargets, setRecurringTargets] = useState<string[]>([])

  const semesters = plan.semesters
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  const maxTotal = semesters.length > 0 ? Math.max(...semesters.map(getSemesterTotal)) : 1

  const toggleExpand = (id: string) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddTerm = async () => {
    const name = selectedPreset || customTermName.trim()
    if (!name) { toast.error("Enter a term name"); return }

    const preset = SEMESTER_PRESETS.find((p) => p.label === selectedPreset)
    const type = preset?.type || "CUSTOM"

    setSaving(true)
    try {
      const res = await fetch(`/api/financial/${plan.id}/semesters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      })
      if (!res.ok) throw new Error()
      const newSem = await res.json()
      onPlanUpdate({ ...plan, semesters: [...semesters, newSem] })
      setAddTermOpen(false)
      setCustomTermName("")
      setSelectedPreset("")
      toast.success(`Added ${name}`)
    } catch {
      toast.error("Failed to add term")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTerm = async (semId: string, semName: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/financial/${plan.id}/semesters/${semId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      onPlanUpdate({ ...plan, semesters: semesters.filter((s) => s.id !== semId) })
      toast.success(`Removed ${semName}`)
    } catch {
      toast.error("Failed to remove term")
    } finally {
      setSaving(false)
    }
  }

  const resetIncomeForm = () => {
    setIncomeName("")
    setIncomeType("Other")
    setIncomeAmount("")
    setIncomeStatus("CONFIRMED")
    setIncomeRecurring(false)
    setRecurringTargets([])
    setAddIncomeOpen(null)
  }

  const handleAddIncome = async () => {
    if (!addIncomeOpen || !incomeName.trim() || !incomeAmount) {
      toast.error("Fill in all fields")
      return
    }
    const amount = parseFloat(incomeAmount)
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: incomeName.trim(),
        type: incomeType,
        amount,
        status: incomeStatus,
        isRecurring: incomeRecurring,
      }
      if (incomeRecurring && recurringTargets.length > 0) {
        body.applyToSemesterIds = recurringTargets
      }

      const res = await fetch(`/api/financial/${plan.id}/semesters/${addIncomeOpen}/income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()

      // Refresh the full plan to get updated income sources
      const planRes = await fetch("/api/financial")
      const updatedPlan = await planRes.json()
      if (updatedPlan?.id) onPlanUpdate(updatedPlan)

      resetIncomeForm()
      toast.success("Income source added")
    } catch {
      toast.error("Failed to add income source")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteIncome = async (semId: string, sourceId: string) => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/financial/${plan.id}/semesters/${semId}/income?sourceId=${sourceId}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error()
      onPlanUpdate({
        ...plan,
        semesters: semesters.map((s) =>
          s.id === semId
            ? { ...s, incomeSources: s.incomeSources.filter((i) => i.id !== sourceId) }
            : s
        ),
      })
      toast.success("Income source removed")
    } catch {
      toast.error("Failed to remove income source")
    } finally {
      setSaving(false)
    }
  }

  const semesterTypeIcon = (type: string) => {
    switch (type) {
      case "SUMMER": return <Sun className="h-3 w-3 text-amber-500" />
      case "STUDY_ABROAD": return <Globe className="h-3 w-3 text-blue-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      {semesters.length > 0 && (
        <Card variant="bento">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-[#2563EB]" />
              Cost vs. Aid by Semester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {semesters.map((sem) => {
                const total = getSemesterTotal(sem)
                const aid = getSemesterAid(sem)
                return (
                  <div key={sem.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium w-36 flex items-center gap-1.5">
                        {semesterTypeIcon(sem.type)}
                        {sem.name}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Cost: {formatCurrency(total)}</span>
                        <span className="text-emerald-600 font-medium">Aid: {formatCurrency(aid)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 h-6">
                      <div
                        className="h-5 rounded bg-accent relative"
                        style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
                      >
                        {aid > 0 && total > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 rounded bg-emerald-500/60"
                            style={{ width: `${Math.min((aid / total) * 100, 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-accent" />
                  <span>Total Cost</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-emerald-500/60" />
                  <span>Aid Covered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester breakdown with expandable income */}
      <Card variant="bento">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Semester Breakdown</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                exportBudgetToExcel({
                  semesters: plan.semesters,
                  totalScholarships,
                  studentName,
                })
                toast.success("Budget exported to Excel")
              }}
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setAddTermOpen(true)}>
              <Plus className="h-3 w-3" />
              Add Term
            </Button>
            <Dialog open={addTermOpen} onOpenChange={setAddTermOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Term</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Preset</label>
                  <Select value={selectedPreset} onValueChange={(v) => { setSelectedPreset(v ?? ""); setCustomTermName("") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a preset term..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_PRESETS.map((p) => (
                        <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-center text-xs text-muted-foreground">or</div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Custom Name</label>
                  <Input
                    placeholder="e.g., Gap Year, 5th Year Fall..."
                    value={customTermName}
                    onChange={(e) => { setCustomTermName(e.target.value); setSelectedPreset("") }}
                  />
                </div>
                <Button
                  className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90"
                  onClick={handleAddTerm}
                  disabled={saving || (!selectedPreset && !customTermName.trim())}
                >
                  {saving ? "Adding..." : "Add Term"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Semester</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Tuition</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Housing</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Food</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Books</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Other</th>
                  <th className="pb-2 pr-4 font-medium text-secondary-foreground text-right">Total</th>
                  <th className="pb-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {semesters.map((sem) => {
                  const total = getSemesterTotal(sem)
                  const isExpanded = expandedSemesters.has(sem.id)
                  const aid = getSemesterAid(sem)
                  return (
                    <SemesterRow
                      key={sem.id}
                      sem={sem}
                      total={total}
                      aid={aid}
                      isExpanded={isExpanded}
                      saving={saving}
                      planSemesters={semesters}
                      onToggleExpand={() => toggleExpand(sem.id)}
                      onDelete={() => handleDeleteTerm(sem.id, sem.name)}
                      onAddIncome={() => setAddIncomeOpen(sem.id)}
                      onDeleteIncome={(sourceId) => handleDeleteIncome(sem.id, sourceId)}
                      semesterTypeIcon={semesterTypeIcon(sem.type)}
                    />
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.tuition, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.housing, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.food, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.books, 0))}</td>
                  <td className="pt-3 text-right">{formatCurrency(semesters.reduce((a, s) => a + s.other + s.transportation + s.personal, 0))}</td>
                  <td className="pt-3 text-right text-secondary-foreground">{formatCurrency(totalCost)}</td>
                  <td></td>
                </tr>
                <tr className="text-emerald-600">
                  <td className="pt-1">Total Aid</td>
                  <td colSpan={5}></td>
                  <td className="pt-1 text-right font-semibold">-{formatCurrency(totalAid)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Income Dialog */}
      <Dialog open={addIncomeOpen !== null} onOpenChange={(open) => { if (!open) resetIncomeForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                placeholder="e.g., Part-time tutoring, Parent contribution..."
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <Select value={incomeType} onValueChange={(v) => setIncomeType(v ?? "Other")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount</label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="$0"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={incomeStatus} onValueChange={(v) => setIncomeStatus(v ?? "CONFIRMED")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="EXPECTED">Expected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={incomeRecurring}
                    onChange={(e) => setIncomeRecurring(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Recurring (apply to multiple terms)
                </label>
              </div>
            </div>
            {incomeRecurring && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Apply to semesters</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {semesters.map((sem) => (
                    <label key={sem.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={recurringTargets.includes(sem.id)}
                        onChange={(e) => {
                          setRecurringTargets((prev) =>
                            e.target.checked
                              ? [...prev, sem.id]
                              : prev.filter((id) => id !== sem.id)
                          )
                        }}
                        className="rounded border-gray-300"
                      />
                      {sem.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button
              className="w-full bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={handleAddIncome}
              disabled={saving || !incomeName.trim() || !incomeAmount}
            >
              {saving ? "Adding..." : "Add Income Source"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SemesterRow({
  sem,
  total,
  aid,
  isExpanded,
  saving,
  onToggleExpand,
  onDelete,
  onAddIncome,
  onDeleteIncome,
  semesterTypeIcon,
}: {
  sem: Semester
  total: number
  aid: number
  isExpanded: boolean
  saving: boolean
  planSemesters: Semester[]
  onToggleExpand: () => void
  onDelete: () => void
  onAddIncome: () => void
  onDeleteIncome: (sourceId: string) => void
  semesterTypeIcon: React.ReactNode
}) {
  return (
    <>
      <tr className="group">
        <td className="py-2.5 pr-4 font-medium">
          <div className="flex items-center gap-1.5">
            {semesterTypeIcon}
            <span>{sem.name}</span>
            {sem.isCustom && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">custom</span>
            )}
          </div>
        </td>
        <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.tuition)}</td>
        <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.housing)}</td>
        <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.food)}</td>
        <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.books)}</td>
        <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(sem.other + sem.transportation + sem.personal)}</td>
        <td className="py-2.5 pr-4 text-right font-semibold text-secondary-foreground">{formatCurrency(total)}</td>
        <td className="py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-[#2563EB]"
              onClick={onToggleExpand}
              title={isExpanded ? "Hide income" : "Show income & add"}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            {sem.isCustom && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
                disabled={saving}
                title="Remove term"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="pb-3 pt-0">
            <div className="ml-4 pl-4 border-l-2 border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-700">
                  Income & Aid — {formatCurrency(aid)} total
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-[#2563EB]"
                  onClick={onAddIncome}
                >
                  <Plus className="h-3 w-3" /> Add Income
                </Button>
              </div>
              {sem.incomeSources.length === 0 && (
                <p className="text-xs text-muted-foreground">No income sources for this term.</p>
              )}
              {sem.incomeSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between text-xs group/income">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-emerald-500" />
                    <span className="font-medium">{source.name}</span>
                    <span className="text-muted-foreground">{source.type}</span>
                    {source.status === "EXPECTED" && (
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">expected</span>
                    )}
                    {source.isRecurring && (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">recurring</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-emerald-600">{formatCurrency(source.amount)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-rose-600 opacity-0 group-hover/income:opacity-100 transition-opacity"
                      onClick={() => onDeleteIncome(source.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
