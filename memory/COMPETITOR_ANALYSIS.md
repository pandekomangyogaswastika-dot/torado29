# Aurora F&B — Competitor Analysis & Improvement Recommendations

**Dokumen ID:** `COMPETITOR_ANALYSIS.md`
**Versi:** 1.0
**Tanggal:** 28 April 2026
**Author:** E2 (Engineering)
**Reviewers:** TBD
**Status:** Strategic Analysis — *Informational only, tidak mengubah kode.*

---

## 0. Executive Summary

Aurora F&B (Torado Group ERP) saat ini berada di posisi **"all-in-one Indonesian F&B ops platform"** — sesuatu yang **tidak dimiliki competitor manapun secara end-to-end**. Tetapi competitor di pasar global dan Indonesia sudah unggul di **3 area inti F&B** yang Aurora belum sentuh sama sekali:

1. **Recipe BOM + Theoretical-vs-Actual food cost variance** (industry-standard di R365, Crunchtime, MarketMan, MarginEdge — Aurora **belum punya recipe model**)
2. **POS / Delivery aggregator integration** (Klikit, ESB, ScaleOcean punya native sync ke GoFood/GrabFood/ShopeeFood — Aurora hanya simpan kode payment method, tidak sync)
3. **Labor scheduling + AI labor forecasting** (R365, Crunchtime sudah AI-driven dengan akurasi 99% — Aurora HR hanya record events, tidak schedule shifts)

Sebaliknya Aurora **secara meaningful unggul** di:
- **Multi-tier approval engine self-configurable** (rare di SME tier)
- **AI tool-calling Executive Q&A** (hanya Oracle Smart Assistant 2026 yang setara)
- **Indonesian compliance built-in** (PSAK COA, period locking sesuai PSAK 1, audit log lengkap, soft-delete dengan partial index)
- **Productionization native** (post-Phase 10: structured logging, rate limiting, scheduler, archival — kebanyakan SaaS competitor outsource ini ke Datadog/Sentry)

**Bottom line:** Aurora siap menjadi *backbone ERP* untuk F&B chain mid-market Indonesia (3–50 outlet), tetapi untuk benar-benar *replace* R365/Crunchtime/Mekari ecosystem perlu menambah **3 modul kritis F&B-spesifik** dan **1 platform integration** yang sekarang menjadi "table stakes" di industri.

---

## 1. Competitor Landscape

### 1.1 Tier 1 — Global Restaurant ERP Specialist

| Competitor | HQ | Target | Penggunaan |
|---|---|---|---|
| **Restaurant365 (R365)** | Texas, USA | Multi-unit chains 5–500 outlet | 52,000+ restoran |
| **Crunchtime** | Boston, USA | Enterprise chains, QSR/casual | 850 brands, 150,000 outlet |
| **MarketMan** | NYC, USA | SME 1–20 outlet | Independent restaurants |
| **xtraCHEF (by Toast)** | NYC, USA | Toast POS users | Bundled with Toast |
| **MarginEdge** | DC, USA | Multi-unit independents | 60+ POS integrations |
| **Oracle NetSuite Restaurant Ops** | CA, USA | Enterprise multi-brand | Released Mar 2026 |

### 1.2 Tier 2 — General ERP yang Banyak Diadopsi F&B

| Competitor | HQ | Catatan |
|---|---|---|
| **Oracle NetSuite** (general + Restaurant Ops module) | USA | Strong for multi-entity, multi-currency |
| **Microsoft Dynamics 365 Business Central** | USA | Common for chain >50 outlet |
| **Odoo** | Belgium | Open-source, BOM-strong, mid-market |
| **SAP Business One** | Germany | Enterprise-heavy |

### 1.3 Tier 3 — Indonesia-Specific (POS-first / Accounting-first)

| Competitor | Tipe | Posisi |
|---|---|---|
| **Mekari Jurnal** + Jurnal Touch / Mekari POS | Cloud accounting + POS ecosystem | Strongest Indonesian accounting; ekosistem terlengkap (HR Talenta, Klikpajak, CRM Qontak) |
| **Accurate Online** + Accurate POS | Cloud accounting + POS | PSAK-strict, distribusi-strong |
| **Majoo** | All-in-one POS + lite accounting | F&B retail multi-cabang, easy POS |
| **MOKA POS** | Cloud POS | F&B retail; integrate ke Jurnal untuk akunting |
| **Pawoon** | Cloud POS | Cafe, SME |
| **Olsera** | Cross-platform POS (Android/iOS/Windows) | Omnichannel, e-commerce sync |
| **Beepos** | POS retail/F&B | Stock + accounting integrated |
| **Klikit** | POS + delivery aggregator | **Native sync** ke GoFood/GrabFood/ShopeeFood |
| **ESB POS** | F&B-focused POS | AI dashboard, omnichannel, loyalty |
| **ScaleOcean ERP** | F&B ERP Indonesia | End-to-end, native online food integrasi |
| **Runchise** | Franchise-focused F&B | Multi-outlet, KDS, online delivery |

