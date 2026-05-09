# Plan — Aurora F&B ERP (Torado Group)
**Last Updated:** May 8, 2026  
**Current Version:** 0.3.0  
**Repo:** github.com/pandekomangyogaswastika-dot/torado26  
**Deployed:** https://finance-phase2-test.preview.emergentagent.com

---

## 📝 Session 2 Update (May 8, 2026)

### ✅ Cashier Loyalty Points Entry System — COMPLETE
All features implemented and tested (iteration_6.json: Backend 100%, Frontend ~100%):

1. **Backend:**
   - `GET /api/outlet/loyalty/cashier/lookup` — phone lookup, returns null if not found
   - `POST /api/outlet/loyalty/cashier/add-points` — award points, auto-create customer, WhatsApp notification (graceful no-op)
   - `POST /api/loyalty/login-phone` — phone-based login for loyalty portal
   - Daily Sales: customer_phone field removed, loyalty points DECOUPLED from validation

2. **Frontend:**
   - `/outlet/loyalty/input-poin` — cashier screen (3-phase: search → confirm → success)
   - Navigation: Loyalty section with Input Poin Kasir + Voucher Redeem
   - Loyalty login: Email + Phone HP tabs (phone login redirect fixed via loginByPhone in context)

3. **WhatsApp:** Ready for Fonnte/Twilio/Meta API key (graceful no-op when not configured)

**Deployed at:** https://finance-phase2-test.preview.emergentagent.com

---

## 📝 Session 3 Update (May 8, 2026)

### ✅ Excel Legacy Workflow Analysis (Torado Group) — COMPLETE
User uploaded and requested analysis of 3 Excel files used by Torado Group. Analysis completed and approved by user.

**Files analyzed:**
1. Financial Report 2026 (23 sheets)
2. Market List (Master) 2024–2026 (10 sheets)
3. Purchasing Report 2026 (10 sheets)

**Key finding:** Aurora is **80–85% compatible** with Excel legacy workflow.

**Documents produced:**
- `/app/docs/GAP_ANALYSIS_EXCEL_VS_AURORA.md`
- `/app/docs/EXECUTIVE_SUMMARY_GAP_ANALYSIS_ID.md`
- `/app/docs/COMPARISON_TABLE.md`

---

## 📝 Session 4 Update (May 8, 2026)

### ✅ Phase 1 — Finance Migration Readiness — COMPLETE (+ AI Enhancement)
Berdasarkan gap analysis Excel, Phase 1 ditargetkan untuk mencapai **95% parity vs Excel**. Dalam implementasi, ternyata beberapa komponen sudah ada di codebase; sisanya ditambahkan.

**Phase 1 deliverables:**
1. ✅ **Manual Journal Entry (JAE)**
   - Backend endpoint sudah ada: `POST /api/finance/journals/manual`
   - Frontend form sudah ada: `/finance/manual-journal` (`ManualJournalForm.jsx`)

2. ✅ **Kontra Bon / AP Aging**
   - Backend endpoint sudah ada: `GET /api/finance/ap-aging`
   - Frontend report sudah ada: `/finance/ap-aging` (`APAging.jsx`)

3. ✅ **Payment Request (PR) Workflow (Weekly)** — **IMPLEMENTED**
   - Backend:
     - Model: `/app/backend/models/payment_request.py`
     - Service: `/app/backend/services/payment_request_service.py`
     - Router: `/app/backend/routers/payment_requests.py`
     - Server include: registered in `/app/backend/server.py`
   - API endpoints:
     - `POST /api/finance/payment-requests`
     - `GET /api/finance/payment-requests`
     - `GET /api/finance/payment-requests/{id}`
     - `POST /api/finance/payment-requests/{id}/submit`
     - `POST /api/finance/payment-requests/{id}/approve`
     - `POST /api/finance/payment-requests/{id}/reject`
     - `POST /api/finance/payment-requests/{id}/mark-paid`
     - `GET /api/finance/payment-requests/helpers/open-ap`
   - Frontend:
     - List: `PaymentRequestList.jsx`
     - Create: `PaymentRequestForm.jsx`
     - Detail + actions: `PaymentRequestDetail.jsx`
     - Routes added in `FinancePortal.jsx`
     - Navigation added in `navigationSchema.js` (Finance → Payments → Payment Requests)

4. ✅ **AI Journal Entry Generator (Input Jurnal AI) — IMPLEMENTED (Option A)**
   - Backend:
     - Service: `/app/backend/services/ai_journal_generator_service.py`
     - Endpoint: `POST /api/ai/generate-journal-entry` (added to `/app/backend/routers/ai.py`)
   - Frontend:
     - Component: `/app/frontend/src/components/finance/AIJournalGenerator.jsx`
     - Integrated into Manual JE: `/app/frontend/src/portals/finance/ManualJournalForm.jsx`

**Current migration readiness:** ~**95% → 98%+** (karena AI generator mempercepat input jurnal dan mengurangi error)

