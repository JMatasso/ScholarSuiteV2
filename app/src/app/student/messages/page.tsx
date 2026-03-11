"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Search, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  sender: "student" | "other"
  text: string
  time: string
}

interface Conversation {
  id: number
  name: string
  initials: string
  role: string
  lastMessage: string
  lastTime: string
  unread: number
  messages: Message[]
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: "Ms. Rivera",
    initials: "AR",
    role: "College Counselor",
    lastMessage: "Great progress on your personal statement! I have a few notes for you.",
    lastTime: "10:32 AM",
    unread: 2,
    messages: [
      { id: 1, sender: "other", text: "Hi Maya! I reviewed your latest personal statement draft. Really strong opening paragraph.", time: "10:15 AM" },
      { id: 2, sender: "other", text: "I have a few suggestions for the second section about your community garden work. Can we discuss during our next meeting?", time: "10:16 AM" },
      { id: 3, sender: "student", text: "Thank you, Ms. Rivera! I spent a lot of time on that opening. Yes, I would love to go over the feedback.", time: "10:20 AM" },
      { id: 4, sender: "other", text: "Also, I wanted to let you know that the Jack Kent Cooke deadline is coming up on March 22. Have you started that application?", time: "10:28 AM" },
      { id: 5, sender: "student", text: "Yes! I submitted it last week. Just waiting to hear back now.", time: "10:30 AM" },
      { id: 6, sender: "other", text: "Great progress on your personal statement! I have a few notes for you.", time: "10:32 AM" },
    ],
  },
  {
    id: 2,
    name: "Dr. Ramirez",
    initials: "LR",
    role: "Chemistry Tutor",
    lastMessage: "Your practice exam scores are looking much better this week.",
    lastTime: "Yesterday",
    unread: 0,
    messages: [
      { id: 1, sender: "other", text: "Maya, I graded your latest practice exam. You scored 88% — a huge improvement from last month!", time: "3:45 PM" },
      { id: 2, sender: "student", text: "That is amazing! I have been putting in extra study time using the resources you recommended.", time: "4:00 PM" },
      { id: 3, sender: "other", text: "It really shows. Focus on organic chemistry nomenclature for next week — that is the area that still needs work.", time: "4:05 PM" },
      { id: 4, sender: "student", text: "Will do! I already started the practice problem set you assigned.", time: "4:10 PM" },
      { id: 5, sender: "other", text: "Your practice exam scores are looking much better this week.", time: "4:15 PM" },
    ],
  },
  {
    id: 3,
    name: "Marcus Thompson",
    initials: "MT",
    role: "Scholarship Consultant",
    lastMessage: "I found 3 new scholarships that match your profile perfectly.",
    lastTime: "Mar 8",
    unread: 1,
    messages: [
      { id: 1, sender: "other", text: "Hi Maya! I have been reviewing your profile and I found some excellent scholarship opportunities for you.", time: "2:00 PM" },
      { id: 2, sender: "student", text: "That sounds great! What did you find?", time: "2:15 PM" },
      { id: 3, sender: "other", text: "The Cameron Impact Scholarship ($80K), the Stamps Scholarship (full ride), and the Posse Foundation Scholarship. All align well with your community service background.", time: "2:18 PM" },
      { id: 4, sender: "student", text: "Wow, those are incredible opportunities. What are the deadlines?", time: "2:25 PM" },
      { id: 5, sender: "other", text: "I found 3 new scholarships that match your profile perfectly.", time: "2:30 PM" },
    ],
  },
  {
    id: 4,
    name: "Ms. Chen",
    initials: "JC",
    role: "English Teacher",
    lastMessage: "Your recommendation letter is ready. I submitted it directly to the portal.",
    lastTime: "Mar 6",
    unread: 0,
    messages: [
      { id: 1, sender: "student", text: "Hi Ms. Chen! Thank you so much for agreeing to write my recommendation letter.", time: "9:00 AM" },
      { id: 2, sender: "other", text: "Of course, Maya! It was my pleasure. You are one of the most dedicated students I have had in my AP English class.", time: "11:30 AM" },
      { id: 3, sender: "other", text: "Your recommendation letter is ready. I submitted it directly to the portal.", time: "2:00 PM" },
    ],
  },
]

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState(conversations[0].id)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const selected = conversations.find((c) => c.id === selectedId)!

  const filteredConversations = conversations.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A5F]">Messages</h1>
        <p className="mt-1 text-muted-foreground">Communicate with your counselors, tutors, and consultants.</p>
      </div>

      <div className="grid h-[calc(100vh-260px)] min-h-[500px] gap-0 overflow-hidden rounded-xl border bg-white lg:grid-cols-[340px_1fr]">
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selectedId === conv.id && "bg-blue-50/50"
                )}
              >
                <Avatar size="default">
                  <AvatarFallback>{conv.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{conv.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{conv.role}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel - Message thread */}
        <div className="flex flex-col">
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Avatar size="default">
              <AvatarFallback>{selected.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selected.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.sender === "student" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    msg.sender === "student"
                      ? "bg-[#2563EB] text-white"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={cn(
                    "mt-1 text-[10px]",
                    msg.sender === "student" ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && messageInput.trim()) {
                    setMessageInput("")
                  }
                }}
              />
              <Button
                size="icon"
                className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                disabled={!messageInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
