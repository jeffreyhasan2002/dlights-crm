import * as React from "react";
import { notFound } from "next/navigation";
import { getLeadById, getProfile } from "@/lib/crm-service";
import { LeadDetailView } from "@/components/crm/lead-detail-view";

export const revalidate = 0;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [lead, profile] = await Promise.all([
    getLeadById(resolvedParams.id),
    getProfile(),
  ]);

  if (!lead) {
    notFound();
  }

  return <LeadDetailView initialLead={lead} profile={profile} />;
}
