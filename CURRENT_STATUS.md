# 🎯 Aurora F&B — Current System Status
**Last Updated:** May 7, 2026  
**Version:** 0.3.0 (Codebase as copied from repo torado26)  
**Overall Status:** ✅ Production-Ready (deployed to torado-staging-1)

---

## 📊 Development Progress Overview

### ✅ Completed (100%)
- **Phase 0–12**: Core ERP functionality — ALL COMPLETE
- **Sprint G**: Finance & HR Enhancements — COMPLETE & TESTED
- **Sprint H**: CMS Company Profile — COMPLETE & TESTED
- **Sprint I (Task 1)**: Navigation Restructuring (3-tier: AppShell → Sidebar → Subnav) — COMPLETE & TESTED
- **Sprint I (Task 2)**: Careers/Jobs CMS — COMPLETE & TESTED
- **Additional Modules (beyond Sprint H/I)**: Loyalty, Fixed Assets, AR, e-Faktur, e-Bupot, RFQ, CMS Advanced, CRM Analytics, Budget Enhanced, Bank Recon, Report Schedules, User Preferences — ALL IN CODEBASE

### 🔜 Next Steps (Phase 3 Hardening)
- Pagination on Admin jobs list
- Server-side validation hardening
- Audit fields (updated_by)
- Apply form → POST applications (next sprint decision needed)

---

## 🏗️ System Architecture

### Backend (FastAPI + MongoDB)
```
✅ Server:          FastAPI on 0.0.0.0:8001
✅ Database:        MongoDB (aurora_fnb) — async Motor driver
✅ Auth:            JWT-based authentication (HS256)
✅ API:             RESTful with envelope pattern {success, data, errors, meta}
✅ Static Files:    /app/backend/uploads/ → served at /uploads/*
✅ Logging:         Structured JSON logging (structlog)
✅ Rate Limiting:   Configured (disabled in current env)
✅ Scheduler:       APScheduler for background jobs
✅ PDF:             ReportLab for payslip / PO PDF generation
✅ AI:              emergentintegrations (LLM) for OCR, Q&A, insights
```

### Frontend (React + Webpack)
```
✅ Server:          CRA Webpack dev server on port 3000
✅ UI Framework:    Shadcn/UI + Tailwind CSS
✅ State:           React hooks + Context API
✅ Routing:         React Router v6
✅ API Client:      Axios with interceptors
✅ Notifications:   Sonner (toast)
✅ Charts:          Recharts
✅ Maps:            Leaflet (interactive outlet map)
✅ Rich Text:       Custom RichTextEditor component
✅ Navigation:      3-tier AppShell → Sidebar → Subnav (navigationSchema.js)
```

### Infrastructure
```
✅ Deployment:      Kubernetes (Emergent Platform)
✅ Ingress:         /api/* → backend, /* → frontend
✅ Supervisor:      Process management
✅ Preview URL:     https://finance-phase2-test.preview.emergentagent.com
✅ Hot Reload:      Enabled for both services
```

---

## 📦 Module Inventory (as of May 7, 2026)

### Core Authentication & Access
| Feature | Status | Notes |
|---------|--------|-------|
| JWT Login / Logout | ✅ | `/api/auth/login`, `/api/auth/logout` |
| Role-based Access Control | ✅ | 15 roles seeded |
| Portal-level permissions | ✅ | admin/finance/hr/inventory/outlet/owner/procurement/executive |
| User management | ✅ | Admin portal |
| Portal Selection Screen | ✅ | `/portal-selection` — choose portal after login |
| Remember last portal | ✅ | user_preferences service |

### Navigation (3-tier)
| Feature | Status | Notes |
|---------|--------|-------|
| AppShell layout | ✅ | Global layout with topnav + sidebar |
| Sidebar (portal-level) | ✅ | navigationSchema.js — 8 portals |
| Subnav (section-level) | ✅ | Context-aware tab navigation |
| Mobile drawer | ✅ | Responsive mobile navigation |
| Side rail (collapsed) | ✅ | Icon-only collapsed sidebar |

