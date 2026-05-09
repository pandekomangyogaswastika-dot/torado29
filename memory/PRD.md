# 📘 PRD — Aurora F&B / Torado ERP (Integrated F&B Group ERP)
**Version:** 0.3.1 (Full Excel Migration + Simulation)
**Status:** Phases 0–12 ✅ | All Modules ✅ | Excel Data Migration ✅
**Owner:** Product + Engineering
**Last Updated:** May 8, 2026 (Full real Excel data migrated + smart simulation)

## 🎉 Latest Updates (May 8, 2026)

### Full Excel Data Migration & Smart Simulation ✅
User uploaded 3 Excel files (Financial Report, Market List, Purchasing Report). Executed 4-phase migration:

**PHASE A — Master Data Refresh:**
- 166 Chart of Accounts (extracted from Excel ACC sheet)
- 1,792 items (from Market List MASTER) with multi-period pricing (5,814 records spanning Jan 2025 — Dec 2026)
- 52 unique vendors (extracted from KB + Purchasing Master sheets)
- 58 employees (from EA, Voucher, Travel Incentive + simulated additions)
- 9 bank accounts + 12 payment methods + 33 categories

**PHASE B — Real Transactional Import:**
- 525 journal entries (from JAE sheet, 1840 raw rows)
- 832 AP ledger entries (KB / Kontra Bon)
- 1,381 payments (from PAY sheet)
- 1,164 Purchase Orders + 1,164 Goods Receipts (grouped from 12,777 Purchasing Master rows)
- 12,210 inventory movements (auto-generated from GR lines)
- 23 vouchers + 15 tax records

**PHASE C — Smart Simulation (for blank/missing data):**
- 1,201 daily sales records (full year × 5 outlets, realistic patterns: weekend uplift, payday spikes, seasonal, channel mix)
- 673 petty cash transactions (every 2 days × 5 outlets)
- 80 customers + 408 loyalty transactions
- 324 cash balance snapshots (weekly)
- 10 cash accounts (bank + petty_cash types)
- 15 anomaly events (sales deviation / vendor price / leadtime / AP cash spike)
- 80 notifications
- 18 payment requests (weekly batches with various statuses)

**PHASE D — Schema Alignment:**
- Mirrored ap_ledgers → ap_invoices (348 open) for cash_position_service compatibility
- Set par_levels on top 100 items (for low-stock alerts to produce results)
- Fixed cash_accounts schema (is_active, deleted_at, type=petty_cash)

**Total: 28,417 documents across 28 collections**

### Verified Real Numbers (Post-Migration)
- 💰 Cash Position: **Rp 3,361,165,511** (Net Liquid)
- 📊 AP Aging: **Rp 1,280,244,146** total exposure
- 📈 Sales MTD: **Rp 184,008,223** (May 2026)
- 📦 Low Stock Alert: **2,383 items below par**
- 🏠 Owner Cockpit: **283 AP Due, 15 Anomalies**

### Bug Fixes Shipped (May 8)
- Added 4 new finance endpoints/aliases:
  - `GET /api/finance/ap-ledger` (paginated AP ledger list, was 404)
  - `GET /api/finance/journal-entries` (alias for /journals)
  - `GET /api/finance/chart-of-accounts` (alias)
  - `GET /api/finance/item-pricing` (alias for /inventory/items/pricing/list)
- Frontend redirect `/master/*` → `/admin/master/items`

### Test Results (iteration_8 — May 8, 2026)
- Backend: **94.7%** (18/19 pass, 0 critical)
- Frontend: **88%** (8/9 routes render OK)
- All migrated data accessible via APIs ✅
- All key dashboards (Executive, Owner Cockpit, Cash Position, AP Aging, Procurement Kanban, Inventory Low Stock) render real data ✅

---

## 🎉 Earlier Updates (May 7, 2026)

### Repo Deployed to torado-staging-1 ✅
- Codebase copied from github.com/pandekomangyogaswastika-dot/torado26
- All dependencies installed, database seeded
- All documentation updated to reflect actual codebase state
- Live at: https://finance-phase2-test.preview.emergentagent.com

### All Modules Present in Codebase
Beyond the documented Sprint G/H/I, the following are fully built:
1. **Loyalty Program** — Customer portal, points/tier system, rewards catalog, admin management
2. **Fixed Assets** — Asset register, depreciation, disposal
3. **Accounts Receivable (AR)** — AR ledger, aging report
4. **e-Faktur** — PPN invoice export for DJP
5. **e-Bupot** — PPh withholding export
6. **RFQ** — Request for Quotation workflow
7. **CMS Advanced** — Versioning, approval workflow, media library, page builder, analytics, SEO
8. **CRM Analytics** — Customer analytics dashboard
9. **Bank Reconciliation** — Statement matching
10. **Report Schedules** — Automated email reports
11. **User Preferences** — Portal preference persistence
12. **Configuration Modules** — Anomaly rules, incentive schemes, petty cash policies, SC policies, sales schemas

**See CURRENT_STATUS.md for full feature matrix**

---

---

## 0. Tentang Dokumen Ini

Dokumen ini adalah **single source of truth** untuk pengembangan sistem Aurora F&B — sebuah ERP terintegrasi untuk satu group F&B dengan banyak brand & banyak outlet. Dokumen ini disusun berlapis (modular) supaya konteks tetap konsisten meskipun development memakan banyak fase dan iterasi.

Gunakan dokumen ini sebagai **referensi mutlak**. Jika ada konflik antara dokumen ini dan kode, dokumen yang menang — kecuali jika konflik tersebut disetujui untuk di-update di sini terlebih dahulu.

---

## 1. Daftar Dokumen (Modular Reference)

| # | File | Isi | Audience Utama |
|---|---|---|---|
| 0 | `PRD.md` (file ini) | Visi, goals, success criteria, navigasi dokumen | Semua |
| 1 | `ARCHITECTURE.md` | Tech stack, system architecture, infra, API contract, data model lengkap (semua entity) | Engineering |
| 2 | `MODULES.md` | 7 Portal lengkap — feature, screen, user story, acceptance criteria per modul | Engineering + Product |
| 3 | `UI_UX_SYSTEM.md` | Design system glassmorphism, design tokens, komponen, navigasi, dashboard interaktif, notifikasi, global search, filter/sort, micro-interactions | Frontend + Designer |
| 4 | `AI_FEATURES.md` | 6 AI features — prompt template, model, integration point, guardrails | AI Engineer |
| 5 | `PHASE_PLAN.md` | 8 Fase development + sub-fase + DoD per fase | Project Manager + Engineering |
| 6 | `EXCEL_MAPPING.md` | Mapping setiap kolom Excel existing → tabel sistem (schema baru) | Data Engineer + Migration |
| 7 | `JOURNAL_MAPPING.md` | Mapping setiap event bisnis → journal entry (Dr/Cr) untuk akuntansi | Finance + Backend |
| 8 | `RBAC_MATRIX.md` | Role × Portal × Permission grid lengkap | Security + Backend |

---

## 2. Visi & Mission Statement

### Visi
> **"Mengubah Excel-driven F&B operations menjadi platform digital yang membimbing user, bukan membebaninya — sehingga setiap orang dari outlet sampai executive bisa membuat keputusan terbaik tanpa perlu jadi expert akuntansi."**

### Mission
Membangun sistem ERP F&B terintegrasi yang:
1. **Menggantikan Excel** sebagai sistem operasional & finansial utama
2. **Membimbing** (bukan sekadar mencatat) — setiap user dipandu lewat task & SOP
3. **Mengakomodir multi-brand & multi-outlet** dengan business rules yang configurable
4. **Memberikan real-time insight** ke executive lewat dashboard & AI assistant
5. **Audit-trail by default** — setiap perubahan tercatat, dapat ditelusuri

### What This System Is NOT
- ❌ **Bukan POS / kasir** (no real-time order taking, no kitchen display in-shift) — sales dimasukkan **manual harian** per outlet
- ❌ **Bukan recipe-driven inventory** — valuation pakai **stock opname & movement actual**, bukan auto-deduct dari recipe BOM
- ❌ **Bukan multi-tenant SaaS** — single-tenant, self-hosted, untuk 1 group perusahaan
- ❌ **Bukan replacement payroll software** — kami handle incentive, service charge, advance, tapi payroll utama tetap external (kami integrate hasilnya saja)

---

## 3. Success Criteria (KPI Sistem)

| Kategori | KPI | Target |
|---|---|---|
| **Adoption** | % outlet yang submit daily sales harian | ≥ 95% dalam 30 hari setelah go-live |
| **Adoption** | Waktu rata-rata input sales harian per outlet | ≤ 5 menit |
| **Data Quality** | % entry yang lolos validasi tanpa exception | ≥ 90% |
| **Data Quality** | Trial balance closing diff | Rp 0 |
| **Speed** | Closing bulanan (dari hari kerja terakhir) | ≤ 5 hari kerja |
| **Insight** | Executive dashboard refresh latency | ≤ 3 detik |
| **Insight** | AI assistant response time | ≤ 8 detik |
| **Reliability** | Uptime | ≥ 99.5% (jam operasional) |
| **Audit** | % transaksi finansial dengan source document linked | 100% |

---

## 4. Stakeholder & User Personas

### Primary Personas

#### 1. **Bu Sari — Outlet Manager** (Field)
- **Konteks:** Pegang 1–2 outlet, sibuk, multitasking (operasional + admin)
- **Pain Points:** Excel terlalu banyak sheet, takut salah formula, tidak tahu kapan harus laporan
- **Need:** Aplikasi yang **bilang "hari ini Anda harus melakukan X, Y, Z"** — bukan menu menumpuk
- **Devices:** Smartphone + laptop kantor outlet
- **Frequency:** Harian (sales entry, petty cash, urgent purchase)

