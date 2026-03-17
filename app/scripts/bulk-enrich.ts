import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

// ── US States ──────────────────────────────────────────────
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia","Puerto Rico",
]

// ── Fields of Study keywords ───────────────────────────────
const FIELD_KEYWORDS: Record<string, string[]> = {
  "STEM": ["stem", "science, technology"],
  "Engineering": ["engineering", "engineer"],
  "Computer Science": ["computer science", "software", "programming", "coding", "information technology", "cybersecurity", "cyber security"],
  "Mathematics": ["mathematics", "math major"],
  "Biology": ["biology", "biological", "biomedical"],
  "Chemistry": ["chemistry", "chemical"],
  "Physics": ["physics"],
  "Medicine": ["medicine", "medical", "pre-med", "premed", "healthcare", "health care", "nursing", "nurse", "pharmacy", "dental", "dentistry"],
  "Business": ["business", "accounting", "finance", "economics", "mba", "entrepreneurship", "marketing"],
  "Education": ["education", "teaching", "teacher"],
  "Law": ["law", "legal", "pre-law"],
  "Arts": ["arts", "fine arts", "visual arts", "performing arts", "theater", "theatre", "music", "dance"],
  "Communications": ["communications", "journalism", "media", "public relations"],
  "Social Sciences": ["social science", "sociology", "psychology", "political science", "anthropology"],
  "Environmental Science": ["environmental", "sustainability", "climate"],
  "Agriculture": ["agriculture", "farming", "agribusiness"],
  "Architecture": ["architecture"],
  "Criminal Justice": ["criminal justice", "law enforcement"],
  "Nursing": ["nursing", "nurse"],
  "Public Health": ["public health"],
}

// ── Ethnicity keywords ─────────────────────────────────────
const ETHNICITY_KEYWORDS: Record<string, string[]> = {
  "African American": ["african american", "black student", "black scholar", "african-american"],
  "Hispanic/Latino": ["hispanic", "latino", "latina", "latinx", "chicano", "chicana"],
  "Asian American": ["asian american", "asian-american", "asian pacific", "aapi"],
  "Native American": ["native american", "american indian", "indigenous", "alaska native", "tribal"],
  "Pacific Islander": ["pacific islander", "native hawaiian"],
}

// ── Fetch page text ────────────────────────────────────────
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&#?\w+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000)
  } catch {
    return null
  }
}

// ── Extract dollar amount ──────────────────────────────────
function extractAmount(text: string): { amount: number | null; amountMax: number | null } {
  const lower = text.toLowerCase()

  // Look for ranges: $X,XXX - $Y,YYY or $X,XXX to $Y,YYY
  const rangeMatch = text.match(/\$\s?([\d,]+(?:\.\d{2})?)\s*(?:[-–—]|to)\s*\$\s?([\d,]+(?:\.\d{2})?)/i)
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1].replace(/,/g, ""))
    const hi = parseFloat(rangeMatch[2].replace(/,/g, ""))
    if (lo > 0 && lo <= 500000 && hi > 0 && hi <= 500000) {
      return { amount: Math.min(lo, hi), amountMax: Math.max(lo, hi) }
    }
  }

  // Look for "up to $X" or "as much as $X"
  const upToMatch = text.match(/(?:up to|as much as|maximum of|max(?:imum)?:?)\s*\$\s?([\d,]+(?:\.\d{2})?)/i)
  if (upToMatch) {
    const val = parseFloat(upToMatch[1].replace(/,/g, ""))
    if (val > 0 && val <= 500000) return { amount: val, amountMax: val }
  }

  // Collect all dollar amounts near award-related keywords
  const awardContext = lower.match(/.{0,100}(?:award|amount|scholarship|prize|grant|stipend|value|worth|receive|earn|win).{0,100}/g) || []
  const allContext = awardContext.join(" ")

  const amounts: number[] = []
  const dollarMatches = allContext.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)
  for (const m of dollarMatches) {
    const val = parseFloat(m[1].replace(/,/g, ""))
    if (val >= 100 && val <= 500000) amounts.push(val)
  }

  // Also check for "X,XXX dollar" patterns
  const wordDollarMatches = allContext.matchAll(/([\d,]+)\s*(?:dollar|usd)/gi)
  for (const m of wordDollarMatches) {
    const val = parseFloat(m[1].replace(/,/g, ""))
    if (val >= 100 && val <= 500000) amounts.push(val)
  }

  if (amounts.length === 0) {
    // Broader search - any $ amount on the page
    const broadMatches = text.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)
    for (const m of broadMatches) {
      const val = parseFloat(m[1].replace(/,/g, ""))
      if (val >= 250 && val <= 500000) amounts.push(val)
    }
  }

  if (amounts.length === 0) return { amount: null, amountMax: null }

  // If multiple amounts, the largest one is likely the award
  const max = Math.max(...amounts)
  const min = Math.min(...amounts)
  if (amounts.length > 1 && min !== max && min >= 250) {
    return { amount: min, amountMax: max }
  }
  return { amount: max, amountMax: null }
}

