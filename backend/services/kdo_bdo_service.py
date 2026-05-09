"""KDO/BDO/FDO Service — Phase 8B + Smart Procurement.

Thin wrapper around `procurement_service.create_pr` that:
- Enforces source = 'kdo', 'bdo', or 'fdo'
- Enforces outlet_id is in the user's scope
- Provides helpers: list_kdo_bdo (filtered to source), favorite items per outlet.
- New items not in market list are auto-created as pending_review.

Favorites are computed dynamically from the last 30 days of KDO/BDO/FDO submissions
for the outlet (most-frequent items, latest unit cost, latest unit) so that
repeat-orders can be one-tap on the mobile form.

FDO = Floor Daily Order (for floor/service staff).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from core.db import get_db, serialize
from core.exceptions import ForbiddenError, ValidationError
from services import procurement_service


async def list_kdo_bdo(
    *, kind: str, outlet_ids: list[str],
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1, per_page: int = 20,
):
    db = get_db()
    if kind not in ("kdo", "bdo", "fdo"):
        raise ValidationError("kind harus kdo, bdo, atau fdo")
    q: dict = {"deleted_at": None, "source": kind}
    if outlet_ids:
        q["outlet_id"] = {"$in": outlet_ids}
    if status:
        q["status"] = status
    if date_from:
        q.setdefault("request_date", {})["$gte"] = date_from
    if date_to:
        q.setdefault("request_date", {})["$lte"] = date_to
    skip = max(0, (page - 1) * per_page)
    items = await db.purchase_requests.find(q).sort([("request_date", -1), ("created_at", -1)]).skip(skip).limit(per_page).to_list(per_page)
    total = await db.purchase_requests.count_documents(q)
    return [serialize(d) for d in items], {"page": page, "per_page": per_page, "total": total}


async def create(payload: dict, *, kind: str, user: dict) -> dict:
    if kind not in ("kdo", "bdo", "fdo"):
        raise ValidationError("kind harus kdo, bdo, atau fdo")
    outlet_id = payload.get("outlet_id")
    if not outlet_id:
        raise ValidationError("outlet_id wajib", field="outlet_id")
    perms = await _user_perms(user)
    if outlet_id not in (user.get("outlet_ids") or []) and "*" not in perms:
        raise ForbiddenError("Outlet bukan dalam scope Anda")

    # Auto-create items not in market list as pending_review
    lines = payload.get("lines", [])
    enriched_lines = await _enrich_lines_with_market_list(lines, user=user)

    enriched = {**payload, "source": kind, "lines": enriched_lines}
    return await procurement_service.create_pr(enriched, user=user)


async def _enrich_lines_with_market_list(lines: list[dict], *, user: dict) -> list[dict]:
    """For each line without item_id, try to resolve from items master.
    If not found, auto-create as pending_review in market list."""
    import uuid as _uuid
    from datetime import datetime as _dt, timezone as _tz
    db = get_db()
    enriched = []
    for ln in lines:
        item_id = ln.get("item_id")
        name = (ln.get("name") or ln.get("item_name") or "").strip()
        if item_id:
            # Already has item_id — check if item exists
            item = await db.items.find_one({"id": item_id, "deleted_at": None})
            if item:
                enriched.append(ln)
                continue
        if not name:
            enriched.append(ln)
            continue
        # Try to find by name (case insensitive)
        item = await db.items.find_one({
            "name": {"$regex": f"^{name}$", "$options": "i"},
            "deleted_at": None,
        })
        if item:
            enriched.append({**ln, "item_id": item["id"], "name": item["name"]})
        else:
            # Auto-create new item as pending_review
            new_item = {
                "id": str(_uuid.uuid4()),
                "code": f"NEW-{str(_uuid.uuid4())[:8].upper()}",
                "name": name,
                "unit_default": ln.get("unit", "pcs"),
                "category_id": None,
                "ml_status": "pending_review",
                "created_from": "kdo_bdo_fdo",
                "active": True,
                "conversion_units": [],
                "brand_availability": [],
                "is_direct_purchase": False,
                "created_at": _dt.now(_tz.utc).isoformat(),
                "updated_at": _dt.now(_tz.utc).isoformat(),
                "deleted_at": None,
                "created_by": user["id"],
            }
            await db.items.insert_one(new_item)
            enriched.append({**ln, "item_id": new_item["id"], "name": name})
    return enriched


async def favorites(*, outlet_id: str, kind: str, limit: int = 12) -> list[dict]:
    """Compute the most-frequent items used in this outlet's KDO/BDO/FDO PRs in the last 30 days."""
    if kind not in ("kdo", "bdo", "fdo"):
        raise ValidationError("kind harus kdo, bdo, atau fdo")
    db = get_db()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    cursor = db.purchase_requests.find({
        "outlet_id": outlet_id, "source": kind, "deleted_at": None,
        "request_date": {"$gte": cutoff},
    }).sort("request_date", -1).limit(200)

    counts: dict[str, dict] = {}
    async for pr in cursor:
        for ln in pr.get("lines") or []:
            key = ln.get("item_id") or (ln.get("name") or ln.get("item_name") or "").strip().lower()
            if not key:
                continue
            entry = counts.setdefault(key, {
                "key": key,
                "item_id": ln.get("item_id"),
                "name": ln.get("name") or ln.get("item_name") or "",
                "unit": ln.get("unit") or "pcs",
                "count": 0,
                "last_qty": float(ln.get("qty", 0) or 0),
                "last_request_date": pr.get("request_date"),
            })
            entry["count"] += 1
            # keep the most recent qty
            if pr.get("request_date") and pr.get("request_date") >= entry.get("last_request_date", ""):
                entry["last_qty"] = float(ln.get("qty", 0) or entry["last_qty"])
                entry["last_request_date"] = pr.get("request_date")
                entry["unit"] = ln.get("unit") or entry["unit"]
    items = sorted(counts.values(), key=lambda e: (-e["count"], e["name"]))[:limit]
    return items


async def _user_perms(user: dict) -> set:
    from core.security import get_user_permissions
    return await get_user_permissions(user)
