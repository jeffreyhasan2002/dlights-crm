import * as React from "react";
import Link from "next/link";
import { MessageSquareQuote, ArrowUpRight, Calendar, IndianRupee, Clock } from "lucide-react";
import { LeadWithDetails } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NegotiationsViewProps {
  leads: LeadWithDetails[];
}

export function NegotiationsView({ leads }: NegotiationsViewProps) {
  const negotiatingLeads = leads.filter((l) => l.lead_status === "Negotiation");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {negotiatingLeads.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground space-y-3">
            <MessageSquareQuote className="h-10 w-10 mx-auto opacity-40 text-purple-600" />
            <div>
              <p className="font-semibold text-foreground text-base">No active negotiations</p>
              <p className="text-xs mt-1">
                Clients currently negotiating custom rates and deliverables will appear here.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <Link href="/crm?view=tracking">
                  <span>Open Client Tracking Board</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          negotiatingLeads.map((lead) => {
            const quotation = lead.quotations?.[0];
            return (
              <Card key={lead.id} className="shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all">
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
                    <Badge variant="purple" className="text-[10px]">Negotiating</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="rounded-md bg-purple-50/40 dark:bg-purple-950/20 p-2.5 text-xs space-y-1">
                    <p className="font-medium text-foreground">
                      <span className="text-muted-foreground">Next Action:</span>{" "}
                      {lead.next_action || "Review terms with client"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>Budget: <strong className="text-foreground">{formatCurrency(lead.budget)}</strong></span>
                    {quotation && (
                      <span>Quote: <strong className="text-foreground">{formatCurrency(quotation.amount)}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Updated {formatDate(lead.updated_at)}
                    </span>
                    <Button size="sm" variant="default" className="h-7 text-xs" asChild>
                      <Link href={`/crm/${lead.id}`}>
                        <span>Manage Deal</span>
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
