import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

export const GET = withAuth(async (session) => {
  const uploads = await db.transcriptUpload.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(uploads)
})

export const POST = withAuth(async (session, request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const semester = formData.get("semester") as string | null
  const gradeLevel = formData.get("gradeLevel") as string | null

  if (!file || !semester) {
    return NextResponse.json(
      { error: "file and semester are required" },
      { status: 400 }
    )
  }

  // Read the file as base64
  const bytes = await file.arrayBuffer()
  const base64Data = Buffer.from(bytes).toString("base64")

  // Create the transcript upload record
  const upload = await db.transcriptUpload.create({
    data: {
      userId: session.user.id,
      semester,
      gradeLevel: gradeLevel ? parseInt(gradeLevel, 10) : null,
      status: "UPLOADED",
      rawExtraction: {
        fileBase64: base64Data,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    },
  })

  return NextResponse.json(upload, { status: 201 })
})
