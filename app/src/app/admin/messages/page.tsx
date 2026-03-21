"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AsyncSelect } from "@/components/ui/async-select"
import { Plus, Megaphone, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { useMessaging } from "@/hooks/use-messaging"
import { AttachmentPreview, UploadingIndicator, MessageAttachmentDisplay } from "@/components/ui/message-attachment"

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
    uploading,
    pendingAttachment,
    fileInputRef,
    messagesEndRef,
    conversations,
    chatMessages,
    activePartnerId,
    activeConversation,
    setSelectedPartnerId,
    setMessageInput,
    sendMessage,
    handleKeyDown,
    handleFileSelect,
    clearAttachment,
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

  // Stable fetcher for AsyncSelect
  const fetchUsers = React.useCallback(async (): Promise<UserOption[]> => {
    const res = await fetch("/api/admin/users/all")
    const data = await res.json()
    return Array.isArray(data) ? data : []
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
      setShowNewMessage(false)
      setSelectedPartnerId(newMsgReceiverId)
    }
  }

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
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Recipient *</label>
              <AsyncSelect<UserOption>
                fetcher={fetchUsers}
                preload={true}
                value={newMsgReceiverId}
                onChange={setNewMsgReceiverId}
                label="Recipient"
                placeholder="Search by name or email..."
                width="100%"
                clearable={false}
                filterFn={(user, query) =>
                  (user.name?.toLowerCase().includes(query.toLowerCase()) ||
                  user.email.toLowerCase().includes(query.toLowerCase()) ||
                  user.role.toLowerCase().includes(query.toLowerCase()))
                }
                getOptionValue={(user) => user.id}
                renderOption={(user) => (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {user.image && <AvatarImage src={user.image} alt={user.name || user.email} />}
                      <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{user.role}</Badge>
                  </div>
                )}
                getDisplayValue={(user) => (
                  <div className="flex items-center gap-2 text-left">
                    <Avatar size="sm">
                      {user.image && <AvatarImage src={user.image} alt={user.name || user.email} />}
                      <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name || user.email}</span>
                  </div>
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Message *</label>
              <Textarea value={newMsgContent} onChange={e => setNewMsgContent(e.target.value)} rows={3}
                className="resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewMessage}>Send Message</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowNewMessage(false); setNewMsgReceiverId("") }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-14rem)] rounded-2xl bg-white ring-1 ring-gray-200/60 overflow-hidden shadow-sm">
        {/* Conversation List */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
          <div className="p-4 border-b border-gray-100">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search conversations..."
              className="w-full"
            />
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-2">
            {/* Role filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {(["ALL", "STUDENT", "PARENT", "ADMIN"] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-200",
                    roleFilter === role
                      ? "bg-[#1E3A5F] text-white shadow-sm"
                      : "bg-white text-muted-foreground hover:bg-gray-100 ring-1 ring-gray-200/60"
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
                    "px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-200",
                    readFilter === filter
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "bg-white text-muted-foreground hover:bg-gray-100 ring-1 ring-gray-200/60"
                  )}
                >
                  {filter === "ALL" ? "All" : filter === "UNREAD" ? "Unread" : "Read"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="size-9 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-2 w-32 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center py-12 px-4 text-center">
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Send className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No conversations</p>
                <p className="text-xs text-muted-foreground mt-1">Start a new message to begin chatting.</p>
              </div>
            ) : filteredConversations.map((convo) => (
              <button
                key={convo.partnerId}
                onClick={() => setSelectedPartnerId(convo.partnerId)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-gray-100/50",
                  activePartnerId === convo.partnerId
                    ? "bg-white shadow-sm border-l-2 border-l-[#2563EB]"
                    : "hover:bg-white/80"
                )}
              >
                <div className="relative">
                  <Avatar size="sm">
                    {convo.partnerImage && <AvatarImage src={convo.partnerImage} alt={convo.partnerName} />}
                    <AvatarFallback className={cn(
                      convo.partnerRole === "STUDENT" ? "bg-blue-100 text-blue-700" :
                      convo.partnerRole === "PARENT" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    )}>{convo.partnerInitials}</AvatarFallback>
                  </Avatar>
                  {convo.unread && (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#2563EB] ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-sm", convo.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {convo.partnerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(convo.lastTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-wide",
                      convo.partnerRole === "STUDENT" ? "bg-blue-100 text-blue-700" :
                      convo.partnerRole === "PARENT" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {convo.partnerRole}
                    </span>
                    <p className={cn("text-xs truncate", convo.unread ? "text-foreground" : "text-muted-foreground")}>
                      {convo.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col bg-white">
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
            <Avatar size="sm">
              {activeConversation?.partnerImage && <AvatarImage src={activeConversation.partnerImage} alt={activeConversation.partnerName} />}
              <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F]">{activeConversation?.partnerInitials ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{activeConversation?.partnerName ?? "Select a conversation"}</p>
              {activeConversation?.partnerRole && (
                <span className={cn(
                  "inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-wide mt-0.5",
                  activeConversation.partnerRole === "STUDENT" ? "bg-blue-100 text-blue-700" :
                  activeConversation.partnerRole === "PARENT" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {activeConversation.partnerRole}
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#FAFAF8]">
            <div className="flex flex-col gap-5">
              {chatMessages.map((msg) => {
                const isOwn = msg.senderId === currentUserId
                return (
                  <div key={msg.id} className={cn("flex gap-2.5 max-w-[70%]", isOwn ? "ml-auto flex-row-reverse" : "")}>
                    {!isOwn && (
                      <Avatar size="sm" className="shrink-0 mt-0.5">
                        {activeConversation?.partnerImage && <AvatarImage src={activeConversation.partnerImage} alt={activeConversation.partnerName} />}
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                          {activeConversation?.partnerInitials ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        isOwn
                          ? "bg-[#1E3A5F] text-white rounded-2xl rounded-br-md"
                          : "bg-white text-foreground rounded-2xl rounded-bl-md ring-1 ring-gray-200/60"
                      )}>
                        {msg.content}
                        {msg.imageUrl && (
                          <MessageAttachmentDisplay imageUrl={msg.imageUrl} isOwn={isOwn} />
                        )}
                      </div>
                      <span className="mt-1.5 text-[10px] text-muted-foreground px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-6 py-4 space-y-2 bg-white">
            {uploading && <UploadingIndicator />}
            {pendingAttachment && !uploading && (
              <AttachmentPreview attachment={pendingAttachment} onRemove={clearAttachment} />
            )}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Paperclip className="size-4" /></Button>
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="h-10 rounded-xl bg-gray-50 border-gray-200 pr-12 focus:bg-white"
                />
              </div>
              <Button size="icon" className="shrink-0 rounded-xl h-10 w-10" onClick={() => sendMessage()} disabled={(!messageInput.trim() && !pendingAttachment) || sending}><Send className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
