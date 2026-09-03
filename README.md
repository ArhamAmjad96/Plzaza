# 🏢 Plaza Management System
> **Full-Stack Commercial Property & Utility Management Platform**  
> *Engineered for commercial plazas, shopping centers, multistory markets, and mixed-use commercial real estate.*

---

## 🧭 Project Architecture at a Glance

This repository is structured into three clean, distinct architectural layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. FRONTEND LAYER                             │
│  Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Lucide Icons    │
│                                                                         │
│  📁 app/              → Server & Client Page Routes (Admin & Tenant)    │
│  📁 components/       → Modular UI Components & Interactive Managers   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           2. BACKEND LAYER                              │
│  Next.js Server Actions · REST API Endpoints · Modular Business Logic   │
│                                                                         │
│  📁 app/api/          → API Routes (Auth, Bills, Crons, Complaints)    │
│  📁 lib/              → Core Services (Auth, IESCO Scraper, Ledgers)   │
│  📁 middleware.ts     → Route Protection & Role-Based Access Control    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      3. DATABASE & STORAGE LAYER                        │
│  Supabase PostgreSQL + Dual-Persistence JSON File Store                 │
│                                                                         │
│  📁 supabase/         → SQL Schemas, Migrations & RLS Policies          │
│  📁 data/store.json   → Local JSON Database (Zero-Setup Dev Mode)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Complete Directory & File Map

