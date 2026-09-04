"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Calendar,
  User,
  IndianRupee,
  Share2,
  Sparkles,
  FileText,
  Clock,
  Plus,
  Trash2,
  SlidersHorizontal,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequirementSelector } from "@/components/crm/requirement-selector";
import { EventTypeCombobox } from "@/components/crm/event-type-combobox";
import { CurrencyInput } from "@/components/crm/currency-input";
import { updateLeadServerAction } from "@/lib/crm-actions";
import { LeadWithDetails, LeadStatus, ContactStatus } from "@/types/crm";

const LEAD_SOURCE_OPTIONS = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Website",
  "Google",
  "Referral",
  "Existing Client",
  "Walk-in",
  "Phone Call",
  "Advertisement",
  "Wedding Website",
  "Vendor Referral",
  "Friend / Family",
  "Other",
] as const;

const editLeadSchema = z
  .object({
    clientName: z.string().min(2, "Client / Couple name must be at least 2 characters"),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    budget: z.number().optional().default(0),
    eventType: z.string().min(1, "Event type is required"),
    customEventType: z.string().optional(),
    eventDate: z.string().optional(),
    eventStartTime: z.string().optional(),
    eventEndTime: z.string().optional(),
    location: z.string().optional(),
    source: z.string().default("Instagram"),
    customSource: z.string().optional(),
    leadStatus: z.enum([
      "New Enquiry",
      "Contacted",
      "Follow-up Required",
      "Quotation Sent",
      "Negotiation",
      "Accepted / Booked",
      "Rejected / Lost",
    ]),
    contactStatus: z.enum([
      "Not Contacted",
      "Contacted – Waiting for Response",
      "Responded",
      "No Response",
    ]),
    profitPercentage: z.coerce.number().min(0).max(500).default(30),
    enquiryMessage: z.string().optional(),
    nextAction: z.string().optional(),
    nextActionDueAt: z.string().optional(),
    requirements: z.array(z.string()).default([]),
    otherRequirement: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.eventType === "Other" && (!data.customEventType || !data.customEventType.trim())) {
        return false;
      }
      return true;
    },
    {
      message: 'Please specify the event type when "Other" is selected.',
      path: ["customEventType"],
    }
  )
  .refine(
    (data) => {
      if (data.source === "Other" && (!data.customSource || !data.customSource.trim())) {
        return false;
      }
      return true;
    },
    {
      message: 'Please specify the lead source when "Other" is selected.',
      path: ["customSource"],
    }
  )
  .refine(
    (data) => {
      if (data.requirements.includes("Other") && (!data.otherRequirement || !data.otherRequirement.trim())) {
        return false;
      }
      return true;
    },
    {
      message: 'Please specify custom requirement when "Other" is selected.',
      path: ["otherRequirement"],
    }
  );

type EditLeadFormValues = z.infer<typeof editLeadSchema>;

interface AdditionalEventItem {
  id: string;
  eventType: string;
  customEventType: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  location: string;
  notes: string;
  requirements?: string[];
  otherRequirement?: string;
}

function parseEventRequirements(ev: any): { requirements: string[]; otherRequirement: string } {
  let reqs: string[] = [];
  let otherReq = "";

  if (Array.isArray(ev.requirements) && ev.requirements.length > 0) {
    reqs = ev.requirements;
  } else if (ev.notes && typeof ev.notes === "string") {
    const m = ev.notes.match(/\[REQUIREMENTS\]:\s*(\[[^\]]*\])/);
    if (m) {
      try {
        reqs = JSON.parse(m[1]);
      } catch {}
    }
  }

  if (ev.other_requirement) {
    otherReq = ev.other_requirement;
  } else if (ev.notes && typeof ev.notes === "string") {
    const m = ev.notes.match(/\[OTHER_REQ\]:\s*(.*)$/m);
    if (m) {
      otherReq = m[1].trim();
    }
  }

  return { requirements: reqs, otherRequirement: otherReq };
}

