"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Megaphone, Send, Paperclip } from "lucide-react"

interface Conversation {
  id: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: boolean
  role: string
}

const conversations: Conversation[] = [
  { id: "1", name: "Maya Chen", initials: "MC", lastMessage: "Thank you for the essay feedback!", time: "2 min ago", unread: true, role: "Student" },
  { id: "2", name: "Wei Chen", initials: "WC", lastMessage: "When is the next parent meeting?", time: "15 min ago", unread: true, role: "Parent" },
  { id: "3", name: "Jordan Williams", initials: "JW", lastMessage: "I completed the SAT prep module", time: "1 hr ago", unread: false, role: "Student" },
  { id: "4", name: "Aisha Patel", initials: "AP", lastMessage: "Can we reschedule our call?", time: "2 hrs ago", unread: false, role: "Student" },
  { id: "5", name: "Carlos Rivera", initials: "CR", lastMessage: "I need help with my FAFSA form", time: "3 hrs ago", unread: false, role: "Student" },
  { id: "6", name: "Priya Sharma", initials: "PS", lastMessage: "Here is my updated resume", time: "5 hrs ago", unread: false, role: "Student" },
  { id: "7", name: "Raj Sharma", initials: "RS", lastMessage: "Thanks for the progress update", time: "1 day ago", unread: false, role: "Parent" },
  { id: "8", name: "Lisa Park", initials: "LP", lastMessage: "Do I qualify for the Dell scholarship?", time: "1 day ago", unread: false, role: "Student" },
]

const chatMessages = [
  { id: 1, sender: "Maya Chen", content: "Hi! I just finished my first draft of the Gates essay. Could you take a look when you get a chance?", time: "10:30 AM", isOwn: false },
  { id: 2, sender: "You", content: "Great work, Maya! I'll review it this afternoon and leave comments. In the meantime, double-check your word count - the limit is 500 words.", time: "10:45 AM", isOwn: true },
  { id: 3, sender: "Maya Chen", content: "Will do! I think I'm at around 520 right now, so I'll trim it down.", time: "10:48 AM", isOwn: false },
  { id: 4, sender: "You", content: "Perfect. Also, make sure to tie your community service experience to the scholarship's mission. That's a strong connection in your story.", time: "11:02 AM", isOwn: true },
  { id: 5, sender: "Maya Chen", content: "Thank you for the essay feedback!", time: "11:15 AM", isOwn: false },
]

export default function MessagesPage() {
  const [search, setSearch] = React.useState("")
  const [selectedId, setSelectedId] = React.useState("1")

  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Messages"
        description="Communicate with students and parents."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Megaphone className="size-3.5" /> Broadcast
            </Button>
            <Button size="sm">
              <Plus className="size-3.5" /> New Message
            </Button>
          </>
        }
      />

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
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedId(convo.id)}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                  selectedId === convo.id && "bg-[#1E3A5F]/5"
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
              <AvatarFallback>{selected?.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{selected?.name}</p>
              <p className="text-xs text-muted-foreground">{selected?.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[70%]", msg.isOwn ? "self-end items-end" : "self-start items-start")}>
                  <div className={cn(
                    "rounded-xl px-4 py-2.5 text-sm",
                    msg.isOwn
                      ? "bg-[#1E3A5F] text-white"
                      : "bg-muted text-foreground"
                  )}>
                    {msg.content}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground">{msg.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="size-4" /></Button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button size="icon"><Send className="size-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
