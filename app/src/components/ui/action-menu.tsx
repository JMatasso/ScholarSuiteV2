"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={ref}>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg",
              align === "right" ? "right-0" : "left-0"
            )}
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
        )}
      </AnimatePresence>
    </div>
  );
}

export { ActionMenu };
export type { ActionMenuItem, ActionMenuProps };
