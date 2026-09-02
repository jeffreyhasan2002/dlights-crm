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
    if (updatedQuotation.status === "Accepted") {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === updatedQuotation.lead_id ? { ...l, lead_status: "Accepted / Booked" } : l
        )
      );
      setFollowUps((prev) =>
        prev.map((f) =>
          f.lead_id === updatedQuotation.lead_id && !f.completed_at
            ? { ...f, completed_at: new Date().toISOString(), notes: (f.notes ? f.notes + " • " : "") + "Quotation Accepted" }
            : f
        )
      );
    } else if (updatedQuotation.status === "Rejected") {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === updatedQuotation.lead_id ? { ...l, lead_status: "Rejected / Lost" } : l
        )
      );
      setFollowUps((prev) =>
        prev.map((f) =>
          f.lead_id === updatedQuotation.lead_id && !f.completed_at
            ? { ...f, completed_at: new Date().toISOString(), notes: (f.notes ? f.notes + " • " : "") + "Quotation Rejected" }
            : f
        )
      );
    } else if (updatedQuotation.status === "Negotiating") {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === updatedQuotation.lead_id ? { ...l, lead_status: "Negotiation" } : l
        )
      );
    }
  };

  const handleFollowUpComplete = (followUpId: string, updatedFollowUp: FollowUp) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === followUpId ? updatedFollowUp : f))
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

  // Dynamic Live Counts
  const totalEnquiries = leads.length;
  const negotiationsCount = leads.filter((l) => l.lead_status === "Negotiation").length;
  const bookedCount = leads.filter((l) => l.lead_status === "Accepted / Booked").length;
  const lostCount = leads.filter((l) => l.lead_status === "Rejected / Lost").length;
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
        {activeTab === "all" && <CRMTableView initialLeads={leads} />}
        {activeTab === "kanban" && (
          <CRMKanbanBoard
            initialLeads={leads}
            onLeadStatusChange={handleLeadStatusChange}
          />
        )}
        {activeTab === "followups" && (
          <FollowUpsView
            initialFollowUps={followUps}
            onFollowUpComplete={handleFollowUpComplete}
          />
        )}
        {activeTab === "quotations" && (
          <QuotationsView
            initialQuotations={quotations}
            onQuotationUpdate={handleQuotationUpdate}
          />
        )}
        {activeTab === "negotiations" && <NegotiationsView leads={leads} />}
        {activeTab === "booked" && <BookedView leads={leads} bookings={bookings} />}
        {activeTab === "lost" && <LostView leads={leads} />}
      </div>
    </div>
  );
}
