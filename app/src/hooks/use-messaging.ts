"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { getInitials, formatTime } from "@/lib/format"
import { useUploadThing } from "@/lib/uploadthing"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ApiMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  imageUrl?: string | null
  createdAt: string
  read?: boolean
  isRead?: boolean
  sender: { id: string; name?: string | null; image?: string | null; role?: string }
  receiver: { id: string; name?: string | null; image?: string | null; role?: string }
}

export interface Conversation {
  partnerId: string
  partnerName: string
  partnerInitials: string
  partnerImage?: string | null
  partnerRole: string
  lastMessage: string
  lastTime: string
  unread: boolean
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useMessaging() {
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string; type: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { startUpload } = useUploadThing("messageAttachment")

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res && res[0]) {
        const uploaded = res[0]
        setPendingAttachment({ url: uploaded.ufsUrl, name: uploaded.name, type: uploaded.type })
        toast.success(`Attached: ${uploaded.name}`)
      }
    } catch {
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [startUpload])

  const clearAttachment = useCallback(() => {
    setPendingAttachment(null)
  }, [])

  // Fetch current session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.id) setCurrentUserId(session.user.id)
      })
      .catch(() => {})
  }, [])

  // Fetch messages
  const fetchMessages = useCallback(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load messages")
        setLoading(false)
      })
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  // Mark message-type notifications as read when entering messages
  useEffect(() => {
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((notifs) => {
        if (!Array.isArray(notifs)) return
        const messageNotifs = notifs.filter(
          (n: { type: string }) => n.type === "MESSAGE"
        )
        messageNotifs.forEach((n: { id: string }) => {
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id }),
          }).catch(() => {})
        })
      })
      .catch(() => {})
  }, [])

  // Auto-scroll on message/selection change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedPartnerId, messages])

  // Build conversations
  const conversations: Conversation[] = useMemo(() => {
    if (!currentUserId) return []
    const map = new Map<string, Conversation>()

    messages.forEach((msg) => {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
      const partner = msg.senderId === currentUserId ? msg.receiver : msg.sender
      const partnerName = partner.name || "Unknown"
      const existing = map.get(partnerId)

      if (!existing || new Date(msg.createdAt) > new Date(existing.lastTime)) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          partnerInitials: getInitials(partnerName),
          partnerImage: partner.image,
          partnerRole: partner.role || "User",
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unread:
            msg.senderId !== currentUserId &&
            !(msg.read ?? msg.isRead ?? true),
        })
      }
    })

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    )
  }, [messages, currentUserId])

  // Chat messages for selected partner
  const chatMessages = useMemo(() => {
    const partnerId = selectedPartnerId || conversations[0]?.partnerId
    if (!partnerId || !currentUserId) return []
    return messages
      .filter(
        (msg) =>
          (msg.senderId === currentUserId && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === currentUserId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, selectedPartnerId, currentUserId, conversations])

  // Active conversation
  const activePartnerId = selectedPartnerId || conversations[0]?.partnerId || null
  const activeConversation = conversations.find((c) => c.partnerId === activePartnerId) || null

  // Mark messages as read when selecting a partner
  useEffect(() => {
    if (!activePartnerId) return
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: activePartnerId }),
    }).catch(() => {})
  }, [activePartnerId])

  // Send a message
  const sendMessage = useCallback(
    async (receiverId?: string, content?: string) => {
      const targetId = receiverId || activePartnerId
      const text = content || messageInput.trim()
      if ((!text && !pendingAttachment) || !targetId) return false

      setSending(true)
      try {
        const payload: Record<string, string | undefined> = {
          receiverId: targetId,
          content: text || (pendingAttachment ? `📎 ${pendingAttachment.name}` : ""),
          imageUrl: pendingAttachment?.url,
        }
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        if (!receiverId) setMessageInput("")
        setPendingAttachment(null)
        fetchMessages()
        return true
      } catch {
        toast.error("Failed to send message")
        return false
      } finally {
        setSending(false)
      }
    },
    [activePartnerId, messageInput, pendingAttachment, fetchMessages]
  )

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  return {
    // State
    messages,
    loading,
    currentUserId,
    selectedPartnerId,
    messageInput,
    sending,
    uploading,
    pendingAttachment,
    fileInputRef,
    messagesEndRef,

    // Derived
    conversations,
    chatMessages,
    activePartnerId,
    activeConversation,

    // Actions
    setSelectedPartnerId,
    setMessageInput,
    sendMessage,
    handleKeyDown,
    handleFileSelect,
    clearAttachment,
    fetchMessages,

    // Utilities (re-exported for convenience)
    formatTime,
    getInitials,
  }
}
