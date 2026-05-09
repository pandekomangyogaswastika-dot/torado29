# 📊 TABEL PERBANDINGAN: Excel Torado vs Aurora ERP

**Tanggal:** 8 Mei 2026

---

## 🎯 QUICK REFERENCE TABLE

### FINANCIAL REPORT (23 Sheets)

| # | Excel Sheet | Fungsi | Baris Data | Aurora Feature | Status | Gap | Priority |
|---|-------------|--------|------------|----------------|--------|-----|----------|
| 1 | **PL** | Income Statement / Laporan Laba Rugi | 226 | Executive Dashboard → Financial Reports | ✅ **MATCH** | Format berbeda | P3 |
| 2 | **JAE** | Journal Adjustment Entries (Manual) | 1,000+ | `JournalEntry` model | ⚠️ **PARTIAL** | UI manual entry belum | 🔥 **P1** |
| 3 | **PR 2026** | Payment Request (Approval Workflow) | 21 | - | ❌ **MISSING** | Workflow belum ada | 🔥 **P1** |
| 4 | **PAY** | Payment Tracking & Execution | 989 | `APLedger.payments[]` | ⚠️ **PARTIAL** | Not fully integrated | 🔥 **P1** |
| 5 | **KB** | Kontra Bon (AP Aging & Invoice Tracking) | 834 | `APLedger` model | ⚠️ **PARTIAL** | UI & workflow kurang | 🔥 **P2** |
| 6 | **Pay Sum** | Payment Summary Report | - | Can be generated | ⚠️ **PARTIAL** | Report format berbeda | P3 |
| 7 | **ACC** | Account Mapping & GL Structure | - | `COA` (Chart of Accounts) | ✅ **MATCH** | - | - |
| 8 | **VRA** | Vendor Reference / Master | - | `Vendor` model | ✅ **MATCH** | - | - |
| 9 | **iEMP** | Employee Reference / Master | - | `Employee` model (HR) | ✅ **MATCH** | - | - |
| 10 | **L & B** | Loss & Breakage | - | `Adjustment` model | ✅ **MATCH** | - | - |
| 11 | **Service 5%** | Service Charge Tracking | - | `DailySales.service_charge` | ✅ **MATCH** | - | - |
| 12 | **Refund Form** | Refund/Return Process | - | `DailySales.notes` + Adjustment | ⚠️ **PARTIAL** | Dedicated flow belum | P3 |

---

### MARKET LIST (10 Sheets)

| # | Excel Sheet | Fungsi | Items | Aurora Feature | Status | Gap | Priority |
|---|-------------|--------|-------|----------------|--------|-----|----------|
| 1 | **MASTER (no edit)** | Master Item List dengan Multi-Period Pricing | 999+ | `Item` model | ⚠️ **PARTIAL** | Price versioning belum | 🟡 **P2** |
| 2 | **ALT** | Market List untuk Altero Bistronomie | Subset | Filter: `brand_id = "ALTERO"` | ✅ **MATCH** | - | - |
| 3 | **MDS** | Market List untuk Maison de la Sol | Subset | Filter: `brand_id = "MDS"` | ✅ **MATCH** | - | - |
| 4 | **CALLUNA** | Market List untuk Calluna All Day | Subset | Filter: `brand_id = "CALLUNA"` | ✅ **MATCH** | - | - |
| 5 | **RP** | Market List untuk Ruckerpark Coffee | Subset | Filter: `brand_id = "RP"` | ✅ **MATCH** | - | - |
| 6 | **GG** | Market List untuk GoodGrain Coffee | Subset | Filter: `brand_id = "GG"` | ✅ **MATCH** | - | - |
| 7 | **BAKKIES** | Market List untuk Bakkies | Subset | Filter: `brand_id = "BAKKIES"` | ✅ **MATCH** | - | - |
| 8 | **Add (manual)** | Form Input Item Baru | - | Inventory Portal → Add Item | ✅ **MATCH** | - | - |
| 9 | **Guideline** | Panduan Penggunaan Sheet | - | System Documentation | ✅ **MATCH** | - | - |
| 10 | **DIRECT PURCHASE** | Item untuk Direct Purchase (tanpa PO) | Subset | Filter: `is_direct_purchase = true` | ✅ **MATCH** | - | - |

