// ─── JOURNEY STAGE LABELS ────────────────────────────────────
// Maps the JourneyStage enum to the advisor's 4-phase model

export const JOURNEY_STAGE_LABELS: Record<string, { label: string; shortLabel: string; description: string; gradeRange: string }> = {
  EARLY_EXPLORATION: {
    label: "Phase 1: Foundation",
    shortLabel: "Foundation",
    description: "Building your academic profile, gathering documents, and exploring options",
    gradeRange: "Freshman / Sophomore",
  },
  ACTIVE_PREP: {
    label: "Phase 2: Testing & Prep",
    shortLabel: "Testing & Prep",
    description: "SAT/ACT prep, scholarship research, and essay drafting",
    gradeRange: "Junior",
  },
  APPLICATION_PHASE: {
    label: "Phase 3: Application Sprint",
    shortLabel: "Application Sprint",
    description: "Submitting scholarship and college applications",
    gradeRange: "Summer / Senior Fall",
  },
  POST_ACCEPTANCE: {
    label: "Phase 4: Transition & Networking",
    shortLabel: "Transition",
    description: "College decision, financial planning, and building your network",
    gradeRange: "Senior Spring",
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
  // Introduction
  { title: "Fill Out Intro Form", phase: "INTRODUCTION", priority: "HIGH", order: 1, description: "Complete the student intake form with your personal, academic, and background information." },
  { title: "Introductory Presentation", phase: "INTRODUCTION", priority: "HIGH", order: 2, description: "Attend the introductory session to learn about the program and your roadmap." },

  // Phase 1
  { title: "Resume Rough Draft", phase: "PHASE_1", priority: "MEDIUM", order: 3, documentFolder: "Resumes", description: "Create a first draft of your resume. Upload it to your Resumes folder." },
  { title: "Visit College Counselor (see details)", phase: "PHASE_1", priority: "HIGH", order: 4, description: "Schedule and attend a meeting with your high school college counselor." },
  { title: "Request 3 Letters of Recommendation", phase: "PHASE_1", priority: "MEDIUM", order: 5, documentFolder: "Letters of Recommendation", description: "Ask 3 teachers, mentors, or supervisors for recommendation letters." },
  { title: "Obtain GPA Transcripts", phase: "PHASE_1", priority: "MEDIUM", order: 6, documentFolder: "Transcripts", description: "Request official or unofficial transcripts from your school and upload them." },
  { title: "Finish Activity Brag Sheet", phase: "PHASE_1", priority: "MEDIUM", order: 7, documentFolder: "Activities", description: "Complete your activity/brag sheet with all extracurriculars, volunteer work, and achievements." },
  { title: "SAT/ACT Scores", phase: "PHASE_1", priority: "MEDIUM", order: 8, documentFolder: "Test Scores & FAFSA", description: "Upload your SAT or ACT score reports." },
  { title: "Volunteer Lists/Hours", phase: "PHASE_1", priority: "MEDIUM", order: 9, documentFolder: "Activities", description: "Document all volunteer hours with organization names, dates, and hours." },
  { title: "Obtain Professional Headshot", phase: "PHASE_1", priority: "MEDIUM", order: 10, documentFolder: "Professional Headshots", description: "Get a professional headshot photo for scholarship and college applications." },
  { title: "Sign-Up for Scholarship Databases", phase: "PHASE_1", priority: "MEDIUM", order: 11, description: "Create accounts on scholarship search platforms (Fastweb, Scholarships.com, etc.)." },
  { title: "Add Documents to Google Drive", phase: "PHASE_1", priority: "MEDIUM", order: 12, documentFolder: "ScholarShape Resources", description: "Upload all gathered documents to your shared folder." },

  // Phase 2
  { title: "First Progress Check-In", phase: "PHASE_2", priority: "HIGH", order: 13, description: "Attend your first progress review meeting with your consultant." },
  { title: "Upload Letters of Recommendation", phase: "PHASE_2", priority: "MEDIUM", order: 14, documentFolder: "Letters of Recommendation", description: "Upload the recommendation letters you've received." },
  { title: "Find 5 Scholarships", phase: "PHASE_2", priority: "MEDIUM", order: 15, documentFolder: "Applications", description: "Research and identify 5 scholarships you qualify for and plan to apply." },
  { title: "Financial Need Essay Draft", phase: "PHASE_2", priority: "MEDIUM", order: 16, documentFolder: "Essays", description: "Write a first draft of your financial need essay. Post here or in the Drive." },
  { title: "Save Acceptance Emails", phase: "PHASE_2", priority: "MEDIUM", order: 17, documentFolder: "Acceptance Letters", description: "Save any college acceptance emails or letters you receive." },

  // Ongoing
  { title: "February Check-In", phase: "ONGOING", priority: "HIGH", order: 18, description: "Monthly check-in. Submit at least 1 scholarship application before this meeting." },
  { title: "March Check-In", phase: "ONGOING", priority: "HIGH", order: 19, description: "Monthly check-in via video/phone call. Review progress and next steps." },
  { title: "April Check-In", phase: "ONGOING", priority: "HIGH", order: 20, description: "Monthly check-in via video/phone call. Review progress and next steps." },
  { title: "Senior Awards Night (If Applicable)", phase: "ONGOING", priority: "HIGH", order: 21, description: "Attend your school's senior awards night. Time to celebrate your achievements!" },

  // Final Tasks
  { title: "End of Semester Meeting", phase: "FINAL", priority: "HIGH", order: 22, description: "Final meeting via video/phone call to review the semester and plan ahead." },
  { title: "Submit Review Form", phase: "FINAL", priority: "HIGH", order: 23, description: "Complete the program review form. Wait until the end of the program." },
  { title: "Send College Info to Scholarships", phase: "FINAL", priority: "HIGH", order: 24, description: "Notify scholarship providers of your college enrollment decision. Wait until the end." },
] as const
