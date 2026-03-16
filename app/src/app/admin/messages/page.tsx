"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Megaphone, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { useMessaging } from "@/hooks/use-messaging"

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
  // Shared messaging hook
  const {
    loading,
    currentUserId,
    messageInput,
    sending,
    messagesEndRef,
    conversations,
    chatMessages,
    activePartnerId,
    activeConversation,
    setSelectedPartnerId,
    setMessageInput,
    sendMessage,
    handleKeyDown,
    fetchMessages,
    formatTime,
  } = useMessaging()

  // Admin-only local state
  const [search, setSearch] = React.useState("")
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
      fetchMessages()
    } catch {
      toast.error("Failed to send broadcast")
    }
  }

  const handleNewMessage = async () => {
    if (!newMsgContent.trim() || !newMsgReceiverId.trim()) return
    const ok = await sendMessage(newMsgReceiverId, newMsgContent)
    if (ok) {
      toast.success("Message sent")
      setNewMsgContent("")
      setNewMsgReceiverId("")
      setRecipientSearch("")
      setSelectedRecipientName("")
      setShowNewMessage(false)
      setSelectedPartnerId(newMsgReceiverId)
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

  // Apply filters to conversations from the hook
  const filteredConversations = React.useMemo(() => {
    return conversations.filter(c => {
      if (search && !c.partnerName.toLowerCase().includes(search.toLowerCase())) return false
      if (roleFilter !== "ALL" && c.partnerRole.toUpperCase() !== roleFilter) return false
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
              <Textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} rows={3}
                className="resize-none" />
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
              <Input
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
                className="h-9"
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
              <Textarea value={newMsgContent} onChange={e => setNewMsgContent(e.target.value)} rows={3}
                className="resize-none" />
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
                key={convo.partnerId}
                onClick={() => setSelectedPartnerId(convo.partnerId)}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                  activePartnerId === convo.partnerId && "bg-[#1E3A5F]/5"
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback>{convo.partnerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", convo.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {convo.partnerName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{formatTime(convo.lastTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={roleBadgeVariant(convo.partnerRole)} className="text-[10px] h-4 px-1.5">
                      {convo.partnerRole}
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
              <AvatarFallback>{activeConversation?.partnerInitials ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{activeConversation?.partnerName ?? "Select a conversation"}</p>
              {activeConversation?.partnerRole && (
                <Badge variant={roleBadgeVariant(activeConversation.partnerRole)} className="text-[10px] mt-0.5">
                  {activeConversation.partnerRole}
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
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => toast.info("File attachments coming soon")}><Paperclip className="size-4" /></Button>
              <Input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 h-9"
              />
              <Button size="icon" onClick={() => sendMessage()} disabled={sending}><Send className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
