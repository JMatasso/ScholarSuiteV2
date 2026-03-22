/**
 * Auto-calculate a student's journey stage based on graduation date
 * relative to the current date.
 *
 * Timeline (months until graduation):
 *   > 24 months  → EARLY_EXPLORATION  (freshman/sophomore)
 *   13–24 months → ACTIVE_PREP        (junior year)
 *   1–12 months  → APPLICATION_PHASE  (senior fall/winter)
 *   ≤ 0 months   → POST_ACCEPTANCE    (senior spring / graduated)
 */
export function computeJourneyStage(
  graduationYear: number | null | undefined,
  graduationMonth: number | null | undefined,
  now = new Date()
): "EARLY_EXPLORATION" | "ACTIVE_PREP" | "APPLICATION_PHASE" | "POST_ACCEPTANCE" {
  if (!graduationYear) return "EARLY_EXPLORATION"

  // Default to June if no month provided
  const month = graduationMonth ?? 6
  const gradDate = new Date(graduationYear, month - 1) // month is 1-indexed

  const diffMs = gradDate.getTime() - now.getTime()
  const monthsUntilGrad = diffMs / (1000 * 60 * 60 * 24 * 30.44) // average month length

  if (monthsUntilGrad <= 0) return "POST_ACCEPTANCE"
  if (monthsUntilGrad <= 12) return "APPLICATION_PHASE"
  if (monthsUntilGrad <= 24) return "ACTIVE_PREP"
  return "EARLY_EXPLORATION"
}

/** Human-readable labels for journey stages */
export const journeyStageLabels: Record<string, string> = {
  EARLY_EXPLORATION: "Early Exploration",
  ACTIVE_PREP: "Active Prep",
  APPLICATION_PHASE: "Application Phase",
  POST_ACCEPTANCE: "Post-Acceptance",
}

/** Month options for graduation month picker */
export const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]