### 1.4 Tier 4 — AI-First Niche (emergent 2025–2026)

| Competitor | Spesialisasi |
|---|---|
| **OpSage by CONVX** | AI anomaly detection across F&B operations |
| **Loman.ai** | AI predictive analytics for F&B |
| **GRUBBRR** | AI automation (2026 guide) |
| **Bytes AI / Supy** | AI demand forecasting |
| **Momos** | AI for review intelligence + anomaly |

---

## 2. Aurora F&B — Current Capability Snapshot (post Phase 10)

### 2.1 Modules Built ✅

| Modul | Coverage | Highlight |
|---|---|---|
| **Auth + RBAC** | Production-grade | JWT + refresh, 100+ permissions, 15 default roles, multi-portal scope |
| **Master Data** | 8 entitas | Brand · Outlet · Item · Vendor · Customer (none) · Employee · COA · Tax Code · Payment Method · Number Series |
| **Outlet Operations** | 90% PRD | Daily sales (5-step wizard), Petty Cash, Urgent Purchase, KDO/BDO, Daily Close, FOC, Opname session |
| **Procurement** | 95% PRD | PR · PO · GR · Kanban Workboard · Vendor Comparison · Vendor Scorecard · PO PDF · PO Email (real Resend) |
| **Inventory** | 88% PRD | Stock Balance Matrix, Movements, Transfers, Adjustments, Opname (count → variance → adjust → JE), Low Stock Alert |
| **Finance** | 95% PRD | JE, AR, AP, PAY (Payment Request), BS, P&L, Cashflow, Bank Recon, Tax PPN, Period Closing Wizard, Period Lock |
| **HR** | 75% PRD | Employee Master, Advances + Installments, Service Charge calc, Incentive (Schemes + Runs), Voucher issue/redeem, FOC, LB Fund Ledger, Payroll Cycle |
| **Executive Dashboard** | 90% PRD | KPIs, Trends, Brand Drilldown, Outlet Drilldown, Brand Mix, AP Aging, Anomaly Feed, AI Insights, AI Q&A (LLM tool-calling) |
| **AI Features** | 7 endpoints | Item suggest · Vendor suggest · Categorize JE/Urgent · OCR Receipt (Gemini) · Executive Q&A · Vendor Recommend · Anomaly LLM Explainer (parsial) |
| **Approval Engine** | Production | Multi-tier configurable; 4 default workflows (PO, PR, Manual JE, EA); state machine, approval log |
| **Business Rules** | Editable | Period locking strategy, anomaly thresholds, sales schemas, petty cash policies, service charge policies, incentive schemes |
| **Anomaly Detection** | 4 detectors | Sales drop, Vendor price spike, Vendor lead time, AP-cash mismatch |
| **Forecasting** | 3 streams | Sales 13-week (per-outlet, per-brand), Inventory consumption, Cashflow (P&L based) |
| **Reporting** | 6 reports | TB, P&L, BS, Cashflow, Pivot, Comparatives |
| **Productionization (Phase 10)** | Production-grade | Structured JSON logs, X-Request-ID, Rate limiting (login/ai/api buckets), Scheduler (6 jobs), Archival, Operations Console UI |

### 2.2 Stack Foundation ✅
- **Backend:** FastAPI + Motor (async MongoDB) + APScheduler + Pydantic
- **Frontend:** React 19 + Vite/CRA + Tailwind + shadcn/ui + framer-motion + react-query (provider exists, hooks not yet adopted)
- **Auth:** JWT + refresh + RBAC fine-grained
- **AI:** Emergent Universal LLM key (GPT/Claude/Gemini), Gemini Vision OCR
- **Email:** Resend (graceful mock fallback)

---

## 3. Feature-by-Feature Comparison Matrix

Legend: ✅ = full, 🟡 = partial / parsial, ❌ = missing, n/a = not applicable

### 3.1 Core F&B Operational Features

