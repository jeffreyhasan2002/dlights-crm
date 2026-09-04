"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Camera,
  IndianRupee,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { LeadWithDetails, Profile } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface WhatsAppProposalDialogProps {
  lead: LeadWithDetails;
  trigger?: React.ReactNode;
  profile?: Profile;
}

export function WhatsAppProposalDialog({ lead, trigger, profile }: WhatsAppProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const client = lead.client || {
    name: "Valued Client",
    phone: null,
    whatsapp: null,
    location: null,
  };

  const quotation = lead.quotations?.[0];
  const quotationAmount = quotation?.amount || lead.budget || 0;

  // Generate clean WhatsApp Markdown message
  const defaultMessage = useMemo(() => {
    const clientName = client.name || "Client";
    const eventType = lead.event_type || "Event";
    const eventDate = lead.event_date ? formatDate(lead.event_date) : "To Be Finalized";
    const timings =
      lead.event_start_time || lead.event_end_time
        ? `${lead.event_start_time || "TBD"} - ${lead.event_end_time || "TBD"}`
        : "Full Event Schedule";
    const venue = lead.location || client.location || "Venue (TBD)";

    // Contracted deliverables list
    let deliverablesText = "";
    if (lead.deliverables && lead.deliverables.length > 0) {
      deliverablesText = lead.deliverables
        .map((d) => `  • *${d.name}*${d.quantity > 1 ? ` (Qty: ${d.quantity})` : ""}${d.notes ? ` - _${d.notes}_` : ""}`)
        .join("\n");
    } else if (lead.requirements && Array.isArray(lead.requirements) && lead.requirements.length > 0) {
      deliverablesText = lead.requirements.map((r) => `  • *${r}*`).join("\n");
    } else {
      deliverablesText =
        "  • *Candid Photography* (High-res color graded stills)\n  • *Cinematic 4K Trailer* (3-5 min highlight)\n  • *Traditional Full Video Coverage*\n  • *Luxury Silk Photo Album* (40 Pages)";
    }

    const priceText = quotationAmount > 0 ? `₹${quotationAmount.toLocaleString("en-IN")}` : "Custom Estimate";
    const bookingAdvance = lead.bookings?.[0]?.advance_amount;
    const advanceAmount = bookingAdvance && bookingAdvance > 0
      ? `₹${bookingAdvance.toLocaleString("en-IN")}`
      : (quotationAmount > 0 ? `₹${Math.round(quotationAmount * 0.35).toLocaleString("en-IN")} (Token)` : "Advance Token");

    const studioName = profile?.business_name || "Dlight Studios";
    const photographerName = profile?.full_name || "Bruno Sangeeth";
    const studioPhone = profile?.whatsapp || profile?.phone || "+91 94888 88717";
    const studioLocation = profile?.default_location || "Nagercoil & Destination Shoots, India";

    return `✨ *${studioName.toUpperCase()} | PHOTOGRAPHY & CINEMATOGRAPHY PROPOSAL*

Hello *${clientName}*! Thank you for reaching out to *${studioName}*. We are excited to capture your *${eventType}* with our signature cinematic and candid storytelling.

━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *EVENT OVERVIEW*
📅 *Date:* ${eventDate}
⏰ *Timings:* ${timings}
📍 *Location:* ${venue}

📸 *PRODUCTION SCOPE & DELIVERABLES:*
${deliverablesText}

💰 *COMMERCIAL INVESTMENT:*
• *Total Package Investment:* *${priceText}*
• *Booking Advance Token:* ${advanceAmount} to confirm and reserve shoot dates.
• *Balance Settlement:* Upon completion of shoot / preview album approval.
━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 *Why ${studioName}?*
✓ Dual-Card Redundant Data Backup (Zero Risk)
✓ Professional Color Grading & Audio Engineering
✓ High-End Full-Frame Cinema Cameras & Prime Lenses
✓ Prompt & Reliable Post-Production Delivery

Please let us know if you'd like any custom additions. We look forward to creating timeless memories for you!

Warm regards,
*${photographerName} | ${studioName}*
📞 WhatsApp/Call: ${studioPhone}
📍 ${studioLocation}`;
  }, [lead, client, quotationAmount, profile]);

  const [message, setMessage] = useState(defaultMessage);

  React.useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage, open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("WhatsApp proposal copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappPhone = client.whatsapp || client.phone || "";
  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, "");

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      toast.error("Client phone number not available", {
        description: "Please copy the text and paste into your WhatsApp chat.",
      });
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp Proposal</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>WhatsApp Instant Proposal Generator</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                  Ready to Send
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Formatted with deliverables, event timings, and pricing. Edit below or copy directly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Client quick info */}
        <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-foreground">{client.name}</span>
            <span className="text-muted-foreground ml-2">({lead.event_type})</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-medium">
            <Badge variant="secondary" className="text-[10px]">
              {formatCurrency(quotationAmount)}
            </Badge>
          </div>
        </div>

        {/* Message preview and editable textarea */}
        <div className="flex-1 min-h-[280px] space-y-1.5">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="font-mono text-[11px] leading-relaxed h-[300px] resize-none bg-muted/20 border"
            placeholder="Proposal message..."
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t flex flex-col sm:flex-row items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs w-full sm:w-auto"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied to Clipboard!" : "Copy Proposal Text"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenWhatsApp}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="h-3 w-3 opacity-70 ml-0.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
