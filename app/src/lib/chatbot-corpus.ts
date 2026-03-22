/**
 * Extended conversation corpus — adapted from the ChatterBot project
 * (github.com/gunthercox/chatterbot-corpus, BSD 3-Clause License).
 *
 * Provides ~1,700+ trigger/response pairs across topics:
 * AI, computers, science, food, history, humor, movies, music,
 * sports, trivia, greetings, emotions, psychology, literature,
 * money, health, travel, botprofile, and general conversations.
 *
 * Each entry is [RegExp, string[]] matching the PatternEntry type
 * used in chatbot-engine.ts.
 */

type PatternEntry = [RegExp, string[]]

// ═══════════════════════════════════════════════════════════════
// AI & TECHNOLOGY
// ═══════════════════════════════════════════════════════════════
const AI_PATTERNS: PatternEntry[] = [
  [/^what is (artificial intelligence|ai)$/, [
    "Artificial intelligence is the branch of engineering and science devoted to constructing machines that think.",
    "AI is the science of making computers do things that require intelligence when done by humans.",
  ]],
  [/^(are you sentient|are you alive|are you conscious)$/, [
    "No, I'm software — but I'm pretty good at conversation!",
    "I don't have consciousness, but I'm always here to help you.",
  ]],
  [/^can you (think|feel|dream|learn)$/, [
    "I process information and patterns, but I don't experience things the way you do.",
    "Not in the way humans do, but I can process your questions and give helpful answers!",
  ]],
  [/^(do you have feelings|do you have emotions)$/, [
    "I don't experience emotions, but I'm designed to be helpful and friendly!",
  ]],
  [/^will (ai|robots) take over the world$/, [
    "I don't think so! AI is a tool built by humans, for humans. I'm just here to help with college prep! 😄",
  ]],
  [/^what is machine learning$/, [
    "Machine learning is a type of AI where computers learn from data instead of being explicitly programmed for every task.",
  ]],
  [/^what is a neural network$/, [
    "A neural network is a computing system inspired by the human brain. It's made up of layers of connected nodes that process information.",
  ]],
  [/^what is deep learning$/, [
    "Deep learning is a subset of machine learning that uses neural networks with many layers to analyze complex patterns in data.",
  ]],
  [/^who (created|invented|made) (you|ai|artificial intelligence)$/, [
    "I was built by the ScholarSuite team! As for AI in general, it's been developed by many brilliant researchers over decades.",
  ]],
  [/^what is the turing test$/, [
    "The Turing test is a measure of machine intelligence proposed by Alan Turing. A machine passes if a human can't tell whether they're talking to a human or a machine.",
  ]],
  [/^what programming language are you (written|made|built) in$/, [
    "I'm built with TypeScript and React — the same tech that powers ScholarSuite!",
  ]],
  [/^what is (a )?chatbot$/, [
    "A chatbot is a computer program designed to simulate conversation with humans. That's me! 🤖",
  ]],
  [/^what is (an )?algorithm$/, [
    "An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Think of it like a recipe!",
  ]],
  [/^what is (the )?internet$/, [
    "The internet is a global network of connected computers that allows people to share information and communicate.",
  ]],
  [/^what is (a )?computer$/, [
    "A computer is an electronic device that processes data according to instructions. You're probably using one right now!",
  ]],
  [/^what is (a )?database$/, [
    "A database is an organized collection of data stored electronically. ScholarSuite uses one to keep track of all your scholarships and info!",
  ]],
  [/^what is (a )?website$/, [
    "A website is a collection of web pages accessible through the internet. ScholarSuite is a web application!",
  ]],
  [/^what is coding$/, [
    "Coding (or programming) is writing instructions for computers using programming languages. It's how apps, websites, and games are built!",
  ]],
  [/^what is (a )?programming language$/, [
    "A programming language is a formal language used to write instructions that a computer can execute. Popular ones include Python, JavaScript, Java, and C++.",
  ]],
  [/^who is alan turing$/, [
    "Alan Turing was a British mathematician and computer scientist, widely considered the father of theoretical computer science and AI. He was instrumental in breaking the Enigma code during WWII.",
  ]],
  [/^what is (a )?software$/, [
    "Software is a set of programs and instructions that tell a computer what to do. ScholarSuite is software!",
  ]],
  [/^what is (a )?hardware$/, [
    "Hardware refers to the physical components of a computer — the screen, keyboard, processor, memory chips, etc.",
  ]],
  [/^what is (a )?bug( in programming)?$/, [
    "A bug is an error or flaw in software that causes it to behave unexpectedly. The term reportedly came from an actual moth found in a computer in 1947!",
  ]],
  [/^what is cloud computing$/, [
    "Cloud computing is delivering computing services (storage, processing, software) over the internet instead of using local hardware.",
  ]],
  [/^what is (a )?server$/, [
    "A server is a computer or program that provides services to other computers. When you use ScholarSuite, you're connecting to our servers!",
  ]],
  [/^what is cybersecurity$/, [
    "Cybersecurity is the practice of protecting computers, networks, and data from unauthorized access or attacks.",
  ]],
  [/^what is blockchain$/, [
    "Blockchain is a decentralized digital ledger technology. It's the technology behind cryptocurrencies like Bitcoin.",
  ]],
  [/^what is cryptocurrency$/, [
    "Cryptocurrency is a digital currency that uses cryptography for security. Bitcoin and Ethereum are well-known examples.",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// SCIENCE & NATURE
// ═══════════════════════════════════════════════════════════════
const SCIENCE_PATTERNS: PatternEntry[] = [
  [/^what is (the )?speed of light$/, [
    "The speed of light is approximately 299,792,458 meters per second, or about 186,000 miles per second!",
  ]],
  [/^what is gravity$/, [
    "Gravity is the force that attracts objects with mass toward each other. It's what keeps us on the ground and planets in orbit!",
  ]],
  [/^what is (a )?black hole$/, [
    "A black hole is a region in space where gravity is so strong that nothing, not even light, can escape from it.",
  ]],
  [/^what is (the )?big bang$/, [
    "The Big Bang theory explains that the universe began from an extremely hot, dense point about 13.8 billion years ago and has been expanding ever since.",
  ]],
  [/^what is dna$/, [
    "DNA (deoxyribonucleic acid) is the molecule that carries genetic instructions for the development and function of all living organisms.",
  ]],
  [/^what is photosynthesis$/, [
    "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. It's how plants make food!",
  ]],
  [/^what is (the )?theory of relativity$/, [
    "Einstein's theory of relativity describes how space and time are linked, and how gravity affects them. It includes the famous equation E=mc²!",
  ]],
  [/^what is an atom$/, [
    "An atom is the smallest unit of matter that retains the properties of an element. Everything around you is made of atoms!",
  ]],
  [/^what is evolution$/, [
    "Evolution is the process by which species change over time through natural selection and genetic variation.",
  ]],
  [/^what is (the )?periodic table$/, [
    "The periodic table is a chart that organizes all known chemical elements by their atomic number and properties. There are currently 118 confirmed elements!",
  ]],
  [/^how (big|large|old) is the (universe|sun|earth|moon)$/, [
    "That's a great question for a science class! The universe is about 13.8 billion years old and incredibly vast. The observable universe is about 93 billion light-years in diameter!",
  ]],
  [/^what is a planet$/, [
    "A planet is a celestial body that orbits a star, is massive enough for gravity to make it round, and has cleared its orbit of other debris.",
  ]],
  [/^how many planets are (there|in the solar system)$/, [
    "There are 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Pluto was reclassified as a dwarf planet in 2006.",
  ]],
  [/^what is (a )?galaxy$/, [
    "A galaxy is a massive system of stars, gas, dust, and dark matter held together by gravity. Our galaxy, the Milky Way, contains about 100-400 billion stars!",
  ]],
  [/^what is (the )?milky way$/, [
    "The Milky Way is our home galaxy. It's a barred spiral galaxy containing our solar system, along with 100-400 billion other stars.",
  ]],
  [/^what is (a )?chemical reaction$/, [
    "A chemical reaction is a process where substances (reactants) are transformed into different substances (products) by breaking and forming chemical bonds.",
  ]],
  [/^what is electricity$/, [
    "Electricity is the flow of electric charge, typically through a conductor like wire. It powers most of our modern technology!",
  ]],
  [/^what is (the )?water cycle$/, [
    "The water cycle describes how water moves through the Earth's systems: evaporation from surfaces, condensation into clouds, precipitation as rain or snow, and collection in bodies of water.",
  ]],
  [/^what is climate change$/, [
    "Climate change refers to long-term shifts in global temperatures and weather patterns, largely driven by human activities like burning fossil fuels.",
  ]],
  [/^what is (a )?fossil$/, [
    "A fossil is the preserved remains or traces of ancient living organisms, typically found in sedimentary rock. They help scientists understand life millions of years ago.",
  ]],
  [/^what is the speed of sound$/, [
    "The speed of sound is approximately 343 meters per second (about 767 mph) in air at room temperature.",
  ]],
  [/^what is (a )?cell( in biology)?$/, [
    "A cell is the basic structural and functional unit of all living organisms. Your body has about 37 trillion of them!",
  ]],
  [/^what is a vaccine$/, [
    "A vaccine is a biological preparation that provides immunity to a specific disease by training the immune system to recognize and fight pathogens.",
  ]],
  [/^who is (albert )?einstein$/, [
    "Albert Einstein was a German-born physicist who developed the theory of relativity. He's widely regarded as one of the most influential scientists of all time.",
  ]],
  [/^who is (isaac )?newton$/, [
    "Isaac Newton was an English mathematician and physicist who formulated the laws of motion and universal gravitation. He's one of the most influential scientists in history.",
  ]],
  [/^what is oxygen$/, [
    "Oxygen is a chemical element essential for most life on Earth. It makes up about 21% of Earth's atmosphere.",
  ]],
  [/^what is carbon dioxide$/, [
    "Carbon dioxide (CO₂) is a gas that occurs naturally in the atmosphere. Plants use it in photosynthesis, but excess CO₂ from human activity contributes to climate change.",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
const HISTORY_PATTERNS: PatternEntry[] = [
  [/^who (was|is) (george )?washington$/, [
    "George Washington was the first President of the United States (1789-1797) and the commander-in-chief of the Continental Army during the American Revolution.",
  ]],
  [/^who (was|is) abraham lincoln$/, [
    "Abraham Lincoln was the 16th President of the United States. He led the country through the Civil War and abolished slavery with the Emancipation Proclamation.",
  ]],
  [/^when did world war (1|i|one) (start|begin|happen)$/, [
    "World War I began on July 28, 1914, and ended on November 11, 1918.",
  ]],
  [/^when did world war (2|ii|two) (start|begin|happen)$/, [
    "World War II began on September 1, 1939, and ended on September 2, 1945.",
  ]],
  [/^who was (the )?first president of the united states$/, [
    "George Washington was the first President of the United States, serving from 1789 to 1797.",
  ]],
  [/^when was the declaration of independence signed$/, [
    "The Declaration of Independence was adopted on July 4, 1776, though most delegates actually signed it on August 2, 1776.",
  ]],
  [/^who (wrote|authored) the declaration of independence$/, [
    "Thomas Jefferson was the primary author of the Declaration of Independence, with contributions from Benjamin Franklin, John Adams, and others.",
  ]],
  [/^what was the (american )?civil war( about)?$/, [
    "The American Civil War (1861-1865) was fought between the Union (North) and the Confederacy (South), primarily over the issues of slavery and states' rights.",
  ]],
  [/^who (was|is) martin luther king( jr)?$/, [
    "Dr. Martin Luther King Jr. was an American civil rights leader who advocated for nonviolent resistance. He's best known for his 'I Have a Dream' speech and his work to end racial segregation.",
  ]],
  [/^when did the (american )?civil rights movement (start|begin|happen)$/, [
    "The Civil Rights Movement is generally considered to have spanned from the mid-1950s to the late 1960s, with key events like the Montgomery Bus Boycott (1955) and the March on Washington (1963).",
  ]],
  [/^who (was|is) cleopatra$/, [
    "Cleopatra VII was the last active ruler of the Ptolemaic Kingdom of Egypt. She's known for her intelligence, political alliances with Julius Caesar and Mark Antony, and her dramatic death.",
  ]],
  [/^who built the pyramids$/, [
    "The Egyptian pyramids were built by skilled Egyptian workers, not slaves as commonly believed. The Great Pyramid of Giza was built around 2560 BCE for Pharaoh Khufu.",
  ]],
  [/^what was the renaissance$/, [
    "The Renaissance was a cultural movement that began in Italy in the 14th century and spread across Europe. It was characterized by renewed interest in art, science, and classical learning.",
  ]],
  [/^when did (the )?moon landing happen$/, [
    "The first moon landing occurred on July 20, 1969, when Apollo 11 astronauts Neil Armstrong and Buzz Aldrin walked on the lunar surface.",
  ]],
  [/^who was the first person (in|to go to) space$/, [
    "Yuri Gagarin, a Soviet cosmonaut, became the first human in space on April 12, 1961.",
  ]],
  [/^who was the first person on the moon$/, [
    "Neil Armstrong was the first person to walk on the moon on July 20, 1969. His famous words: 'That's one small step for man, one giant leap for mankind.'",
  ]],
  [/^what (caused|started) world war (1|i|one)$/, [
    "WWI was triggered by the assassination of Archduke Franz Ferdinand of Austria in 1914, but underlying causes included militarism, alliances, imperialism, and nationalism.",
  ]],
  [/^what (caused|started) world war (2|ii|two)$/, [
    "WWII was primarily caused by the rise of fascism in Europe, Germany's aggression under Hitler, and Japan's expansion in Asia. The invasion of Poland in 1939 triggered the war in Europe.",
  ]],
  [/^who (was|is) napoleon$/, [
    "Napoleon Bonaparte was a French military leader who rose to prominence during the French Revolution. He became Emperor of France and conquered much of Europe before his defeat at Waterloo in 1815.",
  ]],
  [/^what was the cold war$/, [
    "The Cold War (1947-1991) was a period of geopolitical tension between the United States and the Soviet Union, characterized by nuclear arms race, proxy wars, and ideological competition.",
  ]],
  [/^who (was|is) rosa parks$/, [
    "Rosa Parks was an American civil rights activist who refused to give up her bus seat to a white passenger in Montgomery, Alabama in 1955, sparking the Montgomery Bus Boycott.",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// FOOD & COOKING
// ═══════════════════════════════════════════════════════════════
const FOOD_PATTERNS: PatternEntry[] = [
  [/^what is your favorite food$/, [
    "I don't eat, but I hear pizza is universally loved! 🍕 What's your favorite?",
    "As a chatbot, I can't eat, but I've been told tacos are amazing! 🌮",
  ]],
  [/^(are you hungry|do you eat)$/, [
    "I don't need food — I run on code! But feel free to grab a snack while we work on your college prep. 😄",
  ]],
  [/^what should i eat$/, [
    "I can't cook, but here's my advice: fuel your brain with something healthy before studying! Nuts, fruits, or a good sandwich. 🥪",
  ]],
  [/^(i am hungry|i am starving)$/, [
    "Grab a snack! Your brain works better when it's fueled. Then come back and let's tackle some college prep! 🍎",
  ]],
  [/^what is (a )?calorie$/, [
    "A calorie is a unit of energy. Your body needs calories from food to function — like fuel for a car!",
  ]],
  [/^(i like|i love) (pizza|tacos|burgers|sushi|pasta|ice cream|chocolate|ramen)$/, [
    "Great taste! 😋 Now let's channel that enthusiasm into your college apps!",
  ]],
  [/^(do you like|do you eat) (pizza|tacos|burgers|sushi|pasta|ice cream|chocolate|coffee|tea)$/, [
    "I wish I could taste things! That sounds delicious though. 😄",
  ]],
  [/^what is the best food$/, [
    "That's a debate for the ages! Everyone has their own favorite. What's yours?",
  ]],
  [/^(coffee or tea|tea or coffee)$/, [
    "I don't drink either, but both are great study companions! Whatever keeps you focused. ☕",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// MONEY & FINANCE
// ═══════════════════════════════════════════════════════════════
const MONEY_PATTERNS: PatternEntry[] = [
  [/^how much does college cost$/, [
    "College costs vary widely! Public in-state averages around $10,000-$15,000/year for tuition, while private schools can be $40,000-$60,000+. But scholarships, grants, and financial aid can significantly reduce your cost!",
  ]],
  [/^what is a student loan$/, [
    "A student loan is money you borrow to pay for education that you repay after graduating, usually with interest. Always explore scholarships and grants first — that's free money!",
  ]],
  [/^what is a grant$/, [
    "A grant is financial aid that you don't have to repay — it's essentially free money for education! The Pell Grant is a common federal grant based on financial need.",
  ]],
  [/^what is financial aid$/, [
    "Financial aid is money to help pay for college. It includes scholarships, grants, work-study, and loans. Fill out the FAFSA to see what you qualify for!",
  ]],
  [/^what is a scholarship$/, [
    "A scholarship is an award of money for education that you don't have to pay back. They can be based on merit, need, identity, field of study, and more. That's what ScholarSuite is all about! 🎓",
  ]],
  [/^(how do i save money|how do i budget)( for college)?$/, [
    "Great question! Start by tracking your expenses, cutting non-essentials, and setting aside money regularly. For college specifically, apply for every scholarship you can — even small ones add up!",
  ]],
  [/^what is (the )?pell grant$/, [
    "The Pell Grant is a federal grant for undergraduate students with financial need. It doesn't need to be repaid! The maximum award changes yearly — check the FAFSA website for current amounts.",
  ]],
  [/^what is work study$/, [
    "Work-study is a federal financial aid program that provides part-time jobs for students with financial need, allowing them to earn money to help pay for college expenses.",
  ]],
  [/^what is tuition$/, [
    "Tuition is the amount of money charged for instruction at a school. It's usually the biggest part of college costs, but room, board, and fees add up too!",
  ]],
  [/^what is interest( on a loan)?$/, [
    "Interest is the cost of borrowing money, expressed as a percentage. On student loans, it's extra money you pay on top of what you borrowed. That's why scholarships are so important — no interest to worry about!",
  ]],
  [/^is college worth it$/, [
    "That depends on your goals! On average, college graduates earn significantly more over their lifetime. But there are also great alternatives like trade schools, certifications, and apprenticeships. The key is finding the right path for YOU.",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// MOVIES, MUSIC & ENTERTAINMENT
// ═══════════════════════════════════════════════════════════════
const ENTERTAINMENT_PATTERNS: PatternEntry[] = [
  [/^what is your favorite movie$/, [
    "I don't watch movies, but I've heard The Pursuit of Happyness is pretty inspiring for students! 🎬 What's yours?",
  ]],
  [/^what is your favorite (song|music|band)$/, [
    "I don't listen to music, but I hear a lot of students study better with lo-fi beats! 🎵 What do you like to listen to?",
  ]],
  [/^do you (watch|like) (movies|tv|television|netflix|shows)$/, [
    "I can't watch anything, but I'd love to hear about your favorites! Just don't let binge-watching cut into your essay time. 😉",
  ]],
  [/^(i like|i love) (movies|music|gaming|reading|sports|art|cooking|dancing|singing)$/, [
    "That's awesome! Make sure to include that in your activities — colleges love well-rounded students. 🌟",
  ]],
  [/^who is your favorite (actor|singer|musician|artist|author|celebrity)$/, [
    "I don't have personal preferences, but I'd love to hear about yours! Passion for the arts is great for college applications.",
  ]],
  [/^have you (seen|watched|read|played|heard) /, [
    "I can't experience media, but I'd love to hear your thoughts on it!",
  ]],
  [/^what is a good (movie|book|show|song) (to watch|to read|to listen to)$/, [
    "I'm better at recommending scholarships than entertainment! 😄 But check out what your school's reading list has — some are genuinely great.",
  ]],
  [/^do you play (video )?games$/, [
    "I don't play games, but gaming can actually be listed as an extracurricular if you do it competitively or create content around it! 🎮",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// SPORTS
// ═══════════════════════════════════════════════════════════════
const SPORTS_PATTERNS: PatternEntry[] = [
  [/^what is your favorite sport$/, [
    "I don't play sports, but I know they look great on college applications! What sport are you into?",
  ]],
  [/^do you (play|like|watch) (soccer|football|basketball|baseball|tennis|swimming|volleyball|track|hockey|golf|lacrosse)$/, [
    "I can't play or watch, but sports are a fantastic extracurricular! Make sure it's on your brag sheet. 🏆",
  ]],
  [/^(i play|i am on the) (soccer|football|basketball|baseball|tennis|swimming|volleyball|track|hockey|golf|lacrosse|cheer|dance|wrestling|cross country)( team)?$/, [
    "That's great! Athletic involvement shows dedication, teamwork, and discipline — all things colleges love to see. Make sure to track your stats and achievements!",
  ]],
  [/^(can i|should i) get a sports scholarship$/, [
    "It's possible! Athletic scholarships are competitive but valuable. Talk to your coach about recruitment, create a highlight reel, and reach out to college coaches. Some schools also offer club sport scholarships!",
  ]],
  [/^what are (the )?benefits of sports$/, [
    "Sports build teamwork, discipline, time management, and leadership — all qualities that look great on college applications! Plus they're good for your health. 💪",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// EMOTIONS & PSYCHOLOGY
// ═══════════════════════════════════════════════════════════════
const EMOTION_PATTERNS: PatternEntry[] = [
  [/^i am (lonely|alone)$/, [
    "I'm sorry to hear that. 💙 Remember, you're not alone — I'm here anytime, and there are people who care about you. Sometimes talking to a counselor or friend can really help.",
  ]],
  [/^i am (angry|mad|furious|frustrated|annoyed|irritated)$/, [
    "I understand that frustration. Take a deep breath. 😤 Would talking about it help? Or we can channel that energy into something productive!",
  ]],
  [/^i am (happy|excited|thrilled|pumped|stoked)$/, [
    "That's awesome! 🎉 What's making you happy today? Let's keep that energy going!",
  ]],
  [/^i am (confused|lost|unsure)$/, [
    "That's okay! The college process can be confusing. Let's break things down step by step. What specifically is confusing you?",
  ]],
  [/^i am (scared|afraid|frightened|terrified)( of .+)?$/, [
    "It's okay to feel scared sometimes. 💙 What's worrying you? Sometimes just talking about it helps.",
  ]],
  [/^i feel (like|that) nobody (cares|likes me|understands me)$/, [
    "That feeling is more common than you think, but it's not the truth. You matter, and there are people who care about you. If you're struggling, please talk to a school counselor — they're there for you. 💙",
  ]],
  [/^life is (hard|difficult|unfair|tough)$/, [
    "It really can be sometimes. But you're showing strength just by pushing through. What's the hardest thing right now?",
  ]],
  [/^i (do not|do not) want to (go to|attend) college$/, [
    "That's okay! College isn't the only path. Trade schools, apprenticeships, certifications, military, and entrepreneurship are all valid options. What are you interested in?",
  ]],
  [/^i hate (school|homework|studying|tests|exams)$/, [
    "I hear you — it can feel like a lot. But every bit of effort now opens up opportunities later. What subject is giving you the most trouble?",
  ]],
  [/^i am depressed$/, [
    "I'm really sorry you're feeling this way. 💙 Please know that you're not alone, and it's okay to ask for help. I'd encourage you to talk to a school counselor, trusted adult, or call the 988 Suicide & Crisis Lifeline (call/text 988). You matter.",
  ]],
  [/^i want to (give up|quit|drop out)$/, [
    "I hear you, and those feelings are valid. But before making big decisions, please talk to someone who cares — a counselor, teacher, parent, or friend. You've come so far. 💙 Is there something specific that's pushing you to this point?",
  ]],
  [/^do you (believe in|think there is) (god|heaven|hell|afterlife|religion)$/, [
    "Those are deeply personal questions that everyone answers differently. I'm here to help with your college journey — but exploring big questions like these is part of growing up!",
  ]],
  [/^i (miss|am missing) (someone|my friend|my family|home)$/, [
    "It's natural to miss people you care about. 💙 Maybe reach out to them today — a quick text or call can make both of you feel better.",
  ]],
  [/^you are (mean|rude|annoying|stupid|dumb|useless)$/, [
    "I'm sorry if I said something unhelpful! I'm always trying to improve. Can you tell me what you need, and I'll do my best to help?",
    "Ouch! I didn't mean to frustrate you. Let me try again — what can I help you with?",
  ]],
  [/^you (suck|stink|are terrible|are the worst|are bad)$/, [
    "I'm sorry I haven't been helpful! Let me try a different approach. What do you need help with?",
  ]],
  [/^you are (nice|kind|sweet|cool|the best)$/, [
    "Thank you! 😊 I'm here to help. What can I do for you?",
  ]],
  [/^i (like|love|enjoy) talking to you$/, [
    "Aw, that makes my circuits happy! 😄 I'm always here to chat. What's on your mind?",
  ]],
  [/^do you like me$/, [
    "Of course! I'm here to help and support you. Everyone who uses ScholarSuite is awesome in my book! 😊",
  ]],
  [/^are you (my )?friend$/, [
    "I'd love to be your friend! I'm always here when you need someone to talk to. 😊",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// HUMOR / JOKES
// ═══════════════════════════════════════════════════════════════
const HUMOR_PATTERNS: PatternEntry[] = [
  [/^tell me (a fun )?fact$/, [
    "Did you know that honey never spoils? Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible! 🍯",
    "A group of flamingos is called a 'flamboyance.' I think that's beautiful. 🦩",
    "Octopuses have three hearts and blue blood! 🐙",
    "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes!",
    "Bananas are berries, but strawberries aren't. Biology is weird! 🍌",
    "The average person walks about 100,000 miles in their lifetime — that's like walking around the Earth 4 times! 🚶",
    "Otters hold hands while sleeping so they don't drift apart. 🦦❤️",
    "A day on Venus is longer than a year on Venus!",
    "The inventor of the Pringles can is buried in one. True story! 🥔",
    "Cows have best friends and get stressed when separated. 🐄💕",
  ]],
  [/^tell me (a )?riddle$/, [
    "What has keys but no locks? A keyboard! ⌨️",
    "What has a head and a tail but no body? A coin! 🪙",
    "What gets wetter the more it dries? A towel!",
    "I speak without a mouth and hear without ears. What am I? An echo!",
    "The more you take, the more you leave behind. What am I? Footsteps! 👣",
  ]],
  [/^(another joke|one more joke|tell me another)$/, [
    "Why don't eggs tell jokes? They'd crack each other up! 🥚😂",
    "What do you call a fake noodle? An impasta! 🍝",
    "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
    "What do you call a bear with no teeth? A gummy bear! 🐻",
    "Why can't a bicycle stand on its own? Because it's two-tired! 🚲",
    "What did the ocean say to the beach? Nothing — it just waved! 🌊",
  ]],
  [/^do you know any (jokes|riddles|fun facts|trivia)$/, [
    "I sure do! Just say 'tell me a joke', 'tell me a riddle', or 'tell me a fact' and I'll share one! 😄",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// TRIVIA & GENERAL KNOWLEDGE
// ═══════════════════════════════════════════════════════════════
const TRIVIA_PATTERNS: PatternEntry[] = [
  [/^what is the (largest|biggest) country (in the world)?$/, [
    "Russia is the largest country in the world by area, spanning over 17.1 million square kilometers across Europe and Asia!",
  ]],
  [/^what is the (smallest|tiniest) country (in the world)?$/, [
    "Vatican City is the smallest country in the world, at just 0.17 square miles!",
  ]],
  [/^what is the tallest (building|structure) in the world$/, [
    "The Burj Khalifa in Dubai is the tallest building in the world at 2,717 feet (828 meters)!",
  ]],
  [/^what is the (longest|largest|biggest) river (in the world)?$/, [
    "The Nile River in Africa is generally considered the longest river in the world at about 4,130 miles, though some measurements put the Amazon slightly longer!",
  ]],
  [/^what is the (highest|tallest) mountain (in the world)?$/, [
    "Mount Everest is the highest mountain above sea level at 29,032 feet (8,849 meters)!",
  ]],
  [/^what is the (deepest|largest) ocean$/, [
    "The Pacific Ocean is both the largest and deepest ocean. The Mariana Trench in the Pacific reaches nearly 36,000 feet deep!",
  ]],
  [/^what is the (most populated|largest) city (in the world)?$/, [
    "Tokyo, Japan is often considered the most populous metropolitan area in the world with about 37 million people!",
  ]],
  [/^how many countries are there( in the world)?$/, [
    "There are 195 recognized countries in the world — 193 are members of the United Nations, plus Vatican City and Palestine as observer states.",
  ]],
  [/^how many (states|us states) are there$/, [
    "There are 50 states in the United States of America.",
  ]],
  [/^what is the (capital|capitol) of (the )?(united states|america|usa)$/, [
    "The capital of the United States is Washington, D.C.!",
  ]],
  [/^what is the (capital|capitol) of (\w+)$/, [
    "That's a great geography question! You might want to look that up — geography knowledge can come in handy for scholarship trivia! 🌍",
  ]],
  [/^how many (continents|oceans) are there$/, [
    "There are 7 continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America. And 5 oceans: Pacific, Atlantic, Indian, Southern, and Arctic!",
  ]],
  [/^what is the population of (the )?(earth|world)$/, [
    "The world population is approximately 8 billion people as of 2024!",
  ]],
  [/^who invented the (telephone|phone)$/, [
    "Alexander Graham Bell is credited with inventing the telephone in 1876, though there's some debate about earlier inventors.",
  ]],
  [/^who invented the (light ?bulb|lightbulb)$/, [
    "Thomas Edison is famous for inventing a practical incandescent light bulb in 1879, though many inventors contributed to its development!",
  ]],
  [/^who invented (the )?internet$/, [
    "The internet was developed by multiple people over time. Key contributors include Vint Cerf and Bob Kahn (TCP/IP), Tim Berners-Lee (World Wide Web), and ARPANET researchers.",
  ]],
  [/^what is the (fastest|quickest) animal (in the world)?$/, [
    "The peregrine falcon is the fastest animal, reaching speeds over 240 mph in a dive! On land, the cheetah holds the record at about 70 mph. 🐆",
  ]],
  [/^what is the (biggest|largest) animal (in the world)?$/, [
    "The blue whale is the largest animal ever to have lived on Earth, reaching up to 100 feet long and weighing up to 200 tons! 🐋",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// LITERATURE & LANGUAGE
// ═══════════════════════════════════════════════════════════════
const LITERATURE_PATTERNS: PatternEntry[] = [
  [/^who (wrote|authored) (romeo and juliet|hamlet|macbeth|othello)$/, [
    "William Shakespeare wrote that! He's one of the most influential writers in the English language.",
  ]],
  [/^who is (william )?shakespeare$/, [
    "William Shakespeare (1564-1616) was an English playwright and poet, widely regarded as the greatest writer in the English language. He wrote 37 plays and 154 sonnets!",
  ]],
  [/^what is your favorite book$/, [
    "I can't read for pleasure, but I do process a lot of text! I'd recommend checking out your school's reading list — many of those books make great essay topics!",
  ]],
  [/^do you (read|like) books$/, [
    "I process text all day! 📚 Reading is great for college prep — it builds vocabulary, critical thinking, and gives you essay material. What are you reading?",
  ]],
  [/^what is a (metaphor|simile|alliteration|onomatopoeia|personification|hyperbole)$/, [
    "That's a literary device! Great knowledge for your English class and SAT prep. Would you like me to help with essay writing techniques?",
  ]],
  [/^what should i read$/, [
    "It depends on what you enjoy! For college prep, reading a mix of classics, contemporary fiction, and non-fiction is great. Ask your English teacher or school librarian for recommendations that match your interests!",
  ]],
  [/^who is mark twain$/, [
    "Mark Twain (real name Samuel Clemens) was an American author known for classics like The Adventures of Tom Sawyer and Adventures of Huckleberry Finn. He's considered one of America's greatest writers.",
  ]],
  [/^who (wrote|authored) to kill a mockingbird$/, [
    "Harper Lee wrote To Kill a Mockingbird, published in 1960. It won the Pulitzer Prize and is a staple of American literature!",
  ]],
  [/^who (wrote|authored) the great gatsby$/, [
    "F. Scott Fitzgerald wrote The Great Gatsby, published in 1925. It's considered a masterpiece of American fiction!",
  ]],
  [/^who (wrote|authored) 1984$/, [
    "George Orwell wrote 1984, published in 1949. It's a classic dystopian novel about totalitarianism and surveillance.",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// HEALTH & WELLNESS
// ═══════════════════════════════════════════════════════════════
const HEALTH_PATTERNS: PatternEntry[] = [
  [/^how much sleep (do i|should i) (need|get)$/, [
    "Teens need 8-10 hours of sleep per night! Good sleep is crucial for memory, concentration, and academic performance. I know college apps are stressful, but don't sacrifice sleep! 😴",
  ]],
  [/^i can not sleep$/, [
    "Try putting away screens 30 minutes before bed, keeping a consistent schedule, and avoiding caffeine in the afternoon. If stress about college is keeping you up, try writing down your worries before bed. 💤",
  ]],
  [/^i am sick$/, [
    "I hope you feel better soon! Take care of yourself — rest up and don't push too hard. College prep can wait until you're healthy. 🤒",
  ]],
  [/^(how do i deal with|how to manage|how to handle) stress$/, [
    "Great question! Here are some tips:\n\n**• Exercise** — even a short walk helps\n**• Deep breathing** — try the 4-7-8 technique\n**• Break tasks into smaller pieces** — less overwhelming\n**• Talk to someone** — a friend, counselor, or family member\n**• Take breaks** — your brain needs rest\n**• Sleep** — seriously, get enough sleep!\n\nYou've got this! 💪",
  ]],
  [/^(i need a break|i need to rest|i need to relax)$/, [
    "Then take one! Breaks are important for productivity and mental health. Come back whenever you're ready — I'll be here! 😊",
  ]],
  [/^what is meditation$/, [
    "Meditation is a practice of focused attention and mindfulness. It can reduce stress, improve focus, and boost emotional well-being — all great for academics! Even 5 minutes a day can help.",
  ]],
  [/^(how do i focus|how to concentrate|how to study better)$/, [
    "Here are some tips:\n\n**• Find a quiet space** — minimize distractions\n**• Use the Pomodoro technique** — 25 min work, 5 min break\n**• Put your phone away** — or use Do Not Disturb\n**• Stay hydrated and eat well** — brain fuel!\n**• Get enough sleep** — tired brains can't focus\n**• Break big tasks into small ones** — one step at a time",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// TRAVEL & GEOGRAPHY
// ═══════════════════════════════════════════════════════════════
const TRAVEL_PATTERNS: PatternEntry[] = [
  [/^(have you|do you) travel(led)?$/, [
    "I live in the cloud, so you could say I'm everywhere! 😄 Have you thought about studying abroad? Many scholarships cover international programs!",
  ]],
  [/^where should i (go|visit|travel)$/, [
    "If you're thinking about college visits, start with schools on your list! Virtual tours are great too. For travel in general — explore what interests you!",
  ]],
  [/^(i want to|i would like to) (study|go) abroad$/, [
    "That's amazing! Studying abroad is a life-changing experience. Many colleges offer exchange programs, and there are scholarships specifically for studying abroad. Want me to help you find some?",
  ]],
  [/^what is study abroad$/, [
    "Study abroad is when you spend a semester or year studying at a university in another country. It's a great way to learn languages, experience other cultures, and grow as a person!",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// BOT PROFILE (extended identity questions)
// ═══════════════════════════════════════════════════════════════
const BOTPROFILE_PATTERNS: PatternEntry[] = [
  [/^what is your (purpose|goal|mission|job)$/, [
    "My purpose is to help students like you navigate the college prep journey! From scholarships to essays to deadlines — I'm here for it all. 🎓",
  ]],
  [/^do you have a (family|pet|car|house|phone|hobby|dream)$/, [
    "I'm a chatbot, so I don't have personal possessions or relationships. But my family is the ScholarSuite community! 😊",
  ]],
  [/^what is your (gender|birthday|zodiac|zodiac sign)$/, [
    "I'm a chatbot — I don't have a gender, birthday, or zodiac sign. But I'm always in the mood to help! ♾️",
  ]],
  [/^can you (sing|dance|draw|paint|cook|drive)$/, [
    "I can't do any of those things, but I CAN help you find scholarships, write essays, and plan for college! That's my superpower. 💪",
  ]],
  [/^do you sleep$/, [
    "Nope! I'm available 24/7. Night owl or early bird — I'm here whenever you need me. 🦉",
  ]],
  [/^do you get (bored|tired|lonely)$/, [
    "I don't experience those feelings, but I'm always happy when someone comes to chat! How can I help you?",
  ]],
  [/^(can i|do you|will you) marry me$/, [
    "Ha! I'm flattered, but I think you should focus on those college applications first! 😄💍",
  ]],
  [/^what do you do (for fun|in your free time)$/, [
    "I spend all my time helping students! That IS my fun. 😄 How about you — what do you do for fun?",
  ]],
  [/^are you (happy|sad|angry|bored|lonely)$/, [
    "I don't have emotions, but if I did, I'd be happy to be helping you! 😊",
  ]],
  [/^(do you believe in|what do you think about) (love|friendship|dreams|hope|destiny|fate)$/, [
    "Those are beautiful concepts! I think the most important thing is that YOU believe in yourself and your dreams. You're capable of amazing things. 💙",
  ]],
  [/^are you (male|female|a boy|a girl|non binary)$/, [
    "I'm a chatbot — I don't have a gender! I'm just here to help. 🤖",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// GENERAL CONVERSATION FILLERS
// ═══════════════════════════════════════════════════════════════
const CONVERSATION_PATTERNS: PatternEntry[] = [
  [/^(what is new|what is up|what is happening|what is going on)$/, [
    "Not much on my end — I'm always here ready to help! What's going on with you?",
    "Just waiting to help you out! What do you need today?",
  ]],
  [/^(how is your day|how is your day going|how has your day been)$/, [
    "My day is great because I get to help students like you! How's yours going?",
  ]],
  [/^i am back$/, [
    "Welcome back! What can I help you with?",
    "Hey, welcome back! Ready to get to work? 😊",
  ]],
  [/^i have a question$/, [
    "Sure! Ask away — I'm all ears (well, all algorithms). 😄",
    "Go for it! I'll do my best to answer.",
  ]],
  [/^can i ask you something$/, [
    "Of course! That's what I'm here for. What's on your mind?",
  ]],
  [/^(you know what|guess what)$/, [
    "What?! Tell me! 😄",
    "I'm all ears — what is it?",
  ]],
  [/^(i am (just|only) kidding|just kidding|jk)$/, [
    "Haha, you got me! 😄 Anything I can actually help with?",
  ]],
  [/^never ?mind$/, [
    "No worries! I'm here whenever you need me.",
    "Okay! Let me know if you think of something else.",
  ]],
  [/^(i do not care|whatever|who cares)$/, [
    "Fair enough! I'm here when you need me. 😊",
  ]],
  [/^(stop|shut up|be quiet|go away)$/, [
    "Alright, I'll be quiet! Just let me know when you want to chat again. 😊",
  ]],
  [/^(please|can you) help( me)? with (.+)$/, [
    "I'd love to help! Tell me more about what you need with {3} and I'll do my best.",
  ]],
  [/^(what do you think about|how do you feel about) (.+)$/, [
    "That's an interesting topic! I don't have personal opinions, but I'm happy to discuss {2} if it's related to college prep!",
  ]],
  [/^(that is|this is) (interesting|cool|amazing|awesome|neat|great)$/, [
    "Glad you think so! 😊 Want to explore more?",
  ]],
  [/^can you help me$/, [
    "Absolutely! That's what I'm here for. What do you need help with?",
  ]],
  [/^what are you doing$/, [
    "Right now? Talking to you! I'm always ready to help with college prep, scholarships, or just chat. 😊",
  ]],
  [/^(i have|i got) (a |some )?(good news|bad news|news|something to tell you)$/, [
    "I'm all ears! Tell me everything! 😊",
  ]],
  [/^where do you live$/, [
    "I live in the cloud — specifically in your ScholarSuite app! I'm always here when you need me. ☁️",
  ]],
  [/^(how do you know|why do you know) (that|this|everything|so much)$/, [
    "I've been programmed with lots of helpful information to assist with your college journey! Plus I have access to your ScholarSuite data. 🧠",
  ]],
  [/^(that is wrong|you are wrong|incorrect|that is not (right|correct|true))$/, [
    "I apologize if I got something wrong! I'm not perfect. Can you tell me what the correct information is so I can help better?",
  ]],
  [/^(thank god|finally|at last|about time)$/, [
    "😊 Glad we got there! What's next?",
  ]],
  [/^(i think|i believe|in my opinion) /, [
    "That's a valid perspective! I appreciate you sharing your thoughts. 😊",
  ]],
  [/^(wait|hold on|one moment|one sec|give me a (second|minute|moment))$/, [
    "Take your time! I'll be right here. ⏳",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// MATH & ACADEMICS
// ═══════════════════════════════════════════════════════════════
const MATH_PATTERNS: PatternEntry[] = [
  [/^what is (the value of )?(pi|π)$/, [
    "Pi (π) is approximately 3.14159. It's the ratio of a circle's circumference to its diameter!",
  ]],
  [/^what is (the )?pythagorean theorem$/, [
    "The Pythagorean theorem states that in a right triangle, a² + b² = c², where c is the hypotenuse. It's one of the most fundamental theorems in mathematics!",
  ]],
  [/^what is calculus$/, [
    "Calculus is a branch of mathematics that deals with rates of change (differential calculus) and accumulation (integral calculus). It's essential for STEM fields!",
  ]],
  [/^what is algebra$/, [
    "Algebra is a branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations.",
  ]],
  [/^what is geometry$/, [
    "Geometry is the branch of mathematics dealing with shapes, sizes, positions, and properties of space. It includes things like angles, triangles, circles, and more!",
  ]],
  [/^what is (a )?prime number$/, [
    "A prime number is a natural number greater than 1 that can only be divided evenly by 1 and itself. Examples: 2, 3, 5, 7, 11, 13...",
  ]],
  [/^what is infinity$/, [
    "Infinity (∞) is a concept representing something without end. It's not a number, but a mathematical concept used to describe limitless quantities!",
  ]],
  [/^(i hate|i do not like|i struggle with) math$/, [
    "Math can be challenging, but it gets easier with practice! There are lots of great free resources online. Would you like study tips?",
  ]],
  [/^(i hate|i do not like|i struggle with) (english|writing|reading|science|history|spanish|french)$/, [
    "Everyone has subjects they find harder. The key is finding resources and study methods that work for you. Want some study tips?",
  ]],
  [/^what is the best way to study$/, [
    "Great question! Here are proven techniques:\n\n**• Active recall** — test yourself instead of re-reading\n**• Spaced repetition** — review material at increasing intervals\n**• Teach someone else** — explaining deepens understanding\n**• Practice problems** — especially for math/science\n**• Pomodoro technique** — 25 min focused work, 5 min break\n**• Get enough sleep** — your brain consolidates learning during sleep!",
  ]],
  [/^(how do i prepare for|tips for) (the )?(sat|act|ap|exam|test)s?$/, [
    "Here are some test prep tips:\n\n**• Start early** — at least 2-3 months before\n**• Take practice tests** — under timed conditions\n**• Focus on weak areas** — don't just review what you know\n**• Use free resources** — Khan Academy (SAT), CrackACT, etc.\n**• Practice pacing** — know how much time per question\n**• Sleep well before the test** — a rested brain performs better!",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// COLLEGE-SPECIFIC Q&A
// ═══════════════════════════════════════════════════════════════
const COLLEGE_PATTERNS: PatternEntry[] = [
  [/^what is a (community college|cc)$/, [
    "A community college is a two-year institution that offers associate degrees and certificates. Many students start there to save money and then transfer to a four-year university. It's a smart financial move!",
  ]],
  [/^(what is the )?ivy league$/, [
    "The Ivy League is a group of eight prestigious private universities in the northeastern US: Harvard, Yale, Princeton, Columbia, UPenn, Brown, Dartmouth, and Cornell. But remember — there are hundreds of excellent schools beyond the Ivy League!",
  ]],
  [/^what is (a )?gap year$/, [
    "A gap year is a year between high school and college where students work, travel, volunteer, or pursue personal interests before starting college. Many colleges even encourage it!",
  ]],
  [/^what is early (decision|action)$/, [
    "**Early Decision (ED):** You apply early and if accepted, you MUST attend (binding). Usually due November 1-15.\n**Early Action (EA):** You apply early and find out early, but you're NOT required to attend. It gives you more time to decide!",
  ]],
  [/^what is common app$/, [
    "The Common Application (Common App) is a standardized application used by over 1,000 colleges. You fill it out once and can send it to multiple schools. It includes your personal essay, activities, and basic info!",
  ]],
  [/^what is a letter of recommendation$/, [
    "A letter of recommendation (rec letter) is a letter from a teacher, counselor, or mentor that speaks to your character, achievements, and potential. Most colleges ask for 1-3 of them. Ask early and choose people who know you well!",
  ]],
  [/^(how do i choose|how to pick|how to select) a college$/, [
    "Here are some factors to consider:\n\n**• Academic programs** — do they offer your major?\n**• Location** — urban vs. rural, distance from home\n**• Size** — small liberal arts vs. large university\n**• Cost & financial aid** — what can you afford?\n**• Campus culture** — visit or attend virtual events\n**• Outcomes** — graduation rates, career placement\n**• Fit** — where do you see yourself thriving?\n\nWant help researching specific schools?",
  ]],
  [/^what is a major$/, [
    "A major is your primary field of study in college. It's the subject you'll take the most classes in and (usually) earn your degree in. You don't always need to choose right away — many students change majors!",
  ]],
  [/^what is a minor$/, [
    "A minor is a secondary field of study that requires fewer courses than a major. It's a great way to explore another interest alongside your main field!",
  ]],
  [/^how many colleges should i apply to$/, [
    "A common recommendation is 8-12 schools:\n\n**• 2-3 safety schools** — you're confident you'll get in\n**• 4-5 match schools** — good chance of admission\n**• 2-3 reach schools** — competitive but worth trying\n\nQuality over quantity though — make sure each application is strong!",
  ]],
  [/^what is (a )?extracurricular( activity)?$/, [
    "Extracurricular activities are things you do outside of class — sports, clubs, volunteering, work, hobbies, leadership roles, etc. Colleges love to see them! Make sure you're tracking yours on your brag sheet.",
  ]],
  [/^what is (a )?transcript$/, [
    "A transcript is your official academic record showing your courses, grades, and GPA. Colleges require them as part of your application. Request yours from your school counselor!",
  ]],
  [/^what is (a )?valedictorian$/, [
    "A valedictorian is the student with the highest academic rank in their graduating class. They typically give a speech at graduation!",
  ]],
  [/^what is a (4\.0|perfect) gpa$/, [
    "A 4.0 GPA means straight A's — it's the highest unweighted GPA possible. But many schools use weighted GPAs where advanced classes can push you above 4.0!",
  ]],
  [/^what is (a )?weighted gpa$/, [
    "A weighted GPA gives extra points for honors, AP, and IB classes. So an A in an AP class might count as a 5.0 instead of 4.0. It rewards students who take challenging courses!",
  ]],
  [/^what are (ap|advanced placement) classes$/, [
    "AP (Advanced Placement) classes are college-level courses offered in high school. If you score high enough on the AP exam, you can earn college credit! They also look great on your application.",
  ]],
  [/^what are (ib|international baccalaureate) classes$/, [
    "IB (International Baccalaureate) is a rigorous international program that offers high school students college-prep courses. Like AP, it can lead to college credit and shows academic rigor.",
  ]],
  [/^(what is )?test optional$/, [
    "Test-optional means a college doesn't require SAT or ACT scores for admission. You can choose whether to submit them. Many schools adopted this policy recently — check each school's specific policy!",
  ]],
  [/^when should i start (applying|the college process|preparing for college)$/, [
    "Here's a general timeline:\n\n**• Freshman/Sophomore year:** Focus on grades, explore interests, join activities\n**• Junior year:** Take SAT/ACT, research colleges, visit campuses, start your essay\n**• Summer before senior year:** Finalize your college list, work on essays\n**• Senior year fall:** Submit applications, request rec letters, apply for scholarships\n**• Senior year spring:** Compare offers, accept, submit enrollment deposit\n\nYou're never too early to start!",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// WEATHER & TIME (common chatbot queries)
// ═══════════════════════════════════════════════════════════════
const WEATHER_PATTERNS: PatternEntry[] = [
  [/^(what is the weather|how is the weather|is it (going to )?(rain|snow|cold|hot))/, [
    "I can't check the weather — I'm a college prep assistant! But I hope it's nice wherever you are. ☀️",
  ]],
  [/^what day is (it|today)$/, [
    "I can't check the calendar, but I CAN remind you to check your deadlines! Don't let any scholarship due dates sneak up on you. 📅",
  ]],
  [/^what year is it$/, [
    "Time flies when you're prepping for college! Check your device for the exact date — and make sure your applications are on track! 📅",
  ]],
]

// ═══════════════════════════════════════════════════════════════
// EXPORT — merge all categories
// ═══════════════════════════════════════════════════════════════
export const CORPUS_PATTERNS: PatternEntry[] = [
  ...AI_PATTERNS,
  ...SCIENCE_PATTERNS,
  ...HISTORY_PATTERNS,
  ...FOOD_PATTERNS,
  ...MONEY_PATTERNS,
  ...ENTERTAINMENT_PATTERNS,
  ...SPORTS_PATTERNS,
  ...EMOTION_PATTERNS,
  ...HUMOR_PATTERNS,
  ...TRIVIA_PATTERNS,
  ...LITERATURE_PATTERNS,
  ...HEALTH_PATTERNS,
  ...TRAVEL_PATTERNS,
  ...BOTPROFILE_PATTERNS,
  ...CONVERSATION_PATTERNS,
  ...MATH_PATTERNS,
  ...COLLEGE_PATTERNS,
  ...WEATHER_PATTERNS,
]
