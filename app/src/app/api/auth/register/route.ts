import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Only allow STUDENT and PARENT roles from public registration
    const allowedRoles = ["STUDENT", "PARENT"];
    const userRole = allowedRoles.includes(role) ? role : "STUDENT";

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
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
