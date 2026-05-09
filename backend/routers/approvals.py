"""/api/approvals router — cross-portal "My Approvals" queue + counts."""
from typing import Optional
from fastapi import APIRouter, Body, Depends, Query

from core.db import get_db, serialize
from core.exceptions import ok_envelope
from core.security import current_user, get_user_permissions
from services import approval_service

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


# Map entity_type → (collection, status filter, doc-no link key)
ENTITY_QUERY_PROFILES = {
    "purchase_request": {
        "collection": "purchase_requests",
        "statuses": ["submitted", "awaiting_approval"],
        "amount_label": "Total Estimasi",
        "describe": lambda d: d.get("doc_no") or (d.get("id", "")[:8]),
        "link": lambda d: f"/procurement/pr/{d.get('id')}",
        "secondary": "outlet_id",
    },
    "purchase_order": {
        "collection": "purchase_orders",
        "statuses": ["awaiting_approval"],
        "amount_label": "Grand Total",
        "describe": lambda d: d.get("doc_no") or (d.get("id", "")[:8]),
        "link": lambda d: f"/procurement/po/{d.get('id')}",
        "secondary": "vendor_id",
    },
    "stock_adjustment": {
        "collection": "adjustments",
        "statuses": ["submitted", "awaiting_approval"],
        "amount_label": "Total Value",
        "describe": lambda d: d.get("doc_no") or (d.get("id", "")[:8]),
        "link": lambda _d: "/inventory/adjustments",
        "secondary": "outlet_id",
    },
    "employee_advance": {
        "collection": "employee_advances",
        "statuses": ["awaiting_approval"],
        "amount_label": "Principal",
        "describe": lambda d: d.get("doc_no") or (d.get("id", "")[:8]),
        "link": lambda _d: "/hr/advances",
        "secondary": "employee_id",
    },
}


async def _build_queue_for_user(user: dict, *, entity_types: list[str] | None = None) -> list[dict]:
    """For each requested entity type, find pending items and filter to those
    where the current step required perms intersect the user's perms.
    """
    db = get_db()
    user_perms = await get_user_permissions(user)
    is_super = "*" in user_perms

    types = entity_types or list(ENTITY_QUERY_PROFILES.keys())
    out: list[dict] = []
    for et in types:
        profile = ENTITY_QUERY_PROFILES.get(et)
        if not profile:
            continue
        col = profile["collection"]
        q = {"deleted_at": None, "status": {"$in": profile["statuses"]}}
        async for d in db[col].find(q).sort("created_at", -1).limit(500):
            entity = serialize(d)
            try:
                state = await approval_service.evaluate(et, entity)
            except Exception:  # noqa: BLE001
                continue
            if state.get("is_complete") or state.get("is_rejected"):
                continue
            step_idx = state.get("current_step_idx")
            steps = state.get("steps") or []
            if step_idx is None or step_idx >= len(steps):
                continue
            step = steps[step_idx]
            required = step.get("any_of_perms") or []
            # If no workflow at all, fall back to default per-entity perm map
            if not state.get("has_workflow"):
                required = _default_required_perms(et)
            eligible = is_super or any(p in user_perms for p in required) or not required
            if not eligible:
                continue
            out.append({
                "entity_type": et,
                "entity_id": entity.get("id"),
                "doc_no": entity.get("doc_no"),
                "label": _ENTITY_LABEL[et],
                "describe": profile["describe"](entity),
                "link": profile["link"](entity),
                "amount": float(state.get("amount") or _legacy_amount(et, entity) or 0),
                "amount_label": profile["amount_label"],
                "tier_label": (state.get("tier") or {}).get("label"),
                "step_idx": step_idx,
                "step_label": step.get("label") or f"Step {step_idx + 1}",
                "status": entity.get("status"),
                "outlet_id": entity.get("outlet_id"),
                "secondary_id": entity.get(profile["secondary"]),
                "created_at": entity.get("created_at"),
                "submitted_at": entity.get("submitted_at"),
                "executed_steps": state.get("executed_steps") or [],
                "is_legacy": not state.get("has_workflow"),
            })
    out.sort(key=lambda x: (x.get("submitted_at") or x.get("created_at") or ""), reverse=True)
    return out


