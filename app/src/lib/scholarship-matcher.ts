/**
 * Scholarship matching engine.
 * Scores scholarships against a student profile and returns match results.
 */

interface ScholarshipForMatching {
  id: string
  name: string
  amount: number | null
  amountMax: number | null
  deadline: Date | null
  minGpa: number | null
  maxGpa: number | null
  states: string[]
  citizenships: string[]
  gradeLevels: number[]
  fieldsOfStudy: string[]
  ethnicities: string[]
  requiresFirstGen: boolean
  requiresPell: boolean
  requiresFinancialNeed: boolean
  minSat: number | null
  minAct: number | null
}

interface StudentProfileForMatching {
  gpa: number | null
  gradeLevel: number | null
  satScore: number | null
  actScore: number | null
  intendedMajor: string | null
  ethnicity: string | null
  citizenship: string | null
  state: string | null
  isFirstGen: boolean
  isPellEligible: boolean
  hasFinancialNeed: boolean
}

export interface MatchResult {
  scholarshipId: string
  score: number
  reasons: string[]
  isExcluded: boolean
}

function lower(s: string | null): string {
  return (s || "").toLowerCase().trim()
}

function includesIgnoreCase(arr: string[], value: string | null): boolean {
  if (!value) return false
  const v = lower(value)
  return arr.some((item) => lower(item) === v)
}

export function computeMatchScore(
  scholarship: ScholarshipForMatching,
  profile: StudentProfileForMatching
): MatchResult {
  let score = 100
  const reasons: string[] = []

  const excluded = (reason: string): MatchResult => ({
    scholarshipId: scholarship.id,
    score: 0,
    reasons: [reason],
    isExcluded: true,
  })

  // ── Hard exclusions ──────────────────────────────────────

  // Deadline
  if (scholarship.deadline && scholarship.deadline < new Date()) {
    return excluded("Deadline has passed")
  }

  // GPA
  if (scholarship.minGpa != null && profile.gpa != null) {
    if (profile.gpa < scholarship.minGpa) {
      return excluded(`GPA below minimum (${scholarship.minGpa})`)
    }
    score += 10
    reasons.push("GPA meets requirement")
  }

  // State
  if (scholarship.states.length > 0) {
    if (profile.state && !includesIgnoreCase(scholarship.states, profile.state)) {
      return excluded("Not available in your state")
    }
    if (profile.state) reasons.push("Available in your state")
  }

  // Ethnicity
  if (scholarship.ethnicities.length > 0) {
    if (profile.ethnicity && !includesIgnoreCase(scholarship.ethnicities, profile.ethnicity)) {
      return excluded("Ethnicity does not match eligibility")
    }
    if (profile.ethnicity) reasons.push("Matches your background")
  }

  // Citizenship
  if (scholarship.citizenships.length > 0) {
    if (profile.citizenship && !includesIgnoreCase(scholarship.citizenships, profile.citizenship)) {
      return excluded("Citizenship does not match")
    }
    if (profile.citizenship) reasons.push("Citizenship eligible")
  }

  // Grade level
  if (scholarship.gradeLevels.length > 0) {
    if (profile.gradeLevel != null && !scholarship.gradeLevels.includes(profile.gradeLevel)) {
      return excluded("Grade level not eligible")
    }
    if (profile.gradeLevel != null) reasons.push("Grade level eligible")
  }

  // First-gen
  if (scholarship.requiresFirstGen) {
    if (!profile.isFirstGen) return excluded("Requires first-generation student")
    reasons.push("First-generation eligible")
  }

  // Pell
  if (scholarship.requiresPell) {
    if (!profile.isPellEligible) return excluded("Requires Pell eligibility")
    reasons.push("Pell eligible")
  }

  // Financial need
  if (scholarship.requiresFinancialNeed) {
    if (!profile.hasFinancialNeed) return excluded("Requires demonstrated financial need")
    reasons.push("Financial need eligible")
  }

  // SAT
  if (scholarship.minSat != null && profile.satScore != null) {
    if (profile.satScore < scholarship.minSat) {
      return excluded(`SAT score below minimum (${scholarship.minSat})`)
    }
    reasons.push("SAT score qualifies")
  }

  // ACT
  if (scholarship.minAct != null && profile.actScore != null) {
    if (profile.actScore < scholarship.minAct) {
      return excluded(`ACT score below minimum (${scholarship.minAct})`)
    }
    reasons.push("ACT score qualifies")
  }

  // ── Soft deductions ──────────────────────────────────────

  // Field of study
  if (scholarship.fieldsOfStudy.length > 0) {
    if (profile.intendedMajor && !includesIgnoreCase(scholarship.fieldsOfStudy, profile.intendedMajor)) {
      score -= 15
    } else if (profile.intendedMajor) {
      reasons.push("Matches your intended major")
    }
  }

  // ── Bonuses ──────────────────────────────────────────────

  // Approaching deadline
  if (scholarship.deadline) {
    const daysUntil = Math.ceil(
      (scholarship.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 30 && daysUntil > 0) {
      reasons.push(`Deadline in ${daysUntil} days!`)
    }
  }

  // Amount bonus
  const amount = scholarship.amount || 0
  if (amount >= 25000) score += 10
  else if (amount >= 10000) score += 5

  // ── Missing field penalty ────────────────────────────────
  // If scholarship requires a field and student hasn't filled it in,
  // apply a small penalty but DON'T exclude

  let missingPenalty = 0
  if (scholarship.states.length > 0 && !profile.state) missingPenalty += 5
  if (scholarship.minGpa != null && profile.gpa == null) missingPenalty += 5
  if (scholarship.ethnicities.length > 0 && !profile.ethnicity) missingPenalty += 5
  if (scholarship.citizenships.length > 0 && !profile.citizenship) missingPenalty += 5
  if (scholarship.gradeLevels.length > 0 && profile.gradeLevel == null) missingPenalty += 5
  if (scholarship.fieldsOfStudy.length > 0 && !profile.intendedMajor) missingPenalty += 3
  if (scholarship.minSat != null && profile.satScore == null) missingPenalty += 3
  if (scholarship.minAct != null && profile.actScore == null) missingPenalty += 3
  score -= missingPenalty

  // Clamp
  score = Math.max(0, Math.min(100, score))

  return {
    scholarshipId: scholarship.id,
    score,
    reasons,
    isExcluded: false,
  }
}

/**
 * Detect which profile fields are missing that would improve matching.
 */
export function getMissingFields(profile: StudentProfileForMatching): string[] {
  const missing: string[] = []
  if (profile.gpa == null) missing.push("GPA")
  if (!profile.state) missing.push("State")
  if (profile.gradeLevel == null) missing.push("Grade level")
  if (!profile.ethnicity) missing.push("Ethnicity")
  if (!profile.citizenship) missing.push("Citizenship")
  if (!profile.intendedMajor) missing.push("Intended major")
  if (profile.satScore == null && profile.actScore == null) missing.push("SAT or ACT score")
  return missing
}