```text
├── app/                        # Next.js App Router (Pages & Endpoints)
│   ├── (admin pages)
│   │   ├── page.tsx            # 📊 Admin Overview (Read-Only Operational Snapshot)
│   │   ├── units/              # 🏬 Units & Shops Inventory Management
│   │   ├── tenants/            # 👥 Tenant Profiles & 4-Step Onboarding Flow
│   │   ├── rent/               # 💳 Rent Collection Ledger & Payment Recording
│   │   ├── connections/        # ⚡ Electricity Meters & 14-Digit IESCO Reference Links
│   │   ├── complaints/         # 🛠️ Maintenance Tickets & Repair Expense Tracking
│   │   ├── expenses/           # 💸 Plaza Operational & Utility Expenses
│   │   ├── reports/            # 📈 Financial Statements, Occupancy & Cashflow
│   │   ├── automation/         # 🤖 Scheduled Cron Triggers & Task Automation
│   │   ├── logs/               # 📜 Security, Activity & Audit Trail
│   │   └── settings/           # ⚙️ Plaza Setup & Floor Rebuilding Wizard
│   │
│   ├── tenant/                 # 👤 Dedicated Tenant Portal
│   │   ├── page.tsx            # Tenant Overview Dashboard
│   │   ├── payments/           # 🧾 Tenant Payment History & Printable Receipts
│   │   ├── bills/              # ⚡ View & Download IESCO Utility Bills
│   │   ├── lease/              # 📄 Lease Agreement & Security Deposit Status
│   │   ├── unit/               # 🏪 Assigned Space & Meter Specifications
│   │   ├── complaints/         # 🛠️ Submit & Track Maintenance Issues
│   │   └── profile/            # 🔒 Tenant Profile & Password Management
│   │
│   ├── login/                  # 🔐 Unified Admin & Tenant Portal Login
│   └── api/                    # ⚙️ Backend REST Endpoints
│       ├── auth/               # Login, Logout, Session Verification
│       ├── admin/              # Admin Tenant Portal Provisioning
│       ├── automation/         # Cron Endpoints (Daily Sync, Monthly Ledgers)
│       ├── bills/              # IESCO Bill Fetching & Direct File Downloads
│       └── tenant/             # Tenant-Facing API Handlers
│
├── components/                 # Reusable UI & Client Managers
│   ├── dashboard/              # Admin Overview Cards & Metrics
│   ├── tenant/                 # Tenant Portal Interactive Managers
│   ├── units/                  # Unit Management & Modals (Add, Edit, Vacate)
│   ├── tenants/                # Tenant Modal, Unique Login Generator & 360 View
│   ├── rent/                   # Rent Ledger Matrix & Payment Modal
│   ├── payments/               # Payment History & Printable Receipt Modal
│   ├── complaints/             # Maintenance Ticket Workflow & Expense Modals
│   ├── expenses/               # Expense Ledger & Add Expense Modal
│   ├── navigation/             # Top Navbar, Sidebar & Role Badges
│   └── ui/                     # Generic Design System (Badges, Modals, StatCards)
│
├── lib/                        # Backend Business Logic Services
│   ├── auth/                   # Password Hashing, Session Cookies, Tenant Context
│   ├── automation/             # Auto-Billing, Rent Escalation, Background Sync
│   ├── bills/                  # Electricity Bill Operations
│   ├── complaints/             # Ticket Lifecycles & Repair Expense Sync
│   ├── electricity/            # Meter Allocation & Split Formula Calculations
│   ├── expenses/               # Plaza General & Utility Expenses
│   ├── iesco/                  # Live IESCO / WAPDA Web Bill Scraper Engine
│   ├── ledgers/                # Monthly Charge Calculations & Sync
│   ├── logs/                   # System Activity & Audit Trail Logging
│   ├── notifications/          # Real-Time Notification Bell Handlers
│   ├── payments/               # Payment Recording & Official Receipt Generation
│   ├── reports/                # Financial Aggregations & Metrics
│   ├── storage/                # Dual-Persistence Engine (fileStore.ts)
│   ├── supabase/               # Supabase Client & Server Connectors
│   ├── tenants/                # Tenant CRUD & Multi-Tenant Credentials
│   ├── units/                  # Unit Floor Layouts & Occupancy Logic
│   └── utils/                  # Currency (PKR) & Date Formatting Helpers
│
├── supabase/                   # Database Schemas & Migrations
│   ├── complete_setup.sql      # Single-file complete database setup script
│   └── migrations/             # Incremental SQL migration scripts (Phases 1-11)
│
├── data/                       # Local File Storage (Auto-Created)
│   └── store.json              # Local JSON Database (Zero-Config Development)
│
└── middleware.ts               # Authentication Guard & Route Proxy
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `npm` (bundled with Node.js)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ArhamAmjad96/Plzaza.git
cd Plzaza/plaza-electricity-manager
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
> **Note:** The system includes a built-in **Dual-Persistence Engine**. If Supabase credentials are not supplied, the project automatically runs seamlessly using the local disk-backed `data/store.json` database.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Login Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Plaza Admin** | `admin@plaza.com` | `admin123` | Full Administrative & Operations Access |
| **Tenant A** | `ali@example.com` | `tenant123` | Tenant Portal (Unit Ground-01) |
| **Tenant B** | `khan@example.com` | `tenant123` | Tenant Portal (Unit First-01) |

> In development mode, you can log into any active tenant account created in the Admin Portal using their assigned email and password.

---

## 🌟 Core System Features

### 1. 📊 Simple, Read-Only Admin Overview (`/`)
- Answers the core question: **"What is the current condition of my plaza right now?"**
- Displays occupancy status, monthly rent collected vs outstanding, active electricity meters, and pending maintenance tickets at a glance.

### 2. 👥 Multi-Tenant Architecture & Unique Portals
- Every tenant gets their own unique login credentials created during onboarding.
- Strict data isolation: Tenants can only view their own space, bills, payments, and tickets.
- Onboarding modal features a 🎲 **Generate Password** tool and 📋 **Copy WhatsApp Credentials** card.

### 3. 🧾 Official Payment Receipts & Rent Management (`/rent`, `/tenant/payments`)
- Recording any payment generates an instant, verified receipt number (e.g. `RCP-2609-4821`).
- Clear breakdown of Rent, Electricity, Security Deposit, and Maintenance charges.
- **`[ 🖨️ Print Official Receipt ]`**: Formatted for standard desktop and thermal receipt printers.
- **`[ 📋 Copy for WhatsApp ]`**: Pre-formatted WhatsApp confirmation message.

### 4. ⚡ Live IESCO Electricity Bill Scraper (`/connections`)
- Directly scrapes and parses official WAPDA/IESCO online bills using 14-digit reference numbers.
- Handles both dedicated shop meters and shared multi-tenant sub-meters with custom percentage splits.

### 5. 🛠️ Maintenance & Repair Expense Workflow (`/complaints`)
- Full ticket lifecycle: `OPEN` → `IN_PROGRESS` → `RESOLVED`.
- Integrated repair expenses: Log contractor and material costs, which automatically reflect in plaza operating expense reports.

---

## 🛠️ Build & Verification Commands

```bash
# Type check all TypeScript files
npx tsc --noEmit

# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 📄 License
Commercial Plaza Management System — Developed for high-reliability commercial property administration.

