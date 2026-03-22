import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"

const EXTRACTION_PROMPT = `You are analyzing an academic transcript. Extract the following information as JSON:

{
  "studentName": "string or null",
  "schoolName": "string or null",
  "gpa": { "unweighted": number or null, "weighted": number or null },
  "gpaScale": "string or null (e.g. '4.0', '5.0', '6.0')",
  "classRank": number or null,
  "classSize": number or null,
  "courses": [
    {
      "name": "string",
      "year": number (grade level 9-12),
      "semester": "Fall" | "Spring" | "Full Year" | "Summer",
      "type": "REGULAR" | "HONORS" | "AP" | "IB" | "DUAL_CREDIT",
      "credits": number,
      "grade": "string (letter grade like A, A-, B+, etc.)",
      "subject": "string (Math, English, Science, History, Foreign Language, Arts, etc.)"
    }
  ]
}

Rules:
- Identify AP courses by "AP" or "Advanced Placement" prefix
- Identify Honors courses by "Honors", "H", or "Hon" designation
- Identify IB courses by "IB" or "International Baccalaureate" prefix
- Identify Dual Credit/Dual Enrollment courses by "DE", "DC", or "Dual" designation
- Map grade levels: 9=Freshman, 10=Sophomore, 11=Junior, 12=Senior
- If a course spans the full year, set semester to "Full Year"
- Estimate credits based on typical values (1.0 for full year, 0.5 for semester)
- Return ONLY valid JSON, no markdown or explanation.`

export const POST = withAuth(async (session, request: NextRequest) => {
  // Extract id from the URL: /api/academics/transcript/[id]/extract
  const segments = request.nextUrl.pathname.split("/")
  const extractIdx = segments.indexOf("extract")
  const id = segments[extractIdx - 1]

  // Fetch the transcript upload
  const upload = await db.transcriptUpload.findUnique({
    where: { id },
  })

  if (!upload || upload.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (upload.status !== "UPLOADED") {
    return NextResponse.json(
      { error: "Transcript has already been processed" },
      { status: 400 }
    )
  }

  // Update status to PROCESSING
  await db.transcriptUpload.update({
    where: { id },
    data: { status: "PROCESSING" },
  })

  try {
    // Extract file data from rawExtraction
    const rawData = upload.rawExtraction as {
      fileBase64: string
      fileName: string
      fileType: string
    } | null

    if (!rawData?.fileBase64) {
      await db.transcriptUpload.update({
        where: { id },
        data: { status: "ERROR" },
      })
      return NextResponse.json(
        { error: "No file data found in transcript upload" },
        { status: 400 }
      )
    }

    const mediaType = rawData.fileType || "application/pdf"

    // Call Claude API to extract transcript data
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: rawData.fileBase64,
                },
              },
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Claude API error:", errorText)
      await db.transcriptUpload.update({
        where: { id },
        data: { status: "ERROR" },
      })
      return NextResponse.json(
        { error: "AI extraction failed" },
        { status: 502 }
      )
    }

    const result = await response.json()
    const textContent = result.content?.find(
      (c: { type: string }) => c.type === "text"
    )
    if (!textContent?.text) {
      await db.transcriptUpload.update({
        where: { id },
        data: { status: "ERROR" },
      })
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 502 }
      )
    }

    // Parse the extracted JSON
    let extracted
    try {
      // Strip markdown code fences if present
      const cleaned = textContent.text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()
      extracted = JSON.parse(cleaned)
    } catch {
      console.error("Failed to parse AI response:", textContent.text)
      await db.transcriptUpload.update({
        where: { id },
        data: {
          status: "ERROR",
          rawExtraction: {
            ...rawData,
            aiResponse: textContent.text,
            parseError: true,
          },
        },
      })
      return NextResponse.json(
        { error: "Failed to parse AI extraction result" },
        { status: 502 }
      )
    }

    // Update the transcript upload with extracted data
    const updated = await db.transcriptUpload.update({
      where: { id },
      data: {
        status: "REVIEW",
        rawExtraction: {
          ...rawData,
          extracted,
        },
        extractedGpa: extracted.gpa?.unweighted || null,
        extractedWGpa: extracted.gpa?.weighted || null,
        extractedRank:
          extracted.classRank && extracted.classSize
            ? `${extracted.classRank}/${extracted.classSize}`
            : null,
      },
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      extracted,
    })
  } catch (error) {
    console.error("Transcript extraction error:", error)
    await db.transcriptUpload.update({
      where: { id },
      data: { status: "ERROR" },
    })
    return NextResponse.json(
      { error: "Internal server error during extraction" },
      { status: 500 }
    )
  }
})
