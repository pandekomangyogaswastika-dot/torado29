# 🔐 RBAC MATRIX — Aurora F&B
**Companion to:** ARCHITECTURE.md → Section 9 (Security)  
**Version:** 1.9B (post Phase 9B)  
**Last Updated:** 2026-04-28 (Phase 9B endpoint mapping added)

Defines **roles**, **permissions**, and **scope rules**. Reference for both backend permission decorators and frontend feature gating.

---

## 1. Permission Naming Convention

Format: `<module>.<resource>.<action>`

- **module**: outlet, procurement, inventory, finance, hr, admin, executive, ai, search
- **resource**: e.g., daily_sales, petty_cash, journal_entry, user, role, vendor, item
- **action**: read, list, create, update, delete, approve, reject, post, reverse, validate, lock, unlock, close, export, impersonate

Examples:
- `outlet.daily_sales.create`
- `outlet.daily_sales.submit`
- `finance.journal_entry.post`
- `finance.period.lock`
- `admin.user.impersonate`
- `executive.dashboard.read`

---

## 2. Scope Rules

Every transactional permission has a **scope dimension**:
- `*` (group-wide, super)
- `brand:<brand_id>` (one or more brands)
- `outlet:<outlet_id>` (one or more outlets)

User has scope assigned (e.g., outlet manager scoped to outlets [O1, O2]). Backend enforces scope filter on all reads/writes.

---

## 3. Roles (Predefined)

| Code | Name | Description |
|---|---|---|
| `SUPER_ADMIN` | Super Admin | Full access. For system administrators only. |
| `EXECUTIVE` | Executive / Owner | Read all, including dashboards & AI. No transactional rights. |
| `GM` | General Manager | Multi-brand monitor. Can approve high-tier procurement & PAY. |
| `BRAND_MANAGER` | Brand Manager | Scoped to brand. Can approve PR/PO of own brand. |
| `FINANCE_MANAGER` | Finance Manager | Validate sales, approve PAY, post JE, close period. |
| `FINANCE_STAFF` | Finance Staff | Validate sales, draft PAY/JE (subject to FM approval). |
| `PROCUREMENT_MANAGER` | Procurement Manager | Approve PR/PO. |
| `PROCUREMENT_STAFF` | Procurement Staff | Create PO, manage vendor, receive goods. |
| `INVENTORY_MANAGER` | Inventory Manager | Approve adjustments, opname, transfer. |
| `INVENTORY_STAFF` | Inventory Staff | Movements, transfer, opname execution. |
| `OUTLET_MANAGER` | Outlet Manager | Daily sales, PC, urgent purchase, KDO/BDO, opname own outlet. |
| `OUTLET_STAFF` | Outlet Staff | Limited: KDO/BDO request, opname assist, view own outlet stats. |
| `KITCHEN_STAFF` | Kitchen Staff | KDO request, confirm receipt. |
| `BAR_STAFF` | Bar Staff | BDO request, confirm receipt. |
| `HR_OFFICER` | HR Officer | EA, service charge, incentive, voucher, FOC. |
| `HR_MANAGER` | HR Manager | Approve HR transactions over threshold. |

All roles can read their **own** notifications and use **global search** (scoped).

---

## 4. Portal Access (which roles can enter which portal)

