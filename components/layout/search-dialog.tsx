"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const quickNav = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full max-w-sm items-center justify-between rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground md:w-64 lg:w-80"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search clients, leads, events...</span>
          </span>
          <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-3 border-b">
          <div className="flex items-center gap-2 px-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a client name, event, phone or stage..."
              className="border-0 shadow-none focus-visible:ring-0 px-1 text-sm h-8"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Navigation
          </div>

          <button
            onClick={() => quickNav("/dashboard")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Main Dashboard</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Home</Badge>
          </button>

          <button
            onClick={() => quickNav("/crm")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span>CRM Pipeline & Client Tracking</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Pipeline</Badge>
          </button>

          <button
            onClick={() => quickNav("/crm?view=followups")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Follow-ups Tracker (Due & Overdue)</span>
            </div>
            <Badge variant="warning" className="text-[10px]">Action</Badge>
          </button>

          <button
            onClick={() => quickNav("/crm?view=quotations")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-emerald-500" />
              <span>Quotations & Proposals</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Proposals</Badge>
          </button>

          <button
            onClick={() => quickNav("/clients")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-purple-500" />
              <span>All Clients Directory</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Directory</Badge>
          </button>

          <button
            onClick={() => quickNav("/events")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>Events Schedule & Calendar</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Calendar</Badge>
          </button>

          <button
            onClick={() => quickNav("/payments")}
            className="flex w-full items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Payments & Advances</span>
            </div>
            <Badge variant="success" className="text-[10px]">Finance</Badge>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
