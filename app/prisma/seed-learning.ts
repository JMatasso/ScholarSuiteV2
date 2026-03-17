import "dotenv/config";
if (process.env.DATABASE_URL?.includes("railway")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/* ─────────────────────────────── helpers ─────────────────────────────── */

function tip(text: string) {
  return `<div class="rounded-lg border border-blue-200 bg-blue-50/60 p-3 my-3"><p class="text-sm font-medium text-blue-900 mb-0"><strong>💡 Pro Tip:</strong> ${text}</p></div>`;
}
function warning(text: string) {
  return `<div class="rounded-lg border border-amber-200 bg-amber-50/60 p-3 my-3"><p class="text-sm font-medium text-amber-900 mb-0"><strong>⚠️ Watch Out:</strong> ${text}</p></div>`;
}
function stat(label: string, value: string) {
  return `<div class="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F]/5 px-3 py-1.5 mr-2 mb-2"><span class="text-xs font-medium text-[#1E3A5F]/60">${label}</span><span class="text-sm font-bold text-[#1E3A5F]">${value}</span></div>`;
}
function takeaways(items: string[]) {
  const lis = items.map((i) => `<li>${i}</li>`).join("");
  return `<!-- KEY_TAKEAWAYS --><div class="space-y-1"><ul class="list-disc pl-4 space-y-1 text-sm">${lis}</ul></div>`;
}

/* ─────────────────────── Module & Lesson Data ─────────────────────── */

interface LessonData {
  title: string;
  content: string;
  type?: "TEXT" | "VIDEO" | "LINK";
  videoUrl?: string;
  externalUrl?: string;
}

interface ModuleData {
  title: string;
  description: string;
  category: string;
  order: number;
  icon?: string;
  lessons: LessonData[];
}

const modules: ModuleData[] = [
  /* ================================================================
     MODULE 1: Getting Started with Scholarships
     ================================================================ */
  {
    title: "Getting Started with Scholarships",
    description: "Build your foundation — understand the scholarship landscape, set up your tools, and learn the rules that separate winners from everyone else.",
    category: "Getting Started",
    order: 1,
    icon: "rocket",
    lessons: [
      {
        title: "Welcome & Overview",
        content: `
<h3>Your Scholarship Journey Starts Here</h3>
<p>Congratulations on taking the first steps toward paying for college! Secondary education is not cheap — whether you choose to pursue a community college, a four-year university, or a vocational trade school, it takes money to make money.</p>

<p>Like most students, you may not have the athletic or academic talent for a full ride. Your family might make just enough to disqualify you from need-based financial aid, yet not enough to pay for school outright. You might feel like you lack the specific background that many scholarship organizations are looking for.</p>

<p><strong>Despite all of that, there is hope.</strong> Anyone can earn scholarships — all it takes is a combination of knowing where to look, hard work, and dedication. The ScholarShape method was developed by someone who paid for school with just a <strong>23% scholarship success rate</strong>. That means for roughly every 4 applications submitted, only 1 resulted in an award. But those wins added up to cover the full cost of a college education.</p>

<h3>What You'll Learn in This Course</h3>
<p>This learning hub is your trusted companion throughout the entire scholarship application journey. It covers every stage of the process:</p>
<ul>
  <li><strong>Finding Scholarships</strong> — Where to look, which websites to use, and how to identify the best opportunities for your profile</li>
  <li><strong>Preparing Your Materials</strong> — Building a professional resume, getting recommendation letters, organizing your documents</li>
  <li><strong>Applying Strategically</strong> — Tracking applications, writing winning essays, and preparing for interviews</li>
  <li><strong>After Winning</strong> — Managing disbursements, submitting post-award documents, and understanding tuition deadlines</li>
</ul>

${tip("You don't need to memorize any of this. Whenever you need advice on any aspect of the application process, simply come back to the relevant lesson and find the answers right at your fingertips.")}

<h3>The Right Mindset</h3>
<p>The scholarship process can be inefficient, intricate, and at times daunting. You will face rejection — a lot of it. That's completely normal. The students who succeed aren't the ones who never fail; they're the ones who keep submitting applications despite the rejections. Think of it like a job search: you only need a handful of "yes" responses to change your financial future.</p>

<p>This course will simplify the process, reduce your stress, and dramatically improve your odds. Let's get started.</p>

${takeaways([
  "Anyone can earn scholarships regardless of background — it takes knowing where to look, hard work, and dedication",
  "A 23% success rate was enough to pay for a full college education",
  "This course covers the complete lifecycle: finding → applying → winning → managing scholarships",
  "Rejection is normal and expected — persistence is the key differentiator",
  "Come back to these lessons anytime you need guidance on a specific topic",
])}`,
      },
      {
        title: "Getting Started Checklist",
        content: `
<h3>Your First Steps</h3>
<p>Before diving into applications, you need to set up your infrastructure. Students who skip this step end up disorganized, miss deadlines, and leave money on the table. Here's your step-by-step launch plan:</p>

<h3>Step 1: Set Up Your Scholarship Spreadsheets</h3>
<p>Create a tracking system where you can organize your applications, finances, and future goals. This can be a Google Sheet, Excel file, or even a Notion database. The format doesn't matter — what matters is that you have <strong>one central place</strong> to track everything.</p>

<h3>Step 2: Choose Two Scholarship Websites</h3>
<p>Create accounts on at least two scholarship search engines (we cover the best ones in a later lesson). Fill in your demographics completely so they can match you with relevant scholarships. The more information you provide, the better your matches will be.</p>

<h3>Step 3: Find 10 Applicable Scholarships</h3>
<p>Browse your chosen websites and identify 10 scholarships you're eligible for. Add them to your tracking spreadsheet and order them chronologically based on their due dates. This gives you a clear roadmap of what to work on first.</p>

<h3>Step 4: Start Applying!</h3>
<p>Don't wait until everything is perfect. Start submitting applications as soon as you have the required materials. You'll get better with each application you complete.</p>

<h3>Create Your Document Folder</h3>
<p>Set up a dedicated folder on your computer (or cloud storage) with each of these items ready to go. Physical documents can be scanned and uploaded:</p>

<ul>
  <li>✅ <strong>Professional Resume</strong> — One page, reverse chronological order</li>
  <li>✅ <strong>Professional Headshot</strong> — Business professional, good lighting, neutral background</li>
  <li>✅ <strong>IB/AP Test Scores</strong> — Downloaded from College Board</li>
  <li>✅ <strong>SAT/ACT Scores</strong> — Official score reports saved as PDF</li>
  <li>✅ <strong>Unofficial Transcript</strong> — Request from your high school counselor</li>
  <li>✅ <strong>2-3 Letters of Recommendation</strong> — From teachers, mentors, or supervisors</li>
  <li>✅ <strong>Master List of Accomplishments</strong> — Awards, volunteering, extracurriculars, and work experience</li>
</ul>

${tip("Having all documents ready in one folder means you can apply to most scholarships in under 30 minutes instead of scrambling to find documents each time.")}

${takeaways([
  "Set up a tracking spreadsheet before you start applying — organization is the foundation of success",
  "Create accounts on at least 2 scholarship search engines with complete demographic profiles",
  "Find your first 10 scholarships and order them by deadline",
  "Build a document folder with your 7 essential items: resume, headshot, test scores, transcript, recommendation letters, and accomplishment list",
  "Don't wait for perfection — start applying and improve as you go",
])}`,
      },
      {
        title: "The 10 Golden Rules",
        content: `
<h3>Rules That Separate Winners from Everyone Else</h3>
<p>These ten rules of thumb were developed through real experience applying for dozens of scholarships. Follow them and you'll avoid the most common mistakes that cost students money.</p>

<h3>Rule #1: Scholarships Are a NUMBERS GAME</h3>
<p>Be prepared for rejection — success rates are low. The author of the ScholarShape method paid for school with just a <strong>23% success rate</strong>. That means 77% of applications resulted in rejection. The key is volume: the more quality applications you submit, the more wins you'll accumulate.</p>
${stat("Success Rate", "23%")} ${stat("Strategy", "Volume + Quality")}

<h3>Rule #2: No Work = Not Worth an Application</h3>
<p>If a scholarship requires zero effort to apply, it's likely a scam, a giveaway designed to harvest your personal information, or a ploy to drive up online engagement. Legitimate scholarships require you to demonstrate your qualifications.</p>
${warning("\"No-Essay\" scholarships and Instagram giveaways are almost always engagement bait or data harvesting. Ignore them.")}

<h3>Rule #3: Do NOT Be Humble</h3>
<p>This is not the time for modesty. Highlight <strong>all</strong> of your achievements, involvements, and awards. These applications are the <em>only way</em> to make yourself stand out from hundreds or thousands of other applicants. If you don't tell them about your accomplishments, nobody will.</p>

<h3>Rule #4: Consider Your Household Income</h3>
<p>If your household income is above the U.S. average, think twice about applying for need-based scholarships. In most cases, you'll be automatically discounted due to your income bracket. That said, each family's financial situation is unique — make an educated decision based on your specific circumstances.</p>

<h3>Rule #5: Follow Up With Recommendation Letter Writers</h3>
<p><strong>Always assume your recommendation writers have forgotten about their submission deadlines.</strong> Reach out, reach out, reach out! If your writer forgets about a deadline, you are the one who gets stuck with the consequences — not them.</p>

<h3>Rule #6: Break Up Financial Goals</h3>
<p>Focus on smaller financial milestones instead of the overwhelming total cost. Instead of thinking "I need $120,000 for four years," focus on "I need $30,000 for freshman year." Breaking it down makes the goal feel achievable and helps you track progress.</p>

<h3>Rule #7: Quadruple Check Your Essays</h3>
<p>Run every essay through Grammarly or a similar grammar checker. Have a friend, parent, or teacher read it. Then wait a day and proofread it again. Fresh eyes <em>always</em> catch something you missed.</p>

<h3>Rule #8: There is No Such Thing as "Optional"</h3>
<p>If an application has an "optional" segment, <strong>IT IS NOT OPTIONAL</strong>. If you neglect something due to laziness, you give someone else who put in the effort a clear advantage. Complete every section of every application.</p>

<h3>Rule #9: Write Everything Down</h3>
<p>You will forget anything you don't write down. Keep detailed records of all relevant information and deadlines. This includes application due dates, recommendation letter deadlines, interview times, and disbursement schedules.</p>

<h3>Rule #10: Plan for Disbursement Delays</h3>
<p>Be prepared for financial aid disbursements to potentially arrive late — after tuition payment deadlines. This is extremely common. Have a backup plan (payment plans, emergency loans, or temporary out-of-pocket payment) ready in case your scholarship checks are delayed.</p>

${takeaways([
  "Expect a ~20-25% success rate — submit many quality applications to accumulate wins",
  "If it requires no work, it's probably a scam — legitimate scholarships require effort",
  "Never be humble on applications — highlight every achievement you have",
  "Always follow up with recommendation letter writers before deadlines",
  "Treat every 'optional' section as mandatory and write everything down",
])}`,
      },
      {
        title: "Application Season Timeline",
        content: `
<h3>When to Apply</h3>
<p>Scholarship opportunities typically open in <strong>late September</strong> and wrap up by the <strong>end of May</strong>. This is your window of opportunity — once it closes, it's gone. Waiting until midway through the year to start means missing out on approximately <strong>50% of available scholarships</strong>.</p>

${stat("Season Opens", "September")} ${stat("Season Closes", "May")} ${stat("Miss Half If You Wait Until", "January")}

<h3>When Is the Best Time to Apply?</h3>
<p><strong>Senior Year of High School.</strong> This is the single most important year for scholarship applications, and here's why:</p>

<ul>
  <li><strong>Many organizations only offer scholarships to high school seniors</strong> — you literally can't apply at any other time</li>
  <li>You've spent four years building your resume with extracurricular involvements, advanced classes, work experience, and more</li>
  <li>Your accomplishment list is at its peak — you have the most material to work with</li>
  <li>Colleges and universities offer their largest scholarship packages to incoming freshmen</li>
</ul>

<h3>Why You Can't Just Wait Until College</h3>
<p>Students who think "I'll just apply for scholarships once I'm in college" face several major disadvantages:</p>

<ul>
  <li><strong>Limited Track Record:</strong> College underclassmen have a short academic and extracurricular history at the university level — far less impressive than a full high school career</li>
  <li><strong>High School Achievements Become Irrelevant:</strong> Once you're on campus, your high school GPA and most extracurriculars lose relevance in scholarship evaluations</li>
  <li><strong>Unclear Academic Goals:</strong> Underclassmen often lack well-defined long-term academic and career goals, making it difficult to identify aligned scholarships</li>
  <li><strong>Limited Major-Specific Scholarships:</strong> Many department-level and major-specific scholarships only become available in later stages of undergraduate education</li>
</ul>

${tip("Start browsing scholarship websites and building your document folder the summer before senior year. When September hits, you'll be ready to submit applications immediately.")}

<h3>Monthly Breakdown</h3>
<p>Here's a rough guide for how to pace yourself through the season:</p>
<ul>
  <li><strong>September-October:</strong> Set up accounts on scholarship websites, gather documents, start identifying opportunities</li>
  <li><strong>November-December:</strong> Begin submitting applications with earlier deadlines, request recommendation letters</li>
  <li><strong>January-February:</strong> Peak application season — aim to submit 2-3 applications per week</li>
  <li><strong>March-April:</strong> Continue applying, follow up on submitted applications, prepare for interviews</li>
  <li><strong>May:</strong> Final deadline push, wrap up remaining applications</li>
</ul>

${takeaways([
  "Scholarship season runs September through May — starting late means missing up to 50% of opportunities",
  "Senior year of high school is the single best time to apply for scholarships",
  "Once in college, your high school achievements lose relevance and competition increases",
  "Start preparing the summer before senior year so you're ready when the season opens",
  "Aim to submit 2-3 applications per week during peak season (January-February)",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 2: Finding Scholarships
     ================================================================ */
  {
    title: "Finding Scholarships",
    description: "Learn where to look, which websites to use, how to evaluate opportunities, and what to avoid.",
    category: "Finding Scholarships",
    order: 2,
    icon: "search",
    lessons: [
      {
        title: "Local vs. National Scholarships",
        content: `
<h3>The Hidden Goldmine: Local Scholarships</h3>
<p>When most students think of scholarships, they imagine big national competitions with thousands of applicants. But the <strong>easiest money to win</strong> is sitting right in your own community — and most students completely overlook it.</p>

<p>Local scholarships are created to support students from a particular community or area. They're tailored to the unique needs, interests, or goals of your region, and they offer massive advantages over national programs.</p>

<h3>Why Local Scholarships Are Easier to Win</h3>

<h4>1. Higher Chance of Success</h4>
<ul>
  <li>Dramatically <strong>smaller number of competitors</strong> — often just a handful of applicants</li>
  <li>A <strong>less competitive pool</strong> of applicants (not the hyper-achieving students who apply to national programs)</li>
  <li>Many local scholarships receive <strong>ZERO applications</strong> — free money left on the table every year</li>
</ul>

${stat("Local Applicants", "5-50")} ${stat("National Applicants", "5,000-50,000")} ${stat("Some Get", "0 Applications")}

<h4>2. Community Connection</h4>
<ul>
  <li>Local scholarships are typically provided by organizations, businesses, or individuals within your community</li>
  <li>Community involvement and volunteer service goes a <strong>long way</strong> with these providers</li>
  <li>You may already have personal connections to the people making the decisions</li>
</ul>

<h4>3. Easier Applications</h4>
<ul>
  <li>Lower GPA requirements than national scholarships</li>
  <li>Applications are generally less time-consuming</li>
  <li>Many require only a short essay or no essay at all</li>
</ul>

${tip("Apply for EVERY local scholarship you come across, even if the award amount seems small. These are the easiest sources of financial aid to obtain, and small amounts add up fast — five $500 scholarships equals a $2,500 win.")}

<h3>National Scholarships</h3>
<p>National scholarships are larger and more prestigious, but they're also vastly more competitive. They make sense to pursue when:</p>
<ul>
  <li>You have exceptional qualifications that match the specific criteria</li>
  <li>The award amount justifies the significant time investment</li>
  <li>You've already exhausted local opportunities</li>
</ul>

<p><strong>Strategy:</strong> Build your foundation with local scholarships (high win rate, lower effort), then selectively pursue national ones where you're a strong match.</p>

${takeaways([
  "Local scholarships are the easiest money to win — some receive ZERO applications",
  "Local competitions have 5-50 applicants vs. thousands for national programs",
  "Community involvement and volunteer work carry significant weight with local providers",
  "Apply for every local scholarship you find, regardless of size — they add up",
  "Use local wins as your foundation, then selectively target national scholarships",
])}`,
      },
      {
        title: "Resources for Local Scholarships",
        content: `
<h3>Where to Find Local Scholarships</h3>
<p>Local scholarships aren't always widely advertised. You need to know where to look. Here are the five best sources:</p>

<h3>1. High School Counselor Lists</h3>
<p>This is your <strong>number one resource</strong>. Your high school's official website should have a scholarship page maintained by your guidance counselors. This list typically contains:</p>
<ul>
  <li>Dozens of local scholarships sent in by community donors throughout the year</li>
  <li>Scholarships that are <strong>specific to your high school</strong> (alumni-funded, school-specific awards)</li>
  <li>Regional scholarships that target your school district</li>
</ul>

${tip("Check your counselor's scholarship list at least once a week during application season. New opportunities are added regularly as donors submit them.")}

<h3>2. Neighboring High Schools</h3>
<p>Check the websites of other high schools in your region. Each school maintains its own curated list of local scholarship opportunities. They might have something your counselor missed, especially if they're in a different part of the county or district.</p>
${warning("Keep in mind that some scholarship links on other schools' websites may require district-specific email addresses to access. If you can't access a link, search for the scholarship name directly on Google.")}

<h3>3. Previous Year Winners</h3>
<p>Your high school should keep track of all the awards students received from the previous year. This information is often compiled for year-end awards nights. Ask your counselors if you can access this list — it's a goldmine of scholarship names you can research and apply to for the current year.</p>

<h3>4. Community Organizations & Clubs</h3>
<p>Many local community organizations offer scholarships that fly under the radar. Check with:</p>
<ul>
  <li><strong>Religious organizations/churches</strong> — Many parishes and congregations offer scholarships to members</li>
  <li><strong>Rotary clubs</strong> — Nearly every town has a Rotary club that awards local scholarships</li>
  <li><strong>Women's clubs & civic groups</strong> — Organizations like the Junior League, Kiwanis, Lions Club</li>
  <li><strong>Boy Scouts & Girl Scouts</strong> — Eagle Scout and Gold Award scholarships, plus troop-level awards</li>
  <li><strong>FFA/4-H chapters</strong> — Agricultural and leadership scholarships for members and non-members</li>
  <li><strong>Local businesses</strong> — Many businesses sponsor scholarships as community outreach</li>
  <li><strong>Professional associations</strong> — Medical societies, bar associations, engineering groups in your area</li>
</ul>

<h3>5. Online Scholarship Search Engines</h3>
<p>While local scholarships may not always be widely advertised online, you can still find some using scholarship search engines. Filter by your state, county, or city when searching. Many databases allow you to narrow results by geographic location.</p>

${tip("Create a master list of every organization in your community and systematically check each one for scholarship opportunities. It takes a few hours but can uncover thousands of dollars in overlooked funding.")}

${takeaways([
  "Your high school counselor's scholarship list is the #1 resource — check it weekly",
  "Check neighboring high schools' websites for opportunities your school might have missed",
  "Ask counselors for last year's award winners list to identify scholarship names you can research",
  "Systematically check community organizations: churches, Rotary, scouts, FFA, civic groups, and local businesses",
  "Use scholarship search engines with geographic filters to find additional local opportunities",
])}`,
      },
      {
        title: "Searching the Internet",
        content: `
<h3>Using Search Engines Strategically</h3>
<p>Beyond dedicated scholarship websites, you can find unique opportunities using any standard search engine — Google, Bing, etc. The key is knowing <strong>what to search for</strong>.</p>

<p>Start with specific keywords related to your interests, skills, hobbies, major, or any unique qualities that make you stand out. You would be surprised how often scholarships are offered to people with oddly specific characteristics — some are as niche as eye color or height!</p>

<h3>What to Search For</h3>
<p>Use these categories as search terms, combined with "scholarship" or "scholarship 2025-2026":</p>

<div class="grid grid-cols-2 gap-x-4 gap-y-1 my-4">
  <ul>
    <li>✓ Cultural heritage</li>
    <li>✓ Ethnicity/Race</li>
    <li>✓ Disabilities</li>
    <li>✓ Medical situations</li>
    <li>✓ Life-altering events</li>
    <li>✓ Socioeconomic status</li>
    <li>✓ Height</li>
  </ul>
  <ul>
    <li>✓ Gender</li>
    <li>✓ Political affiliations</li>
    <li>✓ Geographic regions</li>
    <li>✓ Parental employment</li>
    <li>✓ Orientation</li>
    <li>✓ Extracurriculars</li>
    <li>✓ Career interests</li>
  </ul>
</div>

<h3>Search Formula Examples</h3>
<p>Combine your unique characteristics with the word "scholarship" to find targeted opportunities:</p>
<ul>
  <li><em>"left-handed scholarship"</em> — Yes, these exist</li>
  <li><em>"scholarships for tall people"</em> — Tall Clubs International offers these</li>
  <li><em>"[your state] first-generation college student scholarship"</em></li>
  <li><em>"scholarship for students whose parent works in [industry]"</em></li>
  <li><em>"[your hobby/sport] scholarship 2025"</em></li>
  <li><em>"[your intended major] scholarship [your state]"</em></li>
</ul>

${tip("Make a list of EVERY unique characteristic about yourself — heritage, hobbies, medical history, family background, interests, physical traits — and search for scholarships for each one. Do not throw anything out. The more niche you are, the less competition you'll face.")}

<h3>Advanced Search Techniques</h3>
<ul>
  <li>Use <strong>quotation marks</strong> to search for exact phrases: <em>"nursing scholarship Texas 2025"</em></li>
  <li>Use <strong>site:</strong> to search specific domains: <em>site:reddit.com scholarships for engineering majors</em></li>
  <li>Search for <strong>recent results</strong> by filtering by date in Google (Tools → Past year)</li>
  <li>Try <strong>different word combinations</strong> — "scholarship," "grant," "award," "fellowship," "financial aid"</li>
</ul>

${takeaways([
  "Use standard search engines with specific keywords about YOUR unique characteristics",
  "Scholarships exist for extremely niche traits — height, hobbies, heritage, medical conditions",
  "Combine characteristic + 'scholarship' + year + state for best results",
  "Make a complete list of everything unique about you and search for each item",
  "Use quotation marks and date filters for more targeted search results",
])}`,
      },
      {
        title: "Scholarship Websites & Search Engines",
        content: `
<h3>What Are Scholarship Databases?</h3>
<p>Scholarship databases are online platforms that compile thousands of scholarship opportunities in one searchable location. You create a profile with your demographics, academics, and interests, and the platform matches you with relevant scholarships.</p>

<h3>How to Get Started</h3>
<ol>
  <li><strong>Choose a website</strong> from the recommended list below</li>
  <li><strong>Create an account</strong> and log in</li>
  <li><strong>Complete your profile thoroughly</strong> — input ALL relevant personal information so the database can match you with potential scholarships. The more details you provide, the better your matches</li>
  <li><strong>Sort through the provided lists</strong> and identify viable applications</li>
</ol>

<h3>Top 5 Recommended Websites</h3>
<p>These are the most helpful, user-friendly, and reliable scholarship databases (ranked in order of usefulness):</p>
<ol>
  <li><strong>Scholarships.com</strong> — Large database, clean interface, good matching algorithm</li>
  <li><strong>Fastweb.com</strong> — One of the oldest and largest databases with millions of scholarships</li>
  <li><strong>BigFuture (CollegeBoard)</strong> — Backed by College Board, integrates with SAT data</li>
  <li><strong>Kaleidoscope.com</strong> — Growing platform with a modern interface</li>
  <li><strong>ScholarshipAmerica.org</strong> — Nonprofit-run with high-quality verified listings</li>
</ol>

${tip("Create accounts on at least 2-3 of these sites. Each database has different partnerships and listings, so using multiple sites ensures you don't miss opportunities that only appear on one platform.")}

<h3>Additional Websites</h3>
<p>These sites can supplement your search but should be used with more caution (some have outdated listings or aggressive marketing):</p>
<ul>
  <li>GoingMerry.com</li>
  <li>Niche.com</li>
  <li>ScholarshipOwl.com</li>
  <li>Bold.org</li>
  <li>StudentScholarships.org</li>
  <li>SallieMae.com</li>
</ul>

${warning("Be cautious with secondary scholarship sites. Some have outdated information, lack user-friendliness, or engage in aggressive data collection. Always verify scholarship details directly with the provider organization.")}

${takeaways([
  "Scholarship databases match you with opportunities based on your profile — complete your profile thoroughly",
  "Top 5 recommended: Scholarships.com, Fastweb, BigFuture, Kaleidoscope, ScholarshipAmerica",
  "Use at least 2-3 different databases since each has unique listings",
  "Be cautious with secondary sites — verify scholarship details directly with providers",
  "Log in regularly to check for new matches as scholarships are added throughout the year",
])}`,
      },
      {
        title: "Shopping for Scholarships",
        content: `
<h3>Choosing Wisely: Not All Scholarships Are Worth Your Time</h3>
<p>Your time is valuable. With hundreds of potential scholarships to choose from, you need a strategy for deciding which ones deserve your effort. Here's how to evaluate each opportunity:</p>

<h3>Evaluation Criteria</h3>

<h4>Eligibility Requirements</h4>
<p>This is the first filter. Ensure you meet <strong>all</strong> the eligibility criteria before investing time in an application. Check for: academic achievement minimums, major/field of study requirements, demographic background specifications, geographic restrictions, and any other specific qualifications.</p>

<h4>Award Amount</h4>
<p>Evaluate the scholarship's monetary value, but don't only chase the biggest numbers. While larger awards are attractive, smaller scholarships ($250-$1,000) often have <strong>far fewer applicants</strong> and can add up quickly.</p>
${stat("5 x $500", "= $2,500")} ${stat("Fewer Applicants", "= Better Odds")}

<h4>Number of Awards</h4>
<p>Some scholarships award only 1 recipient. Others award 5, 10, or even 50 recipients. A $1,000 scholarship with 20 winners gives you much better odds than a $5,000 scholarship with 1 winner.</p>

<h4>Essay or Interview Requirements</h4>
<p>Assess the application components — essays, interviews, recommendation letters, portfolios. Be prepared to allocate time and effort accordingly. A $500 scholarship requiring a 2,000-word essay and two interviews may not be worth it compared to a $500 scholarship requiring only a short application form.</p>

<h4>The Labor/Reward Ratio</h4>
<p>Ask yourself this critical question: <em>Is the amount of money I could receive, considering my likelihood of being awarded the scholarship, worth the amount of work I'll have to put in?</em></p>

${tip("The two most important things to consider when choosing between scholarships are (1) whether they match your characteristics and (2) whether they offer a realistic chance of success. A perfect-match $500 scholarship is often more valuable than a long-shot $10,000 one.")}

<h3>Priority Matrix</h3>
<p>Rank your scholarship opportunities using this framework:</p>
<ul>
  <li><strong>High Priority:</strong> Strong eligibility match + reasonable effort + good odds (local, fewer applicants)</li>
  <li><strong>Medium Priority:</strong> Good match + moderate effort + decent odds</li>
  <li><strong>Low Priority:</strong> Marginal match + high effort + competitive odds</li>
  <li><strong>Skip:</strong> Don't meet eligibility, or effort vastly exceeds potential reward</li>
</ul>

${takeaways([
  "Always verify you meet ALL eligibility requirements before investing time in an application",
  "Smaller scholarships often have far fewer applicants — don't overlook them",
  "Consider the number of awards: 20 winners = much better odds than 1 winner",
  "Evaluate the labor/reward ratio: is the work worth the potential payout given your odds?",
  "Prioritize scholarships where you're a strong match with realistic odds of winning",
])}`,
      },
      {
        title: "GPA Requirements Explained",
        content: `
<h3>Do Scholarships Require Certain GPAs?</h3>
<p><strong>Best Answer: It Depends.</strong> The significance of GPA in a scholarship application varies depending on the reputation of the organization and the specific purpose of the scholarship. Some weight GPA heavily; others barely consider it.</p>

<h3>Minimum GPA Requirements</h3>
<p>Scholarships often specify a minimum GPA that applicants must meet. Common minimums range from <strong>2.0 to 3.5</strong> on a 4.0 scale, though they vary widely. It's essential to review each scholarship's eligibility criteria to ensure your GPA aligns with their requirements.</p>

${stat("Common Range", "2.0 - 3.5")} ${stat("Scale", "4.0 (Unweighted)")}

<h3>Maintaining GPA for Renewal</h3>
<p>Some scholarships require recipients to maintain a certain GPA throughout their scholarship tenure, not just at the time of application. This is especially common with:</p>
<ul>
  <li>University/institutional scholarships (often require 3.0+ to keep)</li>
  <li>Multi-year renewable scholarships</li>
  <li>Department or major-specific awards</li>
</ul>
${warning("Failure to meet the GPA requirement for renewal can result in loss of the scholarship. Always know the renewal requirements BEFORE accepting an award.")}

<h3>Types of GPA</h3>
<p>Scholarships may ask for different types of GPA, so know the difference:</p>

<h4>Weighted GPA</h4>
<ul>
  <li>Typically calculated on a <strong>5.0 or 6.0 scale</strong> (varies by school or district)</li>
  <li>Accounts for GPA boosts from advanced classes like Honors, AP, or IB courses</li>
  <li>A student with all A's in AP classes could have a 5.0 weighted GPA</li>
</ul>

<h4>College/Unweighted GPA</h4>
<ul>
  <li>Calculated on a <strong>4.0 scale</strong></li>
  <li>Based purely on letter grades you receive — an A in AP English and an A in regular English both count as 4.0</li>
  <li>This is what most scholarships and colleges refer to as your "GPA"</li>
</ul>

${tip("If a scholarship asks for your GPA without specifying weighted or unweighted, use your unweighted (4.0 scale) GPA unless it makes you ineligible. When in doubt, report whichever is higher and specify which type it is.")}

${takeaways([
  "GPA requirements vary widely — common minimums range from 2.0 to 3.5 on a 4.0 scale",
  "Know the difference between weighted (5.0-6.0 scale) and unweighted (4.0 scale) GPA",
  "Some scholarships require maintaining a minimum GPA for renewal — read the fine print",
  "If unspecified, report whichever GPA type is higher and note which scale you're using",
  "Don't skip scholarships with GPA requirements slightly above yours — some have flexibility",
])}`,
      },
      {
        title: "Financial Need & Applications",
        content: `
<h3>How Is Financial Need Determined?</h3>
<p>Financial need is determined in two primary ways, depending on the scholarship provider:</p>

<h3>Method 1: FAFSA Form</h3>
<p>The Free Application for Federal Student Aid (FAFSA) collects your family's financial data and calculates an <strong>Expected Family Contribution (EFC)</strong>. This EFC is used by schools and many scholarship providers to evaluate your financial need. A lower EFC indicates greater financial need.</p>

<h3>Method 2: Annual Household Income</h3>
<p>Many scholarships skip the FAFSA entirely and simply ask how much money your household brings in each year. They may ask for a specific number or a general income bracket.</p>

<h3>For Low-Income Earners</h3>
<ul>
  <li>You are <strong>eligible for scholarships specifically designed for financial need</strong></li>
  <li><strong>Pell Grants</strong> and federal aid are available through annual FAFSA submission</li>
  <li>The majority of Pell Grants are awarded to households earning less than <strong>$30,000 per year</strong></li>
  <li>Need-based scholarships are some of the largest and most numerous opportunities available</li>
</ul>
${stat("Pell Grant Threshold", "< $30,000/yr")} ${stat("Federal Aid Source", "FAFSA")}

<h3>For Middle to High-Income Earners</h3>
<ul>
  <li>If you exceed the average annual U.S. household income, it's a practical approach to <strong>skip most need-based scholarships</strong></li>
  <li>However, review each application carefully — some list financial need as a factor but <strong>don't actually request specific income information</strong></li>
  <li>Focus your energy on merit-based, activity-based, and demographic-based scholarships instead</li>
</ul>

${tip("Even if you're middle or upper-income, always file your FAFSA. It won't hurt you, and many university scholarship applications REQUIRE a FAFSA on file to be considered — even for merit-based awards.")}

${takeaways([
  "Financial need is assessed via FAFSA (Expected Family Contribution) or direct household income questions",
  "Low-income households: pursue need-based scholarships and file FAFSA for Pell Grants",
  "Middle/high-income households: focus on merit-based and activity-based scholarships instead",
  "Some scholarships mention 'financial need' but don't actually verify income — still worth applying",
  "Always file your FAFSA regardless of income — it's required for many university scholarships",
])}`,
      },
      {
        title: "Things to Avoid & Ignore",
        content: `
<h3>Red Flags: Scholarships That Waste Your Time (or Worse)</h3>
<p>Not everything that calls itself a "scholarship" is worth your time. Some are outright scams. Others are technically legitimate but offer such terrible odds that applying is a waste of effort. Learn to spot these and avoid them.</p>

<h3>Essay Contests</h3>
<p>For many of these "scholarships," the <strong>only criteria</strong> the organization grades is the essay. A good essay requires considerable time and effort, and the grading is <strong>highly subjective</strong>. You could write an amazing essay and lose because the grader disagreed with your perspective. Unless the award is very large, pure essay contests offer poor return on investment.</p>

<h3>Signup Lotteries</h3>
<p>The purpose of these is to <strong>get your personal information for advertising purposes</strong>. They're common on scholarship websites — "Enter your email for a chance to win $1,000!" Your odds of receiving a scholarship through this method are effectively zero. The real product being sold is your data.</p>
${warning("If you sign up for these, expect a flood of spam emails. Use a separate email address if you decide to enter any lottery-style drawings.")}

<h3>Scholarship Giveaways</h3>
<p>These either <strong>phish your information</strong> or <strong>drive up engagement</strong> for social media and websites. Common examples:</p>
<ul>
  <li><strong>Instagram giveaways</strong> — "Follow us, like this post, and tag 3 friends to enter!" Each step boosts the account's engagement metrics. Your odds of winning are slim.</li>
  <li><strong>"No-Essay" scholarships</strong> — Every scholarship website has a variation of this. They're designed to collect your data, not to award meaningful scholarships.</li>
</ul>
<p>There is no integrity system to ensure the promised scholarships are actually given out.</p>

<h3>Low-Quality Services & Websites</h3>
<p>If a website looks outdated, poorly designed, or unprofessional, it's a sign of either a scam or an abandoned service with outdated listings. Trust your instincts — if something feels off, move on.</p>

<h3>Scholarship Books</h3>
<p>Physical scholarship books are <strong>not worth the money or time</strong>. They're usually outdated by the time they're published, and all the same information (and more) is available for free online through the recommended scholarship databases.</p>

<h3>The Bottom Line</h3>
<p><strong>If a scholarship requires no work, it's not worth your time.</strong> Legitimate scholarships require you to demonstrate your qualifications through applications, essays, recommendations, or interviews. That effort is what makes them valuable — because it filters out the students who won't put in the work.</p>

${takeaways([
  "Pure essay contests have highly subjective grading — poor return on investment unless the award is large",
  "Signup lotteries exist to harvest your personal data for advertising, not to award scholarships",
  "Instagram giveaways and 'no-essay' scholarships are engagement bait with near-zero chances",
  "Outdated or low-quality websites are red flags for scams or abandoned services",
  "If it requires no work, it's not a real scholarship — legitimate awards require demonstrated qualifications",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 3: FAFSA & University Aid
     ================================================================ */
  {
    title: "FAFSA & University Aid",
    description: "Understand federal financial aid, the FAFSA process, and how your university's scholarship application works.",
    category: "Finding Scholarships",
    order: 3,
    icon: "landmark",
    lessons: [
      {
        title: "What is the FAFSA?",
        content: `
<h3>Free Application for Federal Student Aid</h3>
<p>The FAFSA is a standardized application form used to determine your eligibility for <strong>federal financial aid programs</strong> and, in many cases, state and institutional aid as well. It's one of the most important financial documents you'll complete as a college student.</p>

<h3>How Does the FAFSA Work?</h3>
<ol>
  <li><strong>Submission:</strong> Students and their families complete the FAFSA form annually, typically beginning on <strong>October 1st</strong> for the upcoming academic year. The form collects detailed financial information: income, assets, household size, and number of dependents.</li>
  <li><strong>Processing:</strong> Once submitted, the FAFSA is processed by the federal government. Your information is shared with all colleges and universities you listed on the form. Schools use this data to calculate your <strong>Expected Family Contribution (EFC)</strong> — the amount your family is expected to contribute toward education.</li>
  <li><strong>Financial Aid Packages:</strong> After receiving your EFC, colleges determine what types and amounts of financial aid you qualify for. This may include:
    <ul>
      <li>Federal grants (Pell Grant — up to ~$7,395/year for highest-need students)</li>
      <li>Institutional scholarships</li>
      <li>Work-study opportunities</li>
      <li>Federal student loans (subsidized and unsubsidized)</li>
    </ul>
  </li>
</ol>

<h3>Will the FAFSA Hurt Me If I'm Middle or Upper Class?</h3>
<p><strong>No!</strong> The FAFSA will only <em>help</em> low-income households. It will <strong>not penalize or hurt</strong> middle-to-high-income earners in any way. There is no downside to filling it out.</p>

<h3>Should I Fill It Out If I'm in a Middle/High-Income Household?</h3>
<p><strong>Yes, absolutely!</strong> Here's why:</p>
<ul>
  <li>Many university scholarship applications <strong>require a FAFSA on file</strong> to be considered — even for merit-based awards that have nothing to do with financial need</li>
  <li>Some state grants and institutional aid are available to a wider income range than you'd expect</li>
  <li>Your financial situation may change in future years, and having a FAFSA history is helpful</li>
  <li>It takes about 30-45 minutes to complete — minimal effort for potential significant return</li>
</ul>

${tip("File your FAFSA as early as possible after October 1st. Some aid is awarded on a first-come, first-served basis, so early filers have an advantage.")}

${takeaways([
  "The FAFSA determines eligibility for federal grants, scholarships, work-study, and loans",
  "File annually starting October 1st — early filing gives you an advantage for limited funds",
  "The FAFSA never hurts you regardless of income — it can only help",
  "Many university scholarships REQUIRE a FAFSA on file, even for merit-based awards",
  "It takes only 30-45 minutes and you'll need your family's tax returns to complete it",
])}`,
      },
      {
        title: "University Scholarship Applications",
        content: `
<h3>One Application, Every Scholarship at Your School</h3>
<p>The university scholarship application is a singular application that your college offers. By filling out this <strong>one application</strong>, you are automatically placed in the consideration pool for <strong>every scholarship offered at your school</strong> — department-specific awards, endowed scholarships, diversity scholarships, merit awards, and more.</p>

<h3>Quick Facts</h3>
<ul>
  <li>A <strong>completed FAFSA form is required</strong> to submit this application. Colleges use your FAFSA data to determine if you qualify for their need-based programs. Even if you don't qualify for need-based aid, they still require FAFSA submission.</li>
  <li>This application is typically <strong>available alongside your college admissions application</strong> or shortly after acceptance.</li>
  <li>Information on deadlines and requirements can be found on your university's <strong>financial aid website</strong>.</li>
</ul>

${warning("Don't confuse the university scholarship application with your admissions application — they are separate forms with separate deadlines. Missing the scholarship application deadline is one of the most common and costly mistakes students make.")}

<h3>Will I Have to Fill This Out Again?</h3>
<p><strong>Yes.</strong> A new university application must be completed <strong>each year</strong> for you to be continually considered for scholarships. Most universities send reminders, but don't rely on them — set your own calendar reminders.</p>

<h3>How to Maximize Your University Application</h3>
<ol>
  <li><strong>Complete every section</strong> — Remember Golden Rule #8: nothing is optional</li>
  <li><strong>Write compelling essays</strong> — These essays determine which specific scholarships you're matched with</li>
  <li><strong>Update your information each year</strong> — Include new achievements, leadership roles, and experiences</li>
  <li><strong>Submit early</strong> — Some university scholarships are first-come, first-served within eligible applicants</li>
</ol>

${tip("Your university scholarship application is arguably the single highest-ROI application you'll complete. One form puts you in the running for potentially dozens of scholarships. Treat it with the same seriousness as your admissions application.")}

${takeaways([
  "One university scholarship application puts you in the pool for EVERY scholarship at your school",
  "A completed FAFSA is required before you can submit — file your FAFSA first",
  "This is a separate application from your admissions application with its own deadline",
  "You must re-submit every year to continue being considered for scholarships",
  "Complete every section and submit early — this is the highest-ROI application you'll complete",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 4: Preparing Your Application Materials
     ================================================================ */
  {
    title: "Preparing Your Application Materials",
    description: "Build your professional toolkit — resume, headshot, test scores, transcripts, recommendation letters, and more.",
    category: "Applying for Scholarships",
    order: 4,
    icon: "folder-open",
    lessons: [
      {
        title: "Important Documents Overview",
        content: `
<h3>Your Application Toolkit</h3>
<p>These are essential documents you should gather <strong>before</strong> you start applying for scholarships. Having them organized and ready in a dedicated folder means you can apply to most scholarships in minutes instead of hours.</p>

<h3>The 8 Essential Items</h3>
<ol>
  <li><strong>Professional Resume</strong> — One page, reverse chronological, professional format</li>
  <li><strong>Professional Headshot</strong> — Business professional photo with good lighting</li>
  <li><strong>IB/AP Test Scores</strong> — Downloaded from College Board</li>
  <li><strong>SAT/ACT Test Scores</strong> — Official score reports saved as PDF</li>
  <li><strong>3-4 Letters of Recommendation</strong> — From diverse sources (teachers, employers, mentors)</li>
  <li><strong>Unofficial/Official Transcripts</strong> — Request from your high school</li>
  <li><strong>Scholarship Data Sheet</strong> — Personal info you'll need to copy-paste into applications</li>
  <li><strong>Master List of Accomplishments</strong> — Every award, activity, volunteer hour, and work experience</li>
</ol>

${tip("Create a folder on your computer called 'Scholarship Documents' and save digital copies of everything. Physical documents can be scanned. Having everything in one place streamlines the entire application process.")}

<p>The following lessons in this module walk through each of these items in detail, explaining what makes a strong version of each document and how to prepare them.</p>

${takeaways([
  "Prepare all 8 essential documents before you start applying to scholarships",
  "Store everything in one dedicated digital folder for quick access",
  "Having documents ready means you can complete most applications in 30 minutes or less",
  "Physical documents should be scanned and saved as PDFs",
  "Each subsequent lesson covers one of these items in detail",
])}`,
      },
      {
        title: "Building a Professional Resume",
        content: `
<h3>Your Resume Is Your First Impression</h3>
<p>Your resume is often the first thing a scholarship evaluator sees. A polished, professional resume sets you apart from the vast majority of high school applicants who submit informal or poorly formatted documents.</p>

<h3>Resume Guidelines</h3>
<h4>Length</h4>
<p>Aim for <strong>one page maximum</strong>. Be concise and avoid unnecessary details. Every line should serve a purpose.</p>

<h4>Organization</h4>
<p>List your experiences in <strong>reverse chronological order</strong>, starting with your most recent activities. Standard sections include:</p>
<ul>
  <li><strong>Contact Information</strong> — Full name, phone number, professional email, LinkedIn (if applicable)</li>
  <li><strong>Education</strong> — School name, GPA, class rank, expected graduation date, relevant coursework</li>
  <li><strong>Work Experience</strong> — Job title, employer, dates, 2-3 bullet points per role</li>
  <li><strong>Activities & Leadership</strong> — Clubs, organizations, leadership roles with dates</li>
  <li><strong>Honors & Awards</strong> — Academic awards, scholarships, recognitions</li>
  <li><strong>Skills</strong> — Languages, technical skills, certifications</li>
</ul>

${warning("Avoid using unprofessional email addresses like 'cooldude2005@gmail.com'. Create a professional email using your name: firstname.lastname@gmail.com.")}

<h3>What Sets You Apart</h3>
<p>The vast majority of high schoolers will not have a professionally formatted resume. Using a clean, professional template (like those available from Google Docs or your university's career center) will immediately make you stand out.</p>

<h3>Proofreading</h3>
<ul>
  <li>Carefully proofread for spelling, grammar, and formatting errors</li>
  <li>Have a teacher, parent, or mentor review it</li>
  <li>Print it out — formatting errors are often easier to spot on paper</li>
</ul>

${tip("Keep your resume updated throughout senior year. Every time you receive an award, start a new activity, or take on a leadership role, add it immediately. A current resume makes filling out applications much faster.")}

${takeaways([
  "Keep your resume to one page with reverse chronological ordering",
  "Use a professional email address and a clean, formatted template",
  "Include: contact info, education, work experience, activities, honors, and skills",
  "A professional resume immediately sets you apart from most high school applicants",
  "Update your resume every time you earn a new achievement or take on a new role",
])}`,
      },
      {
        title: "Professional Headshot Tips",
        content: `
<h3>First Impressions Matter</h3>
<p>A well-executed headshot conveys professionalism, confidence, and commitment. This is the <strong>first visual impression</strong> that scholarship judges will have of you. A strong headshot can make evaluators take your application more seriously.</p>

<h3>Elements of a Good Headshot</h3>
<ul>
  <li>✅ <strong>Business Professional Attire</strong> — Collared shirt, blazer, or professional top</li>
  <li>✅ <strong>Good Lighting</strong> — Natural light or well-lit indoor setting (avoid harsh shadows)</li>
  <li>✅ <strong>Neutral/Professional Background</strong> — Plain wall, outdoor setting without distractions, or studio backdrop</li>
  <li>✅ <strong>Friendly Smile</strong> — Approachable and genuine, not overly posed</li>
  <li>✅ <strong>Head and Shoulders Framing</strong> — Close enough to see your face clearly</li>
</ul>

<h3>What NOT to Use</h3>
<ul>
  <li>❌ Casual selfies or group photos (cropped)</li>
  <li>❌ Photos with sunglasses, hats, or costumes</li>
  <li>❌ Blurry, dark, or poorly lit photos</li>
  <li>❌ Photos with distracting backgrounds (messy room, crowds)</li>
  <li>❌ Heavily filtered or overly edited photos</li>
</ul>

${tip("A high school senior portrait is an excellent headshot if it meets the criteria above. If you don't have one, ask a friend or family member to take a photo with their phone in front of a plain wall with good lighting. You don't need a professional photographer.")}

${takeaways([
  "Your headshot is the first visual impression scholarship judges have of you",
  "Wear business professional attire with good lighting and a neutral background",
  "A senior portrait works perfectly if it's professional enough",
  "Avoid selfies, group photos, sunglasses, heavy filters, or distracting backgrounds",
  "A phone photo against a plain wall with natural light works if you don't have a professional photo",
])}`,
      },
      {
        title: "Standardized Test Scores",
        content: `
<h3>Having Your Scores Ready</h3>
<p>Many scholarship applications ask for your SAT or ACT test scores. Having these score reports <strong>already downloaded and saved</strong> in your document folder saves time and prevents last-minute scrambling.</p>

<h3>Where to Download Your Scores</h3>
<ul>
  <li><strong>SAT Scores:</strong> Download from the College Board website at studentscores.collegeboard.org</li>
  <li><strong>ACT Scores:</strong> Download from act.org under "Your Test Scores"</li>
  <li><strong>AP/IB Scores:</strong> Also available through College Board (AP) or your IB coordinator</li>
</ul>

<h3>What to Save</h3>
<p>Download the full score report (not just the summary) as a PDF. The full report includes section breakdowns that some applications request. Save these with clear filenames like "SAT_Score_Report_2024.pdf".</p>

${tip("If you've taken the SAT or ACT multiple times, save the score report for your highest composite score. Most scholarships only want your best score, not all attempts.")}

<h3>Test-Optional Scholarships</h3>
<p>Many scholarships have become test-optional following recent trends in college admissions. If your test scores are strong, include them. If not, focus applications on scholarships that don't require them or that weight other factors more heavily.</p>

${takeaways([
  "Download your SAT/ACT/AP score reports and save them as PDFs in your document folder",
  "Use the College Board website for SAT/AP scores and act.org for ACT scores",
  "Save the full score report, not just the summary, with clear filenames",
  "Keep your highest composite score report readily accessible",
  "Many scholarships are now test-optional — focus on your strengths",
])}`,
      },
      {
        title: "Letters of Recommendation",
        content: `
<h3>Powerful Endorsements</h3>
<p>Scholarship letters of recommendation are endorsements written by teachers, mentors, or supervisors. They highlight your qualifications, character, and potential from an outside perspective. Most applications require <strong>1-2 letters</strong>, so having 3-4 on hand gives you flexibility.</p>

<h3>Choosing Your Writers</h3>
<h4>Diversify Your Sources</h4>
<p>Having recommendation letters from <strong>2-3 different types of sources</strong> showcases a well-rounded picture of who you are:</p>
<ul>
  <li><strong>Academic:</strong> A teacher who can speak to your intellectual curiosity and work ethic</li>
  <li><strong>Professional:</strong> An employer or supervisor who can speak to your reliability and skills</li>
  <li><strong>Community/Mentorship:</strong> A coach, pastor, scout leader, or mentor who knows your character</li>
</ul>

${warning("NEVER use letters from family members. They will be perceived as biased and could actually hurt your application.")}

<h3>How to Request Letters</h3>
<ol>
  <li>Ask early — give writers at least <strong>3-4 weeks</strong> before the first deadline</li>
  <li>Ask in person when possible, then follow up with an email containing all the details</li>
  <li>Request that the letters be <strong>somewhat generic</strong> so they can be reused for multiple applications</li>
  <li>Request <strong>copies for your own records</strong></li>
</ol>

<h3>What to Provide Your Writers</h3>
<p>Make their job easy by giving them:</p>
<ul>
  <li><strong>Due dates</strong> — Clearly communicate every deadline</li>
  <li><strong>Submission instructions</strong> — Email addresses, mailing addresses, online portals</li>
  <li><strong>Your accomplishment list</strong> — So they can reference specific achievements</li>
  <li><strong>Your resume</strong> — For additional context about your activities</li>
  <li><strong>Any special requirements</strong> — Specific topics the scholarship wants addressed</li>
  <li><strong>A letter template</strong> (optional) — If you have a preferred format</li>
</ul>

${tip("Golden Rule #5: ALWAYS assume your recommendation writers have forgotten about the deadline. Follow up 1 week before, 3 days before, and the day before. If they forget to submit, YOU are the one who doesn't get the scholarship.")}

${takeaways([
  "Get 3-4 letters from diverse sources: academic, professional, and community/mentorship",
  "Never use family members — their letters are seen as biased",
  "Give writers at least 3-4 weeks notice and provide them with your accomplishment list",
  "Request generic copies you can reuse across multiple applications",
  "Always follow up on deadlines — assume your writers have forgotten",
])}`,
      },
      {
        title: "High School Transcripts",
        content: `
<h3>What Scholarships Need</h3>
<p>Most scholarships will request a copy of your <strong>unofficial high school transcript</strong>. This document shows your complete academic record: courses taken, grades received, GPA, and class rank.</p>

<h3>How to Get Your Transcript</h3>
<ul>
  <li><strong>Online:</strong> Many high schools allow you to download unofficial transcripts through their student portal</li>
  <li><strong>In person:</strong> Visit your guidance counselor's office and request a printed copy</li>
  <li><strong>Through third-party services:</strong> Some schools use services like Parchment or Naviance for transcript requests</li>
</ul>

<h3>Unofficial vs. Official Transcripts</h3>
<ul>
  <li><strong>Unofficial:</strong> A copy you can print or download yourself. Most scholarships accept these. Free or very low cost.</li>
  <li><strong>Official:</strong> Sent directly from your school with a seal or signature. Some larger/institutional scholarships require these. May have a small processing fee.</li>
</ul>

${tip("Request several copies of your unofficial transcript at the beginning of the school year and scan them to PDF. This way you always have a digital copy ready to upload without needing to request a new one each time.")}

${takeaways([
  "Most scholarships accept unofficial transcripts — request copies from your counselor",
  "Save digital copies (scanned PDF) of your transcript in your document folder",
  "Know the difference between unofficial (self-printed) and official (school-sealed) transcripts",
  "Request transcripts early in the year so you always have copies available",
  "Some larger scholarships require official transcripts sent directly from your school",
])}`,
      },
      {
        title: "Accomplishment Master List",
        content: `
<h3>Your Single Most Useful Document</h3>
<p>Creating a master list of everything you've done is an <strong>invaluable resource</strong> when applying for scholarships. Having it all in one place makes filling out applications dramatically faster and ensures you never forget to mention an important achievement.</p>

<h3>What to Include</h3>
<p>List <strong>EVERYTHING</strong> — this document is for your reference, not for submission. Include more than you think you need:</p>
<ol>
  <li><strong>Work Experience</strong> — Every job, internship, or paid position with dates and responsibilities</li>
  <li><strong>Volunteering</strong> — All community service, including hours if you tracked them</li>
  <li><strong>Extracurricular Activities</strong> — Clubs, sports, organizations with your role and dates</li>
  <li><strong>Leadership Roles</strong> — President, captain, team lead, committee chair, etc.</li>
  <li><strong>Awards & Honors</strong> — Academic awards, competition placements, recognitions</li>
  <li><strong>Special Projects</strong> — Eagle Scout project, research projects, entrepreneurial ventures</li>
  <li><strong>Certifications & Skills</strong> — First aid, language proficiency, technical certifications</li>
</ol>

<h3>Does the Format Matter?</h3>
<p><strong>No!</strong> This is a personal reference document. Use whatever format is most convenient for you — a Word document, Google Doc, spreadsheet, or even a notes app. The important thing is that it exists and is comprehensive.</p>

${tip("Start your master list NOW and update it every time you accomplish something new. When you sit down to fill out a scholarship application, you'll simply copy-paste from this list instead of trying to remember everything from memory.")}

<h3>How This Saves You Time</h3>
<p>Most scholarship applications ask for the same types of information: activities, leadership, volunteer hours, awards. With a master list, you simply scan through it and copy the relevant items. What would take 45 minutes of brainstorming takes 5 minutes of copy-pasting.</p>

${takeaways([
  "Create a master list of EVERY accomplishment, activity, award, and experience",
  "Format doesn't matter — Word doc, spreadsheet, or notes app all work",
  "Update it immediately every time you accomplish something new",
  "This turns 45-minute applications into 5-minute copy-paste exercises",
  "Include more than you think you need — you can always omit items, but you can't remember forgotten ones",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 5: Organizing & Tracking Applications
     ================================================================ */
  {
    title: "Organizing & Tracking Applications",
    description: "Stay on top of deadlines, track your applications, manage your finances, and ace your submissions and interviews.",
    category: "Applying for Scholarships",
    order: 5,
    icon: "clipboard-list",
    lessons: [
      {
        title: "Keeping Track of Applications",
        content: `
<h3>Organization Is the Difference Between Success and Missed Deadlines</h3>
<p>Staying organized is <strong>imperative</strong> to your success throughout this process. It's surprisingly easy to lose track of things when you're juggling 10, 20, or 30+ scholarship applications. If you don't write things down, you <strong>will</strong> forget them the moment you move on to the next application.</p>

<h3>Two Categories to Track</h3>
<ol>
  <li><strong>Applications:</strong> Completed, ongoing, and upcoming applications with all their deadlines and requirements</li>
  <li><strong>Financial Information:</strong> Scholarships received, amounts, disbursement schedules, and what's needed to cover your costs</li>
</ol>

<p>Putting in the work on the front end to set up a tracking system will make your life dramatically easier on the other side. Students who skip this step inevitably miss deadlines, forget to follow up on recommendation letters, and lose track of what they've already applied for.</p>

${tip("Whether you use a spreadsheet, a notebook, or an app — the tool doesn't matter. What matters is that you have ONE place where all your scholarship information lives and that you update it consistently.")}

${takeaways([
  "Organization is non-negotiable — missing a deadline means losing money",
  "Track two categories: applications (status + deadlines) and financial information (amounts + disbursements)",
  "Set up your tracking system BEFORE you start applying",
  "Choose one central location for all scholarship information and update it consistently",
  "Front-end organization effort pays massive dividends throughout the process",
])}`,
      },
      {
        title: "Organizing Your Application Spreadsheet",
        content: `
<h3>How to Set Up Your Tracker</h3>
<p>Order your applications by their deadlines so you can knock them out as they become due. Here's the information to track for each scholarship:</p>

<ul>
  <li>✓ <strong>Provider/Organization</strong> — Who is offering the scholarship</li>
  <li>✓ <strong>Name of Scholarship</strong> — The specific award name</li>
  <li>✓ <strong>Deadline</strong> — Application due date</li>
  <li>✓ <strong>Application Status</strong> — Not Started / In Progress / Submitted</li>
  <li>✓ <strong>Grant Status</strong> — Pending / Successful / Unsuccessful</li>
  <li>✓ <strong>Dollar Amount</strong> — How much the scholarship is worth</li>
  <li>✓ <strong>Notes</strong> — Requirements, submission method, contact info, anything relevant</li>
</ul>

<h3>What Success Looks Like</h3>
<p>After a month of active applications, your spreadsheet might show 15 submitted applications. Of those, perhaps 12 come back unsuccessful (red) and 3 come back successful (green). That <strong>20% success rate</strong> is completely normal and can still result in thousands of dollars earned.</p>

${stat("Applications", "15")} ${stat("Wins", "3")} ${stat("Success Rate", "20%")} ${stat("Total Won", "$23,000")}

<p><strong>Remember: scholarship applications are a numbers game.</strong> You only need a few approvals amid many rejections to succeed. The spreadsheet keeps you motivated by showing your progress and reminding you that every "no" brings you closer to a "yes."</p>

${tip("Color-code your spreadsheet: green for awarded, red for denied, yellow for pending, and white for upcoming. This gives you an instant visual overview of your progress.")}

${takeaways([
  "Track provider, name, deadline, status, grant status, dollar amount, and notes for each application",
  "Order applications by deadline so you work on the most urgent ones first",
  "A 20% success rate is normal and can still result in significant scholarship earnings",
  "Color-code your spreadsheet for instant visual progress tracking",
  "Every rejection brings you closer to a win — keep applying and stay persistent",
])}`,
      },
      {
        title: "Tracking Financial Information",
        content: `
<h3>Know Your Numbers</h3>
<p>You cannot reach your financial goals if you don't know where you stand. Every time you earn a scholarship, immediately record it in your financial tracker with these details:</p>

<ul>
  <li><strong>Scholarship Name</strong></li>
  <li><strong>Dollar Amount</strong> — Total award value</li>
  <li><strong>Action Needed</strong> — Documents to submit (enrollment verification, thank-you letter, etc.)</li>
  <li><strong>Recurring?</strong> — Is it a one-time or multi-year award?</li>
  <li><strong>Per Semester Value</strong> — How much applies to each semester</li>
</ul>

<h3>Short-Term vs. Long-Term Breakdown</h3>
<p>Create two views of your finances:</p>
<ol>
  <li><strong>Freshman Year View:</strong> What does your first year cost, and how much have you earned toward it?</li>
  <li><strong>Four-Year View:</strong> What does your entire degree cost, and where do you stand overall?</li>
</ol>
<p>Breaking it down this way makes the numbers manageable. A $120,000 four-year cost is overwhelming, but a $30,000 freshman-year goal feels achievable.</p>

<h3>Semester-by-Semester Planning</h3>
<p>Map each scholarship to the specific semesters it covers. This shows you exactly where you have funding gaps and where you have surplus. Some semesters might be fully covered while others need additional funding — knowing this in advance lets you plan accordingly.</p>

${tip("Update your financial tracker the same day you receive an award notification. Include the action items needed (enrollment proof, thank-you letters) so nothing falls through the cracks.")}

${takeaways([
  "Record every scholarship immediately: name, amount, action needed, recurring status, per-semester value",
  "Create both a freshman-year and four-year financial breakdown",
  "Map scholarships to specific semesters to identify funding gaps",
  "Breaking costs into smaller milestones makes goals feel achievable",
  "Update your tracker the same day you receive an award notification",
])}`,
      },
      {
        title: "Submitting Your Applications",
        content: `
<h3>The Final Step: Getting It Right</h3>

<h3>Online Submissions</h3>
<ul>
  <li><strong>Email the scholarship provider</strong> to confirm successful receipt of your application materials</li>
  <li>Be professional in all communications — use proper grammar, formal greetings, and a professional email address</li>
  <li>Save confirmation emails or screenshots as proof of submission</li>
</ul>

<h3>Paper/In-Person Submissions</h3>
<ul>
  <li>Use <strong>paperclips and document folders</strong> (manila envelopes) to present materials neatly</li>
  <li>Use <strong>single-sided printing</strong> for all documents</li>
  <li><strong>Dress presentable</strong> when you turn in your application — first impressions count even at drop-off</li>
  <li><strong>Introduce yourself</strong> to whoever is present. A brief, friendly introduction can leave a lasting positive impression.</li>
</ul>

<h3>General Submission Rules</h3>
<ul>
  <li>✅ <strong>Type out ALL applications</strong> — never handwrite them</li>
  <li>✅ <strong>Follow ALL instructions exactly</strong> — failing to follow directions is the quickest way to get disqualified</li>
  <li>✅ <strong>Submit applications early</strong> — don't wait until the deadline for things to go wrong at the last minute</li>
  <li>✅ <strong>Quadruple-check your grammar</strong> in everything you submit</li>
</ul>

${warning("Technical problems (website crashes, email failures, printer jams) always happen at the worst possible time. Submit at least 2-3 days before the deadline to give yourself a buffer.")}

${takeaways([
  "Always confirm receipt of online submissions via email",
  "For paper submissions: use document folders, single-sided printing, and dress professionally",
  "Type everything — never handwrite applications",
  "Submit 2-3 days before deadlines to buffer against technical problems",
  "Follow every instruction exactly — not following directions is the fastest way to get disqualified",
])}`,
      },
      {
        title: "Interview Preparation",
        content: `
<h3>Making a Strong In-Person Impression</h3>
<p>Some scholarships include an interview component, especially local and community-based awards. Here's how to prepare:</p>

<h3>Before the Interview</h3>
<ol>
  <li><strong>Research the Organization:</strong> Before the interview, conduct thorough research on the scholarship provider. Know their mission, values, and goals. They will likely ask why you want their specific scholarship — you need to connect your story to their purpose.</li>
  <li><strong>Know Your Audience:</strong> Tailor your talking points to who's interviewing you. If you're being interviewed by a group of community leaders from a local charity, emphasize your community involvement and service. Be genuine — experienced interviewers can easily tell when someone is faking it.</li>
  <li><strong>Prepare Multiple Resumes:</strong> Have <strong>5-10 copies</strong> of your resume printed and ready to distribute. This is a professional touch that most high school students won't think of.</li>
</ol>

<h3>During the Interview</h3>
<ul>
  <li><strong>Dress Business Professional</strong> — Suit/blazer, collared shirt, professional shoes</li>
  <li><strong>Arrive 10-15 minutes early</strong></li>
  <li>Make eye contact and offer a firm handshake to each interviewer</li>
  <li>Be prepared for panel-style interviews with 2-20 interviewers (average is about 5)</li>
  <li>Have 2-3 questions prepared to ask them about the organization</li>
</ul>

${tip("Panel interviews are common, especially for local scholarships. Don't be intimidated by the number of people in the room. Make eye contact with each person when answering, not just the person who asked the question.")}

<h3>Common Interview Questions</h3>
<ul>
  <li>"Tell us about yourself and your goals."</li>
  <li>"Why do you deserve this scholarship?"</li>
  <li>"How do you plan to give back to your community?"</li>
  <li>"What's been the biggest challenge you've overcome?"</li>
  <li>"Where do you see yourself in 5-10 years?"</li>
</ul>

${takeaways([
  "Research the organization's mission, values, and goals before the interview",
  "Bring 5-10 printed copies of your resume — a professional touch most students miss",
  "Dress business professional and arrive 10-15 minutes early",
  "Expect panel interviews with an average of 5 interviewers",
  "Be genuine and tailor your talking points to your specific audience",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 6: Essay Writing
     ================================================================ */
  {
    title: "Essay Writing",
    description: "Master the art of scholarship essays — from financial need statements to personal narratives and thematic prompts.",
    category: "Essay Writing",
    order: 6,
    icon: "pen-line",
    lessons: [
      {
        title: "Introduction to Scholarship Essays",
        content: `
<h3>Why Essays Matter</h3>
<p>Crafting compelling essays is a pivotal component of scholarship success. Your essay is often the <strong>primary differentiator</strong> between you and other qualified applicants. Numbers (GPA, test scores) get you in the door; essays are what win you the money.</p>

<h3>Essential Essay Writing Tools</h3>
<ul>
  <li><strong>Grammarly:</strong> An online writing assistant that catches grammar, spelling, and style issues. This is a <strong>must-have</strong> tool — the free version is sufficient.</li>
  <li><strong>YouTube:</strong> Educational channels offer tutorials on essay structure, storytelling techniques, and common mistakes.</li>
  <li><strong>English Professors/Teachers:</strong> Seek guidance and feedback from instructors. They read hundreds of essays and know what works.</li>
  <li><strong>Peer Review:</strong> Have parents, friends, or advisors read your essays. They will catch things you missed.</li>
  <li><strong>AI Tools (ChatGPT, Claude):</strong> Useful for brainstorming ideas, checking grammar, and getting feedback on structure. <strong>Do not use AI to write your essays</strong> — plagiarism checkers can detect AI-generated content, and your authentic voice is what makes essays compelling.</li>
</ul>

${warning("Using AI to fully write your essays is both detectable and counterproductive. Scholarship committees want YOUR authentic voice and story. Use AI as a brainstorming and editing tool, not a ghostwriter.")}

<h3>The Two Types of Essay Prompts</h3>
<p>Despite the seemingly infinite variety of essay questions, nearly all scholarship essays fall into two categories:</p>
<ol>
  <li><strong>"Your Story" Prompts</strong> — Open-ended questions asking about your experiences, goals, and character</li>
  <li><strong>"Thematic" Prompts</strong> — Questions specific to the scholarship provider's mission or cause</li>
</ol>

<h3>Does This Process Get Easier?</h3>
<p><strong>Yes!</strong> While it's mind-numbing at first, you'll discover that most applications ask variations of the same questions. Over time, you can begin <strong>copying and reusing paragraphs and essays</strong> you've already written, adapting them slightly for each new application.</p>

${tip("Save every essay you write in a dedicated folder organized by prompt type. After you've written 5-6 essays, you'll find that new prompts can often be answered by combining and adapting sections from your existing work.")}

${takeaways([
  "Essays are the primary differentiator between qualified applicants — they win or lose scholarships",
  "Use Grammarly (free version) on every essay, plus peer review from teachers and friends",
  "AI tools are useful for brainstorming but never for writing — plagiarism detection catches AI content",
  "Nearly all prompts fall into two categories: 'Your Story' and 'Thematic'",
  "Save and organize every essay you write — you'll reuse and adapt them for future applications",
])}`,
      },
      {
        title: "Financial Need Essays",
        content: `
<h3>The Most Important Essay You'll Write</h3>
<p><strong>Typical Prompt:</strong> <em>"Describe any significant financial challenges or adverse situations you have faced that have impacted your educational journey. How have these experiences shaped your pursuit of higher education, and how would receiving this scholarship help alleviate financial burdens and enable you to achieve your academic and career goals?"</em></p>

<h3>How Judges Grade These Essays</h3>
<p><strong>With their emotions.</strong> This is critical to understand. The candidate with the most financial need does not automatically win. The candidate who <strong>expresses the gravity of their situation in the most compelling and effective way</strong> wins.</p>

<p>Your job is to make the reader <em>feel</em> the weight of your financial situation, not just understand it intellectually.</p>

<h3>What to Include — Milk Every Adverse Situation</h3>
<p>Don't hold back. Elaborate fully on every financial challenge your family faces:</p>
<ul>
  <li>✓ Medical conditions, surgeries, accidents, chronic illnesses in your family</li>
  <li>✓ College-aged siblings competing for the same family resources</li>
  <li>✓ Household disruptions (divorce, job loss, family emergencies)</li>
  <li>✓ Specific financial pressures (car payments, mortgage, medical debt)</li>
  <li>✓ Moving houses or cities and the associated costs</li>
  <li>✓ Single-parent income households</li>
  <li>✓ Being the first in your family to attend college</li>
  <li>✓ Working part-time jobs to contribute to family finances</li>
</ul>

<h3>Don't Feel Guilty</h3>
<p>You are <strong>not being dishonest</strong> by fully elaborating on the totality of your circumstances. Every family has financial challenges — you're simply presenting them effectively. Being humble in this situation only gives an advantage to someone who's willing to tell their story fully.</p>

${tip("Write your financial need essay once, make it thorough and compelling, and adapt it for every scholarship that asks for one. This is one essay where having a strong 'master version' saves enormous time.")}

${takeaways([
  "Financial need essays are graded on emotional impact, not just the severity of your situation",
  "The most compelling writer wins, not the person with the greatest need",
  "Include every relevant financial challenge: medical issues, siblings, single-parent income, job loss",
  "Don't be humble — fully elaborating on your circumstances is honest, not manipulative",
  "Write one strong master version and adapt it for each application",
])}`,
      },
      {
        title: "\"Your Story\" Essay Prompts",
        content: `
<h3>Open-Ended Personal Narratives</h3>
<p>These essay prompts are intentionally broad and resemble typical college admission essays. They ask you to tell your story, share your experiences, and explain your goals. Examples include:</p>
<ul>
  <li><em>"Tell us your story. What unique opportunities or challenges have you experienced that shaped who you are today?" (650 words)</em></li>
  <li><em>"The Event That Had the Most Impact on My Life"</em></li>
  <li><em>"Submit a statement of your career objectives and personal goals and explain why you feel you should be awarded the scholarship"</em></li>
</ul>

<h3>How to Stand Out</h3>

<h4>1. Defined Goals for the Future</h4>
<p>Articulate clear, <strong>specific</strong> academic, career, or personal goals. Vague statements like "I want to help people" are forgettable. Specific goals like "I plan to earn my CPA certification and open a financial literacy nonprofit in my community" are memorable and demonstrate ambition.</p>

<h4>2. Notable Experiences</h4>
<p>Share impactful experiences from your life. These could include academic achievements, extracurricular involvement, community service, or personal challenges. The key is to choose experiences that <strong>show growth</strong> — how you changed, what you learned, or how you overcame something.</p>

<h4>3. Clear Cause and Effect</h4>
<p>Don't just describe events — explain the <strong>why</strong>. How did this experience influence your goals? How did it shape your character? What lesson did you learn? Scholarship readers want to see that you're reflective and self-aware, not just listing accomplishments.</p>

${tip("Tell a compelling story with a clear arc: setup (the situation), conflict (the challenge), resolution (what you did), and reflection (what you learned). This narrative structure is far more engaging than a list of achievements.")}

${takeaways([
  "Personal narrative prompts want a story, not a resume — show growth and self-awareness",
  "State specific, concrete goals rather than vague aspirations",
  "Choose experiences that demonstrate growth: what happened, what you did, what you learned",
  "Always connect your past experiences to your future goals (cause and effect)",
  "Use narrative structure: setup → conflict → resolution → reflection",
])}`,
      },
      {
        title: "\"Thematic\" Essay Prompts",
        content: `
<h3>Connecting to the Scholarship's Mission</h3>
<p>Thematic essays are specific to the scholarship provider and require you to deeply connect with their particular cause or mission. Unlike "Your Story" essays, these demand that you demonstrate genuine knowledge of and passion for the topic at hand.</p>

<h3>Real Examples of Thematic Prompts</h3>
<ul>
  <li><em>"Write a brief essay (less than 300 words) describing why you are interested in entering the oil and gas processing/midstream industry"</em></li>
  <li><em>"How has agriculture shaped who you are today? (Two pages or less)"</em></li>
  <li><em>"How do you plan to serve the Catholic Church in college and beyond? (400 words)"</em></li>
  <li><em>"Describe the traumatic medical experience that occurred and how it shaped you"</em></li>
  <li><em>"In 500 words or less, describe what being tall means to you"</em></li>
</ul>

<h3>How to Differentiate Yourself</h3>

<h4>1. Knowledge of the Organization</h4>
<p>Show that you've <strong>researched the scholarship provider</strong> — their mission, values, history, and goals. Mention specific programs they run or values they promote. This proves you're not just applying to every scholarship you find.</p>

<h4>2. Personal Connection</h4>
<p>Share personal anecdotes or experiences that <strong>genuinely connect you</strong> to the scholarship's purpose. If it's an agriculture scholarship, talk about how growing up on a farm shaped your work ethic. If it's a medical scholarship, share your personal experience with healthcare.</p>

<h4>3. Play to the Audience</h4>
<p>Tailor your response to the specific provider's interests. If they focus on community service, emphasize your volunteer work. If they're industry-focused, show your knowledge of and passion for that field. Your essay should make the reader feel that their specific scholarship is a perfect match for who you are.</p>

${tip("Before writing a thematic essay, spend 20 minutes researching the scholarship provider. Read their 'About Us' page, their mission statement, and any past winner profiles. Weave this knowledge naturally into your essay.")}

${takeaways([
  "Thematic prompts require genuine connection to the scholarship provider's specific mission or cause",
  "Research the organization before writing — know their mission, values, and history",
  "Share personal experiences that authentically connect you to the topic",
  "Tailor your response to the specific audience's interests and priorities",
  "Spend 20 minutes researching before you start writing — it shows in the final product",
])}`,
      },
      {
        title: "Essay Prompt Examples & Practice",
        content: `
<h3>Common Prompts You'll Encounter</h3>
<p>After applying for dozens of scholarships, you'll notice that most essay prompts are variations of the same core questions. Here are the most common ones, organized by type, with tips for approaching each.</p>

<h3>"Your Story" Prompts</h3>
<ul>
  <li><strong>"Tell us about yourself"</strong> — Focus on 2-3 defining experiences, not your entire life story. Show character, not just achievements.</li>
  <li><strong>"What event had the most impact on your life?"</strong> — Choose something that genuinely changed your perspective or direction. Show before-and-after growth.</li>
  <li><strong>"Why should you be awarded this scholarship?"</strong> — Combine your qualifications with your passion and your plan for using the education to make an impact.</li>
  <li><strong>"What are your career objectives?"</strong> — Be specific, show how the scholarship helps you get there, and connect your goals to helping others.</li>
</ul>

<h3>"Thematic" Prompts</h3>
<ul>
  <li><strong>"Why are you interested in [specific field]?"</strong> — Share a personal origin story that sparked your interest, not just "I've always liked it."</li>
  <li><strong>"How has [topic] shaped who you are?"</strong> — Show specific moments and lessons, not vague generalizations.</li>
  <li><strong>"How will you serve/contribute to [cause]?"</strong> — Be concrete about actions you'll take, not just intentions you have.</li>
</ul>

<h3>The Reuse Strategy</h3>
<p>As you write more essays, you'll build a <strong>library of paragraphs and stories</strong> that you can mix and match. For example:</p>
<ul>
  <li>Your "financial need" paragraph can be adapted for any need-based prompt</li>
  <li>Your "biggest challenge" story can answer multiple different "adversity" prompts</li>
  <li>Your "career goals" section can be adjusted for various "future plans" questions</li>
  <li>Your "community involvement" paragraph works for both "Your Story" and thematic prompts about service</li>
</ul>

${tip("Create a 'Greatest Hits' document with your best paragraphs organized by topic: financial need, career goals, biggest challenge, community service, leadership, personal growth. When a new prompt comes up, assemble your response from existing pieces and customize.")}

${takeaways([
  "Most essay prompts are variations of the same core questions — recognize the patterns",
  "For 'tell us about yourself' prompts, focus on 2-3 defining experiences, not your whole life",
  "Always be specific: concrete stories and actions are more compelling than vague statements",
  "Build a library of reusable paragraphs organized by topic for faster essay assembly",
  "Customize each essay even when reusing content — never submit a generic copy-paste",
])}`,
      },
    ],
  },

  /* ================================================================
     MODULE 7: After Winning a Scholarship
     ================================================================ */
  {
    title: "After Winning a Scholarship",
    description: "Navigate the post-award process — disbursements, required documents, tuition deadlines, and handling delays.",
    category: "After Receiving a Scholarship",
    order: 7,
    icon: "trophy",
    lessons: [
      {
        title: "Timeline of an Application",
        content: `
<h3>From Application to Payment: The 5 Stages</h3>
<p>Understanding the full lifecycle of a scholarship application helps you know what to expect and when to follow up.</p>

<h3>Stage 1: Application</h3>
<p>Search for scholarships, complete the applications, and submit them before the deadlines.</p>

<h3>Stage 2: Award/Denial</h3>
<p>Individual timelines vary by provider. You'll typically hear back within <strong>a few weeks to several months</strong>. Most providers notify you by phone or email.</p>

<h3>Stage 3: Submit Documents</h3>
<p>After being awarded, you may need to submit: transcripts, proof of enrollment, the mailing address of your school's financial aid office, and thank-you letters.</p>

<h3>Stage 4: Disbursement</h3>
<p>Organizations mail checks directly to your university's financial aid office. This typically happens from <strong>late July to early August</strong>.</p>

<h3>Stage 5: Further Steps</h3>
<p>Keep up with continuation requirements to ensure money flows each semester. This may include maintaining a minimum GPA, submitting renewal applications, or providing updated enrollment verification.</p>

<h3>Will I Always Get a Response?</h3>
<p>Most providers will notify you regardless of their decision. However, smaller local organizations may not always provide formal responses. If you haven't heard back within a reasonable timeframe (8-12 weeks after the deadline), follow up with a polite email.</p>

<h3>What to Do While Waiting</h3>
<p>Stay proactive and <strong>keep applying</strong>. Don't pause your search while waiting for results. Each new application increases your chances of success.</p>

${takeaways([
  "The 5 stages: Apply → Award/Denial → Submit Documents → Disbursement → Ongoing Requirements",
  "Expect to hear back within a few weeks to several months depending on the provider",
  "Follow up if you haven't heard back within 8-12 weeks after the deadline",
  "Never stop applying while waiting for results — keep your pipeline full",
  "Keep up with continuation requirements (GPA, renewal apps) to maintain multi-year awards",
])}`,
      },
      {
        title: "Scholarship Disbursements",
        content: `
<h3>How Scholarship Money Gets to Your School</h3>
<p>Upon receiving the proper documentation from you, scholarship providers will <strong>mail checks directly to your financial aid office</strong>. The vast majority of scholarships will NOT deposit money directly into your personal account. This typically happens from <strong>late July to early August</strong> for fall semester funding.</p>

<h3>How to Track Your Disbursements</h3>
<p>You can check your university's <strong>financial aid portal</strong> to see which disbursements have reached your school. Most schools also notify you via email when new scholarship funds arrive.</p>

<h3>What Happens If You Receive More Than You Need?</h3>
<p>If your total scholarship funds exceed the semester's costs (tuition, fees, room, board), the school will deposit the <strong>surplus directly into your designated bank account</strong>. After acceptance, you'll typically set up direct deposit through a service like Flywire.</p>

${stat("Typical Timing", "Late July - Early August")} ${stat("Method", "Check to Financial Aid Office")} ${stat("Surplus", "Deposited to Your Bank")}

${tip("Set up your direct deposit information with your university as soon as you accept admission. This ensures that any surplus scholarship funds reach your bank account quickly instead of sitting in a university holding account.")}

<h3>Important: Keep Your Own Records</h3>
<p>Don't rely solely on your university's portal. Maintain your own tracking spreadsheet showing which scholarships should have been received and which ones are still pending. This way you can quickly identify if something is missing and follow up proactively.</p>

${takeaways([
  "Scholarship checks are mailed directly to your university's financial aid office, not to you",
  "Check your school's financial aid portal regularly to track received disbursements",
  "Surplus funds (beyond tuition/fees) are deposited into your personal bank account",
  "Set up direct deposit with your university early to receive surplus funds quickly",
  "Maintain your own tracking spreadsheet — don't rely solely on the university's portal",
])}`,
      },
      {
        title: "Handling Late Disbursements",
        content: `
<h3>When the Money Doesn't Arrive on Time</h3>
<p><strong>This will happen to you.</strong> Scholarship providers operate on their own schedules, and it is extremely common for funds not to arrive in time for tuition payment deadlines. You won't always be informed of the provider's progress, which makes the situation even more stressful.</p>

<h3>Three Solutions for Late Disbursements</h3>

<h4>1. Emergency Bridge Loans</h4>
<p>Many colleges offer <strong>zero-interest emergency loans</strong> specifically designed to cover unexpected shortfalls in funding. These are short-term loans that you repay once your scholarship funds arrive. Check with your school's financial aid office about availability.</p>

<h4>2. Tuition Payment Plans</h4>
<p>Universities allow you to <strong>break up tuition payments</strong> into installments instead of paying the full amount in a lump sum. Pay the first installment out of pocket, and the scholarship money will most likely arrive before the next installment is due. This is a very common and practical solution.</p>

<h4>3. Temporary Out-of-Pocket Payment</h4>
<p>If you have the means, pay the tuition out of pocket and <strong>you will be refunded</strong> when the scholarship funds finally arrive in your student account. This is unfortunate but temporary.</p>

${warning("Do NOT assume the money will arrive on time. Have a backup plan ready BEFORE tuition is due. Getting dropped from your classes because of a late disbursement is a real and preventable disaster.")}

<h3>Proactive Communication</h3>
<p>As soon as you know you've been awarded a scholarship, reach out to the provider to ask about their disbursement timeline. If the deadline approaches and funds haven't arrived, contact both the provider AND your school's financial aid office. Be proactive — no one else will chase this down for you.</p>

${takeaways([
  "Late disbursements are extremely common — expect them and plan accordingly",
  "Three solutions: emergency bridge loans (zero interest), tuition payment plans, or temporary out-of-pocket",
  "Have a backup plan ready BEFORE tuition is due — getting dropped from classes is preventable",
  "Proactively communicate with both the scholarship provider and your financial aid office",
  "You will be refunded when late funds arrive — any out-of-pocket payment is temporary",
])}`,
      },
      {
        title: "Submitting Post-Award Documents",
        content: `
<h3>What Providers Need After You Win</h3>
<p>Once you've been awarded a scholarship, providers typically request several documents to process disbursement. Have these ready to submit promptly.</p>

<h3>Common Requests</h3>
<ol>
  <li><strong>Financial Aid Office Mailing Address:</strong> The physical address where the provider should mail the scholarship check. Find this on your university's financial aid website.</li>
  <li><strong>Thank-You Letters:</strong> Many providers request a letter expressing gratitude to the donors. Be sincere, mention how the scholarship impacts your education, and write it within a week of notification.</li>
  <li><strong>Verification of Enrollment:</strong> Proof that you're actually enrolled for the semester the scholarship covers. This can be:
    <ul>
      <li>Fall semester class registration confirmation</li>
      <li>An enrollment verification form from your financial aid office</li>
      <li>College transcripts showing current enrollment</li>
    </ul>
  </li>
</ol>

<h3>How to Get Enrollment Verification as an Incoming Freshman</h3>
<p>Contact your school's financial aid office and request documentation. <strong>Fair warning:</strong> these departments are often slow, inefficient, and swamped with requests. Request documentation <strong>well before any due dates</strong> — ideally 3-4 weeks in advance.</p>

${tip("As soon as you receive an award, immediately note what documents are required and their deadlines. Submit everything as early as possible. Delays in providing documents can delay your disbursement.")}

${takeaways([
  "Common post-award requests: financial aid mailing address, thank-you letter, enrollment verification",
  "Find your school's financial aid mailing address on their website — have it ready to share",
  "Write thank-you letters within one week of notification — sincerity matters",
  "Request enrollment verification 3-4 weeks before you need it — financial aid offices are slow",
  "Submit all requested documents as early as possible to avoid disbursement delays",
])}`,
      },
      {
        title: "Tuition Payment Deadlines",
        content: `
<h3>Don't Get Dropped from Your Classes</h3>
<p>Colleges maintain strict deadlines for payment of tuition and student fees. <strong>Failure to pay by their set dates can result in being automatically dropped from all your classes.</strong> This is not a gentle warning — it happens, and recovering from it is a nightmare.</p>

<h3>Key Facts</h3>
<ul>
  <li>Tuition deadlines typically fall in <strong>early to mid-August</strong> for fall semester and <strong>early January</strong> for spring semester</li>
  <li>Deadlines <strong>change every year</strong> — always verify the current year's dates directly with your university</li>
  <li>Some schools offer a grace period; many do not</li>
  <li>Setting up a payment plan usually extends your effective deadline</li>
</ul>

${warning("ALWAYS verify tuition deadlines directly with your university. Never rely on last year's dates or second-hand information. This is far too important to get wrong.")}

<h3>What to Do If Your Scholarships Haven't Arrived</h3>
<p>If your tuition deadline is approaching and your scholarship funds haven't been disbursed:</p>
<ol>
  <li><strong>Contact your financial aid office</strong> — explain your situation and ask about options</li>
  <li><strong>Set up a payment plan</strong> — this buys you time without getting dropped</li>
  <li><strong>Ask about emergency loans</strong> — zero-interest short-term loans to bridge the gap</li>
  <li><strong>Contact your scholarship providers</strong> — ask for an update on disbursement timing</li>
  <li><strong>Pay what you can</strong> — a partial payment shows good faith and may prevent being dropped</li>
</ol>

${tip("Add your school's tuition deadline to your calendar with TWO reminders: one 30 days before and one 7 days before. This gives you time to arrange backup funding if your scholarships are delayed.")}

<h3>Planning Ahead</h3>
<p>The best protection against tuition deadline stress is having your financial tracking spreadsheet up to date. When you know exactly which scholarships are covering which semester — and you've confirmed their disbursement timelines — you can identify potential shortfalls weeks or months in advance instead of days.</p>

${takeaways([
  "Missing tuition deadlines can result in being dropped from ALL your classes",
  "Deadlines change every year — always verify directly with your university",
  "If scholarships haven't arrived, immediately contact financial aid and set up a payment plan",
  "Set calendar reminders 30 days and 7 days before tuition deadlines",
  "Keep your financial tracking spreadsheet current to identify potential shortfalls early",
])}`,
      },
    ],
  },
];

/* ─────────────────────── Main Seed Function ─────────────────────── */

async function main() {
  console.log("🎓 Seeding learning modules from ScholarShape Manual...\n");

  for (const mod of modules) {
    console.log(`📘 Module: ${mod.title} (${mod.lessons.length} lessons)`);

    // Upsert module
    const existing = await prisma.learningModule.findFirst({
      where: { title: mod.title, subject: "SCHOLARSHIP" },
    });

    let moduleRecord;
    if (existing) {
      moduleRecord = await prisma.learningModule.update({
        where: { id: existing.id },
        data: {
          description: mod.description,
          category: mod.category,
          order: mod.order,
          icon: mod.icon,
          subject: "SCHOLARSHIP",
          isPublished: true,
        },
      });
      // Delete existing lessons for re-creation
      await prisma.lesson.deleteMany({ where: { moduleId: moduleRecord.id } });
    } else {
      moduleRecord = await prisma.learningModule.create({
        data: {
          title: mod.title,
          description: mod.description,
          category: mod.category,
          order: mod.order,
          icon: mod.icon,
          subject: "SCHOLARSHIP",
          isPublished: true,
        },
      });
    }

    // Create lessons
    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i];
      await prisma.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          title: lesson.title,
          content: lesson.content.trim(),
          type: lesson.type || "VIDEO",
          videoUrl: lesson.videoUrl || null,
          externalUrl: lesson.externalUrl || null,
          order: i + 1,
        },
      });
    }

    console.log(`   ✅ ${mod.lessons.length} lessons created`);
  }

  console.log(`\n🎉 Seeding complete! ${modules.length} modules with ${modules.reduce((a, m) => a + m.lessons.length, 0)} total lessons.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