| Role | Executive | Outlet | Procurement | Inventory | Finance | HR | Admin |
|---|---|---|---|---|---|---|---|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EXECUTIVE | ✅ | (read) | (read) | (read) | (read) | (read) | ❌ |
| GM | ✅ | (read) | ✅ | (read) | (read) | (read) | ❌ |
| BRAND_MANAGER | ✅ (scoped) | (read scoped) | ✅ (scoped) | (read scoped) | (read scoped) | (read scoped) | ❌ |
| FINANCE_MANAGER | ✅ (read) | (read) | (read) | (read) | ✅ | (read) | ❌ |
| FINANCE_STAFF | ❌ | (read) | (read) | (read) | ✅ | (read AP-related) | ❌ |
| PROCUREMENT_MANAGER | ❌ | (read) | ✅ | (read) | (read AP) | ❌ | ❌ |
| PROCUREMENT_STAFF | ❌ | (read) | ✅ | (read) | ❌ | ❌ | ❌ |
| INVENTORY_MANAGER | ❌ | (read scoped) | (read) | ✅ | ❌ | ❌ | ❌ |
| INVENTORY_STAFF | ❌ | (read scoped) | (read) | ✅ | ❌ | ❌ | ❌ |
| OUTLET_MANAGER | ❌ | ✅ (scoped) | (read) | (read scoped) | ❌ | ❌ | ❌ |
| OUTLET_STAFF | ❌ | (limited scoped) | ❌ | (read scoped) | ❌ | ❌ | ❌ |
| KITCHEN_STAFF | ❌ | (KDO only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| BAR_STAFF | ❌ | (BDO only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| HR_OFFICER | ❌ | ❌ | ❌ | ❌ | (read) | ✅ | ❌ |
| HR_MANAGER | ❌ | ❌ | ❌ | ❌ | (read) | ✅ | ❌ |

Legend:
- ✅ Full access
- (read) Read-only
- (scoped) Limited to own outlet/brand
- ❌ No access

---

## 5. Permission Matrix (full)

### 5.1 Outlet Module

| Permission | SUPER_ADMIN | OUTLET_MGR | OUTLET_STAFF | KITCHEN | BAR | FN_MGR | FN_STAFF | INV_MGR | EXEC | GM |
|---|---|---|---|---|---|---|---|---|---|---|
| `outlet.daily_sales.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `outlet.daily_sales.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.daily_sales.submit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.daily_sales.update` | ✅ | ✅ (draft) | ❌ | ❌ | ❌ | ✅ (any) | ✅ (draft) | ❌ | ❌ | ❌ |
| `outlet.petty_cash.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `outlet.petty_cash.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.petty_cash.replenish_request` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.urgent_purchase.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.kdo.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.bdo.create` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.daily_close.execute` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `outlet.opname.execute` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 5.2 Procurement Module

| Permission | SUPER_ADMIN | PROC_MGR | PROC_STAFF | OUTLET_MGR | FN_MGR | INV_MGR | GM |
|---|---|---|---|---|---|---|---|
| `procurement.pr.read` | ✅ | ✅ | ✅ | ✅ (own outlet) | ✅ | ✅ | ✅ |
| `procurement.pr.create` | ✅ | ✅ | ✅ | ✅ (own outlet) | ❌ | ❌ | ❌ |
| `procurement.pr.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (high tier) |
| `procurement.pr.reject` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `procurement.pr.consolidate` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `procurement.po.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `procurement.po.send` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `procurement.po.approve` | ✅ | ✅ | ❌ | ❌ | ✅ (>X amount) | ❌ | ✅ (>X) |
| `procurement.po.cancel` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `procurement.gr.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `procurement.gr.post` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `procurement.vendor.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `procurement.vendor.scorecard` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |

#### Phase 9B endpoint → permission mapping (added 2026-04-28)

| Endpoint | Required permission |
|---|---|
| `GET /api/procurement/vendor-comparison` | `procurement.vendor.read` |
| `GET /api/procurement/vendors/{id}/scorecard` | `procurement.vendor.read` (uses read scope; scorecard derives from same data — `procurement.vendor.scorecard` reserved for richer cross-vendor analytics in 9D) |
| `GET /api/procurement/workboard` | `procurement.pr.read` (outlet-scoped for non-PROC_* roles) |
| `GET /api/procurement/workboard/transitions` | any authenticated user (catalog only — read-safe) |
| `GET /api/procurement/pos/{id}/pdf` | `procurement.po.create` |
| `POST /api/procurement/pos/{id}/email` | `procurement.po.send` |

Drag-drop transitions are validated server-side via `ALLOWED_TRANSITIONS` in `services/procurement_workboard_service.py`. Each transition declares its `perm` requirement; the kanban UI also pre-checks via `useAuth().can(perm)` before issuing the API call. Forbidden moves return a toast error without firing the request.


### 5.3 Inventory Module

| Permission | SUPER_ADMIN | INV_MGR | INV_STAFF | OUTLET_MGR | PROC_MGR | FN_MGR | GM |
|---|---|---|---|---|---|---|---|
| `inventory.balance.read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ | ✅ | ✅ |
| `inventory.movement.read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ | ✅ | ✅ |
| `inventory.transfer.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `inventory.transfer.send` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `inventory.transfer.receive` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `inventory.adjustment.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `inventory.adjustment.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (>X) | ✅ (>X) |
| `inventory.opname.start` | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| `inventory.opname.submit` | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| `inventory.opname.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (>X) | ❌ |
| `inventory.valuation.read` | ✅ | ✅ | ✅ | ✅ (own) | ✅ | ✅ | ✅ |

### 5.4 Finance Module

| Permission | SUPER_ADMIN | FN_MGR | FN_STAFF | EXEC | GM | PROC_MGR |
|---|---|---|---|---|---|---|
| `finance.sales.validate` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance.sales.request_fix` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance.ap.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `finance.payment.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance.payment.approve` | ✅ | ✅ | ❌ | ❌ | ✅ (>X) | ❌ |
| `finance.payment.mark_paid` | ✅ | ✅ | ✅ (post-approval) | ❌ | ❌ | ❌ |
| `finance.journal_entry.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `finance.journal_entry.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance.journal_entry.post` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `finance.journal_entry.reverse` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `finance.tax.manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance.period.close_step` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `finance.period.lock` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `finance.period.unlock` | ✅ | ✅ (audit) | ❌ | ❌ | ❌ | ❌ |
| `finance.period.write_to_locked` | ✅ | ✅ (audit, w/ reason) | ❌ | ❌ | ❌ | ❌ |
| `finance.report.profit_loss` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `finance.report.balance_sheet` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `finance.report.cashflow` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `finance.bank_reconciliation` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 5.5 HR Module

| Permission | SUPER_ADMIN | HR_MGR | HR_OFFICER | FN_MGR |
|---|---|---|---|---|
| `hr.advance.read` | ✅ | ✅ | ✅ | ✅ |
| `hr.advance.create` | ✅ | ✅ | ✅ | ❌ |
| `hr.advance.approve` | ✅ | ✅ | ❌ | ✅ (>X) |
| `hr.service_charge.calculate` | ✅ | ✅ | ✅ | ❌ |
| `hr.service_charge.post` | ✅ | ✅ | ❌ | ✅ |
| `hr.incentive.calculate` | ✅ | ✅ | ✅ | ❌ |
| `hr.incentive.approve` | ✅ | ✅ | ❌ | ✅ (>X) |
| `hr.voucher.issue` | ✅ | ✅ | ✅ | ❌ |
| `hr.voucher.redeem` | ✅ | ✅ | ✅ | ❌ |
| `hr.foc.create` | ✅ | ✅ | ✅ | ❌ |
| `hr.travel_incentive.manage` | ✅ | ✅ | ✅ | ❌ |
| `hr.lb_fund.read` | ✅ | ✅ | ✅ | ✅ |
| `hr.lb_fund.use` | ✅ | ✅ | ❌ | ✅ |

### 5.6 Admin Module

| Permission | SUPER_ADMIN | Others |
|---|---|---|
| `admin.user.read` | ✅ | ❌ |
| `admin.user.create` | ✅ | ❌ |
| `admin.user.update` | ✅ | ❌ |
| `admin.user.disable` | ✅ | ❌ |
| `admin.user.reset_password` | ✅ | ❌ |
| `admin.user.impersonate` | ✅ | ❌ |
| `admin.role.manage` | ✅ | ❌ |
| `admin.master_data.manage` | ✅ | ❌ |
| `admin.master_data.bulk_import` | ✅ | ❌ |
| `admin.business_rules.manage` | ✅ | ❌ |
| `admin.workflow.manage` | ✅ | ❌ |
| `admin.number_series.manage` | ✅ | ❌ |
| `admin.audit_log.read` | ✅ | ❌ |
| `admin.audit_log.export` | ✅ | ❌ |
| `admin.backup.manage` | ✅ | ❌ |
| `admin.system_settings.manage` | ✅ | ❌ |

*(Note: Some master_data CRUD subset may be granted to roles like FINANCE_MANAGER for COA & tax codes if business decides)*

### 5.7 Executive Module

| Permission | SUPER_ADMIN | EXEC | GM | BRAND_MGR | FN_MGR | Others |
|---|---|---|---|---|---|---|
| `executive.dashboard.read` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ❌ |
| `executive.drilldown.read` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ❌ |
| `executive.export` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ❌ |
| `executive.dashboard_view.save` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 5.8 AI Module

| Permission | SUPER_ADMIN | EXEC | GM | BRAND_MGR | FN_MGR | OUTLET_MGR | HR_MGR | Others |
|---|---|---|---|---|---|---|---|---|
| `ai.chat.use` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ✅ (limited tools) | ✅ (HR-tools) | (config) |
| `ai.autocomplete.use` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ai.ocr.use` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `ai.categorize.use` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `ai.forecast.read` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ❌ | ❌ |
| `ai.anomaly.read` | ✅ | ✅ | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ❌ | ❌ |

### 5.9 Search Module (Global)

| Permission | All Roles |
|---|---|
| `search.global.use` | ✅ (results scoped to user's permissions) |

---

## 6. Approval Workflow Tiers (configurable)

### Default Tiers

#### Procurement (PR → PO)
- < Rp 1,000,000 → PROC_STAFF can self-approve PO
- 1–10 jt → PROC_MGR approves
- 10–50 jt → PROC_MGR + FN_MGR
- > 50 jt → PROC_MGR + FN_MGR + GM/EXEC

#### Payment (PAY)
- < Rp 5,000,000 → FN_STAFF → FN_MGR
- 5–25 jt → FN_STAFF → FN_MGR → GM
- > 25 jt → FN_STAFF → FN_MGR → GM → EXEC

#### Inventory Adjustment
- Variance < Rp 500,000 → INV_STAFF self
- 500K – 5jt → INV_MGR
- > 5jt → INV_MGR + FN_MGR

#### Employee Advance
- < Rp 2,000,000 → HR_OFFICER → HR_MGR
- > 2 jt → HR_OFFICER → HR_MGR → FN_MGR

All tiers stored in `business_rules` and configurable per group/brand by SUPER_ADMIN.

---

## 7. Special Rules

### 7.1 Period Lock
- Once a period is locked (`accounting_periods.status = locked`), only `finance.period.write_to_locked` permission can write entries dated in that period.
- Every such write **must include reason** and is audited as "locked period write."

### 7.2 Soft Delete
- All deletes are soft (set `deleted_at`). Hard delete only by SUPER_ADMIN with explicit confirmation.

### 7.3 Impersonation
- `admin.user.impersonate` allows SUPER_ADMIN to act as another user for support.
- Audited as `impersonation_started` / `impersonation_ended`.
- All actions during impersonation tagged `impersonated_by: <admin_user_id>`.

### 7.4 Self-Service
- Every authenticated user can:
  - Read own profile
  - Update own profile (name, avatar, password)
  - Read own notifications
  - Use global search

### 7.5 Cross-Role Permissions
If user has multiple roles, **union** of permissions applies, but scope is **intersection** for sensitive areas.

---

## 8. Frontend Implementation

```js
// permissions.js
export const can = (user, perm, scope) => {
  // Check user.permissions includes perm
  // Check user has scope (outlet_id / brand_id)
  // Return boolean
};

// Usage in components
{can(user, 'finance.payment.approve') && <ApproveButton />}
```

Gate routes via `<RequirePermission perm="...">`.

---

## 9. Backend Implementation

```python
# core/security.py
def require_perm(perm: str, scope_kind: str = None):
    async def dep(user = Depends(current_user), 
                  outlet_id: str = Query(None), brand_id: str = Query(None)):
        if perm not in user.effective_permissions:
            raise HTTPException(403, "Forbidden")
        if scope_kind == "outlet" and outlet_id and outlet_id not in user.outlet_ids and not user.is_super:
            raise HTTPException(403, "Outlet not in scope")
        # ... brand check
        return user
    return dep

# Usage
@router.post("/api/finance/payments/{id}/approve")
async def approve_payment(id: str, user = Depends(require_perm("finance.payment.approve"))):
    ...
```

---

## 10. Permissions Catalog (Master List)

*(For admin UI to render checklist when defining custom roles)*

Categories: **Outlet**, **Procurement**, **Inventory**, **Finance**, **HR**, **Admin**, **Executive**, **AI**, **Search**.

Full catalog: ~100 permissions. Maintained as `permissions_catalog.json` seeded at startup.

---

## 11. Testing Coverage

Per phase, RBAC test cases must include:
- [ ] Each role can access permitted endpoints
- [ ] Each role is denied prohibited endpoints (403)
- [ ] Scope check: outlet manager A cannot read outlet B data (403)
- [ ] Locked period: write blocked unless `write_to_locked`
- [ ] Approval chain: cannot post until all approvals collected
- [ ] Impersonation: actions correctly tagged
