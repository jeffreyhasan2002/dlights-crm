# Complete Lead Management, Enquiry & Expense Calculator Enhancement

You are working on an existing lead-management/CRM application. Implement the following requirements **inside the existing application architecture**.

## CRITICAL RULES

Before making any changes:

1. Inspect the existing codebase thoroughly.
2. Inspect the existing Supabase schema, tables, relationships, RLS policies, and existing data structure.
3. Understand the current Lead/Enquiry flow.
4. Understand the existing New Enquiry modal.
5. Understand the existing Lead Details page.
6. Understand the Kanban implementation.
7. Find the current `Deliverables & Production Scope` implementation.
8. Find the existing navigation/menu system.
9. Find existing reusable UI components, forms, modals, cards, dropdowns, inputs, tables, etc.
10. Reuse the existing architecture wherever possible.

**Do not rebuild existing functionality from scratch.**

**Do not replace the existing UI/design system.**

**Do not remove existing functionality.**

**Do not break existing leads or existing Supabase records.**

**Do not use hardcoded frontend-only state for data that should persist in Supabase.**

---

# 1. NEW ENQUIRY MODAL — IMPROVE REQUIREMENTS

Update the existing **New Enquiry** modal.

The modal should collect complete information about the enquiry/event.

Organize it logically into sections:

### Client Information

Keep all existing client fields.

Examples:

- Client Name
- Phone
- Email
- Location
- Lead Source
- Existing fields

Do not remove existing fields.

---

# 2. EVENT INFORMATION

Add/retain:

- Event Type
- Event Date
- Event Start Time
- Event End Time
- Location/Venue
- Notes

### Event Time

The user specifically needs to record **the time of the event**.

Provide:

```text
Event Date
Start Time
End Time
```

If the existing application supports multiple events/dates, preserve that capability.

If not, structure the implementation so multiple event dates can be supported later without rewriting the system.

---

# 3. REQUIREMENTS — MULTI SELECT

Add a dedicated:

## Requirements

section inside the New Enquiry modal.

The user must be able to select **multiple requirements**.

Use a clean multi-select/chip/tag UI consistent with the existing application.

Default options should include:

- Traditional Photography
- Traditional Videography
- Candid Photography
- Candid Videography
- Cinematic Video
- Pre-Wedding Shoot
- Engagement
- Thaali Ponnurukku
- Nalangu
- Haldi
- Sangeet
- Mehndi
- Thala Kalyanam
- Wedding Day
- Maruveedu
- Reception
- Maternity
- Baptism
- LED Wall
- Live Videographer
- Album
- Video Editing
- Highlights
- Calendar & Pendrive Box
- Frame
- Other

### IMPORTANT: OTHER

When the user selects:

> Other

show an additional field:

> Specify Other Requirement

Example:

```text
Requirements:
[Traditional Photography]
[Traditional Videography]
[Other]

Other Requirement:
[Drone Coverage]
```

Do not save only `"Other"`.

Save both:

```text
other
Drone Coverage
```

The custom requirement must be editable later.

---

# 4. MAKE THE ENTIRE LEAD EDITABLE

The overall Lead must become fully editable.

Currently some information may be fixed after creation.

Change the system so the user can edit the complete lead.

The user should be able to modify:

- Client Name
- Phone
- Email
- Location
- Event Type
- Event Date
- Event Start Time
- Event End Time
- Requirements
- Other Requirement
- Budget
- Lead Source
- Notes
- Assigned Team Member
- Status
- Priority
- Deliverables
- Production Scope
- Expenses
- Profit Percentage
- Package Amount/calculation inputs
- Any other existing lead fields

Create an obvious:

> Edit Lead

action.

The existing UI pattern should be reused.

Changes must save to Supabase and immediately reflect throughout the application.

---

# 5. KANBAN CARD — CLICK ANYWHERE TO OPEN

Improve the existing Kanban lead cards.

### Required behavior

The **entire Kanban card should be clickable**.

When the user clicks anywhere on the card:

> Open Full Lead Details

The user should NOT have to click:

- Three-dot menu
- View button
- Separate action button

to open the lead.

### Important

Keep the existing secondary action menu.

The menu can still contain:

