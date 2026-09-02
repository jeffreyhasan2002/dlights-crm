"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Calendar,
  IndianRupee,
  Clock,
  Phone,
  MessageCircle,
  X,
} from "lucide-react";

import { LeadWithDetails, LeadStatus, ContactStatus, EventType } from "@/types/crm";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteLeadServerAction } from "@/lib/crm-actions";

import { useDebounce } from "@/hooks/use-debounce";

interface CRMTableViewProps {
  initialLeads: LeadWithDetails[];
}

export function CRMTableView({ initialLeads }: CRMTableViewProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithDetails[]>(initialLeads);
  const [leadToDelete, setLeadToDelete] = useState<LeadWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [statusFilter, setStatusFilter] = useState("All");
  const [contactStatusFilter, setContactStatusFilter] = useState("All");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [sortField, setSortField] = useState<"created_at" | "budget" | "event_date" | "name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (statusFilter !== "All" && lead.lead_status !== statusFilter) return false;
        if (contactStatusFilter !== "All" && lead.contact_status !== contactStatusFilter) return false;
        if (eventTypeFilter !== "All" && lead.event_type !== eventTypeFilter) return false;

        if (debouncedSearch.trim()) {
          const term = debouncedSearch.toLowerCase().trim();
          const matchName = lead.client?.name?.toLowerCase().includes(term);
          const matchPhone = lead.client?.phone?.includes(term);
          const matchEmail = lead.client?.email?.toLowerCase().includes(term);
          const matchLoc = lead.location?.toLowerCase().includes(term);
          const matchEvent = lead.event_type.toLowerCase().includes(term);
          const matchAction = lead.next_action?.toLowerCase().includes(term);
          if (!matchName && !matchPhone && !matchEmail && !matchLoc && !matchEvent && !matchAction) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof LeadWithDetails];
        let valB: any = b[sortField as keyof LeadWithDetails];

        if (sortField === "name") {
          valA = a.client?.name || "";
          valB = b.client?.name || "";
        }

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (sortOrder === "asc") {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [leads, debouncedSearch, statusFilter, contactStatusFilter, eventTypeFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setContactStatusFilter("All");
    setEventTypeFilter("All");
    setPage(1);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case "New Enquiry":
        return <Badge variant="info">New Enquiry</Badge>;
      case "Contacted":
        return <Badge variant="secondary">Contacted</Badge>;
      case "Follow-up Required":
        return <Badge variant="warning">Follow-up Req</Badge>;
      case "Quotation Sent":
        return <Badge variant="default">Quote Sent</Badge>;
      case "Negotiation":
        return <Badge variant="purple">Negotiation</Badge>;
      case "Accepted / Booked":
        return <Badge variant="success">Accepted / Booked</Badge>;
      case "Rejected / Lost":
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, email, venue..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-sm"
            />
          </div>

          {/* Lead Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] text-xs">
              <SelectValue placeholder="Lead Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stages</SelectItem>
              <SelectItem value="New Enquiry">New Enquiry</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
              <SelectItem value="Quotation Sent">Quotation Sent</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Accepted / Booked">Accepted / Booked</SelectItem>
              <SelectItem value="Rejected / Lost">Rejected / Lost</SelectItem>
            </SelectContent>
          </Select>

          {/* Event Type Filter */}
          <Select
            value={eventTypeFilter}
            onValueChange={(val) => {
              setEventTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] text-xs">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Events</SelectItem>
              <SelectItem value="Wedding">Wedding</SelectItem>
              <SelectItem value="Engagement">Engagement</SelectItem>
              <SelectItem value="Sangeet">Sangeet</SelectItem>
              <SelectItem value="Reception">Reception</SelectItem>
              <SelectItem value="Muhurtham">Muhurtham</SelectItem>
              <SelectItem value="Pre-Wedding">Pre-Wedding</SelectItem>
              <SelectItem value="Birthday">Birthday</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>

          {/* Contact Status Filter */}
          <Select
            value={contactStatusFilter}
            onValueChange={(val) => {
              setContactStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder="Contact Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Contact Status</SelectItem>
              <SelectItem value="Not Contacted">Not Contacted</SelectItem>
              <SelectItem value="Contacted – Waiting for Response">Waiting for Response</SelectItem>
              <SelectItem value="Responded">Responded</SelectItem>
              <SelectItem value="No Response">No Response</SelectItem>
            </SelectContent>
          </Select>

          {(search || statusFilter !== "All" || contactStatusFilter !== "All" || eventTypeFilter !== "All") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground self-center">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> results
        </div>
      </div>

      {/* CRM Data Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[200px] cursor-pointer" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1">
                  <span>Client / Couple</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </TableHead>
              <TableHead>Event & Location</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("event_date")}>
                <div className="flex items-center gap-1">
                  <span>Shoot Date</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Contact Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("budget")}>
                <div className="flex items-center gap-1">
                  <span>Budget</span>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </TableHead>
              <TableHead>Next Action</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-36 text-center text-sm text-muted-foreground">
                  No client enquiries match the active filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => {
                const overdue = isOverdue(lead.next_follow_up_at);
                const quote = lead.quotations?.[0];

                return (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    {/* Client Name & Contacts */}
                    <TableCell className="font-medium">
                      <div>
                        <Link
                          href={`/crm/${lead.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {lead.client?.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                          <span>{lead.client?.phone || "No phone"}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Event & Location */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {lead.event_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {lead.location || "Location TBD"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Event Date */}
                    <TableCell className="text-xs">
                      {lead.event_date ? (
                        <span className="font-medium">{formatDate(lead.event_date)}</span>
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
                      )}
                    </TableCell>

                    {/* Lead Stage */}
                    <TableCell>{getStatusBadge(lead.lead_status)}</TableCell>

                    {/* Contact Status */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {lead.contact_status}
                      </span>
                    </TableCell>

                    {/* Budget & Quote */}
                    <TableCell>
                      <div>
                        <span className="font-semibold text-xs text-foreground">
                          {formatCurrency(lead.budget)}
                        </span>
                        {quote && (
                          <p className="text-[10px] text-muted-foreground">
                            Quote: {formatCurrency(quote.amount)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Next Action */}
                    <TableCell className="max-w-[200px]">
                      <p className="text-xs text-muted-foreground truncate" title={lead.next_action || ""}>
                        {lead.next_action || "—"}
                      </p>
                    </TableCell>

                    {/* Next Follow up */}
                    <TableCell>
                      {lead.next_follow_up_at ? (
                        <div
                          className={`text-xs font-medium ${
                            overdue ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          <span>{formatDate(lead.next_follow_up_at, "dd MMM")}</span>
                          {overdue && <p className="text-[10px] text-destructive">Overdue</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Action Menu */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                          <Link href={`/crm/${lead.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>View</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLeadToDelete(lead)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <div>
            Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
