// ─── JOURNEY STAGE LABELS ────────────────────────────────────
// Maps the JourneyStage enum to individual school years

export const JOURNEY_STAGE_LABELS: Record<string, { label: string; shortLabel: string; caption: string; description: string; gradeRange: string }> = {
  EARLY_EXPLORATION: {
    label: "Freshman & Sophomore",
    shortLabel: "Freshman & Sophomore",
    caption: "Foundation",
    description: "Building your academic foundation, exploring interests, and starting your profile",
    gradeRange: "9th – 10th Grade",
  },
  ACTIVE_PREP: {
    label: "Junior Year",
    shortLabel: "Junior Year",
    caption: "Testing & Prep",
    description: "Deepening involvement, starting test prep, and researching scholarships",
    gradeRange: "11th Grade",
  },
  APPLICATION_PHASE: {
    label: "Senior Summer & Fall",
    shortLabel: "Senior Summer & Fall",
    caption: "Application Sprint",
    description: "Submitting scholarship and college applications",
    gradeRange: "Summer before 12th / Fall 12th",
  },
  POST_ACCEPTANCE: {
    label: "Senior Spring",
    shortLabel: "Senior Spring",
    caption: "Transition",
    description: "Award decisions, finalizing college choice, and transitioning to college",
    gradeRange: "Spring 12th Grade",
  },
}

export const JOURNEY_STAGES_ORDERED = [
  "EARLY_EXPLORATION",
  "ACTIVE_PREP",
  "APPLICATION_PHASE",
  "POST_ACCEPTANCE",
] as const

// Maps TaskPhase values to JourneyStage values
export const TASK_PHASE_TO_JOURNEY_STAGE: Record<string, string> = {
  INTRODUCTION: "EARLY_EXPLORATION",
  PHASE_1: "EARLY_EXPLORATION",
  PHASE_2: "ACTIVE_PREP",
  ONGOING: "APPLICATION_PHASE",
  FINAL: "POST_ACCEPTANCE",
}

// Reverse: JourneyStage → TaskPhase[] for filtering template items
export const JOURNEY_STAGE_TO_TASK_PHASES: Record<string, string[]> = {
  EARLY_EXPLORATION: ["INTRODUCTION", "PHASE_1"],
  ACTIVE_PREP: ["PHASE_2"],
  APPLICATION_PHASE: ["ONGOING"],
  POST_ACCEPTANCE: ["FINAL"],
}

export const SERVICE_TIER_LABELS: Record<string, string> = {
  INTRODUCTORY: "Introductory",
  FLAT_RATE: "Flat Rate",
  ONGOING: "Ongoing Advisory",
}

// ─── DOCUMENT FOLDERS ────────────────────────────────────────
// Standard document folders created for every student
export const DOCUMENT_FOLDERS = [
  "Transcripts",
  "Test Scores & FAFSA",
  "Resumes",
  "Professional Headshots",
  "Letters of Recommendation",
  "Awards & Projects",
  "Applications",
  "Activities",
  "ScholarShape Resources",
  "Essays",
  "Application Documents",
  "Acceptance Letters",
] as const

export type DocumentFolder = (typeof DOCUMENT_FOLDERS)[number]

