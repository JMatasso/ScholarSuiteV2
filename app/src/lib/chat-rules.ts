/**
 * Rule-based chatbot — handles common questions without AI.
 * Returns null if no rule matches (caller should escalate to RAG/AI).
 *
 * Architecture:
 *   1. Exact pattern match (regex) — fast, high-confidence
 *   2. Keyword scoring — fuzzy fallback for broader coverage
 */

interface RuleResult {
  reply: string
  sources?: { type: string; id: string; label: string }[]
}

interface RulePattern {
  id: string
  patterns: RegExp[]
  keywords: string[]  // for fuzzy matching
  handler: (query: string, context: RuleContext) => string
}

interface RuleContext {
  userName: string
  role: "STUDENT" | "PARENT" | "ADMIN"
}

const rules: RulePattern[] = [
  // ─── GREETINGS & META ─────────────────────────────────────────
  {
    id: "greeting",
    patterns: [
      /^(hi|hello|hey|howdy|sup|what'?s up|good (morning|afternoon|evening))[\s!?.]*$/i,
    ],
    keywords: [],
    handler: (_q, ctx) =>
      `Hi ${ctx.userName}! I'm your ScholarSuite assistant. Here are some things I can help with:\n\n` +
      `- **Scholarships** — "What scholarships am I eligible for?" or "Show me upcoming deadlines"\n` +
      `- **College Prep** — "How do I write a great essay?" or "When should I take the SAT?"\n` +
      `- **FAFSA & Financial Aid** — "How do I fill out the FAFSA?" or "What's the CSS Profile?"\n` +
      `- **Tasks & Deadlines** — "What tasks are due soon?"\n` +
      `- **Applications** — "How do I apply?" or "Show my application status"\n` +
      `- **College Selection** — "How do I choose a college?" or "What are reach/match/safety schools?"\n\n` +
      `Just ask a question and I'll help!`,
  },

  {
    id: "help",
    patterns: [
      /what can you (do|help|assist)/i,
      /^help$/i,
      /how (do|can) (i|you) use/i,
      /what (are|do) you/i,
    ],
    keywords: ["help", "capabilities", "features"],
    handler: () =>
      `I can help you with:\n\n` +
      `**Your Account Data:**\n` +
      `- Scholarship search & deadlines\n` +
      `- Task status & upcoming due dates\n` +
      `- Essay progress tracking\n` +
      `- Meeting schedule\n` +
      `- Activity & extracurricular list\n` +
      `- Financial plan overview\n` +
      `- Document status\n` +
      `- Profile & academic info\n\n` +
      `**College Prep Knowledge:**\n` +
      `- Scholarship search strategies\n` +
      `- Essay writing tips\n` +
      `- SAT/ACT prep guidance\n` +
      `- FAFSA & CSS Profile help\n` +
      `- College selection advice\n` +
      `- Financial aid & award letters\n` +
      `- Letters of recommendation\n` +
      `- Extracurricular planning\n` +
      `- Interview preparation\n` +
      `- Timeline & planning\n\n` +
      `Try asking something like "How do I find scholarships?" or "What's a good SAT score?"`,
  },

  {
    id: "thanks",
    patterns: [/^(thanks|thank you|thx|ty|appreciate it)[\s!?.]*$/i],
    keywords: [],
    handler: () => "You're welcome! Let me know if you need anything else.",
  },

  {
    id: "goodbye",
    patterns: [/^(bye|goodbye|see you|later|gotta go|ttyl)[\s!?.]*$/i],
    keywords: [],
    handler: () => "Goodbye! Good luck with your scholarship journey. I'm here whenever you need me!",
  },

  // ─── SCHOLARSHIP BASICS ───────────────────────────────────────
  {
    id: "how-to-apply",
    patterns: [
      /how (do|can|should) (i|we) apply/i,
      /how to apply/i,
      /application (process|steps|tips)/i,
    ],
    keywords: ["apply", "application", "process", "steps"],
    handler: (_q, ctx) =>
      `Here's how to apply for scholarships in ScholarSuite:\n\n` +
      `1. **Browse scholarships** — Go to the Scholarships page to find opportunities matching your profile\n` +
      `2. **Check eligibility** — Each scholarship shows GPA, deadline, and criteria requirements\n` +
      `3. **Start an application** — Click "Apply" on any scholarship to begin tracking it\n` +
      `4. **Complete requirements** — Use the checklist to track essays, documents, and other materials\n` +
      `5. **Submit before the deadline** — Update the status as you progress\n\n` +
      `**Pro tips:**\n` +
      `- Apply to at least 15-20 scholarships to maximize your chances\n` +
      `- Start with scholarships that match your unique profile (first-gen, state, field of study)\n` +
      `- Reuse and adapt essays across similar scholarships\n` +
      `- Keep a spreadsheet of deadlines so nothing slips\n\n` +
      `You can track all your applications in the **Applications** section.`,
  },

  {
    id: "find-scholarships",
    patterns: [
      /how (do|can|should) (i|we) find scholarships/i,
      /where (to|can i|do i) (find|look|search|get) scholarships/i,
      /scholarship search/i,
      /finding scholarships/i,
    ],
    keywords: ["find", "search", "discover", "scholarships", "where"],
    handler: () =>
      `**How to Find Scholarships:**\n\n` +
      `**In ScholarSuite:**\n` +
      `- Go to the **Discover** page — we match scholarships to your profile automatically\n` +
      `- Use filters by amount, deadline, field of study, and eligibility\n` +
      `- Check back regularly — new scholarships are added frequently\n\n` +
      `**Other Sources:**\n` +
      `- **Fastweb.com** — Large database, free to use\n` +
      `- **Scholarships.com** — Browse by category\n` +
      `- **Bold.org** — Modern platform with many opportunities\n` +
      `- **Your school's counselor** — Often knows local scholarships\n` +
      `- **Your state's education department** — State-specific grants\n` +
      `- **Your intended college** — Many have their own scholarships\n` +
      `- **Community organizations** — Rotary Club, Elks, local foundations\n` +
      `- **Employers** — Many companies offer scholarships for employees' children\n` +
      `- **Professional associations** — Organizations in your field of interest\n\n` +
      `**Tips:**\n` +
      `- Don't skip "small" scholarships ($500-$1000) — they add up and have less competition\n` +
      `- Local scholarships often have the best odds\n` +
      `- Apply to scholarships you're uniquely qualified for`,
  },

  {
    id: "scholarship-types",
    patterns: [
      /types? of scholarships/i,
      /what kinds? of scholarships/i,
      /scholarship categor/i,
      /different scholarships/i,
    ],
    keywords: ["types", "kinds", "categories", "scholarship"],
    handler: () =>
      `**Types of Scholarships:**\n\n` +
      `**By Merit:**\n` +
      `- **Academic** — Based on GPA, test scores, class rank\n` +
      `- **Athletic** — For student athletes (NCAA Div I, II, NAIA)\n` +
      `- **Artistic/Creative** — For music, art, writing, performing arts\n` +
      `- **Leadership** — Based on community involvement and leadership roles\n\n` +
      `**By Need:**\n` +
      `- **Need-based** — Determined by FAFSA/financial situation\n` +
      `- **Pell Grant recipients** — Specific scholarships for Pell-eligible students\n\n` +
      `**By Identity:**\n` +
      `- **First-generation** — For first in family to attend college\n` +
      `- **Minority/ethnicity-specific** — For underrepresented groups\n` +
      `- **Gender-specific** — Women in STEM, etc.\n` +
      `- **LGBTQ+** — Various supporting organizations\n\n` +
      `**By Source:**\n` +
      `- **Institutional** — From the college you're attending\n` +
      `- **Federal/State** — Government-funded (Pell Grant, state grants)\n` +
      `- **Private** — Foundations, companies, nonprofits\n` +
      `- **Community** — Local organizations, civic groups\n\n` +
      `**By Field:**\n` +
      `- **STEM** — Science, technology, engineering, math\n` +
      `- **Healthcare** — Nursing, pre-med, public health\n` +
      `- **Education** — Future teachers\n` +
      `- **Business** — Entrepreneurship, finance, marketing\n` +
      `- **Arts & Humanities** — Writing, history, philosophy`,
  },

  {
    id: "scholarship-scams",
    patterns: [
      /scholarship scam/i,
      /is this scholarship (real|legit|legitimate)/i,
      /fake scholarship/i,
      /avoid (scholarship )?scam/i,
    ],
    keywords: ["scam", "fake", "legit", "legitimate", "fraud"],
    handler: () =>
      `**How to Spot Scholarship Scams:**\n\n` +
      `**Red Flags:**\n` +
      `- Asks for an **application fee** — legitimate scholarships never charge to apply\n` +
      `- Guarantees you'll win ("You've been selected!")\n` +
      `- Asks for your **bank account** or Social Security number upfront\n` +
      `- Has a vague organization name with no online presence\n` +
      `- Pressures you to act immediately\n` +
      `- Asks you to pay taxes/fees upfront to "release" your award\n\n` +
      `**Safe Signs:**\n` +
      `- Has a clear, established organization behind it\n` +
      `- Listed on reputable scholarship databases\n` +
      `- Has transparent eligibility criteria and selection process\n` +
      `- Free to apply\n` +
      `- Has verifiable past winners\n\n` +
      `**Rule of thumb:** If it sounds too good to be true, it probably is. You should never have to pay money to receive a scholarship.`,
  },

  {
    id: "scholarship-interview",
    patterns: [
      /scholarship interview/i,
      /interview (tips|prep|prepare)/i,
      /how to (prepare|get ready) for (an |a )?interview/i,
    ],
    keywords: ["interview", "prepare", "tips", "scholarship"],
    handler: () =>
      `**Scholarship Interview Tips:**\n\n` +
      `**Before the Interview:**\n` +
      `- Research the organization and scholarship mission\n` +
      `- Review your application — they'll reference what you wrote\n` +
      `- Prepare 2-3 stories that show leadership, resilience, and passion\n` +
      `- Practice common questions (see below)\n` +
      `- Prepare thoughtful questions to ask them\n\n` +
      `**Common Questions:**\n` +
      `- "Tell me about yourself" (keep it 2 minutes, focus on achievements)\n` +
      `- "Why do you deserve this scholarship?"\n` +
      `- "What are your career goals?"\n` +
      `- "Tell me about a challenge you've overcome"\n` +
      `- "How will you give back to your community?"\n` +
      `- "What's your proudest achievement?"\n\n` +
      `**During the Interview:**\n` +
      `- Dress professionally (business casual minimum)\n` +
      `- Arrive 10-15 minutes early\n` +
      `- Make eye contact and speak clearly\n` +
      `- Be specific with examples — don't give generic answers\n` +
      `- Show genuine enthusiasm and gratitude\n\n` +
      `**After the Interview:**\n` +
      `- Send a thank-you email within 24 hours\n` +
      `- Reference something specific from the conversation`,
  },

  // ─── ESSAYS ───────────────────────────────────────────────────
  {
    id: "essay-tips",
    patterns: [
      /essay (tips|advice|help|guidance)/i,
      /how (to|do i) write (a |an |my )?(good |strong |great )?(scholarship |college )?essay/i,
      /personal statement (tips|advice|help)/i,
    ],
    keywords: ["essay", "write", "writing", "personal", "statement", "tips"],
    handler: () =>
      `**Scholarship & College Essay Tips:**\n\n` +
      `**Structure:**\n` +
      `- **Hook** — Start with a compelling opening (personal story, surprising fact, vivid scene)\n` +
      `- **Body** — Show specific examples, don't just tell. Use sensory details.\n` +
      `- **Connection** — Link your experience to the scholarship's values\n` +
      `- **Conclusion** — Forward-looking, connect to your goals\n\n` +
      `**Do's:**\n` +
      `- Be authentic and personal — your unique voice matters\n` +
      `- Answer the prompt directly\n` +
      `- Show growth, resilience, and self-awareness\n` +
      `- Use specific examples with details\n` +
      `- Proofread multiple times (read it aloud!)\n` +
      `- Stay within the word limit\n` +
      `- Have someone else review it\n\n` +
      `**Don'ts:**\n` +
      `- Don't use cliches ("I want to make a difference")\n` +
      `- Don't repeat your resume — tell a story\n` +
      `- Don't submit a generic essay for every scholarship\n` +
      `- Don't start with a dictionary definition\n` +
      `- Don't use overly complex vocabulary to sound smart\n` +
      `- Don't write about a topic you think they "want" to hear — be genuine\n\n` +
      `Track your essays in the **Essays** section of ScholarSuite.`,
  },

  {
    id: "common-app-essay",
    patterns: [
      /common app(lication)? essay/i,
      /common app prompts/i,
    ],
    keywords: ["common", "app", "application", "prompts", "essay"],
    handler: () =>
      `**Common Application Essay (2024-2025 Prompts):**\n\n` +
      `The Common App essay is 250-650 words. Choose one prompt:\n\n` +
      `1. **Background/Identity** — "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it."\n` +
      `2. **Obstacles** — "The lessons we take from obstacles we encounter can be fundamental to later success."\n` +
      `3. **Challenged a belief** — "Reflect on a time when you questioned or challenged a belief or idea."\n` +
      `4. **Gratitude** — "Reflect on something that someone has done for you that has made you happy or thankful."\n` +
      `5. **Personal growth** — "Discuss an accomplishment, event, or realization that sparked personal growth."\n` +
      `6. **Topic of fascination** — "Describe a topic, idea, or concept you find so engaging it makes you lose track of time."\n` +
      `7. **Topic of your choice**\n\n` +
      `**Tips:**\n` +
      `- Pick the prompt that lets you tell your most authentic story\n` +
      `- This is about YOU, not the topic — show self-reflection\n` +
      `- Start early and revise multiple times\n` +
      `- Don't try to cover your entire life — focus on one moment or theme`,
  },

  {
    id: "essay-topics",
    patterns: [
      /what (should|can) i write (about|my essay on)/i,
      /essay (topic|idea|subject)/i,
      /what to write about/i,
    ],
    keywords: ["topic", "idea", "write", "about", "essay"],
    handler: () =>
      `**Finding Your Essay Topic:**\n\n` +
      `The best essays come from genuine, personal experiences. Ask yourself:\n\n` +
      `**Self-Reflection Questions:**\n` +
      `- What's a moment that changed how I see the world?\n` +
      `- What challenge taught me the most about myself?\n` +
      `- What do I do that makes me lose track of time?\n` +
      `- What's something I believe that most people disagree with?\n` +
      `- What community or identity shaped who I am?\n\n` +
      `**Strong Topic Categories:**\n` +
      `- A specific moment of growth or realization (not your entire life story)\n` +
      `- An unusual hobby or interest and what it reveals about you\n` +
      `- A family tradition or cultural experience\n` +
      `- Overcoming a specific obstacle (be specific, not generic)\n` +
      `- A time you failed and what you learned\n` +
      `- A passion project or initiative you started\n\n` +
      `**Topics to Avoid:**\n` +
      `- The "big game" sports essay (unless there's a truly unique angle)\n` +
      `- Summarizing a volunteer trip without reflection\n` +
      `- Controversial political topics (focus on you, not the issue)\n` +
      `- Tragedy without showing growth/resilience\n` +
      `- Anything that could seem like you're seeking pity`,
  },

  // ─── SAT / ACT ────────────────────────────────────────────────
  {
    id: "sat-info",
    patterns: [
      /\bsat\b.*(score|prep|study|test|take|tips|good)/i,
      /what is (the |a )?\bsat\b/i,
      /when (should|to|do) .* take .* \bsat\b/i,
      /\bsat\b.*(when|date|register)/i,
    ],
    keywords: ["sat", "score", "prep", "test", "study"],
    handler: () =>
      `**SAT Overview & Tips:**\n\n` +
      `**What is the SAT?**\n` +
      `- Standardized college admissions test by College Board\n` +
      `- Now fully **digital** (since March 2024)\n` +
      `- **Sections:** Reading & Writing (verbal) + Math\n` +
      `- **Score range:** 400-1600 (200-800 per section)\n` +
      `- **Duration:** ~2 hours 14 minutes\n` +
      `- **Cost:** ~$60 (fee waivers available)\n\n` +
      `**Good Scores:**\n` +
      `- Average: ~1050\n` +
      `- Competitive: 1200+\n` +
      `- Highly competitive: 1400+\n` +
      `- Top schools (Ivy League): 1500+\n\n` +
      `**When to Take It:**\n` +
      `- Most students take it in **spring of junior year**\n` +
      `- Take the PSAT in 10th/11th grade for practice + National Merit eligibility\n` +
      `- Retake in fall of senior year if needed\n\n` +
      `**Free Prep Resources:**\n` +
      `- **Khan Academy** — Official SAT prep, personalized study plans (free)\n` +
      `- **College Board Practice Tests** — Released official exams\n` +
      `- **Bluebook app** — Official digital SAT practice tool\n\n` +
      `**Tips:**\n` +
      `- Study consistently for 2-3 months, not cramming\n` +
      `- Focus on your weaker section\n` +
      `- Take full-length practice tests under timed conditions\n` +
      `- Many schools are now **test-optional** — check each school's policy`,
  },

  {
    id: "act-info",
    patterns: [
      /\bact\b.*(score|prep|study|test|take|tips|good)/i,
      /what is (the )?\bact\b/i,
      /when (should|to|do) .* take .* \bact\b/i,
      /\bact\b.*(when|date|register)/i,
      /sat (vs?|or|versus) act/i,
      /act (vs?|or|versus) sat/i,
    ],
    keywords: ["act", "score", "prep", "test"],
    handler: () =>
      `**ACT Overview & Tips:**\n\n` +
      `**What is the ACT?**\n` +
      `- Standardized college admissions test\n` +
      `- **Sections:** English, Math, Reading, Science + optional Writing\n` +
      `- **Score range:** 1-36 (composite average of sections)\n` +
      `- **Duration:** ~2 hours 55 minutes (3:40 with writing)\n` +
      `- **Cost:** ~$68 without writing, ~$93 with writing\n\n` +
      `**Good Scores:**\n` +
      `- Average: ~20\n` +
      `- Competitive: 25+\n` +
      `- Highly competitive: 30+\n` +
      `- Top schools: 33+\n\n` +
      `**SAT vs ACT:**\n` +
      `- ACT has a **Science** section (data interpretation, not biology knowledge)\n` +
      `- ACT is more **time-pressured** — more questions, less time per question\n` +
      `- SAT math is slightly harder but allows more time\n` +
      `- All colleges accept both equally\n` +
      `- Take a practice test of each to see which format suits you\n\n` +
      `**Tips:**\n` +
      `- Time management is crucial on the ACT\n` +
      `- The Science section tests data reading, not science knowledge\n` +
      `- Practice with official ACT tests from act.org`,
  },

  {
    id: "test-optional",
    patterns: [
      /test.?optional/i,
      /do i (need|have) to (take|submit|send) (the )?(sat|act|test)/i,
      /should i (submit|send) (my )?(test )?scores/i,
    ],
    keywords: ["test", "optional", "submit", "scores"],
    handler: () =>
      `**Test-Optional Policies:**\n\n` +
      `Many colleges are now test-optional, meaning you can choose whether to submit SAT/ACT scores.\n\n` +
      `**Should You Submit Scores?**\n` +
      `- **Submit if** your scores are at or above the school's middle 50% range\n` +
      `- **Don't submit if** your scores are below the school's average\n` +
      `- Check each school's website for their specific policy\n\n` +
      `**Types of Policies:**\n` +
      `- **Test-optional** — Your choice to submit or not\n` +
      `- **Test-free/blind** — Scores not considered at all\n` +
      `- **Test-required** — Must submit (fewer schools now)\n` +
      `- **Test-flexible** — Accept alternative tests (AP, IB, etc.)\n\n` +
      `**Important Notes:**\n` +
      `- Some scholarships still require test scores even if admission doesn't\n` +
      `- Going test-optional means other parts of your application carry more weight\n` +
      `- If applying without scores, make sure your GPA, essays, and activities are strong\n` +
      `- Some engineering/STEM programs may still prefer scores`,
  },

  // ─── GPA ──────────────────────────────────────────────────────
  {
    id: "gpa-info",
    patterns: [
      /what is (a )?gpa/i,
      /how (does|do) gpa (work|calculate)/i,
      /gpa (meaning|explained|calculation|scale)/i,
      /how to (calculate|raise|improve) (my )?gpa/i,
    ],
    keywords: ["gpa", "grade", "point", "average", "calculate"],
    handler: () =>
      `**GPA (Grade Point Average):**\n\n` +
      `**How It Works:**\n` +
      `- **4.0 scale:** A=4.0, B=3.0, C=2.0, D=1.0, F=0\n` +
      `- **Weighted GPA** can go above 4.0 with AP/Honors courses (A in AP = 5.0)\n` +
      `- **Unweighted GPA** stays on the 4.0 scale regardless of course difficulty\n\n` +
      `**What's a Good GPA?**\n` +
      `- 3.0+ → Meets most scholarship minimums\n` +
      `- 3.5+ → Competitive for selective schools\n` +
      `- 3.8+ → Strong for highly selective schools\n` +
      `- 4.0+ (weighted) → Excellent\n\n` +
      `**How to Improve Your GPA:**\n` +
      `- Talk to teachers early if you're struggling\n` +
      `- Use office hours and tutoring services\n` +
      `- Prioritize studying for classes where you're on the border\n` +
      `- Consider retaking a class if your school allows grade replacement\n` +
      `- Take AP/Honors for weighted GPA boost (only if you can handle the workload)\n\n` +
      `**Important:** Many scholarships have minimum GPA requirements (commonly 2.5-3.5). Your GPA is stored in your ScholarSuite profile.`,
  },

  // ─── FAFSA & FINANCIAL AID ────────────────────────────────────
  {
    id: "fafsa",
    patterns: [
      /\bfafsa\b/i,
      /free application for federal student aid/i,
      /federal (student )?aid/i,
      /how (to|do i) (fill|file|complete|submit) .*(fafsa|financial aid)/i,
    ],
    keywords: ["fafsa", "federal", "aid", "financial"],
    handler: () =>
      `**FAFSA (Free Application for Federal Student Aid):**\n\n` +
      `**What It Is:**\n` +
      `- The gateway to **all** federal financial aid (grants, loans, work-study)\n` +
      `- Required by most colleges for institutional aid too\n` +
      `- **Free** to fill out — never pay someone to do it\n\n` +
      `**Key Dates:**\n` +
      `- Opens **October 1st** each year (for the following academic year)\n` +
      `- Federal deadline: June 30, but state and school deadlines are **much earlier**\n` +
      `- Submit ASAP — some aid is first-come, first-served\n\n` +
      `**What You Need:**\n` +
      `- Your (and parents') Social Security numbers\n` +
      `- Federal tax returns (2 years prior) — uses IRS Data Retrieval Tool\n` +
      `- Bank statements and investment records\n` +
      `- Records of untaxed income\n` +
      `- FSA ID (create at studentaid.gov)\n\n` +
      `**What You Get:**\n` +
      `- **Pell Grant** — Up to ~$7,395/year (doesn't need to be repaid)\n` +
      `- **Federal loans** — Subsidized and unsubsidized\n` +
      `- **Work-study** — Part-time campus jobs\n` +
      `- **State grants** — Varies by state\n` +
      `- **Institutional aid** — Many colleges use FAFSA for their own scholarships\n\n` +
      `**Tip:** Even if you think you won't qualify for need-based aid, **always submit the FAFSA**. Many merit scholarships and state grants also require it.`,
  },

  {
    id: "css-profile",
    patterns: [
      /css profile/i,
      /college scholarship service/i,
    ],
    keywords: ["css", "profile", "college", "scholarship", "service"],
    handler: () =>
      `**CSS Profile:**\n\n` +
      `**What It Is:**\n` +
      `- An additional financial aid application used by ~400 colleges\n` +
      `- Run by the College Board (same as SAT)\n` +
      `- More detailed than FAFSA — considers home equity, medical expenses, etc.\n` +
      `- Costs $25 for first school + $16 per additional school (fee waivers available)\n\n` +
      `**Who Needs It:**\n` +
      `- Check each college's financial aid page\n` +
      `- Most private universities require it (MIT, Stanford, USC, etc.)\n` +
      `- Some public schools use it for institutional scholarships\n\n` +
      `**Key Differences from FAFSA:**\n` +
      `- Considers **home equity** as an asset\n` +
      `- Asks about **non-custodial parent** income (for divorced families)\n` +
      `- More detailed expense questions\n` +
      `- Opens **October 1st** alongside FAFSA\n\n` +
      `**Tip:** Submit both FAFSA and CSS Profile if your schools require both. They complement each other.`,
  },

  {
    id: "financial-aid-letters",
    patterns: [
      /award letter/i,
      /financial aid (letter|offer|package|award)/i,
      /compare (financial )?aid/i,
      /understand.*(aid|award)/i,
    ],
    keywords: ["award", "letter", "financial", "package", "aid", "offer"],
    handler: () =>
      `**Understanding Financial Aid Award Letters:**\n\n` +
      `Your award letter shows the total cost of attendance and aid offered. Here's how to read it:\n\n` +
      `**Components:**\n` +
      `- **Grants & Scholarships** — Free money, doesn't need repayment (**the good stuff**)\n` +
      `- **Work-Study** — Money earned through campus jobs\n` +
      `- **Subsidized Loans** — Government pays interest while you're in school\n` +
      `- **Unsubsidized Loans** — Interest starts accruing immediately\n` +
      `- **Parent PLUS Loans** — Parents borrow; higher interest rates\n\n` +
      `**How to Compare:**\n` +
      `1. Calculate **Net Cost** = Cost of Attendance − Grants/Scholarships\n` +
      `2. Ignore loans when comparing "aid" — they're debt, not aid\n` +
      `3. Check if aid is **renewable** (will you get it all 4 years?)\n` +
      `4. Look for GPA requirements to keep scholarships\n` +
      `5. Factor in cost of living differences between schools\n\n` +
      `**You Can Negotiate!**\n` +
      `- If another school offered more, ask — "I received X from [School B]. Can you match?"\n` +
      `- Document changes in financial circumstances\n` +
      `- Be polite and specific — financial aid offices are often helpful`,
  },

  {
    id: "efc-sai",
    patterns: [
      /\befc\b/i,
      /expected family contribution/i,
      /\bsai\b.*student/i,
      /student aid index/i,
    ],
    keywords: ["efc", "expected", "family", "contribution", "sai"],
    handler: () =>
      `**EFC / SAI (Student Aid Index):**\n\n` +
      `The **Student Aid Index (SAI)**, formerly called EFC (Expected Family Contribution), is calculated from your FAFSA.\n\n` +
      `**What It Means:**\n` +
      `- It's a number representing what the government estimates your family can afford\n` +
      `- **Lower SAI = more financial aid eligibility**\n` +
      `- SAI of $0 usually qualifies for maximum Pell Grant\n` +
      `- Can now be **negative** (as of 2024-25 FAFSA), meaning higher need\n\n` +
      `**What Affects It:**\n` +
      `- Parents' income and assets\n` +
      `- Student's income and assets\n` +
      `- Family size and number in college\n` +
      `- Tax filing status\n\n` +
      `**Important:** SAI is NOT what you'll actually pay. Each school uses it differently to calculate your aid package.`,
  },

  // ─── COLLEGE SELECTION ────────────────────────────────────────
  {
    id: "choose-college",
    patterns: [
      /how (do|should|can) (i|we) choose (a )?college/i,
      /how to (pick|choose|select|decide) (a |which )?college/i,
      /choosing (a |between )?college/i,
      /which college should/i,
    ],
    keywords: ["choose", "pick", "select", "decide", "college"],
    handler: () =>
      `**How to Choose a College:**\n\n` +
      `**Academic Factors:**\n` +
      `- Does it have your intended major/program?\n` +
      `- Student-to-faculty ratio\n` +
      `- Research opportunities and internship connections\n` +
      `- Graduation rate and job placement rate\n\n` +
      `**Financial Factors:**\n` +
      `- Total cost of attendance (tuition + room & board + fees)\n` +
      `- Average financial aid package\n` +
      `- Average student debt at graduation\n` +
      `- Scholarship opportunities\n\n` +
      `**Campus & Culture:**\n` +
      `- Location (urban vs rural, distance from home)\n` +
      `- Campus size and feel\n` +
      `- Diversity and inclusion\n` +
      `- Clubs, organizations, Greek life\n` +
      `- Housing options\n\n` +
      `**Practical Steps:**\n` +
      `1. Visit campus if possible (or do virtual tours)\n` +
      `2. Talk to current students and alumni\n` +
      `3. Attend admitted student events\n` +
      `4. Compare net costs side by side\n` +
      `5. Trust your gut — where can you see yourself thriving?\n\n` +
      `**Pro tip:** Don't choose solely based on prestige or rankings. The best college is the one where you'll succeed academically, socially, and financially.`,
  },

  {
    id: "reach-match-safety",
    patterns: [
      /reach.*(match|safety)/i,
      /safety.*(school|college)/i,
      /match.*(school|college)/i,
      /reach.*(school|college)/i,
      /how many (schools|colleges) (should|to) apply/i,
    ],
    keywords: ["reach", "match", "safety", "schools", "apply", "how many"],
    handler: () =>
      `**Reach, Match, and Safety Schools:**\n\n` +
      `**Safety Schools (2-3):**\n` +
      `- Your GPA and test scores are **above** the school's average\n` +
      `- You have a very high chance of admission (>80%)\n` +
      `- You'd be happy attending — don't pick a safety you'd hate\n\n` +
      `**Match Schools (3-5):**\n` +
      `- Your stats fall within the school's typical range\n` +
      `- Reasonable chance of admission (40-70%)\n` +
      `- These are your most likely outcomes\n\n` +
      `**Reach Schools (2-4):**\n` +
      `- Your stats are below the school's average, or the school accepts <25%\n` +
      `- Worth applying if you love the school, but don't count on it\n\n` +
      `**Recommended Total: 8-12 schools**\n` +
      `- This balances thoroughness without spreading yourself too thin\n` +
      `- Quality of applications matters more than quantity\n\n` +
      `**How to Classify:**\n` +
      `- Compare your GPA and test scores to the school's published data (common data set)\n` +
      `- Check acceptance rate\n` +
      `- Consider your unique factors (first-gen, legacy, recruited athlete, etc.)`,
  },

  {
    id: "college-visits",
    patterns: [
      /college visit/i,
      /campus visit/i,
      /campus tour/i,
      /visit(ing)? (a )?college/i,
    ],
    keywords: ["visit", "campus", "tour", "college"],
    handler: () =>
      `**College Visit Checklist:**\n\n` +
      `**Before the Visit:**\n` +
      `- Register for an official tour and info session\n` +
      `- Schedule a meeting with an admissions counselor\n` +
      `- Prepare questions about your major/interests\n\n` +
      `**What to Do on Campus:**\n` +
      `- Take the official campus tour\n` +
      `- Attend an info session\n` +
      `- Sit in on a class if possible\n` +
      `- Eat in the dining hall\n` +
      `- Walk around on your own (outside the curated tour)\n` +
      `- Talk to current students (not just tour guides)\n` +
      `- Check out the library, dorms, and rec center\n\n` +
      `**Questions to Ask:**\n` +
      `- What's the most popular major? What's unique about [your major]?\n` +
      `- What's the job/grad school placement rate?\n` +
      `- What do students do on weekends?\n` +
      `- How easy is it to change your major?\n` +
      `- What support services exist (tutoring, career center, mental health)?\n\n` +
      `**Can't Visit in Person?**\n` +
      `- Most schools offer virtual tours on their websites\n` +
      `- Watch student vlogs on YouTube for an unfiltered view\n` +
      `- Attend virtual admitted student events`,
  },

  // ─── TIMELINE & PLANNING ──────────────────────────────────────
  {
    id: "timeline",
    patterns: [
      /when (should|do) (i|we) start/i,
      /college (prep |application )?timeline/i,
      /what (grade|year) (should|do) (i|we)/i,
      /senior year timeline/i,
      /junior year (plan|timeline|checklist)/i,
    ],
    keywords: ["timeline", "when", "start", "plan", "schedule", "year"],
    handler: () =>
      `**College Prep Timeline:**\n\n` +
      `**9th Grade (Freshman):**\n` +
      `- Focus on getting good grades from day one\n` +
      `- Explore interests through clubs and activities\n` +
      `- Start building relationships with teachers\n` +
      `- Begin a reading habit for stronger verbal skills\n\n` +
      `**10th Grade (Sophomore):**\n` +
      `- Take the PSAT for practice\n` +
      `- Start researching colleges casually\n` +
      `- Deepen extracurricular involvement (aim for leadership)\n` +
      `- Consider taking AP/Honors courses\n` +
      `- Start a college savings plan\n\n` +
      `**11th Grade (Junior) — The Big Year:**\n` +
      `- Take the PSAT (October — National Merit qualifier)\n` +
      `- Take SAT/ACT in spring\n` +
      `- Visit colleges during spring break/summer\n` +
      `- Build your college list (reach/match/safety)\n` +
      `- Start scholarship search\n` +
      `- Ask teachers for recommendation letters\n` +
      `- Begin drafting essays over the summer\n\n` +
      `**12th Grade (Senior):**\n` +
      `- **September-October:** Finalize college list, submit early applications\n` +
      `- **October:** Submit FAFSA and CSS Profile\n` +
      `- **November:** Early Decision/Early Action deadlines\n` +
      `- **January:** Regular Decision deadlines\n` +
      `- **March-April:** Decisions arrive, compare financial aid\n` +
      `- **May 1:** National Decision Day (commit to a school)\n` +
      `- **Continue applying for scholarships year-round!**`,
  },

  {
    id: "early-decision-action",
    patterns: [
      /early (decision|action)/i,
      /\b(ED|EA|REA|ED2)\b.*(college|apply|application|deadline)/i,
      /regular decision/i,
      /should i apply early/i,
    ],
    keywords: ["early", "decision", "action", "ED", "EA", "regular"],
    handler: () =>
      `**Early Decision vs Early Action vs Regular Decision:**\n\n` +
      `**Early Decision (ED):**\n` +
      `- **Binding** — If accepted, you MUST attend (with limited exceptions for financial aid)\n` +
      `- Deadline: Usually November 1 or 15\n` +
      `- Decision: Mid-December\n` +
      `- Higher acceptance rate at many schools\n` +
      `- Only apply ED to ONE school — your absolute first choice\n\n` +
      `**Early Decision II (ED2):**\n` +
      `- Also **binding**, but later deadline (January)\n` +
      `- Good if your first-choice wasn't an ED1 school, or if you were deferred/rejected ED1\n\n` +
      `**Early Action (EA):**\n` +
      `- **Non-binding** — You can still consider other offers\n` +
      `- Deadline: Usually November 1 or 15\n` +
      `- Decision: December-January\n` +
      `- Can apply EA to multiple schools\n\n` +
      `**Restrictive Early Action (REA):**\n` +
      `- Non-binding, but restricts applying early elsewhere\n` +
      `- Used by Stanford, Harvard, Yale, Notre Dame, etc.\n\n` +
      `**Regular Decision (RD):**\n` +
      `- Non-binding, deadline January 1-15 typically\n` +
      `- Decisions in March-April\n` +
      `- Most applicants choose this path\n\n` +
      `**Should You Apply Early?**\n` +
      `- Yes if you have a clear first-choice school and your application is ready\n` +
      `- Only use ED if you're sure about the school AND the financial aid`,
  },

  // ─── LETTERS OF RECOMMENDATION ────────────────────────────────
  {
    id: "rec-letters",
    patterns: [
      /letter(s)? of rec/i,
      /recommendation letter/i,
      /who (should|can) (i|we) ask (for )?rec/i,
      /how (to|do i) (get|ask|request) rec/i,
    ],
    keywords: ["recommendation", "letter", "rec", "ask", "teacher"],
    handler: () =>
      `**Letters of Recommendation:**\n\n` +
      `**Who to Ask:**\n` +
      `- Teachers who know you well (especially 11th grade core subjects)\n` +
      `- Choose teachers whose classes you participated actively in\n` +
      `- Your school counselor (usually required separately)\n` +
      `- An employer, coach, or mentor (for supplemental recs)\n\n` +
      `**When to Ask:**\n` +
      `- End of junior year or very beginning of senior year\n` +
      `- At least **4-6 weeks** before the earliest deadline\n` +
      `- Ask early — popular teachers get many requests\n\n` +
      `**How to Ask:**\n` +
      `1. Ask **in person** first — "Would you be willing to write a strong letter of recommendation?"\n` +
      `2. If they hesitate, gracefully ask someone else\n` +
      `3. Follow up with an email including:\n` +
      `   - Your resume/activity list\n` +
      `   - The deadline(s) and submission method\n` +
      `   - What the scholarship/college values\n` +
      `   - Specific things you'd like them to highlight\n\n` +
      `**After Receiving:**\n` +
      `- Send a handwritten thank-you note\n` +
      `- Update them on your results\n\n` +
      `**How Many?** Most colleges want 2 teacher recs + 1 counselor rec. Check each school.`,
  },

  // ─── EXTRACURRICULARS ─────────────────────────────────────────
  {
    id: "extracurriculars",
    patterns: [
      /extracurricular/i,
      /activities?.*(college|application|look|good)/i,
      /what (activities|clubs|sports) (should|look|are)/i,
      /how (many|important) (are )?extracurricular/i,
    ],
    keywords: ["extracurricular", "activities", "clubs", "involvement"],
    handler: () =>
      `**Extracurricular Activities for College:**\n\n` +
      `**Quality > Quantity:**\n` +
      `- Colleges prefer **depth** in 2-3 activities over a long list of casual involvement\n` +
      `- Show progression: member → officer → president/founder\n` +
      `- Demonstrate impact: "Started a tutoring program serving 50 students" > "Member of NHS"\n\n` +
      `**Strong Activity Categories:**\n` +
      `- **Leadership** — Student government, club president, team captain\n` +
      `- **Community Service** — Regular volunteering, organizing drives, mentoring\n` +
      `- **Work Experience** — Jobs show responsibility and time management\n` +
      `- **Academic Enrichment** — Research, competitions (Science Olympiad, debate)\n` +
      `- **Creative** — Music, art, writing, theater, film\n` +
      `- **Sports** — Shows dedication, teamwork, discipline\n` +
      `- **Entrepreneurship** — Starting a business, app, or initiative\n` +
      `- **Cultural** — Heritage clubs, language programs\n\n` +
      `**Common App Activities Section:**\n` +
      `- Lists up to 10 activities\n` +
      `- Rank by importance to you (most important first)\n` +
      `- Use active verbs in descriptions\n` +
      `- Include hours/week and weeks/year\n\n` +
      `Track your activities in the **Activities** section of ScholarSuite!`,
  },

  // ─── SPECIFIC SCHOLARSHIPS & PROGRAMS ─────────────────────────
  {
    id: "pell-grant",
    patterns: [
      /pell grant/i,
      /what is (the )?pell/i,
      /am i eligible for pell/i,
    ],
    keywords: ["pell", "grant"],
    handler: () =>
      `**Pell Grant:**\n\n` +
      `- Federal grant for undergraduate students with financial need\n` +
      `- **Maximum:** ~$7,395/year (2024-25)\n` +
      `- **Does NOT need to be repaid** — it's free money\n` +
      `- Based on your SAI/EFC from the FAFSA\n` +
      `- Can receive for up to 12 semesters (6 years)\n\n` +
      `**Eligibility:**\n` +
      `- Must submit FAFSA\n` +
      `- Must demonstrate financial need (lower income families)\n` +
      `- Must be an undergraduate pursuing your first bachelor's degree\n` +
      `- Must be a U.S. citizen or eligible non-citizen\n\n` +
      `**Bonus:** Being Pell-eligible qualifies you for additional scholarships specifically for Pell recipients!`,
  },

  {
    id: "work-study",
    patterns: [
      /work.?study/i,
      /campus job/i,
      /can i work (in |during )?college/i,
    ],
    keywords: ["work", "study", "campus", "job", "college"],
    handler: () =>
      `**Federal Work-Study:**\n\n` +
      `- Part-time jobs for students with financial need\n` +
      `- Earn money while in school (doesn't need to be repaid)\n` +
      `- Jobs are often on-campus or with approved community organizations\n` +
      `- Typical: 10-15 hours/week during the semester\n` +
      `- Pay is at least federal minimum wage\n\n` +
      `**Benefits:**\n` +
      `- Flexible scheduling around classes\n` +
      `- Work experience on your resume\n` +
      `- Earnings are not counted as heavily on future FAFSA\n\n` +
      `**How to Get It:**\n` +
      `- Indicate interest on FAFSA\n` +
      `- If offered work-study in your aid package, apply for positions through your school's career office\n` +
      `- Start looking early — popular positions fill fast`,
  },

  // ─── STUDENT LOANS ────────────────────────────────────────────
  {
    id: "student-loans",
    patterns: [
      /student loan/i,
      /should i (take|get) (a |out )?loan/i,
      /how (much|do) .*(borrow|loan)/i,
      /subsidized.*(loan|unsubsidized)/i,
      /unsubsidized/i,
    ],
    keywords: ["loan", "borrow", "debt", "subsidized", "unsubsidized"],
    handler: () =>
      `**Student Loans — What to Know:**\n\n` +
      `**Federal Loans (Better Terms):**\n` +
      `- **Direct Subsidized** — Government pays interest while you're in school. Need-based.\n` +
      `- **Direct Unsubsidized** — Interest accrues immediately. Available to all.\n` +
      `- **Parent PLUS** — Parents borrow for your education. Higher interest.\n` +
      `- Fixed interest rates, income-driven repayment options\n\n` +
      `**Private Loans (Last Resort):**\n` +
      `- From banks, credit unions, online lenders\n` +
      `- Variable interest rates (often higher)\n` +
      `- Fewer repayment protections\n` +
      `- Require credit check (may need co-signer)\n\n` +
      `**How Much to Borrow:**\n` +
      `- General rule: Don't borrow more than your expected **first year's salary**\n` +
      `- Average student debt: ~$37,000\n` +
      `- Always maximize grants and scholarships first\n` +
      `- Exhaust federal loans before considering private loans\n\n` +
      `**Avoiding Debt:**\n` +
      `- Apply for scholarships aggressively (that's what ScholarSuite is for!)\n` +
      `- Consider community college for the first 2 years\n` +
      `- Work part-time during school\n` +
      `- Choose an affordable school with strong aid`,
  },

  // ─── COLLEGE APPLICATIONS ─────────────────────────────────────
  {
    id: "common-app",
    patterns: [
      /common app(lication)?(?! essay)/i,
      /how (to|do i) (use|fill|submit) (the )?common app/i,
      /what is (the )?common app/i,
    ],
    keywords: ["common", "application", "app", "portal"],
    handler: () =>
      `**The Common Application:**\n\n` +
      `- Used by 1,000+ colleges and universities\n` +
      `- One application, multiple schools\n` +
      `- Opens **August 1** each year\n\n` +
      `**Main Sections:**\n` +
      `1. **Profile** — Demographics, contact info, citizenship\n` +
      `2. **Family** — Parents' education and employment\n` +
      `3. **Education** — Schools attended, GPA, class rank, coursework\n` +
      `4. **Testing** — SAT/ACT/AP scores (optional at many schools)\n` +
      `5. **Activities** — Up to 10 extracurriculars\n` +
      `6. **Writing** — Personal essay (250-650 words)\n` +
      `7. **Additional Info** — Space for context (optional)\n\n` +
      `**Tips:**\n` +
      `- Start early — don't wait until deadlines approach\n` +
      `- Fill out the Activities section carefully (most important first)\n` +
      `- Each school may have supplemental essays\n` +
      `- Preview the application before submitting\n` +
      `- Application fee: ~$75/school (fee waivers available if you qualify)\n\n` +
      `**Other Application Platforms:** Coalition Application, Apply Texas, UC Application, individual school portals`,
  },

  {
    id: "college-major",
    patterns: [
      /what (should|major|to) .*(major|study)/i,
      /choose (a |my )?major/i,
      /how (to|do i) (pick|choose|decide) (a |my )?major/i,
      /undecided major/i,
      /can i change (my )?major/i,
    ],
    keywords: ["major", "study", "undecided", "field"],
    handler: () =>
      `**Choosing a College Major:**\n\n` +
      `**It's OK to Be Undecided:**\n` +
      `- ~30% of students enter undecided\n` +
      `- ~75% change their major at least once\n` +
      `- Most schools let you declare by end of sophomore year\n\n` +
      `**How to Explore:**\n` +
      `- Take introductory courses in different fields\n` +
      `- Talk to professors and upperclassmen\n` +
      `- Consider internships and job shadows\n` +
      `- Take a career assessment (Myers-Briggs, Strong Interest Inventory)\n\n` +
      `**Things to Consider:**\n` +
      `- What subjects do you enjoy and do well in?\n` +
      `- What career paths interest you? (Research typical majors for those careers)\n` +
      `- Job market demand and salary expectations\n` +
      `- But don't choose purely based on money — you'll be more successful in something you enjoy\n\n` +
      `**Impact on Scholarships:**\n` +
      `- Some scholarships are field-specific (STEM, nursing, education, etc.)\n` +
      `- Your intended major on your profile helps ScholarSuite match you with relevant scholarships\n\n` +
      `**Can You Change It?** Almost always yes. But check if switching adds semesters/costs.`,
  },

  // ─── FIRST-GENERATION STUDENTS ────────────────────────────────
  {
    id: "first-gen",
    patterns: [
      /first.?gen(eration)?/i,
      /first (in|to) (my )?family (to |going to )?college/i,
      /parents (didn'?t|never|did not) (go to|attend) college/i,
    ],
    keywords: ["first", "generation", "family", "college"],
    handler: () =>
      `**Resources for First-Generation Students:**\n\n` +
      `Being first-gen is a **strength** in your applications — it shows resilience and ambition!\n\n` +
      `**What "First-Gen" Means:**\n` +
      `- Neither parent completed a 4-year bachelor's degree\n` +
      `- Some definitions include if any parent attended any college\n` +
      `- Check each scholarship's specific definition\n\n` +
      `**Advantages in Admissions:**\n` +
      `- Many colleges actively recruit first-gen students\n` +
      `- It's a "hook" that can strengthen your application\n` +
      `- Shows independence and initiative\n\n` +
      `**Scholarships & Programs:**\n` +
      `- **QuestBridge** — Matches low-income students with full scholarships at top schools\n` +
      `- **Gates Scholarship** — Full ride for Pell-eligible minorities\n` +
      `- **Dell Scholars** — $20,000 + laptop + textbook credits\n` +
      `- **Coca-Cola Scholars** — $20,000\n` +
      `- **First in Family Humanist Scholarship** — $5,000\n` +
      `- Many local organizations have first-gen scholarships too\n\n` +
      `**Support Programs:**\n` +
      `- **TRIO/Upward Bound** — Federally funded college prep\n` +
      `- **College Advising Corps** — Free college counseling\n` +
      `- Many colleges have first-gen student centers and mentoring programs\n\n` +
      `Make sure to mark "first-generation" in your ScholarSuite profile — it unlocks matching scholarships!`,
  },

  // ─── UNDOCUMENTED / DACA STUDENTS ─────────────────────────────
  {
    id: "undocumented-daca",
    patterns: [
      /undocumented/i,
      /\bdaca\b/i,
      /dreamer/i,
      /immigration status.*(college|scholarship)/i,
    ],
    keywords: ["undocumented", "daca", "dreamer", "immigration"],
    handler: () =>
      `**Resources for Undocumented/DACA Students:**\n\n` +
      `**Financial Aid:**\n` +
      `- Federal financial aid (FAFSA) is **not available** for undocumented students\n` +
      `- However, some **states** offer state-level financial aid (CA, TX, NY, WA, and others)\n` +
      `- Many **private scholarships** do not require citizenship\n` +
      `- Some colleges offer institutional aid regardless of immigration status\n\n` +
      `**Scholarships That Don't Require Citizenship:**\n` +
      `- **TheDream.US** — National scholarship for DACA/TPS recipients\n` +
      `- **Golden Door Scholars** — For undocumented students\n` +
      `- **Immigrants Rising** — Scholarship list and resources\n` +
      `- Many local and community scholarships\n\n` +
      `**In-State Tuition:**\n` +
      `- 20+ states allow in-state tuition for undocumented students who attended high school in-state\n` +
      `- Check your state's specific policy\n\n` +
      `**Important:**\n` +
      `- Your school cannot ask about immigration status\n` +
      `- Admissions counselors generally cannot share your status\n` +
      `- Seek guidance from organizations like United We Dream, Immigrants Rising, or a trusted counselor`,
  },

  // ─── GAP YEAR ─────────────────────────────────────────────────
  {
    id: "gap-year",
    patterns: [
      /gap year/i,
      /take a year off/i,
      /defer (enrollment|admission|college)/i,
    ],
    keywords: ["gap", "year", "defer", "time off"],
    handler: () =>
      `**Gap Year Considerations:**\n\n` +
      `**Pros:**\n` +
      `- Time to mature and clarify goals\n` +
      `- Work experience and savings\n` +
      `- Travel, volunteer, or gain unique experiences\n` +
      `- Reduced burnout when you do start college\n` +
      `- Many top schools actively support gap years\n\n` +
      `**Cons:**\n` +
      `- Can be harder to return to academic mode\n` +
      `- May lose momentum and peer connections\n` +
      `- Some scholarships may not defer\n\n` +
      `**Best Practice:**\n` +
      `- Apply to college during senior year, THEN defer\n` +
      `- Most schools allow deferral for 1 year (ask admissions)\n` +
      `- Have a structured plan (work, travel, service) — not just "taking time off"\n` +
      `- Check if your financial aid and scholarships will defer too\n` +
      `- Use the time productively: save money, gain experience, explore interests\n\n` +
      `**Gap Year Programs:**\n` +
      `- AmeriCorps, Peace Corps, City Year\n` +
      `- Global Gap Year Fellowship programs\n` +
      `- Working and saving for college expenses`,
  },

  // ─── COMMUNITY COLLEGE / TRANSFER ─────────────────────────────
  {
    id: "community-college",
    patterns: [
      /community college/i,
      /transfer (to|from|student)/i,
      /2.?year (college|degree|school)/i,
      /start at (a )?cc/i,
    ],
    keywords: ["community", "college", "transfer", "2-year", "cc"],
    handler: () =>
      `**Community College & Transfer Path:**\n\n` +
      `**Why Community College?**\n` +
      `- Save significant money (average ~$3,800/year vs ~$10,000+ at 4-year public)\n` +
      `- Smaller class sizes, more individual attention\n` +
      `- Flexible scheduling for working students\n` +
      `- Transfer agreements with 4-year universities\n\n` +
      `**Transfer Tips:**\n` +
      `- Research **transfer agreements** (articulation agreements) between your CC and target schools\n` +
      `- Maintain a high GPA (3.5+ recommended for competitive transfers)\n` +
      `- Complete your general education requirements\n` +
      `- Build relationships with professors for recommendations\n` +
      `- Get involved in campus activities (yes, at CC too)\n` +
      `- Meet with a transfer advisor early and often\n\n` +
      `**Transfer Scholarships:**\n` +
      `- Many 4-year schools offer **transfer-specific scholarships**\n` +
      `- Phi Theta Kappa (honor society) members get additional opportunities\n` +
      `- Check ScholarSuite for scholarships that accept transfer students\n\n` +
      `**Programs to Know:**\n` +
      `- **TAG (Transfer Admission Guarantee)** — Guaranteed admission to certain UCs for CC students\n` +
      `- **Honors programs** at community colleges boost transfer chances`,
  },

  // ─── MENTAL HEALTH & WELLBEING ────────────────────────────────
  {
    id: "stress-wellness",
    patterns: [
      /stress(ed)?( out)?/i,
      /overwhelm/i,
      /too much/i,
      /(anxious|anxiety) about (college|applications|school)/i,
      /how (to|do i) (deal|cope|handle|manage).*(stress|pressure)/i,
      /burnout/i,
    ],
    keywords: ["stress", "overwhelm", "anxiety", "pressure", "burnout"],
    handler: () =>
      `**Managing College Prep Stress:**\n\n` +
      `It's completely normal to feel overwhelmed during this process. You're not alone.\n\n` +
      `**Practical Tips:**\n` +
      `- **Break it down** — Focus on one task at a time, not the whole mountain\n` +
      `- **Use ScholarSuite's task list** — Checking things off reduces anxiety\n` +
      `- **Set boundaries** — It's OK to take breaks. Burnout hurts your applications.\n` +
      `- **Limit comparison** — Social media makes everyone else's journey look perfect. It's not.\n` +
      `- **Talk about it** — Friends, family, counselors, teachers — they want to help\n\n` +
      `**Perspective:**\n` +
      `- There is no single "perfect" college. You will thrive at many schools.\n` +
      `- A rejection is not a reflection of your worth\n` +
      `- Your value is not determined by a school name\n` +
      `- Many successful people didn't attend elite universities\n\n` +
      `**Resources:**\n` +
      `- Your school counselor\n` +
      `- **Crisis Text Line:** Text HOME to 741741\n` +
      `- **988 Suicide & Crisis Lifeline:** Call or text 988\n` +
      `- **NAMI Helpline:** 1-800-950-6264\n\n` +
      `Take care of yourself first. The college process is a means to an end — it's not your whole life.`,
  },

  // ─── PARENTS ──────────────────────────────────────────────────
  {
    id: "parent-help",
    patterns: [
      /how (can|do|should) (i|parents?) help/i,
      /what (can|should) parents? do/i,
      /parent(s|'s)? role/i,
      /support (my|your) (child|student|kid)/i,
    ],
    keywords: ["parent", "help", "support", "child", "role"],
    handler: (_q, ctx) =>
      `**How Parents Can Help With College Prep:**\n\n` +
      `**Be Supportive, Not Controlling:**\n` +
      `- Let your student lead the process — it's their future\n` +
      `- Help research options but don't make decisions for them\n` +
      `- Be a sounding board for stress and concerns\n\n` +
      `**Financial:**\n` +
      `- Complete FAFSA/CSS Profile together (you'll need your tax info)\n` +
      `- Discuss budget openly — what can you realistically contribute?\n` +
      `- Help search for scholarships (parents can help with applications too)\n` +
      `- Understand student loans before co-signing anything\n\n` +
      `**Practical:**\n` +
      `- Help keep track of deadlines\n` +
      `- Plan and attend college visits together\n` +
      `- Proofread essays (but don't write them!)\n` +
      `- Help organize documents (tax forms, transcripts, etc.)\n\n` +
      `**Emotional:**\n` +
      `- Manage your own anxiety — your stress transfers to your student\n` +
      `- Celebrate small wins along the way\n` +
      `- Be prepared for any outcome and be supportive regardless\n` +
      `- Don't compare your child to others\n\n` +
      `**In ScholarSuite:**\n` +
      `- Monitor your student's deadlines and progress\n` +
      `- Stay informed without being overbearing\n` +
      `- Use the calendar to see upcoming events`,
  },

  // ─── SUMMER ACTIVITIES ────────────────────────────────────────
  {
    id: "summer-activities",
    patterns: [
      /what (should|can) (i|we) do (this |over |during )?summer/i,
      /summer (activities|programs|plans|opportunities)/i,
      /summer before (college|senior|junior)/i,
    ],
    keywords: ["summer", "activities", "programs", "opportunities"],
    handler: () =>
      `**Productive Summer Activities for College Prep:**\n\n` +
      `**Pre-College Programs:**\n` +
      `- University summer programs (many offer free/reduced tuition for low-income students)\n` +
      `- Governor's School programs (state-funded, merit-based)\n` +
      `- STEM-specific camps and research programs\n\n` +
      `**Work & Internships:**\n` +
      `- Part-time or full-time job (shows responsibility)\n` +
      `- Internships in your field of interest\n` +
      `- Starting a small business or freelance project\n\n` +
      `**Academics:**\n` +
      `- SAT/ACT prep (great time for focused studying)\n` +
      `- Taking a community college course\n` +
      `- Independent research project\n\n` +
      `**Service & Leadership:**\n` +
      `- Volunteer in your community\n` +
      `- Start a project addressing a local need\n` +
      `- Attend leadership conferences\n\n` +
      `**College Prep:**\n` +
      `- **Visit colleges** — Summer is great for campus tours\n` +
      `- **Start essays** — Give yourself time to draft and revise\n` +
      `- **Scholarship search** — Build your list for fall applications\n\n` +
      `**Key tip:** Whatever you do, do it meaningfully. Quality and impact matter more than checking boxes.`,
  },

  // ─── SPECIFIC COLLEGE TYPES ───────────────────────────────────
  {
    id: "hbcu",
    patterns: [
      /\bhbcu\b/i,
      /historically black/i,
    ],
    keywords: ["hbcu", "historically", "black"],
    handler: () =>
      `**HBCUs (Historically Black Colleges & Universities):**\n\n` +
      `**What They Are:**\n` +
      `- 107 institutions founded before 1964 to serve Black students\n` +
      `- Open to students of all races and backgrounds\n` +
      `- Known for strong communities, mentorship, and alumni networks\n\n` +
      `**Notable HBCUs:**\n` +
      `- Howard University, Spelman College, Morehouse College\n` +
      `- Hampton University, Tuskegee University, Florida A&M\n` +
      `- North Carolina A&T, Xavier University of Louisiana\n\n` +
      `**Benefits:**\n` +
      `- Strong sense of community and belonging\n` +
      `- Smaller class sizes\n` +
      `- Scholarship opportunities specifically for HBCU students\n` +
      `- Powerful alumni networks\n` +
      `- Cultural enrichment and leadership development\n\n` +
      `**HBCU-Specific Scholarships:**\n` +
      `- United Negro College Fund (UNCF) scholarships\n` +
      `- Thurgood Marshall College Fund\n` +
      `- Many individual HBCUs offer generous merit packages`,
  },

  // ─── MILITARY / ROTC ─────────────────────────────────────────
  {
    id: "rotc-military",
    patterns: [
      /\brotc\b/i,
      /military (scholarship|academy|college)/i,
      /gi bill/i,
      /service academ/i,
    ],
    keywords: ["rotc", "military", "academy", "gi bill"],
    handler: () =>
      `**Military Paths to College:**\n\n` +
      `**ROTC (Reserve Officers' Training Corps):**\n` +
      `- Available at many colleges (Army, Navy/Marines, Air Force)\n` +
      `- **Full-ride scholarships** available (tuition, fees, books + stipend)\n` +
      `- You attend a regular college while training\n` +
      `- Commitment: typically 4 years active duty after graduation\n` +
      `- Apply during senior year of high school\n\n` +
      `**Service Academies:**\n` +
      `- West Point (Army), Naval Academy, Air Force Academy, Coast Guard Academy, Merchant Marine Academy\n` +
      `- **Free** education (tuition, room, board — you also get a salary)\n` +
      `- Extremely competitive — need Congressional nomination for most\n` +
      `- 5-year active duty commitment after graduation\n\n` +
      `**GI Bill:**\n` +
      `- Covers tuition for veterans after active service\n` +
      `- Post-9/11 GI Bill also covers housing and books\n` +
      `- Some benefits transferable to dependents\n\n` +
      `**Tip:** ROTC scholarships are one of the most valuable full-ride opportunities available. Apply even if you're not sure — it's a great option to have.`,
  },

  // ─── SCHOLARSHIPS.COM INFO ────────────────────────────────────
  {
    id: "scholarship-deadlines",
    patterns: [
      /when (are|is|do) scholarship deadlines/i,
      /scholarship (season|cycle)/i,
      /when (to|should) .*(start|apply).*(scholarship)/i,
    ],
    keywords: ["deadline", "when", "season", "cycle", "scholarship"],
    handler: () =>
      `**Scholarship Timeline & Deadlines:**\n\n` +
      `**Year-Round:** Scholarships have deadlines throughout the year — there's no single "season"\n\n` +
      `**Peak Periods:**\n` +
      `- **September-November:** Many national scholarships open\n` +
      `- **December-February:** Largest number of deadlines\n` +
      `- **March-May:** Spring cycle scholarships\n` +
      `- **June-August:** Summer scholarships (less competition!)\n\n` +
      `**Strategy:**\n` +
      `- Start searching the **summer before senior year**\n` +
      `- Apply to scholarships **year-round**, even after enrolling in college\n` +
      `- Set calendar reminders for each deadline\n` +
      `- Don't skip summer scholarships — fewer applicants = better odds\n` +
      `- Many scholarships are **renewable** — apply once, receive for 4 years\n\n` +
      `**In ScholarSuite:**\n` +
      `- Check the **Calendar** for upcoming deadlines\n` +
      `- Use the **Discover** page to find scholarships matched to your profile\n` +
      `- Deadlines are automatically tracked when you add scholarships to your list`,
  },

  // ─── STUDY TIPS ───────────────────────────────────────────────
  {
    id: "study-tips",
    patterns: [
      /study (tips|advice|strategies|techniques|habits)/i,
      /how (to|do i|should i) study/i,
      /study (better|more|effectively|efficiently)/i,
    ],
    keywords: ["study", "tips", "habits", "strategies"],
    handler: () =>
      `**Effective Study Strategies:**\n\n` +
      `**Proven Techniques:**\n` +
      `- **Active Recall** — Test yourself instead of re-reading notes\n` +
      `- **Spaced Repetition** — Review material at increasing intervals\n` +
      `- **Pomodoro Technique** — 25 minutes focused study, 5 minute break\n` +
      `- **Teach Someone** — If you can explain it, you understand it\n` +
      `- **Practice Problems** — Especially for math and science\n\n` +
      `**Environment:**\n` +
      `- Find a consistent, quiet study space\n` +
      `- Remove phone notifications (or use Do Not Disturb)\n` +
      `- Study at the same time each day to build a habit\n` +
      `- Take breaks — your brain needs rest to consolidate\n\n` +
      `**What Doesn't Work:**\n` +
      `- Highlighting/underlining (feels productive, isn't)\n` +
      `- Re-reading notes passively\n` +
      `- Cramming the night before\n` +
      `- Multitasking (switching between study and social media)\n\n` +
      `**For GPA Improvement:**\n` +
      `- Go to every class\n` +
      `- Use office hours — teachers notice and reward effort\n` +
      `- Form study groups with motivated peers\n` +
      `- Start assignments early, not the night before`,
  },

  // ─── AP / IB / DUAL ENROLLMENT ────────────────────────────────
  {
    id: "ap-classes",
    patterns: [
      /\bap\b.*(class|course|exam|test|credit)/i,
      /advanced placement/i,
      /how many ap/i,
      /should i take ap/i,
      /\bib\b.*(program|diploma|class)/i,
      /international baccalaureate/i,
      /dual enrollment/i,
    ],
    keywords: ["ap", "advanced", "placement", "ib", "dual", "enrollment"],
    handler: () =>
      `**AP, IB, and Dual Enrollment:**\n\n` +
      `**AP (Advanced Placement):**\n` +
      `- College-level courses taken in high school\n` +
      `- AP exam scored 1-5 (3+ often earns college credit)\n` +
      `- Boosts weighted GPA\n` +
      `- Shows academic rigor to colleges\n` +
      `- How many? Quality over quantity — 5-8 over high school is solid\n\n` +
      `**IB (International Baccalaureate):**\n` +
      `- Rigorous international curriculum\n` +
      `- IB Diploma requires 6 subjects + extended essay + CAS + TOK\n` +
      `- Highly respected by colleges worldwide\n` +
      `- Can earn college credit with scores of 5+\n\n` +
      `**Dual Enrollment:**\n` +
      `- Take actual college courses while in high school\n` +
      `- Credits transfer to most colleges (check transfer policies)\n` +
      `- Often free or low-cost for high school students\n` +
      `- Great way to explore college-level work\n\n` +
      `**Which Should You Do?**\n` +
      `- Take challenging courses in subjects you're interested in\n` +
      `- Don't overload — better to get A's in some AP/IB than C's in many\n` +
      `- Colleges prefer rigor in context — take what your school offers\n` +
      `- Dual enrollment is great if you want a head start on credits`,
  },

  // ─── CATCH-ALL FALLBACKS ──────────────────────────────────────
  {
    id: "college-cost",
    patterns: [
      /how much (does|do|is) college cost/i,
      /cost of (college|university|tuition)/i,
      /afford college/i,
      /pay for college/i,
    ],
    keywords: ["cost", "afford", "pay", "tuition", "expensive", "price"],
    handler: () =>
      `**College Costs & How to Pay:**\n\n` +
      `**Average Annual Costs (2024-25):**\n` +
      `- **Community College:** ~$3,800/year\n` +
      `- **Public University (in-state):** ~$11,000/year tuition\n` +
      `- **Public University (out-of-state):** ~$23,000/year tuition\n` +
      `- **Private University:** ~$42,000/year tuition\n` +
      `- Add ~$12,000-18,000/year for room, board, books, and personal\n\n` +
      `**But: "Sticker Price" ≠ What You Pay**\n` +
      `- Most students pay significantly less than sticker price\n` +
      `- Average discount rate at private schools is ~55%\n` +
      `- Use each school's **Net Price Calculator** for your estimated cost\n\n` +
      `**Ways to Pay:**\n` +
      `1. **Scholarships** — Free money! (That's why you're on ScholarSuite)\n` +
      `2. **Grants** — Federal Pell Grant, state grants, institutional grants\n` +
      `3. **Work-Study** — Part-time campus employment\n` +
      `4. **Savings** — 529 plans, personal savings\n` +
      `5. **Federal Loans** — Subsidized first, then unsubsidized\n` +
      `6. **Private Loans** — Last resort\n\n` +
      `**Remember:** The most expensive school isn't always the best. The best school is the one you can attend without crushing debt.`,
  },

  {
    id: "transcript",
    patterns: [
      /transcript/i,
      /send (my )?records/i,
      /official (school )?records/i,
    ],
    keywords: ["transcript", "records", "official"],
    handler: () =>
      `**Transcripts:**\n\n` +
      `**What Is a Transcript?**\n` +
      `- Your official academic record showing courses, grades, and GPA\n` +
      `- Required by all colleges and most scholarships\n\n` +
      `**How to Send Them:**\n` +
      `- Request through your school counselor or registrar\n` +
      `- Most schools use electronic services like **Parchment**, **Naviance**, or **Common App**\n` +
      `- Some schools send paper transcripts by mail\n` +
      `- Allow **2-4 weeks** for processing\n\n` +
      `**Tips:**\n` +
      `- Request transcripts early — counselors get busy near deadlines\n` +
      `- Keep track of which schools/scholarships you've sent them to\n` +
      `- Some scholarships only need an unofficial transcript (which you can often download yourself)\n` +
      `- Verify accuracy — check your transcript for errors before sending`,
  },

  {
    id: "waitlist",
    patterns: [
      /waitlist(ed)?/i,
      /wait list/i,
      /deferred/i,
      /what (to do|if|happens).*(waitlist|deferred)/i,
    ],
    keywords: ["waitlist", "deferred", "wait"],
    handler: () =>
      `**Waitlisted or Deferred? Here's What to Do:**\n\n` +
      `**If Waitlisted:**\n` +
      `- Accept your spot on the waitlist if you're still interested\n` +
      `- Send a **Letter of Continued Interest (LOCI)** — reaffirm your interest, update achievements\n` +
      `- Continue pursuing your other accepted schools — commit to one by May 1\n` +
      `- Don't put all your hopes on the waitlist — acceptance rates from waitlists vary widely\n` +
      `- Some schools never take anyone from the waitlist; others take many\n\n` +
      `**If Deferred (Early Decision/Action → Regular Decision):**\n` +
      `- Your application will be reviewed again in the regular cycle\n` +
      `- Send updates: new grades, achievements, awards\n` +
      `- Write a brief letter reaffirming your interest\n` +
      `- Continue applying to other schools\n\n` +
      `**What NOT to Do:**\n` +
      `- Don't call admissions repeatedly\n` +
      `- Don't have parents call on your behalf\n` +
      `- Don't give up — use this as motivation to make your other applications even stronger`,
  },

  {
    id: "rejection",
    patterns: [
      /rejected/i,
      /didn'?t get (in|accepted|admitted)/i,
      /college rejection/i,
      /not accepted/i,
      /denial letter/i,
    ],
    keywords: ["rejected", "rejection", "denied", "not accepted"],
    handler: () =>
      `**Dealing with College/Scholarship Rejection:**\n\n` +
      `**First: It's Normal.**\n` +
      `- Even the strongest applicants face rejections\n` +
      `- Top schools reject 90%+ of applicants\n` +
      `- A rejection says more about competition than about you\n\n` +
      `**What to Do:**\n` +
      `- Allow yourself to feel disappointed — that's natural\n` +
      `- Talk to someone you trust\n` +
      `- Focus on the schools that DID accept you\n` +
      `- Remember: where you go matters less than what you do there\n\n` +
      `**Moving Forward:**\n` +
      `- You can appeal (rarely works, but worth trying if circumstances changed)\n` +
      `- Consider transfer applications after a year at another school\n` +
      `- Apply to more scholarships — each one is a fresh start\n` +
      `- Many wildly successful people were rejected from their "dream" school\n\n` +
      `**Perspective:**\n` +
      `Research consistently shows that a student's success depends more on their own effort and engagement than on which specific college they attend. You will be successful wherever you go.`,
  },
]

// ─── FUZZY KEYWORD MATCHING ─────────────────────────────────────
// If no exact regex matches, score each rule by keyword overlap
function scoreKeywordMatch(query: string, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const words = query.toLowerCase().split(/\s+/)
  let matches = 0
  for (const keyword of keywords) {
    if (words.some((w) => w.includes(keyword) || keyword.includes(w))) {
      matches++
    }
  }
  // Require at least 2 keyword matches for fuzzy match (or 1 if the keyword list is very specific)
  if (matches === 0) return 0
  if (keywords.length <= 2 && matches >= 1) return matches / keywords.length
  if (matches >= 2) return matches / keywords.length
  return 0
}

export function tryRuleBasedResponse(
  query: string,
  userName: string,
  role: string
): RuleResult | null {
  const ctx: RuleContext = {
    userName: userName || "there",
    role: (role as "STUDENT" | "PARENT" | "ADMIN") || "STUDENT",
  }

  // Layer 1: Exact regex match (high confidence)
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(query.trim())) {
        return { reply: rule.handler(query, ctx) }
      }
    }
  }

  // Layer 2: Fuzzy keyword match (lower confidence, higher coverage)
  let bestScore = 0
  let bestRule: RulePattern | null = null

  for (const rule of rules) {
    const score = scoreKeywordMatch(query, rule.keywords)
    if (score > bestScore) {
      bestScore = score
      bestRule = rule
    }
  }

  // Threshold: need at least 40% keyword match
  if (bestRule && bestScore >= 0.4) {
    return { reply: bestRule.handler(query, ctx) }
  }

  return null
}
