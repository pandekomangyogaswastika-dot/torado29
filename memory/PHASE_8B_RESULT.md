# Phase 8B Result — Outlet Ops Completion (P0 Backfill)

**Status:** ✅ COMPLETE
**Date:** April 28, 2026
**Duration:** Single session

---

## Scope Delivered

### 1. File Upload Service (Foundation)

**Backend:**
- `services/upload_service.py` — disk persistence + metadata
  - `save_upload(...)` — validates size/type, computes SHA-256, writes to disk
  - `get_attachment(file_id)` — fetches metadata
  - `get_attachment_path(file_id)` — fetches disk path
  - `list_attachments(...)` — by source_type/source_id/category
  - `link_attachment(...)` — link an existing upload to a source record
  - `delete_attachment(...)` — soft-delete; only uploader or super
- `routers/uploads.py` — REST endpoints under `/api/uploads`
  - `POST /api/uploads` (multipart): file + category + optional source_type/source_id/description → returns full attachment doc
  - `GET /api/uploads/{file_id}` → streams file with proper Content-Type
  - `GET /api/uploads/{file_id}/meta` → JSON metadata
  - `GET /api/uploads/list` → filtered list
  - `POST /api/uploads/{file_id}/link` → attach to source
  - `DELETE /api/uploads/{file_id}` → soft-delete
- Storage: `/app/uploads/{category}/{yyyy-mm}/{uuid}.{ext}`
- Validation: max 10MB; allowed mime: jpg/png/webp/heic/gif/pdf/csv/xlsx/txt
- Categories: `receipt`, `deposit_slip`, `invoice`, `bank_statement`, `po_attachment`, `gr_attachment`, `opname_evidence`, `general`
- New collection: `attachments` with id (unique), (source_type,source_id), (category,created_at), (uploaded_by,created_at) indexes

**Frontend:**
- `components/shared/FileDropZone.jsx` — generic, reusable
  - Drag/drop + browse + camera capture (mobile)
  - Live progress bar via axios `onUploadProgress`
  - Type & size validation client-side
  - On success: renders chip with thumbnail (image) or icon (doc) + remove (X)
  - Props: `category`, `accept`, `maxSizeMB`, `sourceType`, `sourceId`, `onUploaded`, `onCleared`, `value`, `compact`, `label`, `description`, `testId`, `showCamera`
  - Used by Daily Close (deposit slip) and ready for OCR/Receipt flows in Phase 8C

### 2. KDO / BDO (Kitchen / Bar Daily Order)

**Backend:**
- `services/kdo_bdo_service.py` — thin wrapper over `procurement_service.create_pr`
  - `list_kdo_bdo(...)` — filtered to `source ∈ {kdo, bdo}` + outlet scope
  - `create(...)` — enforces `source = kdo|bdo`, scope guard
  - `favorites(outlet_id, kind, limit)` — frequency-ranked items from last 30 days
- `routers/kdo_bdo.py` — endpoints under `/api/outlet`
  - `GET/POST /api/outlet/kdo`, `GET /api/outlet/kdo/favorites`
  - `GET/POST /api/outlet/bdo`, `GET /api/outlet/bdo/favorites`
- New compound index: `purchase_requests(source, outlet_id, request_date)`
- Permissions reused from catalog: `outlet.kdo.create`, `outlet.bdo.create`

**Frontend:**
- `portals/outlet/KdoBdoList.jsx` — single component parameterized by `kind`
  - Header card with kind-specific accent color (orange for KDO, purple/pink for BDO)
  - Filters: outlet, status
  - List with DataList (card on mobile, table on desktop)
  - Form dialog: outlet + date + needed_by + line items (ItemAutocomplete) + notes
  - **Favorites strip** — chips of frequently-ordered items, one-tap add
  - Save Draft / Submit buttons
- `portals/outlet/KdoPage.jsx`, `BdoPage.jsx` — thin wrappers

### 3. Daily Close (End-of-Day Checklist)

**Backend:**
- `services/daily_close_service.py` — checklist evaluation + record persistence + notifications
  - 4-item checklist:
    1. **Daily Sales tervalidasi** — `status=validated` required
    2. **Petty Cash beres** — no draft txns + balance ≥ 0
    3. **KDO/BDO sudah disubmit** — no draft KDO/BDO PRs (zero is OK)
    4. **Slip setoran bank terlampir** — attachment exists
  - `get_status(outlet_id, date, ...)` — idempotent computation
  - `submit(...)` — validates all checks pass → creates record, links attachment, audits, notifies finance
  - `list_records(...)`, `get_record(id)`
  - `reopen(id, reason, user)` — super admin only
- `routers/daily_close.py` — endpoints under `/api/outlet/daily-close`
- New collection: `daily_close_records` with indexes (id unique, outlet_id+close_date, close_date)
- Notification dispatch to all users with `finance.sales.validate` perm via `notification_service.push`
- Permission used: `outlet.daily_close.execute`

**Frontend:**
- `portals/outlet/DailyClose.jsx`
  - Header with outlet selector + date picker + Refresh
  - Status banner — color-coded (emerald = ready/closed, amber = incomplete)
  - Checklist with per-item:
    - Icon + title + ok/not-ok visual + label (descriptive subtitle)
    - Deep links: "Buat Daily Sales", "Buka Petty Cash", "KDO", "BDO" for fast remediation
  - **FileDropZone** for deposit slip
  - Notes textarea
  - Submit button (disabled until all-OK + slip uploaded)
  - **History table** — past closed records with View Slip links

