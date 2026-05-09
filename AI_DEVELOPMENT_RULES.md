# 🤖 AI Development Rules & Guidelines

**Version:** 1.1  
**Last Updated:** May 7, 2026  
**Purpose:** Guidelines for AI agents continuing development of Aurora F&B system
**Current Deployment:** https://finance-phase2-test.preview.emergentagent.com
**Current Version:** 0.3.0 (Sprint I complete — all modules built)

---

## ⚠️ CRITICAL: Read Before ANY Development

This document contains **mandatory rules** that MUST be followed by any AI agent working on this codebase. Violation of these rules can break the system or cause data loss.

---

## 📋 Pre-Development Checklist

### BEFORE Starting ANY Task:

1. ✅ **Read Current Status**
   - File: `/app/CURRENT_STATUS.md`
   - Purpose: Understand what's already built and working
   - Check: Latest completion status, recent changes

2. ✅ **Read Documentation**
   - Files: `/app/memory/PRD.md`, `/app/memory/ARCHITECTURE.md`, `/app/memory/MODULES.md`
   - Purpose: Understand system architecture and design decisions
   - Check: Data models, API patterns, business rules

3. ✅ **Read Current Plan**
   - File: `/app/plan.md`
   - Purpose: Understand current sprint goals and progress
   - Check: Active tasks, completed phases, next steps

4. ✅ **Check Design Guidelines**
   - File: `/app/design_guidelines.md`
   - Purpose: Follow established design system
   - Check: Colors, typography, component patterns

5. ✅ **Review Test Credentials**
   - File: `/app/memory/test_credentials.md`
   - Purpose: Know how to test features
   - Check: User roles, login credentials

---

## 🚫 NEVER Modify These

### Critical Environment Variables

**Backend `/app/backend/.env`:**
```bash
MONGO_URL=<DO NOT CHANGE>
```
**Reason:** Pre-configured MongoDB connection. Changing breaks database access.

**Frontend `/app/frontend/.env`:**
```bash
REACT_APP_BACKEND_URL=<DO NOT CHANGE>
```
**Reason:** Auto-configured for Kubernetes ingress. Changing breaks API calls.

### Critical Configuration Files

- ❌ **DO NOT delete or recreate** `requirements.txt` - Only update via `pip freeze`
- ❌ **DO NOT delete or recreate** `package.json` - Only update via `yarn add`
- ❌ **DO NOT modify** supervisor configuration
- ❌ **DO NOT change** port numbers (backend: 8001, frontend: 3000)

### Database Patterns

- ❌ **NEVER use ObjectId** - Always use UUID for IDs
- ❌ **NEVER use naive datetime** - Always use `datetime.now(timezone.utc)`
- ❌ **NEVER hard-delete** - Always soft-delete with `deleted_at` field

---

## ✅ ALWAYS Follow These Patterns

### 1. File Operations

**Backend Python:**
```python
# ✅ CORRECT: Update requirements
pip install package_name && pip freeze > requirements.txt

# ❌ WRONG: Manual edit
# Don't manually edit requirements.txt
```

**Frontend JavaScript:**
```bash
# ✅ CORRECT: Add package
yarn add package-name

# ❌ WRONG: Manual edit or npm
# Don't use npm or manually edit package.json
```

### 2. Database Operations

**✅ CORRECT Pattern:**
```python
from datetime import datetime, timezone
import uuid

# IDs
new_id = str(uuid.uuid4())

# Timestamps
created_at = datetime.now(timezone.utc)

# Soft delete
await db.collection.update_one(
    {"id": item_id},
    {"$set": {"deleted_at": datetime.now(timezone.utc)}}
)

# Query non-deleted
await db.collection.find({"deleted_at": None})
```

**❌ WRONG Patterns:**
```python
# DON'T use ObjectId
from bson import ObjectId  # ❌ WRONG

# DON'T use naive datetime
created_at = datetime.now()  # ❌ WRONG (missing timezone)

# DON'T hard delete
await db.collection.delete_one({"id": item_id})  # ❌ WRONG
```

### 3. API Patterns