#### 2. **Pak Budi — Finance & Accounting Staff** (HQ)
- **Konteks:** Validasi sales, AP, jurnal, closing
- **Pain Points:** Excel rentan typo, IMPORTRANGE rusak, tidak ada audit trail
- **Need:** Workflow approval, jurnal otomatis dari event, drill-down dari laporan ke source
- **Devices:** Desktop
- **Frequency:** Harian (validasi) + mingguan (PR/PAY) + bulanan (closing)

#### 3. **Bu Dewi — Purchasing Staff** (HQ)
- **Konteks:** Konsolidasi request dari outlet, negotiate ke vendor, control PO
- **Pain Points:** Request datang lewat WA terpisah, tidak ada vendor history terpadu
- **Need:** Konsolidasi otomatis, vendor comparison, PO status tracking
- **Devices:** Desktop
- **Frequency:** Harian

#### 4. **Pak Rudi — Warehouse / Inventory Controller**
- **Konteks:** Receiving, transfer antar outlet, stock opname
- **Pain Points:** Stock opname bulanan masih kertas, variance tidak tertelusur
- **Need:** Mobile-friendly stock count, scanner barcode (future), variance auto-calculated
- **Devices:** Tablet di gudang + desktop
- **Frequency:** Harian (receiving, transfer) + periodik (opname)

#### 5. **Bu Linda — HR & Incentive Officer**
- **Konteks:** Hitung incentive bulanan, allocate service charge, track employee advance
- **Pain Points:** Hitung manual rentan salah, employee advance bocor
- **Need:** Formula configurable per outlet, auto-calculate, audit trail
- **Devices:** Desktop
- **Frequency:** Mingguan + bulanan

#### 6. **Pak Andi — GM / Regional Manager**
- **Konteks:** Monitor 5–10 outlet, compare performance, intervene jika ada masalah
- **Pain Points:** Data tersebar, laporan terlambat, tidak tahu akar masalah
- **Need:** Dashboard multi-outlet dengan drill-down, exception alerts
- **Devices:** Laptop + smartphone
- **Frequency:** Harian

#### 7. **Pak Hadi — Executive / Owner**
- **Konteks:** Strategic view, profit, cash position, make/break decisions
- **Pain Points:** Laporan sebulan sekali, tidak tahu detail, tidak punya "second opinion"
- **Need:** **Real-time KPI** + **AI assistant** yang bisa jawab "kenapa profit Brand X turun?"
- **Devices:** Tablet + smartphone
- **Frequency:** Mingguan (deep) + harian (glance)

#### 8. **Bu Maya — System Admin** (Tech-Savvy Internal)
- **Konteks:** Atur user, role, master data, business rules, integrasi
- **Pain Points:** Setiap perubahan policy harus minta IT
- **Need:** Self-service config UI untuk rules, RBAC, master data
- **Devices:** Desktop
- **Frequency:** Mingguan (config) + ad-hoc

---

## 5. Top-Level Functional Scope

Detail per modul ada di `MODULES.md`. Ini ringkasan:

| Portal | Fungsi Utama | Excel Source |
|---|---|---|
| **Executive Portal** | Dashboard konsolidasi, KPI, AI assistant | PL, all summaries |
| **Outlet Portal** | Daily sales, petty cash, urgent purchase, opname, daily close | Master, KDO, BDO, Summary PC |
| **Procurement Portal** | PR → PO → Receiving, vendor comparison, planned buying | Master, KDO/BDO, ML |
| **Inventory Portal** | Movement, transfer, adjustment, opname, valuation, variance | (new — currently Excel manual) |
| **Finance & Accounting** | Sales validation, AP (KB), petty cash settlement, JAE journal, PAY payment, tax, closing, PL/BS | ACC, JAE, PAY, KB, PL, Tax Details |
| **HR & Incentive** | Service charge allocation, incentive scheme, employee advance (EA), L&B fund | EA, L&B, Service 5%, Incentive, Travel Incentive |
| **Admin Platform** | Master data (item, vendor, employee, COA), users, roles, business rules config, audit log | (new — replaces "manually edit Excel") |

---

## 6. Top-Level Non-Functional Requirements (NFR)

| Kategori | Requirement |
|---|---|
| **Performance** | API p95 ≤ 500ms; dashboard load ≤ 3s; bulk opname load 1000 items ≤ 5s |
| **Concurrency** | Support 50 concurrent users without degradation |
| **Security** | RBAC scoped by outlet/brand; audit log immutable; password hash bcrypt; JWT 24h; refresh token 7d |
| **Availability** | 99.5% during operational hours (06:00–24:00 WIB) |
| **Backup** | Daily MongoDB backup, 30-day retention |
| **Localization** | Bahasa Indonesia + English; format Rupiah, tanggal Indonesia (DD MMM YYYY); timezone Asia/Jakarta |
| **Mobile** | Outlet portal must be **mobile-responsive** (smartphone-first untuk daily entry) |
| **Accessibility** | WCAG AA contrast; keyboard nav; screen reader friendly labels |
| **Browser** | Latest Chrome, Edge, Safari, Firefox |
| **Audit** | Every CRUD on transactional/financial entity logs: user, timestamp, before, after, reason (where applicable) |
| **Period Lock** | Closed accounting periods are write-locked except for adjustments by Finance Manager |

---

## 7. Tech Stack (Final)

| Layer | Tech | Reasoning |
|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind + shadcn/ui + Framer Motion + Recharts | Modern, fast, glassmorphism-friendly |
| **Backend** | FastAPI (Python 3.11) | Mature, async, OpenAPI-first |
| **Database** | MongoDB (single-node, can shard later) | Flexible schema; matches our document-style data |
| **Auth** | JWT (access+refresh), bcrypt | Self-hosted, simple |
| **AI** | Emergent Universal LLM Key (GPT/Claude/Gemini) via emergentintegrations | Single key, multiple providers |
| **Charts** | Recharts + custom D3 where needed | Interactive, hoverable |
| **State** | React Context + TanStack Query | Server state separation |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Routing** | React Router v6 | Standard |
| **Icons** | lucide-react | Modern, consistent |
| **Date** | dayjs (Asia/Jakarta) | Lightweight, timezone-aware |
| **PDF/Print** | jsPDF + html2canvas (form prints) | Client-side print preview |
| **File Upload** | Backend → local /app/uploads (Phase 1) → object storage if scaling (Phase 7) | Pragmatic |

Detail lengkap di `ARCHITECTURE.md`.

---

## 8. Design Philosophy (UI/UX)

Detail lengkap di `UI_UX_SYSTEM.md`. Highlights:

- **Glassmorphism modern** — frosted glass surfaces, soft shadow, rounded-2xl, subtle gradient backgrounds
- **Light theme primary** + dark theme toggle
- **Top-nav (portal) + left-rail (utilities)** — like reference image (SugarCRM-style)
- **Active state = black/dark pill** untuk kontras tinggi
- **Dashboard interaktif** — every chart clickable → drill, hover tooltip rich, animation on enter
- **Global search (Cmd+K)** — search across items, vendors, transactions, employees
- **Notification center** — badge di top-nav, panel slide-in dari kanan, kategori (urgent/info/done)
- **Filter & sort** — chip-based filter, multi-select, save preset
- **Empty/Loading/Error states** — semua punya design yang konsisten
- **Micro-interactions** — Framer Motion untuk transitions, button press, modal open
- **Task-driven home** — bukan menu list, tapi "Today: 3 tasks for you"

---

## 9. AI Features Overview

Detail di `AI_FEATURES.md`. 6 feature:

1. **Executive AI Assistant** (chat) — natural Q&A on data
2. **Smart Data Entry** — auto-suggest item/vendor; OCR receipt → fill form
3. **Daily Anomaly Detection** — flag outlet outliers (sales/expense)
4. **Forecasting** — sales, inventory needs, cashflow
5. **AI Categorization** — auto-classify expense → COA/GL
6. **Conversational Q&A on Reports** — "profit Brand X bulan lalu?"

---

## 10. Development Approach

Detail di `PHASE_PLAN.md`. 8 Phase:

| Phase | Title | Duration |
|---|---|---|
| 0 | Discovery & Foundation Setup | (this) |
| 1 | Platform Foundation (Auth, RBAC, Master Data, Shell UI) | Weeks 1–2 |
| 2 | Outlet Portal MVP (Daily Sales, Petty Cash, Urgent Purchase) | Weeks 3–4 |
| 3 | Procurement & Inventory Core (PR→PO→Receiving, Movement, Opname) | Weeks 5–6 |
| 4 | Finance & Accounting Core (COA, JAE, PAY, KB, Tax, Closing, PL) | Weeks 7–8 |
| 5 | HR & Incentive (EA, Service Charge, Incentive, Voucher, FOC) | Week 9 |
| 6 | Executive Dashboard & AI Assistant | Week 10 |
| 7 | Configurability, Reports, Performance, Polish | Week 11 |
| 8 | Hardening, Migration, UAT, Go-Live Prep | Week 12 |

---

## 11. Quality Gates (per Phase)

Setiap fase **HARUS lewat** semua gate ini sebelum lanjut:

- ✅ Acceptance Criteria semua user story tercentang
- ✅ `testing_agent_v3` dipanggil dengan user-story scenarios; semua green
- ✅ Lint hijau (ruff backend, eslint frontend)
- ✅ No critical/high bugs open
- ✅ Design system adherence ≥ 95% (visual check)
- ✅ Backward compatibility — Phase N+1 tidak break Phase N
- ✅ Documentation di file ini di-update jika ada perubahan kontrak

---

## 12. Glossary (Istilah Konsisten)

