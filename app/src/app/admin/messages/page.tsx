"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Megaphone, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  receiverId: string
  sender: { id: string; name?: string | null; image?: string | null; role?: string }
  receiver: { id: string; name?: string | null; image?: string | null; role?: string }
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

interface UserOption {
  id: string
  name: string
  email: string
  role: string
  image?: string | null
}

interface CohortOption {
  id: string
  name: string
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

  // User picker state
  const [allUsers, setAllUsers] = React.useState<UserOption[]>([])
  const [recipientSearch, setRecipientSearch] = React.useState("")
  const [recipientDropdownOpen, setRecipientDropdownOpen] = React.useState(false)
  const [selectedRecipientName, setSelectedRecipientName] = React.useState("")
  const recipientRef = React.useRef<HTMLDivElement>(null)

  // Filter state
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL")
  const [readFilter, setReadFilter] = React.useState<string>("ALL")

  // Cohort state for broadcast
  const [cohorts, setCohorts] = React.useState<CohortOption[]>([])
  const [broadcastCohortId, setBroadcastCohortId] = React.useState("")

  // Fetch all users for recipient picker
  React.useEffect(() => {
    fetch("/api/admin/users/all")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllUsers(d) })
      .catch(() => {})
  }, [])

  // Fetch cohorts for broadcast
  React.useEffect(() => {
    fetch("/api/cohorts")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCohorts(d.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))) })
      .catch(() => {})
  }, [])

  // Close recipient dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setRecipientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  // Build a lookup of user roles from allUsers
  const userRoleMap = React.useMemo(() => {
    const map = new Map<string, string>()
    allUsers.forEach(u => map.set(u.id, u.role))
    return map
  }, [allUsers])

  // Build conversation list from messages
  const conversations: Conversation[] = React.useMemo(() => {
    const map = new Map<string, Conversation>()
    messages.forEach(msg => {
      const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
      const other = msg.senderId === currentUserId ? msg.receiver : msg.sender
      const name = other.name || other.id
      const initials = name.substring(0, 2).toUpperCase()
      const existing = map.get(otherId)
      // Determine role from message data or user lookup
      const role = other.role || userRoleMap.get(otherId) || "User"
      if (!existing || new Date(msg.createdAt) > new Date(existing.time)) {
        map.set(otherId, {
          userId: otherId,
          name,
          initials,
          lastMessage: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread: msg.senderId !== currentUserId && !!(msg as Message & { read?: boolean }).read === false,
          role,
        })
      }
    })
    return Array.from(map.values())
  }, [messages, currentUserId, userRoleMap])

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
      const payload: Record<string, string | null> = {
        content: broadcastContent,
        targetRole: broadcastTarget || null,
      }
      if (broadcastTarget === "COHORT" && broadcastCohortId) {
        payload.targetRole = null
        payload.cohortId = broadcastCohortId
      }
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success("Broadcast sent")
      setBroadcastContent("")
      setBroadcastTarget("")
      setBroadcastCohortId("")
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
      setRecipientSearch("")
      setSelectedRecipientName("")
      setShowNewMessage(false)
      setSelectedUserId(newMsgReceiverId)
      loadMessages()
    } catch {
      toast.error("Failed to send message")
    }
  }

  // Filtered recipient list for picker
  const filteredUsers = React.useMemo(() => {
    if (!recipientSearch.trim()) return allUsers.slice(0, 20)
    const q = recipientSearch.toLowerCase()
    return allUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [allUsers, recipientSearch])

  // Apply filters to conversations
  const filteredConversations = React.useMemo(() => {
    return conversations.filter(c => {
      // Text search
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      // Role filter
      if (roleFilter !== "ALL" && c.role.toUpperCase() !== roleFilter) return false
      // Read/unread filter
      if (readFilter === "UNREAD" && !c.unread) return false
      if (readFilter === "READ" && c.unread) return false
      return true
    })
  }, [conversations, search, roleFilter, readFilter])

  const roleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "STUDENT": return "default"
      case "PARENT": return "secondary"
      case "ADMIN": return "outline"
      default: return "secondary"
    }
  }

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
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Send Broadcast</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Audience</label>
              <select value={broadcastTarget} onChange={e => { setBroadcastTarget(e.target.value); setBroadcastCohortId("") }}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">All Users</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
                <option value="AT_RISK">At-Risk Students</option>
                <option value="COHORT">Specific Cohort</option>
              </select>
            </div>
            {broadcastTarget === "COHORT" && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Select Cohort</label>
                <select value={broadcastCohortId} onChange={e => setBroadcastCohortId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="">Choose a cohort...</option>
                  {cohorts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Message *</label>
              <textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} rows={3}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBroadcast}>Send Broadcast</Button>
            <Button variant="outline" size="sm" onClick={() => setShowBroadcast(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {showNewMessage && (
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="mb-4 text-sm font-semibold text-foreground">New Message</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div ref={recipientRef} className="relative">
              <label className="block text-xs font-medium text-foreground mb-1">Recipient *</label>
              <input
                type="text"
                value={selectedRecipientName || recipientSearch}
                onChange={e => {
                  setRecipientSearch(e.target.value)
                  setSelectedRecipientName("")
                  setNewMsgReceiverId("")
                  setRecipientDropdownOpen(true)
                }}
                onFocus={() => setRecipientDropdownOpen(true)}
                placeholder="Search by name or email..."
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {recipientDropdownOpen && !selectedRecipientName && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  {filteredUsers.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">No users found</p>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setNewMsgReceiverId(user.id)
                          setSelectedRecipientName(user.name || user.email)
                          setRecipientSearch("")
                          setRecipientDropdownOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <Avatar size="sm">
                          <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Badge variant={roleBadgeVariant(user.role)} className="text-[10px] shrink-0">
                          {user.role}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Message *</label>
              <textarea value={newMsgContent} onChange={e => setNewMsgContent(e.target.value)} rows={3}
                className="w-full rounded-lg border border-input bg-transparent p-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewMessage}>Send Message</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowNewMessage(false); setRecipientSearch(""); setSelectedRecipientName(""); setNewMsgReceiverId("") }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-14rem)] rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
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

          {/* Filters */}
          <div className="px-3 py-2 border-b border-border flex flex-col gap-2">
            {/* Role filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {(["ALL", "STUDENT", "PARENT", "ADMIN"] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors",
                    roleFilter === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {role === "ALL" ? "All" : role === "STUDENT" ? "Students" : role === "PARENT" ? "Parents" : "Admins"}
                </button>
              ))}
            </div>
            {/* Read/Unread filter */}
            <div className="flex items-center gap-1">
              {(["ALL", "UNREAD", "READ"] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setReadFilter(filter)}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors",
                    readFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {filter === "ALL" ? "All" : filter === "UNREAD" ? "Unread" : "Read"}
                </button>
              ))}
            </div>
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
                    <Badge variant={roleBadgeVariant(convo.role)} className="text-[10px] h-4 px-1.5">
                      {convo.role}
                    </Badge>
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
              {selected?.role && (
                <Badge variant={roleBadgeVariant(selected.role)} className="text-[10px] mt-0.5">
                  {selected.role}
                </Badge>
              )}
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
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button size="icon" onClick={handleSend}><Send className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
