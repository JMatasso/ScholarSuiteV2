"use client"

import React, { forwardRef, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Check, CircleUserRound, User } from "lucide-react"

export interface AdminUser {
  id: string
  name: string | null
  image: string | null
}

interface AssigneePickerProps extends HTMLAttributes<HTMLDivElement> {
  currentAdmin: AdminUser | null
  admins: AdminUser[]
  onAssign: (adminId: string | null) => void
  compact?: boolean
}

function getInitials(name: string | null) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const AssigneePicker = forwardRef<HTMLDivElement, AssigneePickerProps>(
  ({ currentAdmin, admins, onAssign, compact = false, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-input bg-secondary px-2 shadow-sm transition-colors hover:bg-secondary/80",
              compact ? "h-7 text-xs" : "h-8 text-sm"
            )}
          >
            {currentAdmin ? (
              <>
                <div className="relative">
                  <Avatar className="size-5 shrink-0">
                    {currentAdmin.image && (
                      <AvatarImage
                        src={currentAdmin.image}
                        alt={currentAdmin.name || "Admin"}
                      />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(currentAdmin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute -end-0.5 -bottom-0.5 size-2 rounded-full border-2 border-background bg-emerald-500"
                  />
                </div>
                <span className="font-medium text-foreground">
                  {currentAdmin.name || "Admin"}
                </span>
              </>
            ) : (
              <>
                <CircleUserRound className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assign to...</span>
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px]">
            <DropdownMenuLabel>Assign counselor</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onAssign(null)}>
              <div className="flex flex-1 items-center gap-2">
                <User className="size-4" />
                <span>No assignee</span>
              </div>
              {!currentAdmin && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {admins.map((admin) => (
              <DropdownMenuItem
                key={admin.id}
                onSelect={() => onAssign(admin.id)}
              >
                <div className="flex flex-1 items-center gap-2">
                  <Avatar className="size-5">
                    {admin.image && (
                      <AvatarImage
                        src={admin.image}
                        alt={admin.name || "Admin"}
                      />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(admin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{admin.name || admin.id}</span>
                </div>
                {currentAdmin?.id === admin.id && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
)

AssigneePicker.displayName = "AssigneePicker"

export { AssigneePicker }
