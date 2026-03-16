"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MapPin, School, Loader2 } from "lucide-react";

interface SchoolResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  ncesId: string | null;
}

interface SchoolAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onSchoolSelect?: (school: SchoolResult) => void;
  placeholder?: string;
  className?: string;
}

export function SchoolAutocomplete({
  value,
  onValueChange,
  onSchoolSelect,
  placeholder = "Search for a school...",
  className,
}: SchoolAutocompleteProps) {
  const [results, setResults] = React.useState<SchoolResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const search = React.useCallback((query: string) => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    fetch(`/api/schools/search?q=${encodeURIComponent(query)}&limit=10`)
      .then((res) => res.json())
      .then((data: SchoolResult[]) => {
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
        setSelectedIndex(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onValueChange(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (school: SchoolResult) => {
    onValueChange(school.name);
    onSchoolSelect?.(school);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

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
      <div className="relative">
        <School className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
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
            {results.map((school, i) => (
              <button
                key={school.id}
                type="button"
                onClick={() => handleSelect(school)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  i === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                <School className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{school.name}</p>
                  {(school.city || school.state) && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-2.5" />
                      {[school.city, school.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && results.length === 0 && !loading && value.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-3 text-center text-sm text-muted-foreground shadow-xl shadow-black/[0.08]">
          No schools found. You can type a custom name.
        </div>
      )}
    </div>
  );
}
