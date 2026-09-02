import * as React from "react";
import Link from "next/link";
import {
  Inbox,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquareQuote,
  CheckCircle2,
  Calendar,
  CreditCard,
  IndianRupee,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardMetrics } from "@/types/crm";
import { formatCurrency } from "@/lib/utils";

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {/* 1. New Enquiries */}
      <Link href="/crm?status=New+Enquiry" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">New Enquiries</span>
              <div className="rounded-md bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Inbox className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.newEnquiriesCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Uncontacted leads</p>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Active Leads */}
      <Link href="/crm" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Leads</span>
              <div className="rounded-md bg-purple-50 p-1.5 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.activeLeadsCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Follow-ups Today */}
      <Link href="/crm?view=followups&filter=today" className="group block">
        <Card className="border-amber-200 bg-amber-50/20 transition-all hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Due Today</span>
              <div className="rounded-md bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              {metrics.followUpsTodayCount}
            </div>
            <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-300/80">Follow-ups scheduled</p>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Overdue Follow-ups */}
      <Link href="/crm?view=followups&filter=overdue" className="group block">
        <Card className="border-red-200 bg-red-50/20 transition-all hover:border-red-400 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-800 dark:text-red-300">Overdue</span>
              <div className="rounded-md bg-red-100 p-1.5 text-red-700 dark:bg-red-900 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-red-900 dark:text-red-100">
              {metrics.overdueFollowUpsCount}
            </div>
            <p className="mt-0.5 text-[11px] text-red-700/80 dark:text-red-300/80">Require immediate action</p>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Quotations Awaiting */}
      <Link href="/crm?view=quotations" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Quotations Sent</span>
              <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.quotationsAwaitingCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Awaiting client review</p>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Negotiations */}
      <Link href="/crm?view=negotiations" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Negotiating</span>
              <div className="rounded-md bg-orange-50 p-1.5 text-orange-600 dark:bg-orange-950 dark:text-orange-300">
                <MessageSquareQuote className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.negotiationsCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Active discussions</p>
          </CardContent>
        </Card>
      </Link>

      {/* 7. Booked Events */}
      <Link href="/crm?view=booked" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Confirmed Bookings</span>
              <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.bookedEventsCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {formatCurrency(metrics.totalBookedValue)} total value
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* 8. Upcoming Events */}
      <Link href="/events" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Upcoming Shoots</span>
              <div className="rounded-md bg-sky-50 p-1.5 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{metrics.upcomingEventsCount}</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">On calendar</p>
          </CardContent>
        </Card>
      </Link>

      {/* 9. Pending Advance */}
      <Link href="/payments" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Advance</span>
              <div className="rounded-md bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              {formatCurrency(metrics.pendingAdvanceAmount)}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Unpaid token advances</p>
          </CardContent>
        </Card>
      </Link>

      {/* 10. Pending Final */}
      <Link href="/payments" className="group block">
        <Card className="transition-all hover:border-primary/50 hover:shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Balance</span>
              <div className="rounded-md bg-yellow-50 p-1.5 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              {formatCurrency(metrics.pendingFinalAmount)}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Remaining client dues</p>
          </CardContent>
        </Card>
      </Link>

      {/* 11. Total Revenue Collected */}
      <Link href="/payments" className="group block sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-2">
        <Card className="bg-primary text-primary-foreground transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary-foreground/80">Total Realized Revenue</span>
              <div className="rounded-md bg-primary-foreground/20 p-1.5 text-primary-foreground">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-primary-foreground">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="mt-0.5 text-[11px] text-primary-foreground/70">
              Payments deposited across all shoots
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