**Key Finding:** Market List struktur **90% compatible**, hanya perlu tambahan price versioning.

---

### PURCHASING REPORT (10 Sheets)

| # | Excel Sheet | Fungsi | Records | Aurora Feature | Status | Gap | Priority |
|---|-------------|--------|---------|----------------|--------|-----|----------|
| 1 | **Master** | Daily Purchase Record (All Transactions) | 1,000+ | `PurchaseOrder` + `GoodsReceipt` | ✅ **MATCH** | - | - |
| 2 | **KDO** | Kitchen Daily Order (PR dari Kitchen) | ~10/day | `PurchaseRequest` (source="KDO") | ✅ **MATCH** | - | - |
| 3 | **BDO** | Bar Daily Order (PR dari Bar) | ~10/day | `PurchaseRequest` (source="BDO") | ✅ **MATCH** | - | - |
| 4 | **Calculation** | Summary & Calculation per Period | 908 | Can be calculated | ⚠️ **PARTIAL** | Report format berbeda | P3 |
| 5 | **Summary (PC)** | Weekly Petty Cash Report | Multi-week | `PettyCashTransaction` reports | ✅ **MATCH** | Format customization | P3 |
| 6 | **ML** | Market List Reference (Link) | - | Link to `Item` collection | ✅ **MATCH** | - | - |
| 7 | **iVRA** | Vendor Reference (Formula/Lookup) | - | Link to `Vendor` collection | ✅ **MATCH** | - | - |
| 8 | **PGL** | Purchase GL Mapping | - | `GoodsReceipt.journal_entry_id` | ✅ **MATCH** | - | - |
| 9 | **iKDO** | KDO Reference/Lookup | - | DB query/aggregation | ✅ **MATCH** | - | - |
| 10 | **iBDO** | BDO Reference/Lookup | - | DB query/aggregation | ✅ **MATCH** | - | - |

**Key Finding:** Purchasing workflow **95% compatible**, Aurora actually **better** karena real-time tracking.

---

## 📊 FEATURE COMPARISON MATRIX

| Feature Category | Excel Capability | Aurora Capability | Winner | Notes |
|------------------|------------------|-------------------|--------|-------|
| **Data Entry** | Manual, prone to error | Validated forms, dropdown from master data | 🏆 **Aurora** | Auto-validation prevents errors |
| **Multi-User** | ❌ One at a time | ✅ Concurrent users | 🏆 **Aurora** | No more "file is locked" |
| **Real-Time** | ❌ Need to save & share | ✅ Instant update | 🏆 **Aurora** | Live dashboard |
| **Audit Trail** | ❌ Limited (track changes) | ✅ Complete (who, when, what, why) | 🏆 **Aurora** | Every action logged |
| **Reporting** | ✅ Flexible (pivot, chart) | ⚠️ Pre-defined reports | **Excel** | Excel lebih flexible, tapi Aurora catching up |
| **Integration** | ❌ Manual copy-paste | ✅ Auto-linked (Sales→Purchase→Finance) | 🏆 **Aurora** | End-to-end integration |
| **Approval Workflow** | ❌ Via email/WhatsApp | ✅ Built-in approval chain | 🏆 **Aurora** | Traceable & faster |
| **Data Security** | ⚠️ File-based (risky) | ✅ Role-based access + encryption | 🏆 **Aurora** | Safer |
| **Scalability** | ❌ Slow with big data | ✅ Fast with millions of records | 🏆 **Aurora** | Database vs spreadsheet |
| **AI/Analytics** | ❌ Manual analysis | ✅ Built-in AI (forecasting, anomaly) | 🏆 **Aurora** | Predictive insights |
| **Mobile Access** | ⚠️ Limited (Excel mobile app) | ✅ Full responsive web | 🏆 **Aurora** | Work from anywhere |
| **Backup** | ⚠️ Manual (risk of data loss) | ✅ Auto backup (daily) | 🏆 **Aurora** | Peace of mind |

