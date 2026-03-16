"use client"

import * as React from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, FileText, CheckCircle2, Clock } from "lucide-react"
import { Tabs as VercelTabs } from "@/components/ui/vercel-tabs"

const tabItems = [
  { id: "Profile", label: "Profile" },
  { id: "Applications", label: "Applications" },
  { id: "Tasks", label: "Tasks" },
  { id: "Essays", label: "Essays" },
  { id: "Documents", label: "Documents" },
  { id: "Financial", label: "Financial" },
  { id: "Notes", label: "Notes" },
]
type Tab = typeof tabItems[number]["id"]

interface StudentData {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: string
  school?: { name: string } | null
  studentProfile?: {
    phone?: string | null
    city?: string | null
    state?: string | null
    gpa?: number | null
    satScore?: number | null
    journeyStage?: string | null
    gradeLevel?: number | null
    status?: string | null
  } | null
  scholarshipApps?: Array<{
    id: string
    status: string
    amountAwarded?: number | null
    scholarship: { name: string; amount?: number | null; deadline?: string | null }
    createdAt: string
  }>
  tasks?: Array<{
    id: string
    title: string
    status: string
    dueDate?: string | null
  }>
  essays?: Array<{
    id: string
    title: string
    status: string
    content?: string | null
    updatedAt: string
  }>
  documents?: Array<{
    id: string
    name: string
    type: string
    createdAt: string
  }>
  financialPlans?: Array<{
    id: string
    semesters?: Array<{ name: string; tuition: number; housing: number; food: number; transportation: number; books: number; personal: number; other: number; incomeSources: Array<{ name: string; amount: number }> }>
  }>
  linkedParents?: Array<{ parent: { id: string; name?: string | null; email: string } }>
}

function StudentDetailContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = React.useState<Tab>("Profile" as Tab)
  const [student, setStudent] = React.useState<StudentData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [noteText, setNoteText] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(res => res.json())
      .then(d => { setStudent(d); setLoading(false) })
      .catch(() => { toast.error("Failed to load student"); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading student...
      </div>
    )
  }

  if (!student || (student as { error?: string }).error) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="size-3.5" /> Back to Students
        </Link>
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </div>
    )
  }

  const profile = student.studentProfile
  const applications = student.scholarshipApps || []
  const tasks = student.tasks || []
  const essays = student.essays || []
  const documents = student.documents || []
  const financialPlan = student.financialPlans?.[0]

  const initials = (student.name || student.email).substring(0, 2).toUpperCase()
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ") || "—"
  const totalAwardedAmount = applications.filter(a => a.status === "AWARDED").reduce((sum, a) => sum + (a.amountAwarded || 0), 0)
  const awardedCount = applications.filter(a => a.status === "AWARDED").length
  const tasksComplete = tasks.filter(t => t.status === "DONE").length

  const totalCost = financialPlan?.semesters?.reduce((sum, s) => sum + s.tuition + s.housing + s.food + s.transportation + s.books + s.personal + s.other, 0) || 0
  const totalIncome = financialPlan?.semesters?.reduce((sum, s) => sum + s.incomeSources.reduce((a, src) => a + src.amount, 0), 0) || 0

  return (
    <div className="flex flex-col gap-6">
      {/* Back Link */}
      <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="size-3.5" /> Back to Students
      </Link>

      {/* Student Header */}
      <motion.div
        className="flex items-start gap-5 rounded-xl bg-white p-6 ring-1 ring-foreground/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Avatar size="lg">
          {student.image && <AvatarImage src={student.image} alt={student.name || student.email} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">{student.name || student.email}</h1>
            {profile?.status && <StatusBadge status={profile.status as "NEW" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "GRADUATED"} />}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {student.school?.name && <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> {student.school.name}</span>}
            {location !== "—" && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {location}</span>}
            <span className="flex items-center gap-1"><Mail className="size-3.5" /> {student.email}</span>
            {profile?.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {profile.phone}</span>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{applications.length}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{awardedCount}</p>
              <p className="text-xs text-muted-foreground">Awarded</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-green-600">{totalAwardedAmount > 0 ? `$${totalAwardedAmount.toLocaleString()}` : "$0"}</p>
              <p className="text-xs text-muted-foreground">Total Awarded</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{tasksComplete}/{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks Complete</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/messages")}><Mail className="size-3.5" /> Message</Button>
          <Button size="sm" onClick={() => router.push("/admin/meetings")}><Calendar className="size-3.5" /> Schedule</Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <VercelTabs
        tabs={tabItems}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        className="border-b border-border pb-[6px]"
      />

      {/* Tab Content */}
      <motion.div
        className="rounded-xl bg-white p-6 ring-1 ring-foreground/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {activeTab === "Profile" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Academic Information</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">GPA</span>
                  <span className="text-sm font-medium">{profile?.gpa ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">SAT Score</span>
                  <span className="text-sm font-medium">{profile?.satScore ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Grade Level</span>
                  <span className="text-sm font-medium">{profile?.gradeLevel ? `Grade ${profile.gradeLevel}` : "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Journey Stage</span>
                  <span className="text-sm font-medium">{profile?.journeyStage ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Contact Information</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{student.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{profile?.phone ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{location}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Parent(s)</span>
                  <span className="text-sm font-medium">
                    {student.linkedParents && student.linkedParents.length > 0
                      ? student.linkedParents.map(lp => lp.parent.name || lp.parent.email).join(", ")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Applications" && (
          <div className="flex flex-col gap-3">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{app.scholarship.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.scholarship.deadline ? `Deadline: ${new Date(app.scholarship.deadline).toLocaleDateString()}` : "No deadline"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {app.amountAwarded ? `$${app.amountAwarded.toLocaleString()}` : app.scholarship.amount ? `$${app.scholarship.amount.toLocaleString()}` : "—"}
                  </span>
                  <StatusBadge status={app.status as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AWARDED" | "DENIED"} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Tasks" && (
          <div className="flex flex-col gap-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  {task.status === "DONE" ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${
                  task.status === "DONE" ? "bg-green-50 text-green-700 ring-green-300" :
                  task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 ring-blue-300" :
                  "bg-gray-100 text-gray-700 ring-gray-300"
                }`}>{task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Essays" && (
          <div className="flex flex-col gap-3">
            {essays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No essays yet.</p>
            ) : essays.map((essay) => (
              <div key={essay.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{essay.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {essay.content ? `${essay.content.length} chars` : "No content"} — Updated {new Date(essay.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ring-1 ring-inset ${
                  essay.status === "APPROVED" ? "bg-green-50 text-green-700 ring-green-300" :
                  essay.status === "UNDER_REVIEW" ? "bg-blue-50 text-blue-700 ring-blue-300" :
                  essay.status === "REVISION_NEEDED" ? "bg-amber-50 text-amber-700 ring-amber-300" :
                  "bg-gray-100 text-gray-700 ring-gray-300"
                }`}>{essay.status === "REVISION_NEEDED" ? "Revision Needed" : essay.status === "UNDER_REVIEW" ? "Under Review" : essay.status === "APPROVED" ? "Approved" : "Draft"}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="flex flex-col gap-3">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{doc.type}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Financial" && (
          <div>
            {!financialPlan ? (
              <p className="text-sm text-muted-foreground">No financial plan yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-green-700">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Total Income / Aid</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-blue-700">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">Total Cost of Attendance</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-semibold text-amber-700">${Math.max(0, totalCost - totalIncome).toLocaleString()}</p>
                  <p className="text-xs text-amber-600">Remaining Gap</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="flex flex-col gap-4">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this student..."
              className="h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
            <Button
              size="sm"
              className="w-fit"
              onClick={async () => {
                if (!noteText.trim()) return
                try {
                  await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiverId: student.id, content: `[Note] ${noteText}` }),
                  })
                  toast.success("Note saved")
                  setNoteText("")
                } catch {
                  toast.error("Failed to save note")
                }
              }}
            >
              Add Note
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function StudentDetailPage() {
  return <StudentDetailContent />
}