| # | Feature | Aurora | R365 | Crunchtime | MarketMan | Mekari Ecosystem | Klikit/ESB | Catatan |
|---|---|---|---|---|---|---|---|---|
| 1 | Multi-outlet, multi-brand | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Aurora kompetitif penuh |
| 2 | Daily sales recording | ✅ Wizard 5-step (manual entry) | ✅ Auto from POS | ✅ Auto from POS | ✅ Auto from POS | ✅ Auto from POS | ✅ Native | **GAP: tidak auto-sync POS** |
| 3 | Petty Cash management | ✅ Detail | 🟡 Basic | 🟡 Basic | 🟡 Basic | ✅ | 🟡 Basic | Aurora unggul (per-outlet flow) |
| 4 | Urgent Purchase (cash) | ✅ Detail | 🟡 Generic invoice | 🟡 Generic | ❌ | ❌ | ❌ | **Aurora unggul** (Indonesian SOP-aware) |
| 5 | KDO/BDO (Operational + Building) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **Aurora unique** |
| 6 | Daily Close (outlet shift end) | ✅ | ✅ | ✅ | 🟡 | ❌ | 🟡 | Kompetitif |
| 7 | **Recipe BOM (ingredients per menu item)** | ❌ | ✅ | ✅ | ✅ | 🟡 BOM (manuf, bukan F&B-specific) | 🟡 | 🔴 **GAP KRITIS — table stakes industri** |
| 8 | **Theoretical vs Actual food cost variance** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | 🔴 **GAP KRITIS** |
| 9 | **Prime cost % tracking (food+labor)** | ❌ | ✅ | ✅ | 🟡 | ❌ | ❌ | 🔴 GAP |
| 10 | **Menu engineering (stars/dogs)** | ❌ | ✅ | ✅ | 🟡 | ❌ | ❌ | 🟡 GAP medium (insight) |
| 11 | **Waste tracking + analytics** | 🟡 (FOC manual) | ✅ | ✅ | ✅ | 🟡 | 🟡 | GAP medium |
| 12 | Inventory: opname/stock take | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Kompetitif |
| 13 | Inventory: transfers between outlets | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 | Kompetitif |
| 14 | Stock balance matrix view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Kompetitif |
| 15 | Low stock alert + auto PR | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | Kompetitif |
| 16 | Procurement: PR/PO/GR multi-tier approval | ✅ Self-serviceable | ✅ | ✅ | 🟡 | ✅ Talenta-bound | 🟡 | **Aurora unggul** (workflow editor) |
| 17 | Vendor scorecard + comparison | ✅ | ✅ | ✅ | 🟡 | ❌ | ❌ | Kompetitif |
| 18 | 3-Way Match (PO ↔ GR ↔ Invoice) | 🟡 (parsial via service) | ✅ | ✅ | 🟡 | ✅ | 🟡 | GAP — perlu dashboard explicit |
| 19 | AP Aging + AR Aging | ✅ | ✅ | ✅ | 🟡 | ✅ | 🟡 | Kompetitif |
| 20 | Bank Reconciliation | ✅ CSV/XLSX upload | ✅ Auto API | ✅ Auto API | ❌ | ✅ Bank API (BCA, BRI, dll) | ❌ | GAP — auto bank feed API |
| 21 | Period Locking + Closing Wizard | ✅ Self-serviceable | ✅ | ✅ | ❌ | ✅ | ❌ | **Aurora unggul** vs SME tier |
| 22 | Tax compliance (PPN, e-Faktur) | 🟡 (PPN code, JE) | n/a (US tax) | n/a | n/a | ✅ Klikpajak | 🟡 | GAP — e-Faktur / DJP integration |
| 23 | Multi-currency | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | GAP (low priority for Aurora) |

### 3.2 AI / Analytics Features

| # | Feature | Aurora | R365 | Crunchtime | OpSage | Oracle NetSuite | Catatan |
|---|---|---|---|---|---|---|---|
| 1 | OCR Receipt → JE/Petty Cash | ✅ Gemini | ✅ | ✅ | ❌ | ✅ | Kompetitif |
| 2 | AI Categorization (JE/Urgent) | ✅ LLM | 🟡 ML rules | 🟡 | ❌ | ✅ | Kompetitif |
| 3 | Vendor Recommendation | ✅ LLM | 🟡 | 🟡 | ❌ | 🟡 | **Aurora unique** |
| 4 | Anomaly Detection | ✅ 4 detectors | ✅ | ✅ | ✅ Best-in-class | ✅ | Aurora kompetitif |
| 5 | Sales Forecasting (13-week) | ✅ Statistical | ✅ ML 99% accuracy | ✅ ML 99% accuracy | ❌ | ✅ ML | 🟡 GAP — Aurora masih moving avg |
| 6 | Demand forecasting (per-item) | ❌ | ✅ | ✅ | ❌ | ✅ | GAP |
| 7 | Cashflow forecasting | ✅ | ✅ | 🟡 | ❌ | ✅ | Kompetitif |
| 8 | LLM Tool-calling Q&A | ✅ Phase 9D | ❌ | ❌ | 🟡 | ✅ Smart Assistant 2026 | **Aurora unggul** (hanya 2-3 ERP yang punya ini) |
| 9 | Personalized recommendations | 🟡 | ✅ | ✅ | ❌ | ✅ | GAP medium |
| 10 | Voice-to-text inventory count | ❌ | 🟡 | ✅ | ❌ | 🟡 | 🟢 GAP low (nice-to-have) |
| 11 | Image-based stock recognition (RFID/CV) | ❌ | 🟡 | 🟡 | ❌ | 🟡 | 🟢 GAP very low |
| 12 | Variance explainer (LLM root cause) | 🟡 anomaly explainer | ✅ | ✅ | ✅ Best-in-class | ✅ | GAP — bisa di-extend |

