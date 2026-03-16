/**
 * Rule-based chatbot — handles common questions without AI.
 * Returns null if no rule matches (caller should escalate to RAG/AI).
 */

interface RuleResult {
  reply: string
  sources?: { type: string; id: string; label: string }[]
}

interface RulePattern {
  patterns: RegExp[]
  handler: (query: string, context: RuleContext) => string
}

interface RuleContext {
  userName: string
  role: "STUDENT" | "PARENT"
}

const rules: RulePattern[] = [
  // Greetings
  {
    patterns: [
      /^(hi|hello|hey|howdy|sup|what'?s up|good (morning|afternoon|evening))[\s!?.]*$/i,
    ],
    handler: (_q, ctx) =>
      `Hi ${ctx.userName}! I'm your ScholarSuite assistant. Here are some things I can help with:\n\n` +
      `- **Scholarships** — "What scholarships am I eligible for?" or "Show me upcoming deadlines"\n` +
      `- **Tasks** — "What tasks are due soon?" or "Show my open tasks"\n` +
      `- **Essays** — "What's the status of my essays?"\n` +
      `- **Meetings** — "Do I have any upcoming meetings?"\n` +
      `- **Profile** — "What's my GPA?" or "Show my profile info"\n` +
      `- **Activities** — "List my extracurriculars"\n` +
      `- **Financial** — "Show my financial plan"\n\n` +
      `Just ask a question and I'll search your data!`,
  },

  // Help / what can you do
  {
    patterns: [
      /what can you (do|help|assist)/i,
      /^help$/i,
      /how (do|can) (i|you) use/i,
      /what (are|do) you/i,
    ],
    handler: (_q, ctx) =>
      `I can help you with:\n\n` +
      `**Your Data:**\n` +
      `- Scholarship search & deadlines\n` +
      `- Task status & upcoming due dates\n` +
      `- Essay progress tracking\n` +
      `- Meeting schedule\n` +
      `- Activity & extracurricular list\n` +
      `- Financial plan overview\n` +
      `- Document status\n` +
      `- Profile & academic info\n\n` +
      `**General Advice:**\n` +
      `- College application tips\n` +
      `- Scholarship essay guidance\n` +
      `- Timeline & planning help\n\n` +
      `Try asking something like "What scholarships are due this month?" or "Show my tasks"`,
  },

  // Thanks
  {
    patterns: [
      /^(thanks|thank you|thx|ty|appreciate it)[\s!?.]*$/i,
    ],
    handler: () => "You're welcome! Let me know if you need anything else.",
  },

  // Goodbye
  {
    patterns: [
      /^(bye|goodbye|see you|later|gotta go|ttyl)[\s!?.]*$/i,
    ],
    handler: () => "Goodbye! Good luck with your scholarship journey. I'm here whenever you need me!",
  },

  // How to apply for scholarships
  {
    patterns: [
      /how (do|can|should) (i|we) apply/i,
      /how to apply/i,
      /application (process|steps|tips)/i,
    ],
    handler: (_q, ctx) => {
      const base = ctx.role === "PARENT" ? "/parent/applications" : "/student/applications"
      return `Here's how to apply for scholarships in ScholarSuite:\n\n` +
        `1. **Browse scholarships** — Go to the Scholarships page to find opportunities that match your profile\n` +
        `2. **Check eligibility** — Each scholarship shows GPA requirements, deadlines, and other criteria\n` +
        `3. **Start an application** — Click "Apply" on any scholarship to begin tracking it\n` +
        `4. **Complete requirements** — Use the checklist to track essays, documents, and other materials\n` +
        `5. **Submit before the deadline** — Update the status as you progress\n\n` +
        `You can track all your applications in the **Applications** section.\n\n` +
        `Want me to show your current applications or find scholarships you're eligible for? Just ask!`
    },
  },

  // What is GPA / how GPA works
  {
    patterns: [
      /what is (a )?gpa/i,
      /how (does|do) gpa (work|calculate)/i,
      /gpa (meaning|explained|calculation)/i,
    ],
    handler: () =>
      `**GPA (Grade Point Average)** is a numerical measure of your academic performance.\n\n` +
      `- **4.0 scale** is most common: A=4.0, B=3.0, C=2.0, D=1.0, F=0\n` +
      `- **Weighted GPA** can go above 4.0 if you take AP/honors classes\n` +
      `- Many scholarships require a minimum GPA (commonly 2.5-3.5)\n\n` +
      `Your GPA is stored in your profile. Ask "What's my GPA?" and I'll look it up!`,
  },

  // Essay tips
  {
    patterns: [
      /essay (tips|advice|help|guidance)/i,
      /how (to|do i) write (a |an |my )?(good |strong |great )?(scholarship |college )?essay/i,
      /personal statement (tips|advice|help)/i,
    ],
    handler: () =>
      `Here are some scholarship essay tips:\n\n` +
      `**Structure:**\n` +
      `- **Hook** — Start with a compelling opening (personal story, surprising fact)\n` +
      `- **Body** — Show specific examples, not just tell\n` +
      `- **Conclusion** — Connect back to the scholarship's mission\n\n` +
      `**Do's:**\n` +
      `- Be authentic and personal\n` +
      `- Answer the prompt directly\n` +
      `- Proofread multiple times\n` +
      `- Stay within the word limit\n` +
      `- Show growth and resilience\n\n` +
      `**Don'ts:**\n` +
      `- Don't use cliches ("I want to make a difference")\n` +
      `- Don't repeat your resume — tell a story\n` +
      `- Don't submit a generic essay for every scholarship\n\n` +
      `You can track your essays in the **Essays** section. Ask "Show my essays" to see your current progress!`,
  },

  // Timeline / when to start
  {
    patterns: [
      /when (should|do) (i|we) start/i,
      /college (prep |application )?timeline/i,
      /what (grade|year) (should|do) (i|we)/i,
    ],
    handler: () =>
      `**General College Prep Timeline:**\n\n` +
      `**9th Grade:** Focus on grades, explore interests, start activities\n\n` +
      `**10th Grade:** Take PSAT, research colleges, build extracurriculars\n\n` +
      `**11th Grade:** Take SAT/ACT, visit colleges, start scholarship search, begin essays\n\n` +
      `**12th Grade (Fall):** Submit applications, apply for scholarships, request rec letters\n\n` +
      `**12th Grade (Spring):** Compare offers, make decisions, apply for more scholarships\n\n` +
      `It's never too early or too late to start! Check the **Timeline** page in ScholarSuite for a personalized view.`,
  },

  // FAFSA
  {
    patterns: [
      /fafsa/i,
      /financial aid (form|application)/i,
      /federal (student )?aid/i,
    ],
    handler: () =>
      `**FAFSA (Free Application for Federal Student Aid):**\n\n` +
      `- Opens **October 1st** each year\n` +
      `- Deadline varies by state and school — submit ASAP\n` +
      `- You need your (and parents') tax returns and Social Security numbers\n` +
      `- Fill it out at **studentaid.gov**\n` +
      `- Determines eligibility for federal grants, loans, and work-study\n` +
      `- Many scholarships also require FAFSA completion\n\n` +
      `**Tip:** Even if you think you won't qualify, always submit the FAFSA — many schools require it for merit aid too.\n\n` +
      `Check your **Financial Plan** in ScholarSuite to track your aid package!`,
  },

  // Letters of recommendation
  {
    patterns: [
      /letter(s)? of rec/i,
      /recommendation letter/i,
      /who (should|can) (i|we) ask (for )?rec/i,
    ],
    handler: () =>
      `**Tips for Letters of Recommendation:**\n\n` +
      `**Who to ask:**\n` +
      `- Teachers who know you well (especially 11th grade)\n` +
      `- A counselor, coach, or mentor\n` +
      `- An employer or community leader (for some scholarships)\n\n` +
      `**When to ask:**\n` +
      `- At least **3-4 weeks** before the deadline\n` +
      `- Ideally at the start of senior year\n\n` +
      `**How to ask:**\n` +
      `- Ask in person, then follow up with an email\n` +
      `- Provide: your resume, the deadline, what the scholarship values\n` +
      `- Send a thank-you note after\n\n` +
      `Track your document requirements in the **Documents** section of ScholarSuite!`,
  },
]

export function tryRuleBasedResponse(
  query: string,
  userName: string,
  role: string
): RuleResult | null {
  const ctx: RuleContext = {
    userName: userName || "there",
    role: role as "STUDENT" | "PARENT",
  }

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(query.trim())) {
        return { reply: rule.handler(query, ctx) }
      }
    }
  }

  return null
}
