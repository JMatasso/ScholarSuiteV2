"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Paperclip, Bell, Check, CheckCheck } from "lucide-react";
import { useMessaging } from "@/hooks/use-messaging";
import { AttachmentPreview, UploadingIndicator, MessageAttachmentDisplay } from "@/components/ui/message-attachment";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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
    setMessageInput,
    sendMessage,
    handleKeyDown,
    handleFileSelect,
    clearAttachment,
    formatTime,
    getInitials,
  } = useMessaging();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeView, setActiveView] = useState<"chat" | "notifications">(
    "chat"
  );

  // Fetch notifications (parent-specific)
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Derive consultant info from the first conversation (the hook builds these)
  const consultantDisplayName =
    activeConversation?.partnerName ?? "Consultant";
  const consultantInitials =
    activeConversation?.partnerInitials ?? "??";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Communicate with your child&apos;s college consultant
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("chat")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeView === "chat"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"
          )}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveView("notifications")}
          className={cn(
            "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeView === "notifications"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"
          )}
        >
          <Bell className="size-4" />
          Notifications
          {unreadNotifications > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {activeView === "chat" ? (
        <motion.div
          className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10 shadow-sm"
          style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3">
            <Avatar size="sm">
              {activeConversation?.partnerImage && <AvatarImage src={activeConversation.partnerImage} alt={consultantDisplayName} />}
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                {consultantInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {consultantDisplayName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                College Consultant
              </p>
            </div>
            <span className="ml-auto size-2 rounded-full bg-green-500" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {chatMessages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Send a message to start the conversation.
              </p>
            )}
            <AnimatePresence initial={false}>
              <div className="flex flex-col gap-3">
                {chatMessages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId;
                  const senderName = msg.sender.name ?? "Unknown";
                  const isRead = msg.read ?? msg.isRead ?? false;
                  const prevMsg = chatMessages[idx - 1];
                  const sameSender = prevMsg?.senderId === msg.senderId;

                  return (
                    <motion.div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2.5",
                        isMine ? "flex-row-reverse" : "",
                        !sameSender && idx > 0 ? "mt-3" : ""
                      )}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {!isMine && !sameSender && (
                        <Avatar size="sm" className="shrink-0">
                          {msg.sender.image && <AvatarImage src={msg.sender.image} alt={senderName} />}
                          <AvatarFallback
                            className="text-xs font-semibold bg-purple-100 text-purple-700"
                          >
                            {consultantInitials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isMine && sameSender && <div className="w-8 shrink-0" />}
                      <div className={cn("flex flex-col max-w-[70%]", isMine ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "px-4 py-2.5 text-sm leading-relaxed",
                            isMine
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                          )}
                        >
                          <p>{msg.content}</p>
                          {msg.imageUrl && (
                            <MessageAttachmentDisplay imageUrl={msg.imageUrl} isOwn={isMine} />
                          )}
                        </div>
                        <div
                          className={cn(
                            "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground px-1",
                            isMine ? "justify-end" : ""
                          )}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine &&
                            (isRead ? (
                              <CheckCheck className="size-3 text-blue-500" />
                            ) : (
                              <Check className="size-3" />
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </AnimatePresence>
          </div>

          {/* Message input */}
          <div className="border-t border-border px-4 py-3 space-y-2">
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
              >
                <Paperclip className="size-4" />
              </button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border-border bg-muted/50 text-sm"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={(!messageInput.trim() && !pendingAttachment) || sending}
                className="flex size-9 items-center justify-center rounded-xl bg-primary p-0 text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Notifications view */
        <div className="space-y-2">
          {notifications.length === 0 && (
            <div className="rounded-xl bg-card px-5 py-8 text-center ring-1 ring-foreground/10">
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 shadow-sm",
                !notif.isRead && "bg-accent/50 ring-blue-200/60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 size-2 shrink-0 rounded-full",
                  notif.isRead ? "bg-transparent" : "bg-accent0"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {notif.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {notif.message}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(notif.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
