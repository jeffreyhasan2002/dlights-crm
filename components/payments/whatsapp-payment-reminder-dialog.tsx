"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Copy, ExternalLink, IndianRupee, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { Booking, Profile } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface WhatsAppPaymentReminderDialogProps {
  booking: Booking;
  profile?: Profile;
  triggerButton?: React.ReactNode;
}

export function WhatsAppPaymentReminderDialog({
  booking,
  profile,
  triggerButton,
}: WhatsAppPaymentReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const clientName = booking.client?.name || "Valued Client";
  const phone = (booking.client?.whatsapp || booking.client?.phone || "").replace(/\D/g, "");
  const totalAmount = booking.total_amount || 0;
  const remainingAmount = booking.remaining_amount || 0;
  const isAdvancePending = !booking.advance_paid_at && (booking.advance_amount || 0) > 0;
  const dueAmount = isAdvancePending ? booking.advance_amount : remainingAmount;
  const dueType = isAdvancePending ? "Advance Booking Token" : "Remaining Project Balance";

  const studioName = profile?.business_name || "Dlight Studios";
  const defaultMessage = `Hi ${clientName},

Greetings from *${studioName}*! ✨

Friendly payment reminder regarding your photography project booking:

💼 *Booking Contract:* ${formatCurrency(totalAmount)}
💰 *${dueType}:* ${formatCurrency(dueAmount)}
${booking.final_payment_due_date ? `📅 *Due Date:* ${formatDate(booking.final_payment_due_date)}\n` : ""}We accept payments via *UPI (GPay / PhonePe)* or direct *Bank Transfer*.

Kindly reply with the transaction screenshot or UTR reference once transferred so we can issue your official receipt.

Thank you for choosing *${studioName}*!
— *${studioName} Accounts Team*`;

  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Payment reminder message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp chat...");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-[11px] h-7 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <MessageSquare className="h-3 w-3 text-emerald-600" />
            <span>WhatsApp Reminder</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <span>Send WhatsApp Payment Reminder</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send a polite, professional payment reminder for {clientName} ({formatCurrency(dueAmount)} due).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Quick Info Chip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Client & Contact</span>
              <span className="font-semibold text-foreground">{clientName}</span>
              {phone && <span className="text-muted-foreground block text-[11px]">+{phone}</span>}
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[11px]">Outstanding Due</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {formatCurrency(dueAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminderMessage" className="text-xs font-semibold">
                WhatsApp Message (Editable)
              </Label>
              <button
                type="button"
                onClick={() => setMessage(defaultMessage)}
                className="text-[11px] text-primary hover:underline"
              >
                Reset Default
              </button>
            </div>
            <Textarea
              id="reminderMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-sans text-xs min-h-[190px] leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy Message"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendWhatsApp}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open in WhatsApp</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
