"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight, Calendar, CreditCard } from "lucide-react";
import { LeadWithDetails, Booking } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BookedViewProps {
  leads: LeadWithDetails[];
  bookings: Booking[];
}

export function BookedView({ leads, bookings }: BookedViewProps) {
  const bookedLeads = leads.filter((l) => l.lead_status === "Accepted / Booked");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {bookedLeads.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="font-semibold text-foreground text-base">No booked projects yet</p>
            <p className="text-xs mt-1">Accepted client quotations will appear as confirmed bookings here.</p>
          </div>
        ) : (
          bookedLeads.map((lead) => {
            const booking = bookings.find((b) => b.lead_id === lead.id);
            return (
              <Card key={lead.id} className="shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/crm/${lead.id}`}
                        className="font-bold text-sm text-foreground hover:underline line-clamp-1"
                      >
                        {lead.client?.name}
                      </Link>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Badge variant="outline" className="text-[10px]">{lead.event_type}</Badge>
                        <span className="text-xs text-muted-foreground">{lead.location}</span>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="rounded-md bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contract Value:</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(booking?.total_amount || lead.budget)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Advance Token:</span>
                      <span className={booking?.advance_paid_at ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                        {booking?.advance_paid_at ? "Paid" : "Pending"} ({formatCurrency(booking?.advance_amount)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Remaining Dues:</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(booking?.remaining_amount || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {lead.event_date ? formatDate(lead.event_date) : "Date TBD"}
                    </span>
                    <span>Next: {lead.next_action || "Prep shoot"}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                      <Link href={`/crm/${lead.id}`}>
                        <span>Client Timeline</span>
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
