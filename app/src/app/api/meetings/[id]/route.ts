import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    // Update the participant's acceptance status
    if (typeof data.hasAccepted === "boolean") {
      const participant = await db.meetingParticipant.updateMany({
        where: {
          meetingId: id,
          userId: session.user.id,
        },
        data: {
          hasAccepted: data.hasAccepted,
        },
      });

      if (participant.count === 0) {
        return NextResponse.json(
          { error: "Participant not found" },
          { status: 404 }
        );
      }
    }

    // Also allow updating meeting status (for admins)
    if (data.status) {
      const role = (session.user as { role: string }).role;
      if (role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await db.meeting.update({
        where: { id },
        data: { status: data.status },
      });
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
