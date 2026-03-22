import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/api-middleware";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const { name, email, password, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password policy
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors[0], errors: pwCheck.errors },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email or sign in." },
        { status: 409 }
      );
    }

    // Only allow STUDENT and PARENT roles from public registration
    const allowedRoles = ["STUDENT", "PARENT"];
    const userRole = allowedRoles.includes(role) ? role : "STUDENT";

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole,
      },
    });

    if (userRole === "STUDENT") {
      await db.studentProfile.create({
        data: { userId: user.id },
      });
    } else if (userRole === "PARENT") {
      await db.parentProfile.create({
        data: { userId: user.id },
      });
    }

    logAudit({
      userId: user.id,
      action: "ACCOUNT_CREATED",
      resource: "user",
      resourceId: user.id,
      details: `Role: ${userRole}`,
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
