"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  CreditCard,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { LeadWithDetails, Booking, Client, EventType, PaymentType, PaymentMethod, ContactMethod } from "@/types/crm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { NewEnquiryDialog } from "@/components/forms/new-enquiry-dialog";
import {
  createQuotationServerAction,
  recordPaymentServerAction,
  createEventServerAction,
  scheduleFollowUpServerAction,
} from "@/lib/crm-actions";

interface DashboardQuickActionsProps {
  leads: LeadWithDetails[];
  bookings: Booking[];
}

export function DashboardQuickActions({ leads, bookings }: DashboardQuickActionsProps) {
  const router = useRouter();

  // Modals state
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  // 1. Create Proposal
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "");
  const [quoteAmount, setQuoteAmount] = useState<number>(350000);
  const [quoteValidUntil, setQuoteValidUntil] = useState<string>("");
  const [quoteNotes, setQuoteNotes] = useState<string>("");

  // 2. Record Payment
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payType, setPayType] = useState<PaymentType>("Advance");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("UPI");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("");

  // 3. Schedule Shoot / Event
  const [eventLeadId, setEventLeadId] = useState<string>(leads[0]?.id || "");
  const [eventName, setEventName] = useState<string>("Grand Wedding Ceremony & Reception");
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventStartTime, setEventStartTime] = useState<string>("06:00");
  const [eventEndTime, setEventEndTime] = useState<string>("22:00");
  const [eventVenue, setEventVenue] = useState<string>("");
  const [eventNotes, setEventNotes] = useState<string>("");

  // 4. Schedule Follow-up
  const [followUpLeadId, setFollowUpLeadId] = useState<string>(leads[0]?.id || "");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpMethod, setFollowUpMethod] = useState<ContactMethod>("WhatsApp");
  const [followUpNotes, setFollowUpNotes] = useState<string>("");

  React.useEffect(() => {
    if (!selectedLeadId && leads.length > 0) setSelectedLeadId(leads[0].id);
    if (!eventLeadId && leads.length > 0) setEventLeadId(leads[0].id);
    if (!followUpLeadId && leads.length > 0) setFollowUpLeadId(leads[0].id);
    if (!selectedBookingId && bookings.length > 0) setSelectedBookingId(bookings[0].id);
  }, [leads, bookings]);

  // Handlers
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !quoteAmount) {
      toast.error("Please select a lead and enter quotation amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createQuotationServerAction({
        leadId: selectedLeadId,
        amount: quoteAmount,
        validUntil: quoteValidUntil || undefined,
        notes: quoteNotes || undefined,
      });

      if (res.success) {
        toast.success(`Quotation created for ₹${quoteAmount.toLocaleString("en-IN")}`);
        setQuoteOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create quotation");
      }
    } catch {
      toast.error("Error creating quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !payAmount) {
      toast.error("Please select a booking and enter payment amount.");
      return;
    }

    const booking = bookings.find((b) => b.id === selectedBookingId);

    try {
      setIsSubmitting(true);
      const res = await recordPaymentServerAction({
        bookingId: selectedBookingId,
        amount: payAmount,
        paymentType: payType,
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payRef || undefined,
        notes: payNotes || undefined,
        leadId: booking?.lead_id,
      });

      if (res.success) {
        toast.success(`Payment of ₹${payAmount.toLocaleString("en-IN")} recorded via ${payMethod}`);
        setPaymentOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to record payment");
      }
    } catch {
      toast.error("Error recording payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === eventLeadId);
    if (!lead || !eventDate) {
      toast.error("Please select a client lead and shoot date.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createEventServerAction({
        clientId: lead.client_id,
        leadId: lead.id,
        eventName,
        eventType,
        eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        venue: eventVenue || lead.location || undefined,
        notes: eventNotes || undefined,
      });

      if (res.success) {
        toast.success(`Shoot date for "${eventName}" scheduled on ${eventDate}`);
        setEventOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to schedule shoot");
      }
    } catch {
      toast.error("Error scheduling shoot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpLeadId || !followUpDate) {
      toast.error("Please select a lead and follow-up date/time.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await scheduleFollowUpServerAction({
        leadId: followUpLeadId,
        scheduledAt: new Date(followUpDate).toISOString(),
        contactMethod: followUpMethod,
        notes: followUpNotes || undefined,
      });

      if (res.success) {
        toast.success(`Follow-up scheduled via ${followUpMethod}`);
        setFollowUpOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to schedule follow-up");
      }
    } catch {
      toast.error("Error scheduling follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Primary Action: Add Enquiry */}
      <NewEnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        trigger={
          <Button className="gap-1.5 shadow-xs font-semibold text-xs h-9">
            <Plus className="h-4 w-4" />
            <span>Add Enquiry</span>
          </Button>
        }
      />

      {/* 2. Direct Action: Create Proposal */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuoteOpen(true)}
        className="hidden sm:flex gap-1.5 text-xs shadow-2xs h-9"
      >
        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Create Quote</span>
      </Button>

      {/* 3. Direct Action: Record Payment */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPaymentOpen(true)}
        className="hidden md:flex gap-1.5 text-xs shadow-2xs h-9"
      >
        <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Record Payment</span>
      </Button>

      {/* 4. Dropdown Menu for all Quick Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shadow-2xs h-9">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Quick Actions</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 text-xs">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
            Studio Quick Launcher
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEnquiryOpen(true)} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold">New Enquiry</span>
              <span className="text-[10px] text-muted-foreground">Add new couple or portrait lead</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setQuoteOpen(true)} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-indigo-600" />
            <div className="flex flex-col">
              <span className="font-semibold">Create Quotation</span>
              <span className="text-[10px] text-muted-foreground">Draft & send wedding proposal</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setPaymentOpen(true)} className="gap-2 cursor-pointer">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="font-semibold">Record Payment</span>
              <span className="text-[10px] text-muted-foreground">Log UPI/Bank advance or balance</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setEventOpen(true)} className="gap-2 cursor-pointer">
            <Calendar className="h-4 w-4 text-sky-600" />
            <div className="flex flex-col">
              <span className="font-semibold">Schedule Shoot Date</span>
              <span className="text-[10px] text-muted-foreground">Add wedding shoot to schedule</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setFollowUpOpen(true)} className="gap-2 cursor-pointer">
            <Clock className="h-4 w-4 text-amber-600" />
            <div className="flex flex-col">
              <span className="font-semibold">Schedule Follow-up</span>
              <span className="text-[10px] text-muted-foreground">Set call/WhatsApp reminder</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DIALOG 1: CREATE PROPOSAL / QUOTATION */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateQuotation}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span>Create Commercial Proposal</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generate an official quotation for a client lead in your pipeline.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="quote-lead">Select Client Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger id="quote-lead">
                    <SelectValue placeholder="Select lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.client?.name} ({l.event_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-amount">Quotation Amount (₹)</Label>
                  <Input
                    id="quote-amount"
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-valid">Valid Until Date</Label>
                  <Input
                    id="quote-valid"
                    type="date"
                    value={quoteValidUntil}
                    onChange={(e) => setQuoteValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-notes">Deliverables & Scope Notes</Label>
                <Textarea
                  id="quote-notes"
                  placeholder="e.g. 2 Days Candid + Cinematic Film + Drone + Luxury Silk Album"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Generate Quotation</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: RECORD PAYMENT */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span>Record Client Payment</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log an advance token deposit or final shoot balance.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="pay-booking">Select Confirmed Booking</Label>
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger id="pay-booking">
                    <SelectValue placeholder="Select booking..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.client?.name || "Client"} — Rem: ₹{(b.remaining_amount || 0).toLocaleString("en-IN")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-amount">Amount Received (₹)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-date">Payment Date</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-type">Payment Type</Label>
                  <Select value={payType} onValueChange={(v) => setPayType(v as PaymentType)}>
                    <SelectTrigger id="pay-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advance">Advance Token</SelectItem>
                      <SelectItem value="Partial Payment">Milestone / Partial</SelectItem>
                      <SelectItem value="Final Payment">Final Settlement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-method">Payment Method</Label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                    <SelectTrigger id="pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI (GPay / PhonePe)</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Transaction / UPI Reference ID</Label>
                <Input
                  id="pay-ref"
                  placeholder="e.g. UPI-984281903482 or HDFC-098234"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Record Payment</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: SCHEDULE SHOOT DATE */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateEvent}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-sky-600" />
                <span>Schedule Event Shoot</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add an upcoming wedding, sangeet, or portrait shoot date to the calendar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="event-lead">Select Client</Label>
                <Select value={eventLeadId} onValueChange={setEventLeadId}>
                  <SelectTrigger id="event-lead">
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.client?.name} ({l.event_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-name">Event Shoot Name</Label>
                <Input
                  id="event-name"
                  placeholder="e.g. Royal Palace Muhurtham & Reception"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-type">Event Category</Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger id="event-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Engagement">Engagement</SelectItem>
                      <SelectItem value="Sangeet">Sangeet</SelectItem>
                      <SelectItem value="Reception">Reception</SelectItem>
                      <SelectItem value="Pre-Wedding">Pre-Wedding Shoot</SelectItem>
                      <SelectItem value="Baby Shoot">Baby Shoot</SelectItem>
                      <SelectItem value="Portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-date">Shoot Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-start">Start Time</Label>
                  <Input
                    id="event-start"
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-end">End Time</Label>
                  <Input
                    id="event-end"
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-venue">Shoot Venue / Location</Label>
                <Input
                  id="event-venue"
                  placeholder="e.g. Taj Fishermans Cove, Chennai"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setEventOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Add to Shoot Calendar</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: SCHEDULE FOLLOW-UP */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleScheduleFollowUp}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-amber-600" />
                <span>Schedule Client Follow-up</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Set a reminder call or WhatsApp follow-up for a lead.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="fup-lead">Select Lead</Label>
                <Select value={followUpLeadId} onValueChange={setFollowUpLeadId}>
                  <SelectTrigger id="fup-lead">
                    <SelectValue placeholder="Select lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.client?.name} ({l.event_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fup-method">Contact Channel</Label>
                  <Select value={followUpMethod} onValueChange={(v) => setFollowUpMethod(v as ContactMethod)}>
                    <SelectTrigger id="fup-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Call">Phone Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="In-Person Meeting">In-Person Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fup-date">Scheduled Date & Time</Label>
                  <Input
                    id="fup-date"
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fup-notes">Reminder Notes / Action Details</Label>
                <Textarea
                  id="fup-notes"
                  placeholder="e.g. Call bride to discuss destination logistics and custom album silk sample"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setFollowUpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Set Follow-up Reminder</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
