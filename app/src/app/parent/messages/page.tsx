"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Bell, Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  sender: "parent" | "consultant";
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "consultant",
    senderName: "Sarah Williams",
    text: "Hi Maria! I wanted to update you on Alex's progress. He's been doing great with the scholarship applications this month.",
    timestamp: "Mar 8, 10:30 AM",
    read: true,
  },
  {
    id: "2",
    sender: "parent",
    senderName: "Maria Johnson",
    text: "That's wonderful to hear! We've been working on the essays together at home. Is there anything specific we should focus on next?",
    timestamp: "Mar 8, 11:15 AM",
    read: true,
  },
  {
    id: "3",
    sender: "consultant",
    senderName: "Sarah Williams",
    text: "The FAFSA deadline passed on March 1st and I noticed it hasn't been submitted yet. This is really important for financial aid eligibility. Can you help ensure Alex completes this ASAP?",
    timestamp: "Mar 9, 9:00 AM",
    read: true,
  },
  {
    id: "4",
    sender: "parent",
    senderName: "Maria Johnson",
    text: "Oh no, I didn't realize that deadline had passed. We'll get on it right away. Do you know if late submissions are still accepted?",
    timestamp: "Mar 9, 12:30 PM",
    read: true,
  },
  {
    id: "5",
    sender: "consultant",
    senderName: "Sarah Williams",
    text: "Yes, FAFSA accepts submissions year-round, but earlier is better for state and institutional aid. I'd recommend completing it this week. I can walk Alex through it during our next session if needed.",
    timestamp: "Mar 9, 1:45 PM",
    read: true,
  },
  {
    id: "6",
    sender: "consultant",
    senderName: "Sarah Williams",
    text: "Also, I wanted to let you know that Alex's Gates Scholarship essay is due March 15th. He has a solid draft but it needs some revision. Could you encourage him to work on it this weekend?",
    timestamp: "Mar 10, 3:00 PM",
    read: true,
  },
  {
    id: "7",
    sender: "parent",
    senderName: "Maria Johnson",
    text: "Absolutely, I'll make sure he sets aside time this weekend. Thank you for staying on top of everything, Sarah!",
    timestamp: "Mar 10, 5:20 PM",
    read: true,
  },
  {
    id: "8",
    sender: "consultant",
    senderName: "Sarah Williams",
    text: "Of course! One more thing - I'd like to schedule a meeting with you and Alex to discuss the college application timeline. Would next Tuesday at 4 PM work for you?",
    timestamp: "Mar 11, 9:15 AM",
    read: false,
  },
];

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New message from Sarah Williams",
    description: "Would next Tuesday at 4 PM work for you?",
    time: "9:15 AM",
    read: false,
  },
  {
    id: "2",
    title: "Task overdue: FAFSA Application",
    description: "Alex's FAFSA application is 10 days overdue",
    time: "Yesterday",
    read: false,
  },
  {
    id: "3",
    title: "Deadline reminder: Gates Scholarship Essay",
    description: "Due in 4 days (March 15, 2026)",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    title: "Application awarded",
    description: "First Generation College Fund - $1,000 awarded!",
    time: "Mar 1",
    read: true,
  },
  {
    id: "5",
    title: "Task completed by Alex",
    description: "STEM Leaders Scholarship has been submitted",
    time: "Mar 1",
    read: true,
  },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [activeView, setActiveView] = useState<"chat" | "notifications">(
    "chat"
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: String(Date.now()),
      sender: "parent",
      senderName: "Maria Johnson",
      text: newMessage.trim(),
      timestamp: "Just now",
      read: true,
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadNotifications = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Messages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Communicate with Alex&apos;s college consultant
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
        <div className="flex flex-col rounded-xl bg-white ring-1 ring-gray-200/60 shadow-sm" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                SW
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Sarah Williams
              </p>
              <p className="text-[11px] text-gray-400">
                College Consultant &middot; Online
              </p>
            </div>
            <span className="ml-auto size-2 rounded-full bg-green-500" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
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
                    {msg.sender === "parent" ? "MJ" : "SW"}
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
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
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
          {mockNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-white px-5 py-4 ring-1 ring-gray-200/60 shadow-sm",
                !notif.read && "bg-blue-50/50 ring-blue-200/60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 size-2 shrink-0 rounded-full",
                  notif.read ? "bg-transparent" : "bg-blue-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notif.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {notif.description}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">
                {notif.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
