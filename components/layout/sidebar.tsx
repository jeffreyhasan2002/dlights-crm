import * as React from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex shrink-0">
      {/* Studio Brand Header */}
      <Link href="/dashboard" className="flex h-16 items-center gap-2.5 border-b px-5 hover:bg-sidebar-accent/50 transition-colors">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 p-1 border border-primary/20 shadow-xs">
          <img src="/favicon/android-chrome-192x192.png" alt="Dlight Studios" className="h-full w-full object-contain rounded-lg" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            Dlight Studios
          </span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            Photography & Wedding CRM
          </span>
        </div>
      </Link>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SidebarNav />
      </div>

      {/* Studio Footer Info */}
      <div className="border-t p-4 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Dlight Studios CRM</span>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </aside>
  );
}