### Outlet Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Daily Sales Entry | ✅ | Form + list + detail |
| Daily Close | ✅ | EOD closing process |
| Petty Cash | ✅ | Petty cash management |
| KDO/BDO | ✅ | Kasbon Debitur Operasional |
| Urgent Purchase | ✅ | Urgent procurement request |
| Voucher Redemption | ✅ | Loyalty voucher at outlet |
| Outlet Inventory: Stock Check | ✅ | Real-time stock check |
| Outlet Inventory: Stock Transfers | ✅ | Inter-outlet transfers |
| Outlet Inventory: Usage Log | ✅ | Ingredient usage logging |

### Inventory Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Stock Balance | ✅ | Multi-outlet balance view |
| Stock Balance Matrix | ✅ | Matrix view by item × outlet |
| Stock Movements | ✅ | Movement history + filter |
| Stock Adjustments | ✅ | Variance adjustments |
| Stock Transfers | ✅ | Inter-outlet transfers |
| Opname (Stock Take) | ✅ | Session-based stock counting |
| Low Stock Alerts | ✅ | Threshold-based alerts |
| Inventory Valuation | ✅ | COGS / weighted average |

### Procurement Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Purchase Request (PR) | ✅ | Create, list, detail |
| Purchase Order (PO) | ✅ | PO creation from PR |
| Goods Receipt (GR) | ✅ | GR form + list |
| RFQ (Request for Quotation) | ✅ | RFQ list + detail |
| Vendor Comparison | ✅ | Compare vendor quotes |
| AI Vendor Recommendation | ✅ | AI-powered vendor suggestion |
| Kanban Workboard | ✅ | Visual procurement pipeline |

### Finance Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Journal Entry (Manual) | ✅ | Manual journal form + list |
| Chart of Accounts (COA) | ✅ | COA browser/management |
| Trial Balance | ✅ | Period-based TB |
| Profit & Loss | ✅ | P&L report with drill-down |
| Balance Sheet | ✅ | Balance sheet report |
| Cash Position | ✅ | Multi-account cash position |
| Cashflow Report | ✅ | Direct method cashflow |
| Payments | ✅ | Payment form + list + detail |
| Period Management | ✅ | Open/close accounting periods |
| Period Closing Wizard | ✅ | Guided close with validation |
| Comparatives | ✅ | YoY / MoM comparison |
| Pivot Report | ✅ | Flexible pivot reporting |
| Report Builder | ✅ | Custom report templates |
| Forecasting | ✅ | AI-powered sales forecast |
| Bank Reconciliation | ✅ | Bank statement matching |
| Fixed Assets | ✅ | Asset register + depreciation |
| Budget Management | ✅ | Budget vs actual |
| Accounts Receivable | ✅ | AR ledger + aging |
| Tax Center | ✅ | Tax summary + analysis |
| e-Faktur Export | ✅ | PPN invoice CSV export |
| e-Bupot Export | ✅ | PPh withholding export |
| Vendor Scorecard | ✅ | AP vendor performance |
| Validation Queue | ✅ | Journal validation pipeline |

### HR Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Payroll Management | ✅ | Monthly payroll list + PDF |
| Incentive Management | ✅ | Performance-based incentives |
| Service Charge | ✅ | F&B service charge calc |
| Advances (Kasbon) | ✅ | Employee advances |
| LB Fund Ledger | ✅ | Labour benefit fund |
| FOC Management | ✅ | Free of charge tracking |
| Vouchers | ✅ | Staff voucher management |

### Executive Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Executive Dashboard | ✅ | KPI overview cards |
| Brand Drilldown | ✅ | Revenue by brand |
| Outlet Drilldown | ✅ | Revenue by outlet |
| Period Compare | ✅ | Multi-period comparison |
| Profit Walk | ✅ | Waterfall profit bridge |

### Owner Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Owner Cockpit | ✅ | Top-level P&L + KPIs |
| Digest Settings | ✅ | Configure daily digest |

