import * as React from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRMEvent } from "@/types/crm";
import { formatDate } from "@/lib/utils";

interface UpcomingEventsListProps {
  events: CRMEvent[];
}

export function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-indigo-50 p-1 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Shoots & Events</CardTitle>
              <CardDescription className="text-xs">
                Production dates, locations, and ceremony timings
              </CardDescription>
            </div>
          </div>
          <Link
            href="/events"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Full schedule</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium text-foreground">No upcoming events scheduled</p>
            <p className="text-xs mt-0.5">Events scheduled from bookings will appear here.</p>
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {e.event_name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
                    {e.event_type}
                  </Badge>
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">
                    {e.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground/90">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formatDate(e.event_date)}
                  </span>
                  {e.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {e.start_time} - {e.end_time || "Wrap"}
                    </span>
                  )}
                  {e.location && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="h-3 w-3" />
                      {e.location}
                    </span>
                  )}
                </div>
              </div>

              {e.lead_id && (
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" asChild>
                  <Link href={`/crm/${e.lead_id}`}>
                    <span>Client</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
