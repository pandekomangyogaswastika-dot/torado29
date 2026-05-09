# 📋 RENCANA RESTRUKTURISASI SYSTEM AURORA F&B ERP
## Dokumen Perencanaan Comprehensive - Redesign Navigation & Architecture

> **Status**: PLANNING PHASE - TIDAK UNTUK EKSEKUSI  
> **Dibuat**: 4 Mei 2026  
> **Author**: System Architect  
> **Version**: 1.0 DRAFT

---

## 📊 EXECUTIVE SUMMARY

### Problem Statement
Sistem Aurora F&B ERP saat ini mengalami kompleksitas navigasi yang membingungkan user:
- **Navigation terlalu complicated** - User kesulitan menemukan fitur
- **UI bagian kiri tidak jelas fungsinya** - Sidebar current terasa redundant
- **Tidak ada separation yang jelas** antara portal-portal
- **Missing public-facing components** - Tidak ada Compro dan CRM/Loyalty

### Proposed Solution
Restrukturisasi total arsitektur aplikasi menjadi **3-tier navigation system** dengan **portal-based architecture** dan penambahan **public-facing platform** (Compro + CRM).

### Impact Scope
- **High Impact**: Navigation, User Experience, Architecture
- **Medium Impact**: Authentication flow, RBAC integration
- **Low Impact**: Existing business logic (tetap preserved)

---

## 🎯 TUJUAN RESTRUKTURISASI

### Primary Objectives
1. **Simplifikasi User Experience** - Reduce cognitive load dengan navigation yang intuitif
2. **Portal Separation** - Clear separation antar functional areas
3. **Public Platform** - Tambah Compro + CRM untuk customer engagement
4. **Scalability** - Architecture yang mudah dikembangkan ke depan

### Success Metrics
- User navigation time ↓ 50%
- Portal switching confusion ↓ 80%
- User satisfaction ↑ 70%
- Public platform engagement: target 1000 registered customers (3 months)

---

## 🏗️ CURRENT STATE ANALYSIS

### Existing Architecture

#### Current Navigation Pattern
```
┌─────────────────────────────────────────────────────┐
│  Top Navbar (Global)                                │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ Portal 1 │ Portal 2 │ Portal 3 │ Portal 4 │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Horizontal Sub-Navigation (Per Portal)             │
│  ┌───────┬───────┬───────┬───────┬───────┐        │
│  │ Menu1 │ Menu2 │ Menu3 │ Menu4 │ Menu5 │        │
│  └───────┴───────┴───────┴───────┴───────┘        │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                                                       │
│  Main Content Area                                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### Current Portal Structure
| Portal | Features | Users |
|--------|----------|-------|
| Admin | Users, Roles, Master Data, Settings | Super Admin |
| Executive | Dashboard, Drilldown, Brand Mix | C-Level |
| Finance | Journals, Reports, Tax, Payments, NEW: e-Faktur, Assets, Budget, AR | Finance Manager |
| HR | Payroll, Service Charge, Vouchers | HR Manager |
| Procurement | PR, PO, GR, Vendor Management | Procurement Team |
| Inventory | Stock Balance, Transfer, Opname | Warehouse Team |
| Outlet | Daily Sales, Petty Cash, KDO/BDO | Outlet Manager |
| Owner | Cockpit, Cash Position, Digest | Owner |

### Problems Identified

#### 1. Navigation Complexity
**Issue**: Horizontal sub-nav bisa panjang (20+ menu items di Finance)
```
Finance Portal Sub-Nav (current):
[Overview][Validation][Cash][Payments][Journals][Manual JE][TB][P&L]
[BS][Cashflow][AP Aging][AR Invoices][Bank Recon][Tax][e-Faktur]
[Assets][Budget][Report Builder][Pivot][Comparatives][Forecasting]
[Anomalies][Vendor Scorecard][Periods][COA]
```
**Impact**: 
- User harus scroll horizontal untuk melihat semua menu
- Sulit menemukan fitur spesifik
- Cognitive overload

#### 2. Sidebar Unused
**Current State**: Tidak ada sidebar di portal pages
**User Feedback**: "UI bagian kiri itu apa fungsinya?"
**Analysis**: User expect sidebar untuk sub-navigation (common pattern di ERP/SaaS apps)

#### 3. Portal Switching
**Current Flow**:
```
Login → Portal 1 → Need Portal 2 → Click dropdown top navbar → Select Portal 2
```
**Issue**: 
- Dropdown bisa panjang (8 portals)
- Tidak ada visual preview portal sebelum masuk
- User lupa portal apa saja yang ada

#### 4. Missing Public Platform
**Gap**: Tidak ada interface untuk:
- **Customer-facing website** (company profile, menu, locations)
- **CRM/Loyalty program** untuk customer rewards
- **Separate admin access** - ERP dan public platform tercampur

---

## 🎨 PROPOSED NEW ARCHITECTURE

### Overall System Structure

```
Aurora F&B Platform
│
├── 🌐 Public Platform (Compro + CRM)
│   ├── Landing Page / Homepage
│   ├── About Us / Brand Story
│   ├── Menu Catalog (per brand/outlet)
│   ├── Locations & Hours
│   ├── News / Events
│   ├── Customer Login → CRM Portal
│   └── "Admin Portal" Button → ERP Login
│
└── 🔐 ERP Platform (Internal)
    ├── Login Page
    ├── Portal Selection Screen ★ NEW
    └── Portal Dashboards (8 portals dengan 3-tier navigation)
```

---

## 📐 DETAILED DESIGN SPECIFICATION

### 1. PUBLIC PLATFORM (Compro + CRM)

#### 1.1 Company Profile Website

**Purpose**: Public-facing website untuk brand awareness, customer acquisition, dan information

**Target Users**: 
- Prospective customers
- General public
- Investors / partners
- Job seekers

**Key Pages**:

| Page | Content | CTA |
|------|---------|-----|
| **Homepage** | Hero banner, brand story, featured brands, news | "Explore Brands", "View Menu" |
| **Brands** | List semua brand (Altero, De La Sol, Calluna, etc.) dengan photos | "Visit Outlet", "View Menu" |
| **Menu Catalog** | Searchable menu items per brand/outlet, photos, prices | "Order Now", "Reserve Table" |
| **Locations** | Interactive map, outlet list, hours, contact | "Get Directions", "Contact Us" |
| **About Us** | Company story, values, team, achievements | "Join Our Team", "Become Partner" |
| **News & Events** | Blog-style content, promotions, events | "Read More", "RSVP" |
| **Careers** | Job openings, culture, benefits | "Apply Now" |
| **Contact** | Contact form, email, phone, social media | "Send Message" |
| **Login** | Customer login for loyalty program | "Login", "Sign Up" |

**Design Requirements**:
```javascript
// Reference: ISMAYA website style
- Full-width hero images
- Staggered/asymmetrical layout
- Dark sophisticated palette
- High-quality photography
- Minimal text, maximum visual impact
- Smooth scrolling experience
- Mobile-first responsive
```

**Tech Stack Recommendation**:
- **Frontend**: React (same stack, separate app)
- **CMS**: Headless CMS (Strapi / Contentful) untuk easy content management
- **Hosting**: Static site deployment (Vercel/Netlify) untuk performance
- **CDN**: CloudFlare untuk image optimization

#### 1.2 CRM & Loyalty Portal

**Purpose**: Customer engagement, loyalty program, personalized offers

**Target Users**: Registered customers (end diners)

**Authentication**:
- Separate auth system dari ERP (customer DB berbeda)
- Social login support (Google, Facebook)
- Email/password registration
- SMS OTP untuk phone verification

**Features**:

**Dashboard**:
```
┌─────────────────────────────────────────────┐
│  Welcome, [Customer Name] 👋                │
│  Your Points: 1,250 pts                     │
│  Tier: Gold Member                          │
├─────────────────────────────────────────────┤
│  🎴 My Loyalty Card                         │
│     - QR Code untuk scan di outlet          │
│     - Membership number                     │
│     - Valid until: [Date]                   │
├─────────────────────────────────────────────┤
│  🎁 Available Rewards (3)                   │
│     - Free Dessert (500 pts)                │
│     - 20% Discount Voucher (800 pts)        │
│     - Free Main Course (1,500 pts)          │
├─────────────────────────────────────────────┤
│  📜 Recent Transactions                     │
│     - 2 May: Altero SCBD - 150 pts         │
│     - 28 Apr: Calluna PIK - 200 pts        │
├─────────────────────────────────────────────┤
│  🔔 Notifications (2 new)                   │
│     - Birthday reward available!            │
│     - Double points weekend at De La Sol    │
└─────────────────────────────────────────────┘
```

**Menu Structure**:
- **Home** - Dashboard overview
- **Loyalty Card** - Digital card dengan QR code
- **Rewards** - Browse and redeem rewards
- **Transactions** - Visit history, points earned
- **Offers** - Personalized promotions
- **Profile** - Edit personal info, preferences
- **Refer Friend** - Referral program

**Loyalty Program Logic**:
```javascript
// Point earning
Visit → Spend IDR → Earn Points (1 point per IDR 10,000)
Referral → Friend signs up → 100 bonus points
Birthday month → 2x points multiplier
Check-in at outlet → 50 points

// Point redemption
Browse catalog → Select reward → Deduct points → Generate voucher code

// Tier system
Bronze: 0-999 points (1x multiplier)
Silver: 1,000-4,999 points (1.2x multiplier)
Gold: 5,000-9,999 points (1.5x multiplier)
Platinum: 10,000+ points (2x multiplier)
```

**Integration dengan ERP**:
- **Daily Sales** di Outlet portal mencatat customer ID (jika loyalty scan)
- **Points posting** otomatis dari daily sales amount
- **Reward redemption** tercatat sebagai discount/voucher di POS
- **CRM analytics** available di Marketing portal (ERP side)

---

### 2. ERP PLATFORM REDESIGN

#### 2.1 Login Page Enhancement

**Current**: Simple login form
**Proposed**: Enhanced dengan context

```
┌────────────────────────────────────────────────────┐
│                                                      │
│  [Logo]                                              │
│  Aurora F&B ERP                                      │
│  Integrated Management System                        │
│                                                      │
│  ┌──────────────────────────────────────┐          │
│  │  Email                                │          │
│  │  ┌────────────────────────────────┐  │          │
│  │  │ admin@torado.id                │  │          │
│  │  └────────────────────────────────┘  │          │
│  │                                       │          │
│  │  Password                             │          │
│  │  ┌────────────────────────────────┐  │          │
│  │  │ ••••••••••                     │  │          │
│  │  └────────────────────────────────┘  │          │
│  │                                       │          │
│  │  [ ] Remember me                      │          │
│  │                                       │          │
│  │  [    Login to ERP System    ] →     │          │
│  │                                       │          │
│  │  Forgot password?                     │          │
│  └──────────────────────────────────────┘          │
│                                                      │
│  ← Back to Public Site                              │
│                                                      │
└────────────────────────────────────────────────────┘
```

**Key Changes**:
- Add "Back to Public Site" link
- Visual distinction antara public login vs ERP login
- Enhanced security messaging
- CAPTCHA untuk brute-force protection

#### 2.2 Portal Selection Screen ★ NEW

**Concept**: Inspired by image 2 (DEMO ERP Portal Selection)

**Why This Matters**:
- **Visual clarity** - User see all available portals at once
- **Cognitive ease** - Portal icons + descriptions help user choose
- **Role-based filtering** - Only show portals user has access to
- **Onboarding** - New users quickly understand system structure

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Aurora F&B ERP          [Help] [User Menu ▼]       │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Pilih Portal                                                │
│  Selamat datang, [User Name]. Silakan pilih portal sesuai  │
│  tugas Anda.                                                 │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ 👤         │  │ 📊         │  │ 💰         │           │
│  │ Admin      │  │ Executive  │  │ Finance    │           │
│  │            │  │            │  │            │           │
│  │ User mgmt, │  │ Dashboard, │  │ Journals,  │           │
│  │ roles,     │  │ analytics, │  │ reports,   │           │
│  │ settings   │  │ drilldown  │  │ tax, AR/AP │           │
│  │            │  │            │  │            │           │
│  │ [Masuk →]  │  │ [Masuk →]  │  │ [Masuk →]  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ 👥         │  │ 🛒         │  │ 📦         │           │
│  │ HR         │  │ Procurement│  │ Inventory  │           │
│  │            │  │            │  │            │           │
│  │ Payroll,   │  │ PR, PO, GR,│  │ Stock,     │           │
│  │ service    │  │ vendor     │  │ transfer,  │           │
│  │ charge     │  │ management │  │ opname     │           │
│  │            │  │            │  │            │           │
│  │ [Masuk →]  │  │ [Masuk →]  │  │ [Masuk →]  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐                            │
│  │ 🏪         │  │ 👨‍💼         │                            │
│  │ Outlet     │  │ Owner      │                            │
│  │            │  │            │                            │
│  │ Daily sales│  │ Cockpit,   │                            │
│  │ petty cash,│  │ cash pos., │                            │
│  │ KDO/BDO    │  │ digest     │                            │
│  │            │  │            │                            │
│  │ [Masuk →]  │  │ [Masuk →]  │                            │
│  └────────────┘  └────────────┘                            │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**RBAC Integration**:
```javascript
// Only show portals where user has at least 1 permission
// Grey out portals that are "coming soon" or disabled
// Show badge for portals with notifications

