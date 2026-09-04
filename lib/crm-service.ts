import { cache } from "react";
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
  StudioNotification,
  LeadStatus,
  ContactStatus,
  EventType,
  PaymentType,
  PaymentMethod,
  LeadDeliverable,
  LeadExpense,
  ExpenseCalculation,
  ExpenseCalculationItem,
  DEFAULT_DELIVERABLES,
  DEFAULT_REQUIREMENTS,
  DEFAULT_EXPENSE_CATEGORIES,
  PostProductionStatus,
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
let memoryDeliverables: LeadDeliverable[] = [];
let memoryExpenses: LeadExpense[] = [];
let memoryExpenseCalculations: ExpenseCalculation[] = [];
let memoryExpenseCalculationItems: ExpenseCalculationItem[] = [];

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
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR_PROJECT_ID") || url.includes("placeholder")) {
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
    // Match the active owner ID of existing studio records
    const { data: leadOwner } = await supabase.from("leads").select("owner_id").limit(1).maybeSingle();
    if (leadOwner?.owner_id) {
      return leadOwner.owner_id;
    }
    const { data: dbProfile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
    if (dbProfile?.id) {
      return dbProfile.id;
    }
  } catch {}
  return memoryProfile.id;
}

export const getDashboardMetrics = cache(async (): Promise<DashboardMetrics> => {
  const [leads, followUps, quotations, bookings, events, payments] = await Promise.all([
    getLeads(),
    getFollowUps("all"),
    getQuotations(),
    getBookings(),
    getEvents(),
    getPayments(),
  ]);

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
    .filter((b) => !b.advance_paid_at && (b.advance_amount || 0) > 0)
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
});

export interface GetLeadsFilters {
  status?: string;
  contactStatus?: string;
  eventType?: string;
  search?: string;
  sortBy?: string;
}

