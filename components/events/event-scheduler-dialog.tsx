"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Clock, Download, ExternalLink, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

import { Client, CRMEvent, EventType } from "@/types/crm";
import { createEventServerAction } from "@/lib/crm-actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EventSchedulerDialogProps {
  clients?: Client[];
  triggerButton?: React.ReactNode;
}

export function EventSchedulerDialog({
  clients = [],
  triggerButton,
}: EventSchedulerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.length > 0 ? clients[0].id : ""
  );
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      toast.error("Please provide an event title and date");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createEventServerAction({
        clientId: selectedClientId || (clients[0]?.id ?? "c-default"),
        eventName: eventName.trim(),
        eventType,
        eventDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        venue: venue.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Shoot event "${eventName}" scheduled successfully`);
        setOpen(false);
        setEventName("");
        setVenue("");
        setNotes("");
        router.refresh();
      } else {
        toast.error("Failed to schedule event", {
          description: (res as any)?.error || "Database error",
        });
      }
    } catch {
      toast.error("An unexpected error occurred while scheduling the event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule Shoot Event</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>Schedule Production Shoot</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add a ceremony, wedding day, portrait session, or destination shoot to the studio calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Client Selector */}
          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-1.5">
            <Label htmlFor="evTitle" className="text-xs font-semibold">
              Event / Shoot Title *
            </Label>
            <Input
              id="evTitle"
              placeholder="e.g. Rachel & Rahul - Wedding Ceremony"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Type & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Event Type</Label>
              <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wedding" className="text-xs">Wedding</SelectItem>
                  <SelectItem value="Reception" className="text-xs">Reception</SelectItem>
                  <SelectItem value="Engagement" className="text-xs">Engagement</SelectItem>
                  <SelectItem value="Pre-Wedding" className="text-xs">Pre-Wedding</SelectItem>
                  <SelectItem value="Birthday" className="text-xs">Birthday</SelectItem>
                  <SelectItem value="Corporate" className="text-xs">Corporate</SelectItem>
                  <SelectItem value="Portrait" className="text-xs">Portrait</SelectItem>
                  <SelectItem value="Baby Shoot" className="text-xs">Baby Shoot</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evDate" className="text-xs font-semibold">
                Shoot Date *
              </Label>
              <Input
                id="evDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs font-semibold">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs font-semibold">
                End / Wrap Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="evVenue" className="text-xs font-semibold">
              Venue / Shoot Location
            </Label>
            <Input
              id="evVenue"
              placeholder="e.g. Royal Palace Hall, Nagercoil"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="evNotes" className="text-xs font-semibold">
              Production & Crew Briefing Notes
            </Label>
            <Textarea
              id="evNotes"
              placeholder="e.g. 2 Traditional Cameras + 1 Cinematic Gimbal. Drone approved."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarIcon className="h-3.5 w-3.5" />
              )}
              <span>Add to Schedule</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CalendarExportButtons({ event }: { event: CRMEvent }) {
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(event.event_name);
    const details = encodeURIComponent(event.notes || `Shoot scheduled by Dlight Studios for ${event.event_type}`);
    const location = encodeURIComponent(event.location || "");

    const dateStr = (event.event_date || "").replace(/-/g, "");
    const startHour = (event.start_time || "09:00").replace(":", "") + "00";
    const endHour = (event.end_time || "18:00").replace(":", "") + "00";

    const dates = `${dateStr}T${startHour}/${dateStr}T${endHour}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const handleDownloadIcs = () => {
    const dateStr = (event.event_date || "").replace(/-/g, "");
    const startHour = (event.start_time || "09:00").replace(":", "") + "00";
    const endHour = (event.end_time || "18:00").replace(":", "") + "00";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Dlight Studios//CRM Calendar//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `SUMMARY:${event.event_name}`,
      `DESCRIPTION:${event.notes || "Production shoot scheduled by Dlight Studios"}`,
      `LOCATION:${event.location || ""}`,
      `DTSTART:${dateStr}T${startHour}`,
      `DTEND:${dateStr}T${endHour}`,
      `STATUS:CONFIRMED`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.event_name.replace(/[^a-zA-Z0-9]/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calendar .ics file downloaded!");
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.open(getGoogleCalendarUrl(), "_blank")}
        className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
        title="Add to Google Calendar"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        <span>Google Cal</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleDownloadIcs}
        className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
        title="Download .ics for Apple Calendar & Outlook"
      >
        <Download className="h-2.5 w-2.5" />
        <span>iCal / .ics</span>
      </Button>
    </div>
  );
}
