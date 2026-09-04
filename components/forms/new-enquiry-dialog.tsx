"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Sparkles, Clock, Calendar, MapPin, User, FileText } from "lucide-react";
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
import { createLeadServerAction } from "@/lib/crm-actions";

const enquiryFormSchema = z
  .object({
    clientName: z.string().min(2, "Client name must be at least 2 characters"),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
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
    location: z.string().optional(),
    budget: z.coerce.number().positive("Budget must be greater than 0").optional().or(z.literal(0)),
    source: z.enum([
      "Instagram",
      "WhatsApp",
      "Referral",
      "Website",
      "Google",
      "Facebook",
      "Phone",
      "Existing Client",
      "Other",
    ]),
    enquiryMessage: z.string().optional(),
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
      message: 'Please specify your custom requirement when "Other" is selected.',
      path: ["otherRequirement"],
    }
  );

type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

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
      eventType: "Wedding",
      eventDate: "",
      eventStartTime: "",
      eventEndTime: "",
      location: "",
      budget: 0,
      source: "Instagram",
      enquiryMessage: "",
      requirements: [],
      otherRequirement: "",
    },
  });

  const selectedEventType = watch("eventType");
  const selectedSource = watch("source");
  const selectedRequirements = watch("requirements") || [];
  const otherRequirementValue = watch("otherRequirement") || "";

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await createLeadServerAction({
        clientName: data.clientName,
        phone: data.phone || undefined,
        whatsapp: data.whatsapp || data.phone || undefined,
        email: data.email || undefined,
        eventType: data.eventType,
        eventDate: data.eventDate || undefined,
        eventStartTime: data.eventStartTime || undefined,
        eventEndTime: data.eventEndTime || undefined,
        location: data.location || undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        source: data.source,
        enquiryMessage: data.enquiryMessage || undefined,
        requirements: data.requirements,
        otherRequirement: data.otherRequirement || undefined,
        profitPercentage: 30,
      });

      if (res.success && res.leadId) {
        toast.success("Enquiry created successfully!", {
          description: `${data.clientName} added to the CRM pipeline.`,
        });
        reset();
        setOpen(false);
        router.push(`/crm/${res.leadId}`);
      } else {
        toast.error("Failed to create enquiry", {
          description: (res as any)?.error || "Please check the entered values.",
        });
      }
    } catch (err) {
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
          <Button size="sm" className="gap-1.5 shadow-sm">
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
            Record client details, event timings, requirements scope, budget, and lead source.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* 1. Client Details Section */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Client Information</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
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

          {/* 2. Event Details & Timings Section */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Event Information & Schedule</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eventType">
                  Event Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedEventType}
                  onValueChange={(val: any) => setValue("eventType", val)}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select event type" />
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
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  {...register("eventDate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location / Venue</Label>
                <Input
                  id="location"
                  placeholder="e.g. Udaivilas / Nagercoil"
                  {...register("location")}
                />
              </div>

              {/* Event Timings: Start Time & End Time */}
              <div className="space-y-1.5">
                <Label htmlFor="eventStartTime" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Start Time</span>
                </Label>
                <Input
                  id="eventStartTime"
                  type="time"
                  {...register("eventStartTime")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventEndTime" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>End Time</span>
                </Label>
                <Input
                  id="eventEndTime"
                  type="time"
                  {...register("eventEndTime")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget">Estimated Budget (₹ INR)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 350000"
                  {...register("budget")}
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="source">Lead Source (How did they discover you?)</Label>
                <Select
                  value={selectedSource}
                  onValueChange={(val: any) => setValue("source", val)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp Direct</SelectItem>
                    <SelectItem value="Referral">Word of Mouth / Referral</SelectItem>
                    <SelectItem value="Website">Studio Website</SelectItem>
                    <SelectItem value="Google">Google Search</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Phone">Phone Call</SelectItem>
                    <SelectItem value="Existing Client">Existing Client</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 3. Requirements Section (Multi-select) */}
          <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Deliverables & Requirements Scope
            </h4>
            <RequirementSelector
              selectedRequirements={selectedRequirements}
              onChange={(reqs) => setValue("requirements", reqs, { shouldValidate: true })}
              otherRequirement={otherRequirementValue}
              onOtherRequirementChange={(val) => setValue("otherRequirement", val, { shouldValidate: true })}
              error={errors.otherRequirement?.message}
            />
          </div>

          {/* 4. Notes / Message */}
          <div className="space-y-1.5">
            <Label htmlFor="enquiryMessage">Initial Client Note / Message</Label>
            <Textarea
              id="enquiryMessage"
              placeholder="Paste enquiry text, guest count, deliverables requested, shoot preferences..."
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[130px]">
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