### 3.3 Integration & Ecosystem

| # | Feature | Aurora | R365 | Crunchtime | Klikit/ESB | Mekari | Catatan |
|---|---|---|---|---|---|---|---|
| 1 | POS integration (Toast/Aloha/Square) | ❌ | ✅ Native | ✅ Native | ✅ ESB own POS | ✅ Mekari POS | 🔴 **GAP KRITIS GLOBAL** |
| 2 | **GoFood / GrabFood / ShopeeFood** | ❌ | n/a | n/a | ✅ Klikit native | 🟡 via Desty | 🔴 **GAP KRITIS INDONESIA** |
| 3 | Bank feed API (BCA, Mandiri, BRI) | ❌ | ✅ US banks | ✅ US banks | ❌ | ✅ Native | 🟡 GAP |
| 4 | Payroll provider sync | ❌ | ✅ ADP, Gusto | ✅ | ❌ | ✅ Talenta | 🟡 GAP |
| 5 | Webhook outbound API | ❌ | ✅ | ✅ | ✅ | ✅ | GAP — needed for ecosystem |
| 6 | Public REST API for partners | 🟡 internal-only | ✅ | ✅ | ✅ | ✅ | GAP |
| 7 | iPaaS / Zapier integration | ❌ | ✅ | 🟡 | 🟡 | ✅ | 🟢 GAP low |
| 8 | Mobile native app | ❌ PWA only | ✅ iOS+Android | ✅ iOS+Android | ✅ | ✅ | 🟡 GAP medium |
| 9 | Bulk Excel import (master data) | ❌ | ✅ | ✅ | 🟡 | ✅ | 🟡 GAP — important onboarding |
| 10 | E-Faktur / DJP-online integration | ❌ | n/a | n/a | 🟡 | ✅ Klikpajak | 🟡 GAP — Indonesia tax compliance |

### 3.4 Operations & Workforce

| # | Feature | Aurora | R365 | Crunchtime | Mekari Talenta | Catatan |
|---|---|---|---|---|---|---|
| 1 | Employee master | ✅ | ✅ | ✅ | ✅ | Kompetitif |
| 2 | Employee Advances + amortization | ✅ | 🟡 | 🟡 | ✅ | **Aurora unggul** (Indonesian SOP) |
| 3 | Service Charge calc + journal | ✅ | ❌ (US tip pool different) | ❌ | 🟡 | **Aurora unggul** (Indonesian-spesifik) |
| 4 | Incentive (KPI-based runs) | ✅ | 🟡 | 🟡 | ✅ | Kompetitif |
| 5 | Voucher / FOC management | ✅ | 🟡 | 🟡 | 🟡 | **Aurora unggul** |
| 6 | **Labor scheduling (shift roster)** | ❌ | ✅ AI 99% acc | ✅ AI 99% acc | ✅ | 🔴 GAP HIGH |
| 7 | **Shift swap / availability mgmt** | ❌ | ✅ | ✅ | ✅ | 🟡 GAP |
| 8 | Time-clock / attendance | ❌ | ✅ | ✅ | ✅ | 🟡 GAP |
| 9 | Labor cost forecasting | ❌ | ✅ | ✅ | 🟡 | 🟡 GAP |
| 10 | Multi-state/labor law compliance | ❌ (Indonesia only) | ✅ | ✅ | ✅ Indonesia | 🟢 GAP low |
| 11 | Training / SOP / checklist | ❌ | ✅ | ✅ | 🟡 | 🟢 GAP nice-to-have |

### 3.5 Customer Experience / CRM

| # | Feature | Aurora | R365 | ESB/Klikit | MOKA/Majoo | Catatan |
|---|---|---|---|---|---|---|
| 1 | Customer master | ❌ | 🟡 | ✅ | ✅ | 🟡 GAP |
| 2 | Loyalty program | ❌ | 🟡 | ✅ | ✅ | 🟡 GAP |
| 3 | Customer feedback / review | ❌ | 🟡 | 🟡 | 🟡 | 🟢 GAP low |
| 4 | Online ordering / table reservation | ❌ | 🟡 | ✅ | ✅ | 🟢 GAP very low (out of scope ERP) |

### 3.6 Productionization & Developer Experience

