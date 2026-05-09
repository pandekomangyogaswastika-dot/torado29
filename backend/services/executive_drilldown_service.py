"""Executive drilldown services — brand-mix, ap-aging summary, brand & outlet drilldowns.

Phase 9A — Executive Polish.
Designed to be fast (single-pass aggregation) and tolerant to missing dimension data.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from core.db import get_db
from core.exceptions import NotFoundError, ValidationError
from services import inventory_service, finance_service

logger = logging.getLogger("aurora.exec_drilldown")


# ====================== Helpers ======================

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _period_to_range(period: str) -> tuple[str, str]:
    """Convert 'YYYY-MM' → (start_iso, next_start_iso) inclusive/exclusive."""
    try:
        y, m = period.split("-")
        y_i, m_i = int(y), int(m)
    except Exception:
        raise ValidationError("period harus 'YYYY-MM'")
    start = f"{y_i:04d}-{m_i:02d}-01"
    if m_i == 12:
        next_y, next_m = y_i + 1, 1
    else:
        next_y, next_m = y_i, m_i + 1
    next_start = f"{next_y:04d}-{next_m:02d}-01"
    return start, next_start


def _resolve_period(period: Optional[str]) -> str:
    if not period:
        return datetime.now(timezone.utc).strftime("%Y-%m")
    return period


# ====================== Brand Mix (donut) ======================

async def brand_mix(
    *,
    period: Optional[str] = None,
    brand_ids: Optional[list[str]] = None,
    outlet_ids: Optional[list[str]] = None,
) -> dict:
    """Revenue % per brand for the given period (validated daily sales)."""
    db = get_db()
    period = _resolve_period(period)
    period_start, next_start = _period_to_range(period)

    # Load brand & outlet maps
    brands_by_id: dict[str, dict] = {}
    async for b in db.brands.find({"deleted_at": None}):
        brands_by_id[b["id"]] = {
            "id": b["id"],
            "name": b.get("name", b["id"]),
            "code": b.get("code", ""),
            "color": b.get("color"),
        }
    outlets_by_id: dict[str, dict] = {}
    async for o in db.outlets.find({"deleted_at": None}):
        outlets_by_id[o["id"]] = {
            "id": o["id"],
            "name": o.get("name", o["id"]),
            "brand_id": o.get("brand_id"),
        }

    match: dict = {
        "deleted_at": None,
        "status": "validated",
        "sales_date": {"$gte": period_start, "$lt": next_start},
    }
    if outlet_ids:
        match["outlet_id"] = {"$in": outlet_ids}
    if brand_ids:
        match["brand_id"] = {"$in": brand_ids}

    by_brand: dict[str, dict] = {}
    grand_total = 0.0
    async for ds in db.daily_sales.find(match):
        outlet = outlets_by_id.get(ds.get("outlet_id"))
        brand_id = (outlet or {}).get("brand_id") or ds.get("brand_id")
        if not brand_id:
            continue
        if brand_ids and brand_id not in brand_ids:
            continue
        amount = float(ds.get("grand_total", 0) or 0)
        if amount <= 0:
            continue
        b = brands_by_id.get(brand_id, {"id": brand_id, "name": brand_id, "code": ""})
        row = by_brand.setdefault(brand_id, {
            "brand_id": brand_id,
            "brand_name": b.get("name", brand_id),
            "code": b.get("code", ""),
            "color": b.get("color"),
            "total": 0.0,
            "trx": 0,
            "outlets": set(),
        })
        row["total"] += amount
        row["trx"] += int(ds.get("transaction_count", 0) or 0)
        row["outlets"].add(ds.get("outlet_id"))
        grand_total += amount

    result_rows = []
    for r in sorted(by_brand.values(), key=lambda x: x["total"], reverse=True):
        result_rows.append({
            "brand_id": r["brand_id"],
            "brand_name": r["brand_name"],
            "code": r["code"],
            "color": r.get("color"),
            "total": round(r["total"], 2),
            "trx": r["trx"],
            "outlet_count": len(r["outlets"]),
            "share_pct": round((r["total"] / grand_total) * 100, 2) if grand_total else 0.0,
        })

    return {
        "period": period,
        "grand_total": round(grand_total, 2),
        "rows": result_rows,
    }


# ====================== AP Aging Summary (stacked widget) ======================

async def ap_aging_summary(
    *,
    as_of: Optional[str] = None,
    top_n: int = 5,
) -> dict:
    """Lighter version of finance.ap_aging — buckets totals + top-N vendors.

    Returns:
      {
        as_of: "YYYY-MM-DD",
        buckets: { current, d_30, d_60, d_90, d_90p },
        grand_total,
        top_vendors: [...],
        bucket_pct: { ... }   (ratio per bucket for stacked bar)
      }
    """
    aging = await finance_service.ap_aging(as_of=as_of)
    buckets = aging.get("buckets") or {}
    grand_total = float(aging.get("grand_total", 0) or 0)
    rows = aging.get("rows") or []
    top = sorted(rows, key=lambda r: r.get("total", 0), reverse=True)[:top_n]
    top_payload = [{
        "vendor_id": r["vendor_id"],
        "vendor_name": r["vendor_name"],
        "total": r["total"],
        "current": r.get("current", 0),
        "d_30": r.get("d_30", 0),
        "d_60": r.get("d_60", 0),
        "d_90": r.get("d_90", 0),
        "d_90p": r.get("d_90p", 0),
        "items": len(r.get("items", [])),
    } for r in top]
    bucket_pct: dict[str, float] = {}
    for k, v in buckets.items():
        bucket_pct[k] = round((float(v) / grand_total) * 100, 2) if grand_total else 0.0
    return {
        "as_of": aging.get("as_of"),
        "buckets": buckets,
        "bucket_pct": bucket_pct,
        "grand_total": grand_total,
        "vendor_count": len(rows),
        "top_vendors": top_payload,
    }


# ====================== Brand Drilldown ======================

async def brand_drilldown(
    *,
    brand_id: str,
    period: Optional[str] = None,
) -> dict:
    """Brand-level drilldown.

    Returns:
      header (brand info)
      kpis (revenue MTD, GP%, outlet count, transaction count)
      outlets [{outlet_id, outlet_name, total, trx, days, share_pct}]
      cost_structure {revenue, cogs, opex, service, tax, net}
      trends {dates: [...], series: [{outlet_id, outlet_name, daily: [...]}]}
    """
    db = get_db()
    period = _resolve_period(period)
    period_start, next_start = _period_to_range(period)

    # Brand lookup
    brand = await db.brands.find_one({"id": brand_id, "deleted_at": None})
    if not brand:
        raise NotFoundError(f"Brand {brand_id} tidak ditemukan")
    brand_info = {
        "id": brand["id"],
        "name": brand.get("name", brand["id"]),
        "code": brand.get("code", ""),
        "color": brand.get("color"),
        "logo_url": brand.get("logo_url"),
    }

    # Brand outlets
    outlet_docs: list[dict] = []
    async for o in db.outlets.find({"brand_id": brand_id, "deleted_at": None}):
        outlet_docs.append(o)
    outlets_by_id = {o["id"]: o for o in outlet_docs}
    outlet_ids = list(outlets_by_id.keys())

    if not outlet_ids:
        return {
            "brand": brand_info,
            "period": period,
            "kpis": {"revenue_mtd": 0, "trx": 0, "outlet_count": 0, "active_outlets": 0,
                     "cogs": 0, "gp_pct": 0, "net": 0},
            "outlets": [],
            "cost_structure": {"revenue": 0, "cogs": 0, "opex": 0, "service": 0, "tax": 0, "net": 0},
            "trends": {"dates": [], "series": []},
        }

    # Daily sales aggregation (MTD)
    by_outlet: dict[str, dict] = {}
    revenue_mtd = 0.0
    trx_total = 0
    service_total = 0.0
    tax_total = 0.0
    async for ds in db.daily_sales.find({
        "deleted_at": None,
        "status": "validated",
        "outlet_id": {"$in": outlet_ids},
        "sales_date": {"$gte": period_start, "$lt": next_start},
    }):
        oid = ds.get("outlet_id")
        amount = float(ds.get("grand_total", 0) or 0)
        if amount <= 0:
            continue
        revenue_mtd += amount
        trx_total += int(ds.get("transaction_count", 0) or 0)
        service_total += float(ds.get("service_charge", 0) or 0)
        tax_total += float(ds.get("tax_amount", 0) or 0)
        row = by_outlet.setdefault(oid, {
            "outlet_id": oid,
            "outlet_name": outlets_by_id[oid].get("name", oid),
            "code": outlets_by_id[oid].get("code", ""),
            "total": 0.0,
            "trx": 0,
            "days": 0,
        })
        row["total"] += amount
        row["trx"] += int(ds.get("transaction_count", 0) or 0)
        row["days"] += 1

    outlets_list = []
    for r in sorted(by_outlet.values(), key=lambda x: x["total"], reverse=True):
        outlets_list.append({
            **r,
            "total": round(r["total"], 2),
            "share_pct": round((r["total"] / revenue_mtd) * 100, 2) if revenue_mtd else 0.0,
        })

    # COGS (estimate from goods_receipts for these outlets in period)
    cogs_total = 0.0
    async for gr in db.goods_receipts.find({
        "deleted_at": None,
        "outlet_id": {"$in": outlet_ids},
        "receive_date": {"$gte": period_start, "$lt": next_start},
    }):
        cogs_total += float(gr.get("grand_total", 0) or 0)

    # OpEx — petty cash + urgent purchase posted to expense (period)
    opex_total = 0.0
    async for pc in db.petty_cash_transactions.find({
        "deleted_at": None,
        "outlet_id": {"$in": outlet_ids},
        "txn_date": {"$gte": period_start, "$lt": next_start},
        "status": {"$in": ["approved", "posted", "submitted"]},
    }):
        amt = float(pc.get("amount", 0) or 0)
        if pc.get("type") in ("purchase", "expense") or pc.get("type") is None:
            opex_total += amt
    async for up in db.urgent_purchases.find({
        "deleted_at": None,
        "outlet_id": {"$in": outlet_ids},
        "purchase_date": {"$gte": period_start, "$lt": next_start},
        "status": {"$in": ["approved", "posted"]},
    }):
        opex_total += float(up.get("total", 0) or 0)

    net = revenue_mtd - cogs_total - opex_total
    gp_pct = ((revenue_mtd - cogs_total) / revenue_mtd * 100) if revenue_mtd else 0

    cost_structure = {
        "revenue": round(revenue_mtd, 2),
        "cogs": round(cogs_total, 2),
        "opex": round(opex_total, 2),
        "service": round(service_total, 2),
        "tax": round(tax_total, 2),
        "net": round(net, 2),
    }

    # Trends — last 30 days per outlet
    today = datetime.now(timezone.utc).date()
    start_30 = today - timedelta(days=29)
    dates: list[str] = []
    cur = start_30
    while cur <= today:
        dates.append(cur.isoformat())
        cur += timedelta(days=1)

    series_by_outlet: dict[str, dict[str, float]] = {}
    async for ds in db.daily_sales.find({
        "deleted_at": None,
        "status": "validated",
        "outlet_id": {"$in": outlet_ids},
        "sales_date": {"$gte": start_30.isoformat(), "$lte": today.isoformat()},
    }):
        oid = ds.get("outlet_id")
        d = ds.get("sales_date")
        amt = float(ds.get("grand_total", 0) or 0)
        if not (oid and d):
            continue
        bucket = series_by_outlet.setdefault(oid, {})
        bucket[d] = bucket.get(d, 0.0) + amt

    trend_series = []
    for oid, name_map in [(o["id"], o.get("name", o["id"])) for o in outlet_docs]:
        daily = [round(series_by_outlet.get(oid, {}).get(d, 0.0), 2) for d in dates]
        trend_series.append({
            "outlet_id": oid,
            "outlet_name": name_map,
            "daily": daily,
            "total": round(sum(daily), 2),
        })

    return {
        "brand": brand_info,
        "period": period,
        "kpis": {
            "revenue_mtd": round(revenue_mtd, 2),
            "trx": trx_total,
            "outlet_count": len(outlet_docs),
            "active_outlets": len([o for o in by_outlet.values() if o["total"] > 0]),
            "cogs": round(cogs_total, 2),
            "gp_pct": round(gp_pct, 2),
            "net": round(net, 2),
        },
        "outlets": outlets_list,
        "cost_structure": cost_structure,
        "trends": {"dates": dates, "series": trend_series},
    }


# ====================== Outlet Drilldown ======================

async def outlet_drilldown(
    *,
    outlet_id: str,
    period: Optional[str] = None,
) -> dict:
    """Outlet-level drilldown — daily-ops, P&L, inventory, staff."""
    db = get_db()
    period = _resolve_period(period)
    period_start, next_start = _period_to_range(period)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    outlet = await db.outlets.find_one({"id": outlet_id, "deleted_at": None})
    if not outlet:
        raise NotFoundError(f"Outlet {outlet_id} tidak ditemukan")

    brand = None
    if outlet.get("brand_id"):
        brand = await db.brands.find_one({"id": outlet["brand_id"], "deleted_at": None})

    header = {
        "outlet_id": outlet["id"],
        "outlet_name": outlet.get("name", outlet["id"]),
        "outlet_code": outlet.get("code", ""),
        "brand_id": outlet.get("brand_id"),
        "brand_name": (brand or {}).get("name") if brand else None,
        "address": outlet.get("address"),
        "open_time": outlet.get("open_time"),
        "close_time": outlet.get("close_time"),
    }

    # ----- Daily Ops -----
    today_sales_doc = await db.daily_sales.find_one({
        "outlet_id": outlet_id,
        "sales_date": today_str,
        "deleted_at": None,
    })
    pc_balance = 0.0
    pc_pending = 0
    async for pc in db.petty_cash_transactions.find({
        "outlet_id": outlet_id, "deleted_at": None,
    }).sort([("txn_date", -1)]).limit(200):
        if pc.get("status") == "draft":
            pc_pending += 1
        if "balance_after" in pc and pc.get("balance_after") is not None:
            pc_balance = float(pc.get("balance_after", 0))
            break  # latest

    opname_active = await db.opname_sessions.count_documents({
        "outlet_id": outlet_id, "status": "in_progress", "deleted_at": None,
    })
    kdo_pending = await db.purchase_requests.count_documents({
        "outlet_id": outlet_id, "source": "kdo", "status": "draft", "deleted_at": None,
    })
    bdo_pending = await db.purchase_requests.count_documents({
        "outlet_id": outlet_id, "source": "bdo", "status": "draft", "deleted_at": None,
    })

    last_close = await db.daily_close_records.find_one({
        "outlet_id": outlet_id, "deleted_at": None,
    }, sort=[("close_date", -1)])

    daily_ops = {
        "today_sales_status": (today_sales_doc or {}).get("status"),
        "today_grand_total": float((today_sales_doc or {}).get("grand_total", 0) or 0),
        "petty_cash_balance": pc_balance,
        "petty_cash_pending": pc_pending,
        "opname_active": opname_active,
        "kdo_pending": kdo_pending,
        "bdo_pending": bdo_pending,
        "last_close_date": (last_close or {}).get("close_date"),
    }

    # ----- P&L (period) -----
    revenue = 0.0
    trx = 0
    days_count = 0
    service_total = 0.0
    tax_total = 0.0
    async for ds in db.daily_sales.find({
        "outlet_id": outlet_id, "deleted_at": None, "status": "validated",
        "sales_date": {"$gte": period_start, "$lt": next_start},
    }):
        revenue += float(ds.get("grand_total", 0) or 0)
        trx += int(ds.get("transaction_count", 0) or 0)
        days_count += 1
        service_total += float(ds.get("service_charge", 0) or 0)
        tax_total += float(ds.get("tax_amount", 0) or 0)

    cogs = 0.0
    async for gr in db.goods_receipts.find({
        "outlet_id": outlet_id, "deleted_at": None,
        "receive_date": {"$gte": period_start, "$lt": next_start},
    }):
        cogs += float(gr.get("grand_total", 0) or 0)

    pc_expense = 0.0
    async for pc in db.petty_cash_transactions.find({
        "outlet_id": outlet_id, "deleted_at": None,
        "txn_date": {"$gte": period_start, "$lt": next_start},
        "status": {"$in": ["approved", "posted", "submitted"]},
    }):
        if pc.get("type") in ("purchase", "expense") or pc.get("type") is None:
            pc_expense += float(pc.get("amount", 0) or 0)

    up_expense = 0.0
    async for up in db.urgent_purchases.find({
        "outlet_id": outlet_id, "deleted_at": None,
        "purchase_date": {"$gte": period_start, "$lt": next_start},
        "status": {"$in": ["approved", "posted"]},
    }):
        up_expense += float(up.get("total", 0) or 0)

    opex = pc_expense + up_expense
    gross_profit = revenue - cogs
    net = gross_profit - opex
    pl = {
        "revenue": round(revenue, 2),
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gp_pct": round((gross_profit / revenue * 100) if revenue else 0, 2),
        "opex": round(opex, 2),
        "petty_cash_expense": round(pc_expense, 2),
        "urgent_purchase_expense": round(up_expense, 2),
        "service": round(service_total, 2),
        "tax": round(tax_total, 2),
        "net": round(net, 2),
        "net_margin_pct": round((net / revenue * 100) if revenue else 0, 2),
        "transaction_count": trx,
        "days_active": days_count,
        "avg_daily_sales": round((revenue / days_count) if days_count else 0, 2),
    }

    # ----- Inventory Health -----
    val = await inventory_service.valuation(outlet_id=outlet_id)
    inv_value = float(val.get("total_value", 0) or 0)
    inv_count = int(val.get("item_count", 0) or 0)

    # Low stock estimate — items with stock = 0 / very low
    low_stock = 0
    try:
        balances, _ = await inventory_service.stock_balance(outlet_ids=[outlet_id], page=1, per_page=500)
        zero_or_low = [b for b in balances if float(b.get("qty", 0) or 0) <= 0]
        low_stock = len(zero_or_low)
    except Exception:
        pass

    # ----- Staff Performance (best-effort) -----
    employee_count = await db.employees.count_documents({"outlet_id": outlet_id, "deleted_at": None})
    incentive_total = 0.0
    async for inc in db.incentives.find({
        "outlet_id": outlet_id, "period": period, "deleted_at": None,
    }):
        incentive_total += float(inc.get("incentive_amount", 0) or 0)
    service_period = await db.service_charge_periods.find_one({
        "outlet_id": outlet_id, "period": period, "deleted_at": None,
    })

    staff = {
        "employee_count": employee_count,
        "incentive_period_total": round(incentive_total, 2),
        "service_charge_distributed": round(float((service_period or {}).get("distributable_amount", 0) or 0), 2),
        "service_charge_status": (service_period or {}).get("status", "not_calculated"),
    }

    # ----- Sales Trend (30 days) -----
    today = datetime.now(timezone.utc).date()
    start_30 = today - timedelta(days=29)
    dates: list[str] = []
    cur = start_30
    while cur <= today:
        dates.append(cur.isoformat())
        cur += timedelta(days=1)
    series_map: dict[str, float] = {}
    async for ds in db.daily_sales.find({
        "outlet_id": outlet_id, "deleted_at": None, "status": "validated",
        "sales_date": {"$gte": start_30.isoformat(), "$lte": today.isoformat()},
    }):
        d = ds.get("sales_date")
        if d:
            series_map[d] = series_map.get(d, 0.0) + float(ds.get("grand_total", 0) or 0)
    trend_series = [{"date": d, "total": round(series_map.get(d, 0.0), 2)} for d in dates]

    return {
        "header": header,
        "period": period,
        "daily_ops": daily_ops,
        "pl": pl,
        "inventory": {
            "valuation": round(inv_value, 2),
            "item_count": inv_count,
            "low_stock_count": low_stock,
        },
        "staff": staff,
        "trend": trend_series,
    }