### Admin Portal
| Feature | Status | Notes |
|---------|--------|-------|
| User & Role Management | ✅ | Full CRUD |
| Master Data | ✅ | Items, outlets, vendors, employees |
| Approval Workflows | ✅ | Configurable approval chains |
| Audit Log | ✅ | System-wide audit trail |
| Number Series | ✅ | Document numbering config |
| Report Schedules | ✅ | Scheduled email reports |
| Tax Configuration | ✅ | PPN/PPh rates config |
| Operations | ✅ | System operations panel |
| Integrations Hub | ✅ | API keys / service config |
| **CMS — Brands** | ✅ | Image upload, rich fields |
| **CMS — Outlets** | ✅ | Location, hours, images |
| **CMS — News** | ✅ | Rich text, categories |
| **CMS — Menu** | ✅ | Menu catalog management |
| **CMS — Careers** | ✅ | Job postings CRUD |
| **CMS — Media Library** | ✅ | Upload + manage media assets |
| **CMS — Page Builder** | ✅ | Custom pages |
| **CMS — Version History** | ✅ | Content versioning snapshots |
| **CMS — Approval Workflow** | ✅ | Draft → Review → Approved → Published |
| **CMS — Analytics** | ✅ | Page view + popular content tracking |
| **CMS — SEO Fields** | ✅ | Meta title, description, OG image |
| **CMS — Brand Preview** | ✅ | Live preview before publish |
| **CMS — Pending Reviews** | ✅ | Reviewer inbox |
| **Configuration — Anomaly Thresholds** | ✅ | Configurable anomaly rules |
| **Configuration — Incentive Schemes** | ✅ | Incentive rule editor |
| **Configuration — Petty Cash Policies** | ✅ | Petty cash policy rules |
| **Configuration — Service Charge Policies** | ✅ | SC policy editor |
| **Configuration — Sales Schemas** | ✅ | Sales schema editor |
| **CRM Analytics** | ✅ | Customer analytics dashboard |

### Loyalty Program
| Feature | Status | Notes |
|---------|--------|-------|
| Loyalty Customer Portal | ✅ | Separate `/loyalty/*` public portal |
| Loyalty Login / Register | ✅ | Customer auth |
| Loyalty Dashboard | ✅ | Points balance, tier, history |
| Loyalty Card | ✅ | Digital loyalty card |
| Loyalty History | ✅ | Earn/redeem transaction history |
| Loyalty Profile | ✅ | Customer profile management |
| Loyalty Rewards Catalog | ✅ | Redeem points for rewards |
| Admin: Loyalty Management | ✅ | Points, tiers, rewards admin |
| Outlet: Voucher Redemption | ✅ | Redeem at point of sale |

### AI Features
| Feature | Status | Notes |
|---------|--------|-------|
| Receipt OCR | ✅ | AI image-to-expense parsing |
| Anomaly Detection | ✅ | Statistical + ML-based |
| Sales Forecasting | ✅ | AI revenue forecasting |
| AI Insights Cards | ✅ | Contextual insights widgets |
| Conversational Q&A | ✅ | Chat with your data |
| AI Vendor Recommendation | ✅ | Procurement vendor AI |
| AI Categorize Chip | ✅ | Auto-categorize transactions |

### Public Website
| Feature | Status | Notes |
|---------|--------|-------|
| Home Page | ✅ | Brand showcase, news, hero |
| Brands | ✅ | Brand listing + detail pages |
| Locations | ✅ | Interactive Leaflet map |
| Menu Catalog | ✅ | Menu by brand / category |
| News & Events | ✅ | Articles with detail pages |
| About Page | ✅ | Company info |
| Contact Page | ✅ | Contact form |
| Careers | ✅ | CMS-driven job listings |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@torado.id | Torado@2026 |
| Executive | executive@torado.id | Torado@2026 |
| Finance | finance@torado.id | Torado@2026 |
| Procurement | procurement@torado.id | Torado@2026 |
| Outlet (Altero) | outlet.altero@torado.id | Torado@2026 |

