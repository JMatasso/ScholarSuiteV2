import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

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
