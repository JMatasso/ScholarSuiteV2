"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FolderOpen,
  Upload,
  FileText,
  Image,
  File,
  Grid3X3,
  List,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react"

interface Document {
  id: number
  name: string
  type: "pdf" | "image" | "doc" | "spreadsheet"
  size: string
  uploadDate: string
  category: string
}

interface DocumentRequest {
  id: number
  title: string
  requestedBy: string
  dueDate: string
  daysLeft: number
  description: string
}

const documents: Document[] = [
  {
    id: 1,
    name: "Unofficial_Transcript_2025-2026.pdf",
    type: "pdf",
    size: "245 KB",
    uploadDate: "Mar 5, 2026",
    category: "Academic",
  },
  {
    id: 2,
    name: "FAFSA_Confirmation_2026.pdf",
    type: "pdf",
    size: "128 KB",
    uploadDate: "Feb 28, 2026",
    category: "Financial",
  },
  {
    id: 3,
    name: "Recommendation_Letter_Chen.pdf",
    type: "pdf",
    size: "89 KB",
    uploadDate: "Feb 20, 2026",
    category: "Recommendations",
  },
  {
    id: 4,
    name: "SAT_Score_Report.pdf",
    type: "pdf",
    size: "312 KB",
    uploadDate: "Jan 15, 2026",
    category: "Test Scores",
  },
  {
    id: 5,
    name: "Community_Service_Hours_Log.xlsx",
    type: "spreadsheet",
    size: "56 KB",
    uploadDate: "Mar 1, 2026",
    category: "Activities",
  },
]

const pendingRequests: DocumentRequest[] = [
  {
    id: 1,
    title: "Official High School Transcript",
    requestedBy: "Ms. Rivera (Counselor)",
    dueDate: "Mar 20, 2026",
    daysLeft: 9,
    description: "Required for Gates Millennium and Jack Kent Cooke applications.",
  },
  {
    id: 2,
    title: "2025 Tax Return (Parent/Guardian)",
    requestedBy: "ScholarSuite System",
    dueDate: "Mar 30, 2026",
    daysLeft: 19,
    description: "Needed to verify financial need for need-based scholarships.",
  },
]

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  doc: File,
  spreadsheet: Grid3X3,
}

const typeColors: Record<string, string> = {
  pdf: "bg-rose-50 text-rose-600 border-rose-200",
  image: "bg-purple-50 text-purple-600 border-purple-200",
  doc: "bg-blue-50 text-blue-600 border-blue-200",
  spreadsheet: "bg-emerald-50 text-emerald-600 border-emerald-200",
}

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Documents</h1>
          <p className="mt-1 text-muted-foreground">Upload and manage your application documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Document Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{req.title}</p>
                    <span className={`text-xs font-medium ${req.daysLeft <= 10 ? "text-rose-600" : "text-amber-600"}`}>
                      {req.daysLeft} days left
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Requested by {req.requestedBy}
                    </span>
                    <Button size="xs" className="gap-1 bg-[#2563EB] hover:bg-[#2563EB]/90">
                      <Upload className="h-3 w-3" />
                      Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/20 transition-colors cursor-pointer">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <Upload className="h-6 w-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-medium">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10MB
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2 gap-1">
            <Upload className="h-3.5 w-3.5" />
            Browse Files
          </Button>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
          Uploaded Documents ({documents.length})
        </h2>

        {viewMode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = typeIcons[doc.type]
              return (
                <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${typeColors[doc.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doc.size}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {doc.uploadDate}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="xs" className="flex-1 gap-1">
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-rose-600">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-0 divide-y">
              {documents.map((doc) => {
                const Icon = typeIcons[doc.type]
                return (
                  <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${typeColors[doc.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeColors[doc.type]}`}>
                      {doc.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{doc.size}</span>
                    <span className="text-xs text-muted-foreground w-28 text-right">{doc.uploadDate}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
