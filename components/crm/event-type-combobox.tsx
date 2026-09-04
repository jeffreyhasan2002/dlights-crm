"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Sparkles, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MASTER_EVENT_TYPES, MASTER_EVENT_CATEGORIES } from "@/types/crm";
import { cn } from "@/lib/utils";

interface EventTypeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  customValue?: string;
  onCustomValueChange?: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showCustomInput?: boolean;
}

export function EventTypeCombobox({
  value,
  onChange,
  customValue = "",
  onCustomValueChange,
  id,
  placeholder = "Select or search event type...",
  disabled = false,
  error,
  showCustomInput = true,
}: EventTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  const cleanSearch = search.trim().toLowerCase();

  // Filtered event types based on query
  const filteredTypes = useMemo(() => {
    if (!cleanSearch) return MASTER_EVENT_TYPES;
    return MASTER_EVENT_TYPES.filter(
      (ev) =>
        ev.name.toLowerCase().includes(cleanSearch) ||
        ev.category.toLowerCase().includes(cleanSearch)
    );
  }, [cleanSearch]);

  // Check if search matches an existing event type exactly
  const hasExactMatch = useMemo(() => {
    if (!cleanSearch) return true;
    return MASTER_EVENT_TYPES.some((ev) => ev.name.toLowerCase() === cleanSearch);
  }, [cleanSearch]);

  const handleSelect = (eventName: string) => {
    onChange(eventName);
    if (eventName !== "Other" && onCustomValueChange) {
      onCustomValueChange("");
    }
    setOpen(false);
  };

  const handleAddCustom = () => {
    const customText = search.trim();
    if (!customText) return;
    onChange("Other");
    if (onCustomValueChange) {
      onCustomValueChange(customText);
    }
    setOpen(false);
  };

  // Determine display label for trigger
  const displayLabel = useMemo(() => {
    if (value === "Other") {
      return customValue.trim() ? `${customValue.trim()} (Other)` : "Other (Specify Custom)";
    }
    return value || placeholder;
  }, [value, customValue, placeholder]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal text-left h-9 text-xs px-3",
              !value && "text-muted-foreground",
              error && "border-destructive",
              value === "Other" && "border-amber-400 bg-amber-50/20 dark:bg-amber-950/20"
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] sm:w-[380px] p-0 shadow-lg border rounded-xl overflow-hidden"
          align="start"
        >
          {/* Search Header */}
          <div className="flex items-center border-b px-3 py-2 bg-muted/20">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type to search (e.g. Haldi, Baptism, Corporate)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[11px] text-muted-foreground hover:text-foreground px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Fallback Option: "+ Add 'XYZ' as Other" */}
          {!hasExactMatch && cleanSearch && (
            <div className="p-2 border-b bg-amber-500/10">
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full flex items-center justify-between text-left p-2 rounded-lg bg-background hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-400/50 text-xs font-semibold text-amber-900 dark:text-amber-200 transition-colors"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Plus className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">
                    Add <strong>"{search.trim()}"</strong> as Other
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 border-amber-400">
                  Custom
                </Badge>
              </button>
            </div>
          )}

          {/* List of categories & types */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
            {filteredTypes.length === 0 && hasExactMatch ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching event types found.
              </div>
            ) : (
              MASTER_EVENT_CATEGORIES.map((cat) => {
                const itemsInCat = filteredTypes.filter((t) => t.category === cat);
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <Tag className="h-2.5 w-2.5" />
                      <span>{cat}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {itemsInCat.map((item) => {
                        const isSelected = value === item.name;
                        return (
                          <button
                            key={item.slug}
                            type="button"
                            onClick={() => handleSelect(item.name)}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                                : "hover:bg-muted/80 text-foreground"
                            )}
                          >
                            <span>{item.name}</span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-primary-foreground shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* When "Other" is chosen, render the custom name input */}
      {showCustomInput && value === "Other" && (
        <div className="space-y-1.5 p-2.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 animate-in fade-in-50 duration-200">
          <Label
            htmlFor={id ? `${id}-custom` : undefined}
            className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span>Specify Event Type</span>
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id={id ? `${id}-custom` : undefined}
            placeholder="e.g. Temple Festival, Baby Naming, House Blessing..."
            value={customValue}
            onChange={(e) => onCustomValueChange?.(e.target.value)}
            className="h-8 text-xs bg-background"
          />
          <p className="text-[10px] text-muted-foreground">
            This custom name will be saved and displayed on contracts, schedule cards, and proposals.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
