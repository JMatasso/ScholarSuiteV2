"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Search, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useMessaging } from "@/hooks/use-messaging"

export default function MessagesPage() {
  const {
    loading,
    currentUserId,
    messageInput,
    sending,
    messagesEndRef,
    conversations,
    chatMessages,
    activeConversation,
    setSelectedPartnerId,
    setMessageInput,
    sendMessage,
    handleKeyDown,
    formatTime,
  } = useMessaging()

  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
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
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">Communicate with your counselors, tutors, and consultants.</p>
      </div>

      <div className="grid h-[calc(100vh-260px)] min-h-[500px] gap-0 overflow-hidden rounded-xl border bg-card lg:grid-cols-[340px_1fr]">
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
                  activeConversation?.partnerId === conv.partnerId && "bg-muted"
                )}
              >
                <Avatar size="default">
                  <AvatarFallback>{conv.partnerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{conv.partnerName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.lastTime)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
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
                <AvatarFallback>{activeConversation.partnerInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{activeConversation.partnerName}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        "mt-1 text-[10px]",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
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
                  onKeyDown={handleKeyDown}
                />
                <Button
                  size="icon"
                  disabled={!messageInput.trim() || sending}
                  onClick={() => sendMessage()}
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