// ── Extract deadline ───────────────────────────────────────
function extractDeadline(text: string): Date | null {
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
  }

  // Look near deadline-related keywords
  const deadlineContext = text.match(/.{0,60}(?:deadline|due date|due by|apply by|submit by|closes?|last day|application period|applications? (?:are )?due|must be received).{0,100}/gi) || []
  const contextStr = deadlineContext.join(" ")

  // Try "Month DD, YYYY" or "Month DD YYYY"
  const fullDateMatch = contextStr.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/i)
  if (fullDateMatch) {
    const month = months[fullDateMatch[1].toLowerCase()]
    const day = parseInt(fullDateMatch[2])
    const year = parseInt(fullDateMatch[3])
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2024 && year <= 2028) {
      return new Date(year, month, day)
    }
  }

  // Try MM/DD/YYYY or MM-DD-YYYY
  const numDateMatch = contextStr.match(/\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b/)
  if (numDateMatch) {
    const month = parseInt(numDateMatch[1]) - 1
    const day = parseInt(numDateMatch[2])
    const year = parseInt(numDateMatch[3])
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2024 && year <= 2028) {
      return new Date(year, month, day)
    }
  }

  // Broader search on full page text
  const broadMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/i)
  if (broadMatch) {
    const month = months[broadMatch[1].toLowerCase()]
    const day = parseInt(broadMatch[2])
    const year = parseInt(broadMatch[3])
    if (month !== undefined && day >= 1 && day <= 31 && year >= 2024 && year <= 2028) {
      return new Date(year, month, day)
    }
  }

  return null
}

// ── Extract GPA ────────────────────────────────────────────
function extractGpa(text: string): number | null {
  const gpaContext = text.match(/.{0,80}(?:gpa|grade point average|g\.p\.a\.|minimum gpa|gpa requirement|gpa of|cumulative gpa).{0,80}/gi) || []
  const contextStr = gpaContext.join(" ")

  // Match X.X or X.XX GPA values
  const gpaMatch = contextStr.match(/(\d\.\d{1,2})\s*(?:gpa|grade point|or higher|or above|minimum|\+|cumulative|on a|scale|unweighted|weighted)/i)
    || contextStr.match(/(?:gpa|grade point average|minimum gpa|gpa of|gpa requirement|at least a?)\s*:?\s*(\d\.\d{1,2})/i)
  if (gpaMatch) {
    const val = parseFloat(gpaMatch[1])
    if (val >= 2.0 && val <= 4.0) return val
  }
  return null
}

