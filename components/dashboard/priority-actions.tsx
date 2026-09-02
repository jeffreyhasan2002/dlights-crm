"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  FileText,
  MessageSquareQuote,
  Phone,
  MessageCircle,
  Mail,
  ArrowUpRight,
  Check,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { LeadWithDetails, FollowUp, Quotation } from "@/types/crm";
import { completeFollowUpServerAction } from "@/lib/crm-actions";

interface PriorityActionsProps {
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  pendingQuotations: Quotation[];
  negotiatingLeads: LeadWithDetails[];
}

export function PriorityActions({
  todayFollowUps,
  overdueFollowUps,
  pendingQuotations,
  negotiatingLeads,
}: PriorityActionsProps) {
  const [overdueList, setOverdueList] = React.useState<FollowUp[]>(overdueFollowUps);
  const [todayList, setTodayList] = React.useState<FollowUp[]>(todayFollowUps);

  React.useEffect(() => {
    setOverdueList(overdueFollowUps);
  }, [overdueFollowUps]);

  React.useEffect(() => {
    setTodayList(todayFollowUps);
  }, [todayFollowUps]);

  const handleCompleteFollowUp = async (id: string, clientName: string) => {
    // Instant optimistic update
    setOverdueList((prev) => prev.filter((item) => item.id !== id));
    setTodayList((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Follow-up with ${clientName} marked as completed.`);

    try {
      const res = await completeFollowUpServerAction(id, "Followed up successfully");
      if (!res.success) {
        setOverdueList(overdueFollowUps);
        setTodayList(todayFollowUps);
        toast.error("Failed to mark follow-up as completed");
      }
    } catch {
      setOverdueList(overdueFollowUps);
      setTodayList(todayFollowUps);
      toast.error("Failed to mark follow-up as completed");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. OVERDUE FOLLOW-UPS (Highest Priority) */}
      <Card className="border-red-200/80 shadow-xs dark:border-red-900/50">
        <CardHeader className="pb-3 border-b bg-red-50/20 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-red-100 p-1 text-red-700 dark:bg-red-900 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-red-900 dark:text-red-200">
                  Overdue Action Items
                </CardTitle>
                <CardDescription className="text-xs text-red-700/80 dark:text-red-300/80">
                  Follow-ups that missed their scheduled response deadline
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              {overdueList.length} Overdue
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
          {overdueList.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-foreground">No overdue follow-ups</p>
              <p className="text-xs mt-0.5">All scheduled client communications are up to date.</p>
            </div>
          ) : (
            overdueList.map((f) => {
              const daysAgo = differenceInDays(new Date(), parseISO(f.scheduled_at));
              const client = f.lead?.client;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/${f.lead_id}`}
                        className="font-medium text-sm text-foreground hover:underline truncate"
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {daysAgo === 0 ? "Due Earlier" : `${daysAgo}d overdue`}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        via {f.contact_method}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground/80">Action:</span>{" "}
                      {f.notes || f.lead?.next_action || "Reach out to discuss requirements"}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                      <span>Event: {f.lead?.event_type}</span>
                      <span>•</span>
                      <span>Last contact: {formatDate(f.lead?.last_contacted_at) || "None"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {client && (client.phone || client.whatsapp) && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${(client.whatsapp || client.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hi ${client.name || "there"}! This is Dlight Studios following up regarding your ${f.lead?.event_type || "photography"} enquiry.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp client"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCompleteFollowUp(f.id, client?.name || "Client")}
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 2. FOLLOW-UPS DUE TODAY */}
      <Card className="border-amber-200/80 shadow-xs dark:border-amber-900/50">
        <CardHeader className="pb-3 border-b bg-amber-50/20 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-100 p-1 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  Follow-ups Due Today
                </CardTitle>
                <CardDescription className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  Calls, messages, and deliverables scheduled for today
                </CardDescription>
              </div>
            </div>
            <Badge variant="warning" className="text-xs">
              {todayList.length} Due
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
          {todayList.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2 opacity-70" />
              <p className="font-medium text-foreground">No follow-ups due today</p>
              <p className="text-xs mt-0.5">Check upcoming schedule or add a new enquiry.</p>
            </div>
          ) : (
            todayList.map((f) => {
              const client = f.lead?.client;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/${f.lead_id}`}
                        className="font-medium text-sm text-foreground hover:underline truncate"
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                        {f.contact_method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground/80">Next:</span>{" "}
                      {f.notes || f.lead?.next_action || "Follow up on requirements"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Status: {f.lead?.lead_status}</span>
                      <span>•</span>
                      <span>Scheduled: {formatDateTime(f.scheduled_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {client && (client.phone || client.whatsapp) && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${(client.whatsapp || client.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hi ${client.name || "there"}! This is Dlight Studios following up regarding your ${f.lead?.event_type || "photography"} enquiry.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp client"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCompleteFollowUp(f.id, client?.name || "Client")}
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 3. QUOTATIONS AWAITING RESPONSE */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-50 p-1 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Quotations Awaiting Response</CardTitle>
                <CardDescription className="text-xs">
                  Proposals sent to clients waiting for confirmation or feedback
                </CardDescription>
              </div>
            </div>
            <Link
              href="/crm?view=quotations"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
          {pendingQuotations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground">No pending quotations</p>
              <p className="text-xs mt-0.5">Send a quotation from any lead detail view.</p>
            </div>
          ) : (
            pendingQuotations.map((q) => {
              const daysWaiting = q.sent_at
                ? differenceInDays(new Date(), parseISO(q.sent_at))
                : 0;
              const client = q.lead?.client;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/${q.lead_id}`}
                        className="font-medium text-sm text-foreground hover:underline truncate"
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                        {q.quotation_number}
                      </Badge>
                      <Badge
                        variant={q.status === "Viewed" ? "purple" : "info"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {q.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(q.amount)}
                      </span>
                      <span>•</span>
                      <span>Sent {formatDate(q.sent_at)}</span>
                      <span>•</span>
                      <span className={daysWaiting >= 3 ? "text-amber-600 font-medium" : ""}>
                        {daysWaiting === 0 ? "Sent today" : `${daysWaiting} days waiting`}
                      </span>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                    <Link href={`/crm/${q.lead_id}`}>
                      <span>Review</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 4. ACTIVE NEGOTIATIONS */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-purple-50 p-1 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <MessageSquareQuote className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Active Negotiations</CardTitle>
                <CardDescription className="text-xs">
                  Clients actively discussing pricing, dates, and package deliverables
                </CardDescription>
              </div>
            </div>
            <Link
              href="/crm?view=negotiations"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
          {negotiatingLeads.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquareQuote className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground">No active negotiations</p>
              <p className="text-xs mt-0.5">Leads in discussion stage will appear here.</p>
            </div>
          ) : (
            negotiatingLeads.map((lead) => {
              const latestQuotation = lead.quotations?.[0];
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/crm/${lead.id}`}
                        className="font-medium text-sm text-foreground hover:underline truncate"
                      >
                        {lead.client?.name}
                      </Link>
                      <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                        {lead.event_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground/80">Next Step:</span>{" "}
                      {lead.next_action || "Revise deliverables proposal"}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Budget: {formatCurrency(lead.budget)}</span>
                      {latestQuotation && (
                        <>
                          <span>•</span>
                          <span>Quote: {formatCurrency(latestQuotation.amount)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Updated {formatDate(lead.updated_at)}</span>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                    <Link href={`/crm/${lead.id}`}>
                      <span>Discuss</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
