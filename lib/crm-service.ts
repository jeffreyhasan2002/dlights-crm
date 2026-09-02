import { createClient as createServerSupabase } from "@/utils/supabase/server";
import {
  Lead,
  LeadWithDetails,
  Client,
  FollowUp,
  Communication,
  Activity,
  Quotation,
  Booking,
  Payment,
  CRMEvent,
  Note,
  Profile,
  DashboardMetrics,
  LeadStatus,
  ContactStatus,
  EventType,
  PaymentType,
  PaymentMethod,
} from "@/types/crm";

// In-memory fallback arrays for offline/preview mode
let memoryClients: Client[] = [];
let memoryLeads: Lead[] = [];
let memoryQuotations: Quotation[] = [];
let memoryBookings: Booking[] = [];
let memoryPayments: Payment[] = [];
let memoryEvents: CRMEvent[] = [];
let memoryFollowUps: FollowUp[] = [];
let memoryCommunications: Communication[] = [];
let memoryActivities: Activity[] = [];
let memoryNotes: Note[] = [];

let memoryProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  full_name: "Bruno Sangeeth",
  email: "dlightstudios@gmail.com",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  business_name: "Dlight Studios",
  phone: "+91 94888 88717",
  whatsapp: "+91 94888 88717",
  default_location: "Nagercoil, Tamil Nadu, India",
  currency: "INR",
  date_format: "dd/MM/yyyy",
  timezone: "Asia/Kolkata",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function isSupabaseLive(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("YOUR_PROJECT_ID") || url.includes("placeholder")) {
    return false;
  }
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function getAuthenticatedOwnerId(): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      return authData.user.id;
    }
    const { data: dbProfile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
    if (dbProfile?.id) {
      return dbProfile.id;
    }
  } catch {}
  return memoryProfile.id;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const leads = await getLeads();
  const followUps = await getFollowUps("all");
  const quotations = await getQuotations();
  const bookings = await getBookings();
  const events = await getEvents();
  const payments = await getPayments();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const newEnquiriesCount = leads.filter((l) => l.lead_status === "New Enquiry").length;
  const activeLeadsCount = leads.filter(
    (l) => l.lead_status !== "Accepted / Booked" && l.lead_status !== "Rejected / Lost"
  ).length;

  const followUpsTodayCount = followUps.filter((f) => {
    if (f.completed_at) return false;
    const sched = new Date(f.scheduled_at);
    return sched >= todayStart && sched < todayEnd;
  }).length;

  const overdueFollowUpsCount = followUps.filter((f) => {
    if (f.completed_at) return false;
    return new Date(f.scheduled_at) < now;
  }).length;

  const quotationsAwaitingCount = quotations.filter(
    (q) => q.status === "Sent" || q.status === "Viewed"
  ).length;

  const negotiationsCount = leads.filter((l) => l.lead_status === "Negotiation").length;
  const bookedEventsCount = bookings.length;
  const upcomingEventsCount = events.filter((e) => e.status === "Upcoming").length;

  const pendingAdvanceAmount = bookings
    .filter((b) => !b.advance_paid_at && b.advance_amount > 0)
    .reduce((sum, b) => sum + (b.advance_amount || 0), 0);

  const pendingFinalAmount = bookings.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalBookedValue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return {
    newEnquiriesCount,
    activeLeadsCount,
    followUpsTodayCount,
    overdueFollowUpsCount,
    quotationsAwaitingCount,
    negotiationsCount,
    bookedEventsCount,
    upcomingEventsCount,
    pendingAdvanceAmount,
    pendingFinalAmount,
    totalRevenue,
    totalBookedValue,
  };
}

export interface GetLeadsFilters {
  status?: string;
  contactStatus?: string;
  eventType?: string;
  search?: string;
  sortBy?: string;
}

