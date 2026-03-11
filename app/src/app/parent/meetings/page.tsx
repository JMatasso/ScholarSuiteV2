"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Video,
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type MeetingStatus = "pending" | "accepted" | "declined" | "completed";

interface MeetingParticipant {
  id: string;
  userId: string;
  isHost: boolean;
  hasAccepted: boolean;
  user: { id: string; name?: string; image?: string };
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  status: string;
  participants: MeetingParticipant[];
}

interface UIMeeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  host: string;
  hostInitials: string;
  status: MeetingStatus;
  type: "video" | "in-person";
}

const statusConfig: Record<
  MeetingStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending Response",
    color: "text-amber-700",
    bgColor: "bg-amber-50 ring-amber-200",
  },
  accepted: {
    label: "Accepted",
    color: "text-green-700",
    bgColor: "bg-green-50 ring-green-200",
  },
  declined: {
    label: "Declined",
    color: "text-red-700",
    bgColor: "bg-red-50 ring-red-200",
  },
  completed: {
    label: "Completed",
    color: "text-gray-600",
    bgColor: "bg-gray-50 ring-gray-200",
  },
};

function getInitials(name?: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDuration(start: string, end: string) {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function toUIMeeting(m: Meeting, currentUserId?: string): UIMeeting {
  const host = m.participants.find((p) => p.isHost);
  const myParticipation = m.participants.find(
    (p) => p.userId === currentUserId
  );

  const isCompleted = m.status === "COMPLETED";
  let uiStatus: MeetingStatus = "pending";
  if (isCompleted) {
    uiStatus = "completed";
  } else if (myParticipation) {
    if (myParticipation.hasAccepted) {
      uiStatus = "accepted";
    } else {
      uiStatus = "pending";
    }
  }

  const start = new Date(m.startTime);

  return {
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    date: start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    duration: formatDuration(m.startTime, m.endTime),
    location: m.meetingUrl ?? "TBD",
    host: host?.user.name ?? "Consultant",
    hostInitials: getInitials(host?.user.name),
    status: uiStatus,
    type: m.meetingUrl ? "video" : "in-person",
  };
}

export default function MeetingsPage() {
  const [rawMeetings, setRawMeetings] = useState<Meeting[]>([]);
  const [meetings, setMeetings] = useState<UIMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d: Meeting[]) => {
        const list = Array.isArray(d) ? d : [];
        setRawMeetings(list);
        setMeetings(list.map((m) => toUIMeeting(m)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasAccepted: true }),
    });
    if (res.ok) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "accepted" as const } : m
        )
      );
      toast.success("Meeting accepted!");
    } else {
      toast.error("Failed to accept meeting");
    }
  };

  const handleDecline = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasAccepted: false }),
    });
    if (res.ok) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "declined" as const } : m
        )
      );
      toast.success("Meeting declined.");
    } else {
      toast.error("Failed to decline meeting");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading meetings…</p>
      </div>
    );
  }

  const upcomingMeetings = meetings.filter((m) => m.status !== "completed");
  const pastMeetings = meetings.filter((m) => m.status === "completed");
  const pendingCount = meetings.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Meetings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View and respond to meeting invitations
        </p>
      </div>

      {/* Pending invitations banner */}
      {pendingCount > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200/60">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-amber-500" />
            <p className="text-sm font-medium text-amber-800">
              You have {pendingCount} pending meeting invitation
              {pendingCount > 1 ? "s" : ""} to respond to
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
            <Calendar className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Upcoming</p>
            <p className="text-xl font-bold text-gray-900">
              {upcomingMeetings.length}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="size-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Pending Response</p>
            <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200/60 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xl font-bold text-gray-900">
              {pastMeetings.length}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming meetings */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Upcoming Meetings
        </h2>
        <div className="space-y-3">
          {upcomingMeetings.map((meeting) => {
            const status = statusConfig[meeting.status];
            return (
              <div
                key={meeting.id}
                className="rounded-xl bg-white p-5 ring-1 ring-gray-200/60 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          status.bgColor,
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {meeting.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {meeting.time} ({meeting.duration})
                      </span>
                      <span className="flex items-center gap-1">
                        {meeting.type === "video" ? (
                          <Video className="size-3.5" />
                        ) : (
                          <MapPin className="size-3.5" />
                        )}
                        {meeting.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="size-3.5" />
                        {meeting.host}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {meeting.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => handleAccept(meeting.id)}
                        className="h-8 rounded-lg bg-green-600 px-4 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <Check className="size-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDecline(meeting.id)}
                        variant="outline"
                        className="h-8 rounded-lg px-4 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="size-3.5 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {meeting.status === "accepted" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                      <CheckCircle2 className="size-4" />
                      Confirmed
                    </span>
                  )}

                  {meeting.status === "declined" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500 shrink-0">
                      <XCircle className="size-4" />
                      Declined
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {upcomingMeetings.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center ring-1 ring-gray-200/60">
              <p className="text-sm text-gray-500">
                No upcoming meetings scheduled.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Past meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Past Meetings
          </h2>
          <div className="space-y-2">
            {pastMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-xl bg-white px-5 py-3.5 ring-1 ring-gray-200/60 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                        {meeting.hostInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {meeting.title}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {meeting.date} at {meeting.time}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200 shrink-0">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
