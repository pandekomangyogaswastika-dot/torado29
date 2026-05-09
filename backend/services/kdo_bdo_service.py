"""KDO/BDO Service — Phase 8B.

Thin wrapper around `procurement_service.create_pr` that:
- Enforces source = 'kdo' or 'bdo'
- Enforces outlet_id is in the user's scope
- Provides helpers: list_kdo_bdo (filtered to source), favorite items per outlet.

Favorites are computed dynamically from the last 30 days of KDO/BDO submissions
for the outlet (most-frequent items, latest unit cost, latest unit) so that
repeat-orders can be one-tap on the mobile form.
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
    if kind not in ("kdo", "bdo"):
        raise ValidationError("kind harus kdo atau bdo")
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
    if kind not in ("kdo", "bdo"):
        raise ValidationError("kind harus kdo atau bdo")
    outlet_id = payload.get("outlet_id")
    if not outlet_id:
        raise ValidationError("outlet_id wajib", field="outlet_id")
    perms = await _user_perms(user)
    if outlet_id not in (user.get("outlet_ids") or []) and "*" not in perms:
        raise ForbiddenError("Outlet bukan dalam scope Anda")
    enriched = {**payload, "source": kind}
    return await procurement_service.create_pr(enriched, user=user)


async def favorites(*, outlet_id: str, kind: str, limit: int = 12) -> list[dict]:
    """Compute the most-frequent items used in this outlet's KDO/BDO PRs in the last 30 days."""
    if kind not in ("kdo", "bdo"):
        raise ValidationError("kind harus kdo atau bdo")
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
