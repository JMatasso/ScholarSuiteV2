"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, AlertCircle, CheckCircle2, Users } from "@/lib/icons"
import { toast } from "sonner"
import { parseCSV } from "@/lib/csv-parser"

interface PreviewStudent {
  studentName: string
  studentEmail: string
  parentName: string
  parentEmail: string
  gradeLevel: string
  highSchool: string
  gpa: string
  selected: boolean
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const [step, setStep] = React.useState<"upload" | "preview" | "importing" | "done">("upload")
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([])
  const [students, setStudents] = React.useState<PreviewStudent[]>([])
  const [result, setResult] = React.useState<{ created: number; errors: string[] } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep("upload")
    setRawRows([])
    setStudents([])
    setResult(null)
    setLoading(false)
  }

  const handleClose = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        toast.error("No data found in CSV")
        setLoading(false)
        return
      }

      setRawRows(rows)

      // Send to preview endpoint
      const res = await fetch("/api/students/import-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, preview: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStudents(data.students)
      setStep("preview")
    } catch {
      toast.error("Failed to parse CSV")
    }
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleStudent = (idx: number) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s))
    )
  }

  const toggleAll = (checked: boolean) => {
    setStudents((prev) => prev.map((s) => ({ ...s, selected: checked })))
  }

  const selectedCount = students.filter((s) => s.selected).length

  const handleImport = async () => {
    const selectedIndices = new Set(
      students.map((s, i) => (s.selected ? i : -1)).filter((i) => i >= 0)
    )
    const selectedRows = rawRows.filter((_, i) => selectedIndices.has(i))

    if (selectedRows.length === 0) {
      toast.error("No students selected")
      return
    }

    setStep("importing")
    try {
      const res = await fetch("/api/students/import-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selectedRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult(data)
      setStep("done")
    } catch {
      toast.error("Import failed")
      setStep("preview")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">
            {step === "upload" && "Import Students from CSV"}
            {step === "preview" && "Review Students"}
            {step === "importing" && "Importing..."}
            {step === "done" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an RSVP or student intake CSV to create student and parent profiles."}
            {step === "preview" && `${students.length} student(s) found. Select which ones to import.`}
            {step === "importing" && "Creating student profiles..."}
            {step === "done" && result && `Created ${result.created} student(s).`}
          </DialogDescription>
        </DialogHeader>

        {/* Upload step */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F]/10">
              <Upload className="h-8 w-8 text-[#1E3A5F]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop your CSV file or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports RSVP intake forms and standard student CSVs</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              {loading ? "Parsing..." : "Choose File"}
            </Button>
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <CustomCheckbox
                checked={selectedCount === students.length}
                onChange={(e) => toggleAll(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs text-muted-foreground">
                {selectedCount} of {students.length} selected
              </span>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left font-medium text-muted-foreground">Student</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">Parent</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">Grade</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">School</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-muted/30 ${!s.selected ? "opacity-50" : ""}`}
                    >
                      <td className="p-2">
                        <CustomCheckbox
                          checked={s.selected}
                          onChange={() => toggleStudent(i)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{s.studentName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.studentEmail || "No email"}</div>
                      </td>
                      <td className="p-2">
                        <div>{s.parentName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.parentEmail || "—"}</div>
                      </td>
                      <td className="p-2">{s.gradeLevel || "—"}</td>
                      <td className="p-2 max-w-[160px] truncate">{s.highSchool || "—"}</td>
                      <td className="p-2">{s.gpa || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Students will be created with a temporary password (<code className="bg-amber-100 px-1 rounded">ScholarSuite2026!</code>).</p>
                <p className="mt-0.5">They will be prompted to change it on first login. Parent accounts will also be created and linked.</p>
              </div>
            </div>
          </>
        )}

        {/* Importing step */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Creating {selectedCount} student profile(s)...</p>
          </div>
        )}

        {/* Done step */}
        {step === "done" && result && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{result.created} student(s) imported</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Profiles are ready to view and edit on the Students page.
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-32 overflow-auto">
                <p className="text-xs font-medium text-amber-800 mb-1">{result.errors.length} issue(s):</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
              >
                <Users className="h-4 w-4" />
                Import {selectedCount} Student{selectedCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
          {step === "done" && (
            <Button
              onClick={() => {
                handleClose(false)
                onImportComplete()
              }}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
