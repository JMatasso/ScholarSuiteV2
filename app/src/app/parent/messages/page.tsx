"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Paperclip, Bell, Check, CheckCheck } from "lucide-react";

interface ApiMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name?: string; image?: string };
  receiver: { id: string; name?: string; image?: string };
}

interface UIMessage {
  id: string;
  sender: "parent" | "consultant";
  senderName: string;
  senderInitials: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function getInitials(name?: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeView, setActiveView] = useState<"chat" | "notifications">("chat");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [consultantInfo, setConsultantInfo] = useState<{
    name: string;
    initials: string;
    id: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/messages").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()).catch(() => []),
    ]).then(([msgs, notifs]: [ApiMessage[], Notification[]]) => {
      const msgList = Array.isArray(msgs) ? msgs : [];
      const notifList = Array.isArray(notifs) ? notifs : [];

      // Determine current user from the messages (parent is the sender or receiver)
      // The first message gives us context about who we are
      let myId: string | null = null;
      let consultant: { name: string; initials: string; id: string } | null = null;

      if (msgList.length > 0) {
        // Find which participant is ADMIN/consultant — we assume the non-parent is the consultant
        // We identify ourselves by checking who sent and received
        const firstMsg = msgList[0];
        // We'll use session to determine who we are, but since we can't call auth() client-side,
        // we infer from message patterns: the parent is the one who can be sender or receiver
        // We fetch /api/auth/session to get our id
        fetch("/api/auth/session")
          .then((r) => r.json())
          .then((session: { user?: { id: string; name?: string } }) => {
            const uid = session?.user?.id ?? null;
            setCurrentUserId(uid);

            // Find consultant: someone in the messages who is not us
            const otherIds = new Set<string>();
            for (const m of msgList) {
              if (m.senderId !== uid) otherIds.add(m.senderId);
              if (m.receiverId !== uid) otherIds.add(m.receiverId);
            }
            const consultantId = otherIds.size > 0 ? [...otherIds][0] : null;

            let consultantName = "Consultant";
            if (consultantId) {
              const ref = msgList.find(
                (m) => m.sender.id === consultantId || m.receiver.id === consultantId
              );
              const person =
                ref?.sender.id === consultantId ? ref.sender : ref?.receiver;
              consultantName = person?.name ?? "Consultant";
            }

            if (consultantId) {
              setConsultantInfo({
                id: consultantId,
                name: consultantName,
                initials: getInitials(consultantName),
              });
            }

            const uiMsgs: UIMessage[] = msgList.map((m) => ({
              id: m.id,
              sender: m.senderId === uid ? "parent" : "consultant",
              senderName: m.sender.name ?? "Unknown",
              senderInitials: getInitials(m.sender.name),
              text: m.content,
              timestamp: new Date(m.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
              read: m.isRead,
            }));
            setMessages(uiMsgs);
            setNotifications(notifList);
            setLoading(false);
          })
          .catch(() => {
            setMessages([]);
            setLoading(false);
          });
      } else {
        // No messages yet — still try to get session
        fetch("/api/auth/session")
          .then((r) => r.json())
          .then((session: { user?: { id: string } }) => {
            setCurrentUserId(session?.user?.id ?? null);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!consultantInfo?.id) {
      toast.error("No consultant to send to");
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: consultantInfo.id,
        content: newMessage.trim(),
      }),
    });

    if (res.ok) {
      const created: ApiMessage = await res.json();
      const newMsg: UIMessage = {
        id: created.id,
        sender: "parent",
        senderName: created.sender.name ?? "You",
        senderInitials: getInitials(created.sender.name),
        text: created.content,
        timestamp: "Just now",
        read: false,
      };
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    } else {
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const consultantDisplayName = consultantInfo?.name ?? "Consultant";
  const consultantInitials = consultantInfo?.initials ?? "??";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Messages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
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
              ? "bg-[#1E3A5F] text-white"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
          )}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveView("notifications")}
          className={cn(
            "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeView === "notifications"
              ? "bg-[#1E3A5F] text-white"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
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
        <div
          className="flex flex-col rounded-xl bg-white ring-1 ring-gray-200/60 shadow-sm"
          style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                {consultantInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {consultantDisplayName}
              </p>
              <p className="text-[11px] text-gray-400">College Consultant</p>
            </div>
            <span className="ml-auto size-2 rounded-full bg-green-500" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                No messages yet. Send a message to start the conversation.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.sender === "parent" ? "flex-row-reverse" : ""
                )}
              >
                <Avatar size="sm" className="shrink-0 mt-1">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold",
                      msg.sender === "parent"
                        ? "bg-[#1E3A5F] text-white"
                        : "bg-purple-100 text-purple-700"
                    )}
                  >
                    {msg.sender === "parent"
                      ? getInitials(msg.senderName)
                      : consultantInitials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[70%]",
                    msg.sender === "parent" ? "text-right" : ""
                  )}
                >
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2.5 text-sm",
                      msg.sender === "parent"
                        ? "bg-[#1E3A5F] text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    )}
                  >
                    <p className="text-left">{msg.text}</p>
                  </div>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[11px] text-gray-400",
                      msg.sender === "parent" ? "justify-end" : ""
                    )}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === "parent" &&
                      (msg.read ? (
                        <CheckCheck className="size-3 text-blue-500" />
                      ) : (
                        <Check className="size-3" />
                      ))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info("File attachments coming soon")}
                className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="size-4" />
              </button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border-gray-200 bg-gray-50 text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="flex size-9 items-center justify-center rounded-xl bg-[#1E3A5F] p-0 text-white hover:bg-[#1E3A5F]/90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Notifications view */
        <div className="space-y-2">
          {notifications.length === 0 && (
            <div className="rounded-xl bg-white px-5 py-8 text-center ring-1 ring-gray-200/60">
              <p className="text-sm text-gray-400">No notifications yet.</p>
            </div>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-white px-5 py-4 ring-1 ring-gray-200/60 shadow-sm",
                !notif.isRead && "bg-blue-50/50 ring-blue-200/60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 size-2 shrink-0 rounded-full",
                  notif.isRead ? "bg-transparent" : "bg-blue-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notif.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{notif.message}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
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