const availablePortals = portals.filter(portal => {
  return user.permissions.some(perm => 
    perm.startsWith(portal.permissionPrefix)
  );
});
```

#### 2.3 New 3-Tier Navigation System ★ CORE CHANGE

**Concept**: Inspired by user request untuk sidebar + horizontal menu

**Navigation Hierarchy**:
```
Level 1: Top Navbar (Global)
Level 2: Left Sidebar (Portal-specific main sections)
Level 3: Horizontal Sub-menu (Section-specific pages)
```

**Visual Layout**:
```
┌───────────────────────────────────────────────────────────┐
│ [Logo] Portal Name          [🔍][🔔][👤 User ▼]        │  ← Level 1: Top Navbar
├───┬───────────────────────────────────────────────────────┤
│   │ Sub-Sub Menu (Level 3)                                │
│   │ [Overview] [Create] [Reports] [Settings]              │
│   ├───────────────────────────────────────────────────────┤
│ S │                                                        │
│ I │                                                        │
│ D │                                                        │
│ E │   Main Content Area                                   │
│ B │                                                        │
│ A │                                                        │
│ R │                                                        │
│   │                                                        │
│ ( │                                                        │
│ L │                                                        │
│ v │                                                        │
│ l │                                                        │
│   │                                                        │
│ 2 │                                                        │
│ ) │                                                        │
│   │                                                        │
└───┴───────────────────────────────────────────────────────┘
     ↑
     Level 2: Sidebar Menu
```

#### Level 1: Top Navbar (Global)

**Always Visible Elements**:
```
┌────────────────────────────────────────────────────────┐
│ [Logo]  [Portal Name]     [🔍 Search] [🔔] [👤 Menu▼] │
└────────────────────────────────────────────────────────┘
```

**Components**:
- **Logo**: Click → Portal Selection Screen
- **Portal Name**: Current portal indicator (e.g., "Finance Portal")
- **Global Search**: Quick find across all data (CMD+K shortcut)
- **Notifications**: System alerts, approvals pending, mentions
- **User Menu**: Profile, Settings, Switch Portal, Logout

**User Menu Dropdown**:
```
┌─────────────────────────┐
│ Admin User              │
│ admin@torado.id         │
├─────────────────────────┤
│ 👤 My Profile           │
│ ⚙️ Preferences          │
│ 🔐 Change Password      │
├─────────────────────────┤
│ 🔄 Switch Portal        │  ← Opens portal selection
├─────────────────────────┤
│ 🌓 Dark Mode [Toggle]   │
│ 🌍 Language: ID         │
├─────────────────────────┤
│ 📖 Help & Docs          │
│ 🐛 Report Issue         │
├─────────────────────────┤
│ 🚪 Logout               │
└─────────────────────────┘
```

#### Level 2: Left Sidebar (Portal Main Sections)

**Purpose**: Organize portal features ke dalam logical sections

**Design**:
- **Collapsible**: User can collapse untuk more screen real estate
- **Icon + Text**: Clear visual identification
- **Active state**: Highlight current section
- **Badge support**: Show counts (e.g., pending approvals)

**Example: Finance Portal Sidebar**

```
┌──────────────────────┐
│                      │
│ 💰 FINANCE          │
│                      │
├──────────────────────┤
│                      │
│ 📊 Overview         │  ← Home/dashboard
│                      │
│ 🧾 Transactions      │  ← Daily sales validation, journals
│   ├─ Validation      │
│   ├─ Journals        │
│   └─ Manual JE       │
│                      │
│ 💳 Payments          │  ← AP/AR, bank
│   ├─ Payables        │
│   ├─ Receivables     │
│   └─ Bank Recon      │
│                      │
│ 📈 Reports           │  ← Financial statements
│   ├─ Trial Balance   │
│   ├─ P&L             │
│   ├─ Balance Sheet   │
│   ├─ Cashflow        │
│   └─ Custom Reports  │
│                      │
│ 🧮 Tax & Compliance  │  ← Tax center, e-Faktur
│   ├─ Tax Center      │
│   └─ e-Faktur        │
│                      │
│ 🏢 Assets & Budget   │  ← Fixed assets, budgeting
│   ├─ Fixed Assets    │
│   └─ Budget vs Actual│
│                      │
│ 📅 Period Management │  ← Closing, lock/unlock
│   ├─ Periods         │
│   └─ Closing Wizard  │
│                      │
│ ⚙️ Finance Config    │  ← COA, settings
│   └─ Chart of Acc.   │
│                      │
└──────────────────────┘
```

**Responsive Behavior**:
- **Desktop**: Sidebar always visible (can collapse)
- **Tablet**: Sidebar starts collapsed, overlay when opened
- **Mobile**: Hamburger menu, full-screen overlay

#### Level 3: Horizontal Sub-Menu (Context-specific)

**Purpose**: Show pages within a selected section

**Position**: Directly below top navbar, above content

**Example**: User clicks "Reports" section in sidebar

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Finance Portal    [🔍][🔔][👤]                   │  ← Level 1
├─────────────────────────────────────────────────────────┤
│ Reports                                                  │  ← Section name
│ [Trial Balance] [P&L] [Balance Sheet] [Cashflow] [...]  │  ← Level 3
├─────────────────────────────────────────────────────────┤
```

**Key Characteristics**:
- **Tab-like interface**: Active tab highlighted
- **Horizontal scroll**: If too many items (with fade indicators)
- **Icons optional**: Can add small icons for visual aid
- **Sticky**: Remains visible on scroll

---

### 3. NAVIGATION FLOW EXAMPLES

#### Flow 1: Finance User - Check P&L Report

**Current System**:
```
Login → Automatically land in last portal (Finance) 
→ Scan horizontal menu (25 items) 
→ Find "profit-loss" 
→ Click
```
**Time**: ~5-8 seconds, 2-3 eye movements across screen

**Proposed System**:
```
Login → Portal Selection → Click "Finance" card 
→ Sidebar already shows "Reports" section 
→ Click "Reports" (if not already selected) 
→ Horizontal menu shows [TB][P&L][BS][CF] 
→ Click "P&L"
```
**Time**: ~3-4 seconds, 1-2 focused eye movements

#### Flow 2: Admin User - Create New User

**Current**:
```
Login → Click "Admin" in top navbar dropdown 
→ Scan horizontal sub-nav 
→ Find "Users" 
→ Click → See list → Click "New User"
```

**Proposed**:
```
Login → Portal Selection → Click "Admin" card 
→ Sidebar shows "User Management" 
→ Click → Horizontal menu shows [All Users][Roles][Permissions] 
→ Click "All Users" → Big "Create User" button visible
```

#### Flow 3: Multi-Portal User (e.g., Manager yang access Finance + Procurement)

**Current**:
```
Start in Finance → Need to check PO status 
→ Click top navbar dropdown 
→ Find "Procurement" in list of 8 portals 
→ Click → Page refresh → Find "Purchase Orders" in sub-nav
```

**Proposed**:
```
In Finance → Click Logo or User Menu "Switch Portal" 
→ Portal Selection screen appears (modal or new page) 
→ Click "Procurement" card 
→ Sidebar shows "Purchase Orders" section 
→ Click → Immediately see PO list
```

---

## 🗂️ PORTAL-BY-PORTAL BREAKDOWN

### Portal 1: Admin Portal

**Primary Users**: Super Admin, IT Admin

**Sidebar Sections**:
```
📊 Dashboard
   └─ Overview

👥 User Management
   ├─ All Users
   ├─ Roles & Permissions
   └─ Activity Log

🏢 Organization
   ├─ Outlets
   ├─ Departments
   └─ Brands

📦 Master Data
   ├─ Items (Products)
   ├─ Vendors
   ├─ Customers
   └─ Employees

⚙️ System Settings
   ├─ General
   ├─ Integrations
   ├─ Email Templates
   └─ Number Series

🔧 Configuration
   ├─ Business Rules
   ├─ Approval Workflows
   └─ Notifications

📋 Audit & Logs
   ├─ Audit Log
   └─ System Logs
```

### Portal 2: Executive Portal

**Primary Users**: C-Level, Directors

**Sidebar Sections**:
```
📊 Executive Dashboard
   └─ Overview

💰 Financial Metrics
   ├─ Cash Position
   ├─ Profit Walk
   └─ Period Compare

🏪 Brand Performance
   ├─ Brand Mix
   ├─ Outlet Drilldown
   └─ Product Mix

📈 Analytics
   ├─ KPIs
   ├─ Trends
   └─ Forecasting

🤖 AI Insights
   ├─ Executive Q&A
   ├─ Anomaly Feed
   └─ Recommendations

📄 Reports
   ├─ Custom Reports
   └─ Scheduled Reports

📅 Calendar
   └─ Events & Milestones
```

### Portal 3: Finance Portal

**(Already detailed in Navigation section above)**

### Portal 4: HR Portal

**Primary Users**: HR Manager, Payroll Admin

**Sidebar Sections**:
```
📊 HR Dashboard
   └─ Overview

👥 Employee Management
   ├─ All Employees
   ├─ Attendance
   └─ Leave Management

💰 Payroll
   ├─ Salary Structure
   ├─ Payroll Processing
   └─ Service Charge

🎁 Benefits & Incentives
   ├─ Incentive Programs
   ├─ Voucher Issuance
   └─ LB Fund

💸 Advances
   ├─ Employee Advances
   └─ Advance Requests

📄 HR Reports
   ├─ Payroll Reports
   ├─ Attendance Reports
   └─ Turnover Analysis

⚙️ HR Configuration
   └─ Policies & Settings
```

