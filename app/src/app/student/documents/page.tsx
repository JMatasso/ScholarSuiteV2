"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FolderOpen,
  Upload,
  FileText,
  File,
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"
import { UploadButton } from "@/lib/uploadthing"
import { DOCUMENT_FOLDERS } from "@/lib/constants"

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
  type: string
  folder: string | null
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  createdAt: string
  request: DocumentRequest | null
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (mimeType?.startsWith("image/")) return "bg-purple-50 text-purple-600 border-purple-200"
  if (mimeType?.includes("pdf")) return "bg-rose-50 text-rose-600 border-rose-200"
  if (mimeType?.includes("word") || mimeType?.includes("document")) return "bg-blue-50 text-blue-600 border-blue-200"
  return "bg-gray-50 text-gray-600 border-gray-200"
}

const folderColors: Record<string, string> = {
  "Transcripts": "bg-rose-50 text-rose-600",
  "Test Scores & FAFSA": "bg-amber-50 text-amber-600",
  "Resumes": "bg-blue-50 text-blue-600",
  "Professional Headshots": "bg-purple-50 text-purple-600",
  "Letters of Recommendation": "bg-indigo-50 text-indigo-600",
  "Awards & Projects": "bg-emerald-50 text-emerald-600",
  "Applications": "bg-cyan-50 text-cyan-600",
  "Activities": "bg-teal-50 text-teal-600",
  "ScholarShape Resources": "bg-[#1E3A5F]/5 text-[#1E3A5F]",
  "Essays": "bg-pink-50 text-pink-600",
  "Application Documents": "bg-sky-50 text-sky-600",
  "Acceptance Letters": "bg-green-50 text-green-600",
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pendingRequests, setPendingRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const loadDocuments = () => {
    Promise.all([
      fetch("/api/documents").then((r) => r.json()).catch(() => []),
      fetch("/api/documents?type=requests").then((r) => r.json()).catch(() => []),
    ]).then(([docsData, reqsData]) => {
      setDocuments(Array.isArray(docsData) ? docsData : [])
      const allReqs = Array.isArray(reqsData) ? reqsData : []
      setPendingRequests(allReqs.filter((r: DocumentRequest) => r.status === "PENDING"))
      setLoading(false)
    })
  }

  useEffect(() => { loadDocuments() }, [])

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
    if (res.ok) {
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success("Document deleted")
    }
  }

  // Count documents per folder
  const folderCounts = DOCUMENT_FOLDERS.reduce((acc, folder) => {
    acc[folder] = documents.filter(d => d.folder === folder).length
    return acc
  }, {} as Record<string, number>)

  // Documents in the active folder
  const folderDocs = activeFolder
    ? documents.filter(d => d.folder === activeFolder)
    : []

  // Uncategorized documents
  const uncategorized = documents.filter(d => !d.folder || !DOCUMENT_FOLDERS.includes(d.folder as typeof DOCUMENT_FOLDERS[number]))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Documents</h1>
        <p className="mt-1 text-muted-foreground">Organize and upload your application materials.</p>
      </div>

      {/* Pending Document Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700">Pending Requests ({pendingRequests.length})</h2>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800">{req.title}</span>
                {req.dueDate && (
                  <span className="text-xs text-amber-600">{formatDate(req.dueDate)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeFolder ? (
          /* Folder Detail View */
          <motion.div
            key="folder-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setActiveFolder(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", folderColors[activeFolder] || "bg-gray-50 text-gray-600")}>
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1E3A5F]">{activeFolder}</h2>
                <p className="text-xs text-muted-foreground">{folderDocs.length} document{folderDocs.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Upload to this folder */}
            <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
              <UploadButton
                endpoint="documentUploader"
                input={{ folder: activeFolder }}
                onClientUploadComplete={() => {
                  toast.success("File uploaded!")
                  loadDocuments()
                }}
                onUploadError={(error) => { toast.error(`Upload failed: ${error.message}`) }}
                appearance={{
                  button: "bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-sm px-4 py-2 rounded-lg",
                  allowedContent: "text-xs text-muted-foreground mt-1",
                }}
              />
            </div>

            {/* Documents in folder */}
            {folderDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No documents in this folder yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Upload files above to add them here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-foreground/10 hover:shadow-sm transition-shadow"
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", getFileIcon(doc.mimeType))}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => window.open(doc.fileUrl, "_blank")}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="hover:text-rose-600" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Folder Grid View */
          <motion.div
            key="folder-grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {DOCUMENT_FOLDERS.map((folder, i) => {
                const count = folderCounts[folder] || 0
                return (
                  <motion.button
                    key={folder}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => setActiveFolder(folder)}
                    className="group flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-foreground/10 text-left transition-all hover:shadow-md hover:ring-[#2563EB]/30"
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      folderColors[folder] || "bg-gray-50 text-gray-600"
                    )}>
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{folder}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} file{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Uncategorized documents */}
            {uncategorized.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Uncategorized ({uncategorized.length})
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {uncategorized.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-foreground/10">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", getFileIcon(doc.mimeType))}>
                        <File className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => window.open(doc.fileUrl, "_blank")}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className="hover:text-rose-600" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
