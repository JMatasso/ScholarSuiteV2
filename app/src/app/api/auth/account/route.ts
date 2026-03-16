import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"
import { validatePassword } from "@/lib/password"
import { logAudit } from "@/lib/audit"

export const PATCH = withAuth(async (session, request) => {
  const body = await request.json()
  const { name, email, password, currentPassword, image } = body

  // If changing password or email, currentPassword is required
  if ((password || email) && !currentPassword) {
    return NextResponse.json(
      { error: "Current password is required to change password or email" },
      { status: 400 }
    )
  }

  // Validate new password against policy
  if (password) {
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors[0], errors: pwCheck.errors },
        { status: 400 }
      )
    }
  }

  // Validate current password if provided
  if (currentPassword) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 400 }
      )
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 }
      )
    }
  }

  // If changing email, check uniqueness
  if (email) {
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      )
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name.trim()
  if (email !== undefined) updateData.email = email.toLowerCase().trim()
  if (image !== undefined) updateData.image = image
  if (password) {
    updateData.password = await hash(password, 12)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    )
  }

  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const changedFields = Object.keys(updateData).filter(k => k !== "password").join(", ")
  logAudit({
    userId: session.user.id,
    action: password ? "ACCOUNT_UPDATED_WITH_PASSWORD" : "ACCOUNT_UPDATED",
    resource: "user",
    resourceId: session.user.id,
    details: changedFields ? `Fields: ${changedFields}` : undefined,
  })

  return NextResponse.json(updatedUser)
})
