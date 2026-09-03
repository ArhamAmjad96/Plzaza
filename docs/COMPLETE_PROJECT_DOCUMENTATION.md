# 🏢 Plaza Property & Electricity Utility Management System
### Complete Technical & Architectural Documentation
*Version: 2.0.0 (Admin & Tenant Multi-Portal Edition)*  
*Generated: September 1, 2026*  
*Repository Branch: `feature/admin-tenant-portals`*

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Technology Stack & Core Libraries](#2-technology-stack--core-libraries)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Database Schema & Data Model](#4-database-schema--data-model)
5. [Dual-Persistence Engine (Supabase + JSON Store)](#5-dual-persistence-engine-supabase--json-store)
6. [Authentication, Sessions & Edge Security](#6-authentication-sessions--edge-security)
7. [Admin Workspace Module Guide](#7-admin-workspace-module-guide)
8. [Tenant Portal Suite Guide](#8-tenant-portal-suite-guide)
9. [IESCO Scraper & Bill Storage Engine](#9-iesco-scraper--bill-storage-engine)
10. [Complete API Route Directory](#10-complete-api-route-directory)
11. [Project Directory & File Structure](#11-project-directory--file-structure)
12. [User Manual & Testing Reference](#12-user-manual--testing-reference)

---

## 1. Executive Summary & Purpose

The **Plaza Property & Electricity Utility Management System** is a full-stack commercial real estate and utility management platform built for multi-tenant plazas, commercial buildings, and shopping complexes.

### Primary Core Capabilities:
- **Commercial Property Hierarchy:** Management of buildings, floors, shops, offices, and rooms with physical dimensions and occupancy states.
- **Tenant Lifecycle Management:** Onboarding, active lease contracts, security deposits, vacating procedures, and portal account provisioning.
- **Automated Electricity Billing (IESCO Scraper):** Automated fetching of live electricity bills from the Islamabad Electric Supply Company (IESCO) portal via 14-digit reference numbers using Playwright/Cheerio, with persistent disk/cloud storage and an interactive zoomable viewer.
- **Shared vs. Dedicated Metering:** Support for 1-to-1 dedicated meters as well as multi-unit shared meters with percentage-based utility bill splitting.
- **Financial Ledgers & Receipts:** Comprehensive tracking of monthly base rents, utility charges, payment receipts, arrears, and plaza maintenance outflow expenses.
- **Dual-Portal Access (Admin vs. Tenant):**
  - **Admin Workspace:** Full-featured back-office management for property managers, landlords, and staff.
  - **Resident Tenant Portal:** Self-service portal for tenants to view space specs, download official IESCO bills, review payment receipts, examine lease terms, and lodge maintenance requests in real-time.

---

## 2. Technology Stack & Core Libraries

```
┌───────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Category                  │ Technology / Package                                        │
├───────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Framework & Runtime       │ Next.js 16.3.0 (App Router, Turbopack, React Server Comp.) │
│ Core Language             │ TypeScript 5.x (Strict Type Checking)                       │
│ UI & Styling              │ Tailwind CSS v4, Motion (Framer Motion v13), Lucide React   │
│ Database & Backend        │ Supabase PostgreSQL, Supabase Storage                       │
│ Local Fallback Storage    │ Atomic Local JSON Engine (data/plaza_store.json)            │
│ Web Scraping & Automation │ Playwright 1.62.1 (Headless Chromium), Cheerio, Axios       │
│ Authentication            │ Supabase Auth + Encrypted HTTP-only Session Cookies         │
│ Security & Interception   │ Next.js Edge Middleware (Role boundary enforcement)        │
└───────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. System Architecture & Data Flow

```
                                  [ User Request ]
                                         │
                                         ▼
                                   [ /login ]
                       (Email & Password Authentication)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
             [ ADMIN ROLE ]                             [ TENANT ROLE ]
                   │                                           │
         [ Admin Workspace ]                          [ Tenant Portal ]
    ┌──────────────┴──────────────┐             ┌──────────────┴──────────────┐
    │ • / (Overview Dashboard)    │             │ • /tenant (Dashboard)       │
    │ • /units (Shops & Rooms)    │             │ • /tenant/unit (My Space)   │
    │ • /tenants (Directory)      │             │ • /tenant/bills (My Bills)  │
    │ • /connections (Meters)     │             │ • /tenant/payments (Ledger) │
    │ • /rent (Rent & Ledgers)    │             │ • /tenant/lease (Contract)  │
    │ • /expenses (Plaza Outflow) │             │ • /tenant/complaints (Logs) │
    │ • /complaints (Operations)  │             │ • /tenant/profile (Security)│
    │ • /reports & /automation    │             └─────────────────────────────┘
    └─────────────────────────────┘                            │
                   ▲                                           │
                   └─────── Real-Time Maintenance Sync ────────┘
```

---

## 4. Database Schema & Data Model

The application uses an architectural relational model designed to eliminate data duplication:

```
[ auth.users ]
      │ (1:1)
      ▼
[ profiles ] (id, role: ADMIN|TENANT, tenant_id)
      │
      ▼
[ tenants ] (id, full_name, cnic, phone, email, emergency_contact, status)
      │
      ▼ (1:N)
[ leases ] (id, tenant_id, unit_id, start_date, end_date, monthly_rent, security_amount, security_paid, status)
      │
      ▼ (N:1)
[ units ] (id, plaza_id, unit_name, unit_number, floor, unit_type, area_sqft, status)
      │
      ▼ (N:M via connection_unit_mappings)
[ connections ] (id, reference_number, meter_number, consumer_name, connection_type, is_shared)
      │
      ▼ (1:N)
[ electricity_bills ] (id, connection_id, billing_month, amount_due, due_date, bill_file_url, bill_file_path)
```

### Key Relational Tables:
1. **`profiles`**: Links authenticated user IDs to application roles (`ADMIN` or `TENANT`) and maps to `tenant_id`.
2. **`tenants`**: Registered commercial tenant records with personal & contact details.
3. **`units`**: Physical commercial spaces (shops, halls, offices, storage rooms).
4. **`leases`**: Tenancy contracts defining monthly rent, duration, and security deposit commitments.
5. **`connections`**: Electricity utility meters with 14-digit IESCO reference numbers.
6. **`connection_unit_mappings`**: Mapping table linking meters to units with custom percentage split shares for shared meters.
7. **`electricity_bills`**: Historical electricity bill records, metadata, and persistent local/cloud file paths.
8. **`payments`**: Official financial receipts recorded for rent or electricity dues.
9. **`expenses`**: Outflow expenses incurred by plaza management (repairs, security, general utilities).
10. **`complaints`**: Maintenance and repair tickets lodged for specific units.

---

## 5. Dual-Persistence Engine (Supabase + JSON Store)

To ensure high availability and prevent deployment failures due to database connectivity issues, the application implements a **Dual-Persistence Pattern**:

```
Client / Server Request
         │
         ▼
  Domain Service (e.g. lib/tenants/service.ts)
         │
         ├───► 1. Primary Query: Supabase PostgreSQL
         │        └─ If Success: Return live database records
         │
         └───► 2. Automatic Fallback: Local JSON Store (data/plaza_store.json)
                  └─ If Supabase is unreachable/offline: Return local store data
```

- When mutations occur (`createTenant`, `createComplaint`, `saveBill`, `saveProfile`), the system writes to Supabase and simultaneously syncs `data/plaza_store.json`.
- This ensures that local development, offline demos, and staging environments always work without external network dependencies.

---

## 6. Authentication, Sessions & Edge Security

### Authentication Architecture:
- **Login Endpoint:** `POST /api/auth/login` accepts credentials, verifies them via Supabase Auth (with offline demo fallback), sets a 7-day secure HTTP-only cookie (`plaza_auth_session`), and returns role-based redirection targets.
- **Logout Endpoint:** `GET / POST /api/auth/logout` clears session cookies and immediately issues an `HTTP 307 Redirect` to `/login`.
- **Edge Middleware (`middleware.ts`):**
  - Validates session payloads (rejection of corrupted/tampered cookies).
  - Unauthenticated requests to protected pages are intercepted and redirected to `/login?redirect=...`.
  - Authenticated users visiting `/login` are automatically redirected to their portal (`/` for Admin, `/tenant` for Tenant).
  - Tenants attempting to access Admin management pages (`/units`, `/tenants`, `/expenses`, etc.) or Admin API endpoints (`/api/admin/*`, `/api/automation/*`) receive an immediate redirect or `HTTP 403 Forbidden`.
  - Admins visiting `/tenant/*` are redirected to `/`.

---

## 7. Admin Workspace Module Guide

### 🏢 Overview Dashboard (`/`)
- **Real-Time Plaza Statistics:** Total shops, occupancy rate, total active tenants, and monthly rent receivables.
- **IESCO Utility Snapshot:** Total electricity connections, latest billing summary, and unpaid bills.
- **Quick Action Triggers:** Rapid onboarding, expense logging, and automation runs.

### 🏬 Shops & Rooms Manager (`/units`)
- **Unit Inventory:** Floor-by-floor breakdown (Ground, 1st, 2nd, Basement).
- **Unit Detail View (`/units/[id]`):**
  - Space specifications, dimensions, and current tenant.
  - Linked IESCO meter and 14-digit reference number.
  - Interactive Bill History with inline zoom viewer and download action.
  - Maintenance tickets logged for this specific shop.

### 👥 Tenants Directory (`/tenants`)
- **Tenant Management:** Filter by active/vacated status or space category (Shops vs. Rooms).
- **Portal Access Provisioning (`[ 🔑 Portal Access ]`):**
  - Check whether the tenant has active portal login credentials.
  - Set/reset login email and password.
  - **1-Click Shareable Credentials Generator (`[ 📋 Copy Login Credentials ]`):** Copies formatted SMS/WhatsApp-ready login details for instant sharing.
- **Tenant Profile View (`/tenants/[id]`):** Complete lease history, ledger balances, and payment timeline.

### ⚡ Electricity Meters & Connections (`/connections`)
- **Meter Registry:** 14-digit reference numbers, meter serials, consumer names, and connection types (Dedicated 1-to-1 vs. Shared).
- **Interactive Bill Fetcher:** 1-click live fetch from IESCO with preview, automatic file archiving, and ledger creation.
- **Shared Meter Split Allocator:** Distributes utility bills across multiple shops based on percentage shares.

### 💳 Rent & Financial Ledgers (`/rent`)
- **Monthly Rent Ledger:** Unit-by-unit accounting of monthly base rent, shared electricity charge, arrears, total billed, amount paid, and remaining balance.
- **Payment Processing:** Record partial or full payments with receipt numbers, payment methods (Cash, Bank Transfer, Cheque, Online), and printable payment receipts.

### 🧾 Outflow Expenses (`/expenses`)
- **Plaza Maintenance & Costs:** Log plaza expenditures (Staff salaries, security, electrical maintenance, plumbing, municipal taxes).
- **Expense Categorization:** Categorize by operational area with date, recipient, and amount tracking.

### 🔧 Maintenance & Work Orders (`/complaints`)
- **Ticket Management:** Track tickets by category (Electrical, AC, Plumbing, Structural, Door/Lock, Wall/Paint) and priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **Real-Time Tenant Sync:** Tickets lodged by tenants appear instantly with space name, tenant phone, and status update controls (`OPEN` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`).

### ⚙️ Activity Logs & Plaza Setup (`/logs` & `/settings`)
- **System Activity Trail:** Immutable audit trail recording all administrative actions, tenant onboardings, bill fetches, and payment receipts.
- **Plaza Setup Wizard:** Configure plaza name, address, floor counts, and default rent escalation rates.

---

## 8. Tenant Portal Suite Guide

The **Tenant Portal** (`/tenant/*`) provides commercial residents with a self-service dashboard:

### 1. Resident Dashboard (`/tenant`)
- Resident greeting, assigned shop/room name, and floor level.
- High-level metric cards: Monthly Base Rent, Latest Electricity Bill, Current Outstanding Balance, and Lease Expiry.
- Quick navigation shortcuts and recent transactions summary.

### 2. My Space (`/tenant/unit`)
- Architectural specifications of the leased space (Floor, Unit Category, Floor Area in sq ft).
- Linked utility meter details (14-digit reference, Dedicated vs. Shared percentage).
- Security deposit status held on record.

### 3. My Bills (`/tenant/bills`)
- Complete historical record of IESCO electricity bills for the resident's space.
- Shows billing month, units consumed, payable amount, due date, and payment status.
- **Full-Size Lightbox Viewer (`[ View Bill ]`):** Zoom in/out, fit to screen, pan/scroll, and print official scanned bills.
- **Direct Download (`[ Download ]`):** Downloads named PNG files (`electricity-bill-{ref}-{month}.png`).

### 4. My Payments (`/tenant/payments`)
- Transparent transaction ledger of all verified payment receipts recorded by management.
- Total paid-to-date and current outstanding balance calculation.

### 5. My Lease (`/tenant/lease`)
- Official contract schedule: Agreement duration, start date, and end date.
- Monthly rent commitment and security deposit trust status (`Fully Paid` vs. `Partial`).

### 6. Maintenance Requests (`/tenant/complaints`)
- Ticket history for the tenant's space.
- **Interactive "Lodge Maintenance Request" Modal:**
  - Subject / Issue Title.
  - Category selection (Electrical, Plumbing, AC, Structural, etc.).
  - Urgency level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Detailed description.
  - Real-time submission directly to management.

### 7. Profile & Security (`/tenant/profile`)
- View registered identity details (CNIC, Phone, Emergency Contact).
- Self-service **Change Password** utility.

---

## 9. IESCO Scraper & Bill Storage Engine

```
                                [ 14-Digit Reference Number ]
                                              │
                                              ▼
                             [ Playwright Headless Browser ]
                                              │
                        Navigates to IESCO Web Billing Portal
                                              │
                        Extracts Scanned Bill HTML / Image & Data
                                              │
                                ┌─────────────┴─────────────┐
                                ▼                           ▼
                     [ Persistent Storage ]       [ Bill Service Record ]
                    • public/uploads/bills/      • electricity_bills table
                    • Supabase Storage Bucket    • Monthly ledger update
                                │                           │
                                └─────────────┬─────────────┘
                                              ▼
                               [ Download & Lightbox Viewer ]
                                 • /api/bills/[id]/download
                                 • /api/bills/[id]/file
                                 • ViewBillModal.tsx (Zoom/Pan)
```

- **Scraper Location:** [`lib/iesco/scraper.ts`](file:///d:/ARHAM/PLAZA/plaza-electricity-manager/lib/iesco/scraper.ts) & [`lib/iesco/browser-scraper.ts`](file:///d:/ARHAM/PLAZA/plaza-electricity-manager/lib/iesco/browser-scraper.ts)
- **Storage Layer:** [`lib/bills/bill-storage.ts`](file:///d:/ARHAM/PLAZA/plaza-electricity-manager/lib/bills/bill-storage.ts)
- **Unified Bill Service:** [`lib/bills/service.ts`](file:///d:/ARHAM/PLAZA/plaza-electricity-manager/lib/bills/service.ts)

---

## 10. Complete API Route Directory

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and sets session cookie |
| `GET/POST`| `/api/auth/logout` | Public | Clears session cookie and redirects to `/login` |
| `GET` | `/api/auth/me` | Authenticated | Returns current user session & profile |
| `GET` | `/api/admin/tenants/[id]/portal-access` | Admin Only | Checks if tenant has portal credentials |
| `POST` | `/api/admin/tenants/[id]/portal-access` | Admin Only | Provisions/resets tenant login credentials |
| `POST` | `/api/tenant/complaints` | Tenant Only | Submits a maintenance request for the tenant's space |
| `POST` | `/api/tenant/password` | Tenant Only | Updates the logged-in tenant's password |
| `GET` | `/api/bills/[id]/download` | Authenticated | Downloads official electricity bill PNG as attachment |
| `GET` | `/api/bills/[id]/file` | Authenticated | Streams official electricity bill image for inline modal preview |
| `POST` | `/api/fetch-bill` | Admin Only | Triggers live IESCO bill scraping via reference number |
| `POST` | `/api/automation/sync-bills` | Admin Only | Automated bulk bill scraping for all plaza meters |
| `POST` | `/api/automation/monthly-ledgers` | Admin Only | Generates monthly financial rent & utility ledgers |

---

## 11. Project Directory & File Structure

```
d:/ARHAM/PLAZA/plaza-electricity-manager/
├── app/
│   ├── api/
│   │   ├── admin/tenants/[id]/portal-access/route.ts  # Admin tenant provisioning API
│   │   ├── auth/login/route.ts                        # Authentication login route
│   │   ├── auth/logout/route.ts                       # Logout route (HTTP 307 redirect)
│   │   ├── auth/me/route.ts                           # Session verification route
│   │   ├── bills/[id]/download/route.ts               # Bill file download route
│   │   ├── bills/[id]/file/route.ts                   # Bill file preview route
│   │   ├── fetch-bill/route.ts                        # IESCO scraping endpoint
│   │   ├── tenant/complaints/route.ts                 # Tenant complaint submission
│   │   └── tenant/password/route.ts                   # Tenant password change
│   ├── login/page.tsx                                 # Unified Login Page UI
│   ├── tenant/                                        # Tenant Portal Suite
│   │   ├── layout.tsx                                 # Tenant Portal Layout shell
│   │   ├── page.tsx                                   # Tenant Dashboard
│   │   ├── bills/page.tsx                             # Tenant Bills History & Viewer
│   │   ├── complaints/page.tsx                        # Tenant Complaints & Work Orders
│   │   ├── lease/page.tsx                             # Tenant Lease & Security Deposit
│   │   ├── payments/page.tsx                          # Tenant Payment Receipts
│   │   ├── profile/page.tsx                           # Tenant Profile & Security
│   │   └── unit/page.tsx                              # Tenant Space Specifications
│   ├── units/                                         # Admin Units & Shops
│   ├── tenants/                                       # Admin Tenants Directory
│   ├── connections/                                   # Admin Electricity Meters
│   ├── rent/                                          # Admin Rent & Ledgers
│   ├── expenses/                                      # Admin Outflow Expenses
│   ├── complaints/                                    # Admin Operations / Tickets
│   ├── logs/ & settings/                              # Admin Logs & Configuration
│   ├── layout.tsx                                     # Root Layout with AppShell
│   └── page.tsx                                       # Admin Overview Dashboard
├── components/
│   ├── bills/                                         # Bill Lightbox Viewer & History
│   ├── navigation/                                    # Sidebar, Topbar, AppShell, MobileNav
│   ├── tenant/                                        # TenantNavbar, ComplaintsManager, BillsManager
│   ├── tenants/                                       # TenantsManager, TenantPortalAccessModal
│   ├── units/                                         # UnitsManager, AddUnitModal, UnitDetailView
│   └── ui/                                            # Reusable UI widgets & Badges
├── data/
│   └── plaza_store.json                               # Atomic JSON dual-persistence store
├── lib/
│   ├── auth/                                          # server-auth, tenant-context, profile-service
│   ├── bills/                                         # bill-storage, unified bill service
│   ├── complaints/                                    # complaints service
│   ├── electricity/                                   # electricity service & split logic
│   ├── iesco/                                         # scraper & browser automation
│   ├── ledgers/ & payments/                           # accounting & receipt services
│   ├── storage/                                       # fileStore.ts atomic JSON engine
│   ├── supabase/                                      # Supabase client initialization
│   ├── tenants/ & units/                              # tenant & space domain services
│   └── utils/                                         # formatters & date helpers
├── middleware.ts                                      # Next.js Edge Middleware route guards
├── public/uploads/electricity-bills/                  # Persistent disk storage for bills
├── supabase/migrations/                               # SQL migration scripts
└── package.json                                       # Manifest & dependencies
```

---

## 12. User Manual & Testing Reference

### 🌐 Accessing the Application
- **Application URL:** [http://localhost:3000](http://localhost:3000)
- **Sign In Page:** [http://localhost:3000/login](http://localhost:3000/login)

### 🔑 Demo Logins (Built into 1-Click Buttons on `/login`):
1. **🏢 Admin Portal:**
   - **Email:** `admin@plaza.com`
   - **Password:** `admin123`
   - *Full access to overview, shops & rooms, tenant directory, electricity meters, rent ledgers, expenses, and logs.*

2. **👤 Tenant Portal:**
   - **Email:** `tenant@plaza.com`
   - **Password:** `tenant123`
   - *Access to space specs, official IESCO bills with full-size zoom viewer & download, payment receipts, lease details, and maintenance ticket filing.*

### 🛠️ Common Operational Workflows:
1. **How an Admin provisions a Tenant Account:**
   - Open `/tenants` → Click **`[ 🔑 Portal Access ]`** on any tenant card.
   - Enter email/password (or click **Generate Random**) → Click **Update Credentials**.
   - Click **`[ 📋 Copy Shareable Login Info ]`** to copy the formatted credentials and send to the tenant.
2. **How a Tenant views/downloads a bill:**
   - Sign in as tenant → Click **"My Bills"** in the top navigation.
   - Click **`[ View Bill ]`** to open the full-size zoomable lightbox viewer, or click **`[ Download ]`** to save the bill PNG.
3. **How a Tenant files a Maintenance Request:**
   - Sign in as tenant → Click **"My Complaints"** → Click **`[ + Lodge Maintenance Request ]`**.
   - Select category (Electrical, AC, Plumbing, etc.), set priority, enter description, and submit.
   - The ticket immediately appears in the resident's ticket list AND the Admin's **Maintenance Manager ([`/complaints`](http://localhost:3000/complaints))**.

---
*Documentation compiled with 100% build verification and zero TypeScript errors.*
