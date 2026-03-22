"use client"

import { getLocalReply } from "@/lib/chatbot-engine"
import { useState, useCallback } from "react"

export interface ChatMessageUI {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { type: string; id: string; label: string }[]
  createdAt: string
}

interface ConversationSummary {
  id: string
  title: string | null
  updatedAt: string
  lastMessage: { content: string; role: string; createdAt: string } | null
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ConversationSummary[]>([])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMsg: ChatMessageUI = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        // Try local (RiveScript) reply first — no API call needed
        const localReply = await getLocalReply(content.trim())

        if (localReply) {
          const assistantMsg: ChatMessageUI = {
            id: `local-${Date.now()}`,
            role: "assistant",
            content: localReply,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, assistantMsg])
          return
        }

        // Fall through to AI backend
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: content.trim(),
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to send message")
        }

        const data = await res.json()

        // Update conversation ID if this is a new conversation
        if (!conversationId) {
          setConversationId(data.conversationId)
        }

        const assistantMsg: ChatMessageUI = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          sources: data.sources,
          createdAt: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, isLoading]
  )

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/history")
      if (!res.ok) return
      const data = await res.json()
      setHistory(data.conversations || [])
    } catch {
      // silently fail
    }
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/history/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setConversationId(data.id)
      setMessages(
        data.messages.map((m: { id: string; role: string; content: string; sources: unknown[]; createdAt: string }) => ({
          id: m.id,
          role: m.role.toLowerCase() as "user" | "assistant",
          content: m.content,
          sources: m.sources,
          createdAt: m.createdAt,
        }))
      )
    } catch {
      // silently fail
    }
  }, [])

  const startNewConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setError(null)
  }, [])

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/chat/history/${id}`, { method: "DELETE" })
        setHistory((prev) => prev.filter((c) => c.id !== id))
        if (conversationId === id) {
          startNewConversation()
        }
      } catch {
        // silently fail
      }
    },
    [conversationId, startNewConversation]
  )

  return {
    messages,
    conversationId,
    isLoading,
    error,
    history,
    sendMessage,
    loadHistory,
    loadConversation,
    startNewConversation,
    deleteConversation,
  }
}
