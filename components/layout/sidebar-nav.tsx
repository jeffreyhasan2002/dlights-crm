"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Clock,
  FileText,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Inbox,
  Briefcase,
  ChevronDown,
  Calculator,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams?.get("view") || "all";
  const [crmOpen, setCrmOpen] = React.useState(true);

  const isCrmRoute = pathname.startsWith("/crm");
  const isDashboardRoute = pathname === "/dashboard";
  const isClientsRoute = pathname.startsWith("/clients");
  const isEventsRoute = pathname.startsWith("/events");
  const isPaymentsRoute = pathname.startsWith("/payments");
  const isExpenseCalculatorRoute = pathname.startsWith("/expense-calculator");
  const isSettingsRoute = pathname.startsWith("/settings");

  return (
    <nav className="flex flex-col space-y-6 text-sm">
      {/* Overview Group */}
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
            isDashboardRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* CRM Pipeline Group */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline & CRM
          </span>
          <button
            type="button"
            onClick={() => setCrmOpen(!crmOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", !crmOpen && "-rotate-90")}
            />
          </button>
        </div>

        {crmOpen && (
          <div className="space-y-0.5 pt-1">
            <Link
              href="/crm"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "all"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="h-3.5 w-3.5" />
                <span>All Enquiries</span>
              </div>
            </Link>

            <Link
              href="/crm?view=tracking"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && (currentView === "tracking" || currentView === "kanban")
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Kanban className="h-3.5 w-3.5" />
                <span>Client Tracking Board</span>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">Pipeline</Badge>
            </Link>

            <Link
              href="/crm?view=followups"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "followups"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Follow-ups</span>
              </div>
              <Badge variant="warning" className="text-[9px] px-1.5 py-0">Active</Badge>
            </Link>

            <Link
              href="/crm?view=quotations"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "quotations"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span>Quotations</span>
              </div>
            </Link>

            <Link
              href="/crm?view=negotiations"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "negotiations"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquareQuote className="h-3.5 w-3.5 text-purple-500" />
                <span>Negotiations</span>
              </div>
            </Link>

            <Link
              href="/crm?view=booked"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "booked"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Booked Projects</span>
              </div>
              <Badge variant="success" className="text-[9px] px-1.5 py-0">Won</Badge>
            </Link>

            <Link
              href="/crm?view=lost"
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                isCrmRoute && currentView === "lost"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Lost / Rejected</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Operations Group */}
      <div className="space-y-1">
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Management
        </span>
        <div className="space-y-0.5 pt-1">
          <Link
            href="/clients"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
              isClientsRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4 text-purple-500" />
            <span>Clients</span>
          </Link>

          <Link
            href="/events"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
              isEventsRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>Events & Schedule</span>
          </Link>

          <Link
            href="/payments"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
              isPaymentsRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span>Payments & Advances</span>
          </Link>

          <Link
            href="/expense-calculator"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
              isExpenseCalculatorRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            <Calculator className="h-4 w-4 text-amber-500" />
            <span>Expense Calculator</span>
          </Link>
        </div>
      </div>

      {/* System Group */}
      <div className="space-y-1 pt-2 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted",
            isSettingsRoute ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings & Profile</span>
        </Link>
      </div>
    </nav>
  );
}
