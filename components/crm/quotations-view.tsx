"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  Eye,
  Plus,
  ArrowUpRight,
  IndianRupee,
  Clock,
  Loader2,
  Trash2,
  Search,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Quotation, RejectionReason, LeadWithDetails, LeadStatus } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendQuotationServerAction,
  acceptQuotationServerAction,
  rejectQuotationServerAction,
  startNegotiationServerAction,
  deleteQuotationServerAction,
  createQuotationServerAction,
} from "@/lib/crm-actions";

interface QuotationsViewProps {
  initialQuotations: Quotation[];
  leads?: LeadWithDetails[];
  onQuotationUpdate?: (updatedQuotation: Quotation) => void;
  onQuotationCreate?: (newQuotation: Quotation) => void;
  onQuotationDelete?: (quotationId: string, leadId?: string) => void;
  onLeadStatusChange?: (leadId: string, targetStatus: LeadStatus) => void;
}

export function QuotationsView({
  initialQuotations,
  leads = [],
  onQuotationUpdate,
  onQuotationCreate,
  onQuotationDelete,
  onLeadStatusChange,
}: QuotationsViewProps) {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [tab, setTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "amount-desc" | "amount-asc" | "expiring">("newest");

  // Rejection modal state
  const [rejectingQuote, setRejectingQuote] = useState<Quotation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>("Price too high");
  const [rejectionReasonOther, setRejectionReasonOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Quotation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLeadId, setCreateLeadId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createValidUntil, setCreateValidUntil] = useState(
    () => new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [createNotes, setCreateNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();

  // Keep in sync with parent props
  React.useEffect(() => {
    setQuotations(initialQuotations);
  }, [initialQuotations]);

  const leadMap = useMemo(() => {
    return new Map(leads.map((l) => [l.id, l]));
  }, [leads]);

  // When a lead is selected in New Quotation dialog, auto-fill budget if available
  const handleLeadSelect = (leadId: string) => {
    setCreateLeadId(leadId);
    const selectedLead = leadMap.get(leadId);
    if (selectedLead?.budget && !createAmount) {
      setCreateAmount(String(selectedLead.budget));
    }
  };

  const updateLocalQuoteStatus = (id: string, updates: Partial<Quotation>) => {
    const existing = quotations.find((q) => q.id === id);
    const updated: Quotation | undefined = existing ? { ...existing, ...updates } : undefined;

    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    if (onQuotationUpdate && updated) {
      onQuotationUpdate(updated);
    }
  };

  // Filter & Search
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        // Tab Filter
        if (tab !== "All") {
          if (tab === "Negotiating") {
            if (q.status !== "Negotiating") return false;
          } else if (q.status.toLowerCase() !== tab.toLowerCase()) {
            return false;
          }
        }

        // Text Search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const lead = q.lead || leadMap.get(q.lead_id);
          const clientName = lead?.client?.name?.toLowerCase() || "";
          const eventType = lead?.event_type?.toLowerCase() || "";
          const quoteNum = q.quotation_number.toLowerCase();
          const notes = (q.notes || "").toLowerCase();

          if (
            !quoteNum.includes(query) &&
            !clientName.includes(query) &&
            !eventType.includes(query) &&
            !notes.includes(query)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "amount-desc") {
          return (b.amount || 0) - (a.amount || 0);
        }
        if (sortBy === "amount-asc") {
          return (a.amount || 0) - (b.amount || 0);
        }
        if (sortBy === "expiring") {
          if (!a.valid_until) return 1;
          if (!b.valid_until) return -1;
          return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
        }
        // default: newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [quotations, tab, searchQuery, sortBy, leadMap]);

  // Actions
  const handleSend = async (q: Quotation) => {
    updateLocalQuoteStatus(q.id, { status: "Sent", sent_at: new Date().toISOString() });
    if (onLeadStatusChange && q.lead_id) {
      onLeadStatusChange(q.lead_id, "Quotation Sent");
    }
    toast.success(`Quotation ${q.quotation_number} marked as Sent!`);

    try {
      await sendQuotationServerAction(q.id, q.lead_id);
      router.refresh();
    } catch {
      toast.error("Failed to sync quotation update with server");
      setQuotations(initialQuotations);
    }
  };

  const handleAccept = async (q: Quotation) => {
    updateLocalQuoteStatus(q.id, { status: "Accepted", accepted_at: new Date().toISOString() });
    if (onLeadStatusChange && q.lead_id) {
      onLeadStatusChange(q.lead_id, "Accepted / Booked");
    }
    toast.success(`Quotation ${q.quotation_number} Accepted! Booking confirmed.`);

    try {
      await acceptQuotationServerAction(q.id, q.lead_id);
      router.refresh();
    } catch {
      toast.error("Failed to accept quotation on server");
      setQuotations(initialQuotations);
    }
  };

  const handleNegotiate = async (q: Quotation) => {
    updateLocalQuoteStatus(q.id, { status: "Negotiating" });
    if (onLeadStatusChange && q.lead_id) {
      onLeadStatusChange(q.lead_id, "Negotiation");
    }
    toast.info(`Quotation ${q.quotation_number} moved to Negotiation stage.`);

    try {
      await startNegotiationServerAction(q.id, "Client requested package negotiation", q.lead_id);
      router.refresh();
    } catch {
      toast.error("Failed to update quotation negotiation");
      setQuotations(initialQuotations);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingQuote) return;
    if (rejectionReason === "Other" && !rejectionReasonOther.trim()) {
      toast.error("Please provide custom rejection reason details.");
      return;
    }

    const q = rejectingQuote;
    updateLocalQuoteStatus(q.id, {
      status: "Rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
      rejection_reason_other: rejectionReason === "Other" ? rejectionReasonOther : undefined,
    });
    if (onLeadStatusChange && q.lead_id) {
      onLeadStatusChange(q.lead_id, "Rejected / Lost");
    }
    toast.error(`Quotation ${q.quotation_number} marked as Lost.`);
    setRejectingQuote(null);
    setRejectionReasonOther("");

    try {
      setIsSubmitting(true);
      await rejectQuotationServerAction(
        q.id,
        rejectionReason,
        rejectionReason === "Other" ? rejectionReasonOther : undefined,
        q.lead_id
      );
      router.refresh();
    } catch {
      toast.error("Failed to reject quotation on server");
      setQuotations(initialQuotations);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuotation = async (q: Quotation) => {
    const qId = q.id;
    const leadId = q.lead_id;
    setQuotations((prev) => prev.filter((item) => item.id !== qId));
    if (onQuotationDelete) {
      onQuotationDelete(qId, leadId);
    }
    if (onLeadStatusChange && leadId) {
      onLeadStatusChange(leadId, "Contacted");
    }
    toast.success(`Quotation ${q.quotation_number} deleted.`);
    try {
      await deleteQuotationServerAction(qId, leadId);
      router.refresh();
    } catch {
      toast.error("Failed to delete quotation from server");
      setQuotations(initialQuotations);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLeadId) {
      toast.error("Please select a client / enquiry.");
      return;
    }

    const amountNum = parseFloat(createAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid quotation amount in ₹.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createQuotationServerAction({
        leadId: createLeadId,
        amount: amountNum,
        validUntil: createValidUntil || undefined,
        notes: createNotes.trim() || undefined,
      });

      const selectedLead = leadMap.get(createLeadId);
      const qNum =
        res?.quotation?.quotation_number ||
        `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      const newQuote: Quotation = {
        id: res?.quotation?.id || `q-${Date.now()}`,
        lead_id: createLeadId,
        owner_id: selectedLead?.owner_id || "",
        quotation_number: qNum,
        status: "Sent",
        amount: amountNum,
        total_amount: amountNum,
        valid_until: createValidUntil,
        sent_at: new Date().toISOString(),
        notes: createNotes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lead: selectedLead,
      };

      setQuotations((prev) => [newQuote, ...prev.filter((q) => q.id !== newQuote.id)]);

      if (onQuotationCreate) {
        onQuotationCreate(newQuote);
      } else if (onQuotationUpdate) {
        onQuotationUpdate(newQuote);
      }

      toast.success(`Quotation ${qNum} created & sent to client!`);
      setIsCreateOpen(false);
      setCreateLeadId("");
      setCreateAmount("");
      setCreateNotes("");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create quotation");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: Quotation["status"]) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline" className="text-[10px] font-medium">Draft</Badge>;
      case "Sent":
        return <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[10px] font-medium">Sent</Badge>;
      case "Viewed":
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-[10px] font-medium">Viewed</Badge>;
      case "Negotiating":
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-medium">Negotiating</Badge>;
      case "Accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-medium">Accepted</Badge>;
      case "Rejected":
        return <Badge variant="destructive" className="text-[10px] font-medium">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-medium">{status}</Badge>;
    }
  };

  // KPI Calculations
  const totalValue = quotations.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
  const sentQuotes = quotations.filter((q) => q.status === "Sent" || q.status === "Viewed");
  const sentValue = sentQuotes.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
  const negQuotes = quotations.filter((q) => q.status === "Negotiating");
  const negValue = negQuotes.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
  const accQuotes = quotations.filter((q) => q.status === "Accepted");
  const accValue = accQuotes.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
  const rejQuotes = quotations.filter((q) => q.status === "Rejected");
  const winRate =
    quotations.length > 0
      ? Math.round((accQuotes.length / (accQuotes.length + rejQuotes.length || 1)) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Total Quotes Card */}
        <Card className="shadow-2xs bg-card border-border/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Proposals</span>
            <FileText className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-foreground sm:text-xl">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {quotations.length} total generated
            </p>
          </div>
        </Card>

        {/* Sent / Under Review Card */}
        <Card className="shadow-2xs bg-card border-border/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Sent / Under Review</span>
            <Send className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-foreground sm:text-xl">
              {formatCurrency(sentValue)}
            </div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
              {sentQuotes.length} awaiting client reply
            </p>
          </div>
        </Card>

        {/* In Negotiation Card */}
        <Card className="shadow-2xs bg-card border-border/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In Negotiation</span>
            <MessageSquareQuote className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-foreground sm:text-xl">
              {formatCurrency(negValue)}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {negQuotes.length} active discussions
            </p>
          </div>
        </Card>

        {/* Won & Booked Card */}
        <Card className="shadow-2xs bg-card border-border/70 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Won & Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 sm:text-xl">
              {formatCurrency(accValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {accQuotes.length} deals • {winRate}% win rate
            </p>
          </div>
        </Card>
      </div>

      {/* Control Bar: Search, Filters & "New Quotation" Action */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Filter Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-auto">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1">
            <TabsTrigger value="All" className="text-xs px-2.5 py-1">
              All ({quotations.length})
            </TabsTrigger>
            <TabsTrigger value="Sent" className="text-xs px-2.5 py-1">
              Sent ({sentQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="Negotiating" className="text-xs px-2.5 py-1">
              Negotiating ({negQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="Accepted" className="text-xs px-2.5 py-1">
              Accepted ({accQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="Rejected" className="text-xs px-2.5 py-1">
              Rejected ({rejQuotes.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search, Sort & Create Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search quote #, client, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
              <SelectItem value="amount-desc" className="text-xs">Amount: High → Low</SelectItem>
              <SelectItem value="amount-asc" className="text-xs">Amount: Low → High</SelectItem>
              <SelectItem value="expiring" className="text-xs">Expiring Soonest</SelectItem>
            </SelectContent>
          </Select>

          {/* New Quotation Dialog Trigger */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 shadow-2xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Quotation</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Create & Send Quotation</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Draft a formal pricing quotation and send directly to an active client enquiry.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  {/* Select Lead / Client */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Select Enquiry / Client *</Label>
                    <Select value={createLeadId} onValueChange={handleLeadSelect} required>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Choose an enquiry..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {leads.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            <span className="font-semibold text-foreground">
                              {l.client?.name || "Client"}
                            </span>{" "}
                            • <span className="text-muted-foreground">{l.event_type}</span>{" "}
                            {l.budget ? `(₹${Number(l.budget).toLocaleString("en-IN")})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount (INR) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Total Quotation Value (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        placeholder="e.g. 75000"
                        value={createAmount}
                        onChange={(e) => setCreateAmount(e.target.value)}
                        className="pl-7 text-xs font-mono font-medium"
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Validity Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valid Until (Proposal Expiry)</Label>
                    <Input
                      type="date"
                      value={createValidUntil}
                      onChange={(e) => setCreateValidUntil(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Notes / Deliverables description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Scope of Work & Notes</Label>
                    <Textarea
                      placeholder="e.g. Candid Photography + Traditional Videography, 1 Teaser, 1 Long Film, Album (30 sheets)..."
                      value={createNotes}
                      onChange={(e) => setCreateNotes(e.target.value)}
                      className="text-xs min-h-[80px]"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Quotation</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quotations List with Responsive Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuotations.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground bg-muted/10 space-y-3">
            <FileText className="h-10 w-10 mx-auto opacity-40 text-primary" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">
                {searchQuery ? "No matching quotations found" : "No quotations in this view"}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search criteria or clearing active filters."
                  : "Generate customized client proposals directly using the button above or from any lead detail view."}
              </p>
            </div>
            {!searchQuery && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs mt-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Create First Quotation</span>
              </Button>
            )}
          </div>
        ) : (
          filteredQuotations.map((q) => {
            const lead = q.lead || leadMap.get(q.lead_id);
            const client = lead?.client;

            // Check if expiring soon
            const isValidityPast = q.valid_until ? new Date(q.valid_until).getTime() < Date.now() : false;
            const isExpiringSoon =
              q.valid_until &&
              !isValidityPast &&
              new Date(q.valid_until).getTime() - Date.now() < 3 * 86400000;

            return (
              <Card
                key={q.id}
                className="shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden bg-card border-border/80"
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/70 px-2 py-0.5 rounded border border-border/80">
                          {q.quotation_number}
                        </span>
                        {getStatusBadge(q.status)}
                      </div>
                      <Link
                        href={`/crm/${q.lead_id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate mt-2 block"
                        title={client?.name || "Client Lead"}
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-base text-foreground tracking-tight">
                        {formatCurrency(q.amount)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[110px] font-medium">
                        {lead?.event_type || "Photography"}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Notes / Deliverables */}
                    {q.notes && (
                      <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground line-clamp-2 border border-border/60">
                        {q.notes}
                      </div>
                    )}

                    {/* Rejection Info */}
                    {q.rejection_reason && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                        <p className="font-semibold">Reason: {q.rejection_reason}</p>
                        {q.rejection_reason_other && (
                          <p className="mt-0.5 text-[11px]">{q.rejection_reason_other}</p>
                        )}
                      </div>
                    )}

                    {/* Date Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                      <span>Created: {formatDate(q.created_at)}</span>
                      {q.valid_until && (
                        <span
                          className={`flex items-center gap-1 ${
                            isValidityPast && q.status !== "Accepted"
                              ? "text-destructive font-medium"
                              : isExpiringSoon
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : ""
                          }`}
                        >
                          {isExpiringSoon && <Clock className="h-3 w-3" />}
                          Valid till: {formatDate(q.valid_until)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean Non-Overlapping Action Buttons Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" asChild>
                      <Link href={`/crm/${q.lead_id}`}>
                        <span>View Lead</span>
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>

                    <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                      {q.status === "Draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 shadow-2xs"
                          onClick={() => handleSend(q)}
                        >
                          <Send className="h-3 w-3 text-sky-600" />
                          <span>Send</span>
                        </Button>
                      )}

                      {(q.status === "Sent" || q.status === "Viewed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 gap-1 shadow-2xs"
                          onClick={() => handleNegotiate(q)}
                        >
                          <MessageSquareQuote className="h-3 w-3" />
                          <span>Negotiate</span>
                        </Button>
                      )}

                      {q.status !== "Accepted" && q.status !== "Rejected" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 shadow-2xs"
                            onClick={() => {
                              setRejectingQuote(q);
                              setRejectionReason("Price too high");
                              setRejectionReasonOther("");
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </Button>

                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                            onClick={() => handleAccept(q)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Accept</span>
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDeleteQuotation(q)}
                        title="Delete Quotation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Reject Quotation Dialog */}
      <Dialog open={!!rejectingQuote} onOpenChange={(open) => !open && setRejectingQuote(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Reject Quotation {rejectingQuote?.quotation_number}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select mandatory rejection reason to log actionable business analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rejection Reason (Mandatory)</Label>
              <Select
                value={rejectionReason}
                onValueChange={(val: any) => setRejectionReason(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select primary reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Price too high" className="text-xs">Price too high</SelectItem>
                  <SelectItem value="Went with competitor" className="text-xs">Went with competitor</SelectItem>
                  <SelectItem value="Date Already Booked" className="text-xs">Date Already Booked</SelectItem>
                  <SelectItem value="Budget mismatch" className="text-xs">Budget mismatch</SelectItem>
                  <SelectItem value="Package deliverables not suitable" className="text-xs">Package deliverables not suitable</SelectItem>
                  <SelectItem value="Event cancelled / postponed" className="text-xs">Event cancelled / postponed</SelectItem>
                  <SelectItem value="Client unresponsive" className="text-xs">Client unresponsive</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other (Specify below)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rejectionReason === "Other" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Specify Custom Reason</Label>
                <Textarea
                  placeholder="Provide details why the client declined this proposal..."
                  value={rejectionReasonOther}
                  onChange={(e) => setRejectionReasonOther(e.target.value)}
                  className="text-xs min-h-[80px]"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setRejectingQuote(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleRejectConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
