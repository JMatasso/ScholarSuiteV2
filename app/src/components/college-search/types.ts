export interface College {
  id: string
  name: string
  alias?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  logoUrl?: string | null
  type?: string | null
  locale?: string | null
  hbcu: boolean
  testOptional: boolean
  // Admissions
  acceptanceRate?: number | null
  satAvg?: number | null
  sat25?: number | null
  sat75?: number | null
  actAvg?: number | null
  act25?: number | null
  act75?: number | null
  // Cost
  inStateTuition?: number | null
  outOfStateTuition?: number | null
  roomAndBoard?: number | null
  booksSupplies?: number | null
  // Size
  enrollment?: number | null
  undergradPop?: number | null
  studentFacultyRatio?: number | null
  // Outcomes
  gradRate4yr?: number | null
  gradRate6yr?: number | null
  retentionRate?: number | null
  medianEarnings6yr?: number | null
  medianEarnings10yr?: number | null
  medianDebt?: number | null
  // Financial Aid
  pellPct?: number | null
  fedLoanPct?: number | null
  // Programs
  topPrograms?: unknown
  // Attributes
  religiousAffiliation?: string | null
  menOnly?: boolean
  womenOnly?: boolean
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington D.C.",
}

export const COLLEGE_TYPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE_NONPROFIT", label: "Private (Nonprofit)" },
  { value: "PRIVATE_FORPROFIT", label: "Private (For-Profit)" },
]

export const CLASSIFICATIONS = [
  { value: "REACH", label: "Reach", color: "bg-rose-100 text-rose-700" },
  { value: "MATCH", label: "Match", color: "bg-amber-100 text-amber-700" },
  { value: "LIKELY", label: "Likely", color: "bg-blue-100 text-blue-700" },
  { value: "SAFETY", label: "Safety", color: "bg-emerald-100 text-emerald-700" },
]
