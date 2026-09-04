"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, IndianRupee, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Booking, PaymentMethod, PaymentType } from "@/types/crm";
import { recordPaymentServerAction } from "@/lib/crm-actions";
import { formatCurrency } from "@/lib/utils";
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

interface RecordPaymentDialogProps {
  booking?: Booking;
  bookings?: Booking[];
  leadId?: string;
  triggerButton?: React.ReactNode;
}

export function RecordPaymentDialog({
  booking,
  bookings = [],
  leadId,
  triggerButton,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const allBookings = booking ? [booking] : bookings;
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    booking?.id || (bookings.length > 0 ? bookings[0].id : "")
  );

  const activeBooking = allBookings.find((b) => b.id === selectedBookingId) || booking;

  const [amount, setAmount] = useState<string>(
    activeBooking?.remaining_amount ? String(activeBooking.remaining_amount) : "10000"
  );
  const [paymentType, setPaymentType] = useState<PaymentType>(
    activeBooking && !activeBooking.advance_paid_at ? "Advance" : "Partial Payment"
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  const currentRemaining = activeBooking?.remaining_amount ?? 0;
  const expectedNewRemaining = Math.max(0, currentRemaining - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero");
      return;
    }

    try {
      setIsSubmitting(true);
      const targetLeadId = activeBooking?.lead_id || leadId;
      const res = await recordPaymentServerAction({
        bookingId: activeBooking?.id,
        leadId: targetLeadId,
        amount: numAmount,
        paymentType,
        paymentMethod,
        paymentDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Payment of ${formatCurrency(numAmount)} recorded successfully`);
        setOpen(false);
        setReference("");
        setNotes("");
        router.refresh();
      } else {
        toast.error("Failed to record payment", {
          description: (res as any)?.error || "Database error",
        });
      }
    } catch {
      toast.error("An unexpected error occurred while recording payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
            <Receipt className="h-3.5 w-3.5" />
            <span>Record Payment</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-emerald-600" />
            <span>Record Payment Receipt</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Log cash, UPI, or bank transfer deposits. Balances update automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {allBookings.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Project Contract</Label>
              <Select
                value={selectedBookingId}
                onValueChange={(val) => {
                  setSelectedBookingId(val);
                  const b = allBookings.find((item) => item.id === val);
                  if (b) {
                    setAmount(String(b.remaining_amount || b.advance_amount || 10000));
                    setPaymentType(!b.advance_paid_at ? "Advance" : "Partial Payment");
                  }
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose a client project" />
                </SelectTrigger>
                <SelectContent>
                  {allBookings.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.client?.name || "Client"}  Rem: {formatCurrency(b.remaining_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payAmount" className="text-xs font-semibold">
                Amount Received (?) *
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-xs font-bold"
                  placeholder="25000"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payDate" className="text-xs font-semibold">
                Date Received *
              </Label>
              <Input
                id="payDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Category</Label>
              <Select value={paymentType} onValueChange={(val: any) => setPaymentType(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Advance" className="text-xs">Advance Token</SelectItem>
                  <SelectItem value="Partial Payment" className="text-xs">Milestone / Partial</SelectItem>
                  <SelectItem value="Final Payment" className="text-xs">Final Settlement</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other / Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI" className="text-xs">UPI (GPay / PhonePe)</SelectItem>
                  <SelectItem value="Bank Transfer" className="text-xs">Bank Transfer (NEFT/IMPS)</SelectItem>
                  <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                  <SelectItem value="Card" className="text-xs">Credit / Debit Card</SelectItem>
                  <SelectItem value="Cheque" className="text-xs">Cheque</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payRef" className="text-xs font-semibold">
              Transaction Ref / UTR / Cheque #
            </Label>
            <Input
              id="payRef"
              placeholder="e.g. UTR49281729482 or GPay-98271"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payNotes" className="text-xs font-semibold">
              Payment Receipt Notes (Optional)
            </Label>
            <Textarea
              id="payNotes"
              placeholder="e.g. 50% advance token paid towards engagement shoot"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          {activeBooking && (
            <div className="rounded-xl bg-muted/40 p-3 border text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Contract Total:</span>
                <span className="font-semibold text-foreground">{formatCurrency(activeBooking.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Current Remaining Due:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(currentRemaining)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 text-foreground">
                <span>Remaining After This:</span>
                <span className={expectedNewRemaining === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}>
                  {formatCurrency(expectedNewRemaining)} {expectedNewRemaining === 0 && "(Fully Paid!)"}
                </span>
              </div>
            </div>
          )}

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
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Receipt className="h-3.5 w-3.5" />
              )}
              <span>Save & Record Payment</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
