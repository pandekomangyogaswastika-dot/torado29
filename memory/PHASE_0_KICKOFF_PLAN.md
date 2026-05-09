# 🚀 PHASE 0: PLANNING & DESIGN - Kickoff Plan
## Aurora F&B ERP Restrukturisasi - Detailed First 2 Weeks

**Phase Duration**: 2 weeks (10 working days)  
**Start Date**: [Week of May 6, 2026]  
**Team**: Full 7-person squad  
**Goal**: Complete all design & technical planning before development starts

---

## 📅 WEEK 1: DISCOVERY & WIREFRAMING

### Day 1 (Monday): Project Kickoff

**Morning (9:00 - 12:00)**
- ✅ **Kickoff Meeting** (All team, 2 hours)
  - Review approved plan document
  - Introduce team members & roles
  - Set working agreements (hours, communication, tools)
  - Q&A session
  
- ✅ **Tool Setup** (1 hour)
  - Jira/Linear project created
  - Slack channels (#aurora-restrukturisasi, #aurora-dev, #aurora-design)
  - GitHub repos initialized
  - Figma workspace set up

**Afternoon (13:00 - 17:00)**
- 🎨 **Designer**: Start low-fidelity wireframes (Compro homepage, portal selection)
- 💻 **Frontend Devs**: Audit existing Aurora components, create reusable components list
- ⚙️ **Backend Devs**: Review database schema, start ERD for CRM/Loyalty
- 📋 **PM**: Create sprint 1 backlog, user stories

**Deliverables**:
- [x] Project workspace ready
- [x] Wireframe sketches (rough)
- [x] Component audit spreadsheet
- [x] Database ERD v0.1

---

### Day 2 (Tuesday): Information Architecture

**Morning**
- 🎨 **Designer**: 
  - Information architecture untuk public platform (sitemap)
  - User flow diagrams (CRM registration → loyalty card → redeem)
  
- 💻 **Frontend Leads**:
  - Design component hierarchy untuk 3-tier navigation
  - Plan routing structure (all portals)
  
- ⚙️ **Backend Leads**:
  - API endpoint specifications (RESTful design)
  - Authentication flow diagram (dual system: ERP vs CRM)

**Afternoon**
- 👥 **Team Workshop**: Navigation structure review (2 hours)
  - Walk through portal-by-portal sidebar structure
  - Validate menu groupings
  - Identify missing pages/features
  
- 🎨 **Designer**: Refine wireframes based on feedback

**Deliverables**:
- [x] Public platform sitemap
- [x] User flow diagrams (3-5 critical flows)
- [x] Component hierarchy document
- [x] API endpoint list (50+ endpoints estimated)
- [x] Updated wireframes (digital, low-fi)

---

### Day 3 (Wednesday): Wireframe Sprint

**All Day**
- 🎨 **Designer Focus Day**: Produce digital wireframes
  - [ ] Compro: Homepage, About, Menu, Locations, Contact (5 pages)
  - [ ] CRM: Login, Dashboard, Loyalty Card, Rewards, Profile (5 pages)
  - [ ] ERP: Portal Selection (desktop + mobile), 3-tier navigation template (3 layouts)
  
- 💻 **Frontend Devs**: 
  - Build navigation prototype (coded, no data)
  - Test Radix UI Collapsible component integration
  
- ⚙️ **Backend Devs**:
  - Complete database schema (all collections)
  - Start OpenAPI spec for CRM API

**Deliverables**:
- [x] 13 wireframe screens (grayscale, annotated)
- [x] Working navigation prototype (HTML/CSS)
- [x] Database schema v1.0 (complete)
- [x] OpenAPI spec v0.1 (CRM endpoints)

---

### Day 4 (Thursday): Design System & API Specs

**Morning**
- 🎨 **Designer**: 
  - Define color palette per portal (8 portal colors)
  - Typography scale finalized
  - Icon set selection (lucide-react)
  
- 💻 **Frontend Devs**:
  - Create design tokens file (CSS variables)
  - Build Storybook setup for component development
  
- ⚙️ **Backend Devs**:
  - Complete OpenAPI spec (all endpoints: CRM + ERP extensions)
  - Database indexes & optimization planning

**Afternoon**
- 👥 **Design Review Session** (2 hours)
  - Present wireframes to stakeholders
  - Gather feedback
  - Prioritize changes
  
- 🎨 **Designer**: Incorporate feedback, start high-fidelity mockups

**Deliverables**:
- [x] Design system foundation (colors, typography, spacing)
- [x] OpenAPI spec v1.0 (complete, 80+ endpoints)
- [x] Wireframe feedback incorporated
- [x] First high-fi mockup (portal selection screen)

---

### Day 5 (Friday): Technical Architecture Finalization

**Morning**
- ⚙️ **Backend Leads**: 
  - Architecture diagram (system components, data flow)
  - Security architecture (auth, session, encryption)
  - Integration points (CRM ↔ ERP)
  
- 💻 **Frontend Leads**:
  - React context API structure (navigation state)
  - Routing configuration (React Router v6)
  - Code splitting strategy
  
- 🧪 **QA Engineer**:
  - Testing strategy document
  - Test plan template (unit, integration, E2E)
  - Automation tool selection (Playwright/Cypress)

**Afternoon**
- 👥 **Tech Review Meeting** (2 hours)
  - Present architecture to team
  - Identify technical risks
  - Assign owners untuk complex modules
  
- 📋 **PM**: Week 2 planning, refine backlog

**Deliverables**:
- [x] System architecture diagram
- [x] Security architecture document
- [x] Frontend architecture (contexts, routing, splitting)
- [x] Testing strategy document
- [x] Week 1 retrospective

---

## 📅 WEEK 2: MOCKUPS & TECHNICAL PREP

### Day 6 (Monday): High-Fidelity Mockup Sprint

**All Day**
- 🎨 **Designer Focus**: Produce high-fi mockups
  - [ ] Public Platform: All 8 pages (Compro + CRM)
  - [ ] Portal Selection: Desktop + tablet + mobile variants
  - [ ] Navigation System: 3-tier layout dengan sample content (Finance Portal)
  - [ ] Component library: Buttons, cards, forms, tables, sidebar items
  
- 💻 **Frontend Devs**:
  - Set up monorepo structure (Turborepo/Nx)
  - Configure build tools (Vite, esbuild)
  - Create component boilerplate (Sidebar, PortalCard, etc.)
  
- ⚙️ **Backend Devs**:
  - Set up development database (MongoDB Atlas staging)
  - Seed initial data (users, roles, permissions, outlets)
  - API scaffolding (FastAPI routers structure)

**Deliverables**:
- [x] 15+ high-fidelity mockup screens
- [x] Monorepo structure ready
- [x] Database staging environment ready
- [x] API boilerplate code

---

### Day 7 (Tuesday): Component Library Build

**Morning**
- 🎨 **Designer**: 
  - Finalize component library in Figma
  - Export assets (icons, logos, images)
  - Create design handoff notes
  
- 💻 **Frontend Devs**:
  - Build Shadcn-style components for new elements:
    - `<PortalCard />` (for portal selection)
    - `<Sidebar />` with `<SidebarSection />` dan `<SidebarItem />`
    - `<HorizontalSubMenu />` (Level 3 navigation)
  - Responsive behavior implementation
  
- ⚙️ **Backend Devs**:
  - Implement authentication endpoints (ERP existing + CRM new)
  - RBAC extensions (portal permissions)

**Afternoon**
- 👥 **Component Demo** (1 hour)
  - Show built components to designer
  - Verify against mockups
  - Adjust styling
  
- 💻 **Frontend Devs**: Polish components based on feedback

**Deliverables**:
- [x] Figma component library (complete)
- [x] Coded reusable components (5-8 components)
- [x] Authentication API ready (backend)
- [x] RBAC extensions implemented

---

### Day 8 (Wednesday): Integration Planning & Prototyping

**Morning**
- ⚙️ **Backend Devs**: 
  - Design integration API contract (CRM ↔ ERP)
  - Daily sales → loyalty points posting logic
  - Voucher redemption → discount mapping
  
- 💻 **Frontend Devs**:
  - Build interactive prototype:
    - Portal selection → Finance portal → Navigate via sidebar → Switch portal
  - Test responsiveness (desktop → tablet → mobile)
  
- 🎨 **Designer**: 
  - Create final mockups for remaining screens
  - Design loading states, empty states, error states

**Afternoon**
- 👥 **Integration Workshop** (2 hours)
  - Walk through CRM → ERP data flow
  - Define webhook vs polling strategy
  - Discuss error handling & retry logic
  
- ⚙️ **Backend Devs**: Document integration API specs

**Deliverables**:
- [x] Integration API contract (documented)
- [x] Interactive navigation prototype (working demo)
- [x] All mockup screens complete (25+ screens)
- [x] Loading/empty/error state designs

---

### Day 9 (Thursday): Documentation & User Stories

**Morning**
- 📋 **PM**: 
  - Write detailed user stories for Phase 1 (Public Platform)
  - Define acceptance criteria per story
  - Estimate story points (planning poker with team)
  
- 🎨 **Designer**: 
  - Create design documentation (style guide)
  - Component usage guidelines
  - Accessibility notes (color contrast, keyboard nav)
  
- 💻 **Devs**: 
  - Write technical documentation (setup, architecture, conventions)
  - README files for each repo

**Afternoon**
- 👥 **Sprint 1 Planning Meeting** (2 hours)
  - Review user stories for Phase 1 Week 1
  - Assign tasks to developers
  - Set sprint goal
  
- 🧪 **QA Engineer**: 
  - Create test cases for first sprint
  - Set up automated testing framework

**Deliverables**:
- [x] User stories (30+ stories for Phase 1)
- [x] Design documentation (style guide PDF/Figma)
- [x] Technical documentation (repo READMEs)
- [x] Sprint 1 backlog ready
- [x] Test cases written (first batch)

---

### Day 10 (Friday): Final Review & Handoff

**Morning**
- 👥 **Phase 0 Presentation** (Stakeholder Demo, 1.5 hours)
  - Present all wireframes & mockups
  - Demo interactive prototype
  - Walk through architecture
  - Show sprint plan
  
- 📋 **PM**: Collect stakeholder feedback, adjust priorities if needed

**Afternoon**
- 👥 **Team Retrospective** (1 hour)
  - What went well?
  - What to improve for Phase 1?
  - Action items
  
- 🎨 **Designer**: Final handoff assets to frontend devs
  
- 💻 **Devs**: Code cleanup, push all boilerplate to GitHub
  
- 📋 **PM**: Finalize sprint 1 backlog, send kickoff email for Phase 1

**End of Day**
- 🎉 **Phase 0 Complete!** 
- ✅ Ready to start Phase 1 (Public Platform development) on Monday

**Deliverables**:
- [x] Stakeholder approval for design
- [x] All design assets handed off
- [x] Development environment ready
- [x] Sprint 1 kickoff ready
- [x] Phase 0 retrospective documented

---

## 📊 PHASE 0 DELIVERABLES CHECKLIST

### Design Deliverables
- [x] Information architecture (sitemap, user flows)
- [x] Wireframes (13 low-fi screens)
- [x] High-fidelity mockups (25+ screens)
- [x] Component library (Figma)
- [x] Design system documentation (style guide)
- [x] Assets exported (icons, logos, images)

### Technical Deliverables
- [x] System architecture diagram
- [x] Database schema (ERD + MongoDB collections)
- [x] API specifications (OpenAPI 80+ endpoints)
- [x] Integration contract (CRM ↔ ERP)
- [x] Security architecture document
- [x] Frontend architecture (routing, state, components)
- [x] Code boilerplate (repos, build tools, components)

### Project Management Deliverables
- [x] User stories (30+ for Phase 1)
- [x] Sprint backlog (Sprint 1 ready)
- [x] Testing strategy & test plan
- [x] Communication plan
- [x] Risk register
- [x] Phase 1-6 detailed task breakdown

---

## 🎯 PHASE 0 SUCCESS CRITERIA

**Must Achieve**:
- [ ] All team members onboarded & productive
- [ ] Stakeholders approve design direction
- [ ] Technical architecture validated (no blockers)
- [ ] Database schema finalized
- [ ] Component library built & tested
- [ ] Sprint 1 ready to execute (Day 1 of Phase 1)

**Quality Gates**:
- [ ] Design review passed (stakeholder signoff)
- [ ] Tech review passed (no critical risks)
- [ ] Security review passed (architecture approved)
- [ ] All repos set up with CI/CD working

---

## 📞 DAILY STANDUP FORMAT (15 min)

**Every day 9:00 AM**

**Each person shares**:
1. What I did yesterday
2. What I'm doing today
3. Any blockers?

**PM tracks**:
- Progress vs plan
- Blocker resolution
- Adjust schedule if needed

---

## 🚧 POTENTIAL RISKS & MITIGATION

### Risk 1: Design approval delays
**Mitigation**: Schedule stakeholder review Day 4 (mid-week), enough time to adjust

### Risk 2: Team ramp-up slower than expected
**Mitigation**: Pair programming, knowledge sharing sessions, good documentation

### Risk 3: Technical unknowns discovered
**Mitigation**: Spike tasks for complex areas, consult external experts if needed

### Risk 4: Scope creep during planning
**Mitigation**: Strict focus on MVP, log future enhancements separately

---

## 📈 METRICS TO TRACK (Phase 0)

- **Velocity**: Story points planned vs completed (baseline for future sprints)
- **Blockers**: Count & resolution time
- **Design iterations**: Number of mockup revisions (target < 3 major revisions)
- **Team satisfaction**: Daily mood check (1-5 scale)

---

## 🎓 LEARNING RESOURCES

**For Team Members**:
- Radix UI docs: https://radix-ui.com
- React Context API: https://react.dev/reference/react/useContext
- FastAPI best practices: https://fastapi.tiangolo.com/tutorial/
- MongoDB schema design: https://www.mongodb.com/docs/manual/data-modeling/

**Internal Docs**:
- Current Aurora system walkthrough (30 min video)
- Existing codebase tour (1 hour pair session)
- RBAC system explanation (15 min doc)

---

## ✅ READY TO START?

**Prerequisites**:
- [x] Approved plan document
- [x] Budget allocated
- [x] Team assigned
- [x] Tools access granted (Figma, GitHub, Jira, Slack)
- [x] Kickoff meeting scheduled

**Next Step**: 🚀 **Schedule Day 1 Kickoff Meeting**

**Proposed**: Monday, May 6, 2026 @ 9:00 AM

---

*End of Phase 0 Kickoff Plan*

**Reference Documents**:
- `/app/memory/RESTRUKTURISASI_SYSTEM_PLAN.md` (Master plan)
- `/app/memory/APPROVED_DECISIONS.md` (Decisions summary)
- `/app/memory/PHASE_0_KICKOFF_PLAN.md` (This document)