- Edit
- Change Status
- Assign
- Delete
- Duplicate
- Other existing actions

But opening the full lead must happen by clicking the card itself.

### Event handling

Make sure clicking internal controls does not accidentally open the lead.

For example:

- Buttons
- Dropdowns
- Checkboxes
- Menus
- Drag handles
- Inputs

must stop propagation where required.

Do not break existing Kanban drag-and-drop functionality.

Add a subtle hover/cursor state to make it obvious the card is clickable.

---

# 6. DELIVERABLES & PRODUCTION SCOPE — REMOVE HARDCODING

The current:

> Deliverables & Production Scope

is hardcoded.

Fix this.

It must become dynamic, editable, and persistent.

The user should be able to:

- Add deliverables
- Remove deliverables
- Edit deliverable name
- Select multiple deliverables
- Set quantity
- Add notes
- Add custom deliverables
- Edit existing deliverables
- Save everything to Supabase

### Default Deliverables

Use existing project options where available.

Possible options include:

- Traditional Photography
- Traditional Videography
- Candid Photography
- Candid Videography
- Cinematic Video
- Drone
- Album
- Album Design
- Video Editing
- Highlights
- Full Wedding Film
- Reels
- Frames
- Calendar
- Pendrive Box
- LED Wall
- Live Streaming
- Live Videographer
- Other

Do not unnecessarily replace existing options.

---

# 7. DELIVERABLE — OTHER

Add:

> Other

to Deliverables.

When selected, display:

> Specify Other Deliverable

Example:

```text
Deliverable:
Other

Specify:
4K Drone Footage
```

Do not store only `"Other"`.

Store the actual custom value.

Allow multiple custom deliverables.

---

# 8. EXPENSE CALCULATOR FOR EACH LEAD

Add an **Expense Calculator** inside every Lead.

Example:

```text
Lead Details

Overview
Requirements
Deliverables
Production Scope
Expense Calculator
Notes
...
```

The Expense Calculator must belong to the specific lead.

Every lead must have its own independent expense calculation.

Do not use a global/shared expense state.

---

# 9. EXPENSE CATEGORIES

The calculator must include these default expense categories:

| # | Expense |
|---|---|
| 1 | Pre-Wedding Shoot |
| 2 | Engagement |
| 3 | Thaali Ponnurukku |
| 4 | Nalangu |
| 5 | Haldi, Sangeet, Mehndi |
| 6 | Thala Kalyanam |
| 7 | Wedding Day |
| 8 | Maruveedu |
| 9 | Nagercoil Reception |
| 10 | LED Wall |
| 11 | Live Videographer |
| 12 | Album Printing |
| 13 | Album Design |
| 14 | Video Editing |
| 15 | Highlights |
| 16 | Calendar & Pendrive Box |
| 17 | Frame |
| 18 | Office Rent |
| 19 | Assistant Payments |
| 20 | Petrol |
| 21 | Other |

Do not remove these categories.

---

# 10. OTHER EXPENSE

Add:

> Other

as an expense category.

When selected, allow:

- Expense Name
- Amount
- Notes

Example:

```text
Category: Other
Expense Name: Drone Rental
Amount: ₹8,000
Notes: External drone operator
```

The user must be able to add multiple Other expenses.

---

# 11. EXPENSE CALCULATOR UI

Create a clean expense table/card.

Example:

| Expense | Amount |
|---|---:|
| Pre-Wedding Shoot | ₹15,000 |
| Engagement | ₹10,000 |
| Wedding Day | ₹50,000 |
| Album Printing | ₹8,000 |
| Petrol | ₹3,000 |

Allow:

- Add Expense
- Edit Expense
- Delete Expense
- Add Other
- Add Notes

All changes should update the calculation instantly.

---

# 12. EXPENSE CALCULATIONS

At the bottom display:

## Overall Expenses W/O Profit

Calculate:

```text
Overall Expenses W/O Profit
= SUM(all expense amounts)
```

Then:

## Profit %

Default:

```text
30%
```

The 30% must be editable.

Example:

```text
Expenses = ₹100,000
Profit % = 30%
Profit = ₹30,000
Package Amount = ₹130,000
```

Calculate:

```text
Profit Amount
= Overall Expenses W/O Profit × Profit Percentage / 100
```

