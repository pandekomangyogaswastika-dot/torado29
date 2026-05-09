# Phase 11 — Owner Finance Cockpit — Completion Report

> **Status:** ✅ COMPLETE
> **Started:** 2026-04-29
> **Completed:** 2026-04-29
> **Tested:** Backend regression at 95% pass via testing_agent_v3 (iteration_17) — zero critical bugs, zero flaky endpoints.

## What Shipped

### 11A — Performance Hardening
- **Backend:** New `services/cache_service.py` — Mongo TTL cache with `cache_or_compute(prefix, ttl_sec)` decorator for heavy aggregation responses. Auto-creates TTL index on `_cache_kv` collection.
- **Frontend:** Tuned `lib/queryClient.js` — `staleTime 30s`, `gcTime 5m`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, retry 1 with exponential backoff.
- **Note:** Lazy-loading + portal code-splitting was already done in prior phases. Frontend Suspense boundaries already in place.

### 11B — Cash Position Dashboard + Liquid Asset Master
- **Models:**
  - New `cash_accounts` collection: `{id, code, name, type: bank|petty_cash|ewallet|other, outlet_id?, brand_id?, bank_name?, bank_account_no?, current_balance, opening_balance, last_updated_at, last_updated_by, last_reconciled_at?, linked_coa_id?, notes?, is_active}`
  - New `cash_balance_snapshots`: `{id, cash_account_id, balance, delta, recorded_at, source: 'manual'|'csv_upload'|'opening'|'daily_auto', uploaded_by, attachment_id?, notes}`
- **Service:** `services/cash_position_service.py` — CRUD, balance update, snapshot history, CSV bulk upload, `compute_position()` (net liquid + AP exposure + 30d burn rate + days_runway + health pill), `project_position(days=30|60|90)` (daily series with AP outflow per due-date + flat burn).
- **Endpoints:** `/api/finance/cash/{accounts, accounts/{id}, accounts/{id}/balance, accounts/{id}/reconcile, accounts/{id}/history, position, position/projection, upload-csv}`
- **Permissions:** `finance.cash.read`, `finance.cash.update` (added to perms_catalog).
- **Demo seed:** 9 demo accounts (BCA Operasional, Mandiri Payroll, 4× petty cash per outlet, OVO/GoPay/DANA e-wallets) totalling Rp 728M.
- **Frontend:**
  - `portals/finance/CashPosition.jsx` — full dashboard with KPI tiles, health banner, by-type breakdown columns, projection chart (30/60/90 toggle).
  - `components/shared/CashPositionWidget.jsx` — compact widget embedded on Executive Home + Owner Cockpit.
  - `components/shared/UpdateBalanceModal.jsx` — manual balance update + create new account.
  - `components/shared/CashCsvUploader.jsx` — CSV upload with template download + per-row preview + error display.
  - History dialog with snapshot timeline.
- **Scheduler:** `cash_daily_snapshot` job registered (23:55 WIB) — auto-snapshots all active accounts.

### 11C — Owner Daily Digest + Owner Role/Portal
- **Telegram Service:** `services/telegram_service.py` — async aiohttp client. Methods: `send_message`, `get_me`, `set_webhook`, `parse_webhook_update`. Gracefully no-ops when `TELEGRAM_BOT_TOKEN` not set.
- **Digest Service:** `services/owner_digest_service.py` — builds payload (yesterday revenue per outlet, MTD revenue, AP due 7d, anomaly count + severity, pending approvals, cash total). Renders Telegram Markdown + in-app summary. Dispatch with per-channel logging to `digest_logs`.
- **Endpoints:** `/api/owner/{cockpit, digest/preview, digest/send-now, digest/subscriptions (CRUD), telegram/info}`, `/api/telegram/webhook` (handles `/start` `/help` `/digest` commands).
- **New Owner Role:** Seed creates `OWNER` role with permissions: executive read, finance read (PL/BS/CF/AP), `finance.cash.read`, AI/Q&A, anomaly read, approval (PR/PO/PAY) approve, owner.* perms.
- **New User:** `owner@torado.id / Torado@2026`, default_portal=owner.
- **Frontend Portal:** `portals/owner/OwnerPortal.jsx` (sub-nav: Cockpit / Cash / Approvals / AI Assistant / Digest Settings), `OwnerCockpit.jsx` (welcome strip, 4 KPIs, embedded cash widget + digest preview + pending approvals widget + anomalies + AI CTA), `DigestSettings.jsx` (Telegram setup walkthrough + subscription CRUD + preview + send now).
- **App routing:** `/owner/*` route lazy-loaded in `App.js`. Portal registry in `lib/portals.js` with Crown icon + perm guard.
- **Scheduler:** `owner_daily_digest` job (06:00 WIB Asia/Jakarta) — iterates over enabled subscribers.
- **Middleware:** `/api/telegram/webhook` excluded from rate limiting (Telegram-driven, not user).

