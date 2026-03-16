import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH — admin: approve or deny an access request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'deny'" },
        { status: 400 }
      );
    }

    const request = await db.accessRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 400 }
      );
    }

    if (action === "deny") {
      await db.accessRequest.update({
        where: { id },
        data: {
          status: "DENIED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      });
      return NextResponse.json({ message: "Request denied" });
    }

    // Approve: create user account, then send invite
    const existingUser = await db.user.findUnique({
      where: { email: request.email },
    });
    if (existingUser) {
      // Mark as approved anyway
      await db.accessRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      });
      return NextResponse.json({
        message: "User already exists — request marked as approved",
      });
    }

    // Create the user (no password — they'll set it via invite)
    const user = await db.user.create({
      data: {
        name: request.name,
        email: request.email,
        role: request.role,
        ...(request.role === "STUDENT"
          ? {
              studentProfile: { create: {} },
            }
          : {
              parentProfile: {
                create: { phone: request.phone || null },
              },
            }),
      },
    });

    // If student and school was provided, try to link
    if (request.role === "STUDENT" && request.school) {
      const school = await db.school.findFirst({
        where: { name: { equals: request.school, mode: "insensitive" } },
      });
      if (school) {
        await db.user.update({
          where: { id: user.id },
          data: { schoolId: school.id },
        });
      }
    }

    // Mark request as approved
    await db.accessRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    // Send invite email (fire and forget — don't fail the approval if email fails)
    try {
      const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      await fetch(`${baseUrl}/api/invites/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (emailErr) {
      console.error("Failed to send invite email:", emailErr);
    }

    return NextResponse.json({
      message: "Request approved and invite sent",
      userId: user.id,
    });
  } catch (error) {
    console.error("Access request PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
