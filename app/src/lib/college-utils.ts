/**
 * Utility functions for college data display and classification.
 */

interface CollegeStats {
  acceptanceRate?: number | null;
  sat25?: number | null;
  sat75?: number | null;
  act25?: number | null;
  act75?: number | null;
}

/**
 * Auto-classify a college as REACH, MATCH, SAFETY, or LIKELY based on the
 * student's test scores / GPA compared to the college's admissions profile.
 *
 * Heuristic (each factor that can be evaluated votes, majority wins):
 *  - Acceptance rate:  <15% → REACH, 15-40% → MATCH, 40-70% → LIKELY, >70% → SAFETY
 *  - SAT (if both student and college data available):
 *      student < sat25 → REACH, sat25-sat75 → MATCH, > sat75 → SAFETY
 *  - ACT (same logic as SAT)
 *  - GPA is not directly compared to college data (colleges rarely publish
 *    GPA bands in a standard way), but if no other signal exists we fall
 *    back to GPA-based acceptance-rate proxy.
 */
export function classifyCollege(
  studentSAT: number | null,
  studentACT: number | null,
  studentGPA: number | null,
  college: CollegeStats,
): "REACH" | "MATCH" | "SAFETY" | "LIKELY" {
  const votes: number[] = []; // 1 = REACH, 2 = MATCH, 3 = LIKELY, 4 = SAFETY

  // --- Acceptance rate signal ---
  if (college.acceptanceRate != null) {
    const rate = college.acceptanceRate;
    if (rate < 15) votes.push(1);
    else if (rate < 40) votes.push(2);
    else if (rate < 70) votes.push(3);
    else votes.push(4);
  }

  // --- SAT signal ---
  if (studentSAT != null && college.sat25 != null && college.sat75 != null) {
    if (studentSAT < college.sat25) votes.push(1);
    else if (studentSAT <= college.sat75) votes.push(2);
    else if (studentSAT <= college.sat75 + 50) votes.push(3);
    else votes.push(4);
  }

  // --- ACT signal ---
  if (studentACT != null && college.act25 != null && college.act75 != null) {
    if (studentACT < college.act25) votes.push(1);
    else if (studentACT <= college.act75) votes.push(2);
    else if (studentACT <= college.act75 + 2) votes.push(3);
    else votes.push(4);
  }

  // If we have no signal at all, default to MATCH
  if (votes.length === 0) return "MATCH";

  const avg = votes.reduce((a, b) => a + b, 0) / votes.length;

  if (avg <= 1.4) return "REACH";
  if (avg <= 2.4) return "MATCH";
  if (avg <= 3.4) return "LIKELY";
  return "SAFETY";
}

/**
 * Format a tuition amount as US currency.
 * Returns "N/A" when the value is null/undefined.
 */
export function formatTuition(amount: number | null | undefined): string {
  if (amount == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an acceptance rate (stored as 0-100) as a percentage string.
 */
export function formatAcceptanceRate(rate: number | null): string {
  if (rate == null) return "N/A";
  return `${rate.toFixed(1)}%`;
}

/**
 * Convert a locale enum value (e.g. "CITY_LARGE") to a human-readable label.
 */
export function getLocaleLabel(locale: string): string {
  const map: Record<string, string> = {
    CITY_LARGE: "Large City",
    CITY_MIDSIZE: "Midsize City",
    CITY_SMALL: "Small City",
    SUBURB_LARGE: "Large Suburb",
    SUBURB_MIDSIZE: "Midsize Suburb",
    SUBURB_SMALL: "Small Suburb",
    TOWN_FRINGE: "Town (Fringe)",
    TOWN_DISTANT: "Town (Distant)",
    TOWN_REMOTE: "Town (Remote)",
    RURAL_FRINGE: "Rural (Fringe)",
    RURAL_DISTANT: "Rural (Distant)",
    RURAL_REMOTE: "Rural (Remote)",
  };
  return map[locale] ?? locale.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Convert a college control/type value to a user-friendly label.
 */
export function getCollegeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PUBLIC: "Public",
    PRIVATE_NONPROFIT: "Private (Nonprofit)",
    PRIVATE_FORPROFIT: "Private (For-Profit)",
    // Handle raw strings too
    public: "Public",
    private_nonprofit: "Private (Nonprofit)",
    private_forprofit: "Private (For-Profit)",
    "Private nonprofit": "Private (Nonprofit)",
    "Private for-profit": "Private (For-Profit)",
    Public: "Public",
  };
  return map[type] ?? type;
}
