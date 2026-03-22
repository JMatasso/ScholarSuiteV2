"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "@/lib/icons"

interface CountyResult {
  county: string
  state: string
}

interface CountyAutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  state?: string
  placeholder?: string
  className?: string
}

export function CountyAutocomplete({
  value,
  onValueChange,
  state,
  placeholder = "Search for a county...",
  className,
}: CountyAutocompleteProps) {
  const [results, setResults] = React.useState<CountyResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const search = React.useCallback((query: string) => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    const params = new URLSearchParams({ q: query, limit: "10" })
    if (state) params.set("state", state)

    fetch(`/api/counties?${params}`)
      .then((res) => res.json())
      .then((data: CountyResult[]) => {
        setResults(Array.isArray(data) ? data : [])
        setOpen(true)
        setSelectedIndex(-1)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onValueChange(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 250)
  }

  const handleSelect = (county: CountyResult) => {
    onValueChange(county.county)
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          className="h-9 pl-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl shadow-black/[0.08] overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {results.map((county, i) => (
              <button
                key={`${county.county}-${county.state}`}
                type="button"
                onClick={() => handleSelect(county)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  i === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {county.county}<span className="text-muted-foreground">, {county.state}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && results.length === 0 && !loading && value.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-3 text-center text-sm text-muted-foreground shadow-xl shadow-black/[0.08]">
          No counties found. You can type a custom name.
        </div>
      )}
    </div>
  )
}
