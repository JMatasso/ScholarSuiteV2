"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap, FileText, CheckCircle2, Clock } from "lucide-react"

const student = {
  id: "1",
  name: "Maya Chen",
  email: "maya.chen@email.com",
  phone: "(555) 234-5678",
  status: "ACTIVE" as const,
  school: "Lincoln High School",
  gpa: "3.92",
  sat: "1480",
  location: "Portland, OR",
  phase: "Senior Year",
  journeyStage: "Application",
  joinedDate: "Aug 15, 2025",
  initials: "MC",
  applications: 6,
  awarded: 2,
  totalAward: "$25,000",
  tasksComplete: 18,
  tasksTotal: 24,
}

const applications = [
  { id: 1, name: "Gates Scholarship", amount: "$20,000", deadline: "Mar 31, 2026", status: "SUBMITTED" as const },
  { id: 2, name: "National Merit Scholarship", amount: "$10,000", deadline: "Feb 15, 2026", status: "AWARDED" as const },
  { id: 3, name: "Coca-Cola Scholars", amount: "$20,000", deadline: "Apr 15, 2026", status: "IN_PROGRESS" as const },
  { id: 4, name: "Dell Scholars", amount: "$20,000", deadline: "Dec 1, 2025", status: "AWARDED" as const },
  { id: 5, name: "Horatio Alger Scholarship", amount: "$25,000", deadline: "Mar 15, 2026", status: "IN_PROGRESS" as const },
  { id: 6, name: "Ron Brown Scholar", amount: "$40,000", deadline: "Jan 9, 2026", status: "DENIED" as const },
]

const tasks = [
  { id: 1, title: "Complete FAFSA Application", dueDate: "Mar 15, 2026", status: "IN_PROGRESS" as const },
  { id: 2, title: "Submit Gates Scholarship Essay", dueDate: "Mar 20, 2026", status: "NOT_STARTED" as const },
  { id: 3, title: "Request Recommendation Letter from Ms. Davis", dueDate: "Mar 10, 2026", status: "IN_PROGRESS" as const },
  { id: 4, title: "Upload Official Transcript", dueDate: "Feb 28, 2026", status: "SUBMITTED" as const },
  { id: 5, title: "Complete CSS Profile", dueDate: "Mar 1, 2026", status: "SUBMITTED" as const },
]

const essays = [
  { id: 1, title: "Personal Statement - Common App", wordCount: 650, status: "UNDER_REVIEW" as const, lastUpdated: "Mar 5, 2026" },
  { id: 2, title: "Gates Scholarship Essay", wordCount: 500, status: "DRAFT" as const, lastUpdated: "Mar 8, 2026" },
  { id: 3, title: "Why This College - Stanford", wordCount: 250, status: "APPROVED" as const, lastUpdated: "Feb 20, 2026" },
]

const notes = [
  { id: 1, date: "Mar 9, 2026", author: "Admin", content: "Maya is progressing well. Focus on Gates essay next session." },
  { id: 2, date: "Mar 2, 2026", author: "Admin", content: "Discussed financial aid strategy. She needs to complete CSS Profile ASAP." },
  { id: 3, date: "Feb 24, 2026", author: "Admin", content: "Great meeting. Reviewed personal statement draft - strong narrative." },
]

const tabs = ["Profile", "Applications", "Tasks", "Essays", "Documents", "Financial", "Notes"] as const
type Tab = typeof tabs[number]

function StudentDetailContent() {
  const [activeTab, setActiveTab] = React.useState<Tab>("Profile")

  return (
    <div className="flex flex-col gap-6">
      {/* Back Link */}
      <Link href="/admin/students" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="size-3.5" /> Back to Students
      </Link>

      {/* Student Header */}
      <div className="flex items-start gap-5 rounded-xl bg-white p-6 ring-1 ring-foreground/10">
        <Avatar size="lg">
          <AvatarFallback>{student.initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">{student.name}</h1>
            <StatusBadge status={student.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> {student.school}</span>
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {student.location}</span>
            <span className="flex items-center gap-1"><Mail className="size-3.5" /> {student.email}</span>
            <span className="flex items-center gap-1"><Phone className="size-3.5" /> {student.phone}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{student.applications}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{student.awarded}</p>
              <p className="text-xs text-muted-foreground">Awarded</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-green-600">{student.totalAward}</p>
              <p className="text-xs text-muted-foreground">Total Awarded</p>
            </div>
            <div className="rounded-lg bg-[#FAFAF8] p-3 text-center">
              <p className="text-lg font-semibold text-foreground">{student.tasksComplete}/{student.tasksTotal}</p>
              <p className="text-xs text-muted-foreground">Tasks Complete</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Mail className="size-3.5" /> Message</Button>
          <Button size="sm"><Calendar className="size-3.5" /> Schedule</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-foreground/10">
        {activeTab === "Profile" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">Academic Information</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">GPA</span>
                  <span className="text-sm font-medium">{student.gpa}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">SAT Score</span>
                  <span className="text-sm font-medium">{student.sat}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Phase</span>
                  <span className="text-sm font-medium">{student.phase}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Journey Stage</span>
                  <span className="text-sm font-medium">{student.journeyStage}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium">{student.joinedDate}</span>
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
                  <span className="text-sm font-medium">{student.phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{student.location}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Parent</span>
                  <span className="text-sm font-medium">Wei Chen</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Applications" && (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{app.name}</p>
                  <p className="text-xs text-muted-foreground">Deadline: {app.deadline}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{app.amount}</span>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Tasks" && (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  {task.status === "SUBMITTED" ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                  </div>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "Essays" && (
          <div className="flex flex-col gap-3">
            {essays.map((essay) => (
              <div key={essay.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{essay.title}</p>
                    <p className="text-xs text-muted-foreground">{essay.wordCount} words - Updated {essay.lastUpdated}</p>
                  </div>
                </div>
                <StatusBadge status={essay.status} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="flex flex-col gap-3">
            {[
              { name: "Official Transcript", uploaded: "Feb 28, 2026", type: "PDF" },
              { name: "SAT Score Report", uploaded: "Jan 15, 2026", type: "PDF" },
              { name: "Financial Aid Documents", uploaded: "Mar 1, 2026", type: "PDF" },
              { name: "Letter of Recommendation - Ms. Davis", uploaded: "Feb 20, 2026", type: "PDF" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Uploaded {doc.uploaded}</p>
                  </div>
                </div>
                <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{doc.type}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Financial" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-semibold text-green-700">$25,000</p>
              <p className="text-xs text-green-600">Total Awarded</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-2xl font-semibold text-blue-700">$48,000</p>
              <p className="text-xs text-blue-600">Total Cost of Attendance</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-700">$23,000</p>
              <p className="text-xs text-amber-600">Remaining Gap</p>
            </div>
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="flex flex-col gap-4">
            <textarea
              placeholder="Add a note about this student..."
              className="h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
            <Button size="sm" className="w-fit">Add Note</Button>
            <div className="flex flex-col gap-3 mt-2">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-foreground">{note.author}</span>
                    <span className="text-xs text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDetailPage() {
  return <StudentDetailContent />
}
