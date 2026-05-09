"""/api/executive router — KPIs, trends, drill-down hooks (Phase 9A polish)."""
from typing import Optional
from fastapi import APIRouter, Body, Depends, Query

from core.exceptions import ok_envelope
from core.security import current_user, require_perm
from services import executive_service, ai_insights_service, executive_drilldown_service, profit_walk_service

router = APIRouter(prefix="/api/executive", tags=["executive"])


def _split_csv(v: Optional[str]) -> Optional[list[str]]:
    if not v:
        return None
    parts = [x.strip() for x in v.split(",") if x.strip()]
    return parts or None


@router.get("/kpis")
async def kpis(
    period: Optional[str] = None,
    brand_ids: Optional[str] = Query(None, description="Comma-separated brand ids"),
    outlet_ids: Optional[str] = Query(None, description="Comma-separated outlet ids"),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_service.kpis(
        period=period,
        brand_ids=_split_csv(brand_ids),
        outlet_ids=_split_csv(outlet_ids),
    ))


@router.get("/sales-trend")
async def sales_trend(
    days: int = Query(30, ge=1, le=180),
    outlet_id: Optional[str] = None,
    brand_ids: Optional[str] = Query(None, description="Comma-separated brand ids"),
    outlet_ids: Optional[str] = Query(None, description="Comma-separated outlet ids"),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_service.sales_trend(
        days=days,
        dim_outlet=outlet_id,
        brand_ids=_split_csv(brand_ids),
        outlet_ids=_split_csv(outlet_ids),
    ))


@router.get("/insights")
async def insights(
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await ai_insights_service.insights_pack())


@router.post("/qa")
async def conversational_qa(
    payload: dict = Body(...),
    user: dict = Depends(require_perm("ai.chat.use")),
):
    return ok_envelope(await ai_insights_service.conversational_qa(
        payload.get("question", ""), user=user))


# ====================== Phase 9A — Drilldown & widgets ======================

@router.get("/brand-mix")
async def brand_mix(
    period: Optional[str] = None,
    brand_ids: Optional[str] = Query(None, description="Comma-separated brand ids"),
    outlet_ids: Optional[str] = Query(None, description="Comma-separated outlet ids"),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_drilldown_service.brand_mix(
        period=period,
        brand_ids=_split_csv(brand_ids),
        outlet_ids=_split_csv(outlet_ids),
    ))


@router.get("/ap-aging-summary")
async def ap_aging_summary(
    as_of: Optional[str] = Query(None, description="YYYY-MM-DD"),
    top_n: int = Query(5, ge=1, le=20),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_drilldown_service.ap_aging_summary(
        as_of=as_of, top_n=top_n,
    ))


@router.get("/brand/{brand_id}/drilldown")
async def brand_drilldown(
    brand_id: str,
    period: Optional[str] = None,
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_drilldown_service.brand_drilldown(
        brand_id=brand_id, period=period,
    ))


@router.get("/outlet/{outlet_id}/drilldown")
async def outlet_drilldown(
    outlet_id: str,
    period: Optional[str] = None,
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await executive_drilldown_service.outlet_drilldown(
        outlet_id=outlet_id, period=period,
    ))


@router.get("/profit-walk")
async def profit_walk(
    period_kind: str = Query("mtd"),
    compare_kind: Optional[str] = Query("lmtd"),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    return ok_envelope(await profit_walk_service.compute_profit_walk(
        period_kind=period_kind, compare_kind=compare_kind,
    ))


@router.get("/period-compare")
async def period_compare(
    metrics: str = Query("revenue,gross_profit,net_profit"),
    period_kinds: str = Query("mtd,lmtd,yoy"),
    user: dict = Depends(require_perm("executive.dashboard.read")),
):
    metric_list = [m.strip() for m in metrics.split(",") if m.strip()]
    period_list = [p.strip() for p in period_kinds.split(",") if p.strip()]
    return ok_envelope(await profit_walk_service.compute_period_compare(
        metrics=metric_list, period_kinds=period_list,
    ))
