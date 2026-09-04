"use client";

import * as React from "react";
import { useState } from "react";
import { Calendar, Clock, Edit3, Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { CRMEvent } from "@/types/crm";
import { updateEventServerAction, updateLeadServerAction } from "@/lib/crm-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventTypeCombobox } from "@/components/crm/event-type-combobox";
import { RequirementSelector } from "@/components/crm/requirement-selector";

interface EditEventDialogProps {
  event: CRMEvent;
  leadId: string;
  trigger?: React.ReactNode;
}

function getEventRequirements(event: CRMEvent) {
  let requirements = Array.isArray(event.requirements) ? event.requirements : [];
  let otherRequirement = event.other_requirement || "";

  if (event.notes) {
    const requirementMatch = event.notes.match(/\[REQUIREMENTS\]:\s*(\[[^\]]*\])/);
    if (requirements.length === 0 && requirementMatch) {
      try {
        requirements = JSON.parse(requirementMatch[1]);
      } catch {}
    }

    if (!otherRequirement) {
      const otherMatch = event.notes.match(/\[OTHER_REQ\]:\s*(.*)$/m);
      otherRequirement = otherMatch?.[1]?.trim() || "";
    }
  }

  return { requirements, otherRequirement };
}

export function EditEventDialog({ event, leadId, trigger }: EditEventDialogProps) {
  const parsed = getEventRequirements(event);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState(event.event_name || "");
  const [eventType, setEventType] = useState(event.event_type || "Wedding");
  const [customEventType, setCustomEventType] = useState(event.custom_event_type || "");
  const [eventDate, setEventDate] = useState(event.event_date || "");
  const [startTime, setStartTime] = useState(event.start_time || "");
  const [endTime, setEndTime] = useState(event.end_time || "");
  const [location, setLocation] = useState(event.location || "");
  const [requirements, setRequirements] = useState<string[]>(parsed.requirements);
  const [otherRequirement, setOtherRequirement] = useState(parsed.otherRequirement);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const nextParsed = getEventRequirements(event);
      setEventName(event.event_name || "");
      setEventType(event.event_type || "Wedding");
      setCustomEventType(event.custom_event_type || "");
      setEventDate(event.event_date || "");
      setStartTime(event.start_time || "");
      setEndTime(event.end_time || "");
      setLocation(event.location || "");
      setRequirements(nextParsed.requirements);
      setOtherRequirement(nextParsed.otherRequirement);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventName.trim() || !eventType || !eventDate) {
      toast.error("Event name, type, and date are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const eventData = {
        eventName: eventName.trim(),
        eventType,
        customEventType: customEventType.trim() || undefined,
        eventDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location.trim() || undefined,
        requirements,
        otherRequirement: otherRequirement.trim() || undefined,
      };
      const result = String(event.id).startsWith("ev-primary-")
        ? await updateLeadServerAction(leadId, {
            eventType,
            customEventType: customEventType.trim() || undefined,
            eventDate,
            eventStartTime: startTime || undefined,
            eventEndTime: endTime || undefined,
            location: location.trim() || undefined,
            requirements,
            otherRequirement: otherRequirement.trim() || undefined,
          })
        : await updateEventServerAction(event.id, eventData);

      if (!result.success) {
        toast.error("Failed to update ceremony", {
          description: (result as any).error || "Database error",
        });
        return;
      }

      toast.success("Ceremony updated successfully");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("An error occurred while updating the ceremony.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <Edit3 className="h-3.5 w-3.5" />
            Edit Ceremony
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Edit Ceremony
          </DialogTitle>
          <DialogDescription>
            Update this ceremony only. Other functions and lead details will remain unchanged.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`event-name-${event.id}`}>Function Name</Label>
            <Input
              id={`event-name-${event.id}`}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <EventTypeCombobox
              value={eventType}
              onChange={setEventType}
              customValue={customEventType}
              onCustomValueChange={setCustomEventType}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`event-date-${event.id}`}>Date</Label>
              <Input
                id={`event-date-${event.id}`}
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Clock className="h-3 w-3" />Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Clock className="h-3 w-3" />End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`event-location-${event.id}`} className="flex items-center gap-1"><MapPin className="h-3 w-3" />Venue / Location</Label>
            <Input
              id={`event-location-${event.id}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" />Deliverables</Label>
            <RequirementSelector
              selectedRequirements={requirements}
              onChange={setRequirements}
              otherRequirement={otherRequirement}
              onOtherRequirementChange={setOtherRequirement}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Ceremony
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
