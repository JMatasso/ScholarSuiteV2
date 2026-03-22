"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChatInput } from "@/components/ui/chat-input"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { useChat, ChatMessageUI } from "@/hooks/use-chat"
import {
  Bot,
  Send,
  Search,
  PenTool,
  CalendarClock,
  GraduationCap,
  ListChecks,
  DollarSign,
  FileText,
  Sparkles,
  MessageSquarePlus,
  History,
  Trash2,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"

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

const QUICK_ACTIONS = [
  { icon: Search, label: "Find Scholarships", prompt: "Help me find scholarships that match my profile" },
  { icon: PenTool, label: "Draft Essay", prompt: "Help me brainstorm and draft a scholarship essay" },
  { icon: CalendarClock, label: "My Deadlines", prompt: "What are my upcoming deadlines this week?" },
  { icon: GraduationCap, label: "College Match", prompt: "Recommend colleges that fit my academic profile" },
  { icon: ListChecks, label: "Review Activities", prompt: "Review my extracurricular activities and suggest improvements" },
  { icon: DollarSign, label: "Financial Summary", prompt: "Give me a summary of my scholarship awards and financial plan" },
  { icon: FileText, label: "Resume Help", prompt: "Help me build or improve my resume" },
  { icon: Sparkles, label: "Scholarship Match", prompt: "Run my scholarship matching and explain my top matches" },
]

export default function AssistantPage() {
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Load history on mount
  useEffect(() => {
    if (!historyLoaded) {
      loadHistory()
      setHistoryLoaded(true)
    }
  }, [historyLoaded, loadHistory])

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

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const selectConversation = (id: string) => {
    loadConversation(id)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-[calc(100vh-7rem)] -mt-2 gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Sidebar - Conversation History */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border-r border-border bg-muted/30 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-secondary-foreground">Conversations</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => { startNewConversation(); }}
                  title="New conversation"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidebarOpen(false)}
                  title="Close sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No conversations yet. Start chatting to see your history here.
                  </p>
                </div>
              ) : (
                history.map((convo) => (
                  <div
                    key={convo.id}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/80"
                    onClick={() => selectConversation(convo.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
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
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-rose-600 transition-opacity"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => { setSidebarOpen(true); loadHistory(); }}
              title="Open sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-secondary-foreground">ScholarSuite AI</h1>
              <p className="text-[11px] text-muted-foreground">Your personal college prep assistant</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => { startNewConversation(); }}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {!hasMessages ? (
            /* Welcome / Empty State */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center max-w-xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-secondary-foreground mx-auto mb-5">
                  <Bot className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-secondary-foreground">
                  ScholarSuite AI
                </h2>
                <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
                  Ask me about scholarships, deadlines, essays, colleges, or anything about your college prep journey. I have access to your profile and can give personalized advice.
                </p>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon
                    return (
                      <motion.div
                        key={action.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full border-border text-muted-foreground hover:text-secondary-foreground hover:border-primary hover:bg-accent"
                          onClick={() => handleQuickAction(action.prompt)}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Input in welcome state */}
                <div className="mt-8 w-full max-w-lg mx-auto">
                  <form onSubmit={handleSubmit}>
                    <div className="relative rounded-xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]/40 transition-all">
                      <ChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about your college prep journey..."
                        className="min-h-[52px] resize-none rounded-xl bg-transparent border-0 px-4 py-3.5 shadow-none focus-visible:ring-0 text-sm"
                        disabled={isLoading}
                      />
                      <div className="flex items-center justify-end p-2 pt-0">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!input.trim() || isLoading}
                          className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 rounded-lg"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Active Chat */
            <ChatMessageList smooth>
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  variant={message.role === "user" ? "sent" : "received"}
                >
                  <ChatBubbleAvatar
                    className="h-8 w-8 shrink-0"
                    fallback={message.role === "user" ? "You" : "AI"}
                  />
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <ChatBubbleMessage
                      variant={message.role === "user" ? "sent" : "received"}
                    >
                      <FormattedMessage content={message.content} />
                    </ChatBubbleMessage>
                    {/* Source links */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {message.sources.map((source, i) => {
                          const route = SOURCE_ROUTES[source.type]
                          return route ? (
                            <a
                              key={i}
                              href={route}
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
        </div>

        {/* Input Bar (when in active chat) */}
        {hasMessages && (
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit}>
              <div className="relative rounded-xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]/40 transition-all max-w-3xl mx-auto">
                <ChatInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[48px] resize-none rounded-xl bg-transparent border-0 px-4 py-3 shadow-none focus-visible:ring-0 text-sm"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between p-2 pt-0">
                  <div className="flex items-center gap-1">
                    {/* Quick action chips in active chat */}
                    <div className="hidden sm:flex items-center gap-1 ml-1">
                      {QUICK_ACTIONS.slice(0, 3).map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => handleQuickAction(action.prompt)}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-muted-foreground hover:text-secondary-foreground hover:bg-muted transition-colors"
                          >
                            <Icon className="h-3 w-3" />
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90 rounded-lg"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

/* Simple markdown-ish formatter for AI responses */
function FormattedMessage({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\n)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
