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
  | 'Facebook'
  | 'WhatsApp'
  | 'Website'
  | 'Google'
  | 'Referral'
  | 'Existing Client'
  | 'Walk-in'
  | 'Phone Call'
  | 'Advertisement'
  | 'Wedding Website'
  | 'Vendor Referral'
  | 'Friend / Family'
  | 'Phone'
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
  lead_id?: string | null;
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
  event_type: EventType | string;
  custom_event_type?: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  requirements?: string[];
  other_requirement?: string | null;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | string;
  sort_order?: number;
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
  events?: CRMEvent[];
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
  { name: "Pre-Wedding Shoot", slug: "pre_wedding_shoot", category: "Shoots" },
  { name: "LED Wall", slug: "led_wall", category: "Production" },
  { name: "Live Videographer", slug: "live_videographer", category: "Production" },
  { name: "Drone Coverage", slug: "drone_coverage", category: "Aerial" },
  { name: "Album", slug: "album", category: "Deliverables" },
  { name: "Video Editing", slug: "video_editing", category: "Post-Production" },
  { name: "Highlights", slug: "highlights", category: "Deliverables" },
  { name: "Full Wedding Film", slug: "full_wedding_film", category: "Deliverables" },
  { name: "Trailer", slug: "trailer", category: "Deliverables" },
  { name: "Reels", slug: "reels", category: "Social Media" },
  { name: "Social Media Reels", slug: "social_media_reels", category: "Social Media" },
  { name: "Same Day Edit", slug: "same_day_edit", category: "Post-Production" },
  { name: "Photo Booth", slug: "photo_booth", category: "Production" },
  { name: "Calendar & Pendrive Box", slug: "calendar_pendrive_box", category: "Deliverables" },
  { name: "Frame", slug: "frame", category: "Deliverables" },
  { name: "Prints", slug: "prints", category: "Deliverables" },
  { name: "Other", slug: "other", category: "Custom" },
];

export interface MasterEventTypeItem {
  name: string;
  category: string;
  slug: string;
}

export const MASTER_EVENT_CATEGORIES = [
  "Wedding & Marriage",
  "Pre-Wedding",
  "Baby & Maternity",
  "Religious & Traditional",
  "Birthday & Personal Celebrations",
  "Corporate Events",
  "Commercial / Creative",
  "Social & Special Events",
  "Photoshoot Types",
  "Other",
] as const;

