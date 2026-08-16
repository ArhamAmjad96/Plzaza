# Plaza Electricity Manager — Project Context

## 1. What this application does

Plaza Electricity Manager is a small internal web app for tracking electricity connections and bills for a plaza/complex. It lets a user:

- fetch a bill from the IESCO portal using a reference number
- parse the bill HTML into structured fields
- save or update the corresponding electricity connection in Supabase
- save or update the bill record for that connection
- view dashboard summaries, connection details, bill details, and tenant assignments
- mark bills as paid or delete them

The app is currently built as a Next.js 16 application with server-rendered pages and server actions.

---

## 2. Core business workflow

The main data flow is:

1. User enters a tenant name and an IESCO reference number.
2. The app calls the API route at /api/fetch-bill.
3. The route opens the IESCO bill website, submits the reference number, and retrieves the HTML response.
4. The HTML is parsed by the custom parser in lib/parse-bill.js.
5. The parsed values are used to:
   - create or find a connection in Supabase
   - create or update a bill record in Supabase
6. The UI reloads and shows the updated dashboard or connection page.

This is the most important flow to understand before making changes.

---

## 3. Tech stack

- Framework: Next.js 16 (App Router)
- UI: React 19
- Styling: Tailwind CSS 4
- Backend/database: Supabase
- HTTP scraping: Axios + axios-cookiejar-support + tough-cookie
- HTML parsing: Cheerio
- Language: TypeScript for app code, JavaScript for the parser script

### Main dependencies

Package.json contains these key packages:

- next
- react / react-dom
- @supabase/supabase-js
- axios
- axios-cookiejar-support
- tough-cookie
- cheerio
- tailwindcss
- typescript
- eslint

---

## 4. Project structure

### Root files

- package.json: project scripts and dependencies
- tsconfig.json: TypeScript configuration
- next.config.ts: Next.js config
- eslint.config.mjs: linting setup
- README.md: default Next.js starter content, not full project documentation
- PROJECT_CONTEXT.md: this file

### App router structure

- app/page.tsx: dashboard home page
- app/layout.tsx: root layout and shared navigation header
- app/globals.css: global styles and Tailwind import
- app/FetchBillForm.tsx: client form used on the dashboard to fetch bills

### API routes

- app/api/fetch-bill/route.ts: the main server-side scraper and database upsert logic

### Pages and features

- app/connections/page.tsx: list all connections
- app/connections/[id]/page.tsx: connection detail page with bills history
- app/connections/[id]/FetchBillButton.tsx: button to fetch latest bill for a connection
- app/connections/[id]/edit/page.tsx: edit connection details form
- app/connections/[id]/edit/actions.ts: server actions for updating and toggling a connection

- app/tenants/page.tsx: table to assign/update tenant names
- app/tenants/actions.ts: server action for updating tenants

- app/bills/[id]/page.tsx: bill detail page
- app/bills/[id]/actions.ts: server actions to mark a bill as paid or delete it

### Shared libraries

- lib/supabase-server.ts: creates the Supabase client using env vars
- lib/parse-bill.js: parser for the IESCO HTML response

### Scripts and scratch files

- scripts/test-fetch.js: standalone script that tests the IESCO scraping flow
- test-bill.html / test-bill-result.html: sample HTML or output files used during debugging

---

## 5. Main runtime behavior

### Home dashboard

The dashboard page loads:

- total active connections
- number of bills this month
- total electricity amount
- pending payments
- recent bills table

It also renders the fetch bill form.

### Connections page

Shows all connection rows from the Supabase connections table with:

- connection name
- reference number
- meter number
- tenant
- location
- active/inactive status

Each connection can be opened in its detail page.

### Connection detail page

Shows:

- connection metadata
- bill history for that connection
- a button to fetch the latest bill for that reference number
- links to edit connection or view each bill

### Bill detail page

Shows full bill details and offers actions:

- mark as paid
- delete bill

### Tenant page

Used to assign or update tenant names for each connection.

---

## 6. Data model expectations

The app expects at least these Supabase tables and fields:

### connections

Common fields used by the app:

- id
- reference_number
- name
- tenant
- meter_number
- location
- tariff
- active

### bills

Common fields used by the app:

- id
- connection_id
- billing_month
- issue_date
- due_date
- meter_number
- previous_reading
- current_reading
- units_consumed
- bill_amount
- arrears
- late_payment_amount
- status

The app uses the composite upsert key:

- connection_id + billing_month

So each connection can only have one bill record per billing month.

---

## 7. Environment variables

The app uses these environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

These are loaded in lib/supabase-server.ts.

If they are missing, the server-side Supabase client will fail.

---

## 8. Important implementation details

### Supabase client

The app uses a single shared client from lib/supabase-server.ts. All pages and routes use that module.

### Server components vs client components

- Server components are used for data loading and page rendering.
- Client components are used for user interaction forms and buttons.

Examples:

- app/page.tsx is a server component.
- app/FetchBillForm.tsx is a client component.
- app/connections/[id]/FetchBillButton.tsx is a client component.

### Bill fetching endpoint

The main logic lives in app/api/fetch-bill/route.ts.

It does the following:

- validates the incoming request body
- creates a cookie-aware Axios client
- opens the IESCO form page
- reads hidden form fields
- submits the reference number
- checks the returned HTML contains the reference number
- parses the HTML into a bill object
- finds or creates a connection in Supabase
- converts the parsed billing month into a proper date
- upserts the bill into Supabase
- returns JSON success/error to the browser

### Parser behavior

lib/parse-bill.js uses Cheerio to inspect the HTML structure from IESCO. It looks for labels such as:

- REFERENCE NO
- NAME & ADDRESS
- METER NO
- PREVIOUS READING
- PRESENT READING
- UNITS
- BILL MONTH
- ISSUE DATE
- DUE DATE
- GRAND TOTAL
- ARREARS
- LP SURCHARGE

The parser returns a normalized object that the API route uses to save data.

---

## 9. Known issues and caution points

These are important for future work:

1. The fetch route currently requires a tenant value, but the connection detail button does not send one. That means fetching from the connection detail page may fail unless the route is adjusted.
2. The fetch route uses a hardcoded “unpaid” status for newly fetched bills.
3. The parser is fragile because it depends on the exact HTML structure returned by IESCO. If the site changes, parsing will likely break.
4. There are no automated tests currently. Verification is mostly manual through browser testing and route inspection.
5. The UI sometimes reloads the whole page after a successful fetch. That is simple but not ideal for modern UX.

These should be treated as known areas to improve.

---

## 10. How to run the project locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 11. What a future assistant should remember

Before editing this project, understand this sequence:

- user action in UI
- API route /api/fetch-bill
- HTML scrape from IESCO
- parse bill data
- save/update Supabase connection and bill
- refresh UI

Most feature work will touch one or more of these layers:

- UI page/component
- server action or API route
- Supabase queries
- parser logic

When changing behavior, keep the data flow consistent and verify both the scraping logic and the database writes.

---

## 12. Suggested working style for future changes

- Prefer small, focused changes.
- Preserve the existing Supabase data shape unless the schema is updated intentionally.
- Keep the parser logic isolated in lib/parse-bill.js.
- If the IESCO HTML changes, expect parser fixes first.
- When updating the UI, ensure the data flow still works end-to-end.

This project is a practical, small business CRUD + scraper application. The most important part is the scrape-to-database pipeline.
