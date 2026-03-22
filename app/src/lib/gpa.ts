// GPA Calculation Engine for High School Students

// --- Grade-to-points mapping ---

export const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0,
  "A":  4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B":  3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C":  2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D":  1.0,
  "D-": 0.7,
  "F":  0.0,
}

// Grades that don't affect GPA
const NON_GPA_GRADES = new Set(["P", "W"])

// --- Dropdown / UI options ---

export const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: "A+", label: "A+" },
  { value: "A",  label: "A" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B",  label: "B" },
  { value: "B-", label: "B-" },
  { value: "C+", label: "C+" },
  { value: "C",  label: "C" },
  { value: "C-", label: "C-" },
  { value: "D+", label: "D+" },
  { value: "D",  label: "D" },
  { value: "D-", label: "D-" },
  { value: "F",  label: "F" },
  { value: "P",  label: "P (Pass)" },
  { value: "W",  label: "W (Withdraw)" },
]

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  REGULAR:     "Regular",
  HONORS:      "Honors",
  AP:          "AP",
  IB:          "IB",
  DUAL_CREDIT: "Dual Credit",
}

export const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: "Math",               label: "Math" },
  { value: "English",            label: "English" },
  { value: "Science",            label: "Science" },
  { value: "Social Studies",     label: "Social Studies" },
  { value: "Foreign Language",   label: "Foreign Language" },
  { value: "Arts",               label: "Arts" },
  { value: "Technology",         label: "Technology" },
  { value: "Physical Education", label: "Physical Education" },
  { value: "Other",              label: "Other" },
]

// --- Types ---

export type CourseType = "REGULAR" | "HONORS" | "AP" | "IB" | "DUAL_CREDIT"
export type CourseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED"
export type WeightedScale = "5.0" | "6.0"

export interface CourseInput {
  grade: string | null
  credits: number
  type: CourseType
  status: CourseStatus
}

export interface GpaResult {
  unweighted: number
  weighted: number
  totalCredits: number
  completedCredits: number
  courseCount: number
}

// --- Weight boost logic ---

const BOOSTS: Record<WeightedScale, Record<CourseType, number>> = {
  "5.0": {
    REGULAR:     0,
    HONORS:      0.5,
    AP:          1.0,
    IB:          1.0,
    DUAL_CREDIT: 1.0,
  },
  "6.0": {
    REGULAR:     0,
    HONORS:      1.0,
    AP:          2.0,
    IB:          2.0,
    DUAL_CREDIT: 2.0,
  },
}

export function getGpaBoost(courseType: CourseType, weightedScale: WeightedScale = "5.0"): number {
  return BOOSTS[weightedScale]?.[courseType] ?? 0
}

// --- Core helpers ---

export function getGradePoints(grade: string): number | null {
  const normalized = grade.trim().toUpperCase()
  if (NON_GPA_GRADES.has(normalized)) return null
  const points = GRADE_POINTS[normalized]
  return points !== undefined ? points : null
}

function computeGpa(courses: CourseInput[], weightedScale: WeightedScale, includeStatuses: Set<CourseStatus>): GpaResult {
  let totalUnweightedQualityPoints = 0
  let totalWeightedQualityPoints = 0
  let totalCredits = 0
  let completedCredits = 0
  let courseCount = 0

  for (const course of courses) {
    // Always count credits toward totals for any included status
    if (!includeStatuses.has(course.status)) continue

    // Track all credits across included statuses
    totalCredits += course.credits

    // Only factor into GPA if there is a valid, GPA-affecting grade
    if (!course.grade) continue
    const points = getGradePoints(course.grade)
    if (points === null) continue

    const boost = getGpaBoost(course.type, weightedScale)

    totalUnweightedQualityPoints += points * course.credits
    totalWeightedQualityPoints += (points + boost) * course.credits
    completedCredits += course.credits
    courseCount++
  }

  return {
    unweighted: completedCredits > 0 ? Math.round((totalUnweightedQualityPoints / completedCredits) * 1000) / 1000 : 0,
    weighted: completedCredits > 0 ? Math.round((totalWeightedQualityPoints / completedCredits) * 1000) / 1000 : 0,
    totalCredits,
    completedCredits,
    courseCount,
  }
}

// --- Public calculation functions ---

/** Calculate GPA from completed courses only. */
export function calculateGpa(courses: CourseInput[], weightedScale: WeightedScale = "5.0"): GpaResult {
  return computeGpa(courses, weightedScale, new Set(["COMPLETED"]))
}

/** Calculate GPA for a specific subset (semester) of courses — completed only. */
export function calculateSemesterGpa(courses: CourseInput[], weightedScale: WeightedScale = "5.0"): GpaResult {
  return computeGpa(courses, weightedScale, new Set(["COMPLETED"]))
}

/** Projected GPA including both COMPLETED and IN_PROGRESS courses. */
export function calculateProjectedGpa(courses: CourseInput[], weightedScale: WeightedScale = "5.0"): GpaResult {
  return computeGpa(courses, weightedScale, new Set(["COMPLETED", "IN_PROGRESS"]))
}