export const MASTER_EVENT_TYPES: MasterEventTypeItem[] = [
  // 1. WEDDING & MARRIAGE
  { name: "Wedding", category: "Wedding & Marriage", slug: "wedding" },
  { name: "Reception", category: "Wedding & Marriage", slug: "reception" },
  { name: "Engagement", category: "Wedding & Marriage", slug: "engagement" },
  { name: "Betrothal", category: "Wedding & Marriage", slug: "betrothal" },
  { name: "Sangeet", category: "Wedding & Marriage", slug: "sangeet" },
  { name: "Mehndi", category: "Wedding & Marriage", slug: "mehndi" },
  { name: "Haldi", category: "Wedding & Marriage", slug: "haldi" },
  { name: "Nalangu", category: "Wedding & Marriage", slug: "nalangu" },
  { name: "Thala Kalyanam", category: "Wedding & Marriage", slug: "thala_kalyanam" },
  { name: "Thaali Ponnurukku", category: "Wedding & Marriage", slug: "thaali_ponnurukku" },
  { name: "Maruveedu", category: "Wedding & Marriage", slug: "maruveedu" },
  { name: "Wedding Anniversary", category: "Wedding & Marriage", slug: "wedding_anniversary" },
  { name: "Bridal Shower", category: "Wedding & Marriage", slug: "bridal_shower" },
  { name: "Bachelor Party", category: "Wedding & Marriage", slug: "bachelor_party" },
  { name: "Bachelorette Party", category: "Wedding & Marriage", slug: "bachelorette_party" },

  // 2. PRE-WEDDING
  { name: "Pre-Wedding Shoot", category: "Pre-Wedding", slug: "pre_wedding_shoot" },
  { name: "Couple Shoot", category: "Pre-Wedding", slug: "couple_shoot" },
  { name: "Engagement Shoot", category: "Pre-Wedding", slug: "engagement_shoot" },
  { name: "Save the Date", category: "Pre-Wedding", slug: "save_the_date" },
  { name: "Bridal Portrait", category: "Pre-Wedding", slug: "bridal_portrait" },
  { name: "Groom Portrait", category: "Pre-Wedding", slug: "groom_portrait" },
  { name: "Couple Portrait", category: "Pre-Wedding", slug: "couple_portrait" },
  { name: "Pre-Wedding Video", category: "Pre-Wedding", slug: "pre_wedding_video" },
  { name: "Pre-Wedding Ceremony", category: "Pre-Wedding", slug: "pre_wedding_ceremony" },
  { name: "Other Pre-Wedding Event", category: "Pre-Wedding", slug: "other_pre_wedding" },

  // 3. BABY & MATERNITY
  { name: "Maternity", category: "Baby & Maternity", slug: "maternity" },
  { name: "Baby Shower", category: "Baby & Maternity", slug: "baby_shower" },
  { name: "Seemantham", category: "Baby & Maternity", slug: "seemantham" },
  { name: "Valaikappu", category: "Baby & Maternity", slug: "valaikappu" },
  { name: "Newborn Shoot", category: "Baby & Maternity", slug: "newborn_shoot" },
  { name: "Newborn Ceremony", category: "Baby & Maternity", slug: "newborn_ceremony" },
  { name: "Baby Photoshoot", category: "Baby & Maternity", slug: "baby_photoshoot" },
  { name: "Naming Ceremony", category: "Baby & Maternity", slug: "naming_ceremony" },
  { name: "First Birthday", category: "Baby & Maternity", slug: "first_birthday" },
  { name: "First Haircut", category: "Baby & Maternity", slug: "first_haircut" },
  { name: "Annaprashan", category: "Baby & Maternity", slug: "annaprashan" },
  { name: "Baby Milestone", category: "Baby & Maternity", slug: "baby_milestone" },
  { name: "Other Baby Event", category: "Baby & Maternity", slug: "other_baby_event" },

  // 4. RELIGIOUS & TRADITIONAL
  { name: "Baptism", category: "Religious & Traditional", slug: "baptism" },
  { name: "First Holy Communion", category: "Religious & Traditional", slug: "first_holy_communion" },
  { name: "Confirmation", category: "Religious & Traditional", slug: "confirmation" },
  { name: "Church Wedding", category: "Religious & Traditional", slug: "church_wedding" },
  { name: "Hindu Wedding", category: "Religious & Traditional", slug: "hindu_wedding" },
  { name: "Muslim Wedding", category: "Religious & Traditional", slug: "muslim_wedding" },
  { name: "Christian Wedding", category: "Religious & Traditional", slug: "christian_wedding" },
  { name: "Temple Ceremony", category: "Religious & Traditional", slug: "temple_ceremony" },
  { name: "Religious Ceremony", category: "Religious & Traditional", slug: "religious_ceremony" },
  { name: "Traditional Ceremony", category: "Religious & Traditional", slug: "traditional_ceremony" },
  { name: "Ear Piercing", category: "Religious & Traditional", slug: "ear_piercing" },
  { name: "Upanayanam", category: "Religious & Traditional", slug: "upanayanam" },
  { name: "Ayush Homam", category: "Religious & Traditional", slug: "ayush_homam" },
  { name: "House Blessing", category: "Religious & Traditional", slug: "house_blessing" },
  { name: "Other Religious Event", category: "Religious & Traditional", slug: "other_religious_event" },

  // 5. BIRTHDAY & PERSONAL CELEBRATIONS
  { name: "Birthday", category: "Birthday & Personal Celebrations", slug: "birthday" },
  { name: "Milestone Birthday", category: "Birthday & Personal Celebrations", slug: "milestone_birthday" },
  { name: "18th Birthday", category: "Birthday & Personal Celebrations", slug: "18th_birthday" },
  { name: "21st Birthday", category: "Birthday & Personal Celebrations", slug: "21st_birthday" },
  { name: "25th Birthday", category: "Birthday & Personal Celebrations", slug: "25th_birthday" },
  { name: "50th Birthday", category: "Birthday & Personal Celebrations", slug: "50th_birthday" },
  { name: "60th Birthday", category: "Birthday & Personal Celebrations", slug: "60th_birthday" },
  { name: "70th Birthday", category: "Birthday & Personal Celebrations", slug: "70th_birthday" },
  { name: "80th Birthday", category: "Birthday & Personal Celebrations", slug: "80th_birthday" },
  { name: "Surprise Party", category: "Birthday & Personal Celebrations", slug: "surprise_party" },
  { name: "Anniversary", category: "Birthday & Personal Celebrations", slug: "anniversary" },
  { name: "Family Celebration", category: "Birthday & Personal Celebrations", slug: "family_celebration" },
  { name: "Family Get-Together", category: "Birthday & Personal Celebrations", slug: "family_get_together" },
  { name: "Reunion", category: "Birthday & Personal Celebrations", slug: "reunion" },
  { name: "Farewell", category: "Birthday & Personal Celebrations", slug: "farewell" },
  { name: "Retirement", category: "Birthday & Personal Celebrations", slug: "retirement" },
  { name: "Graduation", category: "Birthday & Personal Celebrations", slug: "graduation" },

  // 6. CORPORATE EVENTS
  { name: "Corporate Event", category: "Corporate Events", slug: "corporate_event" },
  { name: "Corporate Photoshoot", category: "Corporate Events", slug: "corporate_photoshoot" },
  { name: "Corporate Video", category: "Corporate Events", slug: "corporate_video" },
  { name: "Conference", category: "Corporate Events", slug: "conference" },
  { name: "Seminar", category: "Corporate Events", slug: "seminar" },
  { name: "Workshop", category: "Corporate Events", slug: "workshop" },
  { name: "Training Event", category: "Corporate Events", slug: "training_event" },
  { name: "Annual Day", category: "Corporate Events", slug: "annual_day" },
  { name: "Award Ceremony", category: "Corporate Events", slug: "award_ceremony" },
  { name: "Product Launch", category: "Corporate Events", slug: "product_launch" },
  { name: "Brand Launch", category: "Corporate Events", slug: "brand_launch" },
  { name: "Brand Event", category: "Corporate Events", slug: "brand_event" },
  { name: "Promotional Event", category: "Corporate Events", slug: "promotional_event" },
  { name: "Exhibition", category: "Corporate Events", slug: "exhibition" },
  { name: "Trade Show", category: "Corporate Events", slug: "trade_show" },
  { name: "Office Party", category: "Corporate Events", slug: "office_party" },
  { name: "Team Event", category: "Corporate Events", slug: "team_event" },
  { name: "Company Anniversary", category: "Corporate Events", slug: "company_anniversary" },
  { name: "Corporate Meeting", category: "Corporate Events", slug: "corporate_meeting" },
  { name: "Business Event", category: "Corporate Events", slug: "business_event" },
  { name: "Other Corporate Event", category: "Corporate Events", slug: "other_corporate_event" },

  // 7. COMMERCIAL / CREATIVE
  { name: "Product Photoshoot", category: "Commercial / Creative", slug: "product_photoshoot" },
  { name: "Product Video", category: "Commercial / Creative", slug: "product_video" },
  { name: "Fashion Photoshoot", category: "Commercial / Creative", slug: "fashion_photoshoot" },
  { name: "Model Photoshoot", category: "Commercial / Creative", slug: "model_photoshoot" },
  { name: "Portfolio Photoshoot", category: "Commercial / Creative", slug: "portfolio_photoshoot" },
  { name: "Brand Photoshoot", category: "Commercial / Creative", slug: "brand_photoshoot" },
  { name: "Brand Video", category: "Commercial / Creative", slug: "brand_video" },
  { name: "Advertisement", category: "Commercial / Creative", slug: "advertisement" },
  { name: "Promotional Video", category: "Commercial / Creative", slug: "promotional_video" },
  { name: "Social Media Content", category: "Commercial / Creative", slug: "social_media_content" },
  { name: "Music Video", category: "Commercial / Creative", slug: "music_video" },
  { name: "Interview", category: "Commercial / Creative", slug: "interview" },
  { name: "Documentary", category: "Commercial / Creative", slug: "documentary" },
  { name: "Food Photoshoot", category: "Commercial / Creative", slug: "food_photoshoot" },
  { name: "Property Photoshoot", category: "Commercial / Creative", slug: "property_photoshoot" },
  { name: "Real Estate Photoshoot", category: "Commercial / Creative", slug: "real_estate_photoshoot" },
  { name: "Architecture Photoshoot", category: "Commercial / Creative", slug: "architecture_photoshoot" },
  { name: "Other Commercial Event", category: "Commercial / Creative", slug: "other_commercial_event" },

  // 8. SOCIAL & SPECIAL EVENTS
  { name: "Festival Celebration", category: "Social & Special Events", slug: "festival_celebration" },
  { name: "Cultural Event", category: "Social & Special Events", slug: "cultural_event" },
  { name: "College Event", category: "Social & Special Events", slug: "college_event" },
  { name: "School Event", category: "Social & Special Events", slug: "school_event" },
  { name: "College Reunion", category: "Social & Special Events", slug: "college_reunion" },
  { name: "School Reunion", category: "Social & Special Events", slug: "school_reunion" },
  { name: "Sports Event", category: "Social & Special Events", slug: "sports_event" },
  { name: "Concert", category: "Social & Special Events", slug: "concert" },
  { name: "Live Performance", category: "Social & Special Events", slug: "live_performance" },
  { name: "Award Function", category: "Social & Special Events", slug: "award_function" },
  { name: "Community Event", category: "Social & Special Events", slug: "community_event" },
  { name: "Public Event", category: "Social & Special Events", slug: "public_event" },
  { name: "Charity Event", category: "Social & Special Events", slug: "charity_event" },
  { name: "Other Social Event", category: "Social & Special Events", slug: "other_social_event" },

  // 9. PHOTOSHOOT TYPES
  { name: "Portrait Photoshoot", category: "Photoshoot Types", slug: "portrait_photoshoot" },
  { name: "Couple Photoshoot", category: "Photoshoot Types", slug: "couple_photoshoot" },
  { name: "Family Photoshoot", category: "Photoshoot Types", slug: "family_photoshoot" },
  { name: "Kids Photoshoot", category: "Photoshoot Types", slug: "kids_photoshoot" },
  { name: "Fashion Shoot", category: "Photoshoot Types", slug: "fashion_shoot" },
  { name: "Lifestyle Shoot", category: "Photoshoot Types", slug: "lifestyle_shoot" },
  { name: "Outdoor Photoshoot", category: "Photoshoot Types", slug: "outdoor_photoshoot" },
  { name: "Indoor Photoshoot", category: "Photoshoot Types", slug: "indoor_photoshoot" },
  { name: "Studio Photoshoot", category: "Photoshoot Types", slug: "studio_photoshoot" },
  { name: "Portfolio Shoot", category: "Photoshoot Types", slug: "portfolio_shoot" },
  { name: "Concept Shoot", category: "Photoshoot Types", slug: "concept_shoot" },
  { name: "Other Photoshoot", category: "Photoshoot Types", slug: "other_photoshoot" },

  // 10. OTHER
  { name: "Other", category: "Other", slug: "other" },
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

