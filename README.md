# 📸 Dlights CRM — Photography & Wedding Client Management

A complete, production-quality **Photography & Wedding Client CRM** built with **Next.js + TypeScript + Tailwind CSS + shadcn/ui + Supabase**.

Designed specifically for professional photographers and wedding studios to manage client enquiries, quotations, negotiations, bookings, advance & final payments, shoots, follow-ups, and complete relationship timelines in one unified dashboard.

---

## 🏛️ Architecture

```text
                 Vercel / Cloud Host
                         │
                         ▼
               Next.js (frontend/)
            App Router + Server Actions
                         │
                         ▼
                      Supabase
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
Supabase Auth     PostgreSQL + RLS    Supabase Storage
```

> **Important**: There is no separate backend server. Supabase provides the managed PostgreSQL database, authentication, RLS security policies, and storage infrastructure.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm** / **yarn**
- A **Supabase** account ([supabase.com](https://supabase.com))

### 2. Install Dependencies
Inside the `frontend/` directory:

```bash
npm install
```

Install Supabase core packages (already included in `package.json`):
```bash
npm install @supabase/supabase-js @supabase/ssr
```

Optional official Supabase Agent Skills:
```bash
npx skills add supabase/agent-skills
```

---

## 🔑 Environment Variables

Create `.env.local` inside `frontend/` (based on `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-anon-key
```

> **Security Note**: Never commit `.env.local`. Never expose service-role secret keys to the browser client.

---

## 🗄️ Database Setup & SQL Migrations

### 1. Apply Schema Migrations
Execute the initial migration script located at:
```text
frontend/supabase/migrations/00001_initial_schema.sql
```
In your Supabase Dashboard **SQL Editor**:
- Creates tables: `profiles`, `clients`, `leads`, `follow_ups`, `communications`, `activities`, `quotations`, `bookings`, `payments`, `events`, `notes`.
- Configures foreign keys, timestamp triggers, and search indexes.
- Enables **Row Level Security (RLS)** with user ownership policies.

### 2. Load Realistic Photography Seed Data
Execute the seed script located at:
```text
frontend/supabase/seed.sql
```
This populates the CRM with:
- 15 realistic Indian wedding & portrait clients (Mumbai, Udaipur, Goa, Jaipur, Delhi, Bengaluru, etc.)
- 15 leads across all 7 pipeline stages (`New Enquiry`, `Contacted`, `Follow-up Required`, `Quotation Sent`, `Negotiation`, `Accepted / Booked`, `Rejected / Lost`)
- Scheduled follow-ups with overdue calculation
- Quotations with status tracking and rejection reasons
- Confirmed bookings and payment ledgers
- Event shoot calendar and chronological activity timelines

---

## 🖥️ Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 🧭 Application Features & Modules

### 1. 📊 Executive Studio Dashboard (`/dashboard`)
- **11 Live KPI Cards**: New enquiries, active leads, follow-ups due today, overdue follow-ups, quotations awaiting response, negotiations, booked events, upcoming shoots, pending advances, outstanding balances, and total collected revenue.
- **"What do I need to do today?" Priority Section**:
  - **Overdue Items**: High-priority alert list of follow-ups that passed their due date.
  - **Due Today**: Scheduled phone calls and WhatsApp messages.
  - **Quotations Awaiting Response**: Proposals sent with days-waiting counter.
  - **Active Negotiations**: Custom rate and deliverables discussions.
  - **Upcoming Shoots**: Location, call time, and ceremony details.
  - **Pending Balances**: Booking advance and final payment alerts.

### 2. 🗂️ CRM Pipeline & Views (`/crm`)
- **Interactive Kanban Board**: Drag-and-drop leads across all 7 pipeline stages with instant feedback and activity logging.
- **Multi-Column Filterable Table**: Filter by stage, contact status, event type, shoot date, and budget. Sort and paginate with real-time search.
- **Follow-ups Tracker (`?view=followups`)**: Overdue, today, and scheduled follow-ups with one-click "Mark Done" response modals.
- **Quotations & Proposals (`?view=quotations`)**: Full quotation lifecycle (Draft ➔ Sent ➔ Viewed ➔ Negotiating ➔ Accepted ➔ Rejected). Mandatory rejection reason modal with custom fields.
- **Negotiations (`?view=negotiations`)**: Deal terms and revision logs.
- **Booked Projects (`?view=booked`)**: Confirmed bookings with financial health breakdown.
- **Lost Enquiries (`?view=lost`)**: Archived enquiries with failure root-cause analysis.

### 3. 👤 Comprehensive Client Detail View (`/crm/[id]`)
- **Client & Enquiry Card**: Name, phone, WhatsApp direct link, email, venue location, budget, and source.
- **CRM & Next Action Banner**: Lead status, contact status, and highlighted next action.
- **Quotation Management**: Generate new proposals, track sent/viewed status, accept or reject with reason.
- **Financial Ledger**: Total contract value, advance token paid, remaining balance due, and transaction history.
- **Communication Log**: Call and message entries with incoming/outgoing directions and client responses.
- **Internal Studio Notes**: Private notes for photographers and editors.
- **Chronological Relationship Timeline**: Complete visual timeline with event icons, timestamps, and metadata.

### 4. 👥 Client Directory (`/clients`)
- Complete client phonebook, lifetime booked values, and direct WhatsApp/Phone actions.

### 5. 📅 Event & Shoot Calendar (`/events`)
- Production shoots schedule, call timings, venue directions, and crew assignments.

### 6. 💳 Payments & Advances Ledger (`/payments`)
- Financial dashboard, advance token tracker, outstanding balances, and transaction receipts.

### 7. ⚙️ Studio Settings (`/settings`)
- **Business Profile**: Studio brand name, official phone, WhatsApp, public email, base city.
- **Photographer Profile**: Lead photographer name, avatar URL, credentials.
- **Localization Preferences**: Currency (Default `₹ INR`), date format (`dd/MM/yyyy`), timezone (`Asia/Kolkata`).

---

## 🔒 Security & Data Integrity

- **Row Level Security (RLS)**: Enforced on all PostgreSQL tables via `auth.uid() = owner_id`.
- **Atomic Mutations**: Server Actions with Next.js cache revalidations.
- **Input Validation**: Strict schema validation using **Zod** and **React Hook Form**.
- **No AI Slop UI**: Clean, restrained SaaS design adhering to shadcn/ui standards.