// Default task template items — auto-assigned to every new student
export const DEFAULT_TEMPLATE_ITEMS = [
  // ── Introduction ──────────────────────────────────────────
  { title: "Fill Out Intro Form", phase: "INTRODUCTION", track: "GENERAL", priority: "HIGH", order: 1, description: "Complete the student intake form with your personal, academic, and background information.", requiresUpload: false },
  { title: "Introductory Presentation", phase: "INTRODUCTION", track: "GENERAL", priority: "HIGH", order: 2, description: "Attend the introductory session to learn about the program and your roadmap.", requiresUpload: false },

  // ── Phase 1: Scholarship Preparation (Things to Prepare) ─
  { title: "Professional Resume", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "HIGH", order: 3, documentFolder: "Resumes", description: "Create a polished, professional resume for scholarship applications. Upload here when ready.", requiresUpload: true },
  { title: "Professional Headshot", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 4, documentFolder: "Professional Headshots", description: "Get a professional headshot photo for scholarship and college applications.", requiresUpload: true },
  { title: "IB/AP Test Scores", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 5, documentFolder: "Test Scores & FAFSA", description: "Upload your IB or AP exam score reports.", requiresUpload: true },
  { title: "SAT/ACT Test Scores", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "HIGH", order: 6, documentFolder: "Test Scores & FAFSA", description: "Upload your SAT or ACT score reports.", requiresUpload: true },
  { title: "Obtain 3-4 Letters of Recommendation", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "HIGH", order: 7, documentFolder: "Letters of Recommendation", description: "Ask 3-4 teachers, mentors, or supervisors for recommendation letters and upload them here.", requiresUpload: true },
  { title: "Unofficial Transcripts", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 8, documentFolder: "Transcripts", description: "Request unofficial transcripts from your school and upload them.", requiresUpload: true },
  { title: "Official Transcripts", phase: "PHASE_2", track: "SCHOLARSHIP", priority: "HIGH", order: 9, documentFolder: "Transcripts", description: "Request official sealed transcripts from your school and upload a copy.", requiresUpload: true },
  { title: "Scholarship Data Sheet", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 10, documentFolder: "Application Documents", description: "Complete and upload your scholarship data sheet with personal, academic, and financial details.", requiresUpload: true },
  { title: "Master List of Accomplishments", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 11, documentFolder: "Awards & Projects", description: "Compile a comprehensive list of all your accomplishments, awards, activities, and leadership roles.", requiresUpload: true },

  // ── Phase 1: College Prep ─────────────────────────────────
  { title: "Visit College Counselor", phase: "PHASE_1", track: "COLLEGE_PREP", priority: "HIGH", order: 12, description: "Schedule and attend a meeting with your high school college counselor.", requiresUpload: false },
  { title: "Sign Up for Scholarship Databases", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 13, description: "Create accounts on scholarship search platforms (Fastweb, Scholarships.com, etc.).", requiresUpload: false },
  { title: "Finish Activity Brag Sheet", phase: "PHASE_1", track: "SCHOLARSHIP", priority: "MEDIUM", order: 14, documentFolder: "Activities", description: "Complete your activity/brag sheet with all extracurriculars, volunteer work, and achievements.", requiresUpload: true },

  // ── Phase 2: Deeper Prep ──────────────────────────────────
  { title: "First Progress Check-In", phase: "PHASE_2", track: "GENERAL", priority: "HIGH", order: 15, description: "Attend your first progress review meeting with your consultant.", requiresUpload: false },
  { title: "Find 5 Scholarships to Apply To", phase: "PHASE_2", track: "SCHOLARSHIP", priority: "MEDIUM", order: 16, description: "Research and identify 5 scholarships you qualify for and plan to apply.", requiresUpload: false },
  { title: "Financial Need Essay Draft", phase: "PHASE_2", track: "SCHOLARSHIP", priority: "MEDIUM", order: 17, documentFolder: "Essays", description: "Write a first draft of your financial need essay.", requiresUpload: true },

  // ── Ongoing: Application Sprint ───────────────────────────
  { title: "Monthly Check-In (February)", phase: "ONGOING", track: "GENERAL", priority: "HIGH", order: 18, description: "Monthly check-in. Submit at least 1 scholarship application before this meeting.", requiresUpload: false },
  { title: "Monthly Check-In (March)", phase: "ONGOING", track: "GENERAL", priority: "HIGH", order: 19, description: "Monthly check-in via video/phone call. Review progress and next steps.", requiresUpload: false },
  { title: "Monthly Check-In (April)", phase: "ONGOING", track: "GENERAL", priority: "HIGH", order: 20, description: "Monthly check-in via video/phone call. Review progress and next steps.", requiresUpload: false },
  { title: "Senior Awards Night (If Applicable)", phase: "ONGOING", track: "GENERAL", priority: "HIGH", order: 21, description: "Attend your school's senior awards night. Time to celebrate your achievements!", requiresUpload: false },

  // ── Final Steps ───────────────────────────────────────────
  { title: "End of Semester Meeting", phase: "FINAL", track: "GENERAL", priority: "HIGH", order: 22, description: "Final meeting via video/phone call to review the semester and plan ahead.", requiresUpload: false },
  { title: "Submit Review Form", phase: "FINAL", track: "GENERAL", priority: "HIGH", order: 23, description: "Complete the program review form. Wait until the end of the program.", requiresUpload: false },
  { title: "Send College Info to Scholarships", phase: "FINAL", track: "SCHOLARSHIP", priority: "HIGH", order: 24, description: "Notify scholarship providers of your college enrollment decision.", requiresUpload: false },
] as const

