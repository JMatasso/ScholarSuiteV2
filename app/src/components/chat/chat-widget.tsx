"use client"

import { useState, FormEvent, useEffect } from "react"
import { Send, Bot, MessageSquarePlus, History, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { useChat } from "@/hooks/use-chat"

const SOURCE_ROUTES: Record<string, string> = {
  scholarship: "/student/scholarships",
  application: "/student/applications",
  task: "/student/tasks",
  essay: "/student/essays",
  meeting: "/student/meetings",
  activity: "/student/activities",
  financial: "/student/financial",
  document: "/student/documents",
  profile: "/student/profile",
}

export function ChatWidget({ role = "STUDENT" }: { role?: "STUDENT" | "PARENT" }) {
  const {
    messages,
    isLoading,
    error,
    history,
    sendMessage,
    loadHistory,
    loadConversation,
    startNewConversation,
    deleteConversation,
  } = useChat()

  const [input, setInput] = useState("")
  const [showHistory, setShowHistory] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const openHistory = () => {
    loadHistory()
    setShowHistory(true)
  }

  const selectConversation = (id: string) => {
    loadConversation(id)
    setShowHistory(false)
  }

  const baseRoute = role === "PARENT" ? "/parent" : "/student"

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-[#1E3A5F] text-white rounded-t-lg">
        <div className="flex items-center justify-between w-full">
          {showHistory ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowHistory(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={openHistory}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          <div className="text-center flex-1">
            <h1 className="text-base font-semibold">
              {showHistory ? "Chat History" : "ScholarSuite AI"}
            </h1>
            {!showHistory && (
              <p className="text-xs text-white/70">
                Ask about scholarships, deadlines, and more
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => { startNewConversation(); setShowHistory(false) }}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        {showHistory ? (
          <div className="p-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No previous conversations
              </p>
            ) : (
              history.map((convo) => (
                <div
                  key={convo.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => selectConversation(convo.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {convo.title || "Untitled"}
                    </p>
                    {convo.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {convo.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(convo.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <ChatMessageList>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-3">
                  <Bot className="h-6 w-6 text-secondary-foreground" />
                </div>
                <p className="text-sm font-medium text-secondary-foreground">
                  Hi! I'm your ScholarSuite assistant.
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                  Ask me about scholarships, deadlines, tasks, essays, or anything about your college prep journey.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.role === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  fallback={message.role === "user" ? "You" : "AI"}
                />
                <div className="flex flex-col gap-1">
                  <ChatBubbleMessage
                    variant={message.role === "user" ? "sent" : "received"}
                  >
                    {message.content}
                  </ChatBubbleMessage>
                  {/* Source links */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {message.sources.map((source, i) => {
                        const route = SOURCE_ROUTES[source.type]
                        const href = route
                          ? route.replace("/student", baseRoute)
                          : undefined
                        return href ? (
                          <a
                            key={i}
                            href={href}
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-accent text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            {source.label}
                          </a>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  fallback="AI"
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}

            {error && (
              <div className="text-center py-2">
                <p className="text-xs text-rose-600">{error}</p>
              </div>
            )}
          </ChatMessageList>
        )}
      </ExpandableChatBody>

      {!showHistory && (
        <ExpandableChatFooter>
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-[#2563EB] p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about scholarships, deadlines..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            <div className="flex items-center p-3 pt-0 justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="gap-1.5"
              >
                Send
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      )}
    </ExpandableChat>
  )
}
