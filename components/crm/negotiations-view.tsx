"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquareQuote,
  ArrowUpRight,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  Phone,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { LeadWithDetails } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { updateLeadStatusServerAction, acceptQuotationServerAction } from "@/lib/crm-actions";

interface NegotiationsViewProps {
  leads: LeadWithDetails[];
}

export function NegotiationsView({ leads }: NegotiationsViewProps) {
  const router = useRouter();
  const [processingLeadId, setProcessingLeadId] = useState<string | null>(null);

  const negotiatingLeads = leads.filter(
    (l) =>
      l.lead_status === "Negotiation" ||
      l.lead_status?.toLowerCase() === "negotiation" ||
      l.quotations?.some((q) => q.status === "Negotiating")
  );

  const leadsWithQuotations = leads.filter(
    (l) =>
      l.lead_status === "Quotation Sent" ||
      (l.quotations && l.quotations.some((q) => q.status === "Sent"))
  );

  const handleQuickBook = async (lead: LeadWithDetails) => {
    try {
      setProcessingLeadId(lead.id);
      const quotation = lead.quotations?.[0];
      if (quotation) {
        await acceptQuotationServerAction(quotation.id, lead.id);
      } else {
        await updateLeadStatusServerAction(lead.id, "Accepted / Booked");
      }
      toast.success(`Booking confirmed for ${lead.client?.name || "Client"}!`);
      router.refresh();
    } catch {
      toast.error("Failed to confirm booking.");
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleStartNegotiation = async (leadId: string) => {
    try {
      setProcessingLeadId(leadId);
      await updateLeadStatusServerAction(leadId, "Negotiation");
      toast.success("Lead moved to Negotiation pipeline.");
      router.refresh();
    } catch {
      toast.error("Failed to move lead to Negotiation.");
    } finally {
      setProcessingLeadId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {negotiatingLeads.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground space-y-4 bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-2xs">
              <MessageSquareQuote className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <p className="font-bold text-foreground text-base">No active negotiations</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Leads where clients are discussing custom packages, rates, or dates will appear here.
                You can drag any enquiry to <strong>Negotiation</strong> on the Tracking Board or start a negotiation from a sent quotation.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <Link href="/crm?view=tracking">
                  <span>Open Client Tracking Board</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
                <Link href="/crm?view=quotations">
                  <span>View All Quotations</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {leadsWithQuotations.length > 0 && (
              <div className="mt-8 pt-6 border-t max-w-lg mx-auto text-left space-y-2.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span>Leads with Sent Quotations (Ready to Negotiate):</span>
                </span>
                <div className="space-y-2">
                  {leadsWithQuotations.slice(0, 3).map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border bg-background text-xs shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{l.client?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{l.event_type} • {formatCurrency(l.budget)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processingLeadId === l.id}
                        onClick={() => handleStartNegotiation(l.id)}
                        className="h-7 text-xs gap-1 border hover:border-purple-300"
                      >
                        <span>Move to Negotiation</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          negotiatingLeads.map((lead) => {
            const quotation = lead.quotations?.[0];
            const booking = lead.bookings?.[0];
            const isProcessing = processingLeadId === lead.id;

            return (
              <Card
                key={lead.id}
                className="shadow-2xs border-border/80 hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
              >
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

                <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="rounded-lg bg-purple-50/50 dark:bg-purple-950/20 p-2.5 text-xs space-y-1 border border-purple-100 dark:border-purple-900/30">
                      <p className="font-medium text-foreground">
                        <span className="text-muted-foreground">Next Action:</span>{" "}
                        {lead.next_action || "Review terms & finalize agreement"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                      <span>
                        Budget:{" "}
                        <strong className="text-foreground font-semibold">
                          {formatCurrency(lead.budget)}
                        </strong>
                      </span>
                      {quotation ? (
                        <span>
                          Quote:{" "}
                          <strong className="text-foreground font-semibold">
                            {formatCurrency(quotation.amount)}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          Event:{" "}
                          <strong className="text-foreground font-semibold">
                            {lead.event_date ? formatDate(lead.event_date) : "TBD"}
                          </strong>
                        </span>
                      )}
                    </div>

                    {lead.event_date && quotation && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Event Date:{" "}
                          <strong className="text-foreground font-semibold">
                            {formatDate(lead.event_date)}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Updated {formatDate(lead.updated_at)}</span>
                      {lead.client?.phone && (
                        <span className="font-mono text-[10px]">{lead.client.phone}</span>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isProcessing}
                        onClick={() => handleQuickBook(lead)}
                        className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Confirm Booking</span>
                      </Button>

                      <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <Link href={`/crm/${lead.id}?tab=financials`}>
                          <span>Manage Terms</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {lead.client?.whatsapp && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${lead.client.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(lead.client.name || "Client")},%20following%20up%20on%20our%20discussion%20regarding%20your%20${encodeURIComponent(lead.event_type || "event")}%20photography.`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WhatsApp Client
                          </a>
                        </Button>
                      )}

                      <RecordPaymentDialog
                        booking={booking}
                        leadId={lead.id}
                        triggerButton={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] text-muted-foreground hover:text-foreground ml-auto"
                          >
                            <Plus className="h-3 w-3 mr-1 text-emerald-600" />
                            <span>Log Advance</span>
                          </Button>
                        }
                      />
                    </div>
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
