"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Printer,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Camera,
  Film,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Users,
  HardDrive,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import { LeadWithDetails, Profile } from "@/types/crm";
import { formatDate } from "@/lib/utils";
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

interface ShootCallSheetDialogProps {
  lead: LeadWithDetails;
  trigger?: React.ReactNode;
  profile?: Profile;
}

export function ShootCallSheetDialog({ lead, trigger, profile }: ShootCallSheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const client = lead.client || {
    name: "Client",
    phone: null,
    whatsapp: null,
    location: null,
  };

  const eventDateStr = lead.event_date ? formatDate(lead.event_date) : "TBD";
  const venueLocation = lead.location || client.location || "Venue (TBD)";
  const startTime = lead.event_start_time || "09:00 AM";
  const endTime = lead.event_end_time || "06:00 PM";
  const callTime = lead.event_start_time ? `${lead.event_start_time} (Arrival 30m prior)` : "08:30 AM (Sharp)";

  // Format WhatsApp crew briefing text
  const crewBriefingText = useMemo(() => {
    let deliverablesList = "";
    if (lead.deliverables && lead.deliverables.length > 0) {
      deliverablesList = lead.deliverables.map((d) => `  • ${d.name} (${d.type || "Deliverable"})`).join("\n");
    } else if (lead.requirements && Array.isArray(lead.requirements) && lead.requirements.length > 0) {
      deliverablesList = lead.requirements.map((r) => `  • ${r}`).join("\n");
    } else {
      deliverablesList = "  • Candid Photography\n  • 4K Cinematic Trailer\n  • Traditional Coverage";
    }

    const studioName = profile?.business_name || "Dlight Studios";
    const coordinatorName = profile?.full_name || "Bruno Sangeeth";
    const studioPhone = profile?.whatsapp || profile?.phone || "+91 94888 88717";

    return `📋 *${studioName.toUpperCase()} — CREW CALL SHEET & SHOOT BRIEF*

🎬 *PROJECT:* ${client.name} — ${lead.event_type}
📅 *DATE:* ${eventDateStr}
⏰ *CALL TIME (CREW ARRIVAL):* ${callTime}
⏱️ *SHOOT TIMINGS:* ${startTime} - ${endTime}
📍 *VENUE LOCATION:* ${venueLocation}
🗺️ *MAPS LINK:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueLocation)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *CLIENT CONTACTS:*
• Primary Contact: ${client.name} (${client.phone || "Phone on file"})
• Emergency Contact: ${client.whatsapp || client.phone || "Available in studio CRM"}

📸 *CONTRACTED SCOPE OF COVERAGE:*
${deliverablesList}

⚡ *MANDATORY CREW CHECKLIST:*
✓ All camera bodies loaded with DUAL SD/CFexpress cards.
✓ Minimum 4 fully charged batteries per camera + V-mounts.
✓ Wireless Lav Mics tested with fresh receivers.
✓ Master Portable SSD ready for on-site redundant dump.
✓ Dress Code: All-Black Studio Polo / Semi-Formal.
📞 Production Contact: ${studioPhone}

Let's deliver master-class memories! 💪
— *${studioName} Production Management*`;
  }, [lead, client, eventDateStr, venueLocation, startTime, endTime, callTime, profile]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(crewBriefingText);
    setCopied(true);
    toast.success("Crew briefing copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Shoot Call Sheet</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[720px] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Shoot Day Call Sheet & Crew Briefing
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Print-ready 1-page production schedule and equipment briefing for your crew.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200">
              {lead.lead_status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Printable Production Sheet Body */}
        <div className="space-y-4 p-5 rounded-2xl bg-card border text-xs print:p-0 print:border-none print:shadow-none print:m-0">
          {/* Production Sheet Header */}
          <div className="flex items-center justify-between border-b pb-3.5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                {profile?.business_name || "Dlight Studios"} Production Management
              </span>
              <h2 className="text-lg font-bold text-foreground">
                Official Shoot Day Call Sheet
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Project Code: DL-{lead.id.slice(0, 8).toUpperCase()} • Issued by {profile?.full_name || "Bruno Sangeeth"}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="font-mono text-xs">
                {eventDateStr}
              </Badge>
            </div>
          </div>

          {/* Event & Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" />
                <span>Client & Event</span>
              </span>
              <p className="font-bold text-sm text-foreground">{client.name}</p>
              <Badge variant="outline" className="text-[10px] px-2 py-0">
                {lead.event_type}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Call & Shoot Timings</span>
              </span>
              <p className="font-semibold text-foreground">
                Call Time: <strong className="text-primary">{callTime}</strong>
              </p>
              <p className="text-muted-foreground text-[11px]">
                Shoot Hours: {startTime} to {endTime}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2 border-t pt-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-500" />
                <span>Venue & Navigation</span>
              </span>
              <p className="font-semibold text-foreground">{venueLocation}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueLocation)}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-[11px] inline-flex items-center gap-1"
              >
                <span>Open in Google Maps Navigation</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="space-y-1 sm:col-span-2 border-t pt-2 text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" />
                <span>Client Emergency Contact</span>
              </span>
              <p className="font-medium text-foreground">
                {client.phone ? `Phone: ${client.phone}` : "Phone: Not provided"}
                {client.whatsapp ? ` • WhatsApp: ${client.whatsapp}` : ""}
              </p>
            </div>
          </div>

          {/* Contracted Deliverables Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-primary" />
              <span>Contracted Scope of Deliverables</span>
            </h3>

            {lead.deliverables && lead.deliverables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lead.deliverables.map((d) => (
                  <div
                    key={d.id}
                    className="p-2 rounded-lg border bg-background flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">{d.name}</span>
                      {d.notes && <p className="text-[10px] text-muted-foreground">{d.notes}</p>}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Qty: {d.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : Array.isArray(lead.requirements) && lead.requirements.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.requirements.map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {r}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-xs">Standard candid & cinematic package.</p>
            )}
          </div>

          {/* Mandatory Equipment & Backup Protocol */}
          <div className="p-3.5 rounded-xl border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 space-y-2">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Mandatory Crew Guidelines & Data Security</span>
            </h3>
            <ul className="text-[11px] text-amber-800/90 dark:text-amber-200/90 space-y-1 list-disc list-inside">
              <li><strong>Dual-Card Redundancy:</strong> All cameras must write simultaneous RAW backups to Slot 1 & Slot 2.</li>
              <li><strong>Audio Sync:</strong> Wireless lapel mics must be attached to groom & officiant with safety channel -6dB.</li>
              <li><strong>On-Site Dump:</strong> Hand over all SD cards to Lead for master SSD dump before leaving the venue.</li>
              <li><strong>Dress Code:</strong> Clean all-black studio attire / semi-formal.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t flex flex-col sm:flex-row items-center justify-between print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs w-full sm:w-auto"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy Crew Briefing for WhatsApp"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs bg-primary text-primary-foreground w-full sm:w-auto shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print 1-Page Call Sheet</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