export async function getLeads(filters: GetLeadsFilters = {}): Promise<LeadWithDetails[]> {
  const live = await isSupabaseLive();
  let leadsData: Lead[] = memoryLeads;
  let clientsData: Client[] = memoryClients;
  let quotationsData: Quotation[] = memoryQuotations;
  let bookingsData: Booking[] = memoryBookings;
  let followUpsData: FollowUp[] = memoryFollowUps;
  let communicationsData: Communication[] = memoryCommunications;
  let activitiesData: Activity[] = memoryActivities;
  let notesData: Note[] = memoryNotes;

  if (live) {
    try {
      const supabase = await createServerSupabase();
      const [
        { data: lData },
        { data: cData },
        { data: qData },
        { data: bData },
        { data: fData },
        { data: comData },
        { data: aData },
        { data: nData },
      ] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*"),
        supabase.from("quotations").select("*"),
        supabase.from("bookings").select("*"),
        supabase.from("follow_ups").select("*"),
        supabase.from("communications").select("*"),
        supabase.from("activities").select("*").order("created_at", { ascending: false }),
        supabase.from("notes").select("*").order("created_at", { ascending: false }),
      ]);

      if (lData) leadsData = lData;
      if (cData) clientsData = cData;
      if (qData) quotationsData = qData;
      if (bData) bookingsData = bData;
      if (fData) followUpsData = fData;
      if (comData) communicationsData = comData;
      if (aData) activitiesData = aData;
      if (nData) notesData = nData;
    } catch (err) {
      console.error("Error fetching leads from Supabase:", err);
    }
  }

  let results: LeadWithDetails[] = leadsData.map((lead) => {
    const client =
      clientsData.find((c) => c.id === lead.client_id) || {
        id: lead.client_id,
        owner_id: lead.owner_id,
        name: "Client",
        phone: null,
        whatsapp: null,
        email: null,
        location: null,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      };

    const leadQuotations = quotationsData.filter((q) => q.lead_id === lead.id);
    const leadBookings = bookingsData.filter((b) => b.lead_id === lead.id);
    const leadFollowUps = followUpsData.filter((f) => f.lead_id === lead.id);
    const leadCommunications = communicationsData.filter((c) => c.lead_id === lead.id);
    const leadActivities = activitiesData.filter((a) => a.lead_id === lead.id);
    const leadNotes = notesData.filter((n) => n.lead_id === lead.id);

    return {
      ...lead,
      source: (lead as any).source || (lead as any).lead_source || "Website",
      client,
      quotations: leadQuotations,
      bookings: leadBookings,
      follow_ups: leadFollowUps,
      communications: leadCommunications,
      activities: leadActivities,
      notes: leadNotes,
    };
  });

  if (filters.status && filters.status !== "All") {
    results = results.filter((l) => l.lead_status.toLowerCase() === filters.status?.toLowerCase());
  }

  if (filters.contactStatus && filters.contactStatus !== "All") {
    results = results.filter((l) => l.contact_status === filters.contactStatus);
  }

  if (filters.eventType && filters.eventType !== "All") {
    results = results.filter((l) => l.event_type === filters.eventType);
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    results = results.filter(
      (l) =>
        l.client?.name?.toLowerCase().includes(term) ||
        l.client?.phone?.toLowerCase().includes(term) ||
        l.client?.email?.toLowerCase().includes(term) ||
        l.location?.toLowerCase().includes(term) ||
        l.event_type.toLowerCase().includes(term) ||
        l.next_action?.toLowerCase().includes(term)
    );
  }

  return results;
}

export async function getLeadById(id: string): Promise<LeadWithDetails | null> {
  const all = await getLeads();
  let found = all.find((l) => l.id === id || l.id.toLowerCase() === id.toLowerCase());
  if (found) return found;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbLead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (dbLead) {
        const { data: dbClient } = await supabase
          .from("clients")
          .select("*")
          .eq("id", dbLead.client_id)
          .maybeSingle();

        const client = dbClient || {
          id: dbLead.client_id,
          owner_id: dbLead.owner_id,
          name: "Client Lead",
          phone: null,
          whatsapp: null,
          email: null,
          location: null,
          created_at: dbLead.created_at,
          updated_at: dbLead.updated_at,
        };

        const [
          { data: qData },
          { data: bData },
          { data: fData },
          { data: comData },
          { data: aData },
          { data: nData },
        ] = await Promise.all([
          supabase.from("quotations").select("*").eq("lead_id", dbLead.id),
          supabase.from("bookings").select("*").eq("lead_id", dbLead.id),
          supabase.from("follow_ups").select("*").eq("lead_id", dbLead.id),
          supabase.from("communications").select("*").eq("lead_id", dbLead.id),
          supabase.from("activities").select("*").eq("lead_id", dbLead.id).order("created_at", { ascending: false }),
          supabase.from("notes").select("*").eq("lead_id", dbLead.id).order("created_at", { ascending: false }),
        ]);

        return {
          ...dbLead,
          source: dbLead.source || "Website",
          client,
          quotations: qData || [],
          bookings: bData || [],
          follow_ups: fData || [],
          communications: comData || [],
          activities: aData || [],
          notes: nData || [],
        };
      }
    } catch (err) {
      console.error("Error fetching lead by id from Supabase:", err);
    }
  }

  return null;
}

export async function getClients(): Promise<Client[]> {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("clients").select("*").order("name");
      if (data) return data;
    } catch {}
  }
  return memoryClients;
}

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) || null;
}

export async function getFollowUps(
  type: "all" | "today" | "overdue" | "completed" = "all"
): Promise<FollowUp[]> {
  const leads = await getLeads();
  let rawList: FollowUp[] = memoryFollowUps;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("follow_ups").select("*");
      if (data) rawList = data;
    } catch {}
  }

  let list = rawList.map((f) => ({
    ...f,
    lead: leads.find((l) => l.id === f.lead_id),
  }));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  if (type === "today") {
    list = list.filter((f) => {
      if (f.completed_at) return false;
      const d = new Date(f.scheduled_at);
      return d >= todayStart && d < todayEnd;
    });
  } else if (type === "overdue") {
    list = list.filter((f) => {
      if (f.completed_at) return false;
      return new Date(f.scheduled_at) < now;
    });
  } else if (type === "completed") {
    list = list.filter((f) => !!f.completed_at);
  }

  return list.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
}

