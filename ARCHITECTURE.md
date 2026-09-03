# 🏛️ System Architecture & Codebase Guide

This document explains the technical architecture, layer separation, data flow, and directory structure of the **Plaza Management System**.

---

## 1. High-Level Architectural Layers

The application is built on **Next.js 16 (App Router)** and is organized into three distinct layers:

```
                                  ┌───────────────────────────────┐
                                  │       USER BROWSER            │
                                  │   (Admin & Tenant Portals)    │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FRONTEND LAYER                                            │
│                                                                                                 │
│  📁 app/                                           📁 components/                               │
│  ├── page.tsx (Admin Overview)                    ├── dashboard/ (KPIs & Status Summaries)     │
│  ├── units/ (Shops Inventory)                     ├── units/ (Unit Management & Modals)        │
│  ├── tenants/ (Tenant Directory & Onboarding)     ├── tenants/ (Tenant Flow & Credentials)     │
│  ├── rent/ (Rent Ledgers & Collection)            ├── rent/ (Ledger Matrix & Payment Action)   │
│  ├── connections/ (IESCO Electricity Meters)      ├── payments/ (Receipt Generator & History)  │
│  ├── complaints/ (Maintenance & Repairs)          ├── complaints/ (Ticket Workflow)            │
│  ├── expenses/ (Plaza Operating Expenses)         ├── expenses/ (Expense Manager)              │
│  ├── reports/ (Financial Statements)              ├── navigation/ (Navbar & Sidebar)           │
│  └── tenant/ (Dedicated Tenant Portal)            └── ui/ (Design System & Badges)             │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BACKEND LAYER                                             │
│                                                                                                 │
│  ⚙️ Server Actions (app/*/actions.ts)               ⚙️ REST API Endpoints (app/api/*)            │
│  ├── createTenantAction, recordPaymentAction      ├── /api/auth/login, /api/auth/logout        │
│  ├── createUnitAction, updateComplaintAction      ├── /api/fetch-bill, /api/automation/*       │
│                                                   └── /api/tenant/notifications/*              │
│                                                                                                 │
│  ⚙️ Core Service Layer (lib/*)                                                                  │
│  ├── lib/auth/       → Session validation, password security & tenant context                   │
│  ├── lib/payments/   → Payment processing, receipt numbering (RCP-YYMM-XXXX)                   │
│  ├── lib/ledgers/    → Monthly rent & utility ledger synchronization                            │
│  ├── lib/iesco/      → Live WAPDA/IESCO web scraper engine                                      │
│  ├── lib/complaints/ → Ticket status state machines & contractor repair costs                   │
│  └── lib/automation/ → Scheduled cron jobs (1st of month ledgers, rent escalation)              │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE & STORAGE LAYER                                      │
│                                                                                                 │
│  🗄️ Primary: Supabase (PostgreSQL Cloud)                                                        │
│  ├── tables: plazas, units, tenants, leases, connections, bills, payments, complaints, etc.    │
│  └── schemas: supabase/complete_setup.sql and supabase/migrations/                             │
│                                                                                                 │
│  💾 Fallback: Dual-Persistence Engine (lib/storage/fileStore.ts)                                │
│  └── file: data/store.json (Enables immediate zero-setup local execution)                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Layer Breakdown

### 2.1 Admin Portal Pages (`app/`)
| Route | Purpose | Key Components Used |
| :--- | :--- | :--- |
| `/` | Read-only executive snapshot of plaza occupancy and financials. | `components/dashboard/SimpleOverviewDashboard.tsx` |
| `/units` | Unit directory, floor grouping, vacancy and meter assignments. | `components/units/UnitsManager.tsx`, `AddUnitModal.tsx` |
| `/tenants` | Tenant directory, 4-step onboarding, lease setup & credentials. | `components/tenants/AddTenantModal.tsx`, `TenantProfileView.tsx` |
| `/rent` | Monthly rent ledger matrix, dues calculation, payment collection. | `components/rent/RentManagementTable.tsx`, `RecordPaymentModal.tsx` |
| `/connections` | IESCO 14-digit meter links, sub-meter split configs, live bills. | `components/connections/ConnectionsManager.tsx`, `ConnectMeterModal.tsx` |
| `/complaints` | Maintenance tickets, status workflow, contractor repair expenses. | `components/complaints/ComplaintsManager.tsx`, `ComplaintDetailModal.tsx` |
| `/expenses` | Plaza operating expenses, repairs, utility maintenance logs. | `components/expenses/ExpenseLedger.tsx`, `AddExpenseModal.tsx` |
| `/reports` | Occupancy graphs, monthly revenue vs expense statement. | `components/reports/FinancialReportView.tsx` |
| `/automation` | Manual & scheduled triggers for automated billing crons. | `components/automation/AutomationCenter.tsx` |

### 2.2 Tenant Portal Pages (`app/tenant/`)
| Route | Purpose | Key Components Used |
| :--- | :--- | :--- |
| `/tenant` | Tenant dashboard showing monthly rent, latest electricity bill & balance. | `app/tenant/page.tsx` |
| `/tenant/payments` | Transaction history with official printable & downloadable receipts. | `components/tenant/TenantPaymentsManager.tsx` |
| `/tenant/bills` | View and download monthly IESCO electricity bills. | `components/tenant/TenantBillsManager.tsx` |
| `/tenant/lease` | Inspect active lease agreement, monthly rent, and security deposit. | `app/tenant/lease/page.tsx` |
| `/tenant/complaints` | Submit new maintenance issues and track repair status. | `components/tenant/TenantComplaintsManager.tsx` |

---

## 3. Backend Services & Business Logic (`lib/`)

Each module in `lib/` is isolated and responsible for a single business domain:

- **`lib/auth/`**:
  - `auth-service.ts`: Admin & tenant credentials verification, cookie session management.
  - `tenant-context.ts`: Resolves the active tenant's context (profile, lease, unit, bills, complaints).
  - `profile-service.ts`: Unique portal login provisioning and duplicate email prevention.
- **`lib/payments/`**:
  - `service.ts`: Payment transaction recording, `RCP-YYMM-XXXX` receipt generation, dual persistence.
- **`lib/ledgers/`**:
  - `service.ts`: Monthly ledger generation (calculates base rent, previous balance, payments, remaining due).
- **`lib/iesco/`**:
  - `scraper.ts`: Web scraper that queries IESCO online billing and parses consumer details, due date, units, and amount.
- **`lib/complaints/`**:
  - `service.ts`: Maintenance ticket lifecycle (`OPEN` → `IN_PROGRESS` → `RESOLVED`) and repair expense recording.
- **`lib/automation/`**:
  - `service.ts`: 1st of the month ledger generation, daily bill sync, and annual rent escalation.

---

## 4. Database Layer & Persistence

### 4.1 Supabase PostgreSQL
The database schema is defined in `supabase/complete_setup.sql`. Key tables include:
- `plazas`: Multi-plaza metadata, addresses, floor configurations.
- `units`: Shop/room inventory with floor, area, and default rent.
- `tenants`: Tenant contact details, CNIC, and portal credentials.
- `leases`: Binding between tenant and unit with rent, security deposit, and start/end dates.
- `connections`: 14-digit IESCO meter mapping with sub-meter split parameters.
- `bills`: Historical electricity bills fetched from IESCO.
- `payments`: Verified payment transactions with unique receipt numbers.
- `tenant_monthly_ledgers`: Monthly financial summary per tenant/unit.
- `complaints`: Maintenance issue tickets with resolution notes and repair costs.
- `plaza_expenses`: Plaza operational expenses and contractor fees.

### 4.2 Dual-Persistence Engine (`lib/storage/fileStore.ts`)
To ensure the application runs effortlessly out-of-the-box in local development environments, a **dual-persistence system** is built into every service. If Supabase is unreachable or unconfigured, all data reads and writes automatically persist to `data/store.json`.

---

## 5. Security & Authentication Model

- **Session Security**: Handled via `plaza_session` HTTP-only cookie.
- **Middleware Guard (`middleware.ts`)**:
  - Unauthenticated requests to protected routes redirect to `/login`.
  - Admin accounts have full access to `/`, `/units`, `/tenants`, `/rent`, `/reports`, etc.
  - Tenant accounts are strictly restricted to the `/tenant/*` sub-routes with isolated data context.

