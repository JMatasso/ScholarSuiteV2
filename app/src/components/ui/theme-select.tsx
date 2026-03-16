"use client"

import React, { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { ChevronDownIcon, X, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

type TSelectData = {
  id: string
  label: string
  value: string
  description?: string
  icon?: React.ReactNode
}

const themeOptions: TSelectData[] = [
  {
    id: "light",
    label: "Light",
    value: "light",
    description: "Clean and bright interface",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: "dark",
    label: "Dark",
    value: "dark",
    description: "Easy on the eyes at night",
    icon: <Moon className="h-4 w-4" />,
  },
  {
    id: "system",
    label: "System",
    value: "system",
    description: "Follows your device preference",
    icon: <Monitor className="h-4 w-4" />,
  },
]

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = themeOptions.find((o) => o.value === theme) ?? themeOptions[2]

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground">
        <Sun className="h-4 w-4" />
      </div>
    )
  }

  const onSelect = (value: string) => {
    setTheme(value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative z-50">
      <MotionConfig
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <AnimatePresence mode="popLayout">
          {!open ? (
            <motion.button
              key="trigger"
              whileTap={{ scale: 0.95 }}
              animate={{ borderRadius: 10 }}
              layout
              layoutId="theme-dropdown"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 overflow-hidden rounded-[10px] border border-input bg-background px-2.5 py-1.5 shadow-sm hover:bg-accent transition-colors"
            >
              <motion.div
                layout
                layoutId={`theme-icon-${selected.id}`}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-foreground"
              >
                {selected.icon}
              </motion.div>
              <motion.span
                layout
                layoutId={`theme-label-${selected.id}`}
                className="text-sm font-medium text-foreground"
              >
                {selected.label}
              </motion.span>
              <motion.div layout className="flex items-center pl-1">
                <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.div>
            </motion.button>
          ) : (
            <motion.div
              key="dropdown"
              layout
              animate={{ borderRadius: 14 }}
              layoutId="theme-dropdown"
              className="absolute right-0 top-0 w-[240px] overflow-hidden rounded-[14px] border border-input bg-background py-1.5 shadow-lg"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.05 }}
                layout
                className="flex items-center justify-between px-3 py-2"
              >
                <motion.span layout className="text-sm font-semibold text-foreground">
                  Appearance
                </motion.span>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-secondary-foreground" />
                </button>
              </motion.div>

              {/* Options */}
              <div className="px-1">
                {themeOptions.map((item, index) => (
                  <motion.button
                    key={item.id}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent ${
                      selected.id === item.id ? "bg-accent" : ""
                    }`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.04 + 0.05, duration: 0.25 },
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      transition: { delay: index * 0.02 },
                    }}
                    onClick={() => onSelect(item.value)}
                  >
                    <motion.div
                      layout
                      layoutId={`theme-icon-${item.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-foreground"
                    >
                      {item.icon}
                    </motion.div>
                    <motion.div layout className="flex flex-col items-start">
                      <motion.span
                        layoutId={`theme-label-${item.id}`}
                        className="text-sm font-medium text-foreground"
                      >
                        {item.label}
                      </motion.span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.description}
                      </span>
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  )
}
