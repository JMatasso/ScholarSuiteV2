"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DataSheetGrid,
  floatColumn,
  keyColumn,
  textColumn,
} from "react-datasheet-grid"
import "react-datasheet-grid/dist/style.css"
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

const EXPENSE_FIELDS = [
  { label: "Tuition & Fees", field: "tuition" },
  { label: "Housing", field: "housing" },
  { label: "Food", field: "food" },
  { label: "Books & Supplies", field: "books" },
  { label: "Transportation", field: "transportation" },
  { label: "Personal / Misc", field: "personal" },
  { label: "Other", field: "other" },
] as const

type GridRow = Record<string, number | string | null>

function getSemesterTotal(sem: Semester): number {
  const base = sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
  const custom = (sem.customExpenses ?? []).reduce((a, e) => a + e.amount, 0)
  return base + custom
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
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

  // Build unique names
  const incomeSourceNames = useMemo(() => {
    const names = new Set<string>()
    semesters.forEach((s) => s.incomeSources.forEach((src) => names.add(src.name)))
    return Array.from(names).sort()
  }, [semesters])

  const customExpenseNames = useMemo(() => {
    const names = new Set<string>()
    semesters.forEach((s) => (s.customExpenses ?? []).forEach((e) => names.add(e.name)))
    return Array.from(names).sort()
  }, [semesters])

  // Shorten semester name for column headers
  const shortName = (name: string) =>
    name
      .replace("Freshman", "Fr.")
      .replace("Sophomore", "So.")
      .replace("Junior", "Jr.")
      .replace("Senior", "Sr.")

  // ── KPI values ──────────────────────────────────────────────────
  const pctFunded = totalCost > 0
    ? Math.round(((totalAid + totalScholarships) / totalCost) * 100)
    : 0

  // ══════════════════════════════════════════════════════════════════
  //  GRID DATA: build rows for DataSheetGrid
  // ══════════════════════════════════════════════════════════════════

  // ── Expense rows ────────────────────────────────────────────────
  const expenseRows: GridRow[] = useMemo(() => {
    const rows: GridRow[] = EXPENSE_FIELDS.map(({ label, field }) => {
      const row: GridRow = { _label: label, _field: field }
      let total = 0
      semesters.forEach((sem) => {
        const val = sem[field as keyof Semester] as number
        row[sem.id] = val || null
        total += val
      })
      row._total = total || null
      return row
    })

    customExpenseNames.forEach((eName) => {
      const row: GridRow = { _label: eName, _field: `custom:${eName}` }
      let total = 0
      semesters.forEach((sem) => {
        const exp = (sem.customExpenses ?? []).find((e) => e.name === eName)
        const val = exp?.amount ?? 0
        row[sem.id] = val || null
        total += val
      })
      row._total = total || null
      rows.push(row)
    })

    return rows
  }, [semesters, customExpenseNames])

  // ── Income rows ─────────────────────────────────────────────────
  const incomeRows: GridRow[] = useMemo(() =>
    incomeSourceNames.map((name) => {
      const row: GridRow = { _label: name, _field: `income:${name}` }
      let total = 0
      semesters.forEach((sem) => {
        const src = sem.incomeSources.find((s) => s.name === name)
        row[sem.id] = src ? src.amount : null
        total += src?.amount ?? 0
      })
      row._total = total || null
      return row
    }),
    [semesters, incomeSourceNames]
  )

  // ── Summary rows (read-only) ───────────────────────────────────
  const summaryRows: GridRow[] = useMemo(() => {
    const totalIncomeRow: GridRow = { _label: "Total Income", _field: "_totalIncome" }
    const totalCostRow: GridRow = { _label: "Total Costs", _field: "_totalCosts" }
    const netRow: GridRow = { _label: "Surplus / Deficit", _field: "_net" }

    let grandIncome = 0
    let grandCost = 0

    semesters.forEach((sem) => {
      const aid = getSemesterAid(sem)
      const cost = getSemesterTotal(sem)
      totalIncomeRow[sem.id] = aid || null
      totalCostRow[sem.id] = cost ? -cost : null
      netRow[sem.id] = aid - cost
      grandIncome += aid
      grandCost += cost
    })

    totalIncomeRow._total = grandIncome || null
    totalCostRow._total = grandCost ? -grandCost : null
    netRow._total = grandIncome - grandCost

    return [totalIncomeRow, totalCostRow, netRow]
  }, [semesters])

  // ══════════════════════════════════════════════════════════════════
  //  GRID COLUMNS
  // ══════════════════════════════════════════════════════════════════

  const labelColumn = useMemo(() => ({
    ...keyColumn("_label", textColumn),
    title: " ",
    disabled: true,
    minWidth: 150,
    grow: 0,
    shrink: 0,
  }), [])

  const totalColumn = useMemo(() => ({
    ...keyColumn("_total", floatColumn),
    title: "Total",
    disabled: true,
    minWidth: 100,
    grow: 0,
    shrink: 0,
  }), [])

  const semesterColumns = useMemo(() =>
    semesters.map((sem) => ({
      ...keyColumn(sem.id, floatColumn),
      title: shortName(sem.name),
      minWidth: 95,
      grow: 1,
    })),
    [semesters]
  )

  const editableColumns = useMemo(
    () => [labelColumn, ...semesterColumns, totalColumn],
    [labelColumn, semesterColumns, totalColumn]
  )

  const readOnlyColumns = useMemo(
    () => [
      labelColumn,
      ...semesterColumns.map((c) => ({ ...c, disabled: true as const })),
      totalColumn,
    ],
    [labelColumn, semesterColumns, totalColumn]
  )

  // ══════════════════════════════════════════════════════════════════
  //  HANDLERS
  // ══════════════════════════════════════════════════════════════════

  const handleUpdateCost = useCallback(async (semId: string, field: string, value: number) => {
    // Optimistic update
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

  const handleUpdateExpense = useCallback(async (semId: string, expenseId: string, amount: number) => {
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

  const handleUpdateIncome = useCallback(async (semId: string, sourceId: string, amount: number) => {
    onPlanUpdate({
      ...plan,
      semesters: semesters.map((s) =>
        s.id === semId
          ? { ...s, incomeSources: s.incomeSources.map((src) => src.id === sourceId ? { ...src, amount } : src) }
          : s
      ),
    })

    try {
      const res = await fetch(`/api/financial/${plan.id}/semesters/${semId}/income`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, amount }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Failed to save — reverting")
      const planRes = await fetch("/api/financial")
      const refreshed = await planRes.json()
      if (refreshed?.id) onPlanUpdate(refreshed)
    }
  }, [plan, semesters, onPlanUpdate])

  // ── Grid onChange handlers ──────────────────────────────────────

  const handleExpenseGridChange = useCallback((newRows: GridRow[]) => {
    for (let i = 0; i < newRows.length; i++) {
      const oldRow = expenseRows[i]
      const newRow = newRows[i]
      if (!oldRow || !newRow) continue

      for (const sem of semesters) {
        const oldVal = (oldRow[sem.id] as number) ?? 0
        const newVal = (newRow[sem.id] as number) ?? 0
        if (oldVal !== newVal) {
          const field = oldRow._field as string
          if (field.startsWith("custom:")) {
            const expName = field.slice(7)
            const exp = (sem.customExpenses ?? []).find((e) => e.name === expName)
            if (exp) handleUpdateExpense(sem.id, exp.id, newVal)
          } else {
            handleUpdateCost(sem.id, field, newVal)
          }
        }
      }
    }
  }, [expenseRows, semesters, handleUpdateCost, handleUpdateExpense])

  const handleIncomeGridChange = useCallback((newRows: GridRow[]) => {
    for (let i = 0; i < newRows.length; i++) {
      const oldRow = incomeRows[i]
      const newRow = newRows[i]
      if (!oldRow || !newRow) continue

      for (const sem of semesters) {
        const oldVal = (oldRow[sem.id] as number) ?? 0
        const newVal = (newRow[sem.id] as number) ?? 0
        if (oldVal !== newVal) {
          const srcName = (oldRow._label as string)
          const src = sem.incomeSources.find((s) => s.name === srcName)
          if (src) handleUpdateIncome(sem.id, src.id, newVal)
        }
      }
    }
  }, [incomeRows, semesters, handleUpdateIncome])

  // ── Term / Income / Expense dialogs ─────────────────────────────

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

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Click any cell to edit. Use Tab/Enter to navigate. Copy-paste supported.
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
          <div className="bg-[#1E3A5F] text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-2 flex items-center justify-between">
            <span>Financial Goals</span>
            <span className="text-[10px] font-normal opacity-80">
              {pctFunded}% Funded
            </span>
          </div>
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

      {/* ── Income Section ─────────────────────────────────────────── */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-emerald-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Income & Scholarship Breakdown</span>
              <button
                type="button"
                onClick={() => {
                  if (semesters.length > 0) setAddIncomeOpen(semesters[0].id)
                }}
                className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium hover:bg-white/30 transition-colors"
              >
                <Plus className="h-2.5 w-2.5" /> Add Source
              </button>
            </div>
            {incomeSourceNames.length > 0 && (
              <span className="text-[10px] font-normal opacity-80">
                {formatCurrency(totalAid)} total
              </span>
            )}
          </div>
          {incomeSourceNames.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-6">
              No income sources yet. Click &quot;Add Source&quot; to add scholarships, jobs, or other income.
            </div>
          ) : (
            <div className="budget-grid income-grid">
              <DataSheetGrid
                value={incomeRows}
                onChange={handleIncomeGridChange}
                columns={editableColumns}
                lockRows
                gutterColumn={false}
                rowHeight={32}
                headerRowHeight={36}
                disableContextMenu
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Expense Section ────────────────────────────────────────── */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-rose-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Expenses Per Semester</span>
              <button
                type="button"
                onClick={() => {
                  setExpenseTargets(semesters.map((s) => s.id))
                  setAddExpenseOpen(true)
                }}
                className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium hover:bg-white/30 transition-colors"
              >
                <Plus className="h-2.5 w-2.5" /> Add Expense
              </button>
            </div>
            <span className="text-[10px] font-normal opacity-80">
              {formatCurrency(totalCost)} total
            </span>
          </div>
          <div className="budget-grid expense-grid">
            <DataSheetGrid
              value={expenseRows}
              onChange={handleExpenseGridChange}
              columns={editableColumns}
              lockRows
              gutterColumn={false}
              rowHeight={32}
              headerRowHeight={36}
              disableContextMenu
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Section ────────────────────────────────────────── */}
      <Card variant="bento" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-[#1E3A5F] text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-2">
            Surplus / Deficit Per Semester
          </div>
          <div className="budget-grid summary-grid">
            <DataSheetGrid
              value={summaryRows}
              columns={readOnlyColumns}
              lockRows
              gutterColumn={false}
              rowHeight={34}
              headerRowHeight={36}
              disableContextMenu
            />
          </div>

          {/* Per-semester funding bars */}
          <div className="flex items-center border-t px-3 py-2 bg-gray-50 gap-4 overflow-x-auto">
            <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap min-w-[140px]">
              % Funded
            </span>
            {semesters.map((sem) => {
              const cost = getSemesterTotal(sem)
              const aid = getSemesterAid(sem)
              const pct = cost > 0 ? Math.round((aid / cost) * 100) : 0
              return (
                <div key={sem.id} className="flex items-center gap-1.5 min-w-[85px] flex-1">
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
              )
            })}
            <div className="flex items-center gap-1.5 min-w-[90px]">
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
          </div>
        </CardContent>
      </Card>

      {/* ── DIALOGS ────────────────────────────────────────────────── */}

      {/* Add Term Dialog */}
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

      {/* Add Income Dialog */}
      <Dialog open={addIncomeOpen !== null} onOpenChange={(open) => { if (!open) resetIncomeForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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

      {/* Add Custom Expense Dialog */}
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

      {/* ── Grid custom styles ─────────────────────────────────────── */}
      <style>{`
        .budget-grid {
          --dsg-border-color: #e5e7eb;
          --dsg-selection-border-color: #2563EB;
          --dsg-cell-background-color: white;
          --dsg-cell-disabled-background-color: #f9fafb;
          --dsg-header-text-color: #1E3A5F;
          font-size: 12px;
        }
        .budget-grid .dsg-container {
          border: none;
          border-radius: 0;
        }
        .budget-grid .dsg-cell {
          padding: 0 8px;
        }
        .budget-grid .dsg-cell-header {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          background: #f1f5f9;
          color: #1E3A5F;
        }
        .income-grid .dsg-cell:not(.dsg-cell-header):not(.dsg-cell-disabled) {
          color: #047857;
        }
        .expense-grid .dsg-cell:not(.dsg-cell-header):not(.dsg-cell-disabled) {
          color: #1a1a1a;
        }
        .summary-grid .dsg-cell:not(.dsg-cell-header) {
          font-weight: 600;
        }
        .summary-grid .dsg-row:last-child .dsg-cell {
          background: #1E3A5F;
          color: white;
          font-weight: 700;
        }
      `}</style>
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
