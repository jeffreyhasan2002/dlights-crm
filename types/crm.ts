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
  event_start_time?: string | null;
  event_end_time?: string | null;
  location: string | null;
  budget: number | null;
  source: EnquirySource | null;
  enquiry_message: string | null;
  requirements?: string[] | null;
  other_requirement?: string | null;
  profit_percentage?: number | null;
  post_production_status?: string | null;
  raw_storage_link?: string | null;
  selection_gallery_link?: string | null;
  final_video_link?: string | null;
  gallery_password_pin?: string | null;
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

export type PostProductionStatus =
  | 'Raw Footage Backup'
  | 'Client Selection Sent'
  | 'Client Selection Received'
  | 'Editing & Color Grading'
  | 'Trailer / Film Delivered'
  | 'Album Layout Proofing'
  | 'Album Printed & Delivered'
  | 'Project Completed';

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

export interface LeadDeliverable {
  id: string;
  lead_id: string;
  owner_id: string;
  name: string;
  type?: string;
  quantity: number;
  notes?: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadExpense {
  id: string;
  lead_id: string;
  owner_id: string;
  expense_name: string;
  expense_category: string;
  amount: number;
  notes?: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCalculation {
  id: string;
  owner_id: string;
  lead_id?: string | null;
  name: string;
  client_name?: string | null;
  event_type?: string | null;
  profit_percentage: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  items?: ExpenseCalculationItem[];
  total_expenses?: number;
  profit_amount?: number;
  package_amount?: number;
}

export interface ExpenseCalculationItem {
  id: string;
  calculation_id: string;
  owner_id: string;
  expense_name: string;
  expense_category: string;
  amount: number;
  notes?: string | null;
  is_custom: boolean;
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
  deliverables?: LeadDeliverable[];
  expenses?: LeadExpense[];
  expense_calculation?: ExpenseCalculation;
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

export interface StudioNotification {
  id: string;
  title: string;
  description: string;
  leadId?: string;
  type: "overdue" | "due_today" | "pending_advance";
  created_at: string;
}

export const DEFAULT_REQUIREMENTS: { name: string; slug: string; category?: string }[] = [
  { name: "Traditional Photography", slug: "traditional_photography", category: "Photography" },
  { name: "Traditional Videography", slug: "traditional_videography", category: "Videography" },
  { name: "Candid Photography", slug: "candid_photography", category: "Photography" },
  { name: "Candid Videography", slug: "candid_videography", category: "Videography" },
  { name: "Cinematic Video", slug: "cinematic_video", category: "Videography" },
  { name: "Pre-Wedding Shoot", slug: "pre_wedding_shoot", category: "Events" },
  { name: "Engagement", slug: "engagement", category: "Events" },
  { name: "Thaali Ponnurukku", slug: "thaali_ponnurukku", category: "Events" },
  { name: "Nalangu", slug: "nalangu", category: "Events" },
  { name: "Haldi", slug: "haldi", category: "Events" },
  { name: "Sangeet", slug: "sangeet", category: "Events" },
  { name: "Mehndi", slug: "mehndi", category: "Events" },
  { name: "Thala Kalyanam", slug: "thala_kalyanam", category: "Events" },
  { name: "Wedding Day", slug: "wedding_day", category: "Events" },
  { name: "Maruveedu", slug: "maruveedu", category: "Events" },
  { name: "Reception", slug: "reception", category: "Events" },
  { name: "Maternity", slug: "maternity", category: "Shoots" },
  { name: "Baptism", slug: "baptism", category: "Shoots" },
  { name: "LED Wall", slug: "led_wall", category: "Production" },
  { name: "Live Videographer", slug: "live_videographer", category: "Production" },
  { name: "Album", slug: "album", category: "Deliverables" },
  { name: "Video Editing", slug: "video_editing", category: "Deliverables" },
  { name: "Highlights", slug: "highlights", category: "Deliverables" },
  { name: "Calendar & Pendrive Box", slug: "calendar_pendrive_box", category: "Deliverables" },
  { name: "Frame", slug: "frame", category: "Deliverables" },
  { name: "Other", slug: "other", category: "Custom" },
];

export const DEFAULT_EXPENSE_CATEGORIES: { name: string; slug: string; category?: string }[] = [
  { name: "Pre-Wedding Shoot", slug: "pre_wedding_shoot", category: "Events" },
  { name: "Engagement", slug: "engagement", category: "Events" },
  { name: "Thaali Ponnurukku", slug: "thaali_ponnurukku", category: "Events" },
  { name: "Nalangu", slug: "nalangu", category: "Events" },
  { name: "Haldi, Sangeet, Mehndi", slug: "haldi_sangeet_mehndi", category: "Events" },
  { name: "Thala Kalyanam", slug: "thala_kalyanam", category: "Events" },
  { name: "Wedding Day", slug: "wedding_day", category: "Events" },
  { name: "Maruveedu", slug: "maruveedu", category: "Events" },
  { name: "Nagercoil Reception", slug: "nagercoil_reception", category: "Events" },
  { name: "LED Wall", slug: "led_wall", category: "Production" },
  { name: "Live Videographer", slug: "live_videographer", category: "Production" },
  { name: "Album Printing", slug: "album_printing", category: "Post-Production" },
  { name: "Album Design", slug: "album_design", category: "Post-Production" },
  { name: "Video Editing", slug: "video_editing", category: "Post-Production" },
  { name: "Highlights", slug: "highlights", category: "Post-Production" },
  { name: "Calendar & Pendrive Box", slug: "calendar_pendrive_box", category: "Deliverables" },
  { name: "Frame", slug: "frame", category: "Deliverables" },
  { name: "Office Rent", slug: "office_rent", category: "Overhead" },
  { name: "Assistant Payments", slug: "assistant_payments", category: "Labor" },
  { name: "Petrol", slug: "petrol", category: "Travel" },
  { name: "Other", slug: "other", category: "Custom" },
];

export const DEFAULT_DELIVERABLES: { name: string; type: string; defaultQty: number; notes: string }[] = [
  { name: "Traditional Photography", type: "Photography", defaultQty: 1, notes: "Complete ritual documentation" },
  { name: "Traditional Videography", type: "Videography", defaultQty: 1, notes: "Full ceremony multi-cam coverage" },
  { name: "Candid Photography", type: "Photography", defaultQty: 1, notes: "High-res color-graded stills" },
  { name: "Candid Videography", type: "Videography", defaultQty: 1, notes: "Cinematic moments & candid captures" },
  { name: "Cinematic Video", type: "Videography", defaultQty: 1, notes: "3-5 min highlight trailer with licensed score" },
  { name: "Drone", type: "Aerial", defaultQty: 1, notes: "4K aerial cinematography" },
  { name: "Album", type: "Print", defaultQty: 2, notes: "Luxury hardbound silk photo album" },
  { name: "Album Design", type: "Post-Production", defaultQty: 2, notes: "Custom layout designing with proofing" },
  { name: "Video Editing", type: "Post-Production", defaultQty: 1, notes: "Full video editing & sound design" },
  { name: "Highlights", type: "Videography", defaultQty: 1, notes: "Teaser reel for social media" },
  { name: "Full Wedding Film", type: "Videography", defaultQty: 1, notes: "45-60 min documentary feature" },
  { name: "Reels", type: "Social Media", defaultQty: 3, notes: "Vertical 9:16 reels for Instagram" },
  { name: "Frames", type: "Print", defaultQty: 2, notes: "Premium framed wall portrait prints" },
  { name: "Calendar", type: "Print", defaultQty: 1, notes: "Personalized studio desk calendar" },
  { name: "Pendrive Box", type: "Packaging", defaultQty: 1, notes: "Custom wooden pendrive keepsake box" },
  { name: "LED Wall", type: "Production", defaultQty: 1, notes: "Live feed display on venue LED wall" },
  { name: "Live Streaming", type: "Broadcast", defaultQty: 1, notes: "1080p YouTube/Private live webcast" },
  { name: "Live Videographer", type: "Production", defaultQty: 1, notes: "Live camera operator" },
  { name: "Other", type: "Custom", defaultQty: 1, notes: "" },
];

