"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Bell, CheckCircle2, AlertTriangle, Info, XOctagon, Check, X } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import LoaderOne from "@/components/ui/loader-one"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

type ToastVariant = "success" | "warning" | "info" | "error"

function getVariant(type: string): ToastVariant {
  switch (type.toUpperCase()) {
    case "TASK":
    case "TASK_DUE":
      return "warning"
    case "ANNOUNCEMENT":
    case "MESSAGE":
      return "info"
    case "AWARD":
    case "APPLICATION_UPDATE":
    case "SUCCESS":
      return "success"
    case "ERROR":
    case "ALERT":
      return "error"
    default:
      return "info"
  }
}

const iconMap: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XOctagon,
}

const iconColors: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  error: "text-red-500",
}

const borderColors: Record<ToastVariant, string> = {
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
  error: "border-l-red-500",
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch on mount and when opened
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const dismissNotification = (id: string) => {
    markAsRead(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell trigger */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-96 rounded-xl bg-card shadow-2xl ring-1 ring-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#2563EB]/80 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderOne />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No notifications yet.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const variant = getVariant(notif.type)
                    const Icon = iconMap[variant]

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 border-b border-border/50 border-l-2 transition-colors cursor-pointer",
                          borderColors[variant],
                          notif.isRead
                            ? "bg-card opacity-60"
                            : "bg-card hover:bg-muted/30"
                        )}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.id)
                          if (notif.link) window.location.href = notif.link
                        }}
                      >
                        <div className={cn("mt-0.5 shrink-0", iconColors[variant])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", notif.isRead ? "font-normal" : "font-semibold")}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissNotification(notif.id)
                          }}
                          className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
