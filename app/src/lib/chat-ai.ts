import Anthropic from "@anthropic-ai/sdk"

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set — check your environment variables")
  }
  return new Anthropic({ apiKey: key })
}

const model = process.env.CHAT_AI_MODEL || "claude-haiku-4-5-20241022"

const SYSTEM_PROMPT = `You are a helpful scholarship and college preparation assistant for ScholarSuite. You help students and parents navigate the scholarship journey, understand deadlines, and prepare for college.

Rules:
- Only answer questions related to scholarships, college prep, academics, financial aid, and the student's data
- If asked about something outside your scope, politely redirect
- When you have context from the student's data, reference it specifically
- Be encouraging and supportive
- Keep answers concise (under 300 words unless detail is requested)
- Never fabricate scholarship names, amounts, or deadlines
- If you don't have data to answer a question, say so honestly
- Format responses with markdown for readability`

export async function generateChatResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  context: string
): Promise<{ reply: string; inputTokens: number; outputTokens: number }> {
  const systemPrompt = context
    ? `${SYSTEM_PROMPT}\n\nStudent context from database:\n${context}`
    : SYSTEM_PROMPT

  const client = getClient()
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  const reply = response.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text
      return ""
    })
    .join("")

  return {
    reply,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}

/**
 * Extract structured scholarship data from webpage text using Claude.
 */
export async function extractScholarshipFromUrl(
  pageText: string,
  sourceUrl: string
): Promise<{
  extracted: Record<string, unknown>
  inputTokens: number
  outputTokens: number
}> {
  const extractionPrompt = `You are a data extraction assistant. Extract scholarship information from the provided web page content. Return ONLY valid JSON with this exact structure (no markdown, no backticks, just the JSON object):

{
  "name": "Scholarship name",
  "provider": "Organization offering it",
  "amount": number or null,
  "amountMax": number or null,
  "deadline": "YYYY-MM-DD" or null,
  "description": "Brief 1-2 sentence description of the scholarship",
  "url": "${sourceUrl}",
  "minGpa": number or null,
  "states": [],
  "citizenships": [],
  "gradeLevels": [],
  "fieldsOfStudy": [],
  "ethnicities": [],
  "requiresFirstGen": false,
  "requiresPell": false,
  "requiresFinancialNeed": false,
  "minSat": null,
  "minAct": null
}

Rules:
- For "states": use full state names like ["California", "New York"]. Empty array [] if national/open to all.
- For "citizenships": use ["US Citizen", "Permanent Resident"] etc. Empty if not specified.
- For "gradeLevels": use grade numbers [9, 10, 11, 12] for high school, or [] if for college students.
- For "fieldsOfStudy": use general field names like ["Engineering", "Computer Science", "STEM"]. Empty if open to all.
- For "ethnicities": only include if the scholarship explicitly targets specific ethnic groups. Empty otherwise.
- For amounts: extract the dollar amount as a number (no $ sign). Use amountMax if there's a range.
- If a field is not mentioned on the page, use null for numbers/strings, [] for arrays, false for booleans.
- Be conservative — only fill in what's clearly stated on the page.`

  const client = getClient()
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: extractionPrompt,
    messages: [
      {
        role: "user",
        content: `Extract scholarship data from this webpage:\n\n${pageText.slice(0, 8000)}`,
      },
    ],
  })

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")

  // Parse JSON from response (handle potential markdown wrapping)
  let extracted: Record<string, unknown>
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    extracted = { name: "Could not extract — please enter manually", url: sourceUrl }
  }

  return {
    extracted,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