### 11D — Profit Walk + Period Comparison
- **Service:** `services/profit_walk_service.py` — aggregates posted journal lines by COA `type` field (revenue/cogs/expense/asset/liability/equity) within period range. Builds 9-stage waterfall: Revenue → COGS → Other Income → Gross Profit (subtotal) → OPEX → Service Charge → Bonus/Incentive → Tax → Net Profit (total). Each stage has value, compare-period value, delta_pct, kind, running balance.
- **Period helpers:** `_resolve_period()` for `mtd`, `lmtd`, `qtd`, `ytd`, `yoy`, `last_month` (LMTD uses same day-of-month for fair comparison).
- **Top drivers:** Auto-rank top 5 stages by absolute delta vs compare period.
- **Endpoints:** `GET /api/executive/profit-walk?period_kind=mtd&compare_kind=lmtd`, `GET /api/executive/period-compare?metrics=...&period_kinds=...`
- **Frontend:**
  - `portals/executive/ProfitWalk.jsx` — 4 KPI tiles (Revenue, GP, Net, ΔNet), Recharts BarChart waterfall (color by stage kind), full detail table with running balance, top drivers list.
  - `portals/executive/PeriodCompare.jsx` — multi-metric × multi-period matrix with conditional formatting (green/red %), checkbox-driven metric/period selection.
  - Quick links from ExecutiveHome filter bar.