Then:

```text
Package Amount
= Overall Expenses W/O Profit + Profit Amount
```

Display:

```text
Overall Expenses W/O Profit     ₹100,000

Profit %                         30%

Profit Amount                    ₹30,000

Package Amount                   ₹130,000
```

All calculations must update automatically.

---

# 13. DO NOT HARD-CODE CALCULATED VALUES

Prefer calculating:

```text
Total Expenses
Profit Amount
Package Amount
```

from the underlying expense records.

Do not unnecessarily store calculated values in Supabase if they can be derived reliably.

The source of truth should be the actual expense records + profit percentage.

---

# 14. STANDALONE EXPENSE CALCULATOR MENU

Add a new main navigation/menu tab:

> Expense Calculator

This should be accessible independently from Leads.

Example:

```text
Dashboard
Leads
Expense Calculator
...
```

Do not remove or rename existing menu items unnecessarily.

---

# 15. STANDALONE EXPENSE CALCULATOR PAGE

The main Expense Calculator page should allow users to:

- Create a new calculation
- View calculations
- Search calculations
- Edit calculations
- Delete calculations
- Duplicate calculations
- Link calculation to an existing lead
- View total expenses
- View profit %
- View package amount

Display useful information such as:

| Client/Lead | Event | Expenses | Profit | Package Amount | Updated |
|---|---|---:|---:|---:|---|

If a calculation is connected to a lead, clearly show that relationship.

---

# 16. TWO-WAY ACCESS

There must be two ways to use Expense Calculator.

### From Lead

```text
Lead Details
→ Expense Calculator
```

This calculator is linked directly to that lead.

### From Main Menu

```text
Expense Calculator
```

Users can create/manage calculations independently.

A standalone calculation can optionally be linked to an existing lead.

---

# 17. SUPABASE — IMPORTANT

This project already uses Supabase.

**Do not treat this as a fresh database.**

Inspect the current Supabase database first.

Identify:

- Existing leads table
- Existing lead columns
- Existing relationships
- Existing requirement structures
- Existing deliverable structures
- Existing expense structures
- Existing users/team structures
- Existing RLS policies
- Existing enums
- Existing indexes
- Existing constraints

Then extend the current database safely.

---

# 18. SUPABASE MIGRATION

Create a proper migration.

Example:

```text
supabase/migrations/
YYYYMMDDHHMMSS_lead_expense_calculator.sql
```

The migration must be:

- Safe
- Non-destructive
- Idempotent where possible
- Compatible with existing data
- Compatible with existing RLS
- Compatible with existing application architecture

### NEVER

Do not:

- DROP the leads table
- TRUNCATE the database
- Delete existing leads
- Recreate existing tables unnecessarily
- Reset production data
- Replace existing data with seed data

---

# 19. LEAD DATABASE CHANGES

Add missing fields to the existing lead structure only where necessary.

Potential fields:

```text
requirements
other_requirement
event_start_time
event_end_time
profit_percentage
```

Use the existing database naming conventions.

If the application already has equivalent fields, reuse them.

For multiple requirements, use the architecture that best matches the existing database.

A JSONB array is acceptable if the project already uses JSONB for flexible lead metadata.

Example:

```json
[
  "traditional_photography",
  "traditional_videography",
  "haldi",
  "maternity"
]
```

---

# 20. LEAD DELIVERABLE DATABASE

If there is no existing suitable structure, create:

## lead_deliverables

Recommended fields:

```text
id
lead_id
name
type
quantity
notes
is_custom
created_at
updated_at
```

Relationship:

```text
lead_deliverables.lead_id
→ leads.id
```

Use proper foreign keys.

If an existing deliverables table already exists, extend/reuse it instead.

---

# 21. LEAD EXPENSE DATABASE

If there is no existing suitable expense structure, create:

## lead_expenses

Recommended fields:

```text
id
lead_id
expense_name
expense_category
amount
notes
is_custom
created_at
updated_at
```

Relationship:

```text
lead_expenses.lead_id
→ leads.id
```

One lead must support multiple expenses.

---

# 22. STANDALONE EXPENSE CALCULATIONS DATABASE

If required by the existing architecture, create:

## expense_calculations

