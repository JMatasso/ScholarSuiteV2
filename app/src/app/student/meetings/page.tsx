"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  MapPin,
} from "lucide-react"

interface Meeting {
  id: number
  title: string
  consultant: string
  consultantInitials: string
  consultantRole: string
  date: string
  time: string
  duration: string
  type: "video" | "in_person"
  status: "upcoming" | "completed"
  location?: string
  notes?: string
}

const meetings: Meeting[] = [
  {
    id: 1,
    title: "Essay Review Session",
    consultant: "Ms. Rivera",
    consultantInitials: "AR",
    consultantRole: "College Counselor",
    date: "Mar 13, 2026",
    time: "3:30 PM",
    duration: "45 min",
    type: "video",
    status: "upcoming",
    notes: "Review personal statement Draft 3 and discuss Gates Millennium essay strategy.",
  },
  {
    id: 2,
    title: "Scholarship Strategy Session",
    consultant: "Marcus Thompson",
    consultantInitials: "MT",
    consultantRole: "Scholarship Consultant",
    date: "Mar 17, 2026",
    time: "4:00 PM",
    duration: "60 min",
    type: "video",
    status: "upcoming",
    notes: "Review new scholarship matches and prioritize applications for April deadlines.",
  },
  {
    id: 3,
    title: "Financial Aid Planning",
    consultant: "Dr. Patricia Nguyen",
    consultantInitials: "PN",
    consultantRole: "Financial Aid Advisor",
    date: "Mar 20, 2026",
    time: "2:00 PM",
    duration: "30 min",
    type: "in_person",
    status: "upcoming",
    location: "Lincoln High School - Room 204",
    notes: "Compare financial aid packages from Stanford, UC Berkeley, and Howard University.",
  },
  {
    id: 4,
    title: "Weekly Check-in",
    consultant: "Ms. Rivera",
    consultantInitials: "AR",
    consultantRole: "College Counselor",
    date: "Mar 6, 2026",
    time: "3:30 PM",
    duration: "30 min",
    type: "video",
    status: "completed",
    notes: "Discussed Jack Kent Cooke submission and timeline for remaining applications.",
  },
  {
    id: 5,
    title: "Interview Prep Workshop",
    consultant: "Marcus Thompson",
    consultantInitials: "MT",
    consultantRole: "Scholarship Consultant",
    date: "Feb 27, 2026",
    time: "4:00 PM",
    duration: "60 min",
    type: "video",
    status: "completed",
    notes: "Mock interview practice for Coca-Cola Scholars semifinal round.",
  },
  {
    id: 6,
    title: "Chemistry Tutoring Session",
    consultant: "Dr. Ramirez",
    consultantInitials: "LR",
    consultantRole: "Chemistry Tutor",
    date: "Feb 22, 2026",
    time: "10:00 AM",
    duration: "90 min",
    type: "in_person",
    status: "completed",
    location: "Oakland Community College - Science Lab",
    notes: "Organic chemistry review and practice exam preparation.",
  },
]

export default function MeetingsPage() {
  const upcoming = meetings.filter((m) => m.status === "upcoming")
  const completed = meetings.filter((m) => m.status === "completed")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Meetings</h1>
          <p className="mt-1 text-muted-foreground">
            Schedule and manage meetings with your counselors and consultants.
          </p>
        </div>
        <Button className="gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90">
          <Plus className="h-4 w-4" />
          Request Meeting
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#2563EB]" />
          Upcoming ({upcoming.length})
        </h2>
        <div className="space-y-3">
          {upcoming.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-0">
                <div className="flex items-start gap-4">
                  {/* Date block */}
                  <div className="flex flex-col items-center rounded-lg bg-[#1E3A5F]/5 px-3 py-2 text-center shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {meeting.date.split(" ")[0]}
                    </span>
                    <span className="text-xl font-bold text-[#1E3A5F]">
                      {meeting.date.split(" ")[1]?.replace(",", "")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar size="sm">
                            <AvatarFallback>{meeting.consultantInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{meeting.consultant}</p>
                            <p className="text-[10px] text-muted-foreground">{meeting.consultantRole}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0"
                      >
                        {meeting.type === "video" ? (
                          <>
                            <Video className="h-3.5 w-3.5" />
                            Join
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5" />
                            Directions
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.time} ({meeting.duration})
                      </span>
                      {meeting.type === "video" ? (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video Call
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    {meeting.notes && (
                      <p className="text-xs text-muted-foreground/80 italic">
                        {meeting.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Meetings */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Past Meetings ({completed.length})
        </h2>
        <div className="space-y-2.5">
          {completed.map((meeting) => (
            <Card key={meeting.id} className="opacity-70 hover:opacity-100 transition-opacity">
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center rounded-lg bg-muted/50 px-3 py-2 text-center shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {meeting.date.split(" ")[0]}
                    </span>
                    <span className="text-lg font-bold text-muted-foreground">
                      {meeting.date.split(" ")[1]?.replace(",", "")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{meeting.consultant}</span>
                      <span>{meeting.time} ({meeting.duration})</span>
                      <span className="flex items-center gap-1">
                        {meeting.type === "video" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {meeting.type === "video" ? "Video Call" : "In Person"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
