import * as React from "react";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/crm-service";
import { LeadDetailView } from "@/components/crm/lead-detail-view";

export const revalidate = 0;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const lead = await getLeadById(resolvedParams.id);

  if (!lead) {
    notFound();
  }

  return <LeadDetailView initialLead={lead} />;
}
