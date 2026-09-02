"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Camera,
  Sun,
  Moon,
  Laptop,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchDialog } from "@/components/layout/search-dialog";
import { NewEnquiryDialog } from "@/components/forms/new-enquiry-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { Profile } from "@/types/crm";

interface HeaderProps {
  user?: any;
  profile?: Profile | null;
}

export function Header({ user, profile }: HeaderProps) {
  const { setTheme } = useTheme();

  const fullName = profile?.full_name || "Bruno Sangeeth";
  const email = profile?.email || "dlightstudios@gmail.com";
  const businessName = profile?.business_name || "Dlight Studios";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "BS";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-xs md:px-6">
      {/* Mobile Drawer Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 p-1 border border-primary/20">
              <img src="/favicon/android-chrome-192x192.png" alt={businessName} className="h-full w-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-foreground">{businessName}</span>
              <span className="text-[10px] text-muted-foreground">Photography Studio CRM</span>
            </div>
          </div>
          <div className="py-4">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Command Palette / Search Dialog */}
      <div className="flex-1 max-w-md">
        <SearchDialog />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Quick New Enquiry Action */}
        <NewEnquiryDialog />

        {/* Notifications / Reminders Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Studio Notifications</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-normal">
                2 pending
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2 text-xs">
              <div className="rounded p-2 bg-muted/50 border space-y-1">
                <p className="font-medium text-foreground">Follow-up Due: Priya Sharma</p>
                <p className="text-[11px] text-muted-foreground">Scheduled quotation follow-up today for Mumbai Sangeet.</p>
              </div>
              <div className="rounded p-2 bg-muted/50 border space-y-1">
                <p className="font-medium text-foreground">Payment Advance Overdue</p>
                <p className="text-[11px] text-muted-foreground">₹75,000 pending from Sneha & Rohan Kapoor for Goa wedding.</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Mode Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={profile?.avatar_url || ""} alt={fullName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
                <p className="text-[10px] text-primary/80 font-semibold pt-1">
                  {businessName}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Studio Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const { createClient } = await import("@/utils/supabase/client");
                const { clearDemoSessionAction } = await import("@/lib/auth-actions");
                const supabase = createClient();
                await supabase.auth.signOut();
                await clearDemoSessionAction();
                window.location.href = "/login";
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
