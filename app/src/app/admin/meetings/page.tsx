"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Video, Clock, Calendar, MapPin } from "lucide-react"

interface Meeting {
  id: string
  title: string
  attendee: string
  attendeeInitials: string
  date: string
  time: string
  duration: string
  type: "Video" | "In-Person" | "Phone"
  status: "Upcoming" | "Completed" | "Cancelled"
  notes?: string
}

const meetings: Meeting[] = [
  { id: "1", title: "Initial Consultation", attendee: "Sofia Rodriguez", attendeeInitials: "SR", date: "Mar 12, 2026", time: "10:00 AM", duration: "45 min", type: "Video", status: "Upcoming", notes: "New student onboarding and goal setting" },
  { id: "2", title: "Essay Review Session", attendee: "Maya Chen", attendeeInitials: "MC", date: "Mar 12, 2026", time: "2:00 PM", duration: "30 min", type: "Video", status: "Upcoming", notes: "Review Gates Scholarship essay draft" },
  { id: "3", title: "Financial Aid Strategy", attendee: "Carlos Rivera", attendeeInitials: "CR", date: "Mar 13, 2026", time: "11:00 AM", duration: "1 hr", type: "Video", status: "Upcoming", notes: "CSS Profile review and FAFSA follow-up" },
  { id: "4", title: "Parent Check-in", attendee: "Wei Chen", attendeeInitials: "WC", date: "Mar 14, 2026", time: "4:00 PM", duration: "30 min", type: "Phone", status: "Upcoming" },
  { id: "5", title: "Application Review", attendee: "Jordan Williams", attendeeInitials: "JW", date: "Mar 10, 2026", time: "3:00 PM", duration: "45 min", type: "Video", status: "Completed", notes: "Reviewed and submitted 2 scholarship apps" },
  { id: "6", title: "Goal Setting Session", attendee: "Priya Sharma", attendeeInitials: "PS", date: "Mar 9, 2026", time: "1:00 PM", duration: "30 min", type: "Video", status: "Completed" },
  { id: "7", title: "Progress Check-in", attendee: "Derek Thompson", attendeeInitials: "DT", date: "Mar 8, 2026", time: "10:00 AM", duration: "30 min", type: "Video", status: "Cancelled", notes: "Student no-show - rescheduling needed" },
]

const statusColors: Record<string, string> = {
  Upcoming: "bg-blue-50 text-blue-700 ring-blue-300",
  Completed: "bg-green-50 text-green-700 ring-green-300",
  Cancelled: "bg-red-50 text-red-700 ring-red-300",
}

const typeIcons: Record<string, React.ElementType> = {
  Video: Video,
  "In-Person": MapPin,
  Phone: Clock,
}

export default function MeetingsPage() {
  const upcoming = meetings.filter((m) => m.status === "Upcoming")
  const past = meetings.filter((m) => m.status !== "Upcoming")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meetings"
        description="Schedule and manage consultation meetings."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" /> Schedule Meeting
          </Button>
        }
      />

      {/* Upcoming */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Upcoming</h2>
        <div className="flex flex-col gap-3">
          {upcoming.map((meeting) => {
            const TypeIcon = typeIcons[meeting.type] || Video
            return (
              <div key={meeting.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1E3A5F]/5 text-[#1E3A5F]">
                  <Calendar className="size-4 mb-0.5" />
                  <span className="text-[10px] font-medium">{meeting.date.split(",")[0].split(" ")[0]} {meeting.date.split(",")[0].split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                    <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status]}`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Avatar size="sm"><AvatarFallback>{meeting.attendeeInitials}</AvatarFallback></Avatar>
                      {meeting.attendee}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {meeting.time} ({meeting.duration})</span>
                    <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {meeting.type}</span>
                  </div>
                  {meeting.notes && <p className="mt-1 text-xs text-muted-foreground/70">{meeting.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs">Reschedule</Button>
                  <Button size="xs"><Video className="size-3" /> Join</Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Past */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Past Meetings</h2>
        <div className="flex flex-col gap-3">
          {past.map((meeting) => {
            const TypeIcon = typeIcons[meeting.type] || Video
            return (
              <div key={meeting.id} className="flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-foreground/10 opacity-75">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Calendar className="size-4 mb-0.5" />
                  <span className="text-[10px] font-medium">{meeting.date.split(",")[0].split(" ")[0]} {meeting.date.split(",")[0].split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-foreground">{meeting.title}</h3>
                    <span className={`inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset ${statusColors[meeting.status]}`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{meeting.attendee}</span>
                    <span>{meeting.time} ({meeting.duration})</span>
                    <span className="flex items-center gap-1"><TypeIcon className="size-3" /> {meeting.type}</span>
                  </div>
                  {meeting.notes && <p className="mt-1 text-xs text-muted-foreground/70">{meeting.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