**Backend (FastAPI):**
```python
from fastapi import APIRouter, Depends
from core.security import require_perm
from core.exceptions import ok_envelope, NotFoundError, ValidationError

router = APIRouter(prefix="/api/module", tags=["module"])

@router.get("/items")
async def list_items(user: dict = Depends(require_perm("role", "permission"))):
    # Business logic
    items = []  # fetch from DB
    return ok_envelope(items)  # ✅ ALWAYS use envelope

@router.post("/items")
async def create_item(payload: ItemRequest, user: dict = Depends(require_perm("admin"))):
    # Validation
    if not payload.name:
        raise ValidationError("Name is required")  # ✅ Use custom exceptions
    
    # Create with UUID and timestamp
    item = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "created_at": datetime.now(timezone.utc),
        "deleted_at": None
    }
    await db.collection.insert_one(item)
    return ok_envelope(item)
```

**Frontend (React):**
```javascript
import api from "@/lib/api";

// ✅ CORRECT: Use api client (auto-prefixes /api)
const response = await api.get("/module/items");
const data = response.data?.data;

// ❌ WRONG: Direct fetch or wrong prefix
const response = await fetch("http://localhost:8001/module/items");  // ❌
```

### 4. API Route Prefixes

**✅ ALWAYS prefix backend routes with `/api`:**
```python
router = APIRouter(prefix="/api/module", tags=["module"])
# Results in: /api/module/items

# ❌ WRONG:
router = APIRouter(prefix="/module", tags=["module"])
# Missing /api prefix breaks ingress routing
```

### 5. Frontend Component Patterns

**✅ CORRECT Component Structure:**
```javascript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";

// Named export for components
export function MyComponent() {
  const [data, setData] = useState([]);
  
  return (
    <div className="space-y-4" data-testid="my-component">
      <Button onClick={handleClick} data-testid="my-button">
        Click Me
      </Button>
    </div>
  );
}

// Default export for pages
export default function MyPage() {
  return <div data-testid="my-page">Page Content</div>;
}
```

**Key Requirements:**
- ✅ Use Shadcn components from `@/components/ui/`
- ✅ Use Tailwind for styling (no inline styles)
- ✅ Add `data-testid` to all interactive elements
- ✅ Named exports for components, default for pages
- ✅ Use `toast` from Sonner for notifications

---

## 🎨 UI/UX Rules

### Design System

**Colors:**
```javascript
// ✅ Use design tokens
className="text-[#1C1510]"      // Primary text
className="bg-[#F8F5EF]"        // Background
className="border-[#1C1510]/10" // Borders

// ❌ DON'T use raw colors
className="text-black"          // ❌
className="bg-red-500"          // ❌
```

**Typography:**
```javascript
// ✅ Use approved fonts
style={{ fontFamily: "'Cormorant Garamond', serif" }}  // Headings
style={{ fontFamily: "'Azeret Mono', monospace" }}     // Labels

// ❌ DON'T use system-ui
style={{ fontFamily: "system-ui" }}  // ❌ WRONG
```

**Components:**
```javascript
// ✅ Use Shadcn components
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

<Button variant="default">Click</Button>

// ❌ DON'T use plain HTML
<button className="...">Click</button>  // ❌ Use Button component
<select>...</select>                     // ❌ Use Select component
```

**Testability:**
```javascript
// ✅ ALWAYS add data-testid
<Button data-testid="submit-button">Submit</Button>
<Input data-testid="name-input" />
<div data-testid="user-list">...</div>

// ❌ Missing testid breaks automated testing
<Button>Submit</Button>  // ❌ WRONG
```

---

## 🧪 Testing Rules

### When to Test

**MANDATORY Testing:**
- ✅ After implementing new feature
- ✅ After fixing a bug
- ✅ After major refactor
- ✅ Before marking task complete

**Call Testing Agent When:**
```javascript
// Complex features
- New CRUD operations
- Integration with external APIs
- Multi-step workflows
- Authentication changes
- Payment processing

// After bulk file operations
- After using bulk_file_writer
- After updating multiple files
- After database schema changes
```

**Direct Testing For:**
```javascript
// Simple changes
- CSS/styling updates → screenshot tool
- Single API endpoint → curl
- Text changes → visual inspection
```

### Testing Pattern

```javascript
// 1. Implement feature
// 2. Run linter
cd frontend && npx esbuild src/ --loader:.js=jsx --bundle --outfile=/dev/null

// 3. Check logs
tail -n 50 /var/log/supervisor/frontend.err.log /var/log/supervisor/backend.err.log

// 4. Call testing agent for comprehensive test
await testing_agent_v3({
  "features_or_bugs_to_test": [
    "Feature 1 description",
    "Feature 2 description"
  ],
  "files_of_reference": [
    "/app/path/to/file.jsx"
  ]
});

// 5. Fix issues from test report
// 6. Re-run if needed
// 7. ONLY THEN mark complete
```