export const getLeads = cache(async (filters: GetLeadsFilters = {}): Promise<LeadWithDetails[]> => {
  const live = await isSupabaseLive();
  let leadsData: Lead[] = memoryLeads;
  let clientsData: Client[] = memoryClients;
  let quotationsData: Quotation[] = memoryQuotations;
  let bookingsData: Booking[] = memoryBookings;
  let followUpsData: FollowUp[] = memoryFollowUps;
  let communicationsData: Communication[] = memoryCommunications;
  let activitiesData: Activity[] = memoryActivities;
  let notesData: Note[] = memoryNotes;
  let deliverablesData: LeadDeliverable[] = memoryDeliverables;
  let expensesData: LeadExpense[] = memoryExpenses;

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
        { data: delData },
        { data: expData },
      ] = await Promise.all([
        supabase
          .from("leads")
          .select("id, client_id, owner_id, event_type, event_date, event_start_time, event_end_time, location, budget, source, enquiry_message, requirements, other_requirement, profit_percentage, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("clients")
          .select("id, owner_id, name, phone, whatsapp, email, location, created_at, updated_at"),
        supabase
          .from("quotations")
          .select("id, owner_id, lead_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, rejected_at, rejection_reason, rejection_reason_other, notes, created_at, updated_at"),
        supabase
          .from("bookings")
          .select("id, owner_id, lead_id, client_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date, final_payment_paid_at, notes, created_at, updated_at"),
        supabase
          .from("follow_ups")
          .select("id, owner_id, lead_id, scheduled_at, completed_at, contact_method, notes, client_response, created_at, updated_at"),
        supabase
          .from("communications")
          .select("id, owner_id, lead_id, contact_method, direction, message, client_response, created_at"),
        supabase
          .from("activities")
          .select("id, owner_id, lead_id, client_id, activity_type, title, description, contact_method, client_response, metadata, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("id, owner_id, lead_id, content, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("lead_deliverables")
          .select("id, lead_id, owner_id, name, type, quantity, notes, is_custom, created_at, updated_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("lead_expenses")
          .select("id, lead_id, owner_id, expense_name, expense_category, amount, notes, is_custom, created_at, updated_at")
          .order("created_at", { ascending: true }),
      ]);

      if (lData) leadsData = lData as any[];
      if (cData) clientsData = cData as any[];
      if (qData) quotationsData = qData as any[];
      if (bData) bookingsData = bData as any[];
      if (fData) followUpsData = fData as any[];
      if (comData) communicationsData = comData as any[];
      if (aData) activitiesData = aData as any[];
      if (nData) notesData = nData as any[];
      if (delData) deliverablesData = delData as any[];
      if (expData) expensesData = expData as any[];
    } catch (err) {
      console.error("Error fetching leads from Supabase:", err);
    }
  }

  // O(1) Index Lookup Maps
  const clientMap = new Map<string, Client>(clientsData.map((c) => [c.id, c]));
  const quotationMap = new Map<string, Quotation[]>();
  for (const q of quotationsData) {
    if (q.lead_id) {
      const arr = quotationMap.get(q.lead_id) || [];
      arr.push(q);
      quotationMap.set(q.lead_id, arr);
    }
  }

  const bookingMap = new Map<string, Booking[]>();
  for (const b of bookingsData) {
    if (b.lead_id) {
      const arr = bookingMap.get(b.lead_id) || [];
      arr.push(b);
      bookingMap.set(b.lead_id, arr);
    }
  }

  const followUpMap = new Map<string, FollowUp[]>();
  for (const f of followUpsData) {
    if (f.lead_id) {
      const arr = followUpMap.get(f.lead_id) || [];
      arr.push(f);
      followUpMap.set(f.lead_id, arr);
    }
  }

  const communicationMap = new Map<string, Communication[]>();
  for (const c of communicationsData) {
    if (c.lead_id) {
      const arr = communicationMap.get(c.lead_id) || [];
      arr.push(c);
      communicationMap.set(c.lead_id, arr);
    }
  }

  const activityMap = new Map<string, Activity[]>();
  for (const a of activitiesData) {
    if (a.lead_id) {
      const arr = activityMap.get(a.lead_id) || [];
      arr.push(a);
      activityMap.set(a.lead_id, arr);
    }
  }

  const noteMap = new Map<string, Note[]>();
  for (const n of notesData) {
    if (n.lead_id) {
      const arr = noteMap.get(n.lead_id) || [];
      arr.push(n);
      noteMap.set(n.lead_id, arr);
    }
  }

  const deliverableMap = new Map<string, LeadDeliverable[]>();
  for (const d of deliverablesData) {
    if (d.lead_id) {
      const arr = deliverableMap.get(d.lead_id) || [];
      arr.push(d);
      deliverableMap.set(d.lead_id, arr);
    }
  }

  const expenseMap = new Map<string, LeadExpense[]>();
  for (const e of expensesData) {
    if (e.lead_id) {
      const arr = expenseMap.get(e.lead_id) || [];
      arr.push(e);
      expenseMap.set(e.lead_id, arr);
    }
  }

  let results: LeadWithDetails[] = leadsData.map((lead) => {
    const client = clientMap.get(lead.client_id) || {
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

    let leadQuotations = quotationMap.get(lead.id) || [];
    let leadBookings = bookingMap.get(lead.id) || [];
    const leadFollowUps = followUpMap.get(lead.id) || [];
    const leadCommunications = communicationMap.get(lead.id) || [];
    const leadActivities = activityMap.get(lead.id) || [];
    const leadNotes = noteMap.get(lead.id) || [];
    const leadDeliverables = deliverableMap.get(lead.id) || [];
    const leadExpenses = expenseMap.get(lead.id) || [];

    if (lead.lead_status === "Accepted / Booked" && leadBookings.length === 0) {
      const totalAmount = Number(lead.budget) || 300000;
      const advanceAmount = Math.round(totalAmount * 0.35);
      const remainingAmount = totalAmount - advanceAmount;
      leadBookings = [
        {
          id: "b-" + lead.id,
          lead_id: lead.id,
          client_id: lead.client_id,
          owner_id: lead.owner_id,
          booking_status: "Booking Confirmed",
          booking_date: (lead.created_at || new Date().toISOString()).split("T")[0],
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          remaining_amount: remainingAmount,
          advance_paid_at: null,
          final_payment_due_date: lead.event_date || null,
          notes: "Confirmed booking contract.",
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.updated_at || new Date().toISOString(),
        },
      ];
    }

    let postProdData: any = {};
    const postProdNote = leadNotes.find((n) => n.content?.startsWith("[POST_PRODUCTION]:"));
    if (postProdNote) {
      try {
        postProdData = JSON.parse(postProdNote.content.replace("[POST_PRODUCTION]:", ""));
      } catch {}
    }

    return {
      ...lead,
      requirements: Array.isArray(lead.requirements) ? lead.requirements : [],
      profit_percentage: lead.profit_percentage ?? 30,
      source: (lead as any).source || (lead as any).lead_source || "Website",
      post_production_status: (lead as any).post_production_status || postProdData.status || "Raw Footage Backup",
      raw_storage_link: (lead as any).raw_storage_link || postProdData.rawStorageLink || null,
      selection_gallery_link: (lead as any).selection_gallery_link || postProdData.selectionGalleryLink || null,
      final_video_link: (lead as any).final_video_link || postProdData.finalVideoLink || null,
      gallery_password_pin: (lead as any).gallery_password_pin || postProdData.galleryPasswordPin || null,
      client,
      quotations: leadQuotations,
      bookings: leadBookings,
      follow_ups: leadFollowUps,
      communications: leadCommunications,
      activities: leadActivities,
      notes: leadNotes,
      deliverables: leadDeliverables,
      expenses: leadExpenses,
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
});

export const getLeadById = cache(async (id: string): Promise<LeadWithDetails | null> => {
  const all = await getLeads();
  let found = all.find((l) => l.id === id || l.id.toLowerCase() === id.toLowerCase());
  if (found) return found;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbLead } = await supabase
        .from("leads")
        .select("id, client_id, owner_id, event_type, event_date, event_start_time, event_end_time, location, budget, source, enquiry_message, requirements, other_requirement, profit_percentage, lead_status, contact_status, last_contacted_at, next_follow_up_at, follow_up_count, next_action, next_action_due_at, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (dbLead) {
        const { data: dbClient } = await supabase
          .from("clients")
          .select("id, owner_id, name, phone, whatsapp, email, location, created_at, updated_at")
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
          { data: delData },
          { data: expData },
        ] = await Promise.all([
          supabase.from("quotations").select("id, owner_id, lead_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, rejected_at, rejection_reason, rejection_reason_other, notes, created_at, updated_at").eq("lead_id", dbLead.id),
          supabase.from("bookings").select("id, owner_id, lead_id, client_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date, final_payment_paid_at, notes, created_at, updated_at").eq("lead_id", dbLead.id),
          supabase.from("follow_ups").select("id, owner_id, lead_id, scheduled_at, completed_at, contact_method, notes, client_response, created_at, updated_at").eq("lead_id", dbLead.id),
          supabase.from("communications").select("id, owner_id, lead_id, contact_method, direction, message, client_response, created_at").eq("lead_id", dbLead.id),
          supabase.from("activities").select("id, owner_id, lead_id, client_id, activity_type, title, description, contact_method, client_response, metadata, created_at").eq("lead_id", dbLead.id).order("created_at", { ascending: false }),
          supabase.from("notes").select("id, owner_id, lead_id, content, created_at, updated_at").eq("lead_id", dbLead.id).order("created_at", { ascending: false }),
          supabase.from("lead_deliverables").select("id, lead_id, owner_id, name, type, quantity, notes, is_custom, created_at, updated_at").eq("lead_id", dbLead.id).order("created_at", { ascending: true }),
          supabase.from("lead_expenses").select("id, lead_id, owner_id, expense_name, expense_category, amount, notes, is_custom, created_at, updated_at").eq("lead_id", dbLead.id).order("created_at", { ascending: true }),
        ]);

        let resolvedBookings: any[] = bData || [];
        if (dbLead.lead_status === "Accepted / Booked" && resolvedBookings.length === 0) {
          const totalAmount = Number(dbLead.budget) || 300000;
          const advanceAmount = Math.round(totalAmount * 0.35);
          const remainingAmount = totalAmount - advanceAmount;
          resolvedBookings = [
            {
              id: "b-" + dbLead.id,
              lead_id: dbLead.id,
              client_id: dbLead.client_id,
              owner_id: dbLead.owner_id,
              quotation_id: null,
              booking_status: "Booking Confirmed",
              booking_date: (dbLead.created_at || new Date().toISOString()).split("T")[0],
              total_amount: totalAmount,
              advance_amount: advanceAmount,
              remaining_amount: remainingAmount,
              advance_paid_at: null,
              final_payment_due_date: dbLead.event_date || null,
              notes: "Confirmed booking contract.",
              created_at: dbLead.created_at || new Date().toISOString(),
              updated_at: dbLead.updated_at || new Date().toISOString(),
            },
          ];
        }

        let postProdData: any = {};
        const postProdNote = ((nData as any) || []).find((n: any) => n.content?.startsWith("[POST_PRODUCTION]:"));
        if (postProdNote) {
          try {
            postProdData = JSON.parse(postProdNote.content.replace("[POST_PRODUCTION]:", ""));
          } catch {}
        }

        return {
          ...dbLead,
          requirements: Array.isArray(dbLead.requirements) ? dbLead.requirements : [],
          profit_percentage: dbLead.profit_percentage ?? 30,
          source: dbLead.source || "Website",
          post_production_status: (dbLead as any).post_production_status || postProdData.status || "Raw Footage Backup",
          raw_storage_link: (dbLead as any).raw_storage_link || postProdData.rawStorageLink || null,
          selection_gallery_link: (dbLead as any).selection_gallery_link || postProdData.selectionGalleryLink || null,
          final_video_link: (dbLead as any).final_video_link || postProdData.finalVideoLink || null,
          gallery_password_pin: (dbLead as any).gallery_password_pin || postProdData.galleryPasswordPin || null,
          client,
          quotations: (qData as any) || [],
          bookings: (resolvedBookings as any) || [],
          follow_ups: (fData as any) || [],
          communications: (comData as any) || [],
          activities: (aData as any) || [],
          notes: (nData as any) || [],
          deliverables: (delData as any) || [],
          expenses: (expData as any) || [],
        };
      }
    } catch (err) {
      console.error("Error fetching lead by id from Supabase:", err);
    }
  }

  return null;
});

export const getClients = cache(async (): Promise<Client[]> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("clients")
        .select("id, owner_id, name, phone, whatsapp, email, location, created_at, updated_at")
        .order("name");
      if (data) return data as any[];
    } catch {}
  }
  return memoryClients;
});

export const getClientById = cache(async (id: string): Promise<Client | null> => {
  const clients = await getClients();
  return clients.find((c) => c.id === id) || null;
});