| # | Feature | Aurora | R365 | Crunchtime | Catatan |
|---|---|---|---|---|---|
| 1 | Structured JSON logging | ✅ Phase 10 | n/a SaaS | n/a SaaS | **Aurora pioneer** for self-host |
| 2 | Rate limiting | ✅ Phase 10 | n/a SaaS | n/a SaaS | Aurora unggul |
| 3 | Background scheduler | ✅ Phase 10 (6 jobs) | n/a SaaS | n/a SaaS | Aurora unggul |
| 4 | Operations console UI | ✅ Phase 10 | n/a (admin only on internal tools) | n/a | **Aurora unique** for self-host |
| 5 | Audit log full-text search | 🟡 (basic filter) | ✅ | ✅ | GAP minor |
| 6 | Multi-tenant ready | ❌ Single-tenant | ✅ | ✅ | 🟢 Out of scope (Torado-only) |
| 7 | CI/CD pipeline | ✅ Phase 10 (.github/workflows) | n/a internal | n/a internal | Kompetitif |
| 8 | Open source / self-hostable | ✅ | ❌ Proprietary | ❌ Proprietary | **Aurora unique** strategic positioning |

---

## 4. Deep Dive — 5 Competitors Paling Relevan

### 4.1 Restaurant365 (R365) — *Direct Reference Point*
**Strength:**
- **AI-first** strategy (2026 push: forecasting 99% accuracy, prompt-based dashboard, generative insights).
- **Recipe & Theoretical food cost** core feature with ROI claim "5% food cost reduction → 2% net profit boost".
- **Location Groups** for centralized reporting + intercompany transactions.
- **Native POS sync** (Toast, Aloha, US Foods).
- Mobile app (iOS/Android).

**Weakness:**
- US-centric: tax, labor law, vendor catalog, payroll.
- Heavy onboarding (20+ invoices required to populate inventory analytics).
- Pricing: enterprise tier ($300+/outlet/month).
- Tidak ada public price untuk Indonesia market.

**What Aurora can borrow:**
- ✅ Recipe BOM (Item → ingredients with quantities + UoM).
- ✅ Theoretical vs Actual variance report (per outlet, per period, per item).
- ✅ Prime cost dashboard.
- ✅ Sales-driven labor forecasting.

---

### 4.2 Crunchtime — *Enterprise Multi-Unit Reference*
**Strength:**
- **AI labor scheduling** with 99% forecast accuracy.
- **Lot tracking** (commissary / central kitchen support).
- **Employee training + checklists** module.
- **Voice-to-text inventory count** (sebelum scanning).

**Weakness:**
- **Lower ease-of-use** (7.6/10 vs MarketMan 9.2) — UI redundancies.
- Custom pricing only — heavy enterprise sales cycle.
- Long implementation (3–6 bulan typical).

**What Aurora can borrow:**
- ✅ Labor scheduling module (already has Employee + Incentive — extend with shifts).
- ✅ Voice input untuk opname (low-cost via Web Speech API + Whisper).
- ✅ Training/checklist module untuk SOP enforcement.

---

### 4.3 MarketMan — *SME Friendly Inventory*
**Strength:**
- **Highest user-rating 9.6/10** for ease of use.
- **Mobile-first** for inventory counts.
- **Pricing**: $199/mo Starter — terjangkau untuk SME.
- **Recipe costing** native sejak entry tier.

**Weakness:**
- **No labor scheduling** (single-purpose).
- **No accounting GL** (rely on Xero/QBO sync).
- **Support delays** (per G2 reviews).

**What Aurora can borrow:**
- ✅ Mobile-first opname UX (Aurora has stock balance, but opname session UI bisa lebih mobile-friendly).
- ✅ Recipe costing as standalone feature (not tied to full ERP).

---

### 4.4 Mekari Jurnal Ecosystem — *Indonesia Reference*
**Strength:**
- **Strongest Indonesian compliance**: PSAK, Klikpajak (e-Faktur), bank feed API (BCA, BRI, Mandiri, dll).
- **Ecosystem play**: Jurnal (akunting) + Mekari Talenta (HR) + Qontak (CRM) + Klikpajak (tax) + Jurnal Touch / Mekari POS / Desty (POS) + Flex (payroll).
- **Bank reconciliation auto via API** (>10 banks Indonesia).
- **Multi-currency**.

**Weakness:**
- **Akuntansi-first**: F&B operasional features (recipe, opname, kitchen) terbatas; F&B users harus pake ekosistem multi-product.
- **Modular pricing** mahal kalau adopt full stack (Jurnal Enterprise + Talenta Pro + Klikpajak = Rp 5+ jt/bulan for mid-size).
- **Vendor lock-in**: integrasi terbaik kalau pake semua produk Mekari.

**What Aurora can borrow:**
- ✅ Bank feed API integration (BCA / Mandiri / BRI / BNI).
- ✅ Klikpajak / e-Faktur integration (or DJP Coretax direct).
- ✅ Multi-tenant architecture (jika monetisasi).

---

### 4.5 Klikit / ESB POS — *Indonesia Delivery-Native*
**Strength:**
- **Native sync** ke GoFood, GrabFood, ShopeeFood, Tokopedia Now, Traveloka Eats.
- **Single dashboard** untuk multi-platform orders.
- **Real-time menu sync** (price update di 1 platform → push ke semua).
- **Pricing**: Rp 390k/bulan/outlet (Klikit) — aksesibel untuk SME.