// ─── JOURNEY PHASE DETAIL CONTENT ────────────────────────────
// Educational content shown when a phase is expanded on the timeline

export type MonthStatus = "inactive" | "prep" | "active" | "peak" | "disbursement" | "payment"

export interface PhaseCalendarMonth {
  month: string
  shortMonth: string
  status: MonthStatus
}

export interface PhaseChecklistItem {
  id: string
  label: string
  parentLabel: string
}

export interface PhaseDetailContent {
  stage: string
  studentOverview: string
  parentOverview: string
  checklist: PhaseChecklistItem[]
  calendar: PhaseCalendarMonth[]
  calendarLegend: string
  parentCalendarLegend: string
}

const MONTHS_TEMPLATE: Pick<PhaseCalendarMonth, "month" | "shortMonth">[] = [
  { month: "August", shortMonth: "Aug" },
  { month: "September", shortMonth: "Sep" },
  { month: "October", shortMonth: "Oct" },
  { month: "November", shortMonth: "Nov" },
  { month: "December", shortMonth: "Dec" },
  { month: "January", shortMonth: "Jan" },
  { month: "February", shortMonth: "Feb" },
  { month: "March", shortMonth: "Mar" },
  { month: "April", shortMonth: "Apr" },
  { month: "May", shortMonth: "May" },
  { month: "June", shortMonth: "Jun" },
  { month: "July", shortMonth: "Jul" },
]

