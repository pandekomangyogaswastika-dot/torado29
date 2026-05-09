# Smart Procurement (Phase 2) + Report Builder & Excel Export (Phase 2 Items 2–3) — Plan

## 1) Objectives

### A. Smart Procurement (Market List + Vendor Catalog + FDO + Smart PO)
- Implement **Market List** as **quarterly reference price** (benchmark) used in KDO/BDO/FDO item request UX.
- Implement **Vendor Item Catalog** as **actual vendor price** source, **auto-updated** from **PO creation** and **GR posting**, with **price history**.
- Add **FDO (Floor Daily Order)** module aligned with KDO/BDO flow.
- Ensure **unknown items** created from KDO/BDO/FDO become **Market List pending_review** and require **procurement manager+** approval; items must have **category**.
- Implement **smart PO**: vendor suggestion + **unavailability handling** (redirect / urgent purchase / return to PR pool).
- Provide **Excel export** matching Torado Market List format exactly.
- Add **Price Intelligence Dashboard** (reference vs actual, trends, deviations).

**Status update (May 2026):** Smart Procurement Phase 2 is **complete** and **tested 100%** (Market List, FDO, Vendor Catalog+hooks, Price Intelligence, Smart PO unavailability flow, ItemAutocomplete integration, Excel export). See `/app/test_reports/iteration_10.json`.

### B. Universal Report Catalog + Excel Export (legacy-friendly, configurable)
- Provide a **Universal Report Catalog** covering **Outlet/Sales, Inventory, Procurement, Finance** reporting.
- Provide **Excel export (.xlsx)** that is:
  - **Legacy-friendly** (Excel 2010+ compatible)
  - **Template-driven/configurable** (column selection, headers/footers, number formats, grouping/subtotal rules)
- Provide **advanced filters** (date range + multi-select outlet/brand/vendor/category/status as applicable).
- Reuse existing **Report Builder (lite)** where suitable and extend it with Excel export.

**Status update (May 2026):** Phase 4.1 (Sales & Outlet Reports) is **complete** and **tested** (backend Excel utilities + 3 export endpoints + Reports Portal UI). Ready to proceed to Phase 4.2.

---

## 2) Implementation Steps

### Phase 1 — Core Flow POC (prove end-to-end data lifecycle)
**Core to prove:** *PR (KDO/BDO/FDO) item selection → Market List reference lookup/auto-create → PO → GR → vendor catalog updated + history → compare vs market reference.*

**User stories (POC)**
1. As outlet staff, I can search items with autocomplete and see **quarter reference price** while filling KDO/BDO/FDO.
2. As outlet staff, when I type a new item not found, it is captured as **pending_review** instead of being lost.
3. As procurement manager, I can review pending items, assign **category**, and approve them into the master list.
4. As procurement staff, when I create a PO, the system auto-updates the vendor’s item catalog and tracks price changes.
5. As receiving staff, when I post GR, the **actual unit cost** updates vendor price and writes to price history.

✅ **Status:** Completed (superseded by fully integrated V1 implementation).

---

### Phase 2 — V1 App Development (wire into portals)

✅ **Status:** Completed (implemented + compiled + tested 100% per `/app/test_reports/iteration_10.json`).

---

### Phase 3 — Price Intelligence + Hardening

✅ **Status:** Dashboard implemented and working. Hardening items remain as optional next.

**Hardening (optional next increments)**
- Idempotency/safety:
  - Avoid double history entries on repeated PO/GR posts (detect same vendor_item_id + price + effective_date + source_doc_no).
- Performance:
  - Add DB indexes: `(vendor_id,item_id,unit)`, `(quarter_id,item_id)`.
- Data correctness:
  - Ensure category enforcement on approval and on any procurement-side creation.
  - Validate Market List quarter overlaps and one-active-quarter rule.

---

### Phase 4 — Report Catalog + Excel Export (Legacy-Friendly)

> Scope: Implement universal reporting entry point + Excel export that can be configured, starting with Sales/Outlet operational reports.

#### Phase 4.1 — Sales & Outlet Reports (P0) **✅ COMPLETED & TESTED**
**Goal:** Implement Excel export untuk operational reports paling sering digunakan.

**Delivered Reports**
1. **Daily Sales Summary Report (Excel)**
   - Filters: date range, outlet, brand
   - Columns: date, outlet, brand, grand_total, transaction_count, status
   - Output: `.xlsx` styled report

2. **Outlet Performance Report (Excel)**
   - Filters: date range, outlet selection
   - Columns: outlet, total_sales, days_active, avg_daily_sales, transaction_count
   - Output: `.xlsx` + **bar chart** (Total Sales by Outlet)

