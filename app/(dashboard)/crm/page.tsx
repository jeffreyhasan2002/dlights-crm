import * as React from "react";
import { getLeads, getFollowUps, getQuotations, getBookings } from "@/lib/crm-service";
import { CRMViewSwitcher } from "@/components/crm/crm-view-switcher";

export const revalidate = 0;

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; contactStatus?: string; eventType?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [leads, followUps, quotations, bookings] = await Promise.all([
    getLeads({
      status: resolvedSearchParams.status,
      contactStatus: resolvedSearchParams.contactStatus,
      eventType: resolvedSearchParams.eventType,
    }),
    getFollowUps("all"),
    getQuotations(),
    getBookings(),
  ]);

  return (
    <CRMViewSwitcher
      leads={leads}
      followUps={followUps}
      quotations={quotations}
      bookings={bookings}
      defaultView={resolvedSearchParams.view || "all"}
    />
  );
}
