"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

function ActionMenu({ items, trigger, align = "right", className }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: align === "right" ? rect.right : rect.left,
    });
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      ) return;
      setIsOpen(false);
    }

    function handleScroll() { setIsOpen(false); }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className={cn("relative", className)} ref={triggerRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      )}

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed z-[999] w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
              style={{
                top: coords.top,
                ...(align === "right"
                  ? { right: window.innerWidth - coords.left }
                  : { left: coords.left }),
              }}
            >
              {items.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  disabled={item.disabled}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                    item.destructive
                      ? "text-red-600 hover:bg-red-50"
                      : "text-foreground hover:bg-muted",
                    item.disabled && "pointer-events-none opacity-50"
                  )}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export { ActionMenu };
export type { ActionMenuItem, ActionMenuProps };