_ENTITY_LABEL = {
    "purchase_request": "Purchase Request",
    "purchase_order": "Purchase Order",
    "stock_adjustment": "Stock Adjustment",
    "employee_advance": "Employee Advance",
}


def _default_required_perms(entity_type: str) -> list[str]:
    return {
        "purchase_request": ["procurement.pr.approve"],
        "purchase_order":   ["procurement.po.approve", "procurement.po.send"],
        "stock_adjustment": ["inventory.adjustment.approve"],
        "employee_advance": ["hr.advance.approve"],
    }.get(entity_type, [])


def _legacy_amount(entity_type: str, entity: dict) -> float:
    if entity_type == "purchase_request":
        return sum(
            float(ln.get("qty", 0) or 0) * float(ln.get("est_cost", 0) or 0)
            for ln in (entity.get("lines") or [])
        )
    if entity_type == "purchase_order":
        return float(entity.get("grand_total", 0) or 0)
    if entity_type == "stock_adjustment":
        return abs(float(entity.get("total_value", 0) or 0))
    if entity_type == "employee_advance":
        return float(entity.get("principal", 0) or 0)
    return 0.0


@router.get("/queue")
async def my_queue(
    entity_type: Optional[str] = Query(default=None),
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=200),
    user: dict = Depends(current_user),
):
    types = [entity_type] if entity_type else None
    items = await _build_queue_for_user(user, entity_types=types)
    total = len(items)
    skip = (page - 1) * per_page
    return ok_envelope(items[skip:skip + per_page], {
        "page": page, "per_page": per_page, "total": total,
    })


@router.get("/counts")
async def my_counts(user: dict = Depends(current_user)):
    items = await _build_queue_for_user(user)
    counts: dict[str, int] = {k: 0 for k in ENTITY_QUERY_PROFILES.keys()}
    for x in items:
        counts[x["entity_type"]] = counts.get(x["entity_type"], 0) + 1
    return ok_envelope({
        "total": len(items),
        "by_entity": counts,
    })


@router.post("/quick-action")
async def quick_action(payload: dict = Body(...),
                        user: dict = Depends(current_user)):
    """Phase 11F \u2014 unified one-click approve/reject for any approval entity.

    Body: { entity_type, entity_id, action: 'approve'|'reject', note?, reason? }
    """
    from core.exceptions import ValidationError
    et = payload.get("entity_type")
    eid = payload.get("entity_id")
    action = payload.get("action")
    if et not in ENTITY_QUERY_PROFILES:
        raise ValidationError(f"entity_type tidak dikenal: {et}", field="entity_type")
    if not eid:
        raise ValidationError("entity_id wajib", field="entity_id")
    if action not in ("approve", "reject"):
        raise ValidationError("action harus 'approve' atau 'reject'", field="action")

    if et == "purchase_request":
        from services import procurement_service
        if action == "approve":
            res = await procurement_service.approve_pr(eid, user=user, note=payload.get("note"))
        else:
            res = await procurement_service.reject_pr(eid, user=user, reason=payload.get("reason", ""))
    elif et == "purchase_order":
        from services import procurement_service
        if action == "approve":
            res = await procurement_service.approve_po(eid, user=user, note=payload.get("note"))
        else:
            res = await procurement_service.reject_po(eid, user=user, reason=payload.get("reason", ""))
    elif et == "stock_adjustment":
        from services import inventory_service
        if action == "approve":
            res = await inventory_service.approve_adjustment(eid, user=user, note=payload.get("note"))
        else:
            res = await inventory_service.reject_adjustment(eid, user=user, reason=payload.get("reason", ""))
    elif et == "employee_advance":
        from services import hr_service
        if action == "approve":
            res = await hr_service.approve_advance(eid, user=user, note=payload.get("note"))
        else:
            res = await hr_service.reject_advance(eid, user=user, reason=payload.get("reason", ""))
    else:
        raise ValidationError(f"Quick action belum support {et}", field="entity_type")
    return ok_envelope({"action": action, "entity_type": et, "entity_id": eid, "result": res})