**Notes:** Testing komprehensif Phase 1 + AI belum dijalankan (user memilih lanjut development dulu).

---

## ✅ Status Summary (as of May 8, 2026)

### Completed Sprints / Major Work
| Sprint / Workstream | Description | Status |
|--------|-------------|--------|
| Phase 0–12 | Core ERP: Auth, Outlet, Inventory, Procurement, Finance, HR, Executive, Admin | ✅ Complete |
| Sprint G | Finance & HR Enhancements: Budget, Tax, Payroll PDF, BPJS | ✅ Complete |
| Sprint H | CMS Company Profile: Brands, Outlets, News, Menu + Image Upload | ✅ Complete |
| Sprint I (Task 1) | Navigation Restructuring: 3-tier AppShell → Sidebar → Subnav | ✅ Complete |
| Sprint I (Task 2) | Careers/Jobs CMS: Admin CRUD + Public CMS-driven listing | ✅ Complete |
| Additional Modules | Loyalty, Fixed Assets, AR, e-Faktur, e-Bupot, RFQ, CMS Advanced, CRM, Bank Recon, Report Schedules | ✅ In Codebase |
| UI Enhancement | Loyalty portal redesigned, public CTA, ERP login subtle | ✅ Complete |
| Excel Legacy Gap Analysis | Compare 3 Torado Excel files vs Aurora models/workflows | ✅ Complete |
| **Phase 1 (Finance Migration)** | PR Workflow + verify JAE + AP Aging | ✅ Complete |
| **AI Enhancement** | AI Journal Entry Generator | ✅ Complete |

### Latest Test Results
| Report | Backend | Frontend | Notes |
|--------|---------|----------|------|
| iteration_3.json | 100% (13/13) | 95% (20/21) | Legacy report from repo |
| iteration_4.json | — | ✅ Passed | Loyalty UI redesign + public header |
| iteration_6.json | ✅ Passed | ✅ Passed | Cashier points + phone auth + decouple daily sales |

---

## 🎯 Updated Objective (Current Focus)

### Phase 2 — Enhancement (Post-Phase 1) — **IN PROGRESS (Approved by user)**
**Goal:** Menyamakan pengalaman operasional & reporting dengan Excel legacy (Market List multi-periode, report format yang familiar), sekaligus meningkatkan usability.

**Scope Phase 2 (3 fokus):**
1. **Item Price Versioning** (Market List multi-periode)
2. **Report Builder + Export Excel (format mirip legacy)**
3. **Custom Profit & Loss format Torado**

**Non-goals (Phase 2):**
- Advanced vendor portal / reminders WhatsApp otomatis (Phase 3)
- Brand-item availability mapping (Phase 3)

---

## 🔜 Next Development Queue

### Priority 1 — Phase 2 Enhancements

#### 1) Item Price Versioning (Market List Multi-Periode)

**Problem:** Excel Market List menyimpan harga per periode (Q1/Q2/Q3/Q4), variance, previous price. Saat ini Aurora hanya menyimpan 1 harga aktif.

**Implementation (recommended approach): Separate Collection `item_pricings`**
- **Backend:**
  - New model/doc helper: `ItemPricing`
    - `id`, `item_id`, `vendor_id?`, `unit`, `price`
    - `effective_from`, `effective_to?`, `is_active`
    - `notes`, `created_at`, `created_by`
  - Endpoints:
    - `POST /api/inventory/items/{item_id}/pricing` — add new price (auto-close previous active)
    - `GET /api/inventory/items/{item_id}/pricing` — list history
    - `GET /api/inventory/items/pricing/current` — current prices for list views
  - Validations:
    - no overlapping effective periods per item+vendor+unit
    - price > 0

- **Frontend:**
  - Inventory Portal → Item Detail: tab **Harga (History)**
  - Add price modal: effective_from, unit, price, vendor (optional)
  - Display: current price + price history table + variance
  - Optional: bulk import (CSV/XLSX) in Phase 2.5

**Acceptance Criteria:**
- Bisa simpan histori harga per item per periode.
- Harga aktif otomatis berlaku berdasarkan effective date.
- UI menampilkan harga aktif + histori.

**Testing:**
- Add price twice → previous record closed.
- Retrieve history sorted by effective_from.

---

#### 2) Report Builder + Export Excel (Legacy-Friendly)

**Goal:** Membuat template report yang mirip Excel legacy dan bisa diekspor.

**Backend:**
- Review existing `ReportBuilder` / `PivotReport` modules.
- Add export endpoints (CSV/XLSX):
  - `GET /api/reports/export` (template_id, params)
- Add template storage if needed:
  - `report_templates` collection

**Frontend:**
- Finance Portal → **Custom Reports** (existing route `/finance/report-builder`)
- Tambahkan:
  - “Save template” + “Run template”
  - Export button: CSV/XLSX
  - Preset templates:
    - Weekly Payment Summary (mirip Pay Sum)
    - KB Summary per Vendor
    - Purchasing Summary

