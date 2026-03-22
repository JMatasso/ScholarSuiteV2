// Official AP and IB course catalogs for autocomplete

export const AP_COURSES = [
  // Capstone
  "AP Research",
  "AP Seminar",
  // Arts
  "AP African American Studies",
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP Drawing",
  "AP Art History",
  "AP Music Theory",
  // English
  "AP English Language and Composition",
  "AP English Literature and Composition",
  // History & Social Sciences
  "AP Comparative Government and Politics",
  "AP European History",
  "AP Human Geography",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Psychology",
  "AP United States Government and Politics",
  "AP United States History",
  "AP World History: Modern",
  // Math & Computer Science
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Precalculus",
  "AP Statistics",
  // Sciences
  "AP Biology",
  "AP Chemistry",
  "AP Environmental Science",
  "AP Physics 1: Algebra-Based",
  "AP Physics 2: Algebra-Based",
  "AP Physics C: Electricity and Magnetism",
  "AP Physics C: Mechanics",
  // World Languages
  "AP Chinese Language and Culture",
  "AP French Language and Culture",
  "AP German Language and Culture",
  "AP Italian Language and Culture",
  "AP Japanese Language and Culture",
  "AP Latin",
  "AP Spanish Language and Culture",
  "AP Spanish Literature and Culture",
]

export const IB_COURSES = [
  // Group 1: Studies in Language and Literature
  "IB Language A: Literature",
  "IB Language A: Language and Literature",
  "IB Literature and Performance",
  // Group 2: Language Acquisition
  "IB Language B: French",
  "IB Language B: Spanish",
  "IB Language B: German",
  "IB Language B: Chinese",
  "IB Language B: Japanese",
  "IB Language B: Korean",
  "IB Language B: Italian",
  "IB Language B: Arabic",
  "IB Language B: Portuguese",
  "IB Language B: Russian",
  "IB Language ab Initio",
  "IB Classical Languages",
  // Group 3: Individuals and Societies
  "IB Business Management",
  "IB Economics",
  "IB Geography",
  "IB Global Politics",
  "IB History",
  "IB Information Technology in a Global Society",
  "IB Philosophy",
  "IB Psychology",
  "IB Social and Cultural Anthropology",
  "IB World Religions",
  // Group 4: Sciences
  "IB Biology",
  "IB Chemistry",
  "IB Computer Science",
  "IB Design Technology",
  "IB Environmental Systems and Societies",
  "IB Physics",
  "IB Sports, Exercise, and Health Science",
  // Group 5: Mathematics
  "IB Mathematics: Analysis and Approaches",
  "IB Mathematics: Applications and Interpretation",
  // Group 6: The Arts
  "IB Dance",
  "IB Film",
  "IB Music",
  "IB Theatre",
  "IB Visual Arts",
  // Core
  "IB Theory of Knowledge",
  "IB Extended Essay",
]

/** Subject auto-detection from course name */
const SUBJECT_MAP: [RegExp, string][] = [
  [/calculus|statistics|math|precalculus|algebra|geometry/i, "Math"],
  [/english|literature|language.*composition|writing/i, "English"],
  [/biology|chemistry|physics|environmental|science|anatomy/i, "Science"],
  [/history|government|politics|economics|geography|psychology|sociology|anthropology/i, "Social Studies"],
  [/french|spanish|german|chinese|japanese|korean|latin|italian|arabic|portuguese|russian|language\s*b|language\s*ab/i, "Foreign Language"],
  [/art|drawing|music|dance|film|theatre|visual|design|3-d|2-d/i, "Arts"],
  [/computer|technology|information/i, "Technology"],
  [/physical education|health|sports|exercise/i, "Physical Education"],
]

export function detectSubject(courseName: string): string {
  for (const [pattern, subject] of SUBJECT_MAP) {
    if (pattern.test(courseName)) return subject
  }
  return "Other"
}
