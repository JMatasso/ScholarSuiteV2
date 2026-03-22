import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// Map grade level text to number
function parseGradeLevel(text: string): number | null {
  const lower = text.toLowerCase().trim()
  if (lower.includes("freshman") || lower.includes("9th")) return 9
  if (lower.includes("sophomore") || lower.includes("10th")) return 10
  if (lower.includes("junior") || lower.includes("11th")) return 11
  if (lower.includes("senior") || lower.includes("12th")) return 12
  const num = parseInt(lower)
  return isNaN(num) ? null : num
}

// Parse GPA from formats like "3.82", "3.97/4.0", "High", "4.0"
function parseGPA(text: string): number | null {
  if (!text) return null
  // Try to extract the first number (before any slash)
  const match = text.match(/(\d+\.?\d*)/)
  if (!match) return null
  const val = parseFloat(match[1])
  return isNaN(val) ? null : val
}

// Parse class rank/size from formats like "13/502", "628/775"
function parseClassRankSize(text: string): { rank: string | null; size: string | null } {
  if (!text) return { rank: null, size: null }
  const match = text.match(/(\d+)\s*[/]\s*(\d+)/)
  if (match) return { rank: match[1], size: match[2] }
  return { rank: text.trim() || null, size: null }
}

// Map household income text to a normalized bracket
function normalizeIncome(text: string): string | null {
  if (!text) return null
  if (text.includes("0") && text.includes("30")) return "$0-30K"
  if (text.includes("30") && text.includes("80")) return "$30-80K"
  if (text.includes("80") && text.includes("150")) return "$80-150K"
  if (text.includes("100") && text.includes("+")) return "$100K+"
  if (text.includes("150") && text.includes("+")) return "$150K+"
  return text.trim()
}

// Find a column value by checking multiple possible header variants
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    // Try exact match first
    if (row[key] !== undefined && row[key] !== "") return row[key].trim()
    // Try partial match on header (headers may have newlines/extra text)
    for (const header of Object.keys(row)) {
      if (header.toLowerCase().startsWith(key.toLowerCase()) && row[header]?.trim()) {
        return row[header].trim()
      }
    }
  }
  return ""
}

