import * as React from "react";
import Link from "next/link";
import { CreditCard, IndianRupee, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PendingPaymentsListProps {
  bookings: Booking[];
}

export function PendingPaymentsList({ bookings }: PendingPaymentsListProps) {
  const pendingBookings = bookings.filter((b) => b.remaining_amount > 0 || !b.advance_paid_at);

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-emerald-50 p-1 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Pending Client Balances</CardTitle>
              <CardDescription className="text-xs">
                Advance and final payments due from confirmed bookings
              </CardDescription>
            </div>
          </div>
          <Link
            href="/payments"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Payments ledger</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
        {pendingBookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-foreground">No pending balances</p>
            <p className="text-xs mt-0.5">All booking contracts are fully settled.</p>
          </div>
        ) : (
          pendingBookings.map((b) => {
            const isAdvancePending = !b.advance_paid_at && b.advance_amount > 0;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/crm/${b.lead_id}`}
                      className="font-medium text-sm text-foreground hover:underline truncate"
                    >
                      {b.client?.name || "Client"}
                    </Link>
                    {isAdvancePending ? (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                        Advance Due: {formatCurrency(b.advance_amount)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background text-emerald-700 dark:text-emerald-300">
                        Advance Paid
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Total: {formatCurrency(b.total_amount)}</span>
                    <span>•</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Remaining: {formatCurrency(b.remaining_amount)}
                    </span>
                    {b.final_payment_due_date && (
                      <>
                        <span>•</span>
                        <span>Due {formatDate(b.final_payment_due_date)}</span>
                      </>
                    )}
                  </div>
                </div>

                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                  <Link href={`/crm/${b.lead_id}`}>
                    <span>Record</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
