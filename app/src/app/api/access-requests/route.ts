import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST — public: anyone can submit an access request
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, school, phone, message } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    if (!["STUDENT", "PARENT"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be STUDENT or PARENT" },
        { status: 400 }
      );
    }

    // Check if email already has an account
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Check for duplicate pending request
    const existingRequest = await db.accessRequest.findFirst({
      where: { email, status: "PENDING" },
    });
    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request. We'll be in touch soon!" },
        { status: 409 }
      );
    }

    const request = await db.accessRequest.create({
      data: {
        name,
        email,
        role,
        school: school || null,
        phone: phone || null,
        message: message || null,
      },
    });

    return NextResponse.json(
      { message: "Request submitted successfully", id: request.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Access request POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — admin only: list all access requests
export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.accessRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Access requests GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