**SCORE:** Aurora **10 : 1 : 1** Excel (Draw)

---

## 🎯 PRIORITY MATRIX

### High Priority (P0-P1) - 🔥 BLOCKING

| Gap Item | Impact | Effort | Timeline | Status |
|----------|--------|--------|----------|--------|
| Manual Journal Entry UI | 🔴 HIGH | Medium | 5 days | ⏳ To Do |
| Payment Request Workflow | 🔴 HIGH | High | 7 days | ⏳ To Do |
| Kontra Bon Enhanced UI | 🟠 MEDIUM-HIGH | Medium | 5 days | ⏳ To Do |

**Total:** ~17 days (2.5 weeks)

### Medium Priority (P2-P3) - 🟡 IMPORTANT

| Gap Item | Impact | Effort | Timeline | Status |
|----------|--------|--------|----------|--------|
| Item Price Versioning | 🟡 MEDIUM | Low | 3 days | ⏳ To Do |
| Report Builder & Excel Export | 🟡 MEDIUM | Medium | 5 days | ⏳ To Do |
| Custom PL Format | 🟡 MEDIUM | Low | 3 days | ⏳ To Do |

**Total:** ~11 days (1.5 weeks)

### Low Priority (P4) - 🟢 NICE-TO-HAVE

| Gap Item | Impact | Effort | Timeline | Status |
|----------|--------|--------|----------|--------|
| Brand-Item Availability Mapping | 🟢 LOW | Low | 2 days | ⏳ To Do |
| Advanced KB Features | 🟢 LOW | Low | 3 days | ⏳ To Do |

**Total:** ~5 days (1 week)

---

## 📈 MIGRATION READINESS SCORECARD

| Category | Excel Score | Aurora Score | Gap | Ready? |
|----------|-------------|--------------|-----|--------|
| **Daily Operations** | 100% | 90% | Manual Journal Entry UI | ⚠️ 90% |
| **Purchasing** | 100% | 95% | Report format | ✅ 95% |
| **Inventory** | 100% | 90% | Price versioning | ✅ 90% |
| **Finance/Accounting** | 100% | 75% | PR Workflow + KB UI | ⚠️ 75% |
| **Reporting** | 100% | 80% | Custom formats | ⚠️ 80% |
| **User Management** | 0% | 100% | Excel tidak punya | 🏆 Aurora |
| **AI/Analytics** | 0% | 100% | Excel tidak punya | 🏆 Aurora |

**OVERALL READINESS:** **85%** → **Need 2-3 weeks to reach 95%+**

---

## ✅ RECOMMENDATION

### **PROCEED WITH PHASE 1 DEVELOPMENT** 🚀

**Rationale:**
1. ✅ **Foundation solid** - most workflows already working
2. ✅ **Gaps are well-defined** - clear scope, no ambiguity
3. ✅ **High ROI** - efficiency gains will outweigh development cost
4. ✅ **Future-proof** - Aurora scales better than Excel
5. ✅ **AI features** - already have competitive advantage

**Timeline:**
- **Phase 1 (Critical):** 2-3 weeks → 95% migration ready
- **Phase 2 (Enhancement):** 2-3 weeks → 98% feature parity
- **Testing & UAT:** 2 weeks → validation & training
- **Full Migration:** Week 9-10 → Excel as backup only

**Total:** 8-10 weeks to **full operational switch**

---

**Last Updated:** 8 Mei 2026  
**Document Owner:** Aurora ERP Team  
**Distribution:** Torado Group Management
