"use client"

import * as React from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"

interface EditLinksDialogProps {
  parent: { id: string; name: string; linkedStudents: { id: string }[] }
  students: MultiSelectOption[]
  onClose: () => void
  onSaved: () => void
}

export function EditLinksDialog({
  parent,
  students,
  onClose,
  onSaved,
}: EditLinksDialogProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(
    parent.linkedStudents.map((s) => s.id)
  )
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/parents/${parent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds }),
      })
      if (!res.ok) throw new Error()
      toast.success("Student links updated")
      onSaved()
      onClose()
    } catch {
      toast.error("Failed to update student links")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Edit Student Links for {parent.name}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <MultiSelect
          options={students}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          placeholder="Select students..."
          searchPlaceholder="Search students..."
          emptyMessage="No students found."
        />
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