interface EditLeadDialogProps {
  lead: LeadWithDetails;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditLeadDialog({
  lead,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: EditLeadDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const client = lead.client || {
    name: "Client",
    phone: null,
    whatsapp: null,
    email: null,
    location: null,
  };

  const rawEvents = lead.events || [];
  const firstEvent = rawEvents[0];
  const ev1Parsed = firstEvent ? parseEventRequirements(firstEvent) : { requirements: [], otherRequirement: "" };

  const [additionalEvents, setAdditionalEvents] = useState<AdditionalEventItem[]>(() => {
    if (rawEvents.length > 1) {
      return rawEvents.slice(1).map((ev, idx) => {
        const { requirements, otherRequirement } = parseEventRequirements(ev);
        return {
          id: ev.id || `ev-${idx}-${Date.now()}`,
          eventType: ev.event_type || "Reception",
          customEventType: ev.custom_event_type || "",
          eventDate: ev.event_date || "",
          eventStartTime: ev.start_time || "",
          eventEndTime: ev.end_time || "",
          location: ev.location || "",
          notes: ev.notes || "",
          requirements,
          otherRequirement,
        };
      });
    }
    return [];
  });

  const isStandardSource = LEAD_SOURCE_OPTIONS.includes(lead.source as any);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadSchema) as any,
    defaultValues: {
      clientName: client.name || "",
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      email: client.email || "",
      budget: Number(lead.budget) || 0,
      eventType: firstEvent?.event_type || lead.event_type || "Wedding",
      customEventType: firstEvent?.custom_event_type || "",
      eventDate: firstEvent?.event_date || lead.event_date || "",
      eventStartTime: firstEvent?.start_time || lead.event_start_time || "",
      eventEndTime: firstEvent?.end_time || lead.event_end_time || "",
      location: firstEvent?.location || lead.location || client.location || "",
      source: isStandardSource ? (lead.source || "Website") : "Other",
      customSource: !isStandardSource ? (lead.source || "") : "",
      leadStatus: lead.lead_status || "New Enquiry",
      contactStatus: lead.contact_status || "Not Contacted",
      profitPercentage: lead.profit_percentage ?? 30,
      enquiryMessage: lead.enquiry_message || "",
      nextAction: lead.next_action || "",
      nextActionDueAt: lead.next_action_due_at ? lead.next_action_due_at.substring(0, 16) : "",
      requirements: ev1Parsed.requirements.length > 0 ? ev1Parsed.requirements : (lead.requirements || []),
      otherRequirement: ev1Parsed.otherRequirement || lead.other_requirement || "",
    },
  });

  // Re-sync default values when lead changes
  useEffect(() => {
    const currentEvents = lead.events || [];
    const ev1 = currentEvents[0];
    const ev1P = ev1 ? parseEventRequirements(ev1) : { requirements: [], otherRequirement: "" };
    const isStdSrc = LEAD_SOURCE_OPTIONS.includes(lead.source as any);

    reset({
      clientName: lead.client?.name || "",
      phone: lead.client?.phone || "",
      whatsapp: lead.client?.whatsapp || "",
      email: lead.client?.email || "",
      budget: Number(lead.budget) || 0,
      eventType: ev1?.event_type || lead.event_type || "Wedding",
      customEventType: ev1?.custom_event_type || "",
      eventDate: ev1?.event_date || lead.event_date || "",
      eventStartTime: ev1?.start_time || lead.event_start_time || "",
      eventEndTime: ev1?.end_time || lead.event_end_time || "",
      location: ev1?.location || lead.location || lead.client?.location || "",
      source: isStdSrc ? (lead.source || "Website") : "Other",
      customSource: !isStdSrc ? (lead.source || "") : "",
      leadStatus: lead.lead_status || "New Enquiry",
      contactStatus: lead.contact_status || "Not Contacted",
      profitPercentage: lead.profit_percentage ?? 30,
      enquiryMessage: lead.enquiry_message || "",
      nextAction: lead.next_action || "",
      nextActionDueAt: lead.next_action_due_at ? lead.next_action_due_at.substring(0, 16) : "",
      requirements: ev1P.requirements.length > 0 ? ev1P.requirements : (lead.requirements || []),
      otherRequirement: ev1P.otherRequirement || lead.other_requirement || "",
    });

    if (currentEvents.length > 1) {
      setAdditionalEvents(
        currentEvents.slice(1).map((ev, idx) => {
          const { requirements, otherRequirement } = parseEventRequirements(ev);
          return {
            id: ev.id || `ev-${idx}-${Date.now()}`,
            eventType: ev.event_type || "Reception",
            customEventType: ev.custom_event_type || "",
            eventDate: ev.event_date || "",
            eventStartTime: ev.start_time || "",
            eventEndTime: ev.end_time || "",
            location: ev.location || "",
            notes: ev.notes || "",
            requirements,
            otherRequirement,
          };
        })
      );
    } else {
      setAdditionalEvents([]);
    }
  }, [lead, reset]);

  const selectedEventType = watch("eventType");
  const customEventTypeValue = watch("customEventType") || "";
  const selectedBudgetValue = watch("budget") || 0;
  const selectedSource = watch("source");
  const selectedStage = watch("leadStatus");
  const selectedContactStatus = watch("contactStatus");
  const selectedRequirements = watch("requirements") || [];
  const otherRequirementValue = watch("otherRequirement") || "";

  const handleAddEvent = () => {
    setAdditionalEvents((prev) => [
      ...prev,
      {
        id: "ev-" + Date.now() + Math.random().toString(36).substring(2, 5),
        eventType: "Reception",
        customEventType: "",
        eventDate: "",
        eventStartTime: "",
        eventEndTime: "",
        location: "",
        notes: "",
        requirements: [],
        otherRequirement: "",
      },
    ]);
  };

  const handleRemoveEvent = (id: string) => {
    setAdditionalEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleUpdateEvent = (id: string, field: keyof AdditionalEventItem, value: any) => {
    setAdditionalEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, [field]: value } : ev))
    );
  };

  const onSubmit = async (data: EditLeadFormValues) => {
    try {
      setIsSubmitting(true);
      const primaryEventType =
        data.eventType === "Other" && data.customEventType?.trim()
          ? data.customEventType.trim()
          : data.eventType;

      const effectiveSource =
        data.source === "Other" && data.customSource?.trim()
          ? data.customSource.trim()
          : data.source;

      // Compile all structured event records
      const allEventsPayload: Array<{
        eventType: string;
        customEventType?: string;
        eventDate: string;
        eventStartTime?: string;
        eventEndTime?: string;
        location?: string;
        notes?: string;
        requirements?: string[];
        otherRequirement?: string;
      }> = [];

      if (data.eventType) {
        allEventsPayload.push({
          eventType: data.eventType,
          customEventType: data.customEventType || undefined,
          eventDate: data.eventDate || "",
          eventStartTime: data.eventStartTime || undefined,
          eventEndTime: data.eventEndTime || undefined,
          location: data.location || undefined,
          notes: "Primary Function",
          requirements: data.requirements || [],
          otherRequirement: data.otherRequirement || undefined,
        });
      }

      for (const aEv of additionalEvents) {
        if (aEv.eventType) {
          allEventsPayload.push({
            eventType: aEv.eventType,
            customEventType: aEv.customEventType || undefined,
            eventDate: aEv.eventDate || "",
            eventStartTime: aEv.eventStartTime || undefined,
            eventEndTime: aEv.eventEndTime || undefined,
            location: aEv.location || data.location || undefined,
            notes: aEv.notes || undefined,
            requirements: aEv.requirements || [],
            otherRequirement: aEv.otherRequirement || undefined,
          });
        }
      }

      const res = await updateLeadServerAction(lead.id, {
        clientName: data.clientName,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email || undefined,
        eventType: primaryEventType,
        customEventType: data.customEventType || undefined,
        eventDate: data.eventDate || undefined,
        eventStartTime: data.eventStartTime || undefined,
        eventEndTime: data.eventEndTime || undefined,
        location: data.location || undefined,
        budget: data.budget !== undefined ? Number(data.budget) : undefined,
        source: effectiveSource,
        leadStatus: data.leadStatus,
        contactStatus: data.contactStatus,
        profitPercentage: data.profitPercentage,
        enquiryMessage: data.enquiryMessage || undefined,
        nextAction: data.nextAction || undefined,
        nextActionDueAt: data.nextActionDueAt || undefined,
        requirements: data.requirements,
        otherRequirement: data.otherRequirement || undefined,
        events: allEventsPayload,
      });

      if (res.success) {
        toast.success("Lead details updated successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to update lead", {
          description: (res as any)?.error || "Database error",
        });
      }
    } catch {
      toast.error("An error occurred while updating lead details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Edit Details
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Edit Client Enquiry & Scope
          </DialogTitle>
          <DialogDescription>
            Update client contact info, budget, multiple function dates, requirements, and pipeline status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
          {/* 1. Client Information */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>1. Client Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="editClientName">
                  Client / Couple Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="editClientName"
                  {...register("clientName")}
                  className={errors.clientName ? "border-destructive" : ""}
                />
                {errors.clientName && (
                  <p className="text-xs text-destructive">{errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input id="editPhone" {...register("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editWhatsapp">WhatsApp Number</Label>
                <Input id="editWhatsapp" {...register("whatsapp")} />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="editEmail">Email Address</Label>
                <Input id="editEmail" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Estimated Budget */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              <span>2. Estimated Budget</span>
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="editBudget">Estimated Budget (₹ INR)</Label>
              <CurrencyInput
                id="editBudget"
                value={selectedBudgetValue}
                onChange={(val) => setValue("budget", val, { shouldValidate: true })}
              />
              <p className="text-[11px] text-muted-foreground">
                Formatted in Indian currency (e.g. ₹1,00,000). Stored as pure integer.
              </p>
            </div>
          </div>

          {/* 3. Event Information & Schedule */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>3. Event Information & Schedule</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvent}
                className="h-7 text-xs gap-1 border-dashed font-medium text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Event</span>
              </Button>
            </div>

            {/* Event 1 Card */}
            <div className="p-3.5 rounded-xl border bg-background space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Event 1</span>
                  {selectedEventType && (
                    <span className="text-muted-foreground font-normal">
                      — {selectedEventType === "Other" && customEventTypeValue ? customEventTypeValue : selectedEventType}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Primary Function</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5 md:col-span-3">
                  <Label>
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <EventTypeCombobox
                    value={selectedEventType}
                    onChange={(val) => setValue("eventType", val, { shouldValidate: true })}
                    customValue={customEventTypeValue}
                    onCustomValueChange={(custom) =>
                      setValue("customEventType", custom, { shouldValidate: true })
                    }
                    error={errors.customEventType?.message}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editEventDate">Event Date</Label>
                  <Input id="editEventDate" type="date" {...register("eventDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Start Time</span>
                  </Label>
                  <Input type="time" {...register("eventStartTime")} />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>End Time</span>
                  </Label>
                  <Input type="time" {...register("eventEndTime")} />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="editLocation">Location / Venue</Label>
                  <Input id="editLocation" {...register("location")} />
                </div>

                {/* Event 1 Deliverables (Right below Event 1) */}
                <div className="space-y-2 md:col-span-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Event 1 Deliverables ({selectedEventType === "Other" && customEventTypeValue ? customEventTypeValue : selectedEventType})
                      </span>
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-background">Primary Event</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Select specific photography, videography, and coverage deliverables for Event 1.
                  </p>
                  <RequirementSelector
                    selectedRequirements={selectedRequirements}
                    onChange={(reqs) => setValue("requirements", reqs, { shouldValidate: true })}
                    otherRequirement={otherRequirementValue}
                    onOtherRequirementChange={(val) =>
                      setValue("otherRequirement", val, { shouldValidate: true })
                    }
                    error={errors.otherRequirement?.message}
                  />
                </div>
              </div>
            </div>

            {/* Subsequent Events (Event 2, Event 3...) */}
            {additionalEvents.map((aEv, idx) => (
              <div
                key={aEv.id}
                className="p-3.5 rounded-xl border bg-background space-y-3 animate-in fade-in-50 duration-200"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Event {idx + 2}</span>
                    {aEv.eventType && (
                      <span className="text-muted-foreground font-normal">
                        — {aEv.eventType === "Other" && aEv.customEventType ? aEv.customEventType : aEv.eventType}
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEvent(aEv.id)}
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5 md:col-span-3">
                    <Label>
                      Event Type <span className="text-destructive">*</span>
                    </Label>
                    <EventTypeCombobox
                      value={aEv.eventType}
                      onChange={(val) => handleUpdateEvent(aEv.id, "eventType", val)}
                      customValue={aEv.customEventType}
                      onCustomValueChange={(custom) =>
                        handleUpdateEvent(aEv.id, "customEventType", custom)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Event Date</Label>
                    <Input
                      type="date"
                      value={aEv.eventDate}
                      onChange={(e) => handleUpdateEvent(aEv.id, "eventDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Start Time</span>
                    </Label>
                    <Input
                      type="time"
                      value={aEv.eventStartTime}
                      onChange={(e) => handleUpdateEvent(aEv.id, "eventStartTime", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>End Time</span>
                    </Label>
                    <Input
                      type="time"
                      value={aEv.eventEndTime}
                      onChange={(e) => handleUpdateEvent(aEv.id, "eventEndTime", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-3">
                    <Label>Location / Venue</Label>
                    <Input
                      placeholder="e.g. Venue (if different)"
                      value={aEv.location}
                      onChange={(e) => handleUpdateEvent(aEv.id, "location", e.target.value)}
                    />
                  </div>

                  {/* Per-Ceremony Deliverables for this Event */}
                  <div className="space-y-2 md:col-span-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-indigo-500" />
                        <span>Event {idx + 2} Deliverables ({aEv.eventType})</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2 py-0 gap-1 font-medium"
                        onClick={() => {
                          handleUpdateEvent(aEv.id, "requirements", [...selectedRequirements]);
                          if (otherRequirementValue) {
                            handleUpdateEvent(aEv.id, "otherRequirement", otherRequirementValue);
                          }
                          toast.info(`Copied deliverables from Event 1 to Event ${idx + 2}`);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy from Event 1</span>
                      </Button>
                    </div>
                    <RequirementSelector
                      selectedRequirements={aEv.requirements || []}
                      onChange={(reqs) => handleUpdateEvent(aEv.id, "requirements", reqs)}
                      otherRequirement={aEv.otherRequirement || ""}
                      onOtherRequirementChange={(val) => handleUpdateEvent(aEv.id, "otherRequirement", val)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvent}
                className="w-full text-xs gap-1 border-dashed py-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Event</span>
              </Button>
            </div>
          </div>

          {/* 4. Lead Source */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>4. Lead Source</span>
            </h4>
            <div className="space-y-2">
              <Label htmlFor="editSource">Lead Source</Label>
              <Select
                value={selectedSource}
                onValueChange={(val: any) => setValue("source", val, { shouldValidate: true })}
              >
                <SelectTrigger id="editSource">
                  <SelectValue placeholder="Select lead source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSource === "Other" && (
                <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
                  <Label htmlFor="editCustomSource" className="text-xs">
                    Specify Lead Source <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="editCustomSource"
                    placeholder="e.g. Magazine, Exhibition Stall, Influencer Mention..."
                    {...register("customSource")}
                    className={errors.customSource ? "border-destructive" : ""}
                  />
                  {errors.customSource && (
                    <p className="text-xs text-destructive">{errors.customSource.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. Initial Client Note / Message */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>5. Initial Client Note / Message</span>
            </h4>
            <Textarea id="editEnquiryMessage" rows={3} {...register("enquiryMessage")} />
          </div>

          {/* 6. Pipeline Stage & Contact Status */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>6. Pipeline Stage & Contact Status</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editStatus">Pipeline Stage</Label>
                <Select
                  value={selectedStage}
                  onValueChange={(val: LeadStatus) =>
                    setValue("leadStatus", val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue />
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

              <div className="space-y-1.5">
                <Label htmlFor="editContactStatus">Contact Status</Label>
                <Select
                  value={selectedContactStatus}
                  onValueChange={(val: ContactStatus) =>
                    setValue("contactStatus", val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="editContactStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                    <SelectItem value="Contacted – Waiting for Response">
                      Contacted – Waiting for Response
                    </SelectItem>
                    <SelectItem value="Responded">Responded</SelectItem>
                    <SelectItem value="No Response">No Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 7. Next Scheduled Action */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>7. Next Scheduled Action</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="editNextAction">Next Action Plan</Label>
                <Input
                  id="editNextAction"
                  placeholder="e.g. Call client to discuss quotation, share wedding album samples..."
                  {...register("nextAction")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Update next priority action to replace &quot;Initial contact via WhatsApp/Call to share portfolio and brochure&quot;.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editNextActionDueAt">Action Due Date & Time (Optional)</Label>
                <Input
                  id="editNextActionDueAt"
                  type="datetime-local"
                  {...register("nextActionDueAt")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[130px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
