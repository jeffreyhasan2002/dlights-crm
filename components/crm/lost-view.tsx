import * as React from "react";
import Link from "next/link";
import { XCircle, ArrowUpRight, AlertCircle } from "lucide-react";
import { LeadWithDetails } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LostViewProps {
  leads: LeadWithDetails[];
}

export function LostView({ leads }: LostViewProps) {
  const lostLeads = leads.filter((l) => l.lead_status === "Rejected / Lost");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {lostLeads.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            <XCircle className="h-10 w-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
            <p className="font-semibold text-foreground text-base">No lost enquiries</p>
            <p className="text-xs mt-1">Archived or rejected deals will be catalogued here for review.</p>
          </div>
        ) : (
          lostLeads.map((lead) => {
            const quotation = lead.quotations?.[0];
            return (
              <Card key={lead.id} className="shadow-xs border-zinc-200 dark:border-zinc-800 bg-muted/10">
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
                    <Badge variant="destructive" className="text-[10px]">Lost</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                    <p className="font-medium">
                      Outcome: {quotation?.rejection_reason || lead.next_action || "Deal closed without conversion"}
                    </p>
                    {quotation?.rejection_reason_other && (
                      <p className="text-[11px] mt-0.5">{quotation.rejection_reason_other}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>Budget: {formatCurrency(lead.budget)}</span>
                    <span>Closed {formatDate(lead.updated_at)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                      <Link href={`/crm/${lead.id}`}>
                        <span>History</span>
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
