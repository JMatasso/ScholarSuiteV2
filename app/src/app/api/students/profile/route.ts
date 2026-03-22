import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-middleware"
import { db } from "@/lib/db"
import { computeJourneyStage } from "@/lib/journey"
import { determineCounty } from "@/lib/county-lookup"

export const GET = withAuth(async (session) => {
  const [profile, user] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { schoolId: true } }),
  ])

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split("T")[0] : "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    zipCode: profile.zipCode || "",
    county: profile.county || "",
    gpa: profile.gpa?.toString() || "",
    gpaType: profile.gpaType || "",
    gradeLevel: profile.gradeLevel?.toString() || "",
    highSchool: profile.highSchool || "",
    schoolId: user?.schoolId || "",
    classRank: profile.classRank || "",
    classSize: profile.classSize || "",
    graduationYear: profile.graduationYear?.toString() || "",
    graduationMonth: profile.graduationMonth?.toString() || "",
    satScore: profile.satScore?.toString() || "",
    actScore: profile.actScore?.toString() || "",
    intendedMajor: profile.intendedMajor || "",
    major2: profile.major2 || "",
    major3: profile.major3 || "",
    gender: profile.gender || "",
    ethnicity: profile.ethnicity || "",
    citizenship: profile.citizenship || "",
    militaryAffiliation: profile.militaryAffiliation || "",
    disabilityStatus: profile.disabilityStatus || "",
    medicalConditions: profile.medicalConditions || "",
    parentsDivorced: profile.parentsDivorced ?? false,
    isDependentStudent: profile.isDependentStudent ?? true,
    householdIncome: profile.householdIncome || "",
    financialSituation: profile.financialSituation || "",
    parent1Education: profile.parent1Education || "",
    parent1Profession: profile.parent1Profession || "",
    parent1College: profile.parent1College || "",
    parent2Education: profile.parent2Education || "",
    parent2Profession: profile.parent2Profession || "",
    parent2College: profile.parent2College || "",
    isFirstGen: profile.isFirstGen ?? false,
    isPellEligible: profile.isPellEligible ?? false,
    hasFinancialNeed: profile.hasFinancialNeed ?? false,
    interestedInLgbtScholarships: profile.interestedInLgbtScholarships ?? false,
    journeyStage: profile.journeyStage || "EARLY_EXPLORATION",
    postSecondaryPath: profile.postSecondaryPath || "COLLEGE",
    collegeJourneyStage: profile.collegeJourneyStage || "",
    committedCollegeName: profile.committedCollegeName || "",
    activities: profile.activities || "",
    communityService: profile.communityService || "",
    leadershipRoles: profile.leadershipRoles || "",
    awards: profile.awards || "",
    dreamSchools: profile.dreamSchools || "",
    goals: profile.goals || "",
  })
})

export const PATCH = withAuth(async (session, request) => {
  const data = await request.json()

  const existing = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // Auto-calculate journey stage from graduation date
  const gradYear = data.graduationYear ? parseInt(data.graduationYear) : existing.graduationYear
  const gradMonth = data.graduationMonth ? parseInt(data.graduationMonth) : existing.graduationMonth
  const journeyStage = gradYear
    ? computeJourneyStage(gradYear, gradMonth)
    : (existing.journeyStage || "EARLY_EXPLORATION")

  const updateData: Record<string, unknown> = {
    journeyStage,
  }

  // String fields
  const stringFields = [
    "firstName", "lastName", "phone", "address", "city", "state", "zipCode",
    "county", "gpaType", "highSchool", "classRank", "classSize",
    "intendedMajor", "major2", "major3", "gender", "ethnicity", "citizenship",
    "militaryAffiliation", "disabilityStatus", "medicalConditions",
    "householdIncome", "financialSituation",
    "parent1Education", "parent1Profession", "parent1College",
    "parent2Education", "parent2Profession", "parent2College",
    "activities", "communityService", "leadershipRoles", "awards",
    "dreamSchools", "goals", "committedCollegeName",
  ]
  for (const field of stringFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field] || null
    }
  }

  // Date field
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null
  }

  // Float fields
  if (data.gpa !== undefined) updateData.gpa = data.gpa ? parseFloat(data.gpa) : null

  // Int fields
  if (data.gradeLevel !== undefined) updateData.gradeLevel = data.gradeLevel ? parseInt(data.gradeLevel) : null
  if (data.graduationYear !== undefined) updateData.graduationYear = data.graduationYear ? parseInt(data.graduationYear) : null
  if (data.graduationMonth !== undefined) updateData.graduationMonth = data.graduationMonth ? parseInt(data.graduationMonth) : null
  if (data.satScore !== undefined) updateData.satScore = data.satScore ? parseInt(data.satScore) : null
  if (data.actScore !== undefined) updateData.actScore = data.actScore ? parseInt(data.actScore) : null

  // Boolean fields
  const boolFields = [
    "isFirstGen", "isPellEligible", "hasFinancialNeed",
    "interestedInLgbtScholarships", "parentsDivorced", "isDependentStudent",
  ]
  for (const field of boolFields) {
    if (data[field] !== undefined) {
      updateData[field] = Boolean(data[field])
    }
  }

  // Enum fields
  if (data.postSecondaryPath !== undefined) updateData.postSecondaryPath = data.postSecondaryPath || "COLLEGE"
  if (data.collegeJourneyStage !== undefined) updateData.collegeJourneyStage = data.collegeJourneyStage || null

  // Auto-detect county if ZIP changed and county not explicitly set
  if (data.zipCode && !data.county) {
    const county = determineCounty({ zipCode: data.zipCode, city: data.city, state: data.state })
    if (county) updateData.county = county
  }

  const updated = await db.studentProfile.update({
    where: { userId: session.user.id },
    data: updateData,
  })

  // Update user name if first/last name changed
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const first = data.firstName ?? existing.firstName ?? ""
    const last = data.lastName ?? existing.lastName ?? ""
    const fullName = [first, last].filter(Boolean).join(" ")
    if (fullName) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name: fullName },
      })
    }
  }

  // Update school if schoolId changed
  if (data.schoolId !== undefined) {
    await db.user.update({
      where: { id: session.user.id },
      data: { schoolId: data.schoolId || null },
    })
  }

  return NextResponse.json(updated)
})
