# Smart Dental AI Services

An AI-powered operations layer for dental offices running Open Dental. Built as a polished local MVP demonstrating intelligent automation for clinical notes, insurance, billing, recall, and radiograph review.

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Install & Run

```bash
# 1. Clone / enter project directory
cd dentalai

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Start both server and client simultaneously
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Demo Login
- **Email**: `demo@smartdentalai.com`
- **Password**: `demo`

---

## Project Structure

```
dentalai/
├── client/                  # React + TypeScript + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/      # Sidebar, TopBar
│       │   └── ui/          # StatCard, Badge, Modal, ActivityFeed, etc.
│       ├── context/         # AuthContext (fake local auth)
│       ├── layouts/         # AppLayout (sidebar + main area wrapper)
│       ├── lib/
│       │   ├── api.ts       # Typed axios API client for all endpoints
│       │   ├── auth.ts      # LocalStorage-based demo auth
│       │   └── utils.ts     # formatCurrency, formatDate, color helpers
│       ├── pages/           # One file per route/module
│       └── types/           # Shared TypeScript interfaces
│
├── server/                  # Node.js + Express + TypeScript backend
│   └── src/
│       ├── db/client.ts     # Prisma singleton
│       ├── lib/activity.ts  # logActivity() helper
│       └── routes/          # One file per resource
│           ├── patients.ts
│           ├── notes.ts      # + mock AI SOAP generator
│           ├── insurance.ts  # plans + claims
│           ├── billing.ts
│           ├── recall.ts
│           ├── radiographs.ts
│           ├── dashboard.ts  # aggregated stats
│           ├── activity.ts
│           └── settings.ts   # in-memory mock settings
│
├── prisma/
│   ├── schema.prisma        # SQLite schema (9 models)
│   └── seed.ts              # Realistic demo dental office data
│
└── data/
    └── dentalai.db          # SQLite database (auto-created by seed)
```

---

## Seeded Demo Data

| Resource         | Count | Details |
|-----------------|-------|---------|
| Providers        | 3     | Dr. Sarah Mitchell DDS, Dr. James Patel DMD, Jennifer Ross RDH |
| Patients         | 12    | Full demographics, insurance, balances |
| Appointments     | 18    | Mix of completed and upcoming |
| Clinical Notes   | 10    | Draft, pending approval, and approved SOAP notes |
| Insurance Plans  | 12    | Delta Dental, Cigna, Aetna, MetLife, Blue Cross |
| Insurance Claims | 14    | All statuses: draft, submitted, approved, denied |
| Balances         | 7     | Current through collections |
| Recall Tasks     | 8     | 7 overdue (up to 330 days), 1 scheduled |
| Radiographs      | 8     | With AI findings (simulated) |
| Activity Logs    | 15    | Recent office actions |

---

## Module Overview

| Module         | Route         | Key Features |
|---------------|---------------|-------------|
| Dashboard      | `/dashboard`  | Stats cards, Recharts charts, activity feed |
| Patients       | `/patients`   | Searchable table, detail panel |
| AI Notes       | `/notes`      | Transcript → SOAP note generation, approve workflow |
| Insurance      | `/insurance`  | Verification tab + Claims tab, verify/submit actions |
| Billing        | `/billing`    | Balance tracking, send statement/reminder, mark paid |
| Recall         | `/recall`     | Overdue hygiene list, text/email/schedule actions |
| Radiographs    | `/radiographs`| AI findings viewer with confidence scores (simulated) |
| Settings       | `/settings`   | Open Dental integration panel, module toggles |

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/patients` | List patients (search param supported) |
| GET | `/patients/:id` | Patient with all related data |
| GET | `/notes` | List notes (status filter param) |
| POST | `/notes/generate` | AI SOAP note from transcript |
| PATCH | `/notes/:id/approve` | Approve a clinical note |
| GET | `/insurance/plans` | List insurance plans |
| PATCH | `/insurance/plans/:id/verify` | Simulate verification |
| GET | `/insurance/claims` | List claims (status filter) |
| PATCH | `/insurance/claims/:id/submit` | Submit a claim |
| GET | `/billing/balances` | List patient balances |
| PATCH | `/billing/balances/:id/send-statement` | Mark statement sent |
| PATCH | `/billing/balances/:id/mark-paid` | Mark balance paid |
| GET | `/recall/tasks` | List recall tasks |
| PATCH | `/recall/tasks/:id/send-text` | Log text sent |
| PATCH | `/recall/tasks/:id/schedule` | Mark patient scheduled |
| GET | `/radiographs` | List radiograph studies |
| POST | `/radiographs/:id/reviewed` | Mark study reviewed |
| GET | `/dashboard/stats` | Aggregated dashboard stats |
| GET | `/activity` | Recent activity log |
| GET | `/settings` | App + integration settings |

---

## Individual Dev Commands

```bash
# Server only
npm run dev:server

# Client only  
npm run dev:client

# Prisma Studio (database browser)
npm run db:studio

# Re-seed the database
npm run db:seed
```

---

## Future Roadmap

### Phase 2 — Real Open Dental Integration
- [ ] Build an Open Dental API adapter in `server/src/integrations/openDental/`
- [ ] Scheduled sync job (cron) to pull patients, appointments, claims
- [ ] Webhook listener for real-time appointment events
- [ ] Map Open Dental procedure codes to Smart Dental AI claim data

### Phase 3 — Real AI
- [ ] Replace mock SOAP generator with OpenAI/Anthropic API call
  - Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to server `.env`
  - System prompt: structured dental SOAP note format
  - Streaming support for note generation UX
- [ ] Replace simulated radiograph findings with a real vision model
  - Annotate X-ray images with bounding boxes + findings

### Phase 4 — Production Hardening
- [ ] Real JWT auth (replace localStorage demo auth)
- [ ] Multi-office support with role-based access control
- [ ] Email/SMS sending via Twilio + SendGrid
- [ ] PDF export for claims and patient statements
- [ ] Audit log persistence and export
- [ ] Stripe billing for SaaS subscription

### Phase 5 — Advanced Features
- [ ] Patient portal (read-only balance / appointment view)
- [ ] Treatment plan automation
- [ ] Insurance eligibility via Availity/Change Healthcare API
- [ ] ERA/EOB parsing for automatic claim reconciliation
- [ ] Analytics dashboard with trend data

---

## Future Integration Notes

The following areas are **clearly marked as future work** and require API keys or production setup:

| Feature | What's needed |
|--------|--------------|
| Open Dental sync | Open Dental API credentials + local server access |
| AI note generation | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` |
| AI radiograph analysis | Vision model API + DICOM viewer library |
| SMS recall messages | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` |
| Email recall messages | `SENDGRID_API_KEY` |
| Insurance eligibility | Availity API credentials |
| Production auth | JWT secret + user database |

All integration points are isolated in their respective service files (`server/src/routes/` and future `server/src/integrations/`) for easy drop-in replacement.
