"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  IndianRupee,
  MoreVertical,
  Plus,
  ArrowRight,
  Phone,
  MessageCircle,
  AlertCircle,
  FileText,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { LeadWithDetails, LeadStatus, ContactStatus } from "@/types/crm";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { updateLeadStatusServerAction, deleteLeadServerAction } from "@/lib/crm-actions";

const PIPELINE_COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: "New Enquiry", title: "New Enquiry", color: "border-blue-500/30 bg-blue-50/10" },
  { id: "Contacted", title: "Contacted", color: "border-sky-500/30 bg-sky-50/10" },
  { id: "Follow-up Required", title: "Follow-up Required", color: "border-amber-500/30 bg-amber-50/10" },
  { id: "Quotation Sent", title: "Quotation Sent", color: "border-indigo-500/30 bg-indigo-50/10" },
  { id: "Negotiation", title: "Negotiation", color: "border-purple-500/30 bg-purple-50/10" },
  { id: "Accepted / Booked", title: "Accepted / Booked", color: "border-emerald-500/30 bg-emerald-50/10" },
  { id: "Rejected / Lost", title: "Rejected / Lost", color: "border-zinc-500/30 bg-zinc-50/10" },
];

interface CRMKanbanBoardProps {
  initialLeads: LeadWithDetails[];
  onLeadStatusChange?: (leadId: string, targetStatus: LeadStatus) => void;
}