### 4. OutletPortal & OutletHome wiring

- `portals/outlet/OutletPortal.jsx` — added 3 routes (`/outlet/kdo`, `/outlet/bdo`, `/outlet/daily-close`) + sub-nav tabs
- `portals/outlet/OutletHome.jsx` — added 3 Quick Action tiles (KDO Baru, BDO Baru, Daily Close)

---

## Technical Notes

- All services follow existing patterns: `ok_envelope`, soft-delete (`deleted_at`), `audit_log` on writes, `serialize` for Mongo→JSON.
- All frontend pages follow Phase 7E polish conventions: `glass-card`, `data-testid`, `StatusPill`, `DataList`, `LoadingState`, `EmptyState`, `touch-target` (≥44×44 px), responsive grid.
- File storage on local disk (per PRD Phase 1 plan). Easily portable to S3 / GCS by swapping `save_upload()` body.
- Idempotency: re-submitting daily-close for the same (outlet, date) returns ConflictError (409).
- Server.py: registered `uploads`, `daily_close`, `kdo_bdo` routers.
- DB indexes: `attachments(id unique, source linkage, category+date, uploader+date)`, `daily_close_records(id, outlet+date, date)`, `purchase_requests(source+outlet+date)`.

---

## Testing Results

### Lint
- ruff (Python): all 6 new backend files clean
- eslint (JS): all 5 new frontend files clean

### Manual smoke (curl)
- Login as `alt.manager@torado.id` → token issued
- POST /api/uploads (image/jpeg) → 200 with attachment doc + file persisted at `/app/uploads/deposit_slip/2026-04/{uuid}.jpg`
- GET /api/outlet/daily-close/status → 4-item checklist with proper ok flags
- GET /api/outlet/kdo, GET /api/outlet/kdo/favorites → empty list (expected)

### testing_agent_v3 (iteration_9)
- **Backend: 89.7% (26/29 passed)**
- **Frontend: 85% (core features all working)**
- All Phase 8B endpoints verified working: uploads (5/5), KDO (4/4), BDO (3/3), Daily Close status, file validation
- Frontend: KDO/BDO/Daily Close pages render correctly, FileDropZone works, navigation tabs all present, Indonesian text correct
- 3 reported "regression failures" were false positives — wrong endpoint paths used by tester:
  - `/api/outlet/daily-sales` (POST) → correct path is `/api/outlet/daily-sales/draft`
  - `/api/procurement/urgent-purchase` → correct path is `/api/outlet/urgent-purchases` (plural)
  - `/api/procurement/dashboard` → does not exist (use `/api/procurement/prs`, `/pos`, `/grs`)
- 1 reported "tile not found" (`qa-bdo`, `qa-dc`) on OutletHome — manually verified via Playwright `query_selector` that all 3 new test IDs exist and tiles render correctly. Likely test-side scroll/timing.

### Manual screenshot verification
- `/outlet` (Workbench) ✅ shows all 8 sub-nav tabs (Workbench, Daily Sales, Petty Cash, KDO, BDO, Urgent Purchase, Daily Close, Opname) and 7 Quick Action tiles
- `/outlet/kdo` ✅ orange-accented header, KDO Baru button, empty state
- `/outlet/bdo` ✅ purple/pink-accented header, BDO Baru button, empty state
- `/outlet/daily-close` ✅ outlet+date selector, 2/4 checklist OK banner (PC + KDO/BDO ok; sales + slip pending), file dropzone, submit button (correctly disabled)

---

## Files Created (11)

**Backend (6 new):**
- `/app/backend/services/upload_service.py`
- `/app/backend/routers/uploads.py`
- `/app/backend/services/daily_close_service.py`
- `/app/backend/routers/daily_close.py`
- `/app/backend/services/kdo_bdo_service.py`
- `/app/backend/routers/kdo_bdo.py`

**Frontend (5 new):**
- `/app/frontend/src/components/shared/FileDropZone.jsx`
- `/app/frontend/src/portals/outlet/KdoBdoList.jsx`
- `/app/frontend/src/portals/outlet/KdoPage.jsx`
- `/app/frontend/src/portals/outlet/BdoPage.jsx`
- `/app/frontend/src/portals/outlet/DailyClose.jsx`

**Modified (4):**
- `/app/backend/server.py` — registered `uploads`, `daily_close`, `kdo_bdo` routers
- `/app/backend/core/db.py` — Phase 8B indexes
- `/app/frontend/src/portals/outlet/OutletPortal.jsx` — sub-nav + 3 new routes
- `/app/frontend/src/portals/outlet/OutletHome.jsx` — 3 new Quick Action tiles + icons

---

## User Stories Covered

- ✅ **OU-US-1** — outlet manager submits Daily Sales (existing, unchanged)
- ✅ **OU-US-3** — outlet manager creates KDO via mobile-friendly fast-entry form
- ✅ **OU-US-4** — outlet manager creates BDO via mobile-friendly fast-entry form
- ✅ **OU-US-6** — outlet manager performs Daily Close with checklist enforcement + deposit slip upload
- ✅ **CP-X (cross)** — File upload primitive available for any feature (already used in Daily Close; OCR-ready for Phase 8C)

---

## Next: Phase 8C

OCR Receipt Integration (Gemini 2.5 Flash via EMERGENT_LLM_KEY) → autofill Petty Cash + Urgent Purchase forms. Foundation (FileDropZone) is now ready.