---

## 🗄️ Database Collections (MongoDB: aurora_fnb)

| Collection | Purpose |
|------------|--------|
| users | System users + roles |
| roles | Permission definitions |
| outlets | Outlet master data |
| items | Inventory item master |
| vendors | Vendor/supplier master |
| employees | Employee master |
| sales_entries | Daily sales records |
| inventory_movements | Stock movement ledger |
| inventory_transfers | Inter-outlet transfers |
| inventory_opname | Stock take sessions |
| purchase_requests | PR documents |
| purchase_orders | PO documents |
| goods_receipts | GR documents |
| rfq_requests | RFQ documents |
| vendor_quotes | Vendor RFQ responses |
| journals | GL journal entries |
| journal_lines | GL journal lines |
| payments | Payment records |
| coa | Chart of accounts |
| periods | Accounting periods |
| fixed_assets | Fixed asset register |
| ar_transactions | AR ledger |
| budget_lines | Budget lines |
| daily_close | EOD closing records |
| petty_cash | Petty cash transactions |
| payroll | Payroll records |
| service_charge_periods | SC distribution periods |
| incentive_lines | Incentive calculations |
| advances | Employee advances |
| foc_items | Free of charge items |
| vouchers | Staff vouchers |
| public_brands | CMS brands |
| public_outlets | CMS outlets |
| public_news | CMS news articles |
| public_menu_items | CMS menu items |
| job_listings | CMS job postings |
| content_versions | CMS version snapshots |
| media_library | Uploaded media assets |
| custom_pages | Page builder pages |
| loyalty_customers | Loyalty customer accounts |
| loyalty_transactions | Points earn/redeem log |
| rewards | Rewards catalog |
| reward_redemptions | Reward redemption records |
| customers | CRM customer profiles |
| report_schedules | Scheduled report configs |
| approval_workflows | Approval workflow definitions |
| approval_instances | In-flight approvals |
| audit_log | System audit trail |
| notifications | User notifications |
| number_series | Document number sequences |
| anomaly_rules | Anomaly detection rules |
| incentive_schemes | Incentive scheme definitions |
| petty_cash_policies | Petty cash policy rules |
| service_charge_policies | SC policy rules |
| sales_schemas | Sales schema definitions |
| user_preferences | Per-user UI preferences |
| cms_analytics | CMS page view tracking |

---

## 📋 Known Gaps / TODO (Phase 3 Next)

1. **Careers CMS Pagination** — Server-side pagination UI for admin jobs list
2. **Server-side validation hardening** — Apply form field validation at API level
3. **Audit fields** — `updated_by` field consistency across CMS endpoints
4. **Apply form POST** — Submit job application to backend (currently local toast)
5. **Finance: PPN 12%** — Tax rate update from 11% → 12% (per FINANCE_AUDIT_2026Q2.md)
6. **e-Faktur: Coretax API** — Integration with new DJP Coretax system
7. **Performance** — MongoDB index optimization (see PERF_AUDIT.md)

---

## 🔗 Key Files Reference

| File | Purpose |
|------|---------|
| `/app/backend/server.py` | FastAPI main app + all router includes |
| `/app/backend/core/config.py` | Centralized settings (env vars) |
| `/app/backend/core/db.py` | MongoDB client + collection access |
| `/app/backend/core/security.py` | JWT auth + permission decorators |
| `/app/frontend/src/App.js` | React app root + all routes |
| `/app/frontend/src/lib/navigationSchema.js` | 3-tier navigation definition |
| `/app/frontend/src/components/layout/AppShell.jsx` | Global layout wrapper |
| `/app/memory/PRD.md` | Full product requirements |
| `/app/memory/ARCHITECTURE.md` | Technical architecture reference |
| `/app/CMS_ADVANCED_ROADMAP.md` | CMS advanced features roadmap |
| `/app/memory/FINANCE_AUDIT_2026Q2.md` | Finance module gap analysis |
| `/app/memory/PERF_AUDIT.md` | Performance optimization plan |
