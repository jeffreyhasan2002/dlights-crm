"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Plus, Search, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_REQUIREMENTS } from "@/types/crm";
import { cn } from "@/lib/utils";

interface RequirementSelectorProps {
  selectedRequirements: string[];
  onChange: (requirements: string[]) => void;
  otherRequirement?: string;
  onOtherRequirementChange?: (value: string) => void;
  error?: string;
}

export function RequirementSelector({
  selectedRequirements = [],
  onChange,
  otherRequirement = "",
  onOtherRequirementChange,
  error,
}: RequirementSelectorProps) {
  const [search, setSearch] = useState("");

  const toggleRequirement = (name: string) => {
    if (selectedRequirements.includes(name)) {
      onChange(selectedRequirements.filter((r) => r !== name));
    } else {
      onChange([...selectedRequirements, name]);
    }
  };

  const isOtherSelected = selectedRequirements.includes("Other");

  const filteredRequirements = DEFAULT_REQUIREMENTS.filter((req) =>
    req.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <Label className="text-xs font-semibold text-foreground">
            Client Event Requirements ({selectedRequirements.length} selected)
          </Label>
        </div>
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-[11px]"
          />
        </div>
      </div>

      {/* Selected Requirements Pills Bar */}
      {selectedRequirements.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/40 rounded-lg border border-border/60">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mr-1">
            Active:
          </span>
          {selectedRequirements.map((req) => (
            <Badge
              key={req}
              variant="default"
              className="text-[11px] font-medium gap-1 pl-2 pr-1 py-0.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
            >
              <span>{req === "Other" && otherRequirement ? `Other: ${otherRequirement}` : req}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRequirement(req);
                }}
                className="rounded-full hover:bg-primary-foreground/20 p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-muted-foreground hover:text-destructive underline ml-auto transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Selectable Chip Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 border rounded-lg bg-background/60">
        {filteredRequirements.map((req) => {
          const isSelected = selectedRequirements.includes(req.name);
          return (
            <button
              key={req.name}
              type="button"
              onClick={() => toggleRequirement(req.name)}
              className={cn(
                "flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-xs transition-all border",
                isSelected
                  ? "bg-primary/10 border-primary text-primary font-semibold shadow-2xs"
                  : "bg-muted/20 hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="truncate mr-1">{req.name}</span>
              {isSelected ? (
                <Check className="h-3 w-3 shrink-0 text-primary" />
              ) : (
                <Plus className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Specify Other Requirement Input */}
      {isOtherSelected && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1.5 animate-in fade-in-50 duration-200">
          <Label htmlFor="otherRequirementInput" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Specify Custom "Other" Requirement <span className="text-destructive">*</span>
          </Label>
          <Input
            id="otherRequirementInput"
            placeholder="e.g. 4K Drone Coverage, Crane Rig, LED Wall Setup, Vintage Photobooth..."
            value={otherRequirement}
            onChange={(e) => onOtherRequirementChange?.(e.target.value)}
            className="text-xs bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            Both "Other" and your custom requirement description will be preserved and editable.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
