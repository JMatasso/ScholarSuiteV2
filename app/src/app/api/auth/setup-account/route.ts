import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

// GET — validate an invite token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const email = req.nextUrl.searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    const record = await db.verificationToken.findFirst({
      where: { identifier: email, token },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { name: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Account is already set up. Please sign in." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — set password and complete account setup
export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const record = await db.verificationToken.findFirst({
      where: { identifier: email, token },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Account is already set up. Please sign in." },
        { status: 400 }
      );
    }

    // Set the password
    const hashedPassword = await hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({ message: "Account set up successfully" });
  } catch (error) {
    console.error("Setup account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