Fields:

```text
id
name
lead_id
profit_percentage
notes
created_at
updated_at
```

`lead_id` may be nullable.

This supports:

### Linked calculation

```text
lead_id = existing lead ID
```

### Standalone calculation

```text
lead_id = NULL
```

Then create:

## expense_calculation_items

Fields:

```text
id
expense_calculation_id
expense_name
expense_category
amount
notes
is_custom
created_at
updated_at
```

Do not create duplicate tables if the current database already has an equivalent reusable structure.

---

# 23. REQUIREMENT SEED DATA

If requirements are stored in Supabase, seed these default options:

```text
Traditional Photography
Traditional Videography
Candid Photography
Candid Videography
Cinematic Video
Pre-Wedding Shoot
Engagement
Thaali Ponnurukku
Nalangu
Haldi
Sangeet
Mehndi
Thala Kalyanam
Wedding Day
Maruveedu
Reception
Maternity
Baptism
LED Wall
Live Videographer
Album
Video Editing
Highlights
Calendar & Pendrive Box
Frame
Other
```

Use stable slugs such as:

```text
traditional_photography
traditional_videography
candid_photography
candid_videography
cinematic_video
pre_wedding_shoot
engagement
thaali_ponnurukku
nalangu
haldi
sangeet
mehndi
thala_kalyanam
wedding_day
maruveedu
reception
maternity
baptism
led_wall
live_videographer
album
video_editing
highlights
calendar_pendrive_box
frame
other
```

---

# 24. EXPENSE CATEGORY SEED DATA

Seed these categories:

```text
Pre-Wedding Shoot
Engagement
Thaali Ponnurukku
Nalangu
Haldi, Sangeet, Mehndi
Thala Kalyanam
Wedding Day
Maruveedu
Nagercoil Reception
LED Wall
Live Videographer
Album Printing
Album Design
Video Editing
Highlights
Calendar & Pendrive Box
Frame
Office Rent
Assistant Payments
Petrol
Other
```

Stable slugs:

```text
pre_wedding_shoot
engagement
thaali_ponnurukku
nalangu
haldi_sangeet_mehndi
thala_kalyanam
wedding_day
maruveedu
nagercoil_reception
led_wall
live_videographer
album_printing
album_design
video_editing
highlights
calendar_pendrive_box
frame
office_rent
assistant_payments
petrol
other
```

Seed must be conflict-safe.

Running the seed multiple times must NOT create duplicates.

---

# 25. SUPABASE SEED FILE

Provide:

```text
supabase/seed.sql
```

or follow the project's existing seed structure.

The seed should:

- Insert default requirements
- Insert default expense categories
- Use stable slugs
- Use `ON CONFLICT` or equivalent protection
- Never delete existing records
- Never overwrite custom user-created records

---

# 26. EXISTING DATA MIGRATION

Existing leads must remain intact.

For existing leads, safely apply defaults such as:

```text
requirements = []
profit_percentage = 30
```

Do not overwrite existing values.

If existing deliverables are already stored, migrate them into the new dynamic structure if necessary.

If existing Deliverables & Production Scope is currently stored somewhere in Supabase, preserve it.

**No existing lead data may be lost.**

---

# 27. RLS

Respect the application's existing Supabase authentication/authorization architecture.

Do not create insecure policies.

Do not simply use:

```sql
USING (true)
```

unless that is genuinely how the existing application is designed.

Add appropriate RLS policies for:

- Lead deliverables
- Lead expenses
- Expense calculations
- Expense calculation items
- Requirement categories
- Expense categories

Users should only access data they are authorized to access according to the application's existing organization/team/user model.

---

# 28. TYPESCRIPT TYPES

After changing Supabase schema:

Update the project's generated/manual database TypeScript types.

Do not use `any` as a shortcut.

The new:

- Requirements
- Deliverables
- Expenses
- Expense Calculations
- Profit Percentage

must be properly typed.

---

# 29. VALIDATION

### Requirement

If:

```text
Other
```

is selected, require:

```text
Specify Other Requirement
```

### Deliverable

If:

```text
Other
```

is selected, require:

```text
Specify Other Deliverable
```

### Expense

Amount must:

- Be numeric
- Not be negative
- Support decimals if necessary