interface ImportedStudent {
  studentName: string
  studentEmail: string
  parentName: string
  parentEmail: string
  gradeLevel: string
  highSchool: string
  gpa: string
  selected: boolean
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows, preview } = await req.json() as {
      rows: Record<string, string>[]
      preview?: boolean
    }

    // Preview mode — just parse and return structured data
    if (preview) {
      const parsed: ImportedStudent[] = rows.map((row) => {
        const studentName = col(row, "Name of Student")
        const studentEmail = col(row, "Student Email Address")
        const parentName = col(row, "Parent/Guardian Name")
        const parentEmail = col(row, "Parent Email Address")
        const gradeLevel = col(row, "Student's Grade Level", "Student Grade Level")
        const highSchool = col(row, "High School Name")
        const gpa = col(row, "Student's Unweighted GPA", "Student GPA")

        return {
          studentName,
          studentEmail,
          parentName,
          parentEmail,
          gradeLevel,
          highSchool,
          gpa,
          selected: !!(studentName || studentEmail),
        }
      }).filter((s) => s.studentName || s.studentEmail || s.parentName)

      return NextResponse.json({ students: parsed })
    }

    // Import mode
    let created = 0
    const errors: string[] = []
    const defaultPassword = await bcrypt.hash("ScholarSuite2026!", 10)

    for (const row of rows) {
      const studentName = col(row, "Name of Student")
      const studentEmail = col(row, "Student Email Address")
      const parentName = col(row, "Parent/Guardian Name")
      const parentEmail = col(row, "Parent Email Address")
      const parentPhone = col(row, "Parent Phone Number")
      const studentPhone = col(row, "Student Phone Number")
      const hometown = col(row, "Hometown")
      const gradeLevel = col(row, "Student's Grade Level", "Student Grade Level")
      const highSchool = col(row, "High School Name")
      const gpaText = col(row, "Student's Unweighted GPA", "Student GPA")
      const classRankText = col(row, "Student's Class Rank/Class Size", "Student Class Rank")
      const activities = col(row, "Extracurricular Activities or Clubs")
      const skills = col(row, "Special Skills or Talents")
      const hasWork = col(row, "Does your student have work experience")
      const workDetails = col(row, "If yes, please list")
      const edPlans = col(row, "Higher Education Plans")
      const intendedMajor = col(row, "Intended Major")
      const intendedSchools = col(row, "Intended School")
      const isFirstResponderChild = col(row, "Child of First Responder")
      const isMilitaryChild = col(row, "Child of active duty service member")
      const religion = col(row, "Religious Affiliation")
      const ethnicity = col(row, "Race/Ethnicity")
      const gender = col(row, "Gender")
      const disabilities = col(row, "Disabilities/Medical Conditions")
      const income = col(row, "Household Income Range")
      const financialCircumstances = col(row, "Special financial circumstances")
      const comments = col(row, "Additional Comments or Questions")

      if (!studentName && !studentEmail) {
        errors.push(`Skipped row: no student name or email`)
        continue
      }

      try {
        // Determine email — use student email if available, otherwise generate from name
        const email = studentEmail ||
          `${studentName.toLowerCase().replace(/\s+/g, ".")}@placeholder.scholarsuite.com`

        // Check if student already exists
        const existing = await db.user.findUnique({ where: { email } })
        if (existing) {
          errors.push(`Skipped ${studentName || email}: already exists`)
          continue
        }

        // Parse structured fields
        const gpa = parseGPA(gpaText)
        const grade = parseGradeLevel(gradeLevel)
        const { rank, size } = parseClassRankSize(classRankText)
        const householdIncome = normalizeIncome(income)

        // Build activity/skills text
        const activitiesText = [activities, skills].filter(Boolean).join("\n\n")
        const workText = hasWork?.toLowerCase().includes("yes") && workDetails
          ? `Work Experience: ${workDetails}` : ""

        // Create student user
        const studentUser = await db.user.create({
          data: {
            email,
            name: studentName || email,
            role: "STUDENT",
            password: defaultPassword,
            mustChangePassword: true,
          },
        })

        // Create student profile
        const nameParts = studentName.trim().split(/\s+/)
        const firstName = nameParts[0] || null
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

        await db.studentProfile.create({
          data: {
            userId: studentUser.id,
            firstName,
            lastName,
            phone: studentPhone || null,
            city: hometown || null,
            gradeLevel: grade,
            highSchool: highSchool || null,
            gpa,
            gpaType: gpa ? "Unweighted" : null,
            classRank: rank,
            classSize: size,
            activities: activitiesText || null,
            awards: skills || null,
            intendedMajor: intendedMajor || null,
            dreamSchools: intendedSchools || null,
            ethnicity: ethnicity || null,
            gender: gender || null,
            militaryAffiliation: isMilitaryChild?.toLowerCase().includes("yes") ? "Dependent" : null,
            disabilityStatus: disabilities && disabilities.toLowerCase() !== "no" ? disabilities : null,
            medicalConditions: disabilities && disabilities.toLowerCase() !== "no" ? disabilities : null,
            householdIncome,
            financialSituation: [financialCircumstances, comments].filter(Boolean).join("\n") || null,
            postSecondaryPath: edPlans?.toLowerCase().includes("four year") || edPlans?.toLowerCase().includes("college") ? "COLLEGE" : "COLLEGE",
            status: "NEW",
          },
        })

        // Create parent user + profile + link if parent info exists
        if (parentEmail && parentName) {
          const cleanParentEmail = parentEmail.trim().toLowerCase()
          let parentUser = await db.user.findUnique({ where: { email: cleanParentEmail } })

          if (!parentUser) {
            parentUser = await db.user.create({
              data: {
                email: cleanParentEmail,
                name: parentName,
                role: "PARENT",
                password: defaultPassword,
                mustChangePassword: true,
              },
            })

            await db.parentProfile.create({
              data: {
                userId: parentUser.id,
                phone: parentPhone || null,
              },
            })
          }

          // Link parent to student
          const existingLink = await db.parentStudent.findFirst({
            where: { parentId: parentUser.id, studentId: studentUser.id },
          })
          if (!existingLink) {
            await db.parentStudent.create({
              data: {
                parentId: parentUser.id,
                studentId: studentUser.id,
              },
            })
          }
        }

        created++
      } catch (err) {
        errors.push(`Failed to import ${studentName || studentEmail}: ${err}`)
      }
    }

    return NextResponse.json({ created, errors }, { status: 201 })
  } catch (error) {
    console.error("Error importing RSVP students:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