export const getFollowUps = cache(async (
  type: "all" | "today" | "overdue" | "completed" = "all"
): Promise<FollowUp[]> => {
  const leads = await getLeads();
  let rawList: FollowUp[] = memoryFollowUps;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("follow_ups")
        .select("id, owner_id, lead_id, scheduled_at, completed_at, contact_method, notes, client_response, created_at, updated_at");
      if (data) rawList = data as any[];
    } catch {}
  }

  const leadMap = new Map(leads.map((l) => [l.id, l]));

  let list = rawList.map((f) => ({
    ...f,
    lead: leadMap.get(f.lead_id),
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
});

export const getQuotations = cache(async (statusFilter?: string): Promise<Quotation[]> => {
  const leads = await getLeads();
  let rawList: Quotation[] = memoryQuotations;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("quotations")
        .select("id, owner_id, lead_id, quotation_number, amount, valid_until, status, sent_at, viewed_at, accepted_at, rejected_at, rejection_reason, rejection_reason_other, notes, created_at, updated_at");
      if (data) rawList = data as any[];
    } catch {}
  }

  const leadMap = new Map(leads.map((l) => [l.id, l]));

  let list = rawList.map((q) => ({
    ...q,
    amount: q.amount ?? q.total_amount ?? 0,
    total_amount: q.total_amount ?? q.amount ?? 0,
    lead: leadMap.get(q.lead_id),
  }));

  if (statusFilter && statusFilter !== "All") {
    list = list.filter((q) => q.status.toLowerCase() === statusFilter.toLowerCase());
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});

export const getBookings = cache(async (): Promise<Booking[]> => {
  const leads = await getLeads();
  const clients = await getClients();
  let rawBookings: Booking[] = memoryBookings;
  let rawPayments: Payment[] = memoryPayments;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const [{ data: bData }, { data: pData }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, owner_id, lead_id, client_id, booking_status, booking_date, confirmed_at, total_amount, advance_amount, advance_due_date, advance_paid_at, remaining_amount, final_payment_due_date, final_payment_paid_at, notes, created_at, updated_at"),
        supabase
          .from("payments")
          .select("id, owner_id, booking_id, amount, payment_type, payment_method, payment_date, reference, notes, created_at"),
      ]);
      if (bData) rawBookings = bData as any[];
      if (pData) rawPayments = pData as any[];
    } catch {}
  }

  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const paymentMap = new Map<string, Payment[]>();
  for (const p of rawPayments) {
    if (p.booking_id) {
      const arr = paymentMap.get(p.booking_id) || [];
      arr.push(p);
      paymentMap.set(p.booking_id, arr);
    }
  }

  const existingLeadIds = new Set(rawBookings.map((b) => b.lead_id).filter(Boolean));
  for (const l of leads) {
    if (l.lead_status === "Accepted / Booked" && !existingLeadIds.has(l.id)) {
      const totalAmount = Number(l.budget) || 25000;
      const advanceAmount = Math.round(totalAmount * 0.35);
      const remainingAmount = totalAmount - advanceAmount;
      rawBookings.push({
        id: "b-" + l.id,
        lead_id: l.id,
        client_id: l.client_id,
        owner_id: l.owner_id,
        booking_status: "Booking Confirmed",
        booking_date: (l.created_at || new Date().toISOString()).split("T")[0],
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        remaining_amount: remainingAmount,
        advance_paid_at: null,
        final_payment_due_date: l.event_date || null,
        notes: "Confirmed booking contract.",
        created_at: l.created_at || new Date().toISOString(),
        updated_at: l.updated_at || new Date().toISOString(),
      });
    }
  }

  return rawBookings.map((b) => ({
    ...b,
    lead: leadMap.get(b.lead_id),
    client: clientMap.get(b.client_id) || (b.lead_id ? leadMap.get(b.lead_id)?.client : undefined),
    payments: paymentMap.get(b.id) || [],
  }));
});

export const getPayments = cache(async (): Promise<Payment[]> => {
  const bookings = await getBookings();
  let rawPayments: Payment[] = memoryPayments;

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("payments")
        .select("id, owner_id, booking_id, amount, payment_type, payment_method, payment_date, reference, notes, created_at");
      if (data) rawPayments = data as any[];
    } catch {}
  }

  const bookingMap = new Map(bookings.map((b) => [b.id, b]));

  return rawPayments
    .map((p) => ({
      ...p,
      booking: p.booking_id ? bookingMap.get(p.booking_id) : undefined,
    }))
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
});

export const getEvents = cache(async (status?: string): Promise<CRMEvent[]> => {
  const [clients, leads] = await Promise.all([getClients(), getLeads()]);
  let rawEvents: CRMEvent[] = [...memoryEvents];

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("events")
        .select("id, owner_id, lead_id, client_id, event_name, event_type, event_date, start_time, end_time, location, notes, status, created_at, updated_at");
      if (data) rawEvents = data as any[];
    } catch {}
  }

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const existingEventLeadIds = new Set(rawEvents.map((e) => e.lead_id).filter(Boolean));

  // Synthesize events for leads that have event_date
  for (const l of leads) {
    if (l.event_date && !existingEventLeadIds.has(l.id)) {
      rawEvents.push({
        id: "e-" + l.id,
        lead_id: l.id,
        client_id: l.client_id,
        owner_id: l.owner_id,
        event_name: `${l.client?.name || "Client"} - ${l.event_type} Shoot`,
        event_type: l.event_type,
        event_date: l.event_date,
        start_time: l.event_start_time || "09:00",
        end_time: l.event_end_time || "18:00",
        location: l.location || "Studio / On Location",
        notes: l.enquiry_message || `Scheduled ${l.event_type} shoot for ${l.client?.name || "client"}.`,
        status: "Upcoming",
        created_at: l.created_at || new Date().toISOString(),
        updated_at: l.updated_at || new Date().toISOString(),
      });
    }
  }

  let list = rawEvents.map((e) => ({
    ...e,
    event_name: (e as any).event_name || (e as any).title || "Shoot",
    client: clientMap.get(e.client_id) || (e.lead_id ? leads.find((l) => l.id === e.lead_id)?.client : undefined),
  }));

  if (status && status !== "All") {
    list = list.filter((e) => e.status.toLowerCase() === status.toLowerCase());
  }

  return list.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
});

