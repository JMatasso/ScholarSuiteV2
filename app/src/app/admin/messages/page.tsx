"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Megaphone, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  receiverId: string
  sender: { id: string; name?: string | null; image?: string | null }
  receiver: { id: string; name?: string | null; image?: string | null }
}

interface Conversation {
  userId: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: boolean
  role: string
}

export default function MessagesPage() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [search, setSearch] = React.useState("")
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
  const [newMessage, setNewMessage] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [showBroadcast, setShowBroadcast] = React.useState(false)
  const [broadcastContent, setBroadcastContent] = React.useState("")
  const [broadcastTarget, setBroadcastTarget] = React.useState("")
  const [showNewMessage, setShowNewMessage] = React.useState(false)
  const [newMsgReceiverId, setNewMsgReceiverId] = React.useState("")
  const [newMsgContent, setNewMsgContent] = React.useState("")

  const loadMessages = React.useCallback(() => {
    fetch("/api/messages")
      .then(res => res.json())
      .then(d => {
        const msgs = Array.isArray(d) ? d : []
        setMessages(msgs)
        if (msgs.length > 0 && !currentUserId) {
          const myId = msgs[0].senderId
          setCurrentUserId(myId)
        }
        setLoading(false)
      })
      .catch(() => { toast.error("Failed to load messages"); setLoading(false) })
  }, [currentUserId])

  React.useEffect(() => { loadMessages() }, [loadMessages])

  // Build conversation list from messages
  const conversations: Conversation[] = React.useMemo(() => {
    const map = new Map<string, Conversation>()
    messages.forEach(msg => {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
      const other = msg.senderId === currentUserId ? msg.receiver : msg.sender
      const name = other.name || other.id
      const initials = name.substring(0, 2).toUpperCase()
      const existing = map.get(otherId)
      if (!existing || new Date(msg.createdAt) > new Date(existing.time)) {
        map.set(otherId, {
          userId: otherId,
          name,
          initials,
          lastMessage: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread: !msg.senderId !== !currentUserId,
          role: "User",
        })
      }
    })
    return Array.from(map.values())
  }, [messages, currentUserId])

  const chatMessages = React.useMemo(() => {
    if (!selectedUserId) return []
    return messages.filter(
      msg =>
        (msg.senderId === currentUserId && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === currentUserId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, selectedUserId, currentUserId])

  const selected = conversations.find(c => c.userId === selectedUserId) || (conversations.length > 0 ? conversations[0] : null)
  const activeUserId = selectedUserId || (conversations[0]?.userId ?? null)

  const handleSend = async () => {
    if (!newMessage.trim() || !activeUserId) return
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeUserId, content: newMessage }),
      })
      if (!res.ok) throw new Error()
      setNewMessage("")
      loadMessages()
    } catch {
      toast.error("Failed to send message")
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastContent.trim()) return
    try {
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: broadcastContent, targetRole: broadcastTarget || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Broadcast sent")
      setBroadcastContent("")
      setShowBroadcast(false)
      loadMessages()
    } catch {
      toast.error("Failed to send broadcast")
    }
  }

  const handleNewMessage = async () => {
    if (!newMsgContent.trim() || !newMsgReceiverId.trim()) return
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: newMsgReceiverId, content: newMsgContent }),
      })
      if (!res.ok) throw new Error()
      toast.success("Message sent")
      setNewMsgContent("")
      setNewMsgReceiverId("")
      setShowNewMessage(false)
      setSelectedUserId(newMsgReceiverId)
      loadMessages()
    } catch {
      toast.error("Failed to send message")
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Messages"
        description="Communicate with students and parents."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowBroadcast(true)}>
              <Megaphone className="size-3.5" /> Broadcast
            </Button>
            <Button size="sm" onClick={() => setShowNewMessage(true)}>
              <Plus className="size-3.5" /> New Message
            </Button>
          </>
        }
      />

      {showBroadcast && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Send Broadcast</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Audience</label>
              <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">All Users</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Message *</label>
              <textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} rows={3}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBroadcast}>Send Broadcast</Button>
            <Button variant="outline" size="sm" onClick={() => setShowBroadcast(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {showNewMessage && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">New Message</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Recipient ID *</label>
              <input type="text" value={newMsgReceiverId} onChange={e => setNewMsgReceiverId(e.target.value)}
                placeholder="Enter user ID"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Message *</label>
              <textarea value={newMsgContent} onChange={e => setNewMsgContent(e.target.value)} rows={3}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewMessage}>Send Message</Button>
            <Button variant="outline" size="sm" onClick={() => setShowNewMessage(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-14rem)] rounded-xl bg-white ring-1 ring-foreground/10 overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search conversations..."
              className="w-full"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : filteredConversations.map((convo) => (
              <button
                key={convo.userId}
                onClick={() => setSelectedUserId(convo.userId)}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                  activeUserId === convo.userId && "bg-[#1E3A5F]/5"
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback>{convo.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", convo.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {convo.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{convo.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{convo.role}</span>
                    <p className={cn("text-xs truncate", convo.unread ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {convo.lastMessage}
                    </p>
                  </div>
                </div>
                {convo.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#2563EB]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Avatar size="sm">
              <AvatarFallback>{selected?.initials ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{selected?.name ?? "Select a conversation"}</p>
              <p className="text-xs text-muted-foreground">{selected?.role ?? ""}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {chatMessages.map((msg) => {
                const isOwn = msg.senderId === currentUserId
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[70%]", isOwn ? "self-end items-end" : "self-start items-start")}>
                    <div className={cn(
                      "rounded-xl px-4 py-2.5 text-sm",
                      isOwn ? "bg-[#1E3A5F] text-white" : "bg-muted text-foreground"
                    )}>
                      {msg.content}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => toast.info("File attachments coming soon")}><Paperclip className="size-4" /></Button>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type a message..."
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button size="icon" onClick={handleSend}><Send className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