### Portal 5: Procurement Portal

**Primary Users**: Procurement Manager, Buyer

**Sidebar Sections**:
```
📊 Procurement Dashboard
   └─ Overview

📋 Requests
   ├─ Purchase Requests
   └─ Consolidation

🛒 Purchase Orders
   ├─ All POs
   ├─ Create PO
   ├─ PO Comparison
   └─ PO Tracking

📦 Goods Receipt
   ├─ All GRs
   └─ Create GR

👔 Vendor Management
   ├─ All Vendors
   ├─ Vendor Scorecard
   └─ Vendor Comparison

📄 Procurement Reports
   ├─ Spend Analysis
   └─ Vendor Performance

🔄 Workflows
   └─ Approvals
```

### Portal 6: Inventory / Warehouse Portal

**Primary Users**: Warehouse Manager, Inventory Control

**Sidebar Sections**:
```
📊 Inventory Dashboard
   └─ Overview

📦 Stock Management
   ├─ Stock Balance
   ├─ Low Stock Alert
   └─ Stock Matrix

🔄 Movements
   ├─ Transfer Requests
   ├─ Transfers
   └─ Movement History

📊 Stock Opname
   ├─ Start Opname
   └─ Opname History

⚡ Adjustments
   ├─ Stock Adjustment
   └─ Adjustment History

📄 Inventory Reports
   ├─ Valuation
   ├─ Aging
   └─ Movement Report

⚙️ Inventory Config
   └─ Categories & Units
```

### Portal 7: Outlet Operations Portal

**Primary Users**: Outlet Manager, Cashier, Kitchen Staff

**Sidebar Sections**:
```
📊 Outlet Dashboard
   └─ Today's Summary

🛍️ Daily Operations
   ├─ Daily Sales Entry
   ├─ Sales Wizard
   └─ Sales History

💰 Cash Management
   ├─ Petty Cash
   ├─ Cash Count
   └─ Replenishment

🔥 Kitchen Orders
   ├─ KDO (Kitchen Dep Out)
   └─ BDO (Bar Dep Out)

📦 Outlet Inventory
   ├─ Current Stock
   └─ Request Transfer

🛒 Urgent Purchase
   └─ Emergency Requests

📅 Shift & Closing
   ├─ Daily Close
   └─ Close History

📄 Outlet Reports
   └─ Performance
```

### Portal 8: Owner Cockpit

**Primary Users**: Business Owner, Investors

**Sidebar Sections**:
```
📊 Owner Dashboard
   └─ Executive Summary

💰 Financial Health
   ├─ Cash Position
   ├─ Profit Walk
   └─ Key Metrics

📈 Business Intelligence
   ├─ Brand Performance
   ├─ Outlet Rankings
   └─ Trends

🔮 Forecasting
   └─ Predictive Analytics

🤖 AI Insights
   └─ Business Q&A

📬 Digest & Alerts
   ├─ Daily Digest
   ├─ Telegram Setup
   └─ Email Preferences

⚙️ Owner Settings
   └─ Preferences
```

---

## 🎨 DESIGN SYSTEM SPECIFICATIONS

### Color Palette

**Retain existing Aurora design language**, with enhancements:

```css
/* Primary Colors */
--primary: hsl(221, 83%, 53%);        /* Blue - main actions */
--primary-hover: hsl(221, 83%, 45%);

/* Portal Colors (for distinction) */
--portal-admin: hsl(280, 100%, 70%);     /* Purple */
--portal-executive: hsl(220, 80%, 60%);  /* Blue */
--portal-finance: hsl(142, 76%, 36%);    /* Green */
--portal-hr: hsl(25, 95%, 53%);          /* Orange */
--portal-procurement: hsl(199, 89%, 48%); /* Cyan */
--portal-inventory: hsl(48, 96%, 53%);   /* Yellow */
--portal-outlet: hsl(339, 90%, 51%);     /* Pink */
--portal-owner: hsl(271, 76%, 53%);      /* Violet */

/* Sidebar */
--sidebar-bg: hsl(240, 10%, 3.9%);
--sidebar-bg-hover: hsl(240, 10%, 8%);
--sidebar-border: hsl(240, 3.7%, 15.9%);
--sidebar-text: hsl(240, 5%, 64.9%);
--sidebar-text-active: hsl(0, 0%, 98%);

/* Cards (Portal Selection) */
--card-bg: hsl(240, 10%, 3.9%);
--card-border: hsl(240, 3.7%, 15.9%);
--card-hover: hsl(240, 10%, 8%);
```

### Typography

**Keep existing font stack** (modern sans-serif):
```css
--font-sans: "Figtree", system-ui, sans-serif;
--font-mono: "Source Code Pro", monospace;

/* Scale */
--text-xs: 0.75rem;   /* 12px - breadcrumbs, badges */
--text-sm: 0.875rem;  /* 14px - sidebar items, secondary text */
--text-base: 1rem;    /* 16px - body text */
--text-lg: 1.125rem;  /* 18px - section headers */
--text-xl: 1.25rem;   /* 20px - page titles */
--text-2xl: 1.5rem;   /* 24px - portal names */
--text-3xl: 1.875rem; /* 30px - dashboard headers */
```

### Spacing & Layout

```css
/* Sidebar */
--sidebar-width: 240px;
--sidebar-collapsed-width: 60px;

/* Top Navbar */
--navbar-height: 56px;

/* Sub-menu (Level 3) */
--submenu-height: 48px;

/* Content padding */
--content-padding: 2rem; /* 32px */

/* Portal Selection Cards */
--card-min-width: 280px;
--card-max-width: 320px;
--card-height: 240px;
```

### Component Patterns

#### Portal Selection Card

```jsx
<Card className="portal-card">
  <CardHeader>
    <div className="portal-icon">{icon}</div>
    <CardTitle>{portalName}</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="portal-description">{description}</p>
  </CardContent>
  <CardFooter>
    <Button>Masuk →</Button>
  </CardFooter>
</Card>
```

#### Sidebar Item (Collapsible Section)

```jsx
<SidebarSection>
  <SidebarTrigger>
    <Icon />
    <span>Section Name</span>
    <ChevronDown />
  </SidebarTrigger>
  <SidebarContent>
    <SidebarItem href="/path">Sub-item 1</SidebarItem>
    <SidebarItem href="/path">Sub-item 2</SidebarItem>
  </SidebarContent>
</SidebarSection>
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Dual Authentication System

**System 1: ERP Users (Internal Staff)**
- **Auth Method**: Email + Password (existing)
- **Session**: JWT tokens (access + refresh)
- **RBAC**: Permission-based (existing system)
- **Login Flow**: 
  ```
  Login → Portal Selection → Portal Dashboard
  ```

**System 2: CRM Users (Customers)**
- **Auth Method**: 
  - Email + Password
  - Social Login (Google, Facebook)
  - Phone + OTP
- **Session**: Separate JWT with different claims
- **Access**: CRM portal only (no ERP access)
- **Login Flow**: 
  ```
  Public Site → Login → CRM Dashboard
  ```

### Database Schema Changes

**New Collection: `crm_users`**
```javascript
{
  id: uuid,
  email: string,
  phone: string,
  password_hash: string,  // bcrypt
  name: string,
  birthday: date,
  tier: string,  // bronze|silver|gold|platinum
  points: number,
  total_spent: number,
  visit_count: number,
  favorite_outlets: [outlet_id],
  preferences: {
    dietary: [],
    communication: {
      email: boolean,
      sms: boolean,
      push: boolean
    }
  },
  social_logins: [{
    provider: string,
    provider_id: string
  }],
  created_at: datetime,
  last_login: datetime,
  status: string  // active|suspended|deleted
}
```

**New Collection: `loyalty_transactions`**
```javascript
{
  id: uuid,
  customer_id: uuid,
  type: string,  // earn|redeem|expired
  points: number,
  daily_sales_id: uuid,  // link to ERP daily sales
  outlet_id: uuid,
  description: string,
  created_at: datetime
}
```

**New Collection: `rewards_catalog`**
```javascript
{
  id: uuid,
  name: string,
  description: string,
  points_required: number,
  type: string,  // discount|free_item|voucher
  value: number,  // discount amount or value
  image_url: string,
  valid_from: date,
  valid_until: date,
  terms: text,
  max_redemptions: number,
  redemption_count: number,
  status: string  // active|paused|expired
}
```

### RBAC Extensions for Portal System

**New Permissions**:
```javascript
// Portal-level permissions
"portal.admin.access"
"portal.executive.access"
"portal.finance.access"
"portal.hr.access"
"portal.procurement.access"
"portal.inventory.access"
"portal.outlet.access"
"portal.owner.access"

// CRM permissions (for ERP staff managing CRM)
"crm.customers.read"
"crm.customers.manage"
"crm.rewards.manage"
"crm.analytics.read"
```

**Portal Access Control**:
```javascript
// Backend: Check portal access
async function canAccessPortal(user, portalCode) {
  const hasPortalAccess = user.permissions.includes(`portal.${portalCode}.access`);
  // Or has any permission that starts with portal's permission prefix
  const hasFeatureAccess = user.permissions.some(p => 
    p.startsWith(PORTAL_PERMISSION_PREFIXES[portalCode])
  );
  return hasPortalAccess || hasFeatureAccess;
}

