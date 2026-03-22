"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  Download,
} from "@/lib/icons"

interface CustomExpense {
  id: string
  name: string
  amount: number
}

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
  customExpenses: CustomExpense[]
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
  const base = sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
  const custom = (sem.customExpenses ?? []).reduce((a, e) => a + e.amount, 0)
  return base + custom
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

/* ------------------------------------------------------------------ */
/*  Inline editable cell                                               */
/* ------------------------------------------------------------------ */

function CellEditor({
  value,
  onSave,
  className,
}: {
  value: number
  onSave: (value: number) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(value === 0 ? "" : String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    const parsed = parseFloat(draft) || 0
    const rounded = Math.max(0, Math.round(parsed))
    if (rounded !== value) onSave(rounded)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") setEditing(false)
        }}
        className="w-full h-6 rounded border border-[#2563EB]/40 bg-white px-1.5 text-right text-[11px] outline-none focus:ring-1 focus:ring-[#2563EB]/50"
        autoFocus
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      className={cn(
        "cursor-pointer hover:text-[#2563EB] hover:underline underline-offset-2 transition-colors",
        className
      )}
      title="Click to edit"
    >
      {value === 0 ? "-" : formatCurrency(value)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SemesterBudget({ plan, onPlanUpdate, totalScholarships = 0, studentName }: SemesterBudgetProps) {
  const [addTermOpen, setAddTermOpen] = useState(false)
  const [addIncomeOpen, setAddIncomeOpen] = useState<string | null>(null)
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

  // Custom expense form state
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [expenseName, setExpenseName] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseRecurring, setExpenseRecurring] = useState(true)
  const [expenseTargets, setExpenseTargets] = useState<string[]>([])

  const semesters = plan.semesters
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)

  // Build unique income source names across all semesters
  const incomeSourceNames = useMemo(() => {
    const names = new Set<string>()
    semesters.forEach((s) => s.incomeSources.forEach((src) => names.add(src.name)))
    return Array.from(names).sort()
  }, [semesters])

  // Build unique custom expense names across all semesters
  const customExpenseNames = useMemo(() => {
    const names = new Set<string>()
    semesters.forEach((s) => (s.customExpenses ?? []).forEach((e) => names.add(e.name)))
    return Array.from(names).sort()
  }, [semesters])

  // ── Handlers ─────────────────────────────────────────────────────

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

  const handleUpdateCost = useCallback(async (semId: string, field: string, value: number) => {
    onPlanUpdate({
      ...plan,
      semesters: semesters.map((s) =>
        s.id === semId ? { ...s, [field]: value } : s
      ),
    })

    try {
      const res = await fetch(`/api/financial/${plan.id}/semesters/${semId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to save — reverting")
      const planRes = await fetch("/api/financial")
      const refreshed = await planRes.json()
      if (refreshed?.id) onPlanUpdate(refreshed)
    }
  }, [plan, semesters, onPlanUpdate])

  const resetExpenseForm = () => {
    setExpenseName("")
    setExpenseAmount("")
    setExpenseRecurring(true)
    setExpenseTargets([])
    setAddExpenseOpen(false)
  }

  const handleAddExpense = async () => {
    if (!expenseName.trim()) { toast.error("Enter an expense name"); return }
    const amount = parseFloat(expenseAmount) || 0

    setSaving(true)
    try {
      const targetSems = expenseRecurring && expenseTargets.length > 0
        ? expenseTargets
        : [semesters[0]?.id].filter(Boolean)

      if (targetSems.length === 0) { toast.error("No semesters available"); return }

      const primarySemId = targetSems[0]
      const res = await fetch(`/api/financial/${plan.id}/semesters/${primarySemId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: expenseName.trim(),
          amount,
          applyToSemesterIds: expenseRecurring ? targetSems : undefined,
        }),
      })
      if (!res.ok) throw new Error()

      // Refresh plan
      const planRes = await fetch("/api/financial")
      const updatedPlan = await planRes.json()
      if (updatedPlan?.id) onPlanUpdate(updatedPlan)

      resetExpenseForm()
      toast.success("Custom expense added")
    } catch {
      toast.error("Failed to add expense")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateExpense = useCallback(async (semId: string, expenseId: string, amount: number) => {
    // Optimistic update
    onPlanUpdate({
      ...plan,
      semesters: semesters.map((s) =>
        s.id === semId
          ? { ...s, customExpenses: (s.customExpenses ?? []).map((e) => e.id === expenseId ? { ...e, amount } : e) }
          : s
      ),
    })

    try {
      const res = await fetch(`/api/financial/${plan.id}/semesters/${semId}/expenses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, amount }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to save — reverting")
      const planRes = await fetch("/api/financial")
      const refreshed = await planRes.json()
      if (refreshed?.id) onPlanUpdate(refreshed)
    }
  }, [plan, semesters, onPlanUpdate])

  const handleDeleteExpenseRow = async (expenseName: string) => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/financial/${plan.id}/semesters/${semesters[0].id}/expenses?name=${encodeURIComponent(expenseName)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error()

      // Refresh plan
      const planRes = await fetch("/api/financial")
      const updatedPlan = await planRes.json()
      if (updatedPlan?.id) onPlanUpdate(updatedPlan)
      toast.success(`Removed "${expenseName}"`)
    } catch {
      toast.error("Failed to remove expense")
    } finally {
      setSaving(false)
    }
  }

  // Shorten semester name for column headers
  const shortName = (name: string) => {
    return name
      .replace("Freshman", "Fr.")
      .replace("Sophomore", "So.")
      .replace("Junior", "Jr.")
      .replace("Senior", "Sr.")
  }

  // ── Computed values per semester ────────────────────────────────

  const semTotals = semesters.map(getSemesterTotal)
  const semAids = semesters.map(getSemesterAid)
  const semSurplus = semesters.map((_, i) => semAids[i] - semTotals[i])
  const pctFunded = totalCost > 0
    ? Math.round(((totalAid + totalScholarships) / totalCost) * 100)
    : 0

  // Column width
  const colW = "min-w-[100px] w-[100px]"
  const labelW = "min-w-[180px] w-[180px]"

  // Styles
  const sectionHeader = "bg-[#1E3A5F] text-white text-[11px] font-semibold uppercase tracking-wide"
  const dataCell = "text-[11px] text-right px-2 py-1.5 border-r border-gray-200 last:border-r-0"
  const labelCell = "text-[11px] font-medium px-3 py-1.5 border-r border-gray-200 bg-gray-50/80 sticky left-0 z-10"
  const totalRow = "bg-[#1E3A5F]/90 text-white font-semibold"
  const summaryTotalRow = "bg-[#1E3A5F] text-white font-bold"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Click any dollar amount to edit. Semesters scroll horizontally.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => {
              exportBudgetToExcel({ semesters: plan.semesters, totalScholarships, studentName })
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
        </div>
      </div>

      {/* ── Financial Goals KPIs ──────────────────────────────────── */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-0">
          <div className={cn(sectionHeader, "px-3 py-2 flex items-center justify-between")}>
            <span>Financial Goals</span>
            <span className="text-[10px] font-normal opacity-80">
              {pctFunded}% Funded
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-100">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out rounded-r-full",
                pctFunded >= 100 ? "bg-emerald-500" : pctFunded >= 50 ? "bg-[#2563EB]" : "bg-amber-500"
              )}
              style={{ width: `${Math.min(pctFunded, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-gray-200">
            <KpiCell label="Total Cost" value={totalCost} />
            <KpiCell label="Budget Aid" value={totalAid} tone="emerald" />
            <KpiCell label="Scholarships Won" value={totalScholarships} tone="blue" />
            <KpiCell label="Total Funded" value={totalAid + totalScholarships} tone="emerald" />
            <KpiCell
              label="Surplus / Deficit"
              value={totalAid + totalScholarships - totalCost}
              tone={totalAid + totalScholarships - totalCost >= 0 ? "emerald" : "rose"}
              signed
            />
            <KpiCell label="Semesters" value={semesters.length} raw />
          </div>
        </CardContent>
      </Card>

      {/* ── Spreadsheet ──────────────────────────────────────────── */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-max border-collapse" style={{ minWidth: "100%" }}>
              {/* ── Column Headers ── */}
              <thead>
                <tr className={sectionHeader}>
                  <th className={cn(labelW, "px-3 py-2 text-left sticky left-0 z-20 bg-[#1E3A5F]")}>
                    &nbsp;
                  </th>
                  {semesters.map((sem) => (
                    <th key={sem.id} className={cn(colW, "px-2 py-2 text-center group relative")}>
                      <span className="block truncate">{shortName(sem.name)}</span>
                      {sem.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTerm(sem.id, sem.name)}
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                          title={`Remove ${sem.name}`}
                          disabled={saving}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </th>
                  ))}
                  <th className={cn(colW, "px-2 py-2 text-center bg-[#162d4a]")}>Total</th>
                </tr>
              </thead>

              <tbody>
                {/* ═══════════════ SECTION 1: Income Breakdown ═══════════════ */}
                <tr>
                  <td
                    colSpan={semesters.length + 2}
                    className="bg-emerald-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5"
                  >
                    Income & Scholarship Breakdown
                    <button
                      type="button"
                      onClick={() => {
                        if (semesters.length > 0) setAddIncomeOpen(semesters[0].id)
                      }}
                      className="ml-3 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium hover:bg-white/30 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" /> Add Source
                    </button>
                  </td>
                </tr>

                {incomeSourceNames.length === 0 ? (
                  <tr>
                    <td
                      colSpan={semesters.length + 2}
                      className="text-center text-xs text-muted-foreground py-4 bg-emerald-50/30"
                    >
                      No income sources yet. Click &quot;Add Source&quot; to add scholarships, jobs, or other income.
                    </td>
                  </tr>
                ) : (
                  incomeSourceNames.map((sourceName) => (
                    <tr key={sourceName} className="border-b border-gray-100 hover:bg-emerald-50/20 group/row">
                      <td className={cn(labelCell, "text-emerald-800")}>
                        {sourceName}
                      </td>
                      {semesters.map((sem) => {
                        const source = sem.incomeSources.find((s) => s.name === sourceName)
                        return (
                          <td key={sem.id} className={cn(dataCell, "relative group/cell")}>
                            {source ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-emerald-700 font-medium">
                                  {formatCurrency(source.amount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIncome(sem.id, source.id)}
                                  className="h-3.5 w-3.5 rounded flex items-center justify-center text-muted-foreground hover:text-rose-600 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0"
                                  disabled={saving}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className={cn(dataCell, "font-semibold text-emerald-700 bg-emerald-50/50")}>
                        {formatCurrency(
                          semesters.reduce((sum, sem) => {
                            const src = sem.incomeSources.find((s) => s.name === sourceName)
                            return sum + (src?.amount ?? 0)
                          }, 0)
                        )}
                      </td>
                    </tr>
                  ))
                )}

                {/* Total Income row */}
                <tr className={totalRow}>
                  <td className={cn(labelW, "px-3 py-1.5 sticky left-0 z-10 bg-[#1E3A5F]/90")}>
                    Total Income
                  </td>
                  {semesters.map((sem, i) => (
                    <td key={sem.id} className={cn(colW, "px-2 py-1.5 text-right text-[11px]")}>
                      {formatCurrency(semAids[i])}
                    </td>
                  ))}
                  <td className={cn(colW, "px-2 py-1.5 text-right text-[11px] bg-[#162d4a]")}>
                    {formatCurrency(totalAid)}
                  </td>
                </tr>

                {/* ═══════════════ SECTION 2: Expenses ═══════════════ */}
                <tr>
                  <td
                    colSpan={semesters.length + 2}
                    className="bg-rose-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5"
                  >
                    Expenses Per Semester
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseTargets(semesters.map((s) => s.id))
                        setAddExpenseOpen(true)
                      }}
                      className="ml-3 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium hover:bg-white/30 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" /> Add Expense
                    </button>
                  </td>
                </tr>

                {/* Tuition & Fees */}
                <ExpenseRow
                  label="Tuition & Fees"
                  semesters={semesters}
                  field="tuition"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Housing */}
                <ExpenseRow
                  label="Housing"
                  semesters={semesters}
                  field="housing"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Food */}
                <ExpenseRow
                  label="Food"
                  semesters={semesters}
                  field="food"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Books & Supplies */}
                <ExpenseRow
                  label="Books & Supplies"
                  semesters={semesters}
                  field="books"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Transportation */}
                <ExpenseRow
                  label="Transportation"
                  semesters={semesters}
                  field="transportation"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Personal / Misc */}
                <ExpenseRow
                  label="Personal / Misc"
                  semesters={semesters}
                  field="personal"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />
                {/* Other */}
                <ExpenseRow
                  label="Other"
                  semesters={semesters}
                  field="other"
                  onUpdateCost={handleUpdateCost}
                  colW={colW}
                  labelW={labelW}
                  labelCell={labelCell}
                  dataCell={dataCell}
                />

                {/* Custom expense rows */}
                {customExpenseNames.map((eName) => {
                  const total = semesters.reduce((sum, sem) => {
                    const exp = (sem.customExpenses ?? []).find((e) => e.name === eName)
                    return sum + (exp?.amount ?? 0)
                  }, 0)

                  return (
                    <tr key={`custom-${eName}`} className="border-b border-gray-100 hover:bg-rose-50/20 group/row">
                      <td className={cn(labelCell, "flex items-center gap-1")}>
                        <span className="flex-1 truncate">{eName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpenseRow(eName)}
                          className="h-3.5 w-3.5 rounded flex items-center justify-center text-muted-foreground hover:text-rose-600 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                          disabled={saving}
                          title={`Remove "${eName}" from all semesters`}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </td>
                      {semesters.map((sem) => {
                        const exp = (sem.customExpenses ?? []).find((e) => e.name === eName)
                        return (
                          <td key={sem.id} className={cn(dataCell)}>
                            {exp ? (
                              <CellEditor
                                value={exp.amount}
                                onSave={(val) => handleUpdateExpense(sem.id, exp.id, val)}
                              />
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className={cn(dataCell, "font-semibold bg-gray-50/80")}>
                        {total === 0 ? "-" : formatCurrency(total)}
                      </td>
                    </tr>
                  )
                })}

                {/* Total Costs row */}
                <tr className={totalRow}>
                  <td className={cn(labelW, "px-3 py-1.5 sticky left-0 z-10 bg-[#1E3A5F]/90")}>
                    Total Costs
                  </td>
                  {semesters.map((sem, i) => (
                    <td key={sem.id} className={cn(colW, "px-2 py-1.5 text-right text-[11px]")}>
                      ({formatCurrency(semTotals[i])})
                    </td>
                  ))}
                  <td className={cn(colW, "px-2 py-1.5 text-right text-[11px] bg-[#162d4a]")}>
                    ({formatCurrency(totalCost)})
                  </td>
                </tr>

                {/* ═══════════════ SECTION 3: Surplus/Deficit ═══════════════ */}
                <tr>
                  <td
                    colSpan={semesters.length + 2}
                    className="bg-[#1E3A5F] text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5"
                  >
                    Surplus / Deficit Per Semester
                  </td>
                </tr>

                {/* Total Income */}
                <tr className="border-b border-gray-100">
                  <td className={cn(labelCell, "font-semibold")}>Total Income</td>
                  {semesters.map((sem, i) => (
                    <td key={sem.id} className={cn(dataCell, "font-medium text-emerald-700")}>
                      {formatCurrency(semAids[i])}
                    </td>
                  ))}
                  <td className={cn(dataCell, "font-semibold text-emerald-700 bg-gray-50/80")}>
                    {formatCurrency(totalAid)}
                  </td>
                </tr>

                {/* Cost of Attendance */}
                <tr className="border-b border-gray-100">
                  <td className={cn(labelCell, "font-semibold")}>Cost of Attendance</td>
                  {semesters.map((sem, i) => (
                    <td key={sem.id} className={cn(dataCell, "font-medium")}>
                      ({formatCurrency(semTotals[i])})
                    </td>
                  ))}
                  <td className={cn(dataCell, "font-semibold bg-gray-50/80")}>
                    ({formatCurrency(totalCost)})
                  </td>
                </tr>

                {/* Amount Needed / Surplus */}
                <tr className={summaryTotalRow}>
                  <td className={cn(labelW, "px-3 py-2 sticky left-0 z-10 bg-[#1E3A5F] text-[11px]")}>
                    Amount Needed
                  </td>
                  {semesters.map((sem, i) => {
                    const val = semSurplus[i]
                    return (
                      <td
                        key={sem.id}
                        className={cn(
                          colW,
                          "px-2 py-2 text-right text-[11px]",
                          val >= 0 ? "text-emerald-300" : "text-rose-300"
                        )}
                      >
                        {val >= 0 ? formatCurrency(val) : `(${formatCurrency(Math.abs(val))})`}
                      </td>
                    )
                  })}
                  <td
                    className={cn(
                      colW,
                      "px-2 py-2 text-right text-[11px] bg-[#162d4a]",
                      totalAid - totalCost >= 0 ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    {totalAid - totalCost >= 0
                      ? formatCurrency(totalAid - totalCost)
                      : `(${formatCurrency(Math.abs(totalAid - totalCost))})`}
                  </td>
                </tr>

                {/* Per-semester funding bars */}
                <tr className="bg-gray-50">
                  <td className={cn(labelW, "px-3 py-2 sticky left-0 z-10 bg-gray-50 text-[10px] text-muted-foreground font-medium")}>
                    % Funded
                  </td>
                  {semesters.map((sem, i) => {
                    const pct = semTotals[i] > 0 ? Math.round((semAids[i] / semTotals[i]) * 100) : 0
                    return (
                      <td key={sem.id} className={cn(colW, "px-2 py-2 border-r border-gray-200")}>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-[#2563EB]" : "bg-amber-500"
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground w-7 text-right shrink-0">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    )
                  })}
                  <td className={cn(colW, "px-2 py-2 bg-gray-50")}>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pctFunded >= 100 ? "bg-emerald-500" : pctFunded >= 50 ? "bg-[#2563EB]" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(pctFunded, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-7 text-right shrink-0">
                        {pctFunded}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Add Term Dialog ──────────────────────────────────────── */}
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

      {/* ── Add Income Dialog ────────────────────────────────────── */}
      <Dialog open={addIncomeOpen !== null} onOpenChange={(open) => { if (!open) resetIncomeForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Semester selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Add to Semester</label>
              <Select value={addIncomeOpen || ""} onValueChange={(v) => setAddIncomeOpen(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester..." />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>{sem.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

      {/* ── Add Custom Expense Dialog ──────────────────────────────── */}
      <Dialog open={addExpenseOpen} onOpenChange={(open) => { if (!open) resetExpenseForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Expense Name</label>
              <Input
                placeholder="e.g., Lab Fees, Parking, Insurance..."
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount per Semester</label>
              <Input
                type="number"
                min={0}
                step={100}
                placeholder="$0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={expenseRecurring}
                  onChange={(e) => setExpenseRecurring(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Apply to multiple semesters
              </label>
            </div>
            {expenseRecurring && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Select Semesters</label>
                  <button
                    type="button"
                    onClick={() => setExpenseTargets(
                      expenseTargets.length === semesters.length ? [] : semesters.map((s) => s.id)
                    )}
                    className="text-[10px] text-[#2563EB] hover:underline"
                  >
                    {expenseTargets.length === semesters.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {semesters.map((sem) => (
                    <label key={sem.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={expenseTargets.includes(sem.id)}
                        onChange={(e) => {
                          setExpenseTargets((prev) =>
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
              onClick={handleAddExpense}
              disabled={saving || !expenseName.trim()}
            >
              {saving ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  KPI Cell (Financial Goals bar)                                     */
/* ------------------------------------------------------------------ */

function KpiCell({
  label,
  value,
  tone,
  signed,
  raw,
}: {
  label: string
  value: number
  tone?: "emerald" | "blue" | "rose"
  signed?: boolean
  raw?: boolean
}) {
  const toneClass = tone === "emerald"
    ? "text-emerald-700"
    : tone === "blue"
      ? "text-[#2563EB]"
      : tone === "rose"
        ? "text-rose-600"
        : "text-secondary-foreground"

  const display = raw
    ? String(value)
    : signed
      ? value >= 0
        ? formatCurrency(value)
        : `(${formatCurrency(Math.abs(value))})`
      : formatCurrency(value)

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-lg font-bold mt-0.5", toneClass)}>{display}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Expense Row                                                        */
/* ------------------------------------------------------------------ */

function ExpenseRow({
  label,
  semesters,
  field,
  onUpdateCost,
  colW,
  labelW,
  labelCell,
  dataCell,
}: {
  label: string
  semesters: Semester[]
  field: keyof Semester
  onUpdateCost: (semId: string, field: string, value: number) => void
  colW: string
  labelW: string
  labelCell: string
  dataCell: string
}) {
  const total = semesters.reduce((sum, sem) => sum + (sem[field] as number), 0)

  return (
    <tr className="border-b border-gray-100 hover:bg-rose-50/20">
      <td className={cn(labelCell)}>{label}</td>
      {semesters.map((sem) => (
        <td key={sem.id} className={cn(dataCell)}>
          <CellEditor
            value={sem[field] as number}
            onSave={(val) => onUpdateCost(sem.id, field as string, val)}
          />
        </td>
      ))}
      <td className={cn(dataCell, "font-semibold bg-gray-50/80")}>
        {total === 0 ? "-" : formatCurrency(total)}
      </td>
    </tr>
  )
}
