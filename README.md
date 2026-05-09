# 🍽️ Aurora F&B - Integrated F&B Group ERP

**Torado Group** | Multi-Brand Restaurant Management System

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![Version](https://img.shields.io/badge/Version-1.15-blue)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)]()
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)]()
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248)]()

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 🎯 Overview

Aurora F&B is a comprehensive ERP system built specifically for F&B group operations managing multiple brands and multiple outlets. It replaces Excel-based operations with an integrated digital platform covering:

- 📊 **Financial Management**: GL, AP, AR, Bank Reconciliation, Period Closing
- 🏪 **Operations**: Sales Entry, Inventory, Procurement, Cash Management
- 👥 **HR & Payroll**: Employee management, BPJS, PPh21 calculations
- 📈 **Analytics**: Executive Dashboard, AI Assistant, Anomaly Detection
- 🌐 **Public Website CMS**: Manage brands, outlets, news, and menus

### Key Differentiators

✅ **Not a POS** - Sales entered manually daily (not real-time)  
✅ **Multi-Brand Ready** - 4 brands (Altero, De La Sol, Calluna, Bakkies)  
✅ **AI-Powered** - Smart anomaly detection and executive Q&A  
✅ **Audit Trail** - Every transaction tracked and traceable  
✅ **Excel Import** - Seamless migration from existing workflows  

---

## 🏗️ Architecture

### Tech Stack

**Backend**
- FastAPI (Python 3.11+)
- MongoDB (Motor async driver)
- JWT Authentication
- Pydantic for validation
- Structured JSON logging

**Frontend**
- React 18 + Vite
- Shadcn/UI + Tailwind CSS
- React Router v6
- Axios + React Query
- Framer Motion (animations)

**Infrastructure**
- Kubernetes deployment
- Nginx ingress
- Supervisor process management
- Environment-based configuration

### System Design

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────┬──────────┬──────────┬─────────────┐  │
│  │ Public   │ Admin    │ Finance  │ Operations  │  │
│  │ Website  │ CMS      │ Portal   │ Portals     │  │
│  └──────────┴──────────┴──────────┴─────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓ HTTP/REST
┌─────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ Routers: Auth│Finance│HR│Inventory│CMS│...   │  │
│  │ Services: Business Logic Layer                │  │
│  │ Models: Pydantic Schemas + Validation         │  │
│  │ Core: Security│DB│Logging│RateLimit          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓ Async
┌─────────────────────────────────────────────────────┐
│              MongoDB Database                        │
│  Collections: employees, outlets, transactions,      │
│              inventory, public_brands, etc.          │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core ERP Modules (Phases 0-12) ✅

| Module | Key Features | Status |
|--------|-------------|---------|
| **Authentication** | JWT, RBAC, multi-role support | ✅ Complete |
| **Sales Management** | Daily entry, validation, outlet-wise | ✅ Complete |
| **Inventory** | Stock opname, transfers, valuation | ✅ Complete |
| **Procurement** | PR → PO workflow, approval chains | ✅ Complete |
| **Accounts Payable** | Invoice management, payments, aging | ✅ Complete |
| **Cash Management** | Petty cash, bank reconciliation | ✅ Complete |
| **GL & Journals** | Auto-posting, COA management | ✅ Complete |
| **Period Closing** | Month-end close, variance checking | ✅ Complete |
| **Financial Reports** | P&L, Balance Sheet, Cash Flow | ✅ Complete |
| **AI Features** | Anomaly detection, executive Q&A | ✅ Complete |
| **Executive Dashboard** | KPIs, trends, drill-down analytics | ✅ Complete |

### Sprint G: Finance & HR Enhancements ✅

- **Tax Center**: PPh21 SPT export (e-SPT format)
- **Budget Management**: Excel import with validation
- **NPWP Validation**: Format checking and validation
- **Salary Master**: Component-based salary management
- **Enhanced Payroll**: BPJS + PPh21 auto-calculation
- **Payslip PDF**: jsPDF generation with breakdown
- **Salary Import**: Excel/CSV bulk upload

### Sprint H: CMS for Company Profile ✅

**Admin CMS**
- 🏷️ **Brands Management**: CRUD with image upload
- 📍 **Outlets Management**: Location, hours, features
- 📰 **News & Events**: Articles with categories
- 🍽️ **Menu Items**: Product catalog per brand
- 🖼️ **Image Upload**: Drag-drop with preview
- 🔍 **Search & Filter**: Real-time filtering on all tables

