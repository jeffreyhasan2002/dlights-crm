"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  Check,
  Plus,
  ArrowUpRight,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { FollowUp } from "@/types/crm";
import { formatCurrency, formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { completeFollowUpServerAction } from "@/lib/crm-actions";

interface FollowUpsViewProps {
  initialFollowUps: FollowUp[];
  onFollowUpComplete?: (followUpId: string, updatedFollowUp: FollowUp) => void;
}

export function FollowUpsView({ initialFollowUps, onFollowUpComplete }: FollowUpsViewProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [tab, setTab] = useState<"all" | "today" | "overdue" | "completed">("all");
  const [search, setSearch] = useState("");
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [clientResponse, setClientResponse] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Sync state when props change
  useEffect(() => {
    setFollowUps(initialFollowUps);
  }, [initialFollowUps]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const dueTodayCount = followUps.filter((f) => {
    if (f.completed_at) return false;
    const d = new Date(f.scheduled_at);
    return d >= todayStart && d < todayEnd;
  }).length;

  const overdueCount = followUps.filter((f) => {
    if (f.completed_at) return false;
    return new Date(f.scheduled_at) < now;
  }).length;

  const completedCount = followUps.filter((f) => !!f.completed_at).length;

  const filtered = followUps.filter((f) => {
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      const matchClient = f.lead?.client?.name?.toLowerCase().includes(term);
      const matchPhone = f.lead?.client?.phone?.includes(term);
      const matchNotes = f.notes?.toLowerCase().includes(term);
      const matchEvent = f.lead?.event_type?.toLowerCase().includes(term);
      if (!matchClient && !matchPhone && !matchNotes && !matchEvent) return false;
    }

    if (tab === "today") {
      if (f.completed_at) return false;
      const d = new Date(f.scheduled_at);
      return d >= todayStart && d < todayEnd;
    }
    if (tab === "overdue") {
      if (f.completed_at) return false;
      return new Date(f.scheduled_at) < now;
    }
    if (tab === "completed") {
      return !!f.completed_at;
    }
    return true; // 'all'
  });

  const handleMarkDone = async () => {
    if (!completingFollowUp) return;
    const target = completingFollowUp;
    const updatedFollowUp: FollowUp = {
      ...target,
      completed_at: new Date().toISOString(),
      client_response: clientResponse || null,
      notes: completionNotes || target.notes,
    };

    // 1. Optimistic Local State Update
    setFollowUps((prev) =>
      prev.map((item) => (item.id === target.id ? updatedFollowUp : item))
    );

    // 2. Notify parent CRMViewSwitcher
    if (onFollowUpComplete) {
      onFollowUpComplete(target.id, updatedFollowUp);
    }

    setCompletingFollowUp(null);
    setClientResponse("");
    setCompletionNotes("");
    toast.success("Follow-up marked as completed!", {
      description: `Updated activity log for ${target.lead?.client?.name || "client"}.`,
    });

    try {
      setIsSubmitting(true);
      const res = await completeFollowUpServerAction(
        target.id,
        clientResponse || undefined,
        completionNotes || undefined
      );
      if (!res.success) {
        setFollowUps(initialFollowUps);
        toast.error("Failed to complete follow-up on server");
      } else {
        router.refresh();
      }
    } catch {
      setFollowUps(initialFollowUps);
      toast.error("An error occurred while completing follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header, Search & Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(val: any) => setTab(val)}>
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs">
              All ({followUps.length})
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs text-amber-700 dark:text-amber-300">
              Due Today ({dueTodayCount})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs text-destructive">
              Overdue ({overdueCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs text-emerald-700 dark:text-emerald-300">
              Completed ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search for 1000+ follow-ups */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search follow-ups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Follow-up Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="font-semibold text-foreground text-base">No follow-ups in this tab</p>
            <p className="text-xs mt-1">All scheduled communications are up to date.</p>
          </div>
        ) : (
          filtered.map((f) => {
            const overdue = isOverdue(f.scheduled_at, !!f.completed_at);
            const client = f.lead?.client;

            return (
              <Card
                key={f.id}
                className={`transition-all shadow-xs hover:border-primary/40 ${
                  f.completed_at
                    ? "bg-muted/10 opacity-75"
                    : overdue
                    ? "border-red-300 dark:border-red-900 bg-red-50/10"
                    : ""
                }`}
              >
                <CardHeader className="p-4 pb-2 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <Link
                        href={`/crm/${f.lead_id}`}
                        className="font-bold text-sm text-foreground hover:underline line-clamp-1"
                      >
                        {client?.name || "Client Lead"}
                      </Link>
                      <p className="text-xs text-muted-foreground">{client?.location || "No location"}</p>
                    </div>

                    {f.completed_at ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800">
                        Completed
                      </Badge>
                    ) : overdue ? (
                      <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Scheduled</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  {/* Event & Scheduled info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{f.lead?.event_type || "Event"}</span>
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(f.scheduled_at)}
                    </span>
                  </div>

                  {/* Notes / Action */}
                  <div className="rounded-md bg-muted/40 p-2.5 text-xs text-foreground space-y-1">
                    <p className="text-muted-foreground font-medium text-[11px]">Action required:</p>
                    <p className="line-clamp-2">{f.notes || f.lead?.next_action || "Follow up on requirements"}</p>
                  </div>

                  {/* Completion response if completed */}
                  {f.client_response && (
                    <div className="rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-2 text-xs text-emerald-950 dark:text-emerald-200">
                      <span className="font-semibold">Response:</span> {f.client_response}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-2">
                      {client?.whatsapp && (
                        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                          <a
                            href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </a>
                        </Button>
                      )}
                      {client?.phone && (
                        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                          <a href={`tel:${client.phone}`} title="Call">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                          </a>
                        </Button>
                      )}
                    </div>

                    {!f.completed_at && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs gap-1 font-medium hover:bg-emerald-600 hover:text-white transition-colors"
                        onClick={() => setCompletingFollowUp(f)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Mark Done</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Completion Modal */}
      <Dialog open={!!completingFollowUp} onOpenChange={(open) => !open && setCompletingFollowUp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Complete Follow-up Task</DialogTitle>
            <DialogDescription className="text-xs">
              Record the client's response and any internal notes to update the activity audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="client-resp">Client's Feedback / Response</Label>
              <Input
                id="client-resp"
                placeholder="e.g. Agreed to ₹3,50,000 package, asked for quotation draft"
                value={clientResponse}
                onChange={(e) => setClientResponse(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comp-notes">Internal Studio Notes</Label>
              <Textarea
                id="comp-notes"
                placeholder="e.g. Bride requested same-day Instagram reel deliverable included"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompletingFollowUp(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleMarkDone}
              disabled={isSubmitting}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save & Complete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