**Weakness:**
- **POS-first**: akunting + inventory + procurement minim (dependent ke ekosistem lain).
- **Tidak ada multi-tier approval** atau workflow editor.
- **Tidak ada period locking** atau finance closing wizard.

**What Aurora MUST borrow:**
- 🔴 **Critical**: GoFood / GrabFood / ShopeeFood integration via API atau partnership Klikit/ESB.
- ✅ Single dashboard untuk delivery orders aggregation.
- ✅ Real-time menu price sync.

---

## 5. Aurora's Unique Differentiators (Defendable Moats)

Aurora unggul (atau setara dengan only-one-other) di **6 area**:

| # | Differentiator | Why It Matters |
|---|---|---|
| 1 | **All-in-one Indonesian-localized** (Procurement + Inventory + Finance + HR + AI dalam 1 platform) | Tidak ada competitor lokal yang punya semua. R365 tidak Indonesia-aware. Mekari ekosistem fragmentasi. |
| 2 | **Multi-tier approval engine self-serviceable** | UI Workflow Editor + Business Rules Editor — kebanyakan SaaS ERP requires consultant untuk setup. |
| 3 | **AI Tool-calling Executive Q&A** | Hanya Oracle Smart Assistant 2026 yang setara. Aurora sudah punya ini di Phase 9D. |
| 4 | **Indonesian SOP-aware modules**: KDO/BDO, Urgent Purchase, Service Charge, EA Amortization, FOC, Voucher | Sangat-Indonesia-spesifik. Tidak ada di global ERP. |
| 5 | **Productionization native** (logs, rate limit, scheduler, archival, ops console) | Aurora self-host, sebagian besar competitor SaaS-only — Anda bayar per outlet, mereka kontrol stack. |
| 6 | **Vendor Recommendation AI** | Rare di SME tier; Aurora punya Phase 9D. |

---

## 6. Critical Gaps — Tier Klasifikasi

### 6.1 🔴 Tier 1: TABLE-STAKES F&B (must-have to be credible F&B ERP)

| # | Gap | Effort | ROI | Justifikasi |
|---|---|---|---|---|
| **T1-A** | **Recipe BOM model + endpoints** | 4 days | Very High | Tanpa ini, Aurora **tidak bisa disebut F&B ERP**. Industry standard di R365, Crunchtime, MarketMan, MarginEdge. |
| **T1-B** | **Theoretical vs Actual food cost variance report** | 2 days | Very High | Konsekuensi langsung dari T1-A. Top KPI yang ditanya CFO/Owner di setiap chain mid-market. |
| **T1-C** | **POS integration** (Toast / Square minimal stub + Indonesia: ESB / Mekari POS / MOKA) | 5 days | Very High | Daily sales sudah di Aurora; perlu auto-sync dari POS. Manual entry adalah dealbreaker. |
| **T1-D** | **Delivery aggregator integration** (GoFood + GrabFood + ShopeeFood) — **Indonesia must-have** | 5 days (2 platforms minimum) | Very High | Setiap restoran Indonesia >5 outlet pakai aggregator. Klikit punya, Aurora belum. |

**Total Tier 1: ~16 hari kerja**

### 6.2 🟡 Tier 2: HIGH VALUE F&B (significantly enhances competitive positioning)

| # | Gap | Effort | ROI |
|---|---|---|---|
| T2-A | **Prime Cost Dashboard** (Food % + Labor % vs sales, daily/weekly trend) | 1.5 days | High |
| T2-B | **Labor Scheduling module** (shifts, roster, swap requests, AI labor forecast) | 6 days | High |
| T2-C | **Menu Engineering** (stars/dogs/plowhorses/puzzles classification) | 2 days | Medium-High |
| T2-D | **Bank Feed API integration** (BCA / Mandiri / BRI minimum) | 4 days | Medium-High |
| T2-E | **e-Faktur / Coretax DJP integration** (atau via Klikpajak partnership) | 3 days | High (compliance) |
| T2-F | **Mobile native app** (React Native or Capacitor wrapper) | 8 days | Medium |
| T2-G | **Bulk Excel Import** master data (Item, Vendor, Employee, COA) | 1.5 days | High (onboarding speed) |
| T2-H | **Customer Master + Loyalty** (untuk B2B catering customers + repeat patrons) | 3 days | Medium |
| T2-I | **3-Way Match Dashboard** (variance display PO ↔ GR ↔ AP Invoice) | 1 day | Medium |
| T2-J | **Variance Explainer LLM** for opname variance + sales drop | 1.5 days | Medium-High |
| T2-K | **Demand forecasting per-item** (sebagai input procurement auto-PR) | 3 days | Medium |

**Total Tier 2: ~35 hari kerja**

### 6.3 🟢 Tier 3: NICE-TO-HAVE Polish & Competitive Parity

