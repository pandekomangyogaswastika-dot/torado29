# Phase 9C — Inventory + Outlet Polish + Real Email · RESULT

**Date:** 28 April 2026
**Scope:** Inventory polish (Stock Matrix, Low Stock Alert + Quick PR), Outlet polish (Daily Sales 5-step Wizard with autosave), Procurement polish (Last Vendor/Price hint in ItemAutocomplete), Real PO Email via Resend.

---

## ✅ Delivered Features

### 1. Real PO Email via Resend (replaces Phase 9B mock)
- **Library:** `resend==2.29.0`
- **Service:** `services/email_service.py` — `send_email(to, subject, html, text, attachments, ...)` async wrapper around the sync Resend SDK (`asyncio.to_thread`)
- **Endpoint:** `POST /api/procurement/pos/{id}/email` now sends real email with the PO PDF attached (base64 via Resend).
- **Env:** `RESEND_API_KEY`, `EMAIL_FROM` (default `onboarding@resend.dev`), `EMAIL_FROM_NAME` (default `Aurora F&B Procurement`).
- **Graceful fallback:** when `RESEND_API_KEY` is missing, the endpoint falls back to a `mocked` log entry — UI still works.
- **Audit:** PO `email_log[]` now persists `status`, `provider`, `provider_message_id`, `pdf_attached`, `error`. PODetail UI displays each entry with colored status pills.
- **POC verified:** `python -m tests.poc_resend_email` returned `status=sent`, `provider_message_id=sprint-i-l-build`.

### 2. ItemAutocomplete — Last Vendor / Price Hint
- **Backend:** `GET /api/ai/items/suggest` now returns `last_vendor_id`, `last_vendor_name`, `last_unit_cost`, `last_purchase_date`, `last_purchase_days_ago` per item via aggregation on `goods_receipts.lines`.
- **Outlet scoping:** new optional `?outlet_id=` query so KDO/BDO requests scope hint to their own outlet.
- **Frontend:** `components/shared/ItemAutocomplete.jsx` now shows an emerald-colored hint row: `Terakhir: Toko Sumber · Rp 25.000/kg · 3 hari lalu`.
- **Used across:** PR Form, KDO/BDO requests, Urgent Purchase, Daily Sales item suggestions.

### 3. Stock Balance Matrix
- **Backend service:** `services/inventory_matrix_service.py` — pivot of stock balance per item × outlet via `inventory_movements` aggregation.
- **Endpoint:** `GET /api/inventory/balance-matrix?outlet_ids=&category_id=&search=&include_zero=&days_for_par=&par_buffer_days=`
- **Drilldown:** `GET /api/inventory/movements/cell?item_id=&outlet_id=&limit=` returns the last N movements for a single cell.
- **Par resolution priority:** explicit-per-outlet → explicit-default → computed (avg-daily-outflow × buffer_days) → none.
- **Frontend:** new `StockBalanceMatrix.jsx`. Heatmap colors:
  - 🟥 red: below par or negative qty
  - 🟧 amber: qty = 0
  - 🟩 green: qty ≥ par × 1.5
  - 🟢 light green: at or above par
  - ⬜ gray: no par data
- **Cell click → modal** with last 30 movements.
- **Toggle:** `/inventory/balance` now has List ↔ Matrix tabs (preference stored in localStorage).

### 4. Low Stock Alert + Quick PR
- **Endpoint:** `GET /api/inventory/low-stock?outlet_ids=&include_zero=&include_negative=&days_for_par=&par_buffer_days=&limit=` returns items below par with vendor/cost/date hint and a `suggested_reorder` qty.
- **Frontend page:** `/inventory/low-stock` (`LowStockAlert.jsx`)
  - Summary tiles: Total below par · Critical · Low · Selected
  - Filters: outlet, severity, search
  - Sortable by severity / item / outlet / qty / deficit
  - **Bulk select → "Buat PR"** button: passes a base64-encoded prefill payload to `/procurement/pr/new?prefill=...`
- **Inventory Home widget:** top-8 below-par items + CTA to the page.
- **PRForm prefill support:** `useSearchParams("prefill")` decodes and pre-populates `outlet_id`, `lines[]` (with item_id/name/qty/unit/cost), and notes. A green banner confirms prefill source + line count.
- **Permission gating:** "Buat PR" disabled if user lacks `procurement.pr.create`.

### 5. Daily Sales 5-step Wizard + Autosave
- **Refactored:** `portals/outlet/DailySalesForm.jsx` from a single long form into a 5-step stepper.
- **Steps:** 1) Channel · 2) Revenue · 3) Service & Tax · 4) Payment · 5) Review.
- **Each step validates locally** (e.g. Step 1 requires gross > 0; Step 2 requires net channel ≈ revenue bucket; Step 4 requires balanced payment).
- **Stepper UI:** clickable pills with check-mark on completed steps, disabled forward jump if next step's gating fails.
- **Autosave:** debounced 5s after any field change → `/api/outlet/daily-sales/draft` (existing endpoint). Status badge: `Menyimpan… → Tersimpan` (or red on error).
- **Review step:** reconciliation card with 4 checks:
  - Net channel terisi
  - Net channel ≈ revenue bucket
  - Minimal 1 metode pembayaran
  - Total pembayaran = grand total (with delta)
- **All existing data-testids preserved**, plus new ones: `ds-stepper`, `ds-step-{key}-pill`, `ds-step-prev`, `ds-step-next`, `ds-step-submit`, `ds-autosave-badge`, `ds-review-checks`.

