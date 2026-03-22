"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
} from "@/lib/icons"

export interface TranscriptUploadData {
  id: string
  semester: string
  gradeLevel: number | null
  status: string
  extractedGpa: number | null
  extractedWGpa: number | null
  extractedRank: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  UPLOADED: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-amber-100 text-amber-700",
  REVIEW: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-rose-100 text-rose-700",
}

const SEMESTERS = [
  "Fall 2023", "Spring 2024", "Fall 2024", "Spring 2025", "Fall 2025", "Spring 2026",
]

interface TranscriptUploadSectionProps {
  transcripts: TranscriptUploadData[]
  onDataChanged: () => void
}

export function TranscriptUploadSection({ transcripts, onDataChanged }: TranscriptUploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [uploadSemester, setUploadSemester] = useState("")
  const [uploadGradeLevel, setUploadGradeLevel] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!uploadSemester) {
      toast.error("Please select a semester first")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("semester", uploadSemester)
      if (uploadGradeLevel) formData.append("gradeLevel", uploadGradeLevel)
      const res = await fetch("/api/academics/transcript", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const upload = await res.json()
      toast.success("Transcript uploaded! Starting AI extraction...")
      setUploadSemester("")
      setUploadGradeLevel("")

      setExtracting(upload.id)
      const extractRes = await fetch(`/api/academics/transcript/${upload.id}/extract`, { method: "POST" })
      if (extractRes.ok) {
        toast.success("Transcript scanned! Review and confirm the extracted data.")
      } else {
        toast.error("AI extraction failed. You can retry from the transcript list.")
      }
      setExtracting(null)
      onDataChanged()
    } catch {
      toast.error("Failed to upload transcript")
    } finally {
      setUploading(false)
      setExtracting(null)
    }
  }

  const handleConfirm = async (transcriptId: string) => {
    setExtracting(transcriptId)
    try {
      const res = await fetch("/api/academics/transcript")
      if (!res.ok) throw new Error("Failed to fetch")
      const allUploads = await res.json()
      const upload = allUploads.find((u: { id: string }) => u.id === transcriptId)
      if (!upload?.rawExtraction?.extracted) {
        toast.error("No extracted data found. Try re-extracting.")
        setExtracting(null)
        return
      }

      const { extracted } = upload.rawExtraction
      const confirmRes = await fetch(`/api/academics/transcript/${transcriptId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses: extracted.courses || [],
          gpa: extracted.gpa?.unweighted,
          weightedGpa: extracted.gpa?.weighted,
          classRank: extracted.classRank ? String(extracted.classRank) : undefined,
          classSize: extracted.classSize ? String(extracted.classSize) : undefined,
        }),
      })
      if (confirmRes.ok) {
        const result = await confirmRes.json()
        toast.success(`Imported ${result.coursesCreated} new courses, updated ${result.coursesUpdated} existing`)
        onDataChanged()
      } else {
        toast.error("Failed to confirm transcript data")
      }
    } catch {
      toast.error("Failed to confirm transcript")
    } finally {
      setExtracting(null)
    }
  }

  const handleRetry = async (transcriptId: string) => {
    setExtracting(transcriptId)
    const res = await fetch(`/api/academics/transcript/${transcriptId}/extract`, { method: "POST" })
    if (res.ok) toast.success("Re-extraction complete!")
    else toast.error("Extraction failed again")
    setExtracting(null)
    onDataChanged()
  }

  return (
    <Card variant="bento">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
            <Upload className="h-3.5 w-3.5 text-[#1E3A5F]" />
          </div>
          Transcript Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload your unofficial transcript (PDF or image) and AI will automatically extract your courses, grades, and GPA.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Semester</label>
            <Select value={uploadSemester} onValueChange={(v) => v && setUploadSemester(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Grade Level</label>
            <Select value={uploadGradeLevel} onValueChange={(v) => v && setUploadGradeLevel(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[{ v: "9", l: "9th" }, { v: "10", l: "10th" }, { v: "11", l: "11th" }, { v: "12", l: "12th" }].map((g) => (
                  <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
              disabled={uploading || !!extracting || !uploadSemester}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading || extracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : extracting ? "Scanning..." : "Upload Transcript"}
            </Button>
          </div>
        </div>

        {transcripts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide">Upload History</h4>
            <div className="space-y-2">
              {transcripts.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.semester}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.gradeLevel ? `Grade ${t.gradeLevel}` : ""}{t.extractedGpa ? ` · GPA: ${t.extractedGpa}` : ""}
                        {t.extractedRank ? ` · Rank: ${t.extractedRank}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={STATUS_COLORS[t.status] || "bg-gray-100 text-gray-600"}>
                      {t.status === "REVIEW" ? "Ready to Review" : t.status === "CONFIRMED" ? "Imported" : t.status}
                    </Badge>
                    {t.status === "REVIEW" && (
                      <Button
                        size="sm"
                        className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
                        disabled={extracting === t.id}
                        onClick={() => handleConfirm(t.id)}
                      >
                        {extracting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm & Import
                      </Button>
                    )}
                    {t.status === "ERROR" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-rose-600"
                        disabled={!!extracting}
                        onClick={() => handleRetry(t.id)}
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
