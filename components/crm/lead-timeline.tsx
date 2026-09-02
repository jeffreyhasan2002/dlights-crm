import * as React from "react";
import {
  Sparkles,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  FileText,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  CreditCard,
  Calendar,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { Activity, ActivityType } from "@/types/crm";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LeadTimelineProps {
  activities: Activity[];
}

export function LeadTimeline({ activities }: LeadTimelineProps) {
  const getActivityIcon = (type: string) => {
    const norm = type ? type.toUpperCase().replace(/\s+/g, "_") : "";
    switch (norm) {
      case "LEAD_CREATED":
      case "ENQUIRY_CREATED":
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case "CONTACTED":
      case "COMMUNICATION_LOGGED":
        return <Phone className="h-4 w-4 text-sky-500" />;
      case "FOLLOW_UP":
      case "FOLLOW_UP_SCHEDULED":
      case "FOLLOW_UP_COMPLETED":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "STATUS_CHANGED":
        return <UserCheck className="h-4 w-4 text-indigo-500" />;
      case "QUOTATION_CREATED":
      case "QUOTATION_SENT":
      case "QUOTATION_VIEWED":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "NEGOTIATION_STARTED":
        return <MessageSquareQuote className="h-4 w-4 text-orange-500" />;
      case "QUOTATION_ACCEPTED":
      case "BOOKING_CONFIRMED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "QUOTATION_REJECTED":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "PAYMENT_RECEIVED":
      case "PAYMENT_LOGGED":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case "EVENT_UPCOMING":
      case "EVENT_COMPLETED":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "NOTE_ADDED":
      default:
        return <StickyNote className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Chronological Relationship & Activity Timeline
      </h3>

      {activities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
          No activities recorded yet for this client lead.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-xs">
                {getActivityIcon(act.activity_type)}
              </div>

              {/* Content Box */}
              <div className="rounded-lg border bg-card p-3 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{act.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(act.created_at)}
                  </span>
                </div>

                {act.description && (
                  <p className="text-xs text-muted-foreground">{act.description}</p>
                )}

                {act.client_response && (
                  <div className="rounded bg-muted/50 p-2 text-xs text-foreground mt-1">
                    <span className="font-semibold text-muted-foreground">Client Response:</span>{" "}
                    {act.client_response}
                  </div>
                )}

                {act.contact_method && (
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      via {act.contact_method}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