**Acceptance Criteria:**
- 1–2 template report legacy bisa di-run dan export tanpa manual pivot.

**Testing:**
- Generate report for a period, export, verify file download.

---

#### 3) Custom Profit & Loss Format Torado

**Goal:** Output P&L yang menyerupai layout sheet `PL` (Financial Report) termasuk grouping akun dan subtotal.

**Backend:**
- Extend `finance_service.profit_loss`:
  - allow `format=torado`
  - return grouped sections (Revenue, COGS, OPEX, Other, Net Profit)
  - optional compare prev

**Frontend:**
- Finance Portal → Profit & Loss (`/finance/profit-loss`)
  - Add format selector: Standard | Torado
  - Display sectioned table with subtotals
  - Export to XLSX/CSV

**Acceptance Criteria:**
- P&L Torado format tampil dan konsisten untuk 1 periode.

**Testing:**
- Ensure totals equal to standard P&L total.

---

### Priority 2 — Deferred / Phase 2.5 (Optional)
1. Bulk import Item Pricing dari Excel Market List (map kolom periode → effective_from/effective_to)
2. Scheduled reports untuk weekly/monthly finance (email/attachment)

---

### Priority 3 — Phase 3 Nice-to-Have
1. Brand-item availability mapping (flag ALTERO/MDS/RP/GG/BK/E-crew)
2. Advanced KB: reminders (email/WA), vendor portal view

---

## 📋 Development Guidelines

### Architecture
- Backend: FastAPI + Motor (async MongoDB) — `server.py` includes many routers
- Frontend: React + Shadcn/UI + Tailwind — 8 portals + public + loyalty
- DB: MongoDB `aurora_fnb` on localhost:27017
- Navigation: `navigationSchema.js` drives all sidebar + subnav across all portals
- Auth: JWT (HS256), `core/security.py` — `current_user` + `require_perm` decorators
- Envelope: `{success, data, errors, meta}` on all endpoints

### Conventions
- All API routes must use `/api/` prefix
- Backend env: `MONGO_URL`, `DB_NAME=aurora_fnb`, `JWT_SECRET`, `UPLOAD_DIR`
- Frontend env: `REACT_APP_BACKEND_URL` — do NOT modify
- File uploads: `/app/backend/uploads/` → served at `/uploads/*`
- Seed: `python3 seed/seed_demo.py` (idempotent)

### Key Files
| File | Purpose |
|------|---------|
| `/app/backend/server.py` | Main app + all router includes |
| `/app/backend/core/config.py` | Centralized settings |
| `/app/backend/core/security.py` | JWT + permissions |
| `/app/frontend/src/App.js` | React router + all routes |
| `/app/frontend/src/lib/navigationSchema.js` | Nav schema (8 portals) |
| `/app/frontend/src/components/layout/AppShell.jsx` | Global layout |

---

## 📁 Memory Documents
| Doc | Purpose |
|-----|---------|
| `/app/CURRENT_STATUS.md` | Feature completion matrix |
| `/app/memory/PRD.md` | Full product requirements |
| `/app/memory/ARCHITECTURE.md` | Technical architecture |
| `/app/memory/APPROVED_DECISIONS.md` | Product design decisions |
| `/app/memory/FINANCE_AUDIT_2026Q2.md` | Finance gap analysis |
| `/app/memory/PERF_AUDIT.md` | Performance audit |
| `/app/CMS_ADVANCED_ROADMAP.md` | CMS advanced roadmap |
| `/app/memory/MODULE_ENHANCEMENT_PLAN.md` | Module enhancement plan |
| `/app/memory/test_credentials.md` | Test login credentials |
| `/app/AI_DEVELOPMENT_RULES.md` | AI agent development rules |
| `/app/docs/GAP_ANALYSIS_EXCEL_VS_AURORA.md` | Excel vs Aurora detailed gap analysis |
| `/app/docs/EXECUTIVE_SUMMARY_GAP_ANALYSIS_ID.md` | Executive summary for management |
| `/app/docs/COMPARISON_TABLE.md` | Table comparison + priority matrix |

---

## ✏️ Changelog

### May 8, 2026
- Loyalty portal UI redesigned to premium dark glassmorphism
- Public website header now shows prominent “Torado Rewards” CTA
- ERP login made subtle/hidden
- Test report: `iteration_4.json` (frontend verification)
- Cashier Loyalty Points Entry System complete (phone login + add points + decouple daily sales)
- ✅ Completed analysis of 3 Torado Excel files; produced gap analysis docs
- ✅ Phase 1 completed: Payment Request Workflow added; verified Manual JE + AP Aging exist
- ✅ Added AI Journal Entry Generator (natural language → JE lines) + integrated into Manual JE UI
- 🔜 User approved to proceed with Phase 2 (Price Versioning, Report Builder, Custom PL)
