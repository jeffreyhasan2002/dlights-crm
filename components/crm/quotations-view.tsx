"use client";

import * as React from "react";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { Quotation, RejectionReason } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/lib/crm-actions";

interface QuotationsViewProps {
  initialQuotations: Quotation[];
  onQuotationUpdate?: (updatedQuotation: Quotation) => void;
}

export function QuotationsView({ initialQuotations, onQuotationUpdate }: QuotationsViewProps) {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [tab, setTab] = useState<string>("All");
  const [rejectingQuote, setRejectingQuote] = useState<Quotation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>("Price too high");
  const [rejectionReasonOther, setRejectionReasonOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Keep in sync with parent props
  React.useEffect(() => {
    setQuotations(initialQuotations);
  }, [initialQuotations]);

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

  const filtered = quotations.filter((q) => {
    if (tab === "All") return true;
    if (tab === "Negotiating") return q.status === "Negotiating";
    return q.status.toLowerCase() === tab.toLowerCase();
  });

  const handleSend = async (q: Quotation) => {
    updateLocalQuoteStatus(q.id, { status: "Sent", sent_at: new Date().toISOString() });
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
    setQuotations((prev) => prev.filter((item) => item.id !== q.id));
    toast.success(`Quotation ${q.quotation_number} deleted.`);
    try {
      await deleteQuotationServerAction(q.id, q.lead_id);
      router.refresh();
    } catch {
      toast.error("Failed to delete quotation from server");
      setQuotations(initialQuotations);
    }
  };

  const getStatusBadge = (status: Quotation["status"]) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline" className="text-[10px]">Draft</Badge>;
      case "Sent":
        return <Badge className="bg-sky-500/10 text-sky-700 border-sky-300 dark:text-sky-300 text-[10px]">Sent</Badge>;
      case "Viewed":
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-300 dark:text-purple-300 text-[10px]">Viewed</Badge>;
      case "Negotiating":
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 text-[10px]">Negotiating</Badge>;
      case "Accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-300 text-[10px]">Accepted</Badge>;
      case "Rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const sentCount = quotations.filter((q) => q.status === "Sent" || q.status === "Viewed").length;
  const negCount = quotations.filter((q) => q.status === "Negotiating").length;
  const accCount = quotations.filter((q) => q.status === "Accepted").length;
  const rejCount = quotations.filter((q) => q.status === "Rejected").length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="All" className="text-xs">All ({quotations.length})</TabsTrigger>
            <TabsTrigger value="Sent" className="text-xs">Sent ({sentCount})</TabsTrigger>
            <TabsTrigger value="Negotiating" className="text-xs">Negotiating ({negCount})</TabsTrigger>
            <TabsTrigger value="Accepted" className="text-xs">Accepted ({accCount})</TabsTrigger>
            <TabsTrigger value="Rejected" className="text-xs">Rejected ({rejCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quotations List with Responsive Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground bg-muted/10">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-semibold text-foreground text-base">No quotations found in this filter</p>
            <p className="text-xs mt-1">Generate client proposals directly from any enquiry detail page.</p>
          </div>
        ) : (
          filtered.map((q) => {
            const client = q.lead?.client;
            return (
              <Card key={q.id} className="shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border">
                          {q.quotation_number}
                        </span>
                        {getStatusBadge(q.status)}
                      </div>
                      <Link
                        href={`/crm/${q.lead_id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate mt-1.5 block"
                        title={client?.name || "Client Lead"}
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-base text-foreground tracking-tight">
                        {formatCurrency(q.amount)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[110px]">
                        {q.lead?.event_type || "Photography"}
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
                        {q.rejection_reason_other && <p className="mt-0.5 text-[11px]">{q.rejection_reason_other}</p>}
                      </div>
                    )}

                    {/* Date Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                      <span>Created: {formatDate(q.created_at)}</span>
                      {q.valid_until && <span>Valid till: {formatDate(q.valid_until)}</span>}
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
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
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
