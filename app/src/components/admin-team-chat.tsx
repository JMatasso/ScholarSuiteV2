"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getInitials, formatTime } from "@/lib/format"
import { toast } from "sonner"
import {
  Send,
  MessageCircle,
  Users,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "@/lib/icons"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: string
  name: string | null
  image: string | null
  role: string
}

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  read?: boolean
  isRead?: boolean
  sender: { id: string; name?: string | null; image?: string | null }
  receiver: { id: string; name?: string | null; image?: string | null }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminTeamChat() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Fetch session + contacts + messages
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/messages/contacts").then((r) => r.json()),
      fetch("/api/messages").then((r) => r.json()),
    ])
      .then(([session, contacts, msgs]) => {
        const userId = session?.user?.id
        if (userId) setCurrentUserId(userId)

        // Filter to only admin contacts
        const adminContacts = (Array.isArray(contacts) ? contacts : []).filter(
          (c: AdminUser) => c.role === "ADMIN" && c.id !== userId
        )
        setAdmins(adminContacts)
        if (adminContacts.length > 0 && !selectedAdminId) {
          setSelectedAdminId(adminContacts[0].id)
        }

        setMessages(Array.isArray(msgs) ? msgs : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load team chat")
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new messages every 10s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetch("/api/messages")
        .then((r) => r.json())
        .then((msgs) => {
          if (Array.isArray(msgs)) setMessages(msgs)
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(pollRef.current)
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedAdminId, messages])

  // Mark messages as read when selecting admin
  useEffect(() => {
    if (!selectedAdminId) return
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: selectedAdminId }),
    }).catch(() => {})
  }, [selectedAdminId])

  // Filter messages for current conversation
  const chatMessages = useMemo(() => {
    if (!currentUserId || !selectedAdminId) return []
    return messages
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === selectedAdminId) ||
          (m.senderId === selectedAdminId && m.receiverId === currentUserId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, currentUserId, selectedAdminId])

  // Unread counts per admin
  const unreadCounts = useMemo(() => {
    if (!currentUserId) return new Map<string, number>()
    const counts = new Map<string, number>()
    messages.forEach((m) => {
      if (m.receiverId === currentUserId && !(m.read ?? m.isRead ?? true)) {
        counts.set(m.senderId, (counts.get(m.senderId) || 0) + 1)
      }
    })
    return counts
  }, [messages, currentUserId])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedAdminId || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedAdminId, content: input.trim() }),
      })
      if (!res.ok) throw new Error()
      setInput("")
      // Refresh messages
      const msgs = await fetch("/api/messages").then((r) => r.json())
      if (Array.isArray(msgs)) setMessages(msgs)
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }, [input, selectedAdminId, sending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedAdmin = admins.find((a) => a.id === selectedAdminId)

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (admins.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A5F]/10">
            <MessageCircle className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <h3 className="text-sm font-semibold text-secondary-foreground">Team Chat</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          No other admins found. Add team members to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card transform-gpu [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transition-all duration-300 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_4px_8px_rgba(0,0,0,.07),0_16px_32px_rgba(0,0,0,.07)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-4 pb-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A5F]/10">
            <MessageCircle className="h-4 w-4 text-[#1E3A5F]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-secondary-foreground">Team Chat</h3>
            <p className="text-[10px] text-muted-foreground">{admins.length} team member{admins.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Total unread badge */}
          {Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0) > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-bold text-white">
              {Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0)}
            </span>
          )}
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="flex" style={{ height: "380px" }}>
          {/* Admin list sidebar */}
          <div className="w-[140px] shrink-0 border-r border-gray-100 overflow-y-auto">
            {admins.map((admin) => {
              const unread = unreadCounts.get(admin.id) || 0
              const isSelected = admin.id === selectedAdminId
              return (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => setSelectedAdminId(admin.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-[#2563EB]/8 border-r-2 border-r-[#2563EB]"
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={admin.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-[#1E3A5F]/10 text-[#1E3A5F]">
                        {getInitials(admin.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online dot placeholder */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "truncate text-xs",
                      isSelected ? "font-semibold text-[#2563EB]" : "font-medium text-foreground"
                    )}>
                      {admin.name?.split(" ")[0] || "Admin"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Chat area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Chat header */}
            {selectedAdmin && (
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedAdmin.image || undefined} />
                  <AvatarFallback className="text-[9px] bg-[#1E3A5F]/10 text-[#1E3A5F]">
                    {getInitials(selectedAdmin.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {selectedAdmin.name || "Admin"}
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No messages yet. Start a conversation!
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === currentUserId
                  const isRead = msg.read ?? msg.isRead ?? false
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}
                    >
                      {!isMine && (
                        <Avatar className="h-5 w-5 mt-1 shrink-0">
                          <AvatarImage src={msg.sender.image || undefined} />
                          <AvatarFallback className="text-[8px] bg-[#1E3A5F]/10 text-[#1E3A5F]">
                            {getInitials(msg.sender.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-xl px-3 py-1.5",
                          isMine
                            ? "bg-[#2563EB] text-white rounded-br-sm"
                            : "bg-muted/60 text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 mt-0.5",
                          isMine ? "text-white/60" : "text-muted-foreground"
                        )}>
                          <span className="text-[9px]">{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            isRead
                              ? <CheckCheck className="h-2.5 w-2.5" />
                              : <Check className="h-2.5 w-2.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-2">
              <div className="flex items-center gap-1.5">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={sending || !selectedAdminId}
                  className="h-8 text-xs border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-[#2563EB]/30"
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || !selectedAdminId}
                  className="h-8 w-8 p-0 bg-[#2563EB] hover:bg-[#2563EB]/90 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