**Public Website**
- 🏠 **Home Page**: Brand showcase, latest news
- 🎨 **Brands Showcase**: All brands with filtering
- 📖 **Brand Detail**: Story, signature dishes, outlets
- 🗺️ **Interactive Map**: All outlet locations
- 📜 **Menu Catalog**: Filterable by brand and category
- 📅 **News & Events**: Article listing with categories

---

## 🚀 Getting Started

### Prerequisites

```bash
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- yarn package manager
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd app
```

2. **Backend Setup**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
```

4. **Environment Configuration**

Backend `.env`:
```bash
MONGO_URL=mongodb://localhost:27017/aurora_fb
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

Frontend `.env`:
```bash
REACT_APP_BACKEND_URL=http://localhost:8001
```

5. **Seed Database**
```bash
cd backend
python -m seed.seed_cms_content
```

6. **Start Services**

Using supervisor (production):
```bash
supervisorctl start backend
supervisorctl start frontend
```

Or manually (development):
```bash
# Terminal 1 - Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn dev
```

7. **Access Application**
```
Frontend: http://localhost:3000
Backend API: http://localhost:8001
API Docs: http://localhost:8001/docs
```

### Default Credentials

See `/app/memory/test_credentials.md` for test accounts.

Example:
```
Admin: admin@torado.id / (check credentials file)
Outlet: outlet1@torado.id / (check credentials file)
```

---

## 📁 Project Structure

```
/app
├── backend/                    # FastAPI backend
│   ├── core/                   # Core utilities
│   │   ├── db.py              # MongoDB connection
│   │   ├── security.py        # Auth & permissions
│   │   ├── exceptions.py      # Custom exceptions
│   │   └── logging_config.py  # Logging setup
│   ├── models/                # Pydantic models
│   ├── routers/               # API endpoints
│   │   ├── auth.py
│   │   ├── admin_cms.py       # CMS CRUD
│   │   ├── public_content.py  # Public API
│   │   ├── finance.py
│   │   ├── hr.py
│   │   └── ...
│   ├── services/              # Business logic
│   ├── seed/                  # Database seeders
│   ├── server.py              # FastAPI app
│   ├── requirements.txt
│   └── .env
│
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn components
│   │   │   └── shared/       # Custom components
│   │   │       └── ImageUpload.jsx
│   │   ├── pages/
│   │   │   ├── public/       # Public website
│   │   │   └── ...
│   │   ├── portals/          # Internal portals
│   │   │   ├── admin/
│   │   │   │   └── cms/      # CMS management
│   │   │   ├── finance/
│   │   │   ├── operations/
│   │   │   └── ...
│   │   ├── lib/              # Utilities
│   │   │   └── api.js        # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── memory/                     # Documentation
│   ├── PRD.md                 # Product requirements
│   ├── ARCHITECTURE.md        # System architecture
│   ├── MODULES.md             # Feature specifications
│   ├── UI_UX_SYSTEM.md        # Design system
│   └── test_credentials.md    # Login credentials
│
├── test_reports/              # Test results
├── uploads/                   # Uploaded images (CMS)
├── CURRENT_STATUS.md          # System status
├── AI_DEVELOPMENT_RULES.md    # AI agent guidelines
├── README.md                  # This file
└── plan.md                    # Current sprint plan
```

---

## 💻 Development

### Backend Development

**Run development server:**
```bash
cd backend
uvicorn server:app --reload --port 8001
```

**Add new endpoint:**
1. Create/update router in `/backend/routers/`
2. Define Pydantic models in `/backend/models/`
3. Implement business logic in `/backend/services/`
4. Register router in `server.py`

**Database operations:**
```python
from core.db import get_db

db = get_db()
await db.collection_name.find_one({"id": item_id})
await db.collection_name.insert_one(document)
```

### Frontend Development

**Run development server:**
```bash
cd frontend
yarn dev
```

**Add new component:**
1. Create component in `/frontend/src/components/`
2. Import Shadcn components from `@/components/ui/`
3. Use Tailwind for styling
4. Add `data-testid` attributes for testing

**API calls:**
```javascript
import api from "@/lib/api";

const response = await api.get("/endpoint");
const data = response.data?.data;
```

**Add new route:**
```javascript
// In App.jsx
import NewPage from "@/pages/NewPage";

<Route path="/new-page" element={<NewPage />} />
```

### Code Style

**Backend (Python):**
- Follow PEP 8
- Use type hints
- Async/await for DB operations
- Pydantic models for validation

**Frontend (JavaScript/React):**
- Functional components with hooks
- Named exports for components
- Default exports for pages
- Tailwind for styling (no inline styles)

---

## 🧪 Testing

