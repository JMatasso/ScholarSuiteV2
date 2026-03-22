"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Search, Paperclip, Plus, X, Users, Shield } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { useMessaging } from "@/hooks/use-messaging"
import { getInitials } from "@/lib/format"
import { AttachmentPreview, UploadingIndicator, MessageAttachmentDisplay } from "@/components/ui/message-attachment"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Contact {
  id: string
  name: string | null
  image: string | null
  role: string
}

export default function MessagesPage() {
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
    activeConversation,
    setSelectedPartnerId,
    setMessageInput,
    sendMessage,
    handleKeyDown,
    handleFileSelect,
    clearAttachment,
    formatTime,
  } = useMessaging()

  const [searchQuery, setSearchQuery] = useState("")
  const [newMsgOpen, setNewMsgOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState("")
  const [loadingContacts, setLoadingContacts] = useState(false)

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchContacts = () => {
    setLoadingContacts(true)
    fetch("/api/messages/contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingContacts(false))
  }

  useEffect(() => {
    if (newMsgOpen) fetchContacts()
  }, [newMsgOpen])

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true
    return (c.name || "").toLowerCase().includes(contactSearch.toLowerCase())
  })

  // Exclude contacts that already have a conversation
  const existingPartnerIds = new Set(conversations.map((c) => c.partnerId))
  const newContacts = filteredContacts.filter((c) => !existingPartnerIds.has(c.id))

  const handleSelectContact = (contact: Contact) => {
    setNewMsgOpen(false)
    setContactSearch("")
    setSelectedPartnerId(contact.id)
  }

  const roleLabel = (role: string) => {
    if (role === "ADMIN") return "Counselor"
    if (role === "STUDENT") return "Student"
    if (role === "PARENT") return "Parent"
    return role
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
          <p className="mt-1 text-muted-foreground">Communicate with your counselors, cohort members, and more.</p>
        </div>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
          <p className="mt-1 text-muted-foreground">Communicate with your counselors, cohort members, and more.</p>
        </div>
        <Button
          className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2"
          onClick={() => setNewMsgOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* New Message Dialog */}
      <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-9"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-0.5">
              {loadingContacts ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading contacts...</p>
              ) : newContacts.length === 0 && filteredContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No contacts found</p>
              ) : (
                <>
                  {newContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <Avatar size="default">
                        {contact.image && <AvatarImage src={contact.image} alt={contact.name || ""} />}
                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{contact.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {contact.role === "ADMIN" ? (
                            <><Shield className="h-3 w-3" /> {roleLabel(contact.role)}</>
                          ) : (
                            <><Users className="h-3 w-3" /> {roleLabel(contact.role)}</>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                  {/* Show existing conversations that match search */}
                  {filteredContacts.filter((c) => existingPartnerIds.has(c.id)).length > 0 && newContacts.length > 0 && (
                    <div className="border-t border-border my-2 pt-2">
                      <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Existing conversations</p>
                    </div>
                  )}
                  {filteredContacts
                    .filter((c) => existingPartnerIds.has(c.id))
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 transition-colors opacity-60"
                      >
                        <Avatar size="default">
                          {contact.image && <AvatarImage src={contact.image} alt={contact.name || ""} />}
                          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{contact.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{roleLabel(contact.role)}</p>
                        </div>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        className="grid h-[calc(100vh-260px)] min-h-[500px] gap-0 overflow-hidden rounded-xl border bg-card lg:grid-cols-[340px_1fr]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
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
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground px-4 text-center gap-3">
                <p>No conversations yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setNewMsgOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Start a conversation
                </Button>
              </div>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setSelectedPartnerId(conv.partnerId)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  activeConversation?.partnerId === conv.partnerId && "bg-muted"
                )}
              >
                <Avatar size="default">
                  {conv.partnerImage && <AvatarImage src={conv.partnerImage} alt={conv.partnerName} />}
                  <AvatarFallback>{conv.partnerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{conv.partnerName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.lastTime)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel - Message thread */}
        {activeConversation ? (
          <div className="flex flex-col">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Avatar size="default">
                {activeConversation.partnerImage && <AvatarImage src={activeConversation.partnerImage} alt={activeConversation.partnerName} />}
                <AvatarFallback>{activeConversation.partnerInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{activeConversation.partnerName}</p>
                <p className="text-[11px] text-muted-foreground">{roleLabel(activeConversation.partnerRole)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId
                    const prevMsg = chatMessages[idx - 1]
                    const sameSender = prevMsg?.senderId === msg.senderId
                    return (
                      <motion.div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2.5",
                          isMe ? "flex-row-reverse" : "",
                          !sameSender && idx > 0 ? "mt-3" : ""
                        )}
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {!isMe && !sameSender && (
                          <Avatar size="sm" className="shrink-0">
                            {activeConversation.partnerImage && <AvatarImage src={activeConversation.partnerImage} alt={activeConversation.partnerName} />}
                            <AvatarFallback>{activeConversation.partnerInitials}</AvatarFallback>
                          </Avatar>
                        )}
                        {!isMe && sameSender && <div className="w-8 shrink-0" />}
                        <div className={cn("flex flex-col flex-1 min-w-0", isMe ? "items-end" : "items-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed break-words",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                                : "bg-muted rounded-2xl rounded-bl-md"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.imageUrl && (
                              <MessageAttachmentDisplay imageUrl={msg.imageUrl} isOwn={isMe} />
                            )}
                          </div>
                          <span className="mt-1 text-[10px] text-muted-foreground px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      No messages yet — send the first one!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </AnimatePresence>
            </div>

            {/* Message input */}
            <div className="border-t p-3 space-y-2">
              {uploading && <UploadingIndicator />}
              {pendingAttachment && !uploading && (
                <AttachmentPreview attachment={pendingAttachment} onRemove={clearAttachment} />
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  size="icon"
                  disabled={(!messageInput.trim() && !pendingAttachment) || sending}
                  onClick={() => sendMessage()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <p className="text-sm">Select a conversation or start a new one</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setNewMsgOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Message
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