export const getProfile = cache(async (): Promise<Profile> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, business_name, phone, whatsapp, default_location, currency, date_format, timezone, created_at, updated_at")
        .limit(1)
        .maybeSingle();
      if (data) {
        return {
          ...memoryProfile,
          ...data,
        };
      }
    } catch {}
  }
  return memoryProfile;
});

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
  eventStartTime?: string;
  eventEndTime?: string;
  location?: string;
  budget?: number;
  source?: string;
  enquiryMessage?: string;
  requirements?: string[];
  otherRequirement?: string;
  profitPercentage?: number;
}) {
  const cId = "c-" + Date.now();
  const lId = "l-" + Date.now();
  const now = new Date().toISOString();
  const source = data.source || "Website";
  const reqs = data.requirements || [];
  const profitPct = data.profitPercentage ?? 30;

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
    event_start_time: data.eventStartTime || null,
    event_end_time: data.eventEndTime || null,
    location: data.location || null,
    budget: data.budget ? Number(data.budget) : null,
    source: source as any,
    requirements: reqs,
    other_requirement: data.otherRequirement || null,
    profit_percentage: profitPct,
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
    metadata: { source, eventType: data.eventType, requirements: reqs },
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

  // Seed default deliverables based on requirements
  const initialDeliverables: LeadDeliverable[] = [];
  if (reqs.length > 0) {
    for (const r of reqs) {
      if (r === "Other" && data.otherRequirement) {
        initialDeliverables.push({
          id: "del-" + Math.random().toString(36).substring(2, 9),
          lead_id: lId,
          owner_id: memoryProfile.id,
          name: data.otherRequirement,
          type: "Custom",
          quantity: 1,
          notes: "Custom client requirement",
          is_custom: true,
          created_at: now,
          updated_at: now,
        });
      } else {
        const match = DEFAULT_DELIVERABLES.find((d) => d.name.toLowerCase() === r.toLowerCase());
        initialDeliverables.push({
          id: "del-" + Math.random().toString(36).substring(2, 9),
          lead_id: lId,
          owner_id: memoryProfile.id,
          name: match ? match.name : r,
          type: match ? match.type : "Requirement",
          quantity: match ? match.defaultQty : 1,
          notes: match ? match.notes : null,
          is_custom: false,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

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
            event_start_time: data.eventStartTime || null,
            event_end_time: data.eventEndTime || null,
            location: data.location || null,
            budget: data.budget ? Number(data.budget) : null,
            source: source,
            requirements: reqs,
            other_requirement: data.otherRequirement || null,
            profit_percentage: profitPct,
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
            metadata: { source, eventType: data.eventType, requirements: reqs },
          });

          await supabase.from("follow_ups").insert({
            lead_id: dbLead.id,
            owner_id: ownerId,
            scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(),
            contact_method: "WhatsApp",
            notes: "Follow up on initial enquiry & send rate card",
          });

          // Insert initial deliverables if any
          if (initialDeliverables.length > 0) {
            const dbDeliverables = initialDeliverables.map((d) => ({
              lead_id: dbLead.id,
              owner_id: ownerId,
              name: d.name,
              type: d.type,
              quantity: d.quantity,
              notes: d.notes,
              is_custom: d.is_custom,
            }));
            const { data: insertedDels } = await supabase
              .from("lead_deliverables")
              .insert(dbDeliverables)
              .select();
            if (insertedDels) {
              memoryDeliverables.unshift(...insertedDels);
            }
          }

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
  if (initialDeliverables.length > 0) {
    memoryDeliverables.unshift(...initialDeliverables);
  }

  return { success: true, lead: newLead, client: newClient, leadId: lId };
}

export async function updateLeadAction(leadId: string, data: {
  clientName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  eventType?: EventType;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  budget?: number;
  source?: string;
  enquiryMessage?: string;
  requirements?: string[];
  otherRequirement?: string;
  profitPercentage?: number;
  leadStatus?: LeadStatus;
  contactStatus?: ContactStatus;
  nextAction?: string;
  nextActionDueAt?: string;
}) {
  const now = new Date().toISOString();

  // Find lead in memory
  const memLead = memoryLeads.find((l) => l.id === leadId);
  if (memLead) {
    if (data.eventType !== undefined) memLead.event_type = data.eventType;
    if (data.eventDate !== undefined) memLead.event_date = data.eventDate || null;
    if (data.eventStartTime !== undefined) memLead.event_start_time = data.eventStartTime || null;
    if (data.eventEndTime !== undefined) memLead.event_end_time = data.eventEndTime || null;
    if (data.location !== undefined) memLead.location = data.location || null;
    if (data.budget !== undefined) memLead.budget = data.budget ? Number(data.budget) : null;
    if (data.source !== undefined) memLead.source = data.source as any;
    if (data.enquiryMessage !== undefined) memLead.enquiry_message = data.enquiryMessage || null;
    if (data.requirements !== undefined) memLead.requirements = data.requirements;
    if (data.otherRequirement !== undefined) memLead.other_requirement = data.otherRequirement || null;
    if (data.profitPercentage !== undefined) memLead.profit_percentage = data.profitPercentage;
    if (data.leadStatus !== undefined) memLead.lead_status = data.leadStatus;
    if (data.contactStatus !== undefined) memLead.contact_status = data.contactStatus;
    if (data.nextAction !== undefined) memLead.next_action = data.nextAction || null;
    if (data.nextActionDueAt !== undefined) memLead.next_action_due_at = data.nextActionDueAt || null;
    memLead.updated_at = now;

    if (memLead.client_id) {
      const memClient = memoryClients.find((c) => c.id === memLead.client_id);
      if (memClient) {
        if (data.clientName !== undefined) memClient.name = data.clientName;
        if (data.phone !== undefined) memClient.phone = data.phone || null;
        if (data.whatsapp !== undefined) memClient.whatsapp = data.whatsapp || null;
        if (data.email !== undefined) memClient.email = data.email || null;
        if (data.location !== undefined) memClient.location = data.location || null;
        memClient.updated_at = now;
      }
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      // Get lead to find client_id
      const { data: dbLead } = await supabase
        .from("leads")
        .select("client_id")
        .eq("id", leadId)
        .maybeSingle();

      if (dbLead?.client_id && (data.clientName || data.phone || data.whatsapp || data.email || data.location)) {
        await supabase
          .from("clients")
          .update({
            ...(data.clientName !== undefined ? { name: data.clientName } : {}),
            ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
            ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp || null } : {}),
            ...(data.email !== undefined ? { email: data.email || null } : {}),
            ...(data.location !== undefined ? { location: data.location || null } : {}),
            updated_at: now,
          })
          .eq("id", dbLead.client_id);
      }

      const leadUpdates: Record<string, any> = {
        updated_at: now,
      };
      if (data.eventType !== undefined) leadUpdates.event_type = data.eventType;
      if (data.eventDate !== undefined) leadUpdates.event_date = data.eventDate || null;
      if (data.eventStartTime !== undefined) leadUpdates.event_start_time = data.eventStartTime || null;
      if (data.eventEndTime !== undefined) leadUpdates.event_end_time = data.eventEndTime || null;
      if (data.location !== undefined) leadUpdates.location = data.location || null;
      if (data.budget !== undefined) leadUpdates.budget = data.budget ? Number(data.budget) : null;
      if (data.source !== undefined) leadUpdates.source = data.source;
      if (data.enquiryMessage !== undefined) leadUpdates.enquiry_message = data.enquiryMessage || null;
      if (data.requirements !== undefined) leadUpdates.requirements = data.requirements;
      if (data.otherRequirement !== undefined) leadUpdates.other_requirement = data.otherRequirement || null;
      if (data.profitPercentage !== undefined) leadUpdates.profit_percentage = data.profitPercentage;
      if (data.leadStatus !== undefined) leadUpdates.lead_status = data.leadStatus;
      if (data.contactStatus !== undefined) leadUpdates.contact_status = data.contactStatus;
      if (data.nextAction !== undefined) leadUpdates.next_action = data.nextAction || null;
      if (data.nextActionDueAt !== undefined) leadUpdates.next_action_due_at = data.nextActionDueAt || null;

      const { data: updatedDbLead, error: updateErr } = await supabase
        .from("leads")
        .update(leadUpdates)
        .eq("id", leadId)
        .select()
        .single();

      if (updateErr) {
        console.error("Error updating lead in Supabase:", updateErr);
        return { success: false, error: updateErr.message };
      }

      await supabase.from("activities").insert({
        lead_id: leadId,
        owner_id: ownerId,
        activity_type: "NOTE_ADDED",
        title: "Lead Details Updated",
        description: `Lead information updated by studio.`,
      });

      return { success: true, lead: updatedDbLead };
    } catch (err: any) {
      console.error("Exception in updateLeadAction:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function updateLeadPostProductionAction(
  leadId: string,
  data: {
    status?: PostProductionStatus;
    rawStorageLink?: string;
    selectionGalleryLink?: string;
    finalVideoLink?: string;
    galleryPasswordPin?: string;
  }
) {
  const now = new Date().toISOString();

  // Find lead in memory
  const memLead = memoryLeads.find((l) => l.id === leadId);
  if (memLead) {
    if (data.status !== undefined) memLead.post_production_status = data.status;
    if (data.rawStorageLink !== undefined) memLead.raw_storage_link = data.rawStorageLink || null;
    if (data.selectionGalleryLink !== undefined) memLead.selection_gallery_link = data.selectionGalleryLink || null;
    if (data.finalVideoLink !== undefined) memLead.final_video_link = data.finalVideoLink || null;
    if (data.galleryPasswordPin !== undefined) memLead.gallery_password_pin = data.galleryPasswordPin || null;
    memLead.updated_at = now;
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      // Try updating direct columns in leads table (if columns exist)
      const leadUpdates: Record<string, any> = { updated_at: now };
      if (data.status !== undefined) leadUpdates.post_production_status = data.status;
      if (data.rawStorageLink !== undefined) leadUpdates.raw_storage_link = data.rawStorageLink || null;
      if (data.selectionGalleryLink !== undefined) leadUpdates.selection_gallery_link = data.selectionGalleryLink || null;
      if (data.finalVideoLink !== undefined) leadUpdates.final_video_link = data.finalVideoLink || null;
      if (data.galleryPasswordPin !== undefined) leadUpdates.gallery_password_pin = data.galleryPasswordPin || null;

      try {
        await supabase.from("leads").update(leadUpdates).eq("id", leadId);
      } catch {}

      // Persist structured state into notes table for guaranteed cross-session persistence
      const { data: existingNotes } = await supabase
        .from("notes")
        .select("id, content")
        .eq("lead_id", leadId);

      const postProdNote = existingNotes?.find((n) => n.content?.startsWith("[POST_PRODUCTION]:"));
      let currentPayload: any = {};
      if (postProdNote) {
        try {
          currentPayload = JSON.parse(postProdNote.content.replace("[POST_PRODUCTION]:", ""));
        } catch {}
      }

      const mergedPayload = {
        ...currentPayload,
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.rawStorageLink !== undefined ? { rawStorageLink: data.rawStorageLink } : {}),
        ...(data.selectionGalleryLink !== undefined ? { selectionGalleryLink: data.selectionGalleryLink } : {}),
        ...(data.finalVideoLink !== undefined ? { finalVideoLink: data.finalVideoLink } : {}),
        ...(data.galleryPasswordPin !== undefined ? { galleryPasswordPin: data.galleryPasswordPin } : {}),
        updatedAt: now,
      };

      const serialized = `[POST_PRODUCTION]:${JSON.stringify(mergedPayload)}`;

      if (postProdNote) {
        await supabase.from("notes").update({ content: serialized, updated_at: now }).eq("id", postProdNote.id);
      } else {
        await supabase.from("notes").insert({
          lead_id: leadId,
          owner_id: ownerId,
          content: serialized,
        });
      }

      // Log timeline activity
      await supabase.from("activities").insert({
        lead_id: leadId,
        owner_id: ownerId,
        activity_type: "NOTE_ADDED",
        title: "Post-Production Pipeline Updated",
        description: data.status
          ? `Post-production stage updated to "${data.status}".`
          : `Deliverable cloud links updated.`,
        metadata: mergedPayload,
      });

      return { success: true };
    } catch (err: any) {
      console.error("Exception in updateLeadPostProductionAction:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
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

export async function ensureBookingForLead(leadId: string): Promise<Booking | null> {
  const existingMem = memoryBookings.find((b) => b.lead_id === leadId);
  if (existingMem) return existingMem;

  const lead = memoryLeads.find((l) => l.id === leadId);
  const now = new Date().toISOString();

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data: dbBooking } = await supabase.from("bookings").select("*").eq("lead_id", leadId).maybeSingle();
      if (dbBooking) {
        memoryBookings.unshift(dbBooking);
        return dbBooking;
      }

      const { data: dbLead } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
      if (dbLead) {
        const ownerId = await getAuthenticatedOwnerId();
        const totalAmount = Number(dbLead.budget) || 300000;
        const advanceAmount = Math.round(totalAmount * 0.35);
        const remainingAmount = totalAmount - advanceAmount;

        const { data: newDbBooking, error } = await supabase
          .from("bookings")
          .insert({
            lead_id: dbLead.id,
            client_id: dbLead.client_id,
            owner_id: ownerId,
            booking_status: "Booking Confirmed",
            booking_date: now.split("T")[0],
            total_amount: totalAmount,
            advance_amount: advanceAmount,
            remaining_amount: remainingAmount,
            advance_paid_at: null,
            final_payment_due_date: dbLead.event_date || null,
            notes: "Confirmed booking agreement.",
          })
          .select()
          .single();

        if (newDbBooking) {
          memoryBookings.unshift(newDbBooking);
          return newDbBooking;
        }
      }
    } catch (err) {
      console.error("Error creating booking in Supabase:", err);
    }
  }

  if (lead) {
    const totalAmount = Number(lead.budget) || 300000;
    const advanceAmount = Math.round(totalAmount * 0.35);
    const remainingAmount = totalAmount - advanceAmount;
    const memBooking: Booking = {
      id: "b-" + Date.now(),
      lead_id: lead.id,
      client_id: lead.client_id,
      owner_id: memoryProfile.id,
      booking_status: "Booking Confirmed",
      booking_date: now.split("T")[0],
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      advance_paid_at: null,
      final_payment_due_date: lead.event_date || null,
      notes: "Confirmed booking agreement.",
      created_at: now,
      updated_at: now,
    };
    memoryBookings.unshift(memBooking);
    return memBooking;
  }

  return null;
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

  if (status === "Accepted / Booked") {
    await ensureBookingForLead(leadId);
  }

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
        const { data: dbLead } = await supabase.from("leads").select("*").eq("id", dbQ.lead_id).single();
        if (dbLead) {
          const qAmount = Number(dbQ.amount) || 0;
          const advanceAmount = Math.round(qAmount * 0.35);
          const remainingAmount = qAmount - advanceAmount;

          await supabase
            .from("leads")
            .update({
              lead_status: "Accepted / Booked",
              budget: qAmount,
              next_follow_up_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", dbQ.lead_id);

          await supabase
            .from("follow_ups")
            .update({
              completed_at: new Date().toISOString(),
              client_response: "Quotation Accepted",
              updated_at: new Date().toISOString(),
            })
            .eq("lead_id", dbQ.lead_id)
            .is("completed_at", null);

          const { data: existingBooking } = await supabase
            .from("bookings")
            .select("id")
            .eq("lead_id", dbLead.id)
            .maybeSingle();

          if (existingBooking) {
            await supabase
              .from("bookings")
              .update({
                total_amount: qAmount,
                advance_amount: advanceAmount,
                remaining_amount: remainingAmount,
                booking_status: "Booking Confirmed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingBooking.id);
          } else {
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
          }

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
  bookingId?: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  leadId?: string;
}) {
  let targetBookingId = data.bookingId;

  if ((!targetBookingId || targetBookingId.trim() === "") && data.leadId) {
    const ensured = await ensureBookingForLead(data.leadId);
    if (ensured) {
      targetBookingId = ensured.id;
    }
  } else if (targetBookingId && data.leadId) {
    const exists = memoryBookings.find((b) => b.id === targetBookingId);
    if (!exists) {
      const ensured = await ensureBookingForLead(data.leadId);
      if (ensured) targetBookingId = ensured.id;
    }
  }

  if (!targetBookingId && data.leadId) {
    targetBookingId = "b-" + data.leadId;
  }

  const pId = "p-" + Date.now();
  const now = new Date().toISOString();
  const newPayment: Payment = {
    id: pId,
    booking_id: targetBookingId || "b-unknown",
    owner_id: memoryProfile.id,
    amount: data.amount,
    payment_type: data.paymentType,
    payment_method: data.paymentMethod,
    payment_date: now.split("T")[0],
    reference: data.reference || null,
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
  };

  memoryPayments.unshift(newPayment);

  let booking = memoryBookings.find((b) => b.id === targetBookingId);
  if (booking) {
    booking.remaining_amount = Math.max(0, booking.remaining_amount - data.amount);
    if (data.paymentType === "Advance" && !booking.advance_paid_at) {
      booking.advance_paid_at = now;
    }
    booking.updated_at = now;

    const newActivity: Activity = {
      id: "a-" + Date.now(),
      lead_id: booking.lead_id,
      client_id: booking.client_id,
      owner_id: memoryProfile.id,
      activity_type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      description: `Payment receipt of ₹${data.amount.toLocaleString("en-IN")} logged via ${data.paymentMethod}.`,
      created_at: now,
    };
    memoryActivities.unshift(newActivity);
  }

  const live = await isSupabaseLive();
  if (live && targetBookingId) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      let { data: dbB } = await supabase.from("bookings").select("*").eq("id", targetBookingId).maybeSingle();
      if (!dbB && data.leadId) {
        const ensured = await ensureBookingForLead(data.leadId);
        if (ensured) {
          targetBookingId = ensured.id;
          const { data: refreshedB } = await supabase.from("bookings").select("*").eq("id", targetBookingId).maybeSingle();
          dbB = refreshedB;
        }
      }

      if (targetBookingId) {
        const { data: dbP, error: pErr } = await supabase
          .from("payments")
          .insert({
            booking_id: targetBookingId,
            owner_id: ownerId,
            amount: data.amount,
            payment_type: data.paymentType,
            payment_method: data.paymentMethod,
            payment_date: now.split("T")[0],
            reference: data.reference || null,
            notes: data.notes || null,
          })
          .select()
          .single();

        if (pErr) {
          console.error("Supabase payment insert error:", pErr);
        }

        if (dbB) {
          const newRem = Math.max(0, (Number(dbB.remaining_amount) || 0) - data.amount);
          const updates: any = {
            remaining_amount: newRem,
            updated_at: now,
          };
          if (data.paymentType === "Advance" && !dbB.advance_paid_at) {
            updates.advance_paid_at = now;
          }

          await supabase.from("bookings").update(updates).eq("id", targetBookingId);

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
      }
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

    // In memory: update lead's next_follow_up_at
    const remainingPending = memoryFollowUps.filter(
      (f) => f.lead_id === followUp.lead_id && !f.completed_at
    );
    const nextPending = remainingPending.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )[0];
    const lead = memoryLeads.find((l) => l.id === followUp.lead_id);
    if (lead) {
      lead.next_follow_up_at = nextPending?.scheduled_at || null;
      lead.follow_up_count = (lead.follow_up_count || 0) + 1;
      lead.last_contacted_at = new Date().toISOString();
      lead.contact_status = "Responded";
      lead.updated_at = new Date().toISOString();
    }
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
        // Query remaining pending follow-ups for this lead
        const { data: remainingPending } = await supabase
          .from("follow_ups")
          .select("scheduled_at, notes")
          .eq("lead_id", dbF.lead_id)
          .is("completed_at", null)
          .order("scheduled_at", { ascending: true })
          .limit(1);

        const nextFollowUpAt = remainingPending?.[0]?.scheduled_at || null;
        const nextAction = remainingPending?.[0]?.notes || null;

        // Fetch current lead follow-up count
        const { data: currentLead } = await supabase
          .from("leads")
          .select("follow_up_count")
          .eq("id", dbF.lead_id)
          .maybeSingle();

        const newCount = (currentLead?.follow_up_count || 0) + 1;

        await supabase
          .from("leads")
          .update({
            next_follow_up_at: nextFollowUpAt,
            next_action: nextAction,
            follow_up_count: newCount,
            last_contacted_at: new Date().toISOString(),
            contact_status: "Responded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbF.lead_id);

        await supabase.from("activities").insert({
          lead_id: dbF.lead_id,
          owner_id: ownerId,
          activity_type: "FOLLOW_UP",
          title: "Follow-up Completed",
          description: `Follow-up via ${dbF.contact_method} completed. ${clientResponse ? `Client feedback: "${clientResponse}"` : ""}`,
        });
      }
    } catch (err) {
      console.error("Error completing follow-up in Supabase:", err);
    }
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

// ----------------------------------------------------------------------------
// DELIVERABLES ACTIONS (DYNAMIC & PERSISTENT)
// ----------------------------------------------------------------------------

export const getLeadDeliverables = cache(async (leadId: string): Promise<LeadDeliverable[]> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("lead_deliverables")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (data) return data;
    } catch {}
  }
  return memoryDeliverables.filter((d) => d.lead_id === leadId);
});

export async function createLeadDeliverableAction(data: {
  leadId: string;
  name: string;
  type?: string;
  quantity?: number;
  notes?: string;
  isCustom?: boolean;
}) {
  const now = new Date().toISOString();
  const id = "del-" + Date.now();
  const deliverable: LeadDeliverable = {
    id,
    lead_id: data.leadId,
    owner_id: memoryProfile.id,
    name: data.name,
    type: data.type || "Deliverable",
    quantity: data.quantity || 1,
    notes: data.notes || null,
    is_custom: Boolean(data.isCustom),
    created_at: now,
    updated_at: now,
  };
  memoryDeliverables.push(deliverable);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();
      const { data: dbDel, error } = await supabase
        .from("lead_deliverables")
        .insert({
          lead_id: data.leadId,
          owner_id: ownerId,
          name: data.name,
          type: data.type || "Deliverable",
          quantity: data.quantity || 1,
          notes: data.notes || null,
          is_custom: Boolean(data.isCustom),
        })
        .select()
        .single();
      if (error) {
        console.error("Error creating deliverable in Supabase:", error);
        return { success: false, error: error.message };
      }
      if (dbDel) return { success: true, deliverable: dbDel };
    } catch (err: any) {
      console.error("Exception in createLeadDeliverableAction:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true, deliverable };
}

export async function updateLeadDeliverableAction(id: string, data: Partial<LeadDeliverable>) {
  const now = new Date().toISOString();
  const memDel = memoryDeliverables.find((d) => d.id === id);
  if (memDel) {
    if (data.name !== undefined) memDel.name = data.name;
    if (data.type !== undefined) memDel.type = data.type;
    if (data.quantity !== undefined) memDel.quantity = data.quantity;
    if (data.notes !== undefined) memDel.notes = data.notes;
    if (data.is_custom !== undefined) memDel.is_custom = data.is_custom;
    memDel.updated_at = now;
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("lead_deliverables")
        .update({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.is_custom !== undefined ? { is_custom: data.is_custom } : {}),
          updated_at: now,
        })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function deleteLeadDeliverableAction(id: string) {
  memoryDeliverables = memoryDeliverables.filter((d) => d.id !== id);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("lead_deliverables").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function batchSaveLeadDeliverablesAction(
  leadId: string,
  deliverables: { name: string; type?: string; quantity: number; notes?: string; is_custom?: boolean }[]
) {
  const now = new Date().toISOString();
  // Clear memory deliverables for this lead and replace
  memoryDeliverables = memoryDeliverables.filter((d) => d.lead_id !== leadId);
  const newItems: LeadDeliverable[] = deliverables.map((d, index) => ({
    id: "del-" + Date.now() + "-" + index,
    lead_id: leadId,
    owner_id: memoryProfile.id,
    name: d.name,
    type: d.type || "Deliverable",
    quantity: d.quantity || 1,
    notes: d.notes || null,
    is_custom: Boolean(d.is_custom),
    created_at: now,
    updated_at: now,
  }));
  memoryDeliverables.push(...newItems);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      // Delete existing deliverables for this lead
      await supabase.from("lead_deliverables").delete().eq("lead_id", leadId);

      if (deliverables.length > 0) {
        const rows = deliverables.map((d) => ({
          lead_id: leadId,
          owner_id: ownerId,
          name: d.name,
          type: d.type || "Deliverable",
          quantity: d.quantity || 1,
          notes: d.notes || null,
          is_custom: Boolean(d.is_custom),
        }));
        const { error } = await supabase.from("lead_deliverables").insert(rows);
        if (error) return { success: false, error: error.message };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

// ----------------------------------------------------------------------------
// EXPENSES & PROFIT CALCULATOR ACTIONS
// ----------------------------------------------------------------------------

export const getLeadExpenses = cache(async (leadId: string): Promise<LeadExpense[]> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("lead_expenses")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (data) return data;
    } catch {}
  }
  return memoryExpenses.filter((e) => e.lead_id === leadId);
});

export async function createLeadExpenseAction(data: {
  leadId: string;
  expenseName: string;
  expenseCategory: string;
  amount: number;
  notes?: string;
  isCustom?: boolean;
}) {
  const now = new Date().toISOString();
  const id = "exp-" + Date.now();
  const expense: LeadExpense = {
    id,
    lead_id: data.leadId,
    owner_id: memoryProfile.id,
    expense_name: data.expenseName,
    expense_category: data.expenseCategory,
    amount: Number(data.amount) || 0,
    notes: data.notes || null,
    is_custom: Boolean(data.isCustom),
    created_at: now,
    updated_at: now,
  };
  memoryExpenses.push(expense);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();
      const { data: dbExp, error } = await supabase
        .from("lead_expenses")
        .insert({
          lead_id: data.leadId,
          owner_id: ownerId,
          expense_name: data.expenseName,
          expense_category: data.expenseCategory,
          amount: Number(data.amount) || 0,
          notes: data.notes || null,
          is_custom: Boolean(data.isCustom),
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      if (dbExp) return { success: true, expense: dbExp };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true, expense };
}

export async function updateLeadExpenseAction(id: string, data: Partial<LeadExpense>) {
  const now = new Date().toISOString();
  const memExp = memoryExpenses.find((e) => e.id === id);
  if (memExp) {
    if (data.expense_name !== undefined) memExp.expense_name = data.expense_name;
    if (data.expense_category !== undefined) memExp.expense_category = data.expense_category;
    if (data.amount !== undefined) memExp.amount = Number(data.amount);
    if (data.notes !== undefined) memExp.notes = data.notes;
    if (data.is_custom !== undefined) memExp.is_custom = data.is_custom;
    memExp.updated_at = now;
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("lead_expenses")
        .update({
          ...(data.expense_name !== undefined ? { expense_name: data.expense_name } : {}),
          ...(data.expense_category !== undefined ? { expense_category: data.expense_category } : {}),
          ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.is_custom !== undefined ? { is_custom: data.is_custom } : {}),
          updated_at: now,
        })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function deleteLeadExpenseAction(id: string) {
  memoryExpenses = memoryExpenses.filter((e) => e.id !== id);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("lead_expenses").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function updateLeadProfitPercentageAction(leadId: string, profitPercentage: number) {
  const now = new Date().toISOString();
  const lead = memoryLeads.find((l) => l.id === leadId);
  if (lead) {
    lead.profit_percentage = profitPercentage;
    lead.updated_at = now;
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .from("leads")
        .update({
          profit_percentage: profitPercentage,
          updated_at: now,
        })
        .eq("id", leadId);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function batchSaveLeadExpensesAction(
  leadId: string,
  expenses: { expense_name: string; expense_category: string; amount: number; notes?: string; is_custom?: boolean }[],
  profitPercentage?: number
) {
  const now = new Date().toISOString();
  memoryExpenses = memoryExpenses.filter((e) => e.lead_id !== leadId);
  const newItems: LeadExpense[] = expenses.map((e, index) => ({
    id: "exp-" + Date.now() + "-" + index,
    lead_id: leadId,
    owner_id: memoryProfile.id,
    expense_name: e.expense_name,
    expense_category: e.expense_category,
    amount: Number(e.amount) || 0,
    notes: e.notes || null,
    is_custom: Boolean(e.is_custom),
    created_at: now,
    updated_at: now,
  }));
  memoryExpenses.push(...newItems);

  if (profitPercentage !== undefined) {
    const lead = memoryLeads.find((l) => l.id === leadId);
    if (lead) {
      lead.profit_percentage = profitPercentage;
      lead.updated_at = now;
    }
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      await supabase.from("lead_expenses").delete().eq("lead_id", leadId);

      if (expenses.length > 0) {
        const rows = expenses.map((e) => ({
          lead_id: leadId,
          owner_id: ownerId,
          expense_name: e.expense_name,
          expense_category: e.expense_category,
          amount: Number(e.amount) || 0,
          notes: e.notes || null,
          is_custom: Boolean(e.is_custom),
        }));
        await supabase.from("lead_expenses").insert(rows);
      }

      if (profitPercentage !== undefined) {
        await supabase
          .from("leads")
          .update({ profit_percentage: profitPercentage, updated_at: now })
          .eq("id", leadId);
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

// ----------------------------------------------------------------------------
// STANDALONE EXPENSE CALCULATIONS ACTIONS
// ----------------------------------------------------------------------------

export const getExpenseCalculations = cache(async (): Promise<ExpenseCalculation[]> => {
  const live = await isSupabaseLive();
  let calcs: ExpenseCalculation[] = memoryExpenseCalculations;
  let items: ExpenseCalculationItem[] = memoryExpenseCalculationItems;
  const leads = await getLeads();
  const leadMap = new Map(leads.map((l) => [l.id, l]));

  if (live) {
    try {
      const supabase = await createServerSupabase();
      const [{ data: cData }, { data: iData }] = await Promise.all([
        supabase
          .from("expense_calculations")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("expense_calculation_items")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);
      if (cData) calcs = cData;
      if (iData) items = iData;
    } catch {}
  }

  const itemMap = new Map<string, ExpenseCalculationItem[]>();
  for (const item of items) {
    const arr = itemMap.get(item.calculation_id) || [];
    arr.push(item);
    itemMap.set(item.calculation_id, arr);
  }

  return calcs.map((calc) => {
    const calcItems = itemMap.get(calc.id) || [];
    const totalExpenses = calcItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const profitPct = Number(calc.profit_percentage) || 30;
    const profitAmount = (totalExpenses * profitPct) / 100;
    const packageAmount = totalExpenses + profitAmount;

    return {
      ...calc,
      profit_percentage: profitPct,
      items: calcItems,
      lead: calc.lead_id ? leadMap.get(calc.lead_id) : undefined,
      total_expenses: totalExpenses,
      profit_amount: profitAmount,
      package_amount: packageAmount,
    };
  });
});

export const getExpenseCalculationById = cache(async (id: string): Promise<ExpenseCalculation | null> => {
  const all = await getExpenseCalculations();
  const found = all.find((c) => c.id === id);
  return found || null;
});

export async function createExpenseCalculationAction(data: {
  name: string;
  clientName?: string;
  eventType?: string;
  leadId?: string | null;
  profitPercentage?: number;
  notes?: string;
  items?: { expense_name: string; expense_category: string; amount: number; notes?: string; is_custom?: boolean }[];
}) {
  const now = new Date().toISOString();
  const id = "calc-" + Date.now();
  const profitPct = data.profitPercentage ?? 30;

  const newCalc: ExpenseCalculation = {
    id,
    owner_id: memoryProfile.id,
    lead_id: data.leadId || null,
    name: data.name,
    client_name: data.clientName || null,
    event_type: data.eventType || null,
    profit_percentage: profitPct,
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
  };
  memoryExpenseCalculations.unshift(newCalc);

  const calcItems: ExpenseCalculationItem[] = (data.items || []).map((item, idx) => ({
    id: "calc-item-" + Date.now() + "-" + idx,
    calculation_id: id,
    owner_id: memoryProfile.id,
    expense_name: item.expense_name,
    expense_category: item.expense_category,
    amount: Number(item.amount) || 0,
    notes: item.notes || null,
    is_custom: Boolean(item.is_custom),
    created_at: now,
    updated_at: now,
  }));
  memoryExpenseCalculationItems.push(...calcItems);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const { data: dbCalc, error: cErr } = await supabase
        .from("expense_calculations")
        .insert({
          owner_id: ownerId,
          lead_id: data.leadId || null,
          name: data.name,
          client_name: data.clientName || null,
          event_type: data.eventType || null,
          profit_percentage: profitPct,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (cErr) return { success: false, error: cErr.message };

      if (dbCalc && data.items && data.items.length > 0) {
        const rows = data.items.map((i) => ({
          calculation_id: dbCalc.id,
          owner_id: ownerId,
          expense_name: i.expense_name,
          expense_category: i.expense_category,
          amount: Number(i.amount) || 0,
          notes: i.notes || null,
          is_custom: Boolean(i.is_custom),
        }));
        await supabase.from("expense_calculation_items").insert(rows);
      }

      return { success: true, calculation: dbCalc, calculationId: dbCalc?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true, calculation: newCalc, calculationId: id };
}

export async function updateExpenseCalculationAction(
  id: string,
  data: {
    name?: string;
    clientName?: string;
    eventType?: string;
    leadId?: string | null;
    profitPercentage?: number;
    notes?: string;
    items?: { id?: string; expense_name: string; expense_category: string; amount: number; notes?: string; is_custom?: boolean }[];
  }
) {
  const now = new Date().toISOString();
  const memCalc = memoryExpenseCalculations.find((c) => c.id === id);
  if (memCalc) {
    if (data.name !== undefined) memCalc.name = data.name;
    if (data.clientName !== undefined) memCalc.client_name = data.clientName || null;
    if (data.eventType !== undefined) memCalc.event_type = data.eventType || null;
    if (data.leadId !== undefined) memCalc.lead_id = data.leadId;
    if (data.profitPercentage !== undefined) memCalc.profit_percentage = data.profitPercentage;
    if (data.notes !== undefined) memCalc.notes = data.notes || null;
    memCalc.updated_at = now;
  }

  if (data.items) {
    memoryExpenseCalculationItems = memoryExpenseCalculationItems.filter((i) => i.calculation_id !== id);
    const newItems: ExpenseCalculationItem[] = data.items.map((item, idx) => ({
      id: item.id || "calc-item-" + Date.now() + "-" + idx,
      calculation_id: id,
      owner_id: memoryProfile.id,
      expense_name: item.expense_name,
      expense_category: item.expense_category,
      amount: Number(item.amount) || 0,
      notes: item.notes || null,
      is_custom: Boolean(item.is_custom),
      created_at: now,
      updated_at: now,
    }));
    memoryExpenseCalculationItems.push(...newItems);
  }

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();

      const updates: Record<string, any> = { updated_at: now };
      if (data.name !== undefined) updates.name = data.name;
      if (data.clientName !== undefined) updates.client_name = data.clientName || null;
      if (data.eventType !== undefined) updates.event_type = data.eventType || null;
      if (data.leadId !== undefined) updates.lead_id = data.leadId;
      if (data.profitPercentage !== undefined) updates.profit_percentage = data.profitPercentage;
      if (data.notes !== undefined) updates.notes = data.notes || null;

      const { error: uErr } = await supabase
        .from("expense_calculations")
        .update(updates)
        .eq("id", id);
      if (uErr) return { success: false, error: uErr.message };

      if (data.items) {
        await supabase.from("expense_calculation_items").delete().eq("calculation_id", id);
        if (data.items.length > 0) {
          const rows = data.items.map((i) => ({
            calculation_id: id,
            owner_id: ownerId,
            expense_name: i.expense_name,
            expense_category: i.expense_category,
            amount: Number(i.amount) || 0,
            notes: i.notes || null,
            is_custom: Boolean(i.is_custom),
          }));
          await supabase.from("expense_calculation_items").insert(rows);
        }
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function deleteExpenseCalculationAction(id: string) {
  memoryExpenseCalculations = memoryExpenseCalculations.filter((c) => c.id !== id);
  memoryExpenseCalculationItems = memoryExpenseCalculationItems.filter((i) => i.calculation_id !== id);

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("expense_calculations").delete().eq("id", id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export async function duplicateExpenseCalculationAction(id: string) {
  const calc = await getExpenseCalculationById(id);
  if (!calc) return { success: false, error: "Calculation not found" };

  return createExpenseCalculationAction({
    name: `${calc.name} (Copy)`,
    clientName: calc.client_name || undefined,
    eventType: calc.event_type || undefined,
    leadId: calc.lead_id || undefined,
    profitPercentage: calc.profit_percentage,
    notes: calc.notes || undefined,
    items: (calc.items || []).map((i) => ({
      expense_name: i.expense_name,
      expense_category: i.expense_category,
      amount: i.amount,
      notes: i.notes || undefined,
      is_custom: i.is_custom,
    })),
  });
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
  memoryDeliverables = memoryDeliverables.filter((d) => d.lead_id !== leadId);
  memoryExpenses = memoryExpenses.filter((e) => e.lead_id !== leadId);

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
  memoryDeliverables = memoryDeliverables.filter((d) => !clientLeadIds.has(d.lead_id));
  memoryExpenses = memoryExpenses.filter((e) => !clientLeadIds.has(e.lead_id));

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

export const getStudioNotifications = cache(async (): Promise<StudioNotification[]> => {
  const [overdueFollowUps, todayFollowUps, bookings] = await Promise.all([
    getFollowUps("overdue"),
    getFollowUps("today"),
    getBookings(),
  ]);

  const notifications: StudioNotification[] = [];

  for (const f of overdueFollowUps) {
    if (notifications.length >= 4) break;
    notifications.push({
      id: "notif-f-" + f.id,
      title: `Overdue Follow-up: ${f.lead?.client?.name || "Client"}`,
      description: f.notes || `Scheduled follow-up missed on ${f.scheduled_at?.split("T")[0] || "prior date"}.`,
      leadId: f.lead_id,
      type: "overdue",
      created_at: f.scheduled_at,
    });
  }

  for (const f of todayFollowUps) {
    if (notifications.length >= 6) break;
    if (!notifications.some((n) => n.id === "notif-f-" + f.id)) {
      notifications.push({
        id: "notif-f-" + f.id,
        title: `Due Today: ${f.lead?.client?.name || "Client"}`,
        description: f.notes || `Scheduled follow-up due today via ${f.contact_method}.`,
        leadId: f.lead_id,
        type: "due_today",
        created_at: f.scheduled_at,
      });
    }
  }

  for (const b of bookings) {
    if (notifications.length >= 8) break;
    if (!b.advance_paid_at && (b.advance_amount || 0) > 0) {
      notifications.push({
        id: "notif-b-" + b.id,
        title: `Pending Advance: ${b.lead?.client?.name || "Client"}`,
        description: `₹${(b.advance_amount || 0).toLocaleString("en-IN")} advance token unpaid for confirmed shoot.`,
        leadId: b.lead_id,
        type: "pending_advance",
        created_at: b.created_at,
      });
    }
  }

  return notifications;
});

export async function updateProfileAction(profileData: Partial<Profile>) {
  const now = new Date().toISOString();
  memoryProfile = {
    ...memoryProfile,
    ...profileData,
    updated_at: now,
  };

  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const ownerId = await getAuthenticatedOwnerId();
      await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: now,
        })
        .or(`id.eq.${ownerId},id.eq.00000000-0000-0000-0000-000000000001`);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return { success: true, profile: memoryProfile };
}

export const getRequirementOptions = cache(async (): Promise<{ name: string; slug: string; category?: string }[]> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("requirement_options")
        .select("name, slug, category")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) return data;
    } catch {}
  }
  return DEFAULT_REQUIREMENTS;
});

export const getExpenseCategories = cache(async (): Promise<{ name: string; slug: string; category?: string }[]> => {
  const live = await isSupabaseLive();
  if (live) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("expense_categories")
        .select("name, slug, category")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) return data;
    } catch {}
  }
  return DEFAULT_EXPENSE_CATEGORIES;
});