export async function getQuotations(statusFilter?: string): Promise<Quotation[]> {
  const leads = await getLeads();
  let rawList: Quotation[] = memoryQuotations;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("quotations").select("*");
      if (data) rawList = data;
    } catch {}
  }

  let list = rawList.map((q) => ({
    ...q,
    amount: q.amount ?? q.total_amount ?? 0,
    total_amount: q.total_amount ?? q.amount ?? 0,
    lead: leads.find((l) => l.id === q.lead_id),
  }));

  if (statusFilter && statusFilter !== "All") {
    list = list.filter((q) => q.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getBookings(): Promise<Booking[]> {
  const leads = await getLeads();
  const clients = await getClients();
  let rawBookings: Booking[] = memoryBookings;
  let rawPayments: Payment[] = memoryPayments;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const [{ data: bData }, { data: pData }] = await Promise.all([
        supabase.from("bookings").select("*"),
        supabase.from("payments").select("*"),
      ]);
      if (bData) rawBookings = bData;
      if (pData) rawPayments = pData;
    } catch {}
  }

  return rawBookings.map((b) => ({
    ...b,
    lead: leads.find((l) => l.id === b.lead_id),
    client: clients.find((c) => c.id === b.client_id),
    payments: rawPayments.filter((p) => p.booking_id === b.id),
  }));
}

export async function getPayments(): Promise<Payment[]> {
  const bookings = await getBookings();
  let rawPayments: Payment[] = memoryPayments;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("payments").select("*");
      if (data) rawPayments = data;
    } catch {}
  }

  return rawPayments
    .map((p) => ({
      ...p,
      booking: bookings.find((b) => b.id === p.booking_id),
    }))
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}

export async function getEvents(status?: string): Promise<CRMEvent[]> {
  const clients = await getClients();
  let rawEvents: CRMEvent[] = memoryEvents;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("events").select("*");
      if (data) rawEvents = data;
    } catch {}
  }

  let list = rawEvents.map((e) => ({
    ...e,
    client: clients.find((c) => c.id === e.client_id),
  }));

  if (status && status !== "All") {
    list = list.filter((e) => e.status.toLowerCase() === status.toLowerCase());
  }

  return list.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}

export async function getProfile(): Promise<Profile> {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
      if (data) {
        return {
          ...memoryProfile,
          ...data,
        };
      }
    } catch {}
  }
  return memoryProfile;
}

// ----------------------------------------------------------------------------
// MUTATION ACTIONS (SYNCED WITH SUPABASE & LOCAL CACHE)
// ----------------------------------------------------------------------------

export async function createLeadAction(data: {
  clientName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  eventType: EventType;
  eventDate?: string;
  location?: string;
  budget?: number;
  source?: string;
  enquiryMessage?: string;
}) {
  const cId = "c-" + Date.now();
  const lId = "l-" + Date.now();
  const now = new Date().toISOString();
  const source = data.source || "Website";

  const newClient: Client = {
    id: cId,
    owner_id: memoryProfile.id,
    name: data.clientName,
    phone: data.phone || null,
    whatsapp: data.whatsapp || data.phone || null,
    email: data.email || null,
    location: data.location || null,
    created_at: now,
    updated_at: now,
  };

  const newLead: Lead = {
    id: lId,
    client_id: cId,
    owner_id: memoryProfile.id,
    event_type: data.eventType,
    event_date: data.eventDate || null,
    location: data.location || null,
    budget: data.budget ? Number(data.budget) : null,
    source: source as any,
    lead_status: "New Enquiry",
    contact_status: "Not Contacted",
    enquiry_message: data.enquiryMessage || null,
    next_follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    follow_up_count: 0,
    next_action: "Initial contact via WhatsApp/Call to share portfolio and brochure",
    next_action_due_at: null,
    last_contacted_at: null,
    created_at: now,
    updated_at: now,
  };

  const newActivity: Activity = {
    id: "a-" + Date.now(),
    lead_id: lId,
    client_id: cId,
    owner_id: memoryProfile.id,
    activity_type: "ENQUIRY_CREATED",
    title: "New Enquiry Created",
    description: `New enquiry received via ${source} for ${data.eventType}.`,
    contact_method: "WhatsApp",
    client_response: null,
    metadata: { source, eventType: data.eventType },
    created_at: now,
  };

  const initialFollowUp: FollowUp = {
    id: "f-" + Date.now(),
    lead_id: lId,
    owner_id: memoryProfile.id,
    scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    contact_method: "WhatsApp",
    notes: "Follow up on initial enquiry & send rate card",
    completed_at: null,
    client_response: null,
    created_at: now,
    updated_at: now,
  };

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbClient, error: cErr } = await supabase
        .from("clients")
        .insert({
          owner_id: ownerId,
          name: data.clientName,
          phone: data.phone || null,
          whatsapp: data.whatsapp || data.phone || null,
          email: data.email || null,
          location: data.location || null,
        })
        .select()
        .single();

      if (cErr) {
        console.error("Supabase client insert error:", cErr);
      }

      if (dbClient) {
        const { data: dbLead, error: lErr } = await supabase
          .from("leads")
          .insert({
            client_id: dbClient.id,
            owner_id: ownerId,
            event_type: data.eventType,
            event_date: data.eventDate || null,
            location: data.location || null,
            budget: data.budget ? Number(data.budget) : null,
            source: source,
            lead_status: "New Enquiry",
            contact_status: "Not Contacted",
            enquiry_message: data.enquiryMessage || null,
            next_follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(),
            next_action: "Initial contact via WhatsApp/Call to share portfolio and brochure",
            follow_up_count: 0,
          })
          .select()
          .single();

        if (lErr) {
          console.error("Supabase lead insert error:", lErr);
        }

        if (dbLead) {
          await supabase.from("activities").insert({
            lead_id: dbLead.id,
            client_id: dbClient.id,
            owner_id: ownerId,
            activity_type: "ENQUIRY_CREATED",
            title: "New Enquiry Created",
            description: `New enquiry received via ${source} for ${data.eventType}.`,
            metadata: { source, eventType: data.eventType },
          });

          await supabase.from("follow_ups").insert({
            lead_id: dbLead.id,
            owner_id: ownerId,
            scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(),
            contact_method: "WhatsApp",
            notes: "Follow up on initial enquiry & send rate card",
          });

          // Sync into memory arrays
          memoryClients.unshift(dbClient);
          memoryLeads.unshift(dbLead);

          return { success: true, lead: dbLead, client: dbClient, leadId: dbLead.id };
        }
      }
    } catch (err) {
      console.error("Supabase createLeadAction exception:", err);
    }
  }

  // Memory fallback
  memoryClients.unshift(newClient);
  memoryLeads.unshift(newLead);
  memoryActivities.unshift(newActivity);
  memoryFollowUps.unshift(initialFollowUp);

  return { success: true, lead: newLead, client: newClient, leadId: lId };
}