// Frontend: Filter portal cards
const visiblePortals = PORTALS.filter(portal => 
  canAccessPortal(currentUser, portal.code)
);
```

---

## 📱 RESPONSIVE DESIGN STRATEGY

### Breakpoints

```css
/* Mobile First */
--mobile: 0px;        /* < 768px */
--tablet: 768px;      /* 768-1024px */
--desktop: 1024px;    /* 1024-1440px */
--wide: 1440px;       /* > 1440px */
```

### Layout Adaptations

#### Desktop (> 1024px)
```
┌─────────────────────────────────────────┐
│ Top Navbar (Level 1)                    │
├───┬─────────────────────────────────────┤
│   │ Horizontal Sub-menu (Level 3)       │
│ S ├─────────────────────────────────────┤
│ i │                                      │
│ d │                                      │
│ e │   Content                            │
│ b │                                      │
│ a │                                      │
│ r │                                      │
└───┴─────────────────────────────────────┘
```
- Sidebar always visible
- Can collapse to icons only (60px wide)
- Horizontal sub-menu always visible

#### Tablet (768-1024px)
```
┌────────────────────────────────────────┐
│ Top Navbar + [☰]                       │
├────────────────────────────────────────┤
│ Horizontal Sub-menu                    │
├────────────────────────────────────────┤
│                                         │
│   Content                               │
│   (Full width)                          │
│                                         │
└────────────────────────────────────────┘
```
- Sidebar hidden by default
- Hamburger menu opens sidebar as overlay
- Horizontal sub-menu visible but scrollable

#### Mobile (< 768px)
```
┌──────────────────────┐
│ [☰] Title      [👤]  │
├──────────────────────┤
│ Content              │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
│                      │
└──────────────────────┘
```
- Sidebar: Hamburger menu → full-screen overlay
- Horizontal sub-menu: Hidden, accessed via dropdown or tabs
- Navigation simplified for essential actions

### Portal Selection Screen Responsive

**Desktop**:
- 4 columns grid (2 rows for 8 portals)

**Tablet**:
- 2-3 columns grid (adapts based on width)

**Mobile**:
- 1 column list
- Vertical scrolling

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 0: Planning & Design (2 weeks)
**Deliverables**:
- ✅ This planning document
- [ ] Detailed wireframes for all screens
- [ ] UI component library specifications
- [ ] Database schema design
- [ ] API endpoint specifications
- [ ] User stories & acceptance criteria

**Team**: Product Manager, UI/UX Designer, System Architect

---

### Phase 1: Public Platform - Compro Website (4 weeks)

#### Week 1-2: Frontend Foundation
**Tasks**:
- [ ] Create new React app (separate from ERP)
- [ ] Set up routing for all public pages
- [ ] Implement design system components
- [ ] Build responsive layouts
- [ ] Integrate image CDN

**Deliverables**:
- Homepage (hero, brand showcase, news)
- About Us page
- Contact page
- Basic menu catalog (static data)

#### Week 3-4: CMS Integration & Content
**Tasks**:
- [ ] Set up headless CMS (Strapi recommended)
- [ ] Define content models (brands, menu items, news, outlets)
- [ ] Build admin interface for content management
- [ ] API integration for dynamic content
- [ ] SEO optimization

**Deliverables**:
- Dynamic content loading
- Admin CMS access for marketing team
- Locations/outlets page with map
- News/blog section
- Careers page

**Testing**: 
- Cross-browser testing
- Mobile responsiveness
- Performance audit (Lighthouse score > 90)
- Accessibility audit (WCAG AA compliance)

---

### Phase 2: Public Platform - CRM & Loyalty (3 weeks)

#### Week 1: Authentication System
**Tasks**:
- [ ] Design customer authentication architecture
- [ ] Implement registration flow (email, social, phone)
- [ ] Email verification system
- [ ] SMS OTP integration (Twilio/Fonnte)
- [ ] Password reset flow
- [ ] Session management (JWT)

**Deliverables**:
- Customer registration
- Login (email/password, Google, Facebook)
- Profile management

#### Week 2: Loyalty Program Core
**Tasks**:
- [ ] Database schema for loyalty (points, tiers, transactions)
- [ ] Backend API for points logic
- [ ] Tier calculation system
- [ ] Digital loyalty card generation (QR code)
- [ ] Points earning rules engine

**Deliverables**:
- Customer dashboard
- Digital loyalty card
- Points balance & history
- Tier status display

#### Week 3: Rewards & Integration
**Tasks**:
- [ ] Rewards catalog CRUD
- [ ] Redemption flow
- [ ] Voucher code generation
- [ ] Integration endpoint for ERP (daily sales → points)
- [ ] Customer analytics dashboard (for ERP admin)

**Deliverables**:
- Rewards catalog browsing
- Redeem rewards functionality
- Transaction history
- Integration with ERP daily sales

**Testing**:
- End-to-end loyalty flow
- Points calculation accuracy
- Concurrent redemption handling
- Security audit (auth, session, data privacy)

---

### Phase 3: ERP - Portal Selection Screen (1 week)

**Tasks**:
- [ ] Design portal selection UI
- [ ] Implement card-based layout
- [ ] RBAC integration (filter portals by access)
- [ ] Add portal icons & descriptions
- [ ] Smooth transitions to portal dashboards
- [ ] Breadcrumb: "← Back to Portal Selection"

**Deliverables**:
- Portal selection screen after login
- User menu "Switch Portal" functionality
- Loading states & animations

**Testing**:
- RBAC: verify only accessible portals shown
- Performance: fast portal switching
- UI/UX: user testing for clarity

---

### Phase 4: ERP - New Navigation System (6 weeks)

#### Week 1-2: Navigation Framework
**Tasks**:
- [ ] Build Sidebar component (collapsible, responsive)
- [ ] Implement Level 3 horizontal sub-menu
- [ ] Update top navbar (add search, notifications)
- [ ] State management for nav (open/close, active section)
- [ ] Mobile responsive behavior (hamburger, overlay)

**Deliverables**:
- Reusable navigation components
- Navigation state management
- Responsive breakpoints working

#### Week 3-4: Portal-by-Portal Migration (Finance, Admin, Executive, HR)
**Tasks**:
- [ ] Define sidebar structure for each portal (use plan above)
- [ ] Migrate existing routes to new structure
- [ ] Update breadcrumbs
- [ ] Add missing routes/pages to fill sidebar sections
- [ ] Test navigation flow in each portal

**Focus Portals**:
- Finance (most complex)
- Admin
- Executive
- HR

#### Week 5-6: Remaining Portals (Procurement, Inventory, Outlet, Owner)
**Tasks**:
- [ ] Continue migration for remaining 4 portals
- [ ] Standardize patterns across all portals
- [ ] Polish transitions & interactions
- [ ] Update all existing links/buttons to use new nav
- [ ] Comprehensive navigation testing

**Deliverables**:
- All 8 portals using new 3-tier navigation
- Consistent UX across portals
- Updated routing configuration

**Testing**:
- Navigation flow testing per portal
- RBAC: permission checks for all menu items
- Performance: no lag when switching sections
- Mobile: all portals work on mobile

---

### Phase 5: Integration & Polish (2 weeks)

#### Week 1: CRM ↔ ERP Integration
**Tasks**:
- [ ] Daily sales → loyalty points posting
- [ ] Voucher redemption → discount in POS
- [ ] Customer lookup in outlet portal (for loyalty scan)
- [ ] CRM analytics in Marketing portal (ERP side)
- [ ] Sync customer data bidirectionally

**Deliverables**:
- Seamless integration flow
- Real-time points update
- Voucher validation system

#### Week 2: Final Polish
**Tasks**:
- [ ] Global search implementation (quick find across all data)
- [ ] Notification system (bell icon)
- [ ] Dark mode toggle (if not already implemented)
- [ ] Loading states & skeleton screens
- [ ] Error boundaries & fallbacks
- [ ] Performance optimization
- [ ] Accessibility audit & fixes

**Deliverables**:
- Production-ready system
- All edge cases handled
- Smooth user experience

---

### Phase 6: Testing, Training & Deployment (2 weeks)

#### Week 1: Comprehensive Testing
**Tasks**:
- [ ] End-to-end user flow testing (all portals)
- [ ] RBAC regression testing (ensure permissions work)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (load time, bundle size)
- [ ] Security audit (auth, session, XSS, CSRF)

#### Week 2: Training & Deployment
**Tasks**:
- [ ] Create user documentation (navigation guide)
- [ ] Record video tutorials (per portal)
- [ ] Conduct training sessions for staff
- [ ] Gradual rollout (pilot group → all users)
- [ ] Monitor feedback & issues
- [ ] Hotfix critical bugs

**Deliverables**:
- Documentation complete
- Training materials
- Production deployment
- Post-launch support plan

---

## 📊 ESTIMATED EFFORT & RESOURCES

### Timeline Summary
| Phase | Duration | Parallel Work | Total Weeks |
|-------|----------|---------------|-------------|
| Phase 0: Planning | 2 weeks | N/A | 2 |
| Phase 1: Compro | 4 weeks | Can parallel with Phase 2 | 4 |
| Phase 2: CRM | 3 weeks | Parallel with Phase 1 (week 2-4) | +1 (total 5) |
| Phase 3: Portal Selection | 1 week | Sequential after Phase 0 | +1 (total 6) |
| Phase 4: New Navigation | 6 weeks | Sequential after Phase 3 | +6 (total 12) |
| Phase 5: Integration | 2 weeks | Sequential after Phase 4 | +2 (total 14) |
| Phase 6: Testing & Deploy | 2 weeks | Sequential after Phase 5 | +2 (total 16) |

**Total Duration**: **16 weeks (4 months)** with parallel work
**Total Duration (Sequential)**: 20 weeks (5 months)

### Team Requirements

**Minimum Team**:
- 1 x Product Manager (full-time)
- 1 x UI/UX Designer (full-time Phases 0-2, part-time Phases 3-6)
- 2 x Frontend Developers (full-time)
- 1 x Backend Developer (full-time)
- 1 x QA Engineer (full-time Phases 5-6, part-time earlier)

**Recommended Team** (for faster delivery):
- 1 x Product Manager
- 1 x UI/UX Designer
- 3 x Frontend Developers (1 for Compro/CRM, 2 for ERP navigation)
- 2 x Backend Developers (1 for CRM API, 1 for ERP integration)
- 1 x QA Engineer
- 1 x DevOps Engineer (deployment, CI/CD setup)

### Cost Estimate (Rough)

**Development**:
- Team (7 people) x 4 months x $5,000/person/month = **$140,000**

**Infrastructure**:
- CMS Subscription (Strapi Cloud): $99/month x 4 = $400
- Hosting (Compro on Vercel, CRM backend on Railway): $100/month x 4 = $400
- CDN (CloudFlare): $20/month x 4 = $80
- SMS Provider (OTP): $0.05/SMS x 1,000 users x 2 SMS = $100
- Social Login (no cost for basic tier)

**Total Infrastructure**: ~$1,000

**Total Estimated Cost**: **$141,000**

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Scope Creep
**Risk Level**: HIGH

**Description**: Project scope expands beyond plan, causing delays

**Mitigation**:
- Strict scope freeze after Phase 0 signoff
- Change request process untuk additional features
- Prioritize MVP functionality
- Log "nice-to-have" items for Phase 2 post-launch

### Risk 2: User Resistance to Change
**Risk Level**: MEDIUM

**Description**: Users familiar with current system resist new navigation

**Mitigation**:
- Involve users in Phase 0 design reviews
- Gradual rollout (pilot group first)
- Comprehensive training & documentation
- Provide "feedback" channel untuk suggestions
- Consider "switch to old nav" toggle untuk transitional period (1 month)

### Risk 3: Integration Complexity (CRM ↔ ERP)
**Risk Level**: MEDIUM

**Description**: Loyalty points integration dengan daily sales bisa complex

**Mitigation**:
- Design integration API contract early (Phase 0)
- Build integration in phases (manual testing → automated)
- Fallback mechanism jika integration fails
- Thorough testing of edge cases (concurrent redemptions, point expiry)

### Risk 4: Performance Degradation
**Risk Level**: MEDIUM

**Description**: Sidebar + navigation overhead bisa slow down app

**Mitigation**:
- Code splitting per portal
- Lazy loading untuk sidebar sub-menus
- Cache navigation structure
- Performance budget enforcement (bundle size < 500KB per portal)
- Regular performance audits

### Risk 5: RBAC Bugs
**Risk Level**: MEDIUM

**Description**: Portal access controls atau sidebar permissions bisa leak data

**Mitigation**:
- Permission check di frontend DAN backend
- Automated RBAC testing suite
- Security audit before launch
- Regular penetration testing

### Risk 6: Mobile UX Complexity
**Risk Level**: LOW-MEDIUM

**Description**: 3-tier navigation bisa complicated di mobile

**Mitigation**:
- Mobile-first design approach
- Simplify navigation untuk mobile (hide less-used items)
- User testing on mobile devices
- Alternative mobile nav patterns (bottom navigation?)

---

## 🎯 SUCCESS CRITERIA & KPIs

### Launch Criteria (Must Pass Before Going Live)

**Functional**:
- [ ] All 8 portals accessible via portal selection
- [ ] All existing features working in new navigation
- [ ] RBAC correctly enforced (audit passed)
- [ ] Compro website live with dynamic content
- [ ] CRM registration & login working
- [ ] Loyalty points earn & redeem functional
- [ ] Integration ERP ↔ CRM working (daily sales → points)

**Performance**:
- [ ] Page load time < 2 seconds (desktop)
- [ ] Time to Interactive < 3 seconds
- [ ] Lighthouse score > 90 (all portals)
- [ ] Bundle size < 500KB per portal (gzipped)

**Quality**:
- [ ] Zero critical bugs
- [ ] < 5 high-priority bugs
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive (iOS, Android)
- [ ] Accessibility WCAG AA compliant

**Security**:
- [ ] Security audit passed
- [ ] No exposed secrets in code
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] XSS protection verified

### Post-Launch KPIs (Monitor for 3 Months)

**Navigation Effectiveness**:
- **Target**: User task completion time ↓ 50%
  - Measure: Time to complete common tasks (e.g., "Find P&L report")
  - Baseline: Current system average
  
- **Target**: Navigation error rate < 5%
  - Measure: % users who go to wrong section/page
  
- **Target**: Portal switch frequency = clear use case
  - Measure: Avg portal switches per user per day
  - Insight: Are users multi-tasking across portals effectively?

**User Satisfaction**:
- **Target**: System Usability Scale (SUS) score > 75
  - Measure: Post-launch survey (10 questions)
  
- **Target**: User satisfaction rating > 4.5/5
  - Measure: In-app rating prompt
  
- **Target**: Support tickets re: navigation ↓ 70%
  - Measure: Count of "how do I find X" tickets

**CRM Engagement**:
- **Target**: 1,000 registered customers in 3 months
  
- **Target**: 60% active customers (login + use app monthly)
  
- **Target**: 30% redemption rate (customers redeem at least 1 reward)
  
- **Target**: 15% referral rate (customers refer friends)

**Performance**:
- **Target**: Maintain page load < 2s
- **Target**: Zero performance regressions
- **Target**: 99.9% uptime (excluding maintenance)

---

## 📝 OPEN QUESTIONS & DECISIONS NEEDED

### Strategic Decisions

**Q1**: Should portal selection screen be **modal** (overlay) or **full-page**?
- **Option A (Modal)**: Click logo/switch portal → modal opens → select portal → fade transition
  - **Pro**: Feels faster, less context switch
  - **Con**: May feel cramped on mobile
  
- **Option B (Full Page)**: Navigate to `/portals` route
  - **Pro**: More space for portal cards, easier to add help text
  - **Con**: Feels like "leaving" current work

**Recommendation**: **Option A (Modal)** untuk desktop, **Option B (Full Page)** untuk mobile

✅ **APPROVED DECISION**: Implement Option A (Modal) for desktop, Option B (Full Page) for mobile

---

**Q2**: Should we allow **"Remember Last Portal"** preference?
- If enabled: Login → Auto-enter last used portal (skip portal selection)
- If disabled: Login → Always show portal selection

**Recommendation**: **Yes, dengan toggle di user preferences**. Default = OFF (always show portal selection) untuk first 2 weeks, then default = ON.

✅ **APPROVED DECISION**: Implement "Remember Last Portal" toggle. Default OFF for first 2 weeks post-launch, then switch to ON.

---

**Q3**: CRM Platform - Build in-house or use existing CRM solution?
- **Option A (Build in-house)**: Full control, seamless ERP integration
  - **Pro**: Customizable to exact needs, owns all data
  - **Con**: Higher development effort, maintenance overhead
  
- **Option B (Use existing - e.g., Odoo CRM, HubSpot)**: Faster deployment
  - **Pro**: Battle-tested features, less code to maintain
  - **Con**: Integration complexity, licensing cost, limited customization

**Recommendation**: **Option A (Build in-house)** karena:
- Loyalty program logic very specific to F&B
- Need seamless integration dengan ERP daily sales
- Data ownership critical (customer data adalah aset)

---

**Q4**: Sidebar - Always show or auto-hide on scroll?
- **Option A (Always show)**: Sidebar fixed, always visible
- **Option B (Auto-hide)**: Hide on scroll down, show on scroll up

**Recommendation**: **Option A (Always show)** dengan collapse option. User bisa manually collapse jika need more space.

✅ **APPROVED DECISION**: Sidebar always visible dengan manual collapse button. Responsive: auto-collapse di tablet, hamburger menu di mobile.

---

**Q5**: How to handle **deep links** dengan new navigation?
- Example: Email notification "PO #12345 needs approval" → Click link
- Current: Direct link ke `/procurement/pos/12345`
- New system: Need to load Procurement portal first, then detail page

**Solution Options**:
- A: Deep link auto-selects portal, then loads page
- B: Deep link shows portal selection dengan highlight → user clicks → loads page
- C: Deep link loads page directly, sidebar adjusts to show correct section

**Recommendation**: **Option C** - Deep links work as before. System detects portal from URL, loads sidebar accordingly, highlights active section. Transparent to user.

✅ **APPROVED DECISION**: Implement seamless deep linking - system auto-detects portal, loads correct sidebar state, transparent UX.

---

### Technical Decisions

**Q6**: Sidebar implementation - Custom or use component library?
- **Option A (Custom)**: Build from scratch dengan React
- **Option B (Library)**: Use Radix UI Sidebar atau Shadcn sidebar (if exists)

**Recommendation**: **Check if Shadcn has sidebar**, if not, build custom menggunakan Radix primitives (Collapsible, etc). Maintain design consistency.

✅ **APPROVED DECISION**: Build custom sidebar using Radix UI primitives (Collapsible, NavigationMenu) untuk consistency dengan existing Aurora design system.

---

**Q7**: State management for navigation - Context API or Redux/Zustand?
```javascript
// What we need to manage
- Current portal
- Sidebar open/close state
- Sidebar active section
- Sidebar collapsed state (desktop)
- Mobile overlay open/close
```

**Recommendation**: **React Context API** cukup untuk navigation state. Simple, built-in, no extra dependencies.

✅ **APPROVED DECISION**: Use React Context API untuk navigation state management. Create `NavigationContext` dan `PortalContext`.

---

**Q8**: How to version/track navigation structure?
- Navigation menu items bisa change over time (add features)
- Need way to track what user sees vs what's available

**Recommendation**: Create **navigation schema version**
```javascript
// navigation-schema-v2.json
{
  version: "2.0.0",
  portals: [...],
  updated_at: "2026-05-04"
}
```
Store dalam DB, frontend checks version on load. If mismatch, refresh schema.

✅ **APPROVED DECISION**: Implement navigation schema versioning system. Store schema in DB, cache di frontend, auto-refresh on version mismatch.

---

## 🔄 MIGRATION STRATEGY

### User Communication Plan

**4 Weeks Before Launch**:
- Email announcement: "New navigation coming soon!"
- Teaser screenshots di internal dashboard
- Survey: "What do you find confusing about current navigation?"

**2 Weeks Before Launch**:
- Detailed walkthrough article/video
- "What's changing" FAQ document
- Training session schedule announced

**1 Week Before Launch**:
- Pilot group selected (power users from each department)
- Pilot access to staging environment
- Feedback collection

**Launch Day**:
- System-wide notification banner
- Inline tutorial/tooltips on first login (product tour)
- Help desk staffed untuk questions
- "Feedback" button prominent

**Post-Launch**:
- Weekly feedback review
- Bi-weekly improvements release
- User success stories showcased

### Data Migration

**Good News**: **No data migration needed!** 
- All existing collections remain unchanged
- New collections added (crm_users, loyalty_transactions, rewards_catalog)
- Existing auth, RBAC, business data unaffected

**Changes Required**:
- Add portal permission checks to existing routes (backend)
- Update frontend routes to new path structure

### Rollback Plan

**If critical issues found post-launch**:

**Option 1: Feature Flag Toggle**
```javascript
// .env
ENABLE_NEW_NAVIGATION=false  // Switch back to old nav
ENABLE_PORTAL_SELECTION=false
```

**Option 2: Gradual Rollout Control**
```javascript
// Backend determines who sees new nav
if (user.id in BETA_USERS_LIST || ROLLOUT_PERCENTAGE > random()) {
  return NEW_NAV_LAYOUT;
} else {
  return OLD_NAV_LAYOUT;
}
```

**Rollback Decision Criteria**:
- > 20% of users unable to complete common tasks
- Critical security vulnerability found
- System performance degradation > 50%
- > 50 high-priority bugs reported in first week

**Rollback Process**:
1. Disable feature flags (< 5 minutes)
2. Communicate to users (email + banner)
3. Fix issues in staging
4. Re-launch when ready

---

## 📚 APPENDIX

### A. Reference Screenshots Analysis

**(Sudah dianalisis di awal menggunakan analyze_file_tool)**

**Key Takeaways**:
1. **Login screen**: Clean, professional, dark theme works well
2. **Portal selection**: Card-based layout intuitive, good use of icons
3. **ISMAYA Compro**: High-quality imagery, clear sections, premium feel

### B. Competitive Analysis

**Similar Systems Reviewed**:
1. **Odoo ERP** - Apps menu (icon grid), left sidebar per app
2. **SAP Business One** - Module selection + left tree menu
3. **Microsoft Dynamics 365** - App switcher (waffle menu) + sidebar
4. **Salesforce** - App launcher + left nav

**Pattern Consensus**: Industry standard = App selection + Sidebar sub-nav

### C. Technology Stack Recommendations

**Public Platform (Compro + CRM)**:
```
Frontend: React 18 + React Router + Tailwind CSS
CMS: Strapi (headless CMS)
Backend: Node.js + Express (or FastAPI for consistency)
Database: PostgreSQL (for CRM data) atau MongoDB
Auth: JWT + OAuth (social login)
Email: Resend API
SMS: Twilio / Fonnte
Hosting: Vercel (frontend) + Railway (backend)
CDN: CloudFlare
```

**ERP Platform** (existing, minor updates):
```
Frontend: React 18 (keep existing)
Backend: FastAPI (keep existing)
Database: MongoDB (keep existing)
Add: Navigation state management (Context API)
Add: Portal selection routing
```

### D. Glossary

| Term | Definition |
|------|------------|
| **Portal** | Self-contained functional area of ERP (e.g., Finance Portal) |
| **Compro** | Company Profile - public-facing website |
| **CRM** | Customer Relationship Management - loyalty program interface |
| **3-Tier Navigation** | Top navbar (global) + Sidebar (sections) + Horizontal menu (pages) |
| **Portal Selection** | Screen where user chooses which portal to enter |
| **RBAC** | Role-Based Access Control - permission system |
| **COA** | Chart of Accounts (akuntansi) |
| **AR** | Accounts Receivable (piutang) |
| **AP** | Accounts Payable (utang) |
| **KDO/BDO** | Kitchen/Bar Department Out (permintaan bahan ke gudang) |

---

## ✅ NEXT STEPS (Immediate Actions)

### For Stakeholders (Business/Product Team)

1. **Review this plan document** (Est: 2-3 hours)
   - Provide feedback on strategic direction
   - Answer open questions (section Q1-Q8)
   - Approve/modify scope

2. **Prioritize features** (if scope needs trimming)
   - Must-have vs nice-to-have
   - Phase 1 MVP vs Phase 2 enhancements

3. **Approve budget & timeline** 
   - 16 weeks (4 months) acceptable?
   - $141K budget approved?
   - Resource allocation possible?

4. **Schedule kickoff meeting** (once approved)
   - Assign Product Manager
   - Assemble team
   - Set sprint schedule

### For Development Team (Technical Lead)

1. **Technical deep-dive review** (Est: 4-6 hours)
   - Validate architecture decisions
   - Identify technical risks not covered
   - Propose alternative implementations if needed

2. **Create detailed technical specs** (Week 1 of Phase 0)
   - Database schema ERD
   - API endpoint specs (OpenAPI)
   - Component hierarchy diagrams
   - State management flow

3. **Set up development environment** (Week 1)
   - Create separate repo for Compro/CRM
   - Configure CI/CD pipelines
   - Set up staging environments

4. **Prototype critical components** (Week 2 of Phase 0)
   - Portal selection card
   - Collapsible sidebar
   - 3-tier navigation layout
   - Validate technical feasibility

### For Design Team (UI/UX)

1. **Create detailed wireframes** (Week 1 of Phase 0)
   - All public platform pages
   - Portal selection screen (desktop + mobile)
   - Navigation system (all breakpoints)
   - CRM dashboard & loyalty card

2. **Design high-fidelity mockups** (Week 2 of Phase 0)
   - Portal-specific color themes
   - Icon set for sidebar menu items
   - Loading states, empty states, error states
   - Mobile navigation patterns

3. **Build component library in Figma** (Week 2)
   - Navigation components
   - Card variants
   - Form patterns
   - Consistent with existing Aurora design system

4. **User testing** (ongoing)
   - Test portal selection concept
   - Test sidebar usability
   - Test CRM flows

---

## 📄 DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 DRAFT | 2026-05-04 | System Architect | Initial comprehensive plan |
| 1.1 APPROVED | 2026-05-04 | System Architect | All decisions approved, status → APPROVED |

**Document Status**: ✅ **APPROVED** - Ready for Implementation

**Approval Date**: 4 Mei 2026

**Approved By**:
- [x] Product Owner / CEO ✅
- [x] CTO / Technical Lead ✅
- [x] Finance (budget approval) ✅
- [x] UI/UX Lead ✅

**All Strategic & Technical Decisions Finalized** ✅

---

**END OF DOCUMENT**

---

## 💬 Feedback & Questions

Untuk diskusi lebih lanjut atau pertanyaan mengenai plan ini, silakan hubungi:
- **Product Team**: [product@torado.id]
- **Technical Team**: [dev@torado.id]
- **Project Channel**: Slack #aurora-restrukturisasi

**Document ini adalah PLANNING PHASE - TIDAK UNTUK EKSEKUSI sampai approved oleh stakeholders.**

---

---

# 🔍 IMPLEMENTATION AUDIT — Status per Phase
## Dibuat: 5 Mei 2026 | Auditor: E2 (Engineering) | Status: POST-IMPLEMENTATION REVIEW

> **Catatan**: Section ini ditambahkan SETELAH implementasi selesai. Tidak mengubah konten asli dokumen.  
> Referensi cross-check: `plan.md` (completion log), `test_reports/iteration_11.json` (100% pass), codebase aktual.

---

## 📊 RINGKASAN STATUS PER PHASE

| Phase | Nama | Status | Completion |
|-------|------|--------|-----------|
| Phase 0 | Planning & Design | ✅ **SELESAI** | 100% |
| Phase 1 | Public Platform – Compro Website | 🟡 **SELESAI SEBAGIAN** | ~70% |
| Phase 2 | Public Platform – CRM & Loyalty | 🟡 **SELESAI SEBAGIAN** | ~75% |
| Phase 3 | ERP – Portal Selection Screen | ✅ **SELESAI** | 100% |
| Phase 4 | ERP – New Navigation System | 🟡 **SELESAI SEBAGIAN** | ~80% |
| Phase 5 | Integration & Polish | 🔴 **BELUM DIMULAI** | ~30% |
| Phase 6 | Testing, Training & Deployment | 🟡 **SELESAI SEBAGIAN** | ~40% |

---

## ✅ PHASE 0 — Planning & Design

| Deliverable | Status | Catatan |
|-------------|--------|---------|
| Planning document (dokumen ini) | ✅ Done | Dokumen lengkap, semua Q1-Q8 answered |
| Detailed wireframes | ✅ Done | Implemented langsung ke kode (no Figma) |
| UI component library specs | ✅ Done | Shadcn/Tailwind + Aurora design system |
| Database schema design | ✅ Done | MongoDB collections terimplementasi |
| API endpoint specifications | ✅ Done | OpenAPI via FastAPI auto-docs |
| User stories & acceptance criteria | ✅ Done | Dalam `plan.md` per phase |

---

## 🟡 PHASE 1 — Public Platform: Compro Website

### Week 1-2: Frontend Foundation

| Task | Status | Catatan Implementasi |
|------|--------|---------------------|
| Create React app (public routes) | ✅ Done | Dalam existing React app, route `/` sebagai PublicLayout |
| Set up routing for all public pages | ✅ Done | 9 routes: `/`, `/brands`, `/brands/:id`, `/menu`, `/locations`, `/about`, `/news`, `/careers`, `/contact` |
| Implement design system components | ✅ Done | ISMAYA-style: Cormorant Garamond + Azeret Mono, cream/espresso/gold palette |
| Build responsive layouts | ✅ Done | Mobile-first, custom cursor, marquee, draggable gallery, AnimatePresence |
| Integrate image CDN | ❌ **BELUM** | Images menggunakan Unsplash CDN URLs di `publicContent.js`, bukan dedicated CDN setup |

### Week 3-4: CMS Integration & Content

| Task | Status | Catatan Implementasi |
|------|--------|---------------------|
| Set up headless CMS (Strapi) | ❌ **BELUM** | **GAP UTAMA**: Semua konten di-hardcode di `publicContent.js` (319 baris static) |
| Define content models | ❌ **BELUM** | Tidak ada CMS schema (brands, menu items, news, outlets) |
| Build admin interface for content management | ❌ **BELUM** | Marketing team tidak bisa update konten tanpa deploy ulang |
| API integration for dynamic content | ❌ **BELUM** | Halaman publik tidak mengambil data dari backend/CMS |
| SEO optimization | ❌ **BELUM** | Tidak ada `<meta>` tags, Open Graph, sitemap, atau structured data |

**Deliverables:**

| Item | Status |
|------|--------|
| Homepage (hero, brand showcase, news) | ✅ Done |
| About Us page | ✅ Done |
| Contact page | ✅ Done |
| Basic menu catalog (static data) | ✅ Done (data statis `publicContent.js`) |
| Dynamic content loading | ❌ Belum (semua hardcoded) |
| Admin CMS access for marketing team | ❌ Belum |
| Locations/outlets page with map | ✅ Done (tanpa interactive map — hanya daftar) |
| News/blog section | ✅ Done |
| Careers page | ✅ Done |

**Testing:**

| Item | Status |
|------|--------|
| Cross-browser testing | ❌ Belum formal |
| Mobile responsiveness | ✅ Done (manual smoke test) |
| Performance audit (Lighthouse > 90) | ❌ Belum dijalankan |
| Accessibility audit (WCAG AA) | ❌ Belum |

### 🔴 GAPS Phase 1 yang Perlu Diselesaikan:
1. **CMS Integration** — konten saat ini statis, marketing tidak bisa update
2. **SEO Optimization** — `<meta>` tags, OG image, sitemap, robots.txt  
3. **Interactive Map** — Locations page belum punya peta (Google Maps / Mapbox)
4. **Performance Audit** — Lighthouse score belum diverifikasi
5. **Accessibility** — WCAG AA belum diaudit

---

## 🟡 PHASE 2 — Public Platform: CRM & Loyalty

### Week 1: Authentication System

| Task | Status | Catatan Implementasi |
|------|--------|---------------------|
| Design customer authentication architecture | ✅ Done | JWT tokens terpisah dari ERP auth (`LoyaltyAuthContext`) |
| Implement registration flow (email/password) | ✅ Done | `LoyaltyRegister.jsx` + `/api/loyalty/register` |
| Email verification system | ❌ **BELUM** | Tidak ada email verification flow |
| SMS OTP integration (Twilio/Fonnte) | ❌ **BELUM** | Tidak ada SMS/phone OTP |
| Password reset flow | ❌ **BELUM** | Tidak ada forgot password di loyalty |
| Session management (JWT) | ✅ Done | Token di localStorage, `RequireLoyaltyAuth` guard |
| Social login (Google, Facebook) | ❌ **BELUM** | Hanya email+password |

**Deliverables:**

| Item | Status |
|------|--------|
| Customer registration (email/password) | ✅ Done |
| Login (email/password) | ✅ Done |
| Social login (Google, Facebook) | ❌ Belum |
| Phone + OTP | ❌ Belum |
| Profile management | ✅ Done (`LoyaltyProfile.jsx`) |

### Week 2: Loyalty Program Core

| Task | Status | Catatan Implementasi |
|------|--------|---------------------|
| Database schema loyalty | ✅ Done | `crm_customers`, `loyalty_transactions`, `rewards_catalog` collections |
| Backend API points logic | ✅ Done | `loyalty_service.py`, `award_points`, `create_transaction` |
| Tier calculation system | ✅ Done | bronze/silver/gold/platinum berdasarkan total_points |
| Digital loyalty card + QR code | ✅ Done | `LoyaltyCard.jsx` + `/api/loyalty/card` |
| Points earning rules engine | ✅ Done | Points award saat redemption/admin adjust |

**Deliverables:**

| Item | Status |
|------|--------|
| Customer dashboard | ✅ Done (4 quick-action cards) |
| Digital loyalty card | ✅ Done (QR code) |
| Points balance & history | ✅ Done (`LoyaltyHistory.jsx`) |
| Tier status display | ✅ Done |

### Week 3: Rewards & Integration

| Task | Status | Catatan Implementasi |
|------|--------|---------------------|
| Rewards catalog CRUD | ✅ Done | `LoyaltyAdminRewards.jsx` + backend CRUD |
| Redemption flow | ✅ Done | `RedeemModal` di `LoyaltyRewards.jsx` |
| Voucher code generation | ✅ Done | `reward_service.py` |
| **Integration ERP: daily sales → points posting** | ❌ **BELUM** | **GAP KRITIS**: Tidak ada auto-posting poin dari Daily Sales ERP ke loyalty customer |
| Customer analytics dashboard (ERP admin) | ✅ Done | `LoyaltyAdminHome.jsx` — analytics overview |

**Deliverables:**

| Item | Status |
|------|--------|
| Rewards catalog browsing | ✅ Done |
| Redeem rewards functionality | ✅ Done |
| Transaction history | ✅ Done |
| Integration dengan ERP daily sales | ❌ **Belum — GAP KRITIS** |

### 🔴 GAPS Phase 2 yang Perlu Diselesaikan:
1. **Social Login (Google/Facebook)** — hanya email+password tersedia
2. **SMS OTP / Email Verification** — registrasi tanpa verifikasi
3. **Password Reset Flow** — tidak ada lupa password
4. **Daily Sales → Loyalty Points Auto-Posting** — **INTEGRASI PALING PENTING yang belum ada**
5. **Customer Lookup di Outlet** — outlet staff tidak bisa scan loyalty card customer saat kasir

---

## ✅ PHASE 3 — ERP: Portal Selection Screen

| Deliverable | Status | Catatan Implementasi |
|-------------|--------|---------------------|
| Card-based portal chooser | ✅ Done | `PortalSelection.jsx` — 8 portal cards |
| Background image + overlay gradient | ✅ Done | Setiap kartu punya `backgroundImage` + accent glow per portal |
| RBAC-aware (filter by access) | ✅ Done | `visiblePortalsFor(user)` dari `portals.js` |
| Smooth transitions to portal dashboard | ✅ Done | `HomeRedirect.jsx` handle flow |
| "Switch Portal" di user menu | ✅ Done | `UserMenu.jsx` → `/portal-select` |
| Search bar (portal > 4) | ✅ Done | Auto-show saat banyak portal |
| Empty state (no access) | ✅ Done | `/no-access` route |
| Loading states & animations | ✅ Done | |
| `data-testid` attributes | ✅ Done | |
| "Remember Last Portal" toggle | ✅ Done | `aurora_remember_last_portal` localStorage |

**Status: FULLY IMPLEMENTED ✅ — Semua deliverables selesai**

---

## 🟡 PHASE 4 — ERP: New Navigation System

### Infrastruktur Navigasi

| Deliverable | Status | Catatan Implementasi |
|-------------|--------|---------------------|
| Sidebar component (collapsible) | ✅ Done | `Sidebar.jsx` |
| Level 3 horizontal sub-menu (Subnav) | ✅ Done | `Subnav.jsx` |
| Top navbar update (search, notifications) | ✅ Done | `TopNav.jsx` — search, bell, user menu |
| NavigationContext | ✅ Done | `contexts/NavigationContext.js` |
| Navigation schema (8 portals) | ✅ Done | `lib/navigationSchema.js` |
| Mobile responsive (hamburger/overlay) | ✅ Done | `MobileSidebar.jsx` |
| Sidebar collapse animation + persist | ✅ Done | `aurora_sidebar_sections` localStorage |
| Mobile subnav overflow fade indicators | ✅ Done | |
| Deep linking (seamless) | ✅ Done | Auto-detect portal from URL |
| Global Search (CMD+K) | ✅ Done | `GlobalSearch.jsx` + `/api/search` |
| Notification Bell + Drawer | ✅ Done | `NotificationBell.jsx` + `NotificationDrawer.jsx` |
| Dark Mode Toggle | ✅ Done | `ThemeToggle.jsx` |

### GAP: Navigation Schema vs. Rencana Per Portal

#### Admin Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Overview | ✅ Done | |
| User Management → All Users | ✅ Done | |
| User Management → Roles & Permissions | ✅ Done | |
| User Management → **Activity Log** | ❌ Belum di schema | `AuditLog.jsx` ada tapi tidak ada di nav sidebar |
| Organization → Outlets | ✅ Done | |
| Organization → Brands | ✅ Done | |
| Organization → **Departments** | ❌ Belum | Tidak ada di nav schema dan halaman tidak ada |
| Master Data → Items | ✅ Done | |
| Master Data → Vendors | ✅ Done | |
| Master Data → **Customers** | ❌ Belum | Plan mencantumkan Customers di master data |
| Master Data → **Employees** | ❌ Belum | Karyawan dimanage di HR, tidak di Master Data nav |
| System Settings → General | ✅ Done | |
| **Configuration → Business Rules** | ❌ Belum di schema | Halaman ada (`/admin/configuration`) tapi tidak di sidebar |
| **Configuration → Approval Workflows** | ❌ Belum di schema | `ApprovalWorkflows.jsx` ada tapi tidak di sidebar nav |
| **Configuration → Notifications** | ❌ Belum | |
| **Audit & Logs → Audit Log** | ❌ Belum di schema | File `AuditLog.jsx` ada tapi tidak masuk navigation schema |
| **Loyalty** | ✅ Done (BONUS) | Tidak ada di plan asal, ditambahkan di implementasi |

#### Executive Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Overview | ✅ Done | |
| Dashboard → Drilldown | ✅ Done | |
| Performance → Brand Mix | ✅ Done | |
| **Financial Metrics → Cash Position** | ❌ Belum di schema | Ada di Owner portal, tidak di Executive |
| **Financial Metrics → Profit Walk** | ❌ Belum di schema | Ada di Owner portal, tidak di Executive schema |
| **Financial Metrics → Period Compare** | ❌ Belum di schema | `PeriodCompare.jsx` ada tapi tidak di nav schema |
| **Analytics → KPIs / Trends** | ❌ Belum di schema | Tidak ada section analytics |
| **Analytics → Forecasting** | ❌ Belum di schema | Forecasting ada di Finance, tidak di Executive nav |
| AI Insights → Executive Q&A | ✅ Done | |
| AI Insights → Anomaly Detection | ✅ Done | |
| **Reports → Custom Reports** | ❌ Belum di schema | ReportBuilder/Pivot ada di Finance, tidak di Executive |
| **Calendar → Events & Milestones** | ❌ Belum | Tidak diimplementasi sama sekali |

#### Finance Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Overview → Dashboard | ✅ Done | |
| Transactions → Sales Validation | ✅ Done | |
| Transactions → Journals | ✅ Done | |
| Transactions → Manual JE | ✅ Done | |
| Payments → AP (Payables) | ✅ Done | |
| Payments → Payments | ✅ Done | |
| Payments → Bank Reconciliation | ✅ Done | |
| **Payments → Receivables (AR)** | ❌ Belum di schema | AR modul belum dibangun |
| Reports → Trial Balance | ✅ Done | |
| Reports → Profit & Loss | ✅ Done | |
| Reports → Balance Sheet | ✅ Done | |
| Reports → Cashflow | ✅ Done | |
| **Reports → Custom Reports** | ❌ Belum di schema | ReportBuilder ada di halaman tapi tidak di sidebar |
| Tax → Tax Center | ✅ Done | |
| Tax → e-Faktur | ✅ Done (partial) | Module e-Faktur ada tapi compliance PPN 12% masih gap |
| **Assets & Budget → Fixed Assets** | ❌ Belum | Modul belum dibangun |
| **Assets & Budget → Budget vs Actual** | ❌ Belum | Modul belum dibangun |
| Period → Periods | ✅ Done | |
| **Period → Closing Wizard** | ❌ Belum di schema | `PeriodClosingWizard.jsx` ada (link dari PeriodList) tapi tidak di sidebar |
| **Finance Config → Chart of Accounts** | ❌ Belum di schema | `COABrowser.jsx` ada di Finance tapi tidak di sidebar |

#### HR Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Overview | ✅ Done | |
| **Employee Management → All Employees** | ❌ Belum | Tidak ada halaman Employee list di HR portal |
| **Employee Management → Attendance** | ❌ Belum | Tidak ada modul attendance |
| **Employee Management → Leave Management** | ❌ Belum | Tidak ada modul leave |
| Payroll → Payroll Processing | ✅ Done | |
| Payroll → Service Charge | ✅ Done | |
| Benefits → Incentive Programs | ✅ Done | `IncentiveList.jsx` ada di portal tapi tidak di nav schema |
| Benefits → Voucher Issuance | ✅ Done | Di schema tapi dalam section berbeda |
| **Benefits → LB Fund** | 🟡 Done (wrong section) | Masuk ke Advances section di schema, seharusnya Benefits |
| Advances → Employee Advances | ✅ Done | |
| **HR Reports** | ❌ Belum di schema | Tidak ada section Reports di HR nav schema |
| **HR Configuration** | ❌ Belum di schema | Tidak ada section Config di HR nav schema |

#### Procurement Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Overview | ✅ Done | |
| Requests → Purchase Requests | ✅ Done | |
| Requests → Consolidation | ✅ Done | |
| Purchase Orders → All POs | ✅ Done | |
| **Purchase Orders → Create PO** | ❌ Belum di schema | Form ada tapi shortcut di nav tidak ada |
| **Purchase Orders → PO Tracking** | ❌ Belum | Tidak ada tracking view |
| Purchase Orders → PO Comparison | ✅ Done | |
| Goods Receipt → All GRs | ✅ Done | |
| **Goods Receipt → Create GR** | ❌ Belum di schema | Form ada tapi shortcut di nav tidak ada |
| Vendors → All Vendors | ✅ Done | |
| Vendors → Vendor Scorecard | ✅ Done | |
| **Vendors → Vendor Comparison** | ❌ Belum di schema | Halaman ada di ERP tapi tidak masuk nav schema |
| **Procurement Reports → Spend Analysis** | ❌ Belum | Tidak ada |
| **Workflows → Approvals** | ❌ Belum di schema | Global approvals ada di `/approvals` tapi tidak di Procurement sidebar |

#### Inventory Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Overview | ✅ Done | |
| Stock → Stock Balance | ✅ Done | |
| Stock → Stock Matrix | ✅ Done | |
| **Stock → Low Stock Alert** | ❌ Belum di schema | Fitur ada di backend (`low_stock_alert`) tapi tidak di sidebar nav |
| Movements → Transfers | ✅ Done | |
| Movements → Transfer Requests | ✅ Done | |
| **Movements → Movement History** | ❌ Belum di schema | Data ada di DB tapi tidak ada view khusus |
| Opname → Start Opname | ✅ Done | |
| Opname → Opname History | ✅ Done | |
| Adjustments → Stock Adjustment | ✅ Done | |
| **Inventory Reports → Valuation / Aging / Movement** | ❌ Belum | Tidak ada section Reports di Inventory nav |
| **Inventory Config → Categories & Units** | ❌ Belum | Tidak ada |

#### Outlet Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Dashboard → Today's Summary | ✅ Done | |
| Daily Operations → Daily Sales Entry | ✅ Done | |
| Daily Operations → Sales Wizard | ✅ Done | |
| **Daily Operations → Sales History** | ❌ Belum di schema | Data ada tapi tidak ada dedicated history nav item |
| Cash → Petty Cash | ✅ Done | |
| **Cash → Cash Count** | ❌ Belum | Tidak ada |
| **Cash → Replenishment** | ❌ Belum | Tidak ada |
| Kitchen → KDO | ✅ Done | |
| Kitchen → BDO | ✅ Done | |
| **Outlet Inventory → Current Stock** | ❌ Belum | Outlet tidak bisa lihat stok langsung |
| **Outlet Inventory → Request Transfer** | ❌ Belum di schema | Fitur ada tapi tidak di sidebar |
| **Urgent Purchase** | ❌ Belum di schema | `UrgentPurchaseList.jsx` ada tapi tidak di sidebar |
| **Shift & Closing → Daily Close** | ❌ Belum di schema | `DailySalesList` ada closing tapi tidak di sidebar |
| **Shift & Closing → Close History** | ❌ Belum | |
| **Outlet Reports → Performance** | ❌ Belum | |

#### Owner Portal — Schema vs. Rencana

| Section (Plan) | Status | Gap Detail |
|----------------|--------|-----------|
| Cockpit → Executive Summary | ✅ Done | |
| Financial → Cash Position | ✅ Done | |
| Financial → Profit Walk | ✅ Done | |
| **Financial → Key Metrics** | ❌ Belum | Tidak ada dedicated Key Metrics page |
| Intelligence → Brand Performance | ✅ Done | |
| Intelligence → Outlet Rankings | ✅ Done | |
| **Intelligence → Trends** | ❌ Belum | Tidak ada dedicated Trends page |
| **Forecasting → Predictive Analytics** | ❌ Belum di schema | `Forecasting` ada di Finance tapi tidak di Owner sidebar |
| AI → Business Q&A | ✅ Done | |
| Digest → Daily Digest | ✅ Done | |
| **Digest → Telegram Setup** | ❌ Belum di schema | `DigestSettings.jsx` ada tapi tidak di sidebar nav |
| **Digest → Email Preferences** | ❌ Belum di schema | Tidak ada di sidebar |
| **Owner Settings → Preferences** | ❌ Belum | Tidak ada halaman settings Owner |

---

## 🔴 PHASE 5 — Integration & Polish

### CRM ↔ ERP Integration

| Task | Status | Catatan |
|------|--------|---------|
| **Daily sales → loyalty points posting** | ❌ **BELUM** | **GAP PALING KRITIS**: Saat Daily Sales di-validate, tidak ada auto-post poin ke customer loyalty. Perlu: 1) Tambah field `customer_phone` atau `loyalty_id` di Daily Sales form, 2) Auto-call `award_points()` saat sales divalidasi |
| **Voucher redemption → discount di POS** | ❌ **BELUM** | Tidak ada mekanisme outlet apply voucher dari CRM ke Daily Sales |
| **Customer lookup di Outlet portal** | ❌ **BELUM** | Outlet staff tidak bisa cari customer loyalty saat kasir (scan atau cari by phone) |
| CRM analytics di Marketing portal | ❌ **BELUM** | Tidak ada Marketing portal, CRM analytics hanya ada di Admin Loyalty |

### Polish Items

| Task | Status | Catatan |
|------|--------|---------|
| Global search implementation | ✅ Done | `GlobalSearch.jsx` + `search_service.py` + `/api/search` |
| Notification bell icon | ✅ Done | `NotificationBell.jsx` + `NotificationDrawer.jsx` |
| Dark mode toggle | ✅ Done | `ThemeToggle.jsx` |
| Loading states & skeleton screens | ✅ Done | `LoadingState.jsx`, `Skeleton` component dari shadcn |
| Error boundaries & fallbacks | 🟡 Partial | Tidak ada React `ErrorBoundary` class component explicit, hanya toast errors |
| Performance optimization | 🟡 Partial | Cache aktif di backend, tapi belum Gzip middleware, react-query hooks belum migrated |
| Accessibility audit | ❌ Belum | Tidak ada ARIA labels audit, skip-nav links, dsb. |

---

## 🟡 PHASE 6 — Testing, Training & Deployment

| Task | Status | Catatan |
|------|--------|---------|
| End-to-end user flow testing | ✅ Done | `test_reports/iteration_11.json` — 100% pass (21/21 backend + all frontend features) |
| RBAC regression testing | ✅ Done | Termasuk dalam testing iterations sebelumnya |
| Cross-browser testing | ❌ Belum formal | Hanya manual spot-check |
| Mobile device testing | ❌ Belum formal | Tidak ada multi-device test suite |
| Performance testing (load time, bundle size) | ❌ Belum | Tidak ada Lighthouse audit report |
| Security audit (auth, session, XSS, CSRF) | ❌ Belum | |
| User documentation (navigation guide) | ❌ Belum | |
| Video tutorials per portal | ❌ Belum | |
| Training sessions | ❌ Belum | |
| Gradual rollout (pilot → all users) | ❌ Belum | |

---

## 🎯 SUCCESS CRITERIA CHECK (dari Plan Asli)

| Kriteria | Status | Gap / Catatan |
|----------|--------|---------------|
| All 8 portals accessible via portal selection | ✅ | |
| 3-tier navigation functional (desktop + mobile) | ✅ | |
| Compro website live with 9 pages | ✅ | Konten statis, belum dinamis |
| CRM loyalty program operational | ✅ | |
| Integration CRM → ERP (daily sales → points) | ❌ **BELUM** | Gap kritis |
| Page load time < 2 seconds | ❓ Not tested | Perlu Lighthouse audit |
| Zero critical bugs | 🟡 | 100% test pass, tapi belum security audit |
| Security audit passed | ❌ Belum | |
| WCAG AA accessibility | ❌ Belum | |

---

## 📋 PLAN PENGEMBANGAN LANJUTAN (Berdasarkan Gap Analysis)

### 🔴 Priority 1 — Integration Gaps (Phase 5 yang belum)

**P1.1: Daily Sales → Loyalty Points Auto-Posting**
- Backend: Tambah field `customer_phone` (optional) di Daily Sales model
- Backend: Saat `validate_daily_sales()` dipanggil → lookup customer by phone → `award_points()`
- Frontend: Tambah field "Loyalty Customer" (search by phone/name) di `DailySalesForm.jsx`
- Estimasi: ~3 hari

**P1.2: Customer Lookup di Outlet (Loyalty Scan)**
- Frontend: Tambah tombol "Cari Customer Loyalty" di Daily Sales Wizard
- Backend: Endpoint `GET /api/loyalty/lookup?phone=xxx`
- Estimasi: ~1.5 hari

**P1.3: Voucher Redemption di Outlet**
- Frontend: Field "Apply Voucher Code" di Daily Sales form → validasi → apply sebagai discount
- Backend: `POST /api/loyalty/vouchers/validate` — cek kode, expire, mark used
- Estimasi: ~2 hari

### 🟠 Priority 2 — Navigation Schema Gaps

**P2.1: Admin Sidebar — Tambah Missing Sections**
- Tambah "Configuration" section (Business Rules, Approval Workflows) ke nav schema Admin
- Tambah "Audit & Logs" section ke nav schema Admin
- Estimasi: ~0.5 hari

**P2.2: Finance Sidebar — Tambah Missing Items**
- Tambah "Assets & Budget" section (placeholder, tunggu modul)
- Tambah "Finance Config → COA" ke sidebar
- Tambah "Closing Wizard" link di Period section
- Estimasi: ~0.5 hari

**P2.3: Outlet Sidebar — Tambah Missing Sections**
- Tambah "Urgent Purchase" ke sidebar
- Tambah "Shift & Closing" section
- Tambah "Outlet Inventory" section
- Estimasi: ~0.5 hari

**P2.4: Semua Portal — Tambah Section Reports/Config yang Hilang**
- HR: Tambah "HR Reports" + "HR Config"
- Procurement: Tambah "Procurement Reports" + "Workflows"
- Inventory: Tambah "Inventory Reports" + "Inventory Config"
- Owner: Tambah "Digest" entries (Telegram Setup, Email Preferences)
- Estimasi: ~1 hari

### 🟡 Priority 3 — Compro & CRM Enhancements

**P3.1: SEO Optimization**
- Tambah `<meta>` tags, Open Graph, Twitter Card di `public/index.html` dan per halaman
- Buat `sitemap.xml` dan `robots.txt`
- Estimasi: ~1 hari

**P3.2: CMS / Dynamic Content untuk Compro**
- Option A (Rekomendasi): Backend API untuk konten Compro (`/api/public/brands`, `/api/public/news`, `/api/public/menu`)
- Option B: Headless CMS (Strapi) — effort lebih besar tapi lebih scalable
- Estimasi Option A: ~3 hari

**P3.3: Interactive Map di Locations**
- Integrasikan Google Maps Embed atau Leaflet.js
- Estimasi: ~1 hari

**P3.4: Social Login + Email Verification (CRM)**
- Google OAuth untuk customer login
- Email verification saat register
- Password reset flow
- Estimasi: ~4 hari

### 🟢 Priority 4 — Finance Module Gaps (Critical untuk Indonesia)

**P4.1: PPN 12% Update (BLOCKER)**
- Update tax rate dari 11% → 12% di seed data + `tax_codes` collection
- Estimasi: ~1 hari

**P4.2: Fixed Asset & Depreciation Module**
- Backend: `fixed_assets` collection + `depreciation_service.py` + scheduler
- Frontend: Asset List + Asset Detail + Disposal flow
- Estimasi: ~7 hari

**P4.3: Budget Module + Budget vs Actual**
- Backend: `budgets` collection + bulk import Excel
- Frontend: Budget input form + Budget vs Actual P&L report
- Estimasi: ~8 hari

**P4.4: AR Ledger**
- Backend: AR lifecycle endpoints
- Frontend: AR Invoices + Aging report
- Estimasi: ~5 hari

### 🔵 Priority 5 — Polish

**P5.1: Performance Audit**
- Jalankan Lighthouse audit, target > 90 untuk semua portal
- Implementasi GZip middleware di FastAPI
- Estimasi: ~1 hari

**P5.2: Error Boundaries**
- Tambah React `ErrorBoundary` component untuk semua portal
- Estimasi: ~1 hari

**P5.3: Accessibility Quick Wins**
- Audit ARIA labels di form elements, navigation, buttons
- Tambah skip-navigation link
- Estimasi: ~2 hari

---

## 📊 GAP SUMMARY TABLE

| Kategori | Total Features di Plan | Implemented | Gap |
|----------|----------------------|-------------|-----|
| Phase 0 (Planning) | 6 | 6 | 0 |
| Phase 1 (Compro) | 14 | 8 | 6 ❌ |
| Phase 2 (CRM/Loyalty) | 15 | 10 | 5 ❌ |
| Phase 3 (Portal Selection) | 10 | 10 | 0 ✅ |
| Phase 4 (Navigation infra) | 12 | 12 | 0 ✅ |
| Phase 4 (Nav Schema Admin) | 11 | 5 | 6 ❌ |
| Phase 4 (Nav Schema Executive) | 11 | 5 | 6 ❌ |
| Phase 4 (Nav Schema Finance) | 14 | 9 | 5 ❌ |
| Phase 4 (Nav Schema HR) | 11 | 5 | 6 ❌ |
| Phase 4 (Nav Schema Procurement) | 12 | 6 | 6 ❌ |
| Phase 4 (Nav Schema Inventory) | 11 | 6 | 5 ❌ |
| Phase 4 (Nav Schema Outlet) | 14 | 5 | 9 ❌ |
| Phase 4 (Nav Schema Owner) | 12 | 7 | 5 ❌ |
| Phase 5 (Integration) | 8 | 4 | 4 ❌ |
| Phase 5 (Polish) | 7 | 4 | 3 🟡 |
| Phase 6 (Testing/Deploy) | 10 | 3 | 7 ❌ |
| **TOTAL** | **178** | **105** | **73** |

**Overall Completion: ~59%** dari seluruh rencana

---

## ⚡ RECOMMENDED NEXT SPRINT

Berdasarkan gap analysis, urutan prioritas yang direkomendasikan:

### Sprint A — "Integration & Quick Nav Wins" (5–7 hari)
1. ✅ → Daily Sales + Loyalty Points Integration (P1.1) — 3 hari
2. ✅ → Customer Lookup di Outlet (P1.2) — 1.5 hari
3. ✅ → Navigation Schema gaps: Admin Config, Finance COA, Outlet Urgent Purchase + Closing (P2.1–2.4) — 2 hari
4. ✅ → SEO Meta Tags untuk Compro (P3.1) — 1 hari

### Sprint B — "Finance Compliance" (10–12 hari)
1. ✅ → PPN 12% Update (P4.1) — 1 hari (**BLOCKER go-live**)
2. ✅ → Fixed Asset & Depreciation (P4.2) — 7 hari
3. ✅ → Budget Module (P4.3) — 8 hari

### Sprint C — "CRM Enhancement" (6–8 hari)
1. ✅ → Voucher Redemption di Outlet (P1.3) — 2 hari
2. ✅ → Social Login + Email Verification (P3.4) — 4 hari
3. ✅ → Interactive Map Locations (P3.3) — 1 hari

### Sprint D — "Dynamic Content & Polish" (5 hari)
1. ✅ → CMS/Dynamic content Compro (P3.2) — 3 hari
2. ✅ → Performance Audit + GZip (P5.1) — 1 hari
3. ✅ → Error Boundaries (P5.2) — 1 hari

---

*Dokumen Implementation Audit ini ditambahkan oleh E2 Engineering pada 5 Mei 2026.*  
*Untuk pertanyaan teknis: dev@torado.id*