| # | Gap | Effort | ROI |
|---|---|---|---|
| T3-A | i18n (id + en) | 3 days | Low-Medium |
| T3-B | Onboarding tour (react-joyride first-login) | 1 day | Low |
| T3-C | Saved filters / views | 1 day | Low |
| T3-D | Bulk actions on lists (bulk validate, bulk approve) | 1 day | Medium |
| T3-E | Voice-to-text inventory count | 1 day | Low |
| T3-F | Email notifications real (Resend) for non-PO events | 1 day | Medium |
| T3-G | Webhook outbound API (event-driven for partners) | 2 days | Medium |
| T3-H | Public REST API + API key management | 2 days | Medium |
| T3-I | Multi-tenant architecture (jika monetisasi as SaaS) | 8 days | High *if* SaaS |
| T3-J | Training / SOP / checklist module | 4 days | Low |
| T3-K | Time-clock / attendance | 4 days | Low (overlap dengan labor scheduling) |
| T3-L | Customer feedback / review module | 2 days | Low |
| T3-M | Multi-currency support | 3 days | Low (Torado domestic only) |
| T3-N | AuditLog full-text search + CSV export | 1 day | Low |
| T3-O | Impersonate user (super admin) | 1 day | Low |
| T3-P | Vendor master detail page enhancement | 0.5 day | Low |

**Total Tier 3: ~36 hari kerja**

---

## 7. Performance Audit — Quick Wins (in scope of competitiveness)

Per `PERF_AUDIT.md` (still relevant items, post-Phase 10):

| # | Quick Win | Effort | Impact |
|---|---|---|---|
| P-1 | **GZip middleware** | 5 min | ~60-70% bandwidth reduction |
| P-2 | **Auth permission cache** (request-scoped or 5-min TTL) | 1 hr | -10-30 ms per API call |
| P-3 | **Replace `to_list(10000+)`** with aggregations (5 places) | 2 hr | AP aging 3-5× faster |
| P-4 | **Stock balance pagination** via $facet | 1 hr | 5-10× faster on big inventories |
| P-5 | **react-query useApiQuery** hook + migrate top 5 master fetches | 4 hr | Cached navigation, fewer API calls |
| P-6 | **React.memo** on heavy table rows (6 places) | 2 hr | Smoother typing in filters |

**Total P-tier: ~10 hours = 1.5 hari setara**

---

## 8. Strategic Roadmap Recommendation

Berdasarkan analisis di atas, urutan implementasi yang saya rekomendasikan:

### 🚀 Phase 11 — "Performance + F&B Foundation" (~7 hari setara)
Tujuan: kunci credibility sebagai F&B ERP + kecepatan respons production.

- **11A** Performance hardening (P-1..P-6)  → 1.5 hari
- **11B** Recipe BOM model + endpoints (T1-A)  → 4 hari
- **11C** Theoretical vs Actual food cost variance report (T1-B)  → 2 hari
- **11D** Bulk Excel Import master data (T2-G)  → 1.5 hari
- **11E** 3-Way Match Dashboard (T2-I)  → 1 hari
- **11F** Backend regression via testing_agent_v3

### 🎯 Phase 12 — "Indonesia Integration Platform" (~10 hari setara)
Tujuan: lock-in posisi sebagai Indonesia F&B ERP terbaik.

- **12A** POS integration framework + Mekari POS / MOKA stub (T1-C)  → 5 hari
- **12B** GoFood + GrabFood integration (Klikit-style aggregator) (T1-D)  → 5 hari
- **12C** Bank feed API (BCA + Mandiri minimum) (T2-D)  → 4 hari
- **12D** Variance Explainer LLM (T2-J)  → 1.5 hari

### ⚙️ Phase 13 — "Operations Excellence" (~9 hari setara)
Tujuan: enterprise-tier feature parity.

- **13A** Labor Scheduling module (T2-B)  → 6 hari
- **13B** Prime Cost Dashboard (T2-A)  → 1.5 hari
- **13C** Menu Engineering (T2-C)  → 2 hari
- **13D** Demand forecasting per-item (T2-K)  → 3 hari

### 🌟 Phase 14 — "Polish + Indonesia Compliance" (~8 hari setara)
- **14A** e-Faktur / Coretax DJP integration (T2-E)  → 3 hari
- **14B** Customer Master + Loyalty (T2-H)  → 3 hari
- **14C** Mobile native wrapper (Capacitor) (T2-F)  → 4 hari (tier-2, optional)
- **14D** i18n + Onboarding Tour + Saved Filters + Bulk Actions (T3-A..D)  → 6 hari

### Optional Phase 15+ — "SaaS-readiness"
- Multi-tenant architecture
- Public API + webhook outbound
- iPaaS / Zapier integration
- Self-service onboarding

---

## 9. Strategic Positioning Recommendations