export async function updateContactStatusAction(leadId: string, status: ContactStatus) {
  const lead = memoryLeads.find((l) => l.id === leadId);
  if (lead) {
    lead.contact_status = status;
    lead.updated_at = new Date().toISOString();
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      await supabase
        .from("leads")
        .update({
          contact_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      await supabase.from("activities").insert({
        lead_id: leadId,
        owner_id: ownerId,
        activity_type: "CONTACTED",
        title: "Contact Status Updated",
        description: `Contact status updated to "${status}".`,
        metadata: { status },
      });
    } catch {}
  }

  return { success: true };
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const lead = memoryLeads.find((l) => l.id === leadId);
  if (lead) {
    lead.lead_status = status;
    lead.updated_at = new Date().toISOString();
  }

  const newActivity: Activity = {
    id: "a-" + Date.now(),
    lead_id: leadId,
    owner_id: memoryProfile.id,
    activity_type: "STATUS_CHANGED",
    title: "Pipeline Stage Changed",
    description: `Pipeline stage changed to "${status}".`,
    created_at: new Date().toISOString(),
  };
  memoryActivities.unshift(newActivity);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      await supabase
        .from("leads")
        .update({
          lead_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      await supabase.from("activities").insert({
        lead_id: leadId,
        owner_id: ownerId,
        activity_type: "STATUS_CHANGED",
        title: "Pipeline Stage Changed",
        description: `Pipeline stage changed to "${status}".`,
        metadata: { status },
      });
    } catch {}
  }

  return { success: true };
}

export async function acceptQuotationAction(quotationId: string) {
  const quotation = memoryQuotations.find((q) => q.id === quotationId);
  if (quotation) {
    quotation.status = "Accepted";
    quotation.updated_at = new Date().toISOString();

    const lead = memoryLeads.find((l) => l.id === quotation.lead_id);
    if (lead) {
      lead.lead_status = "Accepted / Booked";
      lead.updated_at = new Date().toISOString();

      const bId = "b-" + Date.now();
      const qTotal = quotation.total_amount ?? quotation.amount ?? 0;
      const advanceAmount = Math.round(qTotal * 0.35);
      const remainingAmount = qTotal - advanceAmount;

      const newBooking: Booking = {
        id: bId,
        lead_id: lead.id,
        client_id: lead.client_id,
        owner_id: memoryProfile.id,
        booking_date: new Date().toISOString().split("T")[0],
        total_amount: qTotal,
        advance_amount: advanceAmount,
        remaining_amount: remainingAmount,
        advance_paid_at: null,
        final_payment_due_date: lead.event_date || null,
        notes: "35% advance token required to lock shoot dates.",
        booking_status: "Booking Confirmed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryBookings.unshift(newBooking);

      const newActivity: Activity = {
        id: "a-" + Date.now(),
        lead_id: lead.id,
        owner_id: memoryProfile.id,
        activity_type: "QUOTATION_ACCEPTED",
        title: "Quotation Accepted",
        description: `Quotation ${quotation.quotation_number} accepted. Project confirmed with booking value of ₹${qTotal.toLocaleString("en-IN")}.`,
        created_at: new Date().toISOString(),
      };
      memoryActivities.unshift(newActivity);
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbQ } = await supabase
        .from("quotations")
        .update({
          status: "Accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId)
        .select()
        .single();

      if (dbQ) {
        await supabase
          .from("leads")
          .update({
            lead_status: "Accepted / Booked",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbQ.lead_id);

        const { data: dbLead } = await supabase.from("leads").select("*").eq("id", dbQ.lead_id).single();
        if (dbLead) {
          const qAmount = Number(dbQ.amount) || 0;
          const advanceAmount = Math.round(qAmount * 0.35);
          const remainingAmount = qAmount - advanceAmount;

          await supabase.from("bookings").insert({
            lead_id: dbLead.id,
            client_id: dbLead.client_id,
            owner_id: dbLead.owner_id,
            booking_date: new Date().toISOString().split("T")[0],
            booking_status: "Booking Confirmed",
            total_amount: qAmount,
            advance_amount: advanceAmount,
            remaining_amount: remainingAmount,
            advance_paid_at: null,
            final_payment_due_date: dbLead.event_date || null,
            notes: "35% advance token required to lock shoot dates.",
          });

          await supabase.from("activities").insert({
            lead_id: dbLead.id,
            client_id: dbLead.client_id,
            owner_id: dbLead.owner_id,
            activity_type: "QUOTATION_ACCEPTED",
            title: "Quotation Accepted & Booking Confirmed",
            description: `Quotation ${dbQ.quotation_number} accepted. Project confirmed with booking value of ₹${qAmount.toLocaleString("en-IN")}.`,
            metadata: { amount: qAmount },
          });
        }
      }
    } catch (err) {
      console.error("Error accepting quotation in Supabase:", err);
    }
  }

  return { success: true };
}

export async function sendQuotationAction(quotationId: string) {
  const quotation = memoryQuotations.find((q) => q.id === quotationId);
  if (quotation) {
    quotation.status = "Sent";
    quotation.sent_at = new Date().toISOString();
    quotation.updated_at = new Date().toISOString();
    const lead = memoryLeads.find((l) => l.id === quotation.lead_id);
    if (lead) {
      lead.lead_status = "Quotation Sent";
      lead.updated_at = new Date().toISOString();
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbQ } = await supabase
        .from("quotations")
        .update({
          status: "Sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId)
        .select()
        .single();

      if (dbQ) {
        await supabase
          .from("leads")
          .update({
            lead_status: "Quotation Sent",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbQ.lead_id);

        const ownerId = await getAuthenticatedOwnerId();
        await supabase.from("activities").insert({
          lead_id: dbQ.lead_id,
          owner_id: ownerId,
          activity_type: "QUOTATION_SENT",
          title: "Quotation Sent",
          description: `Quotation ${dbQ.quotation_number} sent to client.`,
        });
      }
    } catch {}
  }

  return { success: true };
}

export async function rejectQuotationAction(
  quotationId: string,
  reason?: string,
  otherReason?: string
) {
  const quotation = memoryQuotations.find((q) => q.id === quotationId);
  if (quotation) {
    quotation.status = "Rejected";
    quotation.rejected_at = new Date().toISOString();
    quotation.updated_at = new Date().toISOString();
    const lead = memoryLeads.find((l) => l.id === quotation.lead_id);
    if (lead) {
      lead.lead_status = "Rejected / Lost";
      lead.updated_at = new Date().toISOString();
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbQ } = await supabase
        .from("quotations")
        .update({
          status: "Rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
          rejection_reason_other: otherReason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId)
        .select()
        .single();

      if (dbQ) {
        await supabase
          .from("leads")
          .update({
            lead_status: "Rejected / Lost",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbQ.lead_id);

        const ownerId = await getAuthenticatedOwnerId();
        await supabase.from("activities").insert({
          lead_id: dbQ.lead_id,
          owner_id: ownerId,
          activity_type: "QUOTATION_REJECTED",
          title: "Quotation Rejected",
          description: `Quotation marked as Rejected. ${reason ? `Reason: ${reason}` : ""}`,
        });
      }
    } catch {}
  }

  return { success: true };
}

export async function startNegotiationAction(quotationId: string, notes?: string) {
  const quotation = memoryQuotations.find((q) => q.id === quotationId);
  if (quotation) {
    quotation.status = "Negotiating";
    if (notes) quotation.notes = notes;
    quotation.updated_at = new Date().toISOString();
    const lead = memoryLeads.find((l) => l.id === quotation.lead_id);
    if (lead) {
      lead.lead_status = "Negotiation";
      lead.updated_at = new Date().toISOString();
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbQ } = await supabase
        .from("quotations")
        .update({
          status: "Negotiating",
          notes: notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId)
        .select()
        .single();

      if (dbQ) {
        await supabase
          .from("leads")
          .update({
            lead_status: "Negotiation",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbQ.lead_id);

        const ownerId = await getAuthenticatedOwnerId();
        await supabase.from("activities").insert({
          lead_id: dbQ.lead_id,
          owner_id: ownerId,
          activity_type: "NEGOTIATION_STARTED",
          title: "Negotiation Started",
          description: `Custom negotiation initiated. ${notes ? `Notes: "${notes}"` : ""}`,
        });
      }
    } catch {}
  }

  return { success: true };
}

export async function createQuotationAction(data: {
  leadId: string;
  totalAmount?: number;
  amount?: number;
  validUntil?: string;
  notes?: string;
}) {
  const qId = "q-" + Date.now();
  const qNum = "Q-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random() * 900));
  const total = data.totalAmount ?? data.amount ?? 0;
  const validity = data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const newQuote: Quotation = {
    id: qId,
    lead_id: data.leadId,
    owner_id: memoryProfile.id,
    quotation_number: qNum,
    status: "Sent",
    amount: total,
    total_amount: total,
    valid_until: validity,
    sent_at: new Date().toISOString(),
    pdf_url: null,
    notes: data.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryQuotations.unshift(newQuote);

  const lead = memoryLeads.find((l) => l.id === data.leadId);
  if (lead) {
    lead.lead_status = "Quotation Sent";
    lead.budget = total;
    lead.updated_at = new Date().toISOString();
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbQ, error: qErr } = await supabase
        .from("quotations")
        .insert({
          lead_id: data.leadId,
          owner_id: ownerId,
          quotation_number: qNum,
          status: "Sent",
          amount: total,
          valid_until: validity,
          sent_at: new Date().toISOString(),
          notes: data.notes || null,
        })
        .select()
        .single();

      if (qErr) {
        console.error("Supabase quotation insert error:", qErr);
      }

      await supabase
        .from("leads")
        .update({
          lead_status: "Quotation Sent",
          budget: total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.leadId);

      await supabase.from("activities").insert({
        lead_id: data.leadId,
        owner_id: ownerId,
        activity_type: "QUOTATION_CREATED",
        title: "Quotation Created & Sent",
        description: `Quotation ${qNum} for ₹${total.toLocaleString("en-IN")} drafted and sent to client.`,
        metadata: { quotation_number: qNum, amount: total },
      });

      if (dbQ) return { success: true, quotation: dbQ };
    } catch (err) {
      console.error("Error creating quotation in Supabase:", err);
    }
  }

  return { success: true, quotation: newQuote };
}

export async function recordPaymentAction(data: {
  bookingId: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}) {
  const pId = "p-" + Date.now();
  const newPayment: Payment = {
    id: pId,
    booking_id: data.bookingId,
    owner_id: memoryProfile.id,
    amount: data.amount,
    payment_type: data.paymentType,
    payment_method: data.paymentMethod,
    payment_date: new Date().toISOString().split("T")[0],
    reference: data.reference || null,
    notes: data.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryPayments.unshift(newPayment);

  const booking = memoryBookings.find((b) => b.id === data.bookingId);
  if (booking) {
    booking.remaining_amount = Math.max(0, booking.remaining_amount - data.amount);
    if (data.paymentType === "Advance" && !booking.advance_paid_at) {
      booking.advance_paid_at = new Date().toISOString();
    }
    booking.updated_at = new Date().toISOString();

    const newActivity: Activity = {
      id: "a-" + Date.now(),
      lead_id: booking.lead_id,
      client_id: booking.client_id,
      owner_id: memoryProfile.id,
      activity_type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      description: `Payment receipt of ₹${data.amount.toLocaleString("en-IN")} logged via ${data.paymentMethod}.`,
      created_at: new Date().toISOString(),
    };
    memoryActivities.unshift(newActivity);
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbP, error: pErr } = await supabase
        .from("payments")
        .insert({
          booking_id: data.bookingId,
          owner_id: ownerId,
          amount: data.amount,
          payment_type: data.paymentType,
          payment_method: data.paymentMethod,
          payment_date: new Date().toISOString().split("T")[0],
          reference: data.reference || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (pErr) {
        console.error("Supabase payment insert error:", pErr);
      }

      const { data: dbB } = await supabase.from("bookings").select("*").eq("id", data.bookingId).single();
      if (dbB) {
        const newRem = Math.max(0, (Number(dbB.remaining_amount) || 0) - data.amount);
        const updates: any = {
          remaining_amount: newRem,
          updated_at: new Date().toISOString(),
        };
        if (data.paymentType === "Advance" && !dbB.advance_paid_at) {
          updates.advance_paid_at = new Date().toISOString();
        }

        await supabase.from("bookings").update(updates).eq("id", data.bookingId);

        await supabase.from("activities").insert({
          lead_id: dbB.lead_id,
          client_id: dbB.client_id,
          owner_id: ownerId,
          activity_type: "PAYMENT_RECEIVED",
          title: "Payment Received",
          description: `Payment receipt of ₹${data.amount.toLocaleString("en-IN")} logged via ${data.paymentMethod}.`,
          metadata: { amount: data.amount, method: data.paymentMethod },
        });
      }

      if (dbP) return { success: true, payment: dbP };
    } catch (err) {
      console.error("Error recording payment in Supabase:", err);
    }
  }

  return { success: true, payment: newPayment };
}

export async function completeFollowUpAction(
  followUpId: string,
  clientResponse?: string,
  completionNotes?: string
) {
  const followUp = memoryFollowUps.find((f) => f.id === followUpId);
  if (followUp) {
    followUp.completed_at = new Date().toISOString();
    followUp.client_response = clientResponse || null;
    if (completionNotes) {
      followUp.notes = (followUp.notes ? followUp.notes + " | " : "") + completionNotes;
    }
    followUp.updated_at = new Date().toISOString();

    const newActivity: Activity = {
      id: "a-" + Date.now(),
      lead_id: followUp.lead_id,
      owner_id: memoryProfile.id,
      activity_type: "FOLLOW_UP",
      title: "Follow-up Completed",
      description: `Follow-up via ${followUp.contact_method} completed. ${clientResponse ? `Client feedback: "${clientResponse}"` : ""}`,
      created_at: new Date().toISOString(),
    };
    memoryActivities.unshift(newActivity);
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbF } = await supabase
        .from("follow_ups")
        .update({
          completed_at: new Date().toISOString(),
          client_response: clientResponse || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", followUpId)
        .select()
        .single();

      if (dbF) {
        await supabase.from("activities").insert({
          lead_id: dbF.lead_id,
          owner_id: ownerId,
          activity_type: "FOLLOW_UP",
          title: "Follow-up Completed",
          description: `Follow-up via ${dbF.contact_method} completed. ${clientResponse ? `Client feedback: "${clientResponse}"` : ""}`,
        });
      }
    } catch {}
  }

  return { success: true };
}

export async function scheduleFollowUpAction(data: {
  leadId: string;
  scheduledAt: string;
  contactMethod: string;
  notes?: string;
}) {
  const fId = "f-" + Date.now();
  const newFollowUp: FollowUp = {
    id: fId,
    lead_id: data.leadId,
    owner_id: memoryProfile.id,
    scheduled_at: data.scheduledAt,
    contact_method: data.contactMethod as any,
    notes: data.notes || null,
    completed_at: null,
    client_response: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryFollowUps.unshift(newFollowUp);

  const lead = memoryLeads.find((l) => l.id === data.leadId);
  if (lead) {
    lead.next_follow_up_at = data.scheduledAt;
    if (data.notes) lead.next_action = data.notes;
    lead.updated_at = new Date().toISOString();
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbF } = await supabase
        .from("follow_ups")
        .insert({
          lead_id: data.leadId,
          owner_id: ownerId,
          scheduled_at: data.scheduledAt,
          contact_method: data.contactMethod,
          notes: data.notes || null,
        })
        .select()
        .single();

      await supabase
        .from("leads")
        .update({
          next_follow_up_at: data.scheduledAt,
          next_action: data.notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.leadId);

      await supabase.from("activities").insert({
        lead_id: data.leadId,
        owner_id: ownerId,
        activity_type: "FOLLOW_UP",
        title: "Follow-up Scheduled",
        description: `Follow-up scheduled for ${new Date(data.scheduledAt).toLocaleDateString("en-IN")} via ${data.contactMethod}.`,
      });

      if (dbF) return { success: true, followUp: dbF };
    } catch {}
  }

  return { success: true, followUp: newFollowUp };
}

export async function addNoteAction(leadId: string, content: string) {
  const nId = "n-" + Date.now();
  const newNote: Note = {
    id: nId,
    lead_id: leadId,
    owner_id: memoryProfile.id,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryNotes.unshift(newNote);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbN } = await supabase
        .from("notes")
        .insert({
          lead_id: leadId,
          owner_id: ownerId,
          content,
        })
        .select()
        .single();

      await supabase.from("activities").insert({
        lead_id: leadId,
        owner_id: ownerId,
        activity_type: "NOTE_ADDED",
        title: "Note Added",
        description: `Note logged: "${content.substring(0, 60)}${content.length > 60 ? "..." : ""}"`,
      });

      if (dbN) return { success: true, note: dbN };
    } catch {}
  }

  return { success: true, note: newNote };
}

export async function logCommunicationAction(data: {
  leadId: string;
  contactMethod: string;
  direction: "Outgoing" | "Incoming";
  messageContent: string;
  clientResponse?: string;
}) {
  const comId = "com-" + Date.now();
  const newComm: Communication = {
    id: comId,
    lead_id: data.leadId,
    owner_id: memoryProfile.id,
    direction: data.direction,
    contact_method: data.contactMethod as any,
    message: data.messageContent,
    message_content: data.messageContent,
    client_response: data.clientResponse || null,
    created_at: new Date().toISOString(),
  };
  memoryCommunications.unshift(newComm);

  const lead = memoryLeads.find((l) => l.id === data.leadId);
  if (lead) {
    lead.last_contacted_at = new Date().toISOString();
    lead.contact_status = data.clientResponse ? "Responded" : "Contacted – Waiting for Response";
    lead.updated_at = new Date().toISOString();
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbC } = await supabase
        .from("communications")
        .insert({
          lead_id: data.leadId,
          owner_id: ownerId,
          direction: data.direction,
          contact_method: data.contactMethod,
          message: data.messageContent,
          client_response: data.clientResponse || null,
        })
        .select()
        .single();

      await supabase
        .from("leads")
        .update({
          last_contacted_at: new Date().toISOString(),
          contact_status: data.clientResponse ? "Responded" : "Contacted – Waiting for Response",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.leadId);

      await supabase.from("activities").insert({
        lead_id: data.leadId,
        owner_id: ownerId,
        activity_type: "CONTACTED",
        title: "Communication Logged",
        description: `${data.direction} ${data.contactMethod} message recorded.`,
      });

      if (dbC) return { success: true, communication: dbC };
    } catch {}
  }

  return { success: true, communication: newComm };
}

export async function updateNextActionAction(leadId: string, nextAction: string, followUpDate?: string) {
  const lead = memoryLeads.find((l) => l.id === leadId);
  if (lead) {
    lead.next_action = nextAction;
    if (followUpDate) lead.next_follow_up_at = followUpDate;
    lead.updated_at = new Date().toISOString();
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      await supabase
        .from("leads")
        .update({
          next_action: nextAction,
          next_follow_up_at: followUpDate || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);
    } catch {}
  }

  return { success: true };
}

export async function createEventAction(data: {
  clientId: string;
  leadId?: string;
  eventName: string;
  eventType: EventType;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  notes?: string;
}) {
  const eId = "e-" + Date.now();
  const event: CRMEvent = {
    id: eId,
    client_id: data.clientId,
    lead_id: data.leadId || null,
    owner_id: memoryProfile.id,
    event_name: data.eventName,
    event_type: data.eventType,
    event_date: data.eventDate,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    location: data.venue || null,
    notes: data.notes || null,
    status: "Upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryEvents.unshift(event);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbE } = await supabase
        .from("events")
        .insert({
          client_id: data.clientId,
          lead_id: data.leadId || null,
          owner_id: ownerId,
          event_name: data.eventName,
          event_type: data.eventType,
          event_date: data.eventDate,
          start_time: data.startTime || null,
          end_time: data.endTime || null,
          location: data.venue || null,
          notes: data.notes || null,
          status: "Upcoming",
        })
        .select()
        .single();

      if (dbE) {
        return { success: true, event: dbE };
      }
    } catch {}
  }

  return { success: true, event };
}

export async function updateProfileAction(profileData: Partial<Profile>) {
  memoryProfile = {
    ...memoryProfile,
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: currentProfile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
      const profileId = currentProfile?.id || memoryProfile.id;

      await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          business_name: profileData.business_name,
          phone: profileData.phone,
          whatsapp: profileData.whatsapp,
          email: profileData.email,
          default_location: profileData.default_location,
          currency: profileData.currency,
          date_format: profileData.date_format,
          timezone: profileData.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    } catch {}
  }

  return { success: true, profile: memoryProfile };
}

// ----------------------------------------------------------------------------
// DELETION ACTIONS (CASCADE SAFE)
// ----------------------------------------------------------------------------

export async function deleteLeadAction(leadId: string) {
  memoryLeads = memoryLeads.filter((l) => l.id !== leadId);
  memoryQuotations = memoryQuotations.filter((q) => q.lead_id !== leadId);
  memoryBookings = memoryBookings.filter((b) => b.lead_id !== leadId);
  memoryFollowUps = memoryFollowUps.filter((f) => f.lead_id !== leadId);
  memoryCommunications = memoryCommunications.filter((c) => c.lead_id !== leadId);
  memoryActivities = memoryActivities.filter((a) => a.lead_id !== leadId);
  memoryNotes = memoryNotes.filter((n) => n.lead_id !== leadId);
  memoryEvents = memoryEvents.filter((e) => e.lead_id !== leadId);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) {
        console.error("Error deleting lead from Supabase:", error);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error("Exception deleting lead:", err);
    }
  }

  return { success: true };
}

export async function deleteClientAction(clientId: string) {
  const clientLeads = memoryLeads.filter((l) => l.client_id === clientId);
  const clientLeadIds = new Set(clientLeads.map((l) => l.id));

  memoryClients = memoryClients.filter((c) => c.id !== clientId);
  memoryLeads = memoryLeads.filter((l) => l.client_id !== clientId);
  memoryQuotations = memoryQuotations.filter((q) => !clientLeadIds.has(q.lead_id));
  memoryBookings = memoryBookings.filter((b) => b.client_id !== clientId && !clientLeadIds.has(b.lead_id));
  memoryFollowUps = memoryFollowUps.filter((f) => !clientLeadIds.has(f.lead_id));
  memoryCommunications = memoryCommunications.filter((c) => !clientLeadIds.has(c.lead_id));
  memoryActivities = memoryActivities.filter((a) => a.client_id !== clientId && (!a.lead_id || !clientLeadIds.has(a.lead_id)));
  memoryNotes = memoryNotes.filter((n) => !clientLeadIds.has(n.lead_id));
  memoryEvents = memoryEvents.filter((e) => e.client_id !== clientId);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("clients").delete().eq("id", clientId);
      if (error) {
        console.error("Error deleting client from Supabase:", error);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error("Exception deleting client:", err);
    }
  }

  return { success: true };
}

export async function deleteQuotationAction(quotationId: string) {
  memoryQuotations = memoryQuotations.filter((q) => q.id !== quotationId);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      await supabase.from("quotations").delete().eq("id", quotationId);
    } catch {}
  }

  return { success: true };
}

