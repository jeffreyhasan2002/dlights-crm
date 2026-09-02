import * as React from "react";
import {
  getDashboardMetrics,
  getFollowUps,
  getQuotations,
  getLeads,
  getEvents,
  getBookings,
  getPayments,
  getProfile,
} from "@/lib/crm-service";
import dynamic from "next/dynamic";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { UpcomingEventsList } from "@/components/dashboard/upcoming-events-list";
import { PendingPaymentsList } from "@/components/dashboard/pending-payments-list";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { Sparkles, BarChart3 } from "lucide-react";

const RevenueAnalyticsChart = dynamic(
  () =>
    import("@/components/dashboard/revenue-analytics-chart").then(
      (mod) => mod.RevenueAnalyticsChart
    ),
  {
    loading: () => (
      <div className="h-[380px] w-full rounded-xl border bg-card/60 p-6 flex flex-col justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-3 w-64 rounded bg-muted/60" />
        </div>
        <div className="h-48 w-full rounded bg-muted/40" />
      </div>
    ),
  }
);

const LeadSourcesChart = dynamic(
  () =>
    import("@/components/dashboard/lead-sources-chart").then(
      (mod) => mod.LeadSourcesChart
    ),
  {
    loading: () => (
      <div className="h-[380px] w-full rounded-xl border bg-card/60 p-6 flex flex-col justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="h-3 w-48 rounded bg-muted/60" />
        </div>
        <div className="h-48 w-48 rounded-full bg-muted/40 mx-auto" />
      </div>
    ),
  }
);

export const revalidate = 0; // Dynamic server fetching for real-time CRM updates

export default async function DashboardPage() {
  const [
    metrics,
    todayFollowUps,
    overdueFollowUps,
    allQuotations,
    allLeads,
    upcomingEvents,
    bookings,
    payments,
    profile,
  ] = await Promise.all([
    getDashboardMetrics(),
    getFollowUps("today"),
    getFollowUps("overdue"),
    getQuotations(),
    getLeads(),
    getEvents("Upcoming"),
    getBookings(),
    getPayments(),
    getProfile(),
  ]);

  const pendingQuotations = allQuotations.filter(
    (q) => q.status === "Sent" || q.status === "Viewed"
  );
  const negotiatingLeads = allLeads.filter((l) => l.lead_status === "Negotiation");

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner / Overview Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Studio Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{profile.full_name || "Photographer"}</span>. Here is what requires your attention today.
          </p>
        </div>

        {/* Dashboard Quick Actions Suite */}
        <DashboardQuickActions leads={allLeads} bookings={bookings} />
      </div>

      {/* 11 Live Metric Cards */}
      <MetricCards metrics={metrics} />

      {/* Priority Action Sections ("What do I need to do today?") */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Today's Priority Focus</h2>
        </div>
        <PriorityActions
          todayFollowUps={todayFollowUps}
          overdueFollowUps={overdueFollowUps}
          pendingQuotations={pendingQuotations}
          negotiatingLeads={negotiatingLeads}
        />
      </div>

      {/* Interactive Visual Analytics Charts */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <h2 className="text-lg font-semibold tracking-tight">Studio Performance & Pipeline Analytics</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueAnalyticsChart
              bookings={bookings}
              payments={payments}
              quotations={allQuotations}
            />
          </div>
          <div>
            <LeadSourcesChart leads={allLeads} />
          </div>
        </div>
      </div>

      {/* Upcoming Shoots & Pending Balances */}
      <div className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-2">
        <UpcomingEventsList events={upcomingEvents} />
        <PendingPaymentsList bookings={bookings} />
      </div>
    </div>
  );
}