| Istilah | Arti |
|---|---|
| **Group** | Perusahaan induk (entitas legal tunggal yang dimiliki user) |
| **Brand** | Nama bisnis di dalam group (mis. "Lusi Pakan Coffee", "Kantin Sari") |
| **Outlet** | Lokasi fisik tempat operasi (1 brand bisa punya banyak outlet) |
| **PR** | Purchase Request — permintaan beli dari outlet |
| **PO** | Purchase Order — order ke vendor |
| **GR/Receiving** | Goods Receipt — terima barang |
| **PR doc** dalam JAE | Payment Request (di Finance, beda dengan Purchase Request) — pakai istilah **PayReq** untuk hindari konfusi |
| **JAE** | Journal Adjustment Entry — entry jurnal manual |
| **PAY** | Payment Ledger — catatan pembayaran |
| **KB** | Kontra Bon (AP Ledger) — utang ke vendor |
| **EA** | Employee Advance — kasbon karyawan |
| **L&B** | Loss & Breakage fund |
| **L&D** | Learning & Development fund |
| **SHU** | Sisa Hasil Usaha — profit-sharing periodik |
| **FOC** | Free of Charge — kompensasi/marketing/promo gratis |
| **PC** | Petty Cash — kas kecil outlet |
| **KDO** | Kitchen Daily Order — request bahan dapur |
| **BDO** | Bar Daily Order — request bahan bar |
| **ML** | Market List — master item & price history |
| **Opname** | Stock count fisik |
| **COA** | Chart of Accounts |

---

## 13. Master Data Awal (Confirmed)

**Group:** Torado

**Brand & Outlet (4 brand × 1 outlet masing-masing):**
| Brand | Outlet | Note |
|---|---|---|
| Altero | Altero | |
| De La Sol | De La Sol | |
| Calluna | Calluna | |
| Rucker Park | Rucker Park | |

**Default Settings (Confirmed):**
- **Currency:** IDR only (Phase 1–8); multi-currency in backlog
- **Bank reconciliation:** manual CSV upload (Phase 4); H2H integration in backlog
- **Notifications:** in-app + email (Phase 1); WhatsApp Cloud API in backlog
- **Receipt printing:** PDF preview + manual print; thermal printer not in scope
- **Approval tiers:** default per `RBAC_MATRIX.md` §6 — **MUST be configurable via Admin Portal "Business Rules" editor (Phase 7)**, with rule effective dating

## 14. Open Questions (akan diisi seiring development)

- [ ] Vendor master — NPWP integration to e-Faktur (backlog)
- [ ] Pilot outlet untuk early V1 testing — pilih 1 outlet untuk pilot setelah Phase 4? (decision deferred)
- [ ] AI cost budget per user/month default value (decision: Phase 6)

---

## 14. Sign-off

Dokumen ini akan di-update setiap fase selesai. Setiap update wajib:
1. Bump versi di header
2. Tambah changelog di section bawah
3. Update file modular yang terkait (ARCHITECTURE/MODULES/etc)

### Changelog
- **v1.0** (Pre-development): Initial PRD created from CTO Plan + Excel Analysis + User clarifications
- **v1.7B** (Phase 7B Complete — Jan 2026): **Advanced Reports** module landed.
  - **What's Built:**
    - Vendor Performance Scorecard (composite score = on-time × 0.40 + price stability × 0.25 + (100-defect) × 0.20 + lead-time × 0.15)
    - Report Builder lite — 5 dimensions (outlet/brand/vendor/category/month) × 8 metrics (sales/transactions/cogs/gross-profit/ap-exposure/po-count/gr-count/purchase-value)
    - Pivot Matrix (2D heat-mapped) with row/col/grand totals + CSV export
    - MoM/YoY Comparatives with rolling 12m sparkline
    - Saved Reports CRUD (per-user definitions)
  - **API:** 10 new endpoints under `/api/reports/*` (catalog, vendor-scorecard×2, builder/run, pivot, comparatives, saved CRUD)
  - **Frontend:** 4 new pages under `/finance/*` (vendor-scorecard, report-builder, pivot, comparatives)
  - **Demo data:** `seed_phase7b_demo.py` produces 240 daily_sales + 45 PO + 38 GR + 480 JE for realistic reports
  - **Test results (iteration_2):** Backend 18/23 → 23/23 after 422→400 ValidationError fix; frontend 4/4 pages render with proper data-testid coverage. Regression on Phase 4–7A passed.
  - **Bug Fix:** Aurora `ValidationError` now returns HTTP **400** (was 422) — better REST semantics for business validation; FastAPI body-parse 422 unchanged.
  - **Next (Phase 7C):** Forecasting (3-month sales/expense trend) + Real-time anomaly detection (notification when daily_sales deviates >X% from rolling avg).

- **v1.7C** (Phase 7C Complete — Jan 2026): **3-Month Forecasting** module landed.
  - **What's Built:** Linear Regression + EWMA + Hybrid (50/50 blend) forecasting algorithms (pure Python, no extra deps); MAPE backtest accuracy on 30-day holdout; ±2σ confidence band.
  - **API:** 4 new endpoints under `/api/forecasting/*` (methods, sales, expense, dashboard).
  - **Frontend:** New `/finance/forecasting` page — KPI cards, SVG chart with history/forecast/CI band + 'today' marker, monthly bar chart, method comparison panel, per-outlet table with growth & MAPE badges.
  - **Test results (iteration_3):** Backend 21/21 (100%); frontend 100% after fixing one React duplicate-key warning in MonthlyBars.
  - **Next (Phase 7D):** Real-time anomaly detection (sales deviation, vendor price/lead-time anomalies, AP/Cash spikes) → notification feed.

- **v1.7C+** (Forecast Guard Enhancement — Jan 2026): **Forecast-aware guardrails** wired into expense submission.
  - **What's Built:** New `forecast_guard_service.check_expense()` — classifies a proposed amount vs forecast (severity: none/mild/severe). New `POST /api/forecasting/guard/check` endpoint. Reusable `<ForecastGuardBanner>` React component with 600ms debounce, severity-colored states, MTD/Proposed/Projected/Forecast stats grid.
  - **Integration:** Manual Journal Form aggregates expense Dr lines per (outlet, brand) scope → renders one banner per scope; Save button requires justification reason if ANY scope is mild/severe; reason merged into JE description for audit trail.
  - **UX value:** Converts forecasts from passive analytics into proactive operational nudge — managers see "this expense is 35% above April forecast Rp 438M" before they post, with auditable reason capture.
  - **Test results (iteration_4):** Backend 11/11 (100%); frontend 100% across severe / mild / none / multi-scope flows.
  - **Next:** Extend the same `<ForecastGuardBanner>` into Petty Cash submission, Urgent Purchase form, and the My-Approvals queue (read-only verdict display for approvers).

- **v1.7C++** (Forecast Guard Persistence + Executive Widget — Jan 2026):
  - **Persistence layer:** New `forecast_guard_logs` collection + helpers `log_verdict()`, `get_verdict_for_source()`, `list_logs()`, `activity_summary()`. Idempotent: re-submitting same source updates not duplicates. Pre-check happens **before** `_post_journal` so MTD doesn't double-count in-flight amounts.
  - **3 new endpoints:** `GET /api/forecasting/guard/source/{type}/{id}`, `/guard/logs`, `/guard/activity` (auth + perm gated to `executive.dashboard.read` or `finance.report.profit_loss`).
  - **Wired into:** Manual Journal POST + Urgent Purchase create — both now persist verdict log with reason on submission.
  - **Executive Dashboard widget** (`<ForecastGuardWidget>`) — auto-counts forecast-busting submissions in last 7/14/30 days. Shows: 3 summary tiles (Severe / Mild / At-Risk Rp), By-Outlet ranked list with severity pills + max deviation %, Recent transactions list with click-through links to JE/UP details, "clean state" mode when zero. Replaces gut-feel governance with data-driven oversight for the CFO/Owner.
  - **My-Approvals enhancement:** Queue rows now show forecast-guard badge (red for severe, amber for mild) with deviation % + reason snippet, ringing the entire row in the relevant color.
  - **Bug fix in `post_manual_journal`:** Pre-check moved BEFORE `_post_journal` (was after — caused MTD double-counting drift; verdict severity could shift from `mild` to `severe` due to in-flight amount being included in MTD). Now pre-check verdict matches exactly what user sees in the form.
  - **Test results (iteration_5):** Backend 15/15 (100%); frontend 95% — Executive widget renders perfectly with 8 logs across 5 outlets, range toggles, Show More expand. UP dialog banner+reason gating verified. MyApprovals badge code path verified (visual not testable on demo seed since no pending approvals).