### Running Tests

**Backend:**
```bash
cd backend
python backend_test.py
```

**Frontend (E2E):**
```bash
# Via testing agent (recommended)
# Tests run automatically via Playwright
```

**Manual Testing:**
```bash
# Start services
supervisorctl start backend frontend

# Access application
open http://localhost:3000
```

### Test Reports

Test results are saved in `/app/test_reports/`:
- `iteration_1.json` - Sprint G tests
- `iteration_2.json` - CMS base tests
- `iteration_3.json` - CMS enhancements tests

### Testing Checklist

Before deploying:
- [ ] All API endpoints return expected responses
- [ ] Authentication and authorization working
- [ ] CRUD operations functional
- [ ] Search and filters working
- [ ] Image upload functional
- [ ] Public pages rendering correctly
- [ ] No console errors
- [ ] Responsive on mobile devices

---

## 🚢 Deployment

### Production Deployment (Kubernetes)

**Current deployment:**
- Platform: Emergent (Kubernetes)
- URL: https://finance-phase2-test.preview.emergentagent.com
- Ingress: `/api/*` → backend, `/*` → frontend

**Service Management:**
```bash
# Check status
supervisorctl status

# Restart services
supervisorctl restart backend
supervisorctl restart frontend

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

### Environment Variables

**Critical - Never modify these:**
```bash
REACT_APP_BACKEND_URL  # Frontend
MONGO_URL              # Backend
```

**Configurable:**
```bash
CORS_ORIGINS
RATE_LIMIT_ENABLED
SCHEDULER_ENABLED
SECRET_KEY
```

### Database Backup

```bash
# Backup MongoDB
mongodump --uri="$MONGO_URL" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="$MONGO_URL" /backup/20260506
```

---

## 📚 Documentation

### Essential Reads

1. **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Current system state
2. **[AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)** - AI agent guidelines
3. **[memory/PRD.md](./memory/PRD.md)** - Product requirements
4. **[memory/ARCHITECTURE.md](./memory/ARCHITECTURE.md)** - Technical architecture
5. **[memory/MODULES.md](./memory/MODULES.md)** - Feature specifications

### API Documentation

- Interactive docs: http://localhost:8001/docs
- OpenAPI schema: http://localhost:8001/openapi.json

### Design System

- See `/app/design_guidelines.md` for CMS design tokens
- See `/app/memory/UI_UX_SYSTEM.md` for overall design system

---

## 🤝 Contributing

### For AI Agents

**MUST READ FIRST:**
1. `/app/AI_DEVELOPMENT_RULES.md` - Development guidelines
2. `/app/CURRENT_STATUS.md` - Current system state
3. `/app/plan.md` - Current sprint plan

**Development Workflow:**
1. Read documentation to understand context
2. Review existing code before modifying
3. Follow established patterns and conventions
4. Test changes thoroughly
5. Update documentation
6. Run testing agent for comprehensive validation

### For Human Developers

1. Fork the repository
2. Create a feature branch
3. Follow code style guidelines
4. Write tests for new features
5. Update documentation
6. Submit pull request

---

## 📞 Support & Resources

### Internal Resources

- **Documentation**: `/app/memory/` directory
- **Test Credentials**: `/app/memory/test_credentials.md`
- **Test Reports**: `/app/test_reports/`
- **Design Guidelines**: `/app/design_guidelines.md`

### Quick Commands

```bash
# View logs
tail -f /var/log/supervisor/*.log

# Check services
supervisorctl status

# Restart all
supervisorctl restart all

# MongoDB shell
mongo $MONGO_URL

# Frontend build
cd frontend && yarn build

# Backend lint
cd backend && ruff check .
```

---

## 📊 Current Status

**Last Updated:** May 6, 2026

✅ **Production Ready**
- All core modules complete and tested
- Sprint G (Finance/HR) complete
- Sprint H (CMS) complete and tested
- 95-100% test pass rate
- Zero critical bugs

**Next Steps:**
- Monitor production usage
- Gather user feedback
- Plan Sprint I features
- Optimize performance if needed

---

## 📄 License

Proprietary - Torado Group  
© 2026 Torado Group. All rights reserved.

---

## 🙏 Acknowledgments

Built with modern technologies:
- FastAPI - High-performance Python web framework
- React - UI library
- MongoDB - NoSQL database
- Shadcn/UI - Beautiful UI components
- Tailwind CSS - Utility-first CSS framework

---

**For detailed system status, see [CURRENT_STATUS.md](./CURRENT_STATUS.md)**  
**For AI development guidelines, see [AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)**
