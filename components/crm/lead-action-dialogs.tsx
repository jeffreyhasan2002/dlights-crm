"use client";

import * as React from "react";
import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Mail,
  Clock,
  FileText,
  CreditCard,
  StickyNote,
  SlidersHorizontal,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { LeadWithDetails, LeadStatus, ContactMethod, PaymentType, PaymentMethod } from "@/types/crm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  updateLeadStatusServerAction,
  scheduleFollowUpServerAction,
  logCommunicationServerAction,
  addNoteServerAction,
  createQuotationServerAction,
  recordPaymentServerAction,
  updateNextActionServerAction,
} from "@/lib/crm-actions";

interface LeadActionDialogsProps {
  lead: LeadWithDetails;
  singleAction?: "stage" | "follow-up" | "contact" | "quote" | "payment" | "note" | "next-action";
  trigger?: React.ReactNode;
  className?: string;
}

export function LeadActionDialogs({ lead, singleAction, trigger, className }: LeadActionDialogsProps) {
  const router = useRouter();
  // Modal states
  const [stageOpen, setStageOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [nextActionOpen, setNextActionOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedStage, setSelectedStage] = useState<LeadStatus>(lead.lead_status);

  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpMethod, setFollowUpMethod] = useState<ContactMethod>("WhatsApp");
  const [followUpNotes, setFollowUpNotes] = useState("");

  const [commMethod, setCommMethod] = useState<ContactMethod>("WhatsApp");
  const [commDirection, setCommDirection] = useState<"Outgoing" | "Incoming">("Outgoing");
  const [commMessage, setCommMessage] = useState("");
  const [commResponse, setCommResponse] = useState("");

  const [noteText, setNoteText] = useState("");

  const [quoteAmount, setQuoteAmount] = useState<number>(Number(lead.budget) || 0);
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  const [payAmount, setPayAmount] = useState<number>(0);
  const [payType, setPayType] = useState<PaymentType>("Advance");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const [nextActionText, setNextActionText] = useState(lead.next_action || "");
  const [nextActionDate, setNextActionDate] = useState(
    lead.next_action_due_at ? lead.next_action_due_at.substring(0, 16) : ""
  );

  React.useEffect(() => {
    setNextActionText(lead.next_action || "");
    if (lead.next_action_due_at) {
      setNextActionDate(lead.next_action_due_at.substring(0, 16));
    } else {
      setNextActionDate("");
    }
  }, [lead.next_action, lead.next_action_due_at]);

  // 1. Stage update
  const handleStageSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateLeadStatusServerAction(lead.id, selectedStage);
      if (res.success) {
        toast.success(`Pipeline stage updated to "${selectedStage}"`);
        setStageOpen(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Follow-up schedule
  const handleFollowUpSubmit = async () => {
    if (!followUpDate) {
      toast.error("Please select scheduled follow-up date and time");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await scheduleFollowUpServerAction({
        leadId: lead.id,
        scheduledAt: new Date(followUpDate).toISOString(),
        contactMethod: followUpMethod,
        notes: followUpNotes || undefined,
      });
      if (res.success) {
        toast.success("Follow-up scheduled successfully!");
        setFollowUpOpen(false);
        setFollowUpNotes("");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Log Communication
  const handleCommSubmit = async () => {
    if (!commMessage.trim()) {
      toast.error("Please enter communication summary");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await logCommunicationServerAction({
        leadId: lead.id,
        contactMethod: commMethod,
        direction: commDirection,
        message: commMessage,
        clientResponse: commResponse || undefined,
      });
      if (res.success) {
        toast.success("Communication logged and added to timeline!");
        setCommOpen(false);
        setCommMessage("");
        setCommResponse("");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Add Note
  const handleNoteSubmit = async () => {
    if (!noteText.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await addNoteServerAction(lead.id, noteText);
      if (res.success) {
        toast.success("Note saved!");
        setNoteOpen(false);
        setNoteText("");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Create Quotation
  const handleQuoteSubmit = async () => {
    if (!quoteAmount || quoteAmount <= 0) {
      toast.error("Please enter a valid quotation amount");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await createQuotationServerAction({
        leadId: lead.id,
        amount: Number(quoteAmount),
        validUntil: quoteValidUntil || undefined,
        notes: quoteNotes || undefined,
      });
      if (res.success) {
        toast.success("Quotation draft created!");
        setQuoteOpen(false);
        setQuoteNotes("");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Record Payment
  const handlePaymentSubmit = async () => {
    if (!payAmount || payAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await recordPaymentServerAction({
        bookingId: lead.bookings?.[0]?.id || "",
        amount: Number(payAmount),
        paymentType: payType,
        paymentMethod: payMethod,
        reference: payRef || undefined,
        notes: payNotes || undefined,
        leadId: lead.id,
      });
      if (res.success) {
        toast.success("Payment recorded and balance updated!");
        setPaymentOpen(false);
        setPayAmount(0);
        setPayRef("");
        setPayNotes("");
        router.refresh();
      } else {
        toast.error("Failed to record payment", { description: (res as any)?.error });
      }
    } catch {
      toast.error("An error occurred while recording payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Update Next Action
  const handleNextActionSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await updateNextActionServerAction(
        lead.id,
        nextActionText,
        nextActionDate ? new Date(nextActionDate).toISOString() : undefined
      );
      if (res.success) {
        toast.success("Next action plan updated!");
        setNextActionOpen(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Single Action Rendering Mode */}
      {singleAction === "contact" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setCommOpen(true)}
        >
          {trigger || (
            <>
              <Phone className="h-3.5 w-3.5 text-sky-500" />
              <span>Log Contact</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "next-action" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setNextActionOpen(true)}
        >
          {trigger || (
            <>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Update Action</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "follow-up" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setFollowUpOpen(true)}
        >
          {trigger || (
            <>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Schedule Follow-up</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "quote" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setQuoteOpen(true)}
        >
          {trigger || (
            <>
              <FileText className="h-3.5 w-3.5 text-purple-500" />
              <span>Quotation</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "payment" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setPaymentOpen(true)}
        >
          {trigger || (
            <>
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "note" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setNoteOpen(true)}
        >
          {trigger || (
            <>
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Note</span>
            </>
          )}
        </Button>
      )}

      {singleAction === "stage" && (
        <Button
          size="sm"
          variant="outline"
          className={className || "gap-1.5 text-xs h-7 font-medium"}
          onClick={() => setStageOpen(true)}
        >
          {trigger || (
            <>
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Stage</span>
            </>
          )}
        </Button>
      )}

      {/* Full Quick Action Button Group */}
      {!singleAction && (
        <div className={className || "flex items-center gap-2 flex-nowrap"}>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setStageOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
            <span>Stage</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setFollowUpOpen(true)}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Follow-up</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setCommOpen(true)}
          >
            <Phone className="h-3.5 w-3.5 text-sky-500" />
            <span>Log Contact</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setQuoteOpen(true)}
          >
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            <span>Quotation</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setPaymentOpen(true)}
          >
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
            <span>Payment</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 px-3 font-medium shrink-0 bg-background/90 hover:bg-muted rounded-lg border-border/80 shadow-2xs text-foreground transition-colors"
            onClick={() => setNoteOpen(true)}
          >
            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
            <span>Note</span>
          </Button>
        </div>
      )}

      {/* 1. Modal: Change Stage */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pipeline Stage</DialogTitle>
            <DialogDescription>Move this lead to a new CRM status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Stage</Label>
            <Select
              value={selectedStage}
              onValueChange={(val: LeadStatus) => setSelectedStage(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Enquiry">New Enquiry</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                <SelectItem value="Quotation Sent">Quotation Sent</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Accepted / Booked">Accepted / Booked</SelectItem>
                <SelectItem value="Rejected / Lost">Rejected / Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageOpen(false)}>Cancel</Button>
            <Button onClick={handleStageSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Schedule Follow-up */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>Set a reminder to reach out to {lead.client?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Method</Label>
              <Select
                value={followUpMethod}
                onValueChange={(val: ContactMethod) => setFollowUpMethod(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Call">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="In-person">In-person Meeting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Notes / Agenda</Label>
              <Textarea
                placeholder="What do you need to discuss or send?"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={handleFollowUpSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Schedule Follow-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Modal: Log Communication */}
      <Dialog open={commOpen} onOpenChange={setCommOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
            <DialogDescription>Record a phone call, WhatsApp conversation, or email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select
                  value={commMethod}
                  onValueChange={(val: ContactMethod) => setCommMethod(val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="In-person">In-person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select
                  value={commDirection}
                  onValueChange={(val: "Outgoing" | "Incoming") => setCommDirection(val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outgoing">Outgoing (Sent by studio)</SelectItem>
                    <SelectItem value="Incoming">Incoming (Received from client)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Message / Discussion Points *</Label>
              <Textarea
                placeholder="What was discussed or communicated?"
                rows={3}
                value={commMessage}
                onChange={(e) => setCommMessage(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Client Response (Optional)</Label>
              <Input
                placeholder="How did the client react or respond?"
                value={commResponse}
                onChange={(e) => setCommResponse(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommOpen(false)}>Cancel</Button>
            <Button onClick={handleCommSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Log Communication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: Add Note */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Studio Note</DialogTitle>
            <DialogDescription>Save private notes visible only to the photography team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Groom prefers vintage lens presets, bride requested family photo list..."
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleNoteSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Modal: Create Quotation */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Proposal / Quotation</DialogTitle>
            <DialogDescription>Generate a new quotation draft for {lead.client?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Quotation Amount (₹ INR) *</Label>
              <Input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={quoteValidUntil}
                onChange={(e) => setQuoteValidUntil(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Package Deliverables & Inclusions</Label>
              <Textarea
                placeholder="Number of photographers, drone coverage, album specifications, cinematic teaser..."
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>Cancel</Button>
            <Button onClick={handleQuoteSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Quotation Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Record Payment */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Client Payment</DialogTitle>
            <DialogDescription>Record advance token or milestone payments received.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹ INR) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Select
                  value={payType}
                  onValueChange={(val: PaymentType) => setPayType(val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Advance">Advance Token</SelectItem>
                    <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                    <SelectItem value="Final Payment">Final Settlement</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  value={payMethod}
                  onValueChange={(val: PaymentMethod) => setPayMethod(val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI / GPay / PhonePe</SelectItem>
                    <SelectItem value="Bank Transfer">Bank NEFT / IMPS</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Debit / Credit Card</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Transaction Reference / UTR</Label>
                <Input
                  placeholder="e.g. UPI-998822 / HDFC-102"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Notes</Label>
              <Textarea
                placeholder="Any special remarks or receipt info..."
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handlePaymentSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Save Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