### 6. Demo Seed Backfill (`seed_phase9c_demo`)
- Sets `par_levels` per-outlet on items (90–120% jitter around a deterministic baseline)
- Backfills `inventory_movements` from posted GRs (receipt = positive qty)
- Generates ~30-day consumption movements (~70% of days, randomized) so the matrix and low-stock features render meaningfully on demo data
- Idempotent (clears prior `source_type="seed_9c"` rows)
- Run: `cd /app/backend && python -m seed.seed_phase9c_demo`

---

## 📁 Files Added
- `backend/services/email_service.py`
- `backend/services/inventory_matrix_service.py`
- `backend/seed/seed_phase9c_demo.py`
- `backend/tests/poc_resend_email.py`
- `frontend/src/portals/inventory/StockBalanceMatrix.jsx`
- `frontend/src/portals/inventory/LowStockAlert.jsx`

## ✏️ Files Modified
- `backend/.env` — added RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME
- `backend/requirements.txt` — added `resend==2.29.0`
- `backend/routers/procurement.py` — wired `email_po` to real Resend send + PDF
- `backend/routers/ai.py` — added `outlet_id` query param to items/suggest
- `backend/routers/inventory.py` — added `/balance-matrix`, `/movements/cell`, `/low-stock`
- `backend/services/ai_service.py` — last vendor/cost/date aggregation
- `frontend/src/components/shared/ItemAutocomplete.jsx` — vendor hint UI + outletId prop
- `frontend/src/portals/inventory/InventoryPortal.jsx` — Low Stock route + sub-nav
- `frontend/src/portals/inventory/InventoryHome.jsx` — Low Stock widget + KPI tile
- `frontend/src/portals/inventory/StockBalance.jsx` — List/Matrix toggle
- `frontend/src/portals/outlet/DailySalesForm.jsx` — wizard refactor + autosave
- `frontend/src/portals/procurement/PRForm.jsx` — prefill from URL
- `frontend/src/portals/procurement/PODetail.jsx` — email log status pills + dialog copy update

---

## 🧪 User Stories Covered
- **IN-US-1:** Pivot view of all items × outlets with at-a-glance heatmap → Stock Matrix ✅
- **IN-US-2:** Spot inventory imbalances across outlets → heatmap colors ✅
- **IN-US-3:** Low-stock alerts → /inventory/low-stock + Inventory Home widget ✅
- **PR-US-1:** Bulk-create PR from low-stock items → "Buat PR (X)" button → PR Form prefill ✅
- **PR-US-2:** Last vendor/price hint when adding PR line item → ItemAutocomplete green row ✅
- **OU-US-1a:** Step-by-step daily sales entry → 5-step wizard ✅
- **OU-US-1b:** Auto-save progress → 5s debounced autosave with status badge ✅
- **OU-US-1c:** Final reconciliation step highlights mismatches → Review step with 4 colored checks ✅
- **PO-US-1:** Real email PO to vendor (replacing mock) → Resend + PDF attached ✅

---

## 🔐 Permissions Used
- `procurement.po.send` — for email_po
- `inventory.balance.read` — for matrix + low-stock
- `inventory.movement.read` — for movements/cell drilldown
- `procurement.pr.create` — gates "Buat PR" button on Low Stock page
- `ai.autocomplete.use` — for items/suggest

---

## 📊 Demo Data Stats (after `seed_phase9c_demo`)
- 2,448 inventory_movements (receipt + 30-day consumption simulation)
- 13 items × 4 outlets = 52 cells
- ~43 cells below par at any given time
- 45 POs, 38 GRs, 240 daily_sales records (preserved from prior seeds)

---

## 🧰 NOTES & Caveats
- **Resend sandbox:** `onboarding@resend.dev` only delivers to the email address that owns the Resend account, OR to `delivered@resend.dev` (test address). To send to real vendor emails, verify a domain in the Resend dashboard and override `EMAIL_FROM` env var.
- **Inventory movements seeding:** Phase 9C demo seed creates synthetic consumption to make the demo realistic. In production, real consumption movements come from BOM-driven daily sales validation (Phase 8B) or transfers/issues.
- **Multi-outlet PR creation:** When the user selects items from multiple outlets in Low Stock and clicks "Buat PR", we currently group by the first outlet (with a toast warning). Splitting into multiple PRs automatically is a Phase 9D enhancement.

---

## ✅ Quality Gates
- Backend: `ruff` clean
- Frontend: `eslint` clean for new files
- Manual smoke: matrix renders, low-stock renders, wizard steps work, autosave triggers, Resend POC succeeds
- testing_agent_v3: ✅ **100% pass (8/8 Phase 9C tests + supporting tests)** — see iteration_2 (May 4, 2026)
  - Stock Balance Matrix: 13 items × 4 outlets, par_levels working
  - Low Stock Alert: vendor hints (last_vendor_id/name/cost/date) + suggested_reorder
  - Item Autocomplete: outlet-scoped vendor hints
  - PO Email: graceful fallback to `status='mocked'` when RESEND_API_KEY absent (NO 500)
- **Visual smoke (May 4, 2026):** Stock Matrix heatmap, Low Stock Alert KPI tiles + filters, Daily Sales 5-step wizard all render correctly via `/inventory/balance` (Matrix toggle), `/inventory/low-stock`, `/outlet/daily-sales/new`.
