import * as React from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, MapPin, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react";

import { getEvents, getClients } from "@/lib/crm-service";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventSchedulerDialog, CalendarExportButtons } from "@/components/events/event-scheduler-dialog";

export const revalidate = 0;

export default async function EventsPage() {
  const [events, clients] = await Promise.all([
    getEvents(),
    getClients(),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Events & Shoot Schedule
          </h1>
          <p className="text-sm text-muted-foreground">
            Production shoots, wedding ceremonies, destination travel, and crew assignments.
          </p>
        </div>
        <EventSchedulerDialog clients={clients} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-foreground text-base">No scheduled events</p>
          </div>
        ) : (
          events.map((e) => (
            <Card key={e.id} className="shadow-xs hover:border-primary/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h3 className="font-bold text-base text-foreground line-clamp-1">
                      {e.event_name}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Badge variant="outline" className="text-[10px]">{e.event_type}</Badge>
                      <Badge variant="success" className="text-[10px]">{e.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span>{formatDate(e.event_date)}</span>
                  </div>

                  {e.start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{e.start_time} - {e.end_time || "Wrap"}</span>
                    </div>
                  )}

                  {e.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{e.location}</span>
                    </div>
                  )}
                </div>

                {e.notes && (
                  <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground block">Production Note:</span>
                    <p className="line-clamp-2">{e.notes}</p>
                  </div>
                )}

                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <CalendarExportButtons event={e} />
                  {e.lead_id && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground" asChild>
                      <Link href={`/crm/${e.lead_id}`} title="View Lead CRM Record">
                        <span>Details</span>
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