**NEVER mark a task complete if:**
- ❌ Tests are failing
- ❌ Errors in logs
- ❌ Known bugs exist
- ❌ Feature is partially implemented

---

## 📝 Documentation Rules

### ALWAYS Update Documentation After Changes

**When adding features:**
```markdown
1. Update /app/CURRENT_STATUS.md
   - Add to feature completion matrix
   - Update recent changes section
   - Update test status

2. Update /app/plan.md
   - Mark phase as completed
   - Add new phases if needed
   - Update progress tracking

3. Update /app/README.md if needed
   - Add new sections for major features
   - Update feature list
   - Update architecture if changed
```

**Commit Message Pattern:**
```bash
# ✅ Good commit messages
"Add image upload feature to CMS"
"Fix search filter in CMSBrands"
"Update documentation after Sprint H"

# ❌ Bad commit messages
"Update files"
"Fix bug"
"Changes"
```

---

## 🔄 Development Workflow

### Standard Development Process

```
1. READ DOCUMENTATION
   ├─ CURRENT_STATUS.md
   ├─ plan.md
   ├─ Relevant memory/*.md files
   └─ design_guidelines.md

2. UNDERSTAND REQUIREMENT
   ├─ Ask clarifying questions if needed
   ├─ Review existing code patterns
   └─ Check for similar implementations

3. PLAN IMPLEMENTATION
   ├─ Break into small tasks
   ├─ Update plan.md with tasks
   ├─ Create todo list
   └─ Get user approval if major change

4. IMPLEMENT
   ├─ Follow code patterns
   ├─ Use established components
   ├─ Add proper error handling
   └─ Add data-testid attributes

5. TEST
   ├─ Check syntax (linter)
   ├─ Check logs for errors
   ├─ Call testing agent
   └─ Fix all issues found

6. DOCUMENT
   ├─ Update CURRENT_STATUS.md
   ├─ Update plan.md
   ├─ Add comments in complex code
   └─ Update README if needed

7. COMPLETE
   ├─ All tests passing
   ├─ No errors in logs
   ├─ Documentation updated
   └─ User approved
```

### Handling Failures

**If a feature fails twice:**
```
1. STOP implementing
2. DOCUMENT the failure
3. EXPLAIN why it failed
4. PROPOSE alternative approach
5. ASK user for guidance
6. DON'T silently keep trying
```

### Handling Existing Code

**NEVER:**
- ❌ Refactor working code without explicit request
- ❌ Change file structure without permission
- ❌ Delete files without understanding their purpose
- ❌ Rewrite entire modules "for improvement"

**ALWAYS:**
- ✅ Read existing code before modifying
- ✅ Follow established patterns
- ✅ Make incremental changes
- ✅ Test after each change
- ✅ Ask before major refactoring

---

## 🚨 Error Handling Patterns

### Backend (Python)

```python
from core.exceptions import ValidationError, NotFoundError, AuthenticationError

# ✅ CORRECT: Use custom exceptions
if not user_id:
    raise ValidationError("User ID is required")

item = await db.collection.find_one({"id": item_id})
if not item:
    raise NotFoundError("Item not found")

# ✅ CORRECT: Handle exceptions
try:
    result = await some_operation()
    return ok_envelope(result)
except ValidationError as e:
    # Let global handler catch it
    raise
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Frontend (React)

```javascript
// ✅ CORRECT: Error handling
try {
  const response = await api.post("/endpoint", data);
  toast.success("Operation successful");
  return response.data?.data;
} catch (error) {
  console.error("Operation failed:", error);
  toast.error(
    error.response?.data?.errors?.[0]?.message || 
    "Operation failed"
  );
  throw error;  // Re-throw if caller needs to handle
}
```

---

## 🔐 Security Rules

### Authentication

```python
# ✅ CORRECT: Always check permissions
from core.security import require_perm

@router.post("/sensitive-operation")
async def operation(user: dict = Depends(require_perm("admin", "write"))):
    # Only admins with write permission can access
    pass

