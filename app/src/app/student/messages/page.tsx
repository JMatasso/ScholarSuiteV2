"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Search, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MessageUser {
  id: string
  name: string | null
  image: string | null
}

interface ApiMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  sender: MessageUser
  receiver: MessageUser
}

interface Conversation {
  partnerId: string
  partnerName: string
  partnerInitials: string
  lastMessage: string
  lastTime: string
  messages: ApiMessage[]
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = () => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data: ApiMessage[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data)
          // Determine current user id from messages
          const firstMsg = data[0]
          // The current user is one of sender/receiver - figure out which by checking who the session user is
          // We'll use a simple heuristic: collect all unique user ids and pick the one that appears as sender most
          const senderCounts: Record<string, number> = {}
          data.forEach((m) => {
            senderCounts[m.senderId] = (senderCounts[m.senderId] || 0) + 1
          })
          // We need to figure out current user from session - use /api/auth/session or check who appears in both roles
          // For now, we'll fetch the session
        } else {
          setMessages([])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    // Get current session user
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id)
        }
      })
      .catch(() => {})

    fetchMessages()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedPartnerId, messages])

  // Build conversations from flat messages list
  const buildConversations = (): Conversation[] => {
    if (!currentUserId) return []
    const convMap: Record<string, Conversation> = {}

    messages.forEach((msg) => {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
      const partner = msg.senderId === currentUserId ? msg.receiver : msg.sender
      const partnerName = partner.name || "Unknown"

      if (!convMap[partnerId]) {
        convMap[partnerId] = {
          partnerId,
          partnerName,
          partnerInitials: getInitials(partnerName),
          lastMessage: msg.content,
          lastTime: formatTime(msg.createdAt),
          messages: [],
        }
      }
      convMap[partnerId].messages.push(msg)
      convMap[partnerId].lastMessage = msg.content
      convMap[partnerId].lastTime = formatTime(msg.createdAt)
    })

    return Object.values(convMap)
  }

  const conversations = buildConversations()

  const selectedConv = conversations.find((c) => c.partnerId === selectedPartnerId)
    ?? (conversations.length > 0 ? conversations[0] : null)

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConv || sending) return
    setSending(true)

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: selectedConv.partnerId,
        content: messageInput.trim(),
      }),
    })

    if (res.ok) {
      setMessageInput("")
      fetchMessages()
    } else {
      toast.error("Failed to send message")
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1E3A5F]">Messages</h1>
          <p className="mt-1 text-muted-foreground">Communicate with your counselors, tutors, and consultants.</p>
        </div>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Messages</h1>
        <p className="mt-1 text-muted-foreground">Communicate with your counselors, tutors, and consultants.</p>
      </div>

      <div className="grid h-[calc(100vh-260px)] min-h-[500px] gap-0 overflow-hidden rounded-xl border bg-white lg:grid-cols-[340px_1fr]">
        {/* Left panel - Conversation list */}
        <div className="flex flex-col border-r">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground px-4 text-center">
                No conversations yet. Messages will appear here when your counselors reach out.
              </div>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setSelectedPartnerId(conv.partnerId)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selectedConv?.partnerId === conv.partnerId && "bg-blue-50/50"
                )}
              >
                <Avatar size="default">
                  <AvatarFallback>{conv.partnerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{conv.partnerName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel - Message thread */}
        {selectedConv ? (
          <div className="flex flex-col">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Avatar size="default">
                <AvatarFallback>{selectedConv.partnerInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{selectedConv.partnerName}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConv.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe ? "bg-[#2563EB] text-white" : "bg-muted"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        "mt-1 text-[10px]",
                        isMe ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={() => toast.info("File attachments coming soon")}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && messageInput.trim()) {
                      handleSend()
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                  disabled={!messageInput.trim() || sending}
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No conversations yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
