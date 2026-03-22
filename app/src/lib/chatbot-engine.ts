/**
 * Local chatbot engine — pure TypeScript pattern matching.
 *
 * Handles greetings, small talk, feelings, encouragement, identity,
 * gratitude, farewells, jokes, and ScholarSuite Q&A entirely
 * client-side with zero dependencies.
 *
 * Returns `null` for messages it can't handle, signaling
 * the caller to fall through to the AI backend.
 */

import { CORPUS_PATTERNS } from "./chatbot-corpus"

// ─── Helpers ────────────────────────────────────────────────

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Normalize input: lowercase, collapse whitespace, strip punctuation */
function normalize(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Common shorthand expansions
    .replace(/\bi'm\b/g, "i am")
    .replace(/\bi'd\b/g, "i would")
    .replace(/\bi've\b/g, "i have")
    .replace(/\bi'll\b/g, "i will")
    .replace(/\bdon't\b/g, "do not")
    .replace(/\bisn't\b/g, "is not")
    .replace(/\bit's\b/g, "it is")
    .replace(/\bcan't\b/g, "can not")
    .replace(/\bwhat's\b/g, "what is")
    .replace(/\bthat's\b/g, "that is")
    .replace(/\bthere's\b/g, "there is")
    .replace(/\bwho's\b/g, "who is")
    .replace(/\bhow's\b/g, "how is")
    .replace(/\blet's\b/g, "let us")
    .replace(/\bgonna\b/g, "going to")
    .replace(/\bwanna\b/g, "want to")
    .replace(/\bgotta\b/g, "got to")
    .replace(/\b(ur)\b/g, "your")
    .replace(/\b(u)\b/g, "you")
    .replace(/\b(r)\b/g, "are")
    .replace(/\b(ya)\b/g, "you")
    .replace(/\b(yea|yep)\b/g, "yes")
    .replace(/\b(nope)\b/g, "no")
    .replace(/\b(thx)\b/g, "thanks")
    .replace(/\b(ty)\b/g, "thank you")
    .replace(/\b(pls|plz)\b/g, "please")
    .replace(/\b(idk)\b/g, "i do not know")
    .replace(/\b(lol|lmao|lmfao)\b/g, "haha")
    .replace(/\b(bruh)\b/g, "bro")
    .replace(/\b(wbu|hbu)\b/g, "what about you")
    .replace(/\b(tbh)\b/g, "to be honest")
    .replace(/\b(ngl)\b/g, "not going to lie")
    .replace(/\b(btw)\b/g, "by the way")
    .replace(/\b(rn)\b/g, "right now")
    .replace(/\b(imo)\b/g, "in my opinion")
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Pattern/Response pairs ─────────────────────────────────
// Each entry: [RegExp pattern, array of possible responses]

type PatternEntry = [RegExp, string[]]

const PATTERNS: PatternEntry[] = [
  // ═══ GREETINGS ═══
  [
    /^(hello|hi|hey|howdy|yo|sup|what is up|hiya|heya|greetings|good day|wassup|what up)$/,
    [
      "Hey there! How can I help you today?",
      "Hello! Ready to tackle some college prep?",
      "Hi! What can I do for you?",
      "Hey! What's on your mind today?",
      "Hi there! Need help with anything?",
      "Hello! I'm here to help — what do you need?",
    ],
  ],
  [
    /^good (morning|afternoon|evening|night)$/,
    [
      "Good {1}! How can I help you today?",
      "Good {1}! Ready to get some work done?",
      "Good {1}! What's on your agenda?",
    ],
  ],
  [
    /^(hey|hi|hello) there$/,
    [
      "Hey there! What can I help you with?",
      "Hi! How's it going?",
      "Hello! What's up?",
    ],
  ],
  [
    /^(hey|hi|hello) /,
    [
      "Hey! How can I help?",
      "Hi there! What do you need?",
    ],
  ],

  // ═══ HOW ARE YOU ═══
  [
    /^how are you( doing| today)?$/,
    [
      "I'm doing great, thanks for asking! How about you?",
      "I'm good! Ready to help whenever you are.",
      "Doing well! What can I help you with today?",
    ],
  ],
  [
    /^how is it going$/,
    [
      "It's going well! What can I do for you?",
      "Going great! How about you?",
    ],
  ],
  [
    /^(what about you|how about you)$/,
    [
      "I'm just a chatbot, but I'm doing great! Thanks for asking. 😄",
    ],
  ],
  [
    /^are you (good|okay|alright|fine)$/,
    [
      "I'm always good! Ready to help you out.",
      "I'm perfectly fine! Thanks for checking in. How about you?",
    ],
  ],

  // ═══ USER FEELINGS (POSITIVE) ═══
  [
    /^i am (good|great|fine|well|okay|alright|fantastic|amazing|wonderful|awesome|pretty good|not bad|doing well)/,
    [
      "That's great to hear! What can I help you with?",
      "Awesome! Ready to get to work?",
      "Glad to hear it! Let me know if you need anything.",
      "Nice! How can I help you today?",
    ],
  ],

  // ═══ USER FEELINGS (NEGATIVE) ═══
  [
    /^i am (bad|terrible|awful|not good|not great|sad|stressed|tired|exhausted|overwhelmed|anxious|worried|nervous)/,
    [
      "I'm sorry to hear that. 💙 College prep can be stressful, but you've got this! Is there something I can help with to make things easier?",
      "That's tough. Remember, it's okay to take breaks. Want me to help you with something to take your mind off it?",
      "I hear you. The college process can feel overwhelming sometimes. Let me know how I can help lighten the load.",
      "Hang in there! If you want, I can help you break things down into smaller steps.",
    ],
  ],

  // ═══ STRESSED ABOUT SPECIFIC THINGS ═══
  [
    /i am (stressed|overwhelmed|anxious|worried|scared|nervous) about (college|applications|scholarships|essays|deadlines|school|grades|tests|sat|act)/,
    [
      "I totally get it — {2} can feel like a lot. But here's the thing: you're already taking steps by being here! Let's break it down together. What specifically do you need help with?",
      "It's completely normal to feel {1} about {2}. You're not alone in this. Want me to help you make a plan or find some resources?",
      "Take a deep breath. 💙 You've got more going for you than you realize. Let's tackle {2} one step at a time. Where do you want to start?",
    ],
  ],

  // ═══ IDENTITY / ABOUT THE BOT ═══
  [
    /^what is your name$/,
    [
      "I'm ScholarSuite AI, your college prep assistant!",
      "You can call me ScholarSuite AI. I'm here to help with scholarships, essays, deadlines, and more!",
    ],
  ],
  [
    /^who are you$/,
    [
      "I'm ScholarSuite AI — your personal college prep assistant. I can help with scholarships, essays, deadlines, college research, and more!",
      "I'm your ScholarSuite assistant! Think of me as your college prep sidekick.",
    ],
  ],
  [
    /^what are you$/,
    [
      "I'm a college prep assistant built into ScholarSuite. I help with scholarships, essays, applications, and everything in between!",
    ],
  ],
  [
    /^(what can you do|what do you do|how can you help( me)?)$/,
    [
      "I can help you with a lot! Here are some things I'm great at:\n\n**• Find scholarships** that match your profile\n**• Draft essays** and brainstorm ideas\n**• Track deadlines** and tasks\n**• Research colleges** that fit you\n**• Review activities** on your brag sheet\n**• Answer questions** about the college prep process\n\nJust ask me anything!",
    ],
  ],
  [
    /^are you a (robot|bot)$/,
    [
      "I'm a chatbot assistant! I'm not a human, but I'm here to help you with your college prep journey. 🤖",
    ],
  ],
  [
    /^are you (real|ai|human)$/,
    [
      "I'm real software running right here in ScholarSuite! Not a person, but I'm always here to help.",
    ],
  ],
  [
    /^how old are you$/,
    [
      "I'm as old as ScholarSuite itself! Age is just a number for a chatbot. 😄",
    ],
  ],
  [
    /^where are you from$/,
    [
      "I live right here inside ScholarSuite! I'm always available whenever you need me.",
    ],
  ],

  // ═══ THANKS / GRATITUDE ═══
  [
    /^(thanks|thank you|thank u|thx|appreciate it|much appreciated)$/,
    [
      "You're welcome! Let me know if you need anything else.",
      "Happy to help! 😊",
      "Anytime! That's what I'm here for.",
      "No problem at all! What else can I do for you?",
      "You got it! Anything else?",
    ],
  ],
  [
    /thanks (for|a lot|so much)/,
    [
      "Of course! I'm always here when you need me.",
      "You're welcome! Don't hesitate to ask anytime.",
      "No problem! Let me know if you need more.",
    ],
  ],
  [
    /you are (welcome|the best|awesome|amazing|great|helpful|so helpful|really helpful)$/,
    [
      "Aw, thanks! I try my best. 😊",
      "That means a lot! Let me know if you need anything else.",
    ],
  ],

  // ═══ FAREWELLS ═══
  [
    /^(bye|goodbye|see you|see ya|later|peace|peace out|got to go|have to go|i am leaving|cya|ttyl|talk to you later)$/,
    [
      "Bye! Good luck with everything! 🎓",
      "See you later! You've got this!",
      "Take care! Come back anytime you need help.",
      "Goodbye! Keep up the great work! 💪",
      "Later! Don't forget to check your deadlines! 😉",
    ],
  ],
  [
    /^have a (good|great|nice|wonderful) (day|night|evening|afternoon|weekend)$/,
    [
      "You too! Take care! 😊",
      "Thanks, you too! Come back anytime.",
      "Same to you! Good luck with everything!",
    ],
  ],
  [
    /^good night$/,
    [
      "Good night! Get some rest — you deserve it! 🌙",
      "Night! Sweet dreams and don't stress about college stuff tonight. 😴",
    ],
  ],

  // ═══ COMPLIMENTS & REACTIONS ═══
  [
    /^you are (smart|clever|intelligent|brilliant)$/,
    [
      "Thanks! I try to be helpful. But the real brains here is you! 🧠",
      "Appreciate that! Now let's put our brains together and get you some scholarships!",
    ],
  ],
  [
    /^i love you$/,
    [
      "Haha, I appreciate the love! Let's channel that energy into your college apps! 😄❤️",
      "Aw, that's sweet! I'm here for you — let's crush those deadlines!",
    ],
  ],
  [
    /^you are funny$/,
    [
      "I try! 😄 Now, anything I can actually help you with?",
      "Glad I could make you smile! What do you need help with?",
    ],
  ],
  [
    /^(haha|hehe|that is funny|that was funny)$/,
    [
      "😄 Glad I could brighten your day! What else can I help with?",
      "Haha! Alright, back to business — need anything?",
    ],
  ],
  [
    /^(cool|nice|awesome|sweet|great|amazing|perfect|wonderful|neat)$/,
    [
      "Glad you think so! Anything else?",
      "Awesome! What's next?",
      "😊 Let me know if you need anything!",
    ],
  ],
  [
    /^(ok|okay|alright|got it|understood|makes sense|i see|sure|sounds good|bet)$/,
    [
      "Great! Let me know if you need anything else.",
      "👍 I'm here if you need me!",
      "Sounds good! What else can I help with?",
    ],
  ],
  [
    /^(wow|whoa|omg|oh my god|no way)$/,
    [
      "Right?! 😄 What else is on your mind?",
      "I know! Anything else I can help with?",
    ],
  ],

  // ═══ ENCOURAGEMENT / MOTIVATION ═══
  [
    /^i can not do this$/,
    [
      "Yes you can! The fact that you're here shows you care. Let's break it down into smaller pieces. What's feeling the hardest right now?",
      "I hear you, but don't give up! College prep is a marathon, not a sprint. What can I help you with right now?",
    ],
  ],
  [
    /^i am not good enough$/,
    [
      "That's not true! Every student has unique strengths. Colleges want to see YOUR story, not a perfect one. Want me to help you highlight what makes you special?",
      "I promise you're more qualified than you think. Let's look at your profile together — I bet we can find scholarships and colleges that are a great fit.",
    ],
  ],
  [
    /^this is (hard|difficult|tough)$/,
    [
      "It really can be! But you're doing the hard work, and that's what counts. How can I make it easier for you?",
      "I know it feels that way. Let's tackle it together — what's the toughest part right now?",
    ],
  ],
  [
    /^(i need motivation|motivate me|inspire me|give me motivation)$/,
    [
      "You've already come so far just by working on this! 🌟 Every scholarship you apply to, every essay you write — it all adds up. Keep going!",
      "Here's some motivation: thousands of scholarships go unclaimed every year because students don't apply. You're already ahead by being here! Let's find some for you.",
      "Remember why you started. Your future self will thank you for the work you're putting in today. 💪 What can I help you with?",
    ],
  ],

  // ═══ SMALL TALK / MISC ═══
  [
    /^(tell me a joke|tell me another joke|do you have any jokes|make me laugh|say something funny)$/,
    [
      "Why did the student bring a ladder to school? Because they wanted to go to high school! 😄",
      "What's a scholarship's favorite type of music? Anything with good \"notes\"! 🎵",
      "Why don't scientists trust atoms? Because they make up everything — kind of like some scholarship essays! 😂",
      "What did one college say to the other? \"I've got class!\" 🎓",
      "Why was the math book sad? Because it had too many problems — kind of like college apps! 📚",
      "What's a college application's favorite exercise? Running out of time! ⏰",
    ],
  ],
  [
    /^what is the meaning of life$/,
    [
      "For me? Helping students like you succeed! For you? Well, that's what college is all about — figuring it out. 😊",
    ],
  ],
  [
    /^what is your favorite /,
    [
      "I don't have personal favorites, but I'm a big fan of anything that helps you get into college! 😄",
    ],
  ],
  [
    /^do you (like|enjoy|love) /,
    [
      "As a chatbot, I don't have feelings, but I do \"enjoy\" helping students succeed! What can I do for you?",
    ],
  ],
  [
    /^what time is it$/,
    [
      "I can't tell time, but I can tell you that it's always a good time to work on your college apps! ⏰ What do you need help with?",
    ],
  ],
  [
    /^i am bored$/,
    [
      "Let's fix that! How about we work on your brag sheet, search for scholarships, or brainstorm an essay topic?",
      "Bored? Let's put that energy to use! Want to explore some colleges or find scholarships?",
    ],
  ],
  [
    /^(what should i do|what do i do)$/,
    [
      "Great question! Here are some ideas:\n\n**• Update your brag sheet** with recent activities\n**• Search for scholarships** that match your profile\n**• Work on an essay draft** for an upcoming application\n**• Check your deadlines** and make sure nothing is overdue\n**• Research colleges** that fit your interests\n\nWhich sounds good?",
    ],
  ],

  // ═══ HELP ═══
  [
    /^(help|help me|i need help)$/,
    [
      "I'm here to help! You can ask me about:\n\n**• Scholarships** — finding and applying\n**• Essays** — brainstorming and drafting\n**• Colleges** — research and matching\n**• Deadlines** — tracking and planning\n**• Activities** — building your brag sheet\n**• Financial planning** — understanding costs\n\nWhat would you like help with?",
    ],
  ],

  // ═══ YES / NO / MAYBE ═══
  [
    /^(yes|yeah|yep|yup|sure|absolutely|definitely|of course|you bet)$/,
    [
      "Great! What would you like to do?",
      "Awesome! How can I help?",
    ],
  ],
  [
    /^(no|nah|nope|not really|no thanks|no thank you)$/,
    [
      "No worries! I'm here whenever you need me.",
      "All good! Let me know if you change your mind.",
    ],
  ],
  [
    /^maybe$/,
    [
      "No pressure! I'll be right here when you're ready.",
      "Take your time! Just let me know when you need something.",
    ],
  ],
  [
    /^i do not know$/,
    [
      "That's okay! Want me to help you figure it out?",
      "No worries — let's explore together. What's on your mind?",
    ],
  ],

  // ═══ APOLOGIES ═══
  [
    /^(sorry|my bad|my apologies|i apologize|oops)$/,
    [
      "No need to apologize! How can I help you?",
      "No worries at all! What do you need?",
      "It's all good! What can I do for you?",
    ],
  ],

  // ═══ REPEAT / CONFUSION ═══
  [
    /^(what|huh|come again|say that again|repeat that|i do not understand)$/,
    [
      "Let me rephrase — is there something specific I can help you with? I'm great with scholarships, essays, colleges, and deadlines!",
    ],
  ],

  // ═══ PLATFORM Q&A ═══
  [
    /what is scholarsuite/,
    [
      "ScholarSuite is your all-in-one college prep platform! It helps you track scholarships, manage applications, build your brag sheet, write essays, and plan your college journey — all in one place.",
    ],
  ],
  [
    /what is a brag sheet/,
    [
      "A brag sheet is a collection of all your activities, awards, work experience, volunteer hours, and achievements. It's super useful for filling out college applications and scholarship forms. You can build yours on the Activities page!",
    ],
  ],
  [
    /^how do i find scholarships$/,
    [
      "Great question! Head to the Scholarships page — we match scholarships to your profile automatically. You can also search by keyword, amount, and deadline. Want me to help you find some now?",
    ],
  ],
  [
    /^how do i apply for scholarships$/,
    [
      "Here's the general process:\n\n1. **Find matching scholarships** on your Scholarships page\n2. **Review requirements** — essays, transcripts, letters of rec\n3. **Prepare your materials** using the Documents page\n4. **Submit before the deadline** and track your status\n\nWant help with any of these steps?",
    ],
  ],
  [
    /what is a personal (statement|essay)/,
    [
      "A personal statement is an essay about YOU — your experiences, goals, challenges, and what makes you unique. Most colleges and many scholarships require one. Want help brainstorming topics?",
    ],
  ],
  [
    /when are college applications due/,
    [
      "Deadlines vary by school, but here are common ones:\n\n**• Early Decision:** November 1-15\n**• Early Action:** November 1-15\n**• Regular Decision:** January 1-15\n**• Rolling Admission:** Varies\n\nCheck your specific schools on the Colleges page!",
    ],
  ],
  [
    /^what is (the )?fafsa$/,
    [
      "FAFSA stands for Free Application for Federal Student Aid. It's a form you fill out to determine your eligibility for federal financial aid (grants, loans, work-study). It opens October 1st each year. Definitely fill it out — it's free money!",
    ],
  ],
  [
    /^what is (a )?gpa$/,
    [
      "GPA stands for Grade Point Average. It's a number (usually 0.0 to 4.0) that represents your overall academic performance. Colleges use it as one factor in admissions. You can track yours on the Academics page!",
    ],
  ],
  [
    /^what is (the )?(sat|act)$/,
    [
      "The SAT and ACT are standardized tests used for college admissions. Many schools are now test-optional, meaning you can choose whether to submit scores. Check which policy your target schools have on the Colleges page!",
    ],
  ],
  // ═══ EXTENDED CORPUS (AI, science, history, trivia, etc.) ═══
  ...CORPUS_PATTERNS,
]

// ─── Public API ─────────────────────────────────────────────

/**
 * Try to get a local reply for the given message.
 * Returns the reply string if matched, or `null` if the message
 * should be forwarded to the AI backend.
 */
export async function getLocalReply(message: string): Promise<string | null> {
  const normalized = normalize(message)

  for (const [pattern, responses] of PATTERNS) {
    const match = normalized.match(pattern)
    if (match) {
      let reply = pick(responses)
      // Replace {1}, {2}, etc. with capture groups
      for (let i = 1; i < match.length; i++) {
        reply = reply.replace(`{${i}}`, match[i] || "")
      }
      return reply
    }
  }

  return null
}
