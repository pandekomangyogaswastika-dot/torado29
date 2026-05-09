"""Executive services: KPI dashboards, drill-down, sales trend."""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from core.db import get_db, serialize
from services import executive_service as _self_module  # noqa: F401  # for self ref
from services import inventory_service
from services.cache_service import cache_or_compute

logger = logging.getLogger("aurora.executive")


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@cache_or_compute("exec_kpis", ttl_sec=60)
async def kpis(
    *,
    period: Optional[str] = None,
    brand_ids: Optional[list[str]] = None,
    outlet_ids: Optional[list[str]] = None,
) -> dict:
    """Top-level executive KPIs:
    - sales MTD / WTD (validated daily sales grand_total)
    - inventory_value (latest valuation)
    - ap_exposure (sum unpaid GR)
    - opname_pending (in_progress sessions)
    - submitted_validations
    - top outlets by sales MTD

    Phase 9A: optional brand_ids / outlet_ids filters.
    """
    db = get_db()
    today = datetime.now(timezone.utc).date()
    period = period or today.strftime("%Y-%m")
    period_start = f"{period}-01"
    next_period = _next_period(period)
    next_start = f"{next_period}-01"

    # Resolve effective outlet filter (brand_ids → expand to outlet_ids)
    effective_outlets: Optional[list[str]] = None
    if brand_ids:
        outlet_ids_from_brand = []
        async for o in db.outlets.find({"brand_id": {"$in": brand_ids}, "deleted_at": None}):
            outlet_ids_from_brand.append(o["id"])
        if outlet_ids:
            effective_outlets = [o for o in outlet_ids if o in outlet_ids_from_brand]
        else:
            effective_outlets = outlet_ids_from_brand
    elif outlet_ids:
        effective_outlets = outlet_ids

    # Sales MTD (validated)
    sales_match: dict = {
        "deleted_at": None,
        "status": "validated",
        "sales_date": {"$gte": period_start, "$lt": next_start},
    }
    if effective_outlets is not None:
        sales_match["outlet_id"] = {"$in": effective_outlets}

    pipeline = [
        {"$match": sales_match},
        {"$group": {
            "_id": "$outlet_id",
            "total": {"$sum": {"$ifNull": ["$grand_total", 0]}},
            "trx": {"$sum": {"$ifNull": ["$transaction_count", 0]}},
            "days": {"$sum": 1},
        }},
        {"$sort": {"total": -1}},
    ]
    by_outlet: list[dict] = []
    async for d in db.daily_sales.aggregate(pipeline):
        by_outlet.append({
            "outlet_id": d["_id"],
            "total": round(d["total"], 2),
            "trx": d["trx"], "days": d["days"],
        })
    sales_mtd = sum(r["total"] for r in by_outlet)

    # Sales WTD (Mon–today)
    weekday = today.weekday()  # 0=Mon
    week_start = (today - timedelta(days=weekday)).isoformat()
    week_end = today.isoformat()
    wtd_total = 0.0
    wtd_match: dict = {
        "deleted_at": None, "status": "validated",
        "sales_date": {"$gte": week_start, "$lte": week_end},
    }
    if effective_outlets is not None:
        wtd_match["outlet_id"] = {"$in": effective_outlets}
    async for d in db.daily_sales.aggregate([
        {"$match": wtd_match},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$grand_total", 0]}}}},
    ]):
        wtd_total = float(d["total"])

    # Today
    today_total = 0.0
    today_match: dict = {
        "deleted_at": None, "status": "validated",
        "sales_date": today.isoformat(),
    }
    if effective_outlets is not None:
        today_match["outlet_id"] = {"$in": effective_outlets}
    async for d in db.daily_sales.aggregate([
        {"$match": today_match},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$grand_total", 0]}}}},
    ]):
        today_total = float(d["total"])

    # Inventory value (use shared inventory_service.valuation for correctness)
    if effective_outlets is not None and len(effective_outlets) == 1:
        val = await inventory_service.valuation(outlet_id=effective_outlets[0])
    else:
        val = await inventory_service.valuation()
    inv_value = float(val.get("total_value", 0))
    inv_count = int(val.get("item_count", 0))

    # AP exposure
    gr_filter: dict = {"deleted_at": None}
    if effective_outlets is not None:
        gr_filter["outlet_id"] = {"$in": effective_outlets}
    grs = await db.goods_receipts.find(gr_filter).to_list(10000)
    ap_total = sum(float(g.get("grand_total", 0)) for g in grs
                   if not g.get("paid_at") and g.get("payment_status") != "paid")

    # Pending sales validation
    pv_filter: dict = {"deleted_at": None, "status": "submitted"}
    if effective_outlets is not None:
        pv_filter["outlet_id"] = {"$in": effective_outlets}
    pending_validations = await db.daily_sales.count_documents(pv_filter)

    # Opname pending
    op_filter: dict = {"deleted_at": None, "status": "in_progress"}
    if effective_outlets is not None:
        op_filter["outlet_id"] = {"$in": effective_outlets}
    opname_pending = await db.opname_sessions.count_documents(op_filter)

    # Outlet name resolve
    outlets_by_id = {}
    async for o in db.outlets.find({}):
        outlets_by_id[o["id"]] = o.get("name", o["id"])
    for r in by_outlet:
        r["outlet_name"] = outlets_by_id.get(r["outlet_id"], r["outlet_id"])

    return {
        "period": period,
        "today_iso": today.isoformat(),
        "week_start": week_start,
        "sales_today": round(today_total, 2),
        "sales_wtd": round(wtd_total, 2),
        "sales_mtd": round(sales_mtd, 2),
        "top_outlets": by_outlet[:5],
        "inventory_value": round(inv_value, 2),
        "inventory_item_count": inv_count,
        "ap_exposure": round(ap_total, 2),
        "pending_validations": pending_validations,
        "opname_pending": opname_pending,
    }


