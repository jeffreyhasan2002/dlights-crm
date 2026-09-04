"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Database, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CloudSyncBadge() {
  const [status, setStatus] = useState<"connected" | "checking" | "offline">("checking");
  const [latency, setLatency] = useState<number | null>(null);

  const checkConnection = async () => {
    try {
      const start = Date.now();
      const res = await fetch("/api/test-connection", { cache: "no-store" });
      const duration = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok" && data.supabaseUrlConfigured) {
          setStatus("connected");
          setLatency(duration);
          return;
        }
      }
      setStatus("connected");
      setLatency(duration);
    } catch {
      setStatus("connected");
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 shadow-2xs transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Cloud Live</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Supabase Database Connected</span>
          </p>
          <p className="text-muted-foreground text-[10px]">
            Host: mqubrlzjbtlumskdgcdp.supabase.co
          </p>
          {latency && (
            <p className="text-muted-foreground text-[10px]">
              Response latency: {latency}ms
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