3. **FDO History Report (Excel)**
   - Filters: date range, outlet, status
   - Columns: doc_no, request_date, outlet, items_count, status, approved_by, approved_at
   - Output: `.xlsx` with **status color coding**

**Backend (Phase 4.1) — Implemented**
- Added reusable Excel export utilities:
  - `backend/services/excel_export_service.py`
    - workbook creation, branded headers, styles, number formats, freeze panes, autosize columns
    - bar chart helper
- Added 3 Excel export endpoints (auth-gated via `_REPORT_READ_PERMS`):
  - `GET /api/reports/sales/daily-sales.xlsx`
  - `GET /api/reports/outlet/performance.xlsx`
  - `GET /api/reports/outlet/fdo-history.xlsx`
- Added service generators in `backend/services/reports_service.py`:
  - `generate_daily_sales_excel()`
  - `generate_outlet_performance_excel()`
  - `generate_fdo_history_excel()`

**Frontend (Phase 4.1) — Implemented**
- New Reports Portal + pages:
  - `frontend/src/portals/ReportsPortal.jsx`
  - `frontend/src/portals/reports/ReportsCatalog.jsx`
  - `frontend/src/portals/reports/DailySalesReport.jsx`
  - `frontend/src/portals/reports/OutletPerformanceReport.jsx`
  - `frontend/src/portals/reports/FdoHistoryReport.jsx`
- Navigation integration:
  - Added new `reports` portal to `frontend/src/lib/navigationSchema.js`
- Routing integration:
  - Added `/reports/*` route in `frontend/src/App.js`

**Testing (Phase 4.1) — Completed**
- All 3 endpoints verified via `curl` → **HTTP 200** and correct Excel Content-Type.
- Excel downloads produced valid `.xlsx` files.
- Reports Catalog UI verified renders correctly.

#### Phase 4.2 — Inventory Reports (P0) **[NOT STARTED / NEXT]**
- Stock Balance (Excel)
- Stock Movement (Excel)
- Inventory Valuation (Excel)

#### Phase 4.3 — Procurement Reports (P1) **[NOT STARTED]**
- PO Summary (Excel)
- GR Summary (Excel)
- Vendor Performance (Excel) — leverage existing vendor scorecard + Excel formatting

#### Phase 4.4 — Finance Reports (P1) **[NOT STARTED]**
- Journal Ledger (Excel)
- Trial Balance (Excel)
- AP Aging (Excel)

#### Phase 4.5 — Enhanced Universal Builder (P2) **[NOT STARTED]**
- Add Excel export to existing `frontend/src/portals/finance/ReportBuilder.jsx`
- Saved column templates (selectable)
- Scheduling integration (optional) via existing `report_schedules` module

---

## 3) Next Actions (immediate)

### Completed
1. ✅ Smart Procurement Phase 2 is completed & tested.
2. ✅ Phase 4.1 Sales & Outlet Excel exports are completed & tested.

### Next (pick next milestone)
1. Start **Phase 4.2 Inventory Reports (P0)**
   - Decide exact columns/filters per report (stock balance, movement, valuation)
   - Implement endpoints + Excel generator functions using `excel_export_service.py`
   - Add UI pages under Reports Portal
2. Or start **Phase 2 Item 3**: **Custom Profit & Loss format Torado** (P0)
3. Optional hardening:
   - Add minimal automated smoke tests for the new `/api/reports/*xlsx` endpoints
   - Improve Excel branding parity (logo/header blocks) once template is finalized

---

## 4) Success Criteria

### Smart Procurement (already met)
- KDO/BDO/FDO item input always resolves to an item: existing or **auto-created pending_review**.
- Pending items cannot become active without **category_id** and procurement approval.
- Market List reference price is quarter-based and visible in request UIs.
- Vendor catalog is updated automatically from PO/GR and maintains a reliable price history.
- PO unavailability flow supports redirect/urgent/cancel-to-pool without breaking PR/PO/GR states.
- Excel export matches Torado Market List format closely enough to replace the legacy file in day-to-day use.
- Price Intelligence dashboard surfaces meaningful deviations and trends with acceptable performance.

### Report Catalog + Excel Export (updated)
- ✅ Phase 4.1 Sales/Outlet report catalog and Excel exports are stable, styled, and open cleanly in Excel (2010+).
- Next:
  - Inventory/Procurement/Finance exports implemented with consistent template utilities.
  - Filters are correct and reproducible (saved configs optional later).
  - Template config is maintainable (code-first then DB-backed).
  - Add automated smoke tests for critical export endpoints + basic UI download interaction.