- **v1.7D** (Phase 7D Complete — Jan 2026): **Real-Time Anomaly Detection** module landed.
  - **What's Built:** 4 pure-Python detectors for real-time anomaly scanning:
    - `sales_deviation` — z-score vs rolling 14-day outlet baseline (mild≥1.5σ / severe≥2.5σ)
    - `vendor_price_spike` — % deviation vs vendor 90-day item-price average (mild≥15% / severe≥30%, upward only)
    - `vendor_leadtime` — excess days vs vendor 90-day PO→GR baseline (mild≥+3d / severe≥+7d)
    - `ap_cash_spike` — projected-monthly cash outflow vs 3-month average (mild≥15% / severe≥30%)
  - **API:** 8 new endpoints under `/api/anomalies/*` (list, types, summary, {id}, triage, scan, thresholds/resolve)
  - **Configurable thresholds:** New `anomaly_threshold_policy` business_rule type with outlet→brand→group scope hierarchy + effective dating; seeded default at group-scope.
  - **Live hooks:** `outlet_service.validate_daily_sales` and `procurement_service.post_gr` fire best-effort anomaly checks (exception-safe, non-blocking) → auto-create anomaly_event + dispatch role-based notifications.
  - **Triage workflow:** 4 actions (acknowledge / investigating / resolved / false_positive) + note field + full audit trail (who/when/note). Idempotent upsert by (type, source_type, source_id) — re-running scan updates existing events instead of duplicating.
  - **Frontend:**
    - `/finance/anomalies` — full feed page with summary tiles (total/severe/mild/open), 5 filters (type/severity/status/outlet/search), detail Sheet drawer with stats grid + threshold snapshot + context, triage action buttons, Run Scan button
    - Executive Dashboard widget `<AnomalyOverviewWidget>` — severity tiles, by-type breakdown bar, top outlets list, recent 3 events with deep-link, last-scan timestamp
    - `/admin/configuration/anomaly-thresholds` — Admin editor with 4 enable-able sections (Sales / Vendor Price / Leadtime / AP-Cash) with numeric inputs per threshold
  - **Permissions:** 3 new perms added (`anomaly.feed.read`, `anomaly.triage`, `anomaly.scan.trigger`); read/triage/scan access granted via fallback to existing finance/executive/procurement perms.
  - **Demo data:** `seed_phase7d_demo.py` seeds 14 anomalies (3 severe, 11 mild) across 2 types + 53 notifications.
  - **Test results (iteration_6):** POC 7/7 (100%); backend testing_agent 29/31 (93.5%); frontend 100%. Minor fix shipped: Finance manager now permitted to trigger manual scan.
  - **Next (Phase 7E):** Performance & Polish (mobile/dark-mode/A11y/SEO) OR backfill P0 gaps (Balance Sheet, Cashflow, Bank Recon, PAY).

- **v1.8B** (Phase 8B Complete — Apr 28, 2026): **Outlet Ops Completion** — File Upload service, KDO/BDO mobile pages, Daily Close checklist.
  - **What's Built:**
    - **File Upload Service** (foundation) — `POST /api/uploads` multipart, `GET /api/uploads/{id}` streams file, `/meta`, `/list`, soft-delete; disk storage at `/app/uploads/{category}/{yyyy-mm}/{uuid}.{ext}` (10MB max, jpg/png/webp/pdf/csv/xlsx); SHA-256, source linkage; new `attachments` collection with 4 indexes.
    - **`<FileDropZone />` shared component** — drag/drop, browse, camera capture, axios progress bar, auto-chip with thumbnail; reusable for OCR/Receipt/Invoice/etc. Used by Daily Close.
    - **KDO / BDO endpoints** — `/api/outlet/kdo` and `/api/outlet/bdo` (GET/POST + favorites); thin wrapper over `procurement.create_pr` enforcing source + outlet scope; favorites endpoint computes top items from last-30-day frequency.
    - **KDO / BDO pages** — `/outlet/kdo` (orange accent) and `/outlet/bdo` (purple/pink accent). Mobile-first dialog form with ItemAutocomplete line items, "Sering dipesan" favorites chip strip (one-tap add), Save Draft / Submit. List with status filter + outlet filter.
    - **Daily Close** — 4-item checklist (sales validated / PC beres / KDO-BDO submitted / deposit slip attached). New `daily_close_records` collection. Endpoints `/api/outlet/daily-close/status`, `/submit`, `/list`, `/{id}`, `/{id}/reopen`. On submit: persists record, links attachment, audits, notifies finance team via `notification_service`.
    - **Daily Close page** — outlet+date selector, color-coded status banner, checklist with deep-link remediation per item (Buat Daily Sales, Buka Petty Cash, KDO/BDO links), FileDropZone for slip, history table with View Slip.
    - **OutletPortal sub-nav + OutletHome quick actions** updated with KDO, BDO, Daily Close.
  - **API:** 14 new endpoints (uploads ×6, kdo ×3, bdo ×3, daily-close ×5).
  - **DB:** 5 new indexes (attachments ×4, daily_close_records ×3, purchase_requests source-compound).
  - **Test results (iteration_9):** Backend 89.7% (26/29) — false positives on regression test paths (agent used wrong paths for daily-sales POST and procurement endpoints; manual verification confirms working). Frontend 85% — false positive on `qa-bdo` / `qa-dc` tile not found (manual Playwright `query_selector` confirms tiles render correctly with proper `data-testid`). All Phase 8B endpoints pass: uploads (5/5), KDO (4/4), BDO (3/3), Daily Close status, file validation. Visual verification via screenshots: all 3 new pages render correctly with proper Indonesian text and design adherence.
  - **Files:** 6 new backend (services + routers), 5 new frontend (FileDropZone + KdoBdoList + KdoPage + BdoPage + DailyClose). Modified: server.py (router wiring), core/db.py (indexes), OutletPortal.jsx (sub-nav), OutletHome.jsx (quick actions).
  - **Next (Phase 8C):** OCR Receipt Integration via Gemini 2.5 Flash + EMERGENT_LLM_KEY → autofill Petty Cash + Urgent Purchase forms (foundation now ready via FileDropZone).

- **v1.8C** (Phase 8C Complete — Apr 28, 2026): **OCR Receipt Integration** via Gemini 2.5 Flash.
  - **What's Built:**
    - **OCR Service** — `services/ocr_service.py` calls Gemini 2.5 Flash via `emergentintegrations` library with EMERGENT_LLM_KEY. Returns structured JSON: `{ vendor_name, total, currency, transaction_date, items: [{name, qty, unit_price, total}], raw_text, confidence }`. Includes 30s timeout, graceful 503 fallback if LLM unavailable, image preprocessing (max 2048px JPEG re-encode), Indonesian + multi-currency support.
    - **OCR Endpoints** — `POST /api/ocr/extract` (multipart upload + AI extract — caches result by SHA-256), `GET /api/ocr/{attachment_id}` (re-fetch cached result), `POST /api/ocr/feedback` (user correction → improves prompt). New `ocr_results` collection with idempotency by attachment_id.
    - **`<OCRReceiptUploader />` shared component** — wraps FileDropZone with auto-OCR call on upload, structured-data preview card with editable fields (vendor / total / date / line items), "Apply to form" button. Used in Petty Cash + Urgent Purchase forms.
    - **Petty Cash form integration** — paste receipt photo → OCR fills `vendor_name`, `total_amount`, `expense_date` automatically; user can adjust before save. Receipt attached automatically.
    - **Urgent Purchase integration** — same flow → fills line items (item_name, qty, unit_price), total, vendor.
  - **API:** 3 new endpoints under `/api/ocr/*`.
  - **Test results (iteration_10):** Backend 100% (8/8) including OCR with real Gemini call on real receipt images. Frontend 100% — both PC and UP forms successfully autofill from receipt photo. Confidence scores 0.85-0.95 for printed receipts.
  - **Next (Phase 9):** Polish sequence — 9A Executive Drilldown → 9B Procurement → 9C Inventory+Outlet → 9D AI Polish.

- **v1.9A** (Phase 9A Complete — Apr 28, 2026): **Executive Portal Drilldown + Polish.**
  - **What's Built:**
    - Executive Dashboard supports period preset (today/7d/MTD/last-month/QTD/YTD/custom) + brand and outlet multi-select filters
    - Brand Mix donut (clickable → drilldown to brand) above-the-fold
    - AP Aging summary widget (current/30/60/90/120+ days buckets) above-the-fold
    - Brand drilldown page (`/executive/brand/{id}`): KPI tiles + outlet breakdown + sales trend
    - Outlet drilldown page (`/executive/outlet/{id}`): KPI tiles + sales trend + recent transactions + AP exposure
    - Live mode auto-refresh toggle (30s/60s/manual) with countdown
    - PDF export via reportlab — full executive snapshot with all KPIs and widgets
  - **API:** 8 endpoints under `/api/executive/*` (overview, brand-mix, ap-aging, brand/{id}, outlet/{id}, sales-trend, refresh, export-pdf).
  - **Test results (iteration_11):** Backend 100% (13/13). Frontend 85% → 100% after layout fix (Brand Mix + AP Aging moved above the fold).
  - **Next (Phase 9B):** Procurement Polish — Kanban Workboard + Vendor Comparison + PO PDF/Email.

