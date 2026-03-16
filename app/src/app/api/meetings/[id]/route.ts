import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const role = (session.user as { role: string }).role;
    if (role !== "ADMIN") {
      const isParticipant = meeting.participants.some(
        (p) => p.userId === session.user.id
      );
      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const role = (session.user as { role: string }).role;

    // Participant accepting/declining
    if (typeof data.hasAccepted === "boolean") {
      const participant = await db.meetingParticipant.updateMany({
        where: { meetingId: id, userId: session.user.id },
        data: { hasAccepted: data.hasAccepted },
      });
      if (participant.count === 0) {
        return NextResponse.json({ error: "Participant not found" }, { status: 404 });
      }
    }

    // Admin-only updates
    if (role === "ADMIN") {
      // Update meeting fields (status, times, etc.)
      const updateData: Record<string, unknown> = {};
      if (data.status) updateData.status = data.status;
      if (data.startTime) updateData.startTime = new Date(data.startTime);
      if (data.endTime) updateData.endTime = new Date(data.endTime);
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;
      if (data.isVideoCall !== undefined) updateData.isVideoCall = Boolean(data.isVideoCall);

      if (Object.keys(updateData).length > 0) {
        await db.meeting.update({ where: { id }, data: updateData });
      }

      // Add participants
      if (Array.isArray(data.addParticipantIds) && data.addParticipantIds.length > 0) {
        const existing = await db.meetingParticipant.findMany({
          where: { meetingId: id },
          select: { userId: true },
        });
        const existingIds = new Set(existing.map((p) => p.userId));
        const newIds = data.addParticipantIds.filter((uid: string) => !existingIds.has(uid));

        if (newIds.length > 0) {
          await db.meetingParticipant.createMany({
            data: newIds.map((uid: string) => ({
              meetingId: id,
              userId: uid,
              isHost: false,
              hasAccepted: false,
            })),
          });
        }
      }

      // Remove participants
      if (Array.isArray(data.removeParticipantIds) && data.removeParticipantIds.length > 0) {
        await db.meetingParticipant.deleteMany({
          where: {
            meetingId: id,
            userId: { in: data.removeParticipantIds },
            isHost: false, // Never remove the host
          },
        });
      }
    } else if (data.status || data.startTime || data.endTime) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