// ── Extract states ─────────────────────────────────────────
function extractStates(text: string): string[] {
  const lower = text.toLowerCase()

  // Check for "national" or "open to all states"
  if (/\b(?:national scholarship|open to all states|nationwide|all 50 states|any state)\b/i.test(text)) {
    return []
  }

  // Look near residency/location keywords
  const residencyContext = text.match(/.{0,100}(?:resid(?:ent|ency|e)|must (?:live|be from)|state|located in|students? (?:in|from)|open to students? in).{0,150}/gi) || []
  const contextStr = residencyContext.join(" ").toLowerCase()

  const found: string[] = []
  for (const state of US_STATES) {
    // Must appear as whole word in residency context
    const regex = new RegExp(`\\b${state.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
    if (regex.test(contextStr)) {
      found.push(state)
    }
  }

  // If too many states found (>10), probably just listing all states — treat as national
  if (found.length > 10) return []

  return found
}

// ── Extract citizenships ───────────────────────────────────
function extractCitizenships(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []

  if (/\b(?:u\.?s\.?\s*citizen|united states citizen|american citizen|citizenship required)\b/i.test(text)) {
    found.push("US Citizen")
  }
  if (/\b(?:permanent resident|green card|lawful permanent)\b/i.test(text)) {
    found.push("Permanent Resident")
  }
  if (/\bdaca\b/i.test(text)) {
    found.push("DACA")
  }
  if (/\b(?:international student|non.?citizen|any nationality|regardless of citizenship|open to international)\b/i.test(text)) {
    found.push("International")
  }

  return found
}

// ── Extract grade levels ───────────────────────────────────
function extractGradeLevels(text: string): number[] {
  const lower = text.toLowerCase()
  const levels: Set<number> = new Set()

  if (/\bhigh school\s*(?:senior|12th)/i.test(text)) levels.add(12)
  if (/\bhigh school\s*(?:junior|11th)/i.test(text)) levels.add(11)
  if (/\bhigh school\s*(?:sophomore|10th)/i.test(text)) levels.add(10)
  if (/\bhigh school\s*(?:freshman|9th)/i.test(text)) levels.add(9)
  if (/\bhigh school student/i.test(text) && levels.size === 0) {
    levels.add(9); levels.add(10); levels.add(11); levels.add(12)
  }
  if (/\bcollege\s*(?:freshman|first.?year)/i.test(text)) levels.add(13)
  if (/\bcollege\s*sophomore/i.test(text)) levels.add(14)
  if (/\bcollege\s*junior/i.test(text)) levels.add(15)
  if (/\bcollege\s*senior/i.test(text)) levels.add(16)
  if (/\bgraduate\s*student/i.test(text)) levels.add(17)
  if (/\bundergraduate/i.test(text) && levels.size === 0) {
    levels.add(13); levels.add(14); levels.add(15); levels.add(16)
  }
  if (/\bcurrent(?:ly enrolled)?\s*college\s*student/i.test(text) && levels.size === 0) {
    levels.add(13); levels.add(14); levels.add(15); levels.add(16)
  }

  return Array.from(levels).sort((a, b) => a - b)
}

// ── Extract fields of study ────────────────────────────────
function extractFieldsOfStudy(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []

  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!found.includes(field)) found.push(field)
        break
      }
    }
  }

  return found
}

// ── Extract ethnicities ────────────────────────────────────
function extractEthnicities(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []

  for (const [ethnicity, keywords] of Object.entries(ETHNICITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!found.includes(ethnicity)) found.push(ethnicity)
        break
      }
    }
  }

  return found
}

// ── Extract boolean flags ──────────────────────────────────
function extractBooleans(text: string) {
  const lower = text.toLowerCase()
  return {
    requiresFirstGen: /\b(?:first.?gen(?:eration)?|first in (?:their|your) family|neither parent.*(?:college|degree|bachelor)|parents? (?:did not|didn't|have not|haven't).*(?:college|degree))\b/i.test(text),
    requiresPell: /\b(?:pell\s*grant|pell.?eligible)\b/i.test(text),
    requiresFinancialNeed: /\b(?:financial need|need.?based|demonstrate(?:d|s)? (?:financial )?need|unmet financial need|economic hardship)\b/i.test(text),
  }
}

// ── Extract test scores ────────────────────────────────────
function extractTestScores(text: string): { minSat: number | null; minAct: number | null } {
  let minSat: number | null = null
  let minAct: number | null = null

  const satMatch = text.match(/(?:SAT|sat)\s*(?:score)?\s*(?:of|:|\s)\s*(\d{3,4})/i)
    || text.match(/(\d{3,4})\s*(?:on the|on)\s*SAT/i)
  if (satMatch) {
    const val = parseInt(satMatch[1])
    if (val >= 400 && val <= 1600) minSat = val
  }

  const actMatch = text.match(/(?:ACT|act)\s*(?:score)?\s*(?:of|:|\s)\s*(\d{2})/i)
    || text.match(/(\d{2})\s*(?:on the|on)\s*ACT/i)
  if (actMatch) {
    const val = parseInt(actMatch[1])
    if (val >= 10 && val <= 36) minAct = val
  }

  return { minSat, minAct }
}

// ── Extract description ────────────────────────────────────
function extractDescription(text: string, name: string): string | null {
  // Try to find a meaningful sentence about the scholarship
  const sentences = text.split(/[.!]\s+/).filter(s => s.length > 40 && s.length < 500)

  // Prefer sentences that mention the scholarship name or key terms
  const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const scored = sentences.map(s => {
    let score = 0
    const lower = s.toLowerCase()
    if (nameWords.some(w => lower.includes(w))) score += 3
    if (/\b(?:scholarship|award|grant|fellowship)\b/i.test(s)) score += 2
    if (/\b(?:designed|aims|provides|supports|encourages|recognizes|established)\b/i.test(s)) score += 2
    if (/\b(?:students?|applicants?|recipients?)\b/i.test(s)) score += 1
    if (/\b(?:click|subscribe|login|sign up|cookie|privacy|terms)\b/i.test(s)) score -= 5
    return { sentence: s.trim(), score }
  })

  scored.sort((a, b) => b.score - a.score)
  if (scored.length > 0 && scored[0].score >= 2) {
    const best = scored[0].sentence
    // Take up to 2 best sentences
    if (scored.length > 1 && scored[1].score >= 2) {
      return (best + ". " + scored[1].sentence).slice(0, 500)
    }
    return best.slice(0, 500)
  }

  return null
}

// ── Main extraction ────────────────────────────────────────
function extractAll(text: string, name: string) {
  const { amount, amountMax } = extractAmount(text)
  const deadline = extractDeadline(text)
  const minGpa = extractGpa(text)
  const states = extractStates(text)
  const citizenships = extractCitizenships(text)
  const gradeLevels = extractGradeLevels(text)
  const fieldsOfStudy = extractFieldsOfStudy(text)
  const ethnicities = extractEthnicities(text)
  const { requiresFirstGen, requiresPell, requiresFinancialNeed } = extractBooleans(text)
  const { minSat, minAct } = extractTestScores(text)
  const description = extractDescription(text, name)

  return {
    amount, amountMax, deadline, minGpa, states, citizenships,
    gradeLevels, fieldsOfStudy, ethnicities,
    requiresFirstGen, requiresPell, requiresFinancialNeed,
    minSat, minAct, description,
  }
}

// ── Process concurrently ───────────────────────────────────
async function processBatch(scholarships: Array<{ id: string; name: string; sourceUrl: string | null; url: string | null; description: string | null }>) {
  const results = await Promise.allSettled(
    scholarships.map(async (s) => {
      const url = s.sourceUrl || s.url
      if (!url) return { id: s.id, status: "skip" as const }

      const text = await fetchPageText(url)
      if (!text) return { id: s.id, status: "error" as const }

      const extracted = extractAll(text, s.name)

      // Only update fields that we found data for (don't overwrite existing with null)
      const updateData: Record<string, unknown> = {
        lastScrapedAt: new Date(),
        scrapeStatus: "CURRENT",
      }

      if (extracted.amount !== null) updateData.amount = extracted.amount
      if (extracted.amountMax !== null) updateData.amountMax = extracted.amountMax
      if (extracted.deadline !== null) updateData.deadline = extracted.deadline
      if (extracted.minGpa !== null) updateData.minGpa = extracted.minGpa
      if (extracted.states.length > 0) updateData.states = extracted.states
      if (extracted.citizenships.length > 0) updateData.citizenships = extracted.citizenships
      if (extracted.gradeLevels.length > 0) updateData.gradeLevels = extracted.gradeLevels
      if (extracted.fieldsOfStudy.length > 0) updateData.fieldsOfStudy = extracted.fieldsOfStudy
      if (extracted.ethnicities.length > 0) updateData.ethnicities = extracted.ethnicities
      if (extracted.requiresFirstGen) updateData.requiresFirstGen = true
      if (extracted.requiresPell) updateData.requiresPell = true
      if (extracted.requiresFinancialNeed) updateData.requiresFinancialNeed = true
      if (extracted.minSat !== null) updateData.minSat = extracted.minSat
      if (extracted.minAct !== null) updateData.minAct = extracted.minAct
      // Only overwrite stub descriptions
      if (extracted.description && s.description && s.description.includes("sourced from scholarship database")) {
        updateData.description = extracted.description
      } else if (extracted.description && !s.description) {
        updateData.description = extracted.description
      }

      await db.scholarship.update({ where: { id: s.id }, data: updateData })

      const fieldsUpdated = Object.keys(updateData).filter(k => k !== "lastScrapedAt" && k !== "scrapeStatus").length
      return { id: s.id, status: "ok" as const, fieldsUpdated }
    })
  )

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value
    return { id: scholarships[i].id, status: "error" as const }
  })
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  const CONCURRENCY = 15
  const BATCH_SIZE = CONCURRENCY

  // Get all scholarships that need enrichment
  const scholarships = await db.scholarship.findMany({
    where: {
      OR: [
        { scrapeStatus: "NEEDS_REVIEW" },
        { amount: null, OR: [{ sourceUrl: { not: null } }, { url: { not: null } }] },
      ],
    },
    select: { id: true, name: true, sourceUrl: true, url: true, description: true },
    orderBy: { name: "asc" },
  })

  console.log(`\nFound ${scholarships.length} scholarships to enrich\n`)

  let processed = 0
  let enriched = 0
  let errors = 0
  let skipped = 0
  const startTime = Date.now()

  for (let i = 0; i < scholarships.length; i += BATCH_SIZE) {
    const batch = scholarships.slice(i, i + BATCH_SIZE)
    const results = await processBatch(batch)

    for (const r of results) {
      processed++
      if (!r) { errors++; continue }
      if (r.status === "ok" && "fieldsUpdated" in r && r.fieldsUpdated > 0) enriched++
      else if (r.status === "error") errors++
      else skipped++
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1)
    const eta = ((scholarships.length - processed) / parseFloat(rate)).toFixed(0)
    process.stdout.write(`\r  Progress: ${processed}/${scholarships.length} | Enriched: ${enriched} | Errors: ${errors} | ${rate}/sec | ETA: ${eta}s   `)
  }

  console.log(`\n\n Enrichment Complete`)
  console.log(`================================`)
  console.log(`Total processed:  ${processed}`)
  console.log(`Enriched:         ${enriched}`)
  console.log(`Errors:           ${errors}`)
  console.log(`Skipped (no URL): ${skipped}`)
  console.log(`Time:             ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
  console.log()

  await db.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