@cache_or_compute("exec_sales_trend", ttl_sec=60)
async def sales_trend(
    *,
    days: int = 30,
    dim_outlet: Optional[str] = None,
    brand_ids: Optional[list[str]] = None,
    outlet_ids: Optional[list[str]] = None,
) -> dict:
    """Daily sales trend, last `days` days. Returns {dates:[], totals:[]}.

    Phase 9A: optional brand_ids / outlet_ids multi-select filters.
    """
    db = get_db()
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days - 1)
    match: dict = {
        "deleted_at": None,
        "status": "validated",
        "sales_date": {"$gte": start.isoformat(), "$lte": today.isoformat()},
    }
    # Resolve filters: dim_outlet (legacy single) > outlet_ids > brand_ids
    if dim_outlet:
        match["outlet_id"] = dim_outlet
    elif outlet_ids:
        match["outlet_id"] = {"$in": outlet_ids}
    elif brand_ids:
        # Expand brands to outlets
        outlet_ids_from_brand = []
        async for o in db.outlets.find({"brand_id": {"$in": brand_ids}, "deleted_at": None}):
            outlet_ids_from_brand.append(o["id"])
        if outlet_ids_from_brand:
            match["outlet_id"] = {"$in": outlet_ids_from_brand}
        else:
            # No outlet for these brands → empty
            return {
                "days": days,
                "start": start.isoformat(),
                "end": today.isoformat(),
                "series": [{"date": (start + timedelta(days=i)).isoformat(), "total": 0.0, "trx": 0}
                           for i in range(days)],
                "total": 0.0,
                "avg_daily": 0.0,
            }
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$sales_date",
            "total": {"$sum": {"$ifNull": ["$grand_total", 0]}},
            "trx": {"$sum": {"$ifNull": ["$transaction_count", 0]}},
        }},
        {"$sort": {"_id": 1}},
    ]
    by_date = {}
    async for d in db.daily_sales.aggregate(pipeline):
        by_date[d["_id"]] = {"total": round(float(d["total"]), 2), "trx": int(d["trx"] or 0)}
    series = []
    cursor_date = start
    while cursor_date <= today:
        iso = cursor_date.isoformat()
        rec = by_date.get(iso, {"total": 0.0, "trx": 0})
        series.append({"date": iso, "total": rec["total"], "trx": rec["trx"]})
        cursor_date += timedelta(days=1)
    total = sum(s["total"] for s in series)
    avg = total / len(series) if series else 0
    return {
        "days": days,
        "start": start.isoformat(),
        "end": today.isoformat(),
        "series": series,
        "total": round(total, 2),
        "avg_daily": round(avg, 2),
    }


def _next_period(period: str) -> str:
    y, m = [int(x) for x in period.split("-")]
    m += 1
    if m > 12:
        m = 1
        y += 1
    return f"{y:04d}-{m:02d}"