export function CRMKanbanBoard({ initialLeads, onLeadStatusChange }: CRMKanbanBoardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithDetails[]>(initialLeads);
  const [leadToDelete, setLeadToDelete] = useState<LeadWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteLeadServerAction(leadToDelete.id);
      if (res.success) {
        toast.success(`${leadToDelete.client?.name || "Lead"} deleted successfully.`);
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
        setLeadToDelete(null);
        router.refresh();
      } else {
        toast.error("Failed to delete lead", { description: (res as any)?.error });
      }
    } catch {
      toast.error("An error occurred while deleting lead.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter leads based on live debounced search
  const filteredLeads = useMemo(() => {
    if (!debouncedSearch.trim()) return leads;
    const term = debouncedSearch.toLowerCase().trim();
    return leads.filter((l) => {
      const matchName = l.client?.name?.toLowerCase().includes(term);
      const matchPhone = l.client?.phone?.includes(term);
      const matchEvent = l.event_type?.toLowerCase().includes(term);
      const matchLoc = l.location?.toLowerCase().includes(term);
      const matchAction = l.next_action?.toLowerCase().includes(term);
      return matchName || matchPhone || matchEvent || matchLoc || matchAction;
    });
  }, [leads, debouncedSearch]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    setDraggingLeadId(null);

    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.lead_status === targetStatus) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_status: targetStatus } : l))
    );
    if (onLeadStatusChange) {
      onLeadStatusChange(leadId, targetStatus);
    }

    try {
      const res = await updateLeadStatusServerAction(leadId, targetStatus);
      if (res.success) {
        toast.success(`Moved ${lead.client?.name || "lead"} to "${targetStatus}"`);
        router.refresh();
      } else {
        toast.error("Failed to update lead status");
        setLeads(initialLeads);
      }
    } catch {
      toast.error("An error occurred while moving lead");
      setLeads(initialLeads);
    }
  };

  const handleStatusSelect = async (leadId: string, targetStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.lead_status === targetStatus) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_status: targetStatus } : l))
    );
    if (onLeadStatusChange) {
      onLeadStatusChange(leadId, targetStatus);
    }

    try {
      const res = await updateLeadStatusServerAction(leadId, targetStatus);
      if (res.success) {
        toast.success(`Status updated to "${targetStatus}"`);
        router.refresh();
      } else {
        setLeads(initialLeads);
      }
    } catch {
      setLeads(initialLeads);
    }
  };

  const getContactBadge = (status: ContactStatus) => {
    switch (status) {
      case "Responded":
        return <Badge variant="success" className="text-[10px] px-1.5 py-0">Responded</Badge>;
      case "Contacted – Waiting for Response":
        return <Badge variant="info" className="text-[10px] px-1.5 py-0">Waiting</Badge>;
      case "No Response":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">No Response</Badge>;
      case "Not Contacted":
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Not Contacted</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Fast Search Filter for client tracking board */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search client tracking board..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> leads
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[calc(100vh-280px)]">
        {PIPELINE_COLUMNS.map((column) => {
          const columnLeads = filteredLeads.filter((l) => l.lead_status === column.id);
          const totalBudget = columnLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex w-80 flex-col shrink-0 rounded-xl border bg-muted/20 p-2.5 transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {column.title}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-mono px-1.5 py-0">
                    {columnLeads.length}
                  </Badge>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatCurrency(totalBudget)}
                </span>
              </div>

              {/* Column Cards Container with sleek thin scrollbar */}
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-320px)] p-0.5 pr-1">
                {columnLeads.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground min-h-[120px]">
                    Drop client leads here
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const overdue = isOverdue(lead.next_follow_up_at);
                    const latestQuotation = lead.quotations?.[0];
                    const pendingFollowUps = (lead.follow_ups || []).filter((f) => !f.completed_at);
                    const completedFollowUpsCount = (lead.follow_ups || []).filter((f) => !!f.completed_at).length;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${
                          draggingLeadId === lead.id ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        <Card
                          onClick={() => router.push(`/crm/${lead.id}`)}
                          className="shadow-xs hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <CardContent className="p-3.5 space-y-2.5">
                            {/* Client Name & Quick Options */}
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {lead.client?.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                    {lead.event_type}
                                  </Badge>
                                  {lead.location && (
                                    <span className="truncate max-w-[130px]">{lead.location}</span>
                                  )}
                                </div>
                              </div>

                              <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0 hover:bg-muted"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel className="text-xs">Move Stage</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {PIPELINE_COLUMNS.map((col) => (
                                      <DropdownMenuItem
                                        key={col.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusSelect(lead.id, col.id);
                                        }}
                                        disabled={lead.lead_status === col.id}
                                        className="text-xs"
                                      >
                                        {col.title}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link href={`/crm/${lead.id}`} className="text-xs">
                                        Open Full Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLeadToDelete(lead);
                                      }}
                                      className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                      <span>Delete Lead</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Budget & Contact Status */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t">
                              <span className="font-semibold text-foreground">
                                {formatCurrency(lead.budget)}
                              </span>
                              {getContactBadge(lead.contact_status)}
                            </div>

                            {/* Live Quotation Badge */}
                            {latestQuotation && (
                              <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="h-3 w-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                                    {latestQuotation.quotation_number}
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(latestQuotation.amount ?? latestQuotation.total_amount ?? 0)}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    latestQuotation.status === "Accepted"
                                      ? "success"
                                      : latestQuotation.status === "Rejected"
                                      ? "destructive"
                                      : latestQuotation.status === "Negotiating"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-[9px] px-1 py-0 shrink-0 font-medium"
                                >
                                  {latestQuotation.status}
                                </Badge>
                              </div>
                            )}

                            {/* Next Action */}
                            {lead.next_action && (
                              <div className="rounded bg-muted/50 p-1.5 text-xs text-muted-foreground">
                                <p className="line-clamp-2">
                                  <span className="font-semibold text-foreground/90">Next:</span>{" "}
                                  {lead.next_action}
                                </p>
                              </div>
                            )}

                            {/* Event Date & Live Follow-up Status */}
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {lead.event_date ? formatDate(lead.event_date, "dd MMM yy") : "Date TBD"}
                              </span>

                              {lead.next_follow_up_at ? (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    overdue ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                                  }`}
                                  title={`Next scheduled follow-up: ${formatDate(lead.next_follow_up_at)}`}
                                >
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {overdue ? "Overdue" : formatDate(lead.next_follow_up_at, "dd MMM")}
                                </span>
                              ) : completedFollowUpsCount > 0 ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ {completedFollowUpsCount} done
                                </span>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Lead Confirmation Modal */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Enquiry & Lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">{leadToDelete?.client?.name}</strong> ({leadToDelete?.event_type})?
              </p>
              <p className="text-destructive font-medium">
                This will delete all quotations, booking contracts, follow-ups, and timeline history associated with this lead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { CRMKanbanBoard as CRMClientTrackingBoard };