### 9.1 Segmen Target
Berdasarkan profile fitur, Aurora paling cocok positioning:

> **"Aurora F&B — All-in-one Indonesian F&B ERP untuk multi-outlet chain (5–100 outlet)"**

Bukan kompetitor langsung untuk:
- ❌ Single-outlet kecil (oversized — pakai MOKA/Pawoon)
- ❌ Enterprise franchising 500+ outlet (under-built — pakai Crunchtime/Oracle)
- ❌ POS-only need (tidak relevant — pakai Klikit/ESB)

### 9.2 Pricing Positioning Hypothesis
- **Tier 1 (5–15 outlet):** Rp 1.5–3 jt/bulan total (vs MarketMan $199 = ~Rp 3jt for similar tier global)
- **Tier 2 (15–50 outlet):** Rp 5–10 jt/bulan total
- **Tier 3 (50+ outlet):** Custom + implementation services

### 9.3 Go-to-Market Differentiation
Urutkan messaging berdasarkan keunikan:

1. **"AI-first"** (Tool-calling Q&A, OCR, anomaly, forecasting) → wow factor untuk Owner/CFO
2. **"Self-serviceable"** (workflow editor, business rules, period lock) → pain point operations team
3. **"Indonesia compliance built-in"** (PSAK, e-Faktur*, multi-tier approval Indonesian SOP) → buyer's checklist
4. **"All-in-one"** (Procurement + Inventory + Finance + HR + AI) → procurement-cycle saver

(*pending Phase 14A implementation)

---

## 10. Quick Comparison Snapshot — TL;DR Cheat Sheet

> **"Aurora vs Best-in-Class"** — di 1 halaman:

| Dimensi | Aurora Now | Aurora After Phase 11–14 | Industry Best |
|---|---|---|---|
| **F&B Credibility** | 60% (no recipe/variance) | 90% | R365 / Crunchtime |
| **Indonesian Compliance** | 80% (no e-Faktur) | 95% | Mekari Jurnal |
| **AI Sophistication** | 75% (top 3 in market) | 90% | Oracle / R365 / Aurora |
| **Integration Ecosystem** | 30% (no POS/delivery sync) | 80% | Klikit / Mekari |
| **Operations Excellence** | 50% (no labor sched/prime cost) | 85% | Crunchtime |
| **Self-serviceability** | 95% (workflow editor unique) | 95% | **Aurora unique** |
| **Productionization** | 95% (Phase 10) | 95% | **Aurora unique** for self-host |
| **Total Score** | **70%** | **90%** | varies |

---

## 11. Final Recommendation

### Rekomendasi langkah berikutnya (dari paling-bernilai-per-hari):

1. **Phase 11A (Performance Hardening, 1.5 hari)** — zero-regression, 5–10× DB speedup, langsung dirasakan user.
2. **Phase 11B+C (Recipe BOM + Theoretical vs Actual variance, 6 hari)** — kunci credibility F&B ERP.
3. **Phase 12A+B (POS + delivery aggregator integration, 10 hari)** — kunci pasar Indonesia.

Total: **~17.5 hari kerja** untuk transformasi dari "Indonesian ops platform" → "Indonesian F&B ERP world-class". Setelah itu, Phase 13–14 (~17 hari) untuk parity penuh dengan Crunchtime/R365.

---

## 12. Sumber Referensi (Major)

- Restaurant365 docs & blog (2026)
- Crunchtime suite overview (2026)
- MarketMan / xtraCHEF / MarginEdge feature comparisons (G2, Slashdot, Operandio)
- Mekari Jurnal vs Accurate vs Majoo vs MOKA (HashMicro, Mekari blog, DialPos, ConnectPOS)
- Klikit / ESB POS Indonesia (Klikit blog, ESB.id)
- Oracle NetSuite Restaurant Operations announcement (Mar 2026)
- Industry analysts: NRN, Loman.ai, Supy, GRUBBRR (2026 AI guide)
- PERF_AUDIT.md (post Phase 5, internal)
- MODULE_ENHANCEMENT_PLAN.md (post Phase 9B, internal)

---

## 13. Sign-off & Next Action

Dokumen ini **informational only** — tidak mengubah kode.

**Next decisions yang perlu dari user/stakeholder:**

1. **Apakah strategi positioning** ("Indonesian F&B ERP for multi-outlet chains") **disetujui?**
2. **Apakah urutan Phase 11–14 sesuai?** Atau ada gap yang perlu dipromosikan/ditunda?
3. **Apakah Aurora akan tetap single-tenant** (Torado-only) atau **arah SaaS?** — keputusan ini mempengaruhi prioritas multi-tenancy + public API + webhook.
4. **Apakah ada budget untuk integrasi** dengan provider Indonesia (BCA API, Klikpajak API, GoFood API) yang umumnya butuh registration + revenue share?

---

— End of Competitor Analysis v1.0
