import * as React from "react";
import Link from "next/link";
import { CreditCard, IndianRupee, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

import { getBookings, getPayments } from "@/lib/crm-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const revalidate = 0;

export default async function PaymentsPage() {
  const [bookings, payments] = await Promise.all([
    getBookings(),
    getPayments(),
  ]);

  const totalContract = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAdvance = bookings
    .filter((b) => !b.advance_paid_at && b.advance_amount > 0)
    .reduce((sum, b) => sum + (b.advance_amount || 0), 0);
  const pendingFinal = bookings.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Payments & Advance Ledger
        </h1>
        <p className="text-sm text-muted-foreground">
          Track advances, payment milestones, settlement schedules, and cash receipts.
        </p>
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">Total Booked Contracts</span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totalContract)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{bookings.length} confirmed projects</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Total Collected Cash</span>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">{payments.length} transactions received</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Pending Advance Tokens</span>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
              {formatCurrency(pendingAdvance)}
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">Awaiting deposit</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">Outstanding Balance</span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(pendingFinal)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Due before/at event delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Financial Status Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Active Booking Contracts</CardTitle>
          <CardDescription className="text-xs">
            Overview of total booking value, advance paid status, and remaining dues
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Advance Token</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead>Final Due Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No booking contracts yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">When quotations are accepted, contracts will appear here.</p>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-xs text-foreground">
                      <Link href={`/crm/${b.lead_id}`} className="hover:underline">
                        {b.client?.name || "Client"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(b.booking_date)}</TableCell>
                    <TableCell className="text-xs font-bold">{formatCurrency(b.total_amount)}</TableCell>
                    <TableCell className="text-xs">
                      {b.advance_paid_at ? (
                        <Badge variant="success" className="text-[10px]">
                          Paid ({formatCurrency(b.advance_amount)})
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">
                          Due ({formatCurrency(b.advance_amount)})
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(b.remaining_amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.final_payment_due_date ? formatDate(b.final_payment_due_date) : "On Delivery"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/crm/${b.lead_id}`}>
                          <span>Record Payment</span>
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction History Ledger */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Payment Transactions History</CardTitle>
          <CardDescription className="text-xs">
            Individual receipts and payments logged across all shoots
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client / Booking</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference / UTR</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No payment transactions recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use Record Payment to log advance tokens and settlements.</p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-medium">{formatDate(p.payment_date)}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      {p.booking?.client?.name || "Client"}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{p.payment_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.payment_method}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.reference || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
