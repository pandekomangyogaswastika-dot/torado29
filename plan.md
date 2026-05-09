# Smart Procurement + Market List Integration — Plan (POC → V1 → Hardening)

## 1) Objectives
- Implement **Market List** as **quarterly reference price** (benchmark) used in KDO/BDO/FDO item request UX.
- Implement **Vendor Item Catalog** as **actual vendor price** source, **auto-updated** from **PO creation** and **GR posting**, with **price history**.
- Add **FDO (Floor Daily Order)** module aligned with KDO/BDO flow.
- Ensure **unknown items** created from KDO/BDO/FDO become **Market List pending_review** and require **procurement manager+** approval; items must have **category**.
- Implement **smart PO**: vendor suggestion + **unavailability handling** (redirect / urgent purchase / return to PR pool).
- Provide **Excel export** matching Torado Market List format exactly.
- Add **Price Intelligence Dashboard** (reference vs actual, trends, deviations).

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

**POC steps**
- Data model POC (backend only):
  - Create collections + minimal schemas:
    - `market_list_quarters` (active quarter)
    - `market_list_prices` (item_id + quarter_id + unit + ref_price)
    - `vendor_items` (vendor_id + item_id + unit + current_price + availability)
    - `vendor_item_price_history` (vendor_id + item_id + unit + old/new + source)
  - Extend `items` with: `ml_status` (active|pending_review), `created_from` (manual|kdo|bdo|fdo), `brand_availability` (optional), enforce **category required on approve**.
- POC services + hooks:
  - Market List: `get_active_quarter()`, `get_ref_price(item_id, quarter)`, `set_ref_price()`.
  - Vendor Catalog: `upsert_vendor_item_from_po()`, `upsert_vendor_item_from_gr()` with history write.
  - Add hooks in:
    - `procurement_service.create_po` (after insert) → update `vendor_items` (source=`po`)
    - `procurement_service.post_gr` (after GR insert) → update `vendor_items` (source=`gr`)
- POC endpoints (minimal):
  - `POST /api/market-list/items/resolve` → given text/name+unit return `{item}` or create pending item.
  - `GET /api/market-list/reference` → item_id(s) → reference price for active quarter.
  - `GET /api/vendors/{id}/catalog` → vendor_items + last_price.
- POC script (isolated, python) to validate:
  - Create quarter → resolve new item from KDO → approve w/ category → set ref price → create PO → post GR → verify vendor_items updated + history.
- Fix until POC is stable (no overlaps, correct updates, idempotent-ish updates).

**Checkpoint:** proceed only if POC script passes reliably.

---

### Phase 2 — V1 App Development (wire into portals)

**User stories (V1)**
1. As outlet staff, I can create **FDO** requests identical to KDO/BDO with autocomplete + reference price.
2. As procurement staff, when creating PO I see **suggested vendors** per item based on vendor catalog price.
3. As procurement staff, if a vendor can’t supply an item, I can choose: **redirect**, **urgent purchase**, or **return to PR pool**.
4. As procurement manager, I can manage quarterly Market List prices and **export Excel** identical to legacy.
5. As procurement manager, I can view **vendor vs market** comparisons and price trend signals.

**Backend (V1)**
- Replace/extend existing `item_pricing` usage:
  - Keep it for compatibility if used elsewhere, but implement the new quarterly market list model as the **source of reference**.
- Implement routers/services:
  - `market_list_router`: quarter CRUD (minimal), reference price CRUD, pending items approval.
  - `vendor_catalog_router`: list vendor items, price history.
  - `fdo_router`: mirror kdo/bdo endpoints using `kdo_bdo_service.create(...kind='fdo')`.
- Implement approval gate:
  - New permission: `procurement.market_list.approve` required to approve pending items.
  - Validation: approved item must have `category_id`.

**Frontend (V1)**
- FDO pages:
  - Add `FdoPage.jsx` + list entry in Outlet Portal navigation.
  - Reuse KDO/BDO form, change source to `fdo`.
- Market List UI (Inventory/Procurement):
  - Market List table for active quarter: item, category, ref price, variance vs prev quarter.
  - Pending Review queue: approve + set category + set reference price.
- PO Form enhancements:
  - Use existing `ItemAutocomplete.jsx` and extend to show reference price + best vendor price.
  - Vendor suggestion panel (per item) from `vendor_items`.
  - Add unavailability action UI on PO line:
    - Redirect to alt vendor (split PO)
    - Create urgent purchase draft
    - Return line back to PR pool (status marker)
- Vendor detail enhancements:
  - Tab: vendor catalog list + price history + compare vs market ref.

**Excel export (V1)**
- Backend endpoint: `GET /api/market-list/export.xlsx?year=YYYY` generating the **exact Torado template**:
  - Columns per quarter (Q1/Q2/Q3/Q4) + item attributes + flags.
  - Ensure formatting: column order, headers, number formats, empty cell rules.

**End of Phase 2:** run one E2E test pass (seed → create FDO → create PO → post GR → check vendor catalog + export).

---

### Phase 3 — Price Intelligence + Hardening

**User stories (Phase 3)**
1. As procurement manager, I can see a dashboard of items where vendor price deviates most from market reference.
2. As procurement manager, I can see price trend history per vendor-item.
3. As procurement staff, I get a clear warning when selecting a vendor priced above reference.
4. As procurement manager, I can identify items with **single-source vendor risk**.
5. As finance/procurement, I can audit why vendor price changed (PO/GR/manual) via history logs.

**Dashboard**
- Build `PriceIntelligenceDashboard`:
  - Top deviations (actual vs reference), trend sparkline, last change source.
  - Filters: quarter, category, vendor, outlet/brand (optional).

**Hardening**
- Idempotency/safety:
  - Avoid double history entries on repeated POSTs (e.g., detect same price+date+source).
- Performance:
  - Add indexes: (vendor_id,item_id,unit), (quarter_id,item_id).
- Data correctness:
  - Ensure category enforcement on approval and on any procurement-side creation.

**End of Phase 3:** E2E regression test + export validation vs known Excel sample.

---

## 3) Next Actions (immediate)
1. Confirm the **legacy Market List Excel template** specifics (upload sample or confirm exact header + quarter columns naming) for byte-for-byte export parity.
2. Implement Phase 1 POC backend models + services + python POC script.
3. Add hooks to `create_po` and `post_gr` to update vendor catalog + history.
4. Demo POC results (API responses + DB docs) and get approval to proceed to V1 UI wiring.

---

## 4) Success Criteria
- KDO/BDO/FDO item input always resolves to an item: existing or **auto-created pending_review**.
- Pending items cannot become active without **category_id** and procurement approval.
- Market List reference price is quarter-based and visible in request UIs.
- Vendor catalog is updated automatically from PO/GR and maintains a reliable price history.
- PO unavailability flow supports redirect/urgent/cancel-to-pool without breaking PR/PO/GR states.
- Excel export matches Torado Market List format closely enough to replace the legacy file in day-to-day use.
- Price Intelligence dashboard surfaces meaningful deviations and trends with acceptable performance.
