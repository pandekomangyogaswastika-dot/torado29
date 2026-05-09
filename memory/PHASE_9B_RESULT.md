# Phase 9B — Procurement Polish (Result)

**Status:** ✅ Complete  
**Date:** 28 April 2026  
**Source priority:** MODULE_ENHANCEMENT_PLAN.md §1.3 + Priority Matrix items #17, #21, #22  
**Test report:** `/app/test_reports/iteration_12.json` — Backend 100% (17/17), Frontend 95%

---

## Goals

Cover the highest-value Procurement Portal gaps identified in the audit:

1. **Procurement Kanban Workboard** (#21) — drag-and-drop status tracking across PR + PO pipeline
2. **Vendor Comparison panel** (#17) — side-by-side vendor pricing for multi-item PO building
3. **Vendor Performance Scorecard** (#18 stretch) — lead time, on-time%, defect rate, price stability
4. **PO PDF generation** (#22) — print-ready Indonesian PO PDF
5. **PO Email send** (#22) — mocked email simulation with audit + log

---

## What Was Built

### Backend — `/api/procurement/*`

| Endpoint | Purpose |
|---|---|
| `GET /procurement/vendor-comparison?item_ids=&days=&top_vendors_per_item=` *(new)* | Per-item vendor matrix from posted GRs with last/avg/min/max + history + score + spread% |
| `GET /procurement/vendors/{id}/scorecard?days=` *(new)* | Vendor performance: lead time, on-time%, defect rate, price stability |
| `GET /procurement/workboard?outlet_id=&vendor_id=&days=` *(new)* | Kanban data: 7 columns + cards + counts (combined PR + PO) |
| `GET /procurement/workboard/transitions` *(new)* | Allowed drag-drop transitions with API path templates |
| `GET /procurement/pos/{id}/pdf` *(new)* | Binary PDF (reportlab) with header, vendor info, line items, totals, terms, signatures |
| `POST /procurement/pos/{id}/email` *(new — MOCKED)* | Records email_log + audit + in-app notification (no SMTP) |

**New service files (3):**
- `services/vendor_comparison_service.py` — single-pass GR aggregation, 6 vendors per item ranking
- `services/procurement_workboard_service.py` — PR/PO column mapping + ALLOWED_TRANSITIONS catalog
- `services/po_pdf_service.py` — pure Python reportlab PDF builder (Indonesian format, A4)

**Logical Kanban columns (7):**
1. PR Draft (muted)
2. PR Pending Approval (amber)
3. PR Approved (blue)
4. PO Draft / Approval (indigo)
5. PO Sent (violet)
6. PO Partial (orange)
7. PO Received (green)

**Drag-drop transitions (8):**
- PR submit → approved (procurement.pr.approve)
- PO draft → submit-for-approval (procurement.po.create)
- PO awaiting → approved (procurement.po.approve)
- PO approved → sent (procurement.po.send)
- PO draft → sent direct (procurement.po.send, no workflow)
- PO sent → received (procurement.gr.post — opens GR form)
- PO partial → receive more (procurement.gr.post — opens GR form)
- PR submit (placeholder)

### Frontend

**New routes** (`portals/procurement/ProcurementPortal.jsx` updated):
- `/procurement/kanban` → KanbanWorkboard
- `/procurement/vendor-comparison` → VendorComparison

**New shared component:**
- `components/shared/VendorComparisonPanel.jsx` — used in 2 places:
  - POForm (right-rail, compact mode, with `onSelectVendor` callback to apply price)
  - VendorComparison standalone page (full mode)

**New pages:**
- `portals/procurement/KanbanWorkboard.jsx`:
  - 7 column drag-drop board (`@dnd-kit/core` PointerSensor distance=5px)
  - Color-coded columns + count pills
  - Cards show type icon, doc_no, vendor, outlet, date, status pill, line count, total
  - Drag overlay with enlarged card
  - Filters: outlet, vendor, days (30/60/90/180)
  - Refresh button + last-updated indicator
  - Permission-aware drops (rejects with toast if no perm)
  - Redirect drops (e.g. receive → opens GR form in same tab)
- `portals/procurement/VendorComparison.jsx`:
  - Item search & multi-select (max 10)
  - Period selector (30/90/180/365 days)
  - VendorComparisonPanel below
  - On-vendor-click → loads ScorecardGrid (4 colored tiles + footer stats)

**Updated pages:**
- `portals/procurement/POForm.jsx` — restructured to xl:grid-cols-3 (2/3 main + 1/3 vendor panel sticky on xl)
- `portals/procurement/PODetail.jsx` — added Download PDF + Email PO buttons + Email Log section
- `portals/procurement/ProcurementPortal.jsx` — added 2 sub-nav pills (Workboard, Compare Vendor)
- `portals/procurement/ProcurementHome.jsx` — added 2 quick action buttons

### Polish details

- ✅ `data-testid` on all interactive elements (wb-board, wb-col-{key}, wb-card-{id}, wb-filter-*, wb-refresh, vc-search, vc-search-item-{id}, vc-clear, vc-row-{vid}, vc-history-{vid}, vc-select-{vid}, vc-scorecard, qa-kanban, qa-vc, po-download-pdf, po-email, po-email-{to,subject,message,send}, po-email-log)
- ✅ Permission gating throughout (procurement.vendor.read, procurement.po.send, etc.)
- ✅ Empty + loading + error states for all new components
- ✅ Mobile responsive (Kanban: grid-cols-1 sm:grid-cols-2 lg:grid-cols-7)
- ✅ Reset / clear buttons on filter chips
- ✅ Best-vendor "Termurah" badge with Crown icon + emerald background
- ✅ Cache: PDF generation streams blob with proper Content-Disposition

---

## Test Results (testing_agent_v3, iteration_12.json)

| Layer | Result | Details |
|---|---|---|
| Backend | **100% (17/17)** | All endpoints return correct data + structure. Permission gating works. PDF returns valid binary. Email mock records log + audit. |
| Frontend | **95%** | All Phase 9B core features verified. Minor: testing agent session auto-expires between test scenarios (24h JWT is correct). |

**Backend tests passed:**
- Procurement user login + permission gating
- Vendor comparison: structure + data validation (ranked by price asc + score)
- Vendor scorecard: lead time / on-time / defect / price stability
- Workboard: 7 columns + cards + counts + outlet scoping
- Workboard transitions: 8 allowed moves
- PO PDF: valid binary application/pdf with correct Content-Disposition
- PO email mock: log + structure + 401/403 gating

**Frontend tests passed:**
- Kanban: 7 columns rendered, 45 cards in po_received column, filters, refresh
- Vendor Comparison: search "Beras" → 1 result, panel renders, Termurah badge + Crown
- History toggle showing last 3 purchases
- Pilih → scorecard with 4 colored tiles + footer stats
- POForm right-rail vendor comparison panel
- PODetail header has both PDF + Email buttons
- Sub-nav pills present (Workboard, Compare Vendor)
- Quick action buttons on Procurement Home

**No critical issues. No UI bugs. No design issues.**

---

## Files Changed

**Backend (4):**
- `services/vendor_comparison_service.py` *(new — ~210 lines)*
- `services/procurement_workboard_service.py` *(new — ~155 lines)*
- `services/po_pdf_service.py` *(new — ~265 lines)*
- `routers/procurement.py` *(extended with 6 new endpoints)*

**Frontend (8):**
- `portals/procurement/KanbanWorkboard.jsx` *(new — ~340 lines)*
- `portals/procurement/VendorComparison.jsx` *(new — ~250 lines)*
- `portals/procurement/ProcurementPortal.jsx` *(updated — added 2 routes + 2 nav pills)*
- `portals/procurement/ProcurementHome.jsx` *(updated — added 2 quick actions)*
- `portals/procurement/POForm.jsx` *(updated — 2-column layout + vendor panel)*
- `portals/procurement/PODetail.jsx` *(updated — PDF + Email buttons + Email Log)*
- `components/shared/VendorComparisonPanel.jsx` *(new — ~280 lines)*
- *(no new ui primitives; reused shadcn Dialog/Button/Input/Textarea/Label)*

**Dependencies:**
- Backend: added `reportlab==4.4.10` (pure Python PDF, no system deps)
- Frontend: added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Lint:** All clean (ruff + eslint).

---

## Out of Scope (intentional)

- **Actual SMTP email** — Email send is MOCKED (records log + audit + in-app notification). When a real SMTP integration is desired, swap the mock branch in `routers/procurement.py @router.post("/pos/{id}/email")` for a real SMTP call.
- **3-Way Match Dashboard** — separately tracked; not in 9B scope (Phase 9C candidate)
- **AI Vendor Recommendation** — separately tracked (Phase 9D candidate)
- **PO PDF custom logo upload** — would require additional file_upload + master setting

---

## Next Suggested Phases

| Phase | Items | Effort |
|---|---|---|
| **9C Inventory + Outlet** | Stock Balance Matrix (#19), Low Stock Alert + Quick PR (#20), Last Vendor/Price hint in ItemAutocomplete (#14), Daily Sales 5-step Wizard (#26) | ~4d |
| **9D AI Polish** | AI Categorize in Manual JE + Urgent (#23), LLM Tool-Calling Executive Q&A (#25) | ~2.5d |
| **3 Hardening** | RBAC tightening, audit log coverage, perf indexes, full regression on 8A/8B/8C/9A/9B | ~3d |
