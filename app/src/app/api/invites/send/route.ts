import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResend } from "@/lib/resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "User already has a password set" },
        { status: 400 }
      );
    }

    // Generate invite token (48 hours expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Remove any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    await db.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "https://scholarsuite.app";
    const setupUrl = `${baseUrl}/setup-account?token=${token}&email=${encodeURIComponent(user.email)}`;
    const firstName = user.name?.split(" ")[0] || "there";

    await getResend().emails.send({
      from: "ScholarSuite <noreply@scholarsuite.app>",
      to: user.email,
      subject: "You've been invited to ScholarSuite",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 0;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #1E3A5F; border-radius: 12px; padding: 10px;">
              <span style="color: white; font-size: 20px; font-weight: bold;">SS</span>
            </div>
          </div>
          <h1 style="color: #1E3A5F; font-size: 24px; font-weight: 700; margin: 0 0 8px;">
            Welcome to ScholarSuite, ${firstName}!
          </h1>
          <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Your counselor has created an account for you. Click the button below to set up your password and get started with your scholarship journey.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${setupUrl}" style="display: inline-block; background: #1E3A5F; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Set Up My Account
            </a>
          </div>
          <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5;">
            This link expires in 48 hours. If you didn't expect this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            ScholarSuite — Your scholarship journey starts here.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Invite sent" });
  } catch (error) {
    console.error("Send invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
