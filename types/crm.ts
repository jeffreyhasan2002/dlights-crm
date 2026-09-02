export type EventType =
  | 'Wedding'
  | 'Engagement'
  | 'Sangeet'
  | 'Reception'
  | 'Muhurtham'
  | 'Pre-Wedding'
  | 'Post-Wedding'
  | 'Birthday'
  | 'Baby Shoot'
  | 'Portrait'
  | 'Corporate'
  | 'Other';

export type EnquirySource =
  | 'Instagram'
  | 'WhatsApp'
  | 'Referral'
  | 'Website'
  | 'Google'
  | 'Facebook'
  | 'Phone'
  | 'Existing Client'
  | 'Other';

export type LeadStatus =
  | 'New Enquiry'
  | 'Contacted'
  | 'Follow-up Required'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Accepted / Booked'
  | 'Rejected / Lost';

export type ContactStatus =
  | 'Not Contacted'
  | 'Contacted – Waiting for Response'
  | 'Responded'
  | 'No Response';

export type ContactMethod =
  | 'Call'
  | 'WhatsApp'
  | 'Email'
  | 'Instagram'
  | 'In-person'
  | 'Other';

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Negotiating'
  | 'Accepted'
  | 'Rejected';

export type RejectionReason =
  | 'Price too high'
  | 'Date unavailable'
  | 'Chose another photographer'
  | 'Project cancelled'
  | 'No response'
  | 'Budget issue'
  | 'Changed plans'
  | 'Found another package'
  | 'Other';

export type BookingStatus =
  | 'Accepted / Booked'
  | 'Booking Confirmed'
  | 'Advance Payment'
  | 'Upcoming Event'
  | 'Event Completed'
  | 'Final Payment'
  | 'Completed'
  | 'Cancelled';

export type PaymentType =
  | 'Advance'
  | 'Partial Payment'
  | 'Final Payment'
  | 'Other';

export type PaymentMethod =
  | 'UPI'
  | 'Bank Transfer'
  | 'Cash'
  | 'Card'
  | 'Cheque'
  | 'Other';

export type ActivityType =
  | 'ENQUIRY_CREATED'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'STATUS_CHANGED'
  | 'QUOTATION_CREATED'
  | 'QUOTATION_SENT'
  | 'QUOTATION_VIEWED'
  | 'NEGOTIATION_STARTED'
  | 'QUOTATION_ACCEPTED'
  | 'QUOTATION_REJECTED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'EVENT_UPCOMING'
  | 'EVENT_COMPLETED'
  | 'NOTE_ADDED';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  business_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  default_location?: string | null;
  currency?: string;
  date_format?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  owner_id: string;
  client_id: string;
  event_type: EventType;
  event_date: string | null;
  location: string | null;
  budget: number | null;
  source: EnquirySource | null;
  enquiry_message: string | null;
  lead_status: LeadStatus;
  contact_status: ContactStatus;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_count: number;
  next_action: string | null;
  next_action_due_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  owner_id: string;
  scheduled_at: string;
  completed_at: string | null;
  contact_method: ContactMethod;
  notes: string | null;
  client_response: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
}

export interface Communication {
  id: string;
  lead_id: string;
  owner_id: string;
  contact_method: ContactMethod;
  direction: 'Outgoing' | 'Incoming';
  message: string;
  message_content?: string;
  client_response: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string | null;
  client_id?: string | null;
  owner_id: string;
  activity_type: string;
  title?: string;
  description: string | null;
  contact_method?: string | null;
  client_response?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Quotation {
  id: string;
  lead_id: string;
  owner_id: string;
  quotation_number: string;
  amount: number;
  total_amount?: number;
  valid_until: string | null;
  status: QuotationStatus;
  sent_at?: string | null;
  viewed_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: RejectionReason | null;
  rejection_reason_other?: string | null;
  notes: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
}

export interface Booking {
  id: string;
  lead_id: string;
  client_id: string;
  owner_id: string;
  booking_status: BookingStatus;
  booking_date: string;
  confirmed_at?: string | null;
  total_amount: number;
  advance_amount: number;
  advance_due_date?: string | null;
  advance_paid_at: string | null;
  remaining_amount: number;
  final_payment_due_date: string | null;
  final_payment_paid_at?: string | null;
  contract_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  lead?: Lead;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  booking_id: string;
  owner_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  booking?: Booking;
}

export interface CRMEvent {
  id: string;
  lead_id: string | null;
  client_id: string;
  owner_id: string;
  event_name: string;
  event_type: EventType;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Note {
  id: string;
  lead_id: string;
  owner_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LeadWithDetails extends Lead {
  client: Client;
  quotations?: Quotation[];
  bookings?: Booking[];
  follow_ups?: FollowUp[];
  communications?: Communication[];
  activities?: Activity[];
  notes?: Note[];
}

export interface DashboardMetrics {
  newEnquiriesCount: number;
  activeLeadsCount: number;
  followUpsTodayCount: number;
  overdueFollowUpsCount: number;
  quotationsAwaitingCount: number;
  negotiationsCount: number;
  bookedEventsCount: number;
  upcomingEventsCount: number;
  pendingAdvanceAmount: number;
  pendingFinalAmount: number;
  totalRevenue: number;
  totalBookedValue: number;
}