export async function deletePaymentAction(paymentId: string) {
  const payment = memoryPayments.find((p) => p.id === paymentId);
  memoryPayments = memoryPayments.filter((p) => p.id !== paymentId);

  if (payment) {
    const booking = memoryBookings.find((b) => b.id === payment.booking_id);
    if (booking) {
      booking.remaining_amount = (booking.remaining_amount || 0) + payment.amount;
      booking.updated_at = new Date().toISOString();
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbP } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
      if (dbP) {
        await supabase.from("payments").delete().eq("id", paymentId);
        const { data: dbB } = await supabase.from("bookings").select("*").eq("id", dbP.booking_id).maybeSingle();
        if (dbB) {
          const newRem = (Number(dbB.remaining_amount) || 0) + Number(dbP.amount);
          await supabase.from("bookings").update({ remaining_amount: newRem, updated_at: new Date().toISOString() }).eq("id", dbB.id);
        }
      }
    } catch {}
  }

  return { success: true };
}

export async function deleteFollowUpAction(followUpId: string) {
  memoryFollowUps = memoryFollowUps.filter((f) => f.id !== followUpId);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      await supabase.from("follow_ups").delete().eq("id", followUpId);
    } catch {}
  }

  return { success: true };
}

export async function deleteEventAction(eventId: string) {
  memoryEvents = memoryEvents.filter((e) => e.id !== eventId);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      await supabase.from("events").delete().eq("id", eventId);
    } catch {}
  }

  return { success: true };
}