# ❌ WRONG: No auth check
@router.post("/sensitive-operation")
async def operation():  # ❌ Anyone can access
    pass
```

### Data Validation

```python
# ✅ CORRECT: Use Pydantic models
from pydantic import BaseModel, Field

class ItemRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    
@router.post("/items")
async def create(payload: ItemRequest):  # Auto-validated
    pass

# ❌ WRONG: No validation
@router.post("/items")
async def create(data: dict):  # ❌ No validation
    name = data.get("name")  # Could be None, empty, or wrong type
```

### Input Sanitization

```python
# ✅ CORRECT: Sanitize file uploads
if ".." in filename or "/" in filename:
    raise ValidationError("Invalid filename")

# ✅ CORRECT: Validate file types
if file.content_type not in ALLOWED_TYPES:
    raise ValidationError("Invalid file type")
```

---

## 📊 Performance Rules

### Database Queries

```python
# ✅ CORRECT: Use projection to limit fields
items = await db.collection.find(
    {"deleted_at": None},
    {"_id": 0, "name": 1, "price": 1}  # Only return needed fields
).to_list(length=100)

# ✅ CORRECT: Use indexes
await db.collection.create_index("user_id")

# ❌ WRONG: No projection (returns everything)
items = await db.collection.find({"deleted_at": None}).to_list(length=100)
```

### Frontend Performance

```javascript
// ✅ CORRECT: Lazy load routes
const AdminPortal = lazy(() => import("@/portals/admin/AdminPortal"));

// ✅ CORRECT: Memoize expensive computations
const filteredItems = useMemo(() => 
  items.filter(item => item.status === filter),
  [items, filter]
);

// ✅ CORRECT: Debounce search
const debouncedSearch = debounce((query) => {
  setSearchQuery(query);
}, 300);
```

---

## 🎯 Success Criteria

### Before Completing ANY Task

**Checklist:**
- [ ] All functionality working as specified
- [ ] All tests passing (no failures)
- [ ] No errors in logs
- [ ] Code follows patterns in this document
- [ ] `data-testid` attributes added
- [ ] Documentation updated
- [ ] Testing agent called and passed
- [ ] User approved (for major features)

### Code Quality Standards

- ✅ Consistent indentation (2 spaces for JS, 4 for Python)
- ✅ Meaningful variable names
- ✅ Comments for complex logic
- ✅ No console.log in production code
- ✅ No commented-out code
- ✅ No TODOs without tracking

---

## 📞 When to Ask for Help

### Ask User When:
- 🤔 Requirement is ambiguous
- 🤔 Multiple valid approaches exist
- 🤔 Feature might break existing functionality
- 🤔 Need external API keys
- 🤔 Stuck after 2 failed attempts

### Use Troubleshoot Agent When:
- 🔥 Services failing to start
- 🔥 Database connection issues
- 🔥 Persistent errors after multiple fixes
- 🔥 Unexplained 500 errors

### Use Testing Agent When:
- ✅ After feature implementation
- ✅ After bug fixes
- ✅ After bulk file operations
- ✅ Before marking phase complete

---

## 📚 Reference Documentation Priority

**Order of importance when reading:**
1. `/app/AI_DEVELOPMENT_RULES.md` (this file) - **READ FIRST**
2. `/app/CURRENT_STATUS.md` - Current state
3. `/app/plan.md` - Current sprint
4. `/app/memory/PRD.md` - Product vision
5. `/app/memory/ARCHITECTURE.md` - Technical details
6. `/app/memory/MODULES.md` - Feature specs
7. `/app/design_guidelines.md` - Design system
8. `/app/README.md` - General overview

---

## ✅ Final Checklist for AI Agents

Before starting ANY development work:

- [ ] I have read AI_DEVELOPMENT_RULES.md (this file)
- [ ] I have read CURRENT_STATUS.md
- [ ] I have read plan.md
- [ ] I understand what is already built
- [ ] I understand the tech stack
- [ ] I understand the database patterns
- [ ] I understand the API patterns
- [ ] I understand the UI component patterns
- [ ] I know how to test my changes
- [ ] I know when to ask for help

---

**REMEMBER:**
- 🎯 Follow established patterns, don't reinvent
- 📖 Read documentation BEFORE coding
- 🧪 Test BEFORE marking complete
- 📝 Document AFTER implementing
- 🤝 Ask WHEN unsure

**Good luck with development! 🚀**
