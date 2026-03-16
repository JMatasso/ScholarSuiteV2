"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { toast } from "sonner"
import { UploadDropzone } from "@/lib/uploadthing"

interface DocumentRequest {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: "PENDING" | "SUBMITTED" | "REVIEWED"
}

interface Document {
  id: string
  name: string
  type: "TRANSCRIPT" | "LETTER" | "FINANCIAL" | "IDENTIFICATION" | "OTHER"
  folder: string | null
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  createdAt: string
  request: DocumentRequest | null
}

const typeIcons: Record<string, typeof FileText> = {
  TRANSCRIPT: FileText,
  LETTER: File,
  FINANCIAL: FileText,
  IDENTIFICATION: Image,
  OTHER: File,
}

const typeColors: Record<string, string> = {
  TRANSCRIPT: "bg-rose-50 text-rose-600 border-rose-200",
  LETTER: "bg-blue-50 text-blue-600 border-blue-200",
  FINANCIAL: "bg-emerald-50 text-emerald-600 border-emerald-200",
  IDENTIFICATION: "bg-purple-50 text-purple-600 border-purple-200",
  OTHER: "bg-gray-50 text-gray-600 border-gray-200",
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getDaysLeft(dueDate: string | null): number | null {
  if (!dueDate) return null
  const diff = new Date(dueDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pendingRequests, setPendingRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    Promise.all([
      fetch("/api/documents").then((r) => r.json()).catch(() => []),
      fetch("/api/documents?type=requests").then((r) => r.json()).catch(() => []),
    ]).then(([docsData, reqsData]) => {
      setDocuments(Array.isArray(docsData) ? docsData : [])
      const allReqs = Array.isArray(reqsData) ? reqsData : []
      setPendingRequests(allReqs.filter((r: DocumentRequest) => r.status === "PENDING"))
      setLoading(false)
    })
  }, [])

  const handleDelete = async (docId: string) => {
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
    if (res.ok) {
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success("Document deleted")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading documents...</p>
      </div>
    )
  }

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
            {pendingRequests.map((req) => {
              const daysLeft = getDaysLeft(req.dueDate)
              return (
                <Card key={req.id} className="border-amber-200 bg-amber-50/30">
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{req.title}</p>
                      {daysLeft !== null && (
                        <span className={`text-xs font-medium ${daysLeft <= 10 ? "text-rose-600" : "text-amber-600"}`}>
                          {daysLeft} days left
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    )}
                    <div className="flex items-center justify-end">
                      <Button size="xs" className="gap-1 bg-[#2563EB] hover:bg-[#2563EB]/90" onClick={() => {
                        const uploadZone = document.querySelector('[data-ut-element="button"]') as HTMLButtonElement
                        if (uploadZone) uploadZone.click()
                        else window.scrollTo({ top: document.querySelector('.ut-uploading-container, [data-ut-element]')?.getBoundingClientRect().top ?? 500, behavior: 'smooth' })
                      }}>
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <UploadDropzone
        endpoint="documentUploader"
        onClientUploadComplete={() => {
          toast.success("File uploaded successfully!")
          // Re-fetch documents
          fetch("/api/documents")
            .then(r => r.json())
            .then(d => setDocuments(Array.isArray(d) ? d : []))
        }}
        onUploadError={(error) => {
          toast.error(`Upload failed: ${error.message}`)
        }}
      />

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide">
          Uploaded Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = typeIcons[doc.type] ?? File
              return (
                <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${typeColors[doc.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.folder || doc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        className="flex-1 gap-1"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-rose-600" onClick={() => handleDelete(doc.id)}>
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
                const Icon = typeIcons[doc.type] ?? File
                return (
                  <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${typeColors[doc.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeColors[doc.type]}`}>
                      {doc.type}
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{formatFileSize(doc.fileSize)}</span>
                    <span className="text-xs text-muted-foreground w-28 text-right">{formatDate(doc.createdAt)}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-rose-600" onClick={() => handleDelete(doc.id)}>
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
