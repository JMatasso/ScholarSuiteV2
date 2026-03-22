"use client"

import { useState, useEffect, FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChatInput } from "@/components/ui/chat-input"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { useChat } from "@/hooks/use-chat"
import {
  Bot,
  ArrowUp,
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
  PanelLeftClose,
  PanelLeft,
  Paperclip,
} from "@/lib/icons"

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
    <div className="flex h-[calc(100vh-7rem)] -mt-2 gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#191919] shadow-sm dark:shadow-2xl">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-[#202020] overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-neutral-200">Conversations</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startNewConversation()}
                  title="New conversation"
                  className="text-gray-500 hover:text-[#1E3A5F] hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidebarOpen(false)}
                  title="Close sidebar"
                  className="text-gray-500 hover:text-[#1E3A5F] hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <History className="h-8 w-8 text-gray-300 dark:text-neutral-600 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-neutral-500">
                    No conversations yet. Start chatting to see your history here.
                  </p>
                </div>
              ) : (
                history.map((convo) => (
                  <div
                    key={convo.id}
                    className="group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800/60"
                    onClick={() => selectConversation(convo.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-[#1A1A1A] dark:text-neutral-200">
                        {convo.title || "Untitled"}
                      </p>
                      {convo.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-neutral-500 truncate mt-0.5">
                          {convo.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-rose-400 dark:hover:bg-neutral-700 transition-opacity"
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
      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md z-10">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => { setSidebarOpen(true); loadHistory() }}
              title="Open sidebar"
              className="text-gray-500 hover:text-[#1E3A5F] hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-lg shadow-blue-600/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#1E3A5F] dark:text-neutral-100">ScholarSuite AI</h1>
              <p className="text-[11px] text-gray-500 dark:text-neutral-500">Your personal college prep assistant</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-gray-200 bg-white text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 dark:hover:border-neutral-600"
              onClick={() => startNewConversation()}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 relative">
              {/* Glow effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-t from-blue-500/8 dark:from-blue-600/15 via-blue-400/3 dark:via-blue-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-t from-indigo-400/6 dark:from-indigo-500/10 via-transparent to-transparent rounded-full blur-2xl" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl relative z-10 w-full"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB]/10 dark:bg-blue-600/10 border border-[#2563EB]/20 dark:border-blue-500/20 text-[#2563EB] dark:text-blue-400 mx-auto mb-6 shadow-lg shadow-blue-500/10">
                  <Bot className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-semibold text-[#1E3A5F] dark:text-white drop-shadow-sm">
                  ScholarSuite AI
                </h2>
                <p className="mt-3 text-gray-500 dark:text-neutral-400 text-sm max-w-md mx-auto">
                  Ask me about scholarships, deadlines, essays, colleges, or anything about your college prep journey.
                </p>

                {/* Glassmorphic Input */}
                <div className="mt-10 w-full max-w-2xl mx-auto">
                  <form onSubmit={handleSubmit}>
                    <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-xl border border-gray-200 dark:border-neutral-700 focus-within:border-[#2563EB]/40 dark:focus-within:border-blue-500/50 transition-colors shadow-xl shadow-gray-200/50 dark:shadow-black/20">
                      <ChatInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your request..."
                        className="min-h-[52px] resize-none rounded-xl bg-transparent border-0 px-4 py-3.5 shadow-none focus-visible:ring-0 text-sm text-[#1A1A1A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                        disabled={isLoading}
                      />
                      <div className="flex items-center justify-between p-3 pt-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all",
                            input.trim() && !isLoading
                              ? "bg-[#2563EB] hover:bg-[#2563EB]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                              : "bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-neutral-500 cursor-not-allowed"
                          )}
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Quick Action Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
                  {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon
                    return (
                      <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                      >
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 rounded-full border-gray-200 bg-white/70 text-gray-500 hover:text-[#1E3A5F] hover:bg-gray-50 hover:border-gray-300 dark:border-neutral-700 dark:bg-black/50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-700/80 dark:hover:border-neutral-600 transition-all text-xs px-4 py-2 h-auto backdrop-blur-sm"
                          onClick={() => handleQuickAction(action.prompt)}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{action.label}</span>
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          ) : (
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
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {message.sources.map((source, i) => {
                          const route = SOURCE_ROUTES[source.type]
                          return route ? (
                            <a
                              key={i}
                              href={route}
                              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:border dark:border-blue-500/20 transition-colors"
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
                  <ChatBubbleAvatar className="h-8 w-8 shrink-0" fallback="AI" />
                  <ChatBubbleMessage isLoading />
                </ChatBubble>
              )}

              {error && (
                <div className="text-center py-2">
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}
            </ChatMessageList>
          )}
        </div>

        {/* Input Bar (active chat) */}
        {hasMessages && (
          <div className="border-t border-gray-200 dark:border-neutral-800 p-4 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md">
            <form onSubmit={handleSubmit}>
              <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-md rounded-xl border border-gray-200 dark:border-neutral-700 focus-within:border-[#2563EB]/40 dark:focus-within:border-blue-500/50 transition-colors max-w-3xl mx-auto shadow-lg shadow-gray-200/50 dark:shadow-black/20">
                <ChatInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[48px] resize-none rounded-xl bg-transparent border-0 px-4 py-3 shadow-none focus-visible:ring-0 text-sm text-[#1A1A1A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between p-2 pt-0">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="hidden sm:flex items-center gap-1 ml-1">
                      {QUICK_ACTIONS.slice(0, 3).map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => handleQuickAction(action.prompt)}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50 transition-colors"
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
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all",
                      input.trim() && !isLoading
                        ? "bg-[#2563EB] hover:bg-[#2563EB]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                        : "bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-neutral-500 cursor-not-allowed"
                    )}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Send</span>
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