export const JOURNEY_PHASE_CONTENT: PhaseDetailContent[] = [
  {
    stage: "EARLY_EXPLORATION",
    studentOverview: "Freshman and sophomore year is about laying the groundwork. Focus on building strong study habits, maintaining a solid GPA, and exploring extracurriculars that genuinely interest you. By sophomore year, start pursuing leadership roles and deepening your involvement. Scholarship committees evaluate your full high school record, so the work you do now matters. Start a filing system for awards, transcripts, and certificates, build relationships with teachers, and begin exploring what scholarships look for.",
    parentOverview: "These first two years are the foundation for everything that follows. Help your student establish good academic habits, encourage exploration of activities and interests, and start organizing important documents. By sophomore year, help them think about leadership roles and start exploring scholarship databases together. While applications are still ahead, the profile they build now is what committees will evaluate.",
    checklist: [
      { id: "f1", label: "Establish consistent study habits and GPA goals", parentLabel: "Help your student establish study habits and GPA goals" },
      { id: "f2", label: "Join 2–3 extracurricular activities that interest you", parentLabel: "Encourage your student to join 2–3 extracurricular activities" },
      { id: "f3", label: "Start community service or volunteer work", parentLabel: "Help your student find community service opportunities" },
      { id: "f4", label: "Create a filing system for transcripts, awards, and certificates", parentLabel: "Set up a filing system for your student's documents" },
      { id: "f5", label: "Meet with your school counselor to discuss your 4-year course plan", parentLabel: "Schedule a meeting with the school counselor about course planning" },
      { id: "f6", label: "Create a dedicated email address for college and scholarship use", parentLabel: "Help your student create a dedicated email for college correspondence" },
      { id: "f7", label: "Start tracking your activities, hours, and accomplishments", parentLabel: "Encourage your student to track activities and accomplishments" },
      { id: "f8", label: "Research what scholarships look for in applicants", parentLabel: "Research scholarship requirements together with your student" },
      { id: "f9", label: "Pursue leadership roles in your activities by sophomore year", parentLabel: "Encourage your student to seek leadership roles" },
      { id: "f10", label: "Take a practice SAT or ACT to establish a baseline", parentLabel: "Help your student schedule a practice SAT/ACT" },
      { id: "f11", label: "Start a resume rough draft with all activities and achievements", parentLabel: "Help your student draft their first resume" },
      { id: "f12", label: "Research AP/honors courses for junior year", parentLabel: "Discuss AP/honors course options for next year" },
    ],
    calendar: MONTHS_TEMPLATE.map(m => ({ ...m, status: "inactive" as MonthStatus })),
    calendarLegend: "No major scholarship deadlines yet — focus on building your profile. A few early-access essay contests and local awards may open in spring.",
    parentCalendarLegend: "No major scholarship deadlines this year. Your student should focus on academics and activities. Some local community awards and essay contests may be available in spring.",
  },
  {
    stage: "ACTIVE_PREP",
    studentOverview: "Junior year is when the scholarship search gets serious. Take the SAT/ACT, register for AP exams, and start building a target list of 50+ scholarships. Request recommendation letters early — teachers get overwhelmed by spring. Draft your core essay themes (financial need, leadership, community impact) since most scholarships ask for variations of the same stories. Sign up for scholarship databases, attend college fairs, and schedule campus visits. This is also the time to prepare FAFSA documents.",
    parentOverview: "Junior year is a pivotal year. Your student will be taking standardized tests, visiting colleges, and beginning serious scholarship research. Help them stay organized with a scholarship tracker, encourage early recommendation letter requests, and support essay brainstorming. Start gathering tax documents for FAFSA. The work done this year directly feeds into senior year applications.",
    checklist: [
      { id: "j1", label: "Take the SAT/ACT (fall and/or spring)", parentLabel: "Help your student register for and prepare for the SAT/ACT" },
      { id: "j2", label: "Register for AP exams", parentLabel: "Ensure your student is registered for AP exams" },
      { id: "j3", label: "Request 3–4 recommendation letters from teachers/mentors", parentLabel: "Remind your student to request recommendation letters early" },
      { id: "j4", label: "Sign up for scholarship search databases (Fastweb, Scholarships.com, etc.)", parentLabel: "Help your student create accounts on scholarship search platforms" },
      { id: "j5", label: "Build a scholarship target list of 50+ opportunities", parentLabel: "Help your student build a scholarship target list" },
      { id: "j6", label: "Draft core essay themes (financial need, leadership, community)", parentLabel: "Support your student's essay brainstorming and drafts" },
      { id: "j7", label: "Schedule and attend college visits", parentLabel: "Plan and attend college visits together" },
      { id: "j8", label: "Attend college fairs and information sessions", parentLabel: "Attend college fairs with your student" },
      { id: "j9", label: "Complete FAFSA preparation (gather tax documents, FSA ID)", parentLabel: "Gather tax documents and create FSA IDs for FAFSA" },
      { id: "j10", label: "Apply to rolling/early scholarships as you find them", parentLabel: "Encourage your student to apply to scholarships with rolling deadlines" },
      { id: "j11", label: "Finalize your activity brag sheet with updated hours and roles", parentLabel: "Help your student update their activity record" },
      { id: "j12", label: "Explore summer programs, internships, or enrichment opportunities", parentLabel: "Research summer enrichment programs together" },
    ],
    calendar: MONTHS_TEMPLATE.map(m => {
      if (["Mar", "Apr", "May"].includes(m.shortMonth)) return { ...m, status: "prep" as MonthStatus }
      return { ...m, status: "inactive" as MonthStatus }
    }),
    calendarLegend: "A small window of early scholarships opens in spring. Use this time to finalize essays, collect recommendation letters, and build your scholarship target list for the summer application push.",
    parentCalendarLegend: "Some early scholarship opportunities appear in spring. This is a great time to finalize essay drafts and build a scholarship target list for the summer ahead.",
  },
  {
    stage: "APPLICATION_PHASE",
    studentOverview: "The summer before senior year and fall semester is the application sprint. Submit FAFSA on October 1st, complete your CSS Profile, and hit scholarship applications hard. Use summer to polish essays, finalize your resume, and submit early-deadline applications. Once school starts, aim for 2–5 scholarship applications per week alongside your college applications. Apply to local and community scholarships too — they often have less competition. Keep your grades up — scholarships can be rescinded for GPA drops.",
    parentOverview: "This is the most intense period. Help your student submit FAFSA immediately on October 1st, stay on top of scholarship deadlines, and manage the college application process. Use the summer to polish essays and get ahead. Once fall hits, the pace picks up — help your student maintain a steady weekly application pace while balancing school and extracurriculars.",
    checklist: [
      { id: "sf1", label: "Submit FAFSA on October 1st", parentLabel: "Submit FAFSA together on October 1st" },
      { id: "sf2", label: "Complete CSS Profile (if required by your colleges)", parentLabel: "Complete the CSS Profile if required" },
      { id: "sf3", label: "Polish and finalize your core essays over summer", parentLabel: "Help your student finalize essays before school starts" },
      { id: "sf4", label: "Submit early-deadline scholarship applications", parentLabel: "Track early-deadline scholarships and encourage timely submission" },
      { id: "sf5", label: "Submit 2–5 scholarship applications per week during fall", parentLabel: "Encourage 2–5 applications per week during fall semester" },
      { id: "sf6", label: "Apply to local and community scholarships (less competition)", parentLabel: "Research local and community scholarships — they often have less competition" },
      { id: "sf7", label: "Submit college applications alongside scholarship apps", parentLabel: "Ensure college applications are submitted on time" },
      { id: "sf8", label: "Attend scholarship workshops and financial aid info sessions", parentLabel: "Attend financial aid info sessions with your student" },
      { id: "sf9", label: "Maintain your GPA — scholarships can be rescinded", parentLabel: "Remind your student that scholarships can be rescinded for GPA drops" },
      { id: "sf10", label: "Apply to 30+ scholarships by the end of fall", parentLabel: "Help your student maintain a steady application pace" },
    ],
    calendar: MONTHS_TEMPLATE.map(m => {
      if (["Jun", "Jul"].includes(m.shortMonth)) return { ...m, status: "prep" as MonthStatus }
      if (["Aug", "Sep", "Oct", "Nov", "Dec"].includes(m.shortMonth)) return { ...m, status: "active" as MonthStatus }
      if (["Jan", "Feb", "Mar"].includes(m.shortMonth)) return { ...m, status: "peak" as MonthStatus }
      return { ...m, status: "inactive" as MonthStatus }
    }),
    calendarLegend: "Summer is for essay prep and early applications. Application season ramps up in August and runs through the fall. January through March is the peak deadline window for many national scholarships.",
    parentCalendarLegend: "Summer is prep time — essays, resumes, and early apps. Fall is active application season. January through March sees the most deadlines. Help your student stay on a weekly schedule.",
  },
  {
    stage: "POST_ACCEPTANCE",
    studentOverview: "Senior spring is the finish line. Continue applying to spring-deadline scholarships — many students stop too early and miss thousands in awards. As acceptances and award letters arrive, compare financial aid packages carefully. Accept or decline offers promptly, send thank-you letters to scholarship providers, and coordinate disbursements with your college's financial aid office. June and July is when scholarship checks are issued, and August is when payments reach your college.",
    parentOverview: "Senior spring is when everything comes together. Help your student continue submitting applications to spring-deadline scholarships — don't stop early. As award letters arrive, compare packages across colleges and consider appeals if needed. Coordinate with the financial aid office on disbursements and verify that scholarship payments reach the college by August.",
    checklist: [
      { id: "sp1", label: "Continue applying to spring-deadline scholarships", parentLabel: "Encourage your student to keep applying through spring" },
      { id: "sp2", label: "Compare financial aid award packages across colleges", parentLabel: "Compare financial aid packages across colleges and consider appeals" },
      { id: "sp3", label: "Accept/decline scholarship offers and send thank-you letters", parentLabel: "Help your student respond to scholarship offers promptly" },
      { id: "sp4", label: "Finalize your college enrollment decision", parentLabel: "Support your student's final college decision" },
      { id: "sp5", label: "Send college enrollment info to scholarship providers", parentLabel: "Ensure scholarship providers have your student's college info" },
      { id: "sp6", label: "Coordinate disbursements with your college's financial aid office", parentLabel: "Contact the financial aid office to coordinate disbursements" },
      { id: "sp7", label: "Appeal financial aid if your package seems low", parentLabel: "Consider appealing financial aid if the package seems low" },
      { id: "sp8", label: "Attend senior awards night (if applicable)", parentLabel: "Attend your student's senior awards night" },
      { id: "sp9", label: "Submit the program review form", parentLabel: "Help your student complete the program review form" },
      { id: "sp10", label: "Maintain your GPA through graduation", parentLabel: "Remind your student to maintain GPA through graduation" },
    ],
    calendar: MONTHS_TEMPLATE.map(m => {
      if (["Jan", "Feb", "Mar", "Apr", "May"].includes(m.shortMonth)) return { ...m, status: "peak" as MonthStatus }
      if (["Jun", "Jul"].includes(m.shortMonth)) return { ...m, status: "disbursement" as MonthStatus }
      if (m.shortMonth === "Aug") return { ...m, status: "payment" as MonthStatus }
      return { ...m, status: "inactive" as MonthStatus }
    }),
    calendarLegend: "January through May still has scholarship deadlines — keep applying! June and July is disbursement season when scholarship checks are issued. August is when payments make it to your college.",
    parentCalendarLegend: "Spring still has deadlines — don't let your student stop early. June–July is when scholarships disburse funds. August is when payments reach the college. Verify amounts with the financial aid office.",
  },
]
