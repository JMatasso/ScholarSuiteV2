import { useState, useEffect, useCallback, useRef } from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

export interface AsyncSelectProps<T> {
  /** Async function to fetch options */
  fetcher: (query?: string) => Promise<T[]>
  /** Preload all data ahead of time */
  preload?: boolean
  /** Function to filter options locally (used with preload) */
  filterFn?: (option: T, query: string) => boolean
  /** Function to render each option in the dropdown */
  renderOption: (option: T) => React.ReactNode
  /** Function to get the unique value from an option */
  getOptionValue: (option: T) => string
  /** Function to get the display value for the selected option */
  getDisplayValue: (option: T) => React.ReactNode
  /** Custom not found message */
  notFound?: React.ReactNode
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode
  /** Currently selected value */
  value: string
  /** Callback when selection changes */
  onChange: (value: string) => void
  /** Label for the select field */
  label: string
  /** Placeholder text when no selection */
  placeholder?: string
  /** Disable the entire select */
  disabled?: boolean
  /** Custom width for the popover */
  width?: string | number
  /** Custom class names */
  className?: string
  /** Custom trigger button class names */
  triggerClassName?: string
  /** Custom no results message */
  noResultsMessage?: string
  /** Allow clearing the selection */
  clearable?: boolean
}

export function AsyncSelect<T>({
  fetcher,
  preload,
  filterFn,
  renderOption,
  getOptionValue,
  getDisplayValue,
  notFound,
  loadingSkeleton,
  label,
  placeholder = "Select...",
  value,
  onChange,
  disabled = false,
  width = "200px",
  className,
  triggerClassName,
  noResultsMessage,
  clearable = true,
}: AsyncSelectProps<T>) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState(value)
  const [selectedOption, setSelectedOption] = useState<T | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, preload ? 0 : 300)
  const [originalOptions, setOriginalOptions] = useState<T[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    setMounted(true)
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetcher(debouncedSearchTerm)
        setOriginalOptions(data)
        setOptions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch options")
      } finally {
        setLoading(false)
      }
    }

    if (!mounted) {
      fetchOptions()
    } else if (!preload && debouncedSearchTerm) {
      fetchOptions()
    } else if (preload) {
      if (debouncedSearchTerm) {
        setOptions(
          originalOptions.filter((option) =>
            filterFn ? filterFn(option, debouncedSearchTerm) : true
          )
        )
      } else {
        setOptions(originalOptions)
      }
    }
  }, [fetcher, debouncedSearchTerm, mounted, preload, filterFn])

  const handleSelect = useCallback(
    (optionValue: string) => {
      const newValue = clearable && optionValue === selectedValue ? "" : optionValue
      setSelectedValue(newValue)
      setSelectedOption(
        options.find((option) => getOptionValue(option) === newValue) || null
      )
      onChange(newValue)
      setOpen(false)
    },
    [selectedValue, onChange, clearable, options, getOptionValue]
  )

  return (
    <div ref={ref} className={cn("relative", className)} style={{ width }}>
      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? getDisplayValue(selectedOption) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          {/* Search */}
          <div className="relative border-b border-border">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full bg-transparent pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            {loading && options.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1">
            {error && (
              <div className="p-4 text-sm text-destructive text-center">{error}</div>
            )}
            {loading && options.length === 0 && (
              loadingSkeleton || <DefaultLoadingSkeleton />
            )}
            {!loading && !error && options.length === 0 && (
              notFound || (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {noResultsMessage ?? `No ${label.toLowerCase()} found.`}
                </p>
              )
            )}
            {options.map((option) => {
              const optValue = getOptionValue(option)
              const isSelected = selectedValue === optValue
              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => handleSelect(optValue)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted/30"
                  )}
                >
                  {renderOption(option)}
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DefaultLoadingSkeleton() {
  return (
    <div className="p-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5">
          <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />
          <div className="flex flex-col flex-1 gap-1">
            <div className="h-4 w-24 animate-pulse bg-muted rounded" />
            <div className="h-3 w-16 animate-pulse bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