### 11E — AI Q&A Enhancement
- **New Components:**
  - `components/shared/VoiceInputButton.jsx` — Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`), lang `id-ID`, mic permission handling, listening pulse animation, graceful degrade if not supported.
  - `components/shared/KpiSnapshotStrip.jsx` — 5 mini-tiles (Cash with health tone, Rev MTD, AP 7d, Pending Approvals, Anomalies). Auto-refresh every 60s. Reuses `/api/owner/cockpit` for Owner role; `/api/executive/kpis + /api/finance/cash/position` for others.
- **Enhanced `ConversationalQA.jsx`:**
  - Role-aware suggested chips (`SUGGESTIONS_OWNER` vs `SUGGESTIONS_EXEC`)
  - VoiceInputButton inline with input
  - Optional KPI strip at top (`showKpi=true` prop)
  - `scopeLabel` prop for header customization
  - Larger card height (560px) to accommodate strip
  - Auto-send transcript on voice result
- **Backend:** Existing `ai_executive_qa_service.py` already covers tool-calling. No backend changes for 11E.

### 11F — AR/AP One-Click Action + Approval Mobile Polish
- **Backend:** New `POST /api/approvals/quick-action` endpoint — unified dispatch for PR/PO/Stock Adjustment/Employee Advance approve/reject. Body: `{entity_type, entity_id, action, note?, reason?}`. Validates inputs (400 on invalid). Permission enforced by underlying entity service.
- **Frontend MyApprovals (rewritten):**
  - Mobile-first card layout (44pt min touch targets)
  - Swipe gesture (right=approve, left=reject) via framer-motion drag with constraints
  - Inline Approve / Reject / Detail buttons always visible
  - Reject reason modal (required)
  - Optimistic remove on success
  - Mobile-only swipe hint
- **Owner Cockpit:** New `PendingApprovalsWidget` shows top 5 pending items with inline approve/reject buttons → 2-tap workflow from cockpit.

### 11G — Backend Regression Testing
- **Result:** `testing_agent_v3` iteration_17 → 95% pass, **zero critical bugs**, **zero flaky endpoints**.
- **Coverage:** Owner login + cockpit + 403 enforcement, digest CRUD/preview/send, Telegram webhook graceful, Cash accounts + position + projection + CSV upload, Profit Walk + Period Compare, Quick Action validation + execution, **regression on existing executive/finance/procurement/scheduler endpoints**.
- **Telegram:** Verified graceful no-op when `TELEGRAM_BOT_TOKEN` not set (intentional V1 behavior).

## Known Limitations & Backlog

| Item | Status | Note |
|---|---|---|
| Telegram bot token | NOT CONFIGURED | User will set `TELEGRAM_BOT_TOKEN` in `.env` post-deploy and restart backend. Bot setup walkthrough in DigestSettings UI. |
| Email digest (Resend) | DEFERRED | `RESEND_API_KEY` env stub in place. Wire when needed. |
| WhatsApp digest | BACKLOG | Needs Meta Business API + provider (Twilio/Wati). |
| Bank H2H integration | BACKLOG | Cash balance currently manual or CSV. BCA/Mandiri merchant onboarding required. |
| Voice answer (TTS) | BACKLOG | V1: voice → text → text answer. TTS via Web Speech API or ElevenLabs is future work. |
| OPEX in profit walk | EXPECTED EMPTY | Demo journal_entries only have revenue/cogs/asset lines. Real OPEX entries will populate when real expenses are posted. |
| Auth bypass for testing | NONE | All Phase 11 endpoints use real RBAC. Admin (`admin@torado.id / Torado@2026`) has wildcard `*` perm. |

## Files Touched

### Backend (created)
- `services/cache_service.py`
- `services/cash_position_service.py`
- `services/telegram_service.py`
- `services/owner_digest_service.py`
- `services/profit_walk_service.py`
- `routers/cash.py`
- `routers/owner.py`
- `routers/telegram.py`
- `seed/seed_phase11_demo.py`

### Backend (modified)
- `server.py` (router wiring: cash, owner, telegram)
- `core/db.py` (indexes for cash_accounts, cash_balance_snapshots, digest_subscriptions, digest_logs)
- `core/perms_catalog.py` (added finance.cash.*, owner.cockpit.access, owner.digest.manage)
- `core/middleware.py` (rate-limit excludes telegram webhook)
- `services/scheduler_service.py` (registered owner_daily_digest + cash_daily_snapshot jobs)
- `routers/approvals.py` (added /quick-action endpoint)
- `routers/executive.py` (added /profit-walk + /period-compare)
- `seed/seed_demo.py` (Owner role tied to cash perms)

### Frontend (created)
- `portals/owner/OwnerPortal.jsx`
- `portals/owner/OwnerCockpit.jsx`
- `portals/owner/DigestSettings.jsx`
- `portals/OwnerPortal.jsx` (re-export)
- `portals/finance/CashPosition.jsx`
- `portals/executive/ProfitWalk.jsx`
- `portals/executive/PeriodCompare.jsx`
- `components/shared/CashPositionWidget.jsx`
- `components/shared/UpdateBalanceModal.jsx`
- `components/shared/CashCsvUploader.jsx`
- `components/shared/VoiceInputButton.jsx`
- `components/shared/KpiSnapshotStrip.jsx`

### Frontend (modified)
- `App.js` (lazy + /owner route)
- `lib/portals.js` (Owner portal registry entry)
- `lib/queryClient.js` (tuned defaults)
- `portals/executive/ExecutiveHome.jsx` (CashPositionWidget embedded + ProfitWalk/PeriodCompare quick links)
- `portals/executive/ExecutivePortal.jsx` (added profit-walk + period-compare routes)
- `portals/finance/FinancePortal.jsx` (Cash sub-nav + route)
- `components/shared/ConversationalQA.jsx` (voice + KPI strip + role-aware chips)
- `pages/MyApprovals.jsx` (mobile cards + swipe + inline actions)

## How to Test as Owner

1. Login: `owner@torado.id / Torado@2026`
2. Lands on `/owner/cockpit`
3. See: cash position Rp 728M (Healthy), Rev MTD Rp 1.16B, pending approvals widget
4. Click "Kirim Digest Sekarang" → in-app notification created
5. Open `/owner/digest-settings` → Telegram setup walkthrough + subscription CRUD
6. Open `/owner/cash` → full Cash Position dashboard
7. Open `/owner/approvals` → mobile-friendly inbox with swipe gesture + 1-tap approve/reject
8. Open `/owner/ai-assistant` → AI Q&A with voice mic button + KPI strip + 6 owner-friendly chips

## Demo Credentials Recap

| Email | Password | Role |
|---|---|---|
| admin@torado.id | Torado@2026 | Super Admin (wildcard *) |
| owner@torado.id | Torado@2026 | **Owner (Phase 11C)** |
| executive@torado.id | Torado@2026 | Executive |
| finance@torado.id | Torado@2026 | Finance Manager |
