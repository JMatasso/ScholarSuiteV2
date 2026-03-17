"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { GraduationCap, MapPin, Loader2, X } from "lucide-react";
import { formatAcceptanceRate, getCollegeTypeLabel } from "@/lib/college-utils";

export interface CollegeResult {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  acceptanceRate: number | null;
}

interface CollegeAutocompleteProps {
  value?: string;
  onSelect: (college: CollegeResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CollegeAutocomplete({
  value,
  onSelect,
  placeholder = "Search for a college...",
  disabled = false,
  className,
}: CollegeAutocompleteProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CollegeResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Determine if a value is currently selected (display mode vs search mode)
  const hasSelection = !!value;

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-college-item]");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const search = React.useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    fetch(`/api/colleges/search?q=${encodeURIComponent(q)}&limit=10`)
      .then((res) => res.json())
      .then((data: CollegeResult[]) => {
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
        setSelectedIndex(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (college: CollegeResult) => {
    onSelect(college);
    setQuery("");
    setOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    // Fire onSelect with empty data to signal clearing
    onSelect({ id: "", name: "", city: "", state: "", type: "", acceptanceRate: null });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      if (e.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Selected value display */}
      {hasSelection ? (
        <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5">
          <GraduationCap className="size-3.5 shrink-0 text-[#1E3A5F]" />
          <span className="flex-1 truncate text-sm text-[#1A1A1A]">{value}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <GraduationCap className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="h-9 pl-8 pr-8"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/[0.08] overflow-hidden">
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {results.map((college, i) => (
              <button
                key={college.id}
                type="button"
                data-college-item
                onClick={() => handleSelect(college)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                  i === selectedIndex
                    ? "bg-[#2563EB]/10 text-[#1A1A1A]"
                    : "hover:bg-gray-50"
                )}
              >
                <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-[#1E3A5F]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#1A1A1A]">{college.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {(college.city || college.state) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {[college.city, college.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {college.type && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          college.type.includes("PUBLIC") || college.type === "Public"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        )}
                      >
                        {getCollegeTypeLabel(college.type)}
                      </span>
                    )}
                    {college.acceptanceRate != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatAcceptanceRate(college.acceptanceRate)} acceptance
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-muted-foreground shadow-xl shadow-black/[0.08]">
          No colleges found. Try a different search term.
        </div>
      )}
    </div>
  );
}