### Profit

Profit percentage must:

- Be numeric
- Not be negative
- Have a sensible maximum validation

Default:

```text
30%
```

---

# 30. UX REQUIREMENTS

Follow the application's existing:

- Colors
- Typography
- Buttons
- Modals
- Cards
- Inputs
- Dropdowns
- Tables
- Spacing
- Icons
- Responsive breakpoints
- Dark/light theme if available

Do not introduce a completely new design system.

Use existing reusable components.

---

# 31. RESPONSIVE DESIGN

Everything must work on:

- Desktop
- Laptop
- Tablet
- Mobile

The Kanban card must remain clickable on mobile.

Expense calculator must work properly on small screens.

Avoid unnecessary horizontal scrolling.

Tables should adapt to smaller screens.

---

# 32. ERROR & LOADING STATES

Add proper:

- Loading states
- Saving states
- Error messages
- Empty states
- Delete confirmation
- Success feedback

Do not silently fail when Supabase operations fail.

If saving a lead expense fails, clearly inform the user.

---

# 33. DELETE BEHAVIOR

When deleting:

### Deliverable

Only delete the selected deliverable.

### Expense

Only delete the selected expense.

### Lead

Follow the application's existing lead deletion rules.

If lead deletion is allowed and expenses/deliverables are relational children, use appropriate cascading behavior or explicit cleanup based on the existing architecture.

Do not accidentally delete unrelated records.

---

# 34. CALCULATOR EXAMPLE

Example lead:

```text
Client: John
Event: Wedding
```

Expenses:

```text
Pre-Wedding Shoot     ₹15,000
Engagement            ₹10,000
Wedding Day           ₹50,000
Album Printing         ₹8,000
Video Editing          ₹7,000
Petrol                 ₹3,000
```

Total:

```text
Overall Expenses W/O Profit
₹93,000
```

Profit:

```text
30%
```

Profit amount:

```text
₹27,900
```

Package:

```text
₹120,900
```

The UI should calculate this dynamically.

---

# 35. ARCHITECTURE REQUIREMENT

Keep responsibilities separated.

For example:

```text
Lead
 ├── Requirements
 ├── Deliverables
 ├── Production Scope
 └── Expense Calculator
      ├── Expense Items
      ├── Profit %
      ├── Profit Amount
      └── Package Amount
```

Use reusable components where appropriate.

Potential components:

```text
RequirementSelector
DeliverablesEditor
ExpenseCalculator
ExpenseItemRow
LeadEditModal
```

Use the project's existing naming conventions instead of blindly creating these exact names.

---

# 36. DO NOT DUPLICATE DATA LOGIC

Avoid having:

- One expense calculation in frontend
- Another different calculation in backend
- Another different calculation in a standalone page

Use a single consistent calculation model.

The formula must always be:

```text
Total Expenses
= Sum of Expense Amounts
```

```text
Profit Amount
= Total Expenses × Profit Percentage / 100
```

```text
Package Amount
= Total Expenses + Profit Amount
```

---

# 37. TEST EXISTING LEADS

After implementation, test with:

### Existing Lead

Verify:

- Lead opens
- Lead edits
- Requirements load
- Deliverables load
- Existing data remains
- Expense calculator works

### New Lead

Create a lead with:

```text
Traditional Photography
Traditional Videography
Haldi
Baptism
Maternity
Other → Drone Coverage
```

Verify all values save.

### Kanban

Click:

- Center of card
- Client name
- Empty area
- Status area
- Card content

All should open full details unless interacting with an internal control.

---

# 38. TEST "OTHER"

Test:

```text
Requirement → Other
```

Enter:

```text
Drone Coverage
```

Save and reopen.

Verify:

```text
Other
Drone Coverage
```

is preserved.

Do the same for:

```text
Deliverable → Other
```

and:

```text
Expense → Other
```

---

# 39. TEST EXPENSE CALCULATOR

Test:

```text
Expense 1 = ₹10,000
Expense 2 = ₹20,000
Expense 3 = ₹30,000
```

Expected:

```text
Total = ₹60,000
```

With:

```text
Profit = 30%
```

Expected:

```text
Profit = ₹18,000
Package = ₹78,000
```

