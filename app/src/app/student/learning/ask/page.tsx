"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Send, Sparkles, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_QUESTIONS = [
  "How do I find local scholarships?",
  "What documents do I need for applications?",
  "How should I write a financial need essay?",
  "What's the FAFSA and should I fill it out?",
  "How do I handle late scholarship disbursements?",
  "What are the golden rules for scholarships?",
]

function parseMessageContent(content: string) {
  const parts: Array<
    { type: "text"; value: string } | { type: "link"; text: string; href: string }
  > = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: "link", text: match[1], href: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) })
  }

  return parts
}

function MessageContent({ content }: { content: string }) {
  const parts = parseMessageContent(content)

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "link") {
          if (part.href.startsWith("/")) {
            return (
              <Link
                key={i}
                href={part.href}
                className="font-medium text-[#2563EB] underline underline-offset-2 hover:text-[#2563EB]/80"
              >
                {part.text}
              </Link>
            )
          }
          return (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#2563EB] underline underline-offset-2 hover:text-[#2563EB]/80"
            >
              {part.text}
            </a>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </>
  )
}

export default function ScholarshipAdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText.trim(),
    }

    const allMessages = [...messages, userMessage]
    setMessages(allMessages)
    setInput("")
    setIsStreaming(true)

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/learning/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")
      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "text") {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + data.text,
                  }
                }
                return updated
              })
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, I encountered an error. Please try again.",
          }
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
      {/* Header */}
      <div className="shrink-0">
        <div className="mb-4">
          <Link
            href="/student/learning"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-secondary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning
          </Link>
        </div>
        <PageHeader
          title="Scholarship Advisor"
          description="Ask me anything about scholarships, financial aid, or the application process."
        />
      </div>

      {/* Chat Container */}
      <Card variant="bento" className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <Sparkles className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-secondary-foreground">
                      ScholarShape Advisor
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      I can help with scholarships, financial aid, essays, and more.
                      Pick a question below or ask your own!
                    </p>
                  </div>

                  <div className="mt-4 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                    {STARTER_QUESTIONS.map((question) => (
                      <motion.button
                        key={question}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage(question)}
                        className="rounded-xl border border-border bg-card p-4 text-left text-sm text-foreground shadow-sm transition-colors hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5 hover:text-secondary-foreground"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-[#2563EB] text-white"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <>
                            <MessageContent content={msg.content} />
                            {msg.content === "" && isStreaming && (
                              <span className="inline-flex gap-1">
                                <span
                                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <span
                                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <span
                                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </span>
                            )}
                          </>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-border bg-card p-4">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-3xl items-center gap-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about scholarships..."
                disabled={isStreaming}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-[#2563EB] focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="h-11 w-11 rounded-xl"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
