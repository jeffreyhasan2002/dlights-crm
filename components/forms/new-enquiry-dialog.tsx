"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Loader2,
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  User,
  FileText,
  Trash2,
  IndianRupee,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
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
import { createLeadServerAction } from "@/lib/crm-actions";

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

const enquiryFormSchema = z
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
    enquiryMessage: z.string().optional(),
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
      message: 'Please specify your custom requirement when "Other" is selected.',
      path: ["otherRequirement"],
    }
  );

type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

interface AdditionalEventItem {
  id: string;
  eventType: string;
  customEventType: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  location: string;
  notes: string;
  requirements: string[];
  otherRequirement: string;
}

interface NewEnquiryDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewEnquiryDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: NewEnquiryDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalEvents, setAdditionalEvents] = useState<AdditionalEventItem[]>([]);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema) as any,
    defaultValues: {
      clientName: "",
      phone: "",
      whatsapp: "",
      email: "",
      budget: 0,
      eventType: "Wedding",
      customEventType: "",
      eventDate: "",
      eventStartTime: "",
      eventEndTime: "",
      location: "",
      source: "Instagram",
      customSource: "",
      enquiryMessage: "",
      requirements: [],
      otherRequirement: "",
    },
  });

  const selectedEventType = watch("eventType");
  const customEventTypeValue = watch("customEventType") || "";
  const selectedBudgetValue = watch("budget") || 0;
  const selectedSource = watch("source");
  const selectedRequirements = watch("requirements") || [];
  const otherRequirementValue = watch("otherRequirement") || "";

  // Add Event handler
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

  const onSubmit = async (data: EnquiryFormValues) => {
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

      // Event 1
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

      // Event 2, 3, etc.
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

      // Combine requirements across all events for the lead-level requirements array
      const allReqsSet = new Set<string>(data.requirements || []);
      for (const aEv of additionalEvents) {
        for (const req of aEv.requirements || []) {
          allReqsSet.add(req);
        }
      }
      const combinedRequirements = Array.from(allReqsSet);

      const res = await createLeadServerAction({
        clientName: data.clientName,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || data.phone || undefined,
        email: data.email || undefined,
        eventType: primaryEventType,
        customEventType: data.customEventType || undefined,
        eventDate: data.eventDate || undefined,
        eventStartTime: data.eventStartTime || undefined,
        eventEndTime: data.eventEndTime || undefined,
        location: data.location || undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        source: effectiveSource,
        enquiryMessage: data.enquiryMessage || undefined,
        requirements: combinedRequirements,
        otherRequirement: data.otherRequirement || undefined,
        profitPercentage: 30,
        events: allEventsPayload,
      });

      if (res.success && res.leadId) {
        toast.success("Enquiry created successfully!", {
          description: `${data.clientName} added to the CRM pipeline.`,
        });
        reset();
        setAdditionalEvents([]);
        setOpen(false);
        router.push(`/crm/${res.leadId}`);
      } else {
        toast.error("Failed to create enquiry", {
          description: (res as any)?.error || "Please check the entered values.",
        });
      }
    } catch {
      toast.error("An error occurred while saving the enquiry.");
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
          <Button size="sm" className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>New Enquiry</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Add New Enquiry
          </DialogTitle>
          <DialogDescription>
            Record client information, estimated budget, ceremony schedule, requirements, and notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* SECTION 1 — Client Information */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>1. Client Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="clientName">
                  Client / Couple Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Priya & Rahul Sharma"
                  {...register("clientName")}
                  className={errors.clientName ? "border-destructive" : ""}
                />
                {errors.clientName && (
                  <p className="text-xs text-destructive">{errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  placeholder="+91 98765 43210 (if different)"
                  {...register("whatsapp")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2 — Estimated Budget */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              <span>2. Estimated Budget</span>
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="budget">Estimated Budget (₹ INR)</Label>
              <CurrencyInput
                id="budget"
                placeholder="e.g. 1,00,000"
                value={selectedBudgetValue}
                onChange={(val) => setValue("budget", val, { shouldValidate: true })}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter target client budget. Formatted in Indian currency (e.g. ₹1,00,000). Stored accurately as integer.
              </p>
            </div>
          </div>

          {/* SECTION 3 — Event Information & Schedule */}
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
                  <Label htmlFor="eventType">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <EventTypeCombobox
                    id="eventType"
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
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input id="eventDate" type="date" {...register("eventDate")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventStartTime" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Start Time</span>
                  </Label>
                  <Input id="eventStartTime" type="time" {...register("eventStartTime")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventEndTime" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>End Time</span>
                  </Label>
                  <Input id="eventEndTime" type="time" {...register("eventEndTime")} />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="location">Location / Venue</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Nagercoil / Leela Palace"
                    {...register("location")}
                  />
                </div>

                {/* Event 1 Deliverables (Right below Event 1) */}
                <div className="md:col-span-3 pt-3 border-t space-y-2">
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

            {/* Subsequent Event Cards (Event 2, Event 3, ...) */}
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

                  {/* Per-Event Requirements */}
                  <div className="md:col-span-3 pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Requirements for Event {idx + 2} ({aEv.eventType === "Other" && aEv.customEventType ? aEv.customEventType : aEv.eventType})</span>
                      </Label>
                      {selectedRequirements.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleUpdateEvent(aEv.id, "requirements", [...selectedRequirements]);
                            if (otherRequirementValue) {
                              handleUpdateEvent(aEv.id, "otherRequirement", otherRequirementValue);
                            }
                            toast.success(`Copied requirements from Event 1 to Event ${idx + 2}`);
                          }}
                          className="h-6 text-[10px] px-2 py-0 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        >
                          Copy from Event 1
                        </Button>
                      )}
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
                <span>+ Add Another Event / Ceremony</span>
              </Button>
            </div>
          </div>

          {/* SECTION 4 — Lead Source */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>4. Lead Source</span>
            </h4>
            <div className="space-y-2">
              <Label htmlFor="source">How did this client discover you?</Label>
              <Select
                value={selectedSource}
                onValueChange={(val: any) => setValue("source", val, { shouldValidate: true })}
              >
                <SelectTrigger id="source">
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
                  <Label htmlFor="customSource" className="text-xs">
                    Specify Lead Source <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customSource"
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

          {/* SECTION 5 — Initial Client Note / Message */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>5. Initial Client Note / Message</span>
            </h4>
            <Textarea
              id="enquiryMessage"
              placeholder="Paste enquiry details, conversation notes, guest count, deliverables requested, shoot preferences..."
              rows={3}
              {...register("enquiryMessage")}
            />
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Create Enquiry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
