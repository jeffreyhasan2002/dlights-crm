"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit3, Loader2, Sparkles, Clock, Calendar, User, MapPin } from "lucide-react";
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
import { updateLeadServerAction } from "@/lib/crm-actions";
import { LeadWithDetails, EventType, LeadStatus, ContactStatus } from "@/types/crm";

const editLeadSchema = z
  .object({
    clientName: z.string().min(2, "Client name must be at least 2 characters"),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    location: z.string().optional(),
    eventType: z.enum([
      "Wedding",
      "Engagement",
      "Sangeet",
      "Reception",
      "Muhurtham",
      "Pre-Wedding",
      "Post-Wedding",
      "Birthday",
      "Baby Shoot",
      "Portrait",
      "Corporate",
      "Other",
    ]),
    eventDate: z.string().optional(),
    eventStartTime: z.string().optional(),
    eventEndTime: z.string().optional(),
    budget: z.coerce.number().optional().or(z.literal(0)),
    source: z.string().optional(),
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

interface EditLeadDialogProps {
  lead: LeadWithDetails;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditLeadDialog({ lead, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: EditLeadDialogProps) {
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
      location: lead.location || client.location || "",
      eventType: lead.event_type || "Wedding",
      eventDate: lead.event_date || "",
      eventStartTime: lead.event_start_time || "",
      eventEndTime: lead.event_end_time || "",
      budget: lead.budget || 0,
      source: lead.source || "Instagram",
      leadStatus: lead.lead_status || "New Enquiry",
      contactStatus: lead.contact_status || "Not Contacted",
      profitPercentage: lead.profit_percentage ?? 30,
      enquiryMessage: lead.enquiry_message || "",
      nextAction: lead.next_action || "",
      nextActionDueAt: lead.next_action_due_at ? lead.next_action_due_at.substring(0, 16) : "",
      requirements: lead.requirements || [],
      otherRequirement: lead.other_requirement || "",
    },
  });

  // Re-sync default values when lead changes
  React.useEffect(() => {
    reset({
      clientName: lead.client?.name || "",
      phone: lead.client?.phone || "",
      whatsapp: lead.client?.whatsapp || "",
      email: lead.client?.email || "",
      location: lead.location || lead.client?.location || "",
      eventType: lead.event_type || "Wedding",
      eventDate: lead.event_date || "",
      eventStartTime: lead.event_start_time || "",
      eventEndTime: lead.event_end_time || "",
      budget: lead.budget || 0,
      source: lead.source || "Instagram",
      leadStatus: lead.lead_status || "New Enquiry",
      contactStatus: lead.contact_status || "Not Contacted",
      profitPercentage: lead.profit_percentage ?? 30,
      enquiryMessage: lead.enquiry_message || "",
      nextAction: lead.next_action || "",
      nextActionDueAt: lead.next_action_due_at ? lead.next_action_due_at.substring(0, 16) : "",
      requirements: lead.requirements || [],
      otherRequirement: lead.other_requirement || "",
    });
  }, [lead, reset]);

  const selectedEventType = watch("eventType");
  const selectedLeadStatus = watch("leadStatus");
  const selectedContactStatus = watch("contactStatus");
  const selectedSource = watch("source");
  const selectedRequirements = watch("requirements") || [];
  const otherRequirementValue = watch("otherRequirement") || "";

  const onSubmit = async (data: EditLeadFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await updateLeadServerAction(lead.id, {
        clientName: data.clientName,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || undefined,
        email: data.email || undefined,
        location: data.location || undefined,
        eventType: data.eventType,
        eventDate: data.eventDate || undefined,
        eventStartTime: data.eventStartTime || undefined,
        eventEndTime: data.eventEndTime || undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        source: data.source,
        leadStatus: data.leadStatus,
        contactStatus: data.contactStatus,
        profitPercentage: data.profitPercentage,
        enquiryMessage: data.enquiryMessage || undefined,
        nextAction: data.nextAction || undefined,
        nextActionDueAt: data.nextActionDueAt ? new Date(data.nextActionDueAt).toISOString() : undefined,
        requirements: data.requirements,
        otherRequirement: data.otherRequirement || undefined,
      });

      if (res.success) {
        toast.success("Lead details updated successfully!", {
          description: "All changes saved to database.",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to update lead", {
          description: (res as any)?.error || "Database update failed",
        });
      }
    } catch {
      toast.error("An error occurred while saving lead changes.");
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
          <Button size="sm" variant="outline" className="gap-1.5 text-xs shadow-2xs">
            <Edit3 className="h-3.5 w-3.5 text-primary" />
            <span>Edit Lead</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Full Lead & Event Specifications
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update complete client information, event timings, requirements, commercial margin, and pipeline status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* 1. Client Information */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Client Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="editEmail">Email Address</Label>
                <Input id="editEmail" type="email" {...register("email")} />
              </div>
            </div>
          </div>

          {/* 2. Event & Timings */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Event Details & Timings</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editEventType">Event Type</Label>
                <Select
                  value={selectedEventType}
                  onValueChange={(val: any) => setValue("eventType", val)}
                >
                  <SelectTrigger id="editEventType">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Engagement">Engagement</SelectItem>
                    <SelectItem value="Sangeet">Sangeet</SelectItem>
                    <SelectItem value="Reception">Reception</SelectItem>
                    <SelectItem value="Muhurtham">Muhurtham</SelectItem>
                    <SelectItem value="Pre-Wedding">Pre-Wedding</SelectItem>
                    <SelectItem value="Post-Wedding">Post-Wedding</SelectItem>
                    <SelectItem value="Birthday">Birthday</SelectItem>
                    <SelectItem value="Baby Shoot">Baby Shoot</SelectItem>
                    <SelectItem value="Portrait">Portrait</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editEventDate">Event Date</Label>
                <Input id="editEventDate" type="date" {...register("eventDate")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editLocation">Venue / Location</Label>
                <Input id="editLocation" {...register("location")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStartTime" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Start Time</span>
                </Label>
                <Input id="editStartTime" type="time" {...register("eventStartTime")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editEndTime" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>End Time</span>
                </Label>
                <Input id="editEndTime" type="time" {...register("eventEndTime")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editBudget">Estimated Budget (₹)</Label>
                <Input id="editBudget" type="number" {...register("budget")} />
              </div>
            </div>
          </div>

          {/* 3. Requirements Section */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Event Requirements Scope
            </h4>
            <RequirementSelector
              selectedRequirements={selectedRequirements}
              onChange={(reqs) => setValue("requirements", reqs, { shouldValidate: true })}
              otherRequirement={otherRequirementValue}
              onOtherRequirementChange={(val) => setValue("otherRequirement", val, { shouldValidate: true })}
              error={errors.otherRequirement?.message}
            />
          </div>

          {/* 4. CRM Status & Strategy */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pipeline & Commercial Margin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editLeadStatus">Lead Status</Label>
                <Select
                  value={selectedLeadStatus}
                  onValueChange={(val: any) => setValue("leadStatus", val)}
                >
                  <SelectTrigger id="editLeadStatus">
                    <SelectValue placeholder="Lead Status" />
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
                  onValueChange={(val: any) => setValue("contactStatus", val)}
                >
                  <SelectTrigger id="editContactStatus">
                    <SelectValue placeholder="Contact Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                    <SelectItem value="Contacted – Waiting for Response">Waiting for Response</SelectItem>
                    <SelectItem value="Responded">Responded</SelectItem>
                    <SelectItem value="No Response">No Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editProfitPct">Default Profit %</Label>
                <Input
                  id="editProfitPct"
                  type="number"
                  min={0}
                  max={500}
                  {...register("profitPercentage")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="editNextAction">Next Action Step</Label>
                <Input
                  id="editNextAction"
                  placeholder="e.g. Call client to discuss customized cinematography package"
                  {...register("nextAction")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editNextActionDue">Next Action Due Date</Label>
                <Input
                  id="editNextActionDue"
                  type="datetime-local"
                  {...register("nextActionDueAt")}
                />
              </div>
            </div>
          </div>

          {/* 5. Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="editEnquiryMessage">Enquiry Message / Client Brief</Label>
            <Textarea
              id="editEnquiryMessage"
              rows={2}
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
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
