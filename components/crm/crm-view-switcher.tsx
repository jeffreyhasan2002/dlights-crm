"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table as TableIcon,
  Kanban as KanbanIcon,
  Clock,
  FileText,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";

import { LeadWithDetails, FollowUp, Quotation, Booking, LeadStatus } from "@/types/crm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CRMTableView } from "@/components/crm/crm-table-view";
import { CRMKanbanBoard } from "@/components/crm/crm-kanban-board";
import { FollowUpsView } from "@/components/crm/follow-ups-view";
import { QuotationsView } from "@/components/crm/quotations-view";
import { NegotiationsView } from "@/components/crm/negotiations-view";
import { BookedView } from "@/components/crm/booked-view";
import { LostView } from "@/components/crm/lost-view";
import { NewEnquiryDialog } from "@/components/forms/new-enquiry-dialog";

interface CRMViewSwitcherProps {
  leads: LeadWithDetails[];
  followUps: FollowUp[];
  quotations: Quotation[];
  bookings: Booking[];
  defaultView?: string;
}

export function CRMViewSwitcher({
  leads: serverLeads,
  followUps: serverFollowUps,
  quotations: serverQuotations,
  bookings: serverBookings,
  defaultView = "all",
}: CRMViewSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("view") || defaultView;

  const [leads, setLeads] = useState<LeadWithDetails[]>(serverLeads);
  const [followUps, setFollowUps] = useState<FollowUp[]>(serverFollowUps);
  const [quotations, setQuotations] = useState<Quotation[]>(serverQuotations);
  const [bookings, setBookings] = useState<Booking[]>(serverBookings);

  // Keep state synchronized with server props
  useEffect(() => {
    setLeads(serverLeads);
  }, [serverLeads]);

  useEffect(() => {
    setFollowUps(serverFollowUps);
  }, [serverFollowUps]);

  useEffect(() => {
    setQuotations(serverQuotations);
  }, [serverQuotations]);

  useEffect(() => {
    setBookings(serverBookings);
  }, [serverBookings]);

  // Instant local state mutators for zero-latency UI updates
  const handleLeadStatusChange = (leadId: string, targetStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_status: targetStatus } : l))
    );

    // If deal is accepted or lost, automatically complete pending follow-ups for this lead
    if (targetStatus === "Accepted / Booked" || targetStatus === "Rejected / Lost") {
      setFollowUps((prev) =>
        prev.map((f) =>
          f.lead_id === leadId && !f.completed_at
            ? { ...f, completed_at: new Date().toISOString(), notes: (f.notes ? f.notes + " • " : "") + `Deal marked as ${targetStatus}` }
            : f
        )
      );
    }
  };

  const handleQuotationUpdate = (updatedQuotation: Quotation) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === updatedQuotation.id ? updatedQuotation : q))
    );

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === updatedQuotation.lead_id) {
          const updatedQuotes = (l.quotations || []).map((q) =>
            q.id === updatedQuotation.id ? updatedQuotation : q
          );
          if (!updatedQuotes.some((q) => q.id === updatedQuotation.id)) {
            updatedQuotes.unshift(updatedQuotation);
          }

          let targetStatus = l.lead_status;
          if (updatedQuotation.status === "Accepted") targetStatus = "Accepted / Booked";
          else if (updatedQuotation.status === "Rejected") targetStatus = "Rejected / Lost";
          else if (updatedQuotation.status === "Negotiating") targetStatus = "Negotiation";
          else if (updatedQuotation.status === "Sent") targetStatus = "Quotation Sent";

          return {
            ...l,
            quotations: updatedQuotes,
            budget: updatedQuotation.amount || updatedQuotation.total_amount || l.budget,
            lead_status: targetStatus,
          };
        }
        return l;
      })
    );

    if (updatedQuotation.status === "Accepted" || updatedQuotation.status === "Rejected") {
      setFollowUps((prev) =>
        prev.map((f) =>
          f.lead_id === updatedQuotation.lead_id && !f.completed_at
            ? {
                ...f,
                completed_at: new Date().toISOString(),
                notes: (f.notes ? f.notes + " • " : "") + `Quotation ${updatedQuotation.status}`,
              }
            : f
        )
      );
    }
  };

  const handleFollowUpComplete = (followUpId: string, updatedFollowUp: FollowUp) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === followUpId ? updatedFollowUp : f))
    );

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === updatedFollowUp.lead_id) {
          const updatedFollowUps = (l.follow_ups || []).map((f) =>
            f.id === followUpId ? updatedFollowUp : f
          );
          if (!updatedFollowUps.some((f) => f.id === followUpId)) {
            updatedFollowUps.unshift(updatedFollowUp);
          }

          const remainingPending = updatedFollowUps.filter((f) => !f.completed_at);
          const nextPending = remainingPending.sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          )[0];

          return {
            ...l,
            follow_ups: updatedFollowUps,
            next_follow_up_at: nextPending?.scheduled_at || null,
            next_action: nextPending?.notes || l.next_action,
            follow_up_count: (l.follow_up_count || 0) + 1,
            contact_status: "Responded",
          };
        }
        return l;
      })
    );
  };

  const handleTabChange = (view: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (view === "all") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const queryString = params.toString();
    router.push(`/crm${queryString ? `?${queryString}` : ""}`);
  };

  // Enrich leads with latest real-time followUps, quotations, and bookings
  const enrichedLeads = React.useMemo(() => {
    const quotationMap = new Map<string, Quotation[]>();
    for (const q of quotations) {
      if (q.lead_id) {
        const arr = quotationMap.get(q.lead_id) || [];
        arr.push(q);
        quotationMap.set(q.lead_id, arr);
      }
    }

    const followUpMap = new Map<string, FollowUp[]>();
    for (const f of followUps) {
      if (f.lead_id) {
        const arr = followUpMap.get(f.lead_id) || [];
        arr.push(f);
        followUpMap.set(f.lead_id, arr);
      }
    }

    const bookingMap = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.lead_id) {
        const arr = bookingMap.get(b.lead_id) || [];
        arr.push(b);
        bookingMap.set(b.lead_id, arr);
      }
    }

    return leads.map((lead) => {
      const leadQuotations = quotationMap.get(lead.id) || lead.quotations || [];
      const leadFollowUps = followUpMap.get(lead.id) || lead.follow_ups || [];
      const leadBookings = bookingMap.get(lead.id) || lead.bookings || [];

      // Determine next follow-up from either lead.next_follow_up_at or pending follow-ups
      const pendingFollowUps = leadFollowUps.filter((f) => !f.completed_at);
      const nextPendingFollowUp = pendingFollowUps.sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )[0];

      const nextFollowUpAt = nextPendingFollowUp?.scheduled_at || lead.next_follow_up_at;

      return {
        ...lead,
        quotations: leadQuotations,
        follow_ups: leadFollowUps,
        bookings: leadBookings,
        next_follow_up_at: nextFollowUpAt,
      };
    });
  }, [leads, quotations, followUps, bookings]);

  // Dynamic Live Counts
  const totalEnquiries = enrichedLeads.length;
  const negotiationsCount = enrichedLeads.filter((l) => l.lead_status === "Negotiation").length;
  const bookedCount = enrichedLeads.filter((l) => l.lead_status === "Accepted / Booked").length;
  const lostCount = enrichedLeads.filter((l) => l.lead_status === "Rejected / Lost").length;
  const pendingFollowUpsCount = followUps.filter((f) => !f.completed_at).length;
  const activeQuotationsCount = quotations.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Client CRM & Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage enquiries, quotations, follow-ups, and booking conversions.
          </p>
        </div>

        <NewEnquiryDialog
          trigger={
            <Button className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Add Enquiry</span>
            </Button>
          }
        />
      </div>

      {/* Primary Tab Switcher */}
      <div className="border-b pb-1">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap justify-start">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>All Enquiries ({totalEnquiries})</span>
            </TabsTrigger>

            <TabsTrigger
              value="kanban"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <KanbanIcon className="h-3.5 w-3.5 text-primary" />
              <span>Kanban Board</span>
            </TabsTrigger>

            <TabsTrigger
              value="followups"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Follow-ups ({pendingFollowUpsCount})</span>
            </TabsTrigger>

            <TabsTrigger
              value="quotations"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              <span>Quotations ({activeQuotationsCount})</span>
            </TabsTrigger>

            <TabsTrigger
              value="negotiations"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <MessageSquareQuote className="h-3.5 w-3.5 text-purple-500" />
              <span>Negotiations ({negotiationsCount})</span>
            </TabsTrigger>

            <TabsTrigger
              value="booked"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Booked ({bookedCount})</span>
            </TabsTrigger>

            <TabsTrigger
              value="lost"
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 py-1.5 rounded-md gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Lost ({lostCount})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Render Active View Component */}
      <div>
        {activeTab === "all" && <CRMTableView initialLeads={enrichedLeads} />}
        {activeTab === "kanban" && (
          <CRMKanbanBoard
            initialLeads={enrichedLeads}
            onLeadStatusChange={handleLeadStatusChange}
          />
        )}
        {activeTab === "followups" && (
          <FollowUpsView
            initialFollowUps={followUps}
            leads={enrichedLeads}
            onFollowUpComplete={handleFollowUpComplete}
          />
        )}
        {activeTab === "quotations" && (
          <QuotationsView
            initialQuotations={quotations}
            leads={enrichedLeads}
            onQuotationUpdate={handleQuotationUpdate}
          />
        )}
        {activeTab === "negotiations" && <NegotiationsView leads={enrichedLeads} />}
        {activeTab === "booked" && <BookedView leads={enrichedLeads} bookings={bookings} />}
        {activeTab === "lost" && <LostView leads={enrichedLeads} />}
      </div>
    </div>
  );
}
