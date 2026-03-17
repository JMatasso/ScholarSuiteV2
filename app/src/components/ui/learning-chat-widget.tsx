"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageCircle, Send, X, Sparkles, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

function parseMessageContent(content: string) {
  // Parse markdown links like [text](/path) into clickable links
  const parts: Array<{ type: "text"; value: string } | { type: "link"; text: string; href: string }> = []
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

interface LearningChatWidgetProps {
  className?: string
}

export function LearningChatWidget({ className }: LearningChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

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
                  updated[updated.length - 1] = { ...last, content: last.content + data.text }
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
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-3 flex w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
            style={{ maxHeight: "500px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#1E3A5F] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Scholarship Advisor</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "360px" }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F]/10">
                    <Sparkles className="h-5 w-5 text-[#1E3A5F]" />
                  </div>
                  <p className="text-sm font-medium text-[#1E3A5F]">ScholarShape Advisor</p>
                  <p className="text-xs text-muted-foreground">
                    Ask me anything about scholarships, financial aid, or the application process!
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <MessageContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                    {msg.role === "assistant" && msg.content === "" && isStreaming && (
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                      <User className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about scholarships!"
                disabled={isStreaming}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-[#1E3A5F] text-white shadow-lg transition-colors hover:bg-[#162d4a]",
          !isOpen && "animate-pulse"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  )
}