Change profit to:

```text
40%
```

Expected:

```text
Profit = ₹24,000
Package = ₹84,000
```

Verify the UI updates immediately.

---

# 40. TEST STANDALONE CALCULATOR

Create an Expense Calculator from:

```text
Main Menu → Expense Calculator
```

Verify:

- It can be created
- It can be saved
- It can be edited
- It can be deleted
- It can optionally link to a lead
- Its expenses persist
- Profit updates correctly
- Package amount updates correctly

---

# 41. FINAL ACCEPTANCE CHECKLIST

The implementation is complete only when all of these are true:

### New Enquiry

- [ ] Requirements section exists.
- [ ] Multiple requirements can be selected.
- [ ] Traditional Photography exists.
- [ ] Traditional Videography exists.
- [ ] Haldi exists.
- [ ] Baptism exists.
- [ ] Maternity exists.
- [ ] Other exists.
- [ ] Other requirement has custom input.
- [ ] Event start time exists.
- [ ] Event end time exists.

### Lead

- [ ] Entire lead is editable.
- [ ] Edit persists to Supabase.
- [ ] Existing fields remain functional.

### Kanban

- [ ] Entire card is clickable.
- [ ] Full lead opens from card click.
- [ ] Existing menu actions still work.
- [ ] Drag-and-drop still works.
- [ ] Internal controls don't accidentally open the lead.

### Deliverables

- [ ] Hardcoded Deliverables & Production Scope is removed.
- [ ] Deliverables are dynamic.
- [ ] Multiple deliverables supported.
- [ ] Custom deliverables supported.
- [ ] Other exists.
- [ ] Other Deliverable input works.
- [ ] Data persists.

### Lead Expense Calculator

- [ ] Calculator exists on every lead.
- [ ] All provided expense categories exist.
- [ ] Other expense exists.
- [ ] Multiple expenses supported.
- [ ] Expenses can be edited.
- [ ] Expenses can be deleted.
- [ ] Total expenses calculate automatically.
- [ ] Profit defaults to 30%.
- [ ] Profit percentage is editable.
- [ ] Profit amount calculates correctly.
- [ ] Package amount calculates correctly.
- [ ] Data persists per lead.

### Main Expense Calculator

- [ ] Main navigation has Expense Calculator.
- [ ] New calculations can be created.
- [ ] Existing calculations can be viewed.
- [ ] Calculations can be edited.
- [ ] Calculations can be deleted.
- [ ] Calculations can optionally link to leads.

### Supabase

- [ ] Existing schema inspected.
- [ ] Existing tables reused where appropriate.
- [ ] Migration created.
- [ ] Migration is non-destructive.
- [ ] Existing leads preserved.
- [ ] Existing data preserved.
- [ ] Requirements seeded.
- [ ] Expense categories seeded.
- [ ] Seeds are conflict-safe.
- [ ] RLS is correctly implemented.
- [ ] Foreign keys are correct.
- [ ] Indexes added where appropriate.
- [ ] TypeScript database types updated.

### Quality

- [ ] No unnecessary hardcoding.
- [ ] No duplicated business logic.
- [ ] No unnecessary `any`.
- [ ] Existing UI style preserved.
- [ ] Responsive design works.
- [ ] Loading states work.
- [ ] Error handling works.
- [ ] Existing functionality is not broken.

---

# 42. FINAL IMPLEMENTATION INSTRUCTION

**Do not start by blindly creating new tables or replacing components.**

First inspect the existing project and Supabase structure.

Then determine the **minimum database and code changes required** to support the above functionality.

Use the existing architecture wherever possible.

Implement:

```text
Existing Lead
      ↓
New Requirements
      ↓
Event Time
      ↓
Editable Lead
      ↓
Dynamic Deliverables
      ↓
Lead Expense Calculator
      ↓
Standalone Expense Calculator
      ↓
Supabase Migration
      ↓
Supabase Seed
      ↓
RLS + Types
      ↓
Testing
```

The final result should feel like a **natural extension of the existing CRM**, not a separate application added on top of it.

Most importantly:

**Preserve all existing lead data and existing functionality while making requirements, deliverables, production scope, and expenses fully dynamic, editable, and Supabase-backed.**