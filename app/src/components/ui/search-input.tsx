"use client"

import * as React from "react"
import { Search, X } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

function SearchInput({
  value,
  onValueChange,
  onChange,
  className,
  placeholder = "Search...",
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value)
    onChange?.(e)
  }

  const handleClear = () => {
    onValueChange?.("")
    inputRef.current?.focus()
  }

  return (
    <div data-slot="search-input" className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent pl-8 pr-8 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
