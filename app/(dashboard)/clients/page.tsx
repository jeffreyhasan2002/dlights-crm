import * as React from "react";
import { getClients, getLeads, getBookings } from "@/lib/crm-service";
import { ClientsDirectoryView } from "@/components/clients/clients-directory-view";

export const revalidate = 0;

export default async function ClientsPage() {
  const [clients, leads, bookings] = await Promise.all([
    getClients(),
    getLeads(),
    getBookings(),
  ]);

  return <ClientsDirectoryView clients={clients} leads={leads} bookings={bookings} />;
}