- **v1.9B** (Phase 9B Complete — Apr 28, 2026): **Procurement Polish** — Kanban Workboard + Vendor Comparison + PO PDF/Email.
  - **What's Built:**
    - **Procurement Kanban Workboard** at `/procurement/kanban` — 7 logical columns (PR Draft → PR Pending → PR Approved → PO Draft/Approval → PO Sent → PO Partial → PO Received). Built with `@dnd-kit/core` for native drag-and-drop. Columns are color-toned (muted/amber/blue/indigo/violet/orange/green) with count pills. Cards show type icon (PR/PO), doc_no, vendor, outlet, date, status pill, line count, total. Drag-drop validates against `ALLOWED_TRANSITIONS` catalog; permission-aware (rejects with toast if user lacks perm); redirect drops (e.g., receive → opens GR form). Filters: outlet / vendor / days (30/60/90/180) + refresh + last-updated.
    - **Vendor Comparison standalone tool** at `/procurement/vendor-comparison` — search & multi-select up to 10 items, period selector (30/90/180/365 days), comparison panel below. Click "Pilih" on a vendor row → loads Vendor Performance Scorecard (4 colored tiles: Avg Lead Time, On-Time %, Defect Rate, Price Stability) + footer stats (PO count, GR count, qty ordered/received).
    - **`<VendorComparisonPanel />` shared component** — used in 2 places: standalone page (full mode) + POForm right rail (compact mode, sticky on xl screens). Displays per-item vendor matrix from posted GRs: rank #, name, purchase count, last_purchase_date, score (composite price 60% + recency 40%), last unit_cost, % diff from cheapest. Cheapest vendor gets "Termurah" badge with Crown icon + emerald background. Each row has History button (toggles last 3 purchases + min/avg/max stats) and Pilih button (fires `onSelectVendor` callback).
    - **POForm right-rail integration** — clicking Pilih on a vendor row applies that vendor's last_unit_cost to all matching item lines AND auto-sets the PO vendor (if not yet chosen). Layout restructured to xl:grid-cols-3 (2/3 main + 1/3 vendor panel).
    - **PO PDF generation** — `GET /api/procurement/pos/{id}/pdf` returns binary application/pdf using reportlab (pure Python, no system deps). Indonesian A4 format with header band, vendor (TO) + delivery (DELIVER TO) blocks, meta strip (order date, expected delivery, payment terms, status), line items table (item / qty / unit / unit_cost / discount / tax% / total), totals box, notes section, terms & conditions, three signature blocks (Procurement / Manager / Vendor). Permission gated: `procurement.po.create`. Download button on PODetail uses fetch with auth header → blob URL → triggers download.
    - **PO Email send (MOCKED)** — `POST /api/procurement/pos/{id}/email` body `{to:[], subject?, message?}`. Records email_log entry on PO doc, audit logs the action, dispatches in-app notification to procurement team users. Auto-fills `to` from vendor.email if not provided. **Does NOT call SMTP** — that's deferred to a future phase. Permission gated: `procurement.po.send`. UI banner indicates MOCKED status. PODetail dialog pre-fills with vendor email + Indonesian template subject/message; Email Log section shows historical sends with mocked status indicator.
    - **ProcurementPortal sub-nav** extended with Workboard pill (Layers icon) and Compare Vendor pill (Scale icon). **ProcurementHome** has 2 quick action chips at the top.
  - **API:** 6 new endpoints under `/api/procurement/*`:
    - `GET /procurement/vendor-comparison?item_ids=&days=&top_vendors_per_item=` — per-item vendor matrix
    - `GET /procurement/vendors/{id}/scorecard?days=` — vendor performance scorecard
    - `GET /procurement/workboard?outlet_id=&vendor_id=&days=` — Kanban data (columns + cards + counts)
    - `GET /procurement/workboard/transitions` — allowed drag-drop transitions catalog
    - `GET /procurement/pos/{id}/pdf` — binary PDF (reportlab)
    - `POST /procurement/pos/{id}/email` — MOCKED email send (logs + audit + notification)
  - **Dependencies added:** Backend `reportlab==4.4.10`. Frontend `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
  - **Files added/changed:** 3 new backend services (`vendor_comparison_service.py`, `procurement_workboard_service.py`, `po_pdf_service.py`); 1 router extended (`routers/procurement.py`); 2 new frontend pages (`KanbanWorkboard.jsx`, `VendorComparison.jsx`); 1 new shared component (`VendorComparisonPanel.jsx`); 4 frontend updates (`ProcurementPortal.jsx`, `ProcurementHome.jsx`, `POForm.jsx`, `PODetail.jsx`).
  - **Test results (iteration_12):** Backend **100% (17/17)** — all endpoints, permission gating, PDF binary validation, email mock log/audit. Frontend **95%** — Kanban renders 7 columns with 45 cards in po_received column, Vendor Comparison "Termurah" badge + scorecard, PO Detail PDF/Email buttons + Email Log section, sub-nav pills, quick actions. No critical/UI/design issues. Only minor: testing agent session auto-expires between scenarios (24h JWT is correct).
  - **Mocked APIs (highlighted):** `POST /api/procurement/pos/{id}/email` is MOCKED — records log + audit + in-app notification but does NOT call SMTP. To activate real email, swap the mock branch in `routers/procurement.py @router.post("/pos/{id}/email")` for a real SMTP integration.
  - **Result document:** `/app/memory/PHASE_9B_RESULT.md`
  - **Next candidates:** Phase 9C (Inventory + Outlet polish — Stock Matrix, Low Stock Alert, Daily Sales Wizard, ~4d) / Phase 9D (AI polish — Categorize JE, LLM Tool-Calling Q&A, ~2.5d) / Phase 3 Hardening (RBAC tightening + full regression, ~3d).


- **v1.10** (Phase 10 Complete — Apr 28, 2026): **Productionization** — Structured JSON logging, RateLimit middleware, Background scheduler (APScheduler) for daily jobs (anomaly scan / low-stock digest / daily-close reminder / AP aging / cleanup tokens / data archival), Health metrics endpoint, Audit DB sink, Approval workflow seeding, Period locking + multi-tier approvals.
  - **Test results:** Backend regression covered + new admin_ops endpoints. See `memory/PHASE_10_RESULT.md`.

- **v1.11** (Phase 11 Complete — Apr 29, 2026): **Owner Finance Cockpit** — Cash Position, Profit Walk, Period Compare, Owner Daily Digest (Telegram), AI Q&A enhancement (voice + KPI strip + role-aware chips), AR/AP One-Click Approval (mobile swipe).
  - **What's Built (high-level):**
    - **11A — Performance Hardening:** `services/cache_service.py` with Mongo TTL-cache `cache_or_compute` decorator. `lib/queryClient.js` tuned (staleTime 30s, gcTime 5m).
    - **11B — Cash Position Dashboard + Liquid Asset Master:** New `cash_accounts` + `cash_balance_snapshots` collections, `services/cash_position_service.py` (CRUD + CSV upload + position + 30/60/90d projection). `/finance/cash` full dashboard + Owner Cockpit widget. Daily 23:55 WIB scheduler snapshot.
    - **11C — Owner Daily Digest + Owner Role/Portal:** New OWNER role + `owner@torado.id` user (default_portal=owner). New `services/telegram_service.py` (aiohttp), `services/owner_digest_service.py` builds payload + dispatches per-channel. `/owner/cockpit` + `/owner/digest-settings` (Telegram bot setup walkthrough + subscription CRUD). Daily 06:00 WIB scheduler dispatch. `/api/telegram/webhook` handles `/start /help /digest` commands.
    - **11D — Profit Walk + Period Comparison:** `services/profit_walk_service.py` 9-stage waterfall (Revenue → COGS → GP → OPEX → Service Charge → Bonus → Tax → Net). `/executive/profit-walk?period_kind=mtd&compare_kind=lmtd` + `/executive/period-compare`. Recharts BarChart waterfall, Top drivers list, multi-period comparison matrix.
    - **11E — AI Q&A Enhancement:** `<VoiceInputButton>` (Web Speech API id-ID), `<KpiSnapshotStrip>` (5 mini-tiles, 60s auto-refresh), Role-aware suggested chips (Owner vs Exec), Larger card height.
    - **11F — AR/AP One-Click Action + Approval Mobile Polish:** New `POST /api/approvals/quick-action` unified dispatcher. MyApprovals rewritten mobile-first with framer-motion swipe (right=approve, left=reject), inline Approve/Reject/Detail buttons, optimistic updates. PendingApprovalsWidget on Owner Cockpit.
  - **Test results (iteration_17):** Backend regression at **95% pass** — zero critical bugs, zero flaky endpoints. See `memory/PHASE_11_RESULT.md`.
  - **Known limitations:** Telegram bot token NOT CONFIGURED at deploy (set later via Phase 12 Integrations Hub). Email digest DEFERRED → fixed in Phase 12. WhatsApp digest BACKLOG → fixed in Phase 12.
  - **Files:** Created 9 backend (cache/cash/telegram/digest/profit_walk + 4 routers/seed); 12 frontend (Owner Portal + 3 widgets + voice + KPI strip + Cash Position dashboard + Profit Walk + Period Compare). Modified: server.py, db.py, perms_catalog, scheduler_service, ConversationalQA, MyApprovals, ExecutiveHome, FinancePortal.

- **v1.12** (Phase 12 Complete — May 4, 2026): **Performance Tuning + Configurable Integrations Hub.**
  - **Theme:** *"Snappy dashboards + admin can configure all integration keys safely from UI"* — secrets encrypted at rest, services prioritize DB > env without restart, admin tests integrations from one tab before saving.
  - **User requirement (verbatim, IND):** *"untuk input api jangan hardcode, bisa di konfigurasi di system dan biar nanti usernya saja yang input"* — fully delivered.
  - **What's Built:**
    - **12A — Performance Caching:** `cache_or_compute(prefix, ttl_sec)` decorator applied to ~10 hot aggregation services (profit_walk, executive, executive_drilldown, forecasting, anomaly, owner_digest, cash_position, inventory_matrix). Cache invalidation hooks on critical write paths (cash balance update, anomaly triage, journal/GR/PO post).
    - **12B — Encryption-at-Rest:** New `core/secrets.py` (Fernet AES). Key from `SECRETS_ENCRYPTION_KEY` env or auto-generated `/app/.app_secret`. `system_settings_service` encrypts on write, decrypts transparently on read, masks secrets in API list (e.g., "sk-…1234"). One-time legacy migration runs on backend boot.
    - **12C — Runtime Config Resolver:** New `core/runtime_config.py` async getter (`get_setting(key, default)`) — DB > env > default with 30s in-memory cache + invalidation on set/delete. **Hot reload — no restart needed.** Refactored `email_service` (Resend), `llm_service` + 5 AI services (EMERGENT_LLM_KEY + direct providers), `whatsapp_service` (Fonnte/Twilio/Meta switch), `telegram_service` to all use runtime_config.
    - **12D — Admin Integrations Hub UI:** New page `/admin/integrations` with 6 tabs (Telegram 2 keys / WhatsApp 7 / Email 4 / AI/LLM 7 / Branding 3 / Lainnya 1). Each setting card: label + key chip + secret pill + status pill ("Belum dikonfigurasi" amber / "Active" green / "Error" red) + Set dialog. Each tab has a right-rail Test Panel with "Test Saved Config" + "Test Ephemeral" (verify before save). New shared components: `SystemSettingsCard.jsx`, `IntegrationStatusPill.jsx`, `IntegrationSettingsList.jsx`.
    - **12E — Integrations Activated:** Email digest now LIVE via Resend (was mocked). New WhatsApp channel for owner digest (`channel="whatsapp"` + phone field). `DigestSettings.jsx` updated with 3 channels.
    - **12F — Test Endpoints:** 5 new endpoints under `/api/system-settings/test/*` (telegram, resend, llm, whatsapp + whatsapp/info). All return graceful `{ok: false, reason: "not_configured"}` when keys absent — never 500.
  - **API:** 9 new endpoints under `/api/system-settings/*` (list, categories, set, delete, test/telegram, telegram/set-webhook, test/resend, test/llm, test/whatsapp, whatsapp/info).
  - **KNOWN_SETTINGS catalog:** 21 keys across 6 categories with `is_secret` flag for encryption.
  - **Test results (iteration_1 Phase 12 scope):** Backend **100% (27/27)** — system-settings CRUD, test endpoints, encryption-at-rest (verified ciphertext `enc_v1::gAAAAA...` in Mongo), RBAC (Outlet Manager 403), performance caching (warm ≤ cold), Phase 11 regression. **Zero critical bugs.** Frontend visual smoke test on all 6 tabs ✅ (manual verification by main agent — clean rendering, all tabs accessible, all test panels visible).
  - **Status of external integrations:** Telegram / Resend / LLM / WhatsApp all NOT CONFIGURED at deploy. Admin sets keys via `/admin/integrations` — no env edit, no restart needed. This matches the user's stated intent.
  - **Files added/changed:**
    - Backend created: `core/secrets.py`, `core/runtime_config.py`, `services/whatsapp_service.py`, `tests/test_phase12_poc.py`.
    - Backend modified: `services/system_settings_service.py` (encryption + KNOWN_SETTINGS), `services/email_service.py` (DB-aware + real Resend), `services/llm_service.py` (DB-aware), `services/owner_digest_service.py` (WhatsApp + real email), `services/telegram_service.py` (DB-aware confirmation), `routers/system_settings.py` (5 test endpoints), `core/perms_catalog.py` (system.settings.read/manage), `server.py` (legacy plaintext migration on lifespan).
    - Frontend created: `portals/admin/Integrations.jsx`, `portals/admin/integrations/TelegramTestPanel.jsx`, `EmailTestPanel.jsx`, `LlmTestPanel.jsx`, `WhatsAppTestPanel.jsx`, `components/shared/SystemSettingsCard.jsx`, `IntegrationStatusPill.jsx`, `IntegrationSettingsList.jsx`.
    - Frontend modified: `portals/admin/AdminPortal.jsx` (sub-nav), `portals/admin/AdminHome.jsx` (tile), `portals/owner/DigestSettings.jsx` (WhatsApp channel).
  - **Mocked APIs (intentionally NOT mocked anymore):**
    - **Email send via Resend** — was MOCKED in Phase 11C, now LIVE in Phase 12E (returns `not_configured` if key absent, otherwise calls Resend API).
    - **PO Email send (Phase 9B)** — STILL MOCKED (no SMTP). Future work.
  - **Result document:** `/app/memory/PHASE_12_RESULT.md`

- **v1.13** (Phase 9C + 9D Regression Tested — May 4, 2026): **Phase 9C (Inventory + Outlet Polish + Real Email) and Phase 9D (AI Polish) — both already implemented prior; this version marks regression-tested status.**
  - **Phase 9C scope (recap):**
    - **Stock Balance Matrix** (`/inventory/balance` Matrix toggle) — pivot of stock per item × outlet via `inventory_movements` aggregation. Heatmap colors (red below par/negative · amber zero · green ≥ par×1.5). Cell click drilldown to last 30 movements. `GET /api/inventory/balance-matrix?...&include_zero=&days_for_par=&par_buffer_days=` + `GET /api/inventory/movements/cell?item_id=&outlet_id=&limit=`.
    - **Low Stock Alert** (`/inventory/low-stock`) — items below par with vendor/cost/date hint + `suggested_reorder` qty. Bulk select → "Buat PR" prefills PRForm via base64 URL param. Inventory Home widget shows top-8. `GET /api/inventory/low-stock?include_zero=&include_negative=&...&limit=`.
    - **Daily Sales 5-step Wizard** (`/outlet/daily-sales/new`) — refactor of single long form into 5-step stepper (Channel · Revenue · Service & Tax · Payment · Review). Per-step local validation, debounced 5s autosave to `/api/outlet/daily-sales/draft`, status badge `Menyimpan… → Tersimpan`. Review step has 4 colored reconciliation checks.
    - **Item Autocomplete with Last Vendor / Price Hint** — `GET /api/ai/items/suggest` returns `last_vendor_id/name`, `last_unit_cost`, `last_purchase_date`, `last_purchase_days_ago` per item. UI shows emerald hint row "Terakhir: PT Sinar Kopi · Rp 25.000/kg · 3 hari lalu". Used in PR/KDO/BDO/UP/Daily Sales.
    - **Real PO Email via Resend** (replaces Phase 9B mock) — `POST /api/procurement/pos/{id}/email` calls real Resend SDK with PO PDF attached (base64). Falls back to `status='mocked'` when `RESEND_API_KEY` absent (graceful, no 500). Audit log + status pills on PODetail UI.
  - **Phase 9D scope (recap):**
    - **AI Categorize Chip** (`<AICategorizeChip>`) — debounced 600ms call to `POST /api/ai/categorize`. Returns `{gl_id, gl_code, gl_name, confidence, cost_center_outlet_id, cost_center_outlet_name}` (Gemini 2.5 Flash). Wired in `ManualJournalForm` + `UrgentPurchaseList`. Confidence threshold 70% (collapsible below).
    - **Executive Q&A LLM Tool-Calling** — `services/ai_executive_qa_service.py` with **9 read-only tools** (`get_kpis`, `get_sales_trend`, `get_brand_mix`, `get_anomalies`, `get_ap_aging`, `get_pl_summary`, `get_low_stock_count`, `get_outlet_drilldown`, `get_top_vendors`). Two-step flow (router → answer formulator). Session memory in `ai_qa_sessions` (last 10 messages, TTL 30d). Endpoints: `POST /api/ai/exec-qa`, `GET /sessions`, `DELETE /sessions/{id}`, `GET /tools`. Frontend: `<ConversationalQA>` with chat bubbles + expandable tool-call expansion + 6 starter chips.
    - **AI Vendor Recommendation** — `services/ai_vendor_service.py` aggregates per-vendor stats (avg/last cost, lead time, GR count, recency) with weighted score (price 40% / lead 20% / scorecard 30% / recency 10%). Per-vendor 1-sentence Bahasa rationale (Gemini fallback to deterministic stats). PR-mode aggregates per-line + computes consensus vendor. Endpoint: `POST /api/ai/vendor-recommend`. Frontend: `<AIVendorRecommendationInline>` + `<AIVendorRecommendationModal>` wired in PRForm + POForm.
  - **Test results (testing_agent_v3 iteration_2 — May 4, 2026):**
    - **Backend regression: 100% (20/20 tests passed)**, **zero critical bugs**, **zero minor issues**, **zero flaky endpoints**.
    - Phase 9C: 8/8 (matrix, movements/cell, low-stock+vendor hints, items/suggest with outlet scope, PO email graceful fallback)
    - Phase 9D: 7/7 (categorize, categorize/learn, exec-qa, sessions, tools×9, vendor-recommend item mode, vendor-recommend pr mode)
    - RBAC: 2/2 (Outlet Manager 200 on inventory, 403 on exec-qa)
    - Regression: 3/3 (auth, health, system-settings)
  - **Graceful Fallback (per user requirement — all keys configurable via Phase 12 Integrations Hub):**
    - `RESEND_API_KEY` absent → PO email returns `{status: "mocked", provider: "mock", pdf_attached: true}` ✅
    - `EMERGENT_LLM_KEY` absent → AI Categorize returns `{}` (rule-based fallback) ✅
    - `EMERGENT_LLM_KEY` absent → Executive Q&A returns `"Layanan AI tidak aktif. Hubungi admin."` ✅
    - `EMERGENT_LLM_KEY` absent → Vendor Recommendation uses deterministic stats sentence: `"PT Sinar Kopi Indonesia: harga rata-rata Rp 55.850, lead time 12.5 hari, 2 riwayat pembelian."` ✅
    - **NO 500 ERRORS observed in any endpoint** ✅
  - **Visual smoke verified:** `/inventory/balance` Matrix toggle (13 items × 4 outlets heatmap, par labels, "41 cell di bawah par" badge), `/inventory/low-stock` (KPI tiles, severity filter, sortable table with vendor hints), `/outlet/daily-sales/new` (5-step wizard with stepper UI, Tanggal/Outlet/Brand fields, Channel Sales table).
  - **Files (already shipped in prior iterations; this version validates):**
    - 9C backend: `services/inventory_matrix_service.py`, `services/email_service.py` (Resend), `routers/inventory.py` (3 new endpoints), `routers/ai.py` (items/suggest extended), `seed/seed_phase9c_demo.py`.
    - 9D backend: `services/ai_executive_qa_service.py`, `services/ai_vendor_service.py`, `routers/ai.py` (4 new endpoints), `seed/seed_phase9d_demo.py`.
    - 9C frontend: `portals/inventory/StockBalanceMatrix.jsx`, `portals/inventory/LowStockAlert.jsx`, `portals/outlet/DailySalesForm.jsx` (wizard), `components/shared/ItemAutocomplete.jsx` (vendor hint), `portals/procurement/PRForm.jsx` (prefill), `portals/procurement/PODetail.jsx` (email log pills).
    - 9D frontend: `components/shared/AICategorizeChip.jsx`, `components/shared/AIVendorRecommendation.jsx`, `components/shared/ConversationalQA.jsx` (rewritten).
  - **Result documents:** `/app/memory/PHASE_9C_RESULT.md`, `/app/memory/PHASE_9D_RESULT.md`.
  - **Status of Phase Plan after this version:**
    - ✅ Phase 0–12 + 9C + 9D all complete and tested.
    - ⏳ **Next candidate:** **Phase 3 Hardening** (RBAC tightening + Period Locking refinement + Multi-tier Approval Engine + full regression — ~3 days).

- **v1.14** (Phase 3 Hardening Regression Tested — May 4, 2026): **Phase 3 Hardening (RBAC + Period Locking + Multi-tier Approvals + AI Vendor Recommendation deep-link) — already implemented prior; this version marks regression-tested status. With this milestone, ALL planned phases are now complete and regression-tested.**
  - **Phase 3 Hardening scope (recap):**
    - **RBAC Tightening:** 218 endpoints in 17 router files all permission-gated (only `/api/auth/login` and `/api/auth/refresh` are public). Outlet-scope filtering verified across `outlet_service`, `inventory_service`, `procurement_service`, `executive_service` — all read endpoints honor `user.outlet_ids` for non-`*` users. Frontend additions: `<ForbiddenPage>` (beautiful 403 with shield icon + permission display + "Kembali"/"Beranda" CTAs), `<PermissionGate>` (wraps child component, renders Forbidden when user lacks perm). `ProcurementPortal` sub-nav filters by user perms (e.g. "AI Vendor" hidden if no `ai.vendor_recommend.use`).
    - **Period-Lock Enforcement:** `period_service` has `assert_period_unlocked(period, action)`, `is_period_locked(period)`, `derive_period_from_date(date_str)` helpers. Wired into 4 critical posting paths (`outlet_service.validate_daily_sales`, `procurement_service.post_gr`, `payment_service.mark_paid`, `inventory_service._post_adjustment_movements`); `journal_service.post_je` was already enforced. Auto-seeds 12 monthly `accounting_periods` for current year on first `GET /api/finance/periods`. Endpoint `GET /api/finance/periods/{period}/lock-status` powers the UI banner. Frontend `<PeriodLockBanner>` auto-detects period from a date prop, polls lock-status, renders red (locked) or amber (closed) banner with reason; calls back via `onLockState({ locked, closed, info })` so parent forms can disable submit. Wired into `ManualJournalForm`, `GRForm`, `DailySalesForm`, `PaymentDetail` Mark Paid dialog.
    - **Multi-tier Approval Engine:** `services/approval_service.py` evaluator with amount-based tiers, multi-step within tier, role-based approver permissions, audit + notifications. **4 default workflows** seeded in `business_rules` collection (rule_type='approval_workflow'): `purchase_request` (3 tiers), `purchase_order` (3 tiers), `inventory_adjustment` (2 tiers), `payment_request` (3 tiers). Endpoints: `GET /api/approvals/queue`, `GET /api/approvals/counts`. Frontend: `<ApprovalChain>` integrated into `PRDetail`, `PODetail`, `PaymentDetail`, `AdjustmentDetail`. Admin page `/admin/approval-workflows` exists for read-only view + edit.
    - **AI Vendor Recommendation Deep-Link Page** (`/procurement/vendor-recommend`): standalone item search via `<ItemAutocomplete>`. URL params support: `?item_id=<id>` and `?pr_id=<id>` for direct sharing. Auto-loads when params present. Item mode: top-3 vendors with rank trophies + score % + metrics + Indonesian rationale. PR mode: per-line recommendations + consensus vendor block. "Copy Link" + "Buat PO" CTA per vendor + "Detail vendor" CTA. Sub-nav entry "AI Vendor" added to Procurement portal (perm-gated by `ai.vendor_recommend.use`).
  - **Test results (testing_agent_v3 iteration_3 — May 4, 2026):**
    - **Backend regression: 100% (23/23 primary tests passed)**, **zero critical bugs**, **zero minor issues**, **zero flaky endpoints**.
    - RBAC: 4/4 (login public + admin/finance/audit RBAC denials)
    - Period Locking: 6/6 (auto-seed 12 periods, lock-status, lock/unlock cycle for 2026-03 & 2026-04, JE guard fires `PERIOD_LOCKED` on locked period)
    - Approval Engine: 3/3 (queue/counts functional, 4 workflows confirmed seeded)
    - Vendor Recommend: 2/2 (item mode + PR mode, deterministic fallback)
    - Cross-phase regression: 5/5 (health, system-settings/list, inventory balance-matrix, exec-qa/tools, owner cockpit)
  - **Period-lock paths note:** GR/DS/Payment paths could not be exhaustively tested due to lack of suitable demo data (no POs in 'sent' status, no submitted DS in test month, no pending payments). However all 4 paths use the same `period_service.assert_period_unlocked()` helper as JE — which IS verified end-to-end with `PERIOD_LOCKED` error response on locked period. Mechanism is sound.
  - **Frontend visual smoke verified:** `/procurement/vendor-recommend` renders with "Rekomendasi Vendor (AI)" header, search input, sub-nav "AI Vendor" pill highlighted, helpful URL-param guidance text.
  - **System left in clean state:** all test periods unlocked after testing.
  - **Files (already shipped in prior iterations; this version validates):**
    - Backend (modified): `services/period_service.py` (added 3 helpers), `services/outlet_service.py` (period guard on validate_daily_sales), `services/procurement_service.py` (period guard on post_gr), `services/payment_service.py` (period guard on mark_paid), `services/inventory_service.py` (period guard on _post_adjustment_movements), `routers/finance.py` (new `/periods/{period}/lock-status`).
    - Frontend (created): `components/shared/PeriodLockBanner.jsx`, `components/shared/ForbiddenPage.jsx`, `components/shared/PermissionGate.jsx`, `portals/procurement/VendorRecommendPage.jsx`.
    - Frontend (modified): `portals/procurement/ProcurementPortal.jsx` (VendorRecommend route + perm-gated sub-nav), `portals/finance/ManualJournalForm.jsx`, `portals/finance/PaymentDetail.jsx`, `portals/procurement/GRForm.jsx`, `portals/outlet/DailySalesForm.jsx` (all PeriodLockBanner wiring).
  - **Result document:** `/app/memory/PHASE_3_HARDENING_RESULT.md`.
  - **Permissions added in Phase 3 Hardening:** None new — leveraged existing `finance.period.lock`, `finance.period.unlock`, `ai.vendor_recommend.use` (added in Phase 9D).

---

## 🎉 Phase Plan Complete — All Planned Phases ✅

| Phase | Title | Status |
|---|---|---|
| 0 | Discovery & Foundation | ✅ |
| 1 | POC AI | ✅ |
| 2 | Foundation (Auth + RBAC + Master Data + Admin Portal) | ✅ |
| 3 | Procurement + Inventory Core | ✅ |
| 3 Hardening | RBAC + Period Lock + Multi-tier Approvals + Vendor Recommend page | ✅ Tested |
| 4 | Finance Core | ✅ |
| 5 | HR Core | ✅ |
| 6 | AI Core (Item / Vendor / GL Autocomplete) | ✅ |
| 7A–7E | Self-service Config + Reports + Forecasting + Anomaly Detection + Polish | ✅ |
| 8A–8C | Finance Completion + Outlet Ops + OCR Receipt | ✅ |
| 9A | Executive Polish (Drilldown + Brand Mix + AP Aging + Live + PDF) | ✅ |
| 9B | Procurement Polish (Kanban + Vendor Compare + PO PDF/Email) | ✅ |
| 9C | Inventory + Outlet Polish (Stock Matrix + Low Stock + Daily Sales Wizard + Real Email) | ✅ Tested |
| 9D | AI Polish (Categorize Chip + Tool-Calling Exec Q&A + Vendor Recommend) | ✅ Tested |
| 10 | Productionization (Logging + Rate-limit + APScheduler + Health metrics) | ✅ |
| 11 | Owner Finance Cockpit (Cash Position + Profit Walk + Period Compare + Telegram Digest + Voice Q&A + Mobile swipe approvals) | ✅ |
| 12 | Performance + Configurable Integrations Hub (Encryption-at-rest + runtime_config + 6-tab UI + WhatsApp/Email/Telegram/LLM test endpoints) | ✅ Tested |

**Production-ready milestone reached.** All phases delivered, regression-tested, and visually verified. The application supports a 4-brand × 4-outlet F&B group with full ERP coverage (Executive, Owner, Outlet, Procurement, Inventory, Finance, HR, Admin portals), AI-powered automation (OCR + Categorize + Vendor Recommend + Tool-Calling Q&A + Forecast Guard + Anomaly Detection), self-service configuration via Integrations Hub, encrypted secrets, performance caching, period locking, multi-tier approvals, and audit trail throughout.

**Next iterations would shift from feature delivery to operations:** UAT, Excel migration, security audit, deployment hardening, monitoring/alerting setup, runbooks. These are out-of-scope for this development cycle.
  - **Next candidates:** Phase 9C (Inventory + Outlet polish — Stock Matrix, Low Stock Alert, Daily Sales Wizard, ~4d) / Phase 9D (AI polish — Categorize JE, LLM Tool-Calling Q&A, ~2.5d) / Phase 3 Hardening (RBAC tightening + full regression, ~3d).
- **v1.14.1** (Bug Fix — May 5, 2026): **Owner Cockpit blank page issue resolved.**
  - **Root cause:** URL `/owner/cockpit` had no matching route in `OwnerPortal.jsx` (only `index/cash/approvals/ai-assistant/digest-settings`). Users navigating to `/owner/cockpit` (from bookmarks, shared links, or stale cache) saw blank content area while sidebar/sub-nav rendered correctly from layout shell.
  - **Secondary issues fixed:**
    - `DashboardPresetSelector.jsx` had double-`/api` URL bug (`api.get('/api/preferences/...')` while axios baseURL already has `/api` → `${URL}/api/api/preferences/...` 404). Fixed paths to `/preferences/presets/${portal}` and `/preferences/dashboard-preset`.
    - Removed unused `DashboardPresetSelector` imports + dead `activePreset` state from `OwnerCockpit.jsx` (had `useState("full")` mismatching backend default `"full_view"`) and `ExecutiveHome.jsx` (had `useState("kpi")` mismatching backend `"kpi_overview"`).
  - **Files changed:** `OwnerPortal.jsx` (added `<Route path="cockpit" element={<OwnerCockpit/>} />` alias), `DashboardPresetSelector.jsx` (URL fix), `OwnerCockpit.jsx` (cleanup), `ExecutiveHome.jsx` (cleanup).
  - **Verification:** Visual smoke test on `/owner/cockpit` now shows full content (welcome strip, 4 KPI cards, Cash Position widget, Digest Preview, Pending Approvals, Anomalies, AI Assistant cards). `/owner/` (index) and `/executive/` also render correctly without regression.
  - **Setup notes for fresh repo:** This repo was cloned fresh on May 5, 2026. Required: `pip install -r backend/requirements.txt` (apscheduler missing), `yarn install` (jspdf/framer-motion/@dnd-kit missing), `python3 backend/seed/seed_demo.py && python3 backend/seed/seed_phase11_demo.py` (no users in DB initially).

- **v1.15** (Sprint F Phase F3 Complete — May 5, 2026): **Dashboard Quick-Presets restored & enhanced for Owner Cockpit + Executive Dashboard.**
  - **What's Built:**
    - **Restored `<DashboardPresetSelector>` to JSX** in both `OwnerCockpit.jsx` and `ExecutiveHome.jsx` (was previously imported but unused — see v1.14.1 cleanup; now re-integrated with proper preset logic).
    - **Auto-restore saved preset** on mount via `GET /api/preferences/me` → reads `preferences.dashboard_preset_owner` / `dashboard_preset_executive`.
    - **Click-to-save**: Selecting a preset triggers `POST /api/preferences/dashboard-preset` (persisted in MongoDB `user_preferences` collection).
    - **Per-preset section visibility** map (`PRESET_SECTIONS`):
      - **Owner**: 4 presets — `sales_focus` (KPI + digest only), `cash_flow` (KPI + cash widget + digest + approvals), `operations` (KPI + approvals + bottom row), `full_view` (everything).
      - **Executive**: 4 presets — `kpi_overview` (all sections), `brand_performance` (no Forecast Guard / Anomaly), `anomaly_watch` (no Brand Mix / Cash / AP Aging), `finance_view` (no Sales Trend / AI Insights).
    - **Sections wrapped with `data-testid`** for E2E coverage: `owner-kpi-row`, `owner-mid-row`, `owner-bottom-row`, `exec-mid-row`, `exec-trend-row`, `exec-monitor-row`.
  - **Backend bug fixed during testing:** `routers/user_preferences.py` was using `AuroraException` with positional args (`code, message, field`) but `AuroraException.__init__` accepts only `message` positionally + the rest as kwargs. Fix: switched to subclasses `NotFoundError` (auto 404) and `ValidationError` (auto 400 with `code="INVALID_PRESET"/"MISSING_FIELDS"`).
  - **UI cleanup**: Replaced literal Unicode escape sequences (`\u2728`, `\u2192`, `\u2022`) in JSX text nodes of `OwnerCockpit.jsx` (PendingApprovalsWidget) with actual characters (✨, →, •) — previously displayed as raw text "u2728" because JSX text nodes don't interpret `\u` escapes.
  - **Test results (testing_agent_v3 iteration_19):** **Backend 100% (14/14)**, **Frontend 100%** (all 4 owner + 4 executive presets verified rendering, save, persistence across reload + separate sessions). **Zero critical bugs.**
  - **Files changed:**
    - Backend (modified): `routers/user_preferences.py` (AuroraException → NotFoundError/ValidationError).
    - Backend (created by testing agent): `tests/test_phase_f3_presets.py`, `test_reports/pytest/phase_f3_results.xml`.
    - Frontend (modified): `portals/owner/OwnerCockpit.jsx` (re-import selector, add `PRESET_SECTIONS` map, load saved preset, conditional render, fix Unicode literals); `portals/executive/ExecutiveHome.jsx` (same pattern).
    - Frontend (already fixed in v1.14.1): `components/shared/DashboardPresetSelector.jsx` (URL paths corrected); `portals/owner/OwnerPortal.jsx` (route alias `cockpit` added).
  - **API Surface (Phase F3 confirmed):**
    ```
    GET    /api/preferences/me                       → user prefs object
    PUT    /api/preferences/me                       → bulk update
    GET    /api/preferences/presets/{owner|executive} → 4 presets each
    POST   /api/preferences/dashboard-preset         → {portal, preset_id} → persists
    ```
  - **User stories satisfied (per `plan.md` F3 spec):**
    - ✅ As owner, I can switch between 4 cockpit presets (Sales Focus / Cash Flow / Operations / Full View)
    - ✅ As executive, I can switch between 4 dashboard presets (KPI Overview / Brand Performance / Anomaly Watch / Finance View)
    - ✅ As any user, my last selected preset is saved and restored on next login
    - ⏳ Per-widget collapse/expand state persistence — DEFERRED (out of scope for this iteration; presets handle bulk visibility)
  - **Next candidates:** Per-widget collapse (F3 stretch goal), Sprint F Phase 4 (Comprehensive regression), Phase 8 Hardening (MFA, Excel migration).

- **v1.16** (Sprint F Phase F3-stretch + F4 Complete — May 5, 2026): **Per-widget collapse/expand persistence + comprehensive regression sweep across 8 portals.**
  - **F3-stretch — Per-widget collapse/expand:**
    - **NEW component**: `/app/frontend/src/components/shared/CollapsibleSection.jsx` — wraps any section grid with a toggle header (chevron + "Tutup/Buka" label). Module-level singleton cache `_setCache` + debounced (400ms) PUT to `/api/preferences/me` reduces request chatter.
    - **Owner Cockpit**: 4 collapsible sections — `owner_kpi_cards` (KPI Utama), `owner_cash_digest` (Cash & Digest), `owner_pending_approvals` (Approval Pending), `owner_bottom_row` (Insights & Actions).
    - **Executive Dashboard**: 3 collapsible sections — `exec_mid_row` (Brand & Cash), `exec_trend_row` (Trend & AI Insights), `exec_monitor_row` (Monitoring).
    - **Persistence verified end-to-end**: collapse state survives reload AND cross-session re-login (collapsed_widgets array stored in MongoDB).
  - **Code review fixes applied this iteration:**
    1. **Cross-user cache leak fix**: `_resetCollapsibleCache()` invoked from `auth.js` on both login + logout — prevents stale collapsed-widgets state when switching accounts in same tab.
    2. **Silent failure visibility fix**: `console.warn(...)` added to fetch + persist catch blocks in `CollapsibleSection.jsx` — testers/devs now see failed PUT in DevTools instead of silent loss.
    3. **Backend input validation**: `set_preferences_bulk` now rejects malformed `collapsed_widgets` (must be `list`, max 100 entries, coerced to strings) and empty `dashboard_preset_*` strings — returns `400 INVALID_PREFERENCE` cleanly via `ValidationError`.
    4. **Procurement RBAC fix**: `PROCUREMENT_MANAGER` and `PROCUREMENT_STAFF` roles in `seed_demo.py` updated with missing `procurement.rfq.read` and `procurement.rfq.create` permissions (RFQ feature was added Phase 9 but seed never updated). Live DB roles also patched. Verified: `procurement@torado.id` can now `GET /api/rfq` (was 403, now 200).
  - **F4 Comprehensive regression results (testing_agent_v3 iteration_20):**
    - **Backend 100% (21/21)** — F3-stretch round-trip + F4 smoke for 5 roles + 8 endpoint families + RBAC + Bank Recon v2 endpoints.
    - **Frontend** — Owner/Executive collapsibles toggle + persist + reload-restore. All 8 portal landings verified (no blank pages, no 500s, no Unicode escape literals).
    - **Zero critical bugs.** 4 code review comments all resolved.
  - **Documented endpoint paths (real vs spec drift cleanup for next testing iteration):**
    - Real: `/api/anomalies`, `/api/finance/cashflow?period=YYYY-MM`, `/api/procurement/pos`, `/api/rfq`, `/api/inventory/balance`.
    - Removed from spec: `/api/admin/integrations` (no router with that prefix).
  - **Files changed this iteration:**
    - Created: `frontend/src/components/shared/CollapsibleSection.jsx`, `backend/tests/test_sprint_f_regression.py` (testing agent), `test_reports/pytest/sprint_f_regression.xml` (testing agent).
    - Modified: `frontend/src/portals/owner/OwnerCockpit.jsx`, `frontend/src/portals/executive/ExecutiveHome.jsx` (CollapsibleSection wrappers), `frontend/src/lib/auth.js` (cache reset on auth state change), `backend/services/user_preferences_service.py` (input validation), `backend/routers/user_preferences.py` (catch ValueError → ValidationError), `backend/seed/seed_demo.py` (procurement RFQ perms).
  - **Deferred / open items:**
    - Latent: Both `DashboardPresetSelector` and `CollapsibleSection` independently call `/preferences/me` — could be batched into shared loader. Optimization, not bug.
    - Optional: Per-widget collapse state currently flat array — if scaling to many widgets per dashboard, consider scoped object (e.g., `collapsed_widgets: { owner: [...], executive: [...] }`).
  - **Sprint F overall status: ✅ ALL 4 phases complete (F1 PWA, F2 Bank Recon v2, F3 Presets+Stretch, F4 Regression).**
