"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Sparkles } from "lucide-react";
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
import { createLeadServerAction } from "@/lib/crm-actions";

const enquiryFormSchema = z.object({
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
});

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
      location: "",
      budget: 0,
      source: "Instagram",
      enquiryMessage: "",
    },
  });

  const selectedEventType = watch("eventType");
  const selectedSource = watch("source");

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
        location: data.location || undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        source: data.source,
        enquiryMessage: data.enquiryMessage || undefined,
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Add New Enquiry
          </DialogTitle>
          <DialogDescription>
            Record a new client lead, enquiry event details, budget, and contact source.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Client Details Section */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client Details
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

          {/* Event Details Section */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event & Budget Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Label htmlFor="eventDate">Tentative Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  {...register("eventDate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Event Location / Venue</Label>
                <Input
                  id="location"
                  placeholder="e.g. Udaivilas, Udaipur / Mumbai"
                  {...register("location")}
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

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="source">Enquiry Source (How did they find you?)</Label>
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

          {/* Notes / Message */}
          <div className="space-y-1.5">
            <Label htmlFor="enquiryMessage">Initial Client Note / Message</Label>
            <Textarea
              id="enquiryMessage"
              placeholder="Paste enquiry text, guest count, deliverables requested or shoot preferences..."
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
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
